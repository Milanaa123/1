#!/usr/bin/env python3
"""Publish one 640x440 alpha WebP for each Animagia golden animal art card.
Preserve exact 100-cell order and the 22 manually corrected silhouettes.
"""
import hashlib,json
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
ART=ROOT/'art';OUT=ART/'individual-4x';OUT.mkdir(parents=True,exist_ok=True)
W,H=640,440
CORRECTED={6,7,9,10,14,19,24,29,30,33,35,40,46,47,48,53,54,65,68,78,81,86}
main=Image.open(ART/'animagia-100-sharp4x.webp').convert('RGBA')
corrected=Image.open(ART/'animagia-corrected-22-sharp4x.webp').convert('RGBA')
first=Image.open(ART/'animals-approved-01-05-sharp4x.png').convert('RGBA')
assert main.size==corrected.size==(6400,4400)
assert first.size==(2992,392)
files=[]
for num in range(1,101):
    src=corrected if num in CORRECTED else main
    idx=num-1;x=(idx%10)*W;y=(idx//10)*H
    piece=src.crop((x,y,x+W,y+H))
    path=OUT/f'animal-{num:03d}.webp'
    piece.save(path,'WEBP',quality=94,method=6,exact=True)
    if num==87: # dedicated hand-drawn SVG remains the preferred source for this species
        source='fallback raster for specific grass-snake SVG'
    else: source='corrected' if num in CORRECTED else 'original'
    files.append({'index':num,'file':path.name,'size':path.stat().st_size,
       'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'source':source})
offsets=[0,150,299,449,598,748]
for num in range(1,6):
    x1,x2=offsets[num-1:num+1]
    piece=first.crop((x1*4,0,x2*4,392))
    path=OUT/f'approved-{num:02d}.webp'
    piece.save(path,'WEBP',quality=95,method=6,exact=True)
    files.append({'approved':num,'file':path.name,'size':path.stat().st_size,
         'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'source':'five-approved-originals'})
data={'version':'individual-4x-20261028','width':W,'height':H,'count':100,
     'approvedCount':5,'corrections':sorted(CORRECTED),'items':files}
(OUT/'manifest.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
total=sum(item['size'] for item in files)
print('INDIVIDUAL_ART_105_FILES_PASSED',len(files),'TOTAL_BYTES',total,'MAX_BYTES',max(item['size'] for item in files),flush=True)
assert len(files)==105 and total<9_000_000
assert all(item['size']<170_000 for item in files)
