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
  const [site, sectors, resources, claims, analytics, services] = await Promise.all([
    readJson('site.json'),
    readJson('sectors.json'),
    readJson('resources.json'),
    readJson('claims.json'),
    readJson('analytics.json'),
    readJson('services.json')
  ]);
  return { site, sectors: sectors.sectors, resources: resources.resources, services: services.services, claims, analytics };
}

function header(site) {
  const links = site.navigation.map((item) => `<a href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a>`).join('');
  return `<div class="utility"><div class="container"><span>${escapeHtml(site.site.address)}</span><a href="${escapeHtml(site.site.phoneHref)}">${escapeHtml(site.site.phone)}</a></div></div>
  <header class="site-header"><div class="container nav-wrap">
    <a class="brand" href="index.html" aria-label="Goway Danışmanlık ana sayfa"><span class="brand-mark" aria-hidden="true"></span><span class="brand-copy"><strong>GOWAY</strong><span>DANIŞMANLIK</span></span></a>
    <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="site-navigation"><span></span><span></span><span></span><span class="visually-hidden">Menüyü aç</span></button>
    <nav class="page-nav" id="site-navigation" aria-label="Ana menü">${links}</nav>
    <div class="header-actions"><a class="button primary header-cta" href="on-gorusme.html">Ücretsiz Ön Görüşme</a></div>
  </div></header>`;
}

export const renderSharedHeader = header;

function footer(site) {
  return `<footer class="site-footer"><div class="container site-footer-inner">
    <section class="footer-brand-block" aria-label="Goway Danışmanlık"><div class="footer-brand-lockup"><img loading="lazy" decoding="async" width="80" height="72" class="footer-logo" src="goway-mark.png" alt=""><div class="footer-brand-copy"><strong>GOWAY</strong><span>Danışmanlık</span></div></div><p>ISO, İSG, çevre ve kurumsal gelişim ihtiyaçlarını uygulanabilir, izlenebilir ve sürdürülebilir çözümlere dönüştürüyoruz.</p></section>
    <section class="footer-contact-block" aria-label="İletişim"><h2>İletişim</h2><a href="${escapeHtml(site.site.phoneHref)}">${escapeHtml(site.site.phone)}</a><a href="${escapeHtml(site.site.emailHref)}">${escapeHtml(site.site.email)}</a><span>${escapeHtml(site.site.address)}</span></section>
  </div><div class="container footer-trust-badges" aria-label="Güven ve veri ilkeleri"><a class="footer-trust-badge" href="gizlilik-politikasi.html"><span aria-hidden="true">✓</span>Şifreli bağlantı</a><a class="footer-trust-badge" href="kvkk-aydinlatma-metni.html"><span aria-hidden="true">✓</span>KVKK bilgilendirmesi</a><a class="footer-trust-badge" href="gizlilik-politikasi.html#veri-minimizasyonu"><span aria-hidden="true">✓</span>Veri minimizasyonu</a></div><div class="container footer-legal-row"><span>© 2026 Goway Danışmanlık · Tüm hakları saklıdır.</span><nav class="site-footer-nav" aria-label="Yasal bağlantılar"><a href="kvkk-aydinlatma-metni.html">KVKK</a><a href="gizlilik-politikasi.html">Gizlilik</a><a href="cerez-politikasi.html">Çerezler</a><a href="kullanim-sartlari.html">Kullanım</a><a href="sss.html">SSS</a></nav></div></footer>`;
}

export const renderSharedFooter = footer;

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

