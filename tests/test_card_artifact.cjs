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
 assert.ok(js.includes("Intl.Segmenter('el'"));
 assert.ok(js.includes('function nameArc(glyphs,font,r)'));
 assert.ok(js.includes("transform:'rotate('"));
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
 assert.ok(download.includes("canvas.toBlob(resolve,'image/png')"));
 assert.ok(!download.includes('image/jpeg'));
 assert.ok(!html.includes('id="downloadTransparent"'));
 assert.ok(!download.includes('navigator.share'));
 assert.ok(js.includes("function cardAdornment(row,styl,greekName='')"));
 assert.ok(js.includes('function paintDietAdornment(ctx,row,styl,greekName)'));
 assert.ok(js.includes("ctx.globalCompositeOperation='destination-out'"));
 assert.ok(styles.includes('is-poster-rendered'));
 assert.ok(poster.includes('ЧИСЛО СОВПАДЕНИЯ'));
 assert.ok(!poster.includes("'РАЗНИЦА',0"));
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
 assert.ok(poster.includes('styl.dietText'));
 assert.ok(!poster.includes('ctx.strokeRect(x,1588'));
 assert.ok(!html.includes('relic-preview-numbers'));
 assert.ok(poster.includes('styl.habitatText'));
 assert.ok(html.includes('relic-preview-single-number'));
 assert.ok(arcs>20);
 assert.equal(saves,restores,'Unbalanced canvas context restores');
});
test('Stage 1 only changes card: no new animal taxonomy or person-name algorithm changes',()=>{
 assert.ok(!js.includes('localStorage.setItem('));
 assert.ok(!js.includes('sessionStorage.setItem('));
 const data=fs.readFileSync('animal_atlas.js','utf8');
 assert.ok(data.includes("'./art/animals-gold-v1.png'"));
});

test('Visible diet borders include five unique variants each and true alpha holes',()=>{
 const a=js.indexOf(' function cardAdornment('),b=js.indexOf(' function paintCardBackdropOnScreen(',a);
 assert.ok(a>=0&&b>a);
 const frame=js.slice(a,b);
 for(const label of ['predator','soft-predator','herbivore','omnivore','aquatic','avian','reptile','woodland','nocturnal','celestial','spider'])
  assert.ok(frame.includes(label),'missing '+label);
 for(const names of ['hunters','gentle','florals','hybrids','aquatic','avian','reptile','woodland','nocturnal','celestial','silk'])
  assert.ok(frame.includes('const '+names+'=['),names);
 for(const feature of ['destination-out','strokeStyle','cornerStem','botanical','bite(','claw('])
  assert.ok(frame.includes(feature),feature);
 assert.ok(frame.includes('const radius=Math.min(88'),'transparent scalloped bite geometry');
 assert.ok(frame.includes('function familyTrim()'),'each family must change the true border');
 assert.ok(frame.includes('if(shapes.length)'),'final cut pass');
 assert.ok(frame.includes('function waterDrop(side,y,size=1)'));
 assert.ok(frame.includes('function waterSplash(side,y,size=1)'));
 assert.ok(frame.includes('const aquatic=['));
 assert.ok(frame.includes('function webbedFoot('));
 assert.ok(poster.includes('paintDietAdornment(ctx,row,styl,greek)'));
});

