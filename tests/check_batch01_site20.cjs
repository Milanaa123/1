'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const src=fs.readFileSync(path.join(root,'animal_atlas_100.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const data=JSON.parse(fs.readFileSync(path.join(root,'art/site-01-20/manifest.json'),'utf8'));
assert.equal(data.numbers.length,20);
assert.equal(new Set(data.numbers.map(x=>x.label)).size,20);
assert.match(src,/NEW_BATCH01_DIR='\.\/art\/site-01-20\//);
assert.match(src,/\(i<20\?NEW_BATCH01_DIR:INDIVIDUAL_DIR\)/);
assert.match(html,/animal_atlas_100\.js\?v=site-batch01-20-gold-20261028/);
assert.doesNotMatch(src,/return REDRAW_DIR\+suffix\+'\.svg'/);
let total=0;
for(let i=1;i<=20;i++){
 const n=String(i).padStart(3,'0'),file=path.join(root,'art/site-01-20','animal-'+n+'.webp');
 const image=fs.readFileSync(file);total+=image.length;
 assert.equal(image.toString('ascii',0,4),'RIFF','WebP header '+n);
 assert.equal(image.toString('ascii',8,12),'WEBP','WebP container '+n);
 assert.ok(image.length>20000,'Image missing '+n);
 assert.equal(data.numbers[i-1].n,i);
 assert.ok(!fs.existsSync(path.join(root,'art/individual-4x','animal-'+n+'.webp')),'Old duplicate was not deleted '+n);
}
for(let i=21;i<=100;i++)assert.ok(fs.existsSync(path.join(root,'art/individual-4x','animal-'+String(i).padStart(3,'0')+'.webp')));
console.log('ANIMAGIA_SITE_BATCH_01_20_VERIFIED',JSON.stringify({newFiles:20,totalBytes:total,oldFilesDeleted:20,otherAnimalsPreserved:80}));
