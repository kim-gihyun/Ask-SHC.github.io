import {readJson,InputError} from '../../../../lib/request-json';
import { env } from 'cloudflare:workers';
import { database } from '../../../../lib/knowledge';
import { admin,sameOrigin } from '../../../../lib/server';
export async function GET(request:Request,context:{params:Promise<{id:string}>}){
 if(!await admin(request))return Response.json({error:'Administrator sign-in required.'},{status:401,headers:{'Cache-Control':'no-store'}});
 if(new URL(request.url).searchParams.get('format')==='text'){
  const {id}=await context.params;const doc=await database().prepare('SELECT id,title,text FROM documents WHERE id=?').bind(id).first();
  return Response.json(doc||{error:'Document not found.'},{status:doc?200:404,headers:{'Cache-Control':'no-store'}});
 }
 try{const {id}=await context.params;const doc=await database().prepare('SELECT filename FROM documents WHERE id=?').bind(id).first<{filename:string}>();if(!doc)return new Response('Not found',{status:404});const file=await env.BUCKET?.get(id);if(!file)return new Response('Not found',{status:404});return new Response(file.body,{headers:{'Content-Type':file.httpMetadata?.contentType||'application/octet-stream','Content-Disposition':"attachment; filename*=UTF-8''"+encodeURIComponent(doc.filename),'X-Content-Type-Options':'nosniff'}});}catch{return new Response('Storage unavailable',{status:503});}
}
export async function PUT(request:Request,context:{params:Promise<{id:string}>}){
 if(!sameOrigin(request)||!await admin(request))return Response.json({error:'Administrator sign-in required.'},{status:401});
 try{
  if(Number(request.headers.get('content-length')||0)>1600000)return Response.json({error:'Document is too large.'},{status:413});
  const body=await readJson(request,1600000) as {title?:unknown;text?:unknown};
  if(typeof body.title!=='string'||!body.title.trim()||body.title.length>160||typeof body.text!=='string'||body.text.trim().length<80||body.text.length>250000)return Response.json({error:'Enter a title (up to 160 characters) and readable text (80–250,000 characters).'},{status:400});
  const {id}=await context.params;const doc=await database().prepare('SELECT filename FROM documents WHERE id=?').bind(id).first<{filename:string}>();
  if(!doc)return Response.json({error:'Document not found.'},{status:404});
  const bytes=new TextEncoder().encode(body.text);
  const sha=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('');
  const duplicate=await database().prepare('SELECT id FROM documents WHERE sha=? AND id<>?').bind(sha,id).first();
  if(duplicate)return Response.json({error:'These contents already exist in another uploaded document.'},{status:409});
  const previous=await env.BUCKET?.get(id);if(!env.BUCKET||!previous)throw Error('Storage unavailable');
  const original=await previous.arrayBuffer();
  await env.BUCKET.put(id,bytes,{httpMetadata:{contentType:'text/plain; charset=utf-8'}});
  try{await database().prepare('UPDATE documents SET title=?,text=?,filename=?,created_at=?,sha=?,bytes=? WHERE id=?').bind(body.title.trim(),body.text,doc.filename.replace(/\.[^.]+$/,'')+'.txt',new Date().toISOString(),sha,bytes.length,id).run();}
  catch(error){await env.BUCKET.put(id,original,{httpMetadata:previous.httpMetadata});throw error;}
  return Response.json({ok:true,id},{headers:{'Cache-Control':'no-store'}});
 }catch(error){if(error instanceof InputError)return Response.json({error:error.message},{status:error.status});return Response.json({error:'Could not save your changes.'},{status:503});}
}
export async function DELETE(request:Request,context:{params:Promise<{id:string}>}){
 if(!sameOrigin(request)||!await admin(request))return Response.json({error:'Administrator access required.'},{status:401});
 try{const {id}=await context.params;await database().prepare('DELETE FROM documents WHERE id=?').bind(id).run();await env.BUCKET?.delete(id);return Response.json({ok:true});}catch{return Response.json({error:'Could not delete the document. Try again.'},{status:503});}
}
