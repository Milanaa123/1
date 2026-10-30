'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const source=fs.readFileSync('photo_gallery.js','utf8');
const enhancements=fs.readFileSync('enhancements.js','utf8');
const inspect=enhancements.slice(
 enhancements.indexOf('function inspectImage('),
 enhancements.indexOf('function loadPhotos()')
);
function makeRows(){
 const groups=['Mammalia','Aves','Reptilia','Amphibia','Teleostei','Arachnida','Insecta'];
 const prefix=['Mam','Avi','Rep','Amp','Pis','Ara','Ins'];
 return groups.flatMap((group,g)=>Array.from({length:13},(_,i)=>{
  const genus=prefix[g]+String.fromCharCode(97+i);
  return [1000,genus+' animal','species',group,'Unknown','','Chordata','','',''];
 }));
}
function simulate(kind='valid',rows=makeRows()){
 let count=0;
 const document={addEventListener(){},
  getElementById(){return {hidden:true,value:''}}
 };
 class Image {
  constructor(){this.naturalWidth=0;this.complete=false;}
  set src(_){this.naturalWidth=128;this.complete=true;this.onload?.();}
 }
 const ctx=vm.createContext({document,Image,URL,AbortController,
  setTimeout,clearTimeout,Date,Promise,rows,
  reset(){},render(){},sortInteresting(a,b){return a[1].localeCompare(b[1])},
  fetch:async url=>{
   count++;
   const name=new URL(url).searchParams.get('q');
   return {ok:true,json:async()=>({results:[{
    name:kind==='wrong'?'Felis catus':name,rank:'species',id:143,
    default_photo:{medium_url:'https://static.inaturalist.org/photos/123/medium.jpg',
      square_url:'https://static.inaturalist.org/photos/123/square.jpg',
      attribution:'Credited photographer',
      license_code:kind==='bad-license'?'all-rights-reserved':'cc-by'}
   }]})};
  }
 });
 vm.runInContext(inspect+'\n'+source,ctx,{filename:'photo_gallery.js'});
 vm.runInContext("photoDelay=async()=>{}; photoDraw=()=>{}; photoStatus=()=>{}; photoGallery.source=rows;photoGallery.sum=1000;photoGallery.controller=new AbortController();",ctx);
 return {ctx,calls:()=>count};
}
test('photo gate: every selected species is an exact match with verified image',async()=>{
 const s=simulate();
 await vm.runInContext('photoCollect()',s.ctx);
 const out=vm.runInContext('photoGallery.chosen.map(x=>({scientific:x.row[1],rank:x.row[2],cls:x.row[3],photo:x.photo.src,credit:x.photo.credit})).sort((a,b)=>photoCategoryRank({3:a.cls})-photoCategoryRank({3:b.cls}))',s.ctx);
 assert.equal(out.length,30);
 assert.ok(out.every(x=>x.rank==='species'&&x.photo.startsWith('https://static.inaturalist.org/')&&x.credit.includes('CC-BY')));
 const ranks=out.map(x=>x.cls==='Insecta'?1000:
  ['Mammalia','Aves','Reptilia','Amphibia','Teleostei','Arachnida'].indexOf(x.cls));
 assert.deepEqual(Array.from(ranks),Array.from(ranks).sort((a,b)=>a-b));
 assert.ok(out.filter(x=>x.cls==='Insecta').length<=3);
 assert.ok(s.calls()>0&&s.calls()<=240);
});
test('max three insects, even when all results are insects',async()=>{
 const insects=makeRows().filter(x=>x[3]==='Insecta');
 const s=simulate('valid',insects);
 await vm.runInContext('photoCollect()',s.ctx);
 const chosen=vm.runInContext('photoGallery.chosen.map(x=>x.row[3])',s.ctx);
 assert.ok(chosen.length<=3,'No more than three insects');
});
test('unlicensed and wrong-species images never enter TOP-30',async()=>{
 for(const kind of ['wrong','bad-license']){
  const s=simulate(kind,makeRows().slice(0,12));
  await vm.runInContext('photoCollect()',s.ctx);
  assert.equal(vm.runInContext('photoGallery.chosen.length',s.ctx),0);
 }
});
test('verified photo metadata cache, without storing visitor names',async()=>{
 const s=simulate('valid',makeRows().slice(0,5));
 await vm.runInContext('photoCollect()',s.ctx);
 const first=s.calls();
 await vm.runInContext("photoCancel();photoGallery.source=rows;photoGallery.sum=1000;photoGallery.controller=new AbortController();photoCollect()",s.ctx);
 assert.equal(s.calls(),first);
 assert.ok(!source.includes('localStorage')&&!source.includes('sessionStorage'));
});
test('published index loads historical photo-gated gallery after generic renderer',()=>{
 const html=fs.readFileSync('index.html','utf8');
 const enhanced=html.indexOf('enhancements.js?v=');
 const gallery=html.indexOf('photo_gallery.js?v=');
 assert.ok(enhanced>=0&&gallery>enhanced);
 assert.match(source,/photoCheckImage\(match.preview\|\|match.src,stamp\)/);
 assert.match(source,/PHOTO_INSECT_CAP = 3/);
 assert.match(source,/photoButton.textContent='Посмотреть фотографию'/);
 assert.match(source,/render=function\(\)/);
});



