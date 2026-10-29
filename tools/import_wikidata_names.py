#!/usr/bin/env python3
"""Expand attested Russian species names from Wikidata (CC0), page by page.

Only Wikidata records explicitly marked species (P105=Q7432), with an exact
Latin scientific binomial P225 and an actual Cyrillic Russian-language label,
are accepted. Existing validated labels are preserved. The database build
matches only exact scientific names already present in the animal catalogue;
no translation, interpolation or genus-wide copying is performed.
"""
from __future__ import annotations
import collections
import hashlib
import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"russian_wikidata_snapshot.json"
SOURCE="Wikidata CC0 species rank Q7432; Russian language labels"
QUERY_PREFIX='''PREFIX wdt: <http://www.wikidata.org/prop/direct/>
PREFIX wd: <http://www.wikidata.org/entity/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
'''
QUERY_BODY='''SELECT ?taxon ?scientific ?ru WHERE {
 ?taxon wdt:P105 wd:Q7432 .
 ?taxon wdt:P225 ?scientific .
 ?taxon rdfs:label ?ru .
 FILTER(LANG(?ru) = "ru")
}'''
RUSSIAN=re.compile(r"^[А-ЯЁа-яё][А-ЯЁа-яё\s.,'’()\-–—«»]+$")
BINOMIAL=re.compile(r"^[A-Z][a-z-]+ [a-z-]+$")
QID=re.compile(r"Q[1-9][0-9]{0,11}")
PAGE_SIZE=2000
MAX_PAGES=16
MAX_DATA_BYTES=6500000

def fetch_page(offset):
    query=QUERY_PREFIX+QUERY_BODY+f" LIMIT {PAGE_SIZE} OFFSET {offset}"
    url="https://query.wikidata.org/sparql?"+urllib.parse.urlencode({
        "query":query,"format":"json"})
    req=urllib.request.Request(url,headers={
        "Accept":"application/sparql-results+json",
        "User-Agent":"AnimagiaEducationalTaxonNames/2.0 (GitHub repository Milanaa123/1)",
        "Accept-Encoding":"identity"})
    for attempt in range(2):
        try:
            with urllib.request.urlopen(req,timeout=85) as response:
                raw=response.read(MAX_DATA_BYTES+1)
                if len(raw)>MAX_DATA_BYTES:
                    raise ValueError("Wikidata response exceeded size limit")
                payload=json.loads(raw)
            bindings=payload["results"]["bindings"]
            if not isinstance(bindings,list):
                raise ValueError("Unexpected SPARQL result")
            return bindings
        except (urllib.error.URLError,TimeoutError,ValueError,KeyError,TypeError) as e:
            print("WIKIDATA_PAGE_ERROR",offset,type(e).__name__,str(e)[:170],flush=True)
            if attempt==0: time.sleep(5)
    return None

def valid(r):
    try:
        taxon=r["taxon"]["value"].rsplit("/",1)[-1]
        latin=r["scientific"]["value"].strip()
        label=r["ru"]["value"].strip()
        lang=r["ru"].get("xml:lang","ru").lower()
    except (KeyError,TypeError,AttributeError):
        return None
    if not QID.fullmatch(taxon) or not BINOMIAL.fullmatch(latin):
        return None
    if lang!="ru" or len(label)<3 or len(label)>130:
        return None
    if not RUSSIAN.fullmatch(label):
        return None
    return latin.casefold(),label,taxon

def main():
    start=time.monotonic()
    previous=json.loads(OUT.read_text(encoding="utf8"))
    assert previous["source"]==SOURCE
    assert previous["count"]==len(previous["names"])
    verified=dict(previous["names"])
    collisions=set()
    stats=collections.Counter()
    completed=[]
    for page in range(MAX_PAGES):
        offset=page*PAGE_SIZE
        records=fetch_page(offset)
        if records is None:
            print("WIKIDATA_PARTIAL_STOP",offset,flush=True)
            break
        completed.append(offset)
        stats["raw_rows"]+=len(records)
        grouped=collections.defaultdict(dict)
        for row in records:
            entry=valid(row)
            if not entry:
                stats["rejected"]+=1
                continue
            latin,label,qid=entry
            grouped[latin][label]=qid
        for latin,labels in grouped.items():
            if len(labels)>1:
                collisions.add(latin)
                stats["conflicting_labels"]+=1
                continue
            label,qid=next(iter(labels.items()))
            old=verified.get(latin)
            if old and old[0]!=label:
                collisions.add(latin)
                stats["different_from_prior"]+=1
                continue
            if not old:
                verified[latin]=[label,qid]
                stats["new_unique_names"]+=1
        print("WIKIDATA_PAGE",offset,"ROWS",len(records),
              "TOTAL",len(verified),"ADDED",stats["new_unique_names"],flush=True)
        if len(records)<PAGE_SIZE:
            stats["fully_exhausted"]=1
            break
        time.sleep(0.7)
    # Prevent incorrect labels for binomials where authoritative records
    # actually disagree. Do not discard existing names solely because a
    # separate future Wikidata record differs; retain prior curated mappings.
    for latin in collisions:
        if latin not in previous["names"]:
            verified.pop(latin,None)
    result={
        "source":SOURCE,"source_url":"https://www.wikidata.org",
        "license":"CC0","retrieved":"2026-10-29",
        "query_limit":MAX_PAGES*PAGE_SIZE,
        "queried_rows":stats["raw_rows"],
        "completed_offsets":completed,
        "new_names_added_in_second_page":stats["new_unique_names"],
        "count":len(verified),
        "rejected":dict(stats),
        "names":dict(sorted(verified.items()))}
    blob=json.dumps(result,ensure_ascii=False,separators=(",",":"))+"\n"
    assert len(verified)>=previous["count"]
    assert len(blob.encode())<10000000
    OUT.write_text(blob,encoding="utf8")
    print("WIKIDATA_RUSSIAN_LABELS_READY",
          json.dumps({k:v for k,v in result.items() if k!="names"},ensure_ascii=False),
          "elapsed",round(time.monotonic()-start,1),
          "sha256",hashlib.sha256(blob.encode()).hexdigest(),flush=True)

if __name__=="__main__":main()
