import fs from 'node:fs/promises';
import path from 'node:path';

const baseUrl = 'https://www.gowaydanismanlik.com';

export const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const escapeJson = (value) => JSON.stringify(value).replaceAll('<', '\\u003c');
const list = (items, className = '') => `<ul${className ? ` class="${className}"` : ''}>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;

export async function loadContent(root) {
  const readJson = async (name) => JSON.parse(await fs.readFile(path.join(root, 'data', name), 'utf8'));
  const [site, sectors, resources, cases, clients, claims, forms, analytics] = await Promise.all([
    readJson('site.json'),
    readJson('sectors.json'),
    readJson('resources.json'),
    readJson('case-studies.json'),
    readJson('clients.json'),
    readJson('claims.json'),
    readJson('forms.json'),
    readJson('analytics.json')
  ]);
  return { site, sectors: sectors.sectors, resources: resources.resources, cases: cases.cases, clients: clients.clients, claims, forms, analytics };
}

function header(site) {
  const links = site.navigation.map((item) => `<a href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a>`).join('');
  return `<div class="utility"><div class="container"><span>${escapeHtml(site.site.address)}</span><a href="${escapeHtml(site.site.phoneHref)}">${escapeHtml(site.site.phone)}</a></div></div>
  <header class="site-header"><div class="container nav-wrap">
    <a class="brand" href="index.html"><strong>GOWAY</strong><span>DANIŞMANLIK</span></a>
    <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="site-navigation"><span></span><span></span><span></span><span class="visually-hidden">Menüyü aç</span></button>
    <nav class="page-nav" id="site-navigation" aria-label="Ana menü">${links}</nav>
    <div class="header-actions"><a class="button primary header-cta" href="on-gorusme.html">Ücretsiz Ön Görüşme</a></div>
  </div></header>`;
}

function footer(site) {
  return `<footer class="site-footer"><div class="container site-footer-inner">
    <section class="footer-brand-block" aria-label="Goway Danışmanlık"><div class="footer-brand-lockup"><img loading="lazy" decoding="async" width="80" height="72" class="footer-logo" src="goway-mark.png" alt=""><div class="footer-brand-copy"><strong>GOWAY</strong><span>Danışmanlık</span></div></div><p>ISO, İSG, çevre ve kurumsal gelişim ihtiyaçlarını uygulanabilir, izlenebilir ve sürdürülebilir çözümlere dönüştürüyoruz.</p></section>
    <section class="footer-contact-block" aria-label="İletişim"><h2>İletişim</h2><a href="${escapeHtml(site.site.phoneHref)}">${escapeHtml(site.site.phone)}</a><a href="${escapeHtml(site.site.emailHref)}">${escapeHtml(site.site.email)}</a><span>${escapeHtml(site.site.address)}</span></section>
  </div><div class="container footer-legal-row"><span>© 2026 Goway Danışmanlık · Tüm hakları saklıdır.</span><nav class="site-footer-nav" aria-label="Yasal bağlantılar"><a href="kvkk-aydinlatma-metni.html">KVKK</a><a href="gizlilik-politikasi.html">Gizlilik</a><a href="cerez-politikasi.html">Çerezler</a><a href="kullanim-sartlari.html">Kullanım</a><a href="sss.html">SSS</a></nav></div></footer>`;
}

function hero(asset, eyebrow, title, summary, actions = '') {
  const srcset = (format) => [400, 800, 1200, 1600].map((width) => `assets/hero/${asset}-${width}.${format} ${width}w`).join(', ');
  return `<section class="hero-page hero-page-sector"><picture class="hero-media" aria-hidden="true"><source type="image/avif" srcset="${srcset('avif')}" sizes="100vw"><source type="image/webp" srcset="${srcset('webp')}" sizes="100vw"><img src="assets/hero/${asset}-1200.webp" width="1600" height="900" alt="" fetchpriority="high" decoding="async"></picture><div class="container"><p class="eyebrow">${escapeHtml(eyebrow)}</p><h1>${escapeHtml(title)}</h1><p class="lede">${escapeHtml(summary)}</p>${actions}</div></section>`;
}

function schemaBlock(graph) {
  return `<script type="application/ld+json" data-generated-schema>${escapeJson({ '@context': 'https://schema.org', '@graph': graph })}</script>`;
}

function page({ site, file, title, description, bodyClass, heroHtml, content, schema }) {
  const canonical = file === 'index.html' ? `${baseUrl}/` : `${baseUrl}/${file}`;
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="description" content="${escapeHtml(description)}"><meta name="theme-color" content="#185a77"><title>${escapeHtml(title)} | Goway Danışmanlık</title><link rel="canonical" href="${canonical}"><link rel="stylesheet" href="site-pages.css">${schemaBlock(schema)}</head><body class="${escapeHtml(bodyClass)}"><a class="visually-hidden skip-link" href="#main-content">İçeriğe geç</a>${header(site)}${heroHtml}<main id="main-content">${content}</main>${footer(site)}<script src="site-config.js"></script><script src="site-ticker.js" defer></script></body></html>`;
}

