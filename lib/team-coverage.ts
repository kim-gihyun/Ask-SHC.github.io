import type {Chunk} from './retrieval';
// Validate broad inventories against the retrieved navigation, never model memory.
export function completeTeamOverview(answer:string,sources:Chunk[]){
 const directory=sources.filter(s=>s.documentId==='shc-student-organisations-directory');
 const names=[...new Set(directory.flatMap(s=>s.text.split('\n').filter(line=>/ — https?:/.test(line)).map(line=>line.split(' — ')[0].trim())))];
 if(!names.length)return true;
 const normal=(s:string)=>s.toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9]/g,'');
 const text=normal(answer);
 if(names.some(name=>!text.includes(normal(name))))return false;
 const totals=[...answer.replace(/\*\*/g,'').matchAll(/\b(?:all|total of|covers|lists)\s+(\d+)\s+(?:entries|groups|teams|organisations|organizations|clubs)\b/gi)];
 return totals.every(match=>Number(match[1])===names.length);
}

export function teamDirectoryAnswer(sources:Chunk[]){
 const directory=sources.filter(s=>s.documentId==='shc-student-organisations-directory');
 const lines=directory.flatMap(s=>s.text.split('\n'));const seen=new Set<string>();const sections:string[]=[];
 for(const line of lines){
  if(seen.has(line))continue;seen.add(line);
  if(/ — https?:/.test(line))sections.push('- '+line.split(' — ')[0]);
  else if(/^(Community Teams|Art and Culture|Academic Knowledge Exchange|Sports Clubs)(?: \(\d+ groups\))?$/.test(line.trim()))sections.push('\n**'+line.trim()+'**');
 }
 return {answer:'The official SHC website lists these student teams, committees and clubs.\n\n'+sections.join('\n')+'\n\n'+directory.map((_,i)=>'['+(i+1)+']').join('')+' Website listing does not confirm current recruitment or activity.',sources:directory,mode:'source-directory'};
}
