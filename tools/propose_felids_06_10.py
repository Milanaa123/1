#!/usr/bin/env python3
"""Generate independent 6/10 image proposals from the original 100-animal atlas.
Do not alter live art or its integrity manifests until candidates are manually accepted.
"""
from __future__ import annotations
import hashlib, io, json
from pathlib import Path
import numpy as np, cv2, cairosvg
from PIL import Image,ImageDraw

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'art'/'animagia-100-sharp4x.webp'
CANDIDATES=ROOT/'art'/'candidates'
EVIDENCE=ROOT/'qa-artifacts'
CANDIDATES.mkdir(exist_ok=True,parents=True)
EVIDENCE.mkdir(exist_ok=True,parents=True)
manifest=json.loads((ROOT/'art'/'sharp-art-manifest.json').read_text())
expected=next(e for e in manifest['results'] if e['file']==SOURCE.name)
data=SOURCE.read_bytes()
assert len(data)==expected['bytes'] and hashlib.sha256(data).hexdigest()==expected['sha256']
atlas=Image.open(SOURCE).convert('RGBA')
assert atlas.size==(6400,4400),atlas.size
sheet=Image.new('RGB',(2*720,2*540),'#14121b')
draw=ImageDraw.Draw(sheet)
items=[]
for col,number in enumerate([6,10]):
    idx=number-1
    original=atlas.crop(((idx%10)*640,(idx//10)*440,((idx%10)+1)*640,((idx//10)+1)*440))
    rgba=np.asarray(original)
    alpha=cv2.GaussianBlur(rgba[:,:,3],(3,3),0.45)
    mask=np.where(alpha>=48,255,0).astype('uint8')
    contours,_=cv2.findContours(mask,cv2.RETR_TREE,cv2.CHAIN_APPROX_SIMPLE)
    paths=[]
    for c in contours:
        if cv2.contourArea(c)<1.5 and cv2.arcLength(c,True)<12:continue
        pts=cv2.approxPolyDP(c,0.85,True).reshape((-1,2))
        if len(pts)<3:continue
        paths.append('M'+str(int(pts[0][0]))+' '+str(int(pts[0][1]))+''.join(
            'L'+str(int(x))+' '+str(int(y)) for x,y in pts[1:]
        )+'Z')
    assert len(paths)>5,('too little original detail',number,len(paths))
    svg=(
       '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="440" viewBox="0 0 640 440" role="img">'
       '<defs><linearGradient id="gold" x1="0%" y1="0%" x2="85%" y2="100%">'
       '<stop offset="0%" stop-color="#f8dca3"/><stop offset="48%" stop-color="#dfa963"/>'
       '<stop offset="100%" stop-color="#b98343"/></linearGradient></defs>'
       '<path fill="url(#gold)" fill-rule="evenodd" d="'+''.join(paths)+'"/></svg>\n'
    )
    png=Image.open(io.BytesIO(cairosvg.svg2png(bytestring=svg.encode()))).convert('RGBA')
    a=np.asarray(original)[:,:,3]>=48
    b=np.asarray(png)[:,:,3]>=48
    union=np.count_nonzero(a|b)
    iou=float(np.count_nonzero(a&b)/union) if union else 0.0
    assert iou>=0.84,(number,iou)
    assert all(png.getpixel(q)[3]==0 for q in [(0,0),(639,0),(0,439),(639,439)])
    file=CANDIDATES/f'animal-{number:03d}-original-proposal.svg'
    file.write_text(svg,encoding='utf8')
    src=Image.open(ROOT/'art'/'individual-4x'/f'animal-{number:03d}.webp').convert('RGBA')
    for row,img in enumerate([src,png]):
        xy=(col*720+40,row*540+30)
        sheet.paste(img,xy,img)
    draw.text((col*720+22,5),f'#{number} CURRENT, THEN REFERENCE RESTORED',fill='#ecc28b')
    items.append({'index':number,'svg':str(file.relative_to(ROOT)),
       'sha256':hashlib.sha256(svg.encode()).hexdigest(),'size':len(svg.encode()),
       'originalAtlasSHA256':expected['sha256'],'iou':round(iou,4),
       'status':'candidate_only_not_published','reviewed':False})
    print('FELID_CANDIDATE',number,'paths',len(paths),'iou',round(iou,4),flush=True)
(CANDIDATES/'manifest-06-10.json').write_text(json.dumps({
 'purpose':'Original-atlas proposals for anatomically incorrect tiger and cougar images; no publication without review.',
 'items':items},ensure_ascii=False,indent=2)+'\n',encoding='utf8')
sheet.save(EVIDENCE/'original-cat-proposals-06-10.png',optimize=True)
print('FELID_CANDIDATES_PREVIEW_READY',len(items),flush=True)
