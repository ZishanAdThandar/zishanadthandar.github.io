const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');

navToggle.addEventListener('click', () => {
  navMenu.classList.toggle('show');
});

/* ---- scroll-to-top button (was an inline onclick=) ---- */
(function () {
  var btn = document.getElementById('scrollTopBtn');
  if (!btn) return;
  btn.addEventListener('click', function () {
    var interval = setInterval(function () {
      window.scrollBy(0, -200);
      if (window.scrollY === 0) clearInterval(interval);
    }, 4);
  });
})();
