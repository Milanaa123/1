'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('fs'),vm=require('vm');
const SRC=fs.readFileSync('animal_atlas_100.js','utf8');
const legacy={imageUrl:'./art/animals-gold-v1.png',list:[],
 resolve(row){return row?.[4]==='Anura'?{id:'frog',cell:18,label:'Лягушка',note:'Обобщённый рисунок лягушки'}:null;},
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
 assert.ok(html.includes('./animal_atlas_100.js?v=approved100-first-set-20261027'));
});
