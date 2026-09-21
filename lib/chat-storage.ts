export const CHAT_STORAGE_KEY='ask-shc-conversations-v1';
export type SavedMessage={role:'user'|'assistant';content:string;[key:string]:unknown};
export type SavedChat={id:string;title:string;messages:SavedMessage[]};
export type ChatArchive={activeId:string;chats:SavedChat[]};
export function readArchive(raw:string|null):ChatArchive|null{
 try{
  const data=JSON.parse(raw||'null');
  if(!data||typeof data.activeId!=='string'||!Array.isArray(data.chats))return null;
  const chats=data.chats.filter((c:SavedChat)=>c&&typeof c.id==='string'&&typeof c.title==='string'&&Array.isArray(c.messages)&&c.messages.every(m=>m&&['user','assistant'].includes(m.role)&&typeof m.content==='string')).map((c:SavedChat)=>({...c,messages:c.messages.map(m=>{
   const clean:SavedMessage={role:m.role,content:m.content};
   for(const key of ['mode','model','modelNotice'])if(typeof m[key]==='string')clean[key]=m[key];
   for(const key of ['error','fallbackUsed'])if(typeof m[key]==='boolean')clean[key]=m[key];
   if(Array.isArray(m.sources))clean.sources=m.sources.every(s=>s&&typeof s.id==='string'&&typeof s.title==='string'&&typeof s.url==='string'&&['organization','category','kind','retrievedAt'].every(k=>typeof s[k]==='string')&&['text','updatedLabel'].every(k=>s[k]==null||typeof s[k]==='string')&&['page','chunks','characters'].every(k=>s[k]==null||typeof s[k]==='number')&&(!s.url||/^https?:\/\//i.test(s.url)||/^\/api\/documents\//.test(s.url)))?m.sources:[];
   if(Array.isArray(m.attempts))clean.attempts=m.attempts.filter(a=>a&&typeof a.model==='string'&&typeof a.status==='number'&&typeof a.reason==='string'&&typeof a.attemptedAt==='string');
   if(Array.isArray(m.excerpts))clean.excerpts=m.excerpts.filter(e=>e&&typeof e.text==='string'&&typeof e.title==='string'&&Number.isInteger(e.sourceIndex));
   return clean;
  })}));
  return chats.some((c:SavedChat)=>c.id===data.activeId)?{activeId:data.activeId,chats}:null;
 }catch{return null;}
}
