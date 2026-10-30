#!/usr/bin/env python3
"""Accept only rank-verified Wikidata family names with Russian Wikipedia proof."""
import hashlib,json,pathlib,re
IN=pathlib.Path('qa-artifacts/russian-family-wikidata/source-verified-russian-families.json')
OUT=pathlib.Path('family_ru_wikidata_verified.json')
report=json.loads(IN.read_text(encoding='utf8'))
if (report.get('source')!='Wikidata CC0 (scientific name P225, family rank P105=Q35409, Russian label + Russian Wikipedia sitelink)'
    or report.get('strict_russian_family_names')!=len(report.get('families',{}))
    or len(report.get('families',{}))<500
    or report.get('ambiguous_items')!=0):
    raise AssertionError('Russian families require exact independent provenance and enough matches')
rx_name=re.compile(r'^[A-Z][a-zA-Z-]+idae$')
rx_ru=re.compile(r'^[А-ЯЁа-яё][А-ЯЁа-яё\s\-–—()«».]+$',re.U)
valid={}
for latin,row in sorted(report['families'].items()):
    ru=row.get('russian','')
    if (not rx_name.fullmatch(latin) or not isinstance(ru,str)
        or len(ru)>120 or not rx_ru.fullmatch(ru)
        or not row.get('source','').startswith('http://www.wikidata.org/entity/Q')
        or not row.get('russian_article','').startswith('https://ru.wikipedia.org/wiki/')
        or not isinstance(row.get('published_record_count'),int)
        or row['published_record_count']<=0):
        raise AssertionError('Invalid verified family label: '+latin)
    valid[latin]={
        'russian':ru,'source':row['source'],
        'russian_article':row['russian_article'],
        'published_record_count':row['published_record_count']}
snapshot={
 'source':'Wikidata P225 + P105 Q35409 + Russian Wikipedia verified article',
 'data_license':'Wikidata CC0; Russian Wikipedia sitelinks used only for verification',
 'source_review_date_utc':report['reviewed_utc'],
 'source_index_url':report['published_family_index'],
 'families_scanned':report['candidate_families_examined'],
 'failed_batches':report['failed_batches'],
 'count':len(valid),'families':valid}
OUT.write_text(json.dumps(snapshot,ensure_ascii=False,sort_keys=True,separators=(',',':'))+'\n',encoding='utf8')
print('FAMILY_SOURCE_SNAPSHOT_READY',len(valid),hashlib.sha256(OUT.read_bytes()).hexdigest(),
      'failed_queries',len(report['failed_batches']),flush=True)
