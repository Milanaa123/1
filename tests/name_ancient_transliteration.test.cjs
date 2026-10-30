'use strict';
// The name must be transliterated from the manually verified Latin spelling:
// no English pronunciation guesses, no person-specific exceptions, no -ος.
// Scientific animal index scoring and its existing version must not change.
const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const script=fs.readFileSync(path.join(root,'app.js'),'utf8');
const ctx={document:{addEventListener(){}}};
const api=vm.runInNewContext(script+`
;({nameGreekFromLatin,validLatinName,validGreek,score,nameLatin})
`,ctx,{filename:'app.js'});
const keycases=[
 ['Fraser','Φρασερ',906],
 ['Harold','Ἁρολδ',205],
 ['Brown','Βροϝν',228],
 ['Harold Fraser Brown','Ἁρολδ Φρασερ Βροϝν',1339],
 ['Fraser Harold Brown','Φρασερ Ἁρολδ Βροϝν',1339],
 ['Ella','Ἐλλα',null],
 ['Amelia','Ἀμελια',null],
 ['Philip','Φιλιπ',null],
 ['Rhys','Ῥυς',null],
 ['Steven','Στεϝεν',null],
 ['Chloe','Χλοι',null],
 ['Aiden','Αἰδεν',null],
 ['Helen','Ἑλεν',null]
];
for(const [latin,expected,number] of keycases){
 test('Latin -> classical alphabet: '+latin,()=>{
  assert.equal(api.nameGreekFromLatin(latin),expected);
  assert.ok(api.validGreek(expected),expected+' must pass score validation');
  if(number!==null)assert.equal(api.score(expected),number);
 });
}
test('no English phonetic overrides or automatic Greek suffixes',()=>{
 const literal=api.nameGreekFromLatin('Fraser Harold Brown');
 assert.ok(!literal.includes('ειζερ'),'aser must not change the vowel or s');
 assert.ok(!literal.includes('αου'),'ow must not guess a diphthong');
 assert.ok(!literal.includes('ος'),'names are not automatically Hellenised');
 assert.equal(api.nameGreekFromLatin('Brown'), 'Βροϝν');
 assert.notEqual(api.nameGreekFromLatin('Brown'),'Μπραουν');
});
test('Latin input is human-approved, Russian->Latin is only a hint',()=>{
 assert.equal(api.validLatinName('Fraser Harold Brown'),true);
 assert.equal(api.nameLatin('Гарольд Фрейзер Браун'),'Garold Freyzer Braun');
 assert.equal(api.nameGreekFromLatin('Harold'), 'Ἁρολδ');
});
test('Greek digit sum ignores smooth and rough breathings',()=>{
 assert.equal(api.score('Ἁρολδ'),api.score('Αρολδ'));
 assert.equal(api.score('Ἀμελια'),api.score('Αμελια'));
});
test('scientific Greek spelling does not get changed by user-name transliteration',()=>{
 const src=fs.readFileSync(path.join(root,'greek_taxa.js'),'utf8');
 const animal=vm.runInNewContext(src+';taxonGreek("Fraser brown")',{});
 assert.equal(animal,'φρασερ βροϝν');
 assert.equal(api.score(api.nameGreekFromLatin('Fraser Brown')),api.score(animal));
 assert.equal(fs.readFileSync(path.join(root,'greek_taxa.py'),'utf8').includes('taxon-ancient-alphabet-v2'),true);
});
test('visible example accurately explains written transliteration',()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 assert.ok(html.includes('Harold Fraser Brown → Ἁρολδ Φρασερ Βροϝν'));
 assert.ok(html.includes('транслитерация латинских букв'));
 assert.ok(!html.includes('placeholder="Φρέιζερ Ἁρολδός Βρούν"'));
});
