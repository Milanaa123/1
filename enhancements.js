'use strict';
const oldReset=reset;
let photoStamp=0,observer,queue=[],busy=0;
reset=function(){photoStamp++;queue.length=0;if(observer)observer.disconnect();window.AnimagiaRussianNames?.cancel();oldReset();};
function inspectImage(data,name,rank){
  for(const x of data&&Array.isArray(data.results)?data.results:[]){
    if(String(x.name||'').toLowerCase()!==name.toLowerCase()||x.rank!==rank)continue;
    const p=x.default_photo;
    if(!p||!p.medium_url||!['cc0','cc-by','cc-by-sa','cc-by-nc','cc-by-nc-sa'].includes(String(p.license_code||'').toLowerCase()))continue;
    try{const u=new URL(p.medium_url);
      if(u.protocol!=='https:'||!['static.inaturalist.org','inaturalist-open-data.s3.amazonaws.com'].includes(u.hostname))continue;
      if(!Number.isInteger(Number(x.id)))continue;
      // Verify a tiny iNaturalist preview first; download the larger photo
      // only when the visitor opens the photo viewer.
      let preview=p.medium_url;
      for(const suggested of [p.square_url,p.thumb_url]){
        if(!suggested)continue;
        try{
          const thumbnail=new URL(suggested);
          if(thumbnail.protocol==='https:'&&
            ['static.inaturalist.org','inaturalist-open-data.s3.amazonaws.com'].includes(thumbnail.hostname)){
            preview=suggested;break;
          }
        }catch{}
      }
      return {src:p.medium_url,preview,source:'https://www.inaturalist.org/taxa/'+Number(x.id),credit:(p.attribution||'iNaturalist')+' · '+p.license_code.toUpperCase()};
    }catch{}
  }return null;
}
function loadPhotos(){
  while(busy<1&&queue.length){
    const j=queue.shift();if(j.stamp!==photoStamp)continue;busy++;
    (async()=>{try{
      const u='https://api.inaturalist.org/v1/taxa?q='+encodeURIComponent(j.row[1])+'&per_page=8';
      const r=await fetch(u);if(!r.ok)throw Error('Photo API');
      const p=inspectImage(await r.json(),j.row[1],j.row[2]==='subspecies'?'subspecies':'species');
      if(!p||j.stamp!==photoStamp)return;
      const image=document.createElement('img');image.src=p.src;image.alt='Фото '+display(j.row);image.loading='lazy';image.decoding='async';
      image.onerror=()=>{image.remove();j.credit.textContent='Фото не найдено';};
      j.media.append(image);
      const link=document.createElement('a');link.href=p.source;link.target='_blank';link.rel='noopener noreferrer';link.textContent='Фото: '+p.credit;
      j.credit.replaceChildren(link);
    }catch{if(j.stamp===photoStamp)j.credit.textContent='Фото не найдено';}finally{await new Promise(ok=>setTimeout(ok,700));busy--;loadPhotos();}})();
  }
}
function auditSum(greek){
  const target=el('letterBreakdown');target.replaceChildren();let total=0;
  for(const word of greek.trim().split(/\s+/)){
    const section=document.createElement('section');section.className='audit-word';
    const header=document.createElement('h4');header.textContent=word+' = '+score(word);
    const chips=document.createElement('div');chips.className='letter-table';
    for(const c of norm(word)){if(W[c]===undefined)continue;total+=W[c];
      const tag=document.createElement('span');tag.className='letter-chip';
      const a=document.createElement('span');a.textContent=c;
      const b=document.createElement('small');b.textContent=W[c];tag.append(a,b);chips.append(tag);
    }section.append(header,chips);target.append(section);
  }
  const totalLine=document.createElement('p');totalLine.className='audit-total';totalLine.textContent='Итого: '+total+' · разница с каждым совпадением 0';target.append(totalLine);
}
function classifyRow(row){return row[3]||row[6]||'other';}
function filterName(row){return GROUP[row[3]]||category(row);}
function renewFilter(picks){
  const s=el('groupFilter'),selected=s.value;s.replaceChildren();
  const all=document.createElement('option');all.value='all';all.textContent='Все группы';s.append(all);
  const used=new Set();
  for(const row of picks){const group=classifyRow(row);if(used.has(group))continue;used.add(group);
    const option=document.createElement('option');option.value=group;option.textContent=filterName(row);s.append(option);}
  s.value=used.has(selected)?selected:'all';
}
render=function(){
  photoStamp++;queue.length=0;if(observer)observer.disconnect();
  if(typeof IntersectionObserver!=='undefined'){
    observer=new IntersectionObserver(entries=>{for(const e of entries){
      if(!e.isIntersecting||!e.target._item)continue;
      observer.unobserve(e.target);queue.push(e.target._item);e.target._item=null;loadPhotos();
    }},{rootMargin:'260px'});
  }else observer=null;
  const selected=featured(results);renewFilter(selected);
  const filter=el('groupFilter').value,picks=filter==='all'?selected:selected.filter(r=>classifyRow(r)===filter);
  const fragment=document.createDocumentFragment();
  const uiNames=new Map();
  for(const [i,row] of picks.entries()){
    const li=document.createElement('li');li.className='species-row';
    const media=document.createElement('div');media.className='photo-media';
    const placeholder=document.createElement('span');placeholder.className='photo-placeholder';
    placeholder.textContent=({Mammalia:'🐾',Aves:'🪶',Reptilia:'🦎',Amphibia:'🐸',Arachnida:'🕷',Insecta:'🦋',Teleostei:'🐟'})[row[3]]||'✧';media.append(placeholder);
    const card=document.createElement('div');card.className='photo-content';
    const index=document.createElement('span');index.className='idx';index.textContent=String(i+1).padStart(2,'0');
    const body=document.createElement('span');
    const name=document.createElement('span');name.className='animal-name';name.textContent=display(row);
    uiNames.set(row[1],name);
    const latin=document.createElement('small');latin.textContent=row[1]+(row[5]?' · '+status(row):'');
    const reading=document.createElement('small');reading.className='russian-name-note';
    reading.textContent=verifiedRussianName(row)?'Подтверждённое русское название вида':
      'Русское название этого вида не установлено; показана группа животного';
    const renderedGreek=document.createElement('small');
    renderedGreek.textContent='По-гречески (транслитерация): '+taxonGreek(row[1]);
    body.append(name,latin,reading,renderedGreek);card.append(index,body);
    const meta=document.createElement('div');meta.className='photo-meta';
    const credit=document.createElement('span');credit.textContent='Фото не найдено';
    const details=document.createElement('details');details.className='animal-detail';
    const toggle=document.createElement('summary');toggle.textContent='Проверка совпадения';
    const info=document.createElement('div');info.textContent='Научное название: '+row[1]+' · Греческая запись: '+taxonGreek(row[1])+' · Греческая сумма животного: '+taxonGreekScore(row[1])+' · Число имени: '+sum+' · Разница: '+Math.abs(row[0]-sum)+'. '+filterName(row)+' · Семейство: '+familyDisplay(row);
    details.append(toggle,info);meta.append(credit,details);li.append(media,card,meta);fragment.append(li);
    const photoRank=row[2];
    if(!row[5]&&/^[A-Z][a-z-]+ [a-z-]+(?: [a-z-]+)?$/.test(row[1])&&['species','subspecies'].includes(photoRank)){
      const item={row,media,credit,stamp:photoStamp};
      if(observer){media._item=item;observer.observe(media);}else{queue.push(item);loadPhotos();}
    }
  }
  el('preview').replaceChildren(fragment);
  window.AnimagiaRussianNames?.hydrate(picks,(row,common)=>{
    const target=uiNames.get(row[1]);
    if(target?.isConnected){
      target.textContent=common;
      const source=window.AnimagiaRussianNames?.sourceFor(row)||'проверенный источник';
      target.title='Русское название вида · '+source;
      const note=target.parentElement?.querySelector('.russian-name-note');
      if(note)note.textContent='Подтверждённое русское название вида · '+source;
    }
  });
  el('featuredCount').textContent=selected.length+' из '+results.length+' точных совпадений';
  el('previewSection').hidden=!results.length;el('downloads').hidden=!results.length;
  el('empty').textContent=results.length?'':'Точных совпадений в выбранной базе нет. Приблизительные животные не добавляются.';
};
// Release quality gate: do not display matches from a stale, mismatched or
// incompletely audited shard. SHA-256 detects delivery/caching inconsistency;
// it does not certify the ecological status of every taxon.
function verifyAuditMetadata(fresh){
 const q=fresh.quality_audit;
 if(!q||q.status!=='passed'||!Number.isSafeInteger(q.checked_records)||
    q.checked_records!==fresh.unique_records ||
    q.checked_buckets!==fresh.available_buckets.length ||
    !fresh.bucket_sha256||typeof fresh.bucket_sha256!=='object'||
    Object.keys(fresh.bucket_sha256).length!==q.checked_buckets ||
    !/^[a-f0-9]{64}$/.test(String(q.index_sha256||'')))
   throw Error('Контроль целостности каталога отсутствует или не совпадает. Обнови страницу.');
 const rank=q.rank_counts||{};
 if((rank.species||0)+(rank.subspecies||0)!==q.checked_records)
   throw Error('Счётчик видов не совпадает с проверенным индексом.');
}
async function verifyShardBody(raw,bucket,manifest){
 const expected=manifest[String(bucket)];
 if(typeof expected!=='string'||!/^[a-f0-9]{64}$/.test(expected))
  throw Error('Для файла отсутствует контрольная сумма.');
 if(!globalThis.crypto?.subtle || typeof TextEncoder==='undefined')
  throw Error('Проверка SHA-256 недоступна. Открой сайт через HTTPS.');
 const bytes=new TextEncoder().encode(raw);
 const digest=await globalThis.crypto.subtle.digest('SHA-256',bytes);
 const actual=[...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
 if(actual!==expected)
  throw Error('Файл животных не совпадает с опубликованным каталогом.');
}
function showAuditReport(fresh){
 const quality=fresh.quality_audit;
 const target=document.getElementById('qualityAuditSummary');
 const classes=document.getElementById('qualityAuditGroups');
 if(target)target.textContent='Пересчитано и структурно проверено '+quality.checked_records.toLocaleString('ru-RU')+
   ' записей в '+quality.checked_buckets+' файлах. Метод '+fresh.algorithm_id+
   '. Версия источника: '+fresh.version+'.';
 if(classes){
  const most=Object.entries(quality.class_counts).sort((a,b)=>b[1]-a[1]).slice(0,7);
  classes.textContent='Группы каталога: '+most.map(([name,count])=>
    (GROUP[name]||CLASS_RU[name]||name)+' — '+count.toLocaleString('ru-RU')).join('; ')+'.';
 }
}
run=async function(){
 const raw=el('name').value.trim(),latin=el('latin').value.trim(),greek=el('greek').value.trim();
 if(!/^[А-Яа-яЁё\s\-'’]+$/.test(raw)||!validLatinName(latin)||!validGreek(greek)){
  reset();el('error').textContent='Проверь три записи имени: русскую, латинскую и греческую. Допустимы только буквы соответствующих алфавитов.';return;
 }
 const target=score(greek),id=++serial;
 if(!target){reset();el('error').textContent='Число имени не определено';return;}
 el('run').disabled=true;el('runLabel').textContent='Проверяю греческие суммы…';el('error').textContent='';
 try{
  // Always retrieve the matching index's metadata first: stale cache cannot
  // silently mix pre-migration Latin scores with Greek scores.
  const metaResponse=await fetch('./meta.json',{cache:'no-store'});
  if(!metaResponse.ok)throw Error('Не удалось проверить версию каталога');
  const fresh=await metaResponse.json();
  if(fresh.algorithm_id!==GREEK_TAXON_RULE_VERSION)
   throw Error('Каталог ещё не пересчитан по греческим названиям. Обнови страницу.');
  if(fresh.catalog_filter_version!=='independent-noncolonial-fauna-v3')
   throw Error('Каталог без вымерших и неподходящих групп ещё не опубликован. Обнови страницу после публикации.');
  if(!Array.isArray(fresh.test_vectors)||fresh.test_vectors.length<5)
   throw Error('Отсутствуют контрольные расчёты каталога');
  for(const vector of fresh.test_vectors){
   if(taxonGreek(vector.latin)!==vector.greek||
      score(vector.greek)!==vector.score||
      taxonGreekScore(vector.latin)!==vector.score)
     throw Error('Греческая таблица не совпадает с версией каталога');
  }
  if(!Array.isArray(fresh.available_buckets))throw Error('Некорректное описание каталога');
  verifyAuditMetadata(fresh);
  if(id!==serial)return;
  meta=fresh;
  let matches=[];const bucket=Math.floor(target/25);
  if(meta.available_buckets.includes(bucket)){
   const response=await fetch('./data/'+bucket+'.json',{cache:'no-store'});
   if(!response.ok)throw Error('Большой каталог животных недоступен');
   const body=await response.text();if(id!==serial)return;
   await verifyShardBody(body,bucket,fresh.bucket_sha256);
   if(id!==serial)return;
   const data=JSON.parse(body);
   if(!Array.isArray(data))throw Error('Некорректный формат индекса');
   matches=data.filter(row=>Array.isArray(row)&&row[0]===target);
   if(matches.some(row=>row.length!==10 ||
      !['species','subspecies'].includes(row[2]) || row[5]!=='' ||
      !row[3] || !row[6] || [row[7],row[8],row[9]].some(x=>typeof x!=='string') || !/^[A-Z][A-Za-z-]+(?: [a-z-]+){1,2}$/.test(row[1]) ||
      taxonGreekScore(row[1])!==target))
    throw Error('Сумма транслитерированного греческого названия не совпала с индексом');
  }
  if(id!==serial)return;
  results=matches;sum=target;
  showAuditReport(fresh);
  el('score').textContent=String(sum);el('total').textContent=String(matches.length);
  el('formula').textContent=breakdown(greek)+' · разница 0';
  auditSum(greek);el('groupFilter').value='all';
  el('resultPanel').hidden=false;render();
  el('resultPanel').scrollIntoView({behavior:'smooth',block:'start'});
 }catch(err){if(id===serial){reset();el('error').textContent='Ошибка проверки: '+err.message;}}
 finally{if(id===serial){el('run').disabled=false;el('runLabel').textContent='Найти животных';}}
};
download=function(format){
  if(!results.length)return;
  const origin='Catalogue of Life XR 2026-08-26; греческая транслитерация латинизированных научных названий, единая греческая числовая таблица; это не исторический перевод';
  const rows=results.map(r=>[display(r),r[1],taxonGreek(r[1]),r[2],r[0],r[5],filterName(r),r[7]||'',r[8]||'',verifiedRussianName(r),verifiedRussianName(r)?'подтверждено':'русское название вида не установлено']);
  const csv=v=>/[;"\r\n]/.test(String(v))?'"'+String(v).replace(/"/g,'""')+'"':String(v);
  const content=format==='csv'?[['Русское название','Научное латинское название','Греческая транслитерация','Ранг','Число (греческое)','Статус','Группа','Семейство (лат.)','Семейство (рус.)','Русское название вида (проверенное)','Статус русского названия'],...rows].map(row=>row.map(csv).join(';')).join('\r\n'):
    ['Имя: '+el('name').value,'Латинское написание: '+el('latin').value,'Греческая запись: '+el('greek').value,'Число: '+sum,'Точных совпадений: '+results.length,'Источник: '+origin,'',...rows.map((r,i)=>(i+1)+'. '+r[0]+' — '+r[1]+' → '+r[2]+' ('+r[3]+', '+r[4]+')')].join('\n');
  const url=URL.createObjectURL(new Blob(['\ufeff'+content],{type:format==='csv'?'text/csv;charset=utf-8':'text/plain;charset=utf-8'}));
  const a=document.createElement('a');a.href=url;a.download='Анимагия_'+sum+'_все_'+results.length+'.'+format;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);
};
document.addEventListener('DOMContentLoaded',()=>{
  el('groupFilter').addEventListener('change',()=>{if(results.length)render();});
  el('printPdf').addEventListener('click',()=>{if(typeof window.printBesteriary==='function')window.printBesteriary();else window.print();});
});
