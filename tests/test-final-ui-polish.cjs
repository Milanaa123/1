'use strict';
// Product acceptance: one unified animal atlas and clean, nontechnical cards.
// Calculations, original photographs, numerical audit data and exports are retained.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const chooser=fs.readFileSync(path.join(root,'relic_features.js'),'utf8');
const photos=fs.readFileSync(path.join(root,'photo_gallery.js'),'utf8');
const css=fs.readFileSync(path.join(root,'magic_theme.css'),'utf8');
const previews=fs.readFileSync(path.join(root,'approved_only_cards_400.js'),'utf8');

test('every matching animal belongs to one chooser without image-status filters',()=>{
 assert.ok(html.includes('id="animalChooserList"'));
 assert.ok(html.includes('id="animalChooserGroups"'));
 assert.ok(!html.includes('id="chooserFilterIllustrated"'));
 assert.ok(!html.includes('id="chooserFilterAll"'));
 assert.ok(!html.includes('id="animalChooserArtNotice"'));
 assert.ok(!html.includes('animal-chooser-footnote'));
 assert.ok(!chooser.includes('onlyIllustrated'));
 assert.ok(!chooser.includes('chooserFilterIllustrated'));
 assert.ok(!chooser.includes('chooserFilterAll'));
 assert.ok(!chooser.includes('animal-chooser-art-ready'));
 assert.ok(!chooser.includes('animal-chooser-art-pending'));
 assert.ok(!chooser.includes("Рисунка нет"));
 assert.ok(chooser.includes('return safeRows();'),'Do not prioritize illustrated animals over others');
 assert.ok(chooser.includes("sparkle.className='animal-chooser-sparkle'"));
 assert.ok(css.includes('.animal-chooser-sparkle'));
 assert.ok(chooser.includes('limit+=48'),'Keep all result pages available');
});
test('technical methodology is only visible inside the name-entry panel',()=>{
 const inputEnd=html.indexOf('</section><aside',html.indexOf('<div class="layout">'));
 const result=html.indexOf('id="resultPanel"');
 assert.ok(inputEnd>0&&result>inputEnd);
 for(const id of ['audit','qualityPanel','compareDetails','letterBreakdown',
   'qualityAuditSummary','qualityAuditGroups','catalogVersion','catalogCount']){
  const first=html.indexOf('id="'+id+'"');
  assert.ok(first>0&&first<inputEnd,id+' must live by the name fields');
  assert.equal(html.split('id="'+id+'"').length-1,1,'Only one '+id);
 }
 assert.ok(html.indexOf('id="relicLaboratory"')>result);
 const outside=html.slice(result);
 for(const token of ['технический отчёт','контрольные суммы каталога','SHA-256',
   'Надёжность расчётов','id="chooserFilterIllustrated"','id="chooserFilterAll"']){
  assert.ok(!outside.includes(token),'Technical content outside name fields: '+token);
 }
 assert.match(html,/class="method-shelf"/);
});
test('group art has modest caption but still never claims a specific species portrait',()=>{
 assert.match(chooser,/Образ родственной группы/);
 assert.match(chooser,/Золотой рисунок/);
 assert.ok(!chooser.includes('с рисунком именно этого вида ·'));
 assert.ok(!chooser.includes('с изображением другого вида/общим образом'));
 assert.ok(!chooser.includes('Обобщённый образ группы · не рисунок выбранного вида'));
 assert.ok(previews.includes("p.exact===true?'✧ Золотой рисунок':'✧ Образ группы'"));
 assert.ok(previews.includes('не изображение вида'),'Scientific identity retained for screen readers');
});
test('TOP-30 is still the original verified iNaturalist photographic experience',()=>{
 assert.ok(photos.includes('photoCheckImage(match.preview||match.src,stamp)'));
 assert.ok(photos.includes("photoButton.textContent='Посмотреть фотографию'"));
 assert.ok(photos.includes("link.href=item.photo.source"));
 assert.ok(photos.includes('const PHOTO_TARGET = 30'));
 assert.ok(!photos.includes('bestiary-verification'));
 assert.ok(!photos.includes('bestiary-name-origin'));
 assert.ok(!photos.includes('atlas.render(drawing,profile)'));
 assert.match(html,/photo_gallery\.js\?v=clean-bestiary-20261102/);
 assert.match(html,/magic_theme\.css\?v=unified-atlas-polish-20261102/);
});
test('card and file-download controls remain reachable',()=>{
 for(const id of ['relicCardBackdrop','relicAnimal','animalChooserOpen',
   'downloadRelic','printRelic','printRelicList','exportTxt','exportCsv','printPdf',
   'featuredCount','galleryStatus','groupFilter','greekMethodWeightsBody']){
  assert.ok(html.includes('id="'+id+'"'),id);
 }
 assert.match(chooser,/canvas\.width=1200;canvas\.height=2000/);
 assert.match(chooser,/window\.print\(\)/);
});
