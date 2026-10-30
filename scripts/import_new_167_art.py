"""Import the 167 user-approved RGBA PNGs without changing original bytes.

Run only after every new/PNG file has been fetched from the user's verified
archive. The 108 previously approved PNGs and their old matching logic remain.
"""
from pathlib import Path
import csv
import hashlib
import json
import re
import struct

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / 'art' / 'animagia-selected-107'
EXTRA = ART / 'new'
CSV = EXTRA / 'manifest.csv'
OLD_COUNT = 108
NEW_COUNT = 167
TOTAL_COUNT = 275

def main():
    manifest_path = ART / 'manifest.json'
    manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
    assert manifest['count'] in {OLD_COUNT, TOTAL_COUNT}
    assert manifest['animals'] == 104 and manifest['additional'] == 4
    original = [x for x in manifest['files'] if not x['file'].startswith('new/')]
    assert len(original) == OLD_COUNT

    with CSV.open(encoding='utf-8-sig', newline='') as stream:
        rows = list(csv.DictReader(stream))
    assert len(rows) == NEW_COUNT
    numbers = set()
    new_entries = []
    script_entries = []
    for row in rows:
        number = int(row['Номер'])
        assert number not in numbers and 109 <= number <= 276 and number != 269
        numbers.add(number)
        filename = row['Файл']
        assert re.fullmatch(r'[0-9]{3}_[A-Za-z0-9_]+\\.png', filename), filename
        assert filename.startswith(str(number) + '_')
        scientific = filename[:-4].split('_', 1)[1].replace('_', ' ')
        assert re.fullmatch(r'[A-Z][a-zA-Z-]+(?: [a-z-]+){1,2}', scientific), scientific
        name = row['Животное'].split('  (')[0].strip()
        assert name
        data = (EXTRA / filename).read_bytes()
        assert data[:8] == b'\\x89PNG\\r\\n\\x1a\\n'
        assert data[25] == 6, 'RGBA expected: ' + filename
        width, height = struct.unpack('>II', data[16:24])
        assert (width, height) == (int(row['Ширина']), int(row['Высота']))
        digest = hashlib.sha256(data).hexdigest()
        assert digest == row['SHA256'], filename
        new_entries.append({
            'number': number, 'name': name, 'file': 'new/' + filename,
            'width': width, 'height': height, 'sha256': digest
        })
        script_entries.append([scientific, 'new/' + filename, name, number])
    assert numbers == set(range(109, 277)) - {269}

    new_entries.sort(key=lambda x: x['number'])
    script_entries.sort(key=lambda x: x[3])
    manifest['files'] = original + new_entries
    manifest['count'] = TOTAL_COUNT
    manifest['new'] = NEW_COUNT
    manifest['approval'] = (
        '108 originally approved PNG plus 167 original PNG in 2026-10-30 new batch; '
        'artistic selection, not species-anatomy certification'
    )
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\\n', encoding='utf-8')

    validator = ROOT / 'selected_original_art.py'
    s = validator.read_text(encoding='utf-8')
    s = s.replace('the 108 selected', 'the 275 selected')
    s = s.replace('manifest["count"]==108 and manifest["animals"]==104 and manifest["additional"]==4',
                  'manifest["count"]==275 and manifest["animals"]==104 and manifest["additional"]==4 and manifest["new"]==167')
    s = s.replace('assert len(records)==108', 'assert len(records)==275')
    s = s.replace('{"animals","additional"}', '{"animals","additional","new"}')
    s = s.replace('ANIMAGIA_108_ORIGINAL_RGBA_PNG_PUBLISHED',
                  'ANIMAGIA_275_ORIGINAL_RGBA_PNG_PUBLISHED')
    assert 'assert len(records)==275' in s and '{"animals","additional","new"}' in s
    validator.write_text(s, encoding='utf-8')

    js = ''''use strict';
// Original approved new PNGs. The prior 108 drawing mappings are preserved.
(()=>{
  const previous=window.AnimagiaAnimalAtlas;
  if(!previous)return;
  const newExamples=__NEW_ENTRIES__;
  const extra=new Map(newExamples.map(([latin,file,name])=>[latin,{file,name}]));
  function resolve(row){
    if(row?.[2]==='species'){
      const entry=extra.get(row[1]);
      if(entry)return Object.freeze({
        artSet:'original107',file:entry.file,scientific:row[1],name:entry.name,
        exact:true,note:'Оригинальный рисунок «'+entry.name+'» · не фотография'
      });
    }
    return previous.resolve(row);
  }
  window.AnimagiaAnimalAtlas=Object.freeze({
    ...previous,resolve,originalArtworkCount:275,
    originalArtworkExactTaxa:previous.originalArtworkExactTaxa+extra.size,
    newOriginalArtworkExamples:Object.freeze(newExamples.map(([scientific,file,name])=>
      Object.freeze({scientific,file,name})))
  });
})();
'''
    js = js.replace('__NEW_ENTRIES__', json.dumps([x[:3] for x in script_entries], ensure_ascii=False))
    (ROOT / 'new_art_167.js').write_text(js, encoding='utf-8')

    html = ROOT / 'index.html'
    s = html.read_text(encoding='utf-8')
    old = '<script src="./selected_art_107.js?v=108-approved-card-art-restore-20261029" defer></script>'
    extra_js = '<script src="./new_art_167.js?v=approved-275-20261030" defer></script>'
    if extra_js not in s:
        assert old in s
        s = s.replace(old, old + extra_js)
    html.write_text(s, encoding='utf-8')

    builder = ROOT / 'build_data.py'
    s = builder.read_text(encoding='utf-8')
    existing = "shutil.copy2(BASE/'selected_art_107.js',DEST/'selected_art_107.js')"
    extra_copy = "shutil.copy2(BASE/'new_art_167.js',DEST/'new_art_167.js')"
    if extra_copy not in s:
        assert existing in s
        s = s.replace(existing, existing + '\\n shutil.copy2(BASE/\'new_art_167.js\',DEST/\'new_art_167.js\')')
    s = s.replace('approved 107 original PNG assets only', 'approved 275 original PNG assets only')
    builder.write_text(s, encoding='utf-8')

    testfile = ROOT / 'tests' / 'test-approved-only-art.cjs'
    s = testfile.read_text(encoding='utf-8')
    s = s.replace("['animal_atlas.js','selected_art_107.js']",
                  "['animal_atlas.js','selected_art_107.js','new_art_167.js']")
    s = s.replace('only the 108 accepted', 'only the 275 accepted')
    s = s.replace('manifest.count,108', 'manifest.count,275')
    s = s.replace('rows.length,108', 'rows.length,275')
    s = s.replace(')).size,108', ')).size,275')
    s = s.replace('atlas.originalArtworkCount,108', 'atlas.originalArtworkCount,275')
    s = s.replace(
      "rows.filter(item=>item.name!=='Лягушка')",
      "rows.filter(item=>item.name!=='Лягушка'&&!item.file.startsWith('new/'))"
    )
    assert 'manifest.count,275' in s and 'new_art_167.js' in s
    # Do not alter the existing 108-original-artwork coverage test; extend it.
    s += """
test('all 167 new original PNGs belong to their own approved cards',()=>{
 assert.equal(manifest.new,167);
 const newRows=rows.filter(x=>x.file.startsWith('new/'));
 assert.equal(newRows.length,167);
 assert.equal(atlas.newOriginalArtworkExamples.length,167);
 for(const item of atlas.newOriginalArtworkExamples){
   const entry=newRows.find(x=>x.file===item.file);
   assert(entry,'new original image missing: '+item.file);
   const profile=atlas.resolve([1540,item.scientific,'species','Mammalia','Carnivora']);
   assert.equal(profile?.file,item.file,'wrong original drawing: '+item.scientific);
   assert.equal(profile?.name,item.name);
   assert.equal(profile?.exact,true);
 }
 assert.equal(atlas.resolve([1540,'NoSuchAnimal noanimal','species']),null);
});
"""
    testfile.write_text(s, encoding='utf-8')

    quality = ROOT / '.github' / 'workflows' / 'animagia-quality.yml'
    s = quality.read_text(encoding='utf-8')
    s = s.replace('selected_art_107.js approved_only_cards.js',
                  'selected_art_107.js new_art_167.js approved_only_cards.js')
    s = s.replace('Verify 107 source PNG', 'Verify 275 source PNG')
    quality.write_text(s, encoding='utf-8')
    print('ANIMAGIA_NEW_167_IMPORTED', NEW_COUNT,
          'TOTAL_APPROVED', len(manifest['files']), flush=True)

if __name__ == '__main__':
    main()
