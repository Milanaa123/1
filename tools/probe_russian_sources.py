#!/usr/bin/env python3
"""Inspect licensed open taxonomic common-name tables before ingestion.
This diagnostic fetches ONLY small common-name parquet tables.
"""
import json, urllib.request
import pyarrow.parquet as pq
from pathlib import Path
ROOT='https://data.source.coop/cboettig/taxadb/2026/'
entries=['common_col','common_gbif','common_itis','common_ncbi']
report={}
for entry in entries:
    u=ROOT+entry+'_part_0.parquet'
    p=Path('/tmp/'+entry+'.parquet')
    print('PROBING',u,flush=True)
    req=urllib.request.Request(u,headers={'User-Agent':'Animagia-Russian-Taxon-Research/1.0'})
    try:
        with urllib.request.urlopen(req,timeout=85) as src, p.open('wb') as dest:
            while True:
                b=src.read(2**20)
                if not b:break
                dest.write(b)
        table=pq.read_table(p)
        names=table.schema.names
        samples=table.slice(0,6).to_pylist()
        report[entry]={'rows':table.num_rows,'columns':names,'sample':samples}
        print('TAXADB_PROBE_OK',entry,'rows',table.num_rows,'columns',names,flush=True)
        for row in samples[:2]:print('SAMPLE',entry,json.dumps(row,ensure_ascii=False)[:550],flush=True)
    except Exception as exc:
        report[entry]={'error':type(exc).__name__+': '+str(exc)[:150]}
        print('TAXADB_PROBE_FAILED',entry,report[entry]['error'],flush=True)
    finally:
        p.unlink(missing_ok=True)
print('TAXADB_PROBE_SUMMARY',json.dumps(report,ensure_ascii=False)[:6000],flush=True)
