'use strict';
/*
 * ANIMAGIA — downloadable illuminated bestiary, not a print dialog.
 * Draws its pages from the exact already-audited matching results and the
 * 400 original same-origin golden PNGs. No backend, external PDF dependency,
 * user-name storage or third-party image fetch.
 *
 * An illustration of a related species is explicitly labelled a group image.
 */
(()=>{
 const PAGE_W=1000,PAGE_H=1414;
 const GOLD='#e7c68c',GOLD2='#b99561',INK='#171524',LILAC='#c7badf';
 const NATURE={
  Mammalia:'Млекопитающие',Aves:'Птицы',Reptilia:'Пресмыкающиеся',
  Amphibia:'Земноводные',Insecta:'Насекомые',Arachnida:'Паукообразные',
  Malacostraca:'Ракообразные',Teleostei:'Рыбы',Elasmobranchii:'Акулы и скаты',
  Actinopterygii:'Рыбы',Cephalopoda:'Головоногие',Gastropoda:'Моллюски',
  Polyplacophora:'Панцирные моллюски',Asteroidea:'Морские звёзды',
  Ophiuroidea:'Офиуры',Echinoidea:'Морские ежи',Holothuroidea:'Голотурии'
 };
 const color=(ctx,c)=>{ctx.fillStyle=c;};
 function font(ctx,size,bold=false,serif=true){
  ctx.font=(bold?'600 ':'400 ')+size+'px '+(serif?'"Cormorant Garamond",Georgia,serif':'Manrope,Arial,sans-serif');
 }
 function makePage(){
  const c=document.createElement('canvas');
  c.width=PAGE_W;c.height=PAGE_H;
  const ctx=c.getContext('2d',{alpha:false});
  if(!ctx)throw Error('Не удалось создать страницы бестиария');
  return [c,ctx];
 }
 function line(ctx,x1,y1,x2,y2,width=1,alpha=1){
  ctx.save();ctx.strokeStyle=GOLD;ctx.globalAlpha=alpha;ctx.lineWidth=width;
  ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.restore();
 }
 function circle(ctx,x,y,r,fill='#b99b63',alpha=1){
  ctx.save();ctx.fillStyle=fill;ctx.globalAlpha=alpha;
  ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.restore();
 }
 function text(ctx,txt,x,y,size=24,colorName=GOLD,align='left',serif=true,bold=false){
  ctx.save();font(ctx,size,bold,serif);ctx.textAlign=align;
  ctx.textBaseline='alphabetic';ctx.fillStyle=colorName;ctx.fillText(String(txt),x,y);ctx.restore();
 }
 function fit(ctx,txt,x,y,maxWidth,start=47,min=21,colorName='#f4dfbb',serif=true){
  let size=start;
  ctx.save();font(ctx,size,true,serif);
  while(size>min&&ctx.measureText(String(txt)).width>maxWidth){size--;font(ctx,size,true,serif)}
  ctx.textAlign='left';ctx.fillStyle=colorName;ctx.fillText(String(txt),x,y);
  ctx.restore();return size;
 }
 function multiline(ctx,txt,x,y,maxWidth,size=26,lineHeight=35,maxLines=3,fill='#e7d8c8',serif=true){
  ctx.save();font(ctx,size,false,serif);ctx.fillStyle=fill;
  const parts=String(txt||'').trim().split(/\s+/);
  let current='',lines=[];
  for(const word of parts){
   const candidate=current?current+' '+word:word;
   if(ctx.measureText(candidate).width>maxWidth&&current){lines.push(current);current=word}
   else current=candidate;
  }
  if(current)lines.push(current);
  if(lines.length>maxLines){
   lines=lines.slice(0,maxLines);
   while(ctx.measureText(lines[maxLines-1]+'…').width>maxWidth&&lines[maxLines-1].length>2)
    lines[maxLines-1]=lines[maxLines-1].slice(0,-1);
   lines[maxLines-1]+='…';
  }
  for(const [i,entry] of lines.entries())ctx.fillText(entry,x,y+i*lineHeight);
  ctx.restore();return lines.length;
 }
 function frame(ctx,x,y,w,h,r=16,fill='#1e1c2f',stroke=GOLD2){
  ctx.save();ctx.beginPath();ctx.roundRect(x,y,w,h,r);
  if(fill){ctx.fillStyle=fill;ctx.fill()}
  if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1.8;ctx.stroke()}
  ctx.restore();
 }
 function star(ctx,x,y,r=7){
  ctx.save();ctx.strokeStyle=GOLD;ctx.lineWidth=1.5;
  ctx.beginPath();ctx.moveTo(x-r,y);ctx.lineTo(x+r,y);ctx.moveTo(x,y-r);ctx.lineTo(x,y+r);ctx.stroke();
  circle(ctx,x,y,2.2,GOLD,.8);ctx.restore();
 }
 function filigree(ctx,number=1){
  ctx.save();
  const gradient=ctx.createLinearGradient(0,0,PAGE_W,PAGE_H);
  gradient.addColorStop(0,'#191629');gradient.addColorStop(.5,'#101625');
  gradient.addColorStop(1,'#26172f');
  ctx.fillStyle=gradient;ctx.fillRect(0,0,PAGE_W,PAGE_H);
  const halo=ctx.createRadialGradient(530,180,10,500,500,760);
  halo.addColorStop(0,'#5f3b6740');halo.addColorStop(.55,'#27314b24');halo.addColorStop(1,'#13132600');
  ctx.fillStyle=halo;ctx.fillRect(0,0,PAGE_W,PAGE_H);
  // Deterministic constellations: same name + page always produces the same sky.
  let seed=(number*317+5908)>>>0;
  const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296};
  for(let i=0;i<205;i++){
   const x=36+rand()*(PAGE_W-72),y=38+rand()*(PAGE_H-76);
   circle(ctx,x,y,rand()*1.65+.35,rand()>.55?'#e9c993':'#d8d6ff',.12+rand()*.5);
  }
  line(ctx,47,42,PAGE_W-47,42,2,.76);
  line(ctx,47,PAGE_H-42,PAGE_W-47,PAGE_H-42,2,.76);
  line(ctx,40,52,40,PAGE_H-52,1.4,.6);
  line(ctx,PAGE_W-40,52,PAGE_W-40,PAGE_H-52,1.4,.6);
  for(const x of [40,PAGE_W-40]){
   for(const y of [43,PAGE_H-43]){
    circle(ctx,x,y,7,INK,1);circle(ctx,x,y,3,GOLD,1);
    star(ctx,x+(x<500?18:-18),y+(y<500?18:-18),7);
   }
  }
  ctx.save();ctx.strokeStyle='#bba07280';ctx.lineWidth=1.3;
  for(const [x,flip] of [[97,1],[903,-1]]){
   ctx.beginPath();ctx.moveTo(x,73);ctx.bezierCurveTo(x+58*flip,160,x-52*flip,210,x+24*flip,300);ctx.stroke();
   ctx.beginPath();ctx.moveTo(x,PAGE_H-73);ctx.bezierCurveTo(x+58*flip,PAGE_H-160,x-52*flip,PAGE_H-210,x+24*flip,PAGE_H-300);ctx.stroke();
  }
  ctx.restore();
 }
 function arcaneMoon(ctx,x,y,r){
  ctx.save();
  const glow=ctx.createRadialGradient(x,y,0,x,y,r*2.2);
  glow.addColorStop(0,'#dbc38c33');glow.addColorStop(1,'#bfa77900');
  color(ctx,glow);ctx.beginPath();ctx.arc(x,y,r*2.2,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle=GOLD;ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,r,0,2*Math.PI);ctx.stroke();
  ctx.fillStyle=GOLD;ctx.beginPath();ctx.arc(x,y,r*.68,0,2*Math.PI);ctx.fill();
  ctx.fillStyle='#1b182a';ctx.beginPath();ctx.arc(x+r*.32,y-r*.11,r*.68,0,2*Math.PI);ctx.fill();
  for(let i=0;i<12;i++){
   const a=i*Math.PI/6,rr=r*1.43;circle(ctx,x+Math.cos(a)*rr,y+Math.sin(a)*rr,2.2,GOLD,.85);
  }
  ctx.restore();
 }
 function footer(ctx,num,total,score){
  line(ctx,95,PAGE_H-101,905,PAGE_H-101,1,.54);
  text(ctx,'✦  ANIMAGIA  ✦',97,PAGE_H-72,18,GOLD2,'left',true);
  text(ctx,'ЧИСЛО '+score,500,PAGE_H-72,17,'#c6b0c9','center',false);
  text(ctx,String(num)+' / '+total,903,PAGE_H-72,18,GOLD2,'right',false);
 }
 function coverBase(ctx,number,name,greek,count){
  filigree(ctx,number);
  for(let i=0;i<3;i++)ctx.save(),ctx.strokeStyle=i===0?'#c79c5c':'#6f5981',
   ctx.lineWidth=i===0?2.4:1,ctx.strokeRect(73+i*11,70+i*11,854-i*22,1274-i*22),ctx.restore();
  arcaneMoon(ctx,500,227,56);
  text(ctx,'✦  A N I M A G I A  ✦',500,115,28,'#e2c791','center',true);
  text(ctx,'К Н И Г А  Т А Й Н Ы Х  Ф О Р М',500,407,25,'#c9b0d8','center',true);
  text(ctx,'ВОЛШЕБНЫЙ',500,486,83,'#f9ddad','center',true,true);
  text(ctx,'БЕСТИАРИЙ',500,576,90,GOLD,'center',true,true);
  star(ctx,500,624,13);line(ctx,190,624,468,624,1,.65);line(ctx,532,624,810,624,1,.65);
  text(ctx,'ЛИЧНЫЙ АТЛАС АНИМАГИЧЕСКИХ ФОРМ',500,682,22,'#e8cb9c','center',false,true);
  frame(ctx,177,721,646,148,17,'#252033c9','#997e63');
  fitCentered(ctx,name||'Безымянный искатель',500,783,592,48);
  fitCentered(ctx,greek||'',500,830,580,29,'#c7b3d4');
  text(ctx,'ЗНАК ТВОЕГО ИМЕНИ',500,949,18,'#c7b3d4','center',false,true);
  text(ctx,String(number),500,1037,99,'#f8dea8','center',true,true);
  line(ctx,288,1061,711,1061,2,.66);
  text(ctx,'✧  '+count+' ИЗБРАННЫХ СОЗДАНИЙ  ✧',500,1142,27,GOLD,'center',true);
  text(ctx,'Сохрани свой атлас скрытых форм',500,1210,23,'#e0d0dc','center',true);
  text(ctx,'Каждая страница принадлежит твоему числу',500,1246,19,'#b5a5c4','center',true);
 }
 function fitCentered(ctx,value,x,y,maxWidth,size,fill=GOLD){
  ctx.save();let s=size;font(ctx,s,true,true);
  while(ctx.measureText(value).width>maxWidth&&s>17){s-=1;font(ctx,s,true,true)}
  ctx.fillStyle=fill;ctx.textAlign='center';ctx.fillText(value,x,y);ctx.restore();
 }
 function drawImage(ctx,image,x,y,w,h){
  if(!image)return false;
  let iw=image.width,ih=image.height;
  if(!iw||!ih)return false;
  const scale=Math.min(w/iw,h/ih);
  const dw=iw*scale,dh=ih*scale;
  ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  ctx.shadowColor='#bda36e44';ctx.shadowBlur=10;
  ctx.drawImage(image,x+(w-dw)/2,y+(h-dh)/2,dw,dh);
  ctx.restore();return true;
 }
 async function drawing(profile){
  if(!profile||profile.artSet!=='original107'||!profile.file)return null;
  const uri='./art/animagia-original-400/'+profile.file.split('/').map(encodeURIComponent).join('/');
  try{
   const response=await fetch(uri);
   if(!response.ok)return null;
   const blob=await response.blob();
   if(typeof createImageBitmap==='function'){
    // Browsers release this bitmap immediately after drawing it on a page.
    const bmp=await createImageBitmap(blob);
    return {image:bmp,dispose:()=>bmp.close()};
   }
   return await new Promise(resolve=>{
    const image=new Image(),url=URL.createObjectURL(blob);
    image.onload=()=>resolve({image,dispose:()=>{image.src='';URL.revokeObjectURL(url)}});
    image.onerror=()=>{URL.revokeObjectURL(url);resolve(null)};
    image.src=url;
   });
  }catch(_){return null}
 }
 function placeholder(ctx,x,y,w,h){
  const cx=x+w/2,cy=y+h/2;
  ctx.save();ctx.strokeStyle='#ccb78491';ctx.lineWidth=2;
  for(const rr of [38,58,92]){ctx.beginPath();ctx.arc(cx,cy,rr,0,Math.PI*2);ctx.stroke()}
  arcaneMoon(ctx,cx,cy,27);ctx.restore();
 }
 async function entry(ctx,row,index,top,resolve,nameOf){
  const x=91,w=818,h=306;
  frame(ctx,x,top,w,h,21,'#262335','#b99b6dbb');
  frame(ctx,x+10,top+10,w-20,h-20,15,'#191b2abd','#8a735953');
  // Illuminated parchment label inset stays behind image and Latin name.
  const g=ctx.createLinearGradient(x,top,x+w,top+h);
  g.addColorStop(0,'#41304a7a');g.addColorStop(.45,'#1e233200');g.addColorStop(1,'#41314f45');
  frame(ctx,x+11,top+11,w-22,h-22,14,g,null);
  const artX=x+28,artY=top+31,artW=255,artH=231;
  frame(ctx,artX,artY,artW,artH,12,'#121927','#b18d5f70');
  const imageBg=ctx.createRadialGradient(artX+artW/2,artY+artH/2,30,artX+artW/2,artY+artH/2,170);
  imageBg.addColorStop(0,'#47344e');imageBg.addColorStop(1,'#15182a');
  frame(ctx,artX+5,artY+5,artW-10,artH-10,9,imageBg,null);
  const profile=resolve(row);
  const asset=await drawing(profile);
  try{
   if(!asset||!drawImage(ctx,asset.image,artX+15,artY+17,artW-30,artH-34))
    placeholder(ctx,artX,artY,artW,artH);
  }finally{asset?.dispose?.()}
  const tx=x+317,maxWidth=460;
  text(ctx,'✧  С Т Р А Н И Ц А  '+String(index+1).padStart(2,'0'),tx,top+57,18,'#bc9b6d','left',false,true);
  const label=String(nameOf(row)||row[1]);
  fit(ctx,label,tx,top+105,maxWidth,47,24,'#f6dbad');
  multiline(ctx,row[1],tx,top+151,maxWidth-6,24,30,2,'#c9b9d4',true);
  line(ctx,tx,top+188,tx+maxWidth-15,top+188,1,.57);
  text(ctx,NATURE[row[3]]||'Животный мир',tx,top+221,20,GOLD,'left',false);
  const rank=row[2]==='subspecies'?'Подвид':'Вид';
  text(ctx,'✧  '+rank+(profile&&!profile.exact?' · Образ группы':''),tx,top+260,18,'#bdb0c9','left',false);
  text(ctx,String(row[0]),x+w-33,top+283,31,'#f0d19c','right',true,true);
  star(ctx,x+w-26,top+29,7);
 }
 async function innerPage(ctx,rows,start,totalCount,score,nameOf,resolve,page,totalPages){
  filigree(ctx,score+page*73);
  text(ctx,'✧  A N I M A G I A  ✧',500,116,27,'#d7b780','center',true);
  text(ctx,'ЛЕТОПИСЬ СКРЫТЫХ ФОРМ',500,176,49,'#f6deaf','center',true,true);
  star(ctx,500,207,9);line(ctx,138,207,473,207,1,.7);line(ctx,527,207,862,207,1,.7);
  text(ctx,'ИЗБРАННЫЕ СОЗДАНИЯ · '+String(start+1)+'–'+String(start+rows.length),500,250,21,'#d8c2ce','center',false);
  for(const [i,row] of rows.entries())await entry(ctx,row,start+i,276+i*330,resolve,nameOf);
  footer(ctx,page,totalPages,score);
 }
 function jpegOf(canvas){
  const encoded=canvas.toDataURL('image/jpeg',.84).split(',')[1];
  const binary=atob(encoded),bytes=new Uint8Array(binary.length);
  for(let i=0;i<bytes.length;i++)bytes[i]=binary.charCodeAt(i);
  // Release the canvas backing store immediately: important on Android.
  canvas.width=0;canvas.height=0;
  return {bytes,width:PAGE_W,height:PAGE_H};
 }
 function pdfFromImages(images){
  const encoder=new TextEncoder(),parts=[],offsets=[0];let length=0;
  const append=data=>{const bytes=typeof data==='string'?encoder.encode(data):data;parts.push(bytes);length+=bytes.byteLength};
  const object=(id,pieces)=>{
   offsets[id]=length;append(id+' 0 obj\n');
   for(const piece of pieces)append(piece);
   append('\nendobj\n');
  };
  const count=images.length,ref=n=>n+' 0 R';
  append('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
  object(1,['<< /Type /Catalog /Pages 2 0 R >>']);
  const pageIds=images.map((_,i)=>3+i*3);
  object(2,['<< /Type /Pages /Kids ['+pageIds.map(ref).join(' ')+'] /Count '+count+' >>']);
  for(let i=0;i<count;i++){
   const pageId=pageIds[i],contentId=pageId+1,imageId=pageId+2,im=images[i];
   object(pageId,['<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] '+
    '/Resources << /XObject << /Im0 '+ref(imageId)+' >> >> /Contents '+ref(contentId)+' >>']);
   const command='q\n595.28 0 0 841.89 0 0 cm\n/Im0 Do\nQ\n';
   object(contentId,['<< /Length '+encoder.encode(command).length+' >>\nstream\n',command,'endstream']);
   object(imageId,['<< /Type /XObject /Subtype /Image /Width '+im.width+
    ' /Height '+im.height+' /ColorSpace /DeviceRGB /BitsPerComponent 8'+
    ' /Filter /DCTDecode /Length '+im.bytes.length+' >>\nstream\n',
    im.bytes,'\nendstream']);
  }
  const xref=length,maxId=2+3*count;
  append('xref\n0 '+(maxId+1)+'\n0000000000 65535 f \n');
  for(let id=1;id<=maxId;id++)append(String(offsets[id]).padStart(10,'0')+' 00000 n \n');
  append('trailer\n<< /Size '+(maxId+1)+' /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF');
  return new Blob(parts,{type:'application/pdf'});
 }
 function downloadBlob(blob,fileName){
  const url=URL.createObjectURL(blob);
  const link=document.createElement('a');link.href=url;link.download=fileName;
  document.body.append(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),60_000);
 }
 async function download({rows,name,greek,score,nameOf,resolve,onProgress}){
  if(!Array.isArray(rows)||!rows.length||rows.length>30||
      !Number.isSafeInteger(score)||score<=0||
      typeof resolve!=='function'||typeof nameOf!=='function')
   throw Error('Сначала выполни расчёт и выбери найденные формы');
  await document.fonts?.ready;
  const images=[],totalPages=1+Math.ceil(rows.length/3);
  try{
   const [cover,coverCtx]=makePage();
   coverBase(coverCtx,score,String(name||'').slice(0,140),String(greek||'').slice(0,160),rows.length);
   images.push(jpegOf(cover));
   onProgress?.(1,totalPages);
   for(let start=0;start<rows.length;start+=3){
    const [canvas,ctx]=makePage();
    await innerPage(ctx,rows.slice(start,start+3),start,rows.length,score,nameOf,resolve,2+start/3,totalPages);
    images.push(jpegOf(canvas));
    onProgress?.(images.length,totalPages);
    // Yield the main thread before JPEG-encoding the next illustrated page.
    await new Promise(resolve=>requestAnimationFrame(resolve));
   }
   const blob=pdfFromImages(images);
   if(blob.size<15000)throw Error('Страницы PDF не сформировались');
   const filename='Анимагия_волшебный_бестиарий_'+score+'_'+rows.length+'.pdf';
   downloadBlob(blob,filename);
   return {filename,bytes:blob.size,pages:images.length,animals:rows.length};
  }finally{
   images.length=0;
  }
 }
 window.AnimagiaBookPDF=Object.freeze({download});
})();
