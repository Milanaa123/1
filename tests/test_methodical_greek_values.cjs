'use strict';
// Two complete pages of the user's Transfiguration methodical table:
// Greek numeral values (only these are scored), plus Latin/Cyrillic hints.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
const source=fs.readFileSync(path.join(root,'greek_weights_reference.js'),'utf8');
const ctx={document:{addEventListener(){}}};
const api=vm.runInNewContext(app+'\n;({score,validGreek,W,nameLatin,scoreLatin})',ctx);
const table=[
 // lower case, exact number shown, Romanized hint, Russian hint
 ['α',1,'A','а'],['β',2,'B','б'],['γ',3,'G','г'],
 ['δ',4,'D','д'],['ε',5,'E','е'],
 ['ϝ',6,'—','в/ф'],['ϛ',6,'—','ст'],
 ['ζ',7,'Z','дз'],['η',8,'E','е'],
 ['θ',9,'TH','т'],['ι',10,'I','и'],
 ['κ',20,'K','к'],['λ',30,'L','л'],['μ',40,'M','м'],
 ['ν',50,'N','н'],['ξ',60,'X','кс'],['ο',70,'O','о'],
 ['π',80,'P','п'],['ϙ',90,'Q','к'],['ϟ',90,'Q','к'],
 ['ρ',100,'R','р'],['σ',200,'S','с'],['ς',200,'S','с'],
 ['τ',300,'T','т'],['υ',400,'U','умляут'],
 ['φ',500,'PH','ф'],['χ',600,'CH','х'],['ψ',700,'PS','пс'],
 ['ω',800,'O','о'],['ϡ',900,'[si], [ks], [ts]','сс']
];
test('all numbered symbols match the Greek numerals in the two-page methodical table',()=>{
 for(const [letter,value] of table){
  assert.equal(api.W[letter],value,letter);
  assert.equal(api.score(letter),value,letter);
  assert.equal(api.score(letter.toUpperCase()),value,letter+' uppercase');
  assert.equal(api.validGreek(letter),true);
 }
 assert.equal(api.score('Άά Έέ Ήή Ίί Όό Ύύ Ώώ'),
   2*(1+5+8+10+70+400+800));
 assert.equal(api.score('ς'),200);
 assert.equal(api.score('ϜϚ'),12,'digamma and stigma are distinct spellings worth six each');
 assert.equal(api.score('ϘϞ'),180,'two written koppa variants each worth 90');
});
test('the source gives NO number for Sho or San; do not invent a value of zero',()=>{
 for(const symbol of ['Ϸ','ϸ','Ϻ','ϻ']){
  assert.equal(api.W[symbol],undefined,'no number is assigned to '+symbol);
  assert.equal(api.validGreek(symbol),false,'do not accept unnumbered '+symbol+' as Greek numeral');
 }
});
test('historical control example is 598, not printed typo 589',()=>{
 assert.equal(api.score('ιετυ'),715);
 assert.equal(api.score('ραβδι'),117);
 assert.equal(api.score('ιετυ')-api.score('ραβδι'),598);
 assert.equal(api.score('φϟη'),598);
});
test('the five-column rendered table matches each source symbol and its numeric weight',()=>{
 const body={children:[],replaceChildren(frag){this.children=[...frag.children]}};
 const node=tag=>({tag,textContent:'',className:'',children:[],append(...children){this.children.push(...children)}});
 const doc={
  addEventListener(){},
  getElementById:id=>id==='greekMethodWeightsBody'?body:null,
  createElement:node,createDocumentFragment:()=>node('fragment')
 };
 vm.runInNewContext(app+'\n'+source,{document:doc},{filename:'greek-reference.js'});
 assert.equal(body.children.length,table.length+2,'30 numeric variants + 2 unnumbered letters');
 const byLetter=body.children.map(x=>({
  cells:x.children.map(cell=>cell.textContent),className:x.className
 }));
 for(const [letter,value,english,russian] of table){
  assert.ok(byLetter.some(x=>
   x.cells[0].split(' ').at(-1)===letter &&
   x.cells[2]===String(value) &&
   x.cells[3]===english &&
   x.cells[4]===russian
  ),'full source row '+letter+' must have '+value+' / '+english+' / '+russian);
 }
 const unnumbered=byLetter.filter(x=>x.className==='greek-method-unnumbered');
 assert.deepEqual(unnumbered.map(x=>x.cells[1]),['шо','сан']);
 assert.deepEqual(unnumbered.map(x=>x.cells[2]),['—','—']);
 assert.deepEqual(unnumbered.map(x=>x.cells[4]),['ш','ц/с']);
 assert.equal(unnumbered[0].cells[0],'Ϸ ϸ');
 assert.equal(unnumbered[1].cells[0],'—','no Greek glyph is printed in the provided San row');
 for(const row of body.children)assert.equal(row.children.length,5);
});
test('the website explains alphabet correspondences are NOT English-name scoring rules',()=>{
 assert.equal(api.nameLatin('Фрейзер Гарольд Браун'),'Fraser Harold Brown');
 assert.notEqual(api.scoreLatin('Fraser Harold Brown'),api.score('Φρασερ Ἁρολδ Βροϝν'));
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const build=fs.readFileSync(path.join(root,'build_data.py'),'utf8');
 assert.match(html,/greekMethodWeightsBody/);
 assert.match(html,/Англ. аналог/);
 assert.match(html,/Рус. аналог/);
 assert.match(html,/не правило перевода английского имени/);
 assert.match(html,/greek_weights_reference\.js\?v=full-method-table-five-columns/);
 assert.match(build,/greek_weights_reference\.js/);
});
