'use strict';
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const audit=String(function(){
 (async()=>{
 const api=window.AnimagiaAnimalAtlas,main=document.querySelector('main');
 const animals=[
  ['Тигр','Panthera tigris','Mammalia','Carnivora',5],
  ['Ягуар','Panthera onca','Mammalia','Carnivora',8],
  ['Белка','Sciurus vulgaris','Mammalia','Rodentia',52],
  ['Кит','Balaenoptera musculus','Mammalia','Cetartiodactyla',70],
  ['Уж','Natrix natrix','Reptilia','Squamata',86],
  ['Омар','Homarus gammarus','Malacostraca','Decapoda',99]
 ];
 const errors=[],results=[];
 for(const [title,latin,cls,order,index] of animals){
  const p=api.resolve([17,latin,'species',cls,order,'','Chordata']);
  if(p?.cell!==index){errors.push('Wrong animal routing '+title);continue;}
  const loaded=await api.drawable(p);
  if(!loaded?.singleArt||loaded?.singleCell!==index){errors.push('Missing single sharp image '+title);continue;}
  if(loaded.sharpSheet||loaded.sharpCorrected||loaded.newSheet){errors.push('10MB atlas requested for '+title);}
  if(index!==86&&(loaded.singleArt.naturalWidth!==640||loaded.singleArt.naturalHeight!==440))errors.push('Wrong 4x dimensions '+title);
  const canv=document.createElement('canvas');canv.width=640;canv.height=440;
  const ctx=canv.getContext('2d',{willReadFrequently:true});
  if(!api.drawCanvas(ctx,loaded,p,0,0,640,440))errors.push('No animal portrait '+title);
  const pixels=ctx.getImageData(0,0,640,440).data;let count=0;
  for(let j=3;j<pixels.length;j+=4)if(pixels[j]>24)count++;
  if(count<2200)errors.push('Portrait lost alpha '+title);
  const fig=document.createElement('figure');const label=document.createElement('figcaption');
  label.textContent=title+' · '+String(index+1).padStart(3,'0');fig.append(canv,label);main.append(fig);
  results.push({title,index:index+1,pixels:count});
 }
 const requests=performance.getEntriesByType('resource').map(r=>r.name);
 if(requests.some(url=>url.includes('animagia-100-sharp4x.webp')||url.includes('animagia-corrected-22-sharp4x.webp')))
  errors.push('Loaded unnecessary giant source atlases');
 if(results.length!==6)errors.push('Missing audit cards');
 document.title=errors.length?'ON_DEMAND_FAIL':'ON_DEMAND_PASS';
 document.body.dataset.results=btoa(unescape(encodeURIComponent(JSON.stringify({errors,results,requests:requests.filter(s=>s.includes('/art/')).length}))));
 })();
});
const html='<!doctype html><html lang="ru"><meta charset="utf-8"><title>Loading</title>'+
 '<style>body{background:#140f1e;color:#e8c08a;margin:0;font:17px Georgia}main{display:grid;grid-template-columns:repeat(3,420px);gap:16px;margin:16px}figure{margin:0;padding:8px;background:#231d30;border:1px solid #735438}canvas{width:400px;height:275px}figcaption{text-align:center}</style>'+
 '<main></main><script>window.AnimagiaAnimalAtlas={drawable:async()=>null,resolve:()=>null,drawCanvas:()=>false,classify:()=>null,style:()=>({}),render:()=>{},imageUrl:""};</script>'+
 '<script src="./animal_atlas_100.js"></script><script>('+audit+')();</script>';
const filename=path.resolve('qa-individual-art.html'),shot=path.resolve('qa-artifacts/on-demand-artwork.png');
fs.writeFileSync(filename,html);fs.mkdirSync('qa-artifacts',{recursive:true});
let bin='';
for(const candidate of [process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/chromium','chromium'].filter(Boolean))
 if(spawnSync(candidate,['--version'],{encoding:'utf8',timeout:3000}).status===0){bin=candidate;break;}
if(!bin)throw Error('Chromium missing');
const opts=['--headless','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--allow-file-access-from-files','--hide-scrollbars','--window-size=1330,760','--virtual-time-budget=2200'];
try{
 const run=spawnSync(bin,[...opts,'--dump-dom','file://'+filename],{encoding:'utf8',timeout:90000,maxBuffer:6*1024*1024});
 if(run.error||run.status!==0)throw Error('Chromium failed '+(run.error||run.status));
 const m=run.stdout.match(/data-results="([^"]+)"/);
 if(!m)throw Error('On-demand check did not finish '+run.stdout.slice(-450));
 const report=JSON.parse(Buffer.from(m[1],'base64').toString('utf8'));
 if(report.errors.length)throw Error('On-demand QA '+JSON.stringify(report));
 const screenshot=spawnSync(bin,[...opts,'--screenshot='+shot,'file://'+filename],{encoding:'utf8',timeout:90000});
 if(screenshot.error||screenshot.status!==0||fs.statSync(shot).size<30000)throw Error('Screenshot missing');
 console.log('ON_DEMAND_SIX_SPECIES_CHROMIUM_PASSED '+JSON.stringify(report));
}finally{fs.rmSync(filename,{force:true});}
