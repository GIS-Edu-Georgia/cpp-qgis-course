"""Copy the chapter 12 stage-1 project (main.cpp + CMakeLists.txt) out of the book text
into examples/ch12-district-area/, so the book and the runnable project stay in sync.

Usage: python tools/extract_examples.py
"""
import io
import os
import re

here = os.path.dirname(os.path.abspath(__file__))
md = io.open(os.path.join(here, '..', 'content', '12-project.md'), encoding='utf-8').read()
out = os.path.join(here, '..', 'examples', 'ch12-district-area')
os.makedirs(out, exist_ok=True)


def first(lang, label):
    m = re.search(r'```' + lang + r'[ \t]+' + re.escape(label) + r'\n(.*?)```', md, re.S)
    if not m:
        raise SystemExit(f'block {lang} {label} not found')
    return m.group(1)


for lang, label in (('cpp', 'main.cpp'), ('cmake', 'CMakeLists.txt')):
    io.open(os.path.join(out, label), 'w', encoding='utf-8', newline='\n').write(first(lang, label))
    print('wrote', os.path.join('examples', 'ch12-district-area', label))
