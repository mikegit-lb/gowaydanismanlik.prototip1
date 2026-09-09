import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Launcher } from 'chrome-launcher';
import puppeteer from 'puppeteer-core';
import { loadContent } from './content.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const dist = path.join(root, 'dist');
const content = await loadContent(root);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.avif': 'image/avif' };
const server = http.createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const file = path.resolve(dist, pathname === '/' ? 'index.html' : pathname.slice(1));
    if (!file.startsWith(`${dist}${path.sep}`)) { response.writeHead(403).end(); return; }
    let body = await fs.readFile(file);
    if (/^site-ticker\.[a-f0-9]+\.js$/.test(path.basename(file))) {
      // Capture drafts in the test response; never launch an external email app.
      body = body.toString().replaceAll('window.location.href=', 'window.__qaHandoff=');
    }
    response.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
    response.end(body);
  } catch { response.writeHead(404).end(); }
});
await new Promise((resolve, reject) => {
  server.once('error', reject);
  server.listen(0, '127.0.0.1', resolve);
});
const base = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  browser = await puppeteer.launch({
    executablePath: process.env.CHROME_PATH || Launcher.getFirstInstallation(),
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const visit = (route) => page.goto(`${base}${route}`, { waitUntil: 'networkidle0' });
  for (const route of ['/', '/on-gorusme.html', '/kaynaklar.html']) {
    await page.setViewport({ width: 390, height: 844 });
    await visit(route);
    assert.equal(await page.$eval('#site-navigation', (nav) => nav.inert), true, `${route}: closed menu must be inert`);
    await page.focus('.menu-toggle');
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => !!document.activeElement.closest('#site-navigation')), false, `${route}: Tab entered the closed menu`);
    await page.click('.menu-toggle');
    await page.waitForFunction(() => document.activeElement === document.querySelector('#site-navigation a'));
    assert.equal(await page.$eval('#site-navigation', (nav) => nav.inert), false);
    await page.keyboard.down('Shift');
    await page.keyboard.press('Tab');
    await page.keyboard.up('Shift');
    assert.equal(await page.evaluate(() => document.activeElement === document.querySelector('#site-navigation a:last-child')), true);
    await page.keyboard.press('Tab');
    await page.keyboard.press('Escape');
    assert.equal(await page.$eval('.menu-toggle', (button) => button.getAttribute('aria-expanded')), 'false');
    assert.equal(await page.evaluate(() => document.activeElement === document.querySelector('.menu-toggle')), true);
    await page.click('.menu-toggle');
    await page.setViewport({ width: 821, height: 900 });
    await page.waitForFunction(() => !document.body.classList.contains('menu-open') && !document.querySelector('#site-navigation').inert);
    await page.focus('#site-navigation a');
    await page.setViewport({ width: 820, height: 844 });
    await page.waitForFunction(() => document.querySelector('#site-navigation').inert);
    assert.equal(await page.evaluate(() => !!document.activeElement.closest('#site-navigation')), false);
    await page.setViewport({ width: 1440, height: 900 });
    await page.waitForFunction(() => !document.querySelector('#site-navigation').inert);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${route}: desktop overflow`);
    console.log(`Menu focus and breakpoint checks passed: ${route}`);
  }

  await page.setViewport({ width: 390, height: 844 });
  await visit('/');
  await page.click('.search-toggle');
  await page.waitForFunction(() => !document.querySelector('#site-search-panel').hidden && document.activeElement === document.querySelector('#site-search-input'));
  assert.equal(await page.$eval('.search-toggle', (button) => button.getAttribute('aria-expanded')), 'true');
  await page.keyboard.press('Escape');
  assert.equal(await page.$eval('#site-search-panel', (panel) => panel.hidden), true);
  assert.equal(await page.evaluate(() => document.activeElement === document.querySelector('.search-toggle')), true);

  await visit('/arama.html?q=ISO%2050001');
  assert.equal(await page.$eval('#search-query', (input) => input.value), 'ISO 50001');
  assert.ok(await page.$$eval('.search-result a', (links) => links.some((link) => link.textContent.includes('ISO 50001'))), 'ISO 50001 query returned no result');
  await visit('/arama.html?q=g%C4%B1da');
  assert.ok(await page.$$eval('.search-result a', (links) => links.some((link) => link.getAttribute('href') === './sektor-gida.html')), 'Turkish-normalized gıda query missed the food sector');
  await visit('/arama.html?q=kesinlikle-bulunamaz');
  assert.equal(await page.$eval('[data-search-empty]', (node) => node.hidden), false);
  assert.match(await page.$eval('[data-search-status]', (node) => node.textContent), /eşleşen sonuç bulunamadı/);
  await page.$eval('#search-query', (input) => { input.value = 'ISO 50001'; input.dispatchEvent(new Event('input', { bubbles: true })); });
  assert.equal(new URL(page.url()).searchParams.get('q'), 'ISO 50001');
  console.log('Search QA passed: header focus behavior, Turkish normalization, ranking, no-results state and shareable query URL.');

  // Catalog completeness must hold before any client JavaScript runs.
  await page.setJavaScriptEnabled(false);
  await visit('/on-gorusme.html');
  const catalog = await page.evaluate(() => Object.fromEntries(['service', 'sector'].map((id) => [id, [...document.querySelector(`#${id}`).options].filter((option) => option.dataset.slug).map((option) => ({ slug: option.dataset.slug, title: option.value }))])));
  assert.deepEqual(catalog.service, content.services.map(({ slug, title }) => ({ slug, title })));
  assert.deepEqual(catalog.sector, content.sectors.map(({ slug, title }) => ({ slug, title })));
  await page.setJavaScriptEnabled(true);
  const service = content.services.find((item) => item.slug === 'iso-27001-bilgi-guvenligi');
  const sector = content.sectors.find((item) => item.slug === 'maden-tas-ocaklari');
  await visit(`/on-gorusme.html?hizmet=${service.slug}&sektor=${sector.slug}`);
  assert.equal(await page.$eval('#service', (select) => select.value), service.title);
  assert.equal(await page.$eval('#sector', (select) => select.value), sector.title);
  await page.click('[data-consultation-form] button[type="submit"]');
  assert.equal(await page.$eval('[data-form-status]', (status) => status.dataset.state), 'error');
  await page.type('#name', 'Browser QA');
  await page.type('#email', 'invalid-email');
  await page.type('#message', 'Local regression check');
  await page.click('[data-consultation-form] button[type="submit"]');
  assert.equal(await page.$eval('#email', (email) => email.getAttribute('aria-invalid')), 'true');
  await page.$eval('#email', (email) => { email.value = 'qa@example.com'; });
  await page.click('[data-consultation-form] button[type="submit"]');
  const draft = await page.evaluate(() => window.__qaHandoff);
  assert.ok(draft?.startsWith('mailto:'), 'Valid form did not prepare an email draft');
  const body = new URL(draft).searchParams.get('body');
  assert.ok(body.includes(`Hizmet: ${service.title}`) && body.includes(`Sektör: ${sector.title}`));
  assert.ok(body.includes('\n'), 'Email draft must retain line breaks');
  assert.deepEqual(errors, []);
  console.log('Browser QA passed: menu focus and breakpoints, complete static catalogs, preselection, validation and email draft.');
} finally {
  try { if (browser) await browser.close(); }
  finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
}
