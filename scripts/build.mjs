import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import postcss from 'postcss';
import cssnano from 'cssnano';
import { minify as minifyHtml } from 'html-minifier-terser';
import { minify as minifyJs } from 'terser';
import sharp from 'sharp';
import { createRuntimeConfig, loadContent, renderGeneratedPages } from './content.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const baseUrl = 'https://www.gowaydanismanlik.com';
const widths = [400, 800, 1200, 1600];
const heroSources = [
  'ana-sayfa-iso-isg-kurumsal-hero', 'enerji-yonetimi-hero', 'cevre-danismanligi-hero',
  'cozumler-hero-planlama', 'goway-hero-ambient', 'hakkimizda-hero',
  'hizmetler-hero-endustriyel', 'iletisim-hero-ilk-gorusme', 'sss-hero-danismanlik',
  'tekstil-standartlari-hero', 'tesvik-danismanligi-hero', 'uzman-kadro-hero-saha-ekibi'
];
const noIndexPages = new Set(['404.html', 'belge-sorgulama.html', 'medya.html', 'katalog.html']);
const generatedSourceOverrides = new Set(['hizmet-katalogu.html', 'sektorel-cozumler.html', 'katalog.html']);

const hash = (value) => crypto.createHash('sha256').update(value).digest('hex').slice(0, 10);
const exists = async (file) => { try { await fs.access(file); return true; } catch { return false; } };
const canonical = (file) => file === 'index.html' ? `${baseUrl}/` : `${baseUrl}/${file}`;
const escapeAttribute = (value) => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');

async function emptyDist() {
  await fs.rm(dist, { recursive: true, force: true });
  await fs.mkdir(dist, { recursive: true });
}

function shouldSkipStatic(relative, entry) {
  const normalized = relative.replaceAll('\\', '/');
  const top = normalized.split('/')[0];
  if (top.startsWith('.') || ['node_modules', 'dist', 'docs', 'scripts', 'data', 'templates'].includes(top)) return true;
  if (['package.json', 'package-lock.json', 'README.md', 'sitemap.xml', 'site-config.js', 'site-ticker.js', 'index.css', 'site-pages.css'].includes(normalized)) return true;
  if (entry.isFile() && normalized.endsWith('.html')) return true;
  if (['goway-mark.png', 'goway-logo.png', 'hero-industrial.jpg'].includes(normalized)) return true;
  if (normalized === 'assets/hero' || normalized.startsWith('assets/hero/')) return true;
  if (heroSources.some((name) => normalized === `assets/${name}.png`)) return true;
  return false;
}

async function copyStatic(source, target, relativeBase = '') {
  const entries = await fs.readdir(source, { withFileTypes: true });
  for (const entry of entries) {
    const relative = path.join(relativeBase, entry.name);
    if (shouldSkipStatic(relative, entry)) continue;
    const from = path.join(source, entry.name);
    const to = path.join(target, entry.name);
    if (entry.isDirectory()) {
      await fs.mkdir(to, { recursive: true });
      await copyStatic(from, to, relative);
    } else {
      await fs.mkdir(path.dirname(to), { recursive: true });
      await fs.copyFile(from, to);
    }
  }
}

async function optimizeImages() {
  const output = path.join(dist, 'assets', 'hero');
  await fs.mkdir(output, { recursive: true });
  for (const name of heroSources) {
    const source = path.join(root, 'assets', `${name}.png`);
    if (!(await exists(source))) throw new Error(`Missing hero source: assets/${name}.png`);
    await Promise.all(widths.flatMap((width) => {
      const base = path.join(output, `${name}-${width}`);
      return [
        sharp(source).resize({ width, fit: 'cover', withoutEnlargement: true }).webp({ quality: 68, effort: 6 }).toFile(`${base}.webp`),
        sharp(source).resize({ width, fit: 'cover', withoutEnlargement: true }).avif({ quality: 48, effort: 6 }).toFile(`${base}.avif`)
      ];
    }));
  }
  await sharp(path.join(root, 'goway-mark.png')).resize({ width: 160, withoutEnlargement: true }).webp({ quality: 82, effort: 6 }).toFile(path.join(dist, 'assets', 'goway-mark-160.webp'));
}

