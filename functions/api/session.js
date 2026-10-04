import { isAuthed, json } from '../_lib/auth.js';
export async function onRequestGet({request,env}){return json({authenticated:await isAuthed(request,env.SESSION_SECRET||'')});}
