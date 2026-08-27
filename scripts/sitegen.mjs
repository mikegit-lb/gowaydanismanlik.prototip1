import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createSourceRuntimeConfig, loadContent, serializeRuntimeConfig } from './content.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const main = async () => {
  const content = await loadContent(root);
  await fs.writeFile(path.join(root, 'site-config.js'), serializeRuntimeConfig(createSourceRuntimeConfig(content)));
  console.log('Updated source runtime config: site-config.js');
};

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
