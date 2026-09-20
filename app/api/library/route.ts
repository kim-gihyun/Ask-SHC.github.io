import { documents,chunksOf } from '../../../lib/knowledge';
import { config,admin } from '../../../lib/server';
import { FREE_MODELS } from '../../../lib/openrouter';
export async function GET(request:Request){
 if(!await admin(request))return Response.json({error:'Administrator sign-in required.'},{status:401,headers:{'Cache-Control':'no-store'}});
 try{const docs=await documents();return Response.json({documents:docs.map(({text,pages,...d})=>({...d,characters:text.length,chunks:chunksOf({...d,text,pages}).length})),model:config('OPENROUTER_MODEL')||'qwen/qwen3.8-27b:free',models:FREE_MODELS,configured:!!config('OPENROUTER_API_KEY'),retrieval:'BM25 full-text retrieval'},{headers:{'Cache-Control':'no-store'}});}catch{return Response.json({error:'The document library is temporarily unavailable.'},{status:503});}
}
