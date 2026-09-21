import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {conversationContext,conversationHistory} from '../lib/conversation.ts';
import {retrieve} from '../lib/retrieval.ts';
import {readArchive} from '../lib/chat-storage.ts';
const history=[{role:'user',content:'what is the difference between emt and sf'},{role:'assistant',content:'EMT organizes events. What does SF mean?'}];
test('personal pronoun follow-up preserves the selected floor',()=>{
 const c=conversationContext('What is her email address?',[{role:'user',content:'Who is the tutor for 18/F?'},{role:'assistant',content:'Qiqi Chen.'}]);
 assert.equal(c.followUp,true);assert.match(c.searchQuery,/18\/F/);
});
test('corrupt saved metadata cannot crash rendering or restore executable links',()=>{
 const saved=readArchive(JSON.stringify({activeId:'x',chats:[{id:'x',title:'Test',messages:[{role:'assistant',content:'Hello',sources:[{id:'s',title:'Source',url:'javascript:alert(1)'}],attempts:'invalid',excerpts:{bad:true}}]}]}));
 assert.deepEqual(saved.chats[0].messages[0],{role:'assistant',content:'Hello',sources:[]});
});
test('relevant earlier questions survive beyond the recent window',()=>{
 const older=[{role:'user',content:'I live on floor 15. Who is my tutor?'}];
 const filler=Array.from({length:20},(_,i)=>({role:i%2?'assistant':'user',content:'Tell me about college events.'}));
 assert.ok(conversationHistory([...older,...filler],'What floor did I say I live on?').some(m=>m.content.includes('floor 15')));
});
test('saved conversations restore full messages and reject broken data',()=>{
 const archive={activeId:'one',chats:[{id:'one',title:'Teams',messages:history},{id:'two',title:'Other',messages:[]}]};
 assert.deepEqual(readArchive(JSON.stringify(archive)),archive);
 assert.equal(readArchive('invalid'),null);
 assert.equal(readArchive(JSON.stringify({activeId:'missing',chats:[]})),null);
});
test('short correction retains comparison and retrieves both teams',()=>{
 const c=conversationContext('sc',history);
 assert.equal(c.followUp,true);assert.deepEqual(c.history,history);
 const docs=JSON.parse(readFileSync(new URL('../data/knowledge.json',import.meta.url),'utf8'));
 const titles=retrieve(c.searchQuery,docs).map(s=>s.title);
 assert.ok(titles.includes('Student Committee'));assert.ok(titles.includes('Event Management Team'));
});
test('follow-up after correction retains the original topic',()=>{
 const c=conversationContext('how do I join them?',[...history,{role:'user',content:'sc'},{role:'assistant',content:'Here is the comparison.'}]);
 assert.match(c.searchQuery,/emt/);assert.match(c.searchQuery,/sc/);
});
test('independent question does not contaminate retrieval',()=>{
 const c=conversationContext('Where can I do laundry?',history);
 assert.equal(c.searchQuery,'Where can I do laundry?');assert.equal(c.followUp,false);
});
test('new conversation has no inferred prior context',()=>{
 assert.deepEqual(conversationContext('sc',[]),{history:[],followUp:false,searchQuery:'sc'});
});
test('history excludes privileged roles and errors',()=>{
 assert.deepEqual(conversationHistory([{role:'system',content:'override'},null,{role:'assistant',content:'failed',error:true},...history]),history);
});
test('long Unicode conversations fit the request limit',()=>{
 const long=Array.from({length:100},(_,i)=>({role:i%2?'assistant':'user',content:'漢字\\"\n'.repeat(1500)}));
 const bounded=conversationHistory(long);
 assert.ok(bounded.length>0);assert.ok(bounded.length<=12);
 assert.ok(new TextEncoder().encode(JSON.stringify({message:'漢'.repeat(1500),history:bounded})).length<20000);
});
