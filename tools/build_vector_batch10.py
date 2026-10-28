#!/usr/bin/env python3
"""Create faithful transparent gold SVG contours from existing 4x individual art.
These are traced illustrations, not manually anatomically reviewed redraws.
"""
from __future__ import annotations
import hashlib
import json
import re
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "art" / "individual-4x"
DEST = ROOT / "art" / "vector-ink"
ATLAS = ROOT / "animal_atlas_100.js"
FIRST, LAST = 66, 85
W, H = 640, 440
X, Y, SMALL_W, SMALL_H = 32, 22, 576, 396

SVG_HEADER = (
    '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="440" '
    'viewBox="0 0 640 440" role="img">'
    '<defs><linearGradient id="gold" x1="0%" y1="0%" x2="85%" y2="100%">'
    '<stop offset="0%" stop-color="#f8dca3"/>'
    '<stop offset="48%" stop-color="#dfa963"/>'
    '<stop offset="100%" stop-color="#b98343"/>'
    '</linearGradient></defs><path fill="url(#gold)" fill-rule="evenodd" d="'
)
SVG_FOOTER = '"/></svg>\n'


def main():
    DEST.mkdir(parents=True, exist_ok=True)
    manifest = {
        "version": "vector10-20261028",
        "range": [FIRST, LAST],
        "method": "OpenCV contour-to-SVG path tracing, not manual anatomy redraw",
        "inputResolution": [W, H],
        "items": [],
    }
    for number in range(FIRST, LAST + 1):
        src = SOURCE / f"animal-{number:03d}.webp"
        raw = src.read_bytes()
        with Image.open(src) as im:
            assert im.size == (W, H), f"Unexpected size: {src}, {im.size}"
            rgba = im.convert("RGBA")
            # Mirror existing Chromium fidelity test: draw source within a 32/22px inset.
            resized_alpha = rgba.getchannel("A").resize(
                (SMALL_W, SMALL_H), Image.Resampling.BICUBIC
            )
        full = np.zeros((H, W), dtype=np.uint8)
        full[Y:Y+SMALL_H, X:X+SMALL_W] = np.asarray(resized_alpha)
        original = np.where(full > 48, 255, 0).astype(np.uint8)
        contours, _ = cv2.findContours(
            original, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE
        )
        paths = []
        simplified = []
        for contour in contours:
            if len(contour) < 3:
                continue
            c = cv2.approxPolyDP(contour, 0.60, True)
            if len(c) < 3 or cv2.contourArea(c) < 0.35:
                continue
            points = [(int(v[0][0]), int(v[0][1])) for v in c]
            paths.append("M" + "L".join(f"{px} {py}" for px, py in points) + "Z")
            simplified.append(c)
        assert paths, f"Blank trace: {number}"
        # Even-odd paths preserve nested transparent details/negative spaces.
        svg = (SVG_HEADER + " ".join(paths) + SVG_FOOTER).encode("utf-8")
        assert b"<image" not in svg and b"<path" in svg
        target = DEST / f"animal-{number:03d}.svg"
        target.write_bytes(svg)
        proxy = np.zeros_like(original)
        cv2.drawContours(proxy, simplified, -1, 255, thickness=cv2.FILLED)
        union = np.count_nonzero((proxy > 0) | (original > 0))
        intersection = np.count_nonzero((proxy > 0) & (original > 0))
        alpha_iou = round(intersection / union, 4) if union else 0.0
        # Browser test is authoritative; this is an independent preflight metric.
        if alpha_iou < 0.82:
            raise RuntimeError(f"Contour coverage below threshold for {number}: {alpha_iou}")
        manifest["items"].append({
            "index": number,
            "file": target.name,
            "bytes": len(svg),
            "sha256": hashlib.sha256(svg).hexdigest(),
            "source_sha256": hashlib.sha256(raw).hexdigest(),
            "alpha_iou": alpha_iou,
            "path_count": len(paths),
            "anatomy_reviewed": False,
        })
        print(f"SVG {number}: {len(paths)} paths, {len(svg)} bytes, IoU {alpha_iou}", flush=True)
    assert len(manifest["items"]) == 20
    (DEST / "manifest-batch10.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )

    atlas = ATLAS.read_text(encoding="utf-8")
    needle = " const VECTOR09_FIRST=46,VECTOR09_LAST=65;"
    assert atlas.count(needle) == 1
    atlas = atlas.replace(needle, needle + "\n const VECTOR10_FIRST=66,VECTOR10_LAST=85;")
    needle = "(number>=VECTOR09_FIRST&&number<=VECTOR09_LAST))?VECTOR_DIR"
    assert atlas.count(needle) == 1
    atlas = atlas.replace(
        needle,
        "(number>=VECTOR09_FIRST&&number<=VECTOR09_LAST)||\n"
        "   (number>=VECTOR10_FIRST&&number<=VECTOR10_LAST))?VECTOR_DIR",
    )
    needle = "  vectorBatch09:Object.freeze({first:46,last:65,count:20,source:'faithful alpha contour trace',manualAnatomyReviewed:false}),"
    assert atlas.count(needle) == 1
    atlas = atlas.replace(
        needle,
        needle + "\n"
        "  vectorBatch10:Object.freeze({first:66,last:85,count:20,source:'faithful alpha contour trace',manualAnatomyReviewed:false}),",
    )
    ATLAS.write_text(atlas, encoding="utf-8")
    print("VECTOR10_ART_20_GENERATED_AND_ATLAS_ROUTED", flush=True)


if __name__ == "__main__":
    main()
