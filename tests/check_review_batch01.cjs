'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const report=JSON.parse(fs.readFileSync('art/reviews/visual-batch01-01-20.json','utf8'));
const src=JSON.parse(fs.readFileSync('art/individual-4x/manifest.json','utf8'));
const atlas=fs.readFileSync('animal_atlas_100.js','utf8');
assert.deepEqual(report.scope,{first:1,last:20,total:20});
assert.equal(report.items.length,20);
const observed=new Set();
for(const [i,e] of report.items.entries()){
 assert.equal(e.index,i+1);
 assert.ok(!observed.has(e.index));
 observed.add(e.index);
 assert.ok(['provisional','reject','needs_further_comparison'].includes(e.status),e.index);
 assert.equal(e.manualAnatomyApproved,false);
 const stored=src.items.find(x=>x.file===e.sourceFile.split('/').pop());
 assert.ok(stored,'Missing source manifest entry for '+e.index);
 const b=fs.readFileSync(e.sourceFile);
 assert.equal(b.length,stored.size,e.sourceFile);
 assert.equal(crypto.createHash('sha256').update(b).digest('hex'),stored.sha256,e.sourceFile);
 assert.ok(typeof e.concern==='string'&&e.concern.length>20);
}
for(const n of [6,10])assert.equal(report.items[n-1].status,'reject','Do not certify wrong felid '+n);
assert.ok(report.items.every(x=>x.manualAnatomyApproved===false),'No zoological certification claimed');
for(const n of [6,10])assert.ok(atlas.includes('VECTOR07_FIRST'),'Wrong source must not silently become accepted');
console.log('MANUAL_VISUAL_TRIAGE_FIRST20_VERIFIED '+JSON.stringify({
 total:20,rejected:report.items.filter(x=>x.status==='reject').map(x=>x.index),
 further:report.items.filter(x=>x.status==='needs_further_comparison').map(x=>x.index)
}));
