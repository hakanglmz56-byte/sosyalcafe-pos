# Sosyal Cafe POS

Bu proje Netlify üzerinde barındırılıyor. Kalıcı güncellemeler için en sağlam yol:

1. **Git repo kullan**
   - Yerel proje zaten `git init` ile başlatıldı.
   - `COFFE.html`, `qr-menu.html` ve `netlify.toml` dosyaları commit edildi.

2. **GitHub / GitLab / Bitbucket’e yükle**
   - Yeni bir repository oluştur.
   - Aşağıdaki komutları çalıştır:
     ```bash
     git remote add origin <REMOTE_URL>
     git branch -M main
     git push -u origin main
     ```

3. **Netlify’i repo ile bağla**
   - Netlify Dashboard > Sites > New site from Git
   - Repo sağlayıcını seç
   - `main` branch’i seç
   - Build ayarı: **build komut yok**
   - Publish directory: `.`

4. **Güncelleme akışı**
   - Kodda değişiklik yap
   - `git add .`
   - `git commit -m "..."`
   - `git push`
   - Netlify otomatik olarak deploy eder

5. **Alternatif: manuel deploy**
   - Eğer repo bağlamak istemezsen, Netlify Dashboard > Deploys > Drag and drop ile dosyaları yükleyebilirsin.
   - Ancak bu manuel yöntem her seferinde elle yeniden yüklemeyi gerektirir.

## Notlar

- `netlify.toml` dosyası, statik HTML proje olarak Netlify’e deploy için hazır.
- `COFFE.html` içinde `firebaseConfig` zaten canlı veri kaynağına işaret ediyor; bu yüzden bu dosyanın güncel olması yeterli.
- `sosyalcafe.com.tr` domaini Netlify’e yönlendiyse, doğru dosyalar deploy edildiğinde canlı site güncellenecektir.

## QR Görsel Otomatik Koruma

QR görsellerinin yanlışlıkla silinmesini takip edip otomatik geri yüklemek için iki script eklendi:

1. `scripts/menu_image_guard.py`
   - `menu_v7` verisini kontrol eder.
   - Her çalışmada `backups/menu-images/` altına görsel yedeği alır.
   - Görsel kapsaması `--min-coverage` altında ise otomatik olarak `scripts/restore_images_from_gopos.py` çalıştırır.

2. `scripts/setup_image_guard_cron.sh`
   - Her 30 dakikada bir `menu_image_guard.py` çalışacak cron kaydı ekler.
   - Loglar `logs/menu_image_guard.log` dosyasına yazılır.

### Manuel kullanım

```bash
/usr/bin/python3 scripts/menu_image_guard.py
```

Zorla geri yüklemek için:

```bash
/usr/bin/python3 scripts/menu_image_guard.py --force-restore
```

### Cron kurulum

```bash
chmod +x scripts/setup_image_guard_cron.sh
./scripts/setup_image_guard_cron.sh
```
