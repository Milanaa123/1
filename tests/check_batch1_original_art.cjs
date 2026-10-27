'use strict';
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {spawnSync}=require('node:child_process');
const image=fs.readFileSync('art/animals-approved-01-05.png');
if(image.length<2500)throw Error('First-five approved art asset missing');
const body=("(async function(){\n const img=new Image();img.src='data:image/png;base64,__INLINE_BITMAP__';\n await img.decode();\n const errors=[],offsets=[0,150,299,449,598,748];\n if(img.width!==748||img.height!==98)errors.push('wrong source dimensions');\n const root=document.getElementById('proof');\n const ctx=root.getContext('2d',{willReadFrequently:true});\n ctx.fillStyle='#0c0c19';ctx.fillRect(0,0,1250,520);\n ctx.textAlign='center';ctx.fillStyle='#edd2a1';ctx.font='29px Georgia,serif';\n ctx.fillText('АНИМАГИЯ · УТВЕРЖДЁННЫЕ ОРИГИНАЛЫ · ПЕРВАЯ ПЯТЁРКА',625,53);\n const names=['Волк','Лиса','Собака','Кошка','Лев'];\n const info=[];\n for(let k=0;k<5;k++){\n  const start=offsets[k],width=offsets[k+1]-start;\n  const scratch=document.createElement('canvas');scratch.width=width;scratch.height=98;\n  const sc=scratch.getContext('2d',{willReadFrequently:true});\n  sc.drawImage(img,start,0,width,98,0,0,width,98);\n  const image=sc.getImageData(0,0,width,98).data;\n  let blank=0,visible=0,nearEdges=0,pink=0;\n  for(let y=0;y<98;y++)for(let x=0;x<width;x++){\n   const i=(y*width+x)*4,a=image[i+3];\n   if(a===0)blank++;\n   if(a>90){visible++;if(x<=3||x>=width-4||y<=2||y>=95)nearEdges++;}\n   if(a>90&&image[i]<image[i+2])pink++;\n  }\n  const fraction=blank/(width*98);\n  if(fraction<.55)errors.push(names[k]+' lacks alpha');\n  if(visible<200)errors.push(names[k]+' drawing too faint');\n  if(nearEdges>12)errors.push(names[k]+' drawing clipped by source cell');\n  const px=25+k*244;\n  ctx.fillStyle='#2b1d33';ctx.fillRect(px,100,226,318);\n  ctx.strokeStyle='#d8ab78';ctx.lineWidth=2;ctx.strokeRect(px+4,104,218,310);\n  // Enlarged source, not a newly generated substitute.\n  ctx.drawImage(scratch,px+20,134,194,175);\n  ctx.font='25px Georgia,serif';ctx.fillStyle='#f1d4a2';\n  ctx.fillText(names[k],px+113,370);\n  info.push({name:names[k],visible,transparent:fraction.toFixed(3),nearEdges});\n }\n document.title=errors.length?'BATCH01_FAIL':'BATCH01_PASS';\n document.body.dataset.review=btoa(unescape(encodeURIComponent(JSON.stringify({errors,info}))));\n})();").replace('__INLINE_BITMAP__',image.toString('base64'));
const html='<html><head><meta charset="utf-8"><title>Rendering</title>'+
 '<style>html,body{margin:0;background:#090914}canvas{display:block}</style></head>'+
 '<body><canvas id="proof" width="1250" height="520"></canvas>'+
 '<script>'+body+'</script></body></html>';
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'approved-gold-'));
const webpage=path.join(temp,'originals.html');
const output=path.join(process.cwd(),'qa-artifacts','batch01-animals.png');
fs.mkdirSync(path.dirname(output),{recursive:true});
fs.writeFileSync(webpage,html);
let chrome='';
for(const executable of [process.env.CHROME_BIN,'/usr/bin/google-chrome',
 '/usr/bin/chromium','/usr/bin/chromium-browser','google-chrome','chromium'].filter(Boolean)){
 if(spawnSync(executable,['--version'],{encoding:'utf8',timeout:4000}).status===0){
  chrome=executable;break;
 }
}
if(!chrome)throw Error('Real Chromium is required for image quality tests');
const args=['--headless','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
 '--disable-background-networking','--hide-scrollbars',
 '--force-device-scale-factor=1','--window-size=1250,520',
 '--virtual-time-budget=1800'];
try{
 const result=spawnSync(chrome,[...args,'--dump-dom','file://'+webpage],
  {encoding:'utf8',timeout:60000,maxBuffer:5*1024*1024});
 if(result.error)throw result.error;
 if(result.status!==0)throw Error('Chromium page failed: '+result.stderr.slice(-300));
 const attr=result.stdout.match(/data-review="([^"]+)"/);
 if(!attr)throw Error('Browser did not inspect alpha: '+result.stdout.slice(-700));
 const check=JSON.parse(Buffer.from(attr[1],'base64').toString('utf8'));
 if(check.errors.length)throw Error('Drawing failures: '+check.errors.join('; '));
 const shot=spawnSync(chrome,[...args,'--screenshot='+output,'file://'+webpage],
  {encoding:'utf8',timeout:60000,maxBuffer:4*1024*1024});
 if(shot.error)throw shot.error;
 if(shot.status!==0||fs.statSync(output).size<12000)throw Error('Screenshot not produced');
 console.log('ANIMAGIA_FIRST_FIVE_TRANSPARENT_ART_PASSED '+JSON.stringify(check.info));
}finally{fs.rmSync(temp,{recursive:true,force:true})}
