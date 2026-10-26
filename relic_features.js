'use strict';
/* Phase V: purely client-side decorative tools. No personal data storage.
   Uses only the existing verified results, scores and catalogue manifest. */
(() => {
 const get=id=>document.getElementById(id);
 const NS='http://www.w3.org/2000/svg';
 const LETTERS=[...'αβγδεζηθικλμνξοπρστυφχψω'];
 const elem=(tag,value)=>{
  const a=document.createElement(tag);
  if(value!==undefined)a.textContent=String(value);
  return a;
 };
 const safeRows=()=>typeof results!=='undefined'&&Array.isArray(results)&&
   typeof sum==='number'?results.filter(r=>Array.isArray(r)&&r.length===7&&r[0]===sum):[];
 const chosenRows=()=>{
  const rows=safeRows();
  const known=typeof photoGallery!=='undefined'&&photoGallery&&
    Array.isArray(photoGallery.chosen)?photoGallery.chosen.map(x=>x.row)
       .filter(x=>rows.some(r=>r[1]===x[1]&&r[2]===x[2])):[];
  return (known.length?known:rows).slice(0,30);
 };
 const label=r=>(typeof display==='function'?display(r):r[1]);
 function decorateSVG(svg,n){
  svg.replaceChildren();if(!Number.isSafeInteger(n)||n<=0)return;
  function node(tag,attr,txt){
   const x=document.createElementNS(NS,tag);
   for(const [key,value] of Object.entries(attr))x.setAttribute(key,String(value));
   if(txt!==undefined)x.textContent=String(txt);
   svg.append(x);
  }
  for(const rad of [156,147,119,109,77])node('circle',{cx:180,cy:180,r:rad,fill:'none',stroke:'#D7B983','stroke-width':rad===109?1.7:1,opacity:.82});
  for(let i=0;i<48;i++){
   const a=i*Math.PI/24,outer=151,inner=outer-(i%4===0?11:5);
   node('path',{d:'M '+(180+Math.cos(a)*outer)+' '+(180+Math.sin(a)*outer)+' L '+(180+Math.cos(a)*inner)+' '+(180+Math.sin(a)*inner),stroke:'#D7B983','stroke-width':i%4===0?1.5:.7});
  }
  const points=[];
  for(let i=0;i<12;i++){
   const a=i*Math.PI/6-Math.PI/2;
   node('text',{x:180+Math.cos(a)*132,y:185+Math.sin(a)*132,'font-size':17,'font-family':'Georgia,serif','text-anchor':'middle',fill:'#EBD4A4'},LETTERS[(n+i*7)%LETTERS.length]);
   if(i<7){const q=(n*(i+11)+i*31)%360*Math.PI/180,r=56+(n+i)%20;points.push((180+Math.cos(q)*r)+','+(180+Math.sin(q)*r));}
  }
  node('polygon',{points:points.join(' '),stroke:'#EED098','stroke-width':1.5,fill:'#D9B377','fill-opacity':.08});
  node('circle',{cx:180,cy:180,r:47,stroke:'#D7B983',fill:'#241F37'});
  node('text',{x:180,y:189,'font-family':'Georgia,serif','font-size':n>99999?25:34,'text-anchor':'middle',fill:'#FFDEA5'},n);
 }
 function paintSeal(ctx,n,x,y,r){
  ctx.save();ctx.translate(x,y);ctx.strokeStyle='#D9BD8A';ctx.lineWidth=2;
  for(const scale of [.97,.91,.72,.68,.46]){
   ctx.beginPath();ctx.arc(0,0,r*scale,0,Math.PI*2);ctx.stroke();
  }
  for(let i=0;i<48;i++){
   const a=i*Math.PI/24,p=r*.94;
   ctx.beginPath();ctx.moveTo(Math.cos(a)*(p-(i%4===0?16:6)),Math.sin(a)*(p-(i%4===0?16:6)));
   ctx.lineTo(Math.cos(a)*p,Math.sin(a)*p);ctx.stroke();
  }
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#F4D8A1';ctx.font='27px Georgia,serif';
  for(let i=0;i<12;i++){
   const a=i*Math.PI/6-Math.PI/2;
   ctx.fillText(LETTERS[(n+i*7)%LETTERS.length],Math.cos(a)*r*.82,Math.sin(a)*r*.82);
  }
  ctx.beginPath();
  for(let i=0;i<7;i++){
   const q=(n*(i+11)+i*31)%360*Math.PI/180,p=r*(.3+(n+i)%20/350);
   if(!i)ctx.moveTo(Math.cos(q)*p,Math.sin(q)*p);
   else ctx.lineTo(Math.cos(q)*p,Math.sin(q)*p);
  }ctx.closePath();ctx.stroke();
  ctx.beginPath();ctx.arc(0,0,r*.3,0,Math.PI*2);ctx.fillStyle='#29213D';ctx.fill();ctx.stroke();
  ctx.fillStyle='#FFE1A5';ctx.font='600 '+(n>99999?45:60)+'px Georgia,serif';ctx.fillText(n,0,1);ctx.restore();
 }
 function textLines(ctx,txt,maxWidth,maxLines){
  const words=String(txt).trim().split(/\s+/),lines=[];
  for(const word of words){
   let pending=word;
   while(pending){
    let piece=pending;
    while(piece.length>1&&ctx.measureText(piece).width>maxWidth)piece=piece.slice(0,-1);
    pending=pending.slice(piece.length);
    if(lines.length&&ctx.measureText(lines[lines.length-1]+' '+piece).width<=maxWidth)lines[lines.length-1]+=' '+piece;
    else lines.push(piece);
   }
  }
  if(lines.length>maxLines){lines.length=maxLines;lines[maxLines-1]=lines[maxLines-1].slice(0,-1)+'…';}
  return lines;
 }
 function centered(ctx,txt,y,width,font,maxLines){
  ctx.textAlign='center';ctx.font=font;
  textLines(ctx,txt,width,maxLines).forEach((l,i)=>ctx.fillText(l,600,y+i*52));
 }
 function selection(picker){
  const parts=picker.value.split('|');
  return safeRows().find(r=>r[1]===parts[0]&&r[2]===parts[1])||null;
 }
 function updatePicker(picker){
  const rows=safeRows();
  const query=(get('relicAnimalSearch')?.value||'').trim().toLocaleLowerCase('ru');
  const atlasProvider=atlas();
  const signature=[sum,rows.length,query,typeof photoGallery!=='undefined'?photoGallery.chosen.length:0].join('|');
  if(signature===picker.dataset.signature)return;
  picker.dataset.signature=signature;
  let available;
  if(query){
   available=rows.filter(r=>(label(r)+' '+r[1]).toLocaleLowerCase('ru').includes(query));
  }else{
   // Put genuinely illustrated forms first, then photo-verified animals,
   // then all other exact numerical matches. Only visible options are capped.
   const illustrated=atlasProvider?rows.filter(r=>atlasProvider.resolve(r)):[],keys=new Set();
   const picked=[];
   const add=r=>{const key=r[1]+'|'+r[2];if(!keys.has(key)){keys.add(key);picked.push(r);}};
   illustrated.forEach(add);
   if(typeof photoGallery!=='undefined'&&Array.isArray(photoGallery.chosen))
    photoGallery.chosen.forEach(item=>{
     const r=item.row;
     if(rows.some(x=>x[1]===r[1]&&x[2]===r[2]))add(r);
    });
   rows.forEach(add);
   available=picked;
  }
  const shown=available.slice(0,120),old=picker.value,frag=document.createDocumentFragment();
  for(const row of shown){
   const opt=elem('option',label(row)+' · '+row[1]);
   opt.value=row[1]+'|'+row[2];frag.append(opt);
  }
  if(!shown.length){
   const opt=elem('option','Нет точных совпадений по этому запросу');opt.value='';frag.append(opt);
  }
  picker.replaceChildren(frag);
  if(shown.some(r=>r[1]+'|'+r[2]===old))picker.value=old;
  const message=get('relicAnimalResults');
  if(message)message.textContent='Найдено '+available.length+' из '+rows.length+
    ' точных совпадений. В списке показано до 120; уточни поиск по названию.';
 }

 // Recolour a genuine transparent silhouette into a delicate GOLD CONTOUR.
 // This is deterministic raster edge detection, not generative AI: every
 // contour comes from a real animal illustration returned by PhyloPic.
 function goldContour(image,maxW=510,maxH=205){
  if(!image||!image.naturalWidth||!image.naturalHeight)return null;
  const scale=Math.min(maxW/image.naturalWidth,maxH/image.naturalHeight);
  const w=Math.max(1,Math.round(image.naturalWidth*scale));
  const h=Math.max(1,Math.round(image.naturalHeight*scale));
  const source=elem('canvas');source.width=w;source.height=h;
  const sc=source.getContext('2d',{willReadFrequently:true});
  if(!sc)return null;
  sc.drawImage(image,0,0,w,h);
  const raw=sc.getImageData(0,0,w,h);
  const mask=raw.data,out=elem('canvas');out.width=w;out.height=h;
  const oc=out.getContext('2d');if(!oc)return null;
  const dest=oc.createImageData(w,h),result=dest.data;
  const radius=Math.min(2,Math.max(1,Math.floor(Math.min(w,h)/75)));
  let ink=0;
  for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){
   const ix=(y*w+x)*4;
   if(mask[ix+3]<85)continue;
   const edge=x<radius||x>=w-radius||y<radius||y>=h-radius||
     mask[(y*w+(x-radius))*4+3]<85||mask[(y*w+(x+radius))*4+3]<85||
     mask[((y-radius)*w+x)*4+3]<85||mask[((y+radius)*w+x)*4+3]<85;
   result[ix]=240;result[ix+1]=206;result[ix+2]=149;
   result[ix+3]=edge?240:17;
   if(edge)ink++;
  }
  if(ink<8)return null;
  oc.putImageData(dest,0,0);
  return out;
 }
 function atlas(){return window.AnimagiaAnimalAtlas||null;}
 function updateEcology(profile,row){
  const root=get('relicLaboratory'),box=get('animalProfile');
  const meta=atlas()?.style(atlas().classify(row)||profile)||{diet:'unknown',habitat:'unknown',
    dietText:'Рацион не установлен',habitatText:'Среда не установлена',secondaryText:[]};
  if(root){root.dataset.diet=meta.diet;root.dataset.habitat=meta.habitat;}
  if(box){box.dataset.diet=meta.diet;box.dataset.habitat=meta.habitat;}
  const d=get('animalDiet'),h=get('animalHabitat'),extra=get('animalSecondary');
  if(d)d.textContent=meta.dietText;
  if(h)h.textContent=meta.habitatText;
  if(extra)extra.textContent=meta.secondaryText.length?'Также: '+meta.secondaryText.join(' · '):'';
 }
 function silhouetteService(){
  return window.AnimagiaSilhouettes&&typeof window.AnimagiaSilhouettes.load==='function'
   ?window.AnimagiaSilhouettes:null;
 }
 async function currentSilhouette(row){
  const provider=silhouetteService();
  return provider?provider.load(row):null;
 }
 function clearIllustration(){
  const frame=get('relicSilhouetteFrame'),info=get('relicSilhouetteStatus');
  const link=get('relicSilhouetteSource');
  if(!frame||!info||!link)return;
  frame.replaceChildren(elem('span','✧'));
  updateEcology(null);
  info.textContent='Выбери животное для красивой карточки';
  link.hidden=true;
 }
 async function showSilhouette(row,serial){
  const frame=get('relicSilhouetteFrame'),info=get('relicSilhouetteStatus');
  const link=get('relicSilhouetteSource');
  if(!frame||!info||!row)return;
  if(serial!==currentPictureSerial)return;
  const gallery=atlas(),profile=gallery?.resolve(row)||null;
  updateEcology(profile,row);
  link.hidden=true;
  if(profile){
   gallery.render(frame,profile);
   info.textContent=profile.exact
    ?'Золотая иллюстрация животного':'Художественный образ группы · не точный портрет вида';
  }else{
   frame.replaceChildren(elem('span','✦'));
   info.textContent='Золотой рисунок для этого животного ещё готовится';
  }
 }
 let currentPictureSerial=0;
 let previousPictureKey='';
 function updatePreviewText(row){
  const pairs=[
   ['relicPreviewAnimal',row?label(row):'Выбери животное'],
   ['relicPreviewScientific',row?row[1]:''],
   ['relicPreviewNameScore',row?String(sum):'—'],
   ['relicPreviewAnimalScore',row?String(row[0]):'—'],
   ['relicPreviewDifference',row?String(Math.abs(sum-row[0])):'—']
  ];
  for(const [id,value] of pairs){
   const target=get(id);if(target)target.textContent=value;
  }
 }
 function syncSilhouette(picker){
  const row=selection(picker),key=row?row[1]+'|'+row[2]:'';
  updatePreviewText(row);
  if(key===previousPictureKey)return;
  previousPictureKey=key;
  const serial=++currentPictureSerial;
  if(!row)clearIllustration();
  else void showSilhouette(row,serial);
 }
 async function savePNG(picker,status){
  const row=selection(picker),greek=get('greek').value.trim();
  if(!row||!validGreek(greek)||score(greek)!==sum){
   status.textContent='Сначала выполни поиск точных совпадений.';return;
  }
  try{
   status.textContent='Создаём магическую карточку с рисунком животного…';
   const gallery=atlas(),profile=gallery?.resolve(row)||null;
   // Cross-origin imagery may be visible in the browser but still blocked
   // from Canvas. Test actual Canvas read permission before drawing.
   const sprite=profile?await gallery.drawable():null;
   const canvas=elem('canvas');canvas.width=1200;canvas.height=1900;
   const ctx=canvas.getContext('2d');
   if(!ctx)throw Error('Canvas недоступен');
   const styl=gallery?.style(gallery.classify(row))||{};
   const glow={
    predator:'#4c283a',herbivore:'#28382f',omnivore:'#39304c',
    unknown:'#30283e'
   }[styl.diet]||'#30283e';
   const bg=ctx.createLinearGradient(0,0,1200,1900);
   bg.addColorStop(0,'#0b0d1d');bg.addColorStop(.55,glow);bg.addColorStop(1,'#100e1e');
   ctx.fillStyle=bg;ctx.fillRect(0,0,1200,1900);
   ctx.strokeStyle='#D3B683';ctx.lineWidth=3;ctx.strokeRect(56,56,1088,1788);
   ctx.lineWidth=1;ctx.strokeRect(74,74,1052,1752);
   ctx.fillStyle='#F1DDB8';ctx.font='36px Georgia,serif';ctx.textAlign='center';
   ctx.fillText('✧  А Н И М А Г И Я  ✧',600,148);
   ctx.fillStyle='#C3B1C7';ctx.font='22px Georgia,serif';
   ctx.fillText('АТЛАС СКРЫТЫХ ФОРМ · МАГИЧЕСКАЯ ПЕЧАТЬ',600,198);
   // Keep the accepted geometric number circle completely unchanged.
   paintSeal(ctx,sum,600,537,289);
   ctx.fillStyle='#F4E4CB';centered(ctx,greek,884,950,'34px Georgia,serif',2);
   let artNote='';
   if(sprite&&profile){
    gallery.drawCanvas(ctx,sprite,profile,333,972,534,444);
    artNote=profile.exact?'Художественный рисунок выбранного вида':'Обобщённый рисунок родственной группы';
   }else{
    // A quiet celestial mark is better than a biologically wrong silhouette.
    ctx.save();
    ctx.strokeStyle='#C9A879';ctx.globalAlpha=.48;ctx.lineWidth=1.6;
    for(const radius of [116,154]){
      ctx.beginPath();ctx.arc(600,1190,radius,0,Math.PI*2);ctx.stroke();
    }
    ctx.fillStyle='#E6C48D';ctx.globalAlpha=.9;
    ctx.font='58px Georgia,serif';ctx.fillText('✧',600,1210);
    ctx.restore();
    artNote='Иллюстрация этого животного ещё готовится';
   }
   ctx.fillStyle='#BDAAC3';ctx.font='17px Georgia,serif';ctx.textAlign='center';
   ctx.fillText(artNote,600,1438);
   ctx.fillStyle='#D5B684';ctx.font='22px Georgia,serif';
   ctx.fillText('✧  С К Р Ы Т А Я   Ф О Р М А  ✧',600,1484);
   ctx.fillStyle='#F5E0BE';centered(ctx,label(row),1539,1020,'48px Georgia,serif',2);
   ctx.fillStyle='#D5CAD6';centered(ctx,row[1],1620,1020,'italic 27px Georgia,serif',1);
   ctx.fillStyle='#E4CA9C';ctx.font='19px Georgia,serif';
   const traits=[styl.diet!=='unknown'?styl.dietText:null,
     styl.habitat!=='unknown'?styl.habitatText:null,
     ...(styl.secondaryText||[])].filter(Boolean).join('   ✧   ');
   if(traits)ctx.fillText(traits,600,1670);
   const boxes=[['ЧИСЛО ИМЕНИ',sum],['ЧИСЛО ЖИВОТНОГО',row[0]],['РАЗНИЦА',0]];
   for(let i=0;i<boxes.length;i++){
    const x=141+i*307;
    ctx.strokeStyle='#B6986E';ctx.lineWidth=1.2;ctx.strokeRect(x,1704,307,92);
    ctx.fillStyle='#C6B3C6';ctx.font='15px Georgia,serif';
    ctx.fillText(boxes[i][0],x+153.5,1733);
    ctx.fillStyle='#F5D7A5';ctx.font='600 41px Georgia,serif';
    ctx.fillText(String(boxes[i][1]),x+153.5,1780);
   }
   ctx.fillStyle='#C9B0A0';ctx.font='17px Georgia,serif';
   ctx.fillText('ТОЧНОЕ ЧИСЛОВОЕ СОВПАДЕНИЕ · ДЕКОРАТИВНАЯ ПЕЧАТЬ',600,1830);
   const blob=await new Promise((resolve,reject)=>{
     try{canvas.toBlob(resolve,'image/png');}catch(err){reject(err);}
   });
   if(!blob)throw Error('Не удалось сформировать PNG');
   const url=URL.createObjectURL(blob),a=elem('a');
   a.href=url;a.download='Анимагия_форма_'+sum+'.png';
   document.body.append(a);a.click();a.remove();
   setTimeout(()=>URL.revokeObjectURL(url),5000);
   status.textContent='Карточка PNG создана. '+(sprite?'Рисунок включён.':'Пока без животного: арт готовится.');
  }catch(err){status.textContent='Не удалось сохранить PNG: '+err.message;}
 }

 async function compareOne(text,manifest,cache){
  const number=score(text),bucket=Math.floor(number/25);
  if(!manifest.available_buckets.includes(bucket))return {number,count:0,examples:[]};
  if(!cache.has(bucket)){
   const res=await fetch('./data/'+bucket+'.json',{cache:'no-store'});
   if(!res.ok)throw Error('Файл каталога недоступен');
   const body=await res.text();
   await verifyShardBody(body,bucket,manifest.bucket_sha256);
   const rows=JSON.parse(body);
   if(!Array.isArray(rows))throw Error('Некорректный формат каталога');
   cache.set(bucket,rows);
  }
  const rows=cache.get(bucket).filter(row=>Array.isArray(row)&&row.length===7&&row[0]===number&&
    row[5]===''&&['species','subspecies'].includes(row[2])&&taxonGreekScore(row[1])===number);
  return {number,count:rows.length,examples:rows.slice(0,3).map(label)};
 }
 async function compare(btn){
  const first=get('compareGreekA').value.trim(),second=get('compareGreekB').value.trim();
  const status=get('compareStatus'),box=get('compareResult'),difference=get('compareDiff');
  box.hidden=true;difference.hidden=true;
  if(!validGreek(first)||!validGreek(second)){
   status.textContent='Обе записи должны содержать только допустимые греческие символы.';return;
  }
  btn.disabled=true;status.textContent='Сравниваем через проверенный каталог…';
  try{
   const response=await fetch('./meta.json',{cache:'no-store'});
   if(!response.ok)throw Error('Каталог недоступен');
   const manifest=await response.json();
   if(manifest.algorithm_id!==GREEK_TAXON_RULE_VERSION||
      manifest.catalog_filter_version!=='independent-noncolonial-fauna-v3')
     throw Error('Несовместимая версия каталога');
   verifyAuditMetadata(manifest);
   if(!Array.isArray(manifest.test_vectors)||manifest.test_vectors.length<5||
      manifest.test_vectors.some(v=>taxonGreek(v.latin)!==v.greek||taxonGreekScore(v.latin)!==v.score))
     throw Error('Контрольные значения не совпали');
   const cache=new Map();
   const a=await compareOne(first,manifest,cache),b=await compareOne(second,manifest,cache);
   get('compareScoreA').textContent=a.number.toLocaleString('ru-RU');
   get('compareScoreB').textContent=b.number.toLocaleString('ru-RU');
   get('compareCountA').textContent='Точных совпадений: '+a.count;
   get('compareCountB').textContent='Точных совпадений: '+b.count;
   get('compareExamplesA').textContent=a.examples.length?'Примеры: '+a.examples.join('; '):'Совпадений нет';
   get('compareExamplesB').textContent=b.examples.length?'Примеры: '+b.examples.join('; '):'Совпадений нет';
   difference.textContent='Разница сумм: '+Math.abs(a.number-b.number)+
     (a.number===b.number?' — числа одинаковые, даже если запись отличается.':' — это разные поиски.');
   box.hidden=false;difference.hidden=false;
   status.textContent='Сравнение завершено, проверка SHA-256 пройдена.';
  }catch(err){status.textContent='Ошибка сравнения: '+err.message;}
  finally{btn.disabled=false;}
 }
 function printBooklet(status){
  if(!safeRows().length||!validGreek(get('greek').value)||score(get('greek').value)!==sum){
   status.textContent='Сначала найди точные совпадения.';return;
  }
  const cards=chosenRows(),list=get('printRelicList'),frag=document.createDocumentFragment();
  get('printRelicName').textContent='Имя: '+get('name').value.trim();
  get('printRelicGreek').textContent='Греческая запись: '+get('greek').value.trim();
  get('printRelicNumber').textContent=String(sum);
  get('printRelicCount').textContent='Всего точных совпадений: '+safeRows().length+
    ' · Карточек в бестиарии: '+cards.length;
  for(const [i,r] of cards.entries()){
   const art=elem('article');art.className='print-relic-animal';
   art.append(elem('span','✧ '+String(i+1).padStart(2,'0')));
   const illustration=atlas()?.resolve(r);
   if(illustration){
    const windowArt=elem('div');windowArt.className='print-art-cell';
    const img=elem('img');img.src=atlas().imageUrl;img.alt=illustration.note;
    img.style.position='absolute';img.style.maxWidth='none';
    img.style.width='500%';img.style.height='400%';
    img.style.left='-'+(illustration.cell%5*100)+'%';
    img.style.top='-'+(Math.floor(illustration.cell/5)*100)+'%';
    windowArt.append(img);art.append(windowArt);
   }
   art.append(elem('h3',label(r)));
   art.append(elem('p',r[1]+' · '+(r[2]==='subspecies'?'подвид':'вид')));
   if(illustration){
    const nature=atlas().style(atlas().classify(r));
    const labels=[nature.diet!=='unknown'?nature.dietText:null,
      nature.habitat!=='unknown'?nature.habitatText:null,...nature.secondaryText].filter(Boolean);
    if(labels.length)art.append(elem('p',labels.join(' · ')));
   }
   art.append(elem('p','Греческая запись: '+taxonGreek(r[1])));
   art.append(elem('strong','Сумма '+r[0]+' · разница 0'));
   frag.append(art);
  }
  list.replaceChildren(frag);
  status.textContent='В печати выбери «Сохранить как PDF».';
  window.print();
 }
 function installSound(){
  const button=get('ritualSound'),panel=get('resultPanel'),number=get('score');
  let enabled=false,awaiting=false,ctx=null;
  function chime(){
   if(!enabled)return;
   const Audio=window.AudioContext||window.webkitAudioContext;
   if(!Audio)return;
   try{
    ctx=ctx||new Audio();if(ctx.state==='suspended')void ctx.resume();
    for(const [i,hz] of [659.25,880,987.77].entries()){
     const t=ctx.currentTime+i*.095,osc=ctx.createOscillator(),gain=ctx.createGain();
     osc.type='sine';osc.frequency.value=hz;
     gain.gain.setValueAtTime(.0001,t);
     gain.gain.exponentialRampToValueAtTime(.026,t+.024);
     gain.gain.exponentialRampToValueAtTime(.0001,t+.42);
     osc.connect(gain);gain.connect(ctx.destination);osc.start(t);osc.stop(t+.44);
    }
   }catch(_){enabled=false;button.textContent='♪ Звук недоступен';}
  }
  button.addEventListener('click',()=>{
   enabled=!enabled;button.setAttribute('aria-pressed',String(enabled));
   button.textContent=enabled?'♫ Звук включён':'♪ Звук выключен';
   if(enabled)chime();
  });
  get('form').addEventListener('submit',()=>{awaiting=true;});
  function success(){
   if(!awaiting||panel.hidden||!Number.isSafeInteger(Number(number.textContent)))return;
   awaiting=false;chime();
  }
  new MutationObserver(success).observe(number,{childList:true,characterData:true,subtree:true});
  new MutationObserver(success).observe(panel,{attributes:true,attributeFilter:['hidden']});
  new MutationObserver(()=>{
   if(get('error').textContent.trim())awaiting=false;
  }).observe(get('error'),{childList:true,characterData:true,subtree:true});
 }
 document.addEventListener('DOMContentLoaded',()=>{
  const svg=get('personalSeal'),picker=get('relicAnimal'),status=get('relicStatus');
  if(!svg||!picker||!status)return;
  let previous=null;
  function update(){
   const ok=!get('resultPanel').hidden&&safeRows().length>0&&
     score(get('greek').value.trim())===sum;
   get('downloadRelic').disabled=!ok;get('printRelic').disabled=!ok;
   if(!ok){
    svg.replaceChildren();picker.replaceChildren(elem('option','Сначала выполни поиск'));
    picker.dataset.signature='';previous=null;
    syncSilhouette(picker);
    get('sealCaption').textContent='Печать появится после расчёта';
   }else{
    if(previous!==sum){decorateSVG(svg,sum);previous=sum;}
    get('sealCaption').textContent='Число '+sum+' · декоративная магическая печать';
    updatePicker(picker);
    syncSilhouette(picker);
   }
  }
  picker.addEventListener('change',()=>syncSilhouette(picker));
  const animalSearch=get('relicAnimalSearch');
  if(animalSearch)animalSearch.addEventListener('input',()=>{
   picker.dataset.signature='';
   updatePicker(picker);syncSilhouette(picker);
  });
  get('downloadRelic').addEventListener('click',()=>{void savePNG(picker,status);});
  get('printRelic').addEventListener('click',()=>printBooklet(status));
  window.printBesteriary=()=>printBooklet(status);
  get('compareRun').addEventListener('click',()=>{void compare(get('compareRun'));});
  get('compareDetails').addEventListener('toggle',()=>{
   const greek=get('greek').value.trim();
   if(!get('compareGreekA').value&&validGreek(greek))get('compareGreekA').value=greek;
  });
  for(const id of ['name','latin','greek'])get(id).addEventListener('input',()=>{
   get('compareResult').hidden=true;get('compareDiff').hidden=true;status.textContent='';update();
  });
  new MutationObserver(update).observe(get('resultPanel'),{attributes:true,attributeFilter:['hidden']});
  new MutationObserver(update).observe(get('score'),{childList:true,characterData:true});
  new MutationObserver(update).observe(get('preview'),{childList:true});
  installSound();
  update();
 });
})();
