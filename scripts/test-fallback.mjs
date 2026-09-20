import test from 'node:test';
import assert from 'node:assert/strict';
import {completeWithFallback,FREE_MODELS} from '../lib/openrouter.ts';
const messages=[{role:'user',content:'Test question'}];
const success=model=>Response.json({model,choices:[{message:{content:'Supported answer [1].'},finish_reason:'stop'}]});
test('falls back after provider rate limit and enforces free pricing',async()=>{
 const called=[];
 const mock=async(_url,options)=>{const body=JSON.parse(options.body);called.push(body.model);assert.deepEqual(body.provider.max_price,{prompt:0,completion:0});assert.ok(FREE_MODELS.includes(body.model));return called.length===1?Response.json({error:{message:'Provider returned error',metadata:{limit_source:'upstream_provider_shared_pool'}}},{status:429}):success(body.model);};
 const result=await completeWithFallback('test-key',messages,FREE_MODELS[0],mock);
 assert.equal(result.ok,true);assert.equal(called.length,2);assert.notEqual(called[0],called[1]);assert.equal(result.model,FREE_MODELS[1]);assert.equal(result.fallbackUsed,true);
});
test('account daily quota does not waste another request',async()=>{
 let calls=0;const mock=async()=>{calls++;return Response.json({error:{message:'Rate limit exceeded: free-models-per-day'}},{status:429});};
 const r=await completeWithFallback('test-key',messages,FREE_MODELS[0],mock);assert.equal(r.ok,false);assert.equal(r.code,'daily_quota');assert.equal(calls,1);
});
test('tries all 21 models, then reports unavailability',async()=>{
 const called=[];const mock=async(_u,o)=>{called.push(JSON.parse(o.body).model);return Response.json({error:{message:'Provider returned error'}},{status:429});};
 const r=await completeWithFallback('test-key',messages,FREE_MODELS[0],mock);assert.equal(r.ok,false);assert.equal(r.code,'providers_busy');assert.equal(new Set(called).size,FREE_MODELS.length);
});

test('reaches the last model and emits every attempt in order',async()=>{
 const called=[];const progress=[];
 const mock=async(_u,o)=>{const body=JSON.parse(o.body);called.push(body.model);assert.equal(body.provider.max_price.completion,0);return called.length<FREE_MODELS.length?Response.json({error:{message:'Provider busy'}},{status:429}):success(body.model);};
 const r=await completeWithFallback('test',messages,FREE_MODELS[0],mock,{onAttempt:a=>progress.push(a)});
 assert.equal(FREE_MODELS.length,21);assert.equal(r.ok,true);assert.deepEqual(called,FREE_MODELS);assert.deepEqual(progress,r.attempts);assert.equal(r.model,FREE_MODELS.at(-1));
});

test('an answer without valid citations falls through to another model',async()=>{
 let calls=0;const mock=async(_u,o)=>++calls===1?Response.json({choices:[{message:{content:'Unsupported response'},finish_reason:'stop'}]}):success(JSON.parse(o.body).model);
 const r=await completeWithFallback('test',messages,FREE_MODELS[0],mock,{validateAnswer:a=>a.includes('[1]')});
 assert.equal(r.ok,true);assert.equal(calls,2);assert.equal(r.attempts[0].reason,'invalid_citations');
});

test('mandatory reasoning model is not sent a disable-reasoning parameter',async()=>{
 const model=FREE_MODELS.find(m=>m.startsWith('liquid/'));
 const mock=async(_u,o)=>{const body=JSON.parse(o.body);assert.equal(body.reasoning.enabled,true);return success(body.model);};
 const r=await completeWithFallback('test',messages,model,mock);assert.equal(r.ok,true);
});

test('cancelled requests do not continue to new providers',async()=>{
 const controller=new AbortController();let calls=0;
 const mock=async()=>{calls++;controller.abort();throw Error('cancelled');};
 await assert.rejects(completeWithFallback('test',messages,FREE_MODELS[0],mock,{signal:controller.signal}));assert.equal(calls,1);
});
test('authentication errors do not retry',async()=>{
 let calls=0;const mock=async()=>{calls++;return Response.json({error:{message:'Invalid key'}},{status:401});};
 const r=await completeWithFallback('test-key',messages,FREE_MODELS[0],mock);assert.equal(r.ok,false);assert.equal(r.code,'authentication');assert.equal(calls,1);
});
test('context limit or truncated output triggers the other free model',async()=>{
 let calls=0;const mock=async(_u,o)=>{calls++;return calls===1?Response.json({error:{message:'Maximum context length exceeded'}},{status:400}):success(JSON.parse(o.body).model);};
 const r=await completeWithFallback('test-key',messages,FREE_MODELS[0],mock);assert.equal(r.ok,true);assert.equal(calls,2);
});
test('a paid model setting never makes a paid request',async()=>{
 const called=[];const mock=async(_u,o)=>{const m=JSON.parse(o.body).model;called.push(m);return success(m);};
 const r=await completeWithFallback('test-key',messages,'paid/model',mock);assert.equal(r.ok,true);assert.ok(FREE_MODELS.includes(called[0]));
});

test('Gemma as primary switches to Qwen when rate limited',async()=>{
 const called=[];
 const mock=async(_u,o)=>{const model=JSON.parse(o.body).model;called.push(model);return called.length===1?Response.json({error:{message:'Provider returned error'}},{status:429}):success(model);};
 const r=await completeWithFallback('test',messages,FREE_MODELS[1],mock);
 assert.deepEqual(called,[FREE_MODELS[1],FREE_MODELS[0]]);assert.equal(r.ok,true);assert.equal(r.fallbackUsed,true);
 assert.deepEqual(r.attempts.map(a=>a.reason),['provider_rate_limit','success']);
 assert.ok(r.attempts.every(a=>Number.isFinite(Date.parse(a.attemptedAt))));
});

test('a new question retries both models even immediately after both failed',async()=>{
 const called=[];
 const mock=async(_u,o)=>{called.push(JSON.parse(o.body).model);return Response.json({error:{message:'Provider returned error'}},{status:429});};
 for(let i=0;i<2;i++){
  const r=await completeWithFallback('test',messages,FREE_MODELS[0],mock);
  assert.equal(r.ok,false);assert.deepEqual(r.attempts.map(a=>a.model),FREE_MODELS);
 }
 assert.deepEqual(called,[...FREE_MODELS,...FREE_MODELS]);
});

test('an error inside a HTTP 200 response still switches models',async()=>{
 let calls=0;const mock=async(_u,o)=>++calls===1?Response.json({error:{code:429,message:'Provider returned error'}}):success(JSON.parse(o.body).model);
 const r=await completeWithFallback('test',messages,FREE_MODELS[0],mock);
 assert.equal(r.ok,true);assert.equal(calls,2);assert.equal(r.attempts[0].status,429);
});

test('output token exhaustion switches models',async()=>{
 let calls=0;const mock=async(_u,o)=>++calls===1?Response.json({choices:[{message:{content:'Truncated'},finish_reason:'length'}]}):success(JSON.parse(o.body).model);
 const r=await completeWithFallback('test',messages,FREE_MODELS[0],mock);
 assert.equal(r.ok,true);assert.equal(calls,2);assert.equal(r.attempts[0].reason,'output_limit');
});

test('successful primary does not unnecessarily request the other model',async()=>{
 let calls=0;const mock=async(_u,o)=>{calls++;return success(JSON.parse(o.body).model);};
 const r=await completeWithFallback('test',messages,FREE_MODELS[0],mock);
 assert.equal(r.ok,true);assert.equal(calls,1);assert.equal(r.fallbackUsed,false);
});
