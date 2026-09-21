'use client';
import { readChatStream } from '../lib/chat-stream';
import { conversationHistory } from '../lib/conversation';
import { CHAT_STORAGE_KEY,readArchive,type SavedChat } from '../lib/chat-storage';
import { modelName } from '../lib/models';
import type { Attempt } from '../lib/openrouter';
import { useEffect,useRef,useState } from 'react';
import { Square,ArrowUp,ArrowUpRight,BookOpen,Check,ChevronRight,FileText,HelpCircle,LoaderCircle,MessageSquare,Plus,ShieldCheck,Trash2,X,Menu,Copy } from 'lucide-react';
type Source={id:string;title:string;url:string;organization:string;category:string;kind:string;retrievedAt:string;updatedLabel:string|null;historical:boolean;chunks?:number;characters?:number;text?:string;page?:number};
type Message={role:'user'|'assistant';content:string;sources?:Source[];error?:boolean;mode?:string;model?:string;fallbackUsed?:boolean;attempts?:Attempt[];modelNotice?:string;excerpts?:{text:string;sourceIndex:number;title:string}[]};
const attemptLabels:Record<string,string>={success:'Answer received',provider_rate_limit:'Provider rate limit',daily_quota:'Shared daily allowance reached',authentication:'Key or permission rejected',account_limit:'Account restriction',context_limit:'Context limit',output_limit:'Output limit',empty_answer:'Empty answer',provider_unavailable:'Provider unavailable',timeout_or_network:'Timed out or connection failed',invalid_citations:'Missing or invalid source citations'};
function ModelAttempts({message}:{message:Message}){
 if(!message.attempts?.length)return null;
 return <details className="model-attempts" open={message.mode==='document-only'||message.mode==='pending'||message.fallbackUsed}>
  <summary>Model attempts · {message.attempts.length+' tried'}</summary>
  <ol>{message.attempts.map((a,i)=><li key={i}><div><strong>{modelName(a.model)}</strong><span>{i===0?'First attempt':'Switched to other model'} · Free</span></div><div><span>{attemptLabels[a.reason]||'Request failed'}{a.status>0?' · Status '+a.status:''}</span><time dateTime={a.attemptedAt}>{new Date(a.attemptedAt).toLocaleTimeString('en-GB')}</time></div></li>)}</ol>
  {message.modelNotice&&<p>{message.modelNotice}</p>}
 </details>;
}
type ChatResult={error?:string;answer?:string;sources?:Source[];mode?:string;model?:string;fallbackUsed?:boolean;attempts?:Attempt[];modelNotice?:string;excerpts?:{text:string;sourceIndex:number;title:string}[]};
const suggestions=['What are the rules for visitors?','How do I apply for readmission?','Where can I do my laundry?','Can I use electrical appliances in my room?'];
export default function Home({testMode=false}:{testMode?:boolean}){
 const [pickerOpen,setPickerOpen]=useState(false);
 const requestController=useRef<AbortController|null>(null);
 useEffect(()=>()=>requestController.current?.abort(),[]);
 const [deletedChat,setDeletedChat]=useState<SavedChat|null>(null);
 function deleteChat(id:string){if(busy)return;const chat=id===activeChat?{id,title:messages.find(m=>m.role==='user')?.content||'Conversation',messages}:savedChats.find(c=>c.id===id);if(!chat)return;setDeletedChat(chat);setSavedChats(prev=>prev.filter(c=>c.id!==id));if(id===activeChat){setActiveChat(crypto.randomUUID());setMessages([]);setQuestion('');setSelected(null);}}
 function undoDelete(){if(!deletedChat)return;setSavedChats(prev=>[...prev.filter(c=>c.id!==deletedChat.id),deletedChat]);setDeletedChat(null);}
 const storageKey=CHAT_STORAGE_KEY+(testMode?"-admin":"");
 const [view,setView]=useState('chat'),[messages,setMessages]=useState<Message[]>([]),[question,setQuestion]=useState(''),[busy,setBusy]=useState(false),[selected,setSelected]=useState<Source|null>(null),[menu,setMenu]=useState(false),[copied,setCopied]=useState(-1);
 const [pendingAttempts,setPendingAttempts]=useState<Attempt[]>([]);
 const [savedChats,setSavedChats]=useState<SavedChat[]>([]),[activeChat,setActiveChat]=useState(''),[storageReady,setStorageReady]=useState(false),[storageError,setStorageError]=useState(false);
 useEffect(()=>{
  try{const saved=readArchive(localStorage.getItem(storageKey));if(saved){setSavedChats(saved.chats);setActiveChat(saved.activeId);setMessages(saved.chats.find(c=>c.id===saved.activeId)!.messages as Message[]);}else setActiveChat(crypto.randomUUID());}
  // eslint-disable-next-line react-hooks/set-state-in-effect -- Browser-only storage hydration must run after SSR; report storage failure once.
  catch{setActiveChat(crypto.randomUUID());setStorageError(true);}
  setStorageReady(true);
 },[storageKey]);
 useEffect(()=>{
  if(!storageReady||!activeChat)return;
  const current={id:activeChat,title:messages.find(m=>m.role==='user')?.content.slice(0,65)||'New conversation',messages};
  const chats=[...savedChats.filter(c=>c.id!==activeChat),current];
  // eslint-disable-next-line react-hooks/set-state-in-effect -- Report the result of synchronizing React state to external browser storage.
  try{localStorage.setItem(storageKey,JSON.stringify({activeId:activeChat,chats}));setStorageError(false);}catch{setStorageError(true);}
 },[messages,activeChat,savedChats,storageReady,storageKey]);
 function changeConversation(id?:string){
  if(busy||!storageReady)return;
  setSavedChats(prev=>[...prev.filter(c=>c.id!==activeChat),{id:activeChat,title:messages.find(m=>m.role==='user')?.content.slice(0,65)||'New conversation',messages}]);
  setActiveChat(id||crypto.randomUUID());setMessages(id?(savedChats.find(c=>c.id===id)?.messages as Message[]||[]):[]);setQuestion('');go('chat');
 }
 const sidebar=useRef<HTMLElement>(null);
 useEffect(()=>{
  if(!menu)return;
  const previous=document.activeElement as HTMLElement|null;
  const focusable=()=>Array.from(sidebar.current?.querySelectorAll<HTMLElement>('a[href],button:not(:disabled),select:not(:disabled)')||[]).filter(el=>el.offsetParent!==null);
  focusable()[0]?.focus();
  const handle=(event:KeyboardEvent)=>{if(event.key==='Escape'){setMenu(false);setPickerOpen(false);event.preventDefault();}if(event.key==='Tab'){const elements=focusable();const first=elements[0],last=elements.at(-1);if(event.shiftKey&&document.activeElement===first){last?.focus();event.preventDefault();}else if(!event.shiftKey&&document.activeElement===last){first?.focus();event.preventDefault();}}};
  document.addEventListener('keydown',handle);return()=>{document.removeEventListener('keydown',handle);previous?.focus();};
 },[menu]);
 const end=useRef<HTMLDivElement>(null);const input=useRef<HTMLTextAreaElement>(null);
 useEffect(()=>{end.current?.scrollIntoView({behavior:'smooth',block:'end'});},[messages,busy,pendingAttempts]);
 async function ask(q:string){if(busy||!storageReady||!q.trim())return;const previous=messages;requestController.current=new AbortController();setMessages([...previous,{role:'user',content:q.trim()}]);setQuestion('');setBusy(true);setPendingAttempts([]);setSelected(null);
  try{
   const r=await fetch('/api/chat',{signal:requestController.current!.signal,method:'POST',headers:{'Content-Type':'application/json',Accept:'application/x-ndjson',...(testMode?{'X-Admin-Diagnostics':'1'}:{})},body:JSON.stringify({message:q,history:conversationHistory(previous,q)})});
   const d:ChatResult=r.headers.get('content-type')?.includes('application/x-ndjson')?await readChatStream<ChatResult>(r,a=>setPendingAttempts(prev=>[...prev,a])):await r.json() as ChatResult;
   setMessages(m=>[...m,{role:'assistant',content:d.answer||d.error||'Please try again.',sources:d.sources||[],error:!r.ok||!!d.error,mode:d.mode,model:d.model,fallbackUsed:d.fallbackUsed,excerpts:d.excerpts,attempts:d.attempts,modelNotice:d.modelNotice}]);
  }catch{setMessages(m=>[...m,{role:'assistant',mode:requestController.current?.signal.aborted?'cancelled':undefined,content:requestController.current?.signal.aborted?'Answer stopped. You can try again when ready.':'The connection was interrupted. Please try again.',error:true}]);}finally{requestController.current=null;setBusy(false);setPendingAttempts([]);input.current?.focus();}}

 function go(next:string){setView(next);setMenu(false);setSelected(null);}
 const conversationEntries=[{id:activeChat,title:messages.find(m=>m.role==='user')?.content||'Current conversation'},...savedChats.filter(c=>c.id!==activeChat&&c.messages.length).slice().reverse()];
 function inlineAnswer(content:string,sources:Source[]=[]){return content.split(/(\[\d+\]|\*\*[^*]+\*\*)/g).map((part,i)=>{const n=part.match(/^\[(\d+)\]$/);if(n&&sources[Number(n[1])-1])return <button className="citation" key={i} aria-label={'View source '+n[1]} onClick={()=>setSelected(sources[Number(n[1])-1])}>{n[1]}</button>;if(part.startsWith('**'))return <strong key={i}>{part.slice(2,-2)}</strong>;return part;});}
 function answerText(content:string,sources:Source[]=[]){
  return content.split(/\n\s*\n/).map((block,i)=>{
   const lines=block.split('\n');
   if(lines.every(line=>/^\s*[-*]\s+/.test(line)))return <ul className="answer-list" key={i}>{lines.map((line,n)=><li key={n}>{inlineAnswer(line.replace(/^\s*[-*]\s+/,''),sources)}</li>)}</ul>;
   if(lines.every(line=>/^\s*\d+\.\s+/.test(line)))return <ol className="answer-list" key={i}>{lines.map((line,n)=><li key={n}>{inlineAnswer(line.replace(/^\s*\d+\.\s+/,''),sources)}</li>)}</ol>;
   return <p key={i}>{inlineAnswer(block.replace(/^#{1,6}\s+/gm,''),sources)}</p>;
  });
 }
 return <div className="app-shell">
 <a className="skip" href="#main">Skip to content</a>
 {menu&&<button className="mobile-shade" aria-label="Close navigation" onClick={()=>setMenu(false)}/>}
 <aside ref={sidebar} className={'sidebar '+(menu?'open':'')} onKeyDown={e=>{if(e.key==='Escape'){setMenu(false);setPickerOpen(false);}}}>
  <a href="https://shunhingcollege.hku.hk/" target="_blank" rel="noreferrer" className="logo-window" aria-label="Shun Hing College official website"><img src="/shc-logo.png" alt="Shun Hing College, HKU"/></a>

  <button className="new-chat" onClick={()=>changeConversation()} disabled={busy||!storageReady}><Plus size={18}/> New conversation</button>
  <section className="recent-chats" aria-label="Recent chats"><h2>Recent chats</h2><div className="recent-chat-list">{conversationEntries.map(c=><div className="recent-chat-row" key={c.id}><button disabled={busy||!storageReady} aria-current={c.id===activeChat?'true':undefined} title={c.title} onClick={()=>{if(c.id!==activeChat)changeConversation(c.id);}}><MessageSquare size={14}/><span>{c.title}</span></button><button className="delete-chat" aria-label={'Delete chat: '+c.title} disabled={busy||!storageReady} onClick={()=>deleteChat(c.id)}><Trash2 size={14}/></button></div>)}</div></section>
  <div className="chat-picker" onKeyDown={e=>{if(e.key==='Escape')setPickerOpen(false);}} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget))setPickerOpen(false);}}><button className="chat-picker-trigger" aria-expanded={pickerOpen} aria-controls="saved-chat-menu" disabled={busy||!storageReady} onClick={()=>setPickerOpen(!pickerOpen)}><MessageSquare size={16}/><span>{messages.find(m=>m.role==='user')?.content||'Current conversation'}</span><ChevronRight size={16} className={pickerOpen?'picker-chevron open':'picker-chevron'}/></button>{pickerOpen&&<div id="saved-chat-menu" className="chat-picker-menu"><span className="picker-heading">Saved conversations</span>{conversationEntries.map(c=><div className="chat-picker-row" key={c.id}><button aria-current={c.id===activeChat?'true':undefined} onClick={()=>{if(c.id!==activeChat)changeConversation(c.id);setPickerOpen(false);}}><span>{c.title}</span>{c.id===activeChat&&<Check size={15}/>}</button><button className="delete-chat" aria-label={'Delete chat: '+c.title} disabled={busy} onClick={()=>deleteChat(c.id)}><Trash2 size={15}/></button></div>)}</div>}</div>
  {deletedChat&&<div className="chat-deleted" role="status">Chat deleted. <button onClick={undoDelete}>Undo</button></div>}
  <p className="chat-storage-note" role="status">{storageError?'Browser storage is unavailable or full. This chat is not saved.':'Chats saved on this browser.'}</p>
  <nav aria-label="Main navigation">
   <button className={view==='chat'?'active':''} onClick={()=>go('chat')}><MessageSquare size={19}/> Ask SHC <ChevronRight size={16}/></button>
  </nav>

  <div className="sidebar-bottom"><a href="https://shunhingcollege.hku.hk/" target="_blank" rel="noreferrer">Shun Hing College <ArrowUpRight size={15}/></a><a href="https://jockeyv3.hku.hk/" target="_blank" rel="noreferrer">JCSV III website <ArrowUpRight size={15}/></a><div className="university hku-brand"><img src="/hku-logo.png" alt="HKU crest"/><span>The University<br/>of Hong Kong</span></div></div>
 </aside>
 <div className="workspace">
  <header className="topbar"><div><button className="menu-button" aria-label="Open navigation" aria-expanded={menu} onClick={()=>setMenu(true)}><Menu size={21}/></button><span className="breadcrumb">Shun Hing College</span><ChevronRight size={14}/><strong>{view==='chat'?'Student help desk':view==='library'?'Source library':'Manage documents'}</strong></div>{testMode&&<span className="preview-label">Admin test chat</span>}</header>
  <div className="workarea"><main id="main" className={'main '+(view==='chat'?'chat-main':'')}>
   {view==='chat'&&<>
    <div className="chat-scroll">
    {!messages.length?<section className="welcome"><div className="assistant-mark" aria-hidden="true"><MessageSquare size={29}/></div><h1>How can we help?</h1><p>Ask about SHC and JCSV III.</p><div className="suggestions">{suggestions.map((s,i)=><button key={s} onClick={()=>void ask(s)}><span className="suggestion-icon">{i===0?<ShieldCheck size={18}/>:i===1?<BookOpen size={18}/>:i===2?<HelpCircle size={18}/>:<FileText size={18}/>}</span>{s}<ArrowUpRight size={16}/></button>)}</div></section>:<div className="conversation" aria-live="polite" aria-relevant="additions">{messages.map((m,i)=><article key={i} className={'message '+m.role}><div className="message-label">{m.role==='user'?'You':<><span className="mini-mark"><MessageSquare size={14}/></span>Ask SHC{m.mode==='document-only'&&<span className="document-mode"><BookOpen size={13}/> Document-only mode</span>}{m.error&&<span className="answer-status">{m.mode==='cancelled'?'Stopped':'Couldn’t complete answer'}</span>}</>}</div><div className="message-body">{answerText(m.content,m.sources)}</div>{m.excerpts?.map((excerpt,n)=><section className="quoted-evidence" key={n}><button onClick={()=>setSelected(m.sources?.[excerpt.sourceIndex-1]||null)}><BookOpen size={15}/>{excerpt.title}<span className="citation">{excerpt.sourceIndex}</span></button><blockquote>{excerpt.text}</blockquote></section>)}{m.sources?.length?<details className="answer-sources"><summary><BookOpen size={14}/><span>Sources · {m.sources.length}</span><ChevronRight size={14}/></summary><div className="source-chips">{m.sources.map((s,n)=><button key={s.id+n} onClick={()=>setSelected(s)}><span>{n+1}</span>{s.title.length>42?s.title.slice(0,42)+'…':s.title}</button>)}</div></details>:null}{testMode&&m.role==='assistant'&&<ModelAttempts message={m}/>}{m.role==='assistant'&&<div className="message-actions">{testMode&&m.model&&<span className="model-label">{modelName(m.model)} · Free{m.fallbackUsed?' · Fallback':null}</span>}<button onClick={async()=>{try{await navigator.clipboard.writeText(m.content+(m.excerpts?.length?"\n\n"+m.excerpts.map(e=>e.text+" ["+e.sourceIndex+"]").join("\n\n"):""));setCopied(i);setTimeout(()=>setCopied(-1),1800);}catch{setCopied(-1);}}}>{copied===i?<Check size={14}/>:<Copy size={14}/>} {copied===i?'Copied':'Copy answer'}</button>{m.error&&<button disabled={busy} onClick={()=>void ask(messages[i-1]?.content||'')}>Try again</button>}</div>}</article>)}{busy&&<><div className="thinking" role="status"><LoaderCircle size={18} className="spin"/> {testMode&&pendingAttempts.length?"Trying the next free model…":"Preparing your answer…"}</div>{testMode&&<ModelAttempts message={{role:"assistant",content:"",mode:"pending",attempts:pendingAttempts}}/>}</>}<div ref={end}/></div>}
    </div>
    <div className="composer-area"><form className="composer" onSubmit={e=>{e.preventDefault();void ask(question);}}><textarea ref={input} aria-label="Your question" placeholder="What would you like to know?" value={question} maxLength={1500} rows={2} onChange={e=>setQuestion(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();void ask(question);}}}/><div className="composer-footer"><span><BookOpen size={14}/> Answers with sources</span>{busy?<button className="send stop-answer" type="button" aria-label="Stop answer" onClick={()=>requestController.current?.abort()}><Square size={17}/></button>:<button className="send" type="submit" disabled={!storageReady||!question.trim()} aria-label="Send question"><ArrowUp size={21}/></button>}</div></form><p className="fine-print">AI can make mistakes. Check the cited documents for the official wording.</p></div>
   </>}
  </main>
  {selected&&<aside className="source-rail has-selection" aria-label="Source details"><div className="rail-heading"><span>Source details</span><button aria-label="Close source details" onClick={()=>setSelected(null)}><X size={18}/></button></div><div className="source-detail"><span className="source-org">{selected.organization} · {selected.kind}</span><h2>{selected.title}</h2>{selected.page&&<p>Page {selected.page}</p>}<p className="source-date">Collected {selected.retrievedAt}{selected.updatedLabel&&<><br/>Source revision: {selected.updatedLabel}</>}</p>{selected.historical&&<div className="date-warning">This source is historical or date-sensitive. Check the academic year and any newer notices.</div>}{selected.text?<><h3>Retrieved excerpt</h3><blockquote>{selected.text}</blockquote></>:<p className="source-date">{selected.chunks} searchable excerpts · {selected.characters?.toLocaleString()} characters</p>}{selected.url&&<a className="source-link" href={selected.url+(selected.page&&selected.url.startsWith('http')?'#page='+selected.page:'')} target="_blank" rel="noreferrer">Open original source <ArrowUpRight size={16}/></a>}</div>
  </aside>}</div>
 </div></div>;
}
