export type Document = { id:string; title:string; url:string; organization:string; category:string; kind:string; retrievedAt:string; updatedLabel:string|null; historical:boolean; text:string; pages?:{page:number;text:string}[] };
export type Chunk = {id:string; documentId:string; title:string; url:string; organization:string; category:string; kind:string; retrievedAt:string; updatedLabel:string|null; historical:boolean; text:string; page?:number; score?:number};
import {directoryChunk,DIRECTORY_URL,requestedFloors} from './directory.ts';
export function chunksOf(d:Document):Chunk[]{
 const parts=d.pages?.length?d.pages:[{page:undefined,text:d.text}]; let i=0; const chunks:Chunk[]=[];
 for(const part of parts){
  const paragraphs=part.text.split(/\n\s*\n|\n/).map(s=>s.trim()).filter(Boolean);let buffer='';
  const push=()=>{if(buffer.trim().length>40){chunks.push({id:d.id+'-'+i++,documentId:d.id,title:d.title,url:d.url,organization:d.organization,category:d.category,kind:d.kind,retrievedAt:d.retrievedAt,updatedLabel:d.updatedLabel,historical:d.historical,text:buffer.trim(),...(part.page?{page:part.page}:{})});}};
  for(const para of paragraphs){for(let pos=0;pos<para.length;pos+=1200){const piece=para.slice(pos,pos+1200);if(buffer.length+piece.length>1700){push();buffer=buffer.slice(-220)+'\n';} buffer+=piece+'\n';}}
  push();
 } if(d.url===DIRECTORY_URL){const directory=directoryChunk(d);if(directory)chunks.unshift(directory);}return chunks;
}
const stop=new Set('the a an is are was were be been being to of in on at for from and or with this that those these i me my you your we our it its can could would should do does did how what when where who which please tell about there any have has will get shc jcsv iii shun hing college hku student village university hong kong'.split(' '));
export function tokens(text:string){return (text.toLowerCase().replace(/\b(\d+)(st|nd|rd|th)\b/g,'$1').match(/[a-z0-9]+/g)||[]).filter(t=>(t.length>1||/^\d+$/.test(t))&&!stop.has(t)).map(t=>t.replace(/(ing|ies|s)$/,(s)=>s==='ies'?'y':''));}
export function retrieve(query:string,docs:Document[],limit=8):Chunk[]{
 const synonyms:Record<string,string>={emt:'event management team',sc:'student committee',guest:'visitor',guests:'visitors',fridge:'refrigerator',wifi:'internet network',washing:'laundry',rent:'lodging fees',quiet:'noise',leave:'check out',move:'check in',gym:'fitness',parcel:'mail',packages:'mail',cost:'fees charges',apply:'admission application',readmission:'readmission admission'};
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
