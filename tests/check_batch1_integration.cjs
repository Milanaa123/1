'use strict';
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {spawnSync}=require('node:child_process');
const binary=fs.readFileSync('art/animals-approved-01-05.png');
const dataURL='data:image/png;base64,'+binary.toString('base64');
let atlas=fs.readFileSync('animal_atlas.js','utf8');
for(const expr of ["const URL_SHEET='./art/animals-gold-v1.png';",
 "const BATCH_01_URL='./art/animals-approved-01-05.png';"]){
 if(!atlas.includes(expr))throw Error('Atlas source changed: '+expr);
}
atlas=atlas.replace("const URL_SHEET='./art/animals-gold-v1.png';",
 'const URL_SHEET='+JSON.stringify(dataURL)+';');
atlas=atlas.replace("const BATCH_01_URL='./art/animals-approved-01-05.png';",
 'const BATCH_01_URL='+JSON.stringify(dataURL)+';');
const check="(async function(){\n const atlas=window.AnimagiaAnimalAtlas;\n const examples=[\n  ['Волк','Canis lupus',0],\n  ['Лиса','Vulpes vulpes',1],\n  ['Собака','Canis familiaris',2],\n  ['Кошка','Felis catus',3],\n  ['Лев','Panthera leo',4]\n ];\n const sheet=await atlas.drawable(),ctx=document.getElementById('screen').getContext('2d',{willReadFrequently:true});\n let errors=[],samples=[];\n if(!sheet)errors.push('Legacy atlas failed to initialize');\n ctx.fillStyle='#0c0b16';ctx.fillRect(0,0,1200,500);\n for(let i=0;i<examples.length;i++){\n  const [label,latin,index]=examples[i],row=[1878,latin,'species','Mammalia','Carnivora','','Chordata'];\n  const profile=atlas.resolve(row);\n  if(!profile||profile.approvedIndex!==index){errors.push('Wrong source '+latin);continue;}\n  const x=30+i*235,y=65;\n  const success=atlas.drawCanvas(ctx,sheet,profile,x,y,220,290);\n  if(!success){errors.push('Image not drawn '+latin);continue;}\n  const area=ctx.getImageData(x,y,220,290).data;\n  let glow=0;for(let k=0;k<area.length;k+=4)if(area[k]>130&&area[k+1]>75&&area[k+2]<area[k])glow++;\n  if(glow<120)errors.push('Blank art '+latin+' '+glow);\n  ctx.textAlign='center';ctx.font='28px Georgia,serif';ctx.fillStyle='#ebcf96';\n  ctx.fillText(label,x+110,390);\n  ctx.font='17px Georgia,serif';ctx.fillText(latin,x+110,430);\n  samples.push({latin,approvedIndex:index,glow});\n }\n document.title=errors.length?'BATCH1_INTEGRATION_FAIL':'BATCH1_INTEGRATION_PASS';\n document.body.dataset.integrated=btoa(unescape(encodeURIComponent(JSON.stringify({errors,samples}))));\n})();";
const page='<!doctype html><html><head><meta charset="utf-8"><title>Loading</title>'+
 '<style>html,body{width:1200px;height:500px;overflow:hidden;margin:0;background:#0c0b16}canvas{display:block}</style>'+
 '</head><body><canvas id="screen" width="1200" height="500"></canvas><script>'+
 atlas+'\n'+check+'</script></body></html>';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'five-gold-art-'));
const html=path.join(dir,'cards.html');fs.writeFileSync(html,page);
const out=path.join(process.cwd(),'qa-artifacts','batch01-integrated-cards.png');
fs.mkdirSync(path.dirname(out),{recursive:true});
let chrome;
for(const candidate of [process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/chromium','chromium'].filter(Boolean)){
 if(spawnSync(candidate,['--version'],{encoding:'utf8',timeout:5000}).status===0){chrome=candidate;break;}
}
if(!chrome)throw Error('Chrome required to check actual artist asset integration');
const args=['--headless','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
 '--hide-scrollbars','--disable-background-networking','--force-device-scale-factor=1',
 '--window-size=1200,500','--virtual-time-budget=1700'];
try{
 const dom=spawnSync(chrome,[...args,'--dump-dom','file://'+html],{encoding:'utf8',timeout:70000,maxBuffer:5*1024*1024});
 if(dom.error)throw dom.error;
 if(dom.status!==0)throw Error('Chrome exited '+dom.status);
 const match=dom.stdout.match(/data-integrated="([^"]+)"/);
 if(!match)throw Error('Atlas browser integration did not complete: '+dom.stdout.slice(-750));
 const report=JSON.parse(Buffer.from(match[1],'base64').toString('utf8'));
 if(report.errors.length)throw Error('First-five card integration: '+report.errors.join('; '));
 const shot=spawnSync(chrome,[...args,'--screenshot='+out,'file://'+html],{encoding:'utf8',timeout:70000});
 if(shot.error)throw shot.error;
 if(shot.status!==0||fs.statSync(out).size<15000)throw Error('Cards screenshot missing');
 console.log('FIVE_CURATED_ANIMALS_RENDER_IN_LIVE_CARD_PIPELINE '+JSON.stringify(report.samples));
}finally{fs.rmSync(dir,{recursive:true,force:true});}
