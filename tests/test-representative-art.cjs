'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

function createAtlas(){
 const original={
  exact: {artSet:'original107',file:'animals/001-Лев.png',exact:true,scientific:'Panthera leo'},
  frog: {artSet:'original107',file:'additional/Лягушка.png',exact:false,
         note:'Обобщённый образ отряда бесхвостых'},
 };
 const direct=Object.freeze({
  originalArtworkCount:400,
  resolve(row){
   if(row?.[1]==='Panthera leo')return original.exact;
   if(row?.[3]==='Amphibia'&&row?.[4]==='Anura')return original.frog;
   return null;
  }
 });
 const index={
  version:1,
  genus:{
   'Arachnida|Araneae|Salticidae|Myrmarachne':[
    'new/345_Xysticus_kochi.png','Myrmarachne source','Прыгающий паук'
   ]
  },
  family:{
   'Arachnida|Araneae|Salticidae':['new/342_Neon_valentulus.png','Neon valentulus','Неон']
  },
  order:{
   'Arachnida|Araneae':['new/343_Lasiodora_parahybana.png','Lasiodora parahybana','Лазиодора'],
   'Insecta|Lepidoptera':['new/290_Papilio_machaon.png','Papilio machaon','Махаон']
  }
 };
 const context={window:{AnimagiaAnimalAtlas:direct,AnimagiaRepresentativeIndex:index}};
 vm.runInNewContext(fs.readFileSync('representative_art.js','utf8'),context);
 return {atlas:context.window.AnimagiaAnimalAtlas,original};
}
const row=(name,cls,order,family,rank='species')=>
 [1878,name,rank,cls,order,'','Arthropoda',family];

test('existing original species portrait remains exact',()=>{
 const {atlas,original}=createAtlas();
 assert.equal(atlas.originalArtworkCount,400);
 assert.equal(atlas.resolve(row('Panthera leo','Mammalia','Carnivora','Felidae')),original.exact);
});
test('sibling genus, family and order sources have truthful provenance',()=>{
 const {atlas}=createAtlas();
 const genus=atlas.resolve(row('Myrmarachne kuan','Arachnida','Araneae','Salticidae'));
 assert.equal(genus.representativeLevel,'genus');
 assert.equal(genus.exact,false);
 assert.match(genus.note,/НЕ изображение вида Myrmarachne kuan/);
 const family=atlas.resolve(row('Salticus canariensis','Arachnida','Araneae','Salticidae'));
 assert.equal(family.representativeLevel,'family');
 assert.equal(family.sourceScientific,'Neon valentulus');
 const order=atlas.resolve(row('Bowie sagittatus','Arachnida','Araneae','Ctenidae'));
 assert.equal(order.representativeLevel,'order');
 assert.equal(order.scientific,'Bowie sagittatus');
 assert.equal(order.sourceScientific,'Lasiodora parahybana');
});
test('never substitute an illustration from another scientific order or class',()=>{
 const {atlas}=createAtlas();
 assert.equal(atlas.resolve(row('Bowie sagittatus','Insecta','Araneae','Ctenidae')),null);
 assert.equal(atlas.resolve(row('Bowie sagittatus','Arachnida','Solifugae','Ctenidae')),null);
 assert.equal(atlas.resolve(row('Bowie sagittatus','Arachnida','Araneae','Ctenidae','genus')),null);
 const moth=atlas.resolve(row('Lomaspilis opis','Insecta','Lepidoptera','Geometridae'));
 assert.equal(moth.sourceScientific,'Papilio machaon');
 assert.equal(moth.exact,false);
});
test('same frog may have an explicit generic order source, without claiming exact identity',()=>{
 const {atlas,original}=createAtlas();
 const frog=atlas.resolve(row('Cornufer opisthodon','Amphibia','Anura','Ceratobatrachidae'));
 assert.equal(frog,original.frog);
 assert.equal(frog.exact,false);
});
