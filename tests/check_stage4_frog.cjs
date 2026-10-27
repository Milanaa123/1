'use strict';
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {spawnSync}=require('node:child_process');
const source=fs.readFileSync('animal_atlas.js','utf8');
const asset=fs.readFileSync('qa-artifacts/animals-gold-v1.png');
if(asset.length<50000)throw Error('Actual source image unavailable');
const embedded=source.replace("const URL_SHEET='./art/animals-gold-v1.png';",
 "const URL_SHEET='data:image/png;base64,"+asset.toString('base64')+"';");
if(embedded===source)throw Error('Atlas source asset string not found');
const script="(async function(){\n const atlas=window.AnimagiaAnimalAtlas;\n const img=await atlas.drawable();\n const errors=[];\n if(!img)throw Error('The original curated sprite sheet did not load');\n const row=[1878,'Cornufer opisthodon','species','Amphibia','Anura','','Chordata'];\n const frog=atlas.resolve(row);\n if(!frog||frog.id!=='frog'||frog.cell!==18)errors.push('Frog assigned wrong illustration');\n const cellW=Math.round(img.naturalWidth/5),cellH=Math.round(img.naturalHeight/4);\n const target=document.querySelector('#preview');\n const ctx=target.getContext('2d',{willReadFrequently:true});\n ctx.fillStyle='#090a15';ctx.fillRect(0,0,1200,1160);\n ctx.fillStyle='#e5c78e';ctx.font='31px Georgia, serif';\n ctx.fillText('ЭТАП 4 · ЛЯГУШКА / ИСХОДНЫЙ РИСУНОК И ИСПРАВЛЕННЫЙ ОБЛИК',48,55);\n ctx.drawImage(img,3*cellW,3*cellH,cellW,cellH,65,105,500,435);\n ctx.fillStyle='#dbc6a5';ctx.font='24px Georgia,serif';\n ctx.fillText('Исходная ячейка · содержит фон',82,585);\n atlas.drawCanvas(ctx,img,frog,635,105,500,435);\n ctx.fillText('Прозрачный облик · морда и ноздря',635,585);\n // Stage-four preview includes the exact card art fit instead of a mockup.\n ctx.strokeStyle='#d8b481';ctx.lineWidth=2;\n ctx.strokeRect(610,86,540,474);\n const isolated=document.createElement('div');\n document.body.appendChild(isolated);\n atlas.render(isolated,frog);\n await new Promise(resolve=>setTimeout(resolve,350));\n const cutout=isolated.querySelector('canvas');\n if(!cutout||cutout.width<100)errors.push('Transparent frog cutout is missing');\n let nosePixels=0,transparent=0,coverage=0;\n if(cutout?.width>100){\n  const c=cutout.getContext('2d',{willReadFrequently:true});\n  const xScale=cutout.width/307,yScale=cutout.height/256;\n  for(let gy=86;gy<=99;gy++)for(let gx=263;gx<=279;gx++){\n   const pixel=c.getImageData(Math.floor(gx*xScale),Math.floor(gy*yScale),1,1).data;\n   if(pixel[3]>50)nosePixels++;\n  }\n  const p=c.getImageData(0,0,cutout.width,cutout.height).data;\n  for(let i=3;i<p.length;i+=4){\n   if(p[i]===0)transparent++;\n   if(p[i]>=80)coverage++;\n  }\n  // Enlarge the actual corrected cutout's muzzle to inspect by eye.\n  ctx.imageSmoothingEnabled=true;\n  ctx.fillStyle='#14101f';ctx.fillRect(620,650,495,380);\n  ctx.drawImage(cutout,Math.floor(205*xScale),Math.floor(45*yScale),\n   Math.floor(98*xScale),Math.floor(111*yScale),650,650,400,345);\n  ctx.strokeStyle='#c6a578';ctx.strokeRect(620,650,495,380);\n  ctx.fillStyle='#f2d9ae';ctx.fillText('Увеличенная морда: контур и ноздря',650,1092);\n }\n if(nosePixels<10)errors.push('Nose is not visible in the actual alpha cutout: '+nosePixels);\n if(transparent<cutout.width*cutout.height*.1)errors.push('Sprite background was not removed');\n if(coverage<cutout.width*cutout.height*.01)errors.push('Art disappeared during cutout');\n document.title=errors.length?'ANIMAGIA_STAGE4_FAIL':'ANIMAGIA_STAGE4_PASS';\n document.body.dataset.stage4=btoa(JSON.stringify({errors,nosePixels,transparent,coverage,sourceW:img.naturalWidth,sourceH:img.naturalHeight}));\n})();";
const html='<!doctype html><html><head><meta charset="utf-8"><title>checking</title>'+
 '<style>*{margin:0;padding:0}html,body{width:1200px;height:1160px;overflow:hidden;background:#090a15}canvas{display:block}</style>'+
 '</head><body><canvas id="preview" width="1200" height="1160"></canvas>'+
 '<script>'+embedded+'\n'+script+'</script></body></html>';
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'animagia-stage4-'));
const file=path.join(tmp,'frog.html'),out='qa-artifacts/stage4-frog-nose.png';
fs.writeFileSync(file,html);
const candidates=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/chromium',
 '/usr/bin/chromium-browser','google-chrome','chromium'].filter(Boolean);
let binary;
for(const candidate of candidates){
 if(spawnSync(candidate,['--version'],{encoding:'utf8',timeout:5000}).status===0){
  binary=candidate;break;
 }
}
if(!binary)throw Error('Real Chromium is necessary for stage-four frog QA');
const args=['--headless','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
 '--disable-extensions','--disable-background-networking','--hide-scrollbars',
 '--window-size=1200,1160','--force-device-scale-factor=1','--virtual-time-budget=1600'];
try{
 const r=spawnSync(binary,[...args,'--dump-dom','file://'+file],
  {encoding:'utf8',timeout:70000,maxBuffer:4*1024*1024});
 if(r.error)throw r.error;
 if(r.status!==0)throw Error('Chrome frog inspector exited '+r.status);
 const m=r.stdout.match(/data-stage4="([^"]+)"/);
 if(!m)throw Error('Frog test never finished '+r.stdout.slice(-950));
 const report=JSON.parse(Buffer.from(m[1],'base64').toString('utf8'));
 if(report.errors.length)throw Error(report.errors.join('; '));
 const screenshot=spawnSync(binary,[...args,'--screenshot='+path.resolve(out),'file://'+file],
  {encoding:'utf8',timeout:70000,maxBuffer:4*1024*1024});
 if(screenshot.error)throw screenshot.error;
 if(screenshot.status!==0)throw Error('Frog screenshot failed');
 if(fs.statSync(out).size<35000)throw Error('Frog screenshot nearly empty');
 console.log('STAGE4_REAL_FROG_NOSE_QA_PASSED '+JSON.stringify(report));
}finally{fs.rmSync(tmp,{recursive:true,force:true})}
