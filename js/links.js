document.addEventListener('DOMContentLoaded', function() {
      // Mobile navigation
      const navToggle = document.getElementById('navToggle');
      const navMenu = document.getElementById('navMenu');

      if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
          const open = navMenu.classList.toggle('show');
          navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        });

        navMenu.querySelectorAll('.nav-link').forEach(function(link) {
          link.addEventListener('click', function() {
            navMenu.classList.remove('show');
            navToggle.setAttribute('aria-expanded', 'false');
          });
        });
      }

      // Scroll to top button visibility
      const scrollBtn = document.getElementById('scrollTop');
      
      window.addEventListener('scroll', function() {
        if (window.scrollY > 300) {
          scrollBtn.classList.add('visible');
        } else {
          scrollBtn.classList.remove('visible');
        }
      });

      // Add loading class for animations
      document.body.classList.add('loaded');
    });

/* ---- scroll-to-top indicator (was an inline onclick=) ---- */
(function () {
  var btn = document.getElementById('scrollTop');
  if (!btn) return;
  btn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();
