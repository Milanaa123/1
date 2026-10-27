'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {spawnSync}=require('node:child_process');
const source=fs.readFileSync('relic_features.js','utf8');
const first=source.indexOf(' function wheelLetters(greekName){');
const last=source.indexOf(' function drawCelestialBorder(',first);
if(first<0||last<first)throw Error('Production seal painter could not be located');
const painter=source.slice(first,last);
const candidates=[process.env.CHROME_BIN,'/usr/bin/google-chrome',
 '/usr/bin/chromium','/usr/bin/chromium-browser','google-chrome','chromium'].filter(Boolean);
let chrome='';
for(const candidate of candidates){
 const probe=spawnSync(candidate,['--version'],{encoding:'utf8',timeout:5000});
 if(probe.status===0){chrome=candidate;break;}
}
if(!chrome)throw Error('Real Chromium browser required for stage 2 visual inspection');
const verify="(function(){\n const names=[\n  'Φρέιζερ Ἁρολδ Μπραουν',\n  'Ἀλέξανδρος Κρεων Κραββ',\n  'Ελλα Μαρια Ουιλλοου'\n ];\n const canvas=document.getElementById('stage2');\n const ctx=canvas.getContext('2d',{willReadFrequently:true});\n const errors=[],findings=[];\n ctx.fillStyle='#090a14';ctx.fillRect(0,0,1200,1720);\n const orig=ctx.fillText.bind(ctx);\n for(let idx=0;idx<names.length;idx++){\n  const name=names[idx],cy=290+idx*555,r=235;\n  let records=[];\n  ctx.fillText=function(txt,x,y,maxWidth){\n   if(typeof txt==='string')records.push({txt,transform:ctx.getTransform(),font:ctx.font});\n   return orig(txt,x,y,maxWidth);\n  };\n  ctx.fillStyle='#d8b879';ctx.font='22px Georgia,serif';\n  ctx.textAlign='center';ctx.fillText('ИМЯ ВЛАДЕЛЬЦА — '+(idx+1),600,cy-r-28);\n  const offset=records.length;\n  paintSeal(ctx,1878,600,cy,r,name);\n  ctx.fillText=orig;\n  const glyphs=wheelLetters(name),real=records.slice(offset).slice(0,-1);\n  const target=glyphs.filter(x=>x!==' ');\n  if(real.map(x=>x.txt).join('')!==target.join(''))\n   errors.push('glyph text mismatch for '+name);\n  if(real.length!==target.length)errors.push('missing glyph in '+name);\n  const font=ringFontSize(glyphs,r*.82,36,15);\n  if(real.some(x=>!x.font.includes(font+'px')))\n   errors.push('font size mismatch '+name);\n  const expectedR=r*.82,near=[];\n  for(const sample of real){\n   const t=sample.transform;\n   const delta=Math.hypot(t.e-600,t.f-cy);\n   if(Math.abs(delta-expectedR)>1.3)errors.push('incorrect glyph radius '+name);\n   near.push(Math.atan2(t.f-cy,t.e-600));\n  }\n  // All slots, including word breaks, must follow even angular spacing.\n  const arc=nameArc(glyphs,font,expectedR);\n  const predicted=glyphs.map((g,i)=>({g,a:arc(i)})).filter(x=>x.g!==' ');\n  for(let i=0;i<near.length;i++){\n   const actual=near[i],expected=predicted[i].a;\n   const delta=Math.atan2(Math.sin(actual-expected),Math.cos(actual-expected));\n   if(Math.abs(delta)>.007)errors.push('uneven ring position '+name+' at '+i);\n  }\n  findings.push({name,glyphs:glyphs.length,drawn:real.length,font,radius:expectedR});\n }\n document.title=errors.length?'STAGE2_SEAL_FAIL':'STAGE2_SEAL_PASS';\n document.body.dataset.stage2=btoa(JSON.stringify({errors,findings}));\n})();";
const html='<!doctype html><html><head><meta charset="utf-8"><title>loading</title>'+
 '<style>*{margin:0;padding:0}html,body{width:1200px;height:1720px;overflow:hidden;background:#090a14}canvas{display:block}</style>'+
 '</head><body><canvas id="stage2" width="1200" height="1720"></canvas><script>'+
 painter+'\n'+verify+'</script></body></html>';
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'animagia-stage2-'));
const file=path.join(temp,'stage2.html');
fs.writeFileSync(file,html);
const output=path.join(process.cwd(),'qa-artifacts','stage2-greek-wheels.png');
fs.mkdirSync(path.dirname(output),{recursive:true});
const args=['--headless','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
 '--disable-extensions','--disable-background-networking','--hide-scrollbars',
 '--force-device-scale-factor=1','--window-size=1200,1720',
 '--virtual-time-budget=1200'];
try{
 const dom=spawnSync(chrome,[...args,'--dump-dom','file://'+file],
   {encoding:'utf8',timeout:75000,maxBuffer:3*1024*1024});
 if(dom.error)throw dom.error;
 if(dom.status!==0)throw Error('Chromium rendering exit '+dom.status);
 const match=dom.stdout.match(/data-stage2="([^"]+)"/);
 if(!match)throw Error('Chromium script did not finish: '+dom.stdout.slice(-700));
 const result=JSON.parse(Buffer.from(match[1],'base64').toString('utf8'));
 if(result.errors.length)throw Error('Greek ring visual QA: '+result.errors.join('; '));
 if(!dom.stdout.includes('STAGE2_SEAL_PASS'))throw Error('Chrome quality pass missing');
 const image=spawnSync(chrome,[...args,'--screenshot='+output,'file://'+file],
   {encoding:'utf8',timeout:75000,maxBuffer:3*1024*1024});
 if(image.error)throw image.error;
 if(image.status!==0)throw Error('Visual proof screenshot failed');
 if(fs.statSync(output).size<25000)throw Error('Stage 2 PNG screenshot too small');
 console.log('STAGE2_GREEK_CIRCLE_BROWSER_PASSED '+JSON.stringify(result.findings));
 console.log('STAGE2_SEAL_SCREENSHOT '+fs.statSync(output).size);
}finally{fs.rmSync(temp,{recursive:true,force:true})}
