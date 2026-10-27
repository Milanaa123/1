'use strict';
/* Phase V: purely client-side decorative tools. No personal data storage.
   Uses only the existing verified results, scores and catalogue manifest. */
(() => {
 const get=id=>document.getElementById(id);
 const NS='http://www.w3.org/2000/svg';
 const LETTERS=[...'αβγδεζηθικλμνξοπρστυφχψω'];

 // The card shows only the FIRST GIVEN NAME, exactly as transcribed to Greek.
 // Breathings, accents and combining marks are retained. Calculations still
 // use ALL names entered in app.js; this is presentation only.
 function wheelLetters(greekName){
  const first=String(greekName||'').trim().normalize('NFC').split(/\s+/u)[0]||'';
  if(!first)return [];
  return typeof Intl!=='undefined'&&Intl.Segmenter
   ?[...new Intl.Segmenter('el',{granularity:'grapheme'}).segment(first)].map(x=>x.segment)
   :Array.from(first);
 }
 // Identical angular slots around the complete 360-degree seal.
 function nameArc(glyphs,font,r){
  const count=glyphs.length;
  return i=>count?-Math.PI/2+2*Math.PI*i/count:-Math.PI/2;
 }
 function ringFontSize(glyphs,r,maximum,minimum){
  if(!glyphs.length)return maximum;
  const angularSpace=2*Math.PI*r/glyphs.length;
  // The average rendered width of a glyph stays below 74% of its slot.
  return Math.max(minimum,Math.min(maximum,Math.floor(angularSpace*.74)));
 }
 function uprightRingAngle(angle){
  // Flip bottom-half glyphs to keep individual characters legible.
  return angle+Math.PI/2+(Math.sin(angle)>0?Math.PI:0);
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
  const glyphSize=ringFontSize(inscription,132,22,10);
  const angle=nameArc(inscription,glyphSize,132);
  svg.setAttribute('aria-label','Магическое колесо: '+inscription.join('')+'; число '+n);
  for(let i=0;i<inscription.length;i++){
   const a=angle(i),px=180+Math.cos(a)*132,py=180+Math.sin(a)*132;
   node('text',{x:px,y:py,'font-size':glyphSize,
    'font-family':'Georgia,serif','text-anchor':'middle',
    transform:'rotate('+(uprightRingAngle(a)*180/Math.PI)+' '+px+' '+py+')',
    fill:'#EBD4A4'},inscription[i]===' '?'':inscription[i]);
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
  const font=ringFontSize(inscription,r*.82,36,15);
  ctx.font=font+'px Georgia,serif';
  const angle=nameArc(inscription,font,r*.82);
  for(let i=0;i<inscription.length;i++){
   const a=angle(i);
   ctx.save();ctx.translate(Math.cos(a)*r*.82,Math.sin(a)*r*.82);
   ctx.rotate(uprightRingAngle(a));
   if(inscription[i]!==' ')ctx.fillText(inscription[i],0,0);
   ctx.restore();
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
  // Stage 1: dark celestial vellum, not dozens of opaque purple loops.
  // Seeded: the visible card and downloaded PNG share identical stars.
  let seed=(number*2246822519+784691)>>>0;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  ctx.save();
  // Diffuse violet dust exists near the parchment edges; never over lettering.
  const clouds=[
   [65,680,300,'#783868',.12],
   [1125,560,290,'#67417d',.10],
   [87,1310,330,'#6f3464',.11],
   [1110,1420,320,'#763e71',.13],
   [290,1150,290,'#55334f',.065],
   [915,930,250,'#6c3c73',.055],
   [625,1790,450,'#65375d',.075]
  ];
  for(const [x,y,r,color,alpha] of clouds){
   const cloud=ctx.createRadialGradient(x,y,12,x,y,r);
   cloud.addColorStop(0,color+Math.round(alpha*255).toString(16).padStart(2,'0'));
   cloud.addColorStop(.43,color+Math.round(alpha*110).toString(16).padStart(2,'0'));
   cloud.addColorStop(1,color+'00');
   ctx.fillStyle=cloud;ctx.fillRect(x-r,y-r,2*r,2*r);
  }
  // Reference-style violet cosmic clouds, not rigid repeated side curls.
  // Procedural smoke ribbons are translucent and sit in the card background.
  // No rendered image is substituted for the actual live card canvas.
  const ribbons=[
   [-1,190,280,1570,110],[-1,160,650,1630,80],
   [1,190,240,1600,104],[1,158,750,1720,72]
  ];
  for(const [side,depth,first,last,spread] of ribbons){
   const sign=side<0?1:-1;
   const centreY=(first+last)/2;
   // A pair of softly feathered nebula filaments along an organic spine.
   for(let j=0;j<21;j++){
    const y=first+(last-first)*j/20;
    const spine=side<0?92:1108;
    const wander=Math.sin(y*.006+side*2.1)*40+
       Math.sin(y*.014+side)*21;
    const x=spine+sign*(depth*.55+wander);
    const rad=spread+12*Math.sin(j*1.35);
    const glow=ctx.createRadialGradient(x,y,1,x,y,rad);
    glow.addColorStop(0,'rgba(187,105,186,.16)');
    glow.addColorStop(.38,'rgba(119,77,156,.085)');
    glow.addColorStop(1,'rgba(74,42,119,0)');
    ctx.fillStyle=glow;ctx.fillRect(x-rad,y-rad,rad*2,rad*2);
   }
   // Threads of colored stardust without a sharp outline or full loops.
   for(let j=0;j<2100;j++){
    const y=first+random()*(last-first);
    const x0=(side<0?92:1108)+sign*
      (depth*.55+Math.sin(y*.006+side*2.1)*40+Math.sin(y*.014+side)*21);
    const cross=(random()+random()+random()-1.5)*spread*.6;
    const x=x0+cross;
    if(x<70||x>1130)continue;
    const centreBoost=.45+.55*Math.sin((y-first)/(last-first)*Math.PI);
    const a=(.055+random()*.20)*centreBoost;
    ctx.fillStyle=random()>.33
       ?'rgba(205,132,194,'+a.toFixed(3)+')'
       :'rgba(140,114,215,'+(a*.7).toFixed(3)+')';
    ctx.beginPath();ctx.arc(x,y,.25+random()*1.4,0,Math.PI*2);ctx.fill();
   }
  }
  // Fine flowing cosmic dust instead of visible thick loops or pasted
  // illustrations.  Every wisp is a cloud of translucent pinpricks.
  for(const side of [-1,1]){
   const sign=side<0?1:-1,edge=side<0?102:1098;
   for(let plume=0;plume<9;plume++){
    const from=185+plume*190+random()*70;
    const length=150+random()*250;
    const offset=25+random()*66;
    const bend=(random()-.5)*95;
    const particleCount=330;
    for(let j=0;j<particleCount;j++){
     const t=random(),y=from+length*t;
     const sp=sign*(offset+Math.sin(t*Math.PI*1.9+plume*.8)*30+
       t*bend);
     const jitter=(random()+random()+random()-1.5)*48;
     const x=edge+sp+jitter;
     if(x<72||x>1128||y<88||y>1960)continue;
     const brightness=.065+random()*.17;
     const envelope=Math.sin(Math.PI*t);
     const alpha=brightness*(.35+.65*envelope);
     ctx.fillStyle=random()>.4
       ?'rgba(208,132,196,'+alpha.toFixed(3)+')'
       :'rgba(137,103,200,'+(alpha*.8).toFixed(3)+')';
     ctx.beginPath();ctx.arc(x,y,.28+random()*1.05,0,Math.PI*2);
     ctx.fill();
    }
   }
  }
  // Bright but rare stellar glints, clustered near the page edges.
  for(const [x,y,sz] of [
   [166,320,11],[95,780,8],[200,1115,12],[124,1750,9],
   [1030,250,10],[1090,635,8],[1028,970,11],[1080,1680,9],
   [290,1840,7],[940,1860,8]
  ]){
   const g=ctx.createRadialGradient(x,y,0,x,y,sz*7);
   g.addColorStop(0,'rgba(244,196,144,.3)');
   g.addColorStop(.18,'rgba(163,107,189,.12)');
   g.addColorStop(1,'rgba(118,69,140,0)');
   ctx.fillStyle=g;ctx.fillRect(x-sz*7,y-sz*7,sz*14,sz*14);
   ctx.save();ctx.strokeStyle='rgba(245,199,151,.57)';
   ctx.lineWidth=.9;ctx.beginPath();
   ctx.moveTo(x-sz,y);ctx.lineTo(x+sz,y);
   ctx.moveTo(x,y-sz*1.5);ctx.lineTo(x,y+sz*1.5);
   ctx.stroke();ctx.restore();
  }
  // Constellation dust is concentrated at the edges of the figure, so the
  // seal, animal engraving, species name and bottom numeral remain readable.
  for(let i=0;i<1320;i++){
   let x=65+random()*1070,y=70+random()*1930;
   const outside=x<235||x>965||y<255||y>1790;
   if(!outside&&random()<.77)continue;
   const sparkle=random(),radius=sparkle>.993?1.85:.19+random()*.57;
   const alpha=outside?.12+random()*.36:.07+random()*.19;
   ctx.fillStyle=sparkle>.36
    ?'rgba(238,193,142,'+alpha.toFixed(3)+')'
    :'rgba(170,116,195,'+(alpha*.68).toFixed(3)+')';
   ctx.beginPath();ctx.arc(x,y,radius,0,Math.PI*2);ctx.fill();
  }
  // A few whisper-thin vapor trails (not the former 54 bright side loops).
  for(const side of [-1,1]){
   const x=side<0?82:1118,sign=side<0?1:-1;
   for(let i=0;i<5;i++){
    const y=275+i*332+random()*45,reach=55+random()*62;
    ctx.save();ctx.strokeStyle=i%2?'#7c5a88':'#a4789e';
    ctx.globalAlpha=.085;ctx.lineWidth=1.2+random()*.5;
    ctx.beginPath();ctx.moveTo(x,y);
    ctx.bezierCurveTo(x+sign*reach*.35,y-64,
       x+sign*reach*.98,y+66,x+sign*reach*.42,y+174);
    ctx.stroke();ctx.restore();
   }
  }
  // A soft geometric halo ties the selected engraving to the magic wheel.
  const halo=ctx.createRadialGradient(600,1140,110,600,1140,470);
  halo.addColorStop(0,'#87649014');
  halo.addColorStop(.5,'#66466e09');
  halo.addColorStop(1,'#66466e00');
  ctx.fillStyle=halo;ctx.fillRect(140,680,920,920);
  ctx.globalAlpha=.4;ctx.strokeStyle='#cba26c';ctx.lineWidth=1.05;
  for(const [rx,ry,first,last] of [
   [380,278,Math.PI*1.07,Math.PI*1.93],
   [453,341,Math.PI*1.1,Math.PI*1.9],
   [294,190,Math.PI*1.03,Math.PI*1.97]
  ]){
   ctx.beginPath();ctx.ellipse(600,1160,rx,ry,0,first,last);ctx.stroke();
  }
  ctx.globalAlpha=.83;ctx.strokeStyle='#ebc58e';
  for(const [x,y,size] of [[600,860,14],[780,1020,9],[405,1285,10],[920,1320,7]]){
   ctx.beginPath();ctx.moveTo(x-size,y);ctx.lineTo(x+size,y);
   ctx.moveTo(x,y-size*1.4);ctx.lineTo(x,y+size*1.4);ctx.stroke();
   ctx.beginPath();ctx.arc(x,y,1.8,0,Math.PI*2);
   ctx.fillStyle='#f6daa7';ctx.fill();
  }
  ctx.restore();
 }
 function paintCardBackdrop(ctx,number,diet){
  // One 1200x2000 composition for both the screen and downloaded PNG.
  // Reference aspect ratio 3:5; frame motifs retain original drawing coordinates.
  ctx.save();
  ctx.scale(1,2000/2070);
  const base=ctx.createLinearGradient(0,0,1120,2070);
  base.addColorStop(0,'#090a14');base.addColorStop(.45,'#12101d');
  base.addColorStop(.71,'#1a1425');base.addColorStop(1,'#090a14');
  ctx.fillStyle=base;ctx.fillRect(0,0,1200,2070);
  const warmth={predator:'#a0754b',herbivore:'#8b8773',omnivore:'#8d7194'}[diet]||'#87677c';
  const aurora=ctx.createRadialGradient(600,1110,80,600,1110,780);
  aurora.addColorStop(0,warmth+'12');aurora.addColorStop(.52,'#9c62820c');
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


  // Balanced six-strand gilded Art Nouveau fans behind the species motifs.
  // All four corners match the reference and retain clear, blank mid-edges
  // for the animal-specific marks which will be approved separately.
  ctx.save();
  ctx.strokeStyle='#d5ad78';ctx.lineWidth=1.08;
  ctx.globalAlpha=.83;
  for(const xSign of [1,-1])for(const ySign of [1,-1]){
   ctx.save();ctx.translate(xSign===1?62:1138,ySign===1?62:2008);
   ctx.scale(xSign,ySign);
   for(let i=0;i<6;i++){
    const out=118+i*15;
    ctx.beginPath();ctx.moveTo(0,out);
    ctx.bezierCurveTo(i*5+10,out*.40,out*.4,i*5+10,out,0);
    ctx.stroke();
   }
   ctx.fillStyle='#f2d3a0';
   for(const x of [0,30,94]){
    ctx.beginPath();ctx.arc(x,0,1.4,0,Math.PI*2);ctx.fill();
   }
   ctx.restore();
  }
  ctx.restore();

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
  // Perimeter engraving directly on the card: double foil, suspended
  // crescent finials and tiny four-point gilded intersections as in reference.
  ctx.save();
  ctx.strokeStyle='#efc38b';ctx.lineWidth=1.1;ctx.globalAlpha=.88;
  for(const side of [-1,1]){
    const anchor=side<0?53:1147;
    for(const y of [284,880,1250,1785]){
      ctx.beginPath();
      ctx.moveTo(anchor-6,y);ctx.lineTo(anchor+6,y);
      ctx.moveTo(anchor,y-14);ctx.lineTo(anchor,y+14);
      ctx.stroke();
      ctx.beginPath();ctx.arc(anchor,y,2.4,0,Math.PI*2);
      ctx.fillStyle='#f3d099';ctx.fill();
    }
    // A softly scalloped engraving visible just inside the gold outer rim.
    const x=side<0?78:1122,sgn=side<0?1:-1;
    ctx.globalAlpha=.58;
    ctx.beginPath();ctx.moveTo(x,255);
    ctx.bezierCurveTo(x+sgn*12,360,x+sgn*15,475,x,570);ctx.stroke();
    ctx.beginPath();ctx.moveTo(x,1510);
    ctx.bezierCurveTo(x+sgn*14,1655,x+sgn*15,1800,x,1925);ctx.stroke();
    ctx.globalAlpha=.88;
  }
  // Long filigree chords at top and bottom establish the same antique edge.
  for(const upper of [true,false]){
   const y=upper?64:2006,sgn=upper?1:-1;
   ctx.beginPath();ctx.moveTo(238,y);ctx.lineTo(962,y);ctx.stroke();
   for(const x of [235,400,600,800,965]){
    ctx.beginPath();ctx.arc(x,y,2.5,0,Math.PI*2);
    ctx.fillStyle='#f4d29c';ctx.fill();
   }
   for(const side of [-1,1]){
    const x=side<0?70:1130,xSign=side<0?1:-1;
    ctx.beginPath();ctx.moveTo(x,y+sgn*118);
    ctx.bezierCurveTo(x+xSign*26,y+sgn*36,
      x+xSign*83,y+sgn*8,x+xSign*175,y);
    ctx.stroke();
   }
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
  let hash=2166136261;for(const ch of String(row?.[1]||'')+'|'+String(greekName||''))
   hash=Math.imul(hash^ch.charCodeAt(0),16777619)>>>0;
  const genus=String(row?.[1]||'').split(' ')[0],cls=row?.[3],order=row?.[4];
  const diet=['predator','herbivore','omnivore'].includes(styl?.diet)?styl.diet:'unknown';
  const water=['aquatic','semiaquatic'].includes(styl?.habitat);
  const belongs=(list)=>list.includes(genus);
  // These are artistic families, NOT scientific diet declarations. They
  // cover the user's 100 selected species, even where no art is uploaded.
  const cat=['Panthera','Puma','Acinonyx','Neofelis','Leopardus','Lynx','Caracal',
    'Felis','Canis','Cuon','Lycaon','Gulo'];
  const flora=['Cervus','Alces','Capreolus','Rangifer','Bison','Bubalus',
    'Ovis','Capra','Rupicapra','Equus','Giraffa','Gazella','Antilope',
    'Camelus','Lama','Vicugna','Oryctolagus','Lepus','Macropus',
    'Phascolarctos','Vombatus','Ailuropoda','Hystrix','Testudo','Bos'];
  const mixed=['Vulpes','Procyon','Meles','Sus','Ursus','Sciurus',
    'Cricetus','Mesocricetus','Mus','Rattus','Spermophilus'];
  // Illustration families account for all 100 approved reference subjects.
  // Fictional Pegasus is an illustration motif only, never a real taxonomy row.
  const extraWater=['Zalophus','Eumetopias','Otaria','Arctocephalus',
    'Neogale','Neovison','Homarus','Cancer','Scyphozoa'];
  const seaTurtles=['Chelonia','Caretta','Dermochelys','Eretmochelys','Lepidochelys'];
  let kind='celestial';
  if(order==='Araneae'||belongs(['Araneus','Argiope','Nephila','Trichonephila',
    'Latrodectus','Loxosceles','Steatoda','Tegenaria','Eratigena','Pholcus',
    'Theridion','Tetragnatha','Salticus','Pardosa']))kind='spider';
  else if(order==='Anura')kind='soft-predator'; // webbed frog footprints
  else if(order==='Chiroptera'||belongs(['Pteropus','Myotis','Pipistrellus',
      'Rhinolophus','Desmodus','Eptesicus']))kind='nocturnal';
  else if(cls==='Aves')kind=order==='Sphenisciformes'||belongs(['Aptenodytes',
      'Spheniscus','Pygoscelis','Eudyptes'])?'aquatic':'avian';
  else if(cls==='Reptilia')kind=belongs(seaTurtles)?'aquatic':'reptile';
  else if(water||['Malacostraca','Scyphozoa','Cubozoa','Hydrozoa'].includes(cls)
      ||belongs(extraWater)||belongs(['Orcinus','Delphinus','Megaptera','Balaenoptera',
      'Hippocampus','Trichechus','Lutra','Lontra','Enhydra',
      'Phoca','Odobenus','Octopus','Loligo','Castor','Carcharodon',
      'Mobula','Manta','Mustela']))kind='aquatic';
  else if(diet==='herbivore'||belongs(flora)||genus==='Marmota')kind='herbivore';
  else if(genus==='Sarcophilus'||genus==='Dasyurus')kind='predator';
  else if(diet==='omnivore'||belongs(mixed))kind='omnivore';
  else if(diet==='predator'||belongs(cat))kind='predator';
  else if(['Insecta','Arachnida'].includes(cls))kind='nocturnal';
  else if(cls==='Mammalia')kind=order==='Carnivora'?'predator':'woodland';
  return {kind,variant:hash%5};
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
   const vert=side==='left'||side==='right';
   const x=side==='left'?4:side==='right'?1196:pos;
   const y=side==='top'?4:side==='bottom'?1996:pos;
   const radius=Math.min(88,Math.max(54,r*.54));
   for(let n=-1;n<=1;n++){
    const dx=vert?0:n*radius*.84,dy=vert?n*radius*.84:0;
    const cx=x+dx,cy=y+dy,rr=radius*(n===0?1:.74);
    ctx.save();ctx.beginPath();ctx.arc(cx,cy,rr+3,0,2*PI);
    ctx.strokeStyle='#ffcd91';ctx.lineWidth=4.3;
    ctx.shadowColor='#ef9c68';ctx.shadowBlur=14;ctx.stroke();ctx.restore();
    shapes.push(()=>{ctx.beginPath();ctx.arc(cx,cy,rr,0,2*PI);ctx.fill();});
   }
  }
  function claw(side,atY,scale=1,slant=0){
   const left=side==='left',sign=left?1:-1;
   const edge=left?13:1187;
   // Three asymmetric long, tapered actual cuts with foil-lit ragged lips.
   // They enter the artwork from OUTSIDE the frame, as in the reference.
   const placed=(fn)=>{ctx.save();ctx.translate(edge,atY);
      ctx.rotate(slant);ctx.scale(sign*scale,scale);fn();ctx.restore();};
   const wound=i=>{
    const y=i*73,w=265-i*22;
    ctx.beginPath();ctx.moveTo(-55,y-69);
    ctx.bezierCurveTo(53,y-43,135,y-10,w+8,y+114);
    ctx.bezierCurveTo(w-24,y+93,w-70,y+60,w-95,y+32);
    ctx.bezierCurveTo(105,y+15,23,y-6,-55,y-33);ctx.closePath();
   };
   placed(()=>{
    ctx.save();ctx.lineJoin='round';
    ctx.shadowColor='#ffbc7a';ctx.shadowBlur=19;
    ctx.strokeStyle='#f6c78c';ctx.lineWidth=7.5;
    for(let i=0;i<3;i++){wound(i);ctx.stroke();}
    ctx.restore();
    ctx.save();ctx.strokeStyle='rgba(255,223,167,.82)';
    ctx.lineWidth=1.5;
    for(let i=0;i<3;i++){
      ctx.beginPath();ctx.moveTo(12,i*73-78);
      ctx.quadraticCurveTo(132,i*73-34,220-i*20,i*73+43);
      ctx.stroke();
    }
    ctx.restore();
   });
   shapes.push(()=>placed(()=>{for(let i=0;i<3;i++){wound(i);ctx.fill();}}));
  }

  function bloom(x,y,r){
   // Hand-drawn five-petal flowers: luminous gold edges, muted pink petals,
   // separate centers and tiny asymmetry. No neon-cartoon floral stickers.
   ctx.save();ctx.translate(x,y);ctx.rotate(.2);
   for(let j=0;j<5;j++){
    ctx.save();ctx.rotate(2*PI*j/5);
    ctx.beginPath();ctx.moveTo(0,-r*.23);
    ctx.bezierCurveTo(-r*.5,-r*.53,-r*.34,-r*1.28,-r*.04,-r*1.30);
    ctx.bezierCurveTo(r*.44,-r*1.18,r*.48,-r*.60,0,-r*.23);
    ctx.fillStyle=j%2?'rgba(197,126,164,.88)':'rgba(232,168,192,.88)';
    ctx.fill();ctx.strokeStyle='#f3c798';ctx.lineWidth=1.5;ctx.stroke();
    ctx.restore();
   }
   ctx.beginPath();ctx.arc(0,0,r*.26,0,2*PI);
   ctx.fillStyle='#ffdb97';ctx.shadowBlur=4;ctx.shadowColor='#f4c998';
   ctx.fill();ctx.restore();
  }
  function botanical(side,atY,scale=1,flower=true){
   const sign=side==='left'?1:-1,edge=side==='left'?55:1145;
   ctx.save();ctx.translate(edge,atY);ctx.scale(sign*scale,scale);
   ctx.lineJoin='round';ctx.lineCap='round';
   const stems=[
     [[-3,-65],[90,80],[-41,182],[28,375],[39,640]],
     [[-8,90],[65,192],[-32,303],[58,477],[-2,625]]
   ];
   // Two stems intertwine with the real golden rim for most of its height.
   ctx.strokeStyle='#d3ad7a';ctx.lineWidth=2.8;
   for(const stem of stems){
    ctx.beginPath();ctx.moveTo(stem[0][0],stem[0][1]);
    ctx.bezierCurveTo(stem[1][0],stem[1][1],stem[2][0],stem[2][1],
      stem[3][0],stem[3][1]);
    ctx.quadraticCurveTo(stem[4][0],stem[4][1]-40,stem[4][0],stem[4][1]);
    ctx.stroke();
   }
   // Twenty alternating metallic leaves, tapered with actual golden veins.
   for(let j=0;j<20;j++){
    const y=j*31-20,phase=j*.92;
    const x=12+15*Math.sin(phase),direction=j%2?1:-1;
    ctx.save();ctx.translate(x,y);ctx.scale(direction,1);
    ctx.rotate(.05+Math.sin(phase)*.16);
    ctx.beginPath();ctx.moveTo(0,0);
    ctx.bezierCurveTo(13,-21,42,-43,71,-53);
    ctx.bezierCurveTo(55,-12,24,9,0,0);
    ctx.closePath();ctx.fillStyle=j%4===0?'rgba(102,129,86,.83)':'rgba(106,118,76,.82)';
    ctx.fill();ctx.strokeStyle='#e4b77b';ctx.lineWidth=1.75;ctx.stroke();
    ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(38,-24,71,-53);
    ctx.strokeStyle='rgba(246,203,139,.67)';ctx.lineWidth=.8;ctx.stroke();
    ctx.restore();
   }
   if(flower){
    for(const [x,y,r] of [[36,89,27],[11,226,35],[40,397,28],[14,554,31]]){
     bloom(x,y,r);
    }
   }
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
  // A REAL family-specific border, not loose emoji-like stickers.
  // Each family changes the continuous gold perimeter via line rhythm,
  // edge geometry and material. Five variants modulate placement/density.
  function familyTrim(){
   const ink=k==='herbivore'||k==='woodland'?'#cfbe86':
     k==='aquatic'||k==='soft-predator'?'#c5c9b4':
     k==='reptile'?'#cda875':'#e7bd86';
   const shift=(v-2)*32,period=142+(v%3)*23;
   const orientation=v%2?-1:1;
   const families={
    predator:'spikes','soft-predator':'ripples',aquatic:'waves',
    herbivore:'vines',omnivore:'branches',avian:'feathers',
    reptile:'scales',woodland:'sprigs',nocturnal:'moons',celestial:'stars',spider:'silk'
   };
   const motif=families[k]||'stars';
   ctx.save();ctx.strokeStyle=ink;ctx.fillStyle=ink;
   ctx.lineWidth=1.8;ctx.globalAlpha=.8;
   for(const side of [-1,1]){
    const border=side<0?52:1148,sgn=side<0?1:-1;
    for(let i=0;i<7;i++){
     const y=300+i*period+shift+(side*orientation*16);
     if(y<235||y>1765)continue;
     // Each motif is rooted into the actual frame at border x.
     ctx.beginPath();ctx.moveTo(border,y-35);
     ctx.quadraticCurveTo(border+sgn*8,y,border,y+35);
     ctx.stroke();
     if(motif==='silk'){
      // Web silk belongs in the corners, not on the middle rails.
      continue;
     }else if(motif==='vines'||motif==='branches'||motif==='sprigs'){
      ctx.beginPath();ctx.moveTo(border,y);
      ctx.quadraticCurveTo(border+sgn*17,y-19,border+sgn*36,y-35);
      ctx.quadraticCurveTo(border+sgn*30,y-5,border,y);
      ctx.stroke();
      if(motif==='vines'){
       ctx.beginPath();ctx.ellipse(border+sgn*18,y-19,3.5,5,.3,0,PI*2);
       ctx.fill();
      }
     }else if(motif==='feathers'){
      ctx.beginPath();ctx.moveTo(border,y+20);
      ctx.quadraticCurveTo(border+sgn*30,y-12,border+sgn*24,y-42);
      ctx.quadraticCurveTo(border+sgn*56,y-12,border,y+20);ctx.stroke();
      ctx.beginPath();ctx.moveTo(border,y+20);
      ctx.lineTo(border+sgn*24,y-42);ctx.stroke();
     }else if(motif==='scales'){
      for(let j=0;j<3;j++){
       ctx.beginPath();ctx.arc(border+sgn*(9+j*13),y-10+j*15,13,-1.2,1.2);
       ctx.stroke();
      }
     }else if(motif==='waves'||motif==='ripples'){
      for(let n=0;n<2;n++){
       ctx.beginPath();
       ctx.ellipse(border+sgn*(8+n*12),y,14+n*9,24+n*9,0,-1.2,1.15);
       ctx.stroke();
      }
     }else if(motif==='moons'){
      ctx.beginPath();ctx.arc(border+sgn*15,y,14,-1.1,1.1);ctx.stroke();
     }else if(motif==='spikes'){
      ctx.beginPath();ctx.moveTo(border,y-18);
      ctx.lineTo(border+sgn*28,y+5);
      ctx.lineTo(border,y+25);ctx.stroke();
     }else{
      ctx.beginPath();ctx.moveTo(border-8,y);ctx.lineTo(border+8,y);
      ctx.moveTo(border,y-12);ctx.lineTo(border,y+12);ctx.stroke();
     }
    }
   }
   // Family-specific Art-Nouveau corner engraving grows OUT of the frame:
   // feathers/overlapping scales/water crests/branches replace stick-on icons.
   for(const [x,y,dx,dy] of [[62,64,1,1],[1138,64,-1,1],
     [62,1936,1,-1],[1138,1936,-1,-1]]){
    ctx.save();ctx.translate(x,y);ctx.scale(dx,dy);
    ctx.lineWidth=motif==='spikes'?2.8:2.25;
    ctx.beginPath();ctx.moveTo(0,158+v*4);
    ctx.bezierCurveTo(14,62,83,12,163+v*5,0);ctx.stroke();
    if(motif==='silk'){
     // The structural web below handles these corners.
    }else if(motif==='spikes'){
     for(let n=0;n<3;n++){
      const t=39+n*37;
      ctx.beginPath();ctx.moveTo(0,t+25);
      ctx.lineTo(23+n*12,t-7);ctx.lineTo(15+n*12,t+23);ctx.stroke();
     }
    }else if(motif==='ripples'||motif==='waves'){
     for(let n=0;n<3;n++){
      const radius=23+n*17;
      ctx.beginPath();ctx.arc(6,6,radius,.06,1.45);ctx.stroke();
     }
     if(motif==='ripples'){
      // Tiny reed veins are attached to the same corner, never a palm icon.
      for(let n=0;n<3;n++){
       ctx.beginPath();ctx.moveTo(10,118-n*12);
       ctx.quadraticCurveTo(38+n*7,99-n*11,41+n*11,70-n*14);
       ctx.stroke();
      }
     }
    }else if(motif==='vines'||motif==='branches'||motif==='sprigs'){
     for(let n=0;n<4;n++){
      const t=28+n*32;
      ctx.beginPath();ctx.moveTo(6,t+6);
      ctx.quadraticCurveTo(17+n*3,t-18,44+n*7,t-20);
      ctx.quadraticCurveTo(43+n*5,t+1,6,t+6);ctx.stroke();
     }
    }else if(motif==='feathers'){
     for(let n=0;n<4;n++){
      const t=35+n*34;
      ctx.beginPath();ctx.moveTo(8,t+8);
      ctx.quadraticCurveTo(43,t-18,71+n*5,t-35);
      ctx.quadraticCurveTo(48,t-5,8,t+8);ctx.stroke();
     }
    }else if(motif==='scales'){
     for(let n=0;n<4;n++){
      ctx.beginPath();ctx.arc(15+n*21,12+n*24,27,.08,Math.PI*.82);ctx.stroke();
     }
    }else if(motif==='moons'){
     for(let n=0;n<3;n++){
      ctx.beginPath();ctx.arc(16+n*13,19+n*25,13,-.85,1.2);ctx.stroke();
     }
    }else{
     for(let n=0;n<3;n++){
      const t=30+n*38;
      ctx.beginPath();ctx.moveTo(0,t);ctx.lineTo(25,t);
      ctx.moveTo(13,t-13);ctx.lineTo(13,t+13);ctx.stroke();
     }
    }
    ctx.restore();
   }
   ctx.restore();
  }
  // Five spider layouts have genuinely different asymmetric silk geometry.
  // Predators: five clearly distinct sets of actual edge damage.
  // Mode 2 is ALL bites. Mode 3 is ALL claws.
  const hunters=[
   ()=>{claw('left',470,1.05,.03);bite('right',230,143,5);bite('right',1490,125,4);},
   ()=>{bite('right',370,155,8);bite('left',1180,127,5);bite('bottom',950,125,2);},
   ()=>{claw('left',385,1.12,-.08);claw('right',1140,.9,.12);},
   ()=>{claw('left',180,1,.08);bite('bottom',930,143,9);},
   ()=>{claw('right',430,1.08,-.1);bite('top',1025,129,4);bite('left',1630,120,4);}
  ];



  // Frogs leave splayed WEBBED TOE marks. No solid bite-like black ovals.
  // The central transparent traces are small; antique-gold edges remain.


  function webbedFoot(side,y,size=1,tilt=0){
   // Large splayed amphibian toes WITH webbing, attached to foil edge.
   // Only fine contours are made transparent, not big bite-like holes.
   const left=side==='left',edge=left?51:1149,sign=left?1:-1;
   const place=fn=>{ctx.save();ctx.translate(edge,y);ctx.rotate(tilt);
    ctx.scale(sign*size,size);fn();ctx.restore();};
   function footprint(){
    ctx.beginPath();ctx.moveTo(-30,18);
    ctx.bezierCurveTo(-4,20,24,26,39,35);
    ctx.bezierCurveTo(66,48,91,31,89,10);
    ctx.moveTo(16,24);ctx.quadraticCurveTo(42,-11,60,-37);
    ctx.moveTo(28,27);ctx.quadraticCurveTo(67,-13,83,-49);
    ctx.moveTo(43,28);ctx.quadraticCurveTo(91,-3,115,-26);
    ctx.moveTo(55,37);ctx.quadraticCurveTo(102,29,123,19);
    ctx.moveTo(53,-22);ctx.quadraticCurveTo(62,-15,72,-25);
    ctx.moveTo(70,-26);ctx.quadraticCurveTo(86,-5,99,-13);
    ctx.moveTo(97,5);ctx.quadraticCurveTo(107,20,115,15);
    for(const [x,y0,rx,ry] of [
     [60,-37,4,5],[83,-49,4,5],[115,-26,5,4],[123,19,5,4]
    ]){ctx.moveTo(x+rx,y0);ctx.ellipse(x,y0,rx,ry,0,0,2*PI);}
   }
   place(()=>{
    ctx.save();ctx.strokeStyle='#ebc892';ctx.lineCap='round';
    ctx.lineJoin='round';ctx.lineWidth=9;
    ctx.shadowColor='#ffcf97';ctx.shadowBlur=8;footprint();ctx.stroke();
    ctx.restore();
   });
   shapes.push(()=>place(()=>{
    ctx.lineWidth=4.2;ctx.lineCap='round';ctx.lineJoin='round';
    footprint();ctx.stroke();
   }));
  }
  function waterDrop(side,y,size=1){
   // Dew traces are tangent to the page rim: the gold never looks glued on.
   const edge=side==='left'?51:1149,sign=side==='left'?1:-1;
   function droplet(){
    ctx.beginPath();ctx.moveTo(-11,-23);
    ctx.bezierCurveTo(4,-12,30,4,25,16);
    ctx.bezierCurveTo(16,34,-8,20,-11,9);ctx.closePath();
   }
   const placed=fn=>{ctx.save();ctx.translate(edge,y);
    ctx.scale(sign*size,size);fn();ctx.restore();};
   placed(()=>{
    ctx.save();ctx.strokeStyle='#e8c598';ctx.lineWidth=9;
    ctx.shadowColor='#dfae7a';ctx.shadowBlur=4;droplet();ctx.stroke();
    ctx.restore();
   });
   shapes.push(()=>placed(()=>{
    ctx.lineWidth=5;ctx.lineJoin='round';droplet();ctx.stroke();
   }));
  }
  function waterSplash(side,y,size=1){
   waterDrop(side,y,size);waterDrop(side,y+62,size*.63);
   waterDrop(side,y+122,size*.46);ripple(side,y+66);
  }


  // Wetland ornament: lily-pad outline and moonlit concentric water rings
  // woven into the rim. This reads as AMPHIBIAN instead of a tiny hand icon.
  function marshEdge(side,y,scale=1){
   const left=side==='left',edge=left?53:1147,dir=left?1:-1;
   ctx.save();ctx.translate(edge,y);ctx.scale(dir*scale,scale);
   ctx.strokeStyle='#b9c5aa';ctx.lineWidth=2.3;ctx.globalAlpha=.9;
   for(let n=0;n<4;n++){
    ctx.beginPath();ctx.ellipse(44+n*14,0,45+n*24,63+n*18,.14,-1.25,1.22);
    ctx.stroke();
   }
   // Two naturally asymmetric floating leaves and their central veins.
   for(const [x,dy,r] of [[47,-75,25],[90,108,21]]){
    ctx.beginPath();ctx.moveTo(x-r,dy);
    ctx.bezierCurveTo(x-r*.6,dy-r,x+r*.7,dy-r*.55,x+r,dy);
    ctx.bezierCurveTo(x+r*.4,dy+r*.65,x-r*.55,dy+r*.4,x-r,dy);
    ctx.fillStyle='rgba(90,119,91,.38)';
    ctx.fill();ctx.strokeStyle='#dbc99a';ctx.lineWidth=1.9;ctx.stroke();
    ctx.beginPath();ctx.moveTo(x-r,dy);ctx.lineTo(x+r*.8,dy-2);
    ctx.strokeStyle='#b1c49b';ctx.lineWidth=.9;ctx.stroke();
   }
   ctx.restore();
  }
  function tideEdge(side,y,scale=1){
   const edge=side==='left'?53:1147,dir=side==='left'?1:-1;
   ctx.save();ctx.translate(edge,y);ctx.scale(dir*scale,scale);
   for(let n=0;n<5;n++){
    const reach=112+n*17,dy=n*16;
    ctx.beginPath();ctx.moveTo(-8,-98+dy);
    ctx.bezierCurveTo(18,-148+dy,reach*.76,-125+dy,reach,-46+dy);
    ctx.bezierCurveTo(reach+18,26+dy,35,65+dy,2,128+dy);
    ctx.strokeStyle=n%2?'rgba(181,207,198,.64)':'rgba(218,196,164,.76)';
    ctx.lineWidth=n%2?1.8:2.5;ctx.stroke();
   }
   // Fine spray lies on the same wavefront; not arbitrary buttons.
   ctx.fillStyle='rgba(228,210,178,.77)';
   for(const [x,dy,r] of [[114,-109,2],[141,-75,2.5],[171,-19,1.7],
      [122,59,2.4],[78,122,1.8]]){
    ctx.beginPath();ctx.arc(x,dy,r,0,2*PI);ctx.fill();
   }
   ctx.restore();
  }
  function astralEdge(side,y,scale=1){
   const edge=side==='left'?53:1147,dir=side==='left'?1:-1;
   ctx.save();ctx.translate(edge,y);ctx.scale(dir*scale,scale);
   for(let n=0;n<5;n++){
    const x=28+n*13,shift=n*18;
    ctx.beginPath();ctx.moveTo(-6,-122+shift);
    ctx.bezierCurveTo(x+52,-113+shift,x+106,-25+shift,
      x+25,104+shift);
    ctx.strokeStyle=n%2?'rgba(215,169,182,.72)':'rgba(231,194,137,.84)';
    ctx.lineWidth=n%2?2.3:3.0;ctx.stroke();
   }
   for(const [x,dy,r] of [[91,-93,6],[131,-8,8],[95,118,5]]){
    ctx.beginPath();ctx.moveTo(x-r,dy);ctx.lineTo(x+r,dy);
    ctx.moveTo(x,dy-r*1.7);ctx.lineTo(x,dy+r*1.7);
    ctx.strokeStyle='#f0c98e';ctx.lineWidth=1.8;ctx.stroke();
   }
   // Crescent night-arc and little constellation points attached to a rail.
   ctx.beginPath();ctx.arc(72,0,46,-1.15,1.1);
   ctx.strokeStyle='rgba(244,213,166,.78)';ctx.lineWidth=3.2;ctx.stroke();
   ctx.beginPath();ctx.arc(86,-3,44,-1.15,1.1);
   ctx.strokeStyle='rgba(214,170,190,.55)';ctx.lineWidth=1.7;ctx.stroke();
   for(const [x,z] of [[112,-102],[157,54],[99,133]]){
    ctx.beginPath();ctx.arc(x,z,1.6,0,2*PI);
    ctx.fillStyle='#f7d99d';ctx.fill();
   }
   ctx.restore();
  }
  const gentle=[
   ()=>{marshEdge('left',460,1.24);marshEdge('right',1170,1.06);
     webbedFoot('left',460,1.87,-.09);webbedFoot('right',1160,1.68,.08);
     webbedFoot('left',1510,1.31,.16);waterDrop('right',1420,.86);},
   ()=>{marshEdge('right',440,1.25);marshEdge('left',1110,1.08);
     webbedFoot('right',445,1.9,.06);webbedFoot('left',1090,1.72,-.12);
     webbedFoot('right',1510,1.28,-.09);waterDrop('left',1320,.9);},
   ()=>{marshEdge('left',490,1.21);marshEdge('right',1090,1.11);
     webbedFoot('left',510,1.84,.11);webbedFoot('right',1040,1.7,-.09);
     webbedFoot('left',1620,1.32,-.1);waterDrop('right',1450,.86);},
   ()=>{marshEdge('right',530,1.19);marshEdge('left',1210,1.13);
     webbedFoot('right',520,1.86,-.13);webbedFoot('left',1200,1.7,.08);
     webbedFoot('right',1500,1.32,.07);waterDrop('left',910,.85);},
   ()=>{marshEdge('left',410,1.25);marshEdge('right',1210,1.12);
     webbedFoot('left',420,1.87,.06);webbedFoot('right',1200,1.72,.12);
     webbedFoot('left',1500,1.32,-.12);waterDrop('right',690,.91);}
  ];
  const aquatic=[
   ()=>{tideEdge('left',490,1.08);tideEdge('right',1400,.92);
     waterSplash('left',510,.82);waterDrop('right',1460,.89);},
   ()=>{tideEdge('right',460,1.12);tideEdge('left',1270,1);
     waterDrop('right',520,.87);waterSplash('left',1310,.81);},
   ()=>{tideEdge('right',490,1.05);tideEdge('left',1390,.95);
     waterSplash('right',520,.83);waterDrop('left',1440,.85);},
   ()=>{tideEdge('left',560,1.1);tideEdge('right',1090,1);
     waterDrop('left',590,.84);waterSplash('right',1130,.87);},
   ()=>{tideEdge('left',550,1.07);tideEdge('right',1500,1);
     waterSplash('left',580,.8);waterDrop('right',1540,.86);}
  ];
  // Feather, scales and nocturnal ornaments never mimic violent bites.

  function feather(side,y,size){
   const edge=side==='left'?52:1148,sign=side==='left'?1:-1;
   ctx.save();ctx.translate(edge,y);ctx.scale(sign*size,size);
   ctx.strokeStyle='#e5c390';ctx.lineWidth=2.5;
   ctx.beginPath();ctx.moveTo(0,95);
   ctx.bezierCurveTo(32,32,40,-41,0,-95);
   ctx.bezierCurveTo(70,-39,60,32,0,95);ctx.stroke();
   ctx.beginPath();ctx.moveTo(0,95);ctx.lineTo(0,-95);ctx.stroke();
   for(let n=0;n<5;n++){
    const h=65-n*32;
    ctx.beginPath();ctx.moveTo(0,h);
    ctx.lineTo(33,h-19);ctx.stroke();
   }ctx.restore();
  }

  function scales(side,y,size){
   // Overlapping serpentine scales grow from the engraved rail and
   // occupy a legible 160px-wide margin, not six tiny isolated parentheses.
   const edge=side==='left'?52:1148,sgn=side==='left'?1:-1;
   ctx.save();ctx.translate(edge,y);ctx.scale(sgn*size,size);
   ctx.strokeStyle='#dfbc89';ctx.lineWidth=2.25;
   ctx.beginPath();ctx.moveTo(0,-35);
   ctx.bezierCurveTo(35,72,68,170,0,300);ctx.stroke();
   for(let row=0;row<8;row++){
    const offset=row%2?13:0,yy=row*41;
    for(let col=0;col<4;col++){
     const xx=17+col*29+offset;
     ctx.beginPath();ctx.moveTo(xx-14,yy);
     ctx.quadraticCurveTo(xx,yy-25,xx+15,yy);
     ctx.quadraticCurveTo(xx+7,yy+20,xx,yy+23);
     ctx.strokeStyle=col===0?'rgba(242,207,155,.86)':'rgba(196,159,115,.64)';
     ctx.lineWidth=col===0?2.25:1.55;ctx.stroke();
    }
   }
   // Broad S-shaped spine with occasional gilded pores.
   ctx.strokeStyle='rgba(244,212,165,.55)';ctx.lineWidth=1.1;
   ctx.beginPath();ctx.moveTo(18,-32);
   ctx.bezierCurveTo(154,100,18,201,128,324);ctx.stroke();
   ctx.restore();
  }
  function moon(side,y){
   const edge=side==='left'?52:1148,sign=side==='left'?1:-1;
   ctx.save();ctx.translate(edge,y);ctx.scale(sign,1);
   ctx.strokeStyle='#d8b98c';ctx.lineWidth=2;
   for(let i=0;i<3;i++){
    ctx.beginPath();ctx.arc(3,y-y+i*47,13,-1.2,1.2);ctx.stroke();
   }ctx.restore();
  }
  const avian=[
   ()=>{feather('left',500,1.15);feather('right',1270,1.08);},
   ()=>{feather('right',510,1.17);feather('left',1390,1.06);},
   ()=>{feather('left',910,1.22);feather('right',1200,1.08);},
   ()=>{feather('right',740,1.18);feather('left',1190,1.09);},
   ()=>{feather('left',600,1.07);feather('right',1450,1.23);}
  ];
  const reptile=[
   ()=>{scales('left',310,1.4);scales('right',1190,1.26);},
   ()=>{scales('right',400,1.35);scales('left',1270,1.23);},
   ()=>{scales('left',650,1.43);scales('right',1130,1.29);},
   ()=>{scales('right',640,1.36);scales('left',1410,1.31);},
   ()=>{scales('left',470,1.31);scales('right',1180,1.41);}
  ];
  const woodland=[
   ()=>{botanical('left',340,.96,false);botanical('right',1120,.82,false);},
   ()=>{botanical('right',440,.98,false);botanical('left',1240,.82,false);cornerStem(true,false);},
   ()=>{cornerStem(false,true);botanical('left',1110,.92,false);},
   ()=>{botanical('left',900,1.03,false);cornerStem(false,false);},
   ()=>{cornerStem(true,true);botanical('right',1080,.93,false);}
  ];

  const nocturnal=[
   ()=>{astralEdge('left',490,1.05);astralEdge('right',1230,.91);},
   ()=>{astralEdge('right',520,1.03);astralEdge('left',1470,.85);},
   ()=>{astralEdge('left',870,1.12);astralEdge('right',1040,.91);},
   ()=>{astralEdge('right',710,1.05);astralEdge('left',1350,.93);},
   ()=>{astralEdge('left',610,1.1);astralEdge('right',1490,.94);}
  ];
  const celestial=[
   ()=>{astralEdge('left',540,.94);astralEdge('right',1350,.81);},
   ()=>{astralEdge('right',750,1.06);astralEdge('left',1480,.79);},
   ()=>{astralEdge('left',1130,1.0);astralEdge('right',470,.91);},
   ()=>{astralEdge('right',1350,1.07);astralEdge('left',420,.86);},
   ()=>{astralEdge('left',900,1.08);astralEdge('right',1290,.92);}
  ];

  // Full-height botanicals from the supplied reference, not one short twig.
  // Each garland joins the existing gold frame through interwoven stems.
  function vineWall(side,phase=0,flower=true){
   const positions=[210,735,1260];
   for(let i=0;i<positions.length;i++){
    const y=positions[i]+(phase%3-1)*33+(i%2)*19;
    const size=.84+(i===1?.04:0)+(phase%2?.025:0);
    // Moderate blossoms: dense leaves but no oversized stickers.
    botanical(side,y,size,flower&&(i+phase)%2===0);
   }
  }
  const florals=[
   ()=>{vineWall('left',0,true);vineWall('right',2,true);cornerStem(true,true);},
   ()=>{vineWall('left',1,true);vineWall('right',3,true);cornerStem(false,false);},
   ()=>{vineWall('left',2,true);vineWall('right',4,true);cornerStem(true,false);},
   ()=>{vineWall('left',3,true);vineWall('right',0,true);cornerStem(false,true);},
   ()=>{vineWall('left',4,true);vineWall('right',1,true);cornerStem(true,true);}
  ];
  const hybrids=[
   ()=>{vineWall('left',0,true);claw('right',370,.95,.06);bite('right',1520,106,3);},
   ()=>{vineWall('right',1,true);claw('left',485,.96,-.07);bite('left',1390,109,3);},
   ()=>{vineWall('left',2,true);bite('right',515,117,4);claw('right',1350,.77,.03);},
   ()=>{vineWall('right',3,true);claw('left',385,.88,.08);claw('left',1250,.65,-.04);},
   ()=>{vineWall('left',4,true);bite('right',320,118,4);claw('right',1270,.89,.03);}
  ];
  // Realistic orb-weaver-style silk architecture. Off-center hubs, independent
  // structural supports, radial threads, irregular capture spiral, and a few
  // incomplete segments; never a cartoon concentric cobweb icon.

  function spiderWeb(left,top,variant,scale=1){
   // A partial, irregular orb-weaver net confined to the antique corner.
   // Real radial support silk + gently sagging non-concentric capture threads.
   const x0=left?58:1142,y0=top?69:1931;
   let seed=(variant*16721+(left?827:1019)+(top?7:59))>>>0;
   const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;
    return seed/4294967296;};
   ctx.save();ctx.translate(x0,y0);
   ctx.scale(left?scale:-scale,top?scale:-scale);
   ctx.beginPath();ctx.rect(-4,-4,255,262);ctx.clip();
   const hubX=7+variant*2,hubY=8+variant,numRays=15+variant;
   const lengths=Array.from({length:numRays},()=>214+(rnd()-.5)*23);
   const angles=Array.from({length:numRays},(_,i)=>
     .04+(Math.PI/2-.08)*i/(numRays-1)+(rnd()-.5)*.022);
   ctx.lineCap='round';ctx.lineJoin='round';
   // Load-bearing radials terminate on/near the physical card frame.
   for(let i=0;i<numRays;i++){
    const a=angles[i],length=lengths[i];
    ctx.beginPath();ctx.moveTo(hubX,hubY);
    ctx.lineTo(hubX+Math.cos(a)*length,hubY+Math.sin(a)*length);
    ctx.strokeStyle='rgba(218,200,173,.47)';
    ctx.lineWidth=i%5===0?1.3:.7;ctx.stroke();
   }
   // Imperfect sticky threads, suspended from the radii.
   for(let layer=2;layer<=15;layer++){
    const fraction=layer/17;
    ctx.strokeStyle=layer%3===0?
       'rgba(244,220,186,.58)':'rgba(224,204,183,.4)';
    ctx.lineWidth=layer%3===0?.9:.62;
    for(let i=0;i<numRays-1;i++){
     if((layer*19+i*7+variant)%59===0)continue;
     const a=angles[i],b=angles[i+1];
     const l1=lengths[i]*fraction,l2=lengths[i+1]*fraction;
     const ax=hubX+Math.cos(a)*l1,ay=hubY+Math.sin(a)*l1;
     const bx=hubX+Math.cos(b)*l2,by=hubY+Math.sin(b)*l2;
     const sag=(3+7*fraction)*(1+.25*Math.sin(i*1.8+layer));
     ctx.beginPath();ctx.moveTo(ax,ay);
     ctx.quadraticCurveTo((ax+bx)/2+sag,(ay+by)/2+sag,bx,by);ctx.stroke();
    }
   }
   ctx.globalAlpha=.55;
   for(let i=0;i<10;i++){
    const a=angles[(i*7)%numRays],t=.16+i*.055;
    const r=lengths[(i*7)%numRays]*t;
    const x=hubX+Math.cos(a)*r,y=hubY+Math.sin(a)*r;
    ctx.beginPath();ctx.arc(x,y,.8+i%3*.25,0,2*PI);
    ctx.fillStyle='#ffe0ad';ctx.fill();
   }
   ctx.restore();
  }
  const silk=[
    ()=>{spiderWeb(true,true,0,1);spiderWeb(false,false,2,.79);},
    ()=>{spiderWeb(false,true,1,1.08);spiderWeb(true,false,3,.76);},
    ()=>{spiderWeb(true,false,2,1.08);spiderWeb(false,true,4,.82);},
    ()=>{spiderWeb(false,false,3,1.08);spiderWeb(true,true,1,.79);},
    ()=>{spiderWeb(true,true,4,.86);spiderWeb(false,true,0,.91);spiderWeb(false,false,2,.7);}
  ];

  // Ivy sewn THROUGH the old magical parchment: a few small transparent
  // eyelets, and a gilded stem weaving alternately under and over the rim.
  // This is intentionally not a thorn / claw design.
  function vineStitches(side,variant=0){
   const edge=side==='left'?52:1148,sgn=side==='left'?1:-1;
   ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
   for(let i=0;i<9;i++){
    const y=290+i*165+(variant*17+i*11)%29;
    const inner=edge+sgn*(i%2?91:22),next=edge+sgn*(i%2?22:93);
    ctx.beginPath();ctx.moveTo(edge-sgn*7,y-25);
    ctx.bezierCurveTo(inner,y-10,next,y+15,edge+sgn*3,y+28);
    ctx.strokeStyle='rgba(27,18,30,.7)';ctx.lineWidth=10;ctx.stroke();
    ctx.strokeStyle='#eec58d';ctx.lineWidth=6;
    ctx.shadowColor='#ddb37b';ctx.shadowBlur=6;ctx.stroke();
    ctx.shadowBlur=0;ctx.strokeStyle='#78885c';ctx.lineWidth=3;ctx.stroke();
    if((i+variant)%3===0){
     ctx.beginPath();ctx.moveTo(inner,y-5);
     ctx.quadraticCurveTo(inner+sgn*25,y-23,inner+sgn*37,y-39);
     ctx.quadraticCurveTo(inner+sgn*5,y-35,inner,y-5);
     ctx.fillStyle='rgba(111,134,86,.9)';
     ctx.strokeStyle='#dabb86';ctx.lineWidth=1.5;ctx.fill();ctx.stroke();
    }
    for(const offset of [-25,29]){
     const py=y+offset;
     ctx.beginPath();ctx.ellipse(edge,py,8,6,.3,0,2*Math.PI);
     ctx.strokeStyle='#f4d39d';ctx.lineWidth=3;ctx.shadowBlur=3;ctx.stroke();
     shapes.push(()=>{
      ctx.beginPath();ctx.ellipse(edge,py,5.5,4,0,0,2*Math.PI);ctx.fill();
     });
    }
   }
   ctx.restore();
  }
  // Soft contextual accents without inventing biological classifications.
  if(k==='avian'&&row?.[4]==='Strigiformes')
   moon(v%2?'left':'right',760+v*95);
  if(k==='reptile'&&row?.[4]==='Crocodylia')
   ripple(v%2?'left':'right',1030+v*65);
  familyTrim();
  if(k==='spider')silk[v]();
  else if(k==='predator')hunters[v]();
  else if(k==='soft-predator')gentle[v]();
  else if(k==='aquatic')aquatic[v]();
  else if(k==='avian')avian[v]();
  else if(k==='reptile')reptile[v]();
  else if(k==='woodland')woodland[v]();
  else if(k==='nocturnal')nocturnal[v]();
  else if(k==='celestial')celestial[v]();
  else if(k==='herbivore'){florals[v]();vineStitches('left',v);vineStitches('right',(v+2)%5);}
  else if(k==='omnivore'){hybrids[v]();vineStitches(v%2?'right':'left',v);}
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
   // Only the first Greek given name is displayed; the full name is scored.
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
   const nameY=category?1445:1438;
   const titleSpacing=nameLines.length>1?48:51;
   for(const [i,line] of nameLines.entries())ctx.fillText(line,600,nameY+i*titleSpacing);
   ctx.fillStyle='#D5CAD6';centered(ctx,row[1],1555,1020,'italic 29px Georgia,serif',1);

   // Verified independent ecological labels, without cramped little tables.
   const ecology=[
    styl.diet!=='unknown'?styl.dietText:null,
    styl.habitat!=='unknown'?styl.habitatText:null
   ].filter(Boolean);
   if(ecology.length){
    ctx.fillStyle='#D7BE91';
    const lifeText=ecology.join('  ✧  ');
    ctx.font='26px Georgia,serif';
    if(ctx.measureText(lifeText).width<=950){
     centered(ctx,lifeText,1634,950,'26px Georgia,serif',1);
    }else{
     // Preserve all words when the ecological descriptor is unusually long.
     ctx.font='21px Georgia,serif';
     const sections=textLines(ctx,lifeText,950,2);
     for(const [i,line] of sections.entries())ctx.fillText(line,600,1627+i*34);
    }
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
