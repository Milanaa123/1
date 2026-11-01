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
    # The old numbered animal gallery and the later 1–400 batches contain
    # different source files with some of the SAME numeric IDs (e.g. #127
    # is the original European catfish, but new/127 is a marmoset).
    # Never key legacy scientific species by the number of a new batch.
    legacy=[item for item in manifest["files"]
            if item["file"].startswith("animals/") and item["number"] is not None]
    by_number={}
    for item in legacy:
        number=item["number"]
        if number in by_number:
            raise AssertionError("Duplicate number in ORIGINAL animals/: "+str(number))
        if not item["file"].startswith("animals/"+str(number).zfill(3)+"-"):
            raise AssertionError("Original animal filename differs from its number: "+item["file"])
        by_number[number]=item["file"]
    approved_files={item["file"] for item in manifest["files"]}
    sources=[]
    selected=(base/"selected_art_400.js").read_text(encoding="utf8")
    first=selected.split("const scientificToArtwork=new Map([",1)[1].split("]);",1)[0]
    for name,number,label in re.findall(r"\['([^']+)',\[(\d+|null),'([^']+)'\]\]",first):
        if not re.fullmatch(r"[A-Z][a-zA-Z-]+ [a-zA-Z-]+",name):
            continue
        if number=="null":
            file="additional/"+label+".png"
        else:
            if int(number) not in by_number:
                raise AssertionError("Original animals/ number not published: "+number+" "+name)
            file=by_number[int(number)]
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


