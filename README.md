# C++ PyQGIS-იდან QGIS Core-მდე

12 თავი: PDF წიგნი და ონლაინ სლაიდები (ქართულად).

- შინაარსი: content/*.md
- აწყობა: `npm install` და `node build.mjs` (საჭიროა Google Chrome და Python + pypdf)
- შედეგი: `docs/` (სლაიდები და `docs/book.pdf`)

## მონაცემები

`data/imereti_sample.gpkg` — OpenStreetMap-ის იმერეთის ამონარიდი (ODbL 1.0), იხ. `data/NOTICE`.

## მაგალითების შემოწმება

`python tools/verify_examples.py` აკომპილებს თავები 02–09-ის ყველა დამოუკიდებელ C++ მაგალითს (g++, clang++ ან cl) და ადარებს გამოსავალს წიგნში დაწერილს.
