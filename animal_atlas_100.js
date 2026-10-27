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
 const WIDTH=160,HEIGHT=110;
 const entries=[["wolf","Волк"],["fox","Лиса"],["dog","Собака"],["cat","Кошка"],["lion","Лев"],["tiger","Тигр"],["snow-leopard","Снежный барс"],["cheetah","Гепард"],["jaguar","Ягуар"],["puma","Пума"],["bear","Медведь"],["panda","Панда"],["raccoon","Енот"],["otter","Выдра"],["mink","Норка"],["badger","Барсук"],["wolverine","Росомаха"],["ocelot","Оцелот"],["lynx","Рысь"],["caracal","Каракал"],["owl","Сова"],["eagle-owl","Филин"],["raven","Ворон"],["crow","Ворона"],["falcon","Сокол"],["hawk","Ястреб"],["eagle","Орёл"],["vulture","Стервятник"],["gull","Чайка"],["hummingbird","Колибри"],["deer","Олень"],["moose","Лось"],["roe-deer","Косуля"],["reindeer","Северный олень"],["boar","Кабан"],["bison","Бизон"],["aurochs","Зубр"],["sheep","Баран"],["goat","Козёл"],["chamois","Серна"],["horse","Лошадь"],["pegasus","Пегас (фантазийный)"],["donkey","Осёл"],["zebra","Зебра"],["giraffe","Жираф"],["antelope","Антилопа"],["gazelle","Газель"],["camel","Верблюд"],["llama","Лама"],["alpaca","Альпака"],["rabbit","Кролик"],["hare","Заяц"],["squirrel","Белка"],["beaver","Бобр"],["hamster","Хомяк"],["mouse","Мышь"],["rat","Крыса"],["porcupine","Дикобраз"],["ground-squirrel","Суслик"],["marmot","Сурок"],["kangaroo","Кенгуру"],["koala","Коала"],["wombat","Вомбат"],["dingo","Дикая собака динго"],["tasmanian-devil","Тасманийский дьявол"],["emu","Эму"],["ostrich","Страус"],["cassowary","Казуар"],["kiwi","Киви"],["penguin","Пингвин"],["whale","Кит"],["dolphin","Дельфин"],["orca","Косатка"],["shark","Акула"],["ray","Скат"],["seal","Тюлень"],["sea-lion","Морской лев"],["walrus","Морж"],["manatee","Ламантин"],["sea-otter","Выдра морская"],["turtle","Черепаха"],["sea-turtle","Морская черепаха"],["lizard","Ящерица"],["iguana","Игуана"],["chameleon","Хамелеон"],["gecko","Геккон"],["snake","Змея"],["serpent","Змей (декоративный)"],["cobra","Кобра"],["python","Питон"],["crocodile","Крокодил"],["alligator","Аллигатор"],["spiny-lizard","Черепаховая ящерица"],["bat","Летучая мышь"],["octopus","Осьминог"],["squid","Кальмар"],["jellyfish","Медуза"],["seahorse","Морской конёк"],["crab","Краб"],["lobster","Омар"]];
 const names=entries.map(x=>x[1]);
 const namedEntries=new Map([["Canis lupus",0],["Canis rufus",0],["Canis simensis",0],["Vulpes",1],["Urocyon",1],["Lycalopex",1],["Canis familiaris",2],["Canis lupus familiaris",2],["Felis",3],["Panthera leo",4],["Panthera tigris",5],["Panthera uncia",6],["Uncia uncia",6],["Acinonyx",7],["Panthera onca",8],["Puma",9],["Ursus",10],["Helarctos",10],["Melursus",10],["Tremarctos",10],["Ailuropoda",11],["Procyon",12],["Lutra",13],["Lontra",13],["Lutrogale",13],["Neogale",14],["Mustela lutreola",14],["Neovison",14],["Meles",15],["Taxidea",15],["Gulo",16],["Leopardus pardalis",17],["Lynx",18],["Caracal",19],["Strix",20],["Tyto",20],["Asio",20],["Athene",20],["Bubo",21],["Corvus corax",22],["Corvus cornix",23],["Corvus corone",23],["Corvus brachyrhynchos",23],["Falco",24],["Accipiter",25],["Astur",25],["Aquila",26],["Haliaeetus",26],["Gyps",27],["Aegypius",27],["Neophron",27],["Larus",28],["Chroicocephalus",28],["Archilochus",29],["Calypte",29],["Trochilus",29],["Cervus",30],["Dama",30],["Alces",31],["Capreolus",32],["Rangifer",33],["Sus scrofa",34],["Bison",35],["Bos bonasus",36],["Bison bonasus",36],["Ovis",37],["Capra",38],["Rupicapra",39],["Equus caballus",40],["Equus ferus",40],["Equus przewalskii",40],["Equus asinus",42],["Equus africanus",42],["Equus quagga",43],["Equus zebra",43],["Equus grevyi",43],["Giraffa",44],["Tragelaphus",45],["Hippotragus",45],["Gazella",46],["Eudorcas",46],["Nanger",46],["Camelus",47],["Lama glama",48],["Vicugna pacos",49],["Lama pacos",49],["Oryctolagus",50],["Sylvilagus",50],["Lepus",51],["Sciurus",52],["Tamiasciurus",52],["Castor",53],["Cricetus",54],["Mesocricetus",54],["Phodopus",54],["Mus",55],["Apodemus",55],["Rattus",56],["Hystrix",57],["Erethizon",57],["Spermophilus",58],["Urocitellus",58],["Marmota",59],["Macropus",60],["Osphranter",60],["Phascolarctos",61],["Vombatus",62],["Lasiorhinus",62],["Canis lupus dingo",63],["Canis dingo",63],["Sarcophilus",64],["Dromaius",65],["Struthio",66],["Casuarius",67],["Apteryx",68],["Aptenodytes",69],["Spheniscus",69],["Pygoscelis",69],["Eudyptes",69],["Balaenoptera",70],["Megaptera",70],["Balaena",70],["Eubalaena",70],["Delphinus",71],["Tursiops",71],["Lagenorhynchus",71],["Orcinus",72],["Carcharodon",73],["Carcharhinus",73],["Galeocerdo",73],["Manta",74],["Mobula",74],["Dasyatis",74],["Raja",74],["Phoca",75],["Pusa",75],["Halichoerus",75],["Zalophus",76],["Otaria",76],["Eumetopias",76],["Odobenus",77],["Trichechus",78],["Enhydra",79],["Testudo",80],["Emys",80],["Mauremys",80],["Chelonia",81],["Caretta",81],["Eretmochelys",81],["Dermochelys",81],["Lacerta",82],["Podarcis",82],["Zootoca",82],["Iguana",83],["Chamaeleo",84],["Furcifer",84],["Bradypodion",84],["Gekko",85],["Hemidactylus",85],["Phelsuma",85],["Natrix",86],["Vipera",86],["Thamnophis",86],["Naja",88],["Ophiophagus",88],["Python",89],["Malayopython",89],["Morelia",89],["Crocodylus",90],["Gavialis",90],["Alligator",91],["Caiman",91],["Uromastyx",92],["Saara",92],["Myotis",93],["Pipistrellus",93],["Rhinolophus",93],["Pteropus",93],["Octopus",94],["Enteroctopus",94],["Amphioctopus",94],["Loligo",95],["Doryteuthis",95],["Architeuthis",95],["Aurelia",96],["Cyanea",96],["Chrysaora",96],["Hippocampus",97],["Cancer",98],["Carcinus",98],["Callinectes",98],["Homarus",99],["Palinurus",99],["Panulirus",99]]);
 const fallbackOrder={"Carnivora":1,"Rodentia":55,"Lagomorpha":50,"Chiroptera":93,"Cetacea":70,"Cetartiodactyla":30,"Artiodactyla":30,"Perissodactyla":40,"Sirenia":78,"Diprotodontia":60,"Dasyuromorphia":64,"Strigiformes":20,"Accipitriformes":26,"Falconiformes":24,"Passeriformes":22,"Sphenisciformes":69,"Struthioniformes":66,"Casuariiformes":65,"Apterygiformes":68,"Charadriiformes":28,"Apodiformes":29,"Testudines":80,"Squamata":82,"Crocodylia":90,"Crocodilia":90,"Octopoda":94,"Teuthida":95,"Myliobatiformes":74,"Rajiformes":74,"Decapoda":98};
 const fallbackClass={"Mammalia":1,"Aves":22,"Reptilia":82,"Chondrichthyes":73,"Elasmobranchii":73,"Cephalopoda":94,"Scyphozoa":96,"Cubozoa":96,"Malacostraca":98};
 const scientific=(row)=>String(row?.[1]||'').trim().replace(/\s+/g,' ');
 const labelFor=idx=>names[idx];
 let loading=null;
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
  const chosen=choose(row);
  if(!chosen)return legacy.resolve(row);
  const old=legacy.classify(row);
  const rank=chosen.rank;
  const name=labelFor(chosen.idx);
  return {id:entries[chosen.idx][0],cell:chosen.idx,
   artSet:'atlas100',label:name,scientific:scientific(row),
   exact:false, // the visitor-approved drawing is an artistic archetype
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
  const im=loaded?.newSheet||loaded;
  if(!im||im.naturalWidth<1600||im.naturalHeight<1100)return false;
  const i=profile.cell;
  if(!Number.isInteger(i)||i<0||i>=100)return false;
  // Preserve 160×110 proportions and leave a generous 7% safe inset.
  const factor=Math.min(w*.90/WIDTH,h*.90/HEIGHT);
  const dw=WIDTH*factor,dh=HEIGHT*factor;
  const dx=x+(w-dw)/2,dy=y+(h-dh)/2;
  ctx.save();ctx.drawImage(im,(i%10)*WIDTH,Math.floor(i/10)*HEIGHT,
    WIDTH,HEIGHT,dx,dy,dw,dh);ctx.restore();
  return true;
 }
 async function drawable(){
  const [newSheet,oldSheet]=await Promise.all([asset(),legacy.drawable()]);
  return newSheet||oldSheet?{newSheet,legacy:oldSheet}:null;
 }
 function render(container,profile){
  if(!container)return;
  if(profile?.artSet!=='atlas100')return legacy.render(container,profile);
  container.replaceChildren();
  const canvas=document.createElement('canvas');
  canvas.className='atlas-art-sprite';
  canvas.width=WIDTH;canvas.height=HEIGHT;
  canvas.setAttribute('role','img');
  canvas.setAttribute('aria-label',profile.note+' · '+profile.scientific);
  container.append(canvas);
  void asset().then(im=>{
   if(!im||!container.contains(canvas))return;
   drawCanvas(canvas.getContext('2d'),im,profile,0,0,WIDTH,HEIGHT);
  });
 }
 window.AnimagiaAnimalAtlas=Object.freeze({
  ...legacy,imageUrl:URI,legacyImageUrl:legacy.imageUrl,
  resolve,classify:legacy.classify,style:legacy.style,
  render,drawCanvas,drawable,
  list:entries.map(([key],cell)=>({key,cell,name:names[cell]})),
  evidence:{count:100,source:'user-supplied',artistic:true,
    unsupported:'Animals without an applicable biological drawing remain without art.'}
 });
})();