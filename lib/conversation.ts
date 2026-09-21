export type ConversationMessage={role:'user'|'assistant';content:string};

// Bound the serialized history, including Unicode and JSON escaping, on both sides.
export function conversationHistory(value:unknown,query=''):ConversationMessage[]{
 if(!Array.isArray(value))return [];
 const words=new Set(query.toLowerCase().match(/[a-z0-9]{3,}/g)?.filter(w=>!['the','what','how','does','can','you','about','and','that','earlier','said','was','our'].includes(w))||[]);
 const older=value.slice(0,-8).map((item,index)=>({item,index,score:typeof item?.content==='string'?[...words].filter(w=>item.content.toLowerCase().includes(w)).length:0}));
 const recalled=older.filter(x=>x.score>0&&x.item.role==='user').sort((a,b)=>b.score-a.score||b.index-a.index).slice(0,4).sort((a,b)=>a.index-b.index).map(x=>x.item);
 const selected=recalled.length?[...recalled,...value.slice(-8)]:value.slice(-12);
 const result:ConversationMessage[]=[];
 for(const item of selected){
  if(!item||typeof item!=='object'||!['user','assistant'].includes(item.role)||typeof item.content!=='string'||item.error)continue;
  const content=item.content.trim().slice(0,2000);
  if(content)result.push({role:item.role,content});
 }
 while(result.length&&new TextEncoder().encode(JSON.stringify(result)).length>12000)result.shift();
 while(result[0]?.role==='assistant')result.shift();
 return result;
}

function dependent(query:string){
 return /\b(it|they|them|that|those|these|its|their|he|she|his|her|him|both|former|latter)\b|^(and\b|what about\b|how about\b|also\b|i meant\b|sorry\b|no[, ]|explain more\b|tell me more\b)/i.test(query)
  || (query.trim().split(/\s+/).length<=3&&!/^(who|what|where|when|why|how|is|are|can|does|do)\b/i.test(query));
}

export function conversationContext(query:string,value:unknown){
 const history=conversationHistory(value);
 const previous=history.filter(m=>m.role==='user');
 const followUp=previous.length>0&&dependent(query);
 let searchQuery=query;
 if(followUp){
  const context:string[]=[];
  for(let i=previous.length-1;i>=0;i--){
   context.unshift(previous[i].content);
   if(!dependent(previous[i].content))break;
  }
  // Retrieval needs both the original topic and the latest correction. The model
  // resolves intent from the actual turns; these search terms are not a new instruction.
  searchQuery=[...context,query].join(' ').slice(-6000);
 }
 return {history,followUp,searchQuery};
}
