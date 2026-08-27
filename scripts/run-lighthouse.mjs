import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { launch } from 'chrome-launcher';
import lighthouse from 'lighthouse';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(root, '.lighthouseci');
const serverFile = path.join(root, 'scripts', 'lighthouse-server.mjs');
const urls = [
  '/',
  '/on-gorusme.html',
  '/iso-50001-enerji-yonetimi.html',
  '/sektorel-cozumler.html',
  '/sektor-uretim-metal.html',
  '/kaynaklar.html',
  '/referanslar.html',
  '/gizlilik-politikasi.html'
];

const waitForServer = (server) => new Promise((resolve, reject) => {
  let output = '';
  const onData = (chunk) => {
    output += chunk.toString();
    if (output.includes('Lighthouse server listening on 4173')) resolve();
  };
  server.stdout.on('data', onData);
  server.stderr.on('data', onData);
  server.once('error', reject);
  server.once('exit', (code) => reject(new Error(`Lighthouse server exited before ready (${code}): ${output}`)));
});

const runCommand = (command, args) => new Promise((resolve, reject) => {
  const child = spawn(command, args, { cwd: root, stdio: 'inherit', shell: false });
  child.once('error', reject);
  child.once('exit', (code, signal) => resolve(code ?? (signal ? 1 : 0)));
});

const main = async () => {
  await fs.rm(outputDir, { recursive: true, force: true });
  await fs.mkdir(outputDir, { recursive: true });
  const server = spawn(process.execPath, [serverFile], { cwd: root, env: { ...process.env, PORT: '4173' }, stdio: ['ignore', 'pipe', 'pipe'] });
  let chrome;
  let profile;
  try {
    await waitForServer(server);
    profile = await fs.mkdtemp(path.join(os.tmpdir(), 'goway-lighthouse-'));
    chrome = await launch({
      userDataDir: profile,
      logLevel: 'silent',
      chromeFlags: ['--headless=new', '--disable-dev-shm-usage', '--disable-gpu', '--disable-crash-reporter', '--no-first-run', '--no-default-browser-check']
    });
    for (const [index, pathname] of urls.entries()) {
      const requestedUrl = `http://localhost:4173${pathname}`;
      process.stdout.write(`Lighthouse ${index + 1}/${urls.length}: ${requestedUrl}\n`);
      const result = await lighthouse(requestedUrl, { port: chrome.port, output: 'json', logLevel: 'error' });
      const report = result?.lhr;
      if (!report) throw new Error(`Lighthouse returned no report for ${requestedUrl}`);
      await fs.writeFile(path.join(outputDir, `lhr-${Date.now()}.json`), JSON.stringify(report));
    }
  } finally {
    if (chrome) chrome.kill();
    if (server.exitCode === null) server.kill();
    if (profile) {
      try { await fs.rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 500 }); }
      catch (error) { console.warn(`Could not remove temporary Lighthouse profile: ${error.message}`); }
    }
  }
  const assertionPath = path.join(root, 'node_modules', '@lhci', 'cli', 'src', 'cli.js');
  const code = await runCommand(process.execPath, [assertionPath, 'assert', '--lhr', '.lighthouseci']);
  if (code !== 0) process.exitCode = code;
};

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
