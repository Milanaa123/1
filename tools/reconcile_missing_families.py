#!/usr/bin/env python3
"""Conservative, source-linked review of the exact taxa still missing families.
Read-only: candidates are never automatically published without lineage checks.
"""
import concurrent.futures,csv,json,os,pathlib,re,time,urllib.parse,urllib.request,urllib.error
from datetime import datetime,timezone
ROOT='https://animagia-calculator.onrender.com/'
OUT=pathlib.Path('qa-artifacts/unresolved-family-20261030')
OUT.mkdir(parents=True,exist_ok=True)
UA='Animagia-taxonomy-reconciliation/1.0 (scientific-source-validation)'
FAMILY=re.compile(r'^[A-Z][a-zA-Z-]+idae$')
CYR=re.compile(r'^[А-ЯЁа-яё][А-ЯЁа-яё\s\-–—().,«»]+$',re.U)
MARINE={'Echinoidea','Elasmobranchii','Asteroidea','Holothuroidea','Ophiuroidea','Holocephali','Teleostei','Malacostraca'}
PHYLA={'Echinoidea':'Echinodermata','Asteroidea':'Echinodermata',
 'Holothuroidea':'Echinodermata','Ophiuroidea':'Echinodermata',
 'Elasmobranchii':'Chordata','Holocephali':'Chordata','Teleostei':'Chordata',
 'Mammalia':'Chordata','Aves':'Chordata','Reptilia':'Chordata','Amphibia':'Chordata',
 'Insecta':'Arthropoda','Arachnida':'Arthropoda','Malacostraca':'Arthropoda'}
def fetch(url,retry=2):
    for i in range(retry+1):
        try:
            req=urllib.request.Request(url,headers={'User-Agent':UA,'Accept':'application/json'})
            with urllib.request.urlopen(req,timeout=18) as r:
                data=r.read(1_100_000)
            if len(data)>1_000_000:raise ValueError('Oversize JSON')
            return json.loads(data)
        except urllib.error.HTTPError as ex:
            if ex.code==404:return None
            if ex.code in (429,500,502,503) and i<retry:time.sleep(2**(i+1));continue
            return {'_error':'HTTP '+str(ex.code)}
        except Exception as ex:
            if i<retry:time.sleep(2**i);continue
            return {'_error':type(ex).__name__}
    return None
def align(name,row):
    return str(name or '').casefold()==row['scientific_name'].casefold()
def validate(taxon,row):
    # Keep rank, scientific name, class, order and phylum exactly aligned;
    # never assign a family from taxonomic appearance, genus alone or homonym.
    return (align(taxon.get('scientific_name'),row) and
       str(taxon.get('rank','')).lower()==row['rank'] and
       taxon.get('class')==row['class'] and
       (not row['order'] or taxon.get('order')==row['order']) and
       taxon.get('phylum')==PHYLA.get(row['class']) and
       bool(FAMILY.fullmatch(str(taxon.get('family') or ''))))
def inaturalist(row):
    name=row['scientific_name']
    url='https://api.inaturalist.org/v1/taxa?q='+urllib.parse.quote(name)+'&per_page=10&locale=ru'
    data=fetch(url)
    if not isinstance(data,dict) or '_error' in data:
        return {'source':'iNaturalist','name':name,'error':data.get('_error') if isinstance(data,dict) else 'no response'}
    unique=[x for x in data.get('results',[]) if isinstance(x,dict) and
        align(x.get('name'),row) and x.get('rank')==row['rank'] and
        x.get('is_active') is not False and type(x.get('id')) is int]
    if len(unique)!=1:return {'source':'iNaturalist','name':name,'status':'no_unique_exact'}
    taxon=unique[0]
    detail=fetch('https://api.inaturalist.org/v1/taxa/'+str(taxon['id']))
    if not isinstance(detail,dict) or not detail.get('results'):
        return {'source':'iNaturalist','name':name,'status':'missing_lineage'}
    item=detail['results'][0]
    ancestors=item.get('ancestors') or []
    rankmap={x.get('rank'):x.get('name') for x in ancestors if isinstance(x,dict)}
    rankmap['rank']=item.get('rank')
    rankmap['scientific_name']=item.get('name')
    # Genus may be attached to exact accepted species; family must be ancestor.
    result={'source':'iNaturalist','name':name,'taxon_id':taxon['id'],
            'source_url':'https://www.inaturalist.org/taxa/'+str(taxon['id']),
            'rank':item.get('rank'),'family':rankmap.get('family',''),
            'class':rankmap.get('class'),'order':rankmap.get('order'),
            'phylum':rankmap.get('phylum'),'scientific_name':item.get('name')}
    if validate(result,row):
        result['status']='strict_verified'
        common=str(taxon.get('preferred_common_name') or '').strip()
        if common and len(common)<=130 and CYR.fullmatch(common):
            result['russian_name_candidate']=common
    else:result['status']='lineage_conflict_or_missing'
    return result
