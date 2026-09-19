import { env } from 'cloudflare:workers';
import { extractText,getDocumentProxy } from 'unpdf';
import { database } from '../../../lib/knowledge';
import { admin,sameOrigin } from '../../../lib/server';
export async function POST(request:Request){
 if(!sameOrigin(request)||!await admin(request))return Response.json({error:'Enter a valid administrator access token.'},{status:401});
 try{
  if(Number(request.headers.get('content-length')||0)>6*1024*1024)return Response.json({error:'Maximum file size is 5 MB.'},{status:413});
  const form=await request.formData();const file=form.get('file');const title=String(form.get('title')||'').trim().slice(0,160);
  if(!(file instanceof File)||!file.size||file.size>5*1024*1024)return Response.json({error:'Choose a PDF, TXT or Markdown file up to 5 MB.'},{status:400});
  if(!/\.(pdf|txt|md)$/i.test(file.name))return Response.json({error:'Supported formats: PDF, TXT and Markdown.'},{status:400});
  const buffer=await file.arrayBuffer();const bytes=new Uint8Array(buffer);let text='';
  if(/\.pdf$/i.test(file.name)){
   if(new TextDecoder().decode(bytes.slice(0,5))!=='%PDF-')return Response.json({error:'This file is not a valid PDF.'},{status:400});
   const pdf=await getDocumentProxy(bytes);if(pdf.numPages>150){return Response.json({error:'Please split PDFs longer than 150 pages.'},{status:400});}
   const result=await extractText(pdf,{mergePages:true});text=result.text;
  }else text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);
  if(text.trim().length<80)return Response.json({error:'There is not enough readable text. For scanned PDFs, run OCR first and upload the searchable version.'},{status:422});
  if(text.length>250000)return Response.json({error:'This document is too long. Please split it into smaller files.'},{status:400});
  const sha=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',buffer))).map(n=>n.toString(16).padStart(2,'0')).join('');
  const existing=await database().prepare('SELECT id FROM documents WHERE sha=?').bind(sha).first();if(existing)return Response.json({error:'This document has already been uploaded.'},{status:409});
  const id=crypto.randomUUID();if(!env.BUCKET)throw Error('storage unavailable');
  await env.BUCKET.put(id,buffer,{httpMetadata:{contentType:/\.pdf$/i.test(file.name)?'application/pdf':'text/plain'}});
  try{await database().prepare('INSERT INTO documents (id,title,filename,text,created_at,category,sha,bytes) VALUES (?,?,?,?,?,?,?,?)').bind(id,title||file.name,file.name,text,new Date().toISOString(),'Uploaded documents',sha,file.size).run();}catch(e){await env.BUCKET.delete(id);throw e;}
  return Response.json({id,title:title||file.name,characters:text.length},{status:201});
 }catch(error){console.error('upload failed',error instanceof Error?error.message:'unknown');return Response.json({error:'The document could not be read or saved. Check the format and try again.'},{status:500});}
}



