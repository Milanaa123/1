'use strict';
const W={α:1,β:2,γ:3,δ:4,ε:5,ζ:7,η:8,θ:9,ι:10,κ:20,λ:30,μ:40,ν:50,ξ:60,ο:70,π:80,ρ:100,σ:200,ς:200,τ:300,υ:400,φ:500,χ:600,ψ:700,ω:800,ϝ:6,ϛ:6,ϙ:90,ϟ:90,ϡ:900};
const LATIN_OLD=Object.fromEntries('abcdefghijklmnopqrstuvwxyz'.split('').map((ch,i)=>[ch,[1,2,90,4,5,500,3,600,10,4,20,30,40,50,70,80,90,100,200,300,400,6,6,600,400,7][i]]));
const RU={'а':'α','б':'β','в':'ϝ','г':'γ','д':'δ','е':'ε','ё':'ιο','ж':'ζ','з':'ζ','и':'ι','й':'ι','к':'κ','л':'λ','м':'μ','н':'ν','о':'ο','п':'π','р':'ρ','с':'σ','т':'τ','у':'ου','ф':'φ','х':'χ','ц':'τσ','ч':'τσ','ш':'σ','щ':'στσ','ъ':'','ы':'ι','ь':'','э':'ε','ю':'ιου','я':'ια'};
// Ancient alphabet convention: modern sounds absent in Ancient Greek use declared approximations.
// Russian в (/v/) is represented by archaic digamma ϝ (/w/), not beta (/b/).
// No person-specific overrides: always transcribe the Russian written name consistently.
// The user can edit the Greek rendering before calculating.
const PRONUNCIATION={};
const RANK={species:'вид',subspecies:'подвид',variety:'разновидность',form:'форма',natio:'natio'};
const GROUP={Mammalia:'Млекопитающие',Aves:'Птицы',Reptilia:'Рептилии',Amphibia:'Земноводные',Chondrichthyes:'Акулы и скаты',Actinopterygii:'Рыбы',Actinopteri:'Рыбы',Teleostei:'Рыбы',Arachnida:'Паукообразные',Insecta:'Насекомые',Gastropoda:'Брюхоногие моллюски',Bivalvia:'Двустворчатые моллюски',Malacostraca:'Ракообразные',Cephalopoda:'Головоногие',Chilopoda:'Многоножки'};
const ORDER={Carnivora:'Хищные млекопитающие',Araneae:'Пауки',Scorpiones:'Скорпионы',Mantodea:'Богомолы',Serpentes:'Змеи',Testudines:'Черепахи',Squamata:'Ящерицы и змеи',Anura:'Лягушки и жабы',Lepidoptera:'Бабочки',Coleoptera:'Жуки'};
let meta=null,results=[],sum=null,serial=0,manually=false;
const el=id=>document.getElementById(id);
const norm=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
function score(s){let n=0;for(let c of norm(s))n+=W[c]||0;return n;}
function scoreLatin(s){let n=0;for(const c of norm(s))n+=LATIN_OLD[c]||0;return n;}
function scoreMixed(s){let n=0;for(const c of norm(s))n+=LATIN_OLD[c]||W[c]||0;return n;}
function transcribe(raw){return raw.trim().replace(/[А-Яа-яЁё]+/g,s=>{const word=s.toLowerCase();if(PRONUNCIATION[word])return PRONUNCIATION[word];const greek=[...word].map(c=>RU[c]||'').join('').replace(/ιια/g,'ια').replace(/δζ/g,'τζ').replace(/σ$/,'ς');return greek.charAt(0).toUpperCase()+greek.slice(1);}).replace(/\s+/g,' ');}
// Step 1 -> 2: predictable Cyrillic-to-Latin spelling suggestion, not
// an English-name dictionary. The visitor verifies original spelling.
const NAME_CYR_TO_LAT={
 'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'zh',
 'з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o',
 'п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'kh','ц':'ts',
 'ч':'ch','ш':'sh','щ':'shch','ъ':'','ы':'y','ь':'','э':'e',
 'ю':'yu','я':'ya'
};
function nameLatin(raw){
 return raw.trim().replace(/[А-Яа-яЁё]+/g,token=>{
  const letters=[...token.toLowerCase()].map(c=>NAME_CYR_TO_LAT[c]).join('');
  return letters.slice(0,1).toUpperCase()+letters.slice(1);
 }).replace(/\s+/g,' ');
}
// Step 2 -> 3: explicitly approximate Ancient Greek phonetic notation.
// English spellings do not uniquely specify sounds; every result stays editable.
// Name transcription is independent of scientific taxon transliteration.
const NAME_LAT_TO_GREEK={
 a:'α',b:'β',c:'κ',d:'δ',e:'ε',f:'φ',g:'γ',h:'χ',i:'ι',
 j:'τζ',k:'κ',l:'λ',m:'μ',n:'ν',o:'ο',p:'π',q:'κ',
 r:'ρ',s:'σ',t:'τ',u:'ου',v:'ϝ',w:'ϝ',x:'ξ',
 y:'υ',z:'ζ'
};
const NAME_LAT_CLUSTERS={
 aser:'ειζερ',ow:'αου',sh:'σ',ch:'χ',th:'θ',ph:'φ',
 ck:'κ',zh:'ζ',qu:'κου',ee:'ι',oo:'ου',
 ei:'ει',ai:'αι',ou:'ου',au:'αυ',eu:'ευ'
};
function nameGreekFromLatin(raw){
 return raw.trim().replace(/[A-Za-z]+(?:-[A-Za-z]+)*/g,token=>{
  const hyphenated=token.toLowerCase().split('-');
  const greek=hyphenated.map(word=>{
   let i=0,out='',aspirate=false;
   if(/^h[aeiou]/.test(word)){
    aspirate=true; i=1;
   }
   while(i<word.length){
    let found=false;
    for(const n of [4,2]){
     const chunk=word.slice(i,i+n);
     if(NAME_LAT_CLUSTERS[chunk]){
      out+=NAME_LAT_CLUSTERS[chunk];i+=n;found=true;break;
     }
    }
    if(!found){out+=NAME_LAT_TO_GREEK[word[i]]||'';i++;}
   }
   out=out.replace(/σ$/,'ς');
   if(aspirate){
    const rough={'α':'ἁ','ε':'ἑ','η':'ἡ','ι':'ἱ','ο':'ὁ','υ':'ὑ','ω':'ὡ'};
    out=(rough[out[0]]||out[0])+out.slice(1);
   }
   return out;
  }).join('-');
  return greek.charAt(0).toUpperCase()+greek.slice(1);
 }).replace(/\s+/g,' ');
}
function validLatinName(raw){
 return !!raw.trim() && /^[A-Za-z\s'’\-]+$/.test(raw);
}
function validGreek(raw){return !!raw.trim()&&[...norm(raw)].every(c=>W[c]!==undefined||/^[\s'’\-]$/.test(c));}
function breakdown(raw){return raw.trim().split(/\s+/).map(word=>word+' ('+score(word)+')').join(' + ');}

const SPECIES_NAME_RU = {
  // Only established or well-attested common names. Others are marked as phonetic renderings.
  'Naja oxiana':'Среднеазиатская кобра',
  'Anolis cooki':'Анолис Кука',
  'Ompok pabo':'Сом пабо',
  'Ourebia montana':'Горный ориби',
  'Marmosa andersoni':'Мышевидный опоссум Андерсона',
  'Rhogeessa parvula':'Малая жёлтая летучая мышь',
  'Parotia lawesii':'Паротия Лоуэса',
  'Agapornis taranta':'Чернокрылый неразлучник',
  'Xenagama batillifera':'Щитохвостая агама',
  'Vulpes vulpes':'Обыкновенная лисица',
  'Panthera uncia':'Снежный барс',
  'Tragulus napu':'Большой оленёк',
  'Pteropus keyensis':'Кейский крылан',
  'Hipposideros bicolor':'Двуцветный листонос',
  'Anolis monteverde':'Анолис Монтеверде',
  'Atelopus calima':'Жаба-арлекин Калима',
  'Geocrinia laevis':'Тасманийская лягушка',
  'Agapornis taranta':'Чернокрылый неразлучник'
};
const GENUS_RU={
  // Genus-level group names are not invented species common names.
  Naja:'Кобра', Ophiophagus:'Королевская кобра', Anolis:'Анолис',
  Gekko:'Геккон', Gehyra:'Геккон', Calumma:'Хамелеон',
  Agama:'Агама', Xenagama:'Агама', Crotalus:'Гремучая змея',
  Trimeresurus:'Куфия', Atelopus:'Жаба-арлекин',
  Agapornis:'Неразлучник', Parotia:'Райская птица',
  Marmosa:'Опоссум', Pteropus:'Крылан', Hipposideros:'Листонос',
  Rhogeessa:'Летучая мышь', Murina:'Летучая мышь',
  Clarias:'Сом', Ompok:'Сом', Scorpaena:'Скорпена',
  Eurycea:'Саламандра', Oedipina:'Саламандра',
  Arctosa:'Паук-волк', Alopecosa:'Паук-волк',
  Peucetia:'Паук-рысь', Phiale:'Паук-скакун',
  Plexippus:'Паук-скакун', Phintelloides:'Паук-скакун',
  Scolopendra:'Сколопендра', Centruroides:'Скорпион',
  Charmus:'Скорпион'
};
const ORDER_RU={
  Carnivora:'Хищный зверь', Rodentia:'Грызун', Chiroptera:'Летучая мышь',
  Primates:'Примат', Artiodactyla:'Парнокопытное', Perissodactyla:'Непарнокопытное',
  Didelphimorphia:'Сумчатое', Diprotodontia:'Сумчатое',
  Passeriformes:'Птица', Accipitriformes:'Хищная птица',
  Strigiformes:'Сова', Falconiformes:'Сокол', Psittaciformes:'Попугай',
  Squamata:'Рептилия', Serpentes:'Змея', Testudines:'Черепаха',
  Anura:'Лягушка или жаба', Caudata:'Саламандра или тритон',
  Scorpiones:'Скорпион', Araneae:'Паук', Opiliones:'Сенокосец',
  Mantodea:'Богомол', Lepidoptera:'Бабочка',
  Coleoptera:'Жук', Odonata:'Стрекоза', Neuroptera:'Сетчатокрылое',
  Orthoptera:'Кузнечик или саранча', Hymenoptera:'Перепончатокрылое',
  Diptera:'Двукрылое', Hemiptera:'Клоп или цикада',
  Decapoda:'Десятиногое ракообразное',
  Octopoda:'Осьминог', Teuthida:'Кальмар'
};
const CLASS_RU={
  Mammalia:'Млекопитающее', Aves:'Птица', Reptilia:'Рептилия',
  Amphibia:'Земноводное', Chondrichthyes:'Акула или скат',
  Actinopterygii:'Рыба', Actinopteri:'Рыба', Teleostei:'Рыба',
  Arachnida:'Паукообразное', Insecta:'Насекомое',
  Gastropoda:'Брюхоногий моллюск', Bivalvia:'Двустворчатый моллюск',
  Malacostraca:'Ракообразное', Cephalopoda:'Головоногий моллюск',
  Chilopoda:'Губоногая многоножка', Diplopoda:'Двупарноногая многоножка',
  Polychaeta:'Многощетинковый червь', Anthozoa:'Коралловый полип',
  Demospongiae:'Губка', Asteroidea:'Морская звезда', Ophiuroidea:'Офиура',
  Echinoidea:'Морской ёж', Ascidiacea:'Асцидия'
};
const PHYLUM_RU={
  Arthropoda:'Членистоногое', Mollusca:'Моллюск', Chordata:'Хордовое',
  Annelida:'Кольчатый червь', Cnidaria:'Стрекающее', Echinodermata:'Иглокожее',
  Porifera:'Губка', Nematoda:'Круглый червь', Platyhelminthes:'Плоский червь',
  Bryozoa:'Мшанка', Rotifera:'Коловратка', Tardigrada:'Тихоходка'
};
const LETTER_RU={a:'а',b:'б',c:'к',d:'д',e:'е',f:'ф',g:'г',h:'х',i:'и',j:'й',
 k:'к',l:'л',m:'м',n:'н',o:'о',p:'п',q:'к',r:'р',s:'с',t:'т',u:'у',
 v:'в',w:'в',x:'кс',y:'и',z:'з'};
const LATIN_DIGRAPHS={ph:'ф',th:'т',ch:'х',sh:'ш',zh:'ж',kh:'х',ck:'к',qu:'кв',sch:'сх'};
function rusTransliteration(name){
  // Cyrillic rendering of a scientific name, NOT an invented official Russian species name.
  return name.toLowerCase().split(' ').map(word=>{
    let out='';
    for(let i=0;i<word.length;){
      const pair=word.slice(i,i+2),tri=word.slice(i,i+3);
      if(LATIN_DIGRAPHS[tri]){out+=LATIN_DIGRAPHS[tri];i+=3;}
      else if(LATIN_DIGRAPHS[pair]){out+=LATIN_DIGRAPHS[pair];i+=2;}
      else{out+=LETTER_RU[word[i]]||'';i++;}
    }
    return out;
  }).join(' ');
}
function category(r){return ORDER_RU[r[4]]||CLASS_RU[r[3]]||PHYLUM_RU[r[6]]||'Животное';}
function display(r){
  if(SPECIES_NAME_RU[r[1]])return SPECIES_NAME_RU[r[1]];
  const genus=r[1].split(' ')[0];
  // Distinguish species clearly even when only the group is known.
  return (GENUS_RU[genus]||category(r))+' — '+rusTransliteration(r[1]);
}
function status(r){return r[5]==='†'?'Вымерший †':r[5]==='?'?'Сомнительный статус ?':'';}


const FEATURED_MINIMUM=30;
const GROUP_PRIORITY=['Mammalia','Aves','Reptilia','Amphibia','Chondrichthyes',
  'Elasmobranchii','Actinopteri','Actinopterygii','Teleostei',
  'Arachnida','Cephalopoda','Chilopoda','Malacostraca','Insecta',
  'Gastropoda','Bivalvia'];
const GROUP_QUOTA={Mammalia:6,Aves:6,Reptilia:6,Amphibia:4,
  Chondrichthyes:3,Elasmobranchii:3,Actinopteri:5,Actinopterygii:5,
  Teleostei:5,Arachnida:5,Cephalopoda:3,Chilopoda:2,
  Malacostraca:3,Insecta:5,Gastropoda:2,Bivalvia:2};
function groupKey(r){return r[3]||r[6]||'Other';}
function sortInteresting(a,b){
  function quality(r){
    const cls=r[3],genus=r[1].split(' ')[0],order=r[4];
    let value=0;
    if(SPECIES_NAME_RU[r[1]])value-=10;
    if(GENUS_RU[genus])value-=3;
    if(r[2]==='species')value-=2;
    if(order==='Carnivora'||order==='Scorpiones'||order==='Mantodea')value-=7;
    if(cls==='Arachnida'){
      if(['Araneae','Solifugae','Pseudoscorpiones'].includes(order))value-=5;
      if(['Sarcoptiformes','Trombidiformes','Mesostigmata'].includes(order))value+=8;
    }
    if(cls==='Insecta'){
      if(['Lepidoptera','Odonata'].includes(order))value-=5;
      if(order==='Coleoptera')value-=2;
    }
    if(r[5])value+=1000;
    return value;
  }
  return quality(a)-quality(b)||a[1].localeCompare(b[1]);
}
function featured(rows){
  const wanted=Math.min(FEATURED_MINIMUM,rows.length);
  if(!wanted)return [];
  const bucket=new Map();
  for(const row of rows){
    const key=groupKey(row);
    if(!bucket.has(key))bucket.set(key,[]);
    bucket.get(key).push(row);
  }
  for(const items of bucket.values())items.sort(sortInteresting);
  const primary=GROUP_PRIORITY.filter(g=>bucket.has(g));
  const secondary=[...bucket.keys()].filter(g=>!GROUP_PRIORITY.includes(g)).sort();
  const out=[],used=new Set(),usedGenera=new Set(),countByGroup={};
  function add(row,group){
    const key=row[1]+'|'+row[2];
    if(used.has(key))return false;
    used.add(key);usedGenera.add(row[1].split(' ')[0]);
    countByGroup[group]=(countByGroup[group]||0)+1;out.push(row);
    return true;
  }
  function fill(groups,quota,noFlags,distinctGenus){
    let progress=true;
    while(progress&&out.length<wanted){
      progress=false;
      for(const group of groups){
        if(out.length===wanted)break;
        if(quota&&(countByGroup[group]||0)>=(GROUP_QUOTA[group]||2))continue;
        const next=bucket.get(group).find(row=>
          (!noFlags||!row[5])&&
          (!distinctGenus||!usedGenera.has(row[1].split(' ')[0]))&&
          !used.has(row[1]+'|'+row[2]));
        if(next){add(next,group);progress=true;}
      }
    }
  }
  // Prefer mammals, birds, reptiles, fish and distinctive invertebrates.
  // Include rarer groups or flagged taxa only when needed to reach 30 real matches.
  for(const noFlags of [true,false]){
    for(const distinctGenus of [true,false]){
      fill(primary,true,noFlags,distinctGenus);
      fill(primary,false,noFlags,distinctGenus);
      fill(secondary,false,noFlags,distinctGenus);
    }
  }
  return out;
}
function render(){el('preview').replaceChildren();let f=document.createDocumentFragment();for(let [i,r] of featured(results).entries()){let li=document.createElement('li'),no=document.createElement('span'),body=document.createElement('span'),name=document.createElement('span'),small=document.createElement('small');li.className='species-row';no.className='idx';no.textContent=String(i+1).padStart(2,'0');name.className='animal-name';name.textContent=display(r);small.textContent=r[1]+(r[2]==='subspecies'?' · подвид':'')+(r[5]?' · '+status(r):'');body.append(name,small);li.append(no,body);f.append(li);}el('preview').append(f);el('featuredCount').textContent=featured(results).length+' из '+results.length+' точных совпадений';el('previewSection').hidden=!results.length;el('downloads').hidden=!results.length;el('empty').textContent=results.length?'':'Совпадений с разницей 0 не найдено. Попробуйте изменить греческую транскрипцию.';}
function reset(){serial++;el('resultPanel').hidden=true;el('previewSection').hidden=true;el('downloads').hidden=true;el('run').disabled=false;el('runLabel').textContent='Найти животных';results=[];sum=null;}
async function run(){let greek=el('greek').value.trim();if(!/^[А-Яа-яЁё\s\-'’]+$/.test(el('name').value.trim())||!validGreek(greek)){reset();el('error').textContent='Введи имя на русском и проверь, что транскрипция состоит только из греческих букв.';return;}let n=score(greek),id=++serial;if(!n){reset();el('error').textContent='Не удалось вычислить число имени. Проверь греческую запись.';return;}el('run').disabled=true;el('runLabel').textContent='Проверяю каталог…';el('error').textContent='';try{let bid=Math.floor(n/25);if(meta&&!meta.available_buckets.includes(bid)){results=[];}else{let response=await fetch('./data/'+bid+'.json');if(!response.ok)throw Error('Архив результатов пока недоступен');let data=await response.json();if(id!==serial)return;results=data.filter(r=>r[0]===n);}sum=n;el('score').textContent=n.toLocaleString('ru-RU');el('total').textContent=results.length.toLocaleString('ru-RU');el('formula').textContent=breakdown(greek)+' · разница 0';el('resultPanel').hidden=false;render();el('resultPanel').scrollIntoView({behavior:'smooth',block:'start'});}catch(e){el('error').textContent='Ошибка загрузки каталога: '+e.message;reset();}finally{if(id===serial){el('run').disabled=false;el('runLabel').textContent='Найти животных';}}}
function csv(x){let s=String(x||'');return /[;\n"]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;}
function download(type){if(!results.length)return;let lines=results.map(r=>[category(r),display(r),r[1],RANK[r[2]]||r[2],r[0],status(r),r[3],r[4],r[6]]);let content=type==='csv'?[[ 'Группа','Русское название','Научное название','Ранг','Сумма','Статус','Класс','Отряд','Тип'],...lines].map(row=>row.map(csv).join(';')).join('\r\n'):[ 'Имя: '+el('name').value,'Греческая запись: '+el('greek').value,'Число: '+sum,'Совпадений: '+results.length,'Источник: Catalogue of Life XR 2026-08-26','',...results.map((r,i)=>(i+1)+'. '+display(r)+' ['+r[1]+'] · '+(RANK[r[2]]||r[2])+(r[5]?' · '+status(r):''))].join('\n');let url=URL.createObjectURL(new Blob(['\ufeff'+content],{type:type==='csv'?'text/csv;charset=utf-8':'text/plain;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='Анимагия_'+sum+'_все_'+results.length+'.'+type;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);}
document.addEventListener('DOMContentLoaded',()=>{
 const input=el('name'),latin=el('latin'),greek=el('greek');
 // Editing upstream restarts the chain; Greek can always be corrected manually.
 input.addEventListener('input',()=>{
  latin.value=nameLatin(input.value);
  greek.value=nameGreekFromLatin(latin.value);
  reset();
 });
 latin.addEventListener('input',()=>{
  greek.value=nameGreekFromLatin(latin.value);
  reset();
 });
 greek.addEventListener('input',reset);
 el('resetLatin').addEventListener('click',()=>{
  latin.value=nameLatin(input.value);
  greek.value=nameGreekFromLatin(latin.value);
  reset();
 });
 el('resetGreek').addEventListener('click',()=>{
  greek.value=nameGreekFromLatin(latin.value);
  reset();
 });
 el('form').addEventListener('submit',e=>{e.preventDefault();run();});
 el('exportTxt').addEventListener('click',()=>download('txt'));
 el('exportCsv').addEventListener('click',()=>download('csv'));
 fetch('./meta.json').then(r=>{if(!r.ok)throw Error('meta');return r.json()})
  .then(x=>{meta=x;el('catalogVersion').textContent=x.version;el('catalogCount').textContent=Number(x.unique_records).toLocaleString('ru-RU');})
  .catch(()=>{el('catalogVersion').textContent='не загружен';});
});
