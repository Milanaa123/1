'use strict';
const oldDisplay=display, oldReset=reset;
const origRU={'Αλεπού':'Лисица','ο σκύλος':'Собака','ο λύκος':'Волк','η γάτα':'Кошка','γάτα':'Кошка','κουκουβάγια':'Сова','ποντίκι':'Мышь','ρακούν':'Енот','ελάφι':'Олень','αρκούδα':'Медведь','αγριογούρουνο':'Кабан','λαγός':'Заяц','λύγκας':'Рысь','φώκια':'Тюлень','φάλαινα':'Кит','τίγρη':'Тигр','λιοντάρι':'Лев','ο ελέφαντας':'Слон','το άλογο':'Лошадь','cat':'Кошка','doge':'Собака','yak':'Як','marmot':'Сурок','sable':'Соболь','wolverine':'Росомаха'};
display=function(row){return row[2]!=='original'?oldDisplay(row):origRU[row[1]]||('Название из старой программы'+(/^[a-z .]+$/i.test(row[1])?' — '+rusTransliteration(row[1]):''));};
let originalListPromise,photoStamp=0,observer,queue=[],busy=0;
reset=function(){photoStamp++;queue.length=0;if(observer)observer.disconnect();oldReset();};
function inspectImage(data,name,rank){
  for(const x of data&&Array.isArray(data.results)?data.results:[]){
    if(String(x.name||'').toLowerCase()!==name.toLowerCase()||x.rank!==rank)continue;
    const p=x.default_photo;
    if(!p||!p.medium_url||!['cc0','cc-by','cc-by-sa','cc-by-nc','cc-by-nc-sa'].includes(String(p.license_code||'').toLowerCase()))continue;
    try{const u=new URL(p.medium_url);
      if(u.protocol!=='https:'||!['static.inaturalist.org','inaturalist-open-data.s3.amazonaws.com'].includes(u.hostname))continue;
      if(!Number.isInteger(Number(x.id)))continue;
      return {src:p.medium_url,source:'https://www.inaturalist.org/taxa/'+Number(x.id),credit:(p.attribution||'iNaturalist')+' · '+p.license_code.toUpperCase()};
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
function classifyRow(row){return row[2]==='original'?'original':row[3]||row[6]||'other';}
function filterName(row){return row[2]==='original'?'Оригинальный список':GROUP[row[3]]||category(row);}
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
  for(const [i,row] of picks.entries()){
    const li=document.createElement('li');li.className='species-row';
    const media=document.createElement('div');media.className='photo-media';
    const placeholder=document.createElement('span');placeholder.className='photo-placeholder';
    placeholder.textContent=({Mammalia:'🐾',Aves:'🪶',Reptilia:'🦎',Amphibia:'🐸',Arachnida:'🕷',Insecta:'🦋',Teleostei:'🐟'})[row[3]]||'✧';media.append(placeholder);
    const card=document.createElement('div');card.className='photo-content';
    const index=document.createElement('span');index.className='idx';index.textContent=String(i+1).padStart(2,'0');
    const body=document.createElement('span');
    const name=document.createElement('span');name.className='animal-name';name.textContent=display(row);
    const latin=document.createElement('small');latin.textContent=row[1]+(row[5]?' · '+status(row):'');
    body.append(name,latin);card.append(index,body);
    const meta=document.createElement('div');meta.className='photo-meta';
    const credit=document.createElement('span');credit.textContent='Фото не найдено';
    const details=document.createElement('details');details.className='animal-detail';
    const toggle=document.createElement('summary');toggle.textContent='Проверка совпадения';
    const info=document.createElement('div');info.textContent='Сумма названия '+row[0]+', сумма имени '+sum+', разница '+Math.abs(row[0]-sum)+'. '+filterName(row);
    details.append(toggle,info);meta.append(credit,details);li.append(media,card,meta);fragment.append(li);
    const photoRank=row[2]==='original'?'species':row[2];
    if(!row[5]&&/^[A-Z][a-z-]+ [a-z-]+(?: [a-z-]+)?$/.test(row[1])&&['species','subspecies'].includes(photoRank)){
      const item={row,media,credit,stamp:photoStamp};
      if(observer){media._item=item;observer.observe(media);}else{queue.push(item);loadPhotos();}
    }
  }
  el('preview').replaceChildren(fragment);
  el('featuredCount').textContent=selected.length+' из '+results.length+' точных совпадений';
  el('previewSection').hidden=!results.length;el('downloads').hidden=!results.length;
  el('empty').textContent=results.length?'':'Точных совпадений в выбранной базе нет. Приблизительные животные не добавляются.';
};
run=async function(){
  const raw=el('name').value.trim(),greek=el('greek').value.trim(),method=el('method').value;
  if(!/^[А-Яа-яЁё\s\-'’]+$/.test(raw)||!validGreek(greek)){reset();el('error').textContent='Проверь полное русское имя и греческое написание: неизвестные символы недопустимы.';return;}
  const target=score(greek),id=++serial;if(!target){reset();el('error').textContent='Число имени не определено';return;}
  el('run').disabled=true;el('runLabel').textContent='Проверяю…';el('error').textContent='';
  try{
    let matches;
    if(method==='original'){
      if(!originalListPromise)originalListPromise=fetch('./original_animals.json').then(r=>{if(!r.ok)throw Error('Оригинальная база недоступна');return r.json();}).catch(e=>{originalListPromise=null;throw e;});
      const data=await originalListPromise;if(id!==serial)return;matches=data.filter(x=>x[0]===target);
      if(matches.some(x=>scoreMixed(x[1])!==target))throw Error('Несоответствие оригинальной базы');
    }else{
      const bucket=Math.floor(target/25);matches=[];
      if(!meta||meta.available_buckets.includes(bucket)){
        const r=await fetch('./data/'+bucket+'.json');if(!r.ok)throw Error('Каталог не загружен');
        const data=await r.json();if(id!==serial)return;matches=data.filter(x=>x[0]===target);
        if(matches.some(x=>scoreLatin(x[1])!==target))throw Error('Индекс не совпадает с исходной программой. Обновите страницу.');
      }
    }
    results=matches;sum=target;el('score').textContent=String(sum);el('total').textContent=String(matches.length);
    el('formula').textContent=breakdown(greek)+' · разница 0';auditSum(greek);
    el('groupFilter').value='all';el('resultPanel').hidden=false;render();el('resultPanel').scrollIntoView({behavior:'smooth',block:'start'});
  }catch(err){reset();el('error').textContent='Ошибка: '+err.message;}
  finally{if(id===serial){el('run').disabled=false;el('runLabel').textContent='Найти животных';}}
};
download=function(format){
  if(!results.length)return;
  const origin=el('method').value==='original'?'Оригинальная Python-программа':'Catalogue of Life XR 2026-08-26 — веса оригинальной Python-программы';
  const rows=results.map(r=>[display(r),r[1],r[2],r[0],r[5],filterName(r)]);
  const csv=v=>/[;"\r\n]/.test(String(v))?'"'+String(v).replace(/"/g,'""')+'"':String(v);
  const content=format==='csv'?[['Русское название','Исходное название','Ранг','Число','Статус','Группа'],...rows].map(row=>row.map(csv).join(';')).join('\r\n'):
    ['Имя: '+el('name').value,'Греческая запись: '+el('greek').value,'Число: '+sum,'Точных совпадений: '+results.length,'Источник: '+origin,'',...rows.map((r,i)=>(i+1)+'. '+r[0]+' — '+r[1]+' ('+r[2]+', '+r[3]+')')].join('\n');
  const url=URL.createObjectURL(new Blob(['\ufeff'+content],{type:format==='csv'?'text/csv;charset=utf-8':'text/plain;charset=utf-8'}));
  const a=document.createElement('a');a.href=url;a.download='Анимагия_'+sum+'_все_'+results.length+'.'+format;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);
};
document.addEventListener('DOMContentLoaded',()=>{
  el('method').addEventListener('change',()=>{reset();el('error').textContent='';});
  el('groupFilter').addEventListener('change',()=>{if(results.length)render();});
  el('printPdf').addEventListener('click',()=>window.print());
});
