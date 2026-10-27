'use strict';
/* Phase V: purely client-side decorative tools. No personal data storage.
   Uses only the existing verified results, scores and catalogue manifest. */
(() => {
 const get=id=>document.getElementById(id);
 const NS='http://www.w3.org/2000/svg';
 const LETTERS=[...'αβγδεζηθικλμνξοπρστυφχψω'];

 // Display only the first Greek given name, exactly as entered and verified.
 // Scoring still uses the complete original name in app.js, untouched.
 function wheelLetters(greekName){
  const first=String(greekName||'').trim().normalize('NFC').split(/\s+/u)[0]||'';
  if(!first)return [];
  return typeof Intl!=='undefined'&&Intl.Segmenter
   ?[...new Intl.Segmenter('el',{granularity:'grapheme'}).segment(first)].map(x=>x.segment)
   :Array.from(first);
 }
 function nameArc(glyphs,font,r){
  const span=Math.max(.55,Math.min(2.65,glyphs.length*(font/r)*1.15));
  return i=>-Math.PI/2-span/2+(i+.5)*span/glyphs.length;
 }
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
 function decorateSVG(svg,n,greekName){
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

  const points=[],inscription=wheelLetters(greekName);
  const glyphSize=inscription.length>16?14:inscription.length>11?18:22;
  const angle=nameArc(inscription,glyphSize,132);
  svg.setAttribute('aria-label','Магическое колесо: '+inscription.join('')+'; число '+n);
  for(let i=0;i<inscription.length;i++){
   const a=angle(i),px=180+Math.cos(a)*132,py=180+Math.sin(a)*132;
   node('text',{x:px,y:py,'font-size':glyphSize,
    'font-family':'Georgia,serif','text-anchor':'middle',
    transform:'rotate('+((a+Math.PI/2)*180/Math.PI)+' '+px+' '+py+')',
    fill:'#EBD4A4'},inscription[i]);
  }
  for(let i=0;i<7;i++){
   const q=(n*(i+11)+i*31)%360*Math.PI/180,r=56+(n+i)%20;
   points.push((180+Math.cos(q)*r)+','+(180+Math.sin(q)*r));
  }
  node('polygon',{points:points.join(' '),stroke:'#EED098','stroke-width':1.5,fill:'#D9B377','fill-opacity':.08});
  node('circle',{cx:180,cy:180,r:47,stroke:'#D7B983',fill:'#241F37'});
  node('text',{x:180,y:189,'font-family':'Georgia,serif','font-size':n>99999?25:34,'text-anchor':'middle',fill:'#FFDEA5'},n);
 }
 function paintSeal(ctx,n,x,y,r,greekName){
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

  const inscription=wheelLetters(greekName);
  const font=inscription.length>16?24:inscription.length>11?30:35;
  ctx.font=font+'px Georgia,serif';
  const angle=nameArc(inscription,font,r*.82);
  for(let i=0;i<inscription.length;i++){
   const a=angle(i);
   ctx.save();ctx.translate(Math.cos(a)*r*.82,Math.sin(a)*r*.82);
   ctx.rotate(a+Math.PI/2);
   ctx.fillText(inscription[i],0,0);ctx.restore();
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
 function drawCelestialBorder(ctx,number){
  // Star field belongs to the parchment/background; never bake it into animal art.
  let seed=(number*2654435761)>>>0;
  function random(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
  ctx.save();
  for(let i=0;i<175;i++){
   const x=94+random()*1012,y=88+random()*1865;
   // Leave the central seal, title and animal clear.
   if((x>250&&x<950&&y>280&&y<1480))continue;
   const size=.4+random()*1.8;
   ctx.fillStyle='rgba(227,190,138,'+(.12+random()*.43).toFixed(2)+')';
   ctx.beginPath();ctx.arc(x,y,size,0,Math.PI*2);ctx.fill();
  }
  ctx.strokeStyle='#CCAB79';ctx.fillStyle='#E1C28F';
  ctx.lineWidth=1.15;ctx.globalAlpha=.73;
  for(const [cx,cy,xsign,ysign] of [[88,90,1,1],[1112,90,-1,1],
    [88,1980,1,-1],[1112,1980,-1,-1]]){
   ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+xsign*75,cy);
   ctx.moveTo(cx,cy);ctx.lineTo(cx,cy+ysign*75);ctx.stroke();
   ctx.beginPath();ctx.moveTo(cx+xsign*24,cy+ysign*24);
   ctx.lineTo(cx+xsign*32,cy+ysign*32);
   ctx.lineTo(cx+xsign*24,cy+ysign*40);
   ctx.lineTo(cx+xsign*16,cy+ysign*32);ctx.closePath();ctx.stroke();
  }
  // Fine celestial chains at the sides echo the approved antique chart.
  for(const x of [100,1100]){
   ctx.beginPath();ctx.moveTo(x,335);ctx.lineTo(x,710);ctx.stroke();
   for(const y of [380,520,650]){
    ctx.beginPath();ctx.arc(x,y,5,0,Math.PI*2);ctx.stroke();
   }
  }
  for(const x of [175,1025]){
   ctx.beginPath();ctx.moveTo(x,995);ctx.lineTo(x,1390);ctx.stroke();
   ctx.beginPath();ctx.moveTo(x-7,1040);ctx.lineTo(x,1029);
   ctx.lineTo(x+7,1040);ctx.lineTo(x,1051);ctx.closePath();ctx.stroke();
  }
  // Delicate orbit behind the transparent animal art.
  ctx.globalAlpha=.32;
  for(const radius of [280,345]){
   ctx.beginPath();ctx.ellipse(600,1200,radius,radius*.62,0,0,Math.PI*2);ctx.stroke();
  }
  ctx.restore();
 }
 function paintNebula(ctx,number){
  // Antique purple mist and glowing gold dust on the exact same screen/PNG canvas.
  let seed=(number*2246822519+784691)>>>0;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
  ctx.save();
  // Color haze is intentionally concentrated at the borders, not over the text.
  for(const [x,y,rad,color] of [
   [95,835,320,'#a456a0'],[1040,550,310,'#6a477d'],
   [1070,1220,300,'#a15c9a'],[105,1630,340,'#9f4778'],
   [490,1180,380,'#704880'],[900,1530,255,'#573b68']
  ]){
   const haze=ctx.createRadialGradient(x,y,0,x,y,rad);
   haze.addColorStop(0,color+'43');
   haze.addColorStop(.4,color+'1f');
   haze.addColorStop(1,color+'00');
   ctx.fillStyle=haze;ctx.fillRect(x-rad,y-rad,rad*2,rad*2);
  }
  // Organic trails instead of plain, mechanical orbit ellipses.
  for(const side of [-1,1]){
   const x=side<0?95:1105;
   for(let i=0;i<27;i++){
    const y=120+random()*1730,walk=35+random()*220;
    const opening=side<0?1:-1;
    ctx.beginPath();
    ctx.moveTo(x,y);
    ctx.bezierCurveTo(x+opening*walk*.64,y-87,
      x+opening*walk,y+95,x+opening*walk*.53,y+230);
    ctx.strokeStyle=i%4===0?'#cb8ab7':'#87619f';
    ctx.globalAlpha=.055+random()*.13;ctx.lineWidth=1+random()*4;
    ctx.shadowColor='#b974bc';ctx.shadowBlur=i%4===0?14:5;
    ctx.stroke();
   }
  }
  ctx.shadowBlur=0;
  for(let i=0;i<560;i++){
   const x=75+random()*1050,y=70+random()*1900;
   const gold=random()>.35;
   const brightness=.19+random()*.56;
   ctx.fillStyle=gold?'rgba(244,190,109,'+brightness.toFixed(2)+')':
     'rgba(187,133,215,'+(brightness*.65).toFixed(2)+')';
   ctx.globalAlpha=1;
   const r=random()>.98?2.1:.2+random()*.7;
   ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
  }
  // Arcane celestial vault behind the animal; vivid but sufficiently airy.
  ctx.globalAlpha=.5;ctx.strokeStyle='#c49a66';ctx.lineWidth=1.15;
  for(const [cx,cy,rx,ry] of [
   [600,1160,380,290],[600,1160,450,350],
   [600,1160,295,195],[600,1160,490,405]
  ]){ctx.beginPath();ctx.ellipse(cx,cy,rx,ry,0,Math.PI*1.07,Math.PI*1.95);ctx.stroke();}
  for(const [x,y] of [[600,860],[800,1140],[400,1300],[960,980]]){
   ctx.globalAlpha=.7;ctx.strokeStyle='#eabf82';
   ctx.beginPath();ctx.moveTo(x-13,y);ctx.lineTo(x+13,y);
   ctx.moveTo(x,y-19);ctx.lineTo(x,y+19);ctx.stroke();
   ctx.globalAlpha=.9;ctx.fillStyle='#f6dba7';
   ctx.beginPath();ctx.arc(x,y,2.2,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
 }
 function paintCardBackdrop(ctx,number,diet){
  // One 1200x2000 composition for both the screen and downloaded PNG.
  // Reference aspect ratio 3:5; frame motifs retain original drawing coordinates.
  ctx.save();
  ctx.scale(1,2000/2070);
  const base=ctx.createLinearGradient(0,0,1120,2070);
  base.addColorStop(0,'#0b0b16');base.addColorStop(.45,'#171321');
  base.addColorStop(.71,'#221729');base.addColorStop(1,'#0b0b15');
  ctx.fillStyle=base;ctx.fillRect(0,0,1200,2070);
  const warmth={predator:'#a0754b',herbivore:'#8b8773',omnivore:'#8d7194'}[diet]||'#87677c';
  const aurora=ctx.createRadialGradient(600,1110,80,600,1110,780);
  aurora.addColorStop(0,warmth+'1a');aurora.addColorStop(.52,'#9c628216');
  aurora.addColorStop(1,'#9c628200');
  ctx.fillStyle=aurora;ctx.fillRect(0,0,1200,2070);
  paintNebula(ctx,number);
  // Art nouveau double foil border with a restrained glow.
  ctx.strokeStyle='#E1BD88';ctx.lineWidth=3.35;ctx.strokeRect(48,48,1104,1974);
  ctx.strokeStyle='#B09168';ctx.lineWidth=1.5;ctx.strokeRect(67,67,1066,1936);
  drawCelestialBorder(ctx,number);
  // Antique corner engravings are mirrored, rather than four competing drawings.
  for(const sx of [1,-1])for(const sy of [1,-1]){
    ctx.save();ctx.translate(sx>0?72:1128,sy>0?72:1998);
    ctx.scale(sx,sy);ctx.strokeStyle='#BA9568';ctx.lineWidth=1.35;
    ctx.globalAlpha=.76;
    ctx.beginPath();ctx.moveTo(0,112);ctx.bezierCurveTo(0,35,35,0,112,0);ctx.stroke();
    ctx.beginPath();ctx.moveTo(0,66);ctx.bezierCurveTo(5,29,27,5,66,0);ctx.stroke();
    ctx.beginPath();ctx.moveTo(18,0);ctx.bezierCurveTo(27,20,48,29,70,30);ctx.stroke();
    ctx.beginPath();ctx.moveTo(0,18);ctx.bezierCurveTo(21,26,32,47,34,69);ctx.stroke();
    for(const [x,y] of [[0,0],[22,22],[42,42]]){
     ctx.beginPath();ctx.moveTo(x,y-7);ctx.lineTo(x+7,y);
     ctx.lineTo(x,y+7);ctx.lineTo(x-7,y);ctx.closePath();ctx.stroke();
    }
    ctx.restore();
  }

  // Refined gold filigree from the approved reference. Only card geometry;
  // animal artwork and its atlas remain completely untouched.
  ctx.save();ctx.globalAlpha=.82;ctx.lineWidth=1.45;ctx.strokeStyle='#d9b37c';
  for(const sx of [1,-1])for(const sy of [1,-1]){
   ctx.save();ctx.translate(sx===1?62:1138,sy===1?62:2008);ctx.scale(sx,sy);
   for(const d of [0,13]){
    ctx.beginPath();ctx.moveTo(0,195+d);
    ctx.bezierCurveTo(6,78+d,52+d,22,205+d,0);ctx.stroke();
    ctx.beginPath();ctx.moveTo(0,124+d);
    ctx.bezierCurveTo(15,63+d,60,18+d,129,0);ctx.stroke();
   }
   for(const [x,y,r] of [[0,0,13],[44,44,6],[112,10,4]]){
    ctx.beginPath();ctx.moveTo(x-r*1.7,y);ctx.lineTo(x+r*1.7,y);
    ctx.moveTo(x,y-r*1.7);ctx.lineTo(x,y+r*1.7);ctx.stroke();
    ctx.beginPath();ctx.arc(x,y,r*.23,0,Math.PI*2);
    ctx.fillStyle='#f3d199';ctx.fill();
   }
   ctx.restore();
  }
  ctx.restore();
  // Gold hanging threads with diamonds echo the target card's side chains.
  ctx.save();ctx.globalAlpha=.73;ctx.strokeStyle='#d8b47c';ctx.lineWidth=1.35;
  for(const x of [106,1094]){
   ctx.beginPath();ctx.moveTo(x,195);ctx.lineTo(x,825);ctx.stroke();
   for(const y of [345,427,682,778]){
    ctx.beginPath();ctx.arc(x,y,4.5,0,Math.PI*2);ctx.stroke();
   }
   for(const y of [375,712]){
    ctx.beginPath();ctx.moveTo(x,y-11);ctx.lineTo(x+7,y);
    ctx.lineTo(x,y+11);ctx.lineTo(x-7,y);ctx.closePath();ctx.stroke();
   }
   ctx.beginPath();ctx.moveTo(x,1530);ctx.lineTo(x,1610);ctx.stroke();
   ctx.beginPath();ctx.arc(x,1624,12,-1.2,Math.PI*1.22);ctx.stroke();
  }
  ctx.restore();
  // The small hanging crescents belong to the frame, never the animal.
  ctx.save();ctx.strokeStyle='#CFAC78';ctx.fillStyle='#D0AE7D';
  ctx.lineWidth=1.5;ctx.globalAlpha=.82;
  for(const x of [102,1098]){
    ctx.beginPath();ctx.moveTo(x,238);ctx.lineTo(x,505);ctx.stroke();
    ctx.beginPath();ctx.arc(x,530,11,.25,Math.PI*1.75);ctx.stroke();
    ctx.beginPath();ctx.arc(x+4,527,9,.25,Math.PI*1.75);ctx.stroke();
    ctx.beginPath();ctx.moveTo(x,556);ctx.lineTo(x,572);ctx.stroke();
    ctx.beginPath();ctx.moveTo(x,571);ctx.lineTo(x+5,578);
    ctx.lineTo(x,585);ctx.lineTo(x-5,578);ctx.closePath();ctx.stroke();
  }

  // Fine starbursts and curved gilded frame tendrils, as on the reference.
  ctx.save();ctx.strokeStyle='#ddb478';ctx.fillStyle='#ecd09b';
  ctx.lineWidth=1.35;ctx.globalAlpha=.82;
  for(const sx of [1,-1]){
   const x=sx<0?69:1131;
   for(const y of [505,890,1320,1570]){
    ctx.beginPath();ctx.moveTo(x,y-11);ctx.lineTo(x+7,y);
    ctx.lineTo(x,y+11);ctx.lineTo(x-7,y);ctx.closePath();ctx.stroke();
   }
  }
  for(const y of [790,1360]){
   const cx=600;
   ctx.beginPath();ctx.moveTo(cx-21,y);ctx.lineTo(cx+21,y);
   ctx.moveTo(cx,y-29);ctx.lineTo(cx,y+29);ctx.stroke();
   ctx.beginPath();ctx.moveTo(cx-9,y-9);ctx.lineTo(cx+9,y+9);
   ctx.moveTo(cx-9,y+9);ctx.lineTo(cx+9,y-9);ctx.stroke();
  }
  for(const sx of [1,-1]){
   ctx.save();ctx.translate(sx<0?80:1120,1800);ctx.scale(sx,1);
   ctx.beginPath();ctx.moveTo(0,175);
   ctx.bezierCurveTo(24,76,53,30,163,0);ctx.stroke();
   ctx.beginPath();ctx.moveTo(0,140);
   ctx.bezierCurveTo(33,66,79,21,150,17);ctx.stroke();
   ctx.restore();
  }
  ctx.restore();
  // One quiet divider between celestial mechanics and the animal's life.
  ctx.lineWidth=.8;ctx.globalAlpha=.3;
  ctx.beginPath();ctx.moveTo(370,940);ctx.lineTo(470,940);
  ctx.moveTo(730,940);ctx.lineTo(830,940);ctx.stroke();
  ctx.restore();ctx.restore();
 }

 // Approved Animagia frame system. Five DETERMINISTIC layouts per diet.
 // This only changes the edge ornament. Animal art and name scores untouched.
 function cardAdornment(row,styl,greekName=''){
  let hash=2166136261;
  for(const ch of String(row?.[1]||'')+'|'+String(greekName||''))
   hash=Math.imul(hash^ch.charCodeAt(0),16777619)>>>0;
  const diet=['predator','herbivore','omnivore'].includes(styl?.diet)?styl.diet:'unknown';

  // Decorative water motif is sourced from VERIFIED habitat. It does not
  // change diet labels and never infers a new ecological classification.
  const frog=diet==='predator'&&(row?.[4]==='Anura'||row?.[3]==='Amphibia');
  const water=styl?.habitat==='aquatic'||styl?.habitat==='semiaquatic';
  return {kind:frog?'soft-predator':water?'aquatic':diet,variant:hash%5};
 }
 // All bites/cuts remove the backing color, border, stars AND previously
 // drawn gilding. An alpha value of zero means a REAL hole in the card.
 // Cutouts are deliberately wider than the 48px reference frame inset;
 // previous 40px-radius bites were outside the visible frame entirely.
 function paintDietAdornment(ctx,row,styl,greekName){
  const style=cardAdornment(row,styl,greekName);
  const k=style.kind,v=style.variant,PI=Math.PI;
  const shapes=[]; // final destructive pass always happens LAST
  const xleft=54,xright=1146;
  const gold='#efc384',shine='#ffe1ac',leaf='#7f8561';
  function bite(side,pos,r,depth){
   // x/y centers placed JUST OUTSIDE the physical card, so the notches
   // look semicircular rather than floating circles.
   const x=side==='left'?-11+depth:side==='right'?1211-depth:pos;
   const y=side==='top'?-11+depth:side==='bottom'?2011-depth:pos;
   // Stippled antique foil lip: drawn first and erased inside the mouth.
   ctx.save();ctx.strokeStyle=gold;ctx.lineWidth=5;
   ctx.shadowColor='#f3ae64';ctx.shadowBlur=15;
   ctx.beginPath();ctx.arc(x,y,r+3,0,PI*2);ctx.stroke();
   ctx.lineWidth=1.6;ctx.globalAlpha=.64;ctx.beginPath();
   ctx.arc(x,y,r+11,0,PI*2);ctx.stroke();ctx.restore();
   shapes.push(()=>{ctx.beginPath();ctx.arc(x,y,r,0,PI*2);ctx.fill();});
  }
  function claw(side,atY,scale=1,slant=0){
   const x=side==='left'?-18:1218;
   const xdir=side==='left'?1:-1;
   // The three gouges follow the user's red hand-drawn reference: the
   // whole background is ripped away, not painted with three gold slashes.
   function path(i){
    const d=i*69;
    ctx.beginPath();ctx.moveTo(-36,d-25);
    ctx.bezierCurveTo(54,d+6,143,d+37,230,d+132);
    ctx.bezierCurveTo(165,d+86,72,d+61,-36,d+31);
    ctx.closePath();
   }
   function onEdge(render){
    ctx.save();ctx.translate(x,atY);
    ctx.rotate(slant);ctx.scale(xdir*scale,scale);
    render();ctx.restore();
   }
   onEdge(()=>{
    ctx.save();ctx.strokeStyle=gold;ctx.shadowColor='#e8aa62';
    ctx.shadowBlur=14;ctx.lineWidth=4.3;ctx.lineJoin='round';
    for(let i=0;i<3;i++){path(i);ctx.stroke();}
    ctx.restore();
   });
   shapes.push(()=>onEdge(()=>{for(let i=0;i<3;i++){path(i);ctx.fill();}}));
  }
  function bloom(x,y,r){
   ctx.save();ctx.translate(x,y);
   for(let j=0;j<5;j++){
    const a=2*PI*j/5;
    ctx.save();ctx.rotate(a);ctx.beginPath();
    ctx.ellipse(0,-r*.94,r*.42,r*.8,0,0,2*PI);
    ctx.fillStyle='#cdbba7';ctx.globalAlpha=.85;ctx.fill();
    ctx.strokeStyle='#f8dcb0';ctx.lineWidth=1.25;ctx.stroke();
    ctx.restore();
   }
   ctx.globalAlpha=1;ctx.fillStyle='#f5d298';
   ctx.beginPath();ctx.arc(0,0,r*.32,0,2*PI);ctx.fill();ctx.restore();
  }
  function botanical(side,atY,scale=1,flower=true){
   const mirror=side==='left'?1:-1,atX=side==='left'?57:1143;
   ctx.save();ctx.translate(atX,atY);ctx.scale(mirror*scale,scale);
   ctx.strokeStyle='#d6b783';ctx.lineWidth=3.3;
   ctx.shadowColor='#d5a670';ctx.shadowBlur=6;
   ctx.beginPath();ctx.moveTo(0,-46);
   ctx.bezierCurveTo(70,44,-49,153,27,258);
   ctx.bezierCurveTo(117,384,-45,456,25,600);ctx.stroke();
   for(let i=0;i<9;i++){
    const at=i*62,direction=i%2?-1:1;
    const px=18+8*Math.sin(i*.8);
    ctx.save();ctx.translate(px,at);ctx.rotate(direction*.45);
    ctx.beginPath();ctx.moveTo(0,0);
    ctx.bezierCurveTo(12*direction,-31,72*direction,-52,76*direction,-87);
    ctx.bezierCurveTo(26*direction,-83,6*direction,-45,0,0);
    ctx.closePath();ctx.fillStyle=leaf;ctx.globalAlpha=.83;ctx.fill();
    ctx.strokeStyle='#edc58d';ctx.lineWidth=2;ctx.stroke();
    ctx.beginPath();ctx.moveTo(0,0);
    ctx.quadraticCurveTo(34*direction,-47,76*direction,-87);
    ctx.strokeStyle='#edcc95';ctx.lineWidth=1;ctx.stroke();ctx.restore();
   }
   if(flower){bloom(43,150,22);bloom(28,445,16);}
   ctx.restore();
  }
  function cornerStem(left,upper){
   ctx.save();
   ctx.translate(left?62:1138,upper?64:1936);
   ctx.scale(left?1:-1,upper?1:-1);
   ctx.strokeStyle='#e1bd85';ctx.lineWidth=2.3;
   ctx.beginPath();ctx.moveTo(0,175);
   ctx.bezierCurveTo(7,56,65,-10,198,-9);ctx.stroke();
   for(let i=0;i<5;i++){
    const t=i*38;
    ctx.save();ctx.translate(22+t*.8,147-t*.74);ctx.rotate(-.5);
    ctx.beginPath();ctx.moveTo(0,0);
    ctx.quadraticCurveTo(28,-40,49,-43);
    ctx.quadraticCurveTo(43,-9,0,0);
    ctx.fillStyle='#73785b';ctx.globalAlpha=.8;ctx.fill();
    ctx.strokeStyle='#d7bb8b';ctx.stroke();ctx.restore();
   }
   bloom(110,32,14);ctx.restore();
  }
  function ripple(side,atY){
   ctx.save();ctx.strokeStyle='#c6b69b';ctx.lineWidth=2;
   ctx.globalAlpha=.82;
   const x=side==='left'?118:1082;
   for(let i=0;i<3;i++){
    ctx.beginPath();ctx.arc(x,atY+i*60,23+i*8,0,PI);ctx.stroke();
   }ctx.restore();
  }
  // Predators: five clearly distinct sets of actual edge damage.
  // Mode 2 is ALL bites. Mode 3 is ALL claws.
  const hunters=[
   ()=>{claw('left',470,1.05,.03);bite('right',230,143,5);bite('right',1490,125,4);},
   ()=>{bite('right',370,155,8);bite('left',1180,127,5);bite('bottom',950,125,2);},
   ()=>{claw('left',385,1.12,-.08);claw('right',1140,.9,.12);},
   ()=>{claw('left',180,1,.08);bite('bottom',930,143,9);},
   ()=>{claw('right',430,1.08,-.1);bite('top',1025,129,4);bite('left',1630,120,4);}
  ];


  // Water falling onto the card leaves transparent drops with golden
  // concentric ripples. No bite or claw marks for frogs or water animals.
  function waterDrop(side,atY,scale=1){
   const left=side==='left',cx=left?8:1192,dir=left?1:-1;
   function imprint(){
    ctx.beginPath();
    ctx.moveTo(-46,-88);
    ctx.bezierCurveTo(0,-48,115,-16,138,45);
    ctx.bezierCurveTo(158,101,112,138,61,137);
    ctx.bezierCurveTo(24,136,-8,103,-46,77);
    ctx.closePath();
   }
   function placed(fn){
    ctx.save();ctx.translate(cx,atY);ctx.scale(dir*scale,scale);
    fn();ctx.restore();
   }
   placed(()=>{
    ctx.save();ctx.strokeStyle='#ead2af';ctx.lineWidth=3.2;
    ctx.shadowColor='#d5b68e';ctx.shadowBlur=13;
    imprint();ctx.stroke();ctx.restore();
    // Small concentric rings are ripples, never false biological marks.
    ctx.save();ctx.strokeStyle='#d1b38c';ctx.lineWidth=1.85;
    ctx.globalAlpha=.82;
    for(const [dx,dy,rx,ry] of [[84,44,95,68],[84,44,132,94]]){
     ctx.beginPath();ctx.ellipse(dx,dy,rx,ry,0,-.8,1.1);ctx.stroke();
    }ctx.restore();
   });
   shapes.push(()=>placed(()=>{imprint();ctx.fill();}));
  }
  function waterSplash(side,atY,scale=1){
   const cx=side==='left'?8:1192,dir=side==='left'?1:-1;
   function dropPath(i){
    const dy=i*66;
    ctx.beginPath();ctx.moveTo(-38,dy-29);
    ctx.bezierCurveTo(28,dy-60,108,dy-31,135,dy+5);
    ctx.bezierCurveTo(82,dy+47,27,dy+34,-38,dy+39);
    ctx.closePath();
   }
   function placed(fn){
    ctx.save();ctx.translate(cx,atY);ctx.scale(dir*scale,scale);
    fn();ctx.restore();
   }
   placed(()=>{
    ctx.save();ctx.strokeStyle='#e7c79c';ctx.lineWidth=3;
    ctx.shadowColor='#dfb27f';ctx.shadowBlur=11;
    for(let i=0;i<3;i++){dropPath(i);ctx.stroke();}
    ctx.restore();
   });
   shapes.push(()=>placed(()=>{for(let i=0;i<3;i++){dropPath(i);ctx.fill();}}));
  }
  // Five distinct water-damaged gold edges. Frog cards look delicate,
  // while verified aquatic/semiaquatic species receive related motifs.
  const gentle=[
   ()=>{waterDrop('left',540,.93);waterSplash('right',1340,.78);ripple('left',1170);},
   ()=>{waterDrop('right',620,.94);waterDrop('left',1320,.68);ripple('right',1150);},
   ()=>{waterSplash('left',400,.93);waterDrop('right',1450,.85);ripple('left',1000);},
   ()=>{waterDrop('left',470,.83);waterSplash('right',990,.92);ripple('right',1570);},
   ()=>{waterDrop('right',940,.91);waterDrop('left',1520,.7);waterSplash('left',340,.7);}
  ];
  const aquatic=[
   ()=>{waterDrop('right',490,1.03);waterSplash('left',1390,.9);ripple('right',1260);},
   ()=>{waterSplash('right',320,1.06);waterDrop('left',1100,.85);ripple('left',560);},
   ()=>{waterDrop('left',670,1.08);waterSplash('right',1460,.9);ripple('right',680);},
   ()=>{waterSplash('left',550,1.07);waterDrop('right',1060,1.02);ripple('left',1280);},
   ()=>{waterDrop('right',650,.92);waterDrop('left',1460,.86);waterSplash('right',1330,.79);}
  ];
  // Herbivores: different arrangements of golden vines, small leaves
  // and flowers, all respecting the existing celestial card.
  const florals=[
   ()=>{botanical('left',130,.9,true);botanical('right',1160,.78,true);},
   ()=>{cornerStem(true,false);cornerStem(false,false);botanical('right',1230,.58,true);},
   ()=>{cornerStem(true,true);cornerStem(false,true);botanical('left',1150,.62,false);},
   ()=>{botanical('left',300,1.1,true);botanical('right',790,.88,false);},
   ()=>{cornerStem(true,false);botanical('right',220,.76,true);cornerStem(false,true);}
  ];
  const hybrids=[
   ()=>{botanical('left',195,.83,true);bite('right',1180,114,4);},
   ()=>{claw('left',490,.79,0);botanical('right',1150,.76,true);},
   ()=>{cornerStem(true,true);bite('right',460,112,5);},
   ()=>{botanical('right',270,.76,false);claw('left',1230,.7,.03);},
   ()=>{bite('top',930,118,4);botanical('left',1120,.78,true);claw('right',510,.65,.04);}
  ];
  if(k==='predator')hunters[v]();
  else if(k==='soft-predator')gentle[v]();
  else if(k==='aquatic')aquatic[v]();
  else if(k==='herbivore')florals[v]();
  else if(k==='omnivore')hybrids[v]();
  // LAST PASS. No gold strokes are allowed to repaint the deleted space:
  // the alpha of every bite and claw must remain exactly zero.
  if(shapes.length){
   ctx.save();
   ctx.globalCompositeOperation='destination-out';
   ctx.fillStyle='#000';
   ctx.shadowBlur=0;
   for(const erase of shapes)erase();
   ctx.restore();
  }
  return style;
 }

 function paintCardBackdropOnScreen(diet){
  const canvas=get('relicCardBackdrop');if(!canvas)return;
  const ctx=canvas.getContext('2d');
  if(!ctx)return;
  paintCardBackdrop(ctx,typeof sum==='number'&&sum>0?sum:1875,diet);
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
 function orderedAnimals(){
  const rows=safeRows(),provider=atlas();
  const illustrated=[],others=[];
  for(const row of rows)(provider?.resolve(row)?illustrated:others).push(row);
  return [...illustrated,...others];
 }
 function updatePicker(picker){
  const rows=orderedAnimals();
  const signature=[sum,rows.length,rows[0]?.[1],rows[rows.length-1]?.[1]].join('|');
  const old=picker.value;
  if(signature!==picker.dataset.signature){
   picker.dataset.signature=signature;
   const frag=document.createDocumentFragment();
   for(const row of rows){
    const option=elem('option',label(row)+' · '+row[1]);
    option.value=row[1]+'|'+row[2];frag.append(option);
   }
   picker.replaceChildren(frag);
   const chosen=rows.find(r=>r[1]+'|'+r[2]===old)||rows[0];
   picker.value=chosen?chosen[1]+'|'+chosen[2]:'';
  }
  const current=selection(picker);
  const named=get('animalChosenName'),latin=get('animalChosenScientific');
  if(named)named.textContent=current?label(current):'Выбери животное';
  if(latin)latin.textContent=current?current[1]:'';
  const trigger=get('animalChooserOpen');
  if(trigger)trigger.disabled=!rows.length;
  const count=get('relicAnimalResults');
  if(count){
   const shown=rows.filter(row=>atlas()?.resolve(row)).length;
   count.textContent=rows.length+' точных совпадений · '+shown+
    ' с готовыми золотыми рисунками. Остальные доступны через поиск.';
  }
 }
 function animalGroup(row){
  const c=row[3];
  if(c==='Mammalia')return 'mammal';
  if(c==='Aves')return 'bird';
  if(c==='Reptilia')return 'reptile';
  if(c==='Amphibia')return 'amphibian';
  if(['Actinopterygii','Actinopteri','Teleostei','Chondrichthyes','Elasmobranchii','Holocephali'].includes(c))return 'fish';
  if(c==='Arachnida')return 'spider';
  if(c==='Insecta')return 'insect';
  if(['Cephalopoda','Malacostraca','Echinoidea','Asteroidea','Holothuroidea'].includes(c))return 'marine';
  return 'other';
 }
 function setupAnimalChooser(picker){
  const modal=get('animalChooser'),trigger=get('animalChooserOpen'),close=get('animalChooserClose'),
   groups=get('animalChooserGroups'),items=get('animalChooserList'),counter=get('animalChooserCount'),
   illustrated=get('chooserFilterIllustrated'),all=get('chooserFilterAll'),more=get('animalChooserMore');
  if(!modal||!trigger||!close||!groups||!items||!counter||!more||!illustrated||!all)return;
  const labels={all:'Все',mammal:'Млекопитающие',bird:'Птицы',reptile:'Рептилии',
   amphibian:'Земноводные',fish:'Рыбы',spider:'Паукообразные',
   insect:'Насекомые',marine:'Морские',other:'Другие'};
  let onlyIllustrated=false,group='all',limit=48;
  function matches(){
   return orderedAnimals().filter(row=>{
    if(onlyIllustrated&&!atlas()?.resolve(row))return false;
    return group==='all'||animalGroup(row)===group;
   });
  }
  function renderGroups(){
   const counts={all:0};
   for(const row of orderedAnimals()){
    if(onlyIllustrated&&!atlas()?.resolve(row))continue;
    const key=animalGroup(row);
    counts[key]=(counts[key]||0)+1;counts.all++;
   }
   const frag=document.createDocumentFragment();
   for(const key of Object.keys(labels)){
    if(!counts[key])continue;
    const btn=elem('button',labels[key]+' · '+counts[key]);
    btn.type='button';btn.className='animal-chooser-group';
    btn.setAttribute('aria-pressed',String(key===group));
    btn.addEventListener('click',()=>{
     group=key;limit=48;render();
    });
    frag.append(btn);
   }
   groups.replaceChildren(frag);
  }
  function render(){
   const matched=matches(),slice=matched.slice(0,limit),frag=document.createDocumentFragment();
   for(const row of slice){
    const withArt=atlas()?.resolve(row);
    const btn=elem('button');btn.type='button';btn.className='animal-chooser-item';
    btn.setAttribute('aria-pressed',String(picker.value===row[1]+'|'+row[2]));
    const content=elem('span');content.className='animal-chooser-item-names';
    const common=elem('strong',label(row));
    const scientific=elem('em',row[1]);
    content.append(common,scientific);
    const badge=elem('small',withArt?'✧ Золотой образ':'Образ готовится');
    badge.className=withArt?'animal-chooser-art-ready':'animal-chooser-art-pending';
    btn.append(content,badge);
    btn.addEventListener('click',()=>{
     picker.value=row[1]+'|'+row[2];
     updatePicker(picker);syncSilhouette(picker);closeChooser();
    });
    frag.append(btn);
   }
   if(!matched.length)frag.append(elem('p','В этой группе нет точных совпадений.'));
   items.replaceChildren(frag);
   counter.textContent='Найдено '+matched.length+' · показано '+slice.length;
   more.hidden=matched.length<=limit;
   illustrated.setAttribute('aria-pressed',String(onlyIllustrated));
   all.setAttribute('aria-pressed',String(!onlyIllustrated));
   renderGroups();
  }
  function openChooser(){
   if(trigger.disabled)return;
   modal.hidden=false;document.body.classList.add('animal-chooser-opened');
   limit=48;onlyIllustrated=false;group='all';
   render();close.focus();
  }
  function closeChooser(){
   modal.hidden=true;document.body.classList.remove('animal-chooser-opened');
   trigger.focus();
  }
  trigger.addEventListener('click',openChooser);
  close.addEventListener('click',closeChooser);
  modal.querySelector('[data-chooser-dismiss]').addEventListener('click',closeChooser);
  illustrated.addEventListener('click',()=>{onlyIllustrated=true;group='all';limit=48;render()});
  all.addEventListener('click',()=>{onlyIllustrated=false;group='all';limit=48;render()});
  more.addEventListener('click',()=>{limit+=48;render()});
  document.addEventListener('keydown',event=>{
   if(modal.hidden)return;
   if(event.key==='Escape'){event.preventDefault();closeChooser();return;}
   if(event.key!=='Tab')return;
   const focuses=[...modal.querySelectorAll('button:not([disabled])')]
    .filter(x=>!x.hidden&&x.offsetParent!==null);
   if(!focuses.length)return;
   const first=focuses[0],last=focuses[focuses.length-1];
   if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
   else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  });
  return ()=>{if(!modal.hidden)closeChooser();};
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
  if(!row)paintCardBackdropOnScreen(meta.diet);
  if(box){
   box.dataset.diet=meta.diet;box.dataset.habitat=meta.habitat;
   box.hidden=meta.diet==='unknown'&&meta.habitat==='unknown'&&!meta.secondaryText.length;
  }
  const d=get('animalDiet'),h=get('animalHabitat'),extra=get('animalSecondary');
  if(d){d.textContent=meta.dietText;d.parentElement.hidden=meta.diet==='unknown';}
  if(h){h.textContent=meta.habitatText;h.parentElement.hidden=meta.habitat==='unknown';}
  if(extra)extra.textContent=meta.secondaryText.length?'Также: '+meta.secondaryText.join(' · '):'';
  const inside=get('relicPreviewTraits');
  if(inside){
   inside.replaceChildren();
   for(const [id,title,symbol,value,known] of [
    ['diet','Рацион','✦',meta.dietText,meta.diet!=='unknown'],
    ['habitat','Среда обитания','◌',meta.habitatText,meta.habitat!=='unknown']
   ]){
    const item=elem('span');
    item.className='relic-trait relic-trait-'+id+(known?'':' relic-trait-unverified');
    const heading=elem('small',title);
    const detail=elem('strong',known?symbol+' '+value:'Уточняется');
    item.append(heading,detail);
    inside.append(item);
   }
   inside.hidden=false;
  }
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
   info.textContent=profile.exact?'Золотой облик':'Художественный образ формы';
  }else{
   frame.replaceChildren(elem('span','✦'));
   info.textContent='Образ скрытой формы ещё создаётся';
  }
 }
 let currentPictureSerial=0;
 let previousPictureKey='';
 function updatePreviewText(row){
  const greekView=get('relicPreviewGreek');
  if(greekView)greekView.textContent=row?get('greek').value.trim():'';
  const original=row?label(row):'',dash=original.indexOf(' — ');
  const category=dash>=0?original.slice(0,dash):'';
  const pretty=dash>=0?original.slice(dash+3):original;
  const categoryField=get('relicPreviewCategory');
  if(categoryField){
   categoryField.hidden=!category;
   categoryField.textContent=category;
  }
  const pairs=[
   ['relicPreviewAnimal',row?pretty:'Выбери животное'],
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
  void composeScreenCard(row);
  if(key===previousPictureKey)return;
  previousPictureKey=key;
  const serial=++currentPictureSerial;
  if(!row)clearIllustration();
  else void showSilhouette(row,serial);
 }

 // Screen preview and exported file use the SAME finished 1200×2000 Canvas.
 // Keeping a single source of truth avoids the previous mismatched CSS overlay
 // and cut-off bottom captions reported on mobile.
 function paintFinishedCard(ctx,row,greek,profile,sprite,styl){
   const gallery=atlas();
   const cardNumber=row[0];
   paintCardBackdrop(ctx,cardNumber,styl.diet);
   ctx.fillStyle='#F1DDB8';ctx.font='36px Georgia,serif';ctx.textAlign='center';
   ctx.fillText('✧  А Н И М А Г И Я  ✧',600,133);
   ctx.fillStyle='#C3B1C7';ctx.font='22px Georgia,serif';
   ctx.fillText('АТЛАС СКРЫТЫХ ФОРМ · МАГИЧЕСКАЯ ПЕЧАТЬ',600,175);
   // Keep the accepted geometric number circle completely unchanged.
   paintSeal(ctx,cardNumber,600,505,300,greek);
   // The owner's Greek name is visible inside the wheel, not repeated below.
   let artNote='';
   if(sprite&&profile){
    gallery.drawCanvas(ctx,sprite,profile,205,760,790,570);
    artNote='';
   }else{
    // A quiet celestial mark is better than a biologically wrong silhouette.
    ctx.save();
    ctx.strokeStyle='#C9A879';ctx.globalAlpha=.48;ctx.lineWidth=1.6;
    for(const radius of [116,154]){
      ctx.beginPath();ctx.arc(600,1085,radius,0,Math.PI*2);ctx.stroke();
    }
    ctx.fillStyle='#E6C48D';ctx.globalAlpha=.9;
    ctx.font='58px Georgia,serif';ctx.fillText('✧',600,1106);
    ctx.restore();
    artNote='Образ скрытой формы ещё создаётся';
   }
   ctx.fillStyle='#BDAAC3';ctx.font='17px Georgia,serif';ctx.textAlign='center';
   if(artNote)ctx.fillText(artNote,600,1324);
   ctx.fillStyle='#D5B684';ctx.font='22px Georgia,serif';
   ctx.fillText('✧  С К Р Ы Т А Я   Ф О Р М А  ✧',600,1355);
   // Generic Russian category and the species epithet are separate lines.
   // Avoid forcing very long placeholder names into an overflowing headline.
   const fullName=label(row),dash=fullName.indexOf(' — ');
   const category=dash>=0?fullName.slice(0,dash):'';
   const heading=dash>=0?fullName.slice(dash+3):fullName;
   if(category){
    ctx.fillStyle='#D3B385';ctx.font='23px Georgia,serif';
    ctx.fillText(category,600,1395);
   }
   ctx.fillStyle='#F5E0BE';
   let nameLines=[];
   for(let font=50;font>=29;font-=3){
    ctx.font='600 '+font+'px Georgia,serif';
    nameLines=textLines(ctx,heading,930,2);
    if(!nameLines.some(line=>line.endsWith('…')))break;
   }
   const nameY=category?1455:1438;
   for(const [i,line] of nameLines.entries())ctx.fillText(line,600,nameY+i*51);
   ctx.fillStyle='#D5CAD6';centered(ctx,row[1],1544,1020,'italic 29px Georgia,serif',1);

   // Verified independent ecological labels, without cramped little tables.
   const ecology=[
    styl.diet!=='unknown'?styl.dietText:null,
    styl.habitat!=='unknown'?styl.habitatText:null
   ].filter(Boolean);
   if(ecology.length){
    ctx.fillStyle='#D7BE91';
    centered(ctx,ecology.join('  ✧  '),1634,950,'26px Georgia,serif',1);
   }
   ctx.strokeStyle='#cba777';ctx.lineWidth=1.2;ctx.globalAlpha=.75;
   ctx.beginPath();ctx.moveTo(460,1700);ctx.lineTo(546,1700);
   ctx.moveTo(654,1700);ctx.lineTo(740,1700);ctx.stroke();ctx.globalAlpha=1;
   ctx.fillStyle='#D1BB9C';ctx.font='19px Georgia,serif';
   ctx.fillText('ЧИСЛО СОВПАДЕНИЯ',600,1722);
   ctx.fillStyle='#F8DBA4';ctx.font='600 68px Georgia,serif';
   ctx.fillText(String(cardNumber),600,1800);
   ctx.fillStyle='#C9B0A0';ctx.font='17px Georgia,serif';
   ctx.fillText('✧ ТОЧНОЕ ЧИСЛОВОЕ СОВПАДЕНИЕ ✧',600,1868);
   ctx.fillStyle='#bda68d';ctx.font='15px Georgia,serif';
   ctx.fillText('ДЕКОРАТИВНАЯ ПЕЧАТЬ · НЕ ХАРАКТЕРИСТИКА ВИДА ИЛИ ЛИЧНОСТИ',600,1931);
   paintDietAdornment(ctx,row,styl,greek);

 }
 let posterSerial=0;
 async function composeScreenCard(row){
  const wrap=get('relicCard'),canvas=get('relicCardBackdrop');
  if(!wrap||!canvas)return false;
  const serial=++posterSerial;
  if(!row){
   wrap.classList.remove('is-poster-rendered');
   canvas.dataset.posterReady='0';
   paintCardBackdropOnScreen(null);
   return false;
  }
  const greek=get('greek').value.trim();
  if(!validGreek(greek)||score(greek)!==row[0]||row[0]!==sum)return false;
  const gallery=atlas(),profile=gallery?.resolve(row)||null;
  const sprite=profile?await gallery.drawable():null;
  if(serial!==posterSerial)return false;
  const ctx=canvas.getContext('2d');if(!ctx)return false;
  canvas.width=1200;canvas.height=2000;
  const styl=gallery?.style(gallery.classify(row))||{};
  paintFinishedCard(ctx,row,greek,profile,sprite,styl);
  const ornament=cardAdornment(row,styl,greek);
  wrap.dataset.cardVariant=ornament.kind+'-'+(ornament.variant+1);
  canvas.dataset.posterReady='1';
  wrap.classList.add('is-poster-rendered');
  return true;
 }



 async function savePNG(picker,status){
  const row=selection(picker),greek=get('greek').value.trim();
  if(!row||!validGreek(greek)||score(greek)!==sum){
   status.textContent='Сначала выполни поиск точных совпадений.';return;
  }
  try{
   status.textContent='Создаём PNG с прозрачной рамкой…';
   if(!await composeScreenCard(row))throw Error('Карточка обновляется, повтори сохранение.');
   const canvas=get('relicCardBackdrop');
   const blob=await new Promise((resolve,reject)=>{
    try{canvas.toBlob(resolve,'image/png');}catch(error){reject(error);}
   });
   if(!blob)throw Error('Не удалось создать PNG');
   const filename='Анимагия_форма_'+sum+'.png';
   const url=URL.createObjectURL(blob),link=elem('a');
   link.href=url;link.download=filename;
   document.body.append(link);link.click();link.remove();
   setTimeout(()=>URL.revokeObjectURL(url),15000);
   status.textContent='Карточка PNG скачана; декоративные вырезы остаются прозрачными.';
  }catch(error){status.textContent='Не удалось сохранить карточку: '+error.message;}
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
 async function printBooklet(status){
  if(!safeRows().length||!validGreek(get('greek').value)||score(get('greek').value)!==sum){
   status.textContent='Сначала найди точные совпадения.';return;
  }
  status.textContent='Составляем золотой бестиарий…';
  const gallery=atlas(),picture=gallery?await gallery.drawable():null;
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
   if(illustration&&picture){
    const windowArt=elem('canvas');windowArt.className='print-art-cell';
    windowArt.width=400;windowArt.height=330;
    windowArt.setAttribute('role','img');
    windowArt.setAttribute('aria-label','Золотой образ '+r[1]);
    gallery.drawCanvas(windowArt.getContext('2d'),picture,illustration,0,0,400,330);
    art.append(windowArt);
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
    if(typeof closeAnimalChooser==='function')closeAnimalChooser();
    const chooser=get('animalChooserOpen');if(chooser)chooser.disabled=true;
    const title=get('animalChosenName');if(title)title.textContent='Сначала выполни расчёт';
    const sci=get('animalChosenScientific');if(sci)sci.textContent='Выбери найденное животное';
    svg.replaceChildren();picker.replaceChildren(elem('option','Сначала выполни поиск'));
    void composeScreenCard(null);
    picker.dataset.signature='';previous=null;
    syncSilhouette(picker);
    get('sealCaption').textContent='Печать появится после расчёта';
   }else{
    if(previous!==sum+'|'+get('greek').value){decorateSVG(svg,sum,get('greek').value);previous=sum+'|'+get('greek').value;}
    get('sealCaption').textContent='Число '+sum+' · декоративная магическая печать';
    updatePicker(picker);
    syncSilhouette(picker);
   }
  }
  picker.addEventListener('change',()=>syncSilhouette(picker));
  const closeAnimalChooser=setupAnimalChooser(picker);
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
