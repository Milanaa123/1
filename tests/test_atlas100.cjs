'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('fs'),vm=require('vm');
const SRC=fs.readFileSync('animal_atlas_100.js','utf8');
const legacy={imageUrl:'./art/animals-gold-v1.png',list:[],
 resolve(row){
  const name=row?.[1];
  if(row?.[4]==='Anura')return {id:'frog',cell:18,label:'Лягушка',note:'Обобщённый рисунок лягушки'};
  const picks=new Map([['Canis lupus',0],['Vulpes vulpes',1],
   ['Canis familiaris',2],['Felis catus',3],['Panthera leo',4]]);
  if(picks.has(name))return {id:['wolf','fox','dog','cat','lion'][picks.get(name)],
    cell:picks.get(name),approvedIndex:picks.get(name),exact:false,
    note:'Обобщённый рисунок группы',scientific:name};
  return null;
 },
 classify(){return null;},style(){return {};},render(){},drawCanvas(){return true;},drawable:async()=>null};
const ctx=vm.createContext({window:{AnimagiaAnimalAtlas:legacy},Image:class{},document:{createElement:()=>({})},Promise});
vm.runInContext(SRC,ctx,{filename:'animal_atlas_100.js'});
const api=ctx.window.AnimagiaAnimalAtlas;
const row=(name,cls='Mammalia',order='Carnivora')=>[1878,name,'species',cls,order,'','Chordata'];
test('all 100 distinct visitor-provided drawings are indexed in order',()=>{
 assert.equal(api.list.length,100);
 assert.equal(new Set(api.list.map(x=>x.key)).size,100);
 assert.equal(new Set(api.list.map(x=>x.cell)).size,100);
 assert.equal(api.list[0].name,'Волк');
 assert.equal(api.list[93].name,'Летучая мышь');
 assert.equal(api.list[99].name,'Омар');
 assert.match(api.imageUrl,/100-alpha\.webp$/);
});
test('each generated art has honest general artwork status',()=>{
 for(const [scientific,i,cls,order] of [
  ['Canis lupus',0,'Mammalia','Carnivora'],
  ['Panthera leo',4,'Mammalia','Carnivora'],
  ['Panthera tigris',5,'Mammalia','Carnivora'],
  ['Panthera uncia',6,'Mammalia','Carnivora'],
  ['Ailuropoda melanoleuca',11,'Mammalia','Carnivora'],
  ['Bubo bubo',21,'Aves','Strigiformes'],
  ['Alces alces',31,'Mammalia','Artiodactyla'],
  ['Equus zebra',43,'Mammalia','Perissodactyla'],
  ['Orcinus orca',72,'Mammalia','Cetacea'],
  ['Carcharodon carcharias',73,'Chondrichthyes','Lamniformes'],
  ['Octopus vulgaris',94,'Cephalopoda','Octopoda'],
  ['Hippocampus hippocampus',97,'Actinopterygii','Syngnathiformes']
 ]){
  const p=api.resolve(row(scientific,cls,order));
  assert.equal(p?.cell,i,scientific);
  assert.equal(p?.exact,false,scientific);
  assert.match(p?.note,/рисунок/,scientific);
 }
});
test('mismatched species remain labelled as a representative, not identical',()=>{
 const generic=api.resolve(row('Unknown predator'));
 assert.equal(generic.cell,1);
 assert.match(generic.note,/не изображение указанного вида/);
 const reptile=api.resolve(row('Acanthosaura rubrilabris','Reptilia','Squamata'));
 assert.equal(reptile.cell,82);
 assert.equal(reptile.exact,false);
 const spider=api.resolve(row('Bowie sagittatus','Arachnida','Araneae'));
 assert.equal(spider,null); // The supplied 100-sheet has no spider; never present a crab.
 const frog=api.resolve(row('Cornufer opisthodon','Amphibia','Anura'));
 assert.equal(frog?.id,'frog'); // Preserve corrected stage-four drawing.
 const pegasus=api.resolve(row('Pegasus fictitious','Unknown','Unknown'));
 assert.equal(pegasus,null);
});
test('source asset has the 100-cell transparent RIFF/WebP signature',()=>{
 const b=fs.readFileSync('art/animagia-100-alpha.webp');
 assert.equal(b.toString('ascii',0,4),'RIFF');
 assert.equal(b.toString('ascii',8,12),'WEBP');
 assert.ok(b.length>20000&&b.length<800000,'one optimized curated asset');
});
test('no scoring, name storage or photographic misrepresentation',()=>{
 for(const f of ['score(','localStorage','sessionStorage','setItem('])
  assert.ok(!SRC.includes(f),f);
 assert.ok(SRC.includes('exact:false'));
});
test('Render deployment explicitly includes both curated atlas module and art bytes',()=>{
 const build=fs.readFileSync('build_data.py','utf8');
 assert.ok(build.includes("shutil.copy2(art100,DEST/'art'/'animagia-100-alpha.webp')"));
 assert.ok(build.includes("shutil.copy2(BASE/'animal_atlas_100.js',DEST/'animal_atlas_100.js')"));
 assert.ok(build.includes('CURATED_100_ART_READY'));
 const html=fs.readFileSync('index.html','utf8');
 assert.ok(html.includes('./animal_atlas_100.js?v=batch06-final15-20261028'));
});

