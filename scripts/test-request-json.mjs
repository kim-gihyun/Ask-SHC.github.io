import test from 'node:test';
import assert from 'node:assert/strict';
import {readJson} from '../lib/request-json.ts';
const request=body=>new Request('https://example.test',{method:'POST',body});
test('valid bounded JSON is parsed',async()=>assert.deepEqual(await readJson(request('{"message":"hello"}'),100),{message:'hello'}));
for(const body of ['null','[]','broken','"string"'])test(`invalid body ${body} is a client error`,async()=>{
 await assert.rejects(readJson(request(body),100),e=>e.status===400);
});
test('size limit works without Content-Length and counts Unicode bytes',async()=>{
 await assert.rejects(readJson(request(JSON.stringify({message:'漢'.repeat(40)})),100),e=>e.status===413);
});
