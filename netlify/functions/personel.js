// Sosyal Cafe - Personel Yönetimi Netlify Function
// ------------------------------------------------
// Admin panelinden garson/admin ekleme, silme ve rol değiştirme işlemlerini yapar.
// Firebase Console'a girmeden personel yönetimi sağlar.
//
// KURULUM:
//   Netlify Dashboard -> Environment variables -> Add Variable:
//     Key   : SERVICE_ACCOUNT
//     Value : serviceAccountKey.json dosyasının İÇERİĞİ (tam JSON metni)
//   Ayrıca (opsiyonel):
//     Key   : DATABASE_URL
//     Value : https://cafe-adisyon-2bcf0-default-rtdb.firebaseio.com

const admin = require('firebase-admin');

let initialized = false;
function getApp() {
  if (initialized) return admin.app();
  const saRaw = process.env.SERVICE_ACCOUNT;
  if (!saRaw) {
    throw new Error('SERVICE_ACCOUNT ortam değişkeni tanımlı değil. Netlify Dashboard > Environment variables kurun.');
  }
  let cred;
  try {
    cred = admin.credential.cert(JSON.parse(saRaw));
  } catch (e) {
    throw new Error('SERVICE_ACCOUNT geçersiz JSON: ' + e.message);
  }
  admin.initializeApp({
    credential: cred,
    databaseURL: process.env.DATABASE_URL || 'https://cafe-adisyon-2bcf0-default-rtdb.firebaseio.com',
  });
  initialized = true;
  return admin.app();
}

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const app = getApp();

    // ── GÜVENLİK: Yalnızca "admin" rolüne sahip kullanıcılar işlem yapabilsin ──
    if (!event.headers || !event.headers.authorization) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Yetkisiz erişim. Giriş yapın.' }) };
    }
    const idToken = event.headers.authorization.replace(/^Bearer\s+/i, '');
    let decoded;
    try {
      decoded = await app.auth().verifyIdToken(idToken);
    } catch (e) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Geçersiz oturum.' }) };
    }
    if (decoded.role !== 'admin') {
      return { statusCode: 403, headers, body: JSON.stringify({ error: 'Bu işlem için admin yetkisi gerekli.' }) };
    }

    // GET -> Tüm kullanıcıları listele
    if (event.httpMethod === 'GET') {
      const list = await app.auth().listUsers(1000);
      const users = list.users
        .map((u) => ({
          uid: u.uid,
          email: u.email,
          role: (u.customClaims && u.customClaims.role) || 'yok',
          disabled: !!u.disabled,
          createdAt: u.metadata.creationTime || null,
          lastSignIn: u.metadata.lastSignInTime || null,
        }))
        .sort((a, b) => String(a.email).localeCompare(String(b.email), 'tr'));
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true, users }) };
    }

    // POST -> işlemler
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const action = body.action;

      // 1. Yeni personel ekle (kullanıcı + rol)
      if (action === 'create') {
        const role = body.role === 'admin' ? 'admin' : 'garson';
        if (!body.email || !body.password) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'E-posta ve şifre gerekli.' }) };
        }
        let uid;
        let existing = false;
        try {
          const found = await app.auth().getUserByEmail(body.email);
          uid = found.uid;
          existing = true;
        } catch (e) {
          const created = await app.auth().createUser({ email: body.email, password: body.password });
          uid = created.uid;
        }
        await app.auth().setCustomUserClaims(uid, { role });
        return { statusCode: 200, headers, body: JSON.stringify({ ok: true, uid, email: body.email, role, existing }) };
      }

      // 2. Rol değiştir
      if (action === 'setRole') {
        if (!body.email || !body.role) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'E-posta ve rol gerekli.' }) };
        }
        const role = body.role === 'admin' ? 'admin' : 'garson';
        const user = await app.auth().getUserByEmail(body.email);
        await app.auth().setCustomUserClaims(user.uid, { role });
        return { statusCode: 200, headers, body: JSON.stringify({ ok: true, email: body.email, role }) };
      }

      // 3. Hesabı etkinleştir/devre dışı bırak
      if (action === 'setDisabled') {
        if (!body.email) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'E-posta gerekli.' }) };
        }
        const user = await app.auth().getUserByEmail(body.email);
        await app.auth().updateUser(user.uid, { disabled: !body.disabled });
        return { statusCode: 200, headers, body: JSON.stringify({ ok: true, email: body.email, disabled: !body.disabled }) };
      }

      // 4. Personeli tamamen sil
      if (action === 'delete') {
        if (!body.email) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'E-posta gerekli.' }) };
        }
        const user = await app.auth().getUserByEmail(body.email);
        await app.auth().deleteUser(user.uid);
        return { statusCode: 200, headers, body: JSON.stringify({ ok: true, email: body.email }) };
      }

      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Geçersiz action.' }) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Desteklenmeyen yöntem.' }) };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
