"""Conservative, explicitly curated catalogue of independent animal forms.

Breathing is not a suitable taxonomic filter: coral polyps breathe by diffusion.
A class-level allowlist is an editorial approximation of the requested
free-living, independently moving forms; taxonomic source lacks life-history
or ecology flags sufficient to guarantee absence of every parasite.
"""
POLICY_VERSION = "independent-noncolonial-fauna-v3"

# Source-backed exclusions: these are Apicomplexa parasites, not the animals
# from whose host-class branches the published CoL records were derived.
# Eimeria: https://pubmed.ncbi.nlm.nih.gov/30314136/
# Dactylosoma: https://pmc.ncbi.nlm.nih.gov/articles/PMC7746082/
REJECTED_NON_ANIMAL_NAMES = frozenset({
    "Eimeria psittacarae",
    "Dactylosoma piperis",
    # Described as a fungus, erroneously listed in Insecta/Coleoptera.
    # https://doi.org/10.11646/phytotaxa.660.2.1
    "Ophiocordyceps taiwanensis",
    # Mites wrongly inherited their ant-host Hymenoptera classification.
    # https://doi.org/10.11646/zootaxa.4137.3.5
    # https://doi.org/10.1080/01647950308684325
    # https://www.researchgate.net/publication/269872816
    "Petalomium brevicaudus",
    "Petalomium tothi",
    "Myrmozercon iainkayi",
    # This name refers to a synonym of the reptile Boiga irregularis,
    # not an amphibian (Reptile Database).
    # https://reptile-database.reptarium.cz/Boiga/irregularis
    "Dipsas irregularis",
    # Mesozoic/Paleogene fossils were not dagger-marked in the source.
    # https://doi.org/10.1002/ar.22856
    # https://escholarship.org/uc/item/7253p3tf
    # https://doi.org/10.1073/pnas.2322863121
    "Cadurcogekko piveteaui",
    "Euclastes wielandi",
    "Eutawichthys maastrichtiensis",
    "Eutawichthys zideki",
})


# Exclude entire worm-like or mostly parasitic clades and known ectoparasitic
# arthropod taxa. Conservatively omit some free-living members of mixed clades.
EXCLUDED_TAXA = frozenset({
    "Acanthocephala", "Platyhelminthes", "Nematoda", "Nematomorpha",
    # No polyps, corals, colonial/sessile filter feeders or worm-like forms.
    "Cnidaria", "Porifera", "Bryozoa", "Entoprocta",
    "Ctenophora", "Hemichordata", "Tunicata", "Urochordata",
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
    "Chondrichthyes", "Chondrostei", "Holocephali",
    "Dipnoi", "Sarcopterygii"
})
AQUATIC_INVERTEBRATES = frozenset({
    # Free-moving octopuses/squids, chitons, starfish, urchins, sea cucumbers.
    # Deliberately exclude all Cnidaria (including swimming medusae),
    # sessile/partly sessile Bivalvia, and attached Crinoidea.
    "Cephalopoda", "Polyplacophora",
    "Asteroidea", "Ophiuroidea", "Echinoidea", "Holothuroidea"
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
    """Restrict to approved, recognizable independently moving animal groups.

    Not a guaranteed ecological test. Extinction markers are handled by
    build_data.py. We deliberately omit some eligible animals when the
    source cannot resolve independence from the taxonomic hierarchy.
    """
    if lineage.get("kingdom") != "Animalia" or not lineage.get("phylum"):
        return False
    if lineage.get("scientific_name") in REJECTED_NON_ANIMAL_NAMES:
        return False
    if EXCLUDED_TAXA.intersection(lineage.values()):
        return False
    if lineage.get("genus") in EXCLUDED_GENERA:
        return False
    group = lineage.get("class", "")
    order = lineage.get("order", "")
    # Taxonomic class and phylum must agree; host-derived or malformed
    # lineages must never turn parasites into vertebrate animal matches.
    phylum = lineage["phylum"]
    if group in TERRESTRIAL_VERTEBRATES or group in FISH:
        return phylum == "Chordata"
    if group == "Insecta":
        return phylum == "Arthropoda"
    if group in AQUATIC_INVERTEBRATES:
        return (phylum == "Mollusca" if group in {"Cephalopoda","Polyplacophora"}
                else phylum == "Echinodermata")
    if group == "Malacostraca" and order in AQUATIC_CRUSTACEAN_ORDERS:
        return phylum == "Arthropoda"
    if group == "Arachnida" and order in RECOGNIZABLE_ARACHNID_ORDERS:
        return phylum == "Arthropoda"
    return False
