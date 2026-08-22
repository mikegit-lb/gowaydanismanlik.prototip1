import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import postcss from 'postcss';
import cssnano from 'cssnano';
import { minify as minifyHtml } from 'html-minifier-terser';
import { minify as minifyJs } from 'terser';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const widths = [400, 800, 1200, 1600];
const heroSources = [
  'ana-sayfa-iso-isg-kurumsal-hero',
  'enerji-yonetimi-hero',
  'cevre-danismanligi-hero',
  'cozumler-hero-planlama',
  'goway-hero-ambient',
  'hakkimizda-hero',
  'hizmetler-hero-endustriyel',
  'iletisim-hero-ilk-gorusme',
  'sss-hero-danismanlik',
  'tekstil-standartlari-hero',
  'tesvik-danismanligi-hero',
  'uzman-kadro-hero-saha-ekibi'
];

const exists = async (file) => {
  try { await fs.access(file); return true; } catch { return false; }
};

const hash = (value) => crypto.createHash('sha256').update(value).digest('hex').slice(0, 10);

async function emptyDist() {
  await fs.rm(dist, { recursive: true, force: true });
  await fs.mkdir(dist, { recursive: true });
}

async function copyStatic(source, target) {
  const entries = await fs.readdir(source, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === 'dist' || entry.name === 'scripts' || entry.name === 'data' || entry.name === 'templates') continue;
    if (entry.name === 'package.json' || entry.name === 'package-lock.json') continue;
    if (entry.name.endsWith('.html') || entry.name.endsWith('.css') || entry.name === 'site-ticker.js') continue;
    const from = path.join(source, entry.name);
    const to = path.join(target, entry.name);
    if (entry.isDirectory()) {
      await fs.mkdir(to, { recursive: true });
      await copyStatic(from, to);
    } else {
      await fs.copyFile(from, to);
    }
  }
}

async function optimizeImages() {
  const output = path.join(dist, 'assets', 'hero');
  await fs.mkdir(output, { recursive: true });
  await Promise.all(heroSources.flatMap((name) => widths.flatMap((width) => {
    const source = path.join(root, 'assets', name + '.png');
    const base = path.join(output, name + '-' + width);
    return [
      sharp(source).resize({ width, fit: 'cover' }).webp({ quality: 68, effort: 6 }).toFile(base + '.webp'),
      sharp(source).resize({ width, fit: 'cover' }).avif({ quality: 48, effort: 6 }).toFile(base + '.avif')
    ];
  })));
}

async function processStyles() {
  const names = {};
  for (const file of ['site-pages.css', 'index.css']) {
    const source = await fs.readFile(path.join(root, file), 'utf8');
    const result = await postcss([cssnano({ preset: 'default' })]).process(source, { from: path.join(root, file) });
    const outputName = file.replace('.css', '.' + hash(result.css) + '.css');
    await fs.writeFile(path.join(dist, outputName), result.css);
    names[file] = outputName;
  }
  return names;
}

async function processScripts() {
  const source = await fs.readFile(path.join(root, 'site-ticker.js'), 'utf8');
  const result = await minifyJs(source, { format: { comments: false } });
  if (!result.code) throw new Error('Terser returned an empty site-ticker.js file');
  const outputName = 'site-ticker.' + hash(result.code) + '.js';
  await fs.writeFile(path.join(dist, outputName), result.code);
  return outputName;
}

async function minifyInlineScripts(html, file) {
  const pattern = /<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/gi;
  let output = '';
  let cursor = 0;
  for (const match of html.matchAll(pattern)) {
    const full = match[0];
    const body = match[2];
    output += html.slice(cursor, match.index);
    cursor = match.index + full.length;
    if (/application\/ld\+json/i.test(match[1]) || !body.trim()) {
      output += full;
      continue;
    }
    try {
      const result = await minifyJs(body, { format: { comments: false } });
      output += '<script' + match[1] + '>' + (result.code || '') + '</script>';
    } catch (error) {
      throw new Error('Inline JS minification failed in ' + file + ': ' + error.message);
    }
  }
  return output + html.slice(cursor);
}

async function processHtml(styles, ticker) {
  const files = (await fs.readdir(root)).filter((name) => name.endsWith('.html'));
  for (const file of files) {
    let html = await fs.readFile(path.join(root, file), 'utf8');
    html = html.replace(/href=["']site-pages\.css(?:\?[^"']*)?["']/g, 'href="' + styles['site-pages.css'] + '"');
    html = html.replace(/href=["']index\.css(?:\?[^"']*)?["']/g, 'href="' + styles['index.css'] + '"');
    html = html.replace(/src=["']site-ticker\.js["']/g, 'src="' + ticker + '"');
    html = await minifyInlineScripts(html, file);
    html = await minifyHtml(html, {
      collapseWhitespace: true,
      conservativeCollapse: true,
      keepClosingSlash: true,
      removeComments: true,
      minifyCSS: false,
      minifyJS: false
    });
    await fs.writeFile(path.join(dist, file), html);
  }
}

async function build() {
  await emptyDist();
  await copyStatic(root, dist);
  await optimizeImages();
  const styles = await processStyles();
  const ticker = await processScripts();
  await processHtml(styles, ticker);
  console.log('Build complete:', dist);
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
    timer = setTimeout(() => build().catch((error) => console.error(error)), 250);
  });
  process.on('SIGINT', () => watcher.close());
} else {
  await build();
}
