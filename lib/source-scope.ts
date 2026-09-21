export function sourceScope(source:{title:string;organization:string}){
 if(/regulations governing residential colleges/i.test(source.title))return 'HKU residential colleges generally; not an SHC-specific rule';
 if(source.organization==='JCSV III'||/jcsv|jockey club student village/i.test(source.title))return 'JCSV III village-wide';
 if(source.organization==='SHC')return 'Hosted by SHC; infer the exact rule scope from the excerpt, not the host alone';
 return 'Supplementary material; determine scope and effective dates from the excerpt';
}
