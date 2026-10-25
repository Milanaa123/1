"""Conservative filtering of known parasitic animal lineages in CoL TextTree.

This catalogue is taxonomic rather than ecological: family/lineage exclusions
cannot prove that every individual parasitic species has been identified.
"""
POLICY_VERSION = "nonparasitic-animals-v1"

# Exclude entire worm-like or mostly parasitic clades and known ectoparasitic
# arthropod taxa. Conservatively omit some free-living members of mixed clades.
EXCLUDED_TAXA = frozenset({
    "Acanthocephala", "Platyhelminthes", "Nematoda", "Nematomorpha",
    "Dicyemida", "Orthonectida", "Mesozoa", "Annelida", "Nemertea",
    "Myxozoa", "Myxosporea", "Malacosporea", "Neodermata",
    "Cestoda", "Trematoda", "Monogenea", "Pentastomida",
    "Copepoda", "Branchiura", "Arguloida",
    "Ixodida", "Metastigmata", "Sarcoptiformes",
    "Trombidiformes", "Mesostigmata",
    "Siphonaptera", "Phthiraptera", "Anoplura", "Amblycera",
    "Ischnocera", "Rhynchophthirina", "Strepsiptera",
    "Cymothoidae", "Gnathiidae", "Bopyridae", "Entoniscidae",
    "Caligidae", "Lernaeidae", "Lernanthropidae", "Ergasilidae",
    "Chondracanthidae", "Pennellidae", "Argulidae",
    "Eulimidae", "Pyramidellidae", "Sarcoptidae",
    "Demodicidae", "Trombiculidae", "Ixodidae", "Argasidae",
    "Pediculidae", "Pthiridae", "Pulicidae", "Ceratophyllidae",
    "Tungidae", "Cimicidae", "Polyctenidae", "Hippoboscidae",
    "Nycteribiidae", "Streblidae", "Oestridae", "Tachinidae",
    "Cuterebridae", "Gasterophilidae", "Culicidae",
    "Simuliidae", "Ceratopogonidae", "Tabanidae",
    "Braconidae", "Ichneumonidae", "Chalcididae",
    "Eulophidae", "Encyrtidae", "Eupelmidae", "Eurytomidae",
    "Mymaridae", "Mymarommatidae", "Pteromalidae",
    "Trichogrammatidae", "Torymidae", "Aphelinidae",
    "Platygastridae", "Scelionidae", "Diapriidae",
    "Figitidae", "Cynipidae", "Agaonidae",
    "Meloidae", "Rhipiphoridae"
})
EXCLUDED_GENERA = frozenset({
    "Taenia", "Echinococcus", "Diphyllobothrium", "Schistosoma",
    "Ascaris", "Enterobius", "Trichinella", "Trichuris",
    "Pediculus", "Pthirus", "Sarcoptes", "Demodex",
    "Ixodes", "Argas", "Cimex", "Pulex", "Xenopsylla",
    "Ctenocephalides", "Glossina", "Callitroga",
    "Cuterebra", "Dermatobia", "Hypoderma"
})

def allow_animal_taxon(lineage: dict) -> bool:
    # A recorded Animalia kingdom and phylum are mandatory; this rejects
    # plants, mosses, fungi, and unplaced or incomplete taxonomy.
    if lineage.get("kingdom") != "Animalia" or not lineage.get("phylum"):
        return False
    if EXCLUDED_TAXA.intersection(lineage.values()):
        return False
    if lineage.get("genus") in EXCLUDED_GENERA:
        return False
    return True
