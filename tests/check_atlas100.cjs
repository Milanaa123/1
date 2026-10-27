'use strict';
const fs=require('fs'),path=require('path'),os=require('os'),{spawnSync}=require('child_process');
const source=fs.readFileSync('animal_atlas_100.js','utf8');
const file=path.join(process.cwd(),'qa-atlas100-browser.html');
const screen=path.join('qa-artifacts','atlas100-browser.png');
fs.mkdirSync('qa-artifacts',{recursive:true});
const body=String.raw`(async()=>{
const names=window.AnimagiaAnimalAtlas.list;
const asset=await window.AnimagiaAnimalAtlas.drawable();
const image=asset?.newSheet;
const errors=[];
if(!image||image.naturalWidth!==1600||image.naturalHeight!==1100)
 errors.push('Asset size or load failed');
let minAlpha=Infinity;
for(let i=0;i<100;i++){
 const c=document.createElement('canvas');c.width=160;c.height=110;
 const ctx=c.getContext('2d',{willReadFrequently:true});
 if(image)ctx.drawImage(image,(i%10)*160,Math.floor(i/10)*110,160,110,0,0,160,110);
 const d=ctx.getImageData(0,0,160,110).data;
 let covered=0;for(let j=3;j<d.length;j+=4)if(d[j]>32)covered++;
 minAlpha=Math.min(minAlpha,covered);
 if(covered<600)errors.push('Picture '+(i+1)+' has no distinct visible animal');
 const t=document.createElement('figure');t.append(c);
 const h=document.createElement('figcaption');h.textContent=(i+1)+'. '+names[i].name;t.append(h);
 document.querySelector('main').append(t);
}
const unsupported=window.AnimagiaAnimalAtlas.resolve([10,'Bowie sagittatus','species','Arachnida','Araneae','','Arthropoda']);
if(unsupported?.artSet==='atlas100')errors.push('An unrelated spider received a curated animal');
document.body.dataset.qa=btoa(JSON.stringify({errors,minAlpha,count:names.length}));
document.title=errors.length?'ANIMAGIA_100_FAIL':'ANIMAGIA_100_PASS';
})();`;
const html=`<!doctype html><html lang="ru"><meta charset="utf-8"/><title>Loading</title><style>*{box-sizing:border-box}html,body{margin:0;background:#11101d;color:#e7c78a;font:15px Georgia}main{display:grid;grid-template-columns:repeat(10,170px);gap:8px;padding:12px}figure{width:170px;margin:0;background:#242034;border:1px solid #765c6a}canvas{width:168px;height:116px;display:block}figcaption{text-align:center;font-size:12px;height:29px}</style><main></main><script>window.AnimagiaAnimalAtlas={imageUrl:'',resolve:()=>null,classify:()=>null,style:()=>({}),drawCanvas:()=>true,render:()=>{},drawable:async()=>null};</script><script src="./animal_atlas_100.js"></script><script>${body}</script></html>`;
fs.writeFileSync(file,html);
let browser;
for(const x of [process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/chromium','google-chrome','chromium'].filter(Boolean))
 if(spawnSync(x,['--version'],{timeout:3000}).status===0){browser=x;break;}
if(!browser)throw Error('Chromium unavailable');
const args=['--headless','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--hide-scrollbars','--window-size=1810,1630','--virtual-time-budget=1200'];
try{
 const dom=spawnSync(browser,[...args,'--dump-dom','file://'+file],{encoding:'utf8',timeout:60000,maxBuffer:4*1024*1024});
 if(dom.status!==0)throw Error('Chromium failed '+dom.status);
 const m=dom.stdout.match(/data-qa="([^\"]+)"/);
 if(!m)throw Error('Page did not finish '+dom.stdout.slice(-500));
 const result=JSON.parse(Buffer.from(m[1],'base64').toString());
 if(result.errors?.length)throw Error(result.errors.join('; '));
 if(result.count!==100||result.minAlpha<600)throw Error('100 sprites not validated');
 const png=spawnSync(browser,[...args,'--screenshot='+path.resolve(screen),'file://'+file],{encoding:'utf8',timeout:60000});
 if(png.status!==0||!fs.existsSync(screen)||fs.statSync(screen).size<80000)throw Error('Screenshot failed');
 console.log('CURATED_100_REAL_CHROMIUM_PASSED '+JSON.stringify(result));
}finally{fs.rmSync(file,{force:true})}