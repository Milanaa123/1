'use strict';
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const body=String(function(){
 (async()=>{
  const atlas=window.AnimagiaAnimalAtlas,errors=[],stats=[];
  const main=document.querySelector('main');
  function img(src){return new Promise(resolve=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>resolve(null);i.src=src;});}
  for(let number=86;number<=100;number++){
   if(number===87)continue;
   const i=number-1,profile={artSet:'atlas100',cell:i,reviewedBatch:6};
   const packed=await atlas.drawable(profile);
   const old=await img('./art/individual-4x/animal-'+String(number).padStart(3,'0')+'.webp');
   if(!packed?.singleArt||!old){errors.push('Missing SVG/legacy art for '+number);continue;}
   if(packed.singleArt.naturalWidth!==640||packed.singleArt.naturalHeight!==440)
     errors.push('Not a properly sized SVG '+number);
   if(!atlas.individualImageUrl(i).endsWith('.svg'))errors.push('Raster route not replaced '+number);
   if(packed.newSheet||packed.sharpSheet)errors.push('Giant atlas loaded '+number);
   const oldCanvas=document.createElement('canvas'),newCanvas=document.createElement('canvas');
   oldCanvas.width=newCanvas.width=640;oldCanvas.height=newCanvas.height=440;
   const o=oldCanvas.getContext('2d',{willReadFrequently:true}),n=newCanvas.getContext('2d',{willReadFrequently:true});
   o.drawImage(old,32,22,576,396);
   if(!atlas.drawCanvas(n,packed,profile,0,0,640,440))errors.push('SVG drawing failed '+number);
   const a=o.getImageData(0,0,640,440).data,b=n.getImageData(0,0,640,440).data;
   let union=0,intersection=0,newPixels=0;
   for(let t=3;t<a.length;t+=4){const oldV=a[t]>48,newV=b[t]>48;if(oldV||newV)union++;if(oldV&&newV)intersection++;if(newV)newPixels++;}
   const iou=union?intersection/union:0;
   if([93,96,100].includes(number)){if(!atlas.individualImageUrl(i).includes('/redraw-gold/'))errors.push('Redraw route missing '+number);if(newPixels<1200)errors.push('New vector image blank '+number);}else if(iou<.82)errors.push('SVG anatomical contour overlap too low '+number+': '+iou.toFixed(3));
   if(newPixels<1200)errors.push('Blank gold line art '+number);
   if(b[3]!==0||b[(639*4)+3]!==0||b[(439*640*4)+3]!==0)errors.push('Opaque background '+number);
   stats.push({number,iou:Number(iou.toFixed(3)),pixels:newPixels});
   const fig=document.createElement('figure'),c=document.createElement('figcaption');
   c.textContent='#'+number+' · '+(atlas.list[i]?.name||'')+' · SVG path';
   newCanvas.style.width='240px';newCanvas.style.height='165px';
   fig.append(newCanvas,c);main.append(fig);
  }
  if(atlas.individualImageUrl(85)!=='./art/vector-ink/animal-086.svg')errors.push('Animal 86 not vector');
  if(atlas.individualImageUrl(86)!=='./art/animagia-grass-snake-87.svg')errors.push('Hand-drawn grass snake 87 missing');
  const requested=performance.getEntriesByType('resource').map(x=>x.name);
  if(requested.some(x=>x.includes('animagia-100-sharp4x.webp')||x.includes('animagia-corrected-22-sharp4x.webp')))
   errors.push('Loaded huge raster atlas');
  if(stats.length!==14)errors.push('Wrong final vector count '+stats.length);
  document.title=errors.length?'VECTOR11_FAIL':'VECTOR11_PASS';
  document.body.dataset.qa=btoa(unescape(encodeURIComponent(JSON.stringify({errors,count:stats.length,minIoU:Math.min(...stats.map(x=>x.iou)),stats}))));
 })();
});
const html='<!doctype html><html lang="ru"><meta charset="utf-8"><title>Loading</title>'+
 '<style>body{margin:0;background:#100f1a;color:#edd29d;font-family:Georgia}main{display:grid;grid-template-columns:repeat(5,260px);gap:10px;padding:10px}figure{margin:0;background:#211b29;padding:8px;border:1px solid #896637}canvas{width:240px;height:165px}figcaption{text-align:center;font-size:12px;padding:7px}</style>'+
 '<main></main><script src="./animal_atlas.js"></script><script src="./animal_atlas_100.js"></script>'+
 '<script>('+body+')();</script>';
const input=path.resolve('qa-vector11.html'),shot=path.resolve('qa-artifacts/vector11-chromium-14.png');
fs.mkdirSync('qa-artifacts',{recursive:true});fs.writeFileSync(input,html);
let chrome='';
for(const e of [process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/chromium','chromium'].filter(Boolean))
 if(spawnSync(e,['--version'],{encoding:'utf8',timeout:3500}).status===0){chrome=e;break;}
if(!chrome)throw Error('Chromium required');
const flags=['--headless','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--allow-file-access-from-files','--hide-scrollbars','--window-size=1350,1080','--virtual-time-budget=3500'];
try{
 const dom=spawnSync(chrome,[...flags,'--dump-dom','file://'+input],{encoding:'utf8',timeout:110000,maxBuffer:9*1024*1024});
 if(dom.error||dom.status!==0)throw Error('Chromium did not load vector art: '+(dom.error||dom.status));
 const found=dom.stdout.match(/data-qa="([^"]+)"/);if(!found)throw Error('Final 14 art QA missing '+dom.stdout.slice(-320));
 const report=JSON.parse(Buffer.from(found[1],'base64').toString('utf8'));
 if(report.errors.length)throw Error('SVG contour browser QA '+JSON.stringify(report));
 const screenshot=spawnSync(chrome,[...flags,'--screenshot='+shot,'file://'+input],{encoding:'utf8',timeout:110000});
 if(screenshot.error||screenshot.status!==0||fs.statSync(shot).size<40000)throw Error('Vector browser montage missing');
 console.log('VECTOR11_TWENTY_CHROMIUM_PASSED '+JSON.stringify({count:report.count,minIoU:report.minIoU}));
}finally{fs.rmSync(input,{force:true});}
