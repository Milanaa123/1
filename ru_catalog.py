"""Evidence-based Russian vernacular names and safe family recovery.

The CoL source lineage is authoritative for its taxonomy. A missing family can
be filled from the same *uniquely classified* genus, never by an animal's
appearance or only its order. Russian common names are exact scientific-name
matches from a curated small dictionary and the pinned BirdNET+ metadata CSV.
Unknown names are not translated automatically or mislabelled as official.
"""
import csv, hashlib, io, json, re, urllib.request
from pathlib import Path

_DATA=json.loads((Path(__file__).resolve().parent/'ru_taxonomy.json').read_text(encoding='utf-8'))
SPECIES_RU=_DATA['species_ru']
FAMILY_RU=_DATA['family_ru']
EXTERNAL_SPECIES_RU={}
EXTERNAL_STATS={}
BIRDNET_URL='https://birdnet.cornell.edu/taxonomy/api/download/csv'
BIRDNET_SHA256='daecb2505ff16dddbafe76cfa8d15a044c506b6a2998b2349a94bcd355475ac4'
_RUSSIAN=re.compile(r'^[А-ЯЁа-яё][А-ЯЁа-яё\s\-–—()«».,\x27’]+$')
_CANONICAL=re.compile(r'^[A-Z][a-z-]+ [a-z-]+$')

def load_birdnet_names():
    """Pin the exact open-MIT dataset to avoid silent taxonomy drift."""
    global EXTERNAL_STATS
    request=urllib.request.Request(BIRDNET_URL,headers={'User-Agent':'Animagia-catalogue-builder/1.0'})
    with urllib.request.urlopen(request,timeout=70) as response:
        content=response.read(24_000_001)
    if len(content)>24_000_000:
        raise ValueError('BirdNET+ names source exceeds expected size')
    sha=hashlib.sha256(content).hexdigest()
    if sha!=BIRDNET_SHA256:
        raise ValueError('BirdNET+ source was changed; review names before publishing: '+sha)
    reader=csv.DictReader(io.StringIO(content.decode('utf-8-sig',errors='strict')))
    required={'scientific_name','common_name_ru','record_type'}
    if not required.issubset(reader.fieldnames or []):
        raise ValueError('BirdNET+ species name columns absent')
    unique={}
    conflicts=set()
    examined=0
    for item in reader:
        examined+=1
        if item.get('record_type')!='species':
            continue
        name=item.get('scientific_name','').strip()
        russian=item.get('common_name_ru','').strip()
        if not _CANONICAL.fullmatch(name) or len(russian)>130 or not _RUSSIAN.fullmatch(russian):
            continue
        if name in unique and unique[name]!=russian:
            conflicts.add(name)
        else:
            unique[name]=russian
    for name in conflicts:
        unique.pop(name,None)
    EXTERNAL_SPECIES_RU.clear()
    EXTERNAL_SPECIES_RU.update(unique)
    EXTERNAL_STATS.clear()
    EXTERNAL_STATS.update({'source':'BirdNET+ Taxonomy v0.4-Oct2026',
      'source_url':BIRDNET_URL,'sha256':sha,'source_rows':examined,
      'russian_name_candidates':len(unique),'ambiguous_names_rejected':len(conflicts)})
    return EXTERNAL_STATS

def taxon_ru_labels(scientific, family):
    return FAMILY_RU.get(family, ''), SPECIES_RU.get(scientific, '') or EXTERNAL_SPECIES_RU.get(scientific, '')

def indexed_taxon_row(score, scientific, rank, lineage):
    family=lineage.get('family','').strip()
    family_ru, common_ru=taxon_ru_labels(scientific, family)
    # Do not assign a species name to subspecies merely because they share a binomial.
    return [score,scientific,rank,lineage.get('class',''),
            lineage.get('order',''),'',lineage.get('phylum',''),
            family,family_ru,common_ru]

def genus_key(phylum, animal_class, order, scientific):
    return (phylum,animal_class,order,scientific.split(' ',1)[0])

def family_from_unambiguous_genus(lineage_families, row):
    if row[7]:
        return ''
    candidates=lineage_families.get(genus_key(row[6],row[3],row[4],row[1]),set())
    if len(candidates)==1:
        return next(iter(candidates))
    return ''
