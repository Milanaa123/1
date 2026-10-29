'use strict';
/* Exact-species Russian common names, fetched on demand from iNaturalist.
 * The scientific match is strict; broad genus/family common names cannot
 * masquerade as a species name. No user name, input, or scores leave the site.
 * Only the public scientific taxon name is queried; data is kept in RAM.
 */
(function (root) {
 const verified=new Map(), pending=new Map();
 const maxRequestsPerSearch=30;
 const cyrillic=/^[А-ЯЁа-яё][А-ЯЁа-яё\s\-–—()«».,'’]+$/u;
 const scientific=/^[A-Z][a-z-]+ [a-z-]+(?: [a-z-]+)?$/;
 function fromRow(row){
  return Array.isArray(row)&&typeof row[9]==='string'&&row[9] ? row[9] : (verified.get(row?.[1])||'');
 }
 async function resolve(row){
  if(!Array.isArray(row)||!scientific.test(row[1]||'')||
     !['species','subspecies'].includes(row[2]))return '';
  if(row[9])return row[9];
  const taxon=row[1],key=taxon+'|'+row[2];
  if(verified.has(taxon))return verified.get(taxon);
  if(pending.has(key))return pending.get(key);
  const request=(async()=>{
   try {
    const url='https://api.inaturalist.org/v1/taxa?q='+
      encodeURIComponent(taxon)+'&locale=ru&per_page=8';
    const response=await fetch(url,{headers:{Accept:'application/json'}});
    if(!response.ok)return '';
    const data=await response.json();
    const matches=(Array.isArray(data.results)?data.results:[]).filter(t=>
      typeof t.name==='string'&&t.name.toLocaleLowerCase('en')===taxon.toLocaleLowerCase('en')&&
      t.rank===row[2]&&Number.isSafeInteger(t.id));
    if(matches.length!==1)return '';
    const found=matches[0];
    const value=String(found.preferred_common_name||'').trim();
    if(!value||value.length>130||!cyrillic.test(value))return '';
    verified.set(taxon,value);
    return value;
   }catch{return '';}
   finally{pending.delete(key);}
  })();
  pending.set(key,request);
  return request;
 }
 let serial=0;
 function hydrate(rows,update){
  const ticket=++serial;
  const unique=new Map();
  for(const row of (rows||[])){
   if(!row?.[9]&&!verified.has(row?.[1])&&row?.[1]&&!unique.has(row[1]))
    unique.set(row[1],row);
   if(unique.size>=maxRequestsPerSearch)break;
  }
  const queued=[...unique.values()];
  // Controlled concurrency avoids flooding the external public API.
  let at=0;
  async function worker(){
   while(at<queued.length&&ticket===serial){
    const row=queued[at++];
    const value=await resolve(row);
    if(value&&ticket===serial&&typeof update==='function')update(row,value);
   }
  }
  return Promise.all([worker(),worker()]);
 }
 root.AnimagiaRussianNames=Object.freeze({get:fromRow,resolve,hydrate,cancel:()=>{serial++;},source:'iNaturalist Russian lexicon, exact scientific rank/name only'});
})(typeof window!=='undefined'?window:globalThis);
