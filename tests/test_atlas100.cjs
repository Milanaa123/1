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
 assert.ok(html.includes('./animal_atlas_100.js?v=batch02-20-cleansed-20261027'));
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
 for(const required of ['function cleanBatch02Cell(', 'batch02Cutouts',
   'cleared>0','if(closest<=8)keep[id]=1',
   'profile.reviewedBatch===2?cleanBatch02Cell(im,i):null'])
  assert.ok(source.includes(required),required);
});
