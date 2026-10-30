#!/usr/bin/env python3
"""Read the currently deployed CoL audit. Never invent taxonomy or names."""
import csv, hashlib, json, pathlib, sys, urllib.request
from datetime import datetime, timezone
BASE='https://animagia-calculator.onrender.com/'
DEST=pathlib.Path('qa-artifacts/taxonomy-review')
DEST.mkdir(parents=True,exist_ok=True)

def get_json(name):
    req=urllib.request.Request(BASE+name,headers={'User-Agent':'Animagia-taxonomy-audit/1.0','Accept':'application/json'})
    with urllib.request.urlopen(req,timeout=75) as response:
        body=response.read(8_000_001)
    if len(body)>8_000_000:
        raise ValueError('Audit exceeds safe size: '+name)
    return json.loads(body),hashlib.sha256(body).hexdigest()

meta,meta_sha=get_json('meta.json')
missing,missing_sha=get_json('families_missing.json')
catalog=meta.get('family_catalogue',{})
total=int(meta.get('unique_records',-1))
unresolved=int(catalog.get('family_missing',-1))
names=int(catalog.get('verified_species_common_names',-1))
if total<=0 or unresolved<0 or names<0 or names>total:
    raise AssertionError('Invalid published counts')
if unresolved!=missing.get('count'):
    raise AssertionError('Catalogue and diagnostic family totals differ')
examples=missing.get('examples')
if not isinstance(examples,list):
    raise AssertionError('Missing family diagnostic examples')
if len(examples)!=min(unresolved,4000):
    raise AssertionError('Expected one diagnostic example per missing family record')
keys=('scientific_name','rank','class','order')
seen=set()
for row in examples:
    if not isinstance(row,dict) or not all(isinstance(row.get(k),str) for k in keys):
        raise AssertionError('Malformed unresolved taxon entry')
    ident=(row['scientific_name'].casefold(),row['rank'])
    if ident in seen:
        raise AssertionError('Duplicate taxon: '+str(ident))
    seen.add(ident)
with (DEST/'unresolved-families.csv').open('w',encoding='utf-8-sig',newline='') as file:
    out=csv.DictWriter(file,fieldnames=keys)
    out.writeheader()
    out.writerows({k:row[k] for k in keys} for row in examples)
report={
 'method':'Read-only audit of actual published Animagia taxonomy files',
 'publication_url':BASE,'checked_utc':datetime.now(timezone.utc).isoformat(),
 'catalogue_version':meta.get('version'),'source':meta.get('source'),
 'source_hashes_sha256':{'meta.json':meta_sha,'families_missing.json':missing_sha},
 'records':total,'family_known':int(catalog.get('family_present',0)),
 'family_unresolved':unresolved,'distinct_families':catalog.get('distinct_families'),
 'verified_russian_species_names':names,'russian_names_unresolved':total-names,
 'unresolved_examples_exported':len(examples),
 'caveat':'No Russian names or families are invented. Remaining rows need independent evidence.'
}
(DEST/'audit-summary.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print('PUBLISHED_TAXONOMY_AUDIT_SUCCESS',json.dumps(report,ensure_ascii=False))
