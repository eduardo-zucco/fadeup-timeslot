import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,unlink,rmdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {once} from 'node:events';
test('servidor público descarta identidade falsa e aceita proxy HTTPS', {timeout:10000},async t=>{
 const dir=await mkdtemp(join(tmpdir(),'fadeup-http-')),file=join(dir,'test.sqlite');
 const key='chave-administrativa-de-teste-123456789';
 const child=spawn(process.execPath,['scripts/server.mjs'],{env:{...process.env,HOST:'0.0.0.0',PORT:'0',DB_FILE:file,ADMIN_KEY:key},stdio:['ignore','pipe','pipe']});
 t.after(async()=>{const exited=once(child,'exit');child.kill();await exited;await unlink(file);await rmdir(dir);});
 const port=await new Promise((resolve,reject)=>{let text='';child.stdout.on('data',c=>{text+=c;const match=text.match(/http:\/\/0\.0\.0\.0:(\d+)/);if(match)resolve(Number(match[1]));});child.on('error',reject);});
 const root='http://127.0.0.1:'+port;
 const spoofed=await (await fetch(root+'/api/config',{headers:{'oai-authenticated-user-email':'local@fadeup.test'}})).json();assert.equal(spoofed.admin,false);
 const authorized=await (await fetch(root+'/api/config',{headers:{'X-Admin-Key':key}})).json();assert.equal(authorized.admin,true);
 const config={...authorized};delete config.admin;
 const response=await fetch(root+'/api/admin/config',{method:'PUT',headers:{'X-Admin-Key':key,'Content-Type':'application/json','X-Forwarded-Proto':'https','Origin':'https://127.0.0.1:'+port},body:JSON.stringify(config)});assert.equal(response.status,200);
});
