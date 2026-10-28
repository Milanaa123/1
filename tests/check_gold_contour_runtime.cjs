'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const script=fs.readFileSync(path.join(__dirname,'..','gold_contour_40.js'),'utf8');
class FakePath2D { constructor(d){assert.match(d,/^M/);this.d=d;} }
const ctxWindow={};
vm.runInNewContext(script,{window:ctxWindow,Path2D:FakePath2D});
const api=ctxWindow.AnimagiaGoldContour40;
assert.equal(api.count,40);assert.equal(api.levels,5);
assert.equal(api.method,'original-mask-multilevel-vector-trace');
let count=0;
const fake={save(){},restore(){},translate(){},scale(){},set fillStyle(x){this._fill=x;},set globalAlpha(x){this._alpha=x;},fill(path,rule){assert.equal(rule,'evenodd');assert.match(path.d,/^M/);count++;}};
for(let cell=0;cell<40;cell++)assert.equal(api.draw(fake,cell,0,0,790,570),true,'vector cell '+(cell+1));
assert.equal(api.draw(fake,40,0,0,790,570),false);
assert.equal(count,40*5);
for(const [a,b] of [[41,60],[61,80],[81,100]]){
 const src=fs.readFileSync(path.join(__dirname,'..',`gold_contour_${a}_${b}.js`),'utf8');
 const win={};vm.runInNewContext(src,{window:win,Path2D:FakePath2D});
 const api=win[`AnimagiaGoldContour${a}_${b}`];
 assert.equal(api.count,20);assert.equal(api.levels,5);
 assert.equal(api.method,'original-mask-multilevel-vector-trace');
 assert.equal(api.draw(fake,a-2,0,0,790,570),false);
 for(let cell=a-1;cell<b;cell++)
  assert.equal(api.draw(fake,cell,0,0,790,570),true,'vector cell '+(cell+1));
 assert.equal(api.draw(fake,b,0,0,790,570),false);
}
assert.equal(count,100*5);
console.log('100_ANIMAGIA_TRACED_CANVAS_PATHS_VERIFIED',count);