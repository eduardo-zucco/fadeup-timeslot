import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,unlink,rmdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {once} from 'node:events';
test('servidor público protege painel e completa criar reagendar cancelar e reutilizar horário', {timeout:10000},async t=>{
 const dir=await mkdtemp(join(tmpdir(),'fadeup-http-')),file=join(dir,'test.sqlite');
 const key='chave-administrativa-de-teste-123456789';
 const child=spawn(process.execPath,['scripts/server.mjs'],{env:{...process.env,HOST:'0.0.0.0',PORT:'0',DB_FILE:file,ADMIN_KEY:key},stdio:['ignore','pipe','pipe']});
 t.after(async()=>{const exited=once(child,'exit');child.kill();await exited;await unlink(file);await rmdir(dir);});
 const port=await new Promise((resolve,reject)=>{let text='';child.stdout.on('data',c=>{text+=c;const match=text.match(/http:\/\/0\.0\.0\.0:(\d+)/);if(match)resolve(Number(match[1]));});child.on('error',reject);});
 const root='http://127.0.0.1:'+port;
 const spoofed=await (await fetch(root+'/api/config',{headers:{'oai-authenticated-user-email':'local@fadeup.test'}})).json();assert.equal(spoofed.admin,undefined);
 const authorized=await (await fetch(root+'/api/config',{headers:{'X-Admin-Key':key}})).json();assert.equal(authorized.admin,undefined);
 const config={...authorized};delete config.admin;
 const response=await fetch(root+'/api/admin/config',{method:'PUT',headers:{'X-Admin-Key':key,'Content-Type':'application/json','X-Forwarded-Proto':'https','Origin':'https://127.0.0.1:'+port},body:JSON.stringify(config)});assert.equal(response.status,200);
 const helper=await fetch(root+'/assets/js/shared/format.js');assert.equal(helper.status,200);assert.match(helper.headers.get('Content-Type'),/javascript/);
 const date=new Date(Date.now()+86400000).toISOString().slice(0,10);
 const {slots}=await (await fetch(root+'/api/slots?date='+date+'&service=corte')).json();
 // Tomorrow can be a closed day. Search within the next week using the public API.
 let day=date,times=slots;
 for(let offset=2;!times.length&&offset<=7;offset++){
  day=new Date(Date.now()+offset*86400000).toISOString().slice(0,10);
  times=(await (await fetch(root+'/api/slots?date='+day+'&service=corte')).json()).slots;
 }
 assert.ok(times.length>1);
 const body={service:'corte',date:day,start:times[0],name:'Cliente HTTP',phone:'11999990000',consent:true};
 const created=await fetch(root+'/api/bookings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 assert.equal(created.status,201);const booking=await created.json();
 const headers={'Content-Type':'application/json','X-Booking-Token':booking.token};
 const moved=await fetch(root+'/api/bookings/'+booking.id,{method:'PATCH',headers,body:JSON.stringify({date:day,start:times.at(-1)})});assert.equal(moved.status,200);
 const retrieved=await (await fetch(root+'/api/bookings/'+booking.id,{headers})).json();assert.equal(retrieved.start,times.at(-1));
 const cancelled=await fetch(root+'/api/bookings/'+booking.id,{method:'DELETE',headers});assert.equal(cancelled.status,200);
 const reused=await fetch(root+'/api/bookings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...body,start:times.at(-1)})});assert.equal(reused.status,201);
});
