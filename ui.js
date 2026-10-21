/* ------------------------------------------------------------------
   ui.js — page interactions for zishanhack.com

   These were previously inline <script> blocks and inline onclick=
   handlers in index.html. They live here so the Content-Security-Policy
   can drop 'unsafe-inline' from script-src.

   Loaded after script.js, so closeAuthModal(), sendOTP(), verifyOTP()
   and hideNotification() are already defined.
   ------------------------------------------------------------------ */
(function () {
  'use strict';

  /* ---------------- FAQ accordion ---------------- */
  document.querySelectorAll('.faq-question').forEach(function (question) {
    question.setAttribute('tabindex', '0');

    question.addEventListener('click', function () {
      const answer = question.nextElementSibling;
      const icon = question.querySelector('i');

      if (!answer || !icon) return;

      const isOpen = answer.classList.contains('show');

      // Close all FAQ items
      document.querySelectorAll('.faq-answer').forEach(function (item) {
        item.classList.remove('show');
      });

      document.querySelectorAll('.faq-question i').forEach(function (i) {
        i.classList.remove('fa-chevron-up');
        i.classList.add('fa-chevron-down');
      });

      // Open clicked item if closed
      if (!isOpen) {
        answer.classList.add('show');

        icon.classList.remove('fa-chevron-down');
        icon.classList.add('fa-chevron-up');
      }
    });

    question.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        question.click();
      }
    });
  });

  /* ---------------- Mobile nav ---------------- */
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', function () {
      navMenu.classList.toggle('show');
    });
  }

  /* ------------- Auth modal (were inline onclick=) ------------- */
  const modalOverlay = document.getElementById('modalOverlay') || document.querySelector('.modal-overlay');
  if (modalOverlay) {
    modalOverlay.addEventListener('click', function () {
      closeAuthModal();
    });
  }

  const modalClose = document.getElementById('modalClose') || document.querySelector('.modal-close');
  if (modalClose) {
    modalClose.addEventListener('click', function () {
      closeAuthModal();
    });
  }

  /* ---------------- OTP buttons (were inline onclick=) ---------------- */
  const sendOtpBtn = document.getElementById('sendOtpBtn');
  if (sendOtpBtn) {
    sendOtpBtn.addEventListener('click', function () {
      sendOTP();
    });
  }

  const verifyOtpBtn = document.getElementById('verifyOtpBtn');
  if (verifyOtpBtn) {
    verifyOtpBtn.addEventListener('click', function () {
      verifyOTP();
    });
  }

  /* --------------- Notification close (was inline onclick=) --------------- */
  const notificationClose = document.getElementById('notificationClose') || document.querySelector('.notification-close');
  if (notificationClose) {
    notificationClose.addEventListener('click', function () {
      hideNotification();
    });
  }
})();
