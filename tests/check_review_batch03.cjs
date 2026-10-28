'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const r=JSON.parse(fs.readFileSync('art/reviews/visual-batch03-41-60.json','utf8'));
const source=JSON.parse(fs.readFileSync('art/individual-4x/manifest.json','utf8'));
const m=[JSON.parse(fs.readFileSync('art/vector-ink/manifest-batch08.json','utf8')),JSON.parse(fs.readFileSync('art/vector-ink/manifest-batch09.json','utf8'))];
const statuses={provisional:[],needs_further_comparison:[],reject:[]};
assert.deepEqual(r.scope,{first:41,last:60,total:20});
assert.equal(r.items.length,20);
for(let i=0;i<20;i++){
 const e=r.items[i],n=41+i;
 assert.equal(e.index,n);assert.equal(e.manualAnatomyApproved,false);
 assert.ok(Object.hasOwn(statuses,e.status));assert.ok(e.concern.length>30);
 assert.equal(e.sourceFile,'art/individual-4x/animal-'+String(n).padStart(3,'0')+'.webp');
 assert.equal(e.siteSvgFile,'art/vector-ink/animal-'+String(n).padStart(3,'0')+'.svg');
 const s=source.items.find(x=>x.index===n),v=m.flatMap(x=>x.items).find(x=>x.index===n);
 assert.ok(s);assert.ok(v);assert.equal(v.anatomy_reviewed,false);
 const raw=fs.readFileSync(e.sourceFile),svg=fs.readFileSync(e.siteSvgFile);
 assert.equal(raw.length,s.size);assert.equal(svg.length,v.bytes);
 assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),s.sha256);
 assert.equal(crypto.createHash('sha256').update(svg).digest('hex'),v.sha256);
 assert.ok(svg.includes(Buffer.from('<path'))&&!svg.includes(Buffer.from('<image')));
 statuses[e.status].push(n);
}
assert.deepEqual(statuses.reject,[51,52,53,54,55,60]);
assert.deepEqual(statuses.needs_further_comparison,[41,45,46,47,48,50,59]);
assert.equal(statuses.provisional.length,7);
assert.equal(r.items.find(x=>x.index===42).fantasyOnly,true);
assert.deepEqual(r.approvalGate.rejectedCannotBePublishedAsReviewed,statuses.reject);
console.log('ANIMAGIA_ANATOMY_REVIEW_41_60_SHA256_PASSED',JSON.stringify(statuses));
