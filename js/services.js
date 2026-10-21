document.getElementById('navToggle').addEventListener('click', function() {
            document.getElementById('navMenu').classList.toggle('show');
        });

        document.addEventListener('click', function(e) {
            const navMenu = document.getElementById('navMenu');
            const navToggle = document.getElementById('navToggle');
            if (navMenu.classList.contains('show') && !navMenu.contains(e.target) && !navToggle.contains(e.target)) {
                navMenu.classList.remove('show');
            }
        });

        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                    document.getElementById('navMenu').classList.remove('show');
                }
            });
        });

        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-link');

        window.addEventListener('scroll', () => {
            let current = '';
            const scrollY = window.pageYOffset + 100;

            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.clientHeight;
                if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
                    current = section.getAttribute('id');
                }
            });

            navLinks.forEach(link => {
                link.classList.remove('nav-active');
                if (link.getAttribute('href') === `#${current}`) {
                    link.classList.add('nav-active');
                }
            });
        });
