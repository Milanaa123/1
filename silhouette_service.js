'use strict';
/* Animal illustrations only — no person/name data, no artificial drawings.
 * PhyloPic API v2. Select CC0/Public Domain silhouettes only.
 * Exact taxon first; optional clearly-labelled same-genus fallback.
 * SVG is loaded through a CORS-checked Blob, safe to draw into PNG.
 */
(() => {
 const API='https://api.phylopic.org';
 const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
 const cache=new Map();
 let buildPromise=null;
 function external(href){
  if(typeof href!=='string')return null;
  try{
   const url=new URL(href,API);
   const host=url.hostname.toLowerCase();
   if(url.protocol!=='https:' || !(host==='phylopic.org'||host.endsWith('.phylopic.org')))return null;
   return url.href;
  }catch{return null;}
 }
 const embedded=data=>{
  const items=data?._embedded?.items;
  return Array.isArray(items)?items:items?[items]:[];
 };
 function exactName(node,name){
  const possible=[node?.name,node?.scientificName,node?.canonicalName,
    ...(Array.isArray(node?.names)?node.names:[]),
    ...(Array.isArray(node?._embedded?.names)?node._embedded.names:[])];
  return possible.some(item=>{
   const s=typeof item==='string'?item:item?.value||item?.name||item?.text||item?.scientificName||'';
   return String(s).trim().replace(/\s+/g,' ').toLowerCase()===name.toLowerCase();
  });
 }
 function imageUuid(item){
  if(UUID.test(String(item?.uuid||'')))return item.uuid;
  const href=item?._links?.self?.href;
  const match=typeof href==='string'&&href.match(/\/images\/([0-9a-f-]{36})/i);
  return match&&UUID.test(match[1])?match[1]:null;
 }
 async function apiJson(path,query){
  const u=new URL(path,API);
  for(const [k,v] of Object.entries(query||{}))u.searchParams.set(k,String(v));
  const r=await fetch(u.href,{
   headers:{Accept:'application/vnd.phylopic.v2+json'},
   mode:'cors',credentials:'omit',cache:'no-store',
   signal:typeof AbortSignal!=='undefined'&&typeof AbortSignal.timeout==='function'?AbortSignal.timeout(9000):undefined
  });
  if(!r.ok)throw Error('PhyloPic: HTTP '+r.status);
  return r.json();
 }
 async function currentBuild(){
  if(!buildPromise)buildPromise=apiJson('/').then(d=>{
   if(!Number.isSafeInteger(d.build))throw Error('PhyloPic: версия каталога недоступна');
   return d.build;
  }).catch(err=>{buildPromise=null;throw err;});
  return buildPromise;
 }
 async function lookup(name,allowClade){
  const build=await currentBuild();
  const nodes=await apiJson('/nodes',{
   build,filter_name:name.toLowerCase(),embed_items:true,page:0
  });
  const item=embedded(nodes).find(n=>exactName(n,name));
  if(!item||!UUID.test(String(item.uuid||'')))return null;
  // Only public-domain artwork, safe to recolor and download as PNG.
  const query={
   build,embed_items:true,page:0,filter_license_by:false,
   filter_license_nc:false,filter_license_sa:false
  };
  query[allowClade?'filter_clade':'filter_node']=item.uuid;
  const found=await apiJson('/images',query);
  for(const entry of embedded(found)){
   const uuid=imageUuid(entry);
   const href=external(entry?._links?.vectorFile?.href);
   if(uuid&&href)return {uuid,url:href,name};
  }
  return null;
 }
 async function objectArt(target){
  const response=await fetch(target.url,{mode:'cors',credentials:'omit',signal:typeof AbortSignal!=='undefined'&&typeof AbortSignal.timeout==='function'?AbortSignal.timeout(9000):undefined});
  if(!response.ok)throw Error('Не удалось получить силуэт SVG');
  const type=(response.headers.get('content-type')||'').toLowerCase();
  const raw=await response.blob();
  if(raw.size>1500000)throw Error('Слишком большой рисунок');
  // Blob URL is same-origin for canvas export. <img> SVG mode never executes JS.
  if(!(type.includes('svg')||raw.type.includes('svg')||/\.svg(?:\?|$)/i.test(target.url)))
   throw Error('Неподдерживаемый формат рисунка');
  const url=URL.createObjectURL(new Blob([raw],{type:'image/svg+xml'}));
  const img=new Image();
  try{
   await new Promise((resolve,reject)=>{
    img.onload=resolve;img.onerror=()=>reject(Error('Не удалось открыть рисунок'));
    img.src=url;
   });
   if(!(img.naturalWidth>0&&img.naturalHeight>0))throw Error('Пустое изображение');
   // Object URL remains available for in-page image and PNG, until selection changes.
   return {...target,src:url,img,link:'https://www.phylopic.org/images/'+target.uuid,
      message:target.level==='species'?'Силуэт точного вида':
       'Обобщённый силуэт '+({genus:'рода',order:'отряда',class:'класса'}[target.level]||'группы')+' '+target.name,
      exact:target.level==='species',
      license:'CC0 / общественное достояние (фильтр PhyloPic)'};
  }catch(e){URL.revokeObjectURL(url);throw e;}
 }
 async function find(row){
  if(!Array.isArray(row)||typeof row[1]!=='string')return null;
  const name=row[1].trim();
  if(!/^[A-Z][A-Za-z-]+(?: [a-z-]+){1,2}$/.test(name))return null;
  const levels=[
   {name,level:'species',clade:false},
   {name:name.split(' ')[0],level:'genus',clade:true},
   {name:row[4],level:'order',clade:true},
   {name:row[3],level:'class',clade:true}
  ];
  const visited=new Set();
  for(const candidate of levels){
   if(typeof candidate.name!=='string'||!/^[A-Z][A-Za-z-]+$/.test(candidate.name))continue;
   if(visited.has(candidate.name.toLowerCase()))continue;
   visited.add(candidate.name.toLowerCase());
   try{
    const artwork=await lookup(candidate.name,candidate.clade);
    if(artwork)return await objectArt({...artwork,level:candidate.level});
   }catch(_){}
  }
  return null;
 }
 function load(row){
  const name=Array.isArray(row)?row[1]:'';
  if(!name)return Promise.resolve(null);
  const key=[row[1],row[3],row[4]].join('|');
  if(!cache.has(key))cache.set(key,find(row).then(found=>{
   if(!found)cache.delete(key);
   return found;
  }));
  return cache.get(key);
 }
 function release(){
  for(const p of cache.values())void p.then(v=>{if(v?.src)URL.revokeObjectURL(v.src)}).catch(()=>{});
  cache.clear();
 }
 window.AnimagiaSilhouettes={load,release};
})();
