"""Immutable, individually cited family assignments for CoL-unresolved taxa.

Only exact accepted species/subspecies, same class, order and phylum as CoL.
Evidence compiled from iNaturalist and WoRMS (2026-10-30); never infer
lineage from genus, similarity or Russian name.
"""
import json,re
from pathlib import Path

SOURCE='iNaturalist taxa v1 + WoRMS Aphia v1 direct live API strict exact lineage'
FAMILY_RE=re.compile(r'[A-Z][a-zA-Z-]*idae\Z')

def load_exact_families(path):
    data=json.loads(Path(path).read_text(encoding='utf8'))
    if (data.get('source')!=SOURCE or data.get('base_source')!='Catalogue of Life XR 2026-08-26'
            or data.get('verified_count')!=len(data.get('families',{})) or
            data.get('verified_count')!=16 or
            data.get('accepted_only_with_exact_rank_and_lineage') is not True):
        raise ValueError('External family evidence needs independent review')
    families=data['families']
    for key,record in families.items():
        if record.get('name')!=key or not FAMILY_RE.fullmatch(str(record.get('family',''))):
            raise ValueError('Invalid family evidence '+key)
        if record.get('rank') not in ('species','subspecies'):
            raise ValueError('Unsupported rank '+key)
        if not all(record.get(field) for field in ('class','order','phylum')):
            raise ValueError('Insufficient lineage '+key)
        if type(record.get('source_id')) is not int or record['source_id']<=0:
            raise ValueError('Missing independent taxon identifier '+key)
        url=record.get('source_url','')
        if record.get('source')=='iNaturalist':
            expected=f"https://www.inaturalist.org/taxa/{record['source_id']}"
        elif record.get('source')=='WoRMS':
            expected=f"https://www.marinespecies.org/aphia.php?p=taxdetails&id={record['source_id']}"
        else:
            raise ValueError('Unsupported independent taxonomic authority '+key)
        if url!=expected:
            raise ValueError('Unverifiable source link '+key)
    return families

def family_for_row(row,families):
    if not isinstance(row,list) or len(row)!=10 or row[7]:
        return ''
    entry=families.get(row[1])
    if not entry:return ''
    return entry['family'] if (
        entry['name']==row[1] and entry['rank']==row[2]
        and entry['class']==row[3] and entry['order']==row[4]
        and entry['phylum']==row[6]
        and FAMILY_RE.fullmatch(entry['family'])
    ) else ''
