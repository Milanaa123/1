'use strict';
/*
 * Only exact numerical matches with a verified, loadable iNaturalist photo
 * may enter the top-30 gallery. Full TXT/CSV exports remain unchanged.
 * Image metadata is held in RAM only, never saved with the submitted name.
 */
// Class priorities: vertebrates first; invertebrates after; insects last.
// Photos are mandatory for the gallery, not for the complete export.
const PHOTO_ORDER = [
 'Mammalia','Aves','Reptilia','Amphibia','Chondrichthyes',
 'Elasmobranchii','Actinopteri','Actinopterygii','Teleostei',
 'Cephalopoda','Malacostraca','Arachnida','Gastropoda','Bivalvia',
 'Asteroidea','Echinoidea','Chilopoda','Diplopoda'
];
const PHOTO_VERTEBRATES = new Set(PHOTO_ORDER.slice(0,9));
const PHOTO_TARGET = 30, PHOTO_MS_BETWEEN = 1050;
// At most three insects in a featured 30; only if higher-priority animals
// did not fill the list with photo-verified exact matches.
const PHOTO_INSECT_CAP = 3;
// Soft category caps preserve variety; reserves of verified extras can still fill 30.
const PHOTO_DIVERSITY_LIMIT={Mammalia:10,Aves:8,Reptilia:6,Amphibia:5,Fish:8,Other:7,Insecta:3};
// Exhaust more candidates than the previous 30/56-item limit, in priority tiers.
const PHOTO_MAX_CHECKS = 240;
const PHOTO_STAGE_LIMITS = [100,90,50];
const PHOTO_CONCURRENCY = 3;
// Cache only animal photo metadata for this browser session, not people's names.
const photoTaxonCache = new Map();
let photoNextRequestAt = 0;
const photoGallery = {
 source:null,sum:null,stamp:0,controller:null,chosen:[],checked:0,scanning:false,
 current:null,error:null,reserve:[]
};
function photoBroadGroup(row){
 const cls=row[3];
 if(['Chondrichthyes','Elasmobranchii','Actinopteri','Actinopterygii',
     'Teleostei','Chondrostei','Holocephali','Dipnoi','Sarcopterygii'].includes(cls))return 'Fish';
 if(['Mammalia','Aves','Reptilia','Amphibia','Insecta'].includes(cls))return cls;
 return 'Other';
}
function photoCategoryRank(row) {
 if(row[3]==='Insecta')return 1000;
 const idx=PHOTO_ORDER.indexOf(row[3]);
 return idx===-1?100:idx;
}
function photoEligible(row) {
 return Array.isArray(row) && (row[2]==='species'||row[2]==='subspecies') &&
   !row[5] && /^[A-Z][a-z-]+ [a-z-]+(?: [a-z-]+)?$/.test(row[1]);
}
function photoCandidates(rows) {
 const seen=new Set(),listed=[];
 for(const row of rows){
  if(!photoEligible(row))continue;
  const key=row[1].toLowerCase()+'|'+row[2];
  if(seen.has(key))continue;
  seen.add(key);listed.push(row);
 }
 listed.sort((a,b)=>photoCategoryRank(a)-photoCategoryRank(b)||
   sortInteresting(a,b));
 // Preserve genus variety when possible, without losing additional candidates.
 const groups=new Map();
 for(const row of listed){
  const key=row[3]||'other';
  if(!groups.has(key))groups.set(key,[]);
  groups.get(key).push(row);
 }
 for(const [group,items] of groups){
  const used=new Set(),fresh=[],extra=[];
  for(const r of items){
   const genus=r[1].split(' ')[0].toLowerCase();
   if(used.has(genus))extra.push(r);else {used.add(genus);fresh.push(r);}
  }
  groups.set(group,fresh.concat(extra));
 }
 return groups;
}
// Inspect all exact matches in priority tiers, never just the first 30.
// Round-robin within a tier balances photo candidates from different classes.
// Bounded stage searches avoid getting stuck on unphotographed taxa.
function photoCandidateTiers(rows) {
 const groups=photoCandidates(rows);
 const keys=[...groups.keys()].sort((a,b)=>
  photoCategoryRank({3:a})-photoCategoryRank({3:b})||a.localeCompare(b));
 const phases=[
  keys.filter(g=>PHOTO_VERTEBRATES.has(g)),
  keys.filter(g=>!PHOTO_VERTEBRATES.has(g)&&g!=='Insecta'),
  keys.filter(g=>g==='Insecta')
 ];
 return phases.map(phase=>{
  const positions=new Map(phase.map(group=>[group,0])),queue=[];
  let advanced=true;
  while(advanced){
   advanced=false;
   for(const group of phase){
    const pos=positions.get(group),next=groups.get(group)[pos];
    if(next){queue.push(next);positions.set(group,pos+1);advanced=true;}
   }
  }
  return queue;
 });
}
function photoOrder(a,b) {
 return photoCategoryRank(a.row)-photoCategoryRank(b.row) ||
   a.row[1].localeCompare(b.row[1]);
}
function photoKnownCount(predicate){
 return photoGallery.chosen.filter(predicate).length+photoGallery.reserve.filter(predicate).length;
}
function photoAcceptVerified(found){
 const row=found.row;
 const already=x=>x.row[1]===row[1]&&x.row[2]===row[2];
 if(photoGallery.chosen.some(already)||photoGallery.reserve.some(already))return false;
 const genus=row[1].split(' ')[0].toLowerCase();
 const broad=photoBroadGroup(row);
 const cap=PHOTO_DIVERSITY_LIMIT[broad]||7;
 const tooMany=photoGallery.chosen.filter(x=>photoBroadGroup(x.row)===broad).length>=cap;
 const duplicateGenus=photoGallery.chosen.some(x=>x.row[1].split(' ')[0].toLowerCase()===genus);
 if(tooMany||duplicateGenus){photoGallery.reserve.push(found);return false;}
 photoGallery.chosen.push(found);return true;
}
function photoCompleteFromReserves(){
 if(photoGallery.chosen.length>=PHOTO_TARGET)return;
 const reserves=photoGallery.reserve.slice().sort(photoOrder);
 for(const item of reserves){
  if(photoGallery.chosen.length>=PHOTO_TARGET)break;
  if(item.row[3]==='Insecta'&&
     photoGallery.chosen.filter(x=>x.row[3]==='Insecta').length>=PHOTO_INSECT_CAP)continue;
  photoGallery.chosen.push(item);
 }
 photoGallery.reserve=[];
}
function photoCancel() {
 photoGallery.stamp++;
 photoNextRequestAt=Math.min(photoNextRequestAt,Date.now()+PHOTO_MS_BETWEEN);
 if(photoGallery.controller)photoGallery.controller.abort();
 photoGallery.controller=null;photoGallery.source=null;photoGallery.sum=null;
 photoGallery.chosen=[];photoGallery.reserve=[];photoGallery.checked=0;photoGallery.scanning=false;
 photoGallery.current=null;photoGallery.error=null;
 const modal=document.getElementById('animalPhotoDialog');
 if(modal&&!modal.hidden)photoClose();
}
const photoOriginalReset=reset;
reset=function(){photoCancel();photoOriginalReset();};
function photoDelay(ms){return new Promise(done=>setTimeout(done,ms));}
async function photoAcquireRequestSlot(stamp){
 // iNaturalist recommends roughly one API request per second.
 // Parallel workers can overlap image loading without violating that rate.
 const start=Math.max(Date.now(),photoNextRequestAt);
 photoNextRequestAt=start+PHOTO_MS_BETWEEN;
 const pause=start-Date.now();
 if(pause>0)await photoDelay(pause);
 return stamp===photoGallery.stamp;
}
function rememberPhoto(key,photo){
 if(photoTaxonCache.size>=700)photoTaxonCache.delete(photoTaxonCache.keys().next().value);
 photoTaxonCache.set(key,photo);
}
function photoCheckImage(url,stamp){
 return new Promise(resolve=>{
  if(stamp!==photoGallery.stamp){resolve(false);return;}
  const preview=new Image();let finished=false;
  const timer=setTimeout(()=>complete(false),5500);
  function complete(good){
   if(finished)return;finished=true;clearTimeout(timer);
   preview.onload=null;preview.onerror=null;resolve(good);
  }
  preview.onload=()=>complete(true);
  preview.onerror=()=>complete(false);
  preview.src=url;
  if(preview.complete&&preview.naturalWidth>0)complete(true);
 });
}
async function photoLookup(row,stamp) {
 if(stamp!==photoGallery.stamp||!photoEligible(row))return null;
 const key=row[1].toLowerCase()+'|'+row[2];
 if(photoTaxonCache.has(key)){
  const saved=photoTaxonCache.get(key);
  return saved?{row,photo:saved}:null;
 }
 if(!await photoAcquireRequestSlot(stamp))return null;
 const controller=photoGallery.controller;
 const url='https://api.inaturalist.org/v1/taxa?q='+
   encodeURIComponent(row[1])+'&per_page=8';
 try {
  const response=await fetch(url,{signal:controller.signal,headers:{Accept:'application/json'}});
  if(!response.ok){
   if(response.status===429)photoGallery.error='Сервис фотографий временно ограничил запросы.';
   return null;
  }
  const data=await response.json();
  if(stamp!==photoGallery.stamp)return null;
  const match=inspectImage(data,row[1],row[2]);
  if(!match){rememberPhoto(key,null);return null;}
  if(!await photoCheckImage(match.preview||match.src,stamp))return null;
  rememberPhoto(key,match);
  return {row,photo:match};
 }catch(err){
  if(err.name!=='AbortError'&&stamp===photoGallery.stamp){
   photoGallery.error='Не все фотографии удалось загрузить.';
  }
  return null;
 }
}
function photoStatus(done=false){
 const found=photoGallery.chosen.length;
 el('featuredCount').textContent=found+' из '+PHOTO_TARGET+' с проверенными фотографиями';
 const target=document.getElementById('galleryStatus');
 if(!target)return;
 if(!photoGallery.source){target.textContent='';return;}
 const checks='Проверено '+photoGallery.checked+' вариантов.';
 target.textContent=(photoGallery.scanning&&!done
  ?'Поиск фотографий · '+found+'/30. '+checks
  : found===PHOTO_TARGET
    ?'Найдены 30 животных с подтверждёнными фотографиями. '+checks
    : 'Найдено '+found+' из 30 животных с фотографиями. '+checks+
      ' Другие совпадения можно скачать полным списком.')+
  (photoGallery.error?' '+photoGallery.error:'');
}
function bestiaryIcon(row){
 const broad=photoBroadGroup(row),ns='http://www.w3.org/2000/svg';
 const paths={
  Mammalia:['M14 30Q13 25 18 23Q21 22 24 25Q27 22 30 23Q35 25 34 30Q33 36 24 35Q15 36 14 30Z','M13 18C10 14 8 17 10 21Q12 25 15 23Q17 21 13 18Z','M21 15C18 12 16 15 17 19Q18 23 21 22Q24 20 21 15Z','M29 15C26 12 24 15 25 19Q26 23 29 22Q32 20 29 15Z','M37 18C34 15 31 18 33 22Q35 25 38 22Q40 19 37 18Z'],
  Aves:['M9 36Q25 36 36 9Q21 14 15 22Q11 28 9 36Z','M11 34Q22 28 35 12','M17 26l-4 0M21 21l-2-5M27 18l-2-6'],
  Reptilia:['M11 34Q12 22 23 24Q33 26 32 16Q31 12 27 13Q23 14 24 19','M15 30Q20 37 29 32Q37 27 37 18','M33 13l6-3-2 7','M33 22l7 1M20 26l-5-6'],
  Amphibia:['M14 23Q14 14 24 16Q34 14 34 23Q34 34 24 34Q14 34 14 23Z','M15 26 8 31M33 26l7 5M19 30l-7 8M29 30l7 8','M18 22h2M28 22h2'],
  Fish:['M7 24Q18 10 33 24Q18 38 7 24Z','M33 24l9-10v20Z','M20 17l3-6 5 7','M20 31l3 6 5-7','M13 22h1'],
  Insecta:['M18 17Q24 10 30 17L30 31Q24 37 18 31Z','M24 14V34','M16 18 10 14M16 24H8M16 30l-6 5','M32 18l6-4M32 24h8M32 30l6 5','M21 14l-5-7M27 14l5-7'],
  Other:['M24 12V36M12 24h24M15 15l18 18M33 15 15 33','M24 5l3 7-3 4-3-4Z','M24 43l3-7-3-4-3 4Z']
 };
 const icon=document.createElementNS(ns,'svg');
 icon.setAttribute('viewBox','0 0 48 48');
 icon.setAttribute('aria-hidden','true');
 icon.setAttribute('focusable','false');
 for(const d of paths[broad]||paths.Other){
  const path=document.createElementNS(ns,'path');path.setAttribute('d',d);icon.append(path);
 }
 return icon;
}
function bestiaryGroupName(row){
 return GROUP[row[3]]||CLASS_RU[row[3]]||category(row);
}
function photoMakeCard(item,index) {
 const row=item.row,li=document.createElement('li');
 li.className='species-row verified-animal-card bestiary-card';
 li.dataset.animalGroup=photoBroadGroup(row);

 const top=document.createElement('div');top.className='bestiary-card-top';
 const mark=document.createElement('span');mark.className='bestiary-animal-sigil';mark.append(bestiaryIcon(row));
 const folio=document.createElement('span');folio.className='bestiary-folio';
 folio.textContent='ФОЛИАНТ · '+String(index+1).padStart(2,'0');
 const photoSeal=document.createElement('span');photoSeal.className='bestiary-photo-seal';
 photoSeal.textContent='✧ Фото проверено';
 top.append(mark,folio,photoSeal);

 const body=document.createElement('div');body.className='photo-card-body bestiary-card-body';
 const rank=document.createElement('div');rank.className='bestiary-category-row';
 const group=document.createElement('span');group.className='bestiary-category';group.textContent=bestiaryGroupName(row);
 const taxonomyRank=document.createElement('span');taxonomyRank.className='bestiary-rank';
 taxonomyRank.textContent=(row[2]==='subspecies'?'Подвид':'Вид');
 rank.append(group,taxonomyRank);

 const name=document.createElement('strong');name.className='animal-name';name.textContent=display(row);
 const origin=document.createElement('span');origin.className='bestiary-name-origin';
 origin.textContent=Object.prototype.hasOwnProperty.call(SPECIES_NAME_RU,row[1])
  ?'Известное русское название'
  :'Условная русская запись; научное название — ниже';
 const science=document.createElement('small');science.className='bestiary-scientific';science.textContent=row[1];

 const engraving=document.createElement('div');engraving.className='bestiary-engraving';
 const number=document.createElement('span');number.className='bestiary-number';number.textContent=String(row[0]);
 const numberLabel=document.createElement('span');numberLabel.textContent='греческая сумма · точное совпадение';
 engraving.append(number,numberLabel);

 const photoButton=document.createElement('button');photoButton.type='button';
 photoButton.className='view-photo-button';
 photoButton.textContent='Посмотреть фотографию';
 photoButton.setAttribute('aria-label','Посмотреть фотографию: '+display(row));
 photoButton.addEventListener('click',()=>photoOpen(item,photoButton));

 const details=document.createElement('details');details.className='animal-detail bestiary-verification';
 const toggle=document.createElement('summary');toggle.textContent='Проверить вычисление и классификацию';
 const info=document.createElement('div');info.className='bestiary-facts';
 const taxonGreekName=document.createElement('p');
 taxonGreekName.textContent='Греческая запись: '+taxonGreek(row[1]);
 const exact=document.createElement('p');
 exact.textContent='Сумма животного: '+taxonGreekScore(row[1])+' · Сумма имени: '+sum+
  ' · Разница: '+Math.abs(sum-row[0]);
 const classification=document.createElement('p');
 classification.textContent='Класс: '+bestiaryGroupName(row)+
  (row[4]?' · Отряд: '+(ORDER_RU[row[4]]||row[4]):'')+
  ' · Ранг: '+(row[2]==='subspecies'?'подвид':'вид');
 const proof=document.createElement('a');proof.href=item.photo.source;
 proof.target='_blank';proof.rel='noopener noreferrer';
 proof.textContent='Источник проверенной фотографии · iNaturalist';
 info.append(taxonGreekName,exact,classification,proof);
 details.append(toggle,info);
 body.append(rank,name,origin,science,engraving,photoButton,details);
 li.append(top,body);
 return li;
}
function bestiaryUpdateChapters(selected,groupControl,previous){
 const available=new Map();
 for(const item of selected){
  const cls=item.row[3];
  if(!available.has(cls))available.set(cls,{count:0,title:bestiaryGroupName(item.row)});
  available.get(cls).count++;
 }
 const opts=document.createDocumentFragment();
 const root=document.createElement('option');
 root.value='all';root.textContent='Все найденные · '+selected.length;opts.append(root);
 for(const [cls,data] of available){
  const option=document.createElement('option');
  option.value=cls;option.textContent=data.title+' · '+data.count;opts.append(option);
 }
 groupControl.replaceChildren(opts);
 groupControl.value=available.has(previous)?previous:'all';

 const bar=document.getElementById('bestiaryChapters');
 if(!bar)return;
 const buttons=document.createDocumentFragment();
 const config=[['all','Все формы',selected.length],...[...available].map(([cls,d])=>[cls,d.title,d.count])];
 const restoreFocus=bar.contains(document.activeElement);
 for(const [id,label,count] of config){
  const button=document.createElement('button');
  button.type='button';button.className='bestiary-chapter-button';
  button.dataset.group=id;
  button.setAttribute('aria-pressed',String(groupControl.value===id));
  button.textContent=label+' · '+count;
  button.addEventListener('click',()=>{
   groupControl.value=id;photoDraw();
   const successor=[...bar.querySelectorAll('button')].find(x=>x.dataset.group===id);
   if(successor)successor.focus();
  });
  buttons.append(button);
 }
 bar.replaceChildren(buttons);
 if(restoreFocus){
  const focused=[...bar.querySelectorAll('button')].find(x=>x.dataset.group===groupControl.value);
  if(focused)focused.focus();
 }
}
function photoDraw() {
 const selected=photoGallery.chosen.slice().sort(photoOrder);
 const groupControl=el('groupFilter'),previous=groupControl.value;
 bestiaryUpdateChapters(selected,groupControl,previous);
 const cls=groupControl.value;
 const search=document.getElementById('bestiarySearch');
 const query=(search?search.value:'').trim().toLocaleLowerCase('ru');
 const visible=selected.filter(item=>{
  const r=item.row;
  const selectedClass=cls==='all'||r[3]===cls;
  const text=(display(r)+' '+r[1]+' '+bestiaryGroupName(r)).toLocaleLowerCase('ru');
  return selectedClass&&(!query||text.includes(query));
 });
 const fragment=document.createDocumentFragment();
 let lastClass='';
 for(const item of visible){
  if(cls==='all'&&lastClass!==item.row[3]){
   lastClass=item.row[3];
   const chapter=document.createElement('li');
   chapter.className='bestiary-chapter-heading';
   chapter.textContent='✧ '+bestiaryGroupName(item.row);
   fragment.append(chapter);
  }
  fragment.append(photoMakeCard(item,selected.indexOf(item)));
 }
 el('preview').replaceChildren(fragment);
 const summary=document.getElementById('bestiarySummary');
 if(summary){
  summary.textContent=selected.length
   ?'Показано '+visible.length+' из '+selected.length+
      ' подтверждённых животных'+(query?' · поиск по названию':'')
   :'Подбираем животных с подтверждёнными фотографиями…';
 }
 const empty=document.getElementById('bestiaryEmpty');
 if(empty)empty.hidden=visible.length!==0||selected.length===0;
 const progress=document.getElementById('bestiaryProgressFill');
 if(progress)progress.style.width=Math.min(100,selected.length/PHOTO_TARGET*100)+'%';
 el('previewSection').hidden=false;
 el('downloads').hidden=!results.length;
 el('empty').textContent=results.length?'':'Точных совпадений не найдено.';
 photoStatus(!photoGallery.scanning);
}
async function photoCollect() {
 const stamp=photoGallery.stamp;
 const tiers=photoCandidateTiers(photoGallery.source||[]);
 for(let phase=0;phase<tiers.length;phase++){
  if(stamp!==photoGallery.stamp||photoGallery.chosen.length>=PHOTO_TARGET||
     photoGallery.checked>=PHOTO_MAX_CHECKS)break;
  const queue=tiers[phase];
  const budget=Math.min(PHOTO_STAGE_LIMITS[phase],PHOTO_MAX_CHECKS-photoGallery.checked);
  if(phase===2 && photoKnownCount(item=>item.row[3]==='Insecta')>=PHOTO_INSECT_CAP)continue;
  let cursor=0,phaseChecked=0;
  async function worker(){
   while(stamp===photoGallery.stamp &&
     photoGallery.chosen.length<PHOTO_TARGET &&
     phaseChecked<budget &&
     (phase!==2 || photoKnownCount(item=>item.row[3]==='Insecta')<PHOTO_INSECT_CAP)){
    const row=queue[cursor++];
    if(!row)return;
    phaseChecked++;photoGallery.checked++;
    const found=await photoLookup(row,stamp);
    if(stamp!==photoGallery.stamp)return;
    if(found && photoGallery.chosen.length<PHOTO_TARGET &&
       (phase!==2 || photoKnownCount(item=>item.row[3]==='Insecta')<PHOTO_INSECT_CAP) &&
       photoAcceptVerified(found)){
       photoDraw();
     }else photoStatus();
   }
  }
  await Promise.all(Array.from({length:Math.min(PHOTO_CONCURRENCY,queue.length,budget)},()=>worker()));
 }
 if(stamp===photoGallery.stamp){photoCompleteFromReserves();photoGallery.scanning=false;photoDraw();}
}
render=function(){
 if(!results.length){
  photoCancel();el('preview').replaceChildren();el('previewSection').hidden=true;
  el('downloads').hidden=true;return;
 }
 // Filter changes never initiate a new search.
 if(photoGallery.source===results&&photoGallery.sum===sum){photoDraw();return;}
 photoCancel();
 photoGallery.source=results;photoGallery.sum=sum;
 photoGallery.controller=new AbortController();
 photoGallery.scanning=true;
 el('preview').replaceChildren();
 el('previewSection').hidden=false;el('downloads').hidden=false;
 photoDraw(); // Initially empty: only successful photo checks add cards.
 void photoCollect();
};
function photoOpen(item,trigger) {
 if(!item||!item.photo)return;
 const dlg=document.getElementById('animalPhotoDialog');
 const title=document.getElementById('photoDialogTitle');
 const image=document.getElementById('photoDialogImage');
 const credit=document.getElementById('photoDialogCredit');
 const source=document.getElementById('photoDialogSource');
 photoGallery.current=trigger;
 title.textContent=display(item.row);
 image.src=item.photo.src;image.alt='Фотография вида '+display(item.row);
 document.getElementById('photoDialogScientific').textContent=item.row[1];
 credit.textContent=item.photo.credit;
 source.href=item.photo.source;
 dlg.hidden=false;document.body.classList.add('photo-dialog-open');
 document.getElementById('closeAnimalPhoto').focus();
}
function photoClose(){
 const dlg=document.getElementById('animalPhotoDialog');
 if(!dlg)return;
 dlg.hidden=true;
 document.body.classList.remove('photo-dialog-open');
 const image=document.getElementById('photoDialogImage');
 if(image)image.removeAttribute('src');
 const button=photoGallery.current;
 photoGallery.current=null;
 if(button&&button.isConnected)button.focus();
}
document.addEventListener('DOMContentLoaded',()=>{
 document.getElementById('closeAnimalPhoto').addEventListener('click',photoClose);
 document.getElementById('photoDialogBackdrop').addEventListener('click',photoClose);
 document.addEventListener('keydown',ev=>{
  if(ev.key==='Escape'&&!document.getElementById('animalPhotoDialog').hidden)photoClose();
 });
});
