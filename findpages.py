import json, re, sys
from pypdf import PdfReader

r = PdfReader(sys.argv[1])
pages = {}
for i, p in enumerate(r.pages):
    t = p.extract_text() or ""
    for m in re.finditer(r"C\s?H\s?A\s?P\s?T\s?E\s?R\s+(\d)\s?(\d)", t):
        pages.setdefault(m.group(1) + m.group(2), i + 1)
print(json.dumps(pages))
