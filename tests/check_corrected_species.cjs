'use strict';
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const animals=[[6,"Тигр"],[7,"Снежный барс"],[9,"Ягуар"],[10,"Пума"],[14,"Выдра"],[19,"Рысь"],[24,"Ворона"],[29,"Чайка"],[30,"Колибри"],[33,"Косуля"],[35,"Кабан"],[40,"Серна"],[46,"Антилопа"],[47,"Газель"],[48,"Верблюд"],[53,"Белка"],[54,"Бобр"],[65,"Тасманийский дьявол"],[68,"Казуар"],[78,"Морж"],[81,"Черепаха"],[86,"Геккон"]];
const functionText=String(function(){
 (async()=>{
 const atlas=window.AnimagiaAnimalAtlas,assets=await atlas.drawable(),errors=[],proof=[];
 const main=document.querySelector('main');
 if(!assets?.newSheet||assets.newSheet.naturalWidth!==1600)errors.push('Original master atlas missing');
 if(!assets?.corrected||assets.corrected.naturalWidth!==1600||assets.corrected.naturalHeight!==1100)
   errors.push('Corrected 22-species transparent sheet missing');
 if(atlas.correctedIndices.join(',')!==animals.map(a=>a[0]).join(','))errors.push('Correction indices mismatch');
 if(!errors.length){
 for(const [num,name] of animals){
  const idx=num-1,before=document.createElement('canvas'),after=document.createElement('canvas');
  before.width=after.width=160;before.height=after.height=110;
  before.getContext('2d').drawImage(assets.newSheet,(idx%10)*160,Math.floor(idx/10)*110,160,110,0,0,160,110);
  const render=atlas.drawCanvas(after.getContext('2d'),assets,{artSet:'atlas100',cell:idx,reviewedBatch:2},0,0,160,110);
  if(!render)errors.push('Corrected sprite not rendered: '+name);
  const pixels=after.getContext('2d',{willReadFrequently:true}).getImageData(0,0,160,110).data;
  let alpha=0,opaque=0;
  for(let i=3;i<pixels.length;i+=4){if(pixels[i]>24)alpha++;if(pixels[i]>245)opaque++;}
  if(alpha<350||alpha>7000)errors.push('Unexpected visible pixels '+name+' '+alpha);
  if(opaque>alpha*.95)errors.push('Nontransparent image '+name);
  const card=document.createElement('figure'),pair=document.createElement('div'),caption=document.createElement('figcaption');
  pair.className='pair';pair.append(before,after);caption.textContent=num+' · '+name;
  card.append(pair,caption);main.append(card);proof.push({number:num,name,alpha,opaque});
 }
 }
 const frog=atlas.resolve([1,'Cornufer opisthodon','species','Amphibia','Anura','','Chordata']);
 if(frog?.id!=='frog')errors.push('Specialised frog replaced');
 const lion=atlas.resolve([1,'Panthera leo','species','Mammalia','Carnivora','','Chordata']);
 if(lion?.approvedIndex!==4)errors.push('Approved lion replaced');
 if(atlas.list.length!==100)errors.push('100-entry curated index changed');
 document.body.dataset.proof=btoa(unescape(encodeURIComponent(JSON.stringify({errors,proof}))));
 document.title=errors.length?'CORRECTIONS_FAIL':'CORRECTIONS_PASS';
 })();
});
const page='<!doctype html><html lang="ru"><meta charset="utf-8"><title>Loading</title>'+
 '<style>*{box-sizing:border-box}html,body{margin:0;width:1790px;height:950px;overflow:hidden;background:#100d1b;color:#dfba83;font:15px Georgia}'+
 'main{display:grid;grid-template-columns:repeat(5,340px);gap:9px;padding:9px 22px}'+
 'figure{margin:0;width:340px;height:178px;background:#211c2f;border:1px solid #8f7149}'+
 '.pair{display:flex;gap:12px;padding:8px 4px}canvas{width:158px;height:109px;background:#100d1b}'+
 'figcaption{text-align:center;font-size:14px;height:38px;padding:4px}</style><main></main>'+
 '<script>window.AnimagiaAnimalAtlas={imageUrl:"",resolve:r=>r?.[4]==="Anura"?{id:"frog"}:r?.[1]==="Panthera leo"?{id:"lion",approvedIndex:4}:null,classify:()=>null,'+
 'style:()=>({}),render:()=>{},drawCanvas:()=>true,drawable:async()=>null};</script>'+
 '<script src="./animal_atlas_100.js"></script><script>const animals=[[6,"Тигр"],[7,"Снежный барс"],[9,"Ягуар"],[10,"Пума"],[14,"Выдра"],[19,"Рысь"],[24,"Ворона"],[29,"Чайка"],[30,"Колибри"],[33,"Косуля"],[35,"Кабан"],[40,"Серна"],[46,"Антилопа"],[47,"Газель"],[48,"Верблюд"],[53,"Белка"],[54,"Бобр"],[65,"Тасманийский дьявол"],[68,"Казуар"],[78,"Морж"],[81,"Черепаха"],[86,"Геккон"]];('+functionText+')();</script>';
const filename=path.resolve('qa-22-corrections.html');fs.writeFileSync(filename,page);
fs.mkdirSync('qa-artifacts',{recursive:true});
let browser='';
for(const x of [process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/chromium','chromium'].filter(Boolean))
 if(spawnSync(x,['--version'],{encoding:'utf8',timeout:3000}).status===0){browser=x;break;}
if(!browser)throw Error('Chromium missing');
const flags=['--headless','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--allow-file-access-from-files','--hide-scrollbars','--window-size=1790,950','--virtual-time-budget=1600'];
try{
 const a=spawnSync(browser,[...flags,'--dump-dom','file://'+filename],{encoding:'utf8',timeout:65000,maxBuffer:6*1024*1024});
 if(a.status!==0||a.error)throw Error('Browser failed '+(a.error||a.status));
 const match=a.stdout.match(/data-proof="([^"]+)"/);
 if(!match)throw Error('Browser validation did not complete '+a.stdout.slice(-600));
 const report=JSON.parse(Buffer.from(match[1],'base64').toString('utf8'));
 if(report.errors.length||report.proof.length!==22)throw Error('Species corrections failed: '+JSON.stringify(report));
 const dest=path.resolve('qa-artifacts/corrected-22-in-browser.png');
 const shot=spawnSync(browser,[...flags,'--screenshot='+dest,'file://'+filename],{encoding:'utf8',timeout:65000});
 if(shot.status!==0||fs.statSync(dest).size<30000)throw Error('Missing corrected image comparison screenshot');
 console.log('CORRECTED_22_SPECIES_BROWSER_PASSED '+JSON.stringify(report.proof));
}finally{fs.rmSync(filename,{force:true});}
