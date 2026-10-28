'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const r=JSON.parse(fs.readFileSync('art/reviews/visual-batch04-61-80.json','utf8'));
const sources=JSON.parse(fs.readFileSync('art/individual-4x/manifest.json','utf8'));
const manifests=[JSON.parse(fs.readFileSync('art/vector-ink/manifest-batch09.json','utf8')),JSON.parse(fs.readFileSync('art/vector-ink/manifest-batch10.json','utf8'))];
const summary={provisional:[],needs_further_comparison:[],reject:[]};
assert.deepEqual(r.scope,{first:61,last:80,total:20});assert.equal(r.items.length,20);
for(let i=0;i<20;i++){
 const e=r.items[i],num=i+61;
 assert.equal(e.index,num);assert.equal(e.manualAnatomyApproved,false);
 assert.ok(Object.hasOwn(summary,e.status));assert.ok(e.concern.length>=40);
 assert.equal(e.sourceFile,'art/individual-4x/animal-'+String(num).padStart(3,'0')+'.webp');
 assert.equal(e.siteSvgFile,'art/vector-ink/animal-'+String(num).padStart(3,'0')+'.svg');
 const src=sources.items.find(x=>x.index===num),vec=manifests.flatMap(x=>x.items).find(x=>x.index===num);
 assert.ok(src,'Missing original art '+num);assert.ok(vec,'Missing deployed vector '+num);
 assert.equal(vec.anatomy_reviewed,false);
 const original=fs.readFileSync(e.sourceFile),svg=fs.readFileSync(e.siteSvgFile);
 assert.equal(original.length,src.size);assert.equal(svg.length,vec.bytes);
 assert.equal(crypto.createHash('sha256').update(original).digest('hex'),src.sha256);
 assert.equal(crypto.createHash('sha256').update(svg).digest('hex'),vec.sha256);
 assert.ok(svg.includes(Buffer.from('<path'))&&!svg.includes(Buffer.from('<image')));
 summary[e.status].push(num);
}
assert.deepEqual(summary.reject,[63,65,66,67,68,69,70,76,79]);
assert.deepEqual(summary.needs_further_comparison,[61,73,75,77,80]);
assert.equal(summary.provisional.length,6);
assert.deepEqual(r.approvalGate.rejectedCannotBePublishedAsReviewed,summary.reject);
assert.ok(!r.items.some(e=>e.manualAnatomyApproved));
console.log('ANIMAL_ART_AUDIT_61_80_SHA256_VERIFIED',JSON.stringify(summary));
