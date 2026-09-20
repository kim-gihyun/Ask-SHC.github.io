import test from 'node:test';
import assert from 'node:assert/strict';
import {readChatStream} from '../lib/chat-stream.ts';
test('stream parser handles split packets and incremental attempts',async()=>{
 const encoder=new TextEncoder();const chunks=['{"type":"attempt","attempt":{"model":"first"}}\n{"ty','pe":"attempt","attempt":{"model":"second"}}\n','{"type":"result","answer":"Cited answer [1]."}'];
 const response=new Response(new ReadableStream({start(c){chunks.forEach(s=>c.enqueue(encoder.encode(s)));c.close();}}));
 const attempts=[];const result=await readChatStream(response,a=>attempts.push(a.model));
 assert.deepEqual(attempts,['first','second']);assert.equal(result.answer,'Cited answer [1].');
});
test('an interrupted stream does not pretend to have a final answer',async()=>{
 await assert.rejects(readChatStream(new Response('{"type":"attempt","attempt":{}}\n'),()=>{}),/Incomplete response/);
});
