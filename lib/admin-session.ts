const encoder=new TextEncoder();
export const SESSION_COOKIE='shc_admin';
export const SESSION_SECONDS=6*60*60;
export async function passwordMatches(expected:string,supplied:string){
 if(!expected||!supplied)return false;
 const hash=async(s:string)=>new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(s)));
 const [a,b]=await Promise.all([hash(expected),hash(supplied)]);let diff=0;
 for(let i=0;i<a.length;i++)diff|=a[i]^b[i];return diff===0;
}
async function key(secret:string){return crypto.subtle.importKey('raw',encoder.encode('shc-admin-session:'+secret),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);}
export async function issueSession(secret:string,now=Date.now()){
 const payload=Math.floor(now/1000+SESSION_SECONDS)+'.'+crypto.randomUUID();
 const sig=new Uint8Array(await crypto.subtle.sign('HMAC',await key(secret),encoder.encode(payload)));
 return payload+'.'+Array.from(sig,n=>n.toString(16).padStart(2,'0')).join('');
}
export async function verifySession(secret:string,token:string,now=Date.now()){
 if(!secret)return false;
 const [expires,nonce,signature,...extra]=token.split('.');
 if(extra.length||!/^\d+$/.test(expires)||!nonce||!signature||!/^[a-f0-9]{64}$/.test(signature))return false;
 if(Number(expires)<=now/1000||Number(expires)>now/1000+SESSION_SECONDS+5)return false;
 const bytes=Uint8Array.from(signature.match(/../g)!,n=>parseInt(n,16));
 return crypto.subtle.verify('HMAC',await key(secret),bytes,encoder.encode(expires+'.'+nonce));
}
export function sessionCookie(token:string,secure:boolean){return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${token?SESSION_SECONDS:0}${secure?'; Secure':''}`;}
