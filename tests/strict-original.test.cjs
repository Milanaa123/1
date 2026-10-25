'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname,'..');
const a = fs.readFileSync(path.join(root,'app.js'),'utf8');
const b = fs.readFileSync(path.join(root,'enhancements.js'),'utf8');
const fakeDocument = {addEventListener(){}};
const ctx = vm.runInNewContext(a+'\n'+b+'\n({score,scoreLatin,scoreMixed,validGreek,transcribe,inspectImage,featured})',
  {document:fakeDocument,URL});
test('preserves old Latin letter table exactly',()=>{
  const expected=[['a',1],['b',2],['c',90],['d',4],['f',500],['h',600],
    ['j',4],['q',90],['v',6],['w',6],['x',600],['y',400]];
  for(const [letter,value] of expected)assert.equal(ctx.scoreLatin(letter),value,letter);
});
test('original Python Latin scientific name totals',()=>{
  for(const [s,n] of [['Naja oxiana',788],['Anolis cooki',621],
    ['Panthera uncia',1688],['Ourebia montana',1100]])
    assert.equal(ctx.scoreLatin(s),n,s);
});
test('corrected historical numerals and methodical 598 difference',()=>{
  for(const [s,n] of [['ιετυ',715],['ραβδι',117],['φϟη',598],['ς',200],
    ['σ',200],['ϛ',6],['ϝ',6],['ϙ',90],['ϟ',90],['ϡ',900]])
    assert.equal(ctx.score(s),n,s);
  assert.equal(ctx.score('ιετυ')-ctx.score('ραβδι'),598);
});
test('Russian phonetic Greek transliteration with manual correction support',()=>{
  for(const [n,s] of [['Фрейзер Гарольд Браун',2619],
    ['Нерис Фостер Берриклот',2195],['Илайн Эли Нельсон',551]])
    assert.equal(ctx.score(ctx.transcribe(n)),s,n);
  assert.equal(ctx.validGreek('φϟη'),true);
  assert.equal(ctx.validGreek('греческий'),false);
  assert.equal(ctx.validGreek('ϗ'),false);
});
test('30 distinct records or all when fewer',()=>{
  const rows=Array.from({length:50},(_,i)=>[551,'Differentus'+i+' albus','species','Aves','Passeriformes','','Chordata']);
  assert.equal(ctx.featured(rows).length,30);
  assert.equal(ctx.featured(rows.slice(0,9)).length,9);
});
test('photo result must be exact taxon with open license',()=>{
  const valid={name:'Panthera uncia',rank:'species',id:99,
    default_photo:{license_code:'cc-by',attribution:'Photographer',medium_url:'https://static.inaturalist.org/photos/10/medium.jpg'}};
  assert.ok(ctx.inspectImage({results:[valid]},'Panthera uncia','species'));
  assert.equal(ctx.inspectImage({results:[valid]},'Panthera leo','species'),null);
  assert.equal(ctx.inspectImage({results:[{...valid,default_photo:{...valid.default_photo,license_code:'none'}}]},
    'Panthera uncia','species'),null);
});
test('privacy and large catalogue only',()=>{
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  assert.doesNotMatch(html,/option value="original"/);
  assert.doesNotMatch(html,/id="method"/);
  assert.match(html,/Catalogue of Life XR 2026-08-26/);
  assert.match(html,/Например: Фрейзер Гарольд Браун/);
  assert.match(html,/id="printPdf"/);
  assert.match(html,/id="letterBreakdown"/);
  assert.match(html,/id="groupFilter"/);
  assert.doesNotMatch(a+b,/localStorage|sessionStorage/);
  assert.doesNotMatch(b,/original_animals\.json/);
});
