#!/usr/bin/env python3
"""Build an evidence-backed, reusable Russian vernacular-name snapshot.

Sources: Catalogue of Life and GBIF (CC BY 4.0), ITIS and NCBI (public domain).
Each source gives accepted taxa, exact canonical name, classification and
language. This never invents a common name or translates Latin epithets.
"""
from __future__ import annotations
import collections, hashlib, json, re, urllib.request
from pathlib import Path
import pyarrow.parquet as parquet

ROOT=Path(__file__).resolve().parents[1]
URL='https://data.source.coop/cboettig/taxadb/2026/'
PROVIDERS=('col','gbif','itis','ncbi')
EXPECTED={'col':176481,'gbif':1500815,'itis':166832,'ncbi':46524}
LICENCE={'col':'CC BY 4.0','gbif':'CC BY 4.0','itis':'public domain','ncbi':'public domain'}
RUSSIAN=re.compile(r"^[А-ЯЁа-яё][А-ЯЁа-яё\s.,'’()\-–—«»]+$")
SCIENTIFIC=re.compile(r'^[A-Z][a-z-]+ [a-z-]+(?: [a-z-]+)?$')
RU_LANG={'ru','rus','russian','русский'}
FIELDS=['taxonID','acceptedNameUsageID','vernacularName','language',
        'scientificName','taxonRank','taxonomicStatus',
        'kingdom','phylum','class','order','family']
NAMES={}
STATS={}
def download(url,path):
    req=urllib.request.Request(url,headers={'User-Agent':'Animagia-Open-Taxonomy-Russian-Names/1.0'})
    digest=hashlib.sha256()
    size=0
    with urllib.request.urlopen(req,timeout=100) as src, path.open('wb') as out:
        while True:
            chunk=src.read(1024*1024)
            if not chunk:break
            size+=len(chunk)
            if size>38*1024*1024:raise ValueError('unexpected parquet size '+url)
            digest.update(chunk);out.write(chunk)
    return digest.hexdigest(),size

def valid_common(s):
    return isinstance(s,str) and 3<=len(s.strip())<=130 and RUSSIAN.fullmatch(s.strip()) is not None

def can_use(entry,provider):
    if entry.get('taxonomicStatus')!='accepted':return False,'not_accepted'
    if entry.get('taxonID')!=entry.get('acceptedNameUsageID'):return False,'synonym'
    if entry.get('kingdom') not in ('Animalia','Metazoa'):return False,'not_animal'
    scientific=entry.get('scientificName') or ''
    rank=entry.get('taxonRank') or ''
    if rank not in ('species','subspecies') or not SCIENTIFIC.fullmatch(scientific):
        return False,'not_species'
    if len(scientific.split())!=(2 if rank=='species' else 3):
        return False,'wrong_rank'
    common=entry.get('vernacularName')
    if not valid_common(common):return False,'not_russian_text'
    lang=(entry.get('language') or '').strip().lower()
    if lang and lang not in RU_LANG:return False,'language_not_ru'
    if not lang and provider not in ('col','ncbi'):
        return False,'language_not_explicit'
    return True,'accepted'

def main():
    all_names={}
    for provider in PROVIDERS:
        url=URL+'common_'+provider+'_part_0.parquet'
        path=Path('/tmp/animagia-common-'+provider+'.parquet')
        sha,nbytes=download(url,path)
        tab=parquet.read_table(path,columns=[k for k in FIELDS if k in parquet.read_schema(path).names])
        assert tab.num_rows==EXPECTED[provider],(provider,tab.num_rows)
        rejected=collections.Counter()
        grouped=collections.defaultdict(dict)
        contradictory=set()
        for record in tab.to_pylist():
            valid,reason=can_use(record,provider)
            if not valid:
                rejected[reason]+=1
                continue
            canonical=record['scientificName']
            key=canonical.casefold()+'|'+record['taxonRank']
            common=record['vernacularName'].strip()
            taxonomy=[record.get(field) or '' for field in ('phylum','class','order','family')]
            if key in grouped and common not in grouped[key] and grouped[key]:
                pass  # distinct names for this single taxon need review unless exact duplicates
            grouped[key][common]=taxonomy
        candidates={}
        for key,labels in grouped.items():
            if len(labels)!=1:
                contradictory.add(key);continue
            common,taxonomy=next(iter(labels.items()))
            if not common or not any(taxonomy):continue
            candidates[key]=[common,provider,*taxonomy]
        added=0;cross_conflicts=0
        for key,value in sorted(candidates.items()):
            # Earlier providers are priority authorities; later data may have
            # synonyms with the same binomial but incompatible classification.
            if key not in all_names:
                all_names[key]=value;added+=1
            elif all_names[key][0]!=value[0]:
                cross_conflicts+=1
        STATS[provider]={'url':url,'sha256':sha,'bytes':nbytes,'rows':tab.num_rows,
             'russian_candidate_keys':len(candidates),'ambiguous_species_skipped':len(contradictory),
             'new_names':added,'cross_source_name_variants':cross_conflicts,
             'rejections':dict(rejected),'license':LICENCE[provider]}
        print('RUSSIAN_BULK_SOURCE',provider,'candidates',len(candidates),'added',added,
              'ambiguous',len(contradictory),'cross_source_variants',cross_conflicts,
              'rejected',dict(rejected),flush=True)
        path.unlink(missing_ok=True)
    # Keep stable Latin spelling in keys; the indexer uses canonical species names.
    result={'source':'taxadb 2026, exact accepted Russian vernacular names',
            'retrieved':'2026-10-29','priority':list(PROVIDERS),
            'license_notice':'COL and GBIF CC BY 4.0 (attribution required); ITIS and NCBI public domain',
            'sources':STATS,'count':len(all_names),'names':dict(sorted(all_names.items()))}
    blob=json.dumps(result,ensure_ascii=False,separators=(',',':'))+'\n'
    assert 1000<len(all_names)<250000,(len(all_names),STATS)
    assert len(blob)<14000000,len(blob)
    (ROOT/'russian_vernacular_snapshot.json').write_text(blob,encoding='utf8')
    print('RUSSIAN_BULK_SNAPSHOT_COMPLETE','unique',len(all_names),'bytes',len(blob.encode()),
          'sha256',hashlib.sha256(blob.encode()).hexdigest(),flush=True)

if __name__=='__main__':main()
