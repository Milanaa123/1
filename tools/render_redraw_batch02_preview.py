#!/usr/bin/env python3
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import hashlib,io,json,cairosvg
R=Path(__file__).resolve().parents[1]
m=json.loads((R/'art/redraw-gold/manifest-batch02-candidates.json').read_text())
assert m['status']=='review-pending' and len(m['items'])==6
out=Image.new('RGB',(1980,1040),'#14111c')
d=ImageDraw.Draw(out)
try:f=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',18)
except:f=ImageFont.load_default()
for i,e in enumerate(m['items']):
 raw=(R/'art/redraw-gold'/e['file']).read_bytes()
 assert len(raw)==e['bytes'] and b'<image' not in raw
 p=Image.open(io.BytesIO(cairosvg.svg2png(bytestring=raw))).convert('RGBA')
 assert p.size==(640,440)
 assert all(p.getpixel(t)[3]==0 for t in [(0,0),(639,0),(0,439),(639,439)])
 x=(i%3)*660+10;y=(i//3)*510+10
 out.paste(p,(x,y),p)
 d.text((x+15,y+450),f"№{e['index']} · {e['name']} · КАНДИДАТ",font=f,fill='#eac28b')
root=R/'qa-artifacts';root.mkdir(exist_ok=True)
f=root/'redraw-batch02-preview.png'
out.save(f,optimize=True)
assert f.stat().st_size>50000
print('GOLD_VECTOR_REDRAW_6_RENDERED_FOR_REVIEW',f.stat().st_size)