function renderSectorPage(content, sector, resource) {
  const consultation = `on-gorusme.html?sektor=${encodeURIComponent(sector.slug)}&hizmet=${encodeURIComponent(sector.title)}`;
  const actions = `<div class="hero-actions"><a class="button primary" href="${consultation}">Sektör görüşmesi planlayın</a><a class="button secondary" href="#sektor-ciktilari">Çıktıları inceleyin</a></div>`;
  const process = sector.process.map((step, index) => `<article class="process-step"><span>${String(index + 1).padStart(2, '0')}</span><h3>${escapeHtml(step.label)}</h3><p>${escapeHtml(step.text)}</p></article>`).join('');
  const services = sector.services.map((service) => `<a class="service-path" href="${escapeHtml(service.href)}"><strong>${escapeHtml(service.label)}</strong><span>Hizmet kapsamını görün →</span></a>`).join('');
  const sectorTraining = [...new Set(sector.services.flatMap((service) => content.services.find((item) => item.file === service.href)?.trainingSlugs || []))]
    .map((slug) => (content.site.trainingCatalog || []).find((item) => item.slug === slug))
    .filter(Boolean)
    .slice(0, 6);
  const trainingCards = sectorTraining.map((item) => `<a class="service-path" href="egitim-katalog.html#training-${escapeHtml(item.slug)}"><strong>${escapeHtml(item.topic)}</strong><span>${escapeHtml(item.duration)} · ${escapeHtml(item.track)} →</span></a>`).join('');
  const trainingSection = trainingCards ? `<section class="content-section sector-training-section"><div class="section-heading"><p class="eyebrow">Sektöre uygun eğitimler</p><h2>Hizmet kapsamını ekibinizin görevlerine taşıyın</h2><p>Bu programlar, sektörünüzde öne çıkan hizmet bağlantılarına göre seçildi.</p></div><div class="service-path-grid">${trainingCards}</div></section>` : '';
  const faq = sector.faq.map((item, index) => `<details class="sector-faq"><summary>${escapeHtml(item.question)}</summary><div><p>${escapeHtml(item.answer)}</p></div></details>`).join('');
  const resourceLinks = resource.files.map((file) => `<a class="button ${file.format === 'PDF' ? 'primary' : 'secondary'}" href="${escapeHtml(file.href)}" download data-resource-download="${escapeHtml(resource.slug)}">${escapeHtml(file.format)} indir</a>`).join('');
  const contentHtml = `<div class="container sector-page-content">${breadcrumb([{ label: 'Ana Sayfa', href: 'index.html' }, { label: 'Sektörler', href: 'sektorel-cozumler.html' }, { label: sector.title }])}
    <section class="sector-snapshot" aria-labelledby="sektor-gundemi"><article><p class="eyebrow">Karar gündemi</p><h2 id="sektor-gundemi">Bu çalışma ne zaman gerekli?</h2>${list(sector.triggers)}</article><aside><p class="eyebrow">Kimlerle çalışırız?</p><h2>Operasyonun gerçek sahipleri</h2>${list(sector.buyers)}<div class="standard-row">${sector.standards.map((item) => `<span>${escapeHtml(item)}</span>`).join('')}</div></aside></section>
    <section class="content-section" id="sektor-ciktilari"><div class="section-heading"><p class="eyebrow">Somut teslimatlar</p><h2>Slogan değil, kullanılabilir kanıt üretin</h2><p>Çıktılar mevcut durum ve kapsam doğrulamasından sonra işletmeye uyarlanır.</p></div><div class="evidence-output-grid">${sector.outputs.map((item, index) => `<article><span>${String(index + 1).padStart(2, '0')}</span><p>${escapeHtml(item)}</p></article>`).join('')}</div></section>
    <section class="content-section process-section"><div class="section-heading"><p class="eyebrow">Uygulama akışı</p><h2>Saha fotoğrafından doğrulanmış sisteme</h2></div><div class="process-rail">${process}</div></section>
    <section class="content-section metric-section"><div class="section-heading"><p class="eyebrow">Ölçüm fırsatları</p><h2>Başlangıç değeri belirlendikten sonra izlenebilecek göstergeler</h2><p>Bunlar müşteri sonucu iddiası değildir; proje başında tanımı ve veri kaynağı doğrulanacak ölçüm seçenekleridir.</p></div>${list(sector.metrics, 'metric-list')}</section>
    <section class="content-section sector-next"><div><p class="eyebrow">İlgili hizmetler</p><h2>Tek bir sayfada kalmayın</h2><div class="service-path-grid">${services}</div></div><aside class="resource-feature"><span class="resource-format">Ücretsiz kaynak · ${escapeHtml(resource.version)}</span><h2>${escapeHtml(resource.title)}</h2><p>${escapeHtml(resource.summary)}</p><div class="hero-actions">${resourceLinks}</div><small>Son güncelleme: ${escapeHtml(resource.updatedAt)} · ${escapeHtml(resource.reviewer)}</small></aside></section>
    ${trainingSection}
    <section class="content-section"><div class="section-heading"><p class="eyebrow">Sık sorulanlar</p><h2>Kapsamı doğru beklentiyle başlatın</h2></div><div class="sector-faq-list">${faq}</div></section>
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

function renderServicePage(content, service, resource) {
  const consultation = `on-gorusme.html?hizmet=${encodeURIComponent(service.title)}`;
  const training = (content.site.trainingCatalog || []).filter((item) => service.trainingSlugs?.includes(item.slug));
  const resourceLinks = resource.files.map((file) => `<a class="button ${file.format === 'PDF' ? 'primary' : 'secondary'}" href="${escapeHtml(file.href)}" download data-resource-download="${escapeHtml(resource.slug)}">${escapeHtml(file.format)} indir</a>`).join('');
  const process = [
    { label: 'Mevcut durum', text: 'Süreç, saha, sorumluluk ve mevcut kayıt örnekleri birlikte okunur.' },
    { label: 'Öncelik', text: 'Kritik risk, hedef tarih ve uygulanabilir ilk adımlar kapsam içinde sıralanır.' },
    { label: 'Uygulama', text: 'Kontroller, çalışma araçları, eğitim ve sorumluluklar gerçek iş akışına yerleştirilir.' },
    { label: 'Doğrulama', text: 'Gözlem, ölçüm, iç tetkik veya prova ile uygulamanın çalıştığı görülür.' }
  ].map((step, index) => `<article class="process-step"><span>${String(index + 1).padStart(2, '0')}</span><h3>${escapeHtml(step.label)}</h3><p>${escapeHtml(step.text)}</p></article>`).join('');
  const trainingCards = training.map((item) => `<a class="service-path" href="egitim-katalog.html#training-${escapeHtml(item.slug)}"><strong>${escapeHtml(item.topic)}</strong><span>${escapeHtml(item.duration)} · ayrıntıları görün →</span></a>`).join('');
  const sectorCards = (service.sectorLinks || []).map((href) => {
    const sector = content.sectors.find((item) => item.file === href);
    return sector ? `<a class="service-path" href="${escapeHtml(href)}"><strong>${escapeHtml(sector.title)}</strong><span>Sektör yol haritasını görün →</span></a>` : '';
  }).join('');
  const siblingCards = (service.siblingServices || []).map((href) => {
    const sibling = content.services.find((item) => item.file === href);
    return sibling ? `<a class="service-path" href="${escapeHtml(href)}"><strong>${escapeHtml(sibling.title)}</strong><span>Hizmet kapsamını görün →</span></a>` : '';
  }).join('');
  const faq = service.faq.map((item) => `<details class="sector-faq"><summary>${escapeHtml(item.question)}</summary><div><p>${escapeHtml(item.answer)}</p></div></details>`).join('');
  const trainingSection = trainingCards ? `<section class="content-section service-next"><div class="section-heading"><p class="eyebrow">İlgili eğitim</p><h2>Uygulamayı ekibinize taşıyın</h2><p>Programlar hedef görev, seviye ve ölçüm yöntemiyle birlikte seçilir.</p></div><div class="service-path-grid">${trainingCards}</div></section>` : '';
  const sectorSection = sectorCards ? `<section class="content-section service-next"><div class="section-heading"><p class="eyebrow">Sektörel bağlantı</p><h2>Bu kapsam hangi sahalarda karşılık bulur?</h2></div><div class="service-path-grid">${sectorCards}</div></section>` : '';
  const siblingSection = siblingCards ? `<section class="content-section service-next"><div class="section-heading"><p class="eyebrow">Bir sonraki bağlantı</p><h2>İlgili hizmetleri birlikte düşünün</h2></div><div class="service-path-grid">${siblingCards}</div></section>` : '';
  const customSections = (service.customSections || []).map((section, index) => {
    const items = (section.items || []).map((item) => `<li>${escapeHtml(item)}</li>`).join('');
    const links = (section.links || []).map((link) => `<a class="inline-link" href="${escapeHtml(link.href)}">${escapeHtml(link.label)} →</a>`).join('');
    const table = section.table ? `<div class="comparison-table-wrap"><table class="comparison-table"><thead><tr>${section.table.headers.map((header) => `<th scope="col">${escapeHtml(header)}</th>`).join('')}</tr></thead><tbody>${section.table.rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` : '';
    return `<section class="content-section service-custom-section" aria-labelledby="custom-${escapeHtml(service.slug)}-${index}"><div class="section-heading"><p class="eyebrow">${escapeHtml(section.eyebrow || 'Uygulama notu')}</p><h2 id="custom-${escapeHtml(service.slug)}-${index}">${escapeHtml(section.title)}</h2><p>${escapeHtml(section.intro || '')}</p></div>${items ? `<ul class="metric-list">${items}</ul>` : ''}${table}${links ? `<div class="hero-actions">${links}</div>` : ''}</section>`;
  }).join('');
  const trainingEcosystem = service.slug === 'kurumsal-egitim' ? `<section class="content-section service-next"><div class="section-heading"><p class="eyebrow">Eğitim ekosistemi</p><h2>Programı seçin, uygulamayı takip edin</h2><p>Katalog, açık takvim, online format ve 30/60/90 gün takip adımları aynı öğrenme akışında.</p></div><div class="service-path-grid"><a class="service-path" href="egitim-katalog.html"><strong>Eğitim kataloğu</strong><span>Track ve ölçüm seçeneklerini filtreleyin →</span></a><a class="service-path" href="egitim-takvimi.html"><strong>Açık eğitim takvimi</strong><span>Talep penceresine kayıt bırakın →</span></a><a class="service-path" href="egitim-online.html"><strong>E-öğrenme / hibrit</strong><span>LMS ve modül önizlemesini görün →</span></a><a class="service-path" href="egitim-takip.html"><strong>Eğitim sonrası takip</strong><span>30/60/90 gün etkinlik raporunu inceleyin →</span></a></div></section>` : '';
  const contentHtml = `<div class="container service-page-content">${breadcrumb([{ label: 'Ana Sayfa', href: 'index.html' }, { label: 'Hizmetler', href: 'hizmetler.html' }, { label: service.title }])}
    <section class="service-snapshot" aria-labelledby="hizmet-kapsam"><article><p class="eyebrow">Kapsam</p><h2 id="hizmet-kapsam">Bu çalışma ne zaman gerekli?</h2>${list(service.scope)}</article><aside><p class="eyebrow">İlk görüşme verisi</p><h2>Başlangıcı netleştirin</h2>${list(service.firstStepData)}<div class="standard-row"><span>${escapeHtml(service.category || 'Uygulanabilir hazırlık')}</span><span>Kanıt odaklı</span></div></aside></section>
    <section class="content-section" id="hizmet-ciktilari"><div class="section-heading"><p class="eyebrow">Somut teslimatlar</p><h2>Slogan değil, kullanılabilir çıktı üretin</h2><p>Çıktılar mevcut durum ve kapsam doğrulamasından sonra işletmeye uyarlanır.</p></div><div class="evidence-output-grid">${service.deliverables.map((item, index) => `<article><span>${String(index + 1).padStart(2, '0')}</span><p>${escapeHtml(item)}</p></article>`).join('')}</div></section>
    <section class="content-section process-section"><div class="section-heading"><p class="eyebrow">Uygulama akışı</p><h2>İlk veriden doğrulanmış uygulamaya</h2></div><div class="process-rail">${process}</div></section>
    <section class="content-section metric-section"><div class="section-heading"><p class="eyebrow">Ölçüm fırsatları</p><h2>Başlangıç değeri belirlendikten sonra izlenebilecek göstergeler</h2><p>Bunlar müşteri sonucu iddiası değildir; proje başında tanımı ve veri kaynağı doğrulanacak ölçüm seçenekleridir.</p></div>${list(service.metrics, 'metric-list')}</section>
    ${customSections}${trainingSection}${trainingEcosystem}${sectorSection}${siblingSection}
    <section class="content-section service-next"><div class="section-heading"><p class="eyebrow">Ücretsiz kaynak</p><h2>İlk çalışma sayfasını indirin</h2></div><aside class="resource-feature"><span class="resource-format">Ücretsiz kaynak · v${escapeHtml(resource.version)} → PDF indir</span><h2>${escapeHtml(resource.title)}</h2><p>${escapeHtml(resource.summary)}</p><div class="hero-actions">${resourceLinks}</div><small>Son güncelleme: ${escapeHtml(resource.updatedAt)} · ${escapeHtml(resource.reviewer)}</small></aside></section>
    <section class="content-section"><div class="section-heading"><p class="eyebrow">Sık sorulanlar</p><h2>Kapsamı doğru beklentiyle başlatın</h2></div><div class="sector-faq-list">${faq}</div></section>
    <section class="section-note sector-final-cta"><div><p class="eyebrow">15 dakikalık başlangıç</p><h2>İhtiyacınızı ve ilk veriyi birlikte netleştirelim</h2><p>Lokasyon, hedef tarih, mevcut kayıt ve öncelikli riski paylaşın; ilk çalışma kapsamını konuşalım.</p></div><a class="button primary" href="${consultation}">Ön görüşme talebi oluşturun</a></section>
  </div>`;
  const canonical = `${baseUrl}/${service.file}`;
  const faqSchema = { '@type': 'FAQPage', mainEntity: service.faq.map((item) => ({ '@type': 'Question', name: item.question, acceptedAnswer: { '@type': 'Answer', text: item.answer } })) };
  return page({
    site: content.site,
    file: service.file,
    title: service.title,
    description: service.summary,
    bodyClass: `service-page service-${service.slug}`,
    heroHtml: hero(service.heroAsset, service.eyebrow, service.title, service.summary, `<div class="hero-actions"><a class="button primary" href="${consultation}">Ön görüşme planlayın</a><a class="button secondary" href="#hizmet-ciktilari">Çıktıları inceleyin</a></div>`),
    content: contentHtml,
    schema: [
      { '@type': 'Service', name: service.title, url: canonical, provider: { '@type': 'Organization', name: content.site.site.name }, areaServed: { '@type': 'Country', name: 'Türkiye' } },
      faqSchema,
      { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: `${baseUrl}/` }, { '@type': 'ListItem', position: 2, name: 'Hizmetler', item: `${baseUrl}/hizmetler.html` }, { '@type': 'ListItem', position: 3, name: service.title, item: canonical }] }
    ]
  });
}

function renderSectorHub(content) {
  const cards = content.sectors.map((sector, index) => `<article class="sector-index-card"><span>${String(index + 1).padStart(2, '0')}</span><h2>${escapeHtml(sector.title)}</h2><p>${escapeHtml(sector.summary)}</p><div class="standard-row">${sector.standards.slice(0, 3).map((item) => `<small>${escapeHtml(item)}</small>`).join('')}</div><a class="button primary" href="${escapeHtml(sector.file)}">Sektör sayfasını açın</a></article>`).join('');
  const contentHtml = `<div class="container">${breadcrumb([{ label: 'Ana Sayfa', href: 'index.html' }, { label: 'Sektörler' }])}<section class="content-section"><div class="section-heading"><p class="eyebrow">10 sektör · tek kanıt dili</p><h2>Sektörünüzü seçin, ilgili hizmet ve kaynağa birlikte ilerleyin</h2><p>Her sayfa sektörün operasyonel tetikleyicilerini, somut çıktıları, ölçüm seçeneklerini ve ücretsiz kaynağını ayrı içerikle ele alır.</p></div><div class="sector-index-grid">${cards}</div></section></div>`;
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
  const cards = content.resources.map((resource) => `<article id="resource-${escapeHtml(resource.slug)}" class="resource-card" data-resource-card data-sector="${escapeHtml(resource.sector)}" data-standard="${escapeHtml(resource.standard)}" data-need="${escapeHtml(resource.need)}"><div class="resource-card-meta"><span>v${escapeHtml(resource.version)}</span><span>${escapeHtml(resource.updatedAt)}</span></div><h2>${escapeHtml(resource.title)}</h2><p>${escapeHtml(resource.summary)}</p><dl><div><dt>Sektör</dt><dd>${escapeHtml(resource.sector)}</dd></div><div><dt>Konu</dt><dd>${escapeHtml(resource.standard)}</dd></div><div><dt>İhtiyaç</dt><dd>${escapeHtml(resource.need)}</dd></div></dl><div class="resource-actions">${resource.files.map((file) => `<a class="button ${file.format === 'PDF' ? 'primary' : 'secondary'}" href="${escapeHtml(file.href)}" download data-resource-download="${escapeHtml(resource.slug)}">${escapeHtml(file.format)} indir</a>`).join('')}</div><small>Sahibi: ${escapeHtml(resource.owner)} · ${escapeHtml(resource.reviewer)}</small><a class="inline-link" href="${escapeHtml(resource.relatedService)}">İlgili hizmeti inceleyin →</a></article>`).join('');
  const contentHtml = `<div class="container">${breadcrumb([{ label: 'Ana Sayfa', href: 'index.html' }, { label: 'Kaynaklar' }])}<section class="content-section"><div class="section-heading"><p class="eyebrow">Ücretsiz ve uygulanabilir</p><h2>Kontrol listeleri, planlar ve çalışma kitapları</h2><p>Dosyalar bilgilendirme ve hazırlık amacı taşır; işletmeye özel mevzuat, uygunluk veya belgelendirme değerlendirmesinin yerine geçmez.</p></div><div class="resource-toolbar" aria-label="Kaynak filtreleri"><label>Sektör<select data-resource-filter="sector"><option value="">Tümü</option>${options('sector')}</select></label><label>Standart / konu<select data-resource-filter="standard"><option value="">Tümü</option>${options('standard')}</select></label><label>İhtiyaç<select data-resource-filter="need"><option value="">Tümü</option>${options('need')}</select></label></div><p class="resource-count" data-resource-count aria-live="polite"></p><div class="resource-grid">${cards}</div><p class="section-note" data-resource-empty hidden>Bu filtrelerle eşleşen kaynak bulunamadı. Filtrelerden birini temizleyin.</p></section><section class="section-note sector-final-cta"><div><p class="eyebrow">Kaynağı işletmenize uyarlayın</p><h2>Kontrol listesindeki açığı çalışma planına dönüştürelim</h2></div><a class="button primary" href="on-gorusme.html?kaynak=kaynak-merkezi">Ön görüşme isteyin</a></section></div>`;
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

function renderTrainingCatalog(content) {
  const catalog = content.site.trainingCatalog || [];
  const options = (key) => [...new Set(catalog.map((item) => item[key]).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'tr')).map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join('');
  const rows = catalog.map((item) => `<tr id="training-${escapeHtml(item.slug)}" data-training-row data-track="${escapeHtml(item.track)}" data-sector="${escapeHtml(item.sector)}" data-level="${escapeHtml(item.level)}"><th scope="row"><strong>${escapeHtml(item.topic)}</strong><small>${escapeHtml(item.track)}</small></th><td>${escapeHtml(item.duration)}</td><td>${escapeHtml(item.audience)}</td><td>${escapeHtml(item.level)}</td><td>${escapeHtml(item.nextDate)}</td><td><a href="${escapeHtml(item.relatedService)}">Hizmet</a></td></tr><tr class="training-detail-row"><td colspan="6"><details><summary>Program ayrıntıları</summary><div class="training-detail-grid"><p><strong>Kazanımlar</strong><span>${(item.outcomes || []).map(escapeHtml).join(' · ')}</span></p><p><strong>Ön koşul</strong><span>${escapeHtml(item.prerequisites || 'İşletme kapsamına göre')}</span></p><p><strong>Ölçüm</strong><span>${escapeHtml(item.measurement || 'Ön/son ölçüm ve uygulama gözlemi')}</span></p><p><strong>Format</strong><span>${escapeHtml(item.format || 'Yüz yüze veya canlı uzaktan')}</span></p></div></details></td></tr>`).join('');
  const scriptData = escapeJson(catalog);
  const contentHtml = `<div class="container">${breadcrumb([{ label: 'Ana Sayfa', href: 'index.html' }, { label: 'Eğitim Kataloğu' }])}<section id="katalog" class="content-section"><div class="section-heading"><p class="eyebrow">Filtrelenebilir eğitim portföyü</p><h2>İhtiyaca göre seçilen, sahada ölçülen eğitimler</h2><p>Programlar track, sektör, seviye ve çalışma formatına göre filtrelenir. Tarihler açık takvim veya talep penceresi olarak gösterilir.</p></div><div class="training-toolbar" aria-label="Eğitim filtreleri"><label>Track<select data-training-filter="track"><option value="">Tümü</option>${options('track')}</select></label><label>Sektör<select data-training-filter="sector"><option value="">Tümü</option>${options('sector')}</select></label><label>Seviye<select data-training-filter="level"><option value="">Tümü</option>${options('level')}</select></label></div><p class="resource-count" data-training-count aria-live="polite"></p><div class="training-table-wrap"><table class="training-table"><caption class="visually-hidden">Goway eğitim portföyü</caption><thead><tr><th>Konu</th><th>Süre</th><th>Hedef kitle</th><th>Seviye</th><th>Takvim</th><th>Bağlantı</th></tr></thead><tbody>${rows}</tbody></table></div></section><section class="content-section section-note"><div class="content-grid three"><div><p><strong>Kurumsal program</strong></p><p>10+ kişilik ekipler için gerçek görev, saha vakası ve takip ritmiyle tasarlayın.</p><a class="button primary" href="kurumsal-egitim.html">Kurumsal eğitim</a></div><div><p><strong>Açık takvim</strong></p><p>Çeyrek penceresinde talep bırakın; tarih ve formatı birlikte netleştirelim.</p><a class="button secondary" href="egitim-takvimi.html#kayit">Takvim talebi</a></div><div><p><strong>Danışmanlık bağlantısı</strong></p><p>Her program ilgili hizmet sayfasına ve ön görüşme akışına bağlanır.</p><a class="button secondary" href="on-gorusme.html?hizmet=Kurumsal%20E%C4%9Fitim">Ön görüşme</a></div></div></section></div><script type="application/json" id="training-data">${scriptData}</script><script>window.addEventListener('DOMContentLoaded',()=>{const rows=[...document.querySelectorAll('[data-training-row]')],details=[...document.querySelectorAll('.training-detail-row')],filters=[...document.querySelectorAll('[data-training-filter]')],count=document.querySelector('[data-training-count]');const render=()=>{const active=Object.fromEntries(filters.map(x=>[x.dataset.trainingFilter,x.value]));let n=0;rows.forEach((row,i)=>{const ok=Object.entries(active).every(([k,v])=>!v||row.dataset[k]===v);row.hidden=!ok;details[i].hidden=!ok;if(ok)n++});count.textContent=n+' program gösteriliyor'};filters.forEach(x=>x.addEventListener('change',render));render()});</script>`;
  const courses = catalog.map((item) => {
    const instance = { '@type': 'CourseInstance', courseMode: item.format, inLanguage: 'tr-TR', name: item.topic };
    if (item.scheduledDate) instance.startDate = item.scheduledDate;
    return { '@type': 'Course', name: item.topic, description: (item.outcomes || []).join('. '), provider: { '@type': 'Organization', name: content.site.site.name }, hasCourseInstance: instance };
  });
  const events = catalog.filter((item) => item.scheduledDate).map((item) => ({ '@type': 'Event', name: item.topic, startDate: item.scheduledDate, eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode', organizer: { '@type': 'Organization', name: content.site.site.name } }));
  return page({ site: content.site, file: 'egitim-katalog.html', title: 'Eğitim Kataloğu', description: 'İSG, ISO, saha, tekstil ve çevre eğitimlerini track, seviye ve ölçüm yöntemiyle keşfedin.', bodyClass: 'training-page generated-page', heroHtml: hero('goway-hero-ambient', 'Eğitim kataloğu', 'Bilgiyi görev performansına dönüştürün', 'İSG, ISO, saha, tekstil ve çevre programlarını hedef kitle, format ve ölçüm yöntemiyle seçin.', '<div class="hero-actions"><a class="button primary" href="#katalog">Kataloğu filtreleyin</a><a class="button secondary" href="kurumsal-egitim.html">Kurumsal program</a></div>'), content: contentHtml, schema: [...courses, ...events] });
}

function renderTrainingFollowup(content) {
  const resource = content.resources.find((item) => item.slug === '30-60-90-egitim-etkinlik-raporu');
  if (!resource) throw new Error('Training follow-up references missing resource 30-60-90-egitim-etkinlik-raporu');
  const links = resource.files.map((file) => `<a class="button ${file.format === 'PDF' ? 'primary' : 'secondary'}" href="${escapeHtml(file.href)}" download data-resource-download="${escapeHtml(resource.slug)}">${escapeHtml(file.format)} indir</a>`).join('');
  const contentHtml = `<div class="container">${breadcrumb([{ label: 'Ana Sayfa', href: 'index.html' }, { label: 'Eğitim Takibi' }])}<section class="content-section"><div class="section-heading"><p class="eyebrow">Takip ritmi</p><h2>30/60/90 gün ile öğrenmeyi sahada doğrulayın</h2></div><div class="content-grid three"><article class="evidence-card"><span class="service-number">30</span><h3>Gün · uygulama görevi</h3><p>Katılımcı öğrendiği yöntemi gerçek görevinde uygular; kayıt, fotoğraf veya kısa form ile kanıtlar.</p></article><article class="evidence-card"><span class="service-number">60</span><h3>Gün · yönetici gözlemi</h3><p>Yönetici davranış, kontrol kalitesi ve ekip katılımını gözlem formuyla değerlendirir.</p></article><article class="evidence-card"><span class="service-number">90</span><h3>Gün · etkinlik raporu</h3><p>Ön/son ölçüm, saha bulguları ve aksiyon kapanışları bir sonraki öğrenme ihtiyacına bağlanır.</p></article></div></section><section class="content-section detail-layout"><article class="content-card"><p class="eyebrow">Teslimatlar</p><h2>Yönetimin görebileceği eğitim etkinliği</h2><ul><li>30/60/90 gün görev ve kanıt takvimi</li><li>Rol bazlı yönetici gözlem formu</li><li>Katılım, tamamlama ve değerlendirme özeti</li><li>Etkinlik raporu ve yeni aksiyon önerileri</li></ul></article><aside class="aside-card"><p class="eyebrow">Ücretsiz kaynak · v${escapeHtml(resource.version)} → PDF indir</p><h3>${escapeHtml(resource.title)}</h3><p>${escapeHtml(resource.summary)}</p><div class="hero-actions">${links}</div><a class="button primary" href="kurumsal-egitim.html">Eğitimi takip programına bağlayın</a></aside></section></div>`;
  return page({ site: content.site, file: 'egitim-takip.html', title: 'Eğitim Sonrası Takip', description: 'Kurumsal eğitim sonrası 30, 60 ve 90 gün uygulama takibi ve etkinlik raporu.', bodyClass: 'training-followup-page generated-page', heroHtml: hero('goway-hero-ambient', 'Eğitim sonrası takip', 'Öğrenme sınıfta değil, uygulamada tamamlanır', '30/60/90 gün görevleri, yönetici gözlemi ve etkinlik raporuyla eğitim yatırımının sahadaki karşılığını izleyin.'), content: contentHtml, schema: [{ '@type': 'LearningResource', name: resource.title, url: `${baseUrl}/assets/downloads/30-60-90-egitim-etkinlik-raporu-v1.pdf` }] });
}

function renderServiceCatalog(content) {
  const cards = content.services.map((service, index) => `<article class="service-card"><span class="service-number">${String(index + 1).padStart(2, '0')}</span><p class="eyebrow">${escapeHtml(service.category || service.eyebrow || 'Hizmet')}</p><h2>${escapeHtml(service.title)}</h2><p>${escapeHtml(service.summary)}</p><a class="button primary" href="${escapeHtml(service.file)}">Hizmeti inceleyin</a></article>`).join('');
  const contentHtml = `<div class="container">${breadcrumb([{ label: 'Ana Sayfa', href: 'index.html' }, { label: 'Hizmet Kataloğu' }])}<section class="content-section"><div class="section-heading"><p class="eyebrow">Veri tabanlı katalog</p><h2>İhtiyacınıza göre hizmet kapsamını seçin</h2></div><div class="service-grid">${cards}</div></section></div>`;
  return page({ site: content.site, file: 'hizmet-katalogu.html', title: 'Hizmet Kataloğu', description: 'Goway Danışmanlık hizmet kataloğu ve çalışma kapsamları.', bodyClass: 'services-page generated-page', heroHtml: hero('hizmetler-hero-endustriyel', 'Hizmet kataloğu', 'Danışmanlık hizmetlerini kapsam ve çıktıya göre karşılaştırın', 'Kapsam, teslimat ve doğru başlangıç adımını tek görünümde karşılaştırın.', '<div class="hero-actions"><a class="button primary" href="on-gorusme.html">Ücretsiz ön görüşme</a><a class="button secondary" href="sektorel-cozumler.html">Sektörel çözümler</a></div>'), content: contentHtml, schema: [{ '@type': 'ItemList', name: 'Goway Danışmanlık Hizmetleri', numberOfItems: content.services.length, itemListElement: content.services.map((service, index) => ({ '@type': 'ListItem', position: index + 1, name: service.title, url: `${baseUrl}/${service.file}` })) }] });
}

function renderCatalogRedirect(content) {
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="0;url=hizmet-katalogu.html"><meta name="description" content="Güncel Goway hizmet kataloğuna yönlendirme sayfası."><title>Güncel Hizmet Kataloğuna Yönlendirme | Goway Danışmanlık</title><link rel="stylesheet" href="site-pages.css"></head><body class="generated-page redirect-page">${header(content.site)}<main id="main-content"><div class="container"><section class="content-section section-note"><p class="eyebrow">Sayfa taşındı</p><h1>Güncel hizmet kataloğuna yönlendiriliyorsunuz</h1><p>Yönlendirme başlamazsa güncel hizmet kapsamlarını açın.</p><a class="button primary" href="hizmet-katalogu.html">Hizmet kataloğunu açın</a></section></div></main>${footer(content.site)}</body></html>`;
}

export function renderGeneratedPages(content) {
  const resourcesBySlug = new Map(content.resources.map((resource) => [resource.slug, resource]));
  const generated = new Map();
  generated.set('sektorel-cozumler.html', renderSectorHub(content));
  generated.set('kaynaklar.html', renderResourceHub(content));
  generated.set('hizmet-katalogu.html', renderServiceCatalog(content));
  generated.set('katalog.html', renderCatalogRedirect(content));
  generated.set('egitim-katalog.html', renderTrainingCatalog(content));
  generated.set('egitim-takip.html', renderTrainingFollowup(content));
  for (const sector of content.sectors) {
    const resource = resourcesBySlug.get(sector.resourceSlug);
    if (!resource) throw new Error(`Sector ${sector.slug} references missing resource ${sector.resourceSlug}`);
    generated.set(sector.file, renderSectorPage(content, sector, resource));
  }
  const reservedRoutes = new Set(['sektorel-cozumler.html', 'kaynaklar.html', 'hizmet-katalogu.html', 'katalog.html', 'egitim-katalog.html', 'egitim-takip.html']);
  for (const service of content.services) {
    if (reservedRoutes.has(service.file)) continue;
    const resource = resourcesBySlug.get(service.resourceSlug);
    if (!resource) throw new Error(`Service ${service.slug} references missing resource ${service.resourceSlug}`);
    generated.set(service.file, renderServicePage(content, service, resource));
  }
  return generated;
}

export function createRuntimeConfig(content) {
  return {
    site: content.site.site,
    slogans: content.site.slogans,
    navigation: {
      primary: content.site.navigation,
      servicePages: content.site.runtimeNavigation.servicePages,
      sectorPages: content.sectors.map((sector) => sector.file),
      resourcePages: ['kaynaklar.html']
    }
  };
}

export function createTrainingRuntimeConfig(content) {
  return { trainingCatalog: content.site.trainingCatalog || [] };
}
