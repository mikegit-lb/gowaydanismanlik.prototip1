import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataFile = path.join(root, 'data', 'site.json');
const templates = path.join(root, 'templates');
const output = path.join(root, 'hizmet-katalogu.html');
const escapeHtml = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
const render = (template, values) => template.replace(/{{\s*([\w]+)\s*}}/g, (_, key) => values[key] ?? '');
const read = (file) => fs.readFile(file, 'utf8');

async function main() {
  const site = JSON.parse(await read(dataFile));
  if (!site.site?.phone || !site.site?.email || !site.site?.address) throw new Error('site.phone, site.email and site.address are required');
  if (!Array.isArray(site.navigation) || site.navigation.length === 0) throw new Error('navigation must contain at least one item');
  if (!Array.isArray(site.services) || site.services.length === 0) throw new Error('services must contain at least one item');
  if (!site.heroes?.['hizmetler.html']?.asset) throw new Error('heroes.hizmetler.html.asset is required');
  const [layout, header, footer, hero, page, card] = await Promise.all([
    read(path.join(templates, 'layout.html')),
    read(path.join(templates, 'partials', 'header.html')),
    read(path.join(templates, 'partials', 'footer.html')),
    read(path.join(templates, 'partials', 'hero.html')),
    read(path.join(templates, 'pages', 'service-catalog.html')),
    read(path.join(templates, 'partials', 'service-card.html'))
  ]);
  const navigation = site.navigation.map((item) => '<a href="' + escapeHtml(item.href) + '">' + escapeHtml(item.label) + '</a>').join('');
  const common = { phone: escapeHtml(site.site.phone), phoneHref: escapeHtml(site.site.phoneHref), email: escapeHtml(site.site.email), emailHref: escapeHtml(site.site.emailHref), address: escapeHtml(site.site.address), navigation };
  const heroConfig = site.heroes['hizmetler.html'];
  const heroPreload = '<link rel="preload" as="image" href="assets/hero/' + heroConfig.asset + '-1200.webp" type="image/webp" imagesrcset="assets/hero/' + heroConfig.asset + '-400.webp 400w, assets/hero/' + heroConfig.asset + '-800.webp 800w, assets/hero/' + heroConfig.asset + '-1200.webp 1200w, assets/hero/' + heroConfig.asset + '-1600.webp 1600w" imagesizes="100vw" fetchpriority="high">';
  const serviceCards = site.services.map((service, index) => render(card, { index: String(index + 1).padStart(2, '0'), category: escapeHtml(service.category), title: escapeHtml(service.title), summary: escapeHtml(service.summary), href: escapeHtml(service.href) })).join('');
  const generated = render(layout, {
    title: 'Hizmet Kataloğu',
    description: 'Goway Danışmanlık hizmet kataloğu ve çalışma kapsamları.',
    heroPreload,
    header: render(header, common),
    hero: render(hero, { heroAsset: escapeHtml(heroConfig.asset), heroLabel: escapeHtml(heroConfig.label), heroTitle: 'İşletmenizin ihtiyacına göre netleşen danışmanlık kapsamları', heroLead: 'Hizmet kataloğu; kapsam, teslimat ve doğru başlangıç adımını tek bir görünümde toplar.' }),
    content: render(page, { serviceCards }),
    footer: render(footer, common)
  });
  await fs.writeFile(output, generated);
  console.log('Generated:', path.relative(root, output), '(' + site.services.length + ' services)');
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
