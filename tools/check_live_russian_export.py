#!/usr/bin/env python3
"""Independent HTTP QA of the published Russian-only animal registry.

Checks that every row in the downloadable CSV has a real Russian name and
that the full CSV matches the independently published index manifest.
"""
import csv,hashlib,io,json,re,urllib.request
BASE='https://animagia-calculator.onrender.com/'
def fetch(name,max_bytes):
    request=urllib.request.Request(BASE+name,headers={
        'User-Agent':'Animagia-public-russian-taxonomy-QA/1.0'})
    with urllib.request.urlopen(request,timeout=70) as response:
        if response.status!=200:raise AssertionError('Unsuccessful HTTP '+name)
        body=response.read(max_bytes+1)
    if len(body)>max_bytes:raise AssertionError('Unexpected size '+name)
    return body
meta=json.loads(fetch('meta.json',3_000_000))
info=meta.get('verified_russian_names_csv',{})
assert info.get('file')=='animals_with_verified_russian_names.csv'
body=fetch(info['file'],12_000_000)
digest=hashlib.sha256(body).hexdigest()
assert digest==info['sha256'],'Russian CSV differs from the published manifest'
assert body.startswith(b'\xef\xbb\xbf'),'Expected UTF-8 with Excel-compatible BOM'
names=csv.DictReader(io.StringIO(body.decode('utf-8-sig')))
columns=('scientific_name','rank','russian_name','phylum','class','order','family_latin','family_russian')
assert tuple(names.fieldnames)==columns
ru=re.compile(r'[А-Яа-яЁё]')
identifiers=set()
total=0
for row in names:
    assert row['scientific_name'] and row['rank'] in ('species','subspecies')
    assert row['russian_name'] and ru.search(row['russian_name'])
    key=(row['scientific_name'].casefold(),row['rank'])
    assert key not in identifiers,'Duplicate named taxon '+str(key)
    identifiers.add(key)
    total+=1
assert total==info['count']==meta['family_catalogue']['verified_species_common_names']
assert total<=meta['unique_records']
print('LIVE_RUSSIAN_NAMES_CSV_VERIFIED',json.dumps({
 'names':total,'total_animals':meta['unique_records'],
 'unnamed_kept_in_latin':meta['unique_records']-total,
 'csv_bytes':len(body),'sha256':digest,'published_csv_url':BASE+info['file']
},ensure_ascii=False),flush=True)
