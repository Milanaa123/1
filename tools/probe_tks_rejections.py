#!/usr/bin/env python3
"""Read-only small-sample audit of strict TKS species rejections, no import."""
import collections,json,urllib.parse,urllib.request
from import_tks_russian_species import validate
B='https://taxonomy.polevoy-vorobey.ru/api/taxa'
q={'kingdom':'Animalia','rank':'species','has_ru_name':'true','hide_subspecies':'true','limit':200}
counts=collections.Counter();samples=collections.defaultdict(list);tested=0
for off in [0,5000,10000,15000,20000,25000,30000,35000,40000]:
    q['offset']=off
    req=urllib.request.Request(B+'?'+urllib.parse.urlencode(q),
         headers={'User-Agent':'Animagia-source-audit/1.0','Accept':'application/json'})
    with urllib.request.urlopen(req,timeout=55) as response:
        obj=json.loads(response.read(500000))
    for row in obj.get('results',[]):
        tested+=1
        if validate(row):continue
        reasons=[]
        if row.get('is_accepted') is not True or row.get('status')!='accepted':reasons.append('not_accepted')
        if not row.get('canonical_name'):reasons.append('no_canonical')
        if not row.get('taxon_name_ru'):reasons.append('no_russian')
        if not row.get('phylum'):reasons.append('missing_phylum')
        if not row.get('class_name'):reasons.append('missing_class')
        if not row.get('order_name'):reasons.append('missing_order')
        if not row.get('family'):reasons.append('missing_family')
        if not row.get('gbif_taxon_id') and not row.get('inat_taxon_id'):reasons.append('missing_external_ids')
        if not reasons:reasons=['other_rejection']
        for reason in reasons:counts[reason]+=1
        for reason in reasons[:2]:
            if len(samples[reason])<4:
                samples[reason].append({'latin':row.get('canonical_name'),
                    'rank':row.get('taxon_rank'),'class':row.get('class_name'),
                    'order':row.get('order_name'),'family':row.get('family'),
                    'ru':row.get('taxon_name_ru')})
print('TKS_REJECTION_AUDIT',json.dumps({'tested':tested,'reasons':dict(counts),'samples':dict(samples)},ensure_ascii=False),flush=True)
