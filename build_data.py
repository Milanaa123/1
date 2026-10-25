#!/usr/bin/env python3
"""Generate exact-match static shards from Catalogue of Life XR 2026-08-26."""
import os,re,zipfile,json,urllib.request,shutil,tempfile,collections,time
from pathlib import Path
BASE=Path(__file__).parent.resolve();DEST=BASE/'public';DATA=DEST/'data'
URL='https://download.checklistbank.org/col/monthly/2026-08-26_xr_txtree.zip'
CH=dict(zip('abcdefghijklmnopqrstuvwxyz',[1,120,20,350,5,500,23,600,10,307,20,30,40,50,70,80,20,100,200,300,470,2,470,60,400,7]))
DI={'ph':500,'th':9,'ch':600,'ps':700,'rh':100}
RANK={'species','subspecies','variety','form','natio'}
RANK_RE=re.compile(rb'\[([^\]]+)\]\s*$');EP=re.compile(r'^[a-z][a-z-]*$');START=re.compile(r'^[A-Z][A-Za-z0-9_-]*')
SKIP={'subsp.','ssp.','var.','subvar.','f.','forma','natio','ab.','morph.','morph','×'}
def score(s):
 n=i=0;s=s.lower()
 while i<len(s):
  if s[i:i+2] in DI:n+=DI[s[i:i+2]];i+=2
  else:n+=CH.get(s[i],0);i+=1
 return n
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
 zpath=Path(os.getenv('COL_ZIP','')) if os.getenv('COL_ZIP') else BASE/'source.zip'
 if not zpath.is_file():
  print('Downloading CoL data',URL,flush=True)
  urllib.request.urlretrieve(URL,str(zpath))
 DATA.mkdir(exist_ok=True,parents=True);shutil.copy2(BASE/'index.html',DEST/'index.html');shutil.copy2(BASE/'app.js',DEST/'app.js')
 stack=[];active=False;base=-1;lines=formal=0;handles=collections.OrderedDict();t0=time.time()
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
     if rank=='kingdom' and name=='Animalia':active=True;base=indent;stack=[(indent,rank,name)]
     continue
    if indent<=base:break
    while stack and stack[-1][0]>=indent:stack.pop()
    if body.lstrip('†? ').strip().startswith(('=','*','$')):continue
    if rank in RANK and name:
     lin={r:n for _,r,n in stack}
     n=score(name)
     spool(n//25,[n,name,rank,lin.get('class',''),lin.get('order',''),'†' if '†' in body[:3] else '?' if '?' in body[:3] else '',lin.get('phylum','')])
     formal+=1
    stack.append((indent,rank,name))
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
   for target,expected in [(551,75),(1258,609),(1288,629)]:
    if bid==target//25:
     count=sum(r[0]==target for r in values);print('CONTROL',target,count,expected,flush=True)
     assert count==expected
 meta={'version':'2026-08-26 XR','source':'Catalogue of Life Extended Release','url':URL,'scanned_rows':lines,'formal_rows':formal,'unique_records':unique,'buckets':len(available),'bucket_width':25,'available_buckets':sorted(available)}
 (DEST/'meta.json').write_text(json.dumps(meta,ensure_ascii=False,separators=(',',':')),encoding='utf8')
 print('SUCCESS',meta,'seconds',round(time.time()-t0),flush=True)
if __name__=='__main__':build()
