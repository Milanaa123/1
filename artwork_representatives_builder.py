"""Build a transparent, taxonomy-verified index for REPRESENTATIVE drawings.

The image is NOT a scientific portrait of the matching species. Sources must
be published original PNGs, and source order/family must be looked up from
our own frozen Catalogue of Life release. Never guess family names from art.
"""
from __future__ import annotations

import json
import re
from collections import defaultdict
from pathlib import Path

from greek_taxa import taxon_score


def artwork_sources(base: Path) -> list[dict]:
    root=base/"art"/"animagia-selected-107"
    manifest=json.loads((root/"manifest.json").read_text(encoding="utf8"))
    if manifest["count"]!=400 or len(manifest["files"])!=400:
        raise AssertionError("Artwork must have exactly 400 originals")
    by_number={item["number"]:item["file"] for item in manifest["files"] if item["number"] is not None}
    approved_files={item["file"] for item in manifest["files"]}
    sources=[]
    selected=(base/"selected_art_400.js").read_text(encoding="utf8")
    first=selected.split("const scientificToArtwork=new Map([",1)[1].split("]);",1)[0]
    for name,number,label in re.findall(r"\['([^']+)',\[(\d+|null),'([^']+)'\]\]",first):
        if not re.fullmatch(r"[A-Z][a-zA-Z-]+ [a-zA-Z-]+",name):
            continue
        file=by_number[int(number)] if number!="null" else "additional/"+label+".png"
        if file not in approved_files:
            raise AssertionError("An approved scientific name points to a missing source: "+file)
        sources.append({"scientific":name,"file":file,"label":label})
    for filename,variable in [("new_art_167.js","newExamples"),("new_art_125.js","examples")]:
        js=(base/filename).read_text(encoding="utf8")
        start=js.split("const "+variable+"=",1)[1].split(";",1)[0]
        items=json.loads(start)
        for scientific,file,label in items:
            if file not in approved_files:
                raise AssertionError("Missing PNG from source manifest: "+file)
            sources.append({"scientific":scientific,"file":file,"label":label})
    unique={}
    for item in sources:
        if item["scientific"] in unique and unique[item["scientific"]]["file"]!=item["file"]:
            raise AssertionError("Same species is mapped to conflicting drawings")
        unique[item["scientific"]]=item
    if len(unique)<390:
        raise AssertionError("Failed to collect the known original artwork species")
    return list(unique.values())


def build_representative_art(base: Path, public: Path) -> dict:
    """Index genuine genus/family/order membership; prefer closest relative."""
    sources=artwork_sources(base)
    groups=defaultdict(set)
    for item in sources:
        try:
            number=taxon_score(item["scientific"])
            groups[number//25].add(item["scientific"])
        except ValueError:
            continue
    found={}
    for bucket,needed in sorted(groups.items()):
        path=public/"data"/(str(bucket)+".json")
        if not path.is_file():
            continue
        for row in json.loads(path.read_text(encoding="utf8")):
            if row[1] in needed and row[2]=="species":
                found[row[1]]=row
    genus,family,order={},{},{}
    unmapped=[]
    # Prioritise original drawings, preserving the image bytes and identity.
    for item in sources:
        source=found.get(item["scientific"])
        if source is None:
            unmapped.append(item["scientific"])
            continue
        cls,ordr,fam=source[3],source[4],source[7]
        if not cls or not ordr:
            continue
        record=[item["file"],item["scientific"],item["label"]]
        order.setdefault(cls+"|"+ordr,record)
        if fam:
            family.setdefault(cls+"|"+ordr+"|"+fam,record)
            name=item["scientific"].split(" ",1)[0]
            genus.setdefault(cls+"|"+ordr+"|"+fam+"|"+name,record)
    payload={"version":1,"order":order,"family":family,"genus":genus}
    out=public/"artwork_representatives_index.js"
    out.write_text("window.AnimagiaRepresentativeIndex=Object.freeze("+json.dumps(payload,ensure_ascii=False,separators=(",",":"))+");\n",encoding="utf8")
    score=1878
    score_file=public/"data"/(str(score//25)+".json")
    coverage={"total":0,"exact":0,"frogs":0,"genus":0,"family":0,"order":0,"missing":0}
    exact_source={x["scientific"] for x in sources}
    if score_file.is_file():
        for row in json.loads(score_file.read_text(encoding="utf8")):
            if row[0]!=score:continue
            coverage["total"]+=1
            cls,ordr,fam=row[3],row[4],row[7]
            scientific=row[1]
            if row[2]=="species" and scientific in exact_source:
                coverage["exact"]+=1
            elif fam and cls+"|"+ordr+"|"+fam+"|"+scientific.split(" ",1)[0] in genus:
                coverage["genus"]+=1
            elif fam and cls+"|"+ordr+"|"+fam in family:
                coverage["family"]+=1
            elif cls+"|"+ordr in order:
                coverage["order"]+=1
            elif row[2]=="species" and cls=="Amphibia" and ordr=="Anura":
                coverage["frogs"]+=1
            else:
                coverage["missing"]+=1
        if coverage["total"]!=550:
            raise AssertionError("Unexpected number of matching taxa at score 1878")
    stats={"source_scientific":len(sources),"catalogue_verified":len(found),
           "by_genus":len(genus),"by_family":len(family),"by_order":len(order),
           "unmapped_source_count":len(unmapped),"score_1878":coverage}
    print("ANIMAGIA_REPRESENTATIVE_ART_INDEX",json.dumps(stats,ensure_ascii=False),flush=True)
    return stats