test('wrapper prefers five personally reviewed PNG cutouts without changing other 95',()=>{
 for(const [name,i] of [['Canis lupus',0],['Vulpes vulpes',1],['Canis familiaris',2],
 ['Felis catus',3],['Panthera leo',4]]){
  const p=api.resolve(row(name));
  assert.equal(p.approvedIndex,i,name);
  assert.notEqual(p.artSet,'atlas100',name);
 }
 assert.equal(api.resolve(row('Panthera tigris')).artSet,'atlas100');
 assert.equal(api.list.length,100);
 const source=fs.readFileSync('build_data.py','utf8');
 assert.ok(source.includes("shutil.copy2(art5,DEST/'art'/'animals-approved-01-05.png')"));
 assert.ok(source.includes('CURATED_FIRST_FIVE_ALPHA_READY'));
});

test('Stage 5: twenty consecutive images 6–25 are routed to their own artwork',()=>{
 const cases=[
 ['Panthera tigris',5],['Panthera uncia',6],['Acinonyx jubatus',7],
 ['Panthera onca',8],['Puma concolor',9],['Ursus arctos',10],
 ['Ailuropoda melanoleuca',11],['Procyon lotor',12],['Lutra lutra',13],
 ['Neovison vison',14],['Meles meles',15],['Gulo gulo',16],
 ['Leopardus pardalis',17],['Lynx lynx',18],['Caracal caracal',19],
 ['Strix aluco',20],['Bubo bubo',21],['Corvus corax',22],
 ['Corvus cornix',23],['Falco peregrinus',24]
 ];
 assert.equal(cases.length,20);
 for(const [scientific,expected] of cases){
  const p=api.resolve(row(scientific,
    expected>=20?'Aves':'Mammalia',
    expected>=20?'Strigiformes':'Carnivora'));
  assert.equal(p?.cell,expected,scientific);
  assert.equal(p?.reviewedBatch,2,scientific);
  assert.equal(p?.artSet,'atlas100',scientific);
  assert.equal(p?.exact,false,scientific);
 }
 assert.equal(api.resolve(row('Cornufer opisthodon','Amphibia','Anura')).id,'frog');
 assert.equal(api.resolve(row('Canis lupus')).approvedIndex,0);
 const source=fs.readFileSync('animal_atlas_100.js','utf8');
 for(const required of ['function cleanReviewedCell(', 'reviewedCutouts',
   'cleared>0','if(closest<=8)keep[id]=1',
   '(profile.reviewedBatch>=2&&profile.reviewedBatch<=6)?cleanReviewedCell(im,i):null'])
  assert.ok(source.includes(required),required);
});

