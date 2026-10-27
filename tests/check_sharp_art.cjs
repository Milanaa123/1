'use strict';
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const script=String(function(){
 (async()=>{
 const atlas=window.AnimagiaAnimalAtlas,assets=await atlas.drawable(),errors=[],proof=[];
 if(!assets?.sharpSheet||assets.sharpSheet.naturalWidth!==6400||assets.sharpSheet.naturalHeight!==4400)errors.push('4x main atlas missing');
 if(!assets?.sharpCorrected||assets.sharpCorrected.naturalWidth!==6400||assets.sharpCorrected.naturalHeight!==4400)errors.push('4x corrected atlas missing');
 const examples=[
  ['Тигр','Panthera tigris','Mammalia','Carnivora',5],
  ['Ягуар','Panthera onca','Mammalia','Carnivora',8],
  ['Белка','Sciurus vulgaris','Mammalia','Rodentia',52],
  ['Кит','Balaenoptera musculus','Mammalia','Cetartiodactyla',70],
 ];
 const main=document.querySelector('main');
 for(const [name,scientific,cls,order,i] of examples){
  const profile=atlas.resolve([1878,scientific,'species',cls,order,'','Chordata']);
  if(profile?.cell!==i)errors.push('Taxon art is wrong '+name);
  const old=document.createElement('canvas'),newArt=document.createElement('canvas');
  for(const c of [old,newArt]){c.width=640;c.height=440;}
  const o=old.getContext('2d',{willReadFrequently:true});
  if(assets?.newSheet)o.drawImage(assets.newSheet,(i%10)*160,Math.floor(i/10)*110,160,110,32,22,576,396);
  const n=newArt.getContext('2d',{willReadFrequently:true});
  if(!atlas.drawCanvas(n,assets,profile,0,0,640,440))errors.push('Draw failed '+name);
  const before=o.getImageData(0,0,640,440).data,after=n.getImageData(0,0,640,440).data;
  let diff=0,visible=0;
  for(let p=0;p<after.length;p+=4){diff+=Math.abs(before[p]-after[p])+Math.abs(before[p+3]-after[p+3]);if(after[p+3]>24)visible++;}
  if(diff<20000)errors.push('Crisp rendering is identical to low-res '+name);
  if(visible<2500)errors.push('Crisp image disappeared '+name);
  const item=document.createElement('figure'),pair=document.createElement('div'),cap=document.createElement('figcaption');
  pair.className='pair';pair.append(old,newArt);cap.textContent=name+' · слева старое масштабирование, справа чёткое 4×';
  item.append(pair,cap);main.append(item);
  proof.push({name,visible,diff});
 }
 const wolf=atlas.resolve([1878,'Canis lupus','species','Mammalia','Carnivora','','Chordata']);
 if(wolf?.approvedIndex!==0)errors.push('The individually approved first five changed');
 const wcanvas=document.createElement('canvas');wcanvas.width=640;wcanvas.height=440;
 if(!atlas.drawCanvas(wcanvas.getContext('2d'),assets,wolf,0,0,640,440))errors.push('Approved wolf failed to render with 4x assets');
 document.title=errors.length?'SHARP_ART_FAIL':'SHARP_ART_PASS';
 document.body.dataset.proof=btoa(unescape(encodeURIComponent(JSON.stringify({errors,proof}))));
 })();
});
const html='<!doctype html><html lang="ru"><meta charset="utf-8"><title>Sharp art QA</title>'+
 '<style>body{margin:0;background:#120f1c;color:#e6bd7c;font:16px Georgia;width:1350px}'+
 'main{display:grid;gap:12px}figure{margin:0 auto;padding:10px;border:1px solid #977448;width:1300px}'+
 '.pair{display:flex;gap:14px}canvas{display:block;background:#17131e;width:630px;height:430px}'+
 'figcaption{text-align:center;padding:9px}</style><main></main>'+
 '<script src="./animal_atlas.js"></script><script src="./animal_atlas_100.js"></script>'+
 '<script>('+script+')();</script>';
const file=path.resolve('qa-sharp-art.html'),shot=path.resolve('qa-artifacts/sharp-art-before-after.png');
fs.mkdirSync('qa-artifacts',{recursive:true});fs.writeFileSync(file,html);
let browser='';
for(const candidate of [process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/chromium','chromium'].filter(Boolean))
 if(spawnSync(candidate,['--version'],{encoding:'utf8',timeout:3000}).status===0){browser=candidate;break;}
if(!browser)throw Error('Chromium browser is required');
const flags=['--headless','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--allow-file-access-from-files','--hide-scrollbars','--window-size=1350,1870','--virtual-time-budget=3000'];
try{
 const result=spawnSync(browser,[...flags,'--dump-dom','file://'+file],{encoding:'utf8',timeout:125000,maxBuffer:9*1024*1024});
 if(result.error||result.status!==0)throw Error('Chromium failed: '+(result.error||result.status));
 const m=result.stdout.match(/data-proof="([^"]+)"/);
 if(!m)throw Error('Chromium did not finish sharp-art audit '+result.stdout.slice(-350));
 const report=JSON.parse(Buffer.from(m[1],'base64').toString('utf8'));
 if(report.errors.length||report.proof.length!==4)throw Error('Sharp art quality fail '+JSON.stringify(report));
 const s=spawnSync(browser,[...flags,'--screenshot='+shot,'file://'+file],{encoding:'utf8',timeout:125000});
 if(s.error||s.status!==0||fs.statSync(shot).size<70000)throw Error('Screenshot did not render');
 console.log('SHARP_ALL100_ART_CHROMIUM_PASSED '+JSON.stringify(report.proof));
}finally{fs.rmSync(file,{force:true});}
