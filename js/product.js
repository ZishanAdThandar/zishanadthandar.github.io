document.getElementById('navToggle').addEventListener('click', function() {
            document.getElementById('navMenu').classList.toggle('show');
        });

        document.querySelectorAll('.faq-question').forEach(question => {
            question.addEventListener('click', () => {
                const item = question.parentElement;
                item.classList.toggle('active');
                const icon = question.querySelector('i');
                if (item.classList.contains('active')) {
                    icon.classList.remove('fa-chevron-down');
                    icon.classList.add('fa-chevron-up');
                } else {
                    icon.classList.remove('fa-chevron-up');
                    icon.classList.add('fa-chevron-down');
                }
            });
        });

        function showNotification(message, type = 'info') {
            const notification = document.getElementById('notification');
            const text = document.getElementById('notificationText');
            const icon = document.getElementById('notificationIcon');

            notification.className = 'notification';
            notification.classList.add(`notification-${type}`);

            const icons = {
                success: 'fas fa-check-circle',
                error: 'fas fa-exclamation-circle',
                warning: 'fas fa-exclamation-triangle',
                info: 'fas fa-info-circle'
            };

            icon.className = `${icons[type]} notification-icon`;
            text.textContent = message;
            notification.classList.add('show');

            setTimeout(() => {
                notification.classList.remove('show');
            }, 3000);
        }

/* ---- notification close button (was an inline onclick=) ---- */
(function () {
  var buttons = document.querySelectorAll('.notification-close');
  Array.prototype.forEach.call(buttons, function (btn) {
    btn.addEventListener('click', function () {
      var notification = btn.parentElement && btn.parentElement.parentElement;
      if (notification) notification.classList.remove('show');
    });
  });
})();
