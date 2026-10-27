#!/usr/bin/env python3
"""Generate visibly sharper 4× animal artwork without modifying the approved sources.

Pillow enlarges each individual 160×110 transparent cell separately: no
cross-cell interpolation, no opaque background, and no destructive cropping.
This improves edge definition at actual card/PNG sizes; it does not invent
species features missing from the supplied source illustrations.
"""
from __future__ import annotations
from pathlib import Path
from PIL import Image, ImageFilter, ImageEnhance
import hashlib, json
ROOT=Path(__file__).resolve().parents[1]
ART=ROOT/'art'
SCALE=4
LANCZOS=Image.Resampling.LANCZOS
Image.MAX_IMAGE_PIXELS=80_000_000

def sharpen_cell(cell:Image.Image)->Image.Image:
    if cell.getbbox() is None:
        return Image.new('RGBA',(cell.width*SCALE,cell.height*SCALE))
    cell=cell.convert('RGBA')
    rgba=cell.resize((cell.width*SCALE,cell.height*SCALE),LANCZOS)
    rgb=Image.new('RGB',rgba.size)
    rgb.paste(rgba.convert('RGB'))
    rgb=ImageEnhance.Contrast(rgb).enhance(1.09)
    rgb=rgb.filter(ImageFilter.UnsharpMask(radius=1.05,percent=145,threshold=2))
    alpha=rgba.getchannel('A')
    alpha=alpha.filter(ImageFilter.UnsharpMask(radius=1.2,percent=205,threshold=2))
    alpha=alpha.point(lambda v: 0 if v<11 else v)
    rgb.putalpha(alpha)
    return rgb

def grid(src:str,dst:str):
    source=Image.open(ART/src).convert('RGBA')
    assert source.size==(1600,1100),(src,source.size)
    output=Image.new('RGBA',(6400,4400))
    for i in range(100):
        x=(i%10)*160;y=(i//10)*110
        cell=source.crop((x,y,x+160,y+110))
        crisp=sharpen_cell(cell)
        output.paste(crisp,(x*SCALE,y*SCALE))
    output.save(ART/dst,'WEBP',quality=98,method=6,exact=True)
    check=Image.open(ART/dst)
    assert check.size==(6400,4400),(dst,check.size)
    return {'file':dst,'bytes':(ART/dst).stat().st_size,'sha256':hashlib.sha256((ART/dst).read_bytes()).hexdigest()}

def first_five():
    source=Image.open(ART/'animals-approved-01-05.png').convert('RGBA')
    assert source.size==(748,98),source.size
    offsets=(0,150,299,449,598,748)
    output=Image.new('RGBA',(748*SCALE,98*SCALE))
    for i in range(5):
        x1,x2=offsets[i:i+2]
        cell=source.crop((x1,0,x2,98))
        output.paste(sharpen_cell(cell),(x1*SCALE,0))
    name='animals-approved-01-05-sharp4x.png'
    output.save(ART/name,'PNG',optimize=True)
    check=Image.open(ART/name)
    assert check.size==(2992,392)
    return {'file':name,'bytes':(ART/name).stat().st_size,'sha256':hashlib.sha256((ART/name).read_bytes()).hexdigest()}

def main():
    results=[grid('animagia-100-alpha.webp','animagia-100-sharp4x.webp'),
             grid('animagia-corrected-22.webp','animagia-corrected-22-sharp4x.webp'),
             first_five()]
    manifest={'scale':SCALE,'sourceSize':[1600,1100],'sourceCells':100,'lossless':False,'results':results,
      'limitations':'Source has 160x110 pixels per art cell. Sharpening can clarify edges but cannot recover original illustration detail that was never present.'}
    (ART/'sharp-art-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    print('SHARP_100_ASSETS_BUILT '+json.dumps(manifest,ensure_ascii=False),flush=True)
if __name__=='__main__':main()
