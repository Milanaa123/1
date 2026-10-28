'use strict';
const fs=require('fs'),assert=require('assert').strict;
const m=JSON.parse(fs.readFileSync('art/redraw-gold/manifest-batch02-candidates.json','utf8'));
assert.deepEqual(m.items.map(x=>x.index),[53,54,55,60,63,65]);
assert.equal(m.status,'review-pending');
for(const e of m.items){
 const s=fs.readFileSync('art/redraw-gold/'+e.file,'utf8');
 assert.equal(Buffer.byteLength(s),e.bytes);
 assert.ok(s.includes('<svg')&&s.includes('<path')&&!s.includes('<image'));
 assert.ok(s.includes('<clipPath id="b"'));
 assert.ok(e.requiredFeatures.length>=3);
 assert.equal(e.published,false);
}
const source=fs.readFileSync('animal_atlas_100.js','utf8');
for(const e of m.items)assert.ok(!source.includes('new Set([6,10,24,33,51,52,'+e.index));
console.log('SIX_CANDIDATE_VECTORS_UNPUBLISHED_VERIFIED');