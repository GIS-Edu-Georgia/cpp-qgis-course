(function () {
  var KEY = 'cppqgis-theme';
  var root = document.documentElement;
  function get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function set(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
  function apply(t) { if (t === 'dark' || t === 'light') root.setAttribute('data-theme', t); }
  function current() {
    var t = root.getAttribute('data-theme');
    if (t) return t;
    return window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  apply(get());
  window.toggleTheme = function () {
    var n = current() === 'dark' ? 'light' : 'dark';
    apply(n); set(n);
  };
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-theme-toggle]');
    if (b) window.toggleTheme();
  });
})();
