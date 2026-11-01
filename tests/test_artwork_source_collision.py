"""Prove matching scientific artwork is sourced from its ORIGINAL file path.

The animal/ and new/ art batches legitimately reuse 24 numeric IDs; numeric
lookups must be partitioned by directory so catfish never depicts a monkey.
"""
import collections
import json
import pathlib
import sys
import unittest

ROOT=pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
from artwork_representatives_builder import artwork_sources


class OriginalArtIdentity(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.files=json.loads((ROOT/'art/animagia-selected-107/manifest.json').read_text(encoding='utf8'))['files']
        cls.sources=artwork_sources(ROOT)
        cls.by_name={row['scientific']:row['file'] for row in cls.sources}

    def test_batches_have_colliding_numbers_but_different_real_files(self):
        nums=collections.defaultdict(list)
        for row in self.files:
            if row['number'] is not None:
                nums[row['number']].append(row['file'])
        duplicates={key:values for key,values in nums.items() if len(values)>1}
        self.assertEqual(len(duplicates),24)
        self.assertIn(127,duplicates)
        self.assertIn('animals/127-Сом_европейский.png',duplicates[127])
        self.assertIn('new/127_Callithrix_kuhlii.png',duplicates[127])

    def test_species_paths_are_never_selected_from_the_wrong_batch(self):
        for sci,number in [
            ('Silurus glanis',127),
            ('Perca fluviatilis',125),
            ('Salmo salar',128),
            ('Carcharodon carcharias',114),
        ]:
            with self.subTest(species=sci):
                self.assertTrue(self.by_name[sci].startswith('animals/'+str(number).zfill(3)+'-'),
                                self.by_name[sci])
        self.assertEqual(self.by_name['Callithrix kuhlii'],'new/127_Callithrix_kuhlii.png')
        self.assertEqual(self.by_name['Zaglossus bruijni'],'new/112_Zaglossus_bruijni.png')

    def test_approved_all_taxon_sources_exist_and_are_distinct(self):
        allowed={entry['file'] for entry in self.files}
        self.assertEqual(len(self.sources),409)
        for row in self.sources:
            with self.subTest(species=row['scientific']):
                self.assertIn(row['file'],allowed)
                self.assertTrue((ROOT/'art/animagia-selected-107'/row['file']).is_file())


if __name__=='__main__':
    unittest.main()
