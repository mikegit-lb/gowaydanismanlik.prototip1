import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(await fs.readFile(path.join(root, 'data', 'analytics.json'), 'utf8'));
const files = (await fs.readdir(root)).filter((file) => file.endsWith('.html'));
const ga4 = config.ga4?.measurementId?.trim();
const matomoUrl = config.matomo?.url?.trim()?.replace(/\/$/, '');
const matomoId = config.matomo?.siteId?.trim();
const verification = config.searchConsoleVerification?.trim();
const blocks = [];
if (verification) blocks.push('<meta name="google-site-verification" content="' + verification + '">');
if (ga4) blocks.push('<script async src="https://www.googletagmanager.com/gtag/js?id=' + ga4 + '"></script><script data-analytics="ga4">window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag("js",new Date);gtag("config","' + ga4 + '");</script>');
if (matomoUrl && matomoId) blocks.push('<script data-analytics="matomo">var _paq=window._paq=window._paq||[];_paq.push(["trackPageView"]);_paq.push(["enableLinkTracking"]);(function(){var u="' + matomoUrl + '/";_paq.push(["setTrackerUrl",u+"matomo.php"]);_paq.push(["setSiteId","' + matomoId + '"]);var d=document,g=d.createElement("script"),s=d.getElementsByTagName("script")[0];g.async=true;g.src=u+"matomo.js";s.parentNode.insertBefore(g,s)})();</script>');
const snippet = blocks.join('');
for (const file of files) {
  const full = path.join(root, file);
  let html = await fs.readFile(full, 'utf8');
  html = html.replace(/<meta name="google-site-verification"[^>]*>\s*/g, '').replace(/<script[^>]*data-analytics="(?:ga4|matomo)"[\s\S]*?<\/script>/g, '');
  if (snippet) html = html.replace('</head>', snippet + '</head>');
  await fs.writeFile(full, html);
}
console.log(snippet ? 'Analytics/Search Console snippets injected.' : 'Analytics disabled: add IDs to data/analytics.json.');
