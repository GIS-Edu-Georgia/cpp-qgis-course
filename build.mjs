// Build: content/*.md  ->  docs/ (slides)  +  dist/book.pdf (print book)
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import MarkdownIt from 'markdown-it';
import container from 'markdown-it-container';
import hljs from 'highlight.js';
import { chromium } from 'playwright-core';

const ROOT = path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1'));
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BOOK_TITLE = 'შესავალი QGIS-ის პროგრამირებაში';
const BOOK_SUBTITLE = 'C++ PyQGIS-იდან QGIS Core-მდე';
const BOOK_SUB = 'ლექციების კონსპექტი და სამუშაო რვეული გეოინფორმატიკოსებისთვის';
const AUTHOR = 'გიორგი კაპანაძე';
const PLACE_YEAR = 'თბილისი · 2026';

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ---------- markdown ----------
const md = new MarkdownIt({ html: false, typographer: false });
md.options.highlight = null;
md.renderer.rules.fence = (tokens, idx) => {
  const t = tokens[idx];
  const [lang = '', ...rest] = t.info.trim().split(/\s+/);
  const label = rest.join(' ');
  const code = t.content.replace(/\n$/, '');
  if (lang === 'output') {
    return `<figure class="code out"><figcaption><span>შედეგი</span></figcaption><pre><code>${esc(code)}</code></pre></figure>\n`;
  }
  const l = hljs.getLanguage(lang) ? lang : 'plaintext';
  const html = hljs.highlight(code, { language: l }).value;
  const name = { cpp: 'C++', python: 'Python', cmake: 'CMake', bash: 'Shell' }[lang] || lang;
  return `<figure class="code ${lang}"><figcaption><span>${name}</span>${label ? `<em>${esc(label)}</em>` : ''}</figcaption><pre><code class="hljs">${html}</code></pre></figure>\n`;
};
const BOXES = { analogy: 'ანალოგია', tip: 'დაიმახსოვრე', warn: 'ყურადღება', note: 'შენიშვნა', exercise: 'სავარჯიშო', summary: 'შეჯამება', compare: '' };
for (const [name, defTitle] of Object.entries(BOXES)) {
  md.use(container, name, {
    validate: p => p.trim().split(/\s+/)[0] === name,
    render(tokens, idx) {
      const t = tokens[idx];
      if (t.nesting === 1) {
        const title = t.info.trim().slice(name.length).trim() || defTitle;
        return `<div class="box ${name}">${title ? `<div class="box-title">${esc(title)}</div>` : ''}<div class="box-body">\n`;
      }
      return '</div></div>\n';
    },
  });
}

