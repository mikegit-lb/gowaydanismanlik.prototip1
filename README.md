# Goway Danışmanlık Web Sitesi

Veri odaklı statik site üretimi; sektör sayfaları, indirilebilir kaynaklar, güvenli talep formu ve erişilebilir mobil navigasyon içerir.

## Yerel kullanım

```powershell
npm ci
npm run resources
npm run build
npm start
```

`npm run build` yalnızca `dist/` klasörünü üretir; takip edilen kaynak dosyalarını değiştirmez. Sektörler, kaynaklar, iddialar, müşteriler, vaka çalışmaları ve form ayarları `data/` altındaki manifestlerden yönetilir.

Netlify ve Vercel `npm run build:production` kullanır; `FORMSPREE_ENDPOINT` eksikse yayın derlemesi bilerek durur.

## Formspree aktivasyonu

Yayın ortamında `FORMSPREE_ENDPOINT` değişkenini tam form uç noktasıyla tanımlayın (ör. `https://formspree.io/f/...`). Uç nokta yoksa form veri kaybetmeden güvenli biçimde hata durumuna geçer ve telefon/e-posta yedeklerini gösterir.

Üretim aktivasyonundan önce:

1. Bildirim e-postasını doğrulayın.
2. Başarılı teslim, çevrimdışı, zaman aşımı, spam ve hız sınırı senaryolarını test edin.
3. KVKK metnindeki veri işleyen, aktarım, saklama ve silme açıklamalarını hukuk danışmanına onaylatın.

## Kanıt yayınlama kuralı

Müşteri logosu, sonuç metriği, referans, sertifika veya uzman unvanı yalnızca `approved` durumunda; kaynak, yazılı izin, inceleme ve son kullanma tarihleri eksiksizse derlemeye girebilir. Eksik kayıtlar otomatik olarak gizli kalır.

## Kalite kontrolleri

- `npm run build`: rota, H1, kimlik, yerel bağlantı, kanıt ve üretim paketi kontrolleri
- `npm run qa:site`: benzersiz metadata, şema, bağlantı, DOM ve üretim paketi taraması
- `npm run lighthouse`: sekiz temsilî rota için üçer mobil Lighthouse çalışması
- `npm run qa:resources`: PDF, DOCX ve XLSX yapısal doğrulaması
