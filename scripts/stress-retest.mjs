import {writeFileSync} from 'node:fs';
const cases=['What is JCSV3?','Who is the warden of SHC?','help','How do I book a room?','How do I book a function room?','What is the age of the SHC master?','What are the rules for overnight guests? Do any exceptions apply?','What facilities are available at JCSV III?','How can I contact SHC?','How do I report broken facilities?','What should I do if I am locked out?','What scholarships does SHC offer?'];
const results=[];let history=[];
for(let i=0;i<cases.length;i++){
 const started=Date.now();const question=cases[i];
 try{const r=await fetch('http://localhost:5173/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:question,history:question==='sc'?history:[]}),signal:AbortSignal.timeout(280000)});const data=await r.json();results.push({question,status:r.status,ms:Date.now()-started,...data});if(question.includes('EMT and SF'))history=[{role:'user',content:question},{role:'assistant',content:data.answer||''}];console.log(JSON.stringify({i:i+1,question,status:r.status,mode:data.mode,sources:data.sources?.length,ms:Date.now()-started}));}catch(e){results.push({question,error:e.message});}
 writeFileSync('data/stress-retest.json',JSON.stringify(results,null,2));
 if(i<cases.length-1)await new Promise(r=>setTimeout(r,Math.max(0,9000-(Date.now()-started))));
}
