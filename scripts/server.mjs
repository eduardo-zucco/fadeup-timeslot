import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { SQLite } from '../lib/sqlite.mjs';
import { createApi } from '../lib/api.mjs';
import { dirname } from 'node:path';
const databaseFile=process.env.DB_FILE||'data/fadeup.sqlite';
await mkdir(dirname(databaseFile),{recursive:true});
const db=new SQLite(databaseFile);
const admin=process.env.ADMIN_EMAIL||'local@fadeup.test';
const host=process.env.HOST||'127.0.0.1';
const localOnly=host==='127.0.0.1';
const api=createApi({DB:db,ADMIN_EMAIL:localOnly?admin:undefined,ADMIN_KEY:process.env.ADMIN_KEY});
const port=Number(process.env.PORT||5173);
const server=createServer(async(req,res)=>{
 try{
  const protocol=req.headers['x-forwarded-proto']==='https'?'https':'http';
  const url=new URL(req.url,`${protocol}://${req.headers.host||'127.0.0.1:'+port}`);
  let result;
  if(url.pathname.startsWith('/api/')){
   const buffers=[];let size=0;for await(const c of req){size+=c.length;if(size>16384){res.writeHead(413);res.end();return;}buffers.push(c);}
   // Client-supplied platform identity is never trusted by the standalone server.
   const headers=new Headers(req.headers);headers.delete('oai-authenticated-user-email');
   if(localOnly)headers.set('oai-authenticated-user-email',admin);
   const body=['GET','HEAD'].includes(req.method)?undefined:Buffer.concat(buffers);
   result=await api(new Request(url,{method:req.method,headers,body}));
  }else{
   const files={'/':['index.html','text/html; charset=utf-8'],'/app.js':['app.js','text/javascript; charset=utf-8'],'/ui-utils.js':['ui-utils.js','text/javascript; charset=utf-8'],'/style.css':['style.css','text/css; charset=utf-8']};
   const file=files[url.pathname];result=file?new Response(await readFile(new URL('../public/'+file[0],import.meta.url)),{headers:{'Content-Type':file[1]}}):new Response('Não encontrado',{status:404});
  }
  res.writeHead(result.status,Object.fromEntries(result.headers));res.end(Buffer.from(await result.arrayBuffer()));
 }catch(e){console.error(e.message);res.writeHead(500);res.end('Erro interno');}
});
server.listen(port,host,()=>console.log(`fadeUp: http://${host}:${server.address().port} (SQLite)`));
process.on('SIGTERM',()=>server.close(()=>{db.close();process.exit(0);}));
