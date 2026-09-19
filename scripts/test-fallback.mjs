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
test('tries both models, then reports unavailability',async()=>{
 const called=[];const mock=async(_u,o)=>{called.push(JSON.parse(o.body).model);return Response.json({error:{message:'Provider returned error'}},{status:429});};
 const r=await completeWithFallback('test-key',messages,FREE_MODELS[0],mock);assert.equal(r.ok,false);assert.equal(r.code,'providers_busy');assert.equal(new Set(called).size,2);
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
