# Goway Danışmanlık Web Sitesi

Veri odaklı statik site üretimi; sektör sayfaları, indirilebilir kaynaklar, e-posta taslaklı iletişim formu ve erişilebilir mobil navigasyon içerir.

## Yerel kullanım

```powershell
npm ci
python -m pip install -r requirements.txt
npm run resources
npm run build
npm start
```

Resource generation uses the pinned Python dependencies in `requirements.txt`; the Node-side DOCX generator uses the pinned `docx` package in `package.json`. On CI, Python 3.12 is installed before `npm run resources`, so a clean checkout can regenerate and validate the committed PDF, DOCX and XLSX resources.

`npm run build` yalnızca `dist/` klasörünü üretir; takip edilen kaynak dosyalarını değiştirmez. Sektörler, kaynaklar ve içerik iddiaları `data/` altındaki manifestlerden yönetilir.

Netlify ve Vercel aynı bağımsız statik build komutunu kullanır; mevcut sürüm herhangi bir form servisi veya gizli ortam değişkeni gerektirmez. Form, girilen bilgileri tarayıcıdan göndermek yerine kullanıcının e-posta uygulamasında düzenlenebilir bir taslak hazırlar.

Ertelenen form servisi, hukuk incelemesi, müşteri logoları ve ölçümlü vaka çalışmaları [gelecek build notlarında](docs/future-build.md) tutulur ve mevcut public build’e dahil edilmez.

## Kalite kontrolleri

- `npm run build`: rota, H1, kimlik, yerel bağlantı, kanıt ve üretim paketi kontrolleri
- `npm run qa:site`: benzersiz metadata, şema, bağlantı, DOM ve üretim paketi taraması
- `npm run lighthouse`: sekiz temsilî rota için üçer mobil Lighthouse çalışması
- `npm run qa:resources`: PDF, DOCX ve XLSX yapısal doğrulaması
- `npm run ci`: build, site QA, resource QA ve Lighthouse kontrolleri
