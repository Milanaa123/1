#!/usr/bin/env python3
"""Generate Greek-scored taxon shards for the complete Catalogue of Life XR."""
import os,re,zipfile,json,urllib.request,shutil,tempfile,collections,time,unicodedata,hashlib
from original.alphabet_maps import latin_map as CH
from greek_taxa import RULE_VERSION, greek_transliterate, score_greek, taxon_score, CONTROL_NAMES
from taxon_filters import POLICY_VERSION, allow_animal_taxon
from audit_index import audit_bucket
from ru_catalog import indexed_taxon_row, FAMILY_RU, EXTERNAL_STATS, load_birdnet_names, taxon_ru_labels, genus_key, family_from_unambiguous_genus, RUSSIAN_SNAPSHOT, BULK_NAMES, SPECIES_RU, EXTERNAL_SPECIES_RU
from pathlib import Path
BASE=Path(__file__).parent.resolve();DEST=BASE/'public';DATA=DEST/'data'
URL='https://download.checklistbank.org/col/monthly/2026-08-26_xr_txtree.zip'
RANK={'species','subspecies'}  # only individual animal species and subspecies; no forms/varieties
RANK_RE=re.compile(rb'\[([^\]]+)\]\s*$');EP=re.compile(r'^[a-z][a-z-]*$');START=re.compile(r'^[A-Z][A-Za-z0-9_-]*')
SKIP={'subsp.','ssp.','var.','subvar.','f.','forma','natio','ab.','morph.','morph','×'}
# Historical Latin scoring is retained only as a regression check for the old programme.
# Matching NOW uses the same Greek-numeral values for names and Greek-rendered taxa.
GREEK_WEIGHTS = dict(zip('αβγδεζηθικλμνξοπρστυφχψω',
    [1,2,3,4,5,7,8,9,10,20,30,40,50,60,70,80,100,200,300,400,500,600,700,800]))
GREEK_WEIGHTS.update({'ς':200,'ϝ':6,'Ϝ':6,'ϛ':6,'Ϛ':6,
    'ϙ':90,'Ϙ':90,'ϟ':90,'Ϟ':90,'ϡ':900,'Ϡ':900})
def letters(s):
    return (c for c in unicodedata.normalize('NFD',s.lower())
            if unicodedata.category(c)!='Mn')
def score(s):
    return sum(CH.get(c,0) for c in letters(s))
def score_mixed(s):
    return sum(CH.get(c,GREEK_WEIGHTS.get(c,0)) for c in letters(s))
def verify_original():
    # Original code: original/alphabet_maps.py and original/main.py.
    assert CH['b']==2 and CH['v']==6 and CH['c']==90 and CH['x']==600
    assert score('Naja oxiana')==788
    assert score('Anolis cooki')==621
    assert score('Panthera uncia')==1688
    assert score('Ourebia montana')==1100
    # Methodical textbook arithmetic and corrections:
    assert score_mixed('ιετυ')==715
    assert score_mixed('ραβδι')==117
    assert score_mixed('φϟη')==598
    assert score_mixed('ς')==score_mixed('σ')==200
    assert score_mixed('ϛ')==6 and score_mixed('ϡ')==900
    for latin in CONTROL_NAMES:
        assert taxon_score(latin) == score_greek(greek_transliterate(latin))
    assert greek_transliterate('Panthera uncia') == 'πανθερα ουνκια'
    # Classical-letter score controls: scientific names must NEVER be
    # silently interpreted using modern Greek μπ/ντ/γκ substitutions.
    ancient_examples={
        'Naja oxiana':254,
        'Anolis cooki':551,
        'Ompok pabo':433,
        'Panthera uncia':797,
        'Canis lupus':1531,
        'Ursus arctos':2131,
        'Felis catus':1736,
        'Vulpes vulpes':1582,
        'Agapornis taranta':1268,
        'Hippopotamus amphibius':3234,
    }
    for animal,expected in ancient_examples.items():
        computed=taxon_score(animal)
        assert computed==expected,(animal,computed,expected)
    # Anc. β represents /b/ (not modern /v/); δ=/d/, γ=/g/.
    assert greek_transliterate('Aba dodo gaga')=='αβα δοδο γαγα'
    print('ANCIENT_GREEK_SCORE_CONTROLS_PASSED',len(ancient_examples),flush=True)

def canonical(body,rank):
 w=body.lstrip('†?*=$ ').split();i=0
 if not w:return ''
 if w[0]=='×':i+=1
 if i>=len(w):return ''
 out=[w[i]];i+=1
 if i<len(w) and w[i].startswith('(') and w[i].endswith(')'):i+=1
 for x in w[i:]:
  if x in SKIP:continue
  if EP.fullmatch(x):out.append(x)
  else:break
  if len(out)>=(2 if rank=='species' else 3):break
 return ' '.join(out) if len(out)>=(2 if rank=='species' else 3) else ''
