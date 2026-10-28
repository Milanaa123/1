#!/usr/bin/env python3
"""Visual audit: render the exact on-site SVG files 81..100, preserving special snake 87."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import hashlib,io,json
import cairosvg

ROOT=Path(__file__).resolve().parents[1]
review=json.loads((ROOT/'art/reviews/visual-batch05-81-100.json').read_text(encoding='utf8'))
m10=json.loads((ROOT/'art/vector-ink/manifest-batch10.json').read_text(encoding='utf8'))
m11=json.loads((ROOT/'art/vector-ink/manifest-batch11.json').read_text(encoding='utf8'))
lookup={e['index']:e for m in (m10,m11) for e in m['items']}
assert len(review['items'])==20
assert m11['preservedHandDrawn']=={'index':87,'file':'art/animagia-grass-snake-87.svg'}
width,height,cols,rows=390,330,4,5
canvas=Image.new('RGB',(cols*width,rows*height+70),'#15121c')
draw=ImageDraw.Draw(canvas)
font_name='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
try:
 font=ImageFont.truetype(font_name,19)
 heading=ImageFont.truetype(font_name,24)
except OSError:
 font=heading=ImageFont.load_default()
draw.text((24,19),'Анимагия · проверка рисунков №81–100',font=heading,fill='#f0c992')
colors={'reject':'#eb826e','needs_further_comparison':'#ddb677','provisional':'#c5b7a5'}
labels={'reject':'ПЕРЕРИСОВАТЬ','needs_further_comparison':'СРАВНИТЬ','provisional':'НЕ ПОДТВЕРЖДЁН'}

for k,entry in enumerate(review['items']):
 n=entry['index']
 if n==87:
  file=ROOT/'art/animagia-grass-snake-87.svg'
  svg=file.read_bytes()
  assert hashlib.sha256(svg).hexdigest()==review['sourceException']['verifiedHash']
 else:
  vector=lookup[n]
  file=ROOT/'art/vector-ink'/vector['file']
  svg=file.read_bytes()
  assert len(svg)==vector['bytes']
  assert hashlib.sha256(svg).hexdigest()==vector['sha256']
 assert b'<image' not in svg and b'<path' in svg
 raster=Image.open(io.BytesIO(cairosvg.svg2png(bytestring=svg,output_width=640,output_height=440))).convert('RGBA')
 assert raster.size==(640,440)
 assert all(raster.getpixel(p)[3]==0 for p in ((0,0),(639,0),(0,439),(639,439)))
 thumb=raster.resize((360,248),Image.Resampling.LANCZOS)
 x=(k%cols)*width+15
 y=(k//cols)*height+70
 canvas.paste(thumb,(x,y),thumb)
 draw.text((x+4,y+258),'№'+str(n)+' · '+entry['name'],font=font,fill='#eed2a1')
 draw.text((x+4,y+286),labels[entry['status']],font=font,fill=colors[entry['status']])
out=ROOT/'qa-artifacts'
out.mkdir(exist_ok=True,parents=True)
file=out/'animal-audit-81-100.png'
canvas.save(file,optimize=True)
assert file.stat().st_size>80000
print('ANIMAL_ART_81_100_LIVE_SVG_GALLERY_READY',file.stat().st_size,flush=True)
