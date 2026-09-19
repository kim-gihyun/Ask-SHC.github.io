import { documents,chunksOf } from '../../../lib/knowledge';
import { config } from '../../../lib/server';
import { FREE_MODELS } from '../../../lib/openrouter';
export async function GET(){try{const docs=await documents();return Response.json({documents:docs.map(({text,pages,...d})=>({...d,characters:text.length,chunks:chunksOf({...d,text,pages}).length})),model:config('OPENROUTER_MODEL')||'qwen/qwen3.8-27b:free',models:FREE_MODELS,configured:!!config('OPENROUTER_API_KEY'),retrieval:'BM25 full-text retrieval',collectedAt:'2026-09-19'});}catch{return Response.json({error:'The document library is temporarily unavailable. Please try again.'},{status:503});}}
