import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {retrieve,tokens} from '../lib/retrieval.ts';
import {directoryAnswer,staffRecords} from '../lib/directory.ts';
const docs=JSON.parse(readFileSync(new URL('../data/knowledge.json',import.meta.url),'utf8'));
test('general scholarships question includes latest sports and exchange programmes',()=>{
 const sources=retrieve('What scholarships does SHC offer?',docs);
 assert.ok(sources.some(s=>/^Sports Scholars (?:20)?26-27$/.test(s.title)));
 assert.ok(sources.some(s=>s.title==='Shun Hing Exchange Scholarships 25-26'));
 const notice={...docs[0],id:'scholarship-update',organization:'Uploaded',title:'Supplementary scholarship notice',text:'The example scholarship programme has updated eligibility requirements. Consult this notice alongside the official college scholarship pages.'};
 assert.ok(retrieve('What scholarships does SHC offer?',[...docs,notice]).some(s=>s.documentId==='scholarship-update'));
});
for(const question of ['What is JCSV3?','What is JCSVIII?','Tell me about JCSV 3'])test(`village alias ${question}`,()=>{
 assert.ok(retrieve(question,docs).some(s=>s.url==='https://jockeyv3.hku.hk/'));
});
for(const [question,title] of [['Who is the warden of SHC?','Tutorial Team'],['Where can I exercise?','Facilities'],['How do I connect to Wi-Fi?','FAQs']])test(`paraphrase ${question}`,()=>{
 assert.ok(retrieve(question,docs).some(s=>s.title===title));
});
test('staff directory does not pretend to answer unlisted personal facts',()=>{
 for(const q of ['What is the age of the SHC master?','Who is the SHC master married to?','What is the SHC master favourite food?'])assert.equal(directoryAnswer(q,docs),null);
});
test('combined master and floor tutor question answers both parts',()=>{
 const answer=directoryAnswer('Who is the master of SHC and the tutor for 18/F?',docs).answer;
 assert.ok(answer.includes('David S. Lee'));assert.ok(answer.includes('Qiqi Chen'));
});
for(const question of ['what do resident student ambassadors do','What do RSAs do?','How can residential student advisors help me?'])test(`RSA wording: ${question}`,()=>{
 assert.equal(retrieve(question,docs)[0].title,'Residential Student Adviser Team');
});
for(const doc of docs.filter(d=>d.organization==='SHC'&&/team|club/i.test(d.title)))test(`team coverage: ${doc.title}`,()=>{
 assert.ok(retrieve(`What does ${doc.title} do?`,docs).some(c=>c.documentId===doc.id));
});
test('floor numbers including single digits survive retrieval',()=>{
 assert.ok(tokens('Who is my 5th floor tutor?').includes('5'));
 assert.ok(retrieve('Who is the 5/F tutor?',docs)[0].text.includes('Dr. Nicole Tsang'));
});
test('current master is taken from the tutorial page, not the founding master',()=>{
 const r=directoryAnswer('Who is the master of SHC?',docs);assert.ok(r.answer.includes('Prof. David S. Lee'));assert.equal(r.sources[0].title,'Tutorial Team');
 assert.equal(directoryAnswer('Who was the founding master?',docs),null);
});
const assignments={5:'Nicole Tsang',6:'Nicole Tsang',7:'Nicole Tsang',8:'Kevin Tsang',9:'Oliver Law',10:'Oliver Law',11:'Nathasya Tiaraputri',12:'Kevin Tsang',13:'Kevin Tsang',14:'Jeffrey Chan',15:'Qiqi Chen',16:'Qiqi Chen',17:'Kiri Chung',18:'Qiqi Chen',19:'Brenda Luo',20:'Brenda Luo',21:'Yan Lam',22:'Yan Lam',23:'Leah Li',24:'Leah Li',25:'Leah Li',26:'Hayk Azizbekyan',27:'Hayk Azizbekyan',28:'Hayk Azizbekyan'};
for(const [floor,name] of Object.entries(assignments))test(`floor ${floor} retrieves ${name}`,()=>{
 const r=directoryAnswer(`Who is the tutor for ${floor}/F?`,docs);assert.ok(r.answer.includes(name));assert.ok(r.answer.includes('[1]'));
});
test('the complete team and missing floor facts remain explicit',()=>{
 const r=directoryAnswer('List the whole tutorial team',docs);const records=staffRecords(docs.find(d=>d.title==='Tutorial Team'));
 assert.equal(records.length,14);for(const person of records)assert.ok(r.answer.includes(person.name));
 assert.ok(directoryAnswer('Who is the tutor for floor 3?',docs).answer.includes('does not list'));
 assert.equal(directoryAnswer('Where is the laundry on floor 5?',docs),null);
 assert.equal(directoryAnswer('What is the master salary?',docs),null);
 assert.equal(directoryAnswer('Who is the master of JCSV III?',docs),null);
 assert.equal(directoryAnswer('Who is the 5/F tutor of New College?',docs),null);
 const update={...docs[0],id:'update',organization:'Uploaded',title:'New tutorial team notice',text:'A revised resident tutor assignment is supplied for review.'};
 assert.equal(directoryAnswer('Who is the 5/F tutor?', [...docs,update]),null);
});
const cases=[
 ['What does the student committee do?','Student Committee'],
 ['What about EMT?','Event Management Team'],
 ['Who is the college master?','Tutorial Team'],
 ['What are visitor rules?','Management Rules'],
 ['Where can I do laundry?','FAQ'],
 ['How do I apply for readmission?','Admission'],
 ['What are the fees for 2026?','2026'],
 ['How do I contact the college office?','Contact'],
 ['Can I use a refrigerator in my room?','Remind'],
 ['Tell me about exchange scholarships','Scholarship'],
 ['How do I book a facility?','Facilit'],
];
for(const [question,title] of cases)test(`source coverage: ${question}`,()=>assert.ok(retrieve(question,docs).some(d=>d.title.toLowerCase().includes(title.toLowerCase())),question));
test('uploaded materials join retrieval and edits replace the evidence',()=>{
 const doc={id:'test',title:'SHC Zephyr room booking',organization:'Uploaded',url:'/api/documents/test',category:'Uploaded',kind:'Text',retrievedAt:'2026-09-20',updatedLabel:null,historical:false,text:'The Zephyr meeting room is available to residents. Book the Zephyr room through the college office at least two days before use.'};
 assert.equal(retrieve('How do I book the Zephyr room?',[...docs,doc])[0].documentId,'test');
 const changed={...doc,text:doc.text.replace('two days','five days')};
 assert.ok(retrieve('How do I book the Zephyr room?',[...docs,changed])[0].text.includes('five days'));
 assert.ok(!retrieve('Zephyr room booking',docs).some(s=>s.documentId==='test'));
});