test('Stage 6: next 20 transparent drawings 26–45 preserve exact routing; Pegasus stays fantasy art',()=>{
 const cases=[
  ['Astur gentilis',25,'Aves','Accipitriformes'],
  ['Aquila chrysaetos',26,'Aves','Accipitriformes'],
  ['Gyps fulvus',27,'Aves','Accipitriformes'],
  ['Larus argentatus',28,'Aves','Charadriiformes'],
  ['Archilochus colubris',29,'Aves','Apodiformes'],
  ['Cervus elaphus',30,'Mammalia','Artiodactyla'],
  ['Alces alces',31,'Mammalia','Artiodactyla'],
  ['Capreolus capreolus',32,'Mammalia','Artiodactyla'],
  ['Rangifer tarandus',33,'Mammalia','Artiodactyla'],
  ['Sus scrofa',34,'Mammalia','Artiodactyla'],
  ['Bison bison',35,'Mammalia','Artiodactyla'],
  ['Bison bonasus',36,'Mammalia','Artiodactyla'],
  ['Ovis aries',37,'Mammalia','Artiodactyla'],
  ['Capra hircus',38,'Mammalia','Artiodactyla'],
  ['Rupicapra rupicapra',39,'Mammalia','Artiodactyla'],
  ['Equus ferus',40,'Mammalia','Perissodactyla'],
  ['Equus asinus',42,'Mammalia','Perissodactyla'],
  ['Equus quagga',43,'Mammalia','Perissodactyla'],
  ['Giraffa camelopardalis',44,'Mammalia','Artiodactyla']
 ];
 assert.equal(cases.length,19);
 for(const [scientific,index,cls,order] of cases){
  const p=api.resolve(row(scientific,cls,order));
  assert.equal(p?.cell,index,scientific);
  assert.equal(p?.reviewedBatch,3,scientific);
  assert.equal(p?.artSet,'atlas100',scientific);
  assert.equal(p?.exact,false,scientific);
 }
 assert.match(api.list[41].name,/Пегас/);
 assert.equal(api.resolve(row('Pegasus fictitious','Unknown','Unknown')),null);
 assert.notEqual(api.resolve(row('Equus ferus')).cell,41);
 assert.equal(api.list.length,100);
});


test('Stage 7: 20 more real species 46–65 resolve to the original batch-four silhouettes',()=>{
 const cases=[
 [
  "Tragelaphus strepsiceros",
  45,
  "Mammalia",
  "Artiodactyla"
 ],
 [
  "Gazella gazella",
  46,
  "Mammalia",
  "Artiodactyla"
 ],
 [
  "Camelus dromedarius",
  47,
  "Mammalia",
  "Artiodactyla"
 ],
 [
  "Lama glama",
  48,
  "Mammalia",
  "Artiodactyla"
 ],
 [
  "Vicugna pacos",
  49,
  "Mammalia",
  "Artiodactyla"
 ],
 [
  "Oryctolagus cuniculus",
  50,
  "Mammalia",
  "Lagomorpha"
 ],
 [
  "Lepus europaeus",
  51,
  "Mammalia",
  "Lagomorpha"
 ],
 [
  "Sciurus vulgaris",
  52,
  "Mammalia",
  "Rodentia"
 ],
 [
  "Castor fiber",
  53,
  "Mammalia",
  "Rodentia"
 ],
 [
  "Cricetus cricetus",
  54,
  "Mammalia",
  "Rodentia"
 ],
 [
  "Mus musculus",
  55,
  "Mammalia",
  "Rodentia"
 ],
 [
  "Rattus norvegicus",
  56,
  "Mammalia",
  "Rodentia"
 ],
 [
  "Hystrix cristata",
  57,
  "Mammalia",
  "Rodentia"
 ],
 [
  "Spermophilus citellus",
  58,
  "Mammalia",
  "Rodentia"
 ],
 [
  "Marmota marmota",
  59,
  "Mammalia",
  "Rodentia"
 ],
 [
  "Macropus giganteus",
  60,
  "Mammalia",
  "Diprotodontia"
 ],
 [
  "Phascolarctos cinereus",
  61,
  "Mammalia",
  "Diprotodontia"
 ],
 [
  "Vombatus ursinus",
  62,
  "Mammalia",
  "Diprotodontia"
 ],
 [
  "Canis lupus dingo",
  63,
  "Mammalia",
  "Carnivora"
 ],
 [
  "Sarcophilus harrisii",
  64,
  "Mammalia",
  "Dasyuromorphia"
 ]
];
 assert.equal(cases.length,20);
 for(const [scientific,index,cls,order] of cases){
  const p=api.resolve(row(scientific,cls,order));
  assert.equal(p?.cell,index,scientific);
  assert.equal(p?.reviewedBatch,4,scientific);
  assert.equal(p?.artSet,'atlas100',scientific);
  assert.equal(p?.exact,false,scientific);
 }
 assert.equal(api.evidence.batch04.first,46);
 assert.equal(api.evidence.batch04.last,65);
 assert.equal(api.evidence.batch04.count,20);
 assert.equal(api.list.length,100);
 assert.equal(api.resolve(row('Canis lupus')).approvedIndex,0);
 assert.equal(api.resolve(row('Cornufer opisthodon','Amphibia','Anura')).id,'frog');
});


