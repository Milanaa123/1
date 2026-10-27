'use strict';
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {spawnSync}=require('node:child_process');
const source=fs.readFileSync('relic_features.js','utf8');
const begin=source.indexOf(' function cardAdornment(');
const end=source.indexOf(' function paintCardBackdropOnScreen(',begin);
if(begin<0||end<=begin)throw Error('Production border painter not found');
const painter=source.slice(begin,end);
const candidates=[process.env.CHROME_BIN,'/usr/bin/google-chrome',
 '/usr/bin/chromium','/usr/bin/chromium-browser','google-chrome','chromium'].filter(Boolean);
let chrome='';
for(const candidate of candidates){
 const p=spawnSync(candidate,['--version'],{encoding:'utf8',timeout:6000});
 if(p.status===0){chrome=candidate;break;}
}
if(!chrome)throw Error('No Chromium browser for visual frame QA');
const body="(function(){\n const examples=[\n ['Хищник','Canis lupus','Mammalia','Carnivora','predator','terrestrial','predator'],\n ['Лягушка','Cornufer opisthodon','Amphibia','Anura','predator','semiaquatic','soft-predator'],\n ['Водное','Orcinus orca','Mammalia','Cetacea','predator','aquatic','aquatic'],\n ['Травоядное','Cervus elaphus','Mammalia','Artiodactyla','herbivore','terrestrial','herbivore'],\n ['Всеядное','Ursus arctos','Mammalia','Carnivora','omnivore','terrestrial','omnivore'],\n ['Птичье','Strix aluco','Aves','Strigiformes','predator','aerial','avian'],\n ['Рептилия','Python regius','Reptilia','Squamata','predator','terrestrial','reptile'],\n ['Лесное','Sorex araneus','Mammalia','Eulipotyphla','unknown','terrestrial','woodland'],\n ['Ночное','Myotis myotis','Mammalia','Chiroptera','unknown','aerial','nocturnal'],\n ['Нейтральное','Unknownus mysticus','unknown','unknown','unknown','unknown','celestial'],\n ['Пауки','Araneus diadematus','Arachnida','Araneae','predator','terrestrial','spider']\n ];\n const errors=[],records=[];\n for(const [label,taxon,cls,order,diet,habitat,expected] of examples){\n  const figure=document.createElement('figure');\n  const canvas=document.createElement('canvas');canvas.width=600;canvas.height=1000;\n  const ctx=canvas.getContext('2d',{willReadFrequently:true});\n  ctx.scale(.5,.5);\n  const gradient=ctx.createLinearGradient(0,0,0,2000);\n  gradient.addColorStop(0,'#090a14');gradient.addColorStop(.55,'#1b1429');\n  gradient.addColorStop(1,'#100b1a');ctx.fillStyle=gradient;ctx.fillRect(0,0,1200,2000);\n  ctx.lineWidth=2.1;ctx.strokeStyle='#e0b77f';ctx.strokeRect(47,47,1106,1906);\n  ctx.lineWidth=1.2;ctx.strokeStyle='#c8a26e';ctx.strokeRect(65,64,1070,1872);\n  // A muted seal gives the ornaments a realistic amount of visual competition.\n  ctx.strokeStyle='#765d78';ctx.lineWidth=1;\n  for(const radius of [230,260]){ctx.beginPath();ctx.arc(600,510,radius,0,Math.PI*2);ctx.stroke();}\n  const row=[1878,taxon,'species',cls,order,'','Chordata'],sty={diet,habitat};\n  const result=paintDietAdornment(ctx,row,sty,'Φρέιζερ');\n  if(result.kind!==expected)errors.push(label+' expected '+expected+' got '+result.kind);\n  figure.appendChild(canvas);\n  const caption=document.createElement('figcaption');\n  caption.textContent=label+' · '+result.kind+' #'+(result.variant+1);\n  figure.appendChild(caption);document.getElementById('montage').appendChild(figure);\n  const pixels=ctx.getImageData(0,0,600,1000).data;\n  let alpha=0;for(let i=3;i<pixels.length;i+=173*4)if(pixels[i]===0)alpha++;\n  records.push({label,kind:result.kind,variant:result.variant,alpha});\n }\n document.title=errors.length?'STAGE3_FAMILY_FAIL':'STAGE3_FAMILY_PASS';\n document.body.dataset.stage3=btoa(unescape(encodeURIComponent(JSON.stringify({errors,records}))));\n})();";
const html='<!doctype html><html><head><meta charset="utf-8"><title>loading</title>'+
 '<style>*{box-sizing:border-box}html,body{margin:0;width:1290px;min-height:1510px;overflow:hidden;background:#080915;color:#e9d8bd;font:17px Georgia,serif}'+
 '#montage{display:grid;grid-template-columns:repeat(5,245px);gap:12px;margin:14px}figure{margin:0;width:245px}'+
 'canvas{display:block;width:245px;height:408px;border:1px solid #b18c66}figcaption{font-size:15px;text-align:center;padding:9px 0 13px}</style>'+
 '</head><body><div id="montage"></div><script>'+painter+'\n'+body+'</script></body></html>';
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'animagia-stage3-'));
const file=path.join(temp,'montage.html');fs.writeFileSync(file,html);
const out=path.join(process.cwd(),'qa-artifacts','stage3-ten-frame-families.png');
fs.mkdirSync(path.dirname(out),{recursive:true});
const args=['--headless','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
 '--disable-extensions','--disable-background-networking','--hide-scrollbars',
 '--force-device-scale-factor=1','--window-size=1290,1510',
 '--virtual-time-budget=2200'];
try{
 const check=spawnSync(chrome,[...args,'--dump-dom','file://'+file],
  {encoding:'utf8',timeout:75000,maxBuffer:5*1024*1024});
 if(check.error)throw check.error;
 if(check.status!==0)throw Error('Browser inspection exited '+check.status);
 const match=check.stdout.match(/data-stage3="([^"]+)"/);
 if(!match)throw Error('Montage rendering failed: '+check.stdout.slice(-1000));
 const result=JSON.parse(Buffer.from(match[1],'base64').toString('utf8'));
 if(result.errors.length)throw Error('Incorrect family routing: '+result.errors.join('; '));
 if(result.records.length!==11)throw Error('Not all ten families rendered');
 const image=spawnSync(chrome,[...args,'--screenshot='+out,'file://'+file],
  {encoding:'utf8',timeout:75000,maxBuffer:3*1024*1024});
 if(image.error)throw image.error;
 if(image.status!==0)throw Error('Chromium screenshot error '+image.status);
 if(fs.statSync(out).size<30000)throw Error('Family screenshot is empty');
 console.log('STAGE3_FAMILY_VISUAL_QA_PASSED '+JSON.stringify(result.records));
 console.log('STAGE3_FAMILY_MONTAGE '+fs.statSync(out).size);
}finally{fs.rmSync(temp,{recursive:true,force:true});}
