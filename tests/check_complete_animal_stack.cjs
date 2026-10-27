'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {spawnSync}=require('node:child_process');
let legacy=fs.readFileSync('animal_atlas.js','utf8');
let full=fs.readFileSync('animal_atlas_100.js','utf8');
const alpha=fs.readFileSync('art/animals-approved-01-05.png').toString('base64');
const atlas100=fs.readFileSync('art/animagia-100-alpha.webp').toString('base64');
const corrected22=fs.readFileSync('art/animagia-corrected-22.webp').toString('base64');
const png=JSON.stringify('data:image/png;base64,'+alpha);
const webp=JSON.stringify('data:image/webp;base64,'+atlas100);
const correctedWebp=JSON.stringify('data:image/webp;base64,'+corrected22);
for(const token of ["const URL_SHEET='./art/animals-gold-v1.png';",
 "const BATCH_01_URL='./art/animals-approved-01-05.png';"]){
 if(!legacy.includes(token))throw Error('Legacy original source changed: '+token);
}
legacy=legacy.replace("const URL_SHEET='./art/animals-gold-v1.png';",'const URL_SHEET='+png+';');
legacy=legacy.replace("const BATCH_01_URL='./art/animals-approved-01-05.png';",
 'const BATCH_01_URL='+png+';');
if(!full.includes("const URI='./art/animagia-100-alpha.webp';"))
 throw Error('100-image URI changed');
full=full.replace("const URI='./art/animagia-100-alpha.webp';",'const URI='+webp+';');
if(!full.includes("const CORRECTED_URI='./art/animagia-corrected-22.webp';"))
 throw Error('Corrected species URI missing');
full=full.replace("const CORRECTED_URI='./art/animagia-corrected-22.webp';",'const CORRECTED_URI='+correctedWebp+';');
const body="(async ()=>{\nconst atlas=window.AnimagiaAnimalAtlas;\nconst spec=[\n ['Волк','Canis lupus',0,'reviewed'],\n ['Лиса','Vulpes vulpes',1,'reviewed'],\n ['Собака','Canis familiaris',2,'reviewed'],\n ['Кошка','Felis catus',3,'reviewed'],\n ['Лев','Panthera leo',4,'reviewed'],\n ['Тигр','Panthera tigris',5,'atlas100']\n];\nconst src=await atlas.drawable(),canvas=document.querySelector('canvas');\nconst ctx=canvas.getContext('2d',{willReadFrequently:true}),errors=[],rows=[];\nif(atlas.list.length!==100)errors.push('Not exactly 100 art labels');\nif(!src?.newSheet||!src?.legacy)errors.push('One of the two atlas sources failed to load');\nctx.fillStyle='#100d1d';ctx.fillRect(0,0,1350,490);\nfor(let i=0;i<spec.length;i++){\n const [label,scientific,id,expected]=spec[i];\n const p=atlas.resolve([1878,scientific,'species','Mammalia','Carnivora','','Chordata']);\n if(!p){errors.push(scientific+' lacked a match');continue;}\n const actual=Number.isInteger(p.approvedIndex)?'reviewed':p.artSet;\n if(actual!==expected)errors.push('Wrong asset source for '+scientific+': '+actual);\n if((p.approvedIndex??p.cell)!==id)errors.push('Wrong sprite index for '+scientific);\n const x=20+i*222;\n if(!atlas.drawCanvas(ctx,src,p,x+5,46,206,280))errors.push('Portrait missing '+scientific);\n const pix=ctx.getImageData(x+5,46,206,280).data;\n let strong=0;for(let q=0;q<pix.length;q+=4)\n  if(pix[q]>100&&pix[q+1]>65&&pix[q+2]<pix[q])strong++;\n if(strong<120)errors.push('Portrait blank: '+scientific);\n ctx.fillStyle='#f0d4a1';ctx.font='24px Georgia,serif';ctx.textAlign='center';\n ctx.fillText(label,x+108,372);\n ctx.font='16px Georgia,serif';ctx.fillText(scientific,x+108,411);\n rows.push({scientific,artSource:actual,cell:(p.approvedIndex??p.cell),litPixels:strong});\n}\ndocument.title=errors.length?'FULL_ATLAS_FAIL':'FULL_ATLAS_PASS';\ndocument.body.dataset.actual=btoa(unescape(encodeURIComponent(JSON.stringify({errors,rows}))));\n})();";
const html='<!doctype html><html><head><meta charset="utf-8"><title>Rendering</title>'+
 '<style>html,body{margin:0;width:1350px;height:490px;background:#100d1d}</style>'+
 '</head><body><canvas width="1350" height="490"></canvas><script>'+
 legacy+'\n'+full+'\n'+body+'</script></body></html>';
const folder=fs.mkdtempSync(path.join(os.tmpdir(),'animagia-100-stack-'));
const page=path.join(folder,'full.html');
fs.writeFileSync(page,html);
const resultFile=path.join(process.cwd(),'qa-artifacts','combined-100-and-reviewed-five.png');
fs.mkdirSync(path.dirname(resultFile),{recursive:true});
let chrome;
for(const candidate of [process.env.CHROME_BIN,'/usr/bin/google-chrome',
 '/usr/bin/chromium','/usr/bin/chromium-browser','chrome','chromium'].filter(Boolean))
 if(spawnSync(candidate,['--version'],{encoding:'utf8',timeout:5000}).status===0)
 {chrome=candidate;break;}
if(!chrome)throw Error('Chromium unavailable for actual first-five/100 wrapper QA');
const args=['--headless','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
 '--disable-extensions','--disable-background-networking','--hide-scrollbars',
 '--window-size=1350,490','--force-device-scale-factor=1','--virtual-time-budget=2800'];
try{
 const check=spawnSync(chrome,[...args,'--dump-dom','file://'+page],
  {encoding:'utf8',timeout:85000,maxBuffer:5*1024*1024});
 if(check.error)throw check.error;
 if(check.status!==0)throw Error('Browser inspection failed '+check.status);
 const m=check.stdout.match(/data-actual="([^"]+)"/);
 if(!m)throw Error('Integrated browser script did not run '+check.stdout.slice(-600));
 const data=JSON.parse(Buffer.from(m[1],'base64').toString('utf8'));
 if(data.errors.length)throw Error('Full 100-art integration failed: '+data.errors.join('; '));
 const shot=spawnSync(chrome,[...args,'--screenshot='+resultFile,'file://'+page],
  {encoding:'utf8',timeout:85000,maxBuffer:4*1024*1024});
 if(shot.error)throw shot.error;
 if(shot.status!==0||fs.statSync(resultFile).size<16000)
  throw Error('Full atlas screenshot unavailable');
 console.log('LIVE_STACK_100_AND_APPROVED_FIRST_FIVE_PASS '+JSON.stringify(data.rows));
}finally{fs.rmSync(folder,{recursive:true,force:true})}
