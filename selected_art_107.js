'use strict';
/* Animagia: individually approved original PNG artwork.
 * Apply a drawing to an actual calculated taxon only for an explicitly
 * identified matching species. No old atlas image may be used as fallback.
 * Both on-screen preview and PNG export draw the same unmodified source.
 */
(()=>{
 const previous=window.AnimagiaAnimalAtlas;
 if(!previous)return;
 const scientificToArtwork=new Map([
  ['Panthera leo',[1,'Лев']],['Panthera tigris',[2,'Тигр']],
  ['Panthera pardus',[3,'Леопард']],['Panthera onca',[4,'Ягуар']],
  ['Puma concolor',[5,'Пума']],['Lynx lynx',[6,'Рысь']],
  ['Vulpes vulpes',[7,'Лисица']],['Ursus arctos',[11,'Бурый медведь']],
  ['Ailuropoda melanoleuca',[13,'Панда большая']],
  ['Procyon lotor',[14,'Енот']],['Meles meles',[15,'Барсук']],
  ['Lutra lutra',[16,'Выдра']],['Mustela putorius',[17,'Хорёк']],
  ['Castor fiber',[18,'Бобр']],['Sciurus vulgaris',[19,'Белка']],
  ['Pteromys volans',[20,'Летяга']],['Lepus timidus',[21,'Заяц-беляк']],
  ['Oryctolagus cuniculus',[22,'Кролик']],
  ['Erinaceus europaeus',[23,'Ёж европейский']],
  ['Alces alces',[24,'Лось']],['Cervus elaphus',[25,'Олень благородный']],
  ['Sus scrofa',[28,'Кабан']],['Bison bison',[29,'Бизон']],
  ['Giraffa camelopardalis',[31,'Жираф']],
  ['Loxodonta africana',[32,'Слон африканский']],
  ['Hippopotamus amphibius',[34,'Бегемот']],
  ['Camelus bactrianus',[35,'Верблюд двугорбый']],
  ['Pan troglodytes',[38,'Шимпанзе']],
  ['Phascolarctos cinereus',[42,'Коала']],
  ['Osphranter rufus',[43,'Кенгуру рыжий']],
  ['Tursiops truncatus',[46,'Дельфин-афалина']],
  ['Orcinus orca',[47,'Касатка']],
  ['Balaenoptera musculus',[48,'Синий кит']],
  ['Phoca vitulina',[49,'Тюлень обыкновенный']],
  ['Aquila chrysaetos',[50,'Орёл беркут']],
  ['Haliaeetus leucocephalus',[51,'Белоголовый орлан']],
  ['Falco peregrinus',[52,'Сапсан']],
  ['Bubo scandiacus',[53,'Полярная сова']],
  ['Asio otus',[54,'Сова ушастая']],
  ['Corvus corax',[55,'Ворон']],
  ['Corvus cornix',[56,'Ворона серая']],
  ['Pica pica',[58,'Сорока']],
  ['Cygnus olor',[59,'Лебедь-шипун']],
  ['Phoenicopterus roseus',[60,'Фламинго розовый']],
  ['Ciconia ciconia',[62,'Аист белый']],
  ['Grus grus',[63,'Журавль серый']],
  ['Pavo cristatus',[64,'Павлин']],
  ['Meleagris gallopavo',[65,'Индюк']],
  ['Tetrao urogallus',[67,'Глухарь']],
  ['Aptenodytes forsteri',[69,'Пингвин императорский']],
  ['Pygoscelis adeliae',[70,'Пингвин Адели']],
  ['Hirundo rustica',[77,'Ласточка деревенская']],
  ['Parus major',[78,'Синица большая']],
  ['Erithacus rubecula',[79,'Малиновка']],
  ['Passer domesticus',[80,'Домовый воробей']],
  ['Columba livia',[81,'Голубь сизый']],
  ['Larus argentatus',[82,'Чайка серебристая']],
  ['Anas platyrhynchos',[83,'Утка кряква']],
  ['Alligator mississippiensis',[85,'Аллигатор миссисипский']],
  ['Gavialis gangeticus',[86,'Гавиал']],
  ['Chamaeleo calyptratus',[89,'Хамелеон йеменский']],
  ['Chelonia mydas',[92,'Черепаха зелёная морская']],
  ['Testudo horsfieldii',[93,'Черепаха сухопутная среднеазиатская']],
  ['Naja naja',[94,'Кобра индийская']],
  ['Ophiophagus hannah',[95,'Королевская кобра']],
  ['Boa constrictor',[98,'Удав обыкновенный']],
  ['Eunectes murinus',[99,'Анаконда зелёная']],
  ['Vipera berus',[101,'Гадюка обыкновенная']],
  ['Natrix natrix',[102,'Уж обыкновенный']],
  ['Triturus cristatus',[112,'Тритон гребенчатый']],
  ['Carcharodon carcharias',[114,'Акула белая']],
  ['Rhincodon typus',[116,'Китовая акула']],
  ['Mobula birostris',[117,'Скат манта']],
  ['Manta birostris',[117,'Скат манта']],
  ['Paracanthurus hepatus',[119,'Голубой хирург']],
  ['Mola mola',[122,'Рыба-луна']],
  ['Anguilla anguilla',[123,'Угорь европейский']],
  ['Esox lucius',[124,'Щука']],
  ['Perca fluviatilis',[125,'Окунь речной']],
  ['Silurus glanis',[127,'Сом европейский']],
  ['Salmo salar',[128,'Лосось атлантический']],
  ['Oncorhynchus mykiss',[129,'Форель радужная']],
  ['Pygocentrus nattereri',[133,'Пиранья краснобрюхая']],
  ['Octopus vulgaris',[161,'Осьминог обыкновенный']],
  ['Vampyroteuthis infernalis',[165,'Кальмар-вампир']],
  // Previously missing 20 approved images. Generic names are intentionally
  // tied only to a representative accepted species or a zoological genus,
  // not automatically to an unrelated species.
  ['Canis aureus',[9,'Шакал']],
  ['Lupulella mesomelas',[9,'Шакал']],
  ['Crocuta crocuta',[10,'Гиена']],
  ['Hyaena hyaena',[10,'Гиена']],
  ['Gorilla gorilla',[37,'Горилла']],
  ['Gorilla beringei',[37,'Горилла']],
  ['Pongo pygmaeus',[39,'Орангутан']],
  ['Pongo abelii',[39,'Орангутан']],
  ['Cebus capucinus',[40,'Капуцин']],
  ['Cebus imitator',[40,'Капуцин']],
  ['Sapajus apella',[40,'Капуцин']],
  ['Bradypus variegatus',[41,'Ленивец']],
  ['Choloepus didactylus',[41,'Ленивец']],
  ['Vombatus ursinus',[44,'Вомбат']],
  ['Pelecanus onocrotalus',[61,'Пеликан']],
  ['Phasianus colchicus',[66,'Фазан']],
  ['Archilochus colubris',[74,'Колибри']],
  ['Crotalus atrox',[100,'Гремучая змея']],
  ['Crotalus horridus',[100,'Гремучая змея']],
  ['Siphonops annulatus',[113,'Червяга']],
  ['Ichthyophis glutinosus',[113,'Червяга']],
  ['Sphyrna mokarran',[115,'Акула-молот']],
  ['Amphiprion ocellaris',[118,'Рыба-клоун']],
  ['Hippocampus hippocampus',[120,'Морской конёк']],
  ['Muraena helena',[132,'Мурена']],
  ['Nautilus pompilius',[164,'Наутилус']],
  ['Asterias rubens',[166,'Морская звезда']],
  ['Echinus esculentus',[167,'Морской ёж']],
  ['Holothuria tubulosa',[168,'Морской огурец']],
  ['Bubo bubo',[null,'Филин']],
  ['Felis catus',[null,'Кошка']],
  ['Canis lupus',[null,'Волк']]
 ]);
 // For genus-level art (e.g. "морской конёк"), use it only within
 // the same scientific genus. It is an illustrative genus image, not a
 // claim of anatomical identity with every species in that genus.
 const genusArtwork=new Map([
  ['Gorilla',[37,'Горилла']],['Pongo',[39,'Орангутан']],
  ['Cebus',[40,'Капуцин']],['Sapajus',[40,'Капуцин']],
  ['Bradypus',[41,'Ленивец']],['Choloepus',[41,'Ленивец']],
  ['Vombatus',[44,'Вомбат']],['Lasiorhinus',[44,'Вомбат']],
  ['Pelecanus',[61,'Пеликан']],['Phasianus',[66,'Фазан']],
  ['Crotalus',[100,'Гремучая змея']],['Sistrurus',[100,'Гремучая змея']],
  ['Siphonops',[113,'Червяга']],['Ichthyophis',[113,'Червяга']],
  ['Sphyrna',[115,'Акула-молот']],['Amphiprion',[118,'Рыба-клоун']],
  ['Hippocampus',[120,'Морской конёк']],['Muraena',[132,'Мурена']],
  ['Nautilus',[164,'Наутилус']],['Asterias',[166,'Морская звезда']],
  ['Echinus',[167,'Морской ёж']],['Holothuria',[168,'Морской огурец']]
 ]);
 const genericArtworkNumbers=new Set([9,10,37,39,40,41,44,61,66,74,100,113,115,118,120,132,164,166,167,168]);
 const representativeScientific=new Map([
  [9,'Canis aureus'],[10,'Crocuta crocuta'],
  [37,'Gorilla gorilla'],[39,'Pongo pygmaeus'],
  [40,'Cebus capucinus'],[41,'Bradypus variegatus'],
  [44,'Vombatus ursinus'],[61,'Pelecanus onocrotalus'],
  [66,'Phasianus colchicus'],[74,'Archilochus colubris'],
  [100,'Crotalus atrox'],[113,'Siphonops annulatus'],
  [115,'Sphyrna mokarran'],[118,'Amphiprion ocellaris'],
  [120,'Hippocampus hippocampus'],[132,'Muraena helena'],
  [164,'Nautilus pompilius'],[166,'Asterias rubens'],
  [167,'Echinus esculentus'],[168,'Holothuria tubulosa']
 ]);
 const directory='./art/animagia-selected-107/';
 const cache=new Map();
 function profileFor(row){
  if(!row||row[2]!=='species'||typeof row[1]!=='string')return null;
  const entry=scientificToArtwork.get(row[1])
   || genusArtwork.get(row[1].split(' ')[0]);
  // The user-supplied frog illustration is intentionally a representative
  // frog image, not a claim of exact Cornufer/Rana/Hyla species anatomy.
  if(!entry && row[3]==='Amphibia' && row[4]==='Anura'){
   return Object.freeze({artSet:'original107',file:'additional/Лягушка.png',
    scientific:row[1],name:'Лягушка',exact:false,
    note:'Золотой рисунок лягушки · обобщённый образ отряда бесхвостых'});
  }
  if(!entry)return null;
  const [number,name]=entry;
  const path=number===null?'additional/'+name+'.png':
   'animals/'+String(number).padStart(3,'0')+'-'+name.replace(/\s+/g,'_')+'.png';
  const generic=genericArtworkNumbers.has(number);
  return Object.freeze({artSet:'original107',file:path,scientific:row[1],name,
    exact:!generic,
    note:(generic?'Обобщённый золотой рисунок «':'Оригинальный золотой рисунок «')+name+'» · не фотография'});
 }
 function resolve(row){return profileFor(row)}
 function drawable(profile){
  if(profile?.artSet!=='original107')return Promise.resolve(null);
  const path=profile.file;
  if(!cache.has(path)){
   cache.set(path,new Promise(resolve=>{
    const image=new Image();
    image.crossOrigin='anonymous';
    image.onload=()=>resolve({original107:image});
    image.onerror=()=>resolve(null);
    image.src=directory+path.split('/').map(encodeURIComponent).join('/');
   }));
  }
  return cache.get(path);
 }
 function drawCanvas(ctx,loaded,profile,x,y,w,h){
  if(profile?.artSet!=='original107')return false;
  const img=loaded?.original107;
  if(!img||!img.naturalWidth||!img.naturalHeight)return false;
  const scale=Math.min(w*.92/img.naturalWidth,h*.92/img.naturalHeight);
  const dw=img.naturalWidth*scale,dh=img.naturalHeight*scale;
  ctx.save();
  ctx.imageSmoothingEnabled=true;
  ctx.imageSmoothingQuality='high';
  ctx.drawImage(img,x+(w-dw)/2,y+(h-dh)/2,dw,dh);
  ctx.restore();
  return true;
 }
 function render(container,profile){
  if(!container)return;
  if(profile?.artSet!=='original107'){
   container.replaceChildren();
   return;
  }
  const img=document.createElement('img');
  img.className='atlas-art-sprite original-107-art';
  img.alt=profile.note+' · '+profile.scientific;
  img.loading='eager';
  img.decoding='async';
  img.style.cssText='display:block;max-width:100%;max-height:100%;width:100%;height:auto;object-fit:contain';
  img.src=directory+profile.file.split('/').map(encodeURIComponent).join('/');
  container.replaceChildren(img);
 }
 window.AnimagiaAnimalAtlas=Object.freeze({
  ...previous,resolve,drawable,drawCanvas,render,
  originalArtworkCount:108,originalArtworkDirectory:directory,
  originalArtworkExactTaxa:scientificToArtwork.size,
  approvedRepresentativeSpecies:Object.freeze(Object.fromEntries(representativeScientific)),
  approvedArtworkIds:Object.freeze([...new Set([...scientificToArtwork.values()].map(x=>x[0]===null?'additional:'+x[1]:x[0]))].sort((a,b)=>String(a).localeCompare(String(b))))
 });
})();
