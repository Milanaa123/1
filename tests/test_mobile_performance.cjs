'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ritual=fs.readFileSync('ritual_ui.js','utf8');
const relic=fs.readFileSync('relic_features.js','utf8');
const search=fs.readFileSync('enhancements.js','utf8');
const html=fs.readFileSync('index.html','utf8');
test('Moving through form stages does not automatically focus mobile inputs',()=>{
 assert.ok(ritual.includes('function moveTo(next)'));
 assert.ok(!ritual.includes('.focus()'),'Programmatic text-field focus may summon Android keyboard');
 assert.ok(!ritual.includes('greek.select()'));
 assert.ok(ritual.includes("nextLatin.addEventListener('click', () => moveTo(2))"));
 assert.ok(ritual.includes("nextGreek.addEventListener('click', () => moveTo(3))"));
 assert.ok(ritual.includes('updateLayout()'));
});
test('Canvas is not repainted while typing an unchanged blank search',()=>{
 assert.ok(relic.includes("if(blankPosterPainted&&canvas.dataset.posterReady==='0')return false;"));
 assert.ok(relic.includes("if(canvas.dataset.posterReady==='1'&&renderedPosterKey===key)return true;"));
 assert.ok(relic.includes("const key=row[0]+'|'+row[1]+'|'+row[2]+'|'+greek;"));
 assert.ok(relic.includes("++posterSerial; // Cancel any pending animal image before clearing."));
 assert.ok(relic.includes('canvas.width=1200;canvas.height=2000'));
 assert.ok(relic.includes('await gallery.drawable(profile)'));
 assert.ok(relic.includes("canvas.toBlob(resolve,'image/png')"));
 assert.ok(relic.includes('async function printBooklet(status)'));
});
test('Repeat search only caches SHA-verified catalog shard, no names',()=>{
 assert.ok(search.includes('let lastVerifiedShard=null;'));
 assert.ok(search.includes('const digest=fresh.bucket_sha256[String(bucket)];'));
 assert.ok(search.includes('lastVerifiedShard?.bucket===bucket&&lastVerifiedShard.digest===digest'));
 const verify=search.indexOf('await verifyShardBody(body,bucket,fresh.bucket_sha256)',search.indexOf('run=async function()'));
 const save=search.indexOf('lastVerifiedShard={bucket,digest,rows:data}',verify);
 assert.ok(verify>=0 && save>verify);
 assert.ok(search.includes("fetch('./meta.json',{cache:'no-store'})"));
 assert.ok(search.includes("fetch('./data/'+bucket+'.json',{cache:'no-store'})"));
 assert.ok(search.includes("taxonGreekScore(row[1])!==target"));
 assert.ok(!search.includes('localStorage.setItem('));
});
test('Visual layout and export controls are unchanged',()=>{
 for(const name of ['relicCardBackdrop','relicAnimal','greek','name','downloadRelic','printRelic'])
  assert.ok(html.includes('id="'+name+'"'),name);
});
