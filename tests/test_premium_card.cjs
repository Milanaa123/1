'use strict';
const fs=require('node:fs'),test=require('node:test'),assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8');
const js=fs.readFileSync('relic_features.js','utf8');
const css=fs.readFileSync('magic_theme.css','utf8');
const py=fs.readFileSync('build_data.py','utf8');
test('No keyboard: elegant category chooser with drawing filter and paging',()=>{
 for(const id of ['animalChooser','animalChooserOpen','animalChooserList','animalChooserGroups',
   'chooserFilterIllustrated','chooserFilterAll','animalChooserMore'])
  assert.ok(html.includes('id="'+id+'"'),id);
 assert.ok(html.includes('id="relicAnimal" hidden'));
 assert.ok(!html.includes('id="relicAnimalSearch"'));
 assert.ok(js.includes('limit+=48'));
 assert.ok(js.includes('function setupAnimalChooser'));
 assert.ok(css.includes('.animal-chooser-panel'));
 assert.ok(css.includes('body.animal-chooser-opened'));
});
test('Premium export never reaches obsolete PhyloPic silhouettes',()=>{
 const png=js.slice(js.indexOf(' async function savePNG('),js.indexOf(' async function compareOne('));
 const preview=js.slice(js.indexOf(' async function showSilhouette('),js.indexOf(' let currentPictureSerial'));
 for(const section of [png,preview]){
  assert.ok(!section.includes('currentSilhouette('));
  assert.ok(!section.includes('goldContour('));
 }
 assert.ok(!html.includes('<script src="./silhouette_service.js'));
 assert.ok(js.includes('Образ скрытой формы ещё создаётся'));
 assert.ok(js.includes('function paintFinishedCard('));
 assert.ok(png.includes('composeScreenCard(row)'));
});
test('Card hierarchy and no broken technical empty fields',()=>{
 assert.ok(js.includes('function updatePreviewText'));
 assert.ok(js.includes("original.indexOf(' — ')"));
 assert.ok(js.includes('canvas.height=2000'));
 assert.ok(js.includes("'СРЕДА ОБИТАНИЯ'"));
 assert.ok(js.includes('box.hidden=meta.diet'));
 assert.ok(js.includes("d.parentElement.hidden=meta.diet==='unknown'"));
 assert.ok(js.includes("h.parentElement.hidden=meta.habitat==='unknown'"));
 assert.ok(css.includes('.animal-profile-tag[hidden]'));
 assert.ok(html.includes('id="relicPreviewCategory"'));
 assert.ok(html.includes('id="relicPreviewGreek"'));
 assert.ok(html.includes('id="relicPreviewTraits"'));
 assert.ok(js.includes("drawCelestialBorder(ctx,number)"));
 assert.ok(js.includes("ctx.fillRect(0,0,1200,2070)"));
 assert.ok(js.includes("paintCardBackdrop(ctx,cardNumber,styl.diet)"));
 assert.ok(js.includes('paintFinishedCard(ctx,row,greek,profile,sprite,styl)'));
 assert.ok(js.includes("paintCardBackdropOnScreen(meta.diet)"));
 assert.ok(html.includes('id="relicCardBackdrop"'));
 assert.ok(html.includes('class="relic-card-masthead"'));
 assert.ok(html.includes('relic_card_stage1.css?v='));
});
test('Approved art stored at own domain and integrity checked on build',()=>{
 assert.ok(py.includes('def bundle_curated_gold_art():'));
 assert.ok(py.includes("bytes([137,80,78,71,13,10,26,10])"));
 assert.ok(py.includes('sha256(raw).hexdigest()!=expected'));
 assert.ok(py.includes("bundle_curated_gold_art();"));
 const art=fs.readFileSync('animal_atlas.js','utf8');
 assert.ok(art.includes("'./art/animals-gold-v1.png'"));
});
class E{
 constructor(t='div'){this.tag=t;this.events={};this.children=[];this.value='';this.hidden=false;this.disabled=false;this.attrs={};this.classList={add(){},remove(){}};this.offsetParent={};}
 addEventListener(k,fn){(this.events[k]??=[]).push(fn)}
 fire(k){for(const fn of this.events[k]??[])fn()}
 setAttribute(k,v){this.attrs[k]=v}
 append(...items){for(const x of items){if(x.tag==='fragment')this.children.push(...x.children);else this.children.push(x)}}
 replaceChildren(...items){this.children=[];this.append(...items)}
 focus(){fakeDocument.activeElement=this}
 querySelector(){return get('shade')}
 querySelectorAll(){return []}
}
const nodes=new Map();const get=id=>{if(!nodes.has(id))nodes.set(id,new E);return nodes.get(id)};
const fakeDocument={body:new E,activeElement:null,handlers:{},createDocumentFragment(){return new E('fragment')},addEventListener(k,fn){this.handlers[k]=fn}};
const elem=(tag,txt)=>{const v=new E(tag);v.textContent=txt||'';return v;};
const rows=Array.from({length:550},(_,i)=>[1878,'Genus animal'+i,'species','Mammalia','Carnivora','','Chordata']);
rows[20][1]='Cornufer opisthodon';rows[20][3]='Amphibia';rows[20][4]='Anura';
const fakeAtlas={resolve:r=>r===rows[20]?{id:'frog'}:null};
const fragment=js.slice(js.indexOf(' function animalGroup(row){'),js.indexOf('\n // Recolour a genuine transparent'));
let changed=0;
const init=new Function('get','orderedAnimals','atlas','label','elem','document','updatePicker','syncSilhouette',
 fragment+'return setupAnimalChooser;');
test('550 results available by taps, no keyboard; group and illustrated filters work',()=>{
 const picker=new E('select');picker.value='Genus animal0|species';
 const trigger=get('animalChooserOpen');trigger.disabled=false;
 const fn=init(get,()=>rows,()=>fakeAtlas,r=>r[1],elem,fakeDocument,
  ()=>{changed++},()=>{changed++});
 fn(picker);
 trigger.fire('click');
 assert.equal(get('animalChooser').hidden,false);
 assert.equal(get('animalChooserList').children.length,48);
 assert.equal(get('animalChooserMore').hidden,false);
 assert.equal(fakeDocument.activeElement,get('animalChooserClose'));
 get('chooserFilterIllustrated').fire('click');
 assert.equal(get('animalChooserList').children.length,1);
 assert.equal(get('animalChooserList').children[0].children[0].children[1].textContent,'Cornufer opisthodon');
 get('chooserFilterAll').fire('click');
 const groups=get('animalChooserGroups').children;
 const amphibian=groups.find(btn=>btn.textContent.startsWith('Земноводные'));
 assert.ok(amphibian);
 amphibian.fire('click');
 assert.equal(get('animalChooserList').children.length,1);
 get('animalChooserList').children[0].fire('click');
 assert.equal(picker.value,'Cornufer opisthodon|species');
 assert.equal(get('animalChooser').hidden,true);
 assert.equal(changed,2);
 trigger.fire('click');
 const allButton=get('animalChooserGroups').children.find(btn=>btn.textContent.startsWith('Все'));
 allButton.fire('click');
 for(let i=0;i<12;i++)get('animalChooserMore').fire('click');
 assert.equal(get('animalChooserList').children.length,550);
 get('animalChooserList').children[549].fire('click');
 assert.equal(picker.value,'Genus animal549|species');
 assert.equal(changed,4);
});
