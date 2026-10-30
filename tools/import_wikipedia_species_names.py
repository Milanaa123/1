#!/usr/bin/env python3
"""Additional *attested* Russian species names: Wikidata scientific species,
with a real Russian Wikipedia article. No translation or transliteration.

A matching binomial is NOT enough to classify an organism as an animal.
The CoL catalogue build will later apply these labels only to its accepted
animal taxa, and only for species (never automatically for subspecies).
"""
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path
import hashlib,json,re,time,urllib.error,urllib.parse,urllib.request

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'russian_wikipedia_species_verified.json'
SOURCE='Wikidata P225 scientific species Q7432 + Russian Wikipedia article and Russian label (CC0)'
QID=re.compile(r'Q[1-9][0-9]{0,11}\Z')
SCIENTIFIC=re.compile(r'[A-Z][a-z-]+ [a-z-]+\Z')
RUSSIAN=re.compile(r"[А-ЯЁа-яё][А-ЯЁа-яё\s.,'’()\-–—«»]+\Z")
SIZE=1000
PAGES=12
BASE='''PREFIX wdt: <http://www.wikidata.org/prop/direct/>
PREFIX wd: <http://www.wikidata.org/entity/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX schema: <http://schema.org/>
SELECT DISTINCT ?taxon ?latin ?ru ?article WHERE {
 ?article schema:about ?taxon ;
          schema:isPartOf <https://ru.wikipedia.org/> .
 ?taxon wdt:P105 wd:Q7432 ;
        wdt:P225 ?latin ;
        rdfs:label ?ru .
 FILTER(LANG(?ru) = "ru")
}'''
def fetch(offset):
    query=BASE+f' LIMIT {SIZE} OFFSET {offset}'
    url='https://query.wikidata.org/sparql?'+urllib.parse.urlencode({'query':query,'format':'json'})
    req=urllib.request.Request(url,headers={
      'Accept':'application/sparql-results+json',
      'Accept-Encoding':'identity',
      'User-Agent':'AnimagiaScientificRussianSpecies/1.0 (GitHub Milanaa123/1; sources cited)'})
    for attempt in range(2):
        try:
            with urllib.request.urlopen(req,timeout=75) as r:
                raw=r.read(5_000_001)
            if len(raw)>5_000_000:raise ValueError('SPARQL response is unexpectedly large')
            obj=json.loads(raw)
            result=obj['results']['bindings']
            if not isinstance(result,list):raise ValueError('Invalid SPARQL results')
            return (offset,result,'')
        except (urllib.error.URLError,TimeoutError,ValueError,KeyError,TypeError) as e:
            if attempt==0:
                time.sleep(3)
                continue
            return (offset,[],type(e).__name__+': '+str(e)[:100])
def extract(raw):
    try:
        scientific=raw['latin']['value'].strip()
        russian=raw['ru']['value'].strip()
        qid=raw['taxon']['value'].rsplit('/',1)[-1]
        page=raw['article']['value']
    except (TypeError,KeyError,AttributeError):
        return None
    if (not SCIENTIFIC.fullmatch(scientific)
        or not RUSSIAN.fullmatch(russian)
        or not 3<=len(russian)<=130
        or not QID.fullmatch(qid)
        or not page.startswith('https://ru.wikipedia.org/wiki/')
        or len(page)>650
        or raw['ru'].get('xml:lang','ru')!='ru'):
        return None
    return scientific.casefold()+'|species',(russian,qid,page)
def main():
    previous={}
    if OUT.exists():
        old=json.loads(OUT.read_text(encoding='utf8'))
        if old.get('source')!=SOURCE or old.get('count')!=len(old.get('names',{})):
            raise ValueError('Old Wikidata/Wikipedia snapshot is untrusted')
        previous=old['names']
    entries=defaultdict(set)
    errors={}
    total=0
    offsets=[]
    with ThreadPoolExecutor(max_workers=3) as pool:
        for offset,rows,error in sorted(pool.map(fetch,range(0,PAGES*SIZE,SIZE))):
            if error:
                errors[str(offset)]=error
                print('RUSSIAN_WIKIPEDIA_PAGE_ERROR',offset,error,flush=True)
                continue
            offsets.append(offset)
            total+=len(rows)
            for obj in rows:
                item=extract(obj)
                if item:entries[item[0]].add(item[1])
            print('RUSSIAN_WIKIPEDIA_PAGE',offset,'rows',len(rows),
                  'valid_species_keys',len(entries),flush=True)
    new={}
    ambiguous={}
    for key,records in sorted(entries.items()):
        labelset={x[0] for x in records}
        qidset={x[1] for x in records}
        if len(labelset)!=1 or len(qidset)!=1:
            ambiguous[key]=len(records)
            continue
        row=next(iter(records))
        if key in previous and previous[key]!=list(row):
            ambiguous[key]=len(records)
            continue
        new[key]=list(row)
    merged={**previous,**new}
    if not offsets and not previous:
        raise RuntimeError('No source queries succeeded; do not publish empty snapshot')
    result={
      'source':SOURCE,'source_url':'https://www.wikidata.org',
      'source_rank':'Wikidata P105=Q7432 (species only)',
      'retrieved_utc':datetime.now(timezone.utc).isoformat(),
      'license':'Wikidata CC0; article link used for verification, article text not copied',
      'attempted_pages':PAGES,'page_size':SIZE,
      'completed_offsets':offsets,'failed_offsets':errors,
      'queried_rows':total,'ambiguous_binomials_rejected':len(ambiguous),
      'count':len(merged),'names':dict(sorted(merged.items()))
    }
    body=json.dumps(result,ensure_ascii=False,separators=(',',':'))+'\n'
    if len(body.encode('utf8'))>9_000_000:raise ValueError('Snapshot unexpectedly large')
    OUT.write_text(body,encoding='utf8')
    print('WIKIPEDIA_RUSSIAN_SPECIES_SNAPSHOT',
          json.dumps({k:v for k,v in result.items() if k!='names'},ensure_ascii=False),
          'sha256',hashlib.sha256(body.encode('utf8')).hexdigest(),flush=True)
if __name__=='__main__':main()
