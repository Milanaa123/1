'use strict';
const W={α:1,β:2,γ:3,δ:4,ε:5,ζ:7,η:8,θ:9,ι:10,κ:20,λ:30,μ:40,ν:50,ξ:60,ο:70,π:80,ρ:100,σ:200,ς:200,τ:300,υ:400,φ:500,χ:600,ψ:700,ω:800};
const RU={'а':'α','б':'μπ','в':'β','г':'γκ','д':'ντ','е':'ε','ё':'ιο','ж':'ζ','з':'ζ','и':'ι','й':'ι','к':'κ','л':'λ','м':'μ','н':'ν','о':'ο','п':'π','р':'ρ','с':'σ','т':'τ','у':'ου','ф':'φ','х':'χ','ц':'τσ','ч':'τσ','ш':'σ','щ':'στσ','ъ':'','ы':'ι','ь':'','э':'ε','ю':'ιου','я':'ια'};
const PRONUNCIATION={'гарольд':'Χάρολντ','этан':'Ίθαν'};
const RANK={species:'вид',subspecies:'подвид',variety:'разновидность',form:'форма',natio:'natio'};
const GROUP={Mammalia:'Млекопитающие',Aves:'Птицы',Reptilia:'Рептилии',Amphibia:'Земноводные',Chondrichthyes:'Акулы и скаты',Actinopterygii:'Рыбы',Actinopteri:'Рыбы',Teleostei:'Рыбы',Arachnida:'Паукообразные',Insecta:'Насекомые',Gastropoda:'Брюхоногие моллюски',Bivalvia:'Двустворчатые моллюски',Malacostraca:'Ракообразные',Cephalopoda:'Головоногие',Chilopoda:'Многоножки'};
const ORDER={Carnivora:'Хищные млекопитающие',Araneae:'Пауки',Scorpiones:'Скорпионы',Mantodea:'Богомолы',Serpentes:'Змеи',Testudines:'Черепахи',Squamata:'Ящерицы и змеи',Anura:'Лягушки и жабы',Lepidoptera:'Бабочки',Coleoptera:'Жуки'};
let meta=null,results=[],sum=null,serial=0,manually=false;
const el=id=>document.getElementById(id);
const norm=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
function score(s){let n=0;for(let c of norm(s))n+=W[c]||0;return n;}
function transcribe(raw){return raw.trim().replace(/[А-Яа-яЁё]+/g,s=>{const word=s.toLowerCase();if(PRONUNCIATION[word])return PRONUNCIATION[word];const greek=[...word].map(c=>RU[c]||'').join('').replace(/ρρ/g,'ρ').replace(/σ$/,'ς');return greek.charAt(0).toUpperCase()+greek.slice(1);}).replace(/\s+/g,' ');}
function validGreek(raw){return !!raw.trim()&&/^[\p{Script=Greek}\s'’\-]+$/u.test(norm(raw));}
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
  'Actinopteri','Actinopterygii','Teleostei','Arachnida','Cephalopoda','Chilopoda',
  'Malacostraca','Insecta','Gastropoda','Bivalvia'];
function groupKey(r){return r[3]||r[6]||'Other';}
function sortInteresting(a,b){
  const rank=r=>{
    let n=GROUP_PRIORITY.indexOf(r[3]);
    if(n<0)n=GROUP_PRIORITY.length+2;
    const bonus=r[4]==='Carnivora'||r[4]==='Scorpiones'||r[4]==='Mantodea'?-2:0;
    return n*10+bonus+(SPECIES_NAME_RU[r[1]]?-7:0)+(r[2]==='species'?0:2)+(r[5]?1000:0);
  };
  return rank(a)-rank(b)||a[1].localeCompare(b[1]);
}
function featured(rows){
  const wanted=Math.min(FEATURED_MINIMUM,rows.length);
  if(!wanted)return [];
  const ordered=rows.slice().sort(sortInteresting);
  const groups=new Map(),usedNames=new Set(),usedGenera=new Set(),out=[];
  for(const r of ordered){const k=groupKey(r);if(!groups.has(k))groups.set(k,[]);groups.get(k).push(r);}
  function add(r){
    const key=r[1]+'|'+r[2];if(usedNames.has(key))return false;
    out.push(r);usedNames.add(key);usedGenera.add(r[1].split(' ')[0]);return true;
  }
  // First cover distinct animal groups, then fill with distinct genera.
  for(const noFlags of [true,false]){
    for(const uniqueGenus of [true,false]){
      let progress=true;
      while(progress&&out.length<wanted){
        progress=false;
        for(const group of groups.values()){
          const candidate=group.find(r=>
            (!noFlags||!r[5])&&(!uniqueGenus||!usedGenera.has(r[1].split(' ')[0]))&&
            !usedNames.has(r[1]+'|'+r[2]));
          if(candidate){add(candidate);progress=true;if(out.length===wanted)break;}
        }
      }
    }
  }
  return out;
}
function render(){el('preview').replaceChildren();let f=document.createDocumentFragment();for(let [i,r] of featured(results).entries()){let li=document.createElement('li'),no=document.createElement('span'),body=document.createElement('span'),name=document.createElement('span'),small=document.createElement('small');li.className='species-row';no.className='idx';no.textContent=String(i+1).padStart(2,'0');name.className='animal-name';name.textContent=display(r);small.textContent=r[1]+(r[2]==='subspecies'?' · подвид':'')+(r[5]?' · '+status(r):'');body.append(name,small);li.append(no,body);f.append(li);}el('preview').append(f);el('featuredCount').textContent=featured(results).length+' из '+results.length+' точных совпадений';el('previewSection').hidden=!results.length;el('downloads').hidden=!results.length;el('empty').textContent=results.length?'':'Совпадений с разницей 0 не найдено. Попробуйте изменить греческую транскрипцию.';}
function reset(){serial++;el('resultPanel').hidden=true;el('previewSection').hidden=true;el('downloads').hidden=true;el('run').disabled=false;el('runLabel').textContent='Найти животных';results=[];sum=null;}
async function run(){let greek=el('greek').value.trim();if(!/^[А-Яа-яЁё\s\-'’]+$/.test(el('name').value.trim())||!validGreek(greek)){reset();el('error').textContent='Введи имя на русском и проверь, что транскрипция состоит только из греческих букв.';return;}let n=score(greek),id=++serial;if(!n){reset();el('error').textContent='Не удалось вычислить число имени. Проверь греческую запись.';return;}el('run').disabled=true;el('runLabel').textContent='Проверяю каталог…';el('error').textContent='';try{let bid=Math.floor(n/25);if(meta&&!meta.available_buckets.includes(bid)){results=[];}else{let response=await fetch('./data/'+bid+'.json');if(!response.ok)throw Error('Архив результатов пока недоступен');let data=await response.json();if(id!==serial)return;results=data.filter(r=>r[0]===n);}sum=n;el('score').textContent=n.toLocaleString('ru-RU');el('total').textContent=results.length.toLocaleString('ru-RU');el('formula').textContent=breakdown(greek)+' · разница 0';el('resultPanel').hidden=false;render();el('resultPanel').scrollIntoView({behavior:'smooth',block:'start'});}catch(e){el('error').textContent='Ошибка загрузки каталога: '+e.message;reset();}finally{if(id===serial){el('run').disabled=false;el('runLabel').textContent='Найти животных';}}}
function csv(x){let s=String(x||'');return /[;\n"]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;}
function download(type){if(!results.length)return;let lines=results.map(r=>[category(r),display(r),r[1],RANK[r[2]]||r[2],r[0],status(r),r[3],r[4],r[6]]);let content=type==='csv'?[[ 'Группа','Русское название','Научное название','Ранг','Сумма','Статус','Класс','Отряд','Тип'],...lines].map(row=>row.map(csv).join(';')).join('\r\n'):[ 'Имя: '+el('name').value,'Греческая запись: '+el('greek').value,'Число: '+sum,'Совпадений: '+results.length,'Источник: Catalogue of Life XR 2026-08-26','',...results.map((r,i)=>(i+1)+'. '+display(r)+' ['+r[1]+'] · '+(RANK[r[2]]||r[2])+(r[5]?' · '+status(r):''))].join('\n');let url=URL.createObjectURL(new Blob(['\ufeff'+content],{type:type==='csv'?'text/csv;charset=utf-8':'text/plain;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='Анимагия_'+sum+'_все_'+results.length+'.'+type;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);}
document.addEventListener('DOMContentLoaded',()=>{let input=el('name'),greek=el('greek');input.addEventListener('input',()=>{if(!manually||!greek.value){greek.value=transcribe(input.value);manually=false;}reset();});greek.addEventListener('input',()=>{manually=true;reset();});el('resetGreek').addEventListener('click',()=>{manually=false;greek.value=transcribe(input.value);reset();});el('form').addEventListener('submit',e=>{e.preventDefault();run();});el('exportTxt').addEventListener('click',()=>download('txt'));el('exportCsv').addEventListener('click',()=>download('csv'));fetch('./meta.json').then(r=>{if(!r.ok)throw Error('meta');return r.json()}).then(x=>{meta=x;el('catalogVersion').textContent=x.version;el('catalogCount').textContent=Number(x.unique_records).toLocaleString('ru-RU');}).catch(()=>{el('catalogVersion').textContent='не загружен';});});