// ---------- content ----------
function parseChapter(file) {
  const raw = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error('no front matter: ' + file);
  const meta = {};
  for (const line of m[1].split('\n')) {
    const k = line.match(/^(\w+):\s*(.*)$/);
    if (k) meta[k[1]] = k[2].trim();
  }
  const parts = m[2].split(/^## /m);
  const intro = parts.shift().trim();
  const slides = parts.map((p, i) => {
    const nl = p.indexOf('\n');
    return { n: i + 1, title: p.slice(0, nl).trim().replace(/`/g, ''), body: p.slice(nl + 1).trim() };
  });
  return { meta, intro, slides };
}
const chapters = fs.readdirSync(path.join(ROOT, 'content')).filter(f => /^\d\d-.*\.md$/.test(f)).sort()
  .map(f => parseChapter(path.join(ROOT, 'content', f)));

const css = f => fs.readFileSync(path.join(ROOT, 'src', f), 'utf8');

// ---------- slides ----------
function slidesHtml(ch, i) {
  const { meta, slides, intro } = ch;
  const prev = chapters[i - 1], next = chapters[i + 1];
  const total = slides.length + 2;
  const title = `
  <section class="slide title" data-title="${esc(meta.title)}">
    <div class="eyebrow">ლექცია ${meta.n} · ${esc(meta.eyebrow || '')}</div>
    <h1>${esc(meta.title)}</h1>
    <div class="en">${esc(meta.en || '')}</div>
    <p class="topics">${esc(meta.topics || '')}</p>
    ${intro ? `<div class="intro">${md.render(intro)}</div>` : ''}
    <div class="hint">← → ისრებით გადაადგილება · F — სრული ეკრანი · P — ბეჭდვა</div>
  </section>`;
  const body = slides.map(s => `
  <section class="slide" data-title="${esc(s.title)}">
    <div class="eyebrow">${meta.n}.${s.n} · ${esc(meta.eyebrow || '')}</div>
    <h2>${esc(s.title)}</h2>
    <div class="content">${md.render(s.body)}</div>
  </section>`).join('\n');
  const end = `
  <section class="slide end" data-title="შემდეგ ლექციაში">
    <div class="eyebrow">შემდეგ ლექციაში</div>
    ${next ? `<h2>${esc(next.meta.n)} · ${esc(next.meta.title)}</h2><p class="topics">${esc(next.meta.topics || '')}</p>
    <a class="btn" href="L${next.meta.n}.html">გახსნა →</a>` : '<h2>გაგრძელება იქნება…</h2>'}
    <a class="btn ghost" href="../index.html">სარჩევი</a>
    ${prev ? `<a class="btn ghost" href="L${prev.meta.n}.html">← წინა ლექცია</a>` : ''}
  </section>`;
  return `<!doctype html>
<html lang="ka"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>L${meta.n} · ${esc(meta.title)} — ${BOOK_TITLE}</title>
<link rel="stylesheet" href="../assets/slides.css"></head>
<body data-total="${total}">
<div class="bar"><i></i></div>
<main id="deck">${title}${body}${end}</main>
<nav class="ctl"><button id="prev" aria-label="წინა">←</button><span id="count"></span><button id="next" aria-label="შემდეგი">→</button></nav>
<script src="../assets/slides.js"></script>
</body></html>`;
}

function indexHtml() {
  const items = chapters.map(c => `<a class="card" href="lectures/L${c.meta.n}.html"><b>${c.meta.n}</b><span>${esc(c.meta.title)}<small>${esc(c.meta.topics || '')}</small></span></a>`).join('\n');
  return `<!doctype html><html lang="ka"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${BOOK_TITLE}</title><link rel="stylesheet" href="assets/slides.css"></head>
<body class="index"><main><div class="eyebrow">კურსი</div><h1>${BOOK_TITLE}</h1><p class="en">${BOOK_SUBTITLE}</p><p class="topics">${BOOK_SUB}</p><p class="topics">${AUTHOR} · ${PLACE_YEAR}</p>
<div class="cards">${items}</div><p class="hint"><a href="book.pdf">PDF წიგნის გადმოწერა</a></p></main></body></html>`;
}

fs.mkdirSync(path.join(ROOT, 'docs/assets'), { recursive: true });
fs.mkdirSync(path.join(ROOT, 'docs/lectures'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'docs/assets/slides.css'), css('slides.css'));
fs.copyFileSync(path.join(ROOT, 'src/slides.js'), path.join(ROOT, 'docs/assets/slides.js'));
chapters.forEach((c, i) => fs.writeFileSync(path.join(ROOT, `docs/lectures/L${c.meta.n}.html`), slidesHtml(c, i)));
fs.writeFileSync(path.join(ROOT, 'docs/index.html'), indexHtml());

// ---------- book ----------
function bookHtml(pages, cover = false) {
  const toc = chapters.map(c => `
    <li><a><span class="tn">${c.meta.n}</span><span class="tt">${esc(c.meta.title)}</span><span class="tp">${pages[c.meta.n] ?? '00'}</span></a>
      <ul>${c.slides.map(s => `<li>${c.meta.n}.${s.n} ${esc(s.title)}</li>`).join('')}</ul></li>`).join('');
  const chs = chapters.map(c => `
  <section class="chapter">
    <header class="opener">
      <div class="cno">CHAPTER ${c.meta.n}</div>
      <div class="bignum">${c.meta.n}</div>
      <h1>${esc(c.meta.title)}</h1>
      <div class="en">${esc(c.meta.en || '')}</div>
      <p class="topics">${esc(c.meta.topics || '')}</p>
      ${c.intro ? `<div class="intro">${md.render(c.intro)}</div>` : ''}
    </header>
    ${c.slides.map(s => `<section class="sec"><h2><span>${c.meta.n}.${s.n}</span> ${esc(s.title)}</h2>${md.render(s.body)}</section>`).join('\n')}
  </section>`).join('\n');
  return `<!doctype html><html lang="ka"><head><meta charset="utf-8"><title>${BOOK_TITLE}</title>
<style>${css('book.css')}</style></head><body>
<section class="cover${cover ? '' : ' blank'}">${cover ? `<div class="frame"><div class="kind">${BOOK_SUB}</div><div class="mid"><div class="orn"></div><h1>${BOOK_TITLE}</h1><div class="sub">${BOOK_SUBTITLE}</div><div class="orn"></div></div><div class="foot"><div class="author">${AUTHOR}</div><div class="place">${PLACE_YEAR}</div></div></div>` : ''}</section>
<section class="toc"><h1>სარჩევი</h1><ol>${toc}</ol></section>
${chs}
</body></html>`;
}

async function renderPdf(html, out, hf = true, name = 'book.html') {
  const htmlPath = path.join(ROOT, 'dist', name);
  fs.writeFileSync(htmlPath, html);
  const browser = await chromium.launch({ executablePath: CHROME });
  const page = await browser.newPage();
  await page.goto(pathToFileURL(htmlPath).href);
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({
    path: out, width: '17cm', height: '24cm', printBackground: true, preferCSSPageSize: true,
    displayHeaderFooter: hf,
    headerTemplate: `<div style="width:100%;font:7.5pt Sylfaen,serif;color:#777;text-align:center;padding-top:6mm">${BOOK_TITLE}</div>`,
    footerTemplate: `<div style="width:100%;font:8.5pt Georgia,serif;color:#444;text-align:center;padding-bottom:6mm"><span class="pageNumber"></span></div>`,
  });
  await browser.close();
}

const out = path.join(ROOT, 'dist/book.pdf');
fs.mkdirSync(path.join(ROOT, 'dist'), { recursive: true });
await renderPdf(bookHtml({}), out);
const found = JSON.parse(execFileSync('python', ['-I', path.join(ROOT, 'findpages.py'), out], { encoding: 'utf8' }));
await renderPdf(bookHtml(found), out);
// cover: separate render without running header/footer, then swapped in as page 1
const coverFull = bookHtml(found, true);
const coverOnly = coverFull.slice(0, coverFull.indexOf('<section class="toc">')) + '</body></html>';
await renderPdf(coverOnly, path.join(ROOT, 'dist/cover.pdf'), false, 'cover.html');
execFileSync('python', ['-I', path.join(ROOT, 'swapcover.py'), out, path.join(ROOT, 'dist/cover.pdf')]);
fs.copyFileSync(out, path.join(ROOT, 'docs/book.pdf'));
console.log('chapters:', chapters.length, 'pages:', found);
