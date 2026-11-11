export default {
 async fetch(request,env){
  const url=new URL(request.url);
  if(url.pathname.startsWith('/api/')){
   if(!['GET','HEAD'].includes(request.method)){
    const body=await request.text();if(body.length>16384)return new Response('Dados muito grandes',{status:413});
    request=new Request(request,{body});
   }
   return createApi(env)(request);
  }
  const asset=assets[url.pathname];
  if(!asset)return new Response('Não encontrado',{status:404});
  if(!['GET','HEAD'].includes(request.method))return new Response('Método não permitido',{status:405});
  return new Response(request.method==='HEAD'?null:asset.body,{headers:{
   'Content-Type':asset.type,
   'X-Content-Type-Options':'nosniff',
   'Referrer-Policy':'no-referrer',
   'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; form-action 'self'",
   'Cache-Control':'no-cache',
  }});
 }
};
