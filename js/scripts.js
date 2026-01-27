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
     Dark Mode Toggle
  =============================== */
  const themeToggle = document.getElementById('theme-toggle');
  const themeIcon   = document.getElementById('theme-icon');
  const root        = document.documentElement;

  if (themeToggle && themeIcon) {
    const currentTheme = localStorage.getItem('theme') || 'light';
    root.setAttribute('data-theme', currentTheme);
    themeIcon.src = currentTheme === 'dark'
      ? 'assets/icons/sun.svg'
      : 'assets/icons/moon.svg';

    themeToggle.addEventListener('click', () => {
      const isDark = root.getAttribute('data-theme') === 'dark';
      const newTheme = isDark ? 'light' : 'dark';

      root.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      themeIcon.src = newTheme === 'dark'
        ? 'assets/icons/sun.svg'
        : 'assets/icons/moon.svg';
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
   Poster Preview Logic
   - Tap image = zoom
   - Tap outside image = close
   - ESC closes
=============================== */

let activePoster = null;

document.querySelectorAll('.poster-trigger').forEach(trigger => {
  trigger.addEventListener('click', e => {
    const preview = trigger.querySelector('.poster-preview');
    if (!preview) return;

    preview.classList.add('locked');
    activePoster = preview;
    e.stopPropagation();
  });
});

document.querySelectorAll('.poster-preview').forEach(preview => {

  // CLICKING THE BACKGROUND CLOSES
  preview.addEventListener('click', () => {
    preview.classList.remove('locked');
    activePoster = null;

    // Reset zoomed image if needed
    const img = preview.querySelector('img');
    if (img) {
      img.style.transform = '';
      img.classList.remove('zoomed');
    }
  });

  // PREVENT IMAGE CLICKS FROM CLOSING
  const img = preview.querySelector('img');
  if (img) {
    img.addEventListener('click', e => {
      e.stopPropagation();
    });
  }
});

// ESC key closes
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && activePoster) {
    activePoster.classList.remove('locked');
    activePoster = null;
  }
});

  /* ===============================
     Poster Image Zoom + Pan
  =============================== */
  document.querySelectorAll('.poster-preview img').forEach(img => {

    let scale = 1;
    let isDragging = false;
    let startX = 0, startY = 0;
    let translateX = 0, translateY = 0;

    const applyTransform = () => {
      img.style.transform =
        `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    };

    // Click zoom toggle
    img.addEventListener('click', e => {
      e.stopPropagation();

      if (scale === 1) {
        scale = 2;
        img.classList.add('zoomed');
      } else {
        scale = 1;
        translateX = 0;
        translateY = 0;
        img.classList.remove('zoomed');
      }
      applyTransform();
    });

    // Wheel zoom
    img.addEventListener('wheel', e => {
      e.preventDefault();

      scale += e.deltaY * -0.001;
      scale = Math.min(Math.max(1, scale), 3);

      if (scale === 1) {
        translateX = 0;
        translateY = 0;
      }
      applyTransform();
    });

    // Drag pan
    img.addEventListener('mousedown', e => {
      if (scale === 1) return;
      isDragging = true;
      startX = e.clientX - translateX;
      startY = e.clientY - translateY;
    });

    document.addEventListener('mousemove', e => {
      if (!isDragging) return;
      translateX = e.clientX - startX;
      translateY = e.clientY - startY;
      applyTransform();
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
    });
  });

  /* ===============================
     ORCID Publications Fetch
     (Filtered types)
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
        li.innerHTML =
          `${authors.join(', ')}. ` +
          `${year ? '(' + year + '). ' : ''}` +
          `${title}. <em>${journal}</em>.`;

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