def worms(row):
    name=row['scientific_name']
    url='https://www.marinespecies.org/rest/AphiaRecordsByName/'+urllib.parse.quote(name)+'?like=false&marine_only=false'
    data=fetch(url)
    if isinstance(data,dict) and '_error' in data:
        return {'source':'WoRMS','name':name,'error':data['_error']}
    matched=[x for x in (data if isinstance(data,list) else []) if
        isinstance(x,dict) and align(x.get('scientificname'),row) and
        str(x.get('rank') or '').lower()==row['rank'] and
        str(x.get('status') or '').lower()=='accepted' and
        type(x.get('AphiaID')) is int]
    if len(matched)!=1:return {'source':'WoRMS','name':name,'status':'no_unique_accepted_exact'}
    x=matched[0]
    item={'source':'WoRMS','name':name,'source_url':'https://www.marinespecies.org/aphia.php?p=taxdetails&id='+str(x['AphiaID']),
          'aphia_id':x['AphiaID'],'scientific_name':x.get('scientificname'),
          'family':x.get('family'),'phylum':x.get('phylum'),
          'class':x.get('class'),'order':x.get('order'),'rank':x.get('rank')}
    item['status']='strict_verified' if validate(item,row) else 'lineage_conflict_or_missing'
    return item

metadata=fetch(ROOT+'meta.json');missing=fetch(ROOT+'families_missing.json')
if not isinstance(metadata,dict) or not isinstance(missing,dict):
    raise ValueError('Live source metadata unavailable')
rows=missing['examples']
assert len(rows)==metadata['family_catalogue']['family_missing']==433
assert all(row.get('rank') in ('species','subspecies') for row in rows)
indexed={(r['scientific_name'],r['rank']):r for r in rows}
assert len(indexed)==len(rows)

def worker(job):
    source,row=job
    return (source,row,inaturalist(row) if source=='iNaturalist' else worms(row))
jobs=[('iNaturalist',row) for row in rows]+[
 ('WoRMS',row) for row in rows if row['class'] in MARINE]
outputs=[];errors=[];seen_by_taxon={}
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    for source,row,result in pool.map(worker,jobs):
        outputs.append(result)
        if 'error' in result:errors.append(result)
        if result.get('status')=='strict_verified':
            seen_by_taxon.setdefault((row['scientific_name'],row['rank']),[]).append(result)
verified={}
conflicts={}
for key,hits in sorted(seen_by_taxon.items()):
    families={h['family'] for h in hits}
    if len(families)!=1:
        conflicts[key[0]]=[{k:h.get(k) for k in ('source','family','source_url')} for h in hits]
        continue
    row=indexed[key]
    label_candidates={h['russian_name_candidate'] for h in hits if h.get('russian_name_candidate')}
    verified[key[0]]={
     'name':key[0], 'rank':key[1], 'class':row['class'], 'order':row['order'],
     'phylum':PHYLA[row['class']], 'family':next(iter(families)),
     'evidence':[{k:h.get(k) for k in ('source','source_url','taxon_id','aphia_id') if h.get(k) is not None} for h in hits],
     'russian_name_candidate':next(iter(label_candidates)) if len(label_candidates)==1 else ''
    }
summary={'source':'iNaturalist taxa v1 + WoRMS Aphia v1 direct live API strict exact lineage',
 'reviewed_at':datetime.now(timezone.utc).isoformat(),
 'base_site':ROOT,'base_missing_count':len(rows),
 'source_request_count':len(jobs),'source_errors':len(errors),
 'strict_family_candidates':len(verified),'conflicting_family_candidates':len(conflicts),
 'russian_candidate_count':sum(bool(z.get('russian_name_candidate')) for z in verified.values()),
 'families':verified,'conflicts':conflicts,'errors':errors}
(OUT/'source-reviewed-candidates.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
with (OUT/'strict-family-candidates.csv').open('w',newline='',encoding='utf-8-sig') as file:
    writer=csv.writer(file);writer.writerow(['scientific_name','rank','class','order','phylum','verified_family','rus_candidate','sources'])
    for val in verified.values():
        writer.writerow([val['name'],val['rank'],val['class'],val['order'],val['phylum'],
                         val['family'],val['russian_name_candidate'],';'.join(h['source_url'] for h in val['evidence'])])
print('FAMILY_REVIEW_COMPLETE',json.dumps({k:v for k,v in summary.items() if k not in ('families','conflicts','errors')},ensure_ascii=False),flush=True)