function breadcrumb(items) {
  return `<nav class="breadcrumb" aria-label="İçerik yolu">${items.map((item, index) => item.href ? `<a href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a><span aria-hidden="true">/</span>` : `<span aria-current="page">${escapeHtml(item.label)}</span>`).join('')}</nav>`;
}

function trustStrip() {
  return `<section class="verified-trust" aria-label="Veri ve iletişim güveni"><a href="gizlilik-politikasi.html"><span aria-hidden="true">✓</span><strong>Şifreli bağlantı</strong><small>HTTPS üzerinden aktarım</small></a><a href="kvkk-aydinlatma-metni.html"><span aria-hidden="true">✓</span><strong>KVKK bilgilendirmesi</strong><small>Amaç ve haklar açık</small></a><a href="gizlilik-politikasi.html#veri-minimizasyonu"><span aria-hidden="true">✓</span><strong>Veri minimizasyonu</strong><small>Yalnızca ihtiyaç bilgisi</small></a></section>`;
}

function renderSectorPage(content, sector, resource) {
  const consultation = `on-gorusme.html?sektor=${encodeURIComponent(sector.slug)}&hizmet=${encodeURIComponent(sector.title)}`;
  const actions = `<div class="hero-actions"><a class="button primary" href="${consultation}">Sektör görüşmesi planlayın</a><a class="button secondary" href="#sektor-ciktilari">Çıktıları inceleyin</a></div>`;
  const process = sector.process.map((step, index) => `<article class="process-step"><span>${String(index + 1).padStart(2, '0')}</span><h3>${escapeHtml(step.label)}</h3><p>${escapeHtml(step.text)}</p></article>`).join('');
  const services = sector.services.map((service) => `<a class="service-path" href="${escapeHtml(service.href)}"><strong>${escapeHtml(service.label)}</strong><span>Hizmet kapsamını görün →</span></a>`).join('');
  const faq = sector.faq.map((item, index) => `<details class="sector-faq"><summary>${escapeHtml(item.question)}</summary><div><p>${escapeHtml(item.answer)}</p></div></details>`).join('');
  const resourceLinks = resource.files.map((file) => `<a class="button ${file.format === 'PDF' ? 'primary' : 'secondary'}" href="${escapeHtml(file.href)}" download data-resource-download="${escapeHtml(resource.slug)}">${escapeHtml(file.format)} indir</a>`).join('');
  const contentHtml = `<div class="container sector-page-content">${breadcrumb([{ label: 'Ana Sayfa', href: 'index.html' }, { label: 'Sektörler', href: 'sektorel-cozumler.html' }, { label: sector.title }])}
    <section class="sector-snapshot" aria-labelledby="sektor-gundemi"><article><p class="eyebrow">Karar gündemi</p><h2 id="sektor-gundemi">Bu çalışma ne zaman gerekli?</h2>${list(sector.triggers)}</article><aside><p class="eyebrow">Kimlerle çalışırız?</p><h2>Operasyonun gerçek sahipleri</h2>${list(sector.buyers)}<div class="standard-row">${sector.standards.map((item) => `<span>${escapeHtml(item)}</span>`).join('')}</div></aside></section>
    <section class="content-section" id="sektor-ciktilari"><div class="section-heading"><p class="eyebrow">Somut teslimatlar</p><h2>Slogan değil, kullanılabilir kanıt üretin</h2><p>Çıktılar mevcut durum ve kapsam doğrulamasından sonra işletmeye uyarlanır.</p></div><div class="evidence-output-grid">${sector.outputs.map((item, index) => `<article><span>${String(index + 1).padStart(2, '0')}</span><p>${escapeHtml(item)}</p></article>`).join('')}</div></section>
    <section class="content-section process-section"><div class="section-heading"><p class="eyebrow">Uygulama akışı</p><h2>Saha fotoğrafından doğrulanmış sisteme</h2></div><div class="process-rail">${process}</div></section>
    <section class="content-section metric-section"><div class="section-heading"><p class="eyebrow">Ölçüm fırsatları</p><h2>Başlangıç değeri belirlendikten sonra izlenebilecek göstergeler</h2><p>Bunlar müşteri sonucu iddiası değildir; proje başında tanımı ve veri kaynağı doğrulanacak ölçüm seçenekleridir.</p></div>${list(sector.metrics, 'metric-list')}</section>
    <section class="content-section sector-next"><div><p class="eyebrow">İlgili hizmetler</p><h2>Tek bir sayfada kalmayın</h2><div class="service-path-grid">${services}</div></div><aside class="resource-feature"><span class="resource-format">Ücretsiz kaynak · ${escapeHtml(resource.version)}</span><h2>${escapeHtml(resource.title)}</h2><p>${escapeHtml(resource.summary)}</p><div class="hero-actions">${resourceLinks}</div><small>Son güncelleme: ${escapeHtml(resource.updatedAt)} · ${escapeHtml(resource.reviewer)}</small></aside></section>
    <section class="content-section"><div class="section-heading"><p class="eyebrow">Sık sorulanlar</p><h2>Kapsamı doğru beklentiyle başlatın</h2></div><div class="sector-faq-list">${faq}</div></section>
    ${trustStrip()}
    <section class="section-note sector-final-cta"><div><p class="eyebrow">15 dakikalık başlangıç</p><h2>Sektörünüzün önceliğini birlikte netleştirelim</h2><p>Lokasyon, çalışan profili, hedef tarih ve öncelikli riski paylaşın; ilk çalışma kapsamını konuşalım.</p></div><a class="button primary" href="${consultation}">Ön görüşme talebi oluşturun</a></section>
  </div>`;
  const canonical = `${baseUrl}/${sector.file}`;
  const faqSchema = { '@type': 'FAQPage', mainEntity: sector.faq.map((item) => ({ '@type': 'Question', name: item.question, acceptedAnswer: { '@type': 'Answer', text: item.answer } })) };
  return page({
    site: content.site,
    file: sector.file,
    title: sector.title,
    description: sector.summary,
    bodyClass: `sector-page sector-${sector.slug}`,
    heroHtml: hero(sector.heroAsset, sector.eyebrow, sector.title, sector.summary, actions),
    content: contentHtml,
    schema: [
      { '@type': 'Service', name: `${sector.title} danışmanlığı`, url: canonical, provider: { '@type': 'Organization', name: content.site.site.name }, areaServed: { '@type': 'Country', name: 'Türkiye' } },
      faqSchema,
      { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: `${baseUrl}/` }, { '@type': 'ListItem', position: 2, name: 'Sektörler', item: `${baseUrl}/sektorel-cozumler.html` }, { '@type': 'ListItem', position: 3, name: sector.title, item: canonical }] }
    ]
  });
}

