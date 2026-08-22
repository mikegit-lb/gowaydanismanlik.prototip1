import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const baseUrl = 'https://www.gowaydanismanlik.com';
const data = JSON.parse(await fs.readFile(path.join(root, 'data', 'site.json'), 'utf8'));
const serviceFiles = new Map(data.services.map((service) => [service.href, service]));
const excluded = new Set(['404.html', 'cerez-politikasi.html', 'gizlilik-politikasi.html', 'kvkk-aydinlatma-metni.html', 'kullanim-sartlari.html']);
const organization = { '@type': 'Organization', '@id': baseUrl + '/#organization', name: data.site.name, url: baseUrl + '/', telephone: data.site.phone, email: data.site.email, address: { '@type': 'PostalAddress', addressLocality: 'Denizli', addressCountry: 'TR' } };
const localBusiness = { '@type': 'LocalBusiness', '@id': baseUrl + '/#localbusiness', name: data.site.name, url: baseUrl + '/', telephone: data.site.phone, email: data.site.email, address: { '@type': 'PostalAddress', addressLocality: 'Denizli', addressCountry: 'TR' }, areaServed: { '@type': 'Country', name: 'Türkiye' }, parentOrganization: { '@id': baseUrl + '/#organization' } };
const canonical = (file) => file === 'index.html' ? baseUrl + '/' : baseUrl + '/' + file;
const schemaScript = (graph) => '<script type="application/ld+json" data-seo-schema>' + JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }) + '</script>';

function serviceSchema(file, service) {
  return { '@type': 'Service', '@id': canonical(file) + '#service', name: service.title, description: service.summary, url: canonical(file), serviceType: service.category, provider: { '@id': baseUrl + '/#organization' }, areaServed: { '@type': 'Country', name: 'Türkiye' } };
}

async function injectPage(file, service) {
  const full = path.join(root, file);
  let html = await fs.readFile(full, 'utf8');
  html = html.replace(/\s*<script type="application\/ld\+json" data-seo-schema>[\s\S]*?<\/script>\s*/g, '\n');
  html = html.replace(/<link rel="alternate" hreflang="[^"]+" href="[^"]+">\s*/g, '');
  if (!html.includes('href="' + canonical(file) + '"')) html = html.replace('</head>', '  <link rel="canonical" href="' + canonical(file) + '">\n</head>');
  if (file === 'hizmetler.html') {
    const itemList = { '@context': 'https://schema.org', '@type': 'ItemList', name: 'Goway Danışmanlık Hizmetleri', url: canonical(file), numberOfItems: data.services.length, itemListElement: data.services.map((item, index) => ({ '@type': 'ListItem', position: index + 1, name: item.title, url: canonical(item.href) })) };
    html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, '<script type="application/ld+json">' + JSON.stringify(itemList) + '</script>');
  }
  const graph = service ? [organization, localBusiness, serviceSchema(file, service)] : [organization, localBusiness];
  if (data.localization?.enabled && data.localization.locales?.length) {
    const alternates = data.localization.locales.map((locale) => '<link rel="alternate" hreflang="' + locale.code + '" href="' + locale.url + '">').join('');
    html = html.replace('</head>', alternates + '</head>');
  }
  html = html.replace('</head>', '  ' + schemaScript(graph) + '\n</head>');
  await fs.writeFile(full, html);
}

async function injectFaqSchema() {
  const file = 'sss.html';
  const full = path.join(root, file);
  let html = await fs.readFile(full, 'utf8');
  const items = [...html.matchAll(/<article[^>]*class="service-card"[^>]*>[\s\S]*?<h3>([\s\S]*?)<\/h3>[\s\S]*?<p>([\s\S]*?)<\/p>/g)].map((match) => ({
    '@type': 'Question',
    name: match[1].replace(/<[^>]+>/g, '').trim(),
    acceptedAnswer: { '@type': 'Answer', text: match[2].replace(/<[^>]+>/g, '').trim() }
  }));
  if (items.length !== 18) throw new Error('Expected 18 visible FAQs, found ' + items.length);
  const schema = '<script type="application/ld+json">' + JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: items }) + '</script>';
  html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, schema);
  await fs.writeFile(full, html);
}

async function writeSitemap() {
  const files = (await fs.readdir(root)).filter((file) => file.endsWith('.html') && !excluded.has(file) && file !== '404.html');
  if (!files.includes('hizmet-katalogu.html')) files.push('hizmet-katalogu.html');
  const unique = [...new Set(files)].sort((a, b) => a === 'index.html' ? -1 : b === 'index.html' ? 1 : a.localeCompare(b));
  const priority = (file) => file === 'index.html' ? '1.0' : ['hizmetler.html', 'hizmet-katalogu.html', 'on-gorusme.html'].includes(file) ? '0.9' : serviceFiles.has(file) ? '0.8' : '0.7';
  const urls = unique.map((file) => '<url><loc>' + canonical(file) + '</loc><lastmod>2026-08-23</lastmod><priority>' + priority(file) + '</priority></url>').join('\n  ');
  await fs.writeFile(path.join(root, 'sitemap.xml'), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  ' + urls + '\n</urlset>\n');
  if (unique.length !== 31) throw new Error('Expected 31 indexable URLs, found ' + unique.length);
  console.log('Sitemap verified:', unique.length, 'URLs');
}

for (const file of [...serviceFiles.keys(), 'hizmetler.html']) await injectPage(file, serviceFiles.get(file));
await injectFaqSchema();
await writeSitemap();
