import { readFile, readdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };
export async function loadAssets(root) {
  const assets = {};
  async function walk(relative = '') {
    for (const entry of await readdir(join(root, relative), { withFileTypes: true })) {
      const file = join(relative, entry.name);
      if (entry.isDirectory()) await walk(file);
      else if (types[extname(entry.name)]) assets['/' + file.replaceAll('\\', '/')] = { body: await readFile(join(root, file), 'utf8'), type: types[extname(entry.name)] };
    }
  }
  await walk();
  assets['/'] = assets['/index.html'];
  assets['/admin'] = assets['/admin.html'];
  assets['/admin/'] = assets['/admin.html'];
  return assets;
}
