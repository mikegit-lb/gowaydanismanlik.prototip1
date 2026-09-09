import { watch } from 'node:fs';

// These paths are build outputs or tooling state, never build inputs.
const ignoredDirectories = new Set(['dist', 'node_modules', '__pycache__']);
export function isBuildInput(filename) {
  if (!filename) return true;
  const normalized = String(filename).replaceAll('\\', '/');
  const segments = normalized.split('/');
  return normalized !== 'site-config.js'
    && !segments.some((part) => part.startsWith('.') || ignoredDirectories.has(part));
}

export function watchBuild(root, build, { delay = 300, onError = console.error } = {}) {
  let timer, running = false, pending = false, closed = false;
  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(run, delay);
  };
  const run = async () => {
    if (closed || running) return;
    running = true;
    pending = false;
    try {
      await build();
    } catch (error) {
      onError(error);
    } finally {
      running = false;
      // Changes received during a build become one subsequent build.
      if (pending && !closed) schedule();
    }
  };
  const watcher = watch(root, { recursive: true }, (_event, filename) => {
    if (!isBuildInput(filename)) return;
    pending = true;
    schedule();
  });
  return {
    ready: run(),
    close() {
      closed = true;
      clearTimeout(timer);
      watcher.close();
    }
  };
}
