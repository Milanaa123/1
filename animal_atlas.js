'use strict';
/* Curated illustrations and animal lifestyles; no name data or tracking.
   Each illustration comes from the visitor-provided 5x4 gold-line animal sheet.
   A genus-level visual match is a representative illustration, not an image
   verified for every subspecies. Unknown species receive no diet guess. */
(()=>{
 const URL_SHEET='https://d2ol7oe51mr4n9.cloudfront.net/user_3IWontIKp1HpvdwOJQiSSyMEM6K/9617c2f3-64c8-4ed4-81d2-11bc33934bba.png';
 const COLS=5,ROWS=4;
 const DIETS={predator:'Хищник',herbivore:'Травоядное',omnivore:'Всеядное'};
 const HABITATS={terrestrial:'Наземное',aquatic:'Водное',aerial:'Воздушное',semiaquatic:'Полуводное',arboreal:'Древесное',subterranean:'Подземное'};
 const data=[
  // [art, 0-based cell, genera, species-specific exceptions, diet, primary, secondary]
  ['wolf',0,['Canis'],['Canis lupus','Canis rufus','Canis simensis'], 'predator','terrestrial',[]],
  ['owl',1,['Bubo'],[], 'predator','aerial',['arboreal']],
  ['snow-leopard',2,[],['Panthera uncia','Uncia uncia'],'predator','terrestrial',[]],
  ['whale',3,['Megaptera'],[], 'predator','aquatic',[]],
  ['cobra',4,['Naja'],[], 'predator','terrestrial',[]],
  ['fox',5,['Vulpes'],[], 'omnivore','terrestrial',['subterranean']],
  ['raven',6,['Corvus'],[], 'omnivore','aerial',['arboreal']],
  ['deer',7,['Cervus'],[], 'herbivore','terrestrial',[]],
  ['bear',8,['Ursus'],[], null,'terrestrial',[]],
  ['horse',9,[],['Equus caballus','Equus ferus','Equus przewalskii'], 'herbivore','terrestrial',[]],
  ['cat',10,['Felis'],[], 'predator','terrestrial',[]],
  ['rabbit',11,['Oryctolagus'],[], 'herbivore','subterranean',['terrestrial']],
  ['otter',12,['Lutra','Lontra'],[], 'predator','semiaquatic',[]],
  ['flying-lizard',13,['Draco'],[], 'predator','arboreal',['aerial']],
  ['turtle',14,['Chelonia','Caretta'],[], null,'aquatic',[]],
  ['shark',15,['Carcharodon'],[], 'predator','aquatic',[]],
  ['dolphin',16,['Delphinus'],[], 'predator','aquatic',[]],
  ['octopus',17,['Octopus'],[], 'predator','aquatic',[]],
  ['frog',18,['Rana'],[], 'predator','semiaquatic',[]],
  ['moth',19,['Saturnia','Attacus'],[], null,'aerial',[]],
 ];
 const names=['Волк','Сова','Снежный барс','Кит','Кобра','Лисица','Ворон','Олень','Медведь','Лошадь','Кошка','Кролик','Выдра','Летучая ящерица','Морская черепаха','Акула','Дельфин','Осьминог','Лягушка','Ночная бабочка'];
 const exactProfiles=new Map([
  ['Ursus arctos',['omnivore','terrestrial',[]]],['Ursus maritimus',['predator','terrestrial',['aquatic']]],
  ['Ursus americanus',['omnivore','terrestrial',[]]],['Chelonia mydas',['herbivore','aquatic',[]]],
  ['Caretta caretta',['predator','aquatic',[]]],['Vulpes vulpes',['omnivore','terrestrial',['subterranean']]],
  ['Canis lupus',['predator','terrestrial',[]]],['Panthera uncia',['predator','terrestrial',[]]],
  ['Draco volans',['predator','arboreal',['aerial']]],
  ['Equus caballus',['herbivore','terrestrial',[]]],['Equus ferus',['herbivore','terrestrial',[]]]
 ]);
 const fixedLabels={wolf:'Обобщённый рисунок волка',owl:'Обобщённый рисунок совы', 'snow-leopard':'Снежный барс'};
 let loaded=null;
 const normalize=str=>String(str||'').trim().split(/\s+/).slice(0,2).join(' ');
 function resolve(row){
  if(!Array.isArray(row)||typeof row[1]!=='string')return null;
  const name=normalize(row[1]),genus=name.split(' ')[0];
  let candidate=null;
  for(const [id,cell,genera,species,diet,habitat,secondary] of data){
   if(species.includes(name)||genera.includes(genus)){
    candidate={id,cell,label:names[cell],diet,habitat,secondary,
      exact:species.includes(name)};
    break;
   }
  }
  if(!candidate)return null;
  const known=exactProfiles.get(name);
  const [diet,habitat,secondary]=known||[candidate.diet,candidate.habitat,candidate.secondary];
  // Conservative exception: some large bears have very different diets;
  // avoid assigning a genus-wide diet when species wasn't checked.
  const safeDiet=candidate.id==='bear'&&!known?null:diet;
  return {...candidate,diet:safeDiet,habitat,secondary, scientific:name,
    note:candidate.exact?'Художественная иллюстрация указанного вида':
      'Обобщённый рисунок биологической группы · '+candidate.label};
 }
 function classify(row){
  if(!Array.isArray(row)||!row[1])return null;
  const approved=resolve(row);
  if(approved)return approved;
  const name=normalize(row[1]),genus=name.split(' ')[0];
  const cls=row[3],order=row[4];
  const aquaticClasses=new Set(['Actinopterygii','Actinopteri','Teleostei',
    'Chondrichthyes','Elasmobranchii','Holocephali','Chondrostei',
    'Dipnoi','Sarcopterygii','Cephalopoda','Asteroidea','Ophiuroidea',
    'Echinoidea','Holothuroidea','Polyplacophora']);
  const make=(diet,habitat,secondary=[])=>({
   diet,habitat,secondary,scientific:name,id:null,cell:null,
   note:'Среда/питание по надёжно распознаваемой группе, без рисунка вида'
  });
  // A class identifies habitat for fish and permanently aquatic invertebrates,
  // but never an individual diet without ecological data.
  if(['Hippocampus','Orcinus','Physeter','Balaenoptera','Eubalaena'].includes(genus))
   return make('predator','aquatic');
  if(aquaticClasses.has(cls))return make(null,'aquatic');
  // Only relatively stable, recognisable groups receive dietary labels.
  if(['Cetacea','Sirenia'].includes(order))return make(
   order==='Sirenia'?'herbivore':'predator','aquatic');
  if(order==='Chiroptera')return make(null,'aerial');
  if(order==='Sphenisciformes')return make('predator','semiaquatic');
  if(order==='Strigiformes')return make('predator','aerial');
  if(['Mantodea','Scorpiones'].includes(order))return make('predator','terrestrial');
  if(['Talpa','Heterocephalus','Spalax','Cryptomys','Fukomys'].includes(genus))
   return make(genus==='Talpa'?'predator':'herbivore','subterranean');
  if(['Sciurus','Pongo','Petaurus','Dendrolagus'].includes(genus))
   return make(null,'arboreal');
  if(genus==='Ailuropoda')return make('herbivore','terrestrial');
  if(['Crocodylus','Alligator','Caiman','Gavialis'].includes(genus))
   return make('predator','semiaquatic');
  return null;
 }
 function style(profile){
  const p=profile||{};
  return {diet:p.diet||'unknown',habitat:p.habitat||'unknown',
    dietText:DIETS[p.diet]||'Рацион не установлен',
    habitatText:HABITATS[p.habitat]||'Среда не установлена',
    secondaryText:(p.secondary||[]).map(x=>HABITATS[x]).filter(Boolean)};
 }
 function render(container,profile){
  if(!container)return;
  container.replaceChildren();
  if(!profile)return;
  const img=document.createElement('div');
  img.className='atlas-art-sprite';img.setAttribute('role','img');
  img.setAttribute('aria-label',profile.note+' — '+profile.scientific);
  img.style.backgroundImage='url('+JSON.stringify(URL_SHEET)+')';
  img.style.backgroundSize='500% 400%';
  img.style.backgroundPosition=(profile.cell%COLS*25)+'% '+(Math.floor(profile.cell/COLS)*100/(ROWS-1))+'%';
  container.append(img);
 }
 function asset(){
  if(!loaded){
   loaded=new Promise(resolve=>{
    const image=new Image();image.crossOrigin='anonymous';
    image.onload=()=>resolve(image);image.onerror=()=>resolve(null);
    image.src=URL_SHEET;
   });
  }
  return loaded;
 }
 async function drawable(){
  const image=await asset();if(!image)return null;
  try{
   const scratch=document.createElement('canvas');scratch.width=2;scratch.height=2;
   scratch.getContext('2d').drawImage(image,0,0,2,2);
   scratch.toDataURL('image/png');return image;
  }catch(_){return null;}
 }
 function drawCanvas(ctx,image,profile,x,y,w,h){
  if(!image||!profile)return false;
  const tileW=image.naturalWidth/COLS,tileH=image.naturalHeight/ROWS;
  const sourceX=(profile.cell%COLS)*tileW,sourceY=Math.floor(profile.cell/COLS)*tileH;
  ctx.save();ctx.drawImage(image,sourceX,sourceY,tileW,tileH,x,y,w,h);ctx.restore();
  return true;
 }
 window.AnimagiaAnimalAtlas=Object.freeze({
  imageUrl:URL_SHEET,resolve,classify,style,render,drawable,drawCanvas,
  list:data.map(([key,cell])=>({key,cell,name:names[cell]})),dietLabels:DIETS,
  habitatLabels:HABITATS
 });
})();