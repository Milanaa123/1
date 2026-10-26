"""Strict, fast, dependency-free audit of a generated Animagia index shard.

Proves structural and numeric integrity, not individual species ecology or
independent confirmation of continued existence. Run on *all* published rows.
"""
from __future__ import annotations
from collections import Counter
from greek_taxa import SCIENTIFIC_RE, taxon_score
from taxon_filters import allow_animal_taxon

ROW_WIDTH = 7
ALLOWED_RANKS = frozenset(("species", "subspecies"))

def audit_bucket(rows, bucket_id: int) -> dict:
    if not isinstance(bucket_id, int) or bucket_id < 0:
        raise ValueError("Invalid bucket number")
    if not isinstance(rows, list) or not rows:
        raise ValueError(f"Empty or invalid bucket {bucket_id}")
    seen = set()
    last_sort = None
    ranks = Counter()
    classes = Counter()
    for i, row in enumerate(rows):
        if not isinstance(row, list) or len(row) != ROW_WIDTH:
            raise ValueError(f"Invalid taxon record at {bucket_id}:{i}")
        value, name, rank, cls, order, status, phylum = row
        if type(value) is not int or value < 1 or value // 25 != bucket_id:
            raise ValueError(f"Wrong numeric bucket for {name!r}")
        if rank not in ALLOWED_RANKS or status != "":
            raise ValueError(f"Invalid rank or excluded status for {name!r}")
        if not isinstance(name, str) or not SCIENTIFIC_RE.fullmatch(name):
            raise ValueError(f"Not a canonical scientific name: {name!r}")
        if rank == "species" and len(name.split()) != 2:
            raise ValueError(f"Non-binomial species: {name!r}")
        if rank == "subspecies" and len(name.split()) != 3:
            raise ValueError(f"Non-trinomial subspecies: {name!r}")
        if any(not isinstance(x, str) for x in (cls, order, status, phylum)):
            raise ValueError(f"Malformed classification for {name!r}")
        if not cls or not phylum or not allow_animal_taxon({
            "kingdom":"Animalia", "phylum":phylum, "class":cls,
            "order":order,"genus":name.split()[0]
        }):
            raise ValueError(f"Out-of-scope class/order for {name!r}")
        if taxon_score(name) != value:
            raise ValueError(f"Bad Greek score for {name!r}")
        key = (name.lower(), rank)
        if key in seen:
            raise ValueError(f"Duplicate animal: {name!r}")
        seen.add(key)
        sort_key = (value, cls, name)
        if last_sort is not None and sort_key < last_sort:
            raise ValueError(f"Unsorted bucket {bucket_id} at {i}")
        last_sort = sort_key
        ranks[rank] += 1
        classes[cls] += 1
    return {"rows":len(rows),"ranks":ranks,"classes":classes}
