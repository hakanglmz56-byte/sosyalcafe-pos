#!/usr/bin/env node
/**
 * Sosyal Cafe - Firebase Admin Script
 * -------------------------------------
 * Bu script, Firebase Authentication'da custom role claim'i (garson / admin) atar.
 * Custom claim, RTDB güvenlik kurallarında "auth.token.role" olarak okunur.
 *
 * KURULUM (bir kez):
 *   1. npm install firebase-admin
 *   2. Firebase Console -> Project settings -> Service accounts ->
 *      "Generate new private key" ile JSON indirin ve bu klasöre
 *      serviceAccountKey.json olarak koyun.
 *
 * KULLANIM:
 *   # Yeni garson kullanıcı oluştur (email + şifre) ve garson rolü ata
 *   node set-claims.js create garson@sosyalcafe.com 123456 garson
 *
 *   # Mevcut bir kullanıcıya rol ata
 *   node set-claims.js claim garson@sosyalcafe.com garson
 *
 *   # Rolü kaldır
 *   node set-claims.js claim admin@sosyalcafe.com admin --revoke
 *
 * NOT: E-posta adresini değiştirdiyseniz veya rolü güncellediyseniz,
 *      kullanıcının yeniden giriş yapması gerekir.
 */

const admin = require('firebase-admin');

// Service account JSON dosyası
const SERVICE_ACCOUNT_FILE = process.env.SERVICE_ACCOUNT_FILE || './serviceAccountKey.json';

if (!require('fs').existsSync(SERVICE_ACCOUNT_FILE)) {
  console.error('❌ Service account dosyası bulunamadı: ' + SERVICE_ACCOUNT_FILE);
  console.error('Firebase Console -> Project settings -> Service accounts -> Generate new private key');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(SERVICE_ACCOUNT_FILE),
});

const [, , command, email, arg2, arg3] = process.argv;

async function createUser(emailAddress, password, role) {
  try {
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(emailAddress);
      console.log(`ℹ️  Kullanıcı zaten var (${userRecord.uid}). Rolü güncelleniyor...`);
    } catch (e) {
      userRecord = await admin.auth().createUser({ email: emailAddress, password: password });
      console.log(`✅ Kullanıcı oluşturuldu (${userRecord.uid}).`);
    }
    await setClaim(userRecord.uid, role);
    console.log(`🎉 ${emailAddress} hesabı "${role}" rolüyle hazır.`);
  } catch (err) {
    console.error('❌ Kullanıcı oluşturma hatası:', err.message);
    process.exit(1);
  }
}

async function setClaim(uid, role) {
  if (!(role === 'garson' || role === 'admin')) {
    console.error('❌ Geçersiz rol. Sadece "garson" veya "admin" kullanın.');
    process.exit(1);
  }
  await admin.auth().setCustomUserClaims(uid, { role });
}

async function getClaim(emailAddress) {
  try {
    const user = await admin.auth().getUserByEmail(emailAddress);
    console.log(`👤 ${emailAddress}`);
    console.log(`   UID      : ${user.uid}`);
    console.log(`   Email    : ${user.email}`);
    console.log(`   Role     : ${JSON.stringify(user.customClaims || {})}`);
    console.log(`   Oluşturma: ${new Date(user.metadata.creationTime).toLocaleString('tr-TR')}`);
    console.log(`   Son Giriş: ${user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleString('tr-TR') : 'Hiç giriş yapmamış'}`);
  } catch (err) {
    console.error('❌ Kullanıcı bulunamadı:', err.message);
    process.exit(1);
  }
}

(async () => {
  if (command === 'create') {
    if (!email || !arg2 || !arg3) {
      console.error('Kullanım: node set-claims.js create <email> <sifre> <garson|admin>');
      process.exit(1);
    }
    await createUser(email, arg2, arg3);
  } else if (command === 'claim') {
    if (!email || !arg2) {
      console.error('Kullanım: node set-claims.js claim <email> <garson|admin>');
      process.exit(1);
    }
    try {
      const user = await admin.auth().getUserByEmail(email);
      await setClaim(user.uid, arg2);
      console.log(`✅ ${email} hesabına "${arg2}" rolü atandı.`);
    } catch (err) {
      console.error('❌ Kullanıcı bulunamadı:', err.message);
      process.exit(1);
    }
  } else if (command === 'get') {
    if (!email) {
      console.error('Kullanım: node set-claims.js get <email>');
      process.exit(1);
    }
    await getClaim(email);
  } else if (command === 'list') {
    const list = await admin.auth().listUsers(100);
    list.users.forEach(u => {
      console.log(`${u.email}  =>  ${JSON.stringify(u.customClaims || {})}`);
    });
  } else {
    console.log(`
Sosyal Cafe - Firebase Admin Script

Komutlar:
  create <email> <sifre> <garson|admin>   Kullanıcı oluştur veya var olana rol ata + şifre set
  claim  <email> <garson|admin>           Mevcut kullanıcıya rol ata
  get    <email>                          Kullanıcının rolünü göster
  list                                   Tüm kullanıcıları listele
`);
  }
  process.exit(0);
})();
