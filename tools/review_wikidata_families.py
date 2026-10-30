#!/usr/bin/env python3
"""Source-backed Russian family names from ru.wikipedia/Wikidata P225/P105.
Wikidata terms must be confirmed by an actual Russian Wikipedia taxon page.
Review-only; no labels are fabricated and no main source is mutated here.
"""
import collections,datetime,json,pathlib,re,time,urllib.parse,urllib.request,urllib.error
ROOT='https://animagia-calculator.onrender.com/'
OUT=pathlib.Path('qa-artifacts/russian-family-wikidata')
OUT.mkdir(parents=True,exist_ok=True)
UA='Animagia-Taxonomy-Russian-Families/1.0 (noncommercial community biodiversity project)'
C= re.compile(r'^[А-ЯЁа-яё][А-ЯЁа-яё\s\-–—()«».]+$',re.U)
F= re.compile(r'^[A-Z][a-zA-Z-]+idae$')
def fetch(url,timeout=45,retries=2):
    for attempt in range(retries+1):
        try:
            request=urllib.request.Request(url,headers={'Accept':'application/sparql-results+json','User-Agent':UA})
            with urllib.request.urlopen(request,timeout=timeout) as response:
                content=response.read(3_500_001)
            if len(content)>3_500_000:raise ValueError('Response too large')
            return json.loads(content)
        except urllib.error.HTTPError as error:
            if error.code in (429,500,502,503,504) and attempt<retries:
                time.sleep(2**(attempt+2));continue
            return {'_error':str(error.code)}
        except Exception as error:
            if attempt<retries:time.sleep(2**(attempt+1));continue
            return {'_error':type(error).__name__}
def wikiquery(names):
    values=' '.join('"'+name+'"' for name in names)
    q=('PREFIX wdt: <http://www.wikidata.org/prop/direct/>\n'
       'PREFIX wd: <http://www.wikidata.org/entity/>\n'
       'PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\n'
       'PREFIX schema: <http://schema.org/>\n'
       'SELECT DISTINCT ?latin ?ru ?article ?taxon WHERE {\n'
       ' VALUES ?latin { '+values+' }\n'
       ' ?taxon wdt:P225 ?latin; wdt:P105 wd:Q35409; rdfs:label ?ru.\n'
       ' FILTER(LANG(?ru)="ru")\n'
       ' ?article schema:about ?taxon; schema:isPartOf <https://ru.wikipedia.org/>.\n'
       '}')
    u='https://query.wikidata.org/sparql?'+urllib.parse.urlencode({'query':q,'format':'json'})
    return fetch(u)
families=fetch(ROOT+'families.json',timeout=60)
if not isinstance(families,dict) or not isinstance(families.get('families'),list):
    raise ValueError('Published family index unavailable')
familylist=families['families']
missing=sorted((x for x in familylist if F.fullmatch(x.get('family','')) and
    not x.get('family_ru')),key=lambda x:(-x.get('record_count',0),x['family']))
target=missing
all_ids={x['family']:x for x in target}
accepted,conflicts,failed={}, {},[]
by_name=collections.defaultdict(list)
for start in range(0,len(target),24):
    chunk=[x['family'] for x in target[start:start+24]]
    data=wikiquery(chunk)
    if not isinstance(data,dict) or '_error' in data:
        failed.append({'batch':start//24+1,'examples':chunk[:3],
                       'error':data.get('_error') if isinstance(data,dict) else 'no response'})
    else:
        for item in data.get('results',{}).get('bindings',[]):
            try:
                latin=item['latin']['value']
                russian=item['ru']['value'].strip()
                article=item['article']['value']
                taxon=item['taxon']['value']
            except (KeyError,TypeError):continue
            if latin not in all_ids or not C.fullmatch(russian) or len(russian)>120:continue
            if not article.startswith('https://ru.wikipedia.org/wiki/'):continue
            if not taxon.startswith('http://www.wikidata.org/entity/Q'):continue
            by_name[latin].append({'russian':russian,'article':article,'wikidata':taxon})
    time.sleep(.8)
for latin,records in by_name.items():
    distinct={(x['russian'],x['wikidata']) for x in records}
    if len(distinct)==1:
        x=records[0]
        accepted[latin]={'russian':x['russian'],'source':x['wikidata'],
            'russian_article':x['article'],
            'published_record_count':all_ids[latin]['record_count']}
    else:conflicts[latin]=records
summary={
 'source':'Wikidata CC0 (scientific name P225, family rank P105=Q35409, Russian label + Russian Wikipedia sitelink)',
 'published_family_index':ROOT+'families.json',
 'reviewed_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),
 'known_families':len(familylist),
 'candidate_families_examined':len(target),
 'existing_missing_roman_family_names':len(missing),
 'strict_russian_family_names':len(accepted),
 'covered_published_animal_records':sum(x['published_record_count'] for x in accepted.values()),
 'ambiguous_items':len(conflicts),
 'failed_batches':failed,
 'families':dict(sorted(accepted.items())),
 'conflicts':conflicts,
}
(OUT/'source-verified-russian-families.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('WIKIDATA_FAMILY_AUDIT',json.dumps({k:v for k,v in summary.items() if k not in ('families','conflicts')},ensure_ascii=False),flush=True)