def parent(body):
 s=body.lstrip('†?*=$ ').strip();m=START.match(s)
 return m.group(0) if m else (s.split()[0] if s else '')
def verify_animal_scope():
 # Every example explicitly carries its taxonomic ancestors, just as the indexer does.
 tests=[
  ({'kingdom':'Animalia','phylum':'Chordata','class':'Mammalia','genus':'Ursus'},True),
  ({'kingdom':'Animalia','phylum':'Chordata','class':'Aves','genus':'Bubo'},True),
  ({'kingdom':'Animalia','phylum':'Chordata','class':'Reptilia'},True),
  ({'kingdom':'Animalia','phylum':'Chordata','class':'Amphibia'},True),
  ({'kingdom':'Animalia','phylum':'Chordata','class':'Actinopterygii'},True),
  ({'kingdom':'Animalia','phylum':'Chordata','class':'Chondrichthyes'},True),
  ({'kingdom':'Animalia','phylum':'Mollusca','class':'Cephalopoda','order':'Octopoda'},True),
  ({'kingdom':'Animalia','phylum':'Arthropoda','class':'Insecta','order':'Coleoptera'},True),
  ({'kingdom':'Animalia','phylum':'Arthropoda','class':'Arachnida','order':'Araneae'},True),
  ({'kingdom':'Animalia','phylum':'Arthropoda','class':'Malacostraca','order':'Decapoda'},True),
  ({'kingdom':'Animalia','phylum':'Echinodermata','class':'Asteroidea'},True),
  ({'kingdom':'Plantae','phylum':'Bryophyta','class':'Bryopsida'},False),
  ({'kingdom':'Animalia','phylum':'Cnidaria','class':'Anthozoa','genus':'Acropora'},False),
  ({'kingdom':'Animalia','phylum':'Cnidaria','class':'Scyphozoa'},False),
  ({'kingdom':'Animalia','phylum':'Porifera','class':'Demospongiae'},False),
  ({'kingdom':'Animalia','phylum':'Bryozoa','class':'Gymnolaemata'},False),
  ({'kingdom':'Animalia','phylum':'Platyhelminthes','class':'Cestoda','genus':'Taenia'},False),
  ({'kingdom':'Animalia','phylum':'Nematoda','class':'Chromadorea','genus':'Ascaris'},False),
  ({'kingdom':'Animalia','phylum':'Annelida','class':'Clitellata'},False),
  ({'kingdom':'Animalia','phylum':'Mollusca','class':'Bivalvia','order':'Ostreida'},False),
  ({'kingdom':'Animalia','phylum':'Echinodermata','class':'Crinoidea'},False),
  ({'kingdom':'Animalia','phylum':'Arthropoda','class':'Arachnida','order':'Ixodida'},False),
  ({'kingdom':'Animalia','phylum':'Arthropoda','class':'Insecta','order':'Diptera','family':'Culicidae'},False),
  ({'kingdom':'Animalia','phylum':'Chordata','class':'Petromyzonti'},False),
 ]
 for lineage,expected in tests:
  actual=allow_animal_taxon(lineage)
  assert actual==expected,(lineage,expected,actual)
 print('SCOPE_TESTS_PASSED',len(tests),flush=True)

