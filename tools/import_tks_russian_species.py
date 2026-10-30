#!/usr/bin/env python3
"""Import sourced Russian names of accepted animal species from the public
Russian Taxonomy TKS catalogue; no translation or Latin transliteration.

The provider explicitly offers a has_ru_name filter and public search API.
We request its Russian-named *Animalia species only*, keep a modest request
rate, and require a complete, consistent pagination snapshot.
Taxonomic lineage is rechecked against Catalogue of Life by ru_catalog.py.
"""
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime,timezone
from pathlib import Path
from threading import Lock
import collections,hashlib,json,re,time,urllib.request,urllib.parse,urllib.error

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'russian_tks_verified_species.json'
BASE='https://taxonomy.polevoy-vorobey.ru'
SIZE=200
SCIENTIFIC=re.compile(r'[A-Z][a-z-]+ [a-z-]+\Z')
RUSSIAN=re.compile(r"[А-ЯЁа-яё][А-ЯЁа-яё\s.,'’()\-–—«»]+\Z")
_LOCK=Lock()
_LAST=[0.0]
def throttle():
    with _LOCK:
        delay=max(0,0.65-(time.monotonic()-_LAST[0]))
        if delay:time.sleep(delay)
        _LAST[0]=time.monotonic()
def page(offset):
    url=BASE+'/api/taxa?'+urllib.parse.urlencode({
        'kingdom':'Animalia','rank':'species','has_ru_name':'true',
        'hide_subspecies':'true','limit':SIZE,'offset':offset})
    for attempt in range(3):
        try:
            throttle()
            req=urllib.request.Request(url,headers={
                'User-Agent':'Animagia-Scientific-Russian-Names/1.0 (community project; source links preserved)',
                'Accept':'application/json'})
            with urllib.request.urlopen(req,timeout=45) as response:
                body=response.read(330_000)
            if len(body)>=330_000:raise ValueError('Unexpected API payload size')
            data=json.loads(body)
            if not isinstance(data,dict) or not isinstance(data.get('results'),list):
                raise ValueError('Invalid API page response')
            if data.get('offset')!=offset or data.get('limit')!=SIZE:
                raise ValueError('Unexpected pagination')
            return offset,data,''
        except (urllib.error.HTTPError,urllib.error.URLError,TimeoutError,ValueError) as error:
            if attempt<2:time.sleep(2**(attempt+1));continue
            return offset,None,type(error).__name__+': '+str(error)[:125]
    return offset,None,'failed'
def validate(item):
    if (not isinstance(item,dict)
        or item.get('kingdom')!='Animalia'
        or item.get('taxon_rank')!='species'
        or item.get('is_accepted') is not True
        or item.get('status')!='accepted'
        or item.get('is_homonym') is True):
        return None
    latin=item.get('canonical_name')
    russian=item.get('taxon_name_ru')
    if (not isinstance(latin,str) or not SCIENTIFIC.fullmatch(latin)
        or not isinstance(russian,str) or not 3<=len(russian)<=130
        or not RUSSIAN.fullmatch(russian)):
        return None
    taxon_id=item.get('ru_taxon_id')
    if type(taxon_id) is not int or taxon_id<=0:return None
    phylum=item.get('phylum') or ''
    cl=item.get('class_name') or ''
    order=item.get('order_name') or ''
    family=item.get('family') or ''
    if not phylum or not order or not family:return None
    if (item.get('accepted_id') is not None or
        not isinstance(phylum,str) or not isinstance(cl,str)
        or not isinstance(order,str) or not isinstance(family,str)):
        return None
    # Persist actual identifiers so every candidate can be verified against
    # provider's source page and linked GBIF/iNaturalist accepted taxonomy.
    gbif=item.get('gbif_taxon_id')
    inat=item.get('inat_taxon_id')
    if (not(type(gbif) is int and gbif>0)
        and not(type(inat) is int and inat>0)):
        return None
    return latin.casefold()+'|species',[
        russian,phylum,cl,order,family,taxon_id,
        gbif if type(gbif) is int and gbif>0 else None,
        inat if type(inat) is int and inat>0 else None
    ]

def main():
    _,first,error=page(0)
    if error:raise RuntimeError('Russian taxonomy first page unavailable: '+error)
    total=first.get('total')
    if type(total) is not int or not 10000<=total<=300000:
        raise ValueError('Unexpected Russian animal species total: '+str(total))
    offsets=list(range(SIZE,total,SIZE))
    docs=[(0,first)]
    failures={}
    with ThreadPoolExecutor(max_workers=3) as pool:
        for off,doc,err in pool.map(page,offsets):
            if err:failures[off]=err
            else:docs.append((off,doc))
            if len(docs)%35==0:
                print('TKS_RU_PROGRESS',len(docs),'of',(total+SIZE-1)//SIZE,flush=True)
    if failures:
        raise RuntimeError('Source fetch incomplete; do not publish partial names: '+repr(list(failures.items())[:5]))
    docs.sort()
    if sum(len(p['results']) for _,p in docs)!=total:
        raise ValueError('Source pagination count mismatch; refuse incomplete import')
    grouped=collections.defaultdict(set)
    discarded=collections.Counter()
    for offset,data in docs:
        if data.get('total')!=total:
            raise ValueError('Provider changed total during import; retry complete snapshot')
        if offset+SIZE<=total and len(data['results'])!=SIZE:
            raise ValueError('Truncated page at '+str(offset))
        for row in data['results']:
            item=validate(row)
            if not item:
                discarded['invalid_or_unverified_source']+=1
                continue
            grouped[item[0]].add(json.dumps(item[1],ensure_ascii=False,separators=(',',':')))
    clean={}
    for key,variants in sorted(grouped.items()):
        # Only one unambiguous accepted taxon and Russian name per exact species.
        if len(variants)!=1:
            discarded['ambiguous_name_or_taxonomy']+=1
            continue
        clean[key]=json.loads(next(iter(variants)))
    if len(clean)<3000:raise ValueError('Unexpectedly sparse complete Russian species import')
    result={
      'source':'Russian Taxonomy TKS: exact accepted Russian-named Animalia species',
      'source_url':BASE,'retrieved_utc':datetime.now(timezone.utc).isoformat(),
      'source_endpoint':'/api/taxa?kingdom=Animalia&rank=species&has_ru_name=true',
      'source_license_note':'Published common names from iNaturalist, Wikidata, Wikipedia and Red Book; preserve TKS and linked-source citations',
      'source_total':total,'queried_pages':len(docs),'page_size':SIZE,
      'rejected':dict(discarded),'count':len(clean),'names':clean
    }
    body=json.dumps(result,ensure_ascii=False,separators=(',',':'))+'\n'
    if len(body.encode())>18000000:raise ValueError('Unexpectedly large name archive')
    OUT.write_text(body,encoding='utf8')
    print('TKS_RUSSIAN_SPECIES_SNAPSHOT_COMPLETE',
          json.dumps({k:v for k,v in result.items() if k!='names'},ensure_ascii=False),
          'sha256',hashlib.sha256(body.encode()).hexdigest(),flush=True)
if __name__=='__main__':main()
