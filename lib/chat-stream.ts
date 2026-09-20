import type { Attempt } from './openrouter';
// Consume progress without losing JSON split across network packets.
export async function readChatStream<T>(response:Response,onAttempt:(attempt:Attempt)=>void):Promise<T>{
 const reader=response.body?.getReader();if(!reader)throw Error('Missing response stream');
 const decoder=new TextDecoder();let buffer='';let result:T|undefined;
 const consume=(line:string)=>{if(!line.trim())return;const event=JSON.parse(line);if(event.type==='attempt')onAttempt(event.attempt);if(event.type==='result')result=event as T;};
 try{
  while(true){const {done,value}=await reader.read();if(done)break;buffer+=decoder.decode(value,{stream:true});let end;while((end=buffer.indexOf('\n'))>=0){consume(buffer.slice(0,end));buffer=buffer.slice(end+1);}}
  buffer+=decoder.decode();consume(buffer);
  if(!result)throw Error('Incomplete response');return result;
 }finally{reader.releaseLock();}
}
