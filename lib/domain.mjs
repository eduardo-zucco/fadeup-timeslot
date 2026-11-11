export const defaults={name:'fadeUp Barbearia',open:540,close:1080,interval:0,days:[1,2,3,4,5,6],services:[{id:'corte',name:'Corte',price:4000,duration:30},{id:'barba',name:'Barba',price:3000,duration:30},{id:'combo',name:'Corte + barba',price:6500,duration:60}]};
export const time=m=>`${Math.floor(m/60)}`.padStart(2,'0')+':'+`${m%60}`.padStart(2,'0');
export function dateOK(date,now=new Date()){
 if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date))return false;
 const d=new Date(date+'T12:00:00-03:00');return Number.isFinite(+d)&&d.toISOString().slice(0,10)===date&&+d>=+now-86400000&&+d<=+now+90*86400000;
}
export function cells(start,duration,interval=0){return Array.from({length:Math.ceil((duration+interval)/15)},(_,i)=>start+i*15);}
export function available(date,duration,config,occupied=[],now=new Date()){
 if(!dateOK(date,now)||!config.days.includes(new Date(date+'T12:00:00-03:00').getUTCDay()))return [];
 const used=new Set(occupied),times=[];for(let m=config.open;m+duration+config.interval<=config.close;m+=15){if(+new Date(`${date}T${time(m)}:00-03:00`)<=+now)continue;if(cells(m,duration,config.interval).every(x=>!used.has(x)))times.push(m);}return times;
}
export function customer(body){const name=String(body.name||'').trim(),phone=String(body.phone||'').replace(/\D/g,'');if(name.length<2||name.length>80)throw new Error('Nome inválido.');if(!/^(?:55)?\d{10,11}$/.test(phone))throw new Error('WhatsApp inválido.');if(body.consent!==true)throw new Error('Consentimento necessário.');return {name,phone};}
export function validConfig(c){return c&&typeof c.name==='string'&&c.name.trim().length>1&&c.name.length<=80&&Number.isInteger(c.open)&&Number.isInteger(c.close)&&c.open>=0&&c.close<=1440&&c.open%15===0&&c.close%15===0&&c.close>c.open&&[0,15,30].includes(c.interval)&&Array.isArray(c.days)&&c.days.length>0&&c.days.every(d=>Number.isInteger(d)&&d>=0&&d<=6)&&Array.isArray(c.services)&&c.services.length>0&&c.services.length<=20&&new Set(c.services.map(s=>s.id)).size===c.services.length&&c.services.every(s=>typeof s.id==='string'&&/^[a-z0-9-]{1,30}$/.test(s.id)&&typeof s.name==='string'&&s.name.length>1&&s.name.length<=80&&Number.isInteger(s.price)&&s.price>=0&&s.price<=1000000&&[15,30,45,60,75,90,120].includes(s.duration));}
