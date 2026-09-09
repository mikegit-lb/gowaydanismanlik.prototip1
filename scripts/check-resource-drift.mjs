import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const git = (args) => {
  const result = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(result.stderr || `git ${args[0]} failed`);
  return result.stdout.trim();
};
const changed = git(['diff', '--name-only', 'HEAD', '--', 'assets/downloads']);
const untracked = git(['ls-files', '--others', '--exclude-standard', '--', 'assets/downloads']);
if (changed || untracked) {
  console.error(`Generated downloads differ from committed files. Regenerate and commit the resources:\n${[changed, untracked].filter(Boolean).join('\n')}`);
  process.exitCode = 1;
} else {
  console.log('Generated downloads match committed files.');
}
