'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const report=JSON.parse(fs.readFileSync('art/reviews/visual-batch05-81-100.json','utf8'));
const orig=JSON.parse(fs.readFileSync('art/individual-4x/manifest.json','utf8'));
const m10=JSON.parse(fs.readFileSync('art/vector-ink/manifest-batch10.json','utf8'));
const m11=JSON.parse(fs.readFileSync('art/vector-ink/manifest-batch11.json','utf8'));
const vec=new Map([...m10.items,...m11.items].map(x=>[x.index,x]));
const statuses={provisional:[],needs_further_comparison:[],reject:[]};
const hash=(x)=>crypto.createHash('sha256').update(x).digest('hex');
assert.deepEqual(report.scope,{first:81,last:100,total:20});
assert.equal(report.items.length,20);
assert.equal(report.sourceException.index,87);
assert.equal(report.sourceException.verifiedHash,'31a6276434eef7f5a5593f94885fcc40b36cc096e03f0b59f82369571dfaa216');
assert.equal(m11.preservedHandDrawn.index,87);
const atlas=fs.readFileSync('animal_atlas_100.js','utf8');
assert.ok(atlas.includes("if(i===86)return GRASS_SNAKE_URI"));
assert.ok(atlas.includes("const GRASS_SNAKE_URI='./art/animagia-grass-snake-87.svg'"));
for(let i=0;i<20;i++){
 const entry=report.items[i],n=i+81;
 assert.equal(entry.index,n);
 assert.ok(Object.hasOwn(statuses,entry.status));
 assert.equal(entry.manualAnatomyApproved,false);
 assert.ok(entry.concern.length>60);
 assert.equal(entry.sourceFile,'art/individual-4x/animal-'+String(n).padStart(3,'0')+'.webp');
 const src=orig.items.find(x=>x.index===n);
 assert.ok(src,'Missing legacy source image');
 const original=fs.readFileSync(entry.sourceFile);
 assert.equal(original.length,src.size);
 assert.equal(hash(original),src.sha256);
 if(n===87){
  assert.equal(entry.siteSvgFile,'art/animagia-grass-snake-87.svg');
  assert.equal(entry.artRoute,'dedicated-vector');
  const special=fs.readFileSync(entry.siteSvgFile);
  assert.equal(hash(special),report.sourceException.verifiedHash);
  assert.equal(vec.has(87),false);
  assert.match(special.toString('utf8'),/Slender, legless, unhooded grass snake/);
 }else{
  const m=vec.get(n);
  assert.ok(m,'Missing live SVG for '+n);
  assert.equal(m.anatomy_reviewed,false);
  assert.equal(entry.siteSvgFile,'art/vector-ink/'+m.file);
  const svg=fs.readFileSync(entry.siteSvgFile);
  assert.equal(svg.length,m.bytes);
  assert.equal(hash(svg),m.sha256);
  assert.ok(svg.includes(Buffer.from('<path')));
  assert.ok(!svg.includes(Buffer.from('<image')));
 }
 statuses[entry.status].push(n);
}
assert.deepEqual(statuses.reject,[93,96,100]);
assert.deepEqual(statuses.needs_further_comparison,[82,84,86,90,91,92,94,99]);
assert.equal(statuses.provisional.length,9);
assert.equal(report.items.find(x=>x.index===88).fantasyOnly,true);
assert.deepEqual(report.approvalGate.rejectedCannotBePublishedAsReviewed,statuses.reject);
console.log('ANIMAL_ART_AUDIT_81_100_AND_SNAKE87_VERIFIED',JSON.stringify(statuses));
