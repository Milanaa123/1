'use strict';
/* Russian names must be independently attested for this EXACT species.
 * Never transliterate scientific Latin into a pretend Russian common name.
 * Public taxon names only; no visitor identity or numerological data is sent.
 */
(function(root){
 const verified=new Map(), provenance=new Map(), pending=new Map(), noName=new Set();
 const maxRequestsPerSearch=30;
 const cyrillic=/^[А-ЯЁа-яё][А-ЯЁа-яё\s\-–—()«».,'’]+$/u;
 const scientific=/^[A-Z][a-z-]+ [a-z-]+(?: [a-z-]+)?$/;
 const exact=(a,b)=>String(a||'').toLowerCase()===String(b||'').toLowerCase();
 const validRussian=s=>typeof s==='string' && s.length<=130 && cyrillic.test(s.trim());
 function fromRow(row){
  return Array.isArray(row)&&typeof row[9]==='string'&&row[9]
    ?row[9]:verified.get(row?.[1])||'';
 }
 function sourceFor(row){return row?.[9]?'Catalogue of Life / BirdNET+':provenance.get(row?.[1])||'';}
 async function lookupINaturalist(row){
  try{
   const url='https://api.inaturalist.org/v1/taxa?q='+
    encodeURIComponent(row[1])+'&locale=ru&per_page=8';
   const response=await fetch(url,{headers:{Accept:'application/json'}});
   if(!response.ok)return '';
   const data=await response.json();
   const matches=(Array.isArray(data.results)?data.results:[]).filter(t=>
    exact(t.name,row[1])&&t.rank===row[2]&&Number.isSafeInteger(t.id));
   if(matches.length!==1)return '';
   const name=String(matches[0].preferred_common_name||'').trim();
   return validRussian(name)?name:'';
  }catch{return '';}
 }
 async function lookupGBIF(row){
  try{
   const u='https://api.gbif.org/v1/species/match?strict=true&name='+encodeURIComponent(row[1]);
   const response=await fetch(u,{headers:{Accept:'application/json'}});
   if(!response.ok)return '';
   const d=await response.json();
   if(d.matchType!=='EXACT'||d.status!=='ACCEPTED'||d.rank!==row[2].toUpperCase()||
      !exact(d.canonicalName,row[1])||d.kingdom!=='Animalia'||
      (row[3]&&d.class!==row[3])||
      (row[4]&&d.order!==row[4])||
      (row[6]&&d.phylum!==row[6])||
      (row[7]&&d.family!==row[7])||
      !Number.isSafeInteger(d.usageKey))return '';
   const namesResponse=await fetch('https://api.gbif.org/v1/species/'+d.usageKey+
      '/vernacularNames?limit=100',{headers:{Accept:'application/json'}});
   if(!namesResponse.ok)return '';
   const payload=await namesResponse.json();
   const entries=(Array.isArray(payload.results)?payload.results:[]).filter(x=>
      ['ru','rus','russian'].includes(String(x.language||'').toLowerCase()) &&
      validRussian(x.vernacularName));
   const unique=new Map();
   for(const x of entries){
    const name=x.vernacularName.trim();
    const old=unique.get(name);
    unique.set(name,Boolean(x.preferred)||Boolean(x.isPreferredName)||Boolean(old));
   }
   if(unique.size===1)return [...unique.keys()][0];
   // Multiple distinct local names require one unambiguously preferred label.
   const preferred=[...unique].filter(([,preferred])=>preferred);
   return preferred.length===1?preferred[0][0]:'';
  }catch{return '';}
 }
 async function resolve(row){
  if(!Array.isArray(row)||!scientific.test(row[1]||'')||
     !['species','subspecies'].includes(row[2]))return '';
  if(row[9])return row[9];
  const taxon=row[1],key=taxon+'|'+row[2];
  if(verified.has(taxon))return verified.get(taxon);
  if(noName.has(key))return '';
  if(pending.has(key))return pending.get(key);
  const request=(async()=>{
   try{
    const first=await lookupINaturalist(row);
    const name=first||await lookupGBIF(row);
    if(name){
     verified.set(taxon,name);
     provenance.set(taxon,first?'iNaturalist':'GBIF');
     return name;
    }
    noName.add(key);
    return '';
   }finally{pending.delete(key);}
  })();
  pending.set(key,request);
  return request;
 }
 let serial=0;
 function hydrate(rows,update){
  const ticket=++serial;
  const unique=new Map();
  for(const row of rows||[]){
   if(!row?.[9]&&!verified.has(row?.[1])&&row?.[1]&&!noName.has(row[1]+'|'+row[2])&&!unique.has(row[1]))
    unique.set(row[1],row);
   if(unique.size>=maxRequestsPerSearch)break;
  }
  const queued=[...unique.values()];
  let index=0;
  async function worker(){
   while(index<queued.length&&ticket===serial){
    const row=queued[index++];
    const value=await resolve(row);
    if(value&&ticket===serial&&typeof update==='function')update(row,value);
   }
  }
  return Promise.all([worker(),worker()]);
 }
 root.AnimagiaRussianNames=Object.freeze({get:fromRow,resolve,hydrate,sourceFor,
  cancel:()=>{serial++;},source:'iNaturalist + GBIF exact species names'});
})(typeof window!=='undefined'?window:globalThis);
