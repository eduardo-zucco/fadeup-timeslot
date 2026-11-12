import {test} from 'node:test';
import assert from 'node:assert/strict';
import {SQLite} from '../src/server/infrastructure/sqlite.mjs';
import {createApi} from '../src/server/http/api.mjs';
const tomorrow=new Date(Date.now()+86400000).toISOString().slice(0,10);
function setup(t){const db=new SQLite();t.after(()=>db.close());const api=createApi({DB:db,ADMIN_KEY:'chave-administrativa-para-teste-123456789'});return {db,request:async(path,method='GET',body,token,admin=false)=>{const headers={'Content-Type':'application/json'};if(token)headers['X-Booking-Token']=token;if(admin)headers['X-Admin-Key']='chave-administrativa-para-teste-123456789';return api(new Request('http://localhost/api/'+path,{method,headers,body:body?JSON.stringify(body):undefined}));}};}
const body={name:'Cliente teste',phone:'14999999999',consent:true,service:'corte',date:tomorrow,start:540};
async function ready(request){await request('admin/config','PUT',{name:'Teste',open:540,close:1080,interval:0,days:[0,1,2,3,4,5,6],services:[{id:'corte',name:'Corte',price:4000,duration:30}]},null,true);}
test('reserva persiste no SQLite e não expõe dados sem chave',async t=>{const {request}=setup(t);await ready(request);const r=await request('bookings','POST',body);assert.equal(r.status,201);const b=await r.json();assert.equal((await request('bookings/'+b.id)).status,404);const mine=await (await request('bookings/'+b.id,'GET',null,b.token)).json();assert.equal(mine.name,body.name);assert(!mine.token);});
test('reserva concorrente aceita uma única ocupação',async t=>{const {request,db}=setup(t);await ready(request);const results=await Promise.all([request('bookings','POST',body),request('bookings','POST',body)]);assert.deepEqual(results.map(r=>r.status).sort(),[201,409]);assert.equal(db.raw.prepare('SELECT COUNT(*) n FROM bookings').get().n,1);assert.equal(db.raw.prepare('SELECT COUNT(*) n FROM occupancy').get().n,2);});
test('cancelamento libera horários e mantém histórico',async t=>{const {request,db}=setup(t);await ready(request);const b=await (await request('bookings','POST',body)).json();assert.equal((await request('bookings/'+b.id,'DELETE',null,b.token)).status,200);assert.equal(db.raw.prepare('SELECT COUNT(*) n FROM occupancy').get().n,0);assert.equal((await (await request('bookings/'+b.id,'GET',null,b.token)).json()).status,'cancelled');assert.equal((await request('bookings','POST',body)).status,201);});
test('reagendamento em conflito mantém reserva anterior',async t=>{const {request,db}=setup(t);await ready(request);const b=await (await request('bookings','POST',body)).json();await request('bookings','POST',{...body,start:600});assert.equal((await request('bookings/'+b.id,'PATCH',{date:tomorrow,start:600},b.token)).status,409);assert.equal(db.raw.prepare('SELECT start FROM bookings WHERE id=?').get(b.id).start,540);assert.equal((await request('bookings/'+b.id,'PATCH',{date:tomorrow,start:660},b.token)).status,200);assert.equal(db.raw.prepare('SELECT start FROM bookings WHERE id=?').get(b.id).start,660);});
test('painel e configurações exigem operador',async t=>{const {request}=setup(t);assert.equal((await request('admin/agenda?date='+tomorrow)).status,403);assert.equal((await request('admin/config','PUT',{})).status,403);assert.equal((await request('admin/config','PUT',{},null,true)).status,400);});
test('bloqueio impede reserva e pode ser removido pelo operador',async t=>{const {request}=setup(t);await ready(request);const b=await (await request('admin/bookings','POST',{...body,kind:'block',duration:60},null,true)).json();assert(b.id);assert.equal((await request('bookings','POST',body)).status,409);assert.equal((await request('admin/bookings/'+b.id,'DELETE',null,null,true)).status,200);assert.equal((await request('bookings','POST',body)).status,201);});
test('validação rejeita dados inválidos e origem externa',async t=>{const {request}=setup(t);await ready(request);assert.equal((await request('bookings','POST',{...body,phone:'123'})).status,400);assert.equal((await request('bookings','POST',{...body,consent:false})).status,400);assert.equal((await request('slots?date=invalid&service=corte')).status,400);});
test('batch faz rollback completo quando a chave de ocupação conflita',async t=>{const {db}=setup(t);await db.batch([db.prepare("INSERT INTO bookings VALUES('b','t','n','p','s',0,30,'d',540,'confirmed','appointment','now')"),db.prepare("INSERT INTO occupancy VALUES('d',540,'b')")]);await assert.rejects(db.batch([db.prepare("UPDATE bookings SET start=600 WHERE id='b'"),db.prepare("INSERT INTO occupancy VALUES('d',540,'b')")]));assert.equal(db.raw.prepare("SELECT start FROM bookings WHERE id='b'").get().start,540);});
test('API rejeita mutação iniciada por outra origem',async t=>{const db=new SQLite();t.after(()=>db.close());const api=createApi({DB:db});const r=await api(new Request('https://example.test/api/bookings',{method:'POST',headers:{Origin:'https://external.test','Content-Type':'application/json'},body:JSON.stringify(body)}));assert.equal(r.status,403);});
test('chave administrativa protege o painel fora do Sites',async t=>{const db=new SQLite();t.after(()=>db.close());const key='chave-de-teste-com-mais-de-24-caracteres';const api=createApi({DB:db,ADMIN_KEY:key});for(const supplied of ['', 'errada']){const r=await api(new Request('https://app.test/api/admin/agenda?date='+tomorrow,{headers:{'X-Admin-Key':supplied}}));assert.equal(r.status,403);}const r=await api(new Request('https://app.test/api/admin/agenda?date='+tomorrow,{headers:{'X-Admin-Key':key}}));assert.equal(r.status,200);});
for (const order of ['reagendar-cancelar', 'cancelar-reagendar']) {
 test(`cancelamento concorrente não deixa ocupação fantasma: ${order}`,async t=>{
  const {request,db}=setup(t);await ready(request);
  const b=await (await request('bookings','POST',body)).json();
  const move=()=>request('bookings/'+b.id,'PATCH',{date:tomorrow,start:600},b.token);
  const cancel=()=>request('bookings/'+b.id,'DELETE',null,b.token);
  const results=await Promise.all(order==='reagendar-cancelar'?[move(),cancel()]:[cancel(),move()]);
  assert(results.every(r=>[200,409].includes(r.status)));
  assert.equal(db.raw.prepare('SELECT status FROM bookings WHERE id=?').get(b.id).status,'cancelled');
  assert.equal(db.raw.prepare('SELECT COUNT(*) n FROM occupancy WHERE booking=?').get(b.id).n,0);
  assert.equal((await request('bookings','POST',{...body,start:600})).status,201);
 });
}
test('agenda permite consultar passado sem permitir reservar no passado',async t=>{
 const {request}=setup(t);await ready(request);
 const yesterday=new Date(Date.now()-86400000).toISOString().slice(0,10);
 assert.equal((await request('admin/agenda?date='+yesterday,'GET',null,null,true)).status,200);
 assert.equal((await request('bookings','POST',{...body,date:yesterday})).status,400);
 assert.equal((await request('admin/agenda?date=2026-01-01&end=2026-12-31','GET',null,null,true)).status,400);
});
test('disponibilidade da reserva preserva a duração original e libera seu próprio horário',async t=>{
 const {request}=setup(t);await ready(request);
 const b=await (await request('bookings','POST',body)).json();
 await request('admin/config','PUT',{name:'Teste',open:540,close:1080,interval:0,days:[0,1,2,3,4,5,6],services:[{id:'corte',name:'Corte novo',price:5000,duration:60}]},null,true);
 const path='bookings/'+b.id+'/slots?date='+tomorrow;
 assert.equal((await request(path)).status,404);
 const slots=await (await request(path,'GET',null,b.token)).json();
 assert(slots.slots.includes(540));assert(slots.slots.includes(1050));
 assert.equal((await request('bookings/'+b.id,'PATCH',{date:tomorrow,start:1050},b.token)).status,200);
 const current=await (await request('bookings/'+b.id,'GET',null,b.token)).json();assert.equal(current.duration,30);assert.equal(current.price,4000);assert.equal(current.service,'Corte');
});
test('rotas e períodos de disponibilidade são validados',async t=>{
 const {request}=setup(t);await ready(request);
 assert.equal((await request('admin/slots?date='+tomorrow+'&duration=30')).status,403);
 assert.equal((await request('admin/slots?date='+tomorrow+'&duration=30','GET',null,null,true)).status,200);
 assert.equal((await request('admin/slots?date='+tomorrow+'&duration=1','GET',null,null,true)).status,400);
 const b=await (await request('bookings','POST',body)).json();
 assert.equal((await request('bookings/'+b.id+'/extra','GET',null,b.token)).status,404);
 await request('bookings/'+b.id,'DELETE',null,b.token);
 assert.equal((await request('bookings/'+b.id+'/slots?date='+tomorrow,'GET',null,b.token)).status,409);
});
test('validação informa campos e diferencia erro interno de dados inválidos',async t=>{
 const {request}=setup(t);await ready(request);
 const invalid=await request('bookings','POST',{...body,name:'',phone:'123',consent:false});assert.equal(invalid.status,400);
 assert.deepEqual(Object.keys((await invalid.json()).fields).sort(),['consent','name','phone']);
 assert.equal((await request('admin/config','PUT',{name:'Teste',open:540,close:1080,interval:0,days:[1],services:[null]},null,true)).status,400);
 const api=createApi({DB:{prepare(){throw new Error('test database failure');}}});
 const failure=await api(new Request('http://test/api/config'));assert.equal(failure.status,500);assert(!(await failure.text()).includes('test database failure'));
});
