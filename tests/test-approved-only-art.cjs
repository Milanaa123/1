'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const vm=require('node:vm');

const base='art/animagia-selected-107';
const manifest=JSON.parse(fs.readFileSync(path.join(base,'manifest.json'),'utf8'));
const rows=manifest.files;
const namedFiles=new Set(rows.map(item=>item.file));
const row=name=>[1878,name,'species','Mammalia','Carnivora','','Chordata'];

function loadAtlas(){
 class FakeImage{
   constructor(){this.naturalWidth=900;this.naturalHeight=800;}
   set src(v){this.source=v;this.onload?.();}
 }
 const window={};
 const document={createElement(tag){
  if(tag!=='img')throw Error('Unexpected element '+tag);
  return new FakeImage();
 }};
 const ctx=vm.createContext({window,document,Image:FakeImage,Promise,URL,
     encodeURIComponent,console});
 for(const source of ['animal_atlas.js','selected_art_107.js','new_art_167.js']){
  vm.runInContext(fs.readFileSync(source,'utf8'),ctx,{filename:source});
 }
 return window.AnimagiaAnimalAtlas;
}
const atlas=loadAtlas();

test('only the 275 accepted unmodified transparent PNGs remain available',()=>{
 assert.equal(manifest.count,275);
 assert.equal(rows.length,275);
 assert.equal(new Set(rows.map(x=>x.file)).size,275);
 assert.equal(manifest.animals,104);
 assert.equal(manifest.additional,4);
 for(const item of rows){
  const name=path.join(base,item.file);
  const data=fs.readFileSync(name);
  assert.equal(data.subarray(0,8).toString('hex'),'89504e470d0a1a0a',name);
  assert.equal(data[25],6,'RGBA required '+name);
  assert.equal(data.readUInt32BE(16),item.width,name);
  assert.equal(data.readUInt32BE(20),item.height,name);
  assert.equal(crypto.createHash('sha256').update(data).digest('hex'),item.sha256,name);
 }
});

test('only exact accepted species get animal imagery',()=>{
 assert.equal(atlas.originalArtworkCount,275);
 for(const [latin,expectedFile] of [
  ['Panthera leo','animals/001-Лев.png'],
  ['Panthera tigris','animals/002-Тигр.png'],
  ['Felis catus','additional/Кошка.png'],
  ['Canis lupus','additional/Волк.png'],
  ['Bubo bubo','additional/Филин.png'],
  ['Natrix natrix','animals/102-Уж_обыкновенный.png']
 ]){
  const profile=atlas.resolve(row(latin));
  assert.equal(profile?.artSet,'original107',latin);
  assert.equal(profile.file,expectedFile);
  assert(namedFiles.has(profile.file),latin);
 }
 for(const latin of ['Panthera uncia','Rana temporaria','Canis latrans','Equus quagga',
  'Lynx rufus','Vulpes lagopus','Canis lupus familiaris']){
  assert.equal(atlas.resolve(row(latin)),null,latin);
 }
 assert.equal(atlas.resolve([1878,'Panthera leo','subspecies']),null);
});

test('all 108 approved PNGs are reachable on their correct animal cards',()=>{
 const pictured=new Set([...atlas.approvedArtworkIds].map(String));
 const required=new Set(rows.filter(item=>item.name!=='Лягушка'&&!item.file.startsWith('new/')).map(item=>
   item.number===null?'additional:'+item.name:String(item.number)));
 assert.equal(required.size,107);
 assert.equal(pictured.size,107);
 assert.deepEqual([...pictured].sort(),[...required].sort());
 const examples=Array.from(atlas.approvedArtworkExamples);
 const used=new Set();
 for(const {scientific,number,name} of examples){
   const expected=rows.find(item=>item.number===number&&item.name===name);
   assert(expected,'Source PNG missing for '+name+' / '+scientific);
   const profile=atlas.resolve([1700,scientific,'species','Mammalia','Carnivora']);
   assert.equal(profile?.file,expected.file,
    'Wrong animal pictured for '+scientific+' ('+name+')');
   assert.equal(profile?.name,name);
   used.add(expected.file);
 }
 assert.equal(used.size,107,'Not all mapped artwork PNGs were exercised');
 const frog=rows.find(item=>item.name==='Лягушка');
 assert(frog,"The user-supplied original frog PNG must remain available");
 assert.equal(atlas.resolve([1700,'Cornufer opisthodon','species','Amphibia','Anura']).file,frog.file);
 // Legacy art is not allowed to appear in a different species' card.
 assert.equal(atlas.resolve([1700,'Panthera uncia','species','Mammalia','Carnivora']),null);
 assert.equal(atlas.resolve([1700,'Canis lupus familiaris','subspecies','Mammalia','Carnivora']),null);
});