function renderSectorHub(content) {
  const cards = content.sectors.map((sector, index) => `<article class="sector-index-card"><span>${String(index + 1).padStart(2, '0')}</span><h2>${escapeHtml(sector.title)}</h2><p>${escapeHtml(sector.summary)}</p><div class="standard-row">${sector.standards.slice(0, 3).map((item) => `<small>${escapeHtml(item)}</small>`).join('')}</div><a class="button primary" href="${escapeHtml(sector.file)}">Sektör sayfasını açın</a></article>`).join('');
  const contentHtml = `<div class="container">${breadcrumb([{ label: 'Ana Sayfa', href: 'index.html' }, { label: 'Sektörler' }])}<section class="content-section"><div class="section-heading"><p class="eyebrow">10 sektör · tek kanıt dili</p><h2>Sektörünüzü seçin, ilgili hizmet ve kaynağa birlikte ilerleyin</h2><p>Her sayfa sektörün operasyonel tetikleyicilerini, somut çıktıları, ölçüm seçeneklerini ve ücretsiz kaynağını ayrı içerikle ele alır.</p></div><div class="sector-index-grid">${cards}</div></section>${trustStrip()}</div>`;
  return page({
    site: content.site,
    file: 'sektorel-cozumler.html',
    title: 'Sektörel Çözümler',
    description: 'Üretimden sağlığa, tekstilden enerjiye on sektör için operasyonel risk, sistem, kanıt ve danışmanlık sayfaları.',
    bodyClass: 'sector-hub-page',
    heroHtml: hero('cozumler-hero-planlama', 'Sektörel çözümler', 'Sektörünüzün gerçek çalışma koşullarına göre ilerleyin', 'Genel hizmet listesi yerine, karar tetikleyicilerini ve beklenen kanıtı sektörünüzün diliyle görün.', '<div class="hero-actions"><a class="button primary" href="#main-content">Sektörleri inceleyin</a><a class="button secondary" href="on-gorusme.html">Ön görüşme</a></div>'),
    content: contentHtml,
    schema: [{ '@type': 'CollectionPage', name: 'Goway Sektörel Çözümler', url: `${baseUrl}/sektorel-cozumler.html`, hasPart: content.sectors.map((sector) => ({ '@type': 'WebPage', name: sector.title, url: `${baseUrl}/${sector.file}` })) }]
  });
}

