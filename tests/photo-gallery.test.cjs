'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const base=path.resolve(__dirname,'..');
const scripts=['greek_taxa.js','app.js','enhancements.js','photo_gallery.js']
 .map(name=>fs.readFileSync(path.join(base,name),'utf8')).join('\n');
class FakeImage {
 constructor(){this.complete=false;this.naturalWidth=0}
 set src(v){this.complete=true;this.naturalWidth=400;this.onload?.()}
}
const types=['Mammalia','Aves','Reptilia','Insecta'];
const genera=['Ursus','Corvus','Gekko','Papilio'];
const rows=types.flatMap((type,index)=>Array.from({length:12},(_,i)=>
 [1000,genera[index]+String.fromCharCode(97+i)+' name'+String.fromCharCode(97+i),
  'species',type,'','','Chordata']));
function simulate(photoKind='valid',candidates=rows) {
 let requests=0;
 const fakeFetch=async url=>{
  requests++;
  const name=decodeURIComponent(url.split('?q=')[1].split('&')[0]);
  return {ok:true,json:async()=>({results:[{
   name:photoKind==='wrong'?'Felis catus':name,rank:'species',id:345,
   default_photo:{medium_url:'https://static.inaturalist.org/photos/1/medium.jpg',square_url:'https://static.inaturalist.org/photos/1/square.jpg',
     attribution:'Test photographer',license_code:photoKind==='bad-license'?'none':'cc-by'}
  }]})};
 };
 const document={addEventListener(){},getElementById(){return {hidden:true}}};
 const context={document,fetch:fakeFetch,Image:FakeImage,URL,
   AbortController,setTimeout,clearTimeout,Date,Promise,testRows:candidates};
 vm.createContext(context);
 vm.runInContext(scripts+'\nphotoDelay=async function(){};\nphotoDraw=function(){};\nphotoStatus=function(){};\nphotoGallery.source=testRows;photoGallery.sum=1000;\nphotoGallery.controller=new AbortController();',context);
 return {context,calls:()=>requests};
}
test('only verified photos, in animal-bird-reptile-insect order',async()=>{
 const x=simulate();
 await vm.runInContext('photoCollect()',x.context);
 const sorted=vm.runInContext('photoGallery.chosen.slice().sort(photoOrder)',x.context);
 assert.equal(sorted.length,30);
 assert.deepEqual(types.map(c=>sorted.filter(x=>x.row[3]===c).length),[10,8,7,5]);
 assert.ok(x.calls()<=40);
});
test('repeat search reuses animal photo cache',async()=>{
 const x=simulate();await vm.runInContext('photoCollect()',x.context);
 const before=x.calls();
 await vm.runInContext('photoCancel();photoGallery.source=testRows;photoGallery.sum=1000;photoGallery.controller=new AbortController();photoCollect()',x.context);
 assert.equal(x.calls(),before);
});
test('wrong or unlicensed images cannot enter gallery',async()=>{
 for(const kind of ['wrong','bad-license']){
  const x=simulate(kind,rows.slice(0,6));
  await vm.runInContext('photoCollect()',x.context);
  assert.equal(vm.runInContext('photoGallery.chosen.length',x.context),0);
 }
});
test('concise accessible landing page',()=>{
 const page=fs.readFileSync(path.join(base,'index.html'),'utf8');
 assert.match(page,/hero-fauna/);
 assert.match(page,/prefers-reduced-motion:reduce/);
 assert.match(page,/photo_gallery\.js/);
 assert.doesNotMatch(page,/Используем древнегреческие буквы:/);
});
