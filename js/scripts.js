document.addEventListener('DOMContentLoaded', () => {

  /* ===============================
      Mobile Menu Toggle
  =============================== */
  const menuButton = document.getElementById('mobile-menu-button');
  const mobileNav  = document.getElementById('mobile-nav');

  if (menuButton && mobileNav) {
    menuButton.addEventListener('click', () => {
      mobileNav.classList.toggle('open');
      const expanded = menuButton.getAttribute('aria-expanded') === 'true';
      menuButton.setAttribute('aria-expanded', String(!expanded));
    });
  }

  /* ===============================
      Theme Toggle (Light / Dark)
  =============================== */
  const themeToggle = document.getElementById('theme-toggle');
  const themeIcon   = document.getElementById('theme-icon');
  const root        = document.documentElement;

  const storedTheme = localStorage.getItem('theme') || 'light';
  root.setAttribute('data-theme', storedTheme);

  if (themeIcon) {
    themeIcon.src =
      storedTheme === 'dark'
        ? 'assets/icons/sun.svg'
        : 'assets/icons/moon.svg';
  }

  if (themeToggle && themeIcon) {
    themeToggle.addEventListener('click', () => {
      const current = root.getAttribute('data-theme');
      const newTheme = current === 'dark' ? 'light' : 'dark';

      root.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);

      themeIcon.src =
        newTheme === 'dark'
          ? 'assets/icons/sun.svg'
          : 'assets/icons/moon.svg';
    });
  }

  /* ===============================
      CRT / 1980s Easter Egg Mode
  =============================== */
  const crtToggle = document.getElementById('crt-toggle');

  if (crtToggle) {
    // Restore CRT state
    if (localStorage.getItem('crt-mode') === 'on') {
      root.setAttribute('data-theme', 'crt');
    }

    crtToggle.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();

      const currentTheme = root.getAttribute('data-theme');

      if (currentTheme === 'crt') {
        // Exit CRT → fall back to light
        root.setAttribute('data-theme', 'light');
        localStorage.setItem('crt-mode', 'off');
        localStorage.setItem('theme', 'light');
      } else {
        // Enter CRT
        root.setAttribute('data-theme', 'crt');
        localStorage.setItem('crt-mode', 'on');
        localStorage.setItem('theme', 'crt');
      }

      console.log(
        root.getAttribute('data-theme') === 'crt'
          ? '📺 CRT MODE ENGAGED'
          : '🧼 CRT MODE DISENGAGED'
      );
    });
  }

  /* ===============================
      Back to Top Button
  =============================== */
  const backToTopBtn = document.getElementById('back-to-top');

  if (backToTopBtn) {
    window.addEventListener('scroll', () => {
      backToTopBtn.style.display =
        window.scrollY > 300 ? 'block' : 'none';
    });

    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ===============================
      Scroll Reveal Animations
  =============================== */
  const revealElements = document.querySelectorAll('.reveal');

  if (revealElements.length) {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    revealElements.forEach(el => revealObserver.observe(el));
  }

  /* ===============================
      ORCID Publications Fetch
  =============================== */
  const ORCID_ID = '0009-0009-9741-0025';
  const orcidList = document.getElementById('orcid-journal-list');

  if (orcidList) {
    fetch(`https://pub.orcid.org/v3.0/${ORCID_ID}/works`, {
      headers: { Accept: 'application/json' }
    })
    .then(res => res.json())
    .then(async data => {

      orcidList.innerHTML = '';
      const works = data.group || [];

      for (const group of works) {
        const summary = group['work-summary'][0];
        const putCode = summary['put-code'];

        const res = await fetch(
          `https://pub.orcid.org/v3.0/${ORCID_ID}/work/${putCode}`,
          { headers: { Accept: 'application/json' } }
        );

        const work = await res.json();

        const allowedTypes = [
          'journal-article',
          'review',
          'research-article'
        ];

        if (!allowedTypes.includes(work.type)) continue;

        const title = work.title?.title?.value || 'Untitled';
        const year = work['publication-date']?.year?.value || '';
        const journal = work['journal-title']?.value || '';
		const volume = work['journal-issue']?.['journal-volume']?.value || '';
		const issue  = work['journal-issue']?.['journal-issue']?.value || '';

        const contributors = work.contributors?.contributor || [];
        const authors = contributors
          .map(c => {
            const name = c['credit-name']?.value || '';
            if (!name) return '';
            return name.toLowerCase().includes('holik')
              ? `<strong>${name}</strong>`
              : name;
          })
          .filter(Boolean);

        const li = document.createElement('li');

		let volIssue = '';
		if (volume && issue) {
		  volIssue = `${volume}(${issue})`;
		} else if (volume) {
		  volIssue = volume;
		}

        li.innerHTML =
		  `${authors.join(', ')}. ` +
		  `${year ? '(' + year + '). ' : ''}` +
		  `${title}. <em>${journal}</em>` +
		  `${volIssue ? ', ' + volIssue : ''}.`;
  
        orcidList.appendChild(li);
      }

      if (!works.length) {
        orcidList.innerHTML = '<li>No publications found.</li>';
      }
    })
    .catch(() => {
      orcidList.innerHTML = '<li>Unable to load publications.</li>';
    });
  }

});