async function processStyles() {
  const names = {};
  for (const file of ['site-pages.css', 'index.css']) {
    let source = await fs.readFile(path.join(root, file), 'utf8');
    source = source
      .replaceAll('url("goway-mark.png")', 'url("assets/goway-mark-160.webp")')
      .replaceAll("url('goway-mark.png')", "url('assets/goway-mark-160.webp')")
      .replaceAll('url("hero-industrial.jpg")', 'url("assets/hero/ana-sayfa-iso-isg-kurumsal-hero-800.avif")')
      .replaceAll("url('hero-industrial.jpg')", "url('assets/hero/ana-sayfa-iso-isg-kurumsal-hero-800.avif')")
      .replaceAll('url("assets/goway-hero-ambient.png")', 'url("assets/hero/goway-hero-ambient-1200.avif")')
      .replaceAll("url('assets/goway-hero-ambient.png')", "url('assets/hero/goway-hero-ambient-1200.avif')");
    const result = await postcss([cssnano({ preset: 'default' })]).process(source, { from: path.join(root, file) });
    const outputName = file.replace('.css', `.${hash(result.css)}.css`);
    await fs.writeFile(path.join(dist, outputName), result.css);
    names[file] = outputName;
  }
  return names;
}

async function processScripts(content) {
  const source = await fs.readFile(path.join(root, 'site-ticker.js'), 'utf8');
  const minified = await minifyJs(source, { format: { comments: false } });
  if (!minified.code) throw new Error('Terser returned an empty site-ticker.js file');
  const tickerName = `site-ticker.${hash(minified.code)}.js`;
  await fs.writeFile(path.join(dist, tickerName), minified.code);

  const runtime = `window.GOWAY_SITE_CONFIG=${JSON.stringify(createRuntimeConfig(content)).replaceAll('<', '\\u003c')};\n`;
  const configName = `site-config.${hash(runtime)}.js`;
  await fs.writeFile(path.join(dist, configName), runtime);
  return { tickerName, configName };
}

function pruneLegacyHomepage(html) {
  const start = html.indexOf('<section class="audience-section"');
  const end = start >= 0 ? html.indexOf('</main>', start) : -1;
  if (start >= 0 && end > start) html = `${html.slice(0, start)}${html.slice(end)}`;
  return html.replace(/\s*<script>\s*\/\* ---------- nav, tabs, faq, reveal, form ---------- \*\/[\s\S]*?<\/script>/, '');
}

function replaceUnverifiedClaims(html, file) {
  if (file === 'hakkimizda.html') {
    html = html
      .replace('Goway Danışmanlık hakkında: 25 yılı aşkın ISO Entegre Yönetim Sistemleri ve İş Sağlığı Güvenliği deneyimiyle güvenli, uyumlu ve sürdürülebilir gelişim yaklaşımımız.', 'Goway Danışmanlık hakkında: ISO Entegre Yönetim Sistemleri ve İş Sağlığı Güvenliği için uygulanabilir, izlenebilir ve sürdürülebilir gelişim yaklaşımımız.')
      .replace('25 Yıllık Uzmanlıkla Riskleri Azaltın, Standardınızı Yükseltin', 'Saha Gerçekliğiyle Riskleri Azaltın, Standardınızı Yükseltin')
      .replace('Goway Danışmanlık, ISO Entegre Yönetim Sistemleri ve İş Sağlığı Güvenliği disiplinini 25 yılı aşkın saha deneyimiyle bir araya getirir;', 'Goway Danışmanlık, ISO Entegre Yönetim Sistemleri ve İş Sağlığı Güvenliği disiplinini saha uygulamasıyla bir araya getirir;');
  }
  return html;
}

