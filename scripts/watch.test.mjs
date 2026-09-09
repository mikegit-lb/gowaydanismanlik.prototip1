import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import test from 'node:test';
import { watchBuild } from './watch.mjs';

async function until(predicate) {
  const deadline = Date.now() + 5000;
  while (!predicate()) {
    assert.ok(Date.now() < deadline, 'Timed out waiting for a filesystem-triggered build');
    await sleep(10);
  }
}

async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'goway-watch-test-'));
  await fs.mkdir(path.join(root, 'dist'));
  await fs.mkdir(path.join(root, '.git'));
  await fs.writeFile(path.join(root, 'input.txt'), 'initial');
  t.after(async () => {
    // Only remove the temporary directory created by this test.
    assert.equal(path.dirname(path.resolve(root)), path.resolve(os.tmpdir()));
    assert.ok(path.basename(root).startsWith('goway-watch-test-'));
    await fs.rm(root, { recursive: true, force: true, maxRetries: 3 });
  });
  return root;
}

test('generated runtime, dist and Git activity do not cause rebuild loops', async (t) => {
  const root = await fixture(t);
  let builds = 0;
  const errors = [];
  const watcher = watchBuild(root, async () => {
    builds += 1;
    await fs.writeFile(path.join(root, 'site-config.js'), 'unchanged runtime');
    await fs.writeFile(path.join(root, 'dist', 'index.html'), String(builds));
  }, { delay: 25, onError: (error) => errors.push(error) });
  try {
    await watcher.ready;
    await fs.writeFile(path.join(root, '.git', 'index'), 'tooling state');
    await sleep(150);
    assert.equal(builds, 1);
    await fs.writeFile(path.join(root, 'input.txt'), 'one source edit');
    await until(() => builds === 2);
    await sleep(150);
    assert.equal(builds, 2);
    assert.deepEqual(errors, []);
  } finally {
    watcher.close();
  }
});

test('edits during a slow build queue one subsequent build without overlap', async (t) => {
  const root = await fixture(t);
  let builds = 0, active = 0, maximumActive = 0, release;
  const gate = new Promise((resolve) => { release = resolve; });
  const observed = [], errors = [];
  const watcher = watchBuild(root, async () => {
    builds += 1;
    maximumActive = Math.max(maximumActive, ++active);
    try {
      if (builds === 2) await gate;
      observed.push(await fs.readFile(path.join(root, 'input.txt'), 'utf8'));
    } finally { active -= 1; }
  }, { delay: 25, onError: (error) => errors.push(error) });
  try {
    await watcher.ready;
    await fs.writeFile(path.join(root, 'input.txt'), 'first edit');
    await until(() => builds === 2);
    await fs.writeFile(path.join(root, 'input.txt'), 'second edit');
    await fs.writeFile(path.join(root, 'input.txt'), 'latest edit');
    await sleep(100);
    assert.equal(builds, 2);
    release();
    await until(() => builds === 3 && active === 0);
    await sleep(100);
    assert.equal(builds, 3);
    assert.equal(maximumActive, 1);
    assert.equal(observed.at(-1), 'latest edit');
    assert.deepEqual(errors, []);
  } finally {
    watcher.close();
    release();
    await until(() => active === 0);
  }
});

test('a failed build does not prevent the next edit from rebuilding', async (t) => {
  const root = await fixture(t);
  let builds = 0;
  const errors = [];
  const watcher = watchBuild(root, async () => {
    if (++builds === 1) throw new Error('invalid source');
  }, { delay: 25, onError: (error) => errors.push(error.message) });
  try {
    await watcher.ready;
    await fs.writeFile(path.join(root, 'input.txt'), 'corrected source');
    await until(() => builds === 2);
    assert.deepEqual(errors, ['invalid source']);
  } finally { watcher.close(); }
});