function renderResourceHub(content) {
  const options = (key) => [...new Set(content.resources.map((item) => item[key]))].sort((a, b) => a.localeCompare(b, 'tr')).map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join('');
  const cards = content.resources.map((resource) => `<article class="resource-card" data-resource-card data-sector="${escapeHtml(resource.sector)}" data-standard="${escapeHtml(resource.standard)}" data-need="${escapeHtml(resource.need)}"><div class="resource-card-meta"><span>v${escapeHtml(resource.version)}</span><span>${escapeHtml(resource.updatedAt)}</span></div><h2>${escapeHtml(resource.title)}</h2><p>${escapeHtml(resource.summary)}</p><dl><div><dt>Sektör</dt><dd>${escapeHtml(resource.sector)}</dd></div><div><dt>Konu</dt><dd>${escapeHtml(resource.standard)}</dd></div><div><dt>İhtiyaç</dt><dd>${escapeHtml(resource.need)}</dd></div></dl><div class="resource-actions">${resource.files.map((file) => `<a class="button ${file.format === 'PDF' ? 'primary' : 'secondary'}" href="${escapeHtml(file.href)}" download data-resource-download="${escapeHtml(resource.slug)}">${escapeHtml(file.format)} indir</a>`).join('')}</div><small>Sahibi: ${escapeHtml(resource.owner)} · ${escapeHtml(resource.reviewer)}</small><a class="inline-link" href="${escapeHtml(resource.relatedService)}">İlgili hizmeti inceleyin →</a></article>`).join('');
  const contentHtml = `<div class="container">${breadcrumb([{ label: 'Ana Sayfa', href: 'index.html' }, { label: 'Kaynaklar' }])}<section class="content-section"><div class="section-heading"><p class="eyebrow">Ücretsiz ve uygulanabilir</p><h2>Kontrol listeleri, planlar ve çalışma kitapları</h2><p>Dosyalar bilgilendirme ve hazırlık amacı taşır; işletmeye özel mevzuat, uygunluk veya belgelendirme değerlendirmesinin yerine geçmez.</p></div><div class="resource-toolbar" aria-label="Kaynak filtreleri"><label>Sektör<select data-resource-filter="sector"><option value="">Tümü</option>${options('sector')}</select></label><label>Standart / konu<select data-resource-filter="standard"><option value="">Tümü</option>${options('standard')}</select></label><label>İhtiyaç<select data-resource-filter="need"><option value="">Tümü</option>${options('need')}</select></label></div><p class="resource-count" data-resource-count aria-live="polite"></p><div class="resource-grid">${cards}</div><p class="section-note" data-resource-empty hidden>Bu filtrelerle eşleşen kaynak bulunamadı. Filtrelerden birini temizleyin.</p></section>${trustStrip()}<section class="section-note sector-final-cta"><div><p class="eyebrow">Kaynağı işletmenize uyarlayın</p><h2>Kontrol listesindeki açığı çalışma planına dönüştürelim</h2></div><a class="button primary" href="on-gorusme.html?kaynak=kaynak-merkezi">Ön görüşme isteyin</a></section></div>`;
  const documents = content.resources.map((resource) => ({ '@type': 'DigitalDocument', name: resource.title, description: resource.summary, dateModified: resource.updatedAt, version: resource.version, encoding: resource.files.map((file) => ({ '@type': 'MediaObject', encodingFormat: file.format, contentUrl: `${baseUrl}/${file.href}` })) }));
  return page({
    site: content.site,
    file: 'kaynaklar.html',
    title: 'Kaynak Merkezi',
    description: 'ISO, İSG, enerji, acil durum ve tekstil hazırlığı için ücretsiz kontrol listeleri, planlar ve düzenlenebilir şablonlar.',
    bodyClass: 'resource-hub-page',
    heroHtml: hero('goway-hero-ambient', 'Kaynak merkezi', 'Karar toplantısına boş sayfayla girmeyin', 'Kontrol listelerini, planları ve çalışma kitaplarını indirin; mevcut durumunuzu daha somut verilerle değerlendirin.', '<div class="hero-actions"><a class="button primary" href="#main-content">Kaynakları filtreleyin</a><a class="button secondary" href="on-gorusme.html?kaynak=kaynak-merkezi">Uyarlama desteği alın</a></div>'),
    content: contentHtml,
    schema: [{ '@type': 'CollectionPage', name: 'Goway Kaynak Merkezi', url: `${baseUrl}/kaynaklar.html`, hasPart: documents }]
  });
}

