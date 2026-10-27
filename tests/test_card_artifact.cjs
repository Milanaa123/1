'use strict';
// Stage-one poster acceptance tests. Run with: node --test tests/test_card_artifact.cjs
const fs=require('node:fs'),test=require('node:test'),assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8');
const styles=fs.readFileSync('relic_card_stage1.css','utf8');
const js=fs.readFileSync('relic_features.js','utf8');
const build=fs.readFileSync('build_data.py','utf8');
const preview=js.slice(js.indexOf(' function paintCardBackdropOnScreen('),
 js.indexOf(' function textLines('));
const download=js.slice(js.indexOf(' async function savePNG('),
 js.indexOf(' async function compareOne('));
const poster=js.slice(js.indexOf(' function paintFinishedCard('),
 js.indexOf(' let posterSerial=',js.indexOf(' function paintFinishedCard(')));
test('Screen and downloadable card use one exact frame painter and 1200x2000 portrait geometry',()=>{
 assert.match(html,/id="relicCardBackdrop"[^>]+width="1200" height="2000"/);
 assert.ok(html.includes('class="relic-card-masthead"'));
 assert.ok(styles.includes('aspect-ratio:3 / 5'));
 assert.ok(js.includes('function paintCardBackdrop(ctx,number,diet)'));
 assert.ok(js.includes('ctx.scale(1,2000/2070)'));
 assert.ok(preview.includes('paintCardBackdrop(ctx,typeof sum'));
 assert.ok(poster.includes('paintCardBackdrop(ctx,cardNumber,styl.diet)'));
 assert.ok(js.includes('canvas.width=1200;canvas.height=2000'));
 assert.ok(download.includes("get('relicCardBackdrop')"));
 assert.ok(build.includes("copy2(BASE/'relic_card_stage1.css',DEST/'relic_card_stage1.css')"));
 assert.match(html,/relic_card_stage1.css\?v=/);
});
test('The favored magic circle remains the established, unchanged algorithm',()=>{
 assert.ok(js.includes('function decorateSVG(svg,n,greekName)'));
 assert.ok(js.includes('function paintSeal(ctx,n,x,y,r,greekName)'));
 assert.ok(js.includes('for(const scale of [.97,.91,.72,.68,.46])'));
 assert.ok(poster.includes("paintSeal(ctx,cardNumber,600,505,300,greek)"));
 assert.ok(js.includes('for(const rad of [156,147,119,109,77])'));
 assert.ok(styles.includes('.relic-seal-wrap>.personal-seal'));
 assert.ok(js.includes('function wheelLetters(greekName)'));
 assert.ok(js.includes("decorateSVG(svg,sum,get('greek').value)"));
 assert.ok(html.includes('relic-card-disclaimer'));
});
test('Card uses proportional title / figure / ecology / exact matching values',()=>{
 const order=['class="relic-card-masthead"','id="personalSeal"',
  'id="relicPreviewGreek"','id="relicSilhouetteFrame"','id="relicPreviewAnimal"',
  'id="relicPreviewScientific"','id="relicPreviewTraits"',
  'id="relicPreviewNameScore"','class="relic-preview-note"'];
 let last=-1;
 for(const piece of order){const i=html.indexOf(piece);assert.ok(i>last,'Order issue '+piece);last=i;}
 for(const prop of ['container-type:inline-size','object-fit:contain!important',
  '.relic-preview-heading>strong','.relic-preview-numbers','@media(max-width:430px)'])
  assert.ok(styles.includes(prop),prop);
 assert.ok(styles.includes('text-wrap:balance'));
 assert.ok(poster.includes('row[0]'));
 assert.ok(js.includes('composeScreenCard(row)'));
 assert.ok(download.includes('navigator.share'));
 assert.ok(download.includes('navigator.canShare'));
 assert.ok(styles.includes('is-poster-rendered'));
 assert.ok(poster.includes("'РАЗНИЦА',0"));
});
test('Poster background painter draws repeated ornamental motifs and complete background',()=>{
 const start=js.indexOf(' function drawCelestialBorder(ctx,number){');
 const end=js.indexOf(' function textLines(ctx,txt,',start);
 assert.ok(start>=0&&end>start);
 const segment=js.slice(start,end);
 const f=new Function('get','sum',segment+';return paintCardBackdrop;');
 let rects=[],arcs=0,strokes=0,saves=0,restores=0;
 const stub={createLinearGradient:()=>({addColorStop(){}}),
  createRadialGradient:()=>({addColorStop(){}}),
  fillRect(...a){rects.push(a)},strokeRect(){strokes++},
  save(){saves++},restore(){restores++},beginPath(){},moveTo(){},
  lineTo(){},closePath(){},bezierCurveTo(){},ellipse(){},fill(){},
  arc(){arcs++},stroke(){strokes++},translate(){},scale(){}};
 const paint=f(()=>null,1878);
 paint(stub,1878,'predator');
 assert.deepEqual(rects[0],[0,0,1200,2070]);
 assert.ok(strokes>20);
 assert.ok(js.includes('paintNebula(ctx,number)'));
 assert.ok(poster.includes("'РАЦИОН'"));
 assert.ok(poster.includes("'СРЕДА ОБИТАНИЯ'"));
 assert.ok(arcs>20);
 assert.equal(saves,restores,'Unbalanced canvas context restores');
});
test('Stage 1 only changes card: no new animal taxonomy or person-name algorithm changes',()=>{
 assert.ok(!js.includes('localStorage.setItem('));
 assert.ok(!js.includes('sessionStorage.setItem('));
 const data=fs.readFileSync('animal_atlas.js','utf8');
 assert.ok(data.includes("'./art/animals-gold-v1.png'"));
});
