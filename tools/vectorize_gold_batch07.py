#!/usr/bin/env python3
"""Trace existing gold illustrations 6–25 into actual scalable, transparent SVG paths.

A faithful contour tracing pass is a first vector-art pass, NOT a claim that
biological anatomy was redrawn or corrected. Every SVG is visually verified
against the corresponding curated source with its alpha-mask overlap.
"""
from __future__ import annotations
import hashlib, io, json, xml.etree.ElementTree as ET
from pathlib import Path
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFont
import cairosvg

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'art'/'individual-4x'
OUT=ROOT/'art'/'vector-ink'
QA=ROOT/'qa-artifacts'
FIRST,LAST=6,25
WIDTH,HEIGHT=640,440
OUT.mkdir(exist_ok=True,parents=True)
QA.mkdir(exist_ok=True,parents=True)

def trace(img:Image.Image):
    rgba=np.asarray(img.convert('RGBA'))
    alpha=cv2.GaussianBlur(rgba[:,:,3],(3,3),0.45)
    threshold=48
    mask=np.where(alpha>=threshold,255,0).astype('uint8')
    contours,_=cv2.findContours(mask,cv2.RETR_TREE,cv2.CHAIN_APPROX_SIMPLE)
    path=[]
    for contour in contours:
        area=cv2.contourArea(contour)
        perimeter=cv2.arcLength(contour,True)
        if area<1.5 and perimeter<12:
            continue
        polygon=cv2.approxPolyDP(contour,0.85,True).reshape((-1,2))
        if len(polygon)<3:
            continue
        path.append('M'+str(int(polygon[0][0]))+' '+str(int(polygon[0][1]))+
                    ''.join('L'+str(int(x))+' '+str(int(y)) for x,y in polygon[1:])+'Z')
    if not path:
        raise ValueError('No contours')
    # Vector geometry: golden strokes are painted as paths, not embedded PNG/JPEG.
    # Transparent holes and decorative interior lines retain their original topology.
    svg=(
      '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="440" '
      'viewBox="0 0 640 440" role="img">'
      '<defs><linearGradient id="gold" x1="0%" y1="0%" x2="85%" y2="100%">'
      '<stop offset="0%" stop-color="#f8dca3"/>'
      '<stop offset="48%" stop-color="#dfa963"/>'
      '<stop offset="100%" stop-color="#b98343"/>'
      '</linearGradient></defs>'
      '<path fill="url(#gold)" fill-rule="evenodd" d="'+''.join(path)+'"/>'
      '</svg>\n'
    )
    ET.fromstring(svg)
    return svg,len(path)

def mask_iou(original,vector):
    a=np.array(original.convert('RGBA'))[:,:,3]>=48
    b=np.array(vector.convert('RGBA'))[:,:,3]>=48
    union=np.count_nonzero(a|b)
    return (np.count_nonzero(a&b)/union) if union else 0

def main():
    original_manifest=json.loads((SOURCE/'manifest.json').read_text())
    source_lookup={e['index']:e for e in original_manifest['items'] if 'index' in e}
    manifest={'version':'vector07-20261028','range':[FIRST,LAST],
              'method':'OpenCV contour-to-SVG path tracing, not manual anatomy redraw',
              'inputResolution':[WIDTH,HEIGHT],'items':[]}
    count=LAST-FIRST+1
    cols=2
    scale=0.38
    thumb_w,thumb_h=int(WIDTH*scale),int(HEIGHT*scale)
    row_h=thumb_h+34
    sheet=Image.new('RGB',(cols*2*(thumb_w+18),10*row_h+55),'#17121e')
    drawer=ImageDraw.Draw(sheet)
    drawer.text((15,8),'ANIMAGIA   |   6-25  BEFORE: RASTER         AFTER: VECTOR SVG',fill='#efc787')
    for pos,num in enumerate(range(FIRST,LAST+1)):
        name=f'animal-{num:03d}'
        file=SOURCE/(name+'.webp')
        raw=file.read_bytes()
        assert hashlib.sha256(raw).hexdigest()==source_lookup[num]['sha256'],name
        source=Image.open(file).convert('RGBA')
        assert source.size==(WIDTH,HEIGHT)
        svg,paths=trace(source)
        dest=OUT/(name+'.svg')
        dest.write_text(svg,encoding='utf8')
        assert '<image' not in svg and 'base64' not in svg
        assert dest.stat().st_size<180_000,(num,dest.stat().st_size)
        rendered=Image.open(io.BytesIO(cairosvg.svg2png(bytestring=svg.encode()))).convert('RGBA')
        overlap=mask_iou(source,rendered)
        assert overlap>=0.84,(num,overlap)
        assert all(rendered.getpixel(pt)[3]==0 for pt in [(0,0),(639,0),(0,439),(639,439)]),num
        manifest['items'].append({
          'index':num,'file':dest.name,'bytes':dest.stat().st_size,
          'sha256':hashlib.sha256(dest.read_bytes()).hexdigest(),
          'source_sha256':source_lookup[num]['sha256'],
          'alpha_iou':round(overlap,4),'path_count':paths,
          'anatomy_reviewed':False,
        })
        row=pos//cols; pair=pos%cols
        x=pair*2*(thumb_w+18);y=55+row*row_h
        for which,im in enumerate((source,rendered)):
            thumb=im.resize((thumb_w,thumb_h),Image.Resampling.LANCZOS)
            xx=x+which*(thumb_w+18)
            sheet.paste(thumb,(xx,y),thumb.getchannel('A'))
        drawer.text((x+3,y+thumb_h+6),f'{num:02d} original / SVG, overlap {overlap:.3f}',fill='#d8b27f')
        print('VECTOR_DRAWING_PASSED',num,'paths',paths,'bytes',dest.stat().st_size,'overlap',round(overlap,4),flush=True)
    assert len(manifest['items'])==count
    (OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    sheet.save(QA/'vector07-original-vs-svg.png',optimize=True)
    print('VECTOR_BATCH07_20_IMAGES_READY',count,'TOTAL_BYTES',
          sum(e['bytes'] for e in manifest['items']),'MIN_ALPHA_IOU',
          min(e['alpha_iou'] for e in manifest['items']),flush=True)

if __name__=='__main__':main()
