import{writeFileSync}from'node:fs';
const history=[],results=[];
for(const message of ['Who is the tutor for 5/F?','What about 18/F?','What is her email address?']){
 await new Promise(r=>setTimeout(r,9000));const start=Date.now();const r=await fetch('http://localhost:5173/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message,history})});const d=await r.json();results.push({question:message,status:r.status,ms:Date.now()-start,...d});history.push({role:'user',content:message},{role:'assistant',content:d.answer||''});writeFileSync('data/stress-followup.json',JSON.stringify(results,null,2));console.log(JSON.stringify({question:message,status:r.status,answer:d.answer}));
}
const burst=await Promise.all(Array.from({length:12},async(_,i)=>{const start=Date.now();const r=await fetch('http://localhost:5173/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:'zxqvblmnop'+String.fromCharCode(97+i)})});return {status:r.status,ms:Date.now()-start,...await r.json()}}));writeFileSync('data/stress-burst.json',JSON.stringify(burst,null,2));console.log({burst:burst.map(r=>r.status)});
