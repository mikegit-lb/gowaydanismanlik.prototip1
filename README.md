# Goway Danışmanlık Web Sitesi

Veri odaklı statik site üretimi; sektör sayfaları, indirilebilir kaynaklar, e-posta taslaklı iletişim formu ve erişilebilir mobil navigasyon içerir.

## Yerel kullanım

```powershell
npm ci
npm run resources
npm run build
npm start
```

`npm run build` yalnızca `dist/` klasörünü üretir; takip edilen kaynak dosyalarını değiştirmez. Sektörler, kaynaklar ve içerik iddiaları `data/` altındaki manifestlerden yönetilir.

Netlify ve Vercel aynı bağımsız statik build komutunu kullanır; mevcut sürüm herhangi bir form servisi veya gizli ortam değişkeni gerektirmez. Form, girilen bilgileri tarayıcıdan göndermek yerine kullanıcının e-posta uygulamasında düzenlenebilir bir taslak hazırlar.

Ertelenen form servisi, hukuk incelemesi, müşteri logoları ve ölçümlü vaka çalışmaları [gelecek build notlarında](docs/future-build.md) tutulur ve mevcut public build’e dahil edilmez.

## Kalite kontrolleri

- `npm run build`: rota, H1, kimlik, yerel bağlantı, kanıt ve üretim paketi kontrolleri
- `npm run qa:site`: benzersiz metadata, şema, bağlantı, DOM ve üretim paketi taraması
- `npm run lighthouse`: sekiz temsilî rota için üçer mobil Lighthouse çalışması
- `npm run qa:resources`: PDF, DOCX ve XLSX yapısal doğrulaması
