'use strict';
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const src=String(function(){
 (async()=>{
 const atlas=window.AnimagiaAnimalAtlas,loaded=await atlas.drawable(),errors=[];
 const left=document.createElement('canvas'),right=document.createElement('canvas');
 for(const c of [left,right]){c.width=160;c.height=110;}
 const p=atlas.resolve([1,'Natrix natrix','species','Reptilia','Squamata','','Chordata']);
 if(p?.cell!==86||p?.reviewedBatch!==6||p?.artSet!=='atlas100')errors.push('Wrong Natrix natrix sprite');
 if(loaded?.grassSnake87?.naturalWidth!==320||loaded.grassSnake87.naturalHeight!==220)
  errors.push('Species-specific transparent SVG did not load');
 if(loaded?.newSheet?.naturalWidth!==1600)errors.push('Master 100-image atlas missing');
 if(loaded?.newSheet)left.getContext('2d').drawImage(loaded.newSheet,6*160,8*110,160,110,0,0,160,110);
 if(!atlas.drawCanvas(right.getContext('2d'),loaded,p,0,0,160,110))
  errors.push('Species-specific snake drawing failed');
 const a=left.getContext('2d',{willReadFrequently:true}).getImageData(0,0,160,110).data;
 const b=right.getContext('2d',{willReadFrequently:true}).getImageData(0,0,160,110).data;
 let pixels=0,diff=0,gold=0,collar=0;
 for(let y=0;y<110;y++)for(let x=0;x<160;x++){
  const i=(y*160+x)*4;if(b[i+3]>24)pixels++;
  for(let c=0;c<4;c++)diff+=Math.abs(a[i+c]-b[i+c]);
  if(b[i+3]>90&&b[i]>120&&b[i+1]>70&&b[i+2]<b[i])gold++;
  if(x>=105&&x<135&&y>=25&&y<56&&b[i+3]>120&&b[i]>170&&b[i+1]>110&&b[i+2]>50)collar++;
 }
 if(pixels<1200||pixels>9000)errors.push('Unexpected snake silhouette coverage '+pixels);
 if(diff<30000)errors.push('Card still shows old inaccurate snake');
 if(gold<900)errors.push('No golden detail');
 if(collar<16)errors.push('Gold anatomical collar missing');
 if(b[3]||b[159*4+3]||b[109*160*4+3]||b[110*160*4-1])errors.push('Nontransparent background corners');
 const main=document.querySelector('main');
 for(const [canvas,title] of [[left,'№ 87 · До'],[right,'№ 87 · Уж Natrix natrix · После']]){
  const figure=document.createElement('figure'),caption=document.createElement('figcaption');
  caption.textContent=title;figure.append(canvas,caption);main.append(figure);
 }
 document.title=errors.length?'SNAKE87_FAIL':'SNAKE87_PASS';
 document.body.dataset.report=btoa(unescape(encodeURIComponent(JSON.stringify({errors,pixels,diff,gold,collar}))));
 })();
});
const html='<!doctype html><html lang="ru"><meta charset="utf-8"><title>Snake audit</title>'+
 '<style>html,body{margin:0;background:#120f1d;color:#d8b783;font-family:Georgia;width:1100px;height:525px;overflow:hidden}h1{text-align:center;font-weight:400}main{display:flex;justify-content:center;gap:24px}figure{margin:0;padding:14px;background:#211b2b;border:1px solid #977b55}canvas{width:480px;height:330px;background:#15111d;display:block}figcaption{text-align:center;padding:12px}</style>'+
 '<h1>Анимагия · проверка рисунка ужа № 87</h1><main></main>'+
 '<script>window.AnimagiaAnimalAtlas={imageUrl:"",resolve:r=>r?.[4]==="Anura"?{id:"frog"}:null,classify:()=>null,style:()=>({}),render:()=>{},drawCanvas:()=>true,drawable:async()=>null};</script>'+
 '<script src="./animal_atlas_100.js"></script><script>('+src+')();</script>';
const file=path.resolve('qa-grass-snake87.html'),out=path.resolve('qa-artifacts/grass-snake87-before-after.png');
fs.mkdirSync('qa-artifacts',{recursive:true});fs.writeFileSync(file,html);
let chrome='';
for(const c of [process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/chromium','chromium'].filter(Boolean))
 if(spawnSync(c,['--version'],{encoding:'utf8',timeout:3000}).status===0){chrome=c;break;}
if(!chrome)throw Error('Chromium required');
const args=['--headless','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--allow-file-access-from-files','--hide-scrollbars','--window-size=1100,525','--virtual-time-budget=2000','--force-device-scale-factor=1'];
try{
 const c=spawnSync(chrome,[...args,'--dump-dom','file://'+file],{encoding:'utf8',timeout:65000,maxBuffer:5*1024*1024});
 if(c.status!==0||c.error)throw Error('Chromium failed');
 const m=c.stdout.match(/data-report="([^"]+)"/);
 if(!m)throw Error('Browser did not finish '+c.stdout.slice(-250));
 const report=JSON.parse(Buffer.from(m[1],'base64').toString('utf8'));
 if(report.errors.length)throw Error('Visual snake QA: '+JSON.stringify(report));
 const screenshot=spawnSync(chrome,[...args,'--screenshot='+out,'file://'+file],{encoding:'utf8',timeout:65000});
 if(screenshot.status!==0||fs.statSync(out).size<19000)throw Error('Missing screenshot of real Chromium drawing');
 console.log('GRASS_SNAKE_87_CHROMIUM_PASSED '+JSON.stringify(report));
}finally{fs.rmSync(file,{force:true});}
