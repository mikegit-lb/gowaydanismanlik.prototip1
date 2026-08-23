# Gelecek Build Aşamaları

Bu başlıklar mevcut public build’den çıkarılmıştır. Ayrı bir yayın kararı alınana kadar kaynak kod, runtime config, hosting ayarları ve kullanıcı arayüzüne dahil edilmez.

## Form servisi ve hukuk incelemesi

- Formspree veya alternatif bir form sağlayıcısı seçildikten sonra üretim uç noktası hosting ortamında gizli değişken olarak tanımlanacak.
- Bildirim e-postası, teslimat, çevrimdışı durum, zaman aşımı, spam koruması ve hız sınırı senaryoları gerçek sağlayıcıyla test edilecek.
- Veri işleyen, aktarım, saklama ve silme açıklamaları hukuk danışmanı tarafından incelendikten sonra üçüncü taraf form gönderimi etkinleştirilecek.
- Mevcut sürüm bu aşamaya kadar yalnızca kullanıcının cihazında e-posta taslağı hazırlar; site form verisi toplamaz veya saklamaz.

## Müşteri logoları ve ölçümlü vaka çalışmaları

- Müşteri adı veya logosu için yazılı yayın izni ve onaylı görsel varlık alınacak.
- Vaka çalışması için başlangıç metriği, sonuç metriği, dönem, yöntem, veri kaynağı, sınırlamalar ve yayın izni birlikte kaydedilecek.
- İlk aday konular: denetim hazırlığı ve kanıt bütünlüğü; LOTO ve saha güvenliği; enerji veya tekstil izlenebilirliği performansı.
- Bu içerikler tamamlanmadan logo şeridi, müşteri adı, sonuç metriği veya detaylı vaka sayfası oluşturulmayacak.

## Yeniden devreye alma koşulu

Bu özellikler tek bir sonraki-build çalışmasında; içerik manifestleri, runtime bileşenleri, CSP izinleri, legal metinler, otomatik testler ve hosting ayarları birlikte ele alınarak etkinleştirilecek.