def bundle_public_domain_silhouettes():
 """Cache genuine CC0/PDM PhyloPic vector files in our static output.
 Network failure is nonfatal; never substitute an invented animal shape.
 Names are biological groups only; no visitor names are transmitted.
 """
 from urllib.parse import urlencode
 sources={
  'Reptilia':'Squamata',
  'Mammalia':'Mammalia',
  'Aves':'Aves',
  'Amphibia':'Amphibia',
  'Actinopterygii':'Actinopterygii',
  'Actinopteri':'Actinopterygii',
  'Chondrichthyes':'Chondrichthyes',
  'Insecta':'Insecta',
  'Arachnida':'Araneae',
  'Cephalopoda':'Cephalopoda',
  'Malacostraca':'Decapoda',
  'Gastropoda':'Gastropoda',
  'Echinoidea':'Echinoidea',
  'Asteroidea':'Asteroidea'
 }
 folder=DEST/'silhouettes';folder.mkdir(parents=True,exist_ok=True)
 records={}
 def read(address,blob=False):
  headers={'Accept':'image/svg+xml' if blob else 'application/vnd.phylopic.v2+json',
           'User-Agent':'Animagia-Bestiary/1.0'}
  with urllib.request.urlopen(urllib.request.Request(address,headers=headers),timeout=6) as response:
   result=response.read(1200001 if blob else 500000)
  return result if blob else json.loads(result)
 try:
  api='https://api.phylopic.org'
  version=read(api+'/')['build']
 except Exception as e:
  print('SILHOUETTE_INDEX_UNAVAILABLE',type(e).__name__,str(e)[:140],flush=True)
  version=None
 cache={}
 if version is not None:
  for group,taxon in sources.items():
   try:
    if taxon not in cache:
     nodes=read(api+'/nodes?'+urlencode({
       'build':version,'filter_name':taxon.lower(),'embed_items':'true','page':0
     }))
     items=nodes.get('_embedded',{}).get('items',[])
     if isinstance(items,dict):items=[items]
     # Search term is an exact taxonomic group. Never use random fuzzy results.
     def all_name_strings(value):
      if isinstance(value,str):
       yield value
      elif isinstance(value,(list,tuple)):
       for part in value:yield from all_name_strings(part)
      elif isinstance(value,dict):
       for key in ('value','name','text','scientificName','canonicalName'):
        if key in value:yield from all_name_strings(value[key])
     def same_name(node):
      return any(label.strip().casefold()==taxon.casefold()
       for label in all_name_strings(node.get('names',[])))
     node=next((x for x in items if same_name(x)),None)
     if node is None and len(items)==1:
      # PhyloPic returned only one candidate for a specific scientific query.
      node=items[0]
     if not node:raise ValueError('No taxonomic node')
     images=read(api+'/images?'+urlencode({
       'build':version,'filter_clade':node['uuid'],'page':0,
       'embed_items':'true','filter_license_by':'false',
       'filter_license_nc':'false','filter_license_sa':'false'
     }))
     entries=images.get('_embedded',{}).get('items',[])
     if isinstance(entries,dict):entries=[entries]
     valid=None
     for x in entries:
      url=x.get('_links',{}).get('vectorFile',{}).get('href','')
      if not url.startswith('https://images.phylopic.org/'):continue
      valid=(x.get('uuid'),url)
      break
     if not valid:raise ValueError('No public-domain SVG')
     image_uuid,vector_url=valid
     svg=read(vector_url,blob=True)
     if len(svg)>1200000 or b'<svg' not in svg[:1000].lower():
      raise ValueError('Non-SVG vector')
     lower=svg.lower()
     if b'<script' in lower or b'<foreignobject' in lower or b'javascript:' in lower:
      raise ValueError('Unsafe SVG content')
     cache[taxon]=(svg,image_uuid)
    svg,image_uuid=cache[taxon]
    filename=group+'.svg'
    (folder/filename).write_bytes(svg)
    records[group]={'file':filename,'taxon':taxon,'uuid':image_uuid,
      'source':'https://www.phylopic.org/images/'+image_uuid,
      'license':'CC0 or Public Domain Mark'}
    print('SILHOUETTE_BUNDLED',group,taxon,len(svg),flush=True)
   except Exception as e:
    print('SILHOUETTE_GROUP_UNAVAILABLE',group,type(e).__name__,str(e)[:120],flush=True)
 (folder/'manifest.json').write_text(
  json.dumps({'source':'PhyloPic','records':records},ensure_ascii=False,separators=(',',':')),
  encoding='utf8')
 print('SILHOUETTE_BUNDLE_RESULT',len(records),'of',len(sources),flush=True)

def bundle_curated_gold_art():
 """Publish the user-approved gold animal sheet on our OWN domain.

 Using a same-origin PNG avoids cross-origin Canvas restrictions and ensures
 exactly the displayed art can be included in the downloaded card.
 Verify the uploaded original by SHA-256 before publishing.
 """
 url='https://d2ol7oe51mr4n9.cloudfront.net/user_3IWontIKp1HpvdwOJQiSSyMEM6K/9617c2f3-64c8-4ed4-81d2-11bc33934bba.png'
 expected='4e41a446b94d9efc52250823b9486e96429caf4e62db12e3a4a57822f6b30c69'
 req=urllib.request.Request(url,headers={'User-Agent':'Animagia-Bestiary/1.0','Accept':'image/png'})
 with urllib.request.urlopen(req,timeout=40) as response:
  raw=response.read(6000000)
 if len(raw)<200000 or raw[:8]!=bytes([137,80,78,71,13,10,26,10]):
  raise ValueError('Approved gold artwork is not a valid PNG')
 if hashlib.sha256(raw).hexdigest()!=expected:
  raise ValueError('Approved gold artwork SHA-256 mismatch; deployment blocked')
 dest=DEST/'art';dest.mkdir(parents=True,exist_ok=True)
 (dest/'animals-gold-v1.png').write_bytes(raw)
 print('CURATED_GOLD_ART_READY',len(raw),'bytes',expected,flush=True)

