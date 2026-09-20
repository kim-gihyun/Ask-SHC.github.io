import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {documentFallback} from '../lib/document-fallback.ts';
const docs=JSON.parse(fs.readFileSync(new URL('../data/knowledge.json',import.meta.url),'utf8'));
test('committee outage fallback quotes real duties and keeps citation aligned',()=>{
 const committee=docs.find(d=>d.title==='Student Committee');
 const other=docs.find(d=>d.title==='Organizational Structure');
 const r=documentFallback('what does the student committee do?',[other,committee]);
 assert.equal(r.mode,'document-only');assert.equal(r.sources.length,1);assert.equal(r.sources[0].id,committee.id);
 assert.ok(r.excerpts[0].text.includes('identify residents’ needs'));
 assert.equal(r.excerpts[0].sourceIndex,1);
 for(const line of r.excerpts[0].text.split('\n\n'))assert.ok(committee.text.includes(line));
 assert.ok(r.answer.includes('not an AI-generated answer'));
});
test('document-only fallback deduplicates documents and limits excerpts',()=>{
 const source={id:'a-0',documentId:'a',title:'Residence guidance',url:'https://example.test',text:'Residents should register visitors at the security desk. Visitors need to leave at the required time.'};
 const r=documentFallback('visitor registration',[source,{...source,id:'a-1'},...docs.slice(0,5)]);
 assert.ok(r.sources.length<=3);assert.equal(r.sources.filter(s=>s.documentId==='a').length,1);
 r.excerpts.forEach(e=>assert.ok(r.sources[e.sourceIndex-1]));
});

test('an EMT comparison retains evidence for both groups',()=>{
 const sources=['Student Committee','Event Management Team'].map(title=>docs.find(d=>d.title===title));
 const r=documentFallback('what does the student committee do? what about emt? how are the two different?',sources);
 assert.deepEqual(r.sources.map(s=>s.title),['Student Committee','Event Management Team']);
 assert.ok(r.excerpts[1].text.includes('organising college events'));
});
