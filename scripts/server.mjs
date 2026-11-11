import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { SQLite } from '../lib/sqlite.mjs';
import { createApi } from '../lib/api.mjs';
await mkdir('data',{recursive:true});
const db=new SQLite(process.env.DB_FILE||'data/fadeup.sqlite');
const admin=process.env.ADMIN_EMAIL||'local@fadeup.test';
const api=createApi({DB:db,ADMIN_EMAIL:admin});
const port=Number(process.env.PORT||5173);
const server=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,`http://127.0.0.1:${port}`);
  let result;
  if(url.pathname.startsWith('/api/')){
   const buffers=[];let size=0;for await(const c of req){size+=c.length;if(size>16384){res.writeHead(413);res.end();return;}buffers.push(c);}
   // Local preview is loopback-only and represents the operator. Never exposed to a LAN.
   const headers=new Headers(req.headers);headers.set('oai-authenticated-user-email',admin);
   const body=['GET','HEAD'].includes(req.method)?undefined:Buffer.concat(buffers);
   result=await api(new Request(url,{method:req.method,headers,body}));
  }else{
   const files={'/':['index.html','text/html; charset=utf-8'],'/app.js':['app.js','text/javascript; charset=utf-8'],'/style.css':['style.css','text/css; charset=utf-8']};
   const file=files[url.pathname];result=file?new Response(await readFile(new URL('../public/'+file[0],import.meta.url)),{headers:{'Content-Type':file[1]}}):new Response('Não encontrado',{status:404});
  }
  res.writeHead(result.status,Object.fromEntries(result.headers));res.end(Buffer.from(await result.arrayBuffer()));
 }catch(e){console.error(e.message);res.writeHead(500);res.end('Erro interno');}
});
server.listen(port,'127.0.0.1',()=>console.log(`fadeUp: http://127.0.0.1:${port} (SQLite local)`));
process.on('SIGTERM',()=>server.close(()=>{db.close();process.exit(0);}));
