// Keep the student evidence list focused while preserving exact citation mappings.
export function citedEvidence<T>(answer:string,sources:T[]){
 const used=[...new Set([...answer.matchAll(/\[(\d+)\]/g)].map(m=>Number(m[1])).filter(n=>n>=1&&n<=sources.length))].sort((a,b)=>a-b);
 if(!used.length)return {answer,sources};
 const references=new Map(used.map((n,i)=>[n,i+1]));
 return {answer:answer.replace(/\[(\d+)\]/g,(original,n)=>references.has(Number(n))?`[${references.get(Number(n))}]`:original),sources:used.map(n=>sources[n-1])};
}
