import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'assets', 'downloads');
const bundledModules = path.join(process.env.USERPROFILE || '', '.cache', 'codex-runtimes', 'codex-primary-runtime', 'dependencies', 'node', 'node_modules');
const localModule = path.join(root, 'node_modules', 'docx', 'dist', 'index.mjs');
const bundledModule = path.join(bundledModules, 'docx', 'dist', 'index.mjs');
const modulePath = await fs.access(localModule).then(() => localModule).catch(() => bundledModule);
const {
  AlignmentType, BorderStyle, Document, Footer, HeadingLevel, PageNumber, Packer,
  Paragraph, ShadingType, Table, TableCell, TableRow, TextRun, WidthType
} = await import(pathToFileURL(modulePath).href);

const NAVY = '185A77';
const TEAL = '2F83A6';
const GOLD = 'D6A02B';
const MIST = 'F4F8FB';
const INPUT = 'FFF2CC';
const TABLE_WIDTH = 9026;
const widths = [1500, 3350, 2250, 1926];
const thinBorder = { style: BorderStyle.SINGLE, size: 4, color: 'B7CFDA' };
const borders = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder, insideHorizontal: thinBorder, insideVertical: thinBorder };

const templates = [
  {
    file: 'iso-9001-hazirlik-kontrol-listesi-v1.docx',
    title: 'ISO 9001 Hazırlık Kontrol Listesi',
    intro: 'Süreç, risk, hedef, kayıt ve iç tetkik kanıtlarını ilk değerlendirme öncesinde gözden geçirmek için düzenlenebilir çalışma şablonu.',
    rows: [
      ['Bağlam', 'İç/dış konular ve ilgili taraf beklentileri güncel mi?', 'Bağlam analizi, paydaş listesi'],
      ['Süreçler', 'Süreç sahipleri, girdiler, çıktılar ve etkileşimler tanımlı mı?', 'Süreç haritası, görev matrisi'],
      ['Riskler', 'Risk ve fırsatlar aksiyon, sorumlu ve tarihle izleniyor mu?', 'Risk kaydı, aksiyon planı'],
      ['Hedefler', 'Kalite hedefleri ölçülebilir ve süreçlerle ilişkili mi?', 'Hedef/KPI tablosu'],
      ['Kaynaklar', 'Yetkinlik, altyapı, bakım ve kalibrasyon ihtiyaçları kontrol ediliyor mu?', 'Eğitim, bakım, kalibrasyon kaydı'],
      ['Operasyon', 'Müşteri şartı, değişiklik ve dış sağlayıcı kontrolleri uygulanıyor mu?', 'Sipariş, değişiklik, tedarikçi kayıtları'],
      ['Performans', 'Şikâyet, uygunsuzluk ve performans eğilimleri değerlendiriliyor mu?', 'Gösterge, DÖF, analiz'],
      ['İç tetkik', 'Kapsam, tarafsızlık, bulgu ve kapanış kanıtı tamam mı?', 'Program, rapor, kapanış kanıtı'],
      ['YGG', 'Yönetim gözden geçirmesi gerekli girdilerle karar üretiyor mu?', 'Gündem, tutanak, karar takibi']
    ]
  },
  {
    file: 'iso-45001-saha-denetim-kontrol-listesi-v1.docx',
    title: 'ISO 45001 Saha Denetim Kontrol Listesi',
    intro: 'Makine, enerji izolasyonu, yüklenici, kimyasal, trafik ve acil durum kontrollerini sahada kayıt altına almak için düzenlenebilir şablon.',
    rows: [
      ['Makine', 'Koruyucular, acil durdurma ve tehlikeli bölge erişimi kontrol edildi mi?', 'Fotoğraf, ekipman kontrol kaydı'],
      ['LOTO', 'Bakım, temizlik ve ayar işlerinde tüm enerji kaynakları tanımlı mı?', 'LOTO kartı, izolasyon doğrulaması'],
      ['Kimyasal', 'SDS, etiket, depolama ve dökülme ekipmanı güncel mi?', 'Kimyasal envanter, saha kontrolü'],
      ['Yüklenici', 'Yeterlilik, saha kabulü, izin ve gözetim adımları uygulanıyor mu?', 'Kabul formu, izin, gözlem'],
      ['Trafik', 'Araç-yaya ayrımı, kör noktalar ve hız kuralları görünür mü?', 'Saha planı, gözlem kaydı'],
      ['Yüksekte çalışma', 'Erişim, ankraj, ekipman ve kurtarma düzeni doğrulandı mı?', 'İzin, ekipman kontrolü, plan'],
      ['Acil durum', 'Kaçış yolları, ekipman, görevler ve iletişim erişilebilir mi?', 'Plan, kontrol, tatbikat kaydı'],
      ['Aksiyon', 'Bulgu sahibine, tarihe ve kapanış kanıtına bağlandı mı?', 'Aksiyon kaydı, doğrulama']
    ]
  },
  {
    file: 'acil-durum-tatbikat-raporu-v1.docx',
    title: 'Acil Durum Tatbikat Raporu',
    intro: 'Senaryo, kronoloji, ekip performansı, gözlem ve düzeltici aksiyonları aynı raporda toplamak için düzenlenebilir şablon.',
    rows: [
      ['Senaryo', 'Olay türü, başlangıç noktası ve varsayımlar tanımlandı mı?', 'Onaylı senaryo'],
      ['Bildirim', 'Alarm ve iç/dış iletişim zamanları kaydedildi mi?', 'Kronoloji'],
      ['Tahliye', 'Kaçış, sayım ve özel destek ihtiyacı gözlendi mi?', 'Gözlem formu'],
      ['Ekipler', 'Görev, ekipman ve iletişim performansı değerlendirildi mi?', 'Ekip değerlendirmesi'],
      ['Süre', 'Kritik aşamaların başlangıç ve bitiş zamanı ölçüldü mü?', 'Zaman çizelgesi'],
      ['Aksiyon', 'Bulgu, sorumlu, termin ve doğrulama yöntemi belirlendi mi?', 'Aksiyon planı']
    ],
    extra: true
  },
  {
    file: 'tekstil-izlenebilirlik-kutle-denge-kontrol-listesi-v1.docx',
    title: 'Tekstil İzlenebilirlik ve Kütle Denge Kontrol Listesi',
    intro: 'Hammadde, tedarikçi, üretim kaybı, stok, sevkiyat ve belge bağlantılarını denetim öncesinde doğrulamak için düzenlenebilir şablon.',
    rows: [
      ['Tedarikçi', 'Belge kapsamı, ürün, tesis ve geçerlilik doğrulandı mı?', 'Onaylı tedarikçi kanıtı'],
      ['Hammadde', 'Giriş miktarı, lot, iddia ve depo kaydı aynı kodla izleniyor mu?', 'Mal kabul ve stok kaydı'],
      ['Üretim', 'Sipariş, reçete, üretim kaybı ve yeniden işleme kaydediliyor mu?', 'Üretim ve fire kaydı'],
      ['Kütle dengesi', 'Girdi, fire, stok ve çıktı seçilen dönem için uzlaşıyor mu?', 'Kütle denge tablosu'],
      ['Sevkiyat', 'Ürün iddiası, miktar ve satış/sevkiyat kaydı eşleşiyor mu?', 'Fatura ve sevkiyat kaydı'],
      ['Örneklem', 'Rastgele sipariş geriye ve ileriye doğru izlenebiliyor mu?', 'İzlenebilirlik prova kaydı']
    ]
  },
  {
    file: 'iso-27001-risk-varlik-envanteri-kontrol-listesi-v1.docx',
    title: 'ISO 27001 Risk ve Varlık Envanteri Kontrol Listesi',
    intro: 'Bilgi varlıklarını, sahiplerini, tehditleri, kontrolleri ve risk aksiyonlarını hazırlık öncesinde eşleştirmek için düzenlenebilir şablon.',
    rows: [
      ['Varlıklar', 'Bilgi, uygulama, cihaz, hizmet ve tesis varlıkları envanterde mi?', 'Varlık envanteri, sahiplik kaydı'],
      ['Sınıflandırma', 'Varlıkların önem, gizlilik ve erişilebilirlik seviyesi tanımlı mı?', 'Sınıflandırma kuralı, kayıt'],
      ['Risk', 'Tehdit, zafiyet, etki ve olasılık birlikte değerlendiriliyor mu?', 'Risk değerlendirmesi'],
      ['Kontroller', 'Risklere karşı teknik, fiziksel ve yönetsel kontroller atanmış mı?', 'Kontrol planı, sorumlu matrisi'],
      ['Erişim', 'Yetki talebi, onay, gözden geçirme ve iptal kayıtları tutuluyor mu?', 'Erişim kayıtları'],
      ['Olay', 'Bilgi güvenliği olayları sınıflandırılıyor ve öğrenimler aksiyona bağlanıyor mu?', 'Olay kaydı, aksiyon planı'],
      ['Süreklilik', 'Yedekleme, kurtarma ve kritik hizmet bağımlılıkları test ediliyor mu?', 'Test raporu, kurtarma kaydı'],
      ['İyileştirme', 'İç tetkik ve yönetim kararları risk kaydına geri besleniyor mu?', 'Tetkik ve YGG kanıtı']
    ]
  },
  {
    file: 'iso-22301-is-etki-analizi-kontrol-listesi-v1.docx',
    title: 'ISO 22301 İş Etki Analizi Kontrol Listesi',
    intro: 'Kritik faaliyetleri, bağımlılıkları, toleransları ve kurtarma önceliklerini iş etki analizi içinde görünür kılmak için düzenlenebilir şablon.',
    rows: [
      ['Faaliyet', 'Ürün, hizmet ve kritik faaliyet sahipleri tanımlı mı?', 'Faaliyet envanteri'],
      ['Etki', 'Finansal, operasyonel, yasal ve itibar etkileri dönemlere göre değerlendirildi mi?', 'Etki değerlendirmesi'],
      ['Tolerans', 'Maksimum kabul edilebilir kesinti ve veri kaybı süresi belirlendi mi?', 'MTPD/RPO kaydı'],
      ['Bağımlılık', 'İnsan, teknoloji, tesis, tedarikçi ve veri bağımlılıkları haritalandı mı?', 'Bağımlılık matrisi'],
      ['Öncelik', 'Kurtarma sırası ve asgari kaynak ihtiyacı onaylandı mı?', 'Önceliklendirme tablosu'],
      ['Strateji', 'Alternatif çalışma, iletişim ve kaynak stratejileri tanımlı mı?', 'Süreklilik stratejisi'],
      ['Test', 'Planlar tatbikat veya senaryo ile doğrulanıp öğrenimler kaydediliyor mu?', 'Tatbikat raporu'],
      ['Gözden geçirme', 'Değişiklikler ve yönetim kararları analiz kayıtlarına işleniyor mu?', 'Gözden geçirme tutanağı']
    ]
  },
  {
    file: 'iso-10002-sikayet-yonetimi-kontrol-listesi-v1.docx',
    title: 'ISO 10002 Şikâyet Yönetimi Kontrol Listesi',
    intro: 'Şikâyet alma, sınıflandırma, inceleme, yanıt, kök neden ve iyileştirme kayıtlarını birlikte kontrol etmek için düzenlenebilir şablon.',
    rows: [
      ['Kanal', 'Şikâyetlerin tüm kanallardan alınacağı ve kaydedileceği tanımlı mı?', 'Kanal ve kayıt prosedürü'],
      ['Sınıflandırma', 'Konu, önem, müşteri ve sorumlu bilgisi tutarlı biçimde atanıyor mu?', 'Şikâyet kayıtları'],
      ['İnceleme', 'Tarafsız inceleme, kanıt toplama ve iletişim adımları izleniyor mu?', 'İnceleme notları'],
      ['Yanıt', 'Müşteriye verilen yanıt, tarih ve karar gerekçesiyle kayıtlı mı?', 'Yanıt kaydı'],
      ['Kök neden', 'Tekrarlayan şikâyetler kök neden ve düzeltici aksiyona bağlanıyor mu?', 'Kök neden/DÖF kaydı'],
      ['Süre', 'Yanıt ve kapanış süreleri hedeflerle karşılaştırılıyor mu?', 'SLA ve gösterge tablosu'],
      ['Memnuniyet', 'Şikâyet sonrası geri bildirim ve eğilimler değerlendiriliyor mu?', 'Geri bildirim analizi'],
      ['YGG', 'Şikâyet eğilimleri yönetim kararlarına ve iyileştirmeye taşınıyor mu?', 'YGG girdisi']
    ]
  },
  {
    file: 'iso-22000-gida-guvenligi-on-hazirlik-listesi-v1.docx',
    title: 'ISO 22000 Gıda Güvenliği Ön Hazırlık Listesi',
    intro: 'Ön gereksinim programı, tehlike analizi, kritik kontrol noktaları ve izlenebilirlik kayıtlarını sahada doğrulamak için düzenlenebilir şablon.',
    rows: [
      ['Kapsam', 'Ürün, proses, tesis, vardiya ve dış kaynak kapsamı açık mı?', 'Kapsam ve akış şeması'],
      ['Hijyen', 'Temizlik, haşere, kişisel hijyen ve çevresel koşullar izleniyor mu?', 'Hijyen ve temizlik kayıtları'],
      ['Tehlike', 'Biyolojik, kimyasal, fiziksel ve alerjen tehlikeler analiz edildi mi?', 'Tehlike analizi'],
      ['Kontrol noktası', 'Kritik limit, izleme sıklığı ve sapma tepkisi tanımlı mı?', 'KKN planı, ölçüm kaydı'],
      ['Tedarikçi', 'Hammadde şartları, kabul kriterleri ve tedarikçi performansı izleniyor mu?', 'Tedarikçi değerlendirmesi'],
      ['İzlenebilirlik', 'Lot, giriş, üretim ve sevkiyat kayıtları geriye/ileriye izlenebiliyor mu?', 'İzlenebilirlik provası'],
      ['Geri çağırma', 'Geri çekme/çağırma senaryosu test edilmiş ve öğrenimler kaydedilmiş mi?', 'Tatbikat raporu'],
      ['Doğrulama', 'İç tetkik, analiz sonuçları ve yönetim gözden geçirmesi tamam mı?', 'Tetkik ve YGG kanıtı']
    ]
  },
  {
    file: 'iso-14064-ghg-hesaplama-veri-matrisi-v1.docx',
    title: 'ISO 14064 GHG Hesaplama Veri Matrisi',
    intro: 'Organizasyonel sınır, emisyon kaynağı, aktivite verisi, emisyon faktörü ve veri kalitesini kaydetmek için düzenlenebilir şablon.',
    rows: [
      ['Sınır', 'Kontrol yaklaşımı, tesisler ve raporlama dönemi açıkça tanımlı mı?', 'Organizasyonel sınır kaydı'],
      ['Kaynak', 'Kapsam 1, 2 ve uygun Kapsam 3 kaynakları listelendi mi?', 'Emisyon kaynak envanteri'],
      ['Aktivite verisi', 'Yakıt, elektrik, soğutucu, seyahat ve lojistik verileri kaynağıyla tutuluyor mu?', 'Fatura, sayaç, tüketim kaydı'],
      ['Faktör', 'Emisyon faktörü kaynağı, birimi ve sürümü kaydedildi mi?', 'Faktör referansı'],
      ['Hesap', 'Birim dönüşümü, formül ve yuvarlama yöntemi tekrarlanabilir mi?', 'Hesaplama çalışma kâğıdı'],
      ['Veri kalitesi', 'Eksik, tahmini ve doğrulanmış veriler ayrı işaretleniyor mu?', 'Veri kalite notu'],
      ['Belirsizlik', 'Önemli varsayımlar ve belirsizlik kaynakları açıklanıyor mu?', 'Varsayım/belirsizlik kaydı'],
      ['Rapor', 'Sonuçlar, dönem karşılaştırması ve sınırlar yönetim tarafından gözden geçirildi mi?', 'GHG raporu, onay kaydı']
    ]
  },
  {
    file: 'gida-denetim-hazirlik-kanit-matrisi-v1.docx',
    title: 'Gıda Denetim Hazırlık Kanıt Matrisi',
    intro: 'Hijyen, proses, personel, ekipman, tedarikçi ve izlenebilirlik gerekliliklerini gerçek kayıtlarla eşleştirmek için düzenlenebilir şablon.',
    rows: [
      ['Personel', 'Görev yetkinliği, hijyen eğitimi ve sağlık kontrolleri güncel mi?', 'Eğitim ve yetkinlik kayıtları'],
      ['Tesis', 'Akış, zonlama, bakım ve altyapı koşulları kayıtlarla izleniyor mu?', 'Tesis kontrolü, bakım kaydı'],
      ['Temizlik', 'Plan, kimyasal, uygulama ve doğrulama kayıtları eksiksiz mi?', 'Temizlik ve doğrulama kaydı'],
      ['Proses', 'Kritik parametreler, sapmalar ve serbest bırakma kararları izleniyor mu?', 'Proses izleme kaydı'],
      ['Tedarikçi', 'Hammadde şartları, kabul kontrolleri ve uygunsuzluklar yönetiliyor mu?', 'Tedarikçi ve kabul kaydı'],
      ['Ekipman', 'Ölçüm cihazları, bakım ve kalibrasyon durumu görünür mü?', 'Bakım/kalibrasyon kaydı'],
      ['İzlenebilirlik', 'Numune sipariş geriye ve ileriye doğru takip edilebiliyor mu?', 'İzlenebilirlik prova kaydı'],
      ['Aksiyon', 'Bulgu, sorumlu, termin ve etkinlik doğrulaması tamam mı?', 'Aksiyon ve kapanış kanıtı']
    ]
  },
  {
    file: 'sosyal-uygunluk-denetim-hazirlik-kontrol-listesi-v1.docx',
    title: 'Sosyal Uygunluk Denetim Hazırlık Kontrol Listesi',
    intro: 'Çalışma saatleri, ücret kayıtları, iş sağlığı, çalışan görüşmeleri ve tedarikçi kanıtlarını gözden geçirmek için düzenlenebilir şablon.',
    rows: [
      ['Çalışan kayıtları', 'İşe giriş, görev, yaş ve özlük kayıtları kontrollü erişimle tutuluyor mu?', 'Personel kayıtları'],
      ['Çalışma süresi', 'Vardiya, puantaj, fazla çalışma ve izin kayıtları birbiriyle uyumlu mu?', 'Puantaj ve vardiya kaydı'],
      ['Ücret', 'Ücret, yan hak ve ödeme kayıtları çalışan sözleşmeleriyle eşleşiyor mu?', 'Bordro ve ödeme kaydı'],
      ['İSG', 'Riskler, eğitimler, olaylar ve acil durum kontrolleri uygulanıyor mu?', 'İSG kayıtları'],
      ['Özgür irade', 'İşe alım, disiplin, ayrımcılık ve taciz şikâyeti süreçleri tanımlı mı?', 'Politika ve şikâyet kaydı'],
      ['Çalışan sesi', 'Görüşme ve geri bildirim kanalları güvenli ve misillemesiz mi?', 'Görüşme/geri bildirim özeti'],
      ['Tedarik zinciri', 'Tedarikçi beklentileri, değerlendirme ve aksiyonlar izleniyor mu?', 'Tedarikçi taahhüdü ve takip'],
      ['Kapanış', 'Bulgu, sorumlu, termin ve doğrulama kanıtı kayıtlı mı?', 'DÖF ve kapanış kaydı']
    ]
  }
];

