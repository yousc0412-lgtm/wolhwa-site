import { isAuthed, json } from '../_lib/auth.js';

export async function onRequestPost({request,env}){
  if(!await isAuthed(request,env.SESSION_SECRET||'')) return json({error:'로그인이 필요합니다.'},401);
  if(!env.MEDIA) return json({error:'이미지 저장소가 아직 연결되지 않았습니다. Cloudflare Pages의 R2 바인딩에서 MEDIA를 연결해 주세요.'},503);
  const type=request.headers.get('content-type')||'';
  if(!type.toLowerCase().startsWith('multipart/form-data')) return json({error:'이미지 파일 형식으로 업로드해 주세요.'},400);
  const form=await request.formData();
  const file=form.get('image');
  if(!file || typeof file.arrayBuffer!=='function') return json({error:'이미지 파일을 선택해 주세요.'},400);
  const allowed=['image/jpeg','image/png','image/webp','image/gif'];
  if(!allowed.includes(file.type)) return json({error:'JPG, PNG, WEBP, GIF 이미지만 업로드할 수 있습니다.'},400);
  if(file.size>8*1024*1024) return json({error:'이미지는 8MB 이하로 업로드해 주세요.'},400);
  const ext={ 'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/gif':'gif' }[file.type];
  const key='blog/'+Date.now().toString(36)+'-'+crypto.randomUUID()+'.'+ext;
  await env.MEDIA.put(key,await file.arrayBuffer(),{httpMetadata:{contentType:file.type,cacheControl:'public, max-age=31536000, immutable'}});
  const url=new URL('/media/'+key,request.url).toString();
  return json({ok:true,url,key,name:file.name});
}