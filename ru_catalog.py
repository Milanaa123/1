"""Family and established Russian common names for catalogue rows.

Family is inherited from the source taxonomic tree, never inferred from genus.
Species common names are curated; missing names remain empty rather than
fabricating a Russian species identification from Latin.
"""
import json
from pathlib import Path

_DATA=json.loads((Path(__file__).resolve().parent/'ru_taxonomy.json').read_text(encoding='utf-8'))
SPECIES_RU=_DATA['species_ru']
FAMILY_RU=_DATA['family_ru']

def taxon_ru_labels(scientific, family):
    return FAMILY_RU.get(family, ''), SPECIES_RU.get(scientific, '')

def indexed_taxon_row(score, scientific, rank, lineage):
    family=lineage.get('family','').strip()
    family_ru, common_ru=taxon_ru_labels(scientific, family)
    return [score,scientific,rank,lineage.get('class',''),
            lineage.get('order',''),'',lineage.get('phylum',''),
            family,family_ru,common_ru]
