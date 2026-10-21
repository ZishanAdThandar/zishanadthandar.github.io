document.addEventListener('DOMContentLoaded', () => {
            // Mobile menu toggle
            const navToggle = document.getElementById('navToggle');
            const navMenu = document.getElementById('navMenu');
            
            if (navToggle && navMenu) {
                navToggle.addEventListener('click', function() {
                    navMenu.classList.toggle('show');
                    // Change icon based on menu state
                    const icon = this.querySelector('i');
                    if (navMenu.classList.contains('show')) {
                        icon.classList.remove('fa-bars');
                        icon.classList.add('fa-times');
                    } else {
                        icon.classList.remove('fa-times');
                        icon.classList.add('fa-bars');
                    }
                });
                
                // Close menu when clicking outside
                document.addEventListener('click', function(event) {
                    if (!navToggle.contains(event.target) && !navMenu.contains(event.target)) {
                        navMenu.classList.remove('show');
                        const icon = navToggle.querySelector('i');
                        icon.classList.remove('fa-times');
                        icon.classList.add('fa-bars');
                    }
                });
            }
            
            // Smooth scroll for anchor links
            document.querySelectorAll('.legal-nav a, .nav-link[href^="#"]').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const targetId = link.getAttribute('href');
                    const targetSection = document.querySelector(targetId);
                    
                    if (targetSection) {
                        // Update active nav in legal-nav
                        if (link.closest('.legal-nav')) {
                            document.querySelectorAll('.legal-nav a').forEach(a => a.classList.remove('active'));
                            link.classList.add('active');
                        }
                        
                        // Close mobile menu if open
                        if (navMenu && navMenu.classList.contains('show')) {
                            navMenu.classList.remove('show');
                            const icon = navToggle.querySelector('i');
                            icon.classList.remove('fa-times');
                            icon.classList.add('fa-bars');
                        }
                        
                        // Scroll to section
                        window.scrollTo({
                            top: targetSection.offsetTop - 100,
                            behavior: 'smooth'
                        });
                    }
                });
            });
            
            // Highlight active section on scroll
            window.addEventListener('scroll', () => {
                const sections = document.querySelectorAll('.legal-section');
                const navLinks = document.querySelectorAll('.legal-nav a');
                
                let current = '';
                
                sections.forEach(section => {
                    const sectionTop = section.offsetTop - 150;
                    const sectionBottom = sectionTop + section.offsetHeight;
                    
                    if (window.scrollY >= sectionTop && window.scrollY < sectionBottom) {
                        current = section.getAttribute('id');
                    }
                });
                
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${current}`) {
                        link.classList.add('active');
                    }
                });
            });
        });