const text = (value, options = {}) => new TextRun({ text: value, font: 'Arial', color: options.color || NAVY, bold: options.bold || false, size: options.size || 19 });
const paragraph = (value, options = {}) => new Paragraph({ children: [text(value, options)], spacing: { after: options.after ?? 100 }, alignment: options.alignment || AlignmentType.LEFT, heading: options.heading });

function cell(value, width, options = {}) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    shading: { type: ShadingType.CLEAR, fill: options.fill || 'FFFFFF' },
    margins: { top: 90, bottom: 90, left: 100, right: 100 },
    borders,
    children: [paragraph(value, { color: options.color || NAVY, bold: options.bold, size: options.size || 18, after: 0 })]
  });
}

function checklistTable(rows) {
  const header = new TableRow({ tableHeader: true, children: [cell('Alan', widths[0], { fill: NAVY, color: 'FFFFFF', bold: true }), cell('Kontrol sorusu', widths[1], { fill: NAVY, color: 'FFFFFF', bold: true }), cell('Beklenen kanıt', widths[2], { fill: NAVY, color: 'FFFFFF', bold: true }), cell('Durum / not', widths[3], { fill: NAVY, color: 'FFFFFF', bold: true })] });
  const body = rows.map((row, index) => new TableRow({ children: [cell(row[0], widths[0], { bold: true, fill: index % 2 ? MIST : 'FFFFFF' }), cell(row[1], widths[1], { fill: index % 2 ? MIST : 'FFFFFF' }), cell(row[2], widths[2], { fill: index % 2 ? MIST : 'FFFFFF' }), cell('Durum: __________\nNot: ____________________', widths[3], { fill: INPUT })] }));
  return new Table({ width: { size: TABLE_WIDTH, type: WidthType.DXA }, columnWidths: widths, rows: [header, ...body] });
}

