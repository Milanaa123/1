#!/usr/bin/env python3
"""Second-stage GBIF family lookup by accepted genus when exact species fails.

No genus is matched fuzzily. Exact accepted genus in the same kingdom/class
and order is required. Genus families are stored with independent provenance.
"""
import concurrent.futures as cf, collections, json, pathlib, time
import urllib.request,urllib.parse,urllib.error
ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=ROOT/'family_external_verified.json'
SOURCE='https://animagia-calculator.onrender.com/families_missing.json'
H={'User-Agent':'Animagia-genus-taxonomy-verification/1.0','Accept':'application/json'}

def get(url):
    with urllib.request.urlopen(urllib.request.Request(url,headers=H),timeout=20) as r:
        return json.load(r)

def ask(entry):
    name=entry['scientific_name'].split()[0]
    params={'name':name,'rank':'GENUS','kingdom':'Animalia','class':entry['class'],'strict':'true'}
    if entry['order']:params['order']=entry['order']
    u='https://api.gbif.org/v1/species/match?'+urllib.parse.urlencode(params)
    for a in range(3):
        try:d=get(u);break
        except (urllib.error.URLError,TimeoutError,ValueError):
            if a==2:return None,'request_error'
            time.sleep(1.5*(a+1))
    if d.get('matchType')!='EXACT':return None,'not_exact'
    if d.get('canonicalName','').casefold()!=name.casefold():return None,'genus_name_mismatch'
    if d.get('rank')!='GENUS' or d.get('status')!='ACCEPTED':return None,'rank_or_status'
    if d.get('kingdom')!='Animalia' or d.get('class')!=entry['class']:return None,'class_mismatch'
    if entry['order'] and d.get('order')!=entry['order']:return None,'order_mismatch'
    family=d.get('family','')
    if not isinstance(family,str) or not family.endswith('idae') or len(family)>150:return None,'no_family'
    return {'family':family,'class':entry['class'],'order':entry['order'],
       'phylum':d.get('phylum',''),'rank':entry['rank'],
       'matched_genus':name,'source_match_rank':'GENUS',
       'match_type':'EXACT','gbif_usage_key':d.get('usageKey')},'verified'

def main():
    snapshot=json.loads(OUT.read_text(encoding='utf-8'))
    report=get(SOURCE)
    remaining=[r for r in report['examples'] if r['scientific_name'] not in snapshot['families']]
    assert len(remaining)==snapshot['unresolved_count']==571,len(remaining)
    # One request for every distinct genus+taxonomic context; avoids repetitive API traffic.
    lookup={}
    for r in remaining:
        key=(r['scientific_name'].split()[0],r['class'],r['order'])
        lookup.setdefault(key,r)
    verified={};reject=collections.Counter()
    with cf.ThreadPoolExecutor(max_workers=5) as pool:
        results=list(pool.map(ask,lookup.values()))
    mapped=dict(zip(lookup.keys(),results))
    for i,r in enumerate(remaining,1):
        key=(r['scientific_name'].split()[0],r['class'],r['order'])
        evidence,reason=mapped[key]
        if evidence:verified[r['scientific_name']]=dict(evidence)
        else:reject[reason]+=1
    snapshot['genus_based_families']=dict(sorted(verified.items()))
    snapshot['genus_based_verified_count']=len(verified)
    snapshot['remaining_after_genus']=len(remaining)-len(verified)
    snapshot['genus_lookup_rejections']=dict(sorted(reject.items()))
    OUT.write_text(json.dumps(snapshot,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print('GBIF_EXACT_GENUS_RECOVERY',json.dumps({'unique_genus_queries':len(lookup),
      'additional_family_records':len(verified),
      'remaining':snapshot['remaining_after_genus'],
      'reasons':dict(reject)},ensure_ascii=False),flush=True)
    assert len(verified)+sum(reject.values())==len(remaining)
if __name__=='__main__':main()
