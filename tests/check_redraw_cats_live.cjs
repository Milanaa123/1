'use strict';
const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const meta=JSON.parse(fs.readFileSync('art/redraw-gold/manifest-live.json','utf8'));
const src=fs.readFileSync('animal_atlas_100.js','utf8');
const builder=fs.readFileSync('build_data.py','utf8');
assert.equal(meta.status,'published');
assert.deepEqual(meta.items.map(x=>x.index),[6,10,24,33,51,52]);
assert.ok(src.includes("const REDRAW_PUBLISHED=new Set([6,10,24,33,51,52])"));
assert.ok(src.includes("return REDRAW_DIR+suffix+'.svg'"));
assert.ok(builder.includes('ANIMAGIA_REDRAW_SIX_SVG_PUBLISHED'));
for(const item of meta.items){
 const svg=fs.readFileSync('art/redraw-gold/'+item.file);
 assert.equal(svg.length,item.bytes);
 assert.equal(crypto.createHash('sha256').update(svg).digest('hex'),item.sha256);
 assert.equal(item.artistVisualReview,true);
 assert.equal(item.speciesAnatomyCertified,false);
 assert.match(svg.toString('utf8'),/<path/);
 assert.doesNotMatch(svg.toString('utf8'),/<image/);
}
console.log('SIX_GOLD_VECTOR_REDRAWS_SHA_VERIFIED');