function ensureHeadMeta(html, file) {
  const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.replace(/<[^>]+>/g, '').trim() || 'Goway Danışmanlık';
  const descriptionTag = html.match(/<meta\b[^>]*\bname=["']description["'][^>]*>/i)?.[0] || '';
  const description = descriptionTag.match(/\bcontent=["']([^"']*)["']/i)?.[1] || `${title}: Goway Danışmanlık hizmet, süreç ve uygulama bilgileri.`;
  const pageCanonical = file === 'katalog.html' ? canonical('hizmet-katalogu.html') : canonical(file);
  html = html.replace(/\s*<link\s+rel=["']canonical["'][^>]*>/gi, '');
  html = html.replace(/\s*<meta\s+(?:property=["']og:[^"']+["']|name=["']twitter:[^"']+["'])[^>]*>/gi, '');
  html = html.replace(/\s*<meta\s+name=["']robots["'][^>]*>/gi, '');
  html = html.replace(/\s*<link\s+rel=["']icon["'][^>]*>/gi, '');
  html = html.replace(/\s*<link\s+rel=["']preload["']\s+as=["']image["'][^>]*>/gi, '');
  const robots = noIndexPages.has(file) ? 'noindex,follow' : 'index,follow';
  const meta = `${descriptionTag ? '' : `<meta name="description" content="${escapeAttribute(description)}">`}<link rel="canonical" href="${pageCanonical}"><meta name="robots" content="${robots}"><meta property="og:type" content="website"><meta property="og:locale" content="tr_TR"><meta property="og:site_name" content="Goway Danışmanlık"><meta property="og:title" content="${escapeAttribute(title)}"><meta property="og:description" content="${escapeAttribute(description)}"><meta property="og:url" content="${pageCanonical}"><meta property="og:image" content="${baseUrl}/assets/hero/ana-sayfa-iso-isg-kurumsal-hero-1200.webp"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escapeAttribute(title)}"><meta name="twitter:description" content="${escapeAttribute(description)}"><link rel="icon" href="assets/favicon.svg" type="image/svg+xml">`;
  return html.replace('</head>', `${meta}</head>`);
}

function addOrganizationSchema(html, file, content) {
  if (html.includes('data-generated-schema') || html.includes('data-seo-schema')) return html;
  const graph = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'Organization', '@id': `${baseUrl}/#organization`, name: content.site.site.name, url: `${baseUrl}/`, telephone: content.site.site.phone, email: content.site.site.email, address: { '@type': 'PostalAddress', addressLocality: 'Denizli', addressCountry: 'TR' } },
    { '@type': 'WebPage', '@id': `${canonical(file)}#webpage`, url: canonical(file), name: html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim() || content.site.site.name, about: { '@id': `${baseUrl}/#organization` } }
  ] };
  return html.replace('</head>', `<script type="application/ld+json" data-seo-schema>${JSON.stringify(graph).replaceAll('<', '\\u003c')}</script></head>`);
}

function addSharedShell(html, styles, scripts) {
  html = html
    .replace(/href=["']site-pages\.css(?:\?[^"']*)?["']/g, `href="${styles['site-pages.css']}"`)
    .replace(/href=["']index\.css(?:\?[^"']*)?["']/g, `href="${styles['index.css']}"`)
    .replace(/\s*<script\s+src=["']site-config(?:\.[a-f0-9]+)?\.js["'](?:\s+defer)?><\/script>/gi, '')
    .replace(/\s*<script\s+src=["']site-ticker(?:\.[a-f0-9]+)?\.js["'](?:\s+defer)?><\/script>/gi, '')
    .replaceAll('src="goway-mark.png"', 'src="assets/goway-mark-160.webp"')
    .replaceAll("src='goway-mark.png'", "src='assets/goway-mark-160.webp'")
    .replaceAll('assets/goway-hero-ambient.png', 'assets/hero/goway-hero-ambient-1200.avif');
  html = html.replace(/<img(?![^>]*\bwidth=)([^>]*class=["'][^"']*(?:footer-logo|home-footer-logo)[^"']*["'][^>]*)>/gi, '<img width="80" height="72"$1>');
  html = html.replace(/<img(?![^>]*\bwidth=)([^>]*src=["']assets\/hero\/[^"']+["'][^>]*)>/gi, '<img width="1600" height="900"$1>');
  if (!/<main\b[^>]*\bid=["']main-content["']/i.test(html)) html = html.replace(/<main(\s|>)/i, '<main id="main-content"$1');
  if (!html.includes('skip-link')) html = html.replace(/<body([^>]*)>/i, '<body$1><a class="visually-hidden skip-link" href="#main-content">İçeriğe geç</a>');
  return html.replace('</body>', `<script src="${scripts.configName}"></script><script src="${scripts.tickerName}" defer></script></body>`);
}

function addAnalytics(html, analytics) {
  const ga4 = analytics.ga4?.measurementId?.trim();
  const matomoUrl = analytics.matomo?.url?.trim()?.replace(/\/$/, '');
  const matomoId = analytics.matomo?.siteId?.trim();
  const verification = analytics.searchConsoleVerification?.trim();
  const blocks = [];
  if (verification) blocks.push(`<meta name="google-site-verification" content="${escapeAttribute(verification)}">`);
  if (ga4) blocks.push(`<script async src="https://www.googletagmanager.com/gtag/js?id=${escapeAttribute(ga4)}"></script><script data-analytics="ga4">window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date);gtag('config','${escapeAttribute(ga4)}',{anonymize_ip:true});</script>`);
  if (matomoUrl && matomoId) blocks.push(`<script data-analytics="matomo">var _paq=window._paq=window._paq||[];_paq.push(['trackPageView']);_paq.push(['enableLinkTracking']);(function(){var u='${escapeAttribute(matomoUrl)}/';_paq.push(['setTrackerUrl',u+'matomo.php']);_paq.push(['setSiteId','${escapeAttribute(matomoId)}']);var d=document,g=d.createElement('script'),s=d.getElementsByTagName('script')[0];g.async=true;g.src=u+'matomo.js';s.parentNode.insertBefore(g,s)})();</script>`);
  return blocks.length ? html.replace('</head>', `${blocks.join('')}</head>`) : html;
}

async function minifyInlineScripts(html, file) {
  const pattern = /<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/gi;
  let output = '', cursor = 0;
  for (const match of html.matchAll(pattern)) {
    const full = match[0], body = match[2];
    output += html.slice(cursor, match.index);
    cursor = match.index + full.length;
    if (/application\/ld\+json/i.test(match[1]) || !body.trim()) { output += full; continue; }
    try {
      const result = await minifyJs(body, { format: { comments: false } });
      output += `<script${match[1]}>${result.code || ''}</script>`;
    } catch (error) {
      throw new Error(`Inline JS minification failed in ${file}: ${error.message}`);
    }
  }
  return output + html.slice(cursor);
}

async function processHtml(content, generated, styles, scripts) {
  const sourceFiles = (await fs.readdir(root)).filter((name) => name.endsWith('.html') && !generatedSourceOverrides.has(name));
  const pages = new Map(generated);
  for (const file of sourceFiles) pages.set(file, await fs.readFile(path.join(root, file), 'utf8'));
  for (const [file, original] of pages) {
    let html = file === 'index.html' ? pruneLegacyHomepage(original) : original;
    html = replaceUnverifiedClaims(html, file);
    html = ensureHeadMeta(html, file);
    html = addOrganizationSchema(html, file, content);
    html = addAnalytics(html, content.analytics);
    html = addSharedShell(html, styles, scripts);
    html = await minifyInlineScripts(html, file);
    html = await minifyHtml(html, { collapseWhitespace: true, conservativeCollapse: true, keepClosingSlash: true, removeComments: true, minifyCSS: false, minifyJS: false });
    await fs.writeFile(path.join(dist, file), html);
  }
  return [...pages.keys()];
}

async function writeSitemap(files) {
  const indexable = files.filter((file) => !noIndexPages.has(file)).sort((a, b) => a === 'index.html' ? -1 : b === 'index.html' ? 1 : a.localeCompare(b, 'tr'));
  const lastmod = new Date().toISOString().slice(0, 10);
  const priority = (file) => file === 'index.html' ? '1.0' : ['hizmetler.html', 'sektorel-cozumler.html', 'kaynaklar.html', 'on-gorusme.html'].includes(file) ? '0.9' : file.startsWith('sektor-') ? '0.8' : '0.7';
  const urls = indexable.map((file) => `<url><loc>${canonical(file)}</loc><lastmod>${lastmod}</lastmod><priority>${priority(file)}</priority></url>`).join('\n  ');
  await fs.writeFile(path.join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  ${urls}\n</urlset>\n`);
  await fs.writeFile(path.join(dist, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${baseUrl}/sitemap.xml\n`);
  return indexable.length;
}

async function validateContent(content) {
  if (content.sectors.length !== 10) throw new Error(`Expected 10 sectors, found ${content.sectors.length}`);
  if (content.resources.length !== 7) throw new Error(`Expected 7 resources, found ${content.resources.length}`);
  const unique = (values, label) => { if (new Set(values).size !== values.length) throw new Error(`Duplicate ${label}`); };
  unique(content.sectors.map((item) => item.slug), 'sector slug');
  unique(content.sectors.map((item) => item.file), 'sector file');
  unique(content.resources.map((item) => item.slug), 'resource slug');
  for (const claim of content.claims.claims) {
    if (!content.claims.allowedStatuses.includes(claim.status)) throw new Error(`Invalid claim status: ${claim.id}`);
    if (claim.status === 'approved' && (!claim.source || !claim.reviewedAt || !claim.expiresAt)) throw new Error(`Approved claim lacks evidence metadata: ${claim.id}`);
  }
}

async function validateOutput(files, content) {
  const failures = [], publicText = [];
  for (const file of files) {
    const html = await fs.readFile(path.join(dist, file), 'utf8');
    const ids = [...html.matchAll(/\sid=["']([^"']+)["']/g)].map((match) => match[1]);
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    if (duplicates.length) failures.push(`${file}: duplicate ids ${[...new Set(duplicates)].join(', ')}`);
    const h1Count = (html.match(/<h1\b/gi) || []).length;
    if (file !== '404.html' && h1Count !== 1) failures.push(`${file}: expected one h1, found ${h1Count}`);
    const documentMarkup = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
    for (const match of documentMarkup.matchAll(/(?:href|src)=["']([^"']+)["']/g)) {
      const raw = match[1];
      if (/^(?:https?:|mailto:|tel:|data:|#|javascript:)/i.test(raw)) continue;
      const target = decodeURIComponent(raw.split(/[?#]/)[0]);
      if (target && !(await exists(path.join(dist, target)))) failures.push(`${file}: missing ${target}`);
    }
    if (!noIndexPages.has(file)) publicText.push(html.replace(/<[^>]+>/g, ' '));
  }
  const joined = publicText.join(' ');
  for (const claim of content.claims.claims.filter((item) => item.status === 'withheld')) if (joined.includes(claim.text)) failures.push(`withheld claim is public: ${claim.text}`);
  if (failures.length) throw new Error(`Output validation failed:\n${failures.slice(0, 40).join('\n')}${failures.length > 40 ? `\n...and ${failures.length - 40} more` : ''}`);
}

async function directorySize(folder) {
  let total = 0;
  for (const entry of await fs.readdir(folder, { withFileTypes: true })) {
    const full = path.join(folder, entry.name);
    total += entry.isDirectory() ? await directorySize(full) : (await fs.stat(full)).size;
  }
  return total;
}

async function build() {
  const content = await loadContent(root);
  await validateContent(content);
  await emptyDist();
  await copyStatic(root, dist);
  await optimizeImages();
  const styles = await processStyles();
  const scripts = await processScripts(content);
  const files = await processHtml(content, renderGeneratedPages(content), styles, scripts);
  const sitemapCount = await writeSitemap(files);
  await validateOutput(files, content);
  const bytes = await directorySize(dist);
  console.log(JSON.stringify({ output: dist, pages: files.length, sitemapUrls: sitemapCount, bytes, megabytes: Number((bytes / 1024 / 1024).toFixed(2)) }, null, 2));
}

if (process.argv.includes('--clean')) {
  await fs.rm(dist, { recursive: true, force: true });
  console.log('Removed dist/');
} else if (process.argv.includes('--watch')) {
  await build();
  let timer;
  const watcher = (await import('node:fs')).watch(root, { recursive: true }, (_event, changed) => {
    if (changed && (changed.startsWith('dist') || changed.startsWith('node_modules'))) return;
    clearTimeout(timer);
    timer = setTimeout(() => build().catch((error) => console.error(error.stack || error.message)), 300);
  });
  process.on('SIGINT', () => watcher.close());
} else {
  await build();
}
