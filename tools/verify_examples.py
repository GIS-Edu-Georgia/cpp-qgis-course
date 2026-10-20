"""Compile and run every self-contained C++ example from chapters 02-09 and
compare the program output with the ```output block printed in the book.

Usage:   python tools/verify_examples.py
Needs:   g++ (or clang++) on PATH; on Windows with Visual Studio only, run it from
         a "Developer PowerShell" so that cl.exe is on PATH.
Skipped: snippets without main(), and examples whose output contains a memory address.
"""
import glob
import io
import os
import re
import shutil
import subprocess
import sys
import tempfile

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'content')
FENCE = re.compile(r'```cpp[ \t]+(\S+)\n(.*?)```(?:\s*\n```output\n(.*?)```)?', re.S)


def compiler():
    for name in ('g++', 'clang++'):
        if shutil.which(name):
            return name, lambda src, exe: [name, '-std=c++17', '-Wall', '-o', exe, src]
    if shutil.which('cl'):
        return 'cl', lambda src, exe: ['cl', '/nologo', '/std:c++17', '/EHsc', '/utf-8', src, f'/Fe:{exe}']
    sys.exit('No C++ compiler found (g++, clang++ or cl).')


def main():
    cc, cmd = compiler()
    print('compiler:', cc)
    work = tempfile.mkdtemp(prefix='cppv_')
    bad = 0
    total = 0
    for path in sorted(glob.glob(os.path.join(ROOT, '0[2-9]-*.md'))):
        text = io.open(path, encoding='utf-8').read()
        for m in FENCE.finditer(text):
            name, code, expected = m.groups()
            if 'int main' not in code:
                continue
            if re.search(r'#include\s+"', code):
                continue  # multi-file example (needs its own header)
            if expected and re.search(r'0x[0-9a-fA-F]{6,}', expected):
                continue  # pointer address differs on every run
            total += 1
            d = os.path.join(work, os.path.basename(path)[:2] + '_' + name.replace('.', '_'))
            os.makedirs(d, exist_ok=True)
            src = os.path.join(d, name)
            io.open(src, 'w', encoding='utf-8', newline='\n').write(code)
            exe = os.path.join(d, 'a.exe' if os.name == 'nt' else 'a.out')
            c = subprocess.run(cmd(src, exe), cwd=d, capture_output=True, text=True, errors='replace')
            tag = os.path.basename(path)[:2] + '/' + name
            if c.returncode != 0:
                print('COMPILE-FAIL', tag)
                print((c.stderr or c.stdout)[-500:])
                bad += 1
                continue
            r = subprocess.run([exe], capture_output=True, text=True, errors='replace', timeout=20)
            got = [l.rstrip() for l in r.stdout.replace('\r\n', '\n').rstrip().split('\n')]
            if expected is None:
                print('ran (no expected output in book):', tag)
            elif got != [l.rstrip() for l in expected.rstrip().split('\n')]:
                print('MISMATCH', tag)
                print('  expected:', expected.rstrip().split('\n'))
                print('  got:     ', got)
                bad += 1
            else:
                print('ok', tag)
    print(f'\n{total - bad}/{total} examples OK')
    sys.exit(1 if bad else 0)


if __name__ == '__main__':
    main()
