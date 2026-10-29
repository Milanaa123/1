'use strict';
/* The collector's animal chooser always displays every approved original
 * drawing, even before a Greek-number calculation has run. The numerical
 * matching tab remains separate: decorative browsing never fabricates a
 * matching animal, score, species identity, or printable result.
 */
(()=>{
 function start(){
  const get=id=>document.getElementById(id);
  const trigger=get('animalChooserOpen'),modal=get('animalChooser');
  const list=get('animalChooserList'),groups=get('animalChooserGroups');
  const count=get('animalChooserCount'),more=get('animalChooserMore');
  const drawings=get('chooserFilterIllustrated'),matches=get('chooserFilterAll');
  const close=get('animalChooserClose'),picker=get('relicAnimal');
  if(!trigger||!modal||!list||!groups||!count||!more||!drawings||!matches||!close)return;
  const root='./art/animagia-selected-107/';
  const labels={all:'Все рисунки',mammal:'Млекопитающие',bird:'Птицы',
   reptile:'Пресмыкающиеся',amphibian:'Земноводные',fish:'Рыбы',
   marine:'Морские животные',other:'Другие'};
  let artworks=[],loadError='',mode='art',group='all',limit=36,request=null;
  const type=item=>{
   if(item.number===null){
    if(item.name==='Лягушка')return 'amphibian';
    if(item.name==='Филин')return 'bird';
    return 'mammal';
   }
   const n=item.number;
   if(n<=49)return 'mammal';
   if(n<=83)return 'bird';
   if(n<=102)return 'reptile';
   if(n<=113)return 'amphibian';
   if(n<=133)return 'fish';
   if(n>=161)return 'marine';
   return 'other';
  };
  const url=item=>root+item.file.split('/').map(encodeURIComponent).join('/');
  function load(){
   if(!request)request=fetch(root+'manifest.json',{cache:'no-store'})
    .then(async response=>{
     if(!response.ok)throw Error('HTTP '+response.status);
     const data=await response.json();
     if(!Array.isArray(data.files)||data.files.length!==108)
      throw Error('Неполный каталог рисунков');
     artworks=data.files;
     loadError='';
     return artworks;
    }).catch(err=>{loadError=err.message;return []});
   return request;
  }
  function addGroupButtons(entries,groupOf){
   const counts={all:entries.length};
   entries.forEach(x=>{
    const key=groupOf(x);counts[key]=(counts[key]||0)+1;
   });
   const fragment=document.createDocumentFragment();
   for(const [key,label] of Object.entries(labels)){
    if(!counts[key])continue;
    const button=document.createElement('button');
    button.type='button';
    button.className='animal-chooser-group';
    button.textContent=label+' · '+counts[key];
    button.setAttribute('aria-pressed',String(group===key));
    button.addEventListener('click',()=>{group=key;limit=36;render()});
    fragment.append(button);
   }
   groups.replaceChildren(fragment);
  }
  function imageButton(item){
   const button=document.createElement('button');
   button.type='button';button.className='approved-art-choice';
   const image=document.createElement('img');
   image.src=url(item);image.alt='Рисунок '+item.name;
   image.loading='lazy';image.decoding='async';
   const name=document.createElement('span');
   name.className='approved-art-name';name.textContent=item.name;
   button.append(image,name);
   button.setAttribute('aria-label','Выбрать рисунок: '+item.name);
   button.addEventListener('click',()=>selectImage(item));
   return button;
  }
  function selectImage(item){
   const active=Array.from(picker.options).find(opt=>{
    const [latin,rank]=opt.value.split('|');
    if(!latin||rank!=='species')return false;
    const image=window.AnimagiaAnimalAtlas?.resolve([0,latin,rank,'Mammalia','Carnivora']);
    return image?.file===item.file;
   });
   if(active){
    picker.value=active.value;
    picker.dispatchEvent(new Event('change',{bubbles:true}));
   }else{
    // A picture can be previewed on the card without presenting it as
    // a Greek-numerical match. Download requires a genuine matching row.
    const profile={artSet:'original107',file:item.file,name:item.name,
      scientific:'',exact:false,note:'Выбранный художественный рисунок'};
    const atlas=window.AnimagiaAnimalAtlas;
    const frame=get('relicSilhouetteFrame');
    if(atlas&&frame)atlas.render(frame,profile);
    const wrap=get('relicCard');
    wrap?.classList.remove('is-poster-rendered');
    const canvas=get('relicCardBackdrop');
    if(canvas)canvas.dataset.posterReady='0';
    for(const [id,value] of [
      ['animalChosenName',item.name],
      ['animalChosenScientific','Просмотр рисунка · не результат расчёта'],
      ['relicPreviewAnimal',item.name],
      ['relicPreviewScientific','Рисунок из утверждённого атласа']
    ]){
     const node=get(id);if(node)node.textContent=value;
    }
    const source=get('relicSilhouetteStatus');
    if(source)source.textContent='Оригинальный рисунок '+item.name;
    for(const id of ['relicPreviewNameScore','relicPreviewAnimalScore','relicPreviewDifference']){
     const node=get(id);if(node)node.textContent='—';
    }
    const notice=get('relicStatus');
    if(notice)notice.textContent='Рисунок выбран. Чтобы скачать карточку с числом, сначала выполни расчёт и выбери точное совпадение.';
    for(const id of ['downloadRelic','printRelic']){
     const node=get(id);if(node)node.disabled=true;
    }
   }
   modal.hidden=true;document.body.classList.remove('animal-chooser-opened');
   trigger.focus();
  }
  function renderArt(){
   addGroupButtons(artworks,type);
   const selected=artworks.filter(x=>group==='all'||type(x)===group);
   const fragment=document.createDocumentFragment();
   for(const item of selected.slice(0,limit))fragment.append(imageButton(item));
   list.classList.add('approved-gallery-grid');
   if(loadError){
    const p=document.createElement('p');p.textContent='Не удалось загрузить каталог: '+loadError;fragment.append(p);
   }else if(!selected.length){
    const p=document.createElement('p');p.textContent='Рисунки в этой группе пока не готовы.';fragment.append(p);
   }
   list.replaceChildren(fragment);
   count.textContent='Готовые рисунки: '+selected.length+' · показано '+Math.min(limit,selected.length);
   more.hidden=selected.length<=limit;
  }
  function renderMatches(){
   const options=Array.from(picker.options).filter(o=>o.value.includes('|') && !o.disabled);
   const entries=options.map(opt=>{
    const [latin,rank]=opt.value.split('|');
    const typeLabel=opt.textContent.toLowerCase();
    const p=window.AnimagiaAnimalAtlas?.resolve([0,latin,rank,'Mammalia','Carnivora'])
      || (/лягуш|квакш|жаб/i.test(typeLabel)?
        window.AnimagiaAnimalAtlas?.resolve([0,latin,rank,'Amphibia','Anura']):null);
    const matched=artworks.find(a=>a.file===p?.file);
    return {opt,p,matched,kind:matched?type(matched):'other'};
   });
   addGroupButtons(entries,e=>e.kind);
   const filtered=entries.filter(x=>group==='all'||x.kind===group);
   const fragment=document.createDocumentFragment();
   for(const entry of filtered.slice(0,limit)){
    const button=document.createElement('button');
    button.className='approved-match-choice';button.type='button';
    if(entry.matched){
     const image=document.createElement('img');
     image.src=url(entry.matched);
     image.alt='Рисунок '+entry.matched.name;image.loading='lazy';
     button.append(image);
    }
    const label=document.createElement('span');
    label.textContent=entry.opt.textContent;
    button.append(label);
    button.addEventListener('click',()=>{
     picker.value=entry.opt.value;
     picker.dispatchEvent(new Event('change',{bubbles:true}));
     modal.hidden=true;document.body.classList.remove('animal-chooser-opened');
     trigger.focus();
    });
    fragment.append(button);
   }
   if(!filtered.length){
    const p=document.createElement('p');
    p.textContent='Для точных числовых совпадений сначала выполни расчёт. Рисунки можно посмотреть во вкладке «Готовые рисунки».';
    fragment.append(p);
   }
   list.classList.remove('approved-gallery-grid');
   list.replaceChildren(fragment);
   count.textContent='Точных совпадений: '+filtered.length+' · показано '+Math.min(limit,filtered.length);
   more.hidden=filtered.length<=limit;
  }
  function render(){
   drawings.setAttribute('aria-pressed',String(mode==='art'));
   matches.setAttribute('aria-pressed',String(mode==='matches'));
   if(mode==='art')renderArt();else renderMatches();
  }
  // The original chooser disabled itself when there was no numeric search.
  // Allow browsing artwork independently, while leaving download validation.
  const enable=()=>{if(trigger.disabled)trigger.disabled=false};
  enable();
  new MutationObserver(enable).observe(trigger,{attributes:true,attributeFilter:['disabled']});
  trigger.addEventListener('click',async event=>{
   event.preventDefault();event.stopImmediatePropagation();
   modal.hidden=false;document.body.classList.add('animal-chooser-opened');
   group='all';limit=36;mode='art';
   count.textContent='Загружаем рисунки…';
   list.replaceChildren();groups.replaceChildren();
   await load();if(modal.hidden)return;
   render();close.focus();
  },true);
  for(const [node,next] of [[drawings,'art'],[matches,'matches']]){
   node.addEventListener('click',event=>{
    event.preventDefault();event.stopImmediatePropagation();
    mode=next;group='all';limit=36;render();
   },true);
  }
  more.addEventListener('click',event=>{
   event.preventDefault();event.stopImmediatePropagation();
   limit+=36;render();
  },true);
  // The original match-only row list is completely replaced whenever
  // browsing art; other picker controls and the saved calculated score remain.
  drawings.textContent='✦ Готовые рисунки';
  matches.textContent='Точные совпадения';
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);
 else start();
})();