test('All fifty frame presets are reachable; cuts erase canvas pixels last',()=>{
 const begin=js.indexOf(' function cardAdornment(');
 const end=js.indexOf(' function paintCardBackdropOnScreen(',begin);
 assert.ok(begin>=0&&end>begin);
 const {cardAdornment,paintDietAdornment}=new Function(
  js.slice(begin,end)+'\nreturn {cardAdornment,paintDietAdornment};')();
 const sample=[1878,'Cornufer opisthodon','species','Amphibia','Anura','','Chordata'];
 function trace(){
  const stack=[],cuts={circle:0,gash:0},art={flowers:0},ctx={
   globalCompositeOperation:'source-over',globalAlpha:1,
   save(){stack.push({gco:this.globalCompositeOperation,alpha:this.globalAlpha})},
   restore(){const state=stack.pop();this.globalCompositeOperation=state.gco;this.globalAlpha=state.alpha},
   translate(){},scale(){},rotate(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},rect(){},clip(){},
   quadraticCurveTo(){},stroke(){},bezierCurveTo(){
    if(this.globalCompositeOperation==='destination-out')cuts.gash++;
   },
   ellipse(){art.flowers++;if(this.globalCompositeOperation==='destination-out')cuts.circle++},arc(){
    if(this.globalCompositeOperation==='destination-out')cuts.circle++;
   },
   fill(){},shadowBlur:0
  };
  return {ctx,cuts,art,stack};
 }
 const categories=[
  ['predator','Mammalia',true],['soft-predator','Amphibia',true],
  ['herbivore','Mammalia',true],['omnivore','Mammalia',true],
  ['aquatic','Mammalia',true],['avian','Aves',false],['reptile','Reptilia',false],['woodland','Mammalia',false],['nocturnal','Mammalia',false],['celestial','unknown',false]
 ];
 for(const [kind,className,needHoles] of categories){
  const diets={predator:'predator','soft-predator':'predator',herbivore:'herbivore',omnivore:'omnivore',aquatic:'predator',avian:'predator',reptile:'predator',woodland:'unknown',nocturnal:'unknown',celestial:'unknown'};
  const styl={diet:diets[kind],habitat:kind==='aquatic'?'aquatic':'terrestrial'},species=[...sample];
  species[3]=className;species[4]=kind==='soft-predator'?'Anura':kind==='nocturnal'?'Chiroptera':kind==='woodland'?'Eulipotyphla':'Carnivora';
  if(kind==='woodland')species[1]='Sorex araneus';if(kind==='celestial')species[1]='Unknownus mysticus';
  const variants=new Map();
  for(let i=0;i<100&&variants.size<5;i++){
   const owner='Ελληνικη'+i;
   const config=cardAdornment(species,styl,owner);
   assert.equal(config.kind,kind);
   variants.set(config.variant,owner);
  }
  assert.equal(variants.size,5,kind+' has 5 usable designs');
  for(const [variant,owner] of variants){
   const {ctx,cuts,art,stack}=trace();
   const config=paintDietAdornment(ctx,species,styl,owner);
   assert.equal(config.variant,variant);
   const count=cuts.circle+cuts.gash;
   if(needHoles)assert.ok(count>0,kind+' variant '+variant+' has no true cuts');
   else assert.equal(count,0,kind+' must not have destructive cuts');
   if(kind==='herbivore')assert.ok(art.flowers>0,'Herbivores need floral detail');
   assert.equal(ctx.globalCompositeOperation,'source-over','erase mode leaked');
   assert.equal(stack.length,0,'canvas save/restore unbalanced');
  }
 }
});

test('Stage-one reference template uses clean dark stardust and symmetric foil fans',()=>{
 const start=js.indexOf(' function paintNebula(ctx,number){');
 const end=js.indexOf(' function paintCardBackdrop(ctx,number,diet){',start);
 assert.ok(start>0&&end>start);
 const nebula=js.slice(start,end);
 assert.ok(nebula.includes('const clouds='));
 assert.ok(nebula.includes('i<1320'));
 assert.ok(nebula.includes('i<5'));
 assert.ok(!nebula.includes('i<27'));
 assert.ok(!nebula.includes('walk=35+random()*220'));
 const back=js.slice(end,js.indexOf(' function textLines(',end));
 assert.ok(back.includes('i<6'));
 assert.ok(back.includes("base.addColorStop(0,'#090a14')"));
 assert.ok(back.includes("base.addColorStop(.71,'#1a1425')"));
 assert.ok(styles.includes('transform:none!important;object-fit:contain!important;'));
 assert.match(html,/relic_features.js\?v=stage3-ivy-seam-frog-spider-v4/);
});

