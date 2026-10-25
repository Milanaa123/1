'use strict';
/*
 * Photo-only curated list. Calculation and full TXT/CSV export remain unchanged.
 * Every featured animal must have an exact-name, correctly ranked, openly
 * licensed iNaturalist photo that the browser has successfully loaded.
 * Image metadata is held in RAM only, never saved with the submitted name.
 */
const PHOTO_ORDER = ['Mammalia','Aves','Reptilia','Insecta'];
const PHOTO_QUOTAS = {'Mammalia':10,'Aves':8,'Reptilia':7,'Insecta':5};
const PHOTO_TARGET = 30, PHOTO_MAX_CHECKS = 90, PHOTO_MS_BETWEEN = 1050;
const PHOTO_CONCURRENCY = 3;
const PHOTO_CHECKS_BY_GROUP = {'Mammalia':26,'Aves':24,'Reptilia':22,'Insecta':20};
// Cache only animal photo metadata for this browser session, not people's names.
const photoTaxonCache = new Map();
let photoNextRequestAt = 0;
const photoGallery = {
 source:null,sum:null,stamp:0,controller:null,chosen:[],checked:0,scanning:false,
 current:null,error:null
};
function photoCategoryRank(row) {
 const idx=PHOTO_ORDER.indexOf(row[3]);
 return idx===-1?4:idx;
}
function photoEligible(row) {
 return Array.isArray(row) && (row[2]==='species'||row[2]==='subspecies') &&
   (row[5]===null||row[5]===undefined||row[5]==='') &&
   /^[A-Z][a-z-]+ [a-z-]+(?: [a-z-]+)?$/.test(row[1]);
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
function photoOrder(a,b) {
 return photoCategoryRank(a.row)-photoCategoryRank(b.row) ||
   a.row[1].localeCompare(b.row[1]);
}
function photoCancel() {
 photoGallery.stamp++;
 if(photoGallery.controller)photoGallery.controller.abort();
 photoGallery.controller=null;photoGallery.source=null;photoGallery.sum=null;
 photoGallery.chosen=[];photoGallery.checked=0;photoGallery.scanning=false;
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
 if(photoTaxonCache.size>=320)photoTaxonCache.delete(photoTaxonCache.keys().next().value);
 photoTaxonCache.set(key,photo);
}
function photoCheckImage(url,stamp){
 return new Promise(resolve=>{
  if(stamp!==photoGallery.stamp){resolve(false);return;}
  const preview=new Image();let finished=false;
  const timer=setTimeout(()=>complete(false),10500);
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
 if(stamp!==photoGallery.stamp)return null;
 const key=row[1].toLowerCase()+'|'+row[2];
 if(photoTaxonCache.has(key)){
  const saved=photoTaxonCache.get(key);
  return saved?{row,photo:saved}:null;
 }
 if(!await photoAcquireRequestSlot(stamp))return null;
 if(photoGallery.chosen.length>=PHOTO_TARGET)return null;
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
  if(!await photoCheckImage(match.src,stamp))return null;
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
 const count=photoGallery.chosen.length;
 el('featuredCount').textContent= count+' из '+PHOTO_TARGET+' с проверенными фотографиями';
 const target=document.getElementById('galleryStatus');
 if(!target)return;
 if(!photoGallery.source){target.textContent='';return;}
 if(!photoGallery.scanning&&done){
  target.textContent=count?
    (count<PHOTO_TARGET?'Доступно фото: '+count+'.':'30 животных с фотографиями.') :
    'Фотографии не найдены. Полный список доступен ниже.';
  if(photoGallery.error)target.textContent+=' '+photoGallery.error;
 }else{
  target.textContent='✧ Подбираем фото · '+count+'/30';
 }
}
function photoMakeCard(item,index) {
 const row=item.row,li=document.createElement('li');
 li.className='species-row verified-animal-card';
 const badge=document.createElement('span');badge.className='photo-card-number';
 badge.textContent=String(index+1).padStart(2,'0');
 const body=document.createElement('div');body.className='photo-card-body';
 const name=document.createElement('strong');name.className='animal-name';name.textContent=display(row);
 const science=document.createElement('small');science.textContent=row[1];
 const greek=document.createElement('small');greek.textContent='Греческая запись: '+taxonGreek(row[1]);
 const button=document.createElement('button');button.type='button';
 button.className='view-photo-button';
 button.textContent='Посмотреть фотографию';
 button.setAttribute('aria-label','Посмотреть фотографию: '+display(row));
 button.addEventListener('click',()=>photoOpen(item,button));
 const details=document.createElement('details');details.className='animal-detail';
 const toggle=document.createElement('summary');toggle.textContent='Проверить числовое совпадение';
 const info=document.createElement('div');
 info.textContent='Сумма греческой записи: '+taxonGreekScore(row[1])+
   ' · Сумма имени: '+sum+' · Разница: '+Math.abs(sum-row[0]);
 details.append(toggle,info);body.append(name,science,greek,button,details);
 li.append(badge,body);return li;
}
function photoDraw() {
 const selected=photoGallery.chosen.slice().sort(photoOrder);
 const groupControl=el('groupFilter'),previous=groupControl.value;
 groupControl.replaceChildren();
 const option=document.createElement('option');option.value='all';option.textContent='Все подтверждённые виды';
 groupControl.append(option);
 const available=new Set();
 for(const item of selected){
  const cls=item.row[3];
  if(available.has(cls))continue;available.add(cls);
  const option=document.createElement('option');option.value=cls;
  option.textContent=GROUP[cls]||category(item.row);
  groupControl.append(option);
 }
 groupControl.value=available.has(previous)?previous:'all';
 const visible=groupControl.value==='all'?selected:selected.filter(item=>item.row[3]===groupControl.value);
 const fragment=document.createDocumentFragment();
 for(const [i,item] of visible.entries())fragment.append(photoMakeCard(item,i));
 el('preview').replaceChildren(fragment);
 el('previewSection').hidden=false;
 el('downloads').hidden=!results.length;
 el('empty').textContent=results.length?'':'Точных совпадений не найдено.';
 photoStatus(!photoGallery.scanning);
}
async function photoCollect() {
 const stamp=photoGallery.stamp;
 const groups=photoCandidates(photoGallery.source||[]);
 const checked=new Set();
 const selectedByGroup=new Map();
 // A small parallel image pipeline, with global API request pacing.
 async function scanGroup(group,needed,limit) {
  const rows=groups.get(group)||[];
  let cursor=0,visited=0;
  async function worker(){
   while(stamp===photoGallery.stamp &&
      photoGallery.chosen.length<PHOTO_TARGET &&
      (selectedByGroup.get(group)||0)<needed &&
      photoGallery.checked<PHOTO_MAX_CHECKS &&
      visited<limit){
    const row=rows[cursor++];
    if(!row)return;
    const key=row[1].toLowerCase()+'|'+row[2];
    if(checked.has(key))continue;
    checked.add(key);visited++;photoGallery.checked++;
    const item=await photoLookup(row,stamp);
    if(stamp!==photoGallery.stamp)return;
    if(item && photoGallery.chosen.length<PHOTO_TARGET &&
       (selectedByGroup.get(group)||0)<needed){
      photoGallery.chosen.push(item);
      selectedByGroup.set(group,(selectedByGroup.get(group)||0)+1);
      photoDraw();
    }else photoStatus();
   }
  }
  await Promise.all(Array.from({length:Math.min(PHOTO_CONCURRENCY,rows.length)},
    ()=>worker()));
 }
 // The four priority groups are searched together; results are always
 // sorted by Mammalia → Aves → Reptilia → Insecta before being shown.
 await Promise.all(PHOTO_ORDER.map(group=>
   scanGroup(group,PHOTO_QUOTAS[group],PHOTO_CHECKS_BY_GROUP[group])));
 if(stamp!==photoGallery.stamp)return;
 // Give spare places to the same preferred classes before considering others.
 for(const group of PHOTO_ORDER){
  if(stamp!==photoGallery.stamp||photoGallery.chosen.length>=PHOTO_TARGET)break;
  await scanGroup(group,PHOTO_TARGET,PHOTO_MAX_CHECKS-photoGallery.checked);
 }
 const remaining=[...groups.keys()].filter(g=>!PHOTO_ORDER.includes(g)).sort();
 for(const group of remaining){
  if(stamp!==photoGallery.stamp||photoGallery.chosen.length>=PHOTO_TARGET)break;
  await scanGroup(group,PHOTO_TARGET,Math.min(8,PHOTO_MAX_CHECKS-photoGallery.checked));
 }
 if(stamp===photoGallery.stamp){photoGallery.scanning=false;photoDraw();}
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
 photoStatus();
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
