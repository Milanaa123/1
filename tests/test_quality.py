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
    return [taxon_score(name),name,"species","Mammalia","Carnivora","","Chordata"]

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
