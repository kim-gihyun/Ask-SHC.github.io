export type Document = { id:string; title:string; url:string; organization:string; category:string; kind:string; retrievedAt:string; updatedLabel:string|null; historical:boolean; text:string; pages?:{page:number;text:string}[] };
export type Chunk = {id:string; documentId:string; title:string; url:string; organization:string; category:string; kind:string; retrievedAt:string; updatedLabel:string|null; historical:boolean; text:string; page?:number; score?:number};
import {directoryChunk,DIRECTORY_URL,requestedFloors} from './directory.ts';
export function chunksOf(d:Document):Chunk[]{
 const parts=d.pages?.length?d.pages:[{page:undefined,text:d.text}]; let i=0; const chunks:Chunk[]=[];
 for(const part of parts){
  const paragraphs=part.text.split(/\n\s*\n|\n/).map(s=>s.trim()).filter(Boolean);let buffer='';
  const push=()=>{if(buffer.trim().length>0){chunks.push({id:d.id+'-'+i++,documentId:d.id,title:d.title,url:d.url,organization:d.organization,category:d.category,kind:d.kind,retrievedAt:d.retrievedAt,updatedLabel:d.updatedLabel,historical:d.historical,text:buffer.trim(),...(part.page?{page:part.page}:{})});}};
  for(const para of paragraphs){for(let pos=0;pos<para.length;pos+=1200){const piece=para.slice(pos,pos+1200);if(buffer.length+piece.length>1700){push();buffer=buffer.slice(-220)+'\n';} buffer+=piece+'\n';}}
  push();
 } if(d.url===DIRECTORY_URL){const directory=directoryChunk(d);if(directory)chunks.unshift(directory);}return chunks;
}
const stop=new Set('the a an is are was were be been being to of in on at for from and or with this that those these i me my you your we our it its can could would should do does did how what when where who which please tell about there any have has will get shc jcsv iii shun hing college hku student village university hong kong'.split(' '));
export function tokens(text:string){return (text.toLowerCase().replace(/\b(\d+)(st|nd|rd|th)\b/g,'$1').match(/[a-z0-9]+/g)||[]).filter(t=>(t.length>1||/^\d+$/.test(t))&&!stop.has(t)).map(t=>t.replace(/(ing|ies|s)$/,(s)=>s==='ies'?'y':''));}
export function isTeamOverview(query:string){
 return /\b(teams|clubs|societies|organi[sz]ations?|organi[sz]ationa|groups|committees)\b/i.test(query)
  && !/\b(tutorial|tutors?|master|staff)\b/i.test(query)
  && (/\b(all|list|name|which|what|overview|available|join)\b/i.test(query)||/^teams[?!. ]*$/i.test(query.trim()));
}
export function retrieve(query:string,docs:Document[],limit=8):Chunk[]{
 // Overview coverage comes from the official navigation, not just lexical matches.
 // Include each linked organisation once before adding any extra excerpts.
 if(isTeamOverview(query)){
  const directory=docs.find(d=>d.id==='shc-student-organisations-directory');
  if(directory){
   const urls=new Set(directory.text.match(/https?:\/\/[^\s]+/g)||[]);
   const related=docs.filter(d=>urls.has(d.url)||d.organization==='Uploaded'&&/team|club|committee|societ|organi[sz]ation/i.test(d.title+' '+d.category));
   const evidence=[...chunksOf(directory),...related.flatMap(d=>chunksOf(d).slice(0,1))];
   // A larger explicit budget for broad inventories, rather than the default eight.
   let size=0;return evidence.filter(c=>{size+=c.text.length;return size<=45000;});
  }
 }

 query=query.replace(/\bjcsv\s*(?:3|iii)\b/gi,'JCSV III').replace(/\bwi[ -]fi\b/gi,'wifi');
 // Broad scholarship questions need both programmes, not eight chunks from one.
 // Choose the newest dated page for each programme; preserve specific year queries.
 if(/\bscholarships?\b/i.test(query)&&!/\bsports?\b|\bexchange\b|\b20\d{2}\b|\b\d{2}[-/]\d{2}\b/i.test(query)){
  const year=(d:Document)=>Number(d.title.match(/\b(20\d{2})\b/)?.[1]||('20'+(d.title.match(/\b(\d{2})[-/]\d{2}\b/)?.[1]||'00')));
  const introductions=[/Sports Scholars/i,/Shun Hing Exchange Scholarships/i].flatMap(pattern=>{
   const latest=docs.filter(d=>d.organization==='SHC'&&pattern.test(d.title)).sort((a,b)=>year(b)-year(a))[0];
   return latest?chunksOf(latest).slice(0,1):[];
  });
  const supplements=docs.filter(d=>d.organization==='Uploaded'&&/scholarship/i.test(d.title+' '+d.text)).flatMap(d=>chunksOf(d).slice(0,1));
  if(introductions.length)return [...introductions,...supplements].slice(0,limit);
 }
 const synonyms:Record<string,string>={rsa:'residential student adviser',rsas:'residential student advisers',ambassador:'residential student adviser',ambassadors:'residential student advisers',advisor:'adviser',advisors:'advisers',emt:'event management team',sc:'student committee',media:'photography media team',photography:'media photography team',wellness:'health wellness team',social:'social service team',guest:'visitor',guests:'visitors',fridge:'refrigerator',wifi:'internet network',washing:'laundry',rent:'lodging fees',quiet:'noise',leave:'check out',move:'check in',gym:'fitness',parcel:'mail',packages:'mail',cost:'fees charges',apply:'admission application',readmission:'readmission admission'};
 Object.assign(synonyms,{warden:'college master tutorial team',exercise:'fitness gym facilities',workout:'fitness gym',clothes:'laundry washing',card:'key card',pets:'animals pets',cat:'animals pets'});
 const expanded=query+' '+query.toLowerCase().split(/\W+/).map(w=>synonyms[w]||'').join(' ');
 const staffQuery=/\btutors?\b|tutorial team|\bmaster\b|resident fellows?/i.test(query);
 const terms=[...new Set(tokens(expanded))];
 if(!terms.length&&/shc|shun hing|jcsv|jockey club/i.test(query)){
  const about=docs.find(d=>/jcsv|jockey club/i.test(query)?d.url==='https://jockeyv3.hku.hk/':d.title==='About'&&d.organization==='SHC');
  return about?chunksOf(about).slice(0,2):[];
 }
 if(!terms.length)return [];
 const chunks=docs.flatMap(chunksOf);const bags=chunks.map(c=>tokens(c.title+' '+c.category+' '+c.text));
 const avg=bags.reduce((n,b)=>n+b.length,0)/bags.length;const df=new Map<string,number>();
 terms.forEach(t=>df.set(t,bags.filter(b=>b.includes(t)).length));
 const ranked=chunks.map((c,i)=>{const bag=bags[i];let score=0;let matched=0;
  for(const t of terms){const tf=bag.filter(w=>w===t).length;if(tf){matched++;score+=Math.log(1+(chunks.length-(df.get(t)||0)+.5)/((df.get(t)||0)+.5))*tf*2.2/(tf+1.2*(.25+.75*bag.length/avg));}}
  score*=.5+.5*matched/terms.length;
  const normalizedQuery=expanded.toLowerCase().replace(/[^a-z0-9]+/g,' ');
  const normalizedTitle=c.title.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  if(normalizedTitle.length>5&&normalizedQuery.includes(normalizedTitle))score+=8;
  if(c.id.endsWith('-directory')&&(staffQuery||requestedFloors(query).length))score+=40;
  if(c.historical&&!/20\d\d/.test(query))score*=.75;
  if(/lap.chee.*rule|chi sun.*rule|new college.*rule/i.test(c.title))score=0;
  return {...c,score};}).filter(c=>c.score>1.5).sort((a,b)=>b.score-a.score);
 const counts=new Map<string,number>();return ranked.filter(c=>{const n=counts.get(c.documentId)||0;if(n>=3)return false;counts.set(c.documentId,n+1);return true;}).slice(0,limit);
}
