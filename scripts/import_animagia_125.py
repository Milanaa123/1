#!/usr/bin/env python3
"""Import the final 125 original Animagia drawings from separately verified user archives.

The program is deliberately strict: never overwrite any existing illustration,
never invent a species mapping and never re-encode a PNG.
"""
import hashlib
import json
import pathlib
import re
import struct
import sys
import zipfile

ROOT=pathlib.Path(__file__).resolve().parents[1]
ART=ROOT/"art"/"animagia-selected-107"
MANIFEST=ART/"manifest.json"
INPUT=ROOT/"_incoming_animagia"
EXPECTED=set([269,*range(277,401)])
PNG=b"\x89PNG\r\n\x1a\n"

def fail(msg):
    raise AssertionError(msg)

def main():
    archives=sorted(INPUT.glob("*.zip"))
    if len(archives)!=14:
        fail(f"Expected 14 independent archives, received {len(archives)}")
    old=json.loads(MANIFEST.read_text(encoding="utf8"))
    if old["count"]!=275 or len(old["files"])!=275 or old["new"]!=167:
        fail("The original 275 artwork manifest changed unexpectedly")
    known_names={entry["file"] for entry in old["files"]}
    known_shas={entry["sha256"] for entry in old["files"]}
    if len(known_shas)!=275:fail("Existing art has duplicate hashes")
    new={}
    for archive in archives:
        with zipfile.ZipFile(archive) as z:
            if z.testzip() is not None:fail(f"Damaged ZIP: {archive.name}")
            if "manifest.json" not in z.namelist():
                fail(f"Missing source manifest: {archive.name}")
            source=json.loads(z.read("manifest.json"))
            if not isinstance(source,list):fail(f"Unexpected manifest in {archive.name}")
            source_by_id={int(item["number"]):item for item in source}
            if len(source_by_id)!=len(source):
                fail(f"Duplicate manifest number in {archive.name}")
            png_names=[name for name in z.namelist() if name.startswith("PNG/") and name.endswith(".png")]
            if len(png_names)!=len(source_by_id):
                fail(f"PNG count differs from manifest in {archive.name}")
            for name in png_names:
                filename=pathlib.PurePosixPath(name).name
                match=re.fullmatch(r"(\d{3})_([A-Z][A-Za-z]*(?:_[a-z]+)+)(?:_reconstruction)?\.png", filename)
                if not match:fail(f"Invalid scientific filename: {filename}")
                number=int(match.group(1))
                if number not in EXPECTED:fail(f"Unexpected or already published artwork: {filename}")
                if number in new:fail(f"Repeated illustration number: {number}")
                source_entry=source_by_id.get(number)
                if not source_entry:fail(f"Source manifest missing number {number}")
                body=z.read(name)
                if not body.startswith(PNG) or len(body)<26 or body[25]!=6 or body[24]!=8:
                    fail(f"PNG must be original 8-bit RGBA: {filename}")
                digest=hashlib.sha256(body).hexdigest()
                if digest!=source_entry.get("sha256"):
                    fail(f"Archive SHA-256 mismatch for {filename}")
                width,height=struct.unpack(">II",body[16:24])
                if width<200 or height<200:fail(f"Suspicious image dimensions: {filename}")
                scientific=match.group(2).replace("_"," ")\n                if filename.endswith("_reconstruction.png"):\n                    scientific=scientific.removesuffix(" reconstruction")
                out_path="new/"+filename
                if out_path in known_names:fail(f"Existing image cannot be overwritten: {out_path}")
                if digest in known_shas:fail(f"Image duplicates original 275: {filename}")
                known_shas.add(digest)
                new[number]=(out_path,scientific,width,height,digest,body,filename)
    if set(new)!=EXPECTED:
        fail(f"Missing numbers: {sorted(EXPECTED-set(new))}; unexpected: {sorted(set(new)-EXPECTED)}")
    sci=[new[n][1] for n in sorted(new)]
    if len(set(sci))!=125:fail("Two new paintings use the same scientific name")
    ART.joinpath("new").mkdir(parents=True,exist_ok=True)
    examples=[]
    for number in sorted(new):
        rel,scientific,width,height,digest,body,filename=new[number]
        destination=ART/rel
        if destination.exists():fail(f"Existing artwork would be overwritten: {rel}")
        destination.write_bytes(body)
        old["files"].append({"number":number,"name":scientific,"file":rel,
                             "width":width,"height":height,"sha256":digest})
        examples.append([scientific,rel,scientific])
    old["files"].sort(key=lambda row:(row["number"] is None,row["number"] or 0))
    old["count"]=400
    old["new"]=292
    old["approval"]="108 established original PNG + 167 previous new PNG + 125 user-generated accepted drawings (2026-11-01). Hash verification, original RGBA bytes; artistic accuracy is not established for every species."
    MANIFEST.write_text(json.dumps(old,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    examples_json=json.dumps(examples,ensure_ascii=False,separators=(",",":"))
    js="""'use strict';
// Original additional 125 PNGs. Map only the explicit scientific species.
// Other taxa never receive a guessed or unrelated animal illustration.
(()=>{
  const previous=window.AnimagiaAnimalAtlas;
  if(!previous)return;
  const examples=__EXAMPLES__;
  const extra=new Map(examples.map(([latin,file,name])=>[latin,{file,name}]));
  function resolve(row){
    if(row?.[2]==='species'){
      const entry=extra.get(row[1]);
      if(entry)return Object.freeze({
        artSet:'original107',file:entry.file,scientific:row[1],name:entry.name,
        exact:row[1]!=='Froekenia clara',
        note:(row[1]==='Froekenia clara'?'Историческая художественная реконструкция, анатомия не подтверждена':'Оригинальный рисунок вида ')+entry.name+' · не фотография'
      });
    }
    return previous.resolve(row);
  }
  window.AnimagiaAnimalAtlas=Object.freeze({
    ...previous,resolve,originalArtworkCount:400,
    originalArtworkExactTaxa:previous.originalArtworkExactTaxa+124,
    additionalOriginalArtworkExamples:Object.freeze(examples.map(([scientific,file,name])=>Object.freeze({scientific,file,name})))
  });
})();
""".replace("__EXAMPLES__",examples_json)
    (ROOT/"new_art_125.js").write_text(js,encoding="utf8")
    # Patch 3 existing small text modules in place. Fail on unexpected upstream changes.
    patches={
      "selected_original_art.py":[
        ('Publish the 275 selected','Publish the 400 selected'),
        ('manifest["count"]==275 and manifest["animals"]==104 and manifest["additional"]==4 and manifest["new"]==167',
         'manifest["count"]==400 and manifest["animals"]==104 and manifest["additional"]==4 and manifest["new"]==292'),
        ('len(records)==275','len(records)==400'),
        ('ANIMAGIA_275_ORIGINAL_RGBA_PNG_PUBLISHED','ANIMAGIA_400_ORIGINAL_RGBA_PNG_PUBLISHED')],
      "build_data.py":[
        ("shutil.copy2(BASE/'new_art_167.js',DEST/'new_art_167.js')",
         "shutil.copy2(BASE/'new_art_167.js',DEST/'new_art_167.js');shutil.copy2(BASE/'new_art_125.js',DEST/'new_art_125.js')"),
        ("approved 275 original PNG assets only","approved 400 original PNG assets only")],
      "index.html":[
        ('<script src="./new_art_167.js?v=','<script src="./new_art_167.js?v=')]
    }
    for rel,replacements in patches.items():
        if rel=="index.html":continue
        file=ROOT/rel
        content=file.read_text(encoding="utf8")
        for before,after in replacements:
            if content.count(before)!=1:fail(f"Expected exactly one anchor in {rel}: {before}")
            content=content.replace(before,after)
        file.write_text(content,encoding="utf8")
    html=ROOT/"index.html"
    content=html.read_text(encoding="utf8")
    script_tag=re.search(r'<script src="\./new_art_167\.js\?v=[^"]+" defer></script>',content)
    if not script_tag:fail("Missing previous new art script in index.html")
    newtag='<script src="./new_art_125.js?v=400" defer></script>'
    if newtag in content:fail("New mapping script already loaded")
    content=content[:script_tag.end()]+newtag+content[script_tag.end():]
    html.write_text(content,encoding="utf8")
    # The original 167 drawings remain independently tested; add a separate
    # acceptance test for all new 125 names, paths and originals.
    tests=ROOT/"tests"/"test-approved-only-art.cjs"
    test_content=tests.read_text(encoding="utf8")
    edits=[
      ("'selected_art_107.js','new_art_167.js'","'selected_art_107.js','new_art_167.js','new_art_125.js'"),
      ("only the 275 accepted","only the 400 accepted"),
      ("assert.equal(manifest.count,275)","assert.equal(manifest.count,400)"),
      ("assert.equal(rows.length,275)","assert.equal(rows.length,400)"),
      ("assert.equal(new Set(rows.map(x=>x.file)).size,275)","assert.equal(new Set(rows.map(x=>x.file)).size,400)"),
      ("assert.equal(atlas.originalArtworkCount,275)","assert.equal(atlas.originalArtworkCount,400)"),
      ("assert.equal(manifest.new,167)","assert.equal(manifest.new,292)"),
      ("rows.filter(x=>x.file.startsWith('new/'))","rows.filter(x=>x.file.startsWith('new/')&&x.number<=276)")
    ]
    for before,after in edits:
        if test_content.count(before)!=1:fail(f"Unexpected test marker: {before}")
        test_content=test_content.replace(before,after)
    test_content += """
test('all 125 additional original artwork files are attached to exact scientific species',()=>{
  const extra=atlas.additionalOriginalArtworkExamples;
  assert.equal(extra.length,125);
  const mapped=new Set();
  for(const example of extra){
    const entry=rows.find(x=>x.file===example.file);
    assert(entry,'Missing manifest record '+example.file);
    assert(entry.number===269||entry.number>=277&&entry.number<=400);
    const result=atlas.resolve([1540,example.scientific,'species','Mammalia','Carnivora']);
    assert.equal(result?.file,example.file);
    assert.equal(result?.name,example.name);
    assert.equal(result?.exact,example.scientific!=='Froekenia clara');
    mapped.add(example.file);
    assert.equal(atlas.resolve([1540,example.scientific,'subspecies']),null);
  }
  assert.equal(mapped.size,125);
});
"""
    tests.write_text(test_content,encoding="utf8")
    workflow=ROOT/".github"/"workflows"/"animagia-quality.yml"
    quality=workflow.read_text(encoding="utf8")
    if quality.count("new_art_167.js")!=1:fail("Missing quality script check")
    quality=quality.replace("new_art_167.js","new_art_167.js new_art_125.js")
    quality=quality.replace("Verify 275 source PNG","Verify 400 source PNG")
    workflow.write_text(quality,encoding="utf8")
    print("ANIMAGIA_IMPORT_125_PASS",json.dumps({
        "added":len(new),"total":old["count"],
        "new":old["new"],"bytes":sum(len(new[n][5]) for n in new),
        "first":sorted(new)[:6],"last":sorted(new)[-6:]
    }),flush=True)
if __name__=="__main__":
    main()
