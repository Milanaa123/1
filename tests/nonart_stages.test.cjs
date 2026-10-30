'use strict';
// Release regressions for the user-requested non-artwork stages only.
// Browser integration and exported binary verification are performed separately.
const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const app=fs.readFileSync('app.js','utf8');
const greek=fs.readFileSync('greek_taxa.js','utf8');
const ecology=fs.readFileSync('animal_atlas.js','utf8');
const page=fs.readFileSync('index.html','utf8');
const css=fs.readFileSync('magic_theme.css','utf8');
const renderer=fs.readFileSync('relic_features.js','utf8');
const context=vm.createContext({
 window:{},
 document:{addEventListener(){}},
});
vm.runInContext(app,context,{filename:'app.js'});
vm.runInContext(greek,context,{filename:'greek_taxa.js'});
vm.runInContext(ecology,context,{filename:'animal_atlas.js'});
const row=(latin,klass='Mammalia',order='Carnivora',family='')=>
 [9999,latin,'species',klass,order,'','Chordata',family,'',''];
function script(s){return vm.runInContext(s,context);}
test('Greek name and animal scoring did not change',()=>{
 assert.equal(script("taxonGreekScore('Canis lupus')"),1531);
 assert.equal(script("taxonGreekScore('Ursus arctos')"),2131);
 assert.equal(script("score('Φρέιζερ Ἁρολδός Βρούν')"),1824);
});
test('Six individually sourced Russian animal names, no invented generic fallback',()=>{
 const exact={
  'Polyodon spathula':'Веслонос',
  'Oncorhynchus mykiss':'Радужная форель',
  'Paracanthurus hepatus':'Голубой хирург',
  'Mobula birostris':'Гигантский морской дьявол',
  'Vampyroteuthis infernalis':'Адский вампир',
  'Holothuria tubulosa':'Трубчатая голотурия',
 };
 for(const [scientific,common] of Object.entries(exact)){
  assert.equal(script('display('+JSON.stringify(row(scientific))+')'),common);
 }
 assert.equal(script('display('+JSON.stringify(row('Erosa erosa'))+')'),'Erosa erosa');
 assert.equal(script('verifiedRussianName('+JSON.stringify(
  [...row('Polyodon spathula').slice(0,9),'Название в самом источнике'])+')'),'Название в самом источнике',
  'Catalogue evidence takes precedence over display fallback');
 assert.ok(!app.includes('localStorage.setItem('));
});
test('Ecological metadata is independent of whether approved artwork exists',()=>{
 const atlas=context.window.AnimagiaAnimalAtlas;
 const val=(r)=>atlas.style(atlas.classify(r));
 assert.equal(val(row('Ursus arctos')).diet,'omnivore');
 assert.equal(val(row('Ursus arctos')).habitat,'terrestrial');
 assert.equal(val(row('Chelonia mydas','Reptilia','Testudines')).diet,'herbivore');
 assert.equal(val(row('Caretta caretta','Reptilia','Testudines')).diet,'predator');
 assert.equal(val(row('Polyodon spathula','Chondrostei','Acipenseriformes')).habitat,'aquatic');
 assert.equal(val(row('Polyodon spathula','Chondrostei','Acipenseriformes')).diet,'unknown');
 assert.equal(val(row('Suncus etruscus','Mammalia','Eulipotyphla')).diet,'unknown',
  'Unknown species must not be assigned a diet without evidence');
});
test('Only mobile scroll overflow is clipped, not layout or card geometry',()=>{
 assert.ok(css.includes('html{overflow-x:clip}'));
 assert.match(page,/magic_theme\.css\?v=mobile-overflow-clip-20261030/);
 assert.match(page,/app\.js\?v=verified-six-russian-names-20261030/);
 assert.match(page,/id="relicCardBackdrop"[^>]+width="1200" height="2000"/);
});
test('Saving different species with the same number generates distinct PNG filenames',()=>{
 const start=renderer.indexOf(' function cardDownloadFilename(');
 const end=renderer.indexOf(' async function savePNG(',start);
 assert.ok(start>=0 && end>start);
 const filename=vm.runInNewContext(renderer.slice(start,end)+
  ';cardDownloadFilename', {});
 assert.equal(filename(1531,[1531,'Canis lupus']),
  'Анимагия_форма_1531_Canis_lupus.png');
 assert.equal(filename(1531,[1531,'Chinchilla lanigera']),
  'Анимагия_форма_1531_Chinchilla_lanigera.png');
 assert.notEqual(filename(1531,[1531,'Canis lupus']),
  filename(1531,[1531,'Chinchilla lanigera']));
 assert.ok(renderer.includes('const filename=cardDownloadFilename(sum,row)'));
});
test('Existing PNG and PDF mechanisms stay in the same code path',()=>{
 assert.ok(renderer.includes('async function composeScreenCard(row)'));
 assert.ok(renderer.includes("canvas.toBlob(resolve,'image/png')"));
 assert.ok(renderer.includes("async function printBooklet(status)"));
 assert.ok(renderer.includes('window.print()'));
 assert.ok(renderer.includes('await gallery.drawable(illustration)'));
 assert.match(page,/id="downloadRelic"/);
 assert.match(page,/id="printRelic"/);
});