function metaTable() {
  const metaWidths = [1550, 2963, 1550, 2963];
  return new Table({ width: { size: TABLE_WIDTH, type: WidthType.DXA }, columnWidths: metaWidths, rows: [
    new TableRow({ children: [cell('Sürüm', metaWidths[0], { fill: MIST, bold: true }), cell('1.0', metaWidths[1], { fill: INPUT }), cell('Güncelleme', metaWidths[2], { fill: MIST, bold: true }), cell('23.08.2026', metaWidths[3], { fill: INPUT })] }),
    new TableRow({ children: [cell('İşletme', metaWidths[0], { fill: MIST, bold: true }), cell('____________________', metaWidths[1], { fill: INPUT }), cell('Sorumlu', metaWidths[2], { fill: MIST, bold: true }), cell('____________________', metaWidths[3], { fill: INPUT })] })
  ] });
}

async function makeDocx(template) {
  const children = [
    paragraph('GOWAY · UYGULAMA KAYNAĞI', { color: TEAL, bold: true, size: 18, after: 150 }),
    paragraph(template.title, { heading: HeadingLevel.TITLE, bold: true, size: 38, after: 120 }),
    paragraph(template.intro, { size: 21, after: 220 }),
    metaTable(),
    paragraph('Kullanım', { heading: HeadingLevel.HEADING_1, bold: true, size: 26, after: 80 }),
    paragraph('Her satırı evet, kısmen, hayır veya kapsam dışı olarak değerlendirin. Kanıt alanına erişilebilir kayıt, tarih ve sorumlu bilgisi yazın. Sarı alanlar kullanıcı girdisidir.', { size: 19, after: 180 }),
    checklistTable(template.rows)
  ];
  if (template.extra) {
    children.push(paragraph('Tatbikat kronolojisi', { heading: HeadingLevel.HEADING_1, bold: true, size: 26, after: 80 }));
    children.push(new Table({ width: { size: TABLE_WIDTH, type: WidthType.DXA }, columnWidths: [1500, 2500, 2500, 2526], rows: [
      new TableRow({ children: [cell('Saat', 1500, { fill: NAVY, color: 'FFFFFF', bold: true }), cell('Olay / bildirim', 2500, { fill: NAVY, color: 'FFFFFF', bold: true }), cell('Gözlem', 2500, { fill: NAVY, color: 'FFFFFF', bold: true }), cell('Karar / aksiyon', 2526, { fill: NAVY, color: 'FFFFFF', bold: true })] }),
      ...Array.from({ length: 6 }, () => new TableRow({ children: [cell('', 1500, { fill: INPUT }), cell('', 2500, { fill: INPUT }), cell('', 2500, { fill: INPUT }), cell('', 2526, { fill: INPUT })] }))
    ] }));
  }
  children.push(paragraph('Sınırlama', { heading: HeadingLevel.HEADING_1, bold: true, size: 26, after: 80 }));
  children.push(paragraph('Bu kaynak genel hazırlık ve öz değerlendirme amacıyla sunulur. İşletmeye özel mevzuat, risk değerlendirmesi, hukuki görüş, belgelendirme veya resmî uygunluk kararının yerine geçmez. Teknik inceleme durumu: bekliyor.', { size: 18, after: 0 }));

  const document = new Document({
    creator: 'Goway Danışmanlık',
    title: template.title,
    description: template.intro,
    styles: { default: { document: { run: { font: 'Arial', size: 20, color: NAVY }, paragraph: { spacing: { line: 276 } } } } },
    sections: [{
      properties: { page: { margin: { top: 1000, right: 1440, bottom: 1100, left: 1440 } } },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [text('Goway Danışmanlık · Sayfa ', { size: 16 }), new TextRun({ children: [PageNumber.CURRENT], font: 'Arial', size: 16, color: NAVY })] })] }) },
      children
    }]
  });
  await fs.writeFile(path.join(out, template.file), await Packer.toBuffer(document));
}

async function runPython() {
  const bundledPython = path.join(process.env.USERPROFILE || '', '.cache', 'codex-runtimes', 'codex-primary-runtime', 'dependencies', 'python', 'python.exe');
  const python = await fs.access(bundledPython).then(() => bundledPython).catch(() => 'python');
  await new Promise((resolve, reject) => {
    const child = spawn(python, [path.join(root, 'scripts', 'generate-resources.py')], { stdio: 'inherit' });
    child.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`Python resource generator exited ${code}`)));
    child.on('error', reject);
  });
}

await fs.mkdir(out, { recursive: true });
await Promise.all(templates.map(makeDocx));
await runPython();
console.log(JSON.stringify({ docx: templates.length, output: out }, null, 2));
