import {test} from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {SQLite} from '../src/server/infrastructure/sqlite.mjs';
test('artefato Worker serve a interface e a mesma API SQLite',async t=>{
 execFileSync(process.execPath,['scripts/build.mjs']);
 const {default:worker}=await import('../dist/server/index.js?test='+Date.now());
 const db=new SQLite();t.after(()=>db.close());const env={DB:db};
 const page=await worker.fetch(new Request('https://fadeup.test/'),env);assert.equal(page.status,200);assert.match(await page.text(),/<html lang="pt-BR">/);
 const helper=await worker.fetch(new Request('https://fadeup.test/assets/js/shared/format.js'),env);assert.equal(helper.status,200);assert.match(helper.headers.get('Content-Type'),/javascript/);
 const api=await worker.fetch(new Request('https://fadeup.test/api/config'),env);assert.equal(api.status,200);assert.equal((await api.json()).services.length,3);
 const forbidden=await worker.fetch(new Request('https://fadeup.test/api/admin/agenda?date=2026-11-12'),env);assert.equal(forbidden.status,403);
 const adminPage=await worker.fetch(new Request('https://fadeup.test/admin'),env);assert.equal(adminPage.status,200);assert.match(await adminPage.text(),/assets\/js\/admin.js/);
 const spoofed=await worker.fetch(new Request('https://fadeup.test/api/admin/session',{headers:{'oai-authenticated-user-email':'owner@test.invalid'}}),{...env,ADMIN_EMAIL:'owner@test.invalid'});assert.equal(spoofed.status,403);
 const authorized=await worker.fetch(new Request('https://fadeup.test/api/admin/session',{headers:{'X-Admin-Key':'chave-somente-para-teste-worker-123456'}}),{...env,ADMIN_KEY:'chave-somente-para-teste-worker-123456'});assert.equal(authorized.status,200);
 const post=await worker.fetch(new Request('https://fadeup.test/api/bookings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'Cliente teste',phone:'123',consent:true})}),env);assert.equal(post.status,400);
});
