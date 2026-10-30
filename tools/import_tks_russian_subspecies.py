#!/usr/bin/env python3
"""Complete-source review of explicitly named *accepted* animal subspecies.

This does not synthesize a subspecies' Russian name from its parent species.
Every string is recorded as the preferred Russian name of that exact
accepted TKS subspecies, with its independent GBIF/iNaturalist identifier.
"""
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime,timezone
from pathlib import Path
import collections,hashlib,json,re,time,urllib.request,urllib.parse,urllib.error,threading

BASE='https://taxonomy.polevoy-vorobey.ru'
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'russian_tks_verified_subspecies.json'
SCIENTIFIC=re.compile(r'[A-Z][a-z-]+ [a-z-]+ [a-z-]+\Z')
RUSSIAN=re.compile(r"[А-ЯЁа-яё][А-ЯЁа-яё\s.,'’()\-–—«»]+\Z")
SIZE=200
_LAST=[0.0];_LOCK=threading.Lock()

def page(offset):
    url=BASE+'/api/taxa?'+urllib.parse.urlencode({
        'kingdom':'Animalia','rank':'subspecies','has_ru_name':'true',
        'hide_subspecies':'false','limit':SIZE,'offset':offset})
    for attempt in range(3):
        try:
            with _LOCK:
                delay=max(0,.72-(time.monotonic()-_LAST[0]))
                if delay:time.sleep(delay)
                _LAST[0]=time.monotonic()
            req=urllib.request.Request(url,headers={
              'Accept':'application/json',
              'User-Agent':'Animagia-Science-Russian-Subspecies/1.0 (non-commercial; references preserved)'})
            with urllib.request.urlopen(req,timeout=45) as response:
                blob=response.read(370000)
            if len(blob)>=370000:raise ValueError('Source payload exceeds page limit')
            payload=json.loads(blob)
            if not isinstance(payload,dict) or payload.get('offset')!=offset or payload.get('limit')!=SIZE or not isinstance(payload.get('results'),list):
                raise ValueError('Unexpected source pagination')
            return offset,payload,''
        except (urllib.error.URLError,TimeoutError,ValueError) as e:
            if attempt<2:time.sleep(2**attempt+1);continue
            return offset,None,type(e).__name__+': '+str(e)[:125]

def clean(row):
    if (not isinstance(row,dict) or row.get('kingdom')!='Animalia' or
        row.get('taxon_rank')!='subspecies' or row.get('status')!='accepted' or
        row.get('is_accepted') is not True or row.get('is_homonym') is True or
        row.get('accepted_id') is not None):
        return None
    latin=row.get('canonical_name','')
    ru=row.get('taxon_name_ru','')
    if (not isinstance(latin,str) or not SCIENTIFIC.fullmatch(latin) or
        not isinstance(ru,str) or not 3<=len(ru)<=130 or not RUSSIAN.fullmatch(ru)):
        return None
    source_id=row.get('ru_taxon_id')
    if type(source_id) is not int or source_id<=0:return None
    phylum=row.get('phylum') or ''
    cl=row.get('class_name') or ''
    order=row.get('order_name') or ''
    family=row.get('family') or ''
    if not phylum or not family or not isinstance(cl,str) or not isinstance(order,str):
        return None
    gbif=row.get('gbif_taxon_id')
    inat=row.get('inat_taxon_id')
    if not(type(gbif) is int and gbif>0 or type(inat) is int and inat>0):
        return None
    return latin.casefold()+'|subspecies',[
        ru,phylum,cl,order,family,source_id,
        gbif if type(gbif) is int and gbif>0 else None,
        inat if type(inat) is int and inat>0 else None]

def main():
    _,first,error=page(0)
    if error:raise RuntimeError('First source page failed: '+error)
    total=first.get('total')
    if type(total) is not int or not 10000<=total<=100000:
        raise ValueError('Unexpected source total '+repr(total))
    requested=list(range(SIZE,total,SIZE))
    pages=[(0,first)]; errors={}
    with ThreadPoolExecutor(max_workers=3) as pool:
        for off,data,error in pool.map(page,requested):
            if error:errors[off]=error
            else:pages.append((off,data))
            if len(pages)%25==0:print('TKS_SUBSPECIES_PROGRESS',len(pages),'of',(total+SIZE-1)//SIZE,flush=True)
    if errors:raise RuntimeError('Incomplete trusted source pagination: '+repr(list(errors.items())[:6]))
    if sum(len(data['results']) for _,data in pages)!=total:
        raise ValueError('Missing source rows')
    variants=collections.defaultdict(set)
    dropped=collections.Counter()
    for off,doc in pages:
        if doc.get('total')!=total:raise ValueError('Source changed during pagination')
        for record in doc['results']:
            item=clean(record)
            if item is None:dropped['unverified_or_missing_taxonomy']+=1
            else:variants[item[0]].add(json.dumps(item[1],ensure_ascii=False,separators=(',',':')))
    names={}
    for key,values in variants.items():
        if len(values)!=1:
            dropped['ambiguous_exact_taxon']+=1
            continue
        names[key]=json.loads(next(iter(values)))
    if len(names)<1000:raise ValueError('Suspiciously few distinct accepted subspecies')
    result={
       'source':'Russian Taxonomy TKS: exact accepted Russian-named Animalia subspecies',
       'source_url':BASE,
       'retrieved_utc':datetime.now(timezone.utc).isoformat(),
       'source_total':total,'pages':len(pages),'page_size':SIZE,
       'rejected':dict(dropped),'count':len(names),
       'names':dict(sorted(names.items()))
    }
    payload=json.dumps(result,ensure_ascii=False,separators=(',',':'))+'\n'
    if len(payload.encode('utf8'))>15000000:raise ValueError('Unexpected archive size')
    OUT.write_text(payload,encoding='utf8')
    print('TKS_RUSSIAN_SUBSPECIES_COMPLETE',
       json.dumps({k:v for k,v in result.items() if k!='names'},ensure_ascii=False),
       'sha256',hashlib.sha256(payload.encode()).hexdigest(),flush=True)
if __name__=='__main__':main()
