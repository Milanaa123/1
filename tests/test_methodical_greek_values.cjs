'use strict';
// Independent regression based on the user's screenshot of the Transfiguration
// table. The table describes GREEK letters only, not English transliteration.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
const source=fs.readFileSync(path.join(root,'greek_weights_reference.js'),'utf8');
const table=[
 ['α',1],['β',2],['γ',3],['δ',4],['ε',5],['ϝ',6],
 ['ϛ',6],['ζ',7],['η',8],['θ',9],['ι',10],['κ',20],
 ['λ',30],['μ',40],['ν',50],['ξ',60],['ο',70],['π',80],
 ['ϙ',90],['ϟ',90],['ρ',100],['σ',200],['ς',200],['τ',300],
 ['υ',400],['φ',500],['χ',600],['ψ',700],['ω',800],['ϡ',900]
];
const ctx={document:{addEventListener(){}}};
const api=vm.runInNewContext(app+'\n;({score,validGreek,W,nameLatin,scoreLatin})',ctx);
test('every Greek letter from the supplied methodical table has the exact value',()=>{
 for(const [letter,value] of table){
  assert.equal(api.W[letter],value,letter);
  assert.equal(api.score(letter),value,letter);
  assert.ok(api.validGreek(letter),letter);
  assert.equal(api.score(letter.toUpperCase()),value,letter+' uppercase');
 }
 assert.equal(api.score('Άά Έέ Ήή Ίί Όό Ύύ Ώώ'),
   2*(1+5+8+10+70+400+800));
});
test('all archaic numerals and final sigma are counted, Greek only',()=>{
 assert.equal(api.score('Ϝ'),6);
 assert.equal(api.score('Ϛ'),6);
 assert.equal(api.score('Ϙ'),90);
 assert.equal(api.score('Ϟ'),90);
 assert.equal(api.score('Ϡ'),900);
 assert.equal(api.score('ς'),200);
 assert.equal(api.score('Σ'),200);
 assert.equal(api.validGreek('Fraser Brown'),false);
 assert.equal(api.validGreek('Φρασερ Ἁρολδ Βροϝν'),true);
});
test('methodical sample verifies sum and subtraction, without typographical 589',()=>{
 assert.equal(api.score('ιετυ'),715);
 assert.equal(api.score('ραβδι'),117);
 assert.equal(api.score('ιετυ')-api.score('ραβδι'),598);
 assert.equal(api.score('φϟη'),598);
 assert.notEqual(api.score('φϟη'),589);
});
test('the displayed Greek reference table is generated from the SAME calculator weights',()=>{
 const domBody={
  children:[],
  replaceChildren(fragment){this.children=[...fragment.children]}
 };
 const makeNode=tag=>({
  tag,textContent:'',children:[],
  append(...children){this.children.push(...children)}
 });
 const dom={
  getElementById:id=>id==='greekMethodWeightsBody'?domBody:null,
  createElement:makeNode,
  createDocumentFragment:()=>makeNode('fragment'),
  addEventListener(){}
 };
 vm.runInNewContext(app+'\n'+source,{document:dom},{filename:'reference.js'});
 assert.equal(domBody.children.length,table.length);
 const shown=domBody.children.map(row=>({
  letter:row.children[0].textContent.trim().split(' ').slice(-1)[0],
  value:Number(row.children[2].textContent)
 }));
 for(const [letter,value] of table){
  assert.ok(shown.some(row=>row.letter===letter&&row.value===value),
   'Visible methodical row '+letter+' must have '+value);
 }
});
test('English-name spelling and Greek scoring are not numerically conflated',()=>{
 assert.equal(api.nameLatin('Фрейзер Гарольд Браун'),'Fraser Harold Brown');
 assert.notEqual(api.scoreLatin('Fraser Harold Brown'),api.score('Φρασερ Ἁρολδ Βροϝν'));
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const build=fs.readFileSync(path.join(root,'build_data.py'),'utf8');
 assert.match(html,/greekMethodWeightsBody/);
 assert.match(html,/greek_weights_reference\.js\?v=/);
 assert.match(build,/greek_weights_reference\.js/);
});
