export async function onRequestGet({request,env}){
  if(!env.MEDIA) return new Response('Media storage is not configured.',{status:503});
  const path=new URL(request.url).pathname.replace(/^\/media\//,'');
  if(!path || path.includes('..')) return new Response('Not found',{status:404});
  const obj=await env.MEDIA.get(path);
  if(!obj) return new Response('Not found',{status:404});
  const headers=new Headers();
  if(obj.httpMetadata?.contentType) headers.set('Content-Type',obj.httpMetadata.contentType);
  headers.set('Cache-Control','public, max-age=31536000, immutable');
  return new Response(obj.body,{headers});
}