def build():
 _snapshot_path=BASE/'russian_vernacular_snapshot.json'
 verify_original()
 verify_animal_scope()
 stats=load_birdnet_names()
 print('BIRDNET_RUSSIAN_NAMES_VALIDATED',stats,flush=True)
 verified_external={}
 verified_external_genus={}
 verified_itis={}
 verified_opentree={}
 opentree_report=BASE/'family_opentree_verified.json'
 if opentree_report.exists():
  ot=json.loads(opentree_report.read_text(encoding='utf8'))
  assert ot['source']=='OpenTree v3 strict exact taxonomy'
  assert ot['source_taxonomy']=='Catalogue of Life XR 2026-08-26'
  assert ot['initial_missing']==458
  verified_opentree=ot['families']
  assert len(verified_opentree)==ot['verified_count']
  print('OPENTREE_EXACT_FAMILIES_LOADED',len(verified_opentree),flush=True)
 itis_report=BASE/'family_itis_verified.json'
 if itis_report.exists():
  itis=json.loads(itis_report.read_text(encoding='utf8'))
  assert itis['taxon_source']=='Catalogue of Life XR 2026-08-26'
  assert itis['source']=='ITIS Solr exact accepted taxonomy'
  verified_itis=itis['families']
  assert len(verified_itis)==itis['verified_count']
  print('ITIS_EXACT_FAMILIES_LOADED',len(verified_itis),flush=True)
 external_report=BASE/'family_external_verified.json'
 if external_report.exists():
  ext=json.loads(external_report.read_text(encoding='utf8'))
  assert ext['base_source']=='Catalogue of Life XR 2026-08-26'
  verified_external=ext['families']
  verified_external_genus=ext.get('genus_based_families',{})
  assert len(verified_external)==ext['verified_count']
  assert len(verified_external_genus)==ext.get('genus_based_verified_count',len(verified_external_genus))
  assert len(verified_external)<=ext['original_unresolved']
  print('GBIF_FAMILIES_SNAPSHOT_LOADED',len(verified_external),flush=True)
 zpath=Path(os.getenv('COL_ZIP','')) if os.getenv('COL_ZIP') else BASE/'source.zip'
 if not zpath.is_file():
  print('Downloading CoL data',URL,flush=True)
  urllib.request.urlretrieve(URL,str(zpath))
 if DATA.exists():shutil.rmtree(DATA)
 DATA.mkdir(exist_ok=True,parents=True);bundle_curated_gold_art();shutil.copy2(BASE/'index.html',DEST/'index.html');shutil.copy2(BASE/'app.js',DEST/'app.js');shutil.copy2(BASE/'ru_name_lookup.js',DEST/'ru_name_lookup.js');shutil.copy2(BASE/'enhancements.js',DEST/'enhancements.js');shutil.copy2(BASE/'photo_gallery.js',DEST/'photo_gallery.js');shutil.copy2(BASE/'magic_theme.css',DEST/'magic_theme.css');shutil.copy2(BASE/'relic_card_stage1.css',DEST/'relic_card_stage1.css');shutil.copy2(BASE/'magic_ui.js',DEST/'magic_ui.js');shutil.copy2(BASE/'ritual_ui.js',DEST/'ritual_ui.js');shutil.copy2(BASE/'animal_atlas.js',DEST/'animal_atlas.js');shutil.copy2(BASE/'relic_features.js',DEST/'relic_features.js');shutil.copy2(BASE/'greek_taxa.js',DEST/'greek_taxa.js')
 # Include the approved 100-image asset in the *published* site, not only Git.
 # Fail the build if the optimized alpha sheet was lost or replaced.
 art100=BASE/'art'/'animagia-100-alpha.webp'
 raw100=art100.read_bytes()
 expected100='2c459c934ae208f1f7c0686575a0f348df1503bf4e6fec32ed0ee1237026e291'
 assert raw100[:4]==b'RIFF' and raw100[8:12]==b'WEBP'
 assert hashlib.sha256(raw100).hexdigest()==expected100,'Corrupt 100-image atlas'
 shutil.copy2(art100,DEST/'art'/'animagia-100-alpha.webp')
 shutil.copy2(BASE/'animal_atlas_100.js',DEST/'animal_atlas_100.js')
 # Species-specific art corrections: keep approved 100-image master untouched.
 corrected=BASE/'art'/'animagia-corrected-22.webp'
 replacement=corrected.read_bytes()
 assert replacement[:4]==b'RIFF' and replacement[8:12]==b'WEBP'
 assert hashlib.sha256(replacement).hexdigest()=='9876d77dfcee8e0859581678d5273b13fd1ca77d8a45b5792f334ffb1a07687b','Corrected animal art checksum mismatch'
 shutil.copy2(corrected,DEST/'art'/'animagia-corrected-22.webp')
 snake_art=BASE/'art'/'animagia-grass-snake-87.svg'
 snake_raw=snake_art.read_bytes()
 assert snake_raw.startswith(b'<svg ') and b'</svg>' in snake_raw
 assert hashlib.sha256(snake_raw).hexdigest()=='31a6276434eef7f5a5593f94885fcc40b36cc096e03f0b59f82369571dfaa216','Grass snake SVG checksum mismatch'
 shutil.copy2(snake_art,DEST/'art'/'animagia-grass-snake-87.svg')
 print('CURATED_GRASS_SNAKE_87_READY',len(snake_raw),'bytes',flush=True)
 # Publish prebuilt high-resolution transparent sprites with SHA256 verification.
 manifest=json.loads((BASE/'art'/'sharp-art-manifest.json').read_text(encoding='utf8'))
 assert manifest['scale']==4 and manifest['sourceCells']==100
 required={'animagia-100-sharp4x.webp','animagia-corrected-22-sharp4x.webp','animals-approved-01-05-sharp4x.png'}
 assert {e['file'] for e in manifest['results']}==required
 for e in manifest['results']:
  name=e['file'];data=(BASE/'art'/name).read_bytes()
  assert len(data)==e['bytes'] and hashlib.sha256(data).hexdigest()==e['sha256'],'Corrupt sharper art '+name
  shutil.copy2(BASE/'art'/name,DEST/'art'/name)
 # Preserve the 60 not-yet-replaced species 41–100 and five
 # historical approved previews. First 40 use a pixel-exact shared PNG.
 solo_dir=BASE/'art'/'individual-4x'
 solo=json.loads((solo_dir/'manifest.json').read_text(encoding='utf8'))
 assert solo['count']==0 and solo['approvedCount']==5 and len(solo['items'])==5
 outdir=DEST/'art'/'individual-4x';outdir.mkdir(parents=True,exist_ok=True)
 retained_bytes=0
 for entry in solo['items']:
  name=entry['file'];raw=(solo_dir/name).read_bytes()
  assert len(raw)==entry['size'] and hashlib.sha256(raw).hexdigest()==entry['sha256'] and raw[:4]==b'RIFF','Bad remaining animal art '+name
  shutil.copy2(solo_dir/name,outdir/name)
  retained_bytes+=len(raw)
 shutil.copy2(solo_dir/'manifest.json',outdir/'manifest.json')
 ref_source=BASE/'art'/'reference-original-01-40.png'
 ref_data=ref_source.read_bytes()
 assert ref_data[:8]==bytes([137,80,78,71,13,10,26,10])
 assert len(ref_data)==1284104
 assert hashlib.sha256(ref_data).hexdigest()=='de19956a431cd33018f7acf6b52012bf2ba3425227857bfa7b6ffe0fad816e1b','Reference must be the untouched crop of the uploaded original'
 assert int.from_bytes(ref_data[16:20],'big')==1536 and int.from_bytes(ref_data[20:24],'big')==424
 shutil.copy2(ref_source,DEST/'art'/'reference-original-01-40.png')
 print('ANIMAGIA_UNMODIFIED_REFERENCE_01_40_PUBLISHED',len(ref_data),'bytes',flush=True)
 print('ANIMAGIA_APPROVED_FIVE_LEGACY_IMAGES_READY',retained_bytes,'bytes',flush=True)
 print('CURATED_100_ART_READY',len(raw100),'bytes',expected100,flush=True)
 # First review batch is a separate alpha PNG with five individually cleaned
 # visitor-selected originals; prevent Render from serving an older cached sheet.
 art5=BASE/'art'/'animals-approved-01-05.png'
 raw5=art5.read_bytes()
 expected5='84480643a1b174fb2fc3a7f85f2db25b647ef8720448d0e8ae8d24819558f235'
 assert raw5[:8]==bytes([137,80,78,71,13,10,26,10])
 assert hashlib.sha256(raw5).hexdigest()==expected5,'First-five approved alpha atlas corrupted'
 shutil.copy2(BASE/'animal_cutout_40.js',DEST/'animal_cutout_40.js')
 shutil.copy2(BASE/'gold_contour_40.js',DEST/'gold_contour_40.js')
 for batch in ('41_60','61_80','81_100'):
  source=BASE/f'gold_contour_{batch}.js'
  assert source.stat().st_size>120000,'Missing vector batch '+batch
  shutil.copy2(source,DEST/f'gold_contour_{batch}.js')
 print('ANIMAGIA_VECTOR_100_BATCHES_PUBLISHED',flush=True)
 shutil.copy2(art5,DEST/'art'/'animals-approved-01-05.png')
 print('CURATED_FIRST_FIVE_ALPHA_READY',len(raw5),'bytes',expected5,flush=True)
 stack=[];active=False;base=-1;lines=formal=invalid_names=excluded_scope=excluded_extinct=excluded_uncertain=0;handles=collections.OrderedDict();genus_families=collections.defaultdict(set);t0=time.time()
 with tempfile.TemporaryDirectory(prefix='animagia-') as temp:
  directory=Path(temp)
  def spool(bid,row):
   file=handles.get(bid)
   if file is None:
    if len(handles)>=64:
     _,old=handles.popitem(last=False);old.close()
    file=open(directory/(str(bid)+'.part'),'a',encoding='utf8',buffering=131072);handles[bid]=file
   else:handles.move_to_end(bid)
   file.write(json.dumps(row,ensure_ascii=False,separators=(',',':'))+'\n')
  with zipfile.ZipFile(zpath) as z, z.open(next(n for n in z.namelist() if n.endswith('.txtree'))) as f:
   for raw in f:
    lines+=1
    if lines%1000000==0:print('read',lines,'seconds',round(time.time()-t0),flush=True)
    if not raw.strip() or raw.lstrip().startswith(b'#'):continue
    indent=len(raw)-len(raw.lstrip(b' '));m=RANK_RE.search(raw)
    if not m:continue
    rank=m.group(1).decode('utf8','replace').strip().lower()
    body=raw[indent:m.start()].strip().decode('utf8','replace')
    if not body:continue
    name=canonical(body,rank) if rank in RANK else parent(body)
    if not active:
     if rank=='kingdom' and name=='Animalia':active=True;base=indent;stack=[(indent,rank,name,False)]
     continue
    if indent<=base:break
    while stack and stack[-1][0]>=indent:stack.pop()
    if body.lstrip('†? ').strip().startswith(('=','*','$')):continue
    # A species can inherit extinction from its genus/family/order/etc.
    # Propagate the dagger (†) down the hierarchy before indexing.
    is_extinct=('†' in body[:3]) or (stack[-1][3] if stack else False)
    is_uncertain=body.lstrip().startswith('?')
    if rank=='genus' and name and not is_extinct:
     genus_lin={r:n for _,r,n,_ in stack}
     known_family=genus_lin.get('family','')
     if known_family:
      genus_families[genus_key(genus_lin.get('phylum',''),genus_lin.get('class',''),genus_lin.get('order',''),name)].add(known_family)
    if rank in RANK and name:
     lin={r:n for _,r,n,_ in stack}
     if is_extinct:
      excluded_extinct+=1
     elif is_uncertain:
      excluded_uncertain+=1
     elif not allow_animal_taxon(lin):
      excluded_scope+=1
     else:
      try:
       n=taxon_score(name)
      except ValueError:
       invalid_names+=1
      else:
       # Do not infer a family from a broad order or an animal's appearance.
       if lin.get('family'):
        genus_families[genus_key(lin.get('phylum',''),lin.get('class',''),lin.get('order',''),name)].add(lin['family'])
       # No extinct/uncertain record may enter the downloadable index.
       spool(n//25,indexed_taxon_row(n,name,rank,lin))
       formal+=1
    stack.append((indent,rank,name,is_extinct))
  for f in handles.values():f.close()
  unique=0;available=[];audit_ranks=collections.Counter();audit_classes=collections.Counter();family_values=set();family_counts=collections.Counter();russian_name_sources=collections.Counter();missing_families=collections.Counter();missing_samples=[];family_present=family_ru_present=species_ru_present=family_genus_inferred=family_external_inferred=family_external_genus_inferred=family_itis_inferred=family_opentree_inferred=0;bucket_sha256={};index_digest=hashlib.sha256();casefold_duplicates=0
  for p in directory.glob('*.part'):
   bid=int(p.stem);seen={}
   with p.open(encoding='utf8') as f:
    for line in f:
     r=json.loads(line)
     # The release can contain case variants of the same Latin binomial.
     # Scientific names are not distinguished by capitalization.
     key=(r[1].casefold(),r[2])
     if key in seen:
      if seen[key][1]!=r[1]:casefold_duplicates+=1
     else:
      seen[key]=r
   values=sorted(seen.values(),key=lambda r:(r[0],r[3],r[1]))
   for row in values:
    if row[7]:continue
    inferred=family_from_unambiguous_genus(genus_families,row)
    if inferred:
     row[7]=inferred
     row[8],row[9]=taxon_ru_labels(row[1],inferred,row[3],row[4],row[6],row[2])
     family_genus_inferred+=1
    else:
     evidence=verified_external.get(row[1])
     if (evidence and evidence.get('rank')==row[2] and
         evidence.get('class')==row[3] and evidence.get('order')==row[4] and
         evidence.get('phylum')==row[6] and
         evidence.get('matched_name','').casefold()==row[1].casefold() and
         evidence.get('match_type')=='EXACT' and
         evidence.get('family','').endswith('idae')):
      row[7]=evidence['family']
      row[8],row[9]=taxon_ru_labels(row[1],row[7],row[3],row[4],row[6],row[2])
      family_external_inferred+=1
     else:
      evidence=verified_external_genus.get(row[1])
      if (evidence and evidence.get('rank')==row[2] and
          evidence.get('class')==row[3] and evidence.get('order')==row[4] and
          evidence.get('phylum')==row[6] and
          evidence.get('matched_genus','').casefold()==row[1].split()[0].casefold() and
          evidence.get('source_match_rank')=='GENUS' and
          evidence.get('match_type')=='EXACT' and
          evidence.get('family','').endswith('idae')):
       row[7]=evidence['family']
       row[8],row[9]=taxon_ru_labels(row[1],row[7])
       family_external_genus_inferred+=1
    if not row[7]:
     itis_match=verified_itis.get(row[1])
     if (itis_match and itis_match.get('rank')==row[2] and
         itis_match.get('name')==row[1] and
         itis_match.get('class')==row[3] and
         itis_match.get('order')==row[4] and
         itis_match.get('phylum')==row[6] and
         itis_match.get('source')=='ITIS Solr exact valid hierarchy' and
         re.fullmatch(r'[A-Z][a-z]+idae',itis_match.get('family',''))):
      row[7]=itis_match['family']
      row[8],row[9]=taxon_ru_labels(row[1],row[7])
      family_itis_inferred+=1
    if not row[7]:
     ott=verified_opentree.get(row[1])
     if (ott and ott.get('name')==row[1] and
         ott.get('rank')==row[2] and
         ott.get('class')==row[3] and ott.get('order')==row[4] and
         ott.get('phylum')==row[6] and bool(ott.get('phylum')) and
         ott.get('match_type')=='exact_non_synonym' and
         ott.get('source')=='OpenTree v3 strict exact taxonomy' and
         isinstance(ott.get('ott_id'),int) and
         re.fullmatch(r'[A-Z][a-z]+idae',ott.get('family',''))):
      row[7]=ott['family']
      row[8],row[9]=taxon_ru_labels(row[1],row[7])
      family_opentree_inferred+=1
   unique+=len(values);available.append(bid)
   # Fail the entire publication if ANY row is invalid, misplaced,
   # duplicated, excluded, incorrectly scored or out of sorted order.
   report=audit_bucket(values,bid)
   audit_ranks.update(report['ranks']);audit_classes.update(report['classes'])
   family_present+=sum(bool(r[7]) for r in values)
   family_ru_present+=sum(bool(r[8]) for r in values)
   species_ru_present+=sum(bool(r[9]) for r in values)
   for r in values:
    if not r[9]:continue
    if r[1] in SPECIES_RU:
     russian_name_sources['manual_curated']+=1
    elif r[1] in EXTERNAL_SPECIES_RU:
     russian_name_sources['birdnet']+=1
    else:
     lookup=BULK_NAMES.get(r[1].casefold()+'|'+r[2])
     if lookup and lookup[0]==r[9]:
      russian_name_sources['taxadb_'+lookup[1]]+=1
     else:
      raise AssertionError('Unattributed Russian common name: '+r[1])
   family_values.update(r[7] for r in values if r[7])
   family_counts.update(r[7] for r in values if r[7])
   for r in values:
    if not r[7]:
     missing_families[(r[3],r[4])]+=1
     if len(missing_samples)<4000:
      missing_samples.append({'scientific_name':r[1],'rank':r[2],'class':r[3],'order':r[4]})
   blob=json.dumps(values,ensure_ascii=False,separators=(',',':')).encode('utf8')
   (DATA/(str(bid)+'.json')).write_bytes(blob)
   digest=hashlib.sha256(blob).hexdigest()
   bucket_sha256[str(bid)]=digest
   # Canonical full-index fingerprint, independent of filesystem enumeration.
   # The final digest is computed later from sorted per-bucket checksums.
   for target in (551,1258,1288):
    if bid==target//25:
     count=sum(r[0]==target for r in values)
     print('CONTROL_GREEK_TAXA',target,count,flush=True)
 family_index=[{'family':latin,'family_ru':FAMILY_RU.get(latin,''),'record_count':count,'art_key':latin}
               for latin,count in sorted(family_counts.items())]
 assert len(family_index)==len(family_values)
 assert sum(x['record_count'] for x in family_index)==family_present
 (DEST/'families_missing.json').write_text(
  json.dumps({'source':'Catalogue of Life XR 2026-08-26',
              'explanation':'Neither an original family ancestor nor a uniquely classified genus in this CoL release provided an unambiguous family; biological absence is not implied',
              'count':unique-family_present,
              'by_class_order':[{'class':cl,'order':order,'count':n}
                                for (cl,order),n in sorted(missing_families.items(),key=lambda x:(-x[1],x[0]))],
              'examples':missing_samples},ensure_ascii=False,separators=(',',':')),
  encoding='utf8')
 assert sum(missing_families.values())==unique-family_present
 (DEST/'families.json').write_text(
  json.dumps({'source':'Catalogue of Life XR 2026-08-26','kind':'family index for linking reviewed artwork',
              'count':len(family_index),'families':family_index},ensure_ascii=False,separators=(',',':')),
  encoding='utf8')
 meta={'version':'2026-08-26 XR','source':'Catalogue of Life Extended Release','url':URL,'scanned_rows':lines,'formal_rows':formal,'unique_records':unique,'skipped_uncanonical_names':invalid_names,'buckets':len(available),'bucket_width':25,'available_buckets':sorted(available)}
 meta['algorithm']='Same Greek numeral table for transcribed name and Greek-rendered Latinised scientific taxon; exact equality only'
 meta['algorithm_id']=RULE_VERSION
 meta['catalog_filter_version']=POLICY_VERSION
 meta['excluded_extinct_rows']=excluded_extinct
 meta['excluded_uncertain_rows']=excluded_uncertain
 meta['excluded_out_of_scope_rows']=excluded_scope
 meta['taxon_ranks']='species and subspecies only'
 meta['row_schema']=['greek_score','scientific_name','rank','class','order','status','phylum','family','family_ru','common_name_ru']
 meta['family_catalogue_file']='families.json'
 if external_report.exists():
  shutil.copy2(external_report,DEST/'family_external_verified.json')
  meta_gbif_src='family_external_verified.json'
 else:
  meta_gbif_src=''
 meta['family_external_evidence_file']=meta_gbif_src
 meta['family_assignments_from_unique_genus']=family_genus_inferred
 meta['family_assignments_from_exact_gbif']=family_external_inferred
 meta['family_assignments_from_exact_gbif_genus']=family_external_genus_inferred
 meta['family_assignments_from_exact_itis']=family_itis_inferred
 meta['family_assignments_from_exact_opentree']=family_opentree_inferred
 if opentree_report.exists():
  shutil.copy2(opentree_report,DEST/'family_opentree_verified.json')
  meta['family_opentree_evidence_file']='family_opentree_verified.json'
 if itis_report.exists():
  shutil.copy2(itis_report,DEST/'family_itis_verified.json')
  meta['family_itis_evidence_file']='family_itis_verified.json'
 meta['bulk_russian_names_source']=EXTERNAL_STATS
 meta['bulk_russian_name_policy']='Only real documented Russian vernacular names of accepted, exact species/subspecies; never phonetic approximations. Matches require aligned CoL and independent provider taxonomy.'
 meta['bulk_russian_vernacular_sources']={
  'dataset':'taxadb 2026 open-source licensed vernacular tables',
  'snapshot_count':RUSSIAN_SNAPSHOT['count'],
  'providers':{k:{'rows':v['rows'],'candidate_species':v['russian_candidate_keys'],'new_names_in_snapshot':v['new_names'],'license':v['license']}
    for k,v in RUSSIAN_SNAPSHOT['sources'].items()},
  'source_name_counts':dict(sorted(russian_name_sources.items())),
  'license_note':RUSSIAN_SNAPSHOT['license_notice'],
  'snapshot_sha256':hashlib.sha256(_snapshot_path.read_bytes()).hexdigest()
 }
 meta['unverified_name_presentation']='If no documented Russian species name exists, the interface identifies the zoological group as a fallback; scientific Latin name remains separately visible.'
 meta['missing_family_diagnostics']='families_missing.json'
 meta['family_catalogue']={'family_present':family_present,'family_missing':unique-family_present,
  'distinct_families':len(family_values),'family_ru_present':family_ru_present,
  'verified_species_common_names':species_ru_present}
 meta['russian_name_policy']='Curated, BirdNET+, Catalogue of Life and GBIF strict exact accepted Russian species names; otherwise genus/family group labelled as such and Latin scientific identity. No fake names.'
 meta['artwork_key']='family (the scientific family name in row[7])'
 meta['editorial_scope_warning']='Independent/nonparasitic status is approximated from taxonomy, not individually proven for each species'
 meta['category_filter']='Curated noncolonial independent animal groups: mammals, birds, reptiles, amphibians, fish, insects, spiders/scorpions, free-moving crustaceans, cephalopods and echinoderms. Excludes corals/polyps, sponges, attached molluscs and worms; ecology is inferred, not verified species by species.'
 meta['animal_name_method']='ancient-Greek-alphabet approximation of the original scientific name; not verified Ancient Greek lexical translation; digamma stands in for modern v/w'
 meta['test_vectors']=[{'latin':n,'greek':greek_transliterate(n),'score':taxon_score(n)} for n in CONTROL_NAMES]
 if sum(audit_ranks.values())!=unique or sum(audit_classes.values())!=unique:
  raise AssertionError('QA total diverges from indexed unique records')
 for bucket in sorted(available):
  index_digest.update(str(bucket).encode('ascii')+b':'+bucket_sha256[str(bucket)].encode('ascii')+b'\\n')
 meta['bucket_sha256']=bucket_sha256
 meta['quality_audit']={
  'status':'passed',
  'method':'per-record Greek recomputation, bucket, canonical name, rank, group, extinction marker, uniqueness and order',
  'checked_records':unique,
  'checked_buckets':len(available),
  'casefold_duplicate_rows_removed':casefold_duplicates,
  'rank_counts':dict(sorted(audit_ranks.items())),
  'class_counts':dict(sorted(audit_classes.items())),
  'index_sha256':index_digest.hexdigest(),
  'ecological_verification':'not performed species-by-species',
  'extant_verification':'not performed species-by-species'
 }
 print('QUALITY_AUDIT_PASSED',unique,'records',len(available),'files','sha256',index_digest.hexdigest(),flush=True)
 (DEST/'meta.json').write_text(json.dumps(meta,ensure_ascii=False,separators=(',',':')),encoding='utf8')
 print('SUCCESS',meta,'seconds',round(time.time()-t0),flush=True)
if __name__=='__main__':build()
