# Goway Danışmanlık Web Sitesi

Veri odaklı statik site üretimi; sektör sayfaları, indirilebilir kaynaklar, e-posta taslaklı iletişim formu ve erişilebilir mobil navigasyon içerir.

Yerel geliştirme ve CI için Node.js 24.x gerekir.

## Yerel kullanım

```powershell
npm ci
python -m pip install -r requirements.txt
npm run resources
npm run source-runtime
npm run build
npm start
```

Resource generation uses the pinned Python dependencies in `requirements.txt`; the Node-side DOCX generator uses the pinned `docx` package in `package.json`. PDF and Office package metadata and compression are normalized so regeneration stays byte-stable across Python patch versions. On CI, Python 3.12 is installed before `npm run resources`, and CI fails if the regenerated resources differ from the committed files.

`npm run source-runtime` `data/` manifestlerinden doğrudan kaynak önizleme için geçerli `site-config.js` üretir. `npm run build` ayrıca bu uyumluluk dosyasını günceller ve `dist/` klasörünü üretir. Sektörler, kaynaklar, eğitimler ve içerik iddiaları `data/` altındaki manifestlerden yönetilir. `egitim-katalog.html`, `egitim-takip.html`, `hizmet-katalogu.html` ve `sektorel-cozumler.html` gibi katalog/hub rotaları yalnızca build sırasında üretilir; düzenleme noktası `data/` ve `scripts/content.mjs` dosyalarıdır.

Netlify ve Vercel aynı bağımsız statik build komutunu kullanır; mevcut sürüm herhangi bir form servisi veya gizli ortam değişkeni gerektirmez. Form, girilen bilgileri tarayıcıdan göndermek yerine kullanıcının e-posta uygulamasında düzenlenebilir bir taslak hazırlar.

Ertelenen form servisi, hukuk incelemesi, müşteri logoları ve ölçümlü vaka çalışmaları [gelecek build notlarında](docs/future-build.md) tutulur ve mevcut public build’e dahil edilmez.

## Kalite kontrolleri

- `npm run build`: rota, H1, kimlik, yerel bağlantı, kanıt ve üretim paketi kontrolleri
- `npm run qa:site`: benzersiz metadata, şema, bağlantı, DOM ve üretim paketi taraması
- `npm run lighthouse`: sekiz temsilî rota için mobil Lighthouse çalışması
- `npm run qa:resources`: PDF, DOCX ve XLSX yapısal doğrulaması
- `npm run resources:check`: yeniden üretilen indirmelerin Git'te kayıtlı dosyalarla aynı olduğunu doğrular; `npm run resources` sonrasında çalıştırılır
- `npm test`: gerçek dosya sistemiyle izleme döngüsü, sıralı build ve hata sonrası toparlanma kontrolleri
- `npm run qa:browser`: Chrome/Chromium ile kapalı mobil menü odağı, ekran genişliği geçişleri, form seçenekleri ve e-posta taslağı kontrolleri (`CHROME_PATH` ile tarayıcı seçilebilir)
- `npm run ci`: izleme testleri, build, site QA, resource QA, tarayıcı QA ve Lighthouse kontrolleri

Ön görüşme formunun hizmet ve sektör seçenekleri `data/services.json` ve `data/sectors.json` üzerinden build sırasında üretilir. Kaynak önizlemesi aynı seçenekleri `npm run source-runtime` ile alır. İzleme modu üretilen dosyaları ve araç klasörlerini yok sayar; devam eden build sırasında yapılan değişiklikler tek bir sonraki build'e alınır.

İçerik hash'i taşıyan CSS/JS dosyaları uzun süre önbelleğe alınır. Sabit URL kullanan görseller ve indirilebilir kaynaklar yeniden doğrulanır; aynı URL'de güncellenen dosya bir yıl boyunca eski kalmaz.
