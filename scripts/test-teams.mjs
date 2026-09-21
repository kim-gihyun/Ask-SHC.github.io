import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {retrieve} from '../lib/retrieval.ts';
const docs=JSON.parse(readFileSync(new URL('../data/knowledge.json',import.meta.url)));
const directory=JSON.parse(readFileSync(new URL('../data/teams-directory.json',import.meta.url)));
for(const q of ['on what teams in shc','name all student organizationa dna teams','What student organisations can I join?','List all clubs','teams'])test('complete group evidence: '+q,()=>{
 const sources=retrieve(q,docs);const combined=sources.map(s=>s.text).join('\n');
 for(const group of directory.groups)for(const entry of group.entries)assert.ok(combined.includes(entry.name),entry.name);
 for(const title of ['Student Committee','Event Management Team','Health and Wellness Team','Social Service Team','Photography Team'])assert.ok(sources.some(s=>s.title===title),title);
 assert.ok(combined.length<=45000);assert.equal(new Set(sources.map(s=>s.id)).size,sources.length);
});
for(const [q,title] of [['What does the media team do?','Photography Team'],['What is SC?','Student Committee'],['What does EMT do?','Event Management Team']])test(q,()=>assert.ok(retrieve(q,docs).some(s=>s.title===title)));
test('broad team coverage includes relevant supplementary material',()=>{
 const supplement={...docs[0],id:'new-group',title:'Student organisation recruitment update',category:'Student organisations',organization:'Uploaded',text:'The student teams recruitment schedule has changed. Applications open in October; this notice supplements the official organisation pages.'};
 assert.ok(retrieve('List all student teams',[...docs,supplement]).some(s=>s.documentId==='new-group'));
});
import {completeTeamOverview} from '../lib/team-coverage.ts';
test('overview validator rejects omissions and incorrect totals',()=>{
 const sources=retrieve('List all teams',docs);const full=directory.groups.flatMap(g=>g.entries.map(e=>e.name)).join('\n');
 assert.ok(completeTeamOverview(full,sources));
 assert.equal(completeTeamOverview(full.replace('Student Committee',''),sources),false);
 assert.equal(completeTeamOverview(full+' all 26 entries',sources),false);
 assert.ok(completeTeamOverview(full+' all 30 entries',sources));
});
import {teamDirectoryAnswer} from '../lib/team-coverage.ts';
test('unavailable model fallback lists every official organisation with valid references',()=>{
 const result=teamDirectoryAnswer(retrieve('List all teams',docs));
 assert.ok(completeTeamOverview(result.answer,result.sources));
 assert.equal(result.mode,'source-directory');
 for(const match of result.answer.matchAll(/\[(\d+)\]/g))assert.ok(Number(match[1])<=result.sources.length);
});
