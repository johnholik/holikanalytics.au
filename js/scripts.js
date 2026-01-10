document.addEventListener('DOMContentLoaded', () => {

  /* --- Mobile Menu Toggle --- */
  const menuButton = document.getElementById('mobile-menu-button');
  const mobileNav  = document.getElementById('mobile-nav');

  if(menuButton && mobileNav){
    menuButton.addEventListener('click', () => {
      mobileNav.classList.toggle('open');
      const expanded = menuButton.getAttribute('aria-expanded') === 'true';
      menuButton.setAttribute('aria-expanded', String(!expanded));
    });
  }

  /* --- Dark Mode Toggle --- */
  const themeToggle = document.getElementById('theme-toggle');
  const themeIcon   = document.getElementById('theme-icon');
  const root        = document.documentElement;

  if(themeToggle && themeIcon){
    const currentTheme = localStorage.getItem('theme') || 'light';
    root.setAttribute('data-theme', currentTheme);
    themeIcon.src = currentTheme === 'dark' ? 'assets/icons/sun.svg' : 'assets/icons/moon.svg';

    themeToggle.addEventListener('click', () => {
      const isDark = root.getAttribute('data-theme') === 'dark';
      const newTheme = isDark ? 'light' : 'dark';
      root.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      themeIcon.src = newTheme === 'dark' ? 'assets/icons/sun.svg' : 'assets/icons/moon.svg';
    });
  }

  /* --- Back to Top Logic --- */
  const backToTopBtn = document.getElementById('back-to-top');
  
  if (backToTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 300) {
        backToTopBtn.style.display = 'block';
      } else {
        backToTopBtn.style.display = 'none';
      }
    });

    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
  
  /* --- Scroll Reveal Logic --- */
  const revealElements = document.querySelectorAll('.reveal');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        // Stop observing once the animation has played
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.15 // Triggers when 15% of the element is visible
  });

  revealElements.forEach(el => revealObserver.observe(el));
});