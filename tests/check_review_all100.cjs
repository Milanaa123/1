'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const paths=[
 'art/reviews/visual-batch01-01-20.json',
 'art/reviews/visual-batch02-21-40.json',
 'art/reviews/visual-batch03-41-60.json',
 'art/reviews/visual-batch04-61-80.json',
 'art/reviews/visual-batch05-81-100.json'
];
const combined=JSON.parse(fs.readFileSync('art/reviews/visual-audit-all100-summary.json','utf8'));
const reports=paths.map(p=>JSON.parse(fs.readFileSync(p,'utf8')));
assert.deepEqual(combined.sourceReports,paths);
assert.deepEqual(combined.scope,{from:1,to:100,total:100});
assert.equal(combined.manualAnatomyApprovedCount,0);
const all=reports.flatMap(x=>x.items);
assert.equal(all.length,100);
const statuses={provisional:[],needs_further_comparison:[],reject:[]};
for(let i=0;i<100;i++){
 const p=all[i];
 assert.equal(p.index,i+1);
 assert.ok(Object.hasOwn(statuses,p.status));
 assert.ok(p.concern.length>20);
 // Some early reports used a different boolean key; all mean NOT approved.
 assert.notEqual(p.manualAnatomyApproved,true);
 assert.notEqual(p.manuallyAnatomyApproved,true);
 statuses[p.status].push(p.index);
}
for(const [k,ids] of Object.entries(statuses))assert.equal(combined.counts[k],ids.length);
assert.deepEqual(combined.counts,{provisional:44,needs_further_comparison:34,reject:22});
assert.deepEqual(combined.criticalRedraws.map(x=>x.index),statuses.reject);
assert.deepEqual(combined.needsComparison.map(x=>x.index),statuses.needs_further_comparison);
for(const row of combined.criticalRedraws){
 const source=all[row.index-1];
 assert.equal(row.name,source.name);
 assert.equal(row.reason,source.concern);
 assert.equal(row.batch,Math.ceil(row.index/20));
}
assert.ok(combined.rules.some(x=>x.includes('grass snake #87')));
assert.ok(combined.rules.some(x=>x.includes('Greek name arithmetic')));
const queue=fs.readFileSync('art/reviews/visual-audit-all100-priority.md','utf8');
for(const row of combined.criticalRedraws){
 assert.ok(queue.includes('| '+row.index+' | '+row.name+' |'));
}
console.log('ANIMAGIA_100_EDITORIAL_AUDIT_VERIFIED',{
 total:all.length,redraw:statuses.reject.length,compare:statuses.needs_further_comparison.length,provisional:statuses.provisional.length
});
