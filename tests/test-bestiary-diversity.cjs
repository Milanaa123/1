'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const code=fs.readFileSync('relic_features.js','utf8');
const pdf=fs.readFileSync('bestiary_pdf.js','utf8');
const start=code.indexOf(' const chosenRows=()=>{');
const end=code.indexOf(' const label=',start);
assert.ok(start>0&&end>start,'The live bestiary selector must remain testable');
const selector=code.slice(start,end);
function select(data,selected='',chosen=[]){
 const safeRows=()=>data;
 const imageAtlas={
  resolve:r=>({
   file:r[11]||'art/'+r[3]+'/'+r[1],
   exact:r[12]===true
  })
 };
 const get=id=>id==='relicAnimal'?{value:selected}:null;
 const photoGallery={chosen:chosen.map(row=>({row}))};
 return new Function('safeRows','atlas','get','photoGallery',
  selector+'\nreturn chosenRows;')(safeRows,()=>imageAtlas,get,photoGallery)();
}
function row(name,cls,art,number=1531,verified=''){
 return [number,name,'species',cls,'Order','','Chordata','Family','',''+verified,'',art];
}
test('Magic book picks up to 30 different approved illustrations across animal classes',()=>{
 const kinds=['Mammalia','Aves','Reptilia','Amphibia','Teleostei','Arachnida','Insecta'];
 const data=[];
 for(let i=0;i<53;i++)data.push(row('Species '+i,kinds[i%kinds.length],'new/'+i+'.png'));
 const selected='Species 19|species';
 const output=select(data,selected);
 assert.equal(output.length,30);
 assert.equal(output[0][1],'Species 19','The animal chosen on the personal card must be in the book');
 assert.equal(new Set(output.map(r=>r[11])).size,30);
 assert.equal(new Set(output.map(r=>r[3])).size,kinds.length);
});
test('The book still contains all matches when they have one shared group image',()=>{
 const data=Array.from({length:42},(_,i)=>row('Frog '+i,'Amphibia','additional/Лягушка.png'));
 const output=select(data,'Frog 25|species');
 assert.equal(output.length,30);
 assert.equal(output[0][1],'Frog 25');
 assert.equal(new Set(output.map(r=>r[1])).size,30);
});
test('Partially-loaded photo TOP-30 is preferred without sacrificing visual diversity',()=>{
 const data=Array.from({length:40},(_,i)=>row('Taxon '+i,i%2?'Insecta':'Mammalia','art-'+i+'.png'));
 const output=select(data,'',data.slice(-3));
 assert.equal(output.length,30);
 assert.equal(new Set(output.map(r=>r[11])).size,30);
 assert.equal(new Set(output.map(r=>r[3])).size,2);
 assert.ok(output.some(r=>r[1]==='Taxon 39'));
});
test('Selected PDF card layout stays clear of the footer on all 3-entry pages',()=>{
 assert.match(pdf,/const x=91,w=818,h=306/);
 assert.match(pdf,/276\+i\*330/);
 const lastCardBottom=276+2*330+306;
 const pageHeight=1414,footerLine=pageHeight-101;
 assert.ok(lastCardBottom+40<footerLine,
  'The third animal card must not overlap the numbered footer');
});
