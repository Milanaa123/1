'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const v=JSON.parse(fs.readFileSync('art/reviews/felid-06-10-candidate-verdict.json'));
const c=JSON.parse(fs.readFileSync(v.candidates));
const published=JSON.parse(fs.readFileSync('art/vector-ink/manifest.json'));
assert.equal(v.approvedForDeployment,false);
assert.deepEqual(v.comments.map(x=>x.index),[6,10]);
for(const review of v.comments){
 assert.equal(review.decision,'redraw_required');
 assert.ok(review.issue.length>100);
 const entry=c.items.find(x=>x.index===review.index);
 assert.equal(entry.svg,review.candidate);
 assert.equal(entry.status,'candidate_only_not_published');
 const bytes=fs.readFileSync(entry.svg);
 assert.equal(bytes.length,entry.size);
 assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),entry.sha256);
 const live=published.items.find(x=>x.index===review.index);
 assert.ok(live);
 const deployed=fs.readFileSync('art/vector-ink/'+live.file);
 assert.equal(crypto.createHash('sha256').update(deployed).digest('hex'),live.sha256);
 assert.notEqual(entry.sha256,live.sha256);
}
const js=fs.readFileSync('animal_atlas_100.js','utf8');
const build=fs.readFileSync('build_data.py','utf8');
assert.ok(!js.includes('art/candidates/'));
assert.ok(!build.includes('art/candidates/'));
assert.ok(fs.statSync(v.preview).size>50000);
console.log('FELID_CANDIDATES_UNPUBLISHED_AND_REDRAW_REQUIRED',[6,10]);
