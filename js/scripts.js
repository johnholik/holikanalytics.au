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
          // Keep it observed if you want it to fade in every time, 
          // or keep unobserve if you want it to happen only once:
          revealObserver.unobserve(entry.target); 
        }
      });
    }, { threshold: 0.15 });

    revealElements.forEach(el => revealObserver.observe(el));
  }

/* =========================================================
     POSTER SYSTEM: Zoom & Escape Logic
  ========================================================= */
  const posterTriggers = document.querySelectorAll('.poster-trigger');

  posterTriggers.forEach(trigger => {
    trigger.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();

      const preview = this.querySelector('.poster-preview');
      const img = preview ? preview.querySelector('img') : null;
      if (!preview || !img) return;

      // Open the overlay
      preview.classList.add('locked');
      document.body.style.overflow = 'hidden';

      // Close function (Used by Esc, Back Button, and Clicks)
      const closePoster = () => {
        preview.classList.remove('locked');
        img.classList.remove('zoomed');
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };

      // Desktop: Escape Key to exit
      const handleKeyDown = (event) => {
        if (event.key === 'Escape') closePoster();
      };
      window.addEventListener('keydown', handleKeyDown);

      // Mobile: Handle hardware back button
      window.history.pushState({poster: true}, '');
      window.onpopstate = () => closePoster();

	  // Click/Tap Logic
      preview.onclick = (event) => {
        event.stopPropagation();
        
        if (event.target === img) {
          // If it's already zoomed, we zoom out
          if (img.classList.contains('zoomed')) {
             img.classList.remove('zoomed');
             // Reset scroll position to top when zooming out
             preview.scrollTo(0, 0); 
          } else {
             img.classList.add('zoomed');
          }
        } else {
          // Clicked the background (black area)
          closePoster();
          if (window.history.state?.poster) window.history.back();
        }
      };
    });
  });

/* ===============================
      ORCID Publications Fetch
  =============================== */
  const ORCID_ID = '0009-0009-9741-0025';
  const orcidList = document.getElementById('orcid-journal-list');

  if (orcidList) {
    fetch(`https://pub.orcid.org/v3.0/${ORCID_ID}/works`, {
      headers: { 'Accept': 'application/json' }
    })
    .then(res => res.json())
    .then(async data => {
      const groups = data.group || [];
      if (groups.length === 0) {
        orcidList.innerHTML = '<li>No publications found.</li>';
        return;
      }

      // 1. Get all put-codes
      const putCodes = groups.map(g => g['work-summary'][0]['put-code']);

      // 2. Fetch all details in parallel (much faster)
      const detailsPromises = putCodes.map(code => 
        fetch(`https://pub.orcid.org/v3.0/${ORCID_ID}/work/${code}`, {
          headers: { 'Accept': 'application/json' }
        }).then(res => res.json())
      );

      const allWorks = await Promise.all(detailsPromises);
      orcidList.innerHTML = ''; // Clear loading

      allWorks.forEach(work => {
        const allowedTypes = ['journal-article', 'review', 'research-article'];
        if (!allowedTypes.includes(work.type)) return;

        // Data extraction
        const title = work.title?.title?.value || 'Untitled';
        const journal = work['journal-title']?.value || '';
        const year = work['publication-date']?.year?.value || '';
        const vol = work['journal-issue']?.['journal-volume']?.value;
        const issue = work['journal-issue']?.['issue']?.value;
        
        // Volume/Issue Formatting
        let bibInfo = "";
        if (vol) bibInfo += `, Vol. ${vol}`;
        if (issue) bibInfo += `, No. ${issue}`;

        // DOI Extraction
        const exIds = work['external-ids']?.['external-id'] || [];
        const doiObj = exIds.find(id => id['external-id-type'] === 'doi');
        const doiValue = doiObj ? doiObj['external-id-value'] : null;

        // Author Formatting
        const authors = (work.contributors?.contributor || [])
          .map(c => {
            const name = c['credit-name']?.value || '';
            return name.toLowerCase().includes('holik') ? `<strong>${name}</strong>` : name;
          })
          .filter(Boolean)
          .join(', ');

        // HTML Creation
        const li = document.createElement('li');
        li.style.marginBottom = "15px";
        let htmlContent = `${authors}. ${year ? '(' + year + '). ' : ''}"${title}." <em>${journal}</em>${bibInfo}.`;
        
        if (doiValue) {
          htmlContent += ` DOI: <a href="https://doi.org/${doiValue}" target="_blank" style="word-break: break-all;">${doiValue}</a>`;
        }

        li.innerHTML = htmlContent;
        orcidList.appendChild(li);
      });
    })
    .catch(err => {
      console.error("ORCID Error:", err);
      orcidList.innerHTML = '<li>Unable to load publications.</li>';
    });
  }
}); // End of single DOMContentLoaded