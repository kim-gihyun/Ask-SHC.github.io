import seed from '../data/knowledge.json';
import { env } from 'cloudflare:workers';
import type { Document } from './retrieval';
export {chunksOf,retrieve,tokens} from './retrieval';
export type {Document,Chunk} from './retrieval';
export const baseDocuments = seed as Document[];
export function database(){ if(!env.DB) throw new Error('Document storage is unavailable.'); return env.DB; }
export async function documents():Promise<Document[]>{
 const {results}=await database().prepare('SELECT id,title,filename,text,created_at,category FROM documents ORDER BY created_at DESC').all<{id:string;title:string;filename:string;text:string;created_at:string;category:string}>();
 return [...baseDocuments, ...results.map(d=>({id:d.id,title:d.title,url:'/api/documents/'+d.id,organization:'Uploaded',category:d.category,kind:d.filename.toLowerCase().endsWith('.pdf')?'PDF':'Text',retrievedAt:d.created_at.slice(0,10),updatedLabel:null,historical:false,text:d.text}))];
}
