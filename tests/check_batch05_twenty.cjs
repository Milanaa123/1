'use strict';
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const src=String(function(){
 const cases=[
   [
     "Эму",
     "Dromaius novaehollandiae",
     "Aves",
     "Casuariiformes"
   ],
   [
     "Страус",
     "Struthio camelus",
     "Aves",
     "Struthioniformes"
   ],
   [
     "Казуар",
     "Casuarius casuarius",
     "Aves",
     "Casuariiformes"
   ],
   [
     "Киви",
     "Apteryx australis",
     "Aves",
     "Apterygiformes"
   ],
   [
     "Пингвин",
     "Aptenodytes forsteri",
     "Aves",
     "Sphenisciformes"
   ],
   [
     "Кит",
     "Balaenoptera musculus",
     "Mammalia",
     "Cetartiodactyla"
   ],
   [
     "Дельфин",
     "Tursiops truncatus",
     "Mammalia",
     "Cetartiodactyla"
   ],
   [
     "Косатка",
     "Orcinus orca",
     "Mammalia",
     "Cetartiodactyla"
   ],
   [
     "Акула",
     "Carcharodon carcharias",
     "Chondrichthyes",
     "Lamniformes"
   ],
   [
     "Скат",
     "Mobula birostris",
     "Chondrichthyes",
     "Myliobatiformes"
   ],
   [
     "Тюлень",
     "Phoca vitulina",
     "Mammalia",
     "Carnivora"
   ],
   [
     "Морской лев",
     "Zalophus californianus",
     "Mammalia",
     "Carnivora"
   ],
   [
     "Морж",
     "Odobenus rosmarus",
     "Mammalia",
     "Carnivora"
   ],
   [
     "Ламантин",
     "Trichechus manatus",
     "Mammalia",
     "Sirenia"
   ],
   [
     "Морская выдра",
     "Enhydra lutris",
     "Mammalia",
     "Carnivora"
   ],
   [
     "Черепаха",
     "Testudo graeca",
     "Reptilia",
     "Testudines"
   ],
   [
     "Морская черепаха",
     "Chelonia mydas",
     "Reptilia",
     "Testudines"
   ],
   [
     "Ящерица",
     "Lacerta agilis",
     "Reptilia",
     "Squamata"
   ],
   [
     "Игуана",
     "Iguana iguana",
     "Reptilia",
     "Squamata"
   ],
   [
     "Хамелеон",
     "Chamaeleo chamaeleon",
     "Reptilia",
     "Squamata"
   ]
 ];
 (async()=>{
 const atlas=window.AnimagiaAnimalAtlas,loaded=await atlas.drawable();
 const im=loaded?.newSheet,errors=[],records=[];
 if(!im||im.naturalWidth!==1600||im.naturalHeight!==1100)
  errors.push('Original approved 100-art sheet did not load');
 const main=document.querySelector('main');
 function coverage(canvas){
  const d=canvas.getContext('2d',{willReadFrequently:true})
    .getImageData(0,0,160,110).data;
  let count=0,sum=0;
  for(let i=3;i<d.length;i+=4){if(d[i]>24)count++;sum+=d[i];}
  return {count,sum};
 }
 for(let k=0;k<cases.length;k++){
  const i=k+65,[name,latin,cls,order]=cases[k];
  const p=atlas.resolve([1878,latin,'species',cls,order,'','Chordata']);
  if(!p||p.cell!==i||p.reviewedBatch!==5||p.artSet!=='atlas100')
   errors.push('Wrong animal sprite / batch: '+name);
  const item=document.createElement('figure');
  const pair=document.createElement('div');pair.className='pair';
  const before=document.createElement('canvas'),after=document.createElement('canvas');
  for(const c of [before,after]){c.width=160;c.height=110;}
  if(im){
   before.getContext('2d').drawImage(im,(i%10)*160,Math.floor(i/10)*110,
     160,110,0,0,160,110);
   if(p)atlas.drawCanvas(after.getContext('2d',{willReadFrequently:true}),
     loaded,p,0,0,160,110);
  }
  pair.append(before,after);
  const cap=document.createElement('figcaption');
  cap.textContent=(i+1)+' · '+name;
  item.append(pair,cap);main.append(item);
  const old=coverage(before),now=coverage(after);
  if(!now.count)errors.push(name+' produced a transparent blank');
  const afterCtx=after.getContext('2d',{willReadFrequently:true});
  const px=afterCtx.getImageData(0,0,160,110).data;
  const corners=[3,(159*4)+3,((109*160)*4)+3,((110*160-1)*4)+3];
  if(corners.some(q=>px[q]>12))errors.push(name+' has an opaque corner background');
  if(atlas.correctedIndices.includes(i+1)&&(!loaded.corrected||loaded.corrected.naturalWidth!==1600))
    errors.push(name+' has no loaded anatomical correction');
  if(old.count<400)errors.push(name+' source disappeared');
  if(atlas.correctedIndices.includes(i+1)){
   if(now.count<350||now.sum<23000)errors.push(name+' corrected species artwork missing');
   if(now.count>7000)errors.push(name+' corrected artwork contains opaque background');
  }else{
   if(now.count<old.count*.50)errors.push(name+' body was clipped or erased');
   if(now.count>old.count*1.09)errors.push(name+' background transparency expanded');
   if(now.sum<old.sum*.49)errors.push(name+' thin gold line lost');
  }
  records.push({number:i+1,name,retained:Math.round(now.sum/Math.max(1,old.sum)*100),
    alphaOld:old.count,alphaNew:now.count});
 }
 const frog=atlas.resolve([1878,'Cornufer opisthodon','species','Amphibia','Anura','','Chordata']);
 if(frog?.id!=='frog')errors.push('Approved frog lost');
 if(atlas.list.length!==100)errors.push('100 master animals changed');
 document.title=errors.length?'BATCH05_FAIL':'BATCH05_PASS';
 document.body.dataset.proof=btoa(unescape(encodeURIComponent(JSON.stringify({errors,records}))));
 })();
});
const html='<!doctype html><html lang="ru"><meta charset="utf-8"><title>Checking</title>'+
 '<style>*{box-sizing:border-box}html,body{margin:0;width:1790px;height:790px;overflow:hidden;background:#100d1b;color:#dfba83;font:15px Georgia}'+
 'header{text-align:center;font-size:21px;letter-spacing:2px;height:52px;padding:13px}'+
 'main{display:grid;grid-template-columns:repeat(5,340px);gap:9px;padding:9px 22px}'+
 'figure{margin:0;width:340px;height:168px;background:#211c2f;border:1px solid #8f7149}'+
 '.pair{display:flex;gap:12px;padding:8px 4px}canvas{width:158px;height:109px;background:#100d1b}'+
 'figcaption{text-align:center;font-size:14px;height:36px;padding:4px}</style>'+
 '<header>АНИМАГИЯ · 20 РИСУНКОВ · ИСХОДНИК / ОЧИЩЕННЫЙ ПРОЗРАЧНЫЙ СЛОЙ</header>'+
 '<main></main>'+
 '<script>window.AnimagiaAnimalAtlas={imageUrl:"",resolve:r=>r?.[4]==="Anura"?{id:"frog",cell:18}:null,classify:()=>null,'+
 'style:()=>({}),render:()=>{},drawCanvas:()=>true,drawable:async()=>null};</script>'+
 '<script src="./animal_atlas_100.js"></script>'+
 '<script>('+src+')();</script>';
