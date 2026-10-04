const enc = new TextEncoder();
function b64url(bytes){let s='';for(const b of bytes)s+=String.fromCharCode(b);return btoa(s).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_')}
async function sign(value,secret){const key=await crypto.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);return b64url(new Uint8Array(await crypto.subtle.sign('HMAC',key,enc.encode(value))))}
export async function makeSession(secret){const exp=Date.now()+8*60*60*1000;const payload=b64url(enc.encode(JSON.stringify({exp})));return payload+'.'+await sign(payload,secret)}
export async function isAuthed(request,secret){if(!secret)return false;const cookie=request.headers.get('Cookie')||'';const m=cookie.match(/(?:^|;\s*)wolhwa_session=([^;]+)/);if(!m)return false;const [payload,sig]=m[1].split('.');if(!payload||!sig)return false;const expected=await sign(payload,secret);if(sig.length!==expected.length)return false;let diff=0;for(let i=0;i<sig.length;i++)diff|=sig.charCodeAt(i)^expected.charCodeAt(i);if(diff)return false;try{const data=JSON.parse(atob(payload.replace(/-/g,'+').replace(/_/g,'/')));return data.exp>Date.now()}catch{return false}}
export const cookie=(value,maxAge)=>`wolhwa_session=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
export function json(data,status=200,headers={}){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...headers}})}
export async function bodyJson(request){try{return await request.json()}catch{return null}}
