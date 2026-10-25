import unicodedata

from alphabet_maps import latin_map, greek_map
from greek import greek_alphabet, inverted_greek_alphabet
from animals import animals_list

def get_weight(c):
    x = latin_map.get(c)
    if (x):
        return x

    x = greek_alphabet.get(c)
    if (x):
        return greek_map[x.capitalize()]

    return 0

def get_sum(name):
    return sum(get_weight(c) for c in strip_accents(name.lower()))

def strip_accents(s):
   return ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn')

all_animals = None

def find_words(sum:int, max_words:int, words:list=None):

    global all_animals

    if (words is None):
        words = list()
    if (sum == 0):
        return [ ' '.join(words) ]
    if (max_words == 0):
        return [ ]

    results = list()
    for x in sorted(all_animals):
        if (x > sum):
            break

        results += find_words(sum - x, max_words - 1, words + [ all_animals[x] ])

    return results



def main():

    global all_animals
    all_animals = { get_sum(name): name.strip() for name in animals_list }

    for code in sorted(all_animals):
        print("{sum}: {animal}".format(animal=all_animals[code], sum=code))

    while (True):
        print("Enter name or number: ", end='', flush=False)
        _input = input()
        try:
            x = int(_input)
        except ValueError:
            print("Sum is: {0}".format(get_sum(_input)))
        else:
            if (x in all_animals):
                print("There is an animal with such code: '{0}'.".format(all_animals[x]))
            else:
                results = find_words(x, 3)
                if (results):
                    print("Severals group of animals found:")
                    for words in sorted(results):
                        print("  - {:};".format(words))
                else:
                    print("There are no animals with such code.")
        print('')

if (__name__ == '__main__'):
    main()
