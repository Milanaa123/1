#!/usr/bin/env python3
"""Probe exact scientific-name / Russian-label taxon pairs on Wikidata WDQS.
Wikidata labels are CC0, not scientific nomenclature; exact species rank required.
"""
import json,urllib.parse,urllib.request,time
PREFIX='PREFIX wdt: <http://www.wikidata.org/prop/direct/>\nPREFIX wd: <http://www.wikidata.org/entity/>\nPREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>'
QUERY=PREFIX+'''
SELECT ?taxon ?scientific ?ru WHERE {
 ?taxon wdt:P105 wd:Q7432 .
 ?taxon wdt:P225 ?scientific .
 ?taxon rdfs:label ?ru .
 FILTER(LANG(?ru) = "ru")
}
LIMIT 500
'''
url='https://query.wikidata.org/sparql?'+urllib.parse.urlencode({'query':QUERY,'format':'json'})
request=urllib.request.Request(url,headers={
 'Accept':'application/sparql-results+json',
 'User-Agent':'Animagia-Russian-Taxon-Labels/1.0 (independent noncommercial biodiversity site)',
 'Accept-Encoding':'identity'})
t=time.monotonic()
try:
 with urllib.request.urlopen(request,timeout=62) as response:
  doc=json.load(response)
 rows=doc['results']['bindings']
 print('WDQS_SAMPLE_SUCCEEDED','rows',len(rows),'elapsed',round(time.monotonic()-t,2),flush=True)
 for row in rows[:20]:
  print('WDQS_SAMPLE',json.dumps({k:v.get('value') for k,v in row.items()},ensure_ascii=False),flush=True)
except Exception as exc:
 print('WDQS_SAMPLE_FAILED',type(exc).__name__,str(exc)[:350],flush=True)
