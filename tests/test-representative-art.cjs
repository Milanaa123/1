'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

function createAtlas(){
 const original={
  exact:{artSet:'original107',file:'animals/001-Лев.png',exact:true,scientific:'Panthera leo'},
  frog:{artSet:'original107',file:'additional/Лягушка.png',exact:false,
        note:'Обобщённый образ отряда бесхвостых'}
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
  version:2,
  genus:{
   'Arachnida|Araneae|Salticidae|Myrmarachne':[
    'new/345_Xysticus_kochi.png','Myrmarachne source','Паук']
  },
  family:{
   'Arachnida|Araneae|Salticidae':['new/342_Neon_valentulus.png','Neon valentulus','Паук'],
   'Mammalia|Carnivora|Canidae':['additional/Волк.png','Canis lupus','Волк']
  },
  genusClass:{
   'Arachnida|Salticidae|Myrmarachne':[
    'new/345_Xysticus_kochi.png','Myrmarachne source','Паук']
  },
  familyClass:{
   'Arachnida|Salticidae':['new/342_Neon_valentulus.png','Neon valentulus','Паук'],
   'Mammalia|Canidae':['additional/Волк.png','Canis lupus','Волк']
  },
  order:{
   'Arachnida|Araneae':['new/343_Lasiodora_parahybana.png','Lasiodora parahybana','Паук'],
   'Insecta|Lepidoptera':['new/290_Papilio_machaon.png','Papilio machaon','Махаон']
  },
  class:{
   Arachnida:['new/343_Lasiodora_parahybana.png','Lasiodora parahybana','Паук'],
   Insecta:['new/277_Mesoprionus_angustatus.png','Mesoprionus angustatus','Жук'],
   Mammalia:['additional/Волк.png','Canis lupus','Волк'],
   Amphibia:['additional/Лягушка.png','Alytes muletensis','Лягушка']
  }
 };
 const context={window:{AnimagiaAnimalAtlas:direct,AnimagiaRepresentativeIndex:index}};
 vm.runInNewContext(fs.readFileSync('representative_art.js','utf8'),context);
 return {atlas:context.window.AnimagiaAnimalAtlas,original};
}
const row=(name,cls,order,family,rank='species')=>
 [1878,name,rank,cls,order,'','Arthropoda',family];

test('never replace an exact species illustration',()=>{
 const {atlas,original}=createAtlas();
 assert.equal(atlas.originalArtworkCount,400);
 assert.equal(atlas.resolve(row('Panthera leo','Mammalia','Carnivora','Felidae')),original.exact);
});
test('choose the closest verified taxonomic group first',()=>{
 const {atlas}=createAtlas();
 const genus=atlas.resolve(row('Myrmarachne kuan','Arachnida','Araneae','Salticidae'));
 assert.equal(genus.representativeLevel,'genus');
 assert.match(genus.note,/НЕ изображение вида Myrmarachne kuan/);
 const family=atlas.resolve(row('Salticus canariensis','Arachnida','Araneae','Salticidae'));
 assert.equal(family.representativeLevel,'family');
 assert.equal(family.sourceScientific,'Neon valentulus');
 const order=atlas.resolve(row('Bowie sagittatus','Arachnida','Araneae','Ctenidae'));
 assert.equal(order.representativeLevel,'order');
 assert.equal(order.sourceScientific,'Lasiodora parahybana');
});
test('wolf for other Canidae; insects never fall back to mammals',()=>{
 const {atlas}=createAtlas();
 const canid=atlas.resolve(row('Canis simensis','Mammalia','Carnivora','Canidae'));
 assert.equal(canid.file,'additional/Волк.png');
 assert.equal(canid.representativeLevel,'family');
 assert.equal(canid.exact,false);
 const insect=atlas.resolve(row('Ectobius larus','Insecta','','Ectobiidae'));
 assert.equal(insect.representativeLevel,'class');
 assert.equal(insect.sourceScientific,'Mesoprionus angustatus');
 assert.equal(insect.exact,false);
 assert.match(insect.note,/НЕ изображение вида Ectobius larus/);
});
test('class fallback works for missing orders and subspecies',()=>{
 const {atlas}=createAtlas();
 const rare=atlas.resolve(row('Imaginarus sample','Arachnida','','Unknown'));
 assert.equal(rare.representativeLevel,'class');
 assert.equal(rare.sourceScientific,'Lasiodora parahybana');
 const withNoRank=atlas.resolve(row('Imaginarus sample','Arachnida','','Unknown','genus'));
 assert.equal(withNoRank,null);
 const subspecies=atlas.resolve(row('Insecta example example','Insecta','','Unknown','subspecies'));
 assert.equal(subspecies.representativeLevel,'class');
 assert.equal(subspecies.exact,false);
});
test('use family evidence even when the order field is empty',()=>{
 const {atlas}=createAtlas();
 const canid=atlas.resolve(row('Canis simensis','Mammalia','','Canidae'));
 assert.equal(canid.representativeLevel,'family');
 assert.equal(canid.sourceScientific,'Canis lupus');
});
test('the original generic frog is preferred across Anura, not a wrong exact portrait',()=>{
 const {atlas}=createAtlas();
 const frog=atlas.resolve(row('Cornufer opisthodon','Amphibia','Anura','Ceratobatrachidae'));
 assert.equal(frog.file,'additional/Лягушка.png');
 assert.equal(frog.exact,false);
 assert.equal(frog.representativeLevel,'order');
 assert.match(frog.note,/НЕ анатомический рисунок вида Cornufer opisthodon/);
});
test('do not choose an unrelated species from a different class',()=>{
 const {atlas}=createAtlas();
 const insect=atlas.resolve(row('Bowie sagittatus','Insecta','Araneae','Ctenidae'));
 assert.equal(insect.representativeLevel,'class');
 assert.equal(insect.sourceScientific,'Mesoprionus angustatus');
 assert.equal(atlas.resolve(row('Bowie sagittatus','Unknown','','Unknown')),null);
});