test('Verified real iNaturalist photographs expand inline rather than opening a modal',()=>{
 const src=fs.readFileSync('photo_gallery.js','utf8');
 const css=fs.readFileSync('magic_theme.css','utf8');
 assert.ok(src.includes("photoPanel.className='bestiary-inline-photo'"));
 assert.ok(src.includes("photoButton.addEventListener('click',()=>photoToggleInline(item,photoButton,photoPanel))"));
 assert.ok(src.includes("photoButton.setAttribute('aria-expanded','false')"));
 assert.ok(src.includes("button.setAttribute('aria-expanded','true')"));
 assert.ok(src.includes("button.textContent='Скрыть фотографию'"));
 assert.ok(src.includes('image.src=preview'));
 assert.ok(src.includes('if(!panel.firstChild)'));
 assert.ok(!src.includes('panel.replaceChildren();'));
 assert.ok(src.includes('full.onload=()=>{if(image.isConnected)image.src=item.photo.src;}'));
 assert.ok(src.indexOf('image.src=item.photo.src')>src.indexOf('function photoToggleInline('));
 assert.ok(src.includes('link.href=item.photo.source'));
 assert.ok(!src.includes('dlg.hidden=false'));
 assert.ok(!src.includes("document.body.classList.add('photo-dialog-open')"));
 assert.ok(css.includes('.bestiary-card .bestiary-inline-photo[hidden]{display:none!important}'));
});


test('Gallery updates reuse opened cards so inline photos do not collapse while loading',()=>{
 const source=fs.readFileSync('photo_gallery.js','utf8');
 assert.ok(source.includes("li.dataset.scientificKey=row[1]+'|'+row[2];"));
 assert.ok(source.includes("const existingCards=new Map(Array.from(el('preview').querySelectorAll('.bestiary-card[data-scientific-key]'))"));
 assert.ok(source.includes("const previousCard=existingCards.get(key);"));
 assert.ok(source.includes('fragment.append(previousCard)'));
 assert.ok(source.includes('fragment.append(photoMakeCard(item,index))'));
});

test('Photo preview is retained on collapse, and a second open does not create a new image',()=>{
 const s=simulate('valid',makeRows().slice(0,1));
 const state=vm.runInContext(`(()=>{
  let created=0;
  globalThis.display=row=>row[1];
  document.createElement=(tag)=>{created++;return {tag,src:'',isConnected:true,dataset:{},remove(){this.removed=true}};};
  const attr=new Map([['aria-expanded','false']]);
  const button={getAttribute:k=>attr.get(k),setAttribute:(k,v)=>attr.set(k,v),textContent:''};
  const panel={hidden:true,firstChild:null,replaceChildren(...children){this.firstChild=children[0]||null;}};
  const item={row:rows[0],photo:{
   src:'https://static.inaturalist.org/photos/1/medium.jpg',
   preview:'https://static.inaturalist.org/photos/1/square.jpg',
   credit:'Example · CC-BY',source:'https://www.inaturalist.org/taxa/1'
  }};
  photoToggleInline(item,button,panel);
  const image=panel.firstChild;
  const opened=!panel.hidden && [item.photo.preview,item.photo.src].includes(image.src) && button.getAttribute('aria-expanded')==='true';
  photoToggleInline(item,button,panel);
  const closed=panel.hidden && panel.firstChild===image && button.getAttribute('aria-expanded')==='false';
  const before=created;
  photoToggleInline(item,button,panel);
  return {opened,closed,reopened:!panel.hidden && panel.firstChild===image,
    unchanged:created===before,button:button.textContent};
 })()`,s.ctx);
 assert.equal(state.opened,true);
 assert.equal(state.closed,true);
 assert.equal(state.reopened,true);
 assert.equal(state.unchanged,true);
 assert.equal(state.button,'Скрыть фотографию');
});
test('TOP-30 has no obsolete full-screen photo modal and keeps stable per-species controls',()=>{
 const html=fs.readFileSync('index.html','utf8');
 assert.ok(!html.includes('id="animalPhotoDialog"'));
 assert.match(source,/photoPanel\.id='bestiary-inline-photo-'\+row\[1\]/);
 assert.match(source,/photoCheckImage\(match.preview\|\|match.src,stamp\)/);
});
