#!/usr/bin/env python3
"""Independent Open Tree of Life family verification of unresolved CoL taxa.

Strict evidence: non-fuzzy accepted exact scientific name, exact rank and
matching phylum/class/order. OpenTree results are evidence, not overrides of
contradictory or uncertain taxonomy.
"""
import concurrent.futures as cf, collections, json, pathlib, time
import urllib.request,urllib.error
ROOT=pathlib.Path(__file__).resolve().parents[1]
REPORT='https://animagia-calculator.onrender.com/families_missing.json'
ENDPOINT='https://api.opentreeoflife.org/v3/'
OUT=ROOT/'family_opentree_verified.json'
HEADERS={'Accept':'application/json','Content-Type':'application/json',
 'User-Agent':'Animagia-Taxonomy-Evidence/1.0'}

def read_json(url,payload=None,tries=2):
    raw=None if payload is None else json.dumps(payload).encode('utf8')
    for trial in range(tries):
        try:
            req=urllib.request.Request(url,data=raw,headers=HEADERS)
            with urllib.request.urlopen(req,timeout=40) as response:
                return json.load(response)
        except (OSError,ValueError,TimeoutError) as error:
            if trial==tries-1:raise
            time.sleep(1+trial)

def chunks(items,n):
    for i in range(0,len(items),n):
        yield items[i:i+n]

def exact_names(rows):
    good={}
    skipped=collections.Counter()
    for part in chunks(rows,85):
        names=[r['scientific_name'] for r in part]
        try:
            data=read_json(ENDPOINT+'tnrs/match_names',dict(names=names,
              context_name='Animals',do_approximate_matching=False,
              include_deprecated=False,include_dubious=False))
        except (OSError,ValueError,TimeoutError) as error:
            skipped['tnrs_request_error']+=len(part)
            print('OPENTREE_TNRS_ERROR',type(error).__name__,flush=True)
            continue
        by_name={x['scientific_name']:x for x in part}
        checked=set()
        for record in data.get('results',[]):
            name=record.get('name','')
            row=by_name.get(name)
            if not row:continue
            checked.add(name)
            candidates=[]
            for candidate in record.get('matches',[]):
                tax=candidate.get('taxon',{})
                if (candidate.get('is_approximate_match') is False and
                    candidate.get('is_synonym') is False and
                    tax.get('rank')==row['rank'] and
                    str(tax.get('name','')).casefold()==name.casefold() and
                    str(candidate.get('matched_name','')).casefold()==name.casefold() and
                    isinstance(tax.get('ott_id'),int)):
                    candidates.append(tax['ott_id'])
            if len(set(candidates))==1:good[name]=(row,candidates[0])
            else:skipped['non_unique_exact']+=1
        skipped['unmatched']+=len(set(names)-checked)
        print('OPENTREE_TNRS_PROGRESS',len(good),sum(skipped.values()),flush=True)
    return good,skipped

def lineage_family(item):
    name,(row,ott)=item
    try:
        data=read_json(ENDPOINT+'taxonomy/taxon_info',
         dict(ott_id=ott,include_lineage=True,include_children=False))
    except (OSError,ValueError,TimeoutError):
        return name,None,'taxon_request_error'
    if data.get('is_suppressed') or data.get('rank')!=row['rank'] or (
         str(data.get('name','')).casefold()!=name.casefold()):
        return name,None,'not_exact_accepted'
    ancestors={}
    for piece in data.get('lineage',[]):
        rank=piece.get('rank','')
        if rank and rank not in ancestors:
            ancestors[rank]=piece.get('name','')
    for field in ('phylum','class','order'):
        expected=row.get(field,'')
        if expected and ancestors.get(field)!=expected:
            return name,None,'lineage_'+field+'_mismatch'
    family=ancestors.get('family','')
    if (not isinstance(family,str) or not family.endswith('idae') or
        len(family)>150 or not family[0].isupper() or not family.isascii()):
        return name,None,'missing_family'
    return name,{'name':name,'rank':row['rank'],'class':row['class'],
     'order':row['order'],'phylum':ancestors.get('phylum',''),
     'family':family,'ott_id':ott,'match_type':'exact_non_synonym',
     'source':'OpenTree v3 strict exact taxonomy'},'verified'

def main():
    report=read_json(REPORT)
    rows=report['examples']
    assert report['count']==len(rows) and report['count']<=2000
    matches,rejects=exact_names(rows)
    accepted={}
    with cf.ThreadPoolExecutor(max_workers=3) as pool:
        for i,(name,result,reason) in enumerate(pool.map(lineage_family,matches.items()),1):
            if result:accepted[name]=result
            else:rejects[reason]+=1
            if i%75==0:print('OPENTREE_HIERARCHIES',i,'verified',len(accepted),flush=True)
    output={'source':'OpenTree v3 strict exact taxonomy',
      'source_url':ENDPOINT,'source_taxonomy':'Catalogue of Life XR 2026-08-26',
      'initial_missing':len(rows),'verified_count':len(accepted),
      'remaining':len(rows)-len(accepted),
      'rejection_reasons':dict(sorted(rejects.items())),
      'families':dict(sorted(accepted.items()))}
    assert len(accepted)<=len(rows)
    OUT.write_text(json.dumps(output,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    print('OPENTREE_FAMILY_VERIFICATION',json.dumps({
      'verified':len(accepted),'remaining':output['remaining'],
      'rejected':dict(rejects)},ensure_ascii=False),flush=True)
if __name__=='__main__':main()
