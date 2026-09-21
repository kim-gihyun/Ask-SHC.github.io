import type {Document,Chunk} from './retrieval';
export const DIRECTORY_URL='https://shunhingcollege.hku.hk/tutorial-team/';
export type Staff={name:string;role:string;floors:number[];email:string};
export function staffRecords(doc:Pick<Document,'text'>):Staff[]{
 const lines=doc.text.split(/\n/).map(l=>l.trim()).filter(Boolean);const records:Staff[]=[];
 for(let i=0;i<lines.length-1;i++){
  if(!/^(Prof\.|Dr\.|Mr\.|Ms\.) /.test(lines[i]))continue;
  const role=lines[i+1];if(!/^(College Master|(?:Senior |Junior )?Resident (Tutor|Fellow))\b/.test(role))continue;
  const floorPart=role.match(/\(([^)]+)\/F\)/i)?.[1]||'';
  const floors=(floorPart.match(/\d+/g)||[]).map(Number);
  const next=lines.slice(i+2,i+9).join(' ');const email=next.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0]||'';
  records.push({name:lines[i],role:role.replace(/\s*\([^)]*\)\s*$/,''),floors,email});
 }
 return records;
}
export function staffLine(staff:Staff){return `${staff.name} — ${staff.role}${staff.floors.length?'; floors '+staff.floors.join(', '):'; no floor assignment listed'}${staff.email?'; email '+staff.email:''}`;}
export function directoryChunk(doc:Document):Chunk|null{
 const records=staffRecords(doc);if(!records.length)return null;
 return {id:doc.id+'-directory',documentId:doc.id,title:doc.title,url:doc.url,organization:doc.organization,category:doc.category,kind:doc.kind,retrievedAt:doc.retrievedAt,updatedLabel:doc.updatedLabel,historical:doc.historical,text:'SHC Tutorial Team: College Master, resident tutors, floor assignments and resident fellows.\n'+records.map(staffLine).join('\n')};
}
export function requestedFloors(query:string){
 const floors:number[]=[];
 for(const m of query.toLowerCase().matchAll(/\b(?:floor|level)\s*(\d{1,2})\b|\b(\d{1,2})(?:st|nd|rd|th)?\s*(?:floor|level|\/\s*f)\b/g))floors.push(Number(m[1]||m[2]));
 return [...new Set(floors)];
}
export function directoryAnswer(query:string,docs:Document[]){
 // Lookup values are parsed from the official page; biographies still use RAG.
 const doc=docs.find(d=>d.url===DIRECTORY_URL);if(!doc)return null;
 const source=directoryChunk(doc);if(!source)return null;
 const records=staffRecords(doc);const q=query.toLowerCase();const floors=requestedFloors(q);
 if(/lap.chee|chi sun|new college/i.test(q)||(/jcsv|jockey club/i.test(q)&&!/shc|shun hing/i.test(q)))return null;
 const nameMatch=records.filter(r=>q.includes(r.name.replace(/^(Prof\.|Dr\.|Mr\.|Ms\.) /,'').toLowerCase()));
 const staffIntent=/\btutors?\b|tutorial team|resident fellows?|college master|master of|shc.*master|master.*shc/.test(q)||nameMatch.length>0;
 if(!staffIntent)return null;
 if(/\b(?:age|birthday|married|family|favourite|favorite|nationality|private)\b|home address/.test(q))return null;
 // Uploaded staffing notices can change the answer or introduce conflicting dates.
 // Let RAG compare those notices rather than bypassing them with a seed-only lookup.
 if(docs.some(d=>d.organization==='Uploaded'&&/tutorial team|resident tutor|college master/i.test(d.title+' '+d.text)))return null;
 if(/\bfounding\b|\bformer\b|\bprevious\b|\b20\d{2}\b|\bwhy\b|biograph|background|qualifications?|responsibilit|duties|research|studied|teach|role of|what does|how (?:do|does|can|to)|application|apply|become|recruit|salary|pay|phone|whatsapp|office hours|room number/.test(q))return null;
 const wantsList=/\ball\b|\blist\b|tutorial team|\btutors\b|\bfellows\b/.test(q);const wantsMaster=/\bmaster\b/.test(q);
 if(!floors.length&&!wantsList&&!wantsMaster&&!nameMatch.length&&!/who|email|contact/.test(q))return null;
 if(/my (?:floor )?tutor/.test(q)&&!floors.length)return {answer:'Which floor do you live on? I can look up its tutor in the SHC tutorial-team directory.',sources:[source],mode:'directory'};
 let selected:Staff[]=[];
 if(floors.length)selected=records.filter(r=>(wantsMaster&&r.role==='College Master')||r.floors.some(f=>floors.includes(f)));
 else if(wantsMaster&&!wantsList)selected=records.filter(r=>r.role==='College Master');
 else if(nameMatch.length&&!wantsList)selected=nameMatch;
 else if(wantsList)selected=records.filter(r=>/tutorial team/.test(q)||wantsMaster||(/fellows?/.test(q)?/Fellow/.test(r.role):/Tutor/.test(r.role)));
 else return null;
 const missing=floors.filter(f=>!selected.some(r=>r.floors.includes(f)));const lines=selected.map(r=>staffLine(r)+' [1]');
 if(missing.length)lines.push(`The directory does not list a tutor assignment for floor${missing.length>1?'s':''} ${missing.join(', ')}. Please confirm with the college office. [1]`);
 if(!lines.length)return null;
 return {answer:`According to the SHC Tutorial Team page (checked ${doc.retrievedAt}):\n\n`+lines.join('\n\n'),sources:[source],mode:'directory'};
}
