import {test} from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {SQLite} from '../lib/sqlite.mjs';
test('artefato Worker serve a interface e a mesma API SQLite',async t=>{
 execFileSync(process.execPath,['scripts/build.mjs']);
 const {default:worker}=await import('../dist/server/index.js?test='+Date.now());
 const db=new SQLite();t.after(()=>db.close());const env={DB:db};
 const page=await worker.fetch(new Request('https://fadeup.test/'),env);assert.equal(page.status,200);assert.match(await page.text(),/Seu próximo/);
 const api=await worker.fetch(new Request('https://fadeup.test/api/config'),env);assert.equal(api.status,200);assert.equal((await api.json()).services.length,3);
 const forbidden=await worker.fetch(new Request('https://fadeup.test/api/admin/agenda?date=2026-11-12'),env);assert.equal(forbidden.status,403);
});
