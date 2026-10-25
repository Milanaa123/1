'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

// Tests run without a browser, downloads, services, or storing anyone's name.
const script = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const api = vm.runInNewContext(script + '\n;({score, transcribe, validGreek, breakdown})', {
  document: {addEventListener() {}}
});

const cases = [
  ['Фрейзер Гарольд Браун', 2619],
  ['Нерис Фостер Берриклот', 2195],
  ['Илайн Эли Нельсон', 551],
  ['Эйк Льюис Эйвери', 887],
  ['Льюис Этан Эйвери', 922]
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
  assert.equal(api.score('Φρέιζερ Χάρολντ Μπράουν'), 2619);
  assert.equal(api.score('Φρειζερ Χαρολντ Μπραουν'), 2619);
  assert.equal(api.score('Ιλάιν Έλι Νέλσον'), 551);
});
test('греческое поле отвергает латиницу и кириллицу', () => {
  assert.equal(api.validGreek('Φρέιζερ Χάρολντ Μπράουν'), true);
  assert.equal(api.validGreek('Harold'), false);
  assert.equal(api.validGreek('Φρέιζερ Harold'), false);
  assert.equal(api.validGreek('Илайн'), false);
  assert.equal(api.validGreek(''), false);
});
test('интерфейс без кнопок сохранённых имён и с правильным примером', () => {
  const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
  assert.ok(html.includes('Например: Фрейзер Гарольд Браун'));
  assert.ok(html.includes('Используй все имена'));
  assert.ok(html.includes('Данные не сохраняются'));
  assert.ok(!html.includes('data-example='));
  assert.ok(!script.includes('localStorage'));
  assert.ok(!script.includes('sessionStorage'));
});
