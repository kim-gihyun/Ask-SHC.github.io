import { env } from 'cloudflare:workers';
import { database } from './knowledge';
import { SESSION_COOKIE,verifySession } from './admin-session';
export function config(key:string){return (env as unknown as Record<string,string>)[key] || process.env[key] || '';}
export async function admin(request:Request){
 const supplied=(request.headers.get('cookie')||'').split(';').map(s=>s.trim()).find(s=>s.startsWith(SESSION_COOKIE+'='))?.slice(SESSION_COOKIE.length+1)||'';
 return verifySession(config('ADMIN_PASSWORD')||config('ADMIN_TOKEN'),supplied);
}
export function sameOrigin(request:Request){const origin=request.headers.get('origin');return !origin||origin===new URL(request.url).origin;}
export async function limited(request:Request){
 return throttle(request,'chat',60000,8);
}
export async function throttle(request:Request,scope:string,windowMs:number,max:number){
 const ip=request.headers.get('cf-connecting-ip')||'local';const bucket=Math.floor(Date.now()/windowMs);
 const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(ip)))).map(n=>n.toString(16).padStart(2,'0')).join('');
 const row=await database().prepare('INSERT INTO rate_limits (id,count,expires_at) VALUES (?,1,?) ON CONFLICT(id) DO UPDATE SET count=count+1 RETURNING count').bind(scope+':'+hash+':'+bucket,(bucket+2)*windowMs).first<{count:number}>();
 await database().prepare('DELETE FROM rate_limits WHERE expires_at < ?').bind(Date.now()).run();return (row?.count||0)>max;
}
