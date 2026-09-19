import { env } from 'cloudflare:workers';
import { database } from '../../../../lib/knowledge';
import { admin,sameOrigin } from '../../../../lib/server';
export async function GET(_request:Request,context:{params:Promise<{id:string}>}){
 try{const {id}=await context.params;const doc=await database().prepare('SELECT filename FROM documents WHERE id=?').bind(id).first<{filename:string}>();if(!doc)return new Response('Not found',{status:404});const file=await env.BUCKET?.get(id);if(!file)return new Response('Not found',{status:404});return new Response(file.body,{headers:{'Content-Type':file.httpMetadata?.contentType||'application/octet-stream','Content-Disposition':"attachment; filename*=UTF-8''"+encodeURIComponent(doc.filename),'X-Content-Type-Options':'nosniff'}});}catch{return new Response('Storage unavailable',{status:503});}
}
export async function DELETE(request:Request,context:{params:Promise<{id:string}>}){
 if(!sameOrigin(request)||!await admin(request))return Response.json({error:'Administrator access required.'},{status:401});
 try{const {id}=await context.params;await database().prepare('DELETE FROM documents WHERE id=?').bind(id).run();await env.BUCKET?.delete(id);return Response.json({ok:true});}catch{return Response.json({error:'Could not delete the document. Try again.'},{status:503});}
}
