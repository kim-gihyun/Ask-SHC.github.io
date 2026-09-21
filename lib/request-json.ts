export class InputError extends Error{status:number;constructor(message:string,status=400){super(message);this.status=status;}}
export async function readJson(request:Request,maxBytes:number):Promise<Record<string,unknown>>{
 if(Number(request.headers.get('content-length')||0)>maxBytes)throw new InputError('Request is too large.',413);
 const reader=request.body?.getReader();if(!reader)throw new InputError('A JSON request body is required.');
 const parts:Uint8Array[]=[];let size=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>maxBytes){await reader.cancel();throw new InputError('Request is too large.',413);}parts.push(value);}}finally{reader.releaseLock();}
 const bytes=new Uint8Array(size);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.length;}
 try{const data=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));if(!data||typeof data!=='object'||Array.isArray(data))throw Error();return data;}catch{throw new InputError('Please send a valid JSON object.');}
}
