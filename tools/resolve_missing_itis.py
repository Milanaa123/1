#!/usr/bin/env python3
"""Verify still-unclassified taxa against exact ITIS accepted-name hierarchies."""
import concurrent.futures as cf, collections, json, pathlib, time
import urllib.parse,urllib.request,urllib.error
ROOT=pathlib.Path(__file__).resolve().parents[1]
REPORT='https://animagia-calculator.onrender.com/families_missing.json'
OUT=ROOT/'family_itis_verified.json'
HEADERS={'User-Agent':'Animagia-Independent-Taxonomy-Validation/1.0'}

def get(url):
    with urllib.request.urlopen(urllib.request.Request(url,headers=HEADERS),timeout=22) as r:
        return json.load(r)

def query(row):
    name=row['scientific_name']
    q='nameWInd:"'+name+'"'
    params={'q':q,'wt':'json','rows':'5',
      'fl':'nameWInd,usage,rank,kingdom,hierarchySoFarWRanks'}
    url='https://services.itis.gov/?'+urllib.parse.urlencode(params)
    for attempt in range(3):
        try:
            response=get(url).get('response',{})
            break
        except (urllib.error.URLError,ValueError,TimeoutError) as e:
            if attempt==2:return name,None,'request_error'
            time.sleep(1.0*(attempt+1))
    docs=[d for d in response.get('docs',[])
      if d.get('nameWInd','').casefold()==name.casefold() and
      d.get('rank','').casefold()==row['rank'].casefold() and
      d.get('kingdom')=='Animalia' and d.get('usage') in ('valid','accepted')]
    if len(docs)!=1:return name,None,'not_unique_valid'
    doc=docs[0]
    paths=doc.get('hierarchySoFarWRanks') or []
    if len(paths)!=1:return name,None,'no_unique_hierarchy'
    tree={}
    for piece in paths[0].split('$'):
        if ':' in piece:
            key,value=piece.split(':',1)
            tree[key.strip().casefold()]=value.strip()
    if tree.get('class')!=row['class']:return name,None,'class_mismatch'
    if row['order'] and tree.get('order')!=row['order']:
        return name,None,'order_mismatch'
    family=tree.get('family','')
    if not family.endswith('idae') or len(family)>150:return name,None,'no_family'
    return name,{'family':family,'rank':row['rank'],
       'class':row['class'],'order':row['order'],
       'phylum':tree.get('phylum',''),'name':name,
       'source':'ITIS Solr exact valid hierarchy'},'verified'

def main():
    report=get(REPORT)
    assert report['count']==459,len(report['examples'])
    accepted={};skipped=collections.Counter()
    with cf.ThreadPoolExecutor(max_workers=5) as pool:
        for i,(name,result,reason) in enumerate(pool.map(query,report['examples']),1):
            if result:accepted[name]=result
            else:skipped[reason]+=1
            if i%100==0:print('ITIS_PROGRESS',i,'verified',len(accepted),flush=True)
    data={'source':'ITIS Solr exact accepted taxonomy',
      'source_url':'https://services.itis.gov/',
      'taxon_source':'Catalogue of Life XR 2026-08-26',
      'verified_on':'2026-10-29',
      'initial_missing':report['count'],
      'verified_count':len(accepted),
      'remaining':report['count']-len(accepted),
      'rejected':dict(sorted(skipped.items())),
      'families':dict(sorted(accepted.items()))}
    OUT.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    assert len(accepted)+sum(skipped.values())==report['count']
    print('ITIS_EXACT_FAMILY_SUMMARY',json.dumps({
      'verified':len(accepted),'remaining':data['remaining'],
      'rejected':dict(skipped)},ensure_ascii=False),flush=True)
if __name__=='__main__':main()
