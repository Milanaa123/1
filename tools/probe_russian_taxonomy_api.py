#!/usr/bin/env python3
"""Read-only discovery of a Russian taxonomy provider's public API.
Does not crawl, bulk-download, or submit user data.
"""
import json,urllib.request,urllib.error,urllib.parse
base='https://taxonomy.polevoy-vorobey.ru'
paths=['/openapi.json','/api/stats','/api/taxa?q='+urllib.parse.quote('Canis lupus'),'/', '/api/taxa?q='+urllib.parse.quote('Cornufer opisthodon')]
for path in paths:
    try:
        req=urllib.request.Request(base+path,headers={'User-Agent':'Animagia-Research-Taxonomic-Names/1.0 (GitHub Milanaa123/1)','Accept':'application/json'})
        with urllib.request.urlopen(req,timeout=25) as response:
            data=response.read(140000)
            print('API_PROBE_STATUS',path,response.status,response.headers.get('Content-Type'),len(data),flush=True)
        if path=='/openapi.json':
            doc=json.loads(data)
            print('API_OPENAPI_INFO',json.dumps(doc.get('info',{}),ensure_ascii=False)[:1600],flush=True)
            print('API_ENDPOINTS',json.dumps(list(doc.get('paths',{}).keys()),ensure_ascii=False)[:6000],flush=True)
            for name in ('/api/taxa','/api/taxa/bulk','/api/taxa/by-name/bulk'):
                operations=doc['paths'].get(name,{})
                for method,definition in operations.items():
                    if not isinstance(definition,dict):continue
                    print('API_OPERATION',name,method,json.dumps({
                        'parameters':definition.get('parameters',[]),
                        'requestBody':definition.get('requestBody',{}),
                        'summary':definition.get('summary',''),
                        'response_schema':definition.get('responses',{}).get('200',{})
                    },ensure_ascii=False)[:9000],flush=True)
            print('API_SCHEMA_NAMES',list(doc.get('components',{}).get('schemas',{}))[:80],flush=True)
        elif data.lstrip().startswith((b'{',b'[')):
            o=json.loads(data)
            print('API_PROBE_SAMPLE',path,json.dumps(o,ensure_ascii=False)[:2500],flush=True)
    except urllib.error.HTTPError as error:
        print('API_PROBE_HTTP',path,error.code,str(error)[:220],flush=True)
    except Exception as error:
        print('API_PROBE_ERROR',path,type(error).__name__,str(error)[:230],flush=True)
