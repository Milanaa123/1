latin_map = \
{
    'a': 1,
    'b': 2,
    'c': 90,
    'd': 4,
    'e': 5,
    'f': 500,
    'g': 3,
    'h': 600,
    'i': 10,
    'j': 4,
    'k': 20,
    'l': 30,
    'm': 40,
    'n': 50,
    'o': 70,
    'p': 80,
    'q': 90,
    'r': 100,
    's': 200,
    't': 300,
    'u': 400,
    'v': 6,
    'w': 6,
    'x': 600,
    'y': 400,
    'z': 7,
}

greek_map = \
{
    'Alpha': 1,
    'Beta': 2,
    'Gamma': 3,
    'Delta': 4,
    'Epsilon': 5,
    'Zeta': 7,
    'Eta': 8,
    'Theta':9,
    'Iota': 10,
    'Kappa': 20,
    'Lamda':30,
    'Mu':40,
    'Nu': 50,
    'Xi':60,
    'Omicron':70,
    'Pi': 80,
    'Rho':100,
    'Sigma': 200,
    'Tau': 300 ,
    'Upsilon': 400,
    'Phi' :500,
    'Chi': 600,
    'Psi' : 700,
    'Omega' : 800,
}

def verify_greek():
    from greek import inverted_greek_alphabet
    for char in inverted_greek_alphabet:
        if (not char.capitalize() in greek_map):
            raise KeyError("'{char}' is missing in the greek map".format(char=char))
    for char in greek_map:
        if (not char.lower() in inverted_greek_alphabet):
            raise KeyError("'{char}' is extra in the map".format(char=char))
    return True

if (__name__ == '__main__'):
    verify_greek()