test('22 visually corrected species use a real transparent WebP and retain old master',()=>{
 const b=fs.readFileSync('art/animagia-corrected-22.webp');
 const crypto=require('node:crypto');
 assert.equal(b.toString('ascii',0,4),'RIFF');
 assert.equal(b.toString('ascii',8,12),'WEBP');
 assert.equal(crypto.createHash('sha256').update(b).digest('hex'),'9876d77dfcee8e0859581678d5273b13fd1ca77d8a45b5792f334ffb1a07687b');
 assert.equal(api.evidence.visualCorrections.count,22);
 assert.deepEqual(Array.from(api.correctedIndices),[6,7,9,10,14,19,24,29,30,33,35,40,46,47,48,53,54,65,68,78,81,86]);
 assert.equal(api.list.length,100);
 const build=fs.readFileSync('build_data.py','utf8');
 assert.ok(build.includes("shutil.copy2(corrected,DEST/'art'/'animagia-corrected-22.webp')"));
});


test('Stage 8: fifth reviewed batch contains exactly 20 named birds, marine mammals, fish and reptiles',()=>{
 const expected=[
 [
  "Dromaius novaehollandiae",
  65,
  "Aves",
  "Casuariiformes"
 ],
 [
  "Struthio camelus",
  66,
  "Aves",
  "Struthioniformes"
 ],
 [
  "Casuarius casuarius",
  67,
  "Aves",
  "Casuariiformes"
 ],
 [
  "Apteryx australis",
  68,
  "Aves",
  "Apterygiformes"
 ],
 [
  "Aptenodytes forsteri",
  69,
  "Aves",
  "Sphenisciformes"
 ],
 [
  "Balaenoptera musculus",
  70,
  "Mammalia",
  "Cetartiodactyla"
 ],
 [
  "Tursiops truncatus",
  71,
  "Mammalia",
  "Cetartiodactyla"
 ],
 [
  "Orcinus orca",
  72,
  "Mammalia",
  "Cetartiodactyla"
 ],
 [
  "Carcharodon carcharias",
  73,
  "Chondrichthyes",
  "Lamniformes"
 ],
 [
  "Mobula birostris",
  74,
  "Chondrichthyes",
  "Myliobatiformes"
 ],
 [
  "Phoca vitulina",
  75,
  "Mammalia",
  "Carnivora"
 ],
 [
  "Zalophus californianus",
  76,
  "Mammalia",
  "Carnivora"
 ],
 [
  "Odobenus rosmarus",
  77,
  "Mammalia",
  "Carnivora"
 ],
 [
  "Trichechus manatus",
  78,
  "Mammalia",
  "Sirenia"
 ],
 [
  "Enhydra lutris",
  79,
  "Mammalia",
  "Carnivora"
 ],
 [
  "Testudo graeca",
  80,
  "Reptilia",
  "Testudines"
 ],
 [
  "Chelonia mydas",
  81,
  "Reptilia",
  "Testudines"
 ],
 [
  "Lacerta agilis",
  82,
  "Reptilia",
  "Squamata"
 ],
 [
  "Iguana iguana",
  83,
  "Reptilia",
  "Squamata"
 ],
 [
  "Chamaeleo chamaeleon",
  84,
  "Reptilia",
  "Squamata"
 ]
];
 assert.equal(expected.length,20);
 for(const [scientific,i,cls,order] of expected){
  const p=api.resolve(row(scientific,cls,order));
  assert.equal(p?.artSet,'atlas100',scientific);
  assert.equal(p?.cell,i,scientific);
  assert.equal(p?.reviewedBatch,5,scientific);
  assert.equal(p?.exact,false,scientific);
 }
 assert.deepEqual([api.evidence.batch05.first,api.evidence.batch05.last,api.evidence.batch05.count],[66,85,20]);
 assert.deepEqual(Array.from(api.evidence.batch05.correctedSpeciesReused),[68,78,81]);
 for(const i of [68,78,81])assert.ok(Array.from(api.correctedIndices).includes(i));
 assert.equal(api.list.length,100);
 assert.equal(api.resolve(row('Canis lupus')).approvedIndex,0);
 assert.equal(api.resolve(row('Cornufer opisthodon','Amphibia','Anura')).id,'frog');
});


