"""Animagia QA: semantic Greek parity, prohibited taxa, and corrupt shard rejection.

Run: python -m unittest discover -s tests -v
A working Node.js binary enables the cross-language comparison.
"""
from __future__ import annotations
import json
import pathlib
import shutil
import subprocess
import unittest
import sys

BASE=pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0,str(BASE))
from greek_taxa import greek_transliterate, taxon_score, score_greek, RULE_VERSION
from taxon_filters import allow_animal_taxon, POLICY_VERSION
from audit_index import audit_bucket
from ru_catalog import indexed_taxon_row, taxon_ru_labels, genus_key, family_from_unambiguous_genus, source_vernacular_name, RUSSIAN_SNAPSHOT, BULK_NAMES, WIKIDATA_SNAPSHOT, WIKIDATA_NAMES, wikidata_ru_label

CONTROL={
 "Naja oxiana":254,
 "Anolis cooki":551,
 "Ompok pabo":433,
 "Panthera uncia":797,
 "Canis lupus":1531,
 "Ursus arctos":2131,
 "Felis catus":1736,
 "Vulpes vulpes":1582,
 "Agapornis taranta":1268,
 "Hippopotamus amphibius":3234,
}
NODE_PROGRAM=r"""
const fs=require('node:fs'),vm=require('node:vm');
const ctx=vm.createContext({document:{addEventListener(){}},console});
vm.runInContext(fs.readFileSync('app.js','utf8'),ctx,{filename:'app.js'});
vm.runInContext(fs.readFileSync('greek_taxa.js','utf8'),ctx,{filename:'greek_taxa.js'});
const names=JSON.parse(fs.readFileSync(0,'utf8'));
const answer=vm.runInContext(
  'JSON.stringify('+JSON.stringify(names)+'.map(n=>[taxonGreek(n),taxonGreekScore(n)]))',ctx);
process.stdout.write(answer);
"""

def row(name="Panthera uncia"):
    return indexed_taxon_row(taxon_score(name),name,'species',{'class':'Mammalia','order':'Carnivora','phylum':'Chordata','family':'Felidae'})

