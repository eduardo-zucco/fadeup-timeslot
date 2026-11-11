import {readFile,mkdir,writeFile} from 'node:fs/promises';
const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8');
await mkdir('dist/server',{recursive:true});
await mkdir('dist/.openai',{recursive:true});
const assets={};
for(const [path,file,type] of [['/','index.html','text/html; charset=utf-8'],['/app.js','app.js','text/javascript; charset=utf-8'],['/style.css','style.css','text/css; charset=utf-8']]) assets[path]={body:await read('public/'+file),type};
// Both modules have no external dependencies. Inline the named exports in one Worker ESM.
const domain=(await read('lib/domain.mjs')).replace(/^export /gm,'');
const api=(await read('lib/api.mjs')).replace(/^import .*domain\.mjs.*;\r?\n/m,'').replace(/^export /gm,'');
const worker=`${domain}\n${api}\nconst assets=${JSON.stringify(assets)};\n`+await read('worker/entry.mjs');
await writeFile('dist/server/index.js',worker);
await writeFile('dist/.openai/hosting.json',await read('.openai/hosting.json'));
console.log('Worker gerado: dist/server/index.js. Banco D1 com migrations em drizzle/.');
