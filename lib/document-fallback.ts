type Evidence={id:string;documentId?:string;title:string;text:string;url:string;historical?:boolean;score?:number};
export type QuotedExcerpt={text:string;sourceIndex:number;title:string};
const ignored=new Set('what who where when how why does do is are the a an of for to in at can i me my please tell about shc college student'.split(' '));
const words=(s:string)=>(s.toLowerCase().match(/[a-z0-9]+/g)||[]).filter(w=>!ignored.has(w));
export function documentFallback<T extends Evidence>(query:string,sources:T[]){
 const terms=new Set(words(query));
 const normalized=query.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
 const exact=sources.find(s=>{const title=s.title.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();return title.length>5&&normalized.includes(title);});
 const chosen=exact?[exact]:sources.filter((s,i,a)=>a.findIndex(t=>(t.documentId||t.id)===(s.documentId||s.id))===i).slice(0,3);
 const excerpts:QuotedExcerpt[]=chosen.map((s,index)=>{
  const lines=s.text.split(/\n+/).map(l=>l.trim()).filter(l=>l.length>55);
  let passage='';
  if(exact&&lines.length){passage=lines.slice(0,3).join('\n\n');}
  else{
   const sentences=s.text.replace(/\s+/g,' ').match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g)||[s.text];
   const windows=sentences.map((sentence,i)=>{const text=sentence+(sentences[i+1]||'');const tokens=new Set(words(text));return {text:text.trim(),score:[...terms].filter(w=>tokens.has(w)).length};});
   passage=windows.sort((a,b)=>b.score-a.score)[0]?.text||s.text;
  }
  if(passage.length>1100){const cut=passage.lastIndexOf(' ',1050);passage=passage.slice(0,cut>0?cut:1050)+'…';}
  return {text:passage,sourceIndex:index+1,title:s.title};
 });
 return {answer:'AI generation is temporarily unavailable. Here are matching passages from the college documents. These are source quotations, not an AI-generated answer; they may not fully answer your question.',sources:chosen,excerpts,mode:'document-only' as const};
}
