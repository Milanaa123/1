'use strict';
/* Curated illustrations and animal lifestyles; no name data or tracking.
   Each illustration comes from the visitor-provided 5x4 gold-line animal sheet.
   A genus-level visual match is a representative illustration, not an image
   verified for every subspecies. Unknown species receive no diet guess. */
(()=>{
 const URL_SHEET='./art/animals-gold-v1.png';
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
 const habitatVerifiedBySpecies=new Map([
  // Solomons forest stream banks (IUCN 2020), alpine grassland stones etc.
  ['Cornufer opisthodon','semiaquatic'],
  ['Microkayla wettsteini','terrestrial'],
  ['Hyla arborea','arboreal'],
  ['Rana temporaria','semiaquatic'],
  ['Bufo bufo','terrestrial'],
  ['Castor fiber','semiaquatic'],
  ['Castor canadensis','semiaquatic']
 ]);
 const exactProfiles=new Map([
  ['Ursus arctos',['omnivore','terrestrial',[]]],['Ursus maritimus',['predator','semiaquatic',['terrestrial']]],
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
      exact:species.includes(name)&&String(row[1]).trim().split(/\s+/).length===2};
    break;
   }
  }
  // A generic frog engraving is anatomically relevant to adult anurans;
  // it never claims to show the exact Cornufer, Microkayla etc. species.
  if(!candidate&&row[4]==='Anura')
   candidate={id:'frog',cell:18,label:'Лягушка',diet:'predator',
      habitat:null,secondary:[],exact:false};
  if(!candidate)return null;
  const known=String(row[1]).trim().split(/\s+/).length===2?exactProfiles.get(name):null;
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
  const name=normalize(row[1]),genus=name.split(' ')[0];
  const verified=habitatVerifiedBySpecies.get(name);
  if(verified)return {...(approved||{
   diet:row[4]==='Anura'?'predator':genus==='Castor'?'herbivore':null,
   secondary:[],scientific:name,id:null,cell:null
  }),habitat:verified};
  if(approved)return approved;
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
  // Well-established lifestyles, independent of whether artwork exists.
  if(genus==='Castor')return make('herbivore','semiaquatic');
  if(genus==='Bufo')return make('predator','terrestrial');
  if(['Tyto','Strix'].includes(genus))return make('predator','aerial');
  if(genus==='Pteropus')return make('herbivore','aerial');
  if(order==='Chiroptera')return make(null,'aerial');
  if(order==='Sphenisciformes')return make('predator','semiaquatic');
  if(order==='Strigiformes')return make('predator','aerial');
  // These are adult life-stage dietary categories. Frog habitats vary
  // enormously; never assume every Anura is semi-aquatic.
  if(order==='Anura')return make('predator',null);
  if(order==='Araneae')return make('predator',null);
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
 const transparentArtCache=new Map();
 const SUBJECT_OVALS=[
  [.45,.54,.46,.45],[.50,.53,.39,.46],[.50,.51,.46,.43],[.48,.51,.49,.39],[.54,.53,.42,.47],
  [.45,.55,.47,.44],[.47,.55,.48,.44],[.50,.54,.39,.44],[.49,.56,.44,.43],[.50,.55,.46,.44],
  [.48,.57,.42,.42],[.50,.54,.41,.44],[.49,.55,.46,.43],[.51,.53,.49,.44],[.51,.56,.46,.41],
  [.50,.54,.49,.38],[.48,.54,.47,.44],[.50,.52,.44,.44],[.50,.51,.45,.39],[.50,.52,.43,.46]
 ];
 function goldCutout(image,index){
  if(transparentArtCache.has(index))return transparentArtCache.get(index);
  const w=Math.round(image.naturalWidth/COLS),h=Math.round(image.naturalHeight/ROWS);
  const sourceX=Math.round(image.naturalWidth*(index%COLS)/COLS);
  const sourceY=Math.round(image.naturalHeight*Math.floor(index/COLS)/ROWS);
  const layer=document.createElement('canvas');layer.width=w;layer.height=h;
  const ctx=layer.getContext('2d',{willReadFrequently:true});
  if(!ctx)return null;
  ctx.drawImage(image,sourceX,sourceY,w,h,0,0,w,h);
  const pixels=ctx.getImageData(0,0,w,h),data=pixels.data;
  let frogAlpha=null;
  if(index===18){
   const mask=document.createElement('canvas');mask.width=w;mask.height=h;
   const m=mask.getContext('2d');
   // The original frog is traced once to exclude stars and the large background rings.
   // Keep the frog's complete muzzle: the previous upper-right mask ended
   // at x=259 and cut off its actual nose and upper snout.
   const points=[[15,164],[30,128],[37,93],[60,88],[72,63],[101,58],[126,42],
    [154,28],[193,30],[231,48],[259,65],[289,84],[294,105],
    [285,124],[263,141],[255,160],[238,177],[214,180],[197,188],
    [181,202],[152,207],[123,223],[82,219],[55,197],[18,192]];
   m.filter='blur(3px)';m.fillStyle='#fff';m.beginPath();
   points.forEach(([x,y],i)=>i?m.lineTo(x*w/307,y*h/256):m.moveTo(x*w/307,y*h/256));
   m.closePath();m.fill();frogAlpha=m.getImageData(0,0,w,h).data;
  }
  const [cx,cy,rx,ry]=SUBJECT_OVALS[index];
  const clamp=n=>Math.min(1,Math.max(0,n));
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const i=(y*w+x)*4;
   const red=data[i]/255,green=data[i+1]/255,blue=data[i+2]/255;
   const warm=Math.max(0,red-blue);
   const luminosity=(red+green+blue)/3;
   const ellipse=((x/w-cx)/rx)**2+((y/h-cy)/ry)**2;
   const envelope=index===18?frogAlpha[i+3]/255:clamp((1-ellipse)/.23);
   const intensity=clamp((luminosity-(index===18?.24:.245))*(index===18?3:3.65))*
    clamp(warm*(index===18?6:6.5))*envelope;
   data[i]=Math.round(255*(.81+.19*intensity));
   data[i+1]=Math.round(255*(.62+.23*intensity));
   data[i+2]=Math.round(255*(.39+.20*intensity));
   data[i+3]=Math.round(255*intensity);
  }
  ctx.putImageData(pixels,0,0);
  if(index===18){
   // Restore the nostril and continuous golden muzzle IN THE ORIGINAL cutout.
   // All edits use coordinates of the 307x256 source cell, so they scale with
   // the atlas without changing other species or the calculation.
   ctx.save();
   ctx.scale(w/307,h/256);
   ctx.lineJoin='round';ctx.lineCap='round';
   // The slope follows the existing right-facing frog head; preserve the eye.
   ctx.shadowColor='#f6d899';ctx.shadowBlur=2.8;
   ctx.strokeStyle='rgba(245,205,139,.86)';ctx.lineWidth=2.8;
   ctx.beginPath();ctx.moveTo(224,57);
   ctx.bezierCurveTo(252,57,274,75,283,90);
   ctx.quadraticCurveTo(289,101,279,111);ctx.stroke();
   // Under-snout contour avoids a straight, unnaturally truncated muzzle.
   ctx.strokeStyle='rgba(222,165,104,.72)';ctx.lineWidth=1.8;
   ctx.beginPath();ctx.moveTo(279,111);
   ctx.quadraticCurveTo(265,124,249,128);ctx.stroke();
   // Oval nostril, pinprick specular light and very short cheek crease.
   ctx.shadowBlur=0;ctx.fillStyle='rgba(53,31,38,.96)';
   ctx.beginPath();ctx.ellipse(270,91,3.6,2.6,-.34,0,Math.PI*2);ctx.fill();
   ctx.strokeStyle='rgba(255,222,161,.93)';ctx.lineWidth=1.1;
   ctx.beginPath();ctx.arc(270,91,4.6,-2.85,-1.45);ctx.stroke();
   ctx.beginPath();ctx.moveTo(255,114);
   ctx.quadraticCurveTo(246,120,237,117);ctx.stroke();
   ctx.restore();
  }
  transparentArtCache.set(index,layer);
  return layer;
 }
 function render(container,profile){
  if(!container)return;
  container.replaceChildren();
  if(!profile)return;
  const picture=document.createElement('canvas');
  picture.className='atlas-art-sprite';
  picture.setAttribute('role','img');
  picture.setAttribute('aria-label',profile.note+' — '+profile.scientific);
  container.append(picture);
  void asset().then(img=>{
   if(!img||!container.contains(picture))return;
   const cutout=goldCutout(img,profile.cell);
   if(!cutout)return;
   picture.width=cutout.width;picture.height=cutout.height;
   picture.getContext('2d').drawImage(cutout,0,0);
  });
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
  const cutout=goldCutout(image,profile.cell);
  if(!cutout)return false;
  ctx.save();
  if(profile.id==='frog'){
   // Contain the COMPLETE original image with unchanged proportions.
   // The card's animal window stays fixed, no part of the snout or toes
   // can be trimmed by cover-style scaling on Android or desktop.
   const fit=Math.min(w/cutout.width,h/cutout.height);
   const dw=cutout.width*fit,dh=cutout.height*fit;
   ctx.drawImage(cutout,x+(w-dw)/2,y+(h-dh)/2,dw,dh);
  }else ctx.drawImage(cutout,x,y,w,h);
  ctx.restore();
  return true;
 }
  window.AnimagiaAnimalAtlas=Object.freeze({
  imageUrl:URL_SHEET,resolve,classify,style,render,drawable,drawCanvas,
  list:data.map(([key,cell])=>({key,cell,name:names[cell]})),dietLabels:DIETS,
  habitatLabels:HABITATS
 });
})();