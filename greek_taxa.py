"""Deterministic Greek-letter rendering of Latinised scientific animal names.

Not an ancient-Greek lexical translation. Zoological binomials include Latin,
Latinised Greek, geographic words and modern people's names: no unique ancient
Greek equivalent exists for all Catalogue of Life taxa.
Versioned convention; change it only with complete re-indexing and a migration.
"""
from __future__ import annotations
import re
import unicodedata

RULE_VERSION = "taxon-greek-backmap-v1"
DIGRAPHS = {
    "ph": "φ", "th": "θ", "ch": "χ", "ps": "ψ", "rh": "ρ",
    "ae": "αι", "oe": "οι", "au": "αυ", "eu": "ευ",
    "ei": "ει", "ai": "αι", "ou": "ου",
}
SINGLE = {
    "a": "α", "b": "β", "c": "κ", "d": "δ", "e": "ε",
    "f": "φ", "g": "γ", "h": "χ", "i": "ι", "j": "ι",
    "k": "κ", "l": "λ", "m": "μ", "n": "ν", "o": "ο",
    "p": "π", "q": "κ", "r": "ρ", "s": "σ", "t": "τ",
    "u": "ου", "v": "β", "w": "ου", "x": "ξ",
    "y": "υ", "z": "ζ",
}
WEIGHTS = dict(zip("αβγδεζηθικλμνξοπρστυφχψω",
                   [1,2,3,4,5,7,8,9,10,20,30,40,50,60,70,80,100,200,300,400,500,600,700,800]))
WEIGHTS.update({"ς":200, "ϝ":6, "ϛ":6, "ϙ":90, "ϟ":90, "ϡ":900})
SCIENTIFIC_RE = re.compile(r"[A-Za-z]+(?:-[A-Za-z]+)*(?: [A-Za-z]+(?:-[A-Za-z]+)*)+")

def greek_transliterate(scientific_name: str) -> str:
    """Render alphabetic Latin name using a declared, reproducible convention."""
    if not SCIENTIFIC_RE.fullmatch(scientific_name):
        raise ValueError("Not a canonical Latin scientific name: " + repr(scientific_name))
    parts = []
    for word in scientific_name.lower().split():
        pieces = []
        i = 0
        while i < len(word):
            if word[i] == "-":
                pieces.append("-")
                i += 1
                continue
            two = word[i:i+2]
            if two in DIGRAPHS:
                pieces.append(DIGRAPHS[two])
                i += 2
            else:
                pieces.append(SINGLE[word[i]])
                i += 1
        translated = "".join(pieces)
        # The final sigma is merely a spelling variant, retaining value 200.
        translated = re.sub(r"σ(?=$|[-])", "ς", translated)
        parts.append(translated)
    return " ".join(parts)

def score_greek(greek: str) -> int:
    total = 0
    for character in unicodedata.normalize("NFD", greek.lower()):
        if unicodedata.category(character) == "Mn" or character.isspace() or character == "-":
            continue
        if character not in WEIGHTS:
            raise ValueError("Unknown Greek character " + repr(character))
        total += WEIGHTS[character]
    return total

def taxon_score(scientific_name: str) -> int:
    return score_greek(greek_transliterate(scientific_name))

CONTROL_NAMES = [
    "Panthera uncia", "Naja oxiana", "Anolis cooki",
    "Ourebia montana", "Canis lupus", "Ursus arctos",
    "Felis catus", "Vulpes vulpes", "Pteropus keyensis",
    "Agapornis taranta", "Hippopotamus amphibius",
]

if __name__ == "__main__":
    for scientific in CONTROL_NAMES:
        greek = greek_transliterate(scientific)
        print(f"{scientific} -> {greek} = {score_greek(greek)}")
