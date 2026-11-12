import { cp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { resolve, relative, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const output = resolve(root, '.local', 'compilado');
// Only this disposable build folder can be replaced; database and reports stay intact.
if (relative(root, output) !== join('.local', 'compilado')) throw new Error('Destino de compilação inválido.');
await rm(output, { recursive: true, force: true });
await mkdir(join(output, 'ferramentas'), { recursive: true });
for (const folder of ['aplicacao', 'banco']) await cp(join(root, folder), join(output, folder), { recursive: true });
await cp(join(root, 'ferramentas', 'servidor.mjs'), join(output, 'ferramentas', 'servidor.mjs'));
const { name, version, engines } = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
await writeFile(join(output, 'package.json'), JSON.stringify({ name, version, private: true, type: 'module', engines, scripts: { start: 'node ferramentas/servidor.mjs' } }, null, 2) + '\n');
console.log('Aplicação Node/SQLite compilada em .local/compilado. Nenhuma publicação realizada.');
