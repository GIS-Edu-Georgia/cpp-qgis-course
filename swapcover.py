import sys
from pypdf import PdfReader, PdfWriter

book, cover = sys.argv[1], sys.argv[2]
b = PdfReader(book)
c = PdfReader(cover)
w = PdfWriter()
w.add_page(c.pages[0])
for p in b.pages[1:]:
    w.add_page(p)
with open(book, "wb") as f:
    w.write(f)
