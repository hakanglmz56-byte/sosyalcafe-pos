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
