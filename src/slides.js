(function () {
  var slides = Array.prototype.slice.call(document.querySelectorAll('.slide'));
  var bar = document.querySelector('.bar i');
  var cur = 0;
  var isPresenter = /[?&]presenter=1/.test(location.search);
  var chan = null;
  try { if ('BroadcastChannel' in window) chan = new BroadcastChannel('cppqgis:' + location.pathname); } catch (e) {}
  if (new URLSearchParams(location.search).has('all')) document.body.classList.add('all');

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html !== undefined) n.innerHTML = html;
    return n;
  }
  function noteHtml(i) {
    var n = slides[i] && slides[i].querySelector('.box.speaker .box-body');
    return n ? n.innerHTML : '';
  }

  // ---------- UI ----------
  var dock = el('div', 'dock');
  dock.innerHTML =
    '<button id="prev" aria-label="წინა">←</button><span id="count"></span>' +
    '<button id="next" aria-label="შემდეგი">→</button>' +
    '<button id="blist" title="სლაიდების სია (O)">☰</button>' +
    '<button id="blaser" title="ლაზერი (L)">⌖</button>' +
    '<button id="btheme" data-theme-toggle title="თემა (D)">◐</button>';
  document.body.appendChild(dock);

  var keys = el('div', 'keys',
    '<span><kbd>←</kbd>/<kbd>→</kbd> ნავიგაცია</span> · <span><kbd>O</kbd> სლაიდების სია</span> · ' +
    '<span><kbd>N</kbd> ჩანაწერები</span> · <span><kbd>S</kbd> ლექტორის ხედი</span> · ' +
    '<span><kbd>L</kbd> ლაზერი</span> · <span><kbd>D</kbd> თემა</span> · ' +
    '<span><kbd>F</kbd> ეკრანი</span> · <span><kbd>P</kbd> PDF</span>');
  document.body.appendChild(keys);

  var listOv = el('div', 'ov');
  listOv.innerHTML = '<h3>სლაიდების სია</h3><div class="lst"></div>';
  document.body.appendChild(listOv);
  var lst = listOv.querySelector('.lst');
  slides.forEach(function (s, i) {
    var b = el('button', '', '<b>' + (i + 1) + '</b>' + (s.getAttribute('data-title') || ''));
    b.onclick = function () { closeOv(); show(i); };
    lst.appendChild(b);
  });
  function openList() {
    Array.prototype.forEach.call(lst.children, function (b, i) { b.classList.toggle('cur', i === cur); });
    listOv.classList.add('open');
  }
  function closeOv() { listOv.classList.remove('open'); }
  listOv.addEventListener('click', function (e) { if (e.target === listOv) closeOv(); });

  var notes = el('div', 'notes');
  document.body.appendChild(notes);
  function renderNotes() {
    var h = noteHtml(cur);
    notes.innerHTML = '<div class="lbl">ლექტორის ჩანაწერები</div>' +
      (h || '<p style="color:var(--mute)">ამ სლაიდზე ჩანაწერი არ არის.</p>');
  }

  var laser = el('div'); laser.id = 'laser';
  document.body.appendChild(laser);
  function toggleLaser() {
    document.body.classList.toggle('laser');
    document.getElementById('blaser').classList.toggle('on', document.body.classList.contains('laser'));
  }
  document.addEventListener('mousemove', function (e) {
    laser.style.left = e.clientX + 'px'; laser.style.top = e.clientY + 'px';
  });

  // ---------- presenter view ----------
  var pv = null, pvCur, pvNext, pvNotes, pvTime, pvCount, t0 = Date.now();
  if (isPresenter) {
    document.body.classList.add('presenter');
    pv = el('div', 'pv');
    pv.innerHTML =
      '<div class="pv-top"><span class="tm">00:00</span><span class="pc"></span>' +
      '<span style="margin-left:auto;color:var(--mute)">← → გადასვლა · ორივე ფანჯარა სინქრონულია</span></div>' +
      '<div class="pv-cur"><span class="cap">მიმდინარე</span><div class="slot"></div></div>' +
      '<div class="pv-right"><div class="pv-next"><span class="cap">შემდეგი</span><div class="slot"></div></div>' +
      '<div class="pv-notes"><div class="lbl" style="font-size:.7em;letter-spacing:.12em;color:var(--accent);font-weight:700">ჩანაწერები</div><div class="nt"></div></div></div>';
    document.body.appendChild(pv);
    pvCur = pv.querySelector('.pv-cur .slot');
    pvNext = pv.querySelector('.pv-next .slot');
    pvNotes = pv.querySelector('.nt');
    pvTime = pv.querySelector('.tm');
    pvCount = pv.querySelector('.pc');
    pvTime.title = 'დააჭირე ტაიმერის განულებისთვის';
    pvTime.style.cursor = 'pointer';
    pvTime.onclick = function () { t0 = Date.now(); };
    setInterval(function () {
      var s = Math.floor((Date.now() - t0) / 1000);
      pvTime.textContent = ('0' + Math.floor(s / 60)).slice(-2) + ':' + ('0' + (s % 60)).slice(-2);
    }, 500);
  }
  function renderPresenter() {
    if (!pv) return;
    function clone(i) {
      var c = slides[i].cloneNode(true);
      c.classList.add('active');
      return c;
    }
    pvCur.innerHTML = ''; pvCur.appendChild(clone(cur));
    pvNext.innerHTML = '';
    if (cur + 1 < slides.length) pvNext.appendChild(clone(cur + 1));
    else pvNext.innerHTML = '<p style="padding:1em;color:var(--mute)">ბოლო სლაიდია</p>';
    var h = noteHtml(cur);
    pvNotes.innerHTML = h || '<p style="color:var(--mute)">ჩანაწერი არ არის.</p>';
    pvCount.textContent = (cur + 1) + ' / ' + slides.length + ' · ' + (slides[cur].getAttribute('data-title') || '');
  }
  function openPresenter() {
    var url = location.pathname + '?presenter=1#' + (cur + 1);
    window.open(url, 'cppqgis-presenter', 'width=1180,height=720');
  }

  // ---------- navigation ----------
  function show(i, push, remote) {
    cur = Math.max(0, Math.min(slides.length - 1, i));
    slides.forEach(function (s, k) { s.classList.toggle('active', k === cur); });
    slides[cur].scrollTop = 0;
    window.scrollTo(0, 0);
    bar.style.width = (slides.length > 1 ? (cur / (slides.length - 1)) * 100 : 100) + '%';
    document.getElementById('count').textContent = (cur + 1) + ' / ' + slides.length;
    if (push !== false && !isPresenter) history.replaceState(null, '', '#' + (cur + 1));
    renderNotes();
    renderPresenter();
    if (chan && !remote) chan.postMessage({ i: cur });
  }
  function fromHash() {
    var n = parseInt(location.hash.replace('#', ''), 10);
    show(isNaN(n) ? 0 : n - 1, false);
  }
  if (chan) chan.onmessage = function (e) { if (e.data && typeof e.data.i === 'number') show(e.data.i, false, true); };
  window.addEventListener('hashchange', function () { if (!isPresenter) fromHash(); });
  document.getElementById('prev').onclick = function () { show(cur - 1); };
  document.getElementById('next').onclick = function () { show(cur + 1); };
  document.getElementById('blist').onclick = openList;
  document.getElementById('blaser').onclick = toggleLaser;

  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var k = e.key, c = e.code;
    if (k === 'Escape') { closeOv(); notes.classList.remove('open'); return; }
    if (k === 'ArrowRight' || k === 'PageDown' || k === ' ') { e.preventDefault(); show(cur + 1); }
    else if (k === 'ArrowLeft' || k === 'PageUp') { e.preventDefault(); show(cur - 1); }
    else if (k === 'Home') show(0);
    else if (k === 'End') show(slides.length - 1);
    // letter keys by physical key, so they work on the Georgian layout too
    else if (c === 'KeyO') { listOv.classList.contains('open') ? closeOv() : openList(); }
    else if (c === 'KeyN') notes.classList.toggle('open');
    else if (c === 'KeyS') openPresenter();
    else if (c === 'KeyL') toggleLaser();
    else if (c === 'KeyD') window.toggleTheme && window.toggleTheme();
    else if (c === 'KeyF') { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); }
    else if (c === 'KeyP') window.print();
  });

  var x0 = null;
  document.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  document.addEventListener('touchend', function (e) {
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 60) show(cur + (dx < 0 ? 1 : -1));
    x0 = null;
  });
  fromHash();
})();
