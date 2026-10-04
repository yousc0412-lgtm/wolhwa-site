import { json, cookie } from '../_lib/auth.js';
export async function onRequestPost(){return json({ok:true},200,{'Set-Cookie':cookie('',0)});}
