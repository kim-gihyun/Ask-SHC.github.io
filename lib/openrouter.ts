export const FREE_MODELS = ['qwen/qwen3.8-27b:free','google/gemma-4-31b-it:free'] as const;
type ChatMessage={role:string;content:string};
type ProviderResponse={choices?:{message?:{content?:string};finish_reason?:string}[];model?:string;error?:{message?:string;metadata?:{raw?:string;limit_source?:string}}};
type Attempt={model:string;status:number;reason:string};
export type CompletionResult={ok:true;answer:string;model:string;attempts:Attempt[];fallbackUsed:boolean}|{ok:false;error:string;code:string;status:number;attempts:Attempt[]};
// Provider health only: no user text, tokens or account information is cached here.
const cooldown=new Map<string,number>();
export async function completeWithFallback(key:string,messages:ChatMessage[],preferred:string=FREE_MODELS[0],request:typeof fetch=fetch,providerCooldown:Map<string,number>=cooldown):Promise<CompletionResult>{
 const primary=FREE_MODELS.includes(preferred as typeof FREE_MODELS[number])?preferred:FREE_MODELS[0];
 const ordered=[primary,...FREE_MODELS.filter(m=>m!==primary)];
 const available=ordered.filter(m=>(providerCooldown.get(m)||0)<Date.now());
 if(!available.length)return {ok:false,error:'Both free providers are cooling down after rate limits. Document search remains available.',code:'providers_busy',status:429,attempts:[]};
 const models=available;const attempts:Attempt[]=[];
 for(const model of models){
  try{
   const response=await request('https://openrouter.ai/api/v1/chat/completions',{
    method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json','X-Title':'Ask SHC'},
    body:JSON.stringify({model,messages,temperature:.15,max_tokens:1400,reasoning:{enabled:false},provider:{max_price:{prompt:0,completion:0}}}),signal:AbortSignal.timeout(25000),
   });
   const data=await response.json().catch(()=>({})) as ProviderResponse;
   const detail=[data.error?.message,data.error?.metadata?.raw,data.error?.metadata?.limit_source].filter(Boolean).join(' ').toLowerCase();
   if(response.ok&&!data.error){
    const answer=data.choices?.[0]?.message?.content;
    if(typeof answer==='string'&&answer.trim()&&data.choices?.[0]?.finish_reason!=='length'){
     attempts.push({model,status:response.status,reason:'success'});providerCooldown.delete(model);
     return {ok:true,answer,model:data.model||model,attempts,fallbackUsed:model!==primary};
    }
    attempts.push({model,status:502,reason:data.choices?.[0]?.finish_reason==='length'?'output_limit':'empty_answer'});continue;
   }
   if(response.status===401||response.status===403){attempts.push({model,status:response.status,reason:'authentication'});return {ok:false,error:'OpenRouter rejected the server’s API key or model permissions. An administrator needs to check the key settings.',code:'authentication',status:503,attempts};}
   if(response.status===402){attempts.push({model,status:402,reason:'account_limit'});return {ok:false,error:'OpenRouter reports an account or credit restriction. An administrator needs to check the account settings.',code:'account_limit',status:503,attempts};}
   const daily=response.status===429&&/free-models-per-day|daily.{0,30}limit|limit.{0,30}per.day|requests.{0,20}per.day|account.{0,30}quota/.test(detail);
   if(daily){attempts.push({model,status:429,reason:'daily_quota'});return {ok:false,error:'OpenRouter’s daily free-model allowance for this account has been reached. Switching between Qwen and Gemma cannot reset that shared allowance. Please try again after the quota resets; the source excerpts are still available.',code:'daily_quota',status:429,attempts};}
   const contextLimit=response.status===400&&/context|token|maximum.*length/.test(detail);
   const canFallback=response.status===429||response.status>=500||[404,408].includes(response.status)||contextLimit;
   attempts.push({model,status:response.status,reason:response.status===429?'provider_rate_limit':contextLimit?'context_limit':'provider_unavailable'});
   if(canFallback){providerCooldown.set(model,Date.now()+90000);continue;}
   return {ok:false,error:'OpenRouter could not accept this request. Please shorten the question or ask an administrator to check the model settings.',code:'request_rejected',status:502,attempts};
  }catch{attempts.push({model,status:504,reason:'timeout_or_network'});providerCooldown.set(model,Date.now()+90000);}
 }
 const rateLimited=attempts.some(a=>a.status===429);
 return {ok:false,error:rateLimited?'Both free models are currently unavailable or rate-limited by their providers. Qwen and Gemma were both tried. Please try again shortly; you can still read the matching source excerpts.':'Neither free model could complete the answer just now. Please try again shortly; the matching source excerpts are still available.',code:rateLimited?'providers_busy':'providers_unavailable',status:rateLimited?429:503,attempts};
}