def build_representative_art(base: Path, public: Path, required_classes: dict | None = None) -> dict:
    """Index verified genus, family, order and class artwork (all accepted taxa)."""
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
    genus,family,order,by_class,family_class,genus_class={},{},{},{},{},{}
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
        by_class.setdefault(cls,record)
        if fam:
            family.setdefault(cls+"|"+ordr+"|"+fam,record)
            name=item["scientific"].split(" ",1)[0]
            genus.setdefault(cls+"|"+ordr+"|"+fam+"|"+name,record)
            family_class.setdefault(cls+"|"+fam,record)
            genus_class.setdefault(cls+"|"+fam+"|"+name,record)

    # Curated visual prototypes must be a REAL source within the SAME
    # verified class/family of the frozen Catalogue of Life. This is not
    # alphabetical matching, translated scientific names, or a made-up taxon.
    preferred_family={
        "Mammalia|Carnivora|Canidae":"Canis lupus",
        "Mammalia|Carnivora|Felidae":"Felis catus",
        "Mammalia|Carnivora|Ursidae":"Ursus arctos",
        "Mammalia|Cetacea|Delphinidae":"Tursiops truncatus",
        "Mammalia|Cetacea|Balaenopteridae":"Balaenoptera musculus",
    }
    preferred_class={
        "Amphibia":"Alytes muletensis",
        "Arachnida":"Neon valentulus",
        "Asteroidea":"Asterias rubens",
        "Aves":"Corvus corax",
        "Cephalopoda":"Sepia officinalis",
        "Chondrostei":"Polyodon spathula",
        "Echinoidea":"Diadema setosum",
        "Elasmobranchii":"Carcharodon carcharias",
        "Holocephali":"Callorhinchus capensis",
        "Holothuroidea":"Holothuria tubulosa",
        "Insecta":"Mesoprionus angustatus",
        "Malacostraca":"Penaeus silasi",
        "Mammalia":"Canis lupus",
        "Ophiuroidea":"Ophiothrix fragilis",
        "Polyplacophora":"Chiton cumingsii",
        "Reptilia":"Chamaeleo calyptratus",
        "Teleostei":"Perca fluviatilis",
    }
    item_by_name={item["scientific"]:item for item in sources}
    def approved_record(scientific):
        item=item_by_name.get(scientific)
        if item is None or scientific not in found:
            raise AssertionError("Curated artwork has no verified source: "+scientific)
        return [item["file"],scientific,item["label"]]
    for key,scientific in preferred_family.items():
        row=found.get(scientific)
        if row is None or row[3]+"|"+row[4]+"|"+row[7]!=key:
            raise AssertionError("Unverified family assignment: "+scientific+" -> "+key)
        family[key]=approved_record(scientific)
        family_class[row[3]+"|"+row[7]]=approved_record(scientific)
    # Use the wolf, not the generic jackal, for other species of Canis.
    preferred_genus={"Mammalia|Carnivora|Canidae|Canis":"Canis lupus"}
    for key,scientific in preferred_genus.items():
        row=found.get(scientific)
        if row is None or row[3]+"|"+row[4]+"|"+row[7]+"|"+scientific.split(" ",1)[0]!=key:
            raise AssertionError("Unverified genus assignment: "+scientific+" -> "+key)
        genus[key]=approved_record(scientific)
        genus_class[row[3]+"|"+row[7]+"|"+scientific.split(" ",1)[0]]=approved_record(scientific)
    for cls,scientific in preferred_class.items():
        row=found.get(scientific)
        if row is None or row[3]!=cls:
            raise AssertionError("Unverified class assignment: "+scientific+" -> "+cls)
        by_class[cls]=approved_record(scientific)
    if required_classes is not None:
        missing_classes=set(required_classes)-set(by_class)
        if missing_classes:
            raise AssertionError("Class-level coverage missing: "+repr(sorted(missing_classes)))
        if not required_classes or any(not cls or count<1 for cls,count in required_classes.items()):
            raise AssertionError("Unexpected blank/invalid Catalogue of Life animal class")
    payload={"version":2,"order":order,"family":family,"genus":genus,
             "familyClass":family_class,"genusClass":genus_class,"class":by_class}
    out=public/"artwork_representatives_index.js"
    out.write_text("window.AnimagiaRepresentativeIndex=Object.freeze("+json.dumps(payload,ensure_ascii=False,separators=(",",":"))+");\n",encoding="utf8")
    score=1878
    score_file=public/"data"/(str(score//25)+".json")
    coverage={"total":0,"exact":0,"frogs":0,"genus":0,"family":0,
              "order":0,"class":0,"missing":0}
    exact_source={x["scientific"] for x in sources}
    if score_file.is_file():
        for row in json.loads(score_file.read_text(encoding="utf8")):
            if row[0]!=score:continue
            coverage["total"]+=1
            cls,ordr,fam=row[3],row[4],row[7]
            scientific=row[1]
            if row[2]=="species" and scientific in exact_source:
                coverage["exact"]+=1
            elif row[2]=="species" and cls=="Amphibia" and ordr=="Anura":
                coverage["frogs"]+=1
            elif fam and (cls+"|"+ordr+"|"+fam+"|"+scientific.split(" ",1)[0] in genus
                or cls+"|"+fam+"|"+scientific.split(" ",1)[0] in genus_class):
                coverage["genus"]+=1
            elif fam and (cls+"|"+ordr+"|"+fam in family or cls+"|"+fam in family_class):
                coverage["family"]+=1
            elif cls+"|"+ordr in order:
                coverage["order"]+=1
            elif cls in by_class:
                coverage["class"]+=1
            else:
                coverage["missing"]+=1
        if coverage["total"]!=550:
            raise AssertionError("Unexpected number of matching taxa at score 1878")
    if coverage["missing"] or coverage["total"]!=550:
        raise AssertionError("550-match artwork coverage is incomplete: "+repr(coverage))
    stats={"source_scientific":len(sources),"catalogue_verified":len(found),
           "by_genus":len(genus),"by_family":len(family),"by_order":len(order),
           "by_class":len(by_class),"by_family_without_order":len(family_class),
           "by_genus_without_order":len(genus_class),
           "unmapped_source_count":len(unmapped),"score_1878":coverage,
           "accepted_catalogue_classes":len(required_classes or {}),
           "catalogue_taxa_covered":sum(required_classes.values()) if required_classes is not None else None,
           "class_level_guarantee": bool(required_classes is not None and
                                      set(required_classes).issubset(by_class))}
    print("ANIMAGIA_REPRESENTATIVE_ART_INDEX",json.dumps(stats,ensure_ascii=False),flush=True)
    return stats
