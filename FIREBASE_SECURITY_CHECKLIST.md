# Firebase Güvenlik Kurulum Rehberi (v8.0)

Bu rehber, Sosyal Cafe POS'un **Firebase Authentication + Custom Role Claim** tabanlı
güvenli sürümünün canlıya alınması için gereken adımları içerir.

---

## 🔐 Aşama 1: Firebase Authentication'ı Etkinleştir

1. [Firebase Console](https://console.firebase.google.com) → projeni seç → **Authentication**.
2. **Sign-in method** sekmesine git.
3. **Email/Password** sağlayıcısını **Enable** et.
4. **Anonymous** sağlayıcısını **Enable** et (QR menü için gerekli).

---

## 👤 Aşama 2: Kullanıcıları Oluştur ve Rol (Claim) Ata

### 2a. Kullanıcıları oluştur

**Yol A — Firebase Console (kolay):**
- Authentication → **Users** → **Add user**.
- Garson için: `garson@sosyalcafe.com` / ilk şifre
- Admin için: `admin@sosyalcafe.com` / güçlü bir şifre

**Yol B — Admin Script (önerilen, otomatik):**
```bash
# Bağımlılıkları kur (bir kez)
npm install

# Service account JSON'u Firebase Console -> Project settings -> Service accounts
# -> Generate new private key -> indir ve serviceAccountKey.json olarak kaydet.

# Garson oluştur (kullanıcı varsa sadece rol atar)
node scripts/set-claims.js create garson@sosyalcafe.com "sifren" garson

# Admin oluştur
node scripts/set-claims.js create admin@sosyalcafe.com "sifren" admin
```

### 2b. Rol (custom claim) ata

Firebase Console üzerinden claim **atanamaz**; aşağıdaki script **şarttır**:

```bash
node scripts/set-claims.js claim garson@sosyalcafe.com garson
node scripts/set-claims.js claim admin@sosyalcafe.com admin
```

> ⚠️ **ÖNEMLİ:** Claim atandıktan sonra kullanıcının **çıkış yapıp yeniden giriş yapması** gerekir.
> ID token claim'i ancak yeni girişte tazelenir.

Rol kontrolü:
```bash
node scripts/set-claims.js get garson@sosyalcafe.com
```

---

## 🛡 Aşama 3: Realtime Database Kurallarını Yayınla

1. Firebase Console → **Realtime Database** → **Rules**.
2. Şu dosyanın içeriğini kopyala: **`firebase-rtdb-rules-secure.json`**.
3. Rules editörüne yapıştır ve **Publish** butonuna bas.

Bu kurallar:
- `menu_v7` / `stock_v7` **okuma**: oturum açan herkese açık (QR menü dahil) ✅
- `menu_v7` **yazma**: yalnızca `role: admin` ✅
- `masalar_v7`, `cari_v7`, `reports_v7`, `ikram_v7`, `iade_v7`: rol bazlı ✅
- Kök okuma/yazma kapalı ✅

---

## 🚀 Aşama 4: Test

### QR Menü (public)
1. Tarayıcıda `qr-menu.html` aç.
2. Menü yüklenmeli (anonim oturum otomatik açılır).

### Garson POS
1. `COFFE.html` aç → garson e-postası + şifre ile gir.
2. Masa seçin, ürün ekleyin → çalışmalı.
3. Fiş, ödeme, cari girişini test edin.

### Patron (Admin) Paneli
1. `COFFE.html` aç → admin e-postası + şifre ile gir.
2. Raporlar, menü yönetimi, stok, masa düzeni test edin.

---

## ✅ Başarılı güvenli geçiş ölçütü

- PIN girişi artık **YOK** (yalnızca e-posta + şifre).
- Admin, garson e-postası yerine **başka** bir e-posta ile giriş yapamaz.
- QR menü, POS verilerine **yazamaz** (sadece menü/stok okuyabilir).
- Cari işlemleri artık rol bazlı ve güvenli.

---

## 🧹 Geçici kurallar notu

`firebase-rtdb-rules-compat-temporary.json` yalnızca **acil kurtarma** içindir.
Auth kurulduktan sonra **kesinlikle kullanılmamalıdır**, çünkü tüm yollarda
yazma/okuma açıktır ve cari/müşteri verilerini dışarıya sızdırır.
