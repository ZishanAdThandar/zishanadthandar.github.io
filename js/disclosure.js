function copyEmail() {
      const email = 'report@zishanhack.com';
      navigator.clipboard.writeText(email).then(() => {
        const btn = document.querySelector('.copy-btn');
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> Copied';
        btn.style.background = 'var(--success)';
        btn.style.color = 'white';
        btn.style.borderColor = 'var(--success)';
        
        setTimeout(() => {
          btn.innerHTML = '<i class="fas fa-copy"></i> Copy Email';
          btn.style.background = 'transparent';
          btn.style.color = 'var(--gray)';
          btn.style.borderColor = 'var(--border)';
        }, 2000);
      });
    }

/* ---- copy email button (was an inline onclick=) ---- */
(function () {
  var btn = document.querySelector('.copy-btn');
  if (!btn) return;
  btn.addEventListener('click', function () {
    if (typeof copyEmail === 'function') copyEmail();
  });
})();