test('Stage 9: last 15 curated images, 14 biological taxa and one explicitly fantasy serpent, route to correct art',()=>{
 const cases=[
 [
  "Gekko gecko",
  85,
  "Reptilia",
  "Squamata"
 ],
 [
  "Natrix natrix",
  86,
  "Reptilia",
  "Squamata"
 ],
 [
  "Naja naja",
  88,
  "Reptilia",
  "Squamata"
 ],
 [
  "Python regius",
  89,
  "Reptilia",
  "Squamata"
 ],
 [
  "Crocodylus niloticus",
  90,
  "Reptilia",
  "Crocodylia"
 ],
 [
  "Alligator mississippiensis",
  91,
  "Reptilia",
  "Crocodylia"
 ],
 [
  "Uromastyx aegyptia",
  92,
  "Reptilia",
  "Squamata"
 ],
 [
  "Myotis myotis",
  93,
  "Mammalia",
  "Chiroptera"
 ],
 [
  "Octopus vulgaris",
  94,
  "Cephalopoda",
  "Octopoda"
 ],
 [
  "Loligo vulgaris",
  95,
  "Cephalopoda",
  "Teuthida"
 ],
 [
  "Aurelia aurita",
  96,
  "Scyphozoa",
  "Semaeostomeae"
 ],
 [
  "Hippocampus hippocampus",
  97,
  "Actinopterygii",
  "Syngnathiformes"
 ],
 [
  "Cancer pagurus",
  98,
  "Malacostraca",
  "Decapoda"
 ],
 [
  "Homarus gammarus",
  99,
  "Malacostraca",
  "Decapoda"
 ]
];
 assert.equal(cases.length,14);
 for(const [scientific,index,cls,order] of cases){
  const p=api.resolve(row(scientific,cls,order));
  assert.equal(p?.cell,index,scientific);
  assert.equal(p?.reviewedBatch,6,scientific);
  assert.equal(p?.artSet,'atlas100',scientific);
  assert.equal(p?.exact,false,scientific);
 }
 assert.equal(api.list[87].name,'Змей (декоративный)');
 assert.equal(api.resolve(row('Natrix natrix','Reptilia','Squamata')).cell,86);
 assert.equal(api.list[92].name,'Шипохвост');
 assert.equal(api.resolve(row('Uromastyx aegyptia','Reptilia','Squamata')).cell,92);
 assert.equal(api.evidence.batch06.first,86);
 assert.equal(api.evidence.batch06.last,100);
 assert.equal(api.evidence.batch06.count,15);
 assert.deepEqual(Array.from(api.evidence.batch06.correctedSpeciesReused),[86]);
 assert.deepEqual(Array.from(api.evidence.batch06.fantasyOnly),[88]);
 assert.equal(api.list.length,100);
 assert.equal(api.resolve(row('Canis lupus')).approvedIndex,0);
 assert.equal(api.resolve(row('Cornufer opisthodon','Amphibia','Anura')).id,'frog');
});