class GreekNumericParityTests(unittest.TestCase):
    def test_fixed_known_animals(self):
        self.assertEqual(RULE_VERSION,"taxon-ancient-alphabet-v2")
        for latin,expected in CONTROL.items():
            with self.subTest(name=latin):
                self.assertEqual(taxon_score(latin),expected)
                self.assertEqual(score_greek(greek_transliterate(latin)),expected)
        self.assertEqual(score_greek("Φρέιζερ Ἁρολδός Βρούν"),1824)

    def test_python_javascript_same_all_letters(self):
        if not shutil.which("node"):
            self.skipTest("Node.js is not installed; CI installs Node 22")
        alphabet="abcdefghijklmnopqrstuvwxyz"
        tests=list(CONTROL)
        # Every Latin letter is exercised in multiple contexts, plus
        # all two-character and three-character project digraph contexts.
        for i,letter in enumerate(alphabet):
            for second in alphabet:
                tests.append("A"+letter+second+"a"+" "+"B"+second+letter+"e")
        tests.extend(["Thalassa phaeon","Oeai eus","Psyche rhodia",
                      "Ae-oth therion","Vulpes vulpes","Aba dodo gaga"])
        result=subprocess.run(["node","-e",NODE_PROGRAM],
                              input=json.dumps(tests),text=True,cwd=BASE,
                              stdout=subprocess.PIPE,stderr=subprocess.PIPE,
                              check=True,timeout=35)
        got=json.loads(result.stdout)
        self.assertEqual(len(got),len(tests))
        for name,(greek,value) in zip(tests,got):
            with self.subTest(name=name):
                self.assertEqual(greek,greek_transliterate(name))
                self.assertEqual(value,taxon_score(name))

    def test_only_approved_groups(self):
        self.assertEqual(POLICY_VERSION,"independent-noncolonial-fauna-v3")
        rejected=[
            ("Plantae","Bryophyta","Bryopsida","", ""),
            ("Animalia","Cnidaria","Anthozoa","", ""),
            ("Animalia","Porifera","Demospongiae","", ""),
            ("Animalia","Platyhelminthes","Cestoda","", ""),
            ("Animalia","Arthropoda","Arachnida","Ixodida",""),
            ("Animalia","Arthropoda","Insecta","Diptera","Culicidae"),
        ]
        for kingdom,phylum,cls,order,family in rejected:
            with self.subTest(group=cls,order=order):
                self.assertFalse(allow_animal_taxon({
                    "kingdom":kingdom,"phylum":phylum,"class":cls,
                    "order":order,"family":family}))
        for cls in ["Mammalia","Aves","Reptilia","Amphibia","Actinopterygii"]:
            self.assertTrue(allow_animal_taxon({
                "kingdom":"Animalia","phylum":"Chordata","class":cls}))

    def test_reject_source_host_contamination_and_vernacular_placeholders(self):
        from build_data import canonical
        examples=[
            ("Eimeria psittacarae","Mammalia","Chordata","Didelphimorphia"),
            ("Dactylosoma piperis","Amphibia","Chordata","Anura"),
        ]
        for scientific,animal_class,phylum,order in examples:
            with self.subTest(scientific=scientific):
                self.assertFalse(allow_animal_taxon({
                    "kingdom":"Animalia","scientific_name":scientific,
                    "phylum":phylum,"class":animal_class,"order":order
                }))
        for name in ("a weevil","some beetle","unknown fish",""):
            with self.subTest(name=name):
                self.assertEqual(canonical(name,"species"),"")
                with self.assertRaises(ValueError):
                    taxon_score(name)
        self.assertEqual(canonical("Panthera leo","species"),"Panthera leo")
        self.assertEqual(canonical("Canis lupus subsp. familiaris","subspecies"),
                         "Canis lupus familiaris")
        for phylum,cls in (("Arthropoda","Mammalia"),
                           ("Mollusca","Insecta"),
                           ("Chordata","Cephalopoda"),
                           ("Echinodermata","Malacostraca")):
            self.assertFalse(allow_animal_taxon({
                "kingdom":"Animalia","phylum":phylum,"class":cls,
                "order":"Decapoda"
            }))
        self.assertTrue(allow_animal_taxon({
            "kingdom":"Animalia","phylum":"Arthropoda",
            "class":"Insecta","order":"Coleoptera"
        }))

    def test_previous_publication_snapshot_is_pinned(self):
        import hashlib
        from ru_catalog import PUBLISHED_NAMES, PUBLISHED_RU_SHA256, published_ru_label, load_birdnet_names
        snap=BASE/'russian_published_verified_snapshot.json'
        self.assertEqual(hashlib.sha256(snap.read_bytes()).hexdigest(),PUBLISHED_RU_SHA256)
        self.assertEqual(len(PUBLISHED_NAMES),34432)
        key,item=next(iter(PUBLISHED_NAMES.items()))
        scientific,rank=key.rsplit('|',1)
        label,cls,order,phylum,family=item
        self.assertEqual(published_ru_label(scientific,family,cls,order,phylum,rank),label)
        self.assertEqual(published_ru_label(scientific,'WrongFamily',cls,order,phylum,rank),'')
        self.assertEqual(published_ru_label(scientific,family,'WrongClass',order,phylum,rank),'')
        stats=load_birdnet_names()
        self.assertFalse(stats['external_birdnet_csv_used'])

    def test_independent_scientific_reclassification_and_fossil_exclusions(self):
        from taxon_filters import REJECTED_NON_ANIMAL_NAMES
        rejected={
           "Ophiocordyceps taiwanensis":("Insecta","Arthropoda","Coleoptera"),
           "Myrmozercon iainkayi":("Insecta","Arthropoda","Hymenoptera"),
           "Petalomium brevicaudus":("Insecta","Arthropoda","Hymenoptera"),
           "Petalomium tothi":("Insecta","Arthropoda","Hymenoptera"),
           "Dipsas irregularis":("Amphibia","Chordata",""),
           "Cadurcogekko piveteaui":("Reptilia","Chordata","Squamata"),
           "Euclastes wielandi":("Reptilia","Chordata","Testudines"),
           "Eutawichthys maastrichtiensis":("Teleostei","Chordata","Beryciformes"),
           "Eutawichthys zideki":("Teleostei","Chordata","Beryciformes"),
        }
        for scientific,(cls,phylum,order) in rejected.items():
            with self.subTest(scientific=scientific):
                self.assertIn(scientific,REJECTED_NON_ANIMAL_NAMES)
                self.assertFalse(allow_animal_taxon({
                    'kingdom':'Animalia','phylum':phylum,
                    'class':cls,'order':order,'scientific_name':scientific}))
        for scientific,cls,phylum,order in [
            ('Canis lupus','Mammalia','Chordata','Carnivora'),
            ('Petalomium genericus','Arachnida','Arthropoda','Araneae'),
            ('Dipsas indica','Reptilia','Chordata','Squamata')]:
            with self.subTest(scientific=scientific):
                self.assertTrue(allow_animal_taxon({
                   'kingdom':'Animalia','phylum':phylum,
                   'class':cls,'order':order,'scientific_name':scientific}))


    def test_explicit_ru_family_names_from_zoological_sources(self):
        from ru_catalog import taxon_ru_labels
        controls={'Drosophilidae':'Плодовые мушки','Pyralidae':'Огнёвки настоящие',
                  'Tipulidae':'Комары-долгоножки',
                  'Calliphoridae':'Каллифориды','Lampyridae':'Светляки',
                  'Tortricidae':'Листовёртки','Tephritidae':'Пестрокрылки',
                  'Pterophoridae':'Пальцекрылки','Crambidae':'Огнёвки-травянки',
                  'Tabanidae':'Слепни','Elateridae':'Щелкуны',
                  'Dytiscidae':'Плавунцы','Meloidae':'Нарывники',
                  'Dermestidae':'Кожееды','Silphidae':'Мертвоеды',
                  'Cantharidae':'Мягкотелки','Raphidiidae':'Настоящие верблюдки',
                  'Myrmeleontidae':'Муравьиные львы'}
        for latin,russian in controls.items():
            with self.subTest(family=latin):
                self.assertEqual(taxon_ru_labels('Unknown species',latin)[0],russian)

    def test_verified_ru_family_source_is_exactly_attributed(self):
        from ru_catalog import WIKIDATA_FAMILY_STATS, FAMILY_RU
        import json, pathlib
        f=BASE/'family_ru_wikidata_verified.json'
        if not f.exists():
            self.assertFalse(WIKIDATA_FAMILY_STATS['available'])
            return
        record=json.loads(f.read_text(encoding='utf8'))
        self.assertEqual(record['count'],len(record['families']))
        self.assertGreaterEqual(record['count'],979)
        self.assertTrue(WIKIDATA_FAMILY_STATS['available'])
        self.assertEqual(WIKIDATA_FAMILY_STATS['snapshot_entries'],record['count'])
        self.assertGreater(WIKIDATA_FAMILY_STATS['imported'],0)
        self.assertEqual(len(record['failed_batches']),0)
        self.assertEqual(record['source'],
                         'Wikidata P225 + P105 Q35409 + Russian Wikipedia verified article')
        for latin,evidence in record['families'].items():
            self.assertIn(latin,FAMILY_RU)
            self.assertTrue(evidence['russian_article'].startswith('https://ru.wikipedia.org/wiki/'))
            self.assertTrue(evidence['source'].startswith('http://www.wikidata.org/entity/Q'))

    def test_exact_inaturalist_worms_family_evidence(self):
        from family_evidence import load_exact_families,family_for_row
        evidence=load_exact_families(BASE/'family_inat_worms_verified.json')
        self.assertEqual(len(evidence),16)
        for scientific,entry in evidence.items():
            with self.subTest(scientific=scientific):
                candidate=[1000,scientific,entry['rank'],entry['class'],entry['order'],'',
                           entry['phylum'],'','','']
                self.assertEqual(family_for_row(candidate,evidence),entry['family'])
                for changed_index in (2,3,4,6):
                    mismatched=candidate[:]
                    mismatched[changed_index]='incorrect'
                    self.assertEqual(family_for_row(mismatched,evidence),'')
                with_existing=candidate[:]
                with_existing[7]='Alreadyidae'
                self.assertEqual(family_for_row(with_existing,evidence),'')

    def test_attested_russian_wikipedia_species_only(self):
        from ru_catalog import WIKIPEDIA_RU_NAMES, WIKIPEDIA_RU_SNAPSHOT, wikipedia_ru_label
        self.assertEqual(wikipedia_ru_label('Fictivus inventus','species'),'')
        if not WIKIPEDIA_RU_NAMES:
            self.assertEqual(WIKIPEDIA_RU_SNAPSHOT,{})
            return
        self.assertEqual(WIKIPEDIA_RU_SNAPSHOT['count'],len(WIKIPEDIA_RU_NAMES))
        self.assertEqual(WIKIPEDIA_RU_SNAPSHOT['source_rank'],'Wikidata P105=Q7432 (species only)')
        for key,record in list(WIKIPEDIA_RU_NAMES.items())[:100]:
            self.assertTrue(key.endswith('|species'))
            scientific=key[:-8]
            self.assertEqual(wikipedia_ru_label(scientific,'species'),record[0])
            self.assertEqual(wikipedia_ru_label(scientific,'subspecies'),'')
            self.assertTrue(record[2].startswith('https://ru.wikipedia.org/wiki/'))

    def test_col_texttree_explicit_historical_synonyms(self):
        from build_data import texttree_synonym
        self.assertEqual(texttree_synonym('=Discodeles opisthodon (Boulenger, 1884)','species'),
                         'Discodeles opisthodon')
        self.assertEqual(texttree_synonym('≡Discodeles bufoniformis','species'),
                         'Discodeles bufoniformis')
        self.assertEqual(texttree_synonym('=Canis lupus subsp. familiaris','subspecies'),
                         'Canis lupus familiaris')
        self.assertEqual(texttree_synonym('Panthera leo','species'),'')
        self.assertEqual(texttree_synonym('=Canis lupus','genus'),'')
        self.assertEqual(texttree_synonym('=Canis lupus','species'),'Canis lupus')

    def test_family_inheritance_and_verified_russian_names(self):
        from ru_catalog import FAMILY_RU, SPECIES_RU
        self.assertEqual(taxon_ru_labels('Panthera uncia','Felidae'),('Кошачьи','Снежный барс'))
        self.assertEqual(taxon_ru_labels('Unknown species','Unknownidae'),('',''))
        self.assertEqual(taxon_ru_labels('Castor fiber','Castoridae'),('Бобровые','Бобр обыкновенный'))
        # Historic Discodeles Russian names, verified against current Cornufer taxa.
        verified_frogs={
            'Cornufer bufoniformis':'Жабовидная лягушка',
            'Cornufer guppyi':'Лягушка-гурман',
            'Cornufer malukuna':'Крапчатобрюхая лягушка',
            'Cornufer opisthodon':'Бугорчатоносая лягушка',
            'Cornufer vogti':'Океанийская лягушка',
        }
        evidence=json.loads((BASE/'ru_taxonomy.json').read_text(encoding='utf-8'))['ru_name_sources']
        for scientific,ru in verified_frogs.items():
            with self.subTest(scientific=scientific):
                self.assertEqual(taxon_ru_labels(scientific,'Ceratobatrachidae','Amphibia','Anura','Chordata','species')[1],ru)
                self.assertTrue(evidence[scientific]['published_as'].startswith('Discodeles '))
                self.assertTrue(evidence[scientific]['russian'].startswith('https://'))
                self.assertTrue(evidence[scientific]['current'].startswith('https://'))
        self.assertGreaterEqual(len(FAMILY_RU),150)
        self.assertGreaterEqual(len(SPECIES_RU),60)
        r=row()
        self.assertEqual(len(r),10)
        self.assertEqual(r[7:10],['Felidae','Кошачьи','Снежный барс'])
        audit_bucket([r],r[0]//25)
        for invalid in (r[:8]+['Псовые','Снежный барс'],
                        r[:9]+['Выдуманное название']):
            with self.assertRaises(ValueError):
                audit_bucket([invalid],r[0]//25)

    def test_family_recovery_requires_unique_taxonomic_genus(self):
        r=row()
        r[7]=''
        r[8]=''
        key=genus_key(r[6],r[3],r[4],r[1])
        self.assertEqual(family_from_unambiguous_genus({key:{'Felidae'}},r),'Felidae')
        self.assertEqual(family_from_unambiguous_genus({key:{'Felidae','Canidae'}},r),'')
        self.assertEqual(family_from_unambiguous_genus({},r),'')
        self.assertEqual(family_from_unambiguous_genus({
            genus_key('Arthropoda','Insecta','Coleoptera',r[1]):{'Felidae'}},r),'')
        r[7]='Felidae'
        self.assertEqual(family_from_unambiguous_genus({key:{'Felidae'}},r),'')

    def test_exact_gbif_evidence_snapshot(self):
        data=json.loads((BASE/'family_external_verified.json').read_text(encoding='utf-8'))
        direct=data['families']
        genera=data['genus_based_families']
        self.assertEqual(len(direct),data['verified_count'])
        self.assertEqual(len(genera),data['genus_based_verified_count'])
        self.assertFalse(set(direct)&set(genera))
        self.assertEqual(data['original_unresolved'],990)
        self.assertEqual(len(direct)+len(genera)+data['remaining_after_genus'],990)
        for name,entry in direct.items():
            self.assertEqual(entry['matched_name'].casefold(),name.casefold())
            self.assertEqual(entry['match_type'],'EXACT')
            self.assertTrue(entry['family'].endswith('idae'))
            self.assertIn(entry['rank'],('species','subspecies'))
        for name,entry in genera.items():
            self.assertEqual(entry['matched_genus'].casefold(),name.split()[0].casefold())
            self.assertEqual(entry['source_match_rank'],'GENUS')
            self.assertEqual(entry['match_type'],'EXACT')
            self.assertTrue(entry['family'].endswith('idae'))

    def test_strict_itis_family_snapshot(self):
        data=json.loads((BASE/'family_itis_verified.json').read_text(encoding='utf-8'))
        entries=data['families']
        self.assertEqual(data['source'],'ITIS Solr exact accepted taxonomy')
        self.assertEqual(len(entries),data['verified_count'])
        for name,entry in entries.items():
            self.assertEqual(entry['name'],name)
            self.assertEqual(entry['source'],'ITIS Solr exact valid hierarchy')
            self.assertTrue(entry['family'].endswith('idae'))
            self.assertEqual(entry['rank'],'species')
        self.assertEqual(data['initial_missing'],459)

    def test_strict_opentree_evidence_snapshot(self):
        data=json.loads((BASE/'family_opentree_verified.json').read_text(encoding='utf8'))
        self.assertEqual(data['source'],'OpenTree v3 strict exact taxonomy')
        self.assertEqual(data['initial_missing'],458)
        self.assertEqual(len(data['families']),data['verified_count'])
        self.assertEqual(data['verified_count'],26)
        full=0
        for name,record in data['families'].items():
            self.assertEqual(name,record['name'])
            self.assertEqual(record['rank'],'species')
            self.assertEqual(record['match_type'],'exact_non_synonym')
            self.assertTrue(record['family'].endswith('idae'))
            if record['phylum']: full+=1
        self.assertEqual(full,20,'Only records with phylum evidence can be published')

    def test_external_russian_names_are_exact_and_taxonomically_aligned(self):
        self.assertEqual(RUSSIAN_SNAPSHOT['count'],len(BULK_NAMES))
        self.assertGreater(len(BULK_NAMES),10000)
        samples=[(key,v) for key,v in BULK_NAMES.items()
                 if v[2] and v[3] and v[4] and v[5] and key.endswith('|species')]
        self.assertGreater(len(samples),100)
        key,entry=samples[0]
        scientific=key.split('|')[0]
        name,provider,phylum,cls,order,family=entry
        self.assertEqual(source_vernacular_name(scientific,family,cls,order,phylum,'species'),name)
        self.assertEqual(source_vernacular_name(scientific,family,'WrongClass',order,phylum,'species'),'')
        self.assertEqual(source_vernacular_name(scientific,family,cls,'WrongOrder',phylum,'species'),'')
        self.assertEqual(source_vernacular_name(scientific,'WrongFamily',cls,order,phylum,'species'),'')
        self.assertEqual(source_vernacular_name(scientific,family,cls,order,'WrongPhylum','species'),'')
        self.assertEqual(source_vernacular_name(scientific,family,cls,order,phylum,'subspecies'),'')

    def test_wikidata_snapshot_labels_are_real_cyrillic_and_species_only(self):
        self.assertEqual(len(WIKIDATA_NAMES),WIKIDATA_SNAPSHOT['count'])
        self.assertGreater(WIKIDATA_SNAPSHOT['count'],2000)
        self.assertEqual(wikidata_ru_label('Panthera leo','species'),'лев')
        self.assertEqual(wikidata_ru_label('Panthera leo','subspecies'),'')
        self.assertEqual(wikidata_ru_label('Unknown unknown','species'),'')
        self.assertNotEqual(WIKIDATA_NAMES.get('panthera leo'),None)
        for label,qid in list(WIKIDATA_NAMES.values())[:500]:
            self.assertRegex(label,r'[А-Яа-яЁё]')
            self.assertTrue(qid.startswith('Q') and qid[1:].isdigit())

    def test_reject_corrupt_rows(self):
        valid=row()
        bucket=valid[0]//25
        self.assertEqual(audit_bucket([valid],bucket)["rows"],1)
        bad_rows=[
            [[valid[0]+25,*valid[1:]]],  # wrong bucket
            [[valid[0],"Not a canonical name","species",*valid[3:]]],
            [[valid[0],valid[1],"variety",*valid[3:]]],
            [[valid[0],valid[1],"species",valid[3],valid[4],"†",valid[6]]],
            [[valid[0],valid[1],"species","Anthozoa",valid[4],"","Cnidaria"]],
            [valid,valid],             # duplicate
        ]
        for broken in bad_rows:
            with self.subTest(broken=broken):
                with self.assertRaises(ValueError):
                    audit_bucket(broken,bucket)

if __name__=="__main__":
    unittest.main()
