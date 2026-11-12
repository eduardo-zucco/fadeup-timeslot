import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
let count = 0;
async function check(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = join(directory, entry.name);
    if (entry.isDirectory()) await check(file);
    else if (/\.(mjs|js)$/.test(entry.name)) {
      const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
      if (result.status !== 0) process.exit(result.status ?? 1);
      count++;
    }
  }
}
for (const directory of ['src', 'public/assets/js', 'scripts', 'tests']) await check(directory);
console.log(`${count} módulos verificados.`);
