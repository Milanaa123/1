#!/usr/bin/env python3
"""Select published Russian species labels from Wikidata CC0 structured data.

This is a bounded, single SPARQL query, not a crawl. Latin fallbacks, ambiguous
scientific identifiers and non-binomial species are excluded.
"""
import collections,hashlib,json,re,time,urllib.parse,urllib.request
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
RUSSIAN=re.compile(r"^[А-ЯЁа-яё][А-ЯЁа-яё\s.,'’()\-–—«»]+$")
SCIENTIFIC=re.compile(r'^[A-Z][a-z-]+ [a-z-]+$')
prefix='''PREFIX wdt: <http://www.wikidata.org/prop/direct/>
PREFIX wd: <http://www.wikidata.org/entity/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
'''
query=prefix+'''SELECT ?taxon ?scientific ?ru WHERE {
 ?taxon wdt:P105 wd:Q7432 .
 ?taxon wdt:P225 ?scientific .
 ?taxon rdfs:label ?ru .
 FILTER(LANG(?ru) = "ru")
} LIMIT 20000'''
url='https://query.wikidata.org/sparql?'+urllib.parse.urlencode({'query':query,'format':'json'})
req=urllib.request.Request(url,headers={'Accept':'application/sparql-results+json',
 'User-Agent':'Animagia-Russian-Taxon-Labels/1.0 (public biodiversity educational site)',
 'Accept-Encoding':'identity'})
started=time.monotonic()
try:
 with urllib.request.urlopen(req,timeout=65) as response:
  data=json.load(response)
except Exception as error:
 print('WIKIDATA_BULK_QUERY_FAILED',type(error).__name__,str(error)[:450],flush=True)
 raise
rejected=collections.Counter()
collected=collections.defaultdict(dict)
for record in data.get('results',{}).get('bindings',[]):
 try:
  scientific=record['scientific']['value'].strip()
  label=record['ru']['value'].strip()
  qid=record['taxon']['value'].rsplit('/',1)[-1]
 except (KeyError,TypeError,AttributeError):
  rejected['invalid_sparql']+=1;continue
 if not SCIENTIFIC.fullmatch(scientific):
  rejected['not_binomial']+=1;continue
 if not RUSSIAN.fullmatch(label) or len(label)>130:
  rejected['not_russian_common']+=1;continue
 if not re.fullmatch(r'Q[0-9]{1,11}',qid):
  rejected['invalid_id']+=1;continue
 collected[scientific.casefold()][label]=(qid,scientific)
verified={}
for scientific,labels in collected.items():
 if len(labels)!=1:
  rejected['ambiguous_labels']+=1;continue
 label,(qid,display)=next(iter(labels.items()))
 verified[scientific]=[label,qid]
result={'source':'Wikidata CC0 species rank Q7432; Russian language labels',
 'source_url':'https://www.wikidata.org','license':'CC0',
 'retrieved':'2026-10-29','query_limit':20000,
 'queried_rows':len(data.get('results',{}).get('bindings',[])),
 'count':len(verified),'rejected':dict(rejected),'names':dict(sorted(verified.items()))}
out=json.dumps(result,ensure_ascii=False,separators=(',',':'))+'\n'
assert 250<len(verified)<20000,len(verified)
assert len(out.encode())<3000000,len(out)
(ROOT/'russian_wikidata_snapshot.json').write_text(out,encoding='utf8')
print('WIKIDATA_RUSSIAN_LABELS_READY',json.dumps({k:v for k,v in result.items() if k!='names'},ensure_ascii=False),
 'elapsed',round(time.monotonic()-started,2),'sha256',hashlib.sha256(out.encode()).hexdigest(),flush=True)
for name in ('Panthera leo','Canis lupus','Cygnus cygnus'):
 print('WIKIDATA_CONTROL',name,verified.get(name.casefold()),flush=True)
