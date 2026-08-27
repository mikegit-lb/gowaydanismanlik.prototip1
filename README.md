# Goway Danışmanlık Web Sitesi

Veri odaklı statik site üretimi; sektör sayfaları, indirilebilir kaynaklar, e-posta taslaklı iletişim formu ve erişilebilir mobil navigasyon içerir.

## Yerel kullanım

```powershell
npm ci
python -m pip install -r requirements.txt
npm run resources
npm run source-runtime
npm run build
npm start
```

Resource generation uses the pinned Python dependencies in `requirements.txt`; the Node-side DOCX generator uses the pinned `docx` package in `package.json`. PDF and Office package metadata is normalized so regeneration is deterministic. On CI, Python 3.12 is installed before `npm run resources`, and CI fails if the regenerated resources differ from the committed files.

`npm run source-runtime` `data/` manifestlerinden doğrudan kaynak önizleme için geçerli `site-config.js` üretir. `npm run build` ayrıca bu uyumluluk dosyasını günceller ve `dist/` klasörünü üretir. Sektörler, kaynaklar, eğitimler ve içerik iddiaları `data/` altındaki manifestlerden yönetilir. `egitim-katalog.html`, `egitim-takip.html`, `hizmet-katalogu.html` ve `sektorel-cozumler.html` gibi katalog/hub rotaları yalnızca build sırasında üretilir; düzenleme noktası `data/` ve `scripts/content.mjs` dosyalarıdır.

Netlify ve Vercel aynı bağımsız statik build komutunu kullanır; mevcut sürüm herhangi bir form servisi veya gizli ortam değişkeni gerektirmez. Form, girilen bilgileri tarayıcıdan göndermek yerine kullanıcının e-posta uygulamasında düzenlenebilir bir taslak hazırlar.

Ertelenen form servisi, hukuk incelemesi, müşteri logoları ve ölçümlü vaka çalışmaları [gelecek build notlarında](docs/future-build.md) tutulur ve mevcut public build’e dahil edilmez.

## Kalite kontrolleri

- `npm run build`: rota, H1, kimlik, yerel bağlantı, kanıt ve üretim paketi kontrolleri
- `npm run qa:site`: benzersiz metadata, şema, bağlantı, DOM ve üretim paketi taraması
- `npm run lighthouse`: sekiz temsilî rota için mobil Lighthouse çalışması
- `npm run qa:resources`: PDF, DOCX ve XLSX yapısal doğrulaması
- `npm run ci`: build, site QA, resource QA ve Lighthouse kontrolleri
