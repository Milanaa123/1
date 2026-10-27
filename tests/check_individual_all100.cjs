'use strict';
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const audit=String(function(){
 (async()=>{
 const gallery=window.AnimagiaAnimalAtlas,errors=[],main=document.querySelector('main'),stats=[];
 for(let i=0;i<100;i++){
  const p={artSet:'atlas100',cell:i,reviewedBatch:6};
  const file=await gallery.drawable(p);
  if(!file?.singleArt||file.singleCell!==i){errors.push('Missing single art '+(i+1));continue;}
  const im=file.singleArt;
  if(i!==86&&(im.naturalWidth!==640||im.naturalHeight!==440))errors.push('Wrong 4x image '+(i+1));
  if(i===86&&im.naturalWidth!==320)errors.push('Hand-drawn snake SVG missing');
  if(file.sharpSheet||file.sharpCorrected||file.newSheet)errors.push('Loaded giant atlas for '+(i+1));
  const c=document.createElement('canvas');c.width=640;c.height=440;
  const ctx=c.getContext('2d',{willReadFrequently:true});
  if(!gallery.drawCanvas(ctx,file,p,0,0,640,440)){errors.push('Failed to paint '+(i+1));continue;}
  const pixels=ctx.getImageData(0,0,640,440).data;
  let count=0;for(let j=3;j<pixels.length;j+=4)if(pixels[j]>24)count++;
  if(count<1500)errors.push('Sparse or missing animal '+(i+1)+' : '+count);
  const fig=document.createElement('figure'),caption=document.createElement('figcaption');
  caption.textContent=(i+1)+'. '+(gallery.list[i]?.name||'');
  fig.append(c,caption);main.append(fig);
  stats.push({index:i+1,count});
 }
 for(let i=0;i<5;i++){
  const p={id:['wolf','fox','dog','cat','lion'][i],approvedIndex:i,note:'Утверждённый рисунок'};
  const data=await gallery.drawable(p);
  const im=data?.legacy;
  if(!im||im.naturalHeight!==392||im.naturalWidth<590)errors.push('Approved first-five single file unavailable '+(i+1));
  const c=document.createElement('canvas');c.width=640;c.height=440;
  if(!gallery.drawCanvas(c.getContext('2d'),data,p,0,0,640,440))errors.push('Approved portrait is blank '+(i+1));
 }
 const requests=performance.getEntriesByType('resource').map(x=>x.name);
 if(requests.some(x=>/animagia-100-sharp4x\.webp|animagia-corrected-22-sharp4x\.webp|animals-approved-01-05-sharp4x.png/.test(x)))
  errors.push('Fetched giant atlas in individual-only path');
 document.title=errors.length?'ALL105_INDIVIDUAL_FAIL':'ALL105_INDIVIDUAL_PASS';
 document.body.dataset.qa=btoa(unescape(encodeURIComponent(JSON.stringify({count:stats.length,approved:5,errors,minPixels:Math.min(...stats.map(x=>x.count)),artRequests:requests.filter(x=>x.includes('/art/')).length}))));
 })();
});
const html='<!doctype html><html lang="ru"><meta charset="utf-8"><title>Loading</title>'+
 '<style>html,body{margin:0;background:#120e1c;color:#f0cf9d;font:13px Georgia}main{display:grid;grid-template-columns:repeat(10,160px);gap:8px;padding:10px}figure{margin:0;border:1px solid #6b543f;background:#201a29;width:160px}canvas{width:158px;height:108px}figcaption{font-size:11px;text-align:center;height:28px;overflow:hidden}</style>'+
 '<main></main><script src="./animal_atlas.js"></script><script src="./animal_atlas_100.js"></script>'+
 '<script>('+audit+')();</script>';
const f=path.resolve('qa-all-individual-100.html'),png=path.resolve('qa-artifacts/all100-individual.png');fs.writeFileSync(f,html);fs.mkdirSync('qa-artifacts',{recursive:true});
let chrome='';
for(const exe of [process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/chromium','chromium'].filter(Boolean))if(spawnSync(exe,['--version'],{encoding:'utf8',timeout:4000}).status===0){chrome=exe;break;}
if(!chrome)throw Error('Chromium not installed');
const flags=['--headless','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--allow-file-access-from-files','--hide-scrollbars','--window-size=1750,1670','--virtual-time-budget=6000'];
try{
 const p=spawnSync(chrome,[...flags,'--dump-dom','file://'+f],{encoding:'utf8',timeout:160000,maxBuffer:8*1024*1024});
 if(p.error||p.status!==0)throw Error('Browser failed: '+(p.error||p.status));
 const m=p.stdout.match(/data-qa="([^"]+)"/);
 if(!m)throw Error('All-100 browser report missing '+p.stdout.slice(-300));
 const report=JSON.parse(Buffer.from(m[1],'base64').toString('utf8'));
 if(report.errors.length||report.count!==100)throw Error('All-105 portrait validation: '+JSON.stringify(report));
 const s=spawnSync(chrome,[...flags,'--screenshot='+png,'file://'+f],{encoding:'utf8',timeout:160000});
 if(s.error||s.status!==0||fs.statSync(png).size<30000)throw Error('Screenshot of 100 individual cards missing');
 console.log('ALL_105_INDIVIDUAL_SHARP_BROWSER_PASSED '+JSON.stringify(report));
}finally{fs.rmSync(f,{force:true});}