function renderServiceCatalog(content) {
  const cards = content.site.services.map((service, index) => `<article class="service-card"><span class="service-number">${String(index + 1).padStart(2, '0')}</span><p class="eyebrow">${escapeHtml(service.category)}</p><h2>${escapeHtml(service.title)}</h2><p>${escapeHtml(service.summary)}</p><a class="button primary" href="${escapeHtml(service.href)}">Hizmeti inceleyin</a></article>`).join('');
  const contentHtml = `<div class="container">${breadcrumb([{ label: 'Ana Sayfa', href: 'index.html' }, { label: 'Hizmet Kataloğu' }])}<section class="content-section"><div class="section-heading"><p class="eyebrow">Veri tabanlı katalog</p><h2>İhtiyacınıza göre hizmet kapsamını seçin</h2></div><div class="service-grid">${cards}</div></section></div>`;
  return page({ site: content.site, file: 'hizmet-katalogu.html', title: 'Hizmet Kataloğu', description: 'Goway Danışmanlık hizmet kataloğu ve çalışma kapsamları.', bodyClass: 'services-page generated-page', heroHtml: hero('hizmetler-hero-endustriyel', 'Hizmet kataloğu', 'Danışmanlık hizmetlerini kapsam ve çıktıya göre karşılaştırın', 'Kapsam, teslimat ve doğru başlangıç adımını tek görünümde karşılaştırın.', '<div class="hero-actions"><a class="button primary" href="on-gorusme.html">Ücretsiz ön görüşme</a><a class="button secondary" href="sektorel-cozumler.html">Sektörel çözümler</a></div>'), content: contentHtml, schema: [{ '@type': 'ItemList', name: 'Goway Danışmanlık Hizmetleri', numberOfItems: content.site.services.length, itemListElement: content.site.services.map((service, index) => ({ '@type': 'ListItem', position: index + 1, name: service.title, url: `${baseUrl}/${service.href}` })) }] });
}

