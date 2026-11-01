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
;({nameGreekFromLatin,validLatinName,validGreek,score,nameLatin,validSourceName,sourceNameIsLatin})
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
test('English original is accepted directly without Russian-name guessing',()=>{
 assert.equal(api.validSourceName('Fraser Harold Brown'),true);
 assert.equal(api.validSourceName('Гарольд Фрейзер Браун'),true);
 assert.equal(api.validSourceName('Фрейзер Brown'),false,'never mix alphabets');
 assert.equal(api.validSourceName('Fraser5 Brown'),false);
 assert.equal(api.validLatinName('Fraser Harold Brown'),true);
 assert.equal(api.sourceNameIsLatin('Fraser Harold Brown'),true);
 assert.equal(api.nameLatin('Fraser Harold Brown'),'Fraser Harold Brown');
 assert.equal(api.nameLatin("O'Connor-Jones"),"O'Connor-Jones");
 assert.equal(api.nameGreekFromLatin(api.nameLatin('Fraser Harold Brown')),
              'Φρασερ Ἁρολδ Βροϝν');
});
test('Canonical English names are retained instead of mechanical spelling guesses',()=>{
 assert.equal(api.nameLatin('Гарольд Фрейзер Браун'),'Harold Fraser Brown');
 assert.equal(api.nameLatin('Фрейзер Гарольд Браун'),'Fraser Harold Brown');
 assert.equal(api.nameLatin('Элла Мария Уиллоу'),'Ella Maria Willow');
 assert.equal(api.nameLatin('Илайн Эли Нельсон'),'Elaine Eli Nelson');
 assert.equal(api.nameLatin('Май Иордекэску'),'Mai Iordăchescu');
 assert.equal(api.nameLatin('Пример'),'Primer', 'unknown words use ordinary editable romanisation');
 assert.equal(api.nameGreekFromLatin('Harold'), 'Ἁρολδ');
 assert.equal(api.score(api.nameGreekFromLatin(api.nameLatin('Фрейзер Гарольд Браун'))),1339);
});
test('Latin names containing diacritics are preserved; Greek score uses their base letters',()=>{
 const original='Mai Iordăchescu';
 assert.equal(api.sourceNameIsLatin(original),true);
 assert.equal(api.validLatinName(original),true);
 assert.equal(api.nameLatin(original),original);
 assert.equal(api.nameGreekFromLatin(original),api.nameGreekFromLatin('Mai Iordachescu'));
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
 assert.ok(html.includes('Если известен английский оригинал, введи его сразу латиницей'));
 assert.ok(!html.includes('placeholder="Φρέιζερ Ἁρολδός Βρούν"'));
});