const file=path.join(process.cwd(),'qa-batch05-twenty.html');
fs.writeFileSync(file,html);fs.mkdirSync('qa-artifacts',{recursive:true});
const out=path.resolve('qa-artifacts/batch05-twenty-before-after.png');
let chrome='';
for(const c of [process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/chromium','chromium'].filter(Boolean))
 if(spawnSync(c,['--version'],{encoding:'utf8',timeout:3000}).status===0){chrome=c;break;}
if(!chrome)throw Error('Chromium is needed to verify the real silhouettes');
const args=['--headless','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
 '--allow-file-access-from-files','--hide-scrollbars','--window-size=1790,790',
 '--virtual-time-budget=1600','--force-device-scale-factor=1'];
try{
 const r=spawnSync(chrome,[...args,'--dump-dom','file://'+file],
  {encoding:'utf8',timeout:65000,maxBuffer:5*1024*1024});
 if(r.error)throw r.error;
 if(r.status!==0)throw Error('Chrome canvas check failed '+r.status);
 const m=r.stdout.match(/data-proof="([^"]+)"/);
 if(!m)throw Error('20 animals did not finish browser check: '+r.stdout.slice(-850));
 const report=JSON.parse(Buffer.from(m[1],'base64').toString('utf8'));
 if(report.errors.length)throw Error(report.errors.join('; '));
 if(report.records.length!==20)throw Error('Not all 20 drawings were checked');
 if(report.records[0].number!==66||report.records[19].number!==85)
  throw Error('Unexpected start or end of checked fifth batch');
 const shot=spawnSync(chrome,[...args,'--screenshot='+out,'file://'+file],
  {encoding:'utf8',timeout:65000,maxBuffer:2*1024*1024});
 if(shot.error)throw shot.error;
 if(shot.status!==0||fs.statSync(out).size<45000)throw Error('Actual picture proof empty');
 console.log('BATCH05_TWENTY_ART_BROWSER_PASSED '+JSON.stringify(report.records));
}finally{fs.rmSync(file,{force:true});}
