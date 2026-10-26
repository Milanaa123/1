#!/usr/bin/env python3
"""Generate Greek-scored taxon shards for the complete Catalogue of Life XR."""
import os,re,zipfile,json,urllib.request,shutil,tempfile,collections,time,unicodedata
from original.alphabet_maps import latin_map as CH
from greek_taxa import RULE_VERSION, greek_transliterate, score_greek, taxon_score, CONTROL_NAMES
from taxon_filters import POLICY_VERSION, allow_animal_taxon
from pathlib import Path
BASE=Path(__file__).parent.resolve();DEST=BASE/'public';DATA=DEST/'data'
URL='https://download.checklistbank.org/col/monthly/2026-08-26_xr_txtree.zip'
RANK={'species','subspecies','variety','form','natio'}
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
def build():
 verify_original()
 zpath=Path(os.getenv('COL_ZIP','')) if os.getenv('COL_ZIP') else BASE/'source.zip'
 if not zpath.is_file():
  print('Downloading CoL data',URL,flush=True)
  urllib.request.urlretrieve(URL,str(zpath))
 if DATA.exists():shutil.rmtree(DATA)
 DATA.mkdir(exist_ok=True,parents=True);shutil.copy2(BASE/'index.html',DEST/'index.html');shutil.copy2(BASE/'app.js',DEST/'app.js');shutil.copy2(BASE/'enhancements.js',DEST/'enhancements.js');shutil.copy2(BASE/'photo_gallery.js',DEST/'photo_gallery.js');shutil.copy2(BASE/'magic_theme.css',DEST/'magic_theme.css');shutil.copy2(BASE/'magic_ui.js',DEST/'magic_ui.js');shutil.copy2(BASE/'greek_taxa.js',DEST/'greek_taxa.js')
 stack=[];active=False;base=-1;lines=formal=invalid_names=excluded_scope=excluded_extinct=excluded_uncertain=0;handles=collections.OrderedDict();t0=time.time()
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
       # No extinct/uncertain record may enter the downloadable index.
       spool(n//25,[n,name,rank,lin.get('class',''),lin.get('order',''),'',lin.get('phylum','')])
       formal+=1
    stack.append((indent,rank,name,is_extinct))
  for f in handles.values():f.close()
  unique=0;available=[]
  for p in directory.glob('*.part'):
   bid=int(p.stem);seen={}
   with p.open(encoding='utf8') as f:
    for line in f:
     r=json.loads(line);seen.setdefault((r[1],r[2]),r)
   values=sorted(seen.values(),key=lambda r:(r[0],r[3],r[1]))
   unique+=len(values);available.append(bid)
   (DATA/(str(bid)+'.json')).write_text(json.dumps(values,ensure_ascii=False,separators=(',',':')),encoding='utf8')
   # After restoring the old source letter weights, historic counts are obsolete.
   # Validate every unique record directly against the original arithmetic instead.
   if any(taxon_score(r[1])!=r[0] for r in values):
    raise AssertionError('Old-programme scoring mismatch in bucket '+str(bid))
   for target in (551,1258,1288):
    if bid==target//25:
     count=sum(r[0]==target for r in values)
     print('CONTROL_GREEK_TAXA',target,count,flush=True)
 meta={'version':'2026-08-26 XR','source':'Catalogue of Life Extended Release','url':URL,'scanned_rows':lines,'formal_rows':formal,'unique_records':unique,'skipped_uncanonical_names':invalid_names,'buckets':len(available),'bucket_width':25,'available_buckets':sorted(available)}
 meta['algorithm']='Same Greek numeral table for transcribed name and Greek-rendered Latinised scientific taxon; exact equality only'
 meta['algorithm_id']=RULE_VERSION
 meta['catalog_filter_version']=POLICY_VERSION
 meta['excluded_extinct_rows']=excluded_extinct
 meta['excluded_uncertain_rows']=excluded_uncertain
 meta['excluded_out_of_scope_rows']=excluded_scope
 meta['category_filter']='Recognizable non-parasitic land vertebrates, birds, fish, aquatic invertebrates, insects and spiders/scorpions; not an exhaustive living-status registry'
 meta['animal_name_method']='ancient-Greek-alphabet approximation of the original scientific name; not verified Ancient Greek lexical translation; digamma stands in for modern v/w'
 meta['test_vectors']=[{'latin':n,'greek':greek_transliterate(n),'score':taxon_score(n)} for n in CONTROL_NAMES]
 (DEST/'meta.json').write_text(json.dumps(meta,ensure_ascii=False,separators=(',',':')),encoding='utf8')
 print('SUCCESS',meta,'seconds',round(time.time()-t0),flush=True)
if __name__=='__main__':build()