test('user-provided frog is shown for Anura with honest generic classification',()=>{
 const anura=[1878,'Cornufer opisthodon','species','Amphibia','Anura','','Chordata'];
 const profile=atlas.resolve(anura);
 assert.equal(profile?.file,'additional/Лягушка.png');
 assert.equal(profile?.exact,false);
 assert.match(profile?.note,/обобщённый образ/);
 assert.equal(atlas.resolve([1878,'Salamandra salamandra','species','Amphibia','Urodela']),null);
});
test('no legacy fallback, even on direct image requests',async()=>{
 const unsupported=row('Panthera uncia');
 assert.equal(atlas.resolve(unsupported),null);
 assert.equal(await atlas.drawable(null),null);
 const c={clearRect(){},drawImage(){throw Error('Legacy artwork used')},save(){},restore(){}};
 assert.equal(atlas.drawCanvas(c,null,null,0,0,100,100),false);
 const container={replaceChildren(...nodes){this.nodes=nodes}};
 atlas.render(container,null);
 assert.equal(container.nodes.length,0);
 const match=atlas.resolve(row('Panthera leo'));
 const image=await atlas.drawable(match);
 assert(image.original107);
 assert.match(image.original107.source,/001-%D0%9B%D0%B5%D0%B2\.png/);
 const calls=[];
 const context={save(){},restore(){},drawImage(...args){calls.push(args)},set imageSmoothingEnabled(v){},
   set imageSmoothingQuality(v){}};
 assert.equal(atlas.drawCanvas(context,image,match,0,0,200,150),true);
 assert.equal(calls.length,1);
});

test('site build and index cannot publish or load the old atlas',()=>{
 const builder=fs.readFileSync('build_data.py','utf8');
 const html=fs.readFileSync('index.html','utf8');
 assert(builder.includes('publish_selected_original_art(BASE,DEST)'));
 assert(builder.includes("shutil.copy2(BASE/'approved_only_cards.js'"));
 for(const banned of [
 'animagia-100-alpha.webp','animals-gold-v1.png','animagia-corrected-22.webp',
 'animals-approved-01-05.png','animal_atlas_100.js','animal_cutout_40.js',
 'gold_contour_40.js','photo_gallery.js'
 ]){
  assert(!builder.includes(banned),'Old art in build: '+banned);
  assert(!html.includes(banned),'Old art in page: '+banned);
 }
});

test('all 167 new original PNGs belong to their own approved cards',()=>{
 assert.equal(manifest.new,167);
 const newRows=rows.filter(x=>x.file.startsWith('new/'));
 assert.equal(newRows.length,167);
 assert.equal(atlas.newOriginalArtworkExamples.length,167);
 for(const item of atlas.newOriginalArtworkExamples){
   const entry=newRows.find(x=>x.file===item.file);
   assert(entry,'new original image missing: '+item.file);
   const profile=atlas.resolve([1540,item.scientific,'species','Mammalia','Carnivora']);
   assert.equal(profile?.file,item.file,'wrong original drawing: '+item.scientific);
   assert.equal(profile?.name,item.name);
   assert.equal(profile?.exact,true);
 }
 assert.equal(atlas.resolve([1540,'NoSuchAnimal noanimal','species']),null);
});
