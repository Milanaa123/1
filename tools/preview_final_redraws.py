#!/usr/bin/env python3
"""Check and preview the final ten sharp source-vector redraws before routing live."""
from __future__ import annotations
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
from xml.etree import ElementTree as ET
import hashlib,io,json,cairosvg
ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'art'/'redraw-gold'
QA=ROOT/'qa-artifacts';QA.mkdir(parents=True,exist_ok=True)
indices=[66,67,68,69,70,76,79,93,96,100]
names=['Эму','Страус','Казуар','Киви','Пингвин','Тюлень','Ламантин','Шипохвост','Кальмар','Омар']
features={
66:['upright emu neck','shaggy body plumage','two long three-toed legs'],
67:['long ostrich neck','large flightless body','two strong legs','broad feathered tail'],
68:['raised cassowary casque','neck wattles','strong claws','dark hair-like feathers'],
69:['compact feathered kiwi body','elongated down-curved narrow bill','short legs'],
70:['upright penguin body','two flippers','pale ventral belly','short feet'],
76:['true seal without external ear flaps','small front flippers','streamlined body','hind flippers'],
79:['rounded manatee body','paddle flippers','spatulate rounded tail'],
93:['uromastyx short thick thorny tail','low lizard body','four legs'],
96:['triangular mantle fins','eight arms and two longer tentacles','large eye'],
100:['lobster segmented abdomen','two major pincers','walking legs','long antennae']
}
proof=Image.new('RGB',(5*460,2*345),'#14121b')
draw=ImageDraw.Draw(proof)
try:font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',18)
except OSError:font=ImageFont.load_default()
items=[]
for i,(n,name) in enumerate(zip(indices,names)):
 path=SRC/f'animal-{n:03d}.svg'
 data=path.read_bytes()
 assert len(data)>3500 and len(data)<400000,(n,len(data))
 assert b'<path' in data and b'<image' not in data
 root=ET.fromstring(data)
 assert root.attrib['viewBox']=='0 0 640 440' and root.tag.endswith('svg')
 assert root.attrib.get('aria-label')==name
 png=cairosvg.svg2png(bytestring=data)
 art=Image.open(io.BytesIO(png)).convert('RGBA')
 assert art.size==(640,440)
 assert all(art.getpixel(c)[3]==0 for c in [(0,0),(639,0),(0,439),(639,439)])
 alpha=art.getchannel('A')
 nonblank=sum(1 for v in alpha.getdata() if v>40)
 assert nonblank>8000,(n,'blank',nonblank)
 thumb=art.resize((450,309),Image.Resampling.LANCZOS)
 x=(i%5)*460+5;y=(i//5)*345+4
 proof.paste(thumb,(x,y),thumb)
 draw.text((x+15,y+314),f"№{n} · {name} | ВЕКТОР",font=font,fill='#f2ca8a')
 items.append({'index':n,'name':name,'file':path.name,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'published':False,'manualAnatomyApproved':False,'drawnFeatures':features[n],'nontransparentPixels':nonblank,'contentType':'image/svg+xml'})
target=QA/'redraw-final-ten-proof.png'
proof.save(target,optimize=True)
assert target.stat().st_size>80000
manifest={'status':'review-pending','version':'final-ten-redraws-20261028','source':'original path-based vector illustrations drawn from wildlife morphology references; no raster embedded','items':items}
(SRC/'manifest-final10-candidates.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print('LAST_TEN_ORIGINAL_SVG_PREVIEW_VERIFIED',len(items),sum(x['bytes'] for x in items),target.stat().st_size,flush=True)
