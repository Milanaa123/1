'use strict';
/* Animagia: curated collection of 100 visitor-supplied illustrations.
 * Artwork transparently extracted from the supplied 10×10 image, no species
 * fabricated. Most figures are REPRESENTATIVE, never verified species art.
 * The 20-image legacy atlas remains available for frogs and older profiles.
 * Name arithmetic, taxonomy records and ecological scoring are NOT modified.
 */
(()=>{
 const legacy=window.AnimagiaAnimalAtlas;
 if(!legacy)throw Error('100-animal atlas loaded before the original atlas');
 const URI='./art/animagia-100-alpha.webp';
 const CORRECTED_URI='./art/animagia-corrected-22.webp';
 const GRASS_SNAKE_URI='./art/animagia-grass-snake-87.svg';
 const SHARP_URI='./art/animagia-100-sharp4x.webp';
 const SHARP_CORRECTED_URI='./art/animagia-corrected-22-sharp4x.webp';
 const SHARP_SCALE=4;
 const INDIVIDUAL_DIR='./art/individual-4x/';
 const VECTOR_DIR='./art/vector-ink/';
 const VECTOR07_FIRST=6,VECTOR07_LAST=25;
 const VECTOR08_FIRST=26,VECTOR08_LAST=45;
 const VECTOR09_FIRST=46,VECTOR09_LAST=65;
 const VECTOR10_FIRST=66,VECTOR10_LAST=85;
 const VECTOR11_FIRST=86,VECTOR11_LAST=100;
 const individualCache=new Map();
 const individualUrl=i=>{
  if(i===86)return GRASS_SNAKE_URI;
  const number=i+1,suffix='animal-'+String(number).padStart(3,'0');
  return ((number>=VECTOR07_FIRST&&number<=VECTOR07_LAST)||(number>=VECTOR08_FIRST&&number<=VECTOR08_LAST)||
   (number>=VECTOR09_FIRST&&number<=VECTOR09_LAST)||
   (number>=VECTOR10_FIRST&&number<=VECTOR10_LAST)||
   (number>=VECTOR11_FIRST&&number<=VECTOR11_LAST))?VECTOR_DIR+suffix+'.svg':INDIVIDUAL_DIR+suffix+'.webp';
 };
 function individualAsset(i){
  if(!Number.isInteger(i)||i<0||i>=100)return Promise.resolve(null);
  if(!individualCache.has(i))individualCache.set(i,new Promise(resolve=>{
   const image=new Image();image.crossOrigin='anonymous';
   image.onload=()=>resolve(image);image.onerror=()=>resolve(null);
   image.src=individualUrl(i);
  }));
  return individualCache.get(i);
 }
 const CORRECTED_SET=new Set([5,6,8,9,13,18,23,28,29,32,34,39,45,46,47,52,53,64,67,77,80,85]);
 const WIDTH=160,HEIGHT=110;
 const entries=[["wolf","Волк"],["fox","Лиса"],["dog","Собака"],["cat","Кошка"],["lion","Лев"],["tiger","Тигр"],["snow-leopard","Снежный барс"],["cheetah","Гепард"],["jaguar","Ягуар"],["puma","Пума"],["bear","Медведь"],["panda","Панда"],["raccoon","Енот"],["otter","Выдра"],["mink","Норка"],["badger","Барсук"],["wolverine","Росомаха"],["ocelot","Оцелот"],["lynx","Рысь"],["caracal","Каракал"],["owl","Сова"],["eagle-owl","Филин"],["raven","Ворон"],["crow","Ворона"],["falcon","Сокол"],["hawk","Ястреб"],["eagle","Орёл"],["vulture","Стервятник"],["gull","Чайка"],["hummingbird","Колибри"],["deer","Олень"],["moose","Лось"],["roe-deer","Косуля"],["reindeer","Северный олень"],["boar","Кабан"],["bison","Бизон"],["european-bison","Зубр"],["sheep","Баран"],["goat","Козёл"],["chamois","Серна"],["horse","Лошадь"],["pegasus","Пегас (фантазийный)"],["donkey","Осёл"],["zebra","Зебра"],["giraffe","Жираф"],["antelope","Антилопа"],["gazelle","Газель"],["camel","Верблюд"],["llama","Лама"],["alpaca","Альпака"],["rabbit","Кролик"],["hare","Заяц"],["squirrel","Белка"],["beaver","Бобр"],["hamster","Хомяк"],["mouse","Мышь"],["rat","Крыса"],["porcupine","Дикобраз"],["ground-squirrel","Суслик"],["marmot","Сурок"],["kangaroo","Кенгуру"],["koala","Коала"],["wombat","Вомбат"],["dingo","Дикая собака динго"],["tasmanian-devil","Тасманийский дьявол"],["emu","Эму"],["ostrich","Страус"],["cassowary","Казуар"],["kiwi","Киви"],["penguin","Пингвин"],["whale","Кит"],["dolphin","Дельфин"],["orca","Косатка"],["shark","Акула"],["ray","Скат"],["seal","Тюлень"],["sea-lion","Морской лев"],["walrus","Морж"],["manatee","Ламантин"],["sea-otter","Выдра морская"],["turtle","Черепаха"],["sea-turtle","Морская черепаха"],["lizard","Ящерица"],["iguana","Игуана"],["chameleon","Хамелеон"],["gecko","Геккон"],["snake","Уж (змея)"],["serpent","Змей (декоративный)"],["cobra","Кобра"],["python","Питон"],["crocodile","Крокодил"],["alligator","Аллигатор"],["spiny-lizard","Шипохвост"],["bat","Летучая мышь"],["octopus","Осьминог"],["squid","Кальмар"],["jellyfish","Медуза"],["seahorse","Морской конёк"],["crab","Краб"],["lobster","Омар"]];
 const names=entries.map(x=>x[1]);
 const namedEntries=new Map([["Canis lupus",0],["Canis rufus",0],["Canis simensis",0],["Vulpes",1],["Urocyon",1],["Lycalopex",1],["Canis familiaris",2],["Canis lupus familiaris",2],["Felis",3],["Panthera leo",4],["Panthera tigris",5],["Panthera uncia",6],["Uncia uncia",6],["Acinonyx",7],["Panthera onca",8],["Puma",9],["Ursus",10],["Helarctos",10],["Melursus",10],["Tremarctos",10],["Ailuropoda",11],["Procyon",12],["Lutra",13],["Lontra",13],["Lutrogale",13],["Neogale",14],["Mustela lutreola",14],["Neovison",14],["Meles",15],["Taxidea",15],["Gulo",16],["Leopardus pardalis",17],["Lynx",18],["Caracal",19],["Strix",20],["Tyto",20],["Asio",20],["Athene",20],["Bubo",21],["Corvus corax",22],["Corvus cornix",23],["Corvus corone",23],["Corvus brachyrhynchos",23],["Falco",24],["Accipiter",25],["Astur",25],["Aquila",26],["Haliaeetus",26],["Gyps",27],["Aegypius",27],["Neophron",27],["Larus",28],["Chroicocephalus",28],["Archilochus",29],["Calypte",29],["Trochilus",29],["Cervus",30],["Dama",30],["Alces",31],["Capreolus",32],["Rangifer",33],["Sus scrofa",34],["Bison",35],["Bos bonasus",36],["Bison bonasus",36],["Ovis",37],["Capra",38],["Rupicapra",39],["Equus caballus",40],["Equus ferus",40],["Equus przewalskii",40],["Equus asinus",42],["Equus africanus",42],["Equus quagga",43],["Equus zebra",43],["Equus grevyi",43],["Giraffa",44],["Tragelaphus",45],["Hippotragus",45],["Gazella",46],["Eudorcas",46],["Nanger",46],["Camelus",47],["Lama glama",48],["Vicugna pacos",49],["Lama pacos",49],["Oryctolagus",50],["Sylvilagus",50],["Lepus",51],["Sciurus",52],["Tamiasciurus",52],["Castor",53],["Cricetus",54],["Mesocricetus",54],["Phodopus",54],["Mus",55],["Apodemus",55],["Rattus",56],["Hystrix",57],["Erethizon",57],["Spermophilus",58],["Urocitellus",58],["Marmota",59],["Macropus",60],["Osphranter",60],["Phascolarctos",61],["Vombatus",62],["Lasiorhinus",62],["Canis lupus dingo",63],["Canis dingo",63],["Sarcophilus",64],["Dromaius",65],["Struthio",66],["Casuarius",67],["Apteryx",68],["Aptenodytes",69],["Spheniscus",69],["Pygoscelis",69],["Eudyptes",69],["Balaenoptera",70],["Megaptera",70],["Balaena",70],["Eubalaena",70],["Delphinus",71],["Tursiops",71],["Lagenorhynchus",71],["Orcinus",72],["Carcharodon",73],["Carcharhinus",73],["Galeocerdo",73],["Manta",74],["Mobula",74],["Dasyatis",74],["Raja",74],["Phoca",75],["Pusa",75],["Halichoerus",75],["Zalophus",76],["Otaria",76],["Eumetopias",76],["Odobenus",77],["Trichechus",78],["Enhydra",79],["Testudo",80],["Emys",80],["Mauremys",80],["Chelonia",81],["Caretta",81],["Eretmochelys",81],["Dermochelys",81],["Lacerta",82],["Podarcis",82],["Zootoca",82],["Iguana",83],["Chamaeleo",84],["Furcifer",84],["Bradypodion",84],["Gekko",85],["Hemidactylus",85],["Phelsuma",85],["Natrix",86],["Vipera",86],["Thamnophis",86],["Naja",88],["Ophiophagus",88],["Python",89],["Malayopython",89],["Morelia",89],["Crocodylus",90],["Gavialis",90],["Alligator",91],["Caiman",91],["Uromastyx",92],["Saara",92],["Myotis",93],["Pipistrellus",93],["Rhinolophus",93],["Pteropus",93],["Octopus",94],["Enteroctopus",94],["Amphioctopus",94],["Loligo",95],["Doryteuthis",95],["Architeuthis",95],["Aurelia",96],["Cyanea",96],["Chrysaora",96],["Hippocampus",97],["Cancer",98],["Carcinus",98],["Callinectes",98],["Homarus",99],["Palinurus",99],["Panulirus",99]]);

 // Reviewed batches: 6–25, 26–45, 46–65, 66–85 and 86–100, from the same user-approved atlas.
 // Retain each original 160x110 transparent cell: do not crop body, tail,
 // antlers, hooves, feathers, wingtips or whiskers.
 const BATCH_02_START=5,BATCH_02_END=25;
 const BATCH_03_START=25,BATCH_03_END=45;
 const BATCH_04_START=45,BATCH_04_END=65;
 const BATCH_05_START=65,BATCH_05_END=85;
 const BATCH_06_START=85,BATCH_06_END=100;
 const reviewedCutouts=new Map();
 function cleanReviewedCell(sheet,index){
  if(!sheet||index<BATCH_02_START||index>=BATCH_06_END)return null;
  if(reviewedCutouts.has(index))return reviewedCutouts.get(index);
  const canvas=document.createElement('canvas');
  canvas.width=WIDTH;canvas.height=HEIGHT;
  const c=canvas.getContext('2d',{willReadFrequently:true});
  if(!c)return null;
  c.drawImage(sheet,(index%10)*WIDTH,Math.floor(index/10)*HEIGHT,
   WIDTH,HEIGHT,0,0,WIDTH,HEIGHT);
  // Work on premade ALPHA artwork only. Never try to cut an opaque
  // background with a hard polygon around the animal.
  let pixels;
  try{pixels=c.getImageData(0,0,WIDTH,HEIGHT);}catch(_){return null;}
  const {data}=pixels,N=WIDTH*HEIGHT;
  const seed=new Uint8Array(N);
  for(let i=0;i<N;i++)if(data[i*4+3]>=44)seed[i]=1;
  // Bridge only near-neighbour gaps before measuring disconnected flecks.
  const bridge=new Uint8Array(N);
  for(let y=0;y<HEIGHT;y++)for(let x=0;x<WIDTH;x++){
   const i=y*WIDTH+x;
   if(!seed[i])continue;
   for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){
    if(dx*dx+dy*dy>5)continue;
    const xx=x+dx,yy=y+dy;
    if(xx>=0&&xx<WIDTH&&yy>=0&&yy<HEIGHT)bridge[yy*WIDTH+xx]=1;
   }
  }
  const labels=new Int16Array(N),components=[];
  let biggest=-1,best=0;
  for(let i=0;i<N;i++){
   if(!bridge[i]||labels[i])continue;
   const label=components.length+1,queue=[i];
   labels[i]=label;
   const component={size:0,pixels:0,minX:WIDTH,minY:HEIGHT,maxX:0,maxY:0};
   for(let head=0;head<queue.length;head++){
    const at=queue[head],x=at%WIDTH,y=(at/WIDTH)|0;
    component.size++;
    if(seed[at])component.pixels++;
    component.minX=Math.min(component.minX,x);
    component.maxX=Math.max(component.maxX,x);
    component.minY=Math.min(component.minY,y);
    component.maxY=Math.max(component.maxY,y);
    for(const near of [at-1,at+1,at-WIDTH,at+WIDTH]){
     if(near<0||near>=N||labels[near]||!bridge[near])continue;
     // Prevent false wraps between the end and start of adjacent rows.
     if(Math.abs((near%WIDTH)-x)>1)continue;
     labels[near]=label;queue.push(near);
    }
   }
   components.push(component);
   if(component.pixels>best){best=component.pixels;biggest=label;}
  }
  if(biggest<0||best<150){
   // Fail open when the photograph is unexpected; never delete the animal.
   reviewedCutouts.set(index,canvas);return canvas;
  }
  const keep=new Uint8Array(components.length+1);keep[biggest]=1;
  // Distance to the ACTUAL body, rather than to a huge bounding rectangle.
  // Floating stars often sit inside the body's bounding rectangle but are
  // still separated from every real gold stroke by 15–30 pixels.
  const distance=new Uint8Array(N);distance.fill(255);
  const queue=new Int32Array(N);let qHead=0,qTail=0;
  for(let i=0;i<N;i++)if(labels[i]===biggest){
   distance[i]=0;queue[qTail++]=i;
  }
  while(qHead<qTail){
   const i=queue[qHead++],x=i%WIDTH,step=distance[i]+1;
   if(step>10)continue;
   const near=[x?i-1:-1,x<WIDTH-1?i+1:-1,
     i>=WIDTH?i-WIDTH:-1,i<N-WIDTH?i+WIDTH:-1];
   for(const next of near)if(next>=0&&distance[next]>step){
    distance[next]=step;queue[qTail++]=next;
   }
  }
  // Never erase a substantial paw, wingtip or whisker bundle; keep smaller
  // features that are connected by ≤8px to the body. Distant single stars
  // and ornamental particles are the only eligible deletions.
  for(let id=1;id<=components.length;id++){
   if(id===biggest)continue;
   const component=components[id-1];
   if(component.pixels>=65){keep[id]=1;continue;}
   let closest=255;
   for(let i=0;i<N;i++)if(labels[i]===id&&distance[i]<closest){
    closest=distance[i];if(closest<=8)break;
   }
   if(closest<=8)keep[id]=1;
  }
  let cleared=0;
  for(let i=0;i<N;i++){
   if(!data[i*4+3])continue;
   // Allow antialiased gold fringes 2px around every kept structural stroke.
   let approved=Boolean(keep[labels[i]]);
   if(!approved){
    const x=i%WIDTH,y=(i/WIDTH)|0;
    outer:for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){
     const xx=x+dx,yy=y+dy;
     if(xx<0||yy<0||xx>=WIDTH||yy>=HEIGHT)continue;
     if(keep[labels[yy*WIDTH+xx]]){approved=true;break outer;}
    }
   }
   if(!approved){data[i*4+3]=0;cleared++;}
  }
  if(cleared>0)c.putImageData(pixels,0,0);
  reviewedCutouts.set(index,canvas);
  return canvas;
 }
 const fallbackOrder={"Carnivora":1,"Rodentia":55,"Lagomorpha":50,"Chiroptera":93,"Cetacea":70,"Cetartiodactyla":30,"Artiodactyla":30,"Perissodactyla":40,"Sirenia":78,"Diprotodontia":60,"Dasyuromorphia":64,"Strigiformes":20,"Accipitriformes":26,"Falconiformes":24,"Passeriformes":22,"Sphenisciformes":69,"Struthioniformes":66,"Casuariiformes":65,"Apterygiformes":68,"Charadriiformes":28,"Apodiformes":29,"Testudines":80,"Squamata":82,"Crocodylia":90,"Crocodilia":90,"Octopoda":94,"Teuthida":95,"Myliobatiformes":74,"Rajiformes":74,"Decapoda":98};
 const fallbackClass={"Mammalia":1,"Aves":22,"Reptilia":82,"Chondrichthyes":73,"Elasmobranchii":73,"Cephalopoda":94,"Scyphozoa":96,"Cubozoa":96,"Malacostraca":98};
 const scientific=(row)=>String(row?.[1]||'').trim().replace(/\s+/g,' ');
 const labelFor=idx=>names[idx];
 let loading=null,correctedLoading=null,snake87Loading=null,sharpLoading=null,sharpCorrectionLoading=null;
 function sharpAsset(){
  if(!sharpLoading)sharpLoading=new Promise(resolve=>{
   const img=new Image();img.crossOrigin='anonymous';
   img.onload=()=>resolve(img);img.onerror=()=>resolve(null);img.src=SHARP_URI;
  });
  return sharpLoading;
 }
 function sharpCorrectionAsset(){
  if(!sharpCorrectionLoading)sharpCorrectionLoading=new Promise(resolve=>{
   const img=new Image();img.crossOrigin='anonymous';
   img.onload=()=>resolve(img);img.onerror=()=>resolve(null);img.src=SHARP_CORRECTED_URI;
  });
  return sharpCorrectionLoading;
 }
 function snake87Asset(){
  if(!snake87Loading)snake87Loading=new Promise(resolve=>{
   const img=new Image();img.crossOrigin='anonymous';img.onload=()=>resolve(img);
   img.onerror=()=>resolve(null);img.src=GRASS_SNAKE_URI;
  });
  return snake87Loading;
 }
 function correctedAsset(){
  if(!correctedLoading)correctedLoading=new Promise(resolve=>{
   const img=new Image();img.crossOrigin='anonymous';
   img.onload=()=>resolve(img);img.onerror=()=>resolve(null);
   img.src=CORRECTED_URI;
  });
  return correctedLoading;
 }
 function asset(){
  if(!loading)loading=new Promise(resolve=>{
   const img=new Image();img.crossOrigin='anonymous';
   img.onload=()=>resolve(img);img.onerror=()=>resolve(null);
   img.src=URI;
  });
  return loading;
 }
 function choose(row){
  if(!Array.isArray(row))return null;
  const full=scientific(row);
  const words=full.split(/\s+/g),genus=words[0];
  // First match full scientific taxa, then a non-ambiguous genus entry.
  if(namedEntries.has(full))return {idx:namedEntries.get(full),rank:'species'};
  if(namedEntries.has(genus))return {idx:namedEntries.get(genus),rank:'genus'};
  // Literal genus aliases for familiar disambiguated cases.
  if(genus==='Panthera')return {idx:4,rank:'order'}; // a big cat, NOT the exact species.
  if(genus==='Equus')return {idx:40,rank:'order'};
  if(genus==='Corvus')return {idx:22,rank:'order'};
  if(genus==='Canis')return {idx:0,rank:'order'};
  const order=String(row[4]||'').trim(),cls=String(row[3]||'').trim();
  if(order==='Anura')return null; // Use the existing dedicated frog artwork.
  if(Object.prototype.hasOwnProperty.call(fallbackOrder,order))
    return {idx:fallbackOrder[order],rank:'order'};
  if(Object.prototype.hasOwnProperty.call(fallbackClass,cls))
    return {idx:fallbackClass[cls],rank:'class'};
  return null; // No truthful representative (e.g. spiders and insects).
 }
 function resolve(row){
  // Keep specialised legacy frog; the 100-sheet does not contain an amphibian.
  if(row?.[4]==='Anura')return legacy.resolve(row);
  // The visitor's first five have been individually cleaned and verified:
  // prefer that exact original drawing to the older 100-up montage cell.
  const reviewed=legacy.resolve(row);
  if(Number.isInteger(reviewed?.approvedIndex))return reviewed;
  const chosen=choose(row);
  if(!chosen)return legacy.resolve(row);
  const old=legacy.classify(row);
  const rank=chosen.rank;
  const name=labelFor(chosen.idx);
  return {id:entries[chosen.idx][0],cell:chosen.idx,
   artSet:'atlas100',label:name,scientific:scientific(row),
   exact:false, // the visitor-approved drawing is an artistic archetype
   reviewedBatch:chosen.idx>=BATCH_02_START&&chosen.idx<BATCH_02_END?2:
    chosen.idx>=BATCH_03_START&&chosen.idx<BATCH_03_END?3:
    chosen.idx>=BATCH_04_START&&chosen.idx<BATCH_04_END?4:
    chosen.idx>=BATCH_05_START&&chosen.idx<BATCH_05_END?5:
    chosen.idx>=BATCH_06_START&&chosen.idx<BATCH_06_END?6:null,
   diet:old?.diet||null,habitat:old?.habitat||null,
   secondary:old?.secondary||[],
   note:rank==='species'?('Художественный рисунок «'+name+'» · не фотография вида'):
    ('Обобщённый рисунок '+(rank==='genus'?'рода':rank==='order'?'отряда':'класса')+
      ' · '+name+' · не изображение указанного вида')};
 }
 function drawCanvas(ctx,loaded,profile,x,y,w,h){
  if(profile?.artSet!=='atlas100'){
   const legacyImage=loaded?.legacy||loaded;
   return legacy.drawCanvas(ctx,legacyImage,profile,x,y,w,h);
  }
  // On-demand portrait: draw one native 4x cell directly, never stretch a
  // 160x110 preview or download the full 10MB source atlas for one animal.
  if(Number.isInteger(profile.cell)&&loaded?.singleArt&&loaded.singleCell===profile.cell){
   const art=loaded.singleArt;
   if(art.naturalWidth>0&&art.naturalHeight>0){
    const factor=Math.min(w*.90/art.naturalWidth,h*.90/art.naturalHeight);
    const dw=art.naturalWidth*factor,dh=art.naturalHeight*factor;
    ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
    ctx.drawImage(art,x+(w-dw)/2,y+(h-dh)/2,dw,dh);ctx.restore();
    return true;
   }
  }
  const im=loaded?.sharpSheet?.naturalWidth===6400&&loaded?.sharpSheet?.naturalHeight===4400?
   loaded.sharpSheet:loaded?.newSheet||loaded;
  if(!im||im.naturalWidth<1600||im.naturalHeight<1100)return false;
  const sourceScale=im.naturalWidth===6400&&im.naturalHeight===4400?SHARP_SCALE:1;
  const i=profile.cell;
  if(!Number.isInteger(i)||i<0||i>=100)return false;
  // Preserve 160×110 proportions and leave a generous 7% safe inset.
  const factor=Math.min(w*.90/WIDTH,h*.90/HEIGHT);
  const dw=WIDTH*factor,dh=HEIGHT*factor;
  const dx=x+(w-dw)/2,dy=y+(h-dh)/2;
  const replacement=loaded?.sharpCorrected?.naturalWidth===6400&&loaded?.sharpCorrected?.naturalHeight===4400?
   loaded.sharpCorrected:loaded?.corrected;
  const correctionScale=replacement?.naturalWidth===6400&&replacement?.naturalHeight===4400?SHARP_SCALE:1;
  const useCorrection=CORRECTED_SET.has(i);
  const specificSnake=i===86?loaded?.grassSnake87:null;
  if(useCorrection&&(!replacement||replacement.naturalWidth!==1600*correctionScale||replacement.naturalHeight!==1100*correctionScale))return false;
  const refined=!useCorrection&&sourceScale===1&&(profile.reviewedBatch>=2&&profile.reviewedBatch<=6)?cleanReviewedCell(im,i):null;
  ctx.save();
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  if(specificSnake?.naturalWidth>0)ctx.drawImage(specificSnake,dx,dy,dw,dh);
  else if(useCorrection)ctx.drawImage(replacement,(i%10)*WIDTH*correctionScale,Math.floor(i/10)*HEIGHT*correctionScale,WIDTH*correctionScale,HEIGHT*correctionScale,dx,dy,dw,dh);
  else if(refined)ctx.drawImage(refined,dx,dy,dw,dh);
  else ctx.drawImage(im,(i%10)*WIDTH*sourceScale,Math.floor(i/10)*HEIGHT*sourceScale,
    WIDTH*sourceScale,HEIGHT*sourceScale,dx,dy,dw,dh);
  ctx.restore();
  return true;
 }
 async function drawable(profile){
  if(profile){
   if(profile.artSet!=='atlas100'){
    const image=await legacy.drawable(profile);
    return image?{legacy:image}:null;
   }
   const singleArt=await individualAsset(profile.cell);
   if(singleArt)return {singleArt,singleCell:profile.cell};
   const [newSheet,corrected,grassSnake87]=await Promise.all([asset(),correctedAsset(),snake87Asset()]);
   return newSheet?{newSheet,corrected,grassSnake87}:null;
  }
  // Backward-compatible full-sheet mode for QA and atlas-wide reporting.
  const [newSheet,oldSheet,corrected,grassSnake87,sharpSheet,sharpCorrected]=await Promise.all([
   asset(),legacy.drawable(),correctedAsset(),snake87Asset(),sharpAsset(),sharpCorrectionAsset()
  ]);
  return newSheet||oldSheet?{newSheet,legacy:oldSheet,corrected,grassSnake87,sharpSheet,sharpCorrected}:null;
 }
 function render(container,profile){
  if(!container)return;
  if(profile?.artSet!=='atlas100')return legacy.render(container,profile);
  container.replaceChildren();
  const canvas=document.createElement('canvas');
  canvas.className='atlas-art-sprite';
  // Retina backing is 4× larger than source artwork CSS dimensions.
  canvas.width=WIDTH*SHARP_SCALE;canvas.height=HEIGHT*SHARP_SCALE;
  canvas.setAttribute('role','img');
  canvas.setAttribute('aria-label',profile.note+' · '+profile.scientific);
  container.append(canvas);
  // Load just this species. Export and preview use the very same file.
  void drawable(profile).then(art=>{
   if(!art||!container.contains(canvas))return;
   const ctx=canvas.getContext('2d');
   ctx.clearRect(0,0,canvas.width,canvas.height);
   drawCanvas(ctx,art,profile,0,0,canvas.width,canvas.height);
  });
 }
 window.AnimagiaAnimalAtlas=Object.freeze({
  ...legacy,imageUrl:URI,legacyImageUrl:legacy.imageUrl,
  grassSnake87ImageUrl:GRASS_SNAKE_URI,
  sharpImageUrl:SHARP_URI,sharpCorrectedImageUrl:SHARP_CORRECTED_URI,sharpArtworkScale:SHARP_SCALE,
  individualDir:INDIVIDUAL_DIR,individualImageUrl:individualUrl,
  vectorDir:VECTOR_DIR,vectorBatch07:Object.freeze({first:6,last:25,count:20,source:'faithful alpha contour trace',manualAnatomyReviewed:false}),
  vectorBatch08:Object.freeze({first:26,last:45,count:20,source:'faithful alpha contour trace',manualAnatomyReviewed:false}),
  vectorBatch09:Object.freeze({first:46,last:65,count:20,source:'faithful alpha contour trace',manualAnatomyReviewed:false}),
  vectorBatch10:Object.freeze({first:66,last:85,count:20,source:'faithful alpha contour trace',manualAnatomyReviewed:false}),
  vectorBatch11:Object.freeze({first:86,last:100,count:14,excluded:[87],source:'faithful alpha contour trace; retain hand-drawn snake 87',manualAnatomyReviewed:false}),
  correctedImageUrl:CORRECTED_URI,correctedIndices:Object.freeze([6,7,9,10,14,19,24,29,30,33,35,40,46,47,48,53,54,65,68,78,81,86]),
  resolve,classify:legacy.classify,style:legacy.style,
  render,drawCanvas,drawable,
  list:entries.map(([key],cell)=>({key,cell,name:names[cell]})),
  evidence:{count:100,source:'user-supplied',artistic:true,
    batch02:{first:6,last:25,count:20,source:'same approved atlas',preserveSourceBounds:true},
    batch03:{first:26,last:45,count:20,source:'same approved atlas',preserveSourceBounds:true},
    batch04:{first:46,last:65,count:20,source:'same approved atlas',preserveSourceBounds:true},
    batch05:{first:66,last:85,count:20,source:'same approved atlas',preserveSourceBounds:true,correctedSpeciesReused:[68,78,81]},
    batch06:{first:86,last:100,count:15,source:'same approved atlas',preserveSourceBounds:true,correctedSpeciesReused:[86],fantasyOnly:[88]},
    speciesSpecificSvg:{number:87,scientific:'Natrix natrix',source:'original golden vector illustration',transparent:true,originalRetained:true,features:['slender body','round pupil','pale collar']},
    visualCorrections:{count:22,indices:[6,7,9,10,14,19,24,29,30,33,35,40,46,47,48,53,54,65,68,78,81,86],source:'individually corrected anatomy; gold transparent art',photographic:false},
    unsupported:'Animals without an applicable biological drawing remain without art.'}
 });
})();