function renderCatalogRedirect(content) {
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="0;url=hizmet-katalogu.html"><meta name="description" content="Güncel Goway hizmet kataloğuna yönlendirme sayfası."><title>Güncel Hizmet Kataloğuna Yönlendirme | Goway Danışmanlık</title><link rel="stylesheet" href="site-pages.css"></head><body class="generated-page redirect-page">${header(content.site)}<main id="main-content"><div class="container"><section class="content-section section-note"><p class="eyebrow">Sayfa taşındı</p><h1>Güncel hizmet kataloğuna yönlendiriliyorsunuz</h1><p>Yönlendirme başlamazsa güncel hizmet kapsamlarını açın.</p><a class="button primary" href="hizmet-katalogu.html">Hizmet kataloğunu açın</a></section></div></main>${footer(content.site)}</body></html>`;
}

function renderCaseStudy(content, item) {
  const file = `vaka-${item.slug}.html`;
  const metricRows = (records) => records.map((record) => `<tr><th scope="row">${escapeHtml(record.label)}</th><td>${escapeHtml(record.value)}</td><td>${escapeHtml(record.period)}</td><td>${escapeHtml(record.method)}</td><td>${escapeHtml(record.source)}</td></tr>`).join('');
  const body = `<div class="container">${breadcrumb([{ label: 'Ana Sayfa', href: 'index.html' }, { label: 'Vaka Çalışmaları', href: 'referanslar.html' }, { label: item.title }])}
    <section class="content-section case-study-intro"><div><p class="eyebrow">Başlangıç durumu</p><h2>İşletme bağlamı ve problem</h2><p>${escapeHtml(item.context)}</p><p>${escapeHtml(item.challenge)}</p></div><aside><dl><div><dt>Sektör</dt><dd>${escapeHtml(item.sector)}</dd></div><div><dt>Çalışma dönemi</dt><dd>${escapeHtml(item.timeline)}</dd></div><div><dt>Son inceleme</dt><dd>${escapeHtml(item.reviewedAt)}</dd></div></dl></aside></section>
    <section class="content-section"><div class="section-heading"><p class="eyebrow">Müdahale</p><h2>Uygulanan çalışma ve teslimatlar</h2></div>${list(item.intervention)}</section>
    <section class="content-section"><div class="section-heading"><p class="eyebrow">Önce / sonra</p><h2>Kaynağı ve yöntemi açıklanmış ölçümler</h2></div><div class="table-shell"><table class="case-metric-table"><thead><tr><th>Gösterge</th><th>Değer</th><th>Dönem</th><th>Yöntem</th><th>Kaynak</th></tr></thead><tbody>${metricRows(item.baseline)}${metricRows(item.results)}</tbody></table></div><p class="case-limitations"><strong>Sınırlamalar:</strong> ${escapeHtml(item.limitations)}</p></section>
    ${item.quote ? `<blockquote class="case-quote"><p>“${escapeHtml(item.quote.text)}”</p><cite>${escapeHtml(item.quote.attribution)}</cite></blockquote>` : ''}
    ${trustStrip()}<section class="section-note sector-final-cta"><div><p class="eyebrow">Benzer bir ihtiyaç mı?</p><h2>Kapsamı ve ölçüm yöntemini birlikte tanımlayalım</h2></div><a class="button primary" href="on-gorusme.html?kaynak=${encodeURIComponent(item.slug)}">Ön görüşme isteyin</a></section></div>`;
  return page({ site: content.site, file, title: item.title, description: item.summary, bodyClass: 'case-study-page', heroHtml: hero(item.heroAsset || 'hizmetler-hero-endustriyel', 'Doğrulanmış vaka çalışması', item.title, item.summary), content: body, schema: [{ '@type': 'Article', headline: item.title, description: item.summary, dateModified: item.reviewedAt, publisher: { '@type': 'Organization', name: content.site.site.name }, mainEntityOfPage: `${baseUrl}/${file}` }] });
}

export function renderGeneratedPages(content) {
  const resourcesBySlug = new Map(content.resources.map((resource) => [resource.slug, resource]));
  const generated = new Map();
  generated.set('sektorel-cozumler.html', renderSectorHub(content));
  generated.set('kaynaklar.html', renderResourceHub(content));
  generated.set('hizmet-katalogu.html', renderServiceCatalog(content));
  generated.set('katalog.html', renderCatalogRedirect(content));
  for (const sector of content.sectors) {
    const resource = resourcesBySlug.get(sector.resourceSlug);
    if (!resource) throw new Error(`Sector ${sector.slug} references missing resource ${sector.resourceSlug}`);
    generated.set(sector.file, renderSectorPage(content, sector, resource));
  }
  for (const item of content.cases.filter((record) => record.status === 'approved' && record.permissionRecord)) generated.set(`vaka-${item.slug}.html`, renderCaseStudy(content, item));
  return generated;
}

export function createRuntimeConfig(content, endpoint = '') {
  return {
    site: content.site.site,
    slogans: content.site.slogans,
    navigation: {
      primary: content.site.navigation,
      servicePages: content.site.runtimeNavigation.servicePages,
      sectorPages: content.sectors.map((sector) => sector.file),
      resourcePages: ['kaynaklar.html']
    },
    heroes: content.site.heroes,
    services: content.site.services,
    sectors: content.sectors.map(({ slug, file, title }) => ({ slug, file, title })),
    trainingCatalog: content.site.trainingCatalog || [],
    forms: {
      provider: content.forms.provider,
      consultationEndpoint: endpoint || content.forms.consultationEndpoint || '',
      timeoutMs: content.forms.timeoutMs,
      minimumCompletionMs: content.forms.minimumCompletionMs,
      retentionNotice: content.forms.retentionNotice
    },
    approvedCases: content.cases.filter((item) => item.status === 'approved' && item.permissionRecord),
    approvedClients: content.clients.filter((item) => item.status === 'approved' && item.permissionRecord)
  };
}
