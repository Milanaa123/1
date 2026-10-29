#!/usr/bin/env python3
"""One-time, conservative family recovery from the GBIF backbone.

Only rank/name EXACT ACCEPTED matches with the same class and (where present)
order are admitted. This file is reviewed automatically for exact taxonomy,
then committed as an immutable, inspectable snapshot rather than re-querying
GBIF for every deployment. Disagreements are reported, NOT guessed.
"""
import concurrent.futures as cf, collections, datetime, json, pathlib, time
import urllib.request,urllib.parse,urllib.error

ROOT=pathlib.Path(__file__).resolve().parents[1]
ENDPOINT='https://api.gbif.org/v1/species/match'
REPORT='https://animagia-calculator.onrender.com/families_missing.json'
OUT=ROOT/'family_external_verified.json'
HEADERS={'User-Agent':'Animagia-Research/1.0 (catalogue family verification)','Accept':'application/json'}

def get(url,timeout=18):
    request=urllib.request.Request(url,headers=HEADERS)
    with urllib.request.urlopen(request,timeout=timeout) as response:
        return json.load(response)

def fetch(entry):
    query={'name':entry['scientific_name'],'rank':entry['rank'].upper(),
           'kingdom':'Animalia','strict':'true','class':entry['class']}
    if entry['order']:
        query['order']=entry['order']
    url=ENDPOINT+'?'+urllib.parse.urlencode(query)
    for attempt in range(3):
        try:
            data=get(url)
            break
        except (urllib.error.URLError, TimeoutError, ValueError) as err:
            if attempt==2:return entry['scientific_name'],None,'request_error'
            time.sleep(1.2*(2**attempt))
    def issue(reason):
        return entry['scientific_name'],None,reason
    if data.get('matchType')!='EXACT':
        return issue('nonexact_'+str(data.get('matchType','none')))
    if data.get('canonicalName','').casefold()!=entry['scientific_name'].casefold():
        return issue('scientific_name_mismatch')
    if data.get('rank')!=entry['rank'].upper():
        return issue('rank_mismatch')
    if data.get('status')!='ACCEPTED':
        return issue('not_accepted')
    if data.get('kingdom')!='Animalia':
        return issue('kingdom_mismatch')
    if data.get('class')!=entry['class']:
        return issue('class_mismatch')
    if entry['order'] and data.get('order')!=entry['order']:
        return issue('order_mismatch')
    fam=data.get('family','')
    if not isinstance(fam,str) or not fam or len(fam)>150 or not fam.endswith('idae'):
        return issue('no_valid_family')
    return entry['scientific_name'],{
      'family':fam,'class':entry['class'],'order':entry['order'],'rank':entry['rank'],
      'phylum':data.get('phylum',''),'matched_name':data['canonicalName'],
      'match_type':data['matchType'],'gbif_confidence':data.get('confidence'),
      'gbif_usage_key':data.get('usageKey')
    },'verified'

def main():
    source=get(REPORT,timeout=35)
    rows=source['examples']
    assert len(rows)==source['count']==990, (len(rows),source['count'])
    accepted={};reject=collections.Counter()
    with cf.ThreadPoolExecutor(max_workers=5) as pool:
        for i,(name,match,reason) in enumerate(pool.map(fetch,rows),1):
            if match: accepted[name]=match
            else:reject[reason]+=1
            if i%100==0:print('MATCH_PROGRESS',i,'verified',len(accepted),flush=True)
    final={'source':'GBIF Species API v1 exact strict accepted matches',
      'base_source':'Catalogue of Life XR 2026-08-26',
      'reviewed_on':'2026-10-29',
      'original_unresolved':source['count'],
      'verified_count':len(accepted),
      'unresolved_count':source['count']-len(accepted),
      'rejection_reasons':dict(sorted(reject.items())),
      'families':dict(sorted(accepted.items()))}
    OUT.write_text(json.dumps(final,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print('EXTERNAL_GBIF_FAMILY_MATCH_SUMMARY',
       json.dumps({'verified_count':len(accepted),'unresolved_count':final['unresolved_count'],'reject':dict(reject)},ensure_ascii=False),flush=True)
    assert len(accepted)+sum(reject.values())==len(rows)
if __name__=='__main__':
    main()
