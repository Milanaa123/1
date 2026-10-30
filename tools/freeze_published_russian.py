#!/usr/bin/env python3
"""Freeze ONLY Russian labels already published in a verified CoL index.
This makes builds independent of mutable BirdNET API content. No translations.
"""
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime,timezone
from pathlib import Path
import hashlib,json,urllib.request

BASE='https://animagia-calculator.onrender.com/'
OUT=Path('russian_published_verified_snapshot.json')

def fetch(relative, limit=25_000_000):
    req=urllib.request.Request(BASE+relative,headers={'User-Agent':'Animagia-release-freeze/1.0'})
    with urllib.request.urlopen(req,timeout=75) as response:
        content=response.read(limit+1)
    if len(content)>limit:
        raise RuntimeError('Oversized shard '+relative)
    return content

meta_raw=fetch('meta.json',4_000_000)
meta=json.loads(meta_raw)
assert meta['version']=='2026-08-26 XR'
assert meta['algorithm_id']=='taxon-ancient-alphabet-v2'
assert meta['quality_audit']['status']=='passed'
expected_names=meta['family_catalogue']['verified_species_common_names']
expected_rows=meta['unique_records']
assert expected_names==34432 and expected_rows==1193878,'Published source changed; review manually'
buckets=meta['available_buckets']
expected_digests=meta['bucket_sha256']

def get_bucket(bucket):
    relative='data/'+str(bucket)+'.json'
    raw=fetch(relative)
    actual=hashlib.sha256(raw).hexdigest()
    if actual!=expected_digests[str(bucket)]:
        raise RuntimeError('Source checksum mismatch '+relative)
    data=json.loads(raw)
    names={}
    for row in data:
        if len(row)!=10:raise RuntimeError('Unexpected row schema '+relative)
        if not row[9]:continue
        key=row[1].casefold()+'|'+row[2]
        value=[row[9],row[3],row[4],row[6],row[7]]
        if key in names and names[key]!=value:
            raise RuntimeError('Ambiguous Russian label: '+key)
        names[key]=value
    return len(data),names

labels={}
rows=0
with ThreadPoolExecutor(max_workers=10) as pool:
    for length,subset in pool.map(get_bucket,buckets):
        rows+=length
        for key,value in subset.items():
            if key in labels and labels[key]!=value:
                raise RuntimeError('Conflicting label: '+key)
            labels[key]=value
assert rows==expected_rows,(rows,expected_rows)
assert len(labels)==expected_names,(len(labels),expected_names)
output={
 'source':'Previously published SHA-audited Animagia Catalogue of Life XR 2026-08-26 index',
 'source_url':BASE,
 'source_index_sha256':meta['quality_audit']['index_sha256'],
 'source_manifest_sha256':hashlib.sha256(meta_raw).hexdigest(),
 'verified_on':datetime.now(timezone.utc).isoformat(),
 'count':len(labels),
 'names':dict(sorted(labels.items()))
}
OUT.write_text(json.dumps(output,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
print('FROZEN_PUBLISHED_RUSSIAN_NAMES',len(labels),'ROWS',rows,
      'SNAPSHOT_SHA256',hashlib.sha256(OUT.read_bytes()).hexdigest(),flush=True)
