"""Publish the 108 selected original Animagia transparent PNGs without re-encoding."""
from __future__ import annotations
import hashlib, json, shutil, struct
from pathlib import Path

ART_REL=Path("art/animagia-selected-107")
PNG_SIGNATURE=bytes([137,80,78,71,13,10,26,10])

def publish_selected_original_art(base, destination):
    base=Path(base);destination=Path(destination)
    source=base/ART_REL
    manifest=json.loads((source/"manifest.json").read_text(encoding="utf-8"))
    assert manifest["count"]==108 and manifest["animals"]==104 and manifest["additional"]==4
    records=manifest["files"]
    assert len(records)==108
    seen=set();bytes_published=0
    for item in records:
        path=Path(item["file"])
        assert len(path.parts)==2 and path.parts[0] in {"animals","additional"}
        assert path.suffix==".png" and str(path) not in seen
        seen.add(str(path))
        sourcefile=source/path
        raw=sourcefile.read_bytes()
        assert raw[:8]==PNG_SIGNATURE and raw[25]==6,(path,"invalid RGBA PNG")
        dimensions=struct.unpack(">II",raw[16:24])
        assert dimensions==(item["width"],item["height"]),(path,"incorrect dimensions")
        assert hashlib.sha256(raw).hexdigest()==item["sha256"],(path,"checksum mismatch")
        dest=destination/ART_REL/path
        dest.parent.mkdir(parents=True,exist_ok=True)
        shutil.copyfile(sourcefile,dest)
        bytes_published+=len(raw)
    shutil.copyfile(source/"manifest.json",destination/ART_REL/"manifest.json")
    print("ANIMAGIA_108_ORIGINAL_RGBA_PNG_PUBLISHED",len(seen),bytes_published,flush=True)
    return {"count":len(seen),"original_png_bytes":bytes_published,
        "directory":str(ART_REL),"sha256_audited":True,"reencoded":False}
