#!/usr/bin/env python3
"""Import real Russian vernacular names from the official iNaturalist DarwinCore
taxonomy archive. Never transliterate or infer names from animal appearance.
Only exact, unambiguous species/subspecies and taxonomically compatible rows.
"""
from __future__ import annotations
import collections
import csv
import hashlib
import io
import json
import re
import sys
import tempfile
import urllib.request
import zipfile
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
URL="https://www.inaturalist.org/taxa/inaturalist-taxonomy.dwca.zip"
OUT=ROOT/"russian_inaturalist_snapshot.json"
LATIN=re.compile(r"^[A-Z][a-z-]+ [a-z-]+(?: [a-z-]+)?$")
RUSSIAN=re.compile(r"^[А-ЯЁа-яё][А-ЯЁа-яё\s\-–—()«».,'’]+$",re.U)
LANG={"ru","rus","russian","русский","ru-ru"}
MAX_DOWNLOAD=500*1024*1024

def download(path):
    digest=hashlib.sha256()
    req=urllib.request.Request(URL,headers={
        "User-Agent":"Animagia-public-zoology-dataset/1.0",
        "Accept":"application/zip"})
    total=0
    with urllib.request.urlopen(req,timeout=180) as src,open(path,"wb") as out:
        while True:
            block=src.read(1024*1024)
            if not block:break
            total+=len(block)
            if total>MAX_DOWNLOAD:raise ValueError("Archive too large; refusing unsafe import")
            digest.update(block)
            out.write(block)
    if not zipfile.is_zipfile(path):raise ValueError("Downloaded archive is not a ZIP")
    print("INAT_ARCHIVE",total,digest.hexdigest(),flush=True)
    return digest.hexdigest(),total

def readcsv(z,filename):
    # Official DwC-A is CSV. Detect a possible TSV variant by first header.
    with z.open(filename) as f:
        header=f.readline().decode("utf-8-sig",errors="replace")
    sep="\t" if header.count("\t")>header.count(",") else ","
    with z.open(filename) as f:
        with io.TextIOWrapper(f,encoding="utf-8-sig",errors="replace",newline="") as txt:
            reader=csv.DictReader(txt,delimiter=sep)
            for row in reader:yield row

def field(row,*names):
    for name in names:
        v=row.get(name)
        if v:return str(v).strip()
    return ""

def valid_name(value):
    return bool(3<=len(value)<=130 and RUSSIAN.fullmatch(value))

def taxon_info(z,taxon_file):
    records={}
    parsed=0
    for row in readcsv(z,taxon_file):
        parsed+=1
        if field(row,"kingdom")!="Animalia":continue
        rank=field(row,"taxonRank","rank").lower()
        if rank not in ("species","subspecies"):continue
        scientific=field(row,"scientificName","name")
        # iNat core may include authority after canonical name; reconstruct
        # only when complete Latin genus+species are explicitly present.
        genus=field(row,"genus")
        epithet=field(row,"specificEpithet")
        infra=field(row,"infraspecificEpithet")
        if genus and epithet:
            reconstructed=" ".join([genus,epithet]+([infra] if rank=="subspecies" and infra else []))
            if LATIN.fullmatch(reconstructed):
                scientific=reconstructed
        if not LATIN.fullmatch(scientific):continue
        if len(scientific.split())!=(2 if rank=="species" else 3):continue
        ident=field(row,"id","taxon_id")
        if not ident.isdecimal():continue
        records[ident]=(scientific,rank,field(row,"phylum"),field(row,"class"),
                        field(row,"order"),field(row,"family"))
    print("INAT_TAXA_PARSED",parsed,"ANIMAL_RANKED",len(records),flush=True)
    return records,parsed

def main():
    with tempfile.TemporaryDirectory(prefix="animagia-inat-") as td:
        path=Path(td)/"taxonomy.zip"
        sha,size=download(path)
        with zipfile.ZipFile(path) as z:
            names=z.namelist()
            candidates=[p for p in names if Path(p).name.lower() in ("taxa.csv","taxon.csv","taxa.txt","taxon.txt")]
            if not candidates:
                print("ZIP_TOP_ENTRIES",names[:50],flush=True)
                raise RuntimeError("Official iNaturalist taxonomy core file not found")
            taxon_file=min(candidates,key=len)
            taxa,parsed=taxon_info(z,taxon_file)
            vnfiles=[p for p in names if "vernacular" in Path(p).name.lower()
                and Path(p).suffix.lower() in (".csv",".txt",".tsv")]
            if not vnfiles:
                print("ZIP_TOP_ENTRIES",names[:50],flush=True)
                raise RuntimeError("Official iNaturalist vernacular export not found")
            # File names can be split by locale; prefer Russian-only when present.
            russian_only=[p for p in vnfiles if "russian" in p.lower() or
                 re.search(r"(?:^|[-_.])ru(?:[-_.]|$)",p.lower())]
            selected=russian_only or vnfiles
            grouped=collections.defaultdict(set)
            counts=collections.Counter()
            for filename in selected:
                for row in readcsv(z,filename):
                    counts["vernacular_rows"]+=1
                    lang=field(row,"language","languageCode","lexicon").casefold()
                    lex=field(row,"lexicon").casefold()
                    if lang not in LANG and lex not in LANG:continue
                    ident=field(row,"taxon_id","taxonID","taxonId","id")
                    if ident not in taxa:continue
                    label=field(row,"vernacularName","name")
                    if not valid_name(label):continue
                    grouped[ident].add(label)
                    counts["russian_valid"]+=1
                print("INAT_VERNACULAR_FILE",filename,flush=True)
            by_scientific=collections.defaultdict(dict)
            conflicts=set()
            for ident,labels in grouped.items():
                if len(labels)!=1:
                    counts["ambiguous_lexicon_taxon"]+=1
                    continue
                scientific,rank,phylum,cls,order,family=taxa[ident]
                label=next(iter(labels))
                key=scientific.casefold()+"|"+rank
                entry=[label,phylum,cls,order,family,ident]
                if key in by_scientific and by_scientific[key].get("entry")!=entry[:5]:
                    # Different active taxon identifiers can share a binomial.
                    # Accept only the same Russian label and classification.
                    old=by_scientific[key]["entry"]
                    if old[:5]!=entry[:5]:conflicts.add(key)
                else:by_scientific[key]={"entry":entry}
            results={k:v["entry"] for k,v in by_scientific.items() if k not in conflicts}
            counts["ambiguous_scientific_taxon"]=len(conflicts)
            print("INAT_RU_STATS",dict(counts),"TOTAL_UNAMBIGUOUS",len(results),flush=True)
            if len(results)<1000:
                raise RuntimeError("Insufficient Russian names; check official CSV schema and lexicon fields")
            result={"source":"iNaturalist official taxonomy DarwinCore Archive, Russian lexicon",
                "retrieved":"2026-10-29","url":URL,"sha256":sha,"archive_bytes":size,
                "core_taxa_file":taxon_file,"vernacular_files":selected,
                "parsed_taxon_rows":parsed,"count":len(results),"counts":dict(counts),
                "names":dict(sorted(results.items()))}
            data=json.dumps(result,ensure_ascii=False,separators=(",",":"))+"\n"
            if len(data.encode())>35000000:raise RuntimeError("Snapshot exceeds 35 MB budget")
            OUT.write_text(data,encoding="utf-8")
            print("INAT_RU_SNAPSHOT_READY",len(results),"bytes",len(data.encode()),flush=True)

if __name__=="__main__":
    main()
