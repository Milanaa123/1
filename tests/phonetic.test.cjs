'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

// Tests run without a browser, downloads, services, or storing anyone's name.
const script = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const api = vm.runInNewContext(script + '\n;({score, transcribe, validGreek, breakdown, featured, display})', {
  document: {addEventListener() {}}
});

const cases = [
  ['Фрейзер Гарольд Браун', 1558],
  ['Нерис Фостер Берриклот', 2177],
  ['Илайн Эли Нельсон', 551],
  ['Эйк Льюис Эйвери', 891],
  ['Льюис Этан Эйвери', 1212]
];

for (const [name, value] of cases) {
  test('фонетическая транскрипция: ' + name, () => {
    const greek = api.transcribe(name);
    assert.ok(api.validGreek(greek), 'expected Greek letters: ' + greek);
    assert.equal(api.score(greek), value, greek);
    assert.equal(api.score(greek.toLowerCase()), value);
  });
}
test('ударения и конечная сигма не влияют на число', () => {
  assert.equal(api.score('Φρειζερ Χάρολδ Βράουν'), 2155);
  assert.equal(api.score('Φρειζερ Χαρολδ Βραουν'), 2155);
  assert.equal(api.score('Ιλάιν Έλι Νέλσον'), 551);
});
test('греческое поле отвергает латиницу и кириллицу', () => {
  assert.equal(api.validGreek('Φρειζερ Χάρολδ Βράουν'), true);
  assert.equal(api.validGreek('Harold'), false);
  assert.equal(api.validGreek('Φρέιζερ Harold'), false);
  assert.equal(api.validGreek('Илайн'), false);
  assert.equal(api.validGreek(''), false);
});
test('интерфейс без кнопок сохранённых имён и с правильным примером', () => {
  const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
  assert.ok(html.includes('Гарольд Фрейзер Браун'));
  assert.ok(html.includes('Введи все имена и фамилию'));
  assert.ok(html.includes('Автоматическая запись приблизительна'));
  assert.ok(!html.includes('data-example='));
  assert.ok(!script.includes('localStorage'));
  assert.ok(!script.includes('sessionStorage'));
});


test('подборка показывает 30 разных видов при наличии 30+ совпадений', () => {
  const species=Array.from({length:65},(_,i)=>[
    551,'Testus species'+String(i),'species',
    i<6?'Mammalia':i<14?'Aves':i<22?'Reptilia':i<35?'Arachnida':'Insecta',
    i<6?'Carnivora':i<35?'Araneae':'Lepidoptera','','Arthropoda'
  ]);
  const selected=api.featured(species);
  assert.equal(selected.length,30);
  assert.equal(new Set(selected.map(r=>r[1])).size,30);
  assert.ok(selected.some(r=>r[3]==='Mammalia'));
  assert.ok(selected.some(r=>r[3]==='Aves'));
});
test('если точных животных меньше 30, не добавляются вымышленные',()=>{
  const rows=Array.from({length:12},(_,i)=>[551,'Testus exemplar'+i,'species','Aves','Passeriformes','','Chordata']);
  assert.equal(api.featured(rows).length,12);
});
test('все основные названия в подборке написаны кириллицей',()=>{
  const rows=[
    [551,'Arctosa capensis','species','Arachnida','Araneae','','Arthropoda'],
    [551,'Gekko hulk','species','Reptilia','Squamata','','Chordata'],
    [551,'Mysteriella alfatica','species','Insecta','Coleoptera','','Arthropoda']
  ];
  for(const row of rows){
    const label=api.display(row);
    assert.match(label,/[А-Яа-яЁё]/);
    assert.doesNotMatch(label,/[A-Za-z]/);
  }
});
test('непризнанные русские имена не маскируются под официальные',()=>{
  const row=[551,'Arctosa capensis','species','Arachnida','Araneae','','Arthropoda'];
  assert.equal(api.display(row),'Паук-волк');
  assert.equal(row[1],'Arctosa capensis','Scientific identity must remain available separately');
});


test('при большом количестве разных таксонов сначала выбираются интересные группы',()=>{
  const groups=['Mammalia','Aves','Reptilia','Amphibia','Teleostei','Arachnida','Insecta'];
  const rows=Array.from({length:260},(_,i)=>{
    const cls=groups[i%groups.length];
    return [2195,'Differentgenus'+i+' epithet'+i,'species',cls,
      cls==='Arachnida'?'Scorpiones':cls==='Insecta'?'Lepidoptera':'', '', 'Chordata'];
  });
  for(let i=0;i<50;i++)rows.push([2195,'Obscurus'+i+' specimen'+i,'species','Chromadorea','Rhabditida','','Nematoda']);
  const list=api.featured(rows);
  assert.equal(list.length,30);
  assert.ok(list.every(row=>groups.includes(row[3])),'obscure animals should not displace 30 interesting matches');
});
test('в русском заголовке нет букв латинского алфавита даже у неопознанного вида',()=>{
  assert.doesNotMatch(api.display([887,'Mysteriella novissima','species','','','','']),/[A-Za-z]/);
});
