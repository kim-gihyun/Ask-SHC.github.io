import { env } from 'cloudflare:workers';
import { database } from './knowledge';
export function config(key:string){return (env as unknown as Record<string,string>)[key] || process.env[key] || '';}
export async function admin(request:Request){
 const token=config('ADMIN_TOKEN');if(!token)return false;
 const supplied=request.headers.get('authorization')?.replace(/^Bearer /,'')||'';
 const hash=async(s:string)=>new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)));
 const a=await hash(token),b=await hash(supplied);let diff=0;for(let i=0;i<a.length;i++)diff|=a[i]^b[i];return diff===0;
}
export function sameOrigin(request:Request){const origin=request.headers.get('origin');return !origin||origin===new URL(request.url).origin;}
export async function limited(request:Request){
 const ip=request.headers.get('cf-connecting-ip')||'local';const bucket=Math.floor(Date.now()/60000);
 const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(ip)))).map(n=>n.toString(16).padStart(2,'0')).join('');
 const row=await database().prepare('INSERT INTO rate_limits (id,count,expires_at) VALUES (?,1,?) ON CONFLICT(id) DO UPDATE SET count=count+1 RETURNING count').bind(hash+':'+bucket,(bucket+2)*60000).first<{count:number}>();
 await database().prepare('DELETE FROM rate_limits WHERE expires_at < ?').bind(Date.now()).run();return (row?.count||0)>8;
}
