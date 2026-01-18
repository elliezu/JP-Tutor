import re
from collections import Counter

f = open('jlpt.html', 'r', encoding='utf-8').read()

# N5 KANJI
m = re.search(r'const N5_KANJI = \[(.*?)\];', f, re.DOTALL)
if m:
    kanji = re.findall(r"k:'(.)'", m.group(1))
    print('N5 KANJI Total:', len(kanji))
    dups = [(k, v) for k, v in Counter(kanji).items() if v > 1]
    print('N5 Duplicates count:', len(dups))
    with open('dups.txt', 'w', encoding='utf-8') as out:
        out.write('N5 Duplicates:\n')
        for k, v in dups:
            out.write(f'{k}: {v}회\n')

# N4 KANJI
m2 = re.search(r'const N4_KANJI = \[(.*?)\];', f, re.DOTALL)
if m2:
    kanji2 = re.findall(r"k:'(.)'", m2.group(1))
    print('N4 KANJI Total:', len(kanji2))
    dups2 = [(k, v) for k, v in Counter(kanji2).items() if v > 1]
    print('N4 Duplicates count:', len(dups2))
    with open('dups.txt', 'a', encoding='utf-8') as out:
        out.write('\nN4 Duplicates:\n')
        for k, v in dups2:
            out.write(f'{k}: {v}회\n')

print('Results saved to dups.txt')
