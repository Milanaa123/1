#!/usr/bin/env python3
"""Render live-routed vector art 61-80 in a labeled evidence gallery.

Uses exact committed SVG bytes; does NOT re-approve any anatomy.
"""
from __future__ import annotations
import hashlib,io,json
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import cairosvg

ROOT=Path(__file__).resolve().parents[1]
review=json.loads((ROOT/'art/reviews/visual-batch04-61-80.json').read_text(encoding='utf8'))
v1=json.loads((ROOT/'art/vector-ink/manifest-batch09.json').read_text())
v2=json.loads((ROOT/'art/vector-ink/manifest-batch10.json').read_text())
lookup={e['index']:e for m in [v1,v2] for e in m['items']}
out=ROOT/'qa-artifacts'
out.mkdir(parents=True,exist_ok=True)
width,height,cols,rows=390,330,4,5
canvas=Image.new('RGB',(cols*width,rows*height+70),'#15121c')
draw=ImageDraw.Draw(canvas)
fp='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
try:
 font=ImageFont.truetype(fp,19)
 heading=ImageFont.truetype(fp,24)
except OSError:
 font=heading=ImageFont.load_default()
draw.text((24,19),'Анимагия · проверка рисунков №61–80',font=heading,fill='#f0c992')
colors={'reject':'#eb826e','needs_further_comparison':'#ddb677','provisional':'#c5b7a5'}
labels={'reject':'ПЕРЕРИСОВАТЬ','needs_further_comparison':'СРАВНИТЬ','provisional':'НЕ ПОДТВЕРЖДЁН'}
for k,entry in enumerate(review['items']):
 n=entry['index']
 vector=lookup[n]
 src=ROOT/'art'/'vector-ink'/vector['file']
 data=src.read_bytes()
 assert hashlib.sha256(data).hexdigest()==vector['sha256']
 assert len(data)==vector['bytes'] and b'<image' not in data
 png=cairosvg.svg2png(bytestring=data,output_width=640,output_height=440)
 art=Image.open(io.BytesIO(png)).convert('RGBA')
 assert art.size==(640,440)
 assert all(art.getpixel(p)[3]==0 for p in [(0,0),(639,0),(0,439),(639,439)])
 thumb=art.resize((360,248),Image.Resampling.LANCZOS)
 x=(k%cols)*width+15;y=(k//cols)*height+70
 canvas.paste(thumb,(x,y),thumb)
 draw.text((x+4,y+258),'№'+str(n)+' · '+entry['name'],font=font,fill='#eed2a1')
 draw.text((x+4,y+286),labels[entry['status']],font=font,fill=colors[entry['status']])
file=out/'animal-audit-61-80.png'
canvas.save(file,optimize=True)
assert file.stat().st_size>80000
print('ANIMAL_ART_21_40_SITE_VECTOR_GALLERY_READY',file.stat().st_size,flush=True)