// Reference approval: full-circle Greek name; nebula and perimeter are drawn
// on the existing Canvas, never as a generated replacement photograph.
test('Greek glyphs cover the entire ring at identical angles',()=>{
 const begin=js.indexOf(' function wheelLetters(greekName){');
 const end=js.indexOf(' const elem=',begin);
 assert.ok(begin>=0&&end>begin);
 const {wheelLetters,nameArc,uprightRingAngle}=new Function(
  js.slice(begin,end)+'\nreturn {wheelLetters,nameArc,uprightRingAngle};')();
 for(const text of ['Φρέιζερ Ἁρολδ Βραουν','Ἀλέξανδρος Μάρκος','Ελλα Μαρια']){
  const name=wheelLetters(text);
  const positions=name.map((_,i)=>nameArc(name,32,246)(i));
  assert.equal(name.join(''),text.trim().split(/\s+/u)[0]);
  assert.equal(positions.length,name.length);
  for(let i=1;i<positions.length;i++)
   assert.ok(Math.abs(positions[i]-positions[i-1]-2*Math.PI/name.length)<1e-9);
  assert.ok(positions.length>1&&
   Math.abs((positions.at(-1)-positions[0])+2*Math.PI/name.length-2*Math.PI)<1e-9);
  assert.ok(name.every((_,i)=>Number.isFinite(uprightRingAngle(positions[i]))));
  const ringFontSize=new Function(js.slice(begin,end)+'\nreturn ringFontSize;')();
  const size=ringFontSize(name,246,36,15);
  assert.ok(size>=15&&size<=36);
 }
 assert.ok(js.includes('ctx.rotate(uprightRingAngle(a));'));
 assert.ok(js.includes('transform:\'rotate(\'+(uprightRingAngle(a)*180/Math.PI)'));
});
test('Cosmic reference background and golden perimeter are actual Canvas decoration',()=>{
 const backdrop=js.slice(js.indexOf(' function paintNebula('),js.indexOf(' function cardAdornment('));
 assert.ok(backdrop.includes('const ribbons='));
 assert.ok(backdrop.includes('const ornate')||backdrop.includes('Perimeter engraving directly on the card'));
 assert.ok(backdrop.includes('for(let j=0;j<2100;j++)'));
 assert.ok(backdrop.includes("ctx.strokeStyle='#efc38b'"));
 assert.ok(html.includes('stage3-ivy-seam-frog-spider-v4'));
});

// Stage 2: only first given name on the card, full-name calculation unchanged.
test('Greek ring shows the FIRST name only, keeps accents, and spacing',()=>{
 const begin=js.indexOf(' function wheelLetters(greekName){'),end=js.indexOf(' const elem=',begin);
 const {wheelLetters,ringFontSize,nameArc}=new Function(js.slice(begin,end)+
  '\nreturn {wheelLetters,ringFontSize,nameArc};')();
 const cases=[
  'Φρέιζερ Ἁρολδ Μπραουν',
  'Ἀλέξανδρος   Κρεων   Κραββ',
  'Ελλα Μαρια Ουιλλοου',
  'Αστριδ Αβελ Λαβγκουντ'
 ];
 for(const raw of cases){
  const glyphs=wheelLetters(raw),given=raw.trim().normalize('NFC').split(/\s+/u)[0];
  assert.equal(glyphs.join(''),given);
  assert.equal(glyphs.filter(x=>x===' ').length,0);
  assert.ok(!glyphs.join('').includes(raw.trim().split(/\s+/u)[1]||' '));
  const font=ringFontSize(glyphs,246,36,15);
  assert.ok(font>=15&&font<=36);
  const step=2*Math.PI/glyphs.length,angle=nameArc(glyphs,font,246);
  for(let i=1;i<glyphs.length;i++)assert.ok(Math.abs(angle(i)-angle(i-1)-step)<1e-9);
 }
 const marked=wheelLetters('Αλε\u0301ξανδρος');
 assert.equal(marked[2],'έ');
 assert.equal(marked.join(''),'Αλέξανδρος');
 assert.deepEqual(wheelLetters(''),[]);
 assert.equal(wheelLetters(' Φρέιζερ   Гаролд Μπραουν ').join(''),'Φρέιζερ');
 assert.ok(js.includes('the full name is scored'));
 assert.ok(js.includes('const lifeText=ecology.join'));
 assert.ok(js.includes('ctx.measureText(lifeText).width<=950'));
 assert.ok(js.includes("ctx.fillText('ЧИСЛО СОВПАДЕНИЯ',600,1722)"));
 assert.ok(!js.includes("ctx.fillText('РАЗНИЦА'"));
});