'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const src=fs.readFileSync(path.join(root,'animal_atlas_100.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const builder=fs.readFileSync(path.join(root,'build_data.py'),'utf8');
const image=fs.readFileSync(path.join(root,'art/reference-original-01-40.png'));
const digest=crypto.createHash('sha256').update(image).digest('hex');
assert.equal(digest,'de19956a431cd33018f7acf6b52012bf2ba3425227857bfa7b6ffe0fad816e1b','Original collage crop SHA256 mismatch');
assert.equal(image.toString('hex',0,8),'89504e470d0a1a0a');
assert.equal(image.readUInt32BE(16),1536);
assert.equal(image.readUInt32BE(20),424);
assert.match(src,/return i<40\?EXACT_REF_URL:INDIVIDUAL_DIR/);
const cutouts=fs.readFileSync(path.join(root,'animal_cutout_40.js'),'utf8');
assert.match(cutouts,/AnimagiaTransparentCutouts=Object\.freeze/);
assert.match(cutouts,/const alpha=clamp\(warm\*3\.1/);
assert.match(src,/const isolated=window\.AnimagiaTransparentCutouts\?\.isolate\(art,cell\)/);
assert.doesNotMatch(src,/ctx\.drawImage\(art,sx,sy,sw,sh,/,'Opaque artwork tiles may not be painted');
assert.match(src,/if\(profile\.cell<40\)return drawExactReference/);
assert.match(src,/drawExactReference\(ctx,loaded\?\.exactReference,profile\.cell/);
assert.match(src,/sharpCorrected,exactReference\]=await Promise\.all/);
assert.match(src,/individualAsset\(0\)/);
assert.match(src,/REF_X0=Object\.freeze\(\[4,155,309,463,617,772,926,1082,1236,1391\]\)/);
assert.match(src,/REF_Y0=Object\.freeze\(\[4,111,217,323\]\)/);
assert.match(html,/animal_cutout_40\.js\?v=subject-only-frog-style-20261028/);
assert.match(html,/animal_atlas_100\.js\?v=subject-only-frog-style-20261028/);
assert.match(builder,/shutil\.copy2\(BASE\/'animal_cutout_40\.js'/);
assert.match(builder,/ANIMAGIA_UNMODIFIED_REFERENCE_01_40_PUBLISHED/);
const manifest=JSON.parse(fs.readFileSync(path.join(root,'art/individual-4x/manifest.json'),'utf8'));
assert.equal(manifest.count,60);
assert.equal(manifest.items.length,65);
for(let n=1;n<=40;n++){
 const f=path.join(root,'art/individual-4x','animal-'+String(n).padStart(3,'0')+'.webp');
 assert.equal(fs.existsSync(f),false,'Old image remains '+n);
}
for(let n=41;n<=100;n++){
 const f=path.join(root,'art/individual-4x','animal-'+String(n).padStart(3,'0')+'.webp');
 assert.equal(fs.existsSync(f),true,'Missing remaining image '+n);
}
assert.equal(fs.existsSync(path.join(root,'art/site-01-20')),false,'Prior generated approximation was not removed');
assert.equal(fs.existsSync(path.join(root,'art/vector-ink')),false,'Rejected tracing directory remains');
assert.equal(fs.existsSync(path.join(root,'art/redraw-gold')),false,'Rejected hand-redraw directory remains');
console.log('EXACT_40_ORIGINAL_REFERENCE_VERIFIED',JSON.stringify({sourceSHA256:digest,nativeSize:'1536x424',originalImages:40,remainingImages:60}));
