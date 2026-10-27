'use strict';
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {spawnSync}=require('node:child_process');
const source=fs.readFileSync('relic_features.js','utf8');
const begin=source.indexOf(' function drawCelestialBorder(ctx,number){');
const end=source.indexOf(' function textLines(',begin);
if(begin<0||end<=begin)throw Error('Template painter not found');
const painter=source.slice(begin,end);
const names=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/chromium',
 '/usr/bin/chromium-browser','google-chrome','chromium'].filter(Boolean);
let chrome;
for(const name of names){
 const r=spawnSync(name,['--version'],{encoding:'utf8',timeout:5000});
 if(r.status===0){chrome=name;break;}
}
if(!chrome)throw Error('Real Chrome browser is needed for stage 1 inspection');
const checks="(function(){\n const canvas=document.getElementById('card');\n const ctx=canvas.getContext('2d',{willReadFrequently:true});\n paintCardBackdrop(ctx,1878,'predator');\n const pixel=(x,y)=>[...ctx.getImageData(x,y,1,1).data];\n const isDark=(x,y)=>{const p=pixel(x,y);return(p[0]*.3+p[1]*.59+p[2]*.11)<73&&p[3]===255;};\n const gold=p=>p[0]>p[1]&&p[1]>p[2]&&p[0]>95&&p[3]===255;\n let rim=0,engraving=0;\n for(let y=100;y<1850;y+=20)if(gold(pixel(48,y)))rim++;\n for(let x=64;x<245;x+=4)for(let y=64;y<260;y+=4)\n  if(gold(pixel(x,y)))engraving++;\n const failures=[];\n if(!isDark(600,190))failures.push('bright masthead');\n if(!isDark(600,1120))failures.push('washed-out engraving area');\n if(!isDark(600,1820))failures.push('bright lower type area');\n if(rim<60)failures.push('broken gold frame, '+rim);\n if(engraving<20)failures.push('corner filigree missing, '+engraving);\n document.title=failures.length?'ANIMAGIA_STAGE1_FAIL':'ANIMAGIA_STAGE1_PASS';\n document.body.dataset.qa=btoa(JSON.stringify({rim,engraving,failures}));\n})();";
const html='<!doctype html><html><head><meta charset="utf-8"><title>loading</title>'+
 '<style>*{margin:0;padding:0}html,body{background:#090a14;width:1200px;height:2000px;overflow:hidden}'+
 'canvas{display:block;width:1200px;height:2000px}</style></head><body>'+
 '<canvas id="card" width="1200" height="2000"></canvas><script>'+painter+
 '\n'+checks+'</script></body></html>';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'animagia-stage1-'));
const page=path.join(dir,'card.html');fs.writeFileSync(page,html);
const out=path.join(process.cwd(),'qa-artifacts','stage1-card-base.png');
fs.mkdirSync(path.dirname(out),{recursive:true});
const args=['--headless','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
 '--disable-extensions','--disable-background-networking','--hide-scrollbars',
 '--window-size=1200,2000','--force-device-scale-factor=1','--virtual-time-budget=1000'];
try{
 const dom=spawnSync(chrome,[...args,'--dump-dom','file://'+page],
  {encoding:'utf8',timeout:60000,maxBuffer:2*1024*1024});
 if(dom.error)throw dom.error;
 if(dom.status!==0)throw Error('Chrome exit '+dom.status);
 const m=dom.stdout.match(/data-qa="([^"]+)"/);
 if(!m)throw Error('Canvas inspector did not run: '+dom.stdout.slice(-500));
 const qa=JSON.parse(Buffer.from(m[1],'base64').toString('utf8'));
 if(qa.failures.length)throw Error('Visual QA: '+qa.failures.join('; '));
 const pic=spawnSync(chrome,[...args,'--screenshot='+out,'file://'+page],
  {encoding:'utf8',timeout:60000,maxBuffer:2*1024*1024});
 if(pic.error)throw pic.error;
 if(pic.status!==0)throw Error('Chrome screenshot failed '+pic.status);
 if(fs.statSync(out).size<25000)throw Error('Screenshot empty');
 console.log('ANIMAGIA_STAGE1_BROWSER_BASE_PASSED '+JSON.stringify(qa));
 console.log('STAGE1_SCREENSHOT '+fs.statSync(out).size+' bytes');
}finally{fs.rmSync(dir,{recursive:true,force:true});}
