#!/usr/bin/env python3
"""Extract attested Russian animal names from the historical BVI zoological
index. This is a conservative exact-binomial supplement, not a translator.
The original index entries and source page URLs remain traceable.
"""
from __future__ import annotations
import collections
import hashlib
import json
import re
import time
import urllib.error
import urllib.request
from html.parser import HTMLParser
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"russian_bvi_snapshot.json"
ROOT_URL="https://bvi.rusf.ru/sista/alf_r{:03d}.htm"
NAME=re.compile(r"^[A-Z][a-z-]+ [a-z-]+(?: [a-z-]+)?$")
RUSSIAN=re.compile(r"^[А-ЯЁа-яё][А-ЯЁа-яё\s\-–—()«».,'’]+$")
LINE=re.compile(r"^.{1,110}?:\s*(?P<ru>.+?)\s+[–—]\s+(?P<taxon>[A-Z][a-z-]+ [a-z-]+(?: [a-z-]+)?)\s*\[(?P<group>[^\]]+)\]",re.U)
GROUPS={
  "Млекопитающие":["Mammalia"],
  "Птицы":["Aves"],
  "Пресмыкающиеся":["Reptilia"],
  "Земноводные":["Amphibia"],
  "Насекомые":["Insecta"],
  "Паукообразные":["Arachnida"],
  "Костные рыбы":["Actinopterygii","Teleostei","Chondrostei"],
  "Хрящевые рыбы":["Elasmobranchii","Holocephali","Chondrichthyes"],
  "Головоногие моллюски":["Cephalopoda"],
  "Брюхоногие, улитки":["Gastropoda"],
  "Высшие раки, малакостраки":["Malacostraca"],
  "Панцирные, хитоны":["Polyplacophora"],
  "Морские ежи":["Echinoidea"],
  "Морские звёзды":["Asteroidea"],
}
class TextLines(HTMLParser):
 def __init__(self):super().__init__(convert_charrefs=True);self.parts=[]
 def handle_starttag(self,tag,attrs):
  if tag in ("br","p","tr","li","h1","h2"):self.parts.append("\n")
 def handle_endtag(self,tag):
  if tag in ("p","tr","li","h1","h2"):self.parts.append("\n")
 def handle_data(self,data):self.parts.append(data)

def get(page):
 url=ROOT_URL.format(page)
 req=urllib.request.Request(url,headers={"User-Agent":"Animagia-educational-russian-taxonomy/1.0"})
 try:
  with urllib.request.urlopen(req,timeout=18) as r:
   raw=r.read(1200000)
   encoding=r.headers.get_content_charset()
 except (urllib.error.URLError,TimeoutError) as e:
  return url,[],type(e).__name__
 if len(raw)>=1200000:return url,[],"oversize"
 encodings=[encoding] if encoding else []
 encodings+=["utf-8","windows-1251","koi8-r"]
 html=""
 for enc in dict.fromkeys(e for e in encodings if e):
  try:
   text=raw.decode(enc)
   if "Русские названия" in text:
    html=text;break
  except (UnicodeDecodeError,LookupError):continue
 if not html:return url,[],"no_catalogue_content"
 parser=TextLines();parser.feed(html)
 return url,"".join(parser.parts).splitlines(),None

def main():
 grouped=collections.defaultdict(set)
 evidence={}
 stats=collections.Counter()
 failures=[]
 consecutive=0
 for page in range(2,96):
  url,lines,error=get(page)
  if error:
   failures.append([page,error])
   consecutive+=1
   if page>=70 and consecutive>=9:break
   time.sleep(0.1)
   continue
  consecutive=0
  stats["pages_read"]+=1
  for raw in lines:
   line=" ".join(raw.split())
   m=LINE.match(line)
   if not m:continue
   scientific=m["taxon"].strip()
   name=m["ru"].strip()
   group=m["group"].strip()
   if group not in GROUPS or not NAME.fullmatch(scientific):continue
   if any(c in name for c in ("[","]","(",")","/")):continue
   # A single straightforward established name is chosen among separately
   # published synonyms, never a guessed translation of the scientific name.
   name=name.split(",",1)[0].strip()
   if not (3<=len(name)<=130 and RUSSIAN.fullmatch(name)):continue
   rank="species" if len(scientific.split())==2 else "subspecies"
   key=scientific.casefold()+"|"+rank
   grouped[key].add((name,group))
   evidence.setdefault(key,[name,group,url])
   stats["supported_entries"]+=1
  if page%15==0:print("BVI_RU_PAGE",page,"CANDIDATES",len(grouped),flush=True)
  time.sleep(0.15)
 names={}
 for key,possibilities in grouped.items():
  if len(possibilities)!=1:
   stats["ambiguous_scientific_names"]+=1
   continue
  name,group=next(iter(possibilities))
  names[key]=[name,GROUPS[group],evidence[key][2]]
 stats["named_entries"]=len(names)
 if len(names)<1000:raise RuntimeError("BVI source unavailable or too few matched Russian labels")
 snapshot={"source":"BVI historical taxonomy index: real Russian animal names",
    "source_url":"https://bvi.rusf.ru/sista/",
    "retrieved":"2026-10-29",
    "count":len(names),
    "stats":dict(stats),
    "missing_pages":failures,
    "names":dict(sorted(names.items()))}
 raw=json.dumps(snapshot,ensure_ascii=False,separators=(",",":"))+"\n"
 if len(raw.encode())>15000000:raise RuntimeError("Unexpected BVI snapshot size")
 OUT.write_text(raw,encoding="utf-8")
 print("BVI_RUSSIAN_SNAPSHOT_READY",len(names),"bytes",len(raw.encode()),
    "SHA256",hashlib.sha256(raw.encode()).hexdigest(),
    "failed_pages",len(failures),flush=True)

if __name__=="__main__":main()
