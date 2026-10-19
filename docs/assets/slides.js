(function () {
  var slides = Array.prototype.slice.call(document.querySelectorAll('.slide'));
  var bar = document.querySelector('.bar i');
  var count = document.getElementById('count');
  var cur = 0;
  if (new URLSearchParams(location.search).has('all')) document.body.classList.add('all');

  function show(i, push) {
    cur = Math.max(0, Math.min(slides.length - 1, i));
    slides.forEach(function (s, k) { s.classList.toggle('active', k === cur); });
    slides[cur].scrollTop = 0;
    window.scrollTo(0, 0);
    bar.style.width = (slides.length > 1 ? (cur / (slides.length - 1)) * 100 : 100) + '%';
    count.textContent = (cur + 1) + ' / ' + slides.length;
    if (push !== false) history.replaceState(null, '', '#' + (cur + 1));
  }
  function fromHash() {
    var n = parseInt(location.hash.replace('#', ''), 10);
    show(isNaN(n) ? 0 : n - 1, false);
  }
  window.addEventListener('hashchange', fromHash);
  document.getElementById('prev').onclick = function () { show(cur - 1); };
  document.getElementById('next').onclick = function () { show(cur + 1); };
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var k = e.key;
    if (k === 'ArrowRight' || k === 'PageDown' || k === ' ') { e.preventDefault(); show(cur + 1); }
    else if (k === 'ArrowLeft' || k === 'PageUp') { e.preventDefault(); show(cur - 1); }
    else if (k === 'Home') show(0);
    else if (k === 'End') show(slides.length - 1);
    else if (k === 'f' || k === 'F') { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); }
    else if (k === 'p' || k === 'P') window.print();
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
