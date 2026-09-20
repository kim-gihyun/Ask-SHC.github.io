import {admin,config,sameOrigin,throttle} from '../../../../lib/server';
import {issueSession,passwordMatches,sessionCookie} from '../../../../lib/admin-session';
const headers={'Cache-Control':'no-store'};
export async function GET(request:Request){return Response.json({authenticated:await admin(request)},{headers});}
export async function POST(request:Request){
 if(!sameOrigin(request))return Response.json({error:'Request origin not allowed.'},{status:403,headers});
 try{
  if(await throttle(request,'admin-login',15*60000,8))return Response.json({error:'Too many sign-in attempts. Try again in 15 minutes.'},{status:429,headers});
  if(Number(request.headers.get('content-length')||0)>2000)return Response.json({error:'Invalid sign-in request.'},{status:400,headers});
  const {password}=await request.json() as {password?:unknown};
  const secret=config('ADMIN_PASSWORD')||config('ADMIN_TOKEN');
  if(typeof password!=='string'||password.length>512||!await passwordMatches(secret,password))return Response.json({error:'Incorrect administrator password.'},{status:401,headers});
  return Response.json({authenticated:true},{headers:{...headers,'Set-Cookie':sessionCookie(await issueSession(secret),new URL(request.url).protocol==='https:')}});
 }catch{return Response.json({error:'Sign-in is temporarily unavailable.'},{status:503,headers});}
}
export async function DELETE(request:Request){
 if(!sameOrigin(request))return Response.json({error:'Request origin not allowed.'},{status:403,headers});
 return Response.json({authenticated:false},{headers:{...headers,'Set-Cookie':sessionCookie('',new URL(request.url).protocol==='https:')}});
}
