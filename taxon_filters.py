"""Conservative filtering of known parasitic animal lineages in CoL TextTree.

This catalogue is taxonomic rather than ecological: family/lineage exclusions
cannot prove that every individual parasitic species has been identified.
"""
POLICY_VERSION = "living-recognizable-fauna-v2"

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

# Closed catalogue of recognizable animals. Taxonomic classes are only
# category proxies; they cannot reliably reveal an individual species' habitat.
# Birds (Aves) and insects (Insecta) remain eligible, but prioritized differently
# in the *display* layer, without changing any numerological values.
TERRESTRIAL_VERTEBRATES = frozenset({
    "Mammalia", "Aves", "Reptilia", "Amphibia"
})
FISH = frozenset({
    "Teleostei", "Actinopterygii", "Actinopteri", "Elasmobranchii",
    "Chondrichthyes", "Chondrostei", "Holocephali", "Myxini",
    "Petromyzonti", "Dipnoi", "Sarcopterygii"
})
AQUATIC_INVERTEBRATES = frozenset({
    "Cephalopoda", "Bivalvia", "Polyplacophora",
    "Scyphozoa", "Cubozoa", "Staurozoa", "Anthozoa",
    "Octocorallia", "Hydrozoa",
    "Asteroidea", "Ophiuroidea", "Echinoidea",
    "Holothuroidea", "Crinoidea"
})
# Known aquatic crustacean orders. Malacostraca also contains land woodlice
# and parasites: do not include the entire class indiscriminately.
AQUATIC_CRUSTACEAN_ORDERS = frozenset({
    "Decapoda", "Stomatopoda", "Euphausiacea", "Amphipoda",
    "Mysida", "Cumacea", "Isopoda"
})
# Spiders and scorpions are animal forms too, but exclude the mite orders.
RECOGNIZABLE_ARACHNID_ORDERS = frozenset({
    "Araneae", "Scorpiones", "Solifugae", "Opiliones"
})

def allow_animal_taxon(lineage: dict) -> bool:
    """Allow only explicitly listed non-parasitic animal groups.

    The source has no complete habitat/living-status field, so this function
    must not be described as exhaustive parasite/extant-species verification.
    Extinction markers are handled separately by build_data.py.
    """
    if lineage.get("kingdom") != "Animalia" or not lineage.get("phylum"):
        return False
    if EXCLUDED_TAXA.intersection(lineage.values()):
        return False
    if lineage.get("genus") in EXCLUDED_GENERA:
        return False
    group = lineage.get("class", "")
    order = lineage.get("order", "")
    if group in TERRESTRIAL_VERTEBRATES or group in FISH:
        return True
    if group == "Insecta":
        return True
    if group in AQUATIC_INVERTEBRATES:
        return True
    if group == "Malacostraca" and order in AQUATIC_CRUSTACEAN_ORDERS:
        return True
    if group == "Arachnida" and order in RECOGNIZABLE_ARACHNID_ORDERS:
        return True
    return False
