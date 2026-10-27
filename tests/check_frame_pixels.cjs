'use strict';
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {spawnSync}=require('node:child_process');
const source=fs.readFileSync('relic_features.js','utf8');
const begin=source.indexOf(' function cardAdornment(');
const end=source.indexOf(' function paintCardBackdropOnScreen(',begin);
if(begin<0||end<begin)throw Error('Decorative painter missing');
const code=source.slice(begin,end);
const candidates=[process.env.CHROME_BIN,'/usr/bin/google-chrome',
 '/usr/bin/chromium','/usr/bin/chromium-browser',
 '/opt/google/chrome/chrome','google-chrome','chromium'].filter(Boolean);
let binary;
for(const cmd of candidates){
 const p=spawnSync(cmd,['--version'],{encoding:'utf8',timeout:7000});
 if(p.status===0){binary=cmd;break;}
}
if(!binary)throw Error('A real Chrome browser is required to pixel-test alpha cutouts');
const html="<!doctype html><html><head><meta charset=\"utf-8\"><title>loading</title></head><body><script>\n/*__FRAME_CODE__*/\n\n/* Live Canvas pixel QA: no animal image required; frame painter is extracted\n   straight from the production relic_features.js. */\n(function(){\n const findings=[],errors=[],sigs={};\n const canvas=document.createElement('canvas');\n canvas.width=1200;canvas.height=2000;\n const ctx=canvas.getContext('2d',{willReadFrequently:true});\n for(const kind of ['predator','soft-predator','herbivore','omnivore','aquatic','avian','reptile','woodland','nocturnal','celestial']){\n  const diet=['soft-predator','aquatic','avian','reptile'].includes(kind)?'predator':['woodland','nocturnal','celestial'].includes(kind)?'unknown':kind;\n  const klass=kind==='soft-predator'?'Amphibia':kind==='avian'?'Aves':kind==='reptile'?'Reptilia':kind==='celestial'?'unknown':'Mammalia';\n  const row=[1878,'Cornufer opisthodon','species',klass,'','','Chordata'];\n  const styl={diet,habitat:kind==='aquatic'?'aquatic':'terrestrial'},owners=new Map();\n  row[3]=klass;row[4]=kind==='soft-predator'?'Anura':kind==='nocturnal'?'Chiroptera':'Carnivora';\n  if(kind==='woodland')row[1]='Sorex araneus';if(kind==='celestial')row[1]='Unknownus mysticus';\n  for(let n=0;n<200&&owners.size<5;n++){\n   const name='Ανιμαγια'+n;\n   owners.set(cardAdornment(row,styl,name).variant,name);\n  }\n  if(owners.size!==5)errors.push('unreachable variants '+kind);\n  const unique=new Set();\n  for(const [variant,owner] of owners){\n   ctx.clearRect(0,0,1200,2000);\n   ctx.fillStyle='#0b0b16';ctx.fillRect(0,0,1200,2000);\n   ctx.strokeStyle='#efc78b';ctx.lineWidth=3;ctx.strokeRect(48,48,1104,1904);\n   paintDietAdornment(ctx,row,styl,owner);\n   const px=ctx.getImageData(0,0,1200,2000).data;\n   let holes=0,ink=0,hash=2166136261,maxHoleSpan=0;\n   for(let y=0;y<2000;y+=4){let run=0;for(let x=0;x<1200;x+=4){\n    if(x>235&&x<965&&y>200&&y<1800)continue;\n    const k=(y*1200+x)*4,a=px[k+3],r=px[k],g=px[k+1],b=px[k+2];\n    if(a===0){holes++;run++;maxHoleSpan=Math.max(maxHoleSpan,run*4);}else run=0;\n    if(a>0&&(Math.abs(r-11)+Math.abs(g-11)+Math.abs(b-22)>55))ink++;\n    hash=Math.imul(hash^((r<<24|g<<16|b<<8|a)>>>0),16777619)>>>0;\n   }\n   }unique.add(hash);\n   if(kind==='herbivore'&&holes)errors.push('herbivore '+variant+' has forbidden holes');\n   if(['predator','soft-predator','omnivore','aquatic'].includes(kind)&&holes<5)errors.push(kind+' '+variant+' has no actual alpha holes');\n   if(['avian','reptile','woodland','nocturnal','celestial'].includes(kind)&&holes)errors.push(kind+' '+variant+' has unwanted holes');\n   if(kind==='herbivore'&&ink<12)errors.push('herbivore '+variant+' has no vines');\n   if(['soft-predator','aquatic'].includes(kind)&&maxHoleSpan>98)errors.push(kind+' '+variant+' oversized dark-looking alpha gap '+maxHoleSpan+'px');\n   findings.push({kind,variant,holes,ink,hash,maxHoleSpan});\n  }\n  if(unique.size!==5)errors.push(kind+' has only '+unique.size+' visibly different borders');\n  sigs[kind]=[...unique];\n }\n document.title=errors.length?'ANIMAGIA_FRAME_QA_FAIL':'ANIMAGIA_FRAME_QA_PASS';\n document.body.dataset.report=btoa(JSON.stringify({findings,errors,sigs}));\n})();\n</script></body></html>".replace('/*__FRAME_CODE__*/',code);
const folder=fs.mkdtempSync(path.join(os.tmpdir(),'animagia-cutouts-'));
const file=path.join(folder,'qa.html');fs.writeFileSync(file,html);
try{
 const p=spawnSync(binary,['--headless','--no-sandbox','--disable-gpu',
  '--disable-dev-shm-usage','--disable-background-networking',
  '--disable-extensions','--virtual-time-budget=6000',
  '--dump-dom','file://'+file],
  {encoding:'utf8',timeout:75000,maxBuffer:8*1024*1024});
 if(p.error)throw p.error;
 if(p.status!==0)throw Error('Chromium failed: '+(p.stderr||'').slice(-1200));
 const m=p.stdout.match(/data-report="([^"]+)"/);
 if(!m)throw Error('Browser did not run QA script: '+p.stdout.slice(-1200));
 const report=JSON.parse(Buffer.from(m[1],'base64').toString('utf8'));
 console.log(JSON.stringify(report.findings));
 if(report.errors.length)throw Error('Pixel QA: '+report.errors.join('; '));
 if(!p.stdout.includes('ANIMAGIA_FRAME_QA_PASS'))throw Error('Browser QA did not pass');
 console.log('FRAME_PIXEL_ALPHA_QA_PASSED '+report.findings.length);
}finally{fs.rmSync(folder,{recursive:true,force:true})}
