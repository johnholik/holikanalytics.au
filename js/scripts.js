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
      - Tap text = open
      - Tap image = zoom/toggle
      - Tap background/anywhere else = close
  =============================== */

  let activePoster = null;

  // Helper function to close any open poster
  const closeActivePoster = () => {
    if (activePoster) {
      activePoster.classList.remove('locked');
      const img = activePoster.querySelector('img');
      if (img) {
        img.style.transform = '';
        img.classList.remove('zoomed');
        // Reset the custom zoom properties we added to the element
        img.dataset.scale = "1";
        img.dataset.translateX = "0";
        img.dataset.translateY = "0";
      }
      activePoster = null;
    }
  };

  // 1. OPEN LOGIC
  document.querySelectorAll('.poster-trigger').forEach(trigger => {
    trigger.addEventListener('click', e => {
      const preview = trigger.querySelector('.poster-preview');
      if (!preview) return;

      // If clicking the text and it's not already open
      if (!preview.classList.contains('locked')) {
        e.preventDefault();
        e.stopPropagation();
        closeActivePoster(); // Close any others first
        preview.classList.add('locked');
        activePoster = preview;
      }
    });
  });

  // 2. CLOSE LOGIC (Clicking anywhere on the document)
  document.addEventListener('click', (e) => {
    if (activePoster) {
      // If the click is NOT on the image itself, close it
      if (!e.target.closest('.poster-preview img')) {
        closeActivePoster();
      }
    }
  });

  // ESC key closes
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && activePoster) {
      closeActivePoster();
    }
  });

  /* ===============================
      Poster Image Zoom + Pan
  =============================== */
  document.querySelectorAll('.poster-preview img').forEach(img => {
    // Store state on the element to prevent scope issues
    img.dataset.scale = "1";
    img.dataset.translateX = "0";
    img.dataset.translateY = "0";
    let isDragging = false;
    let startX = 0, startY = 0;

    const applyTransform = () => {
      img.style.transform =
        `translate(${img.dataset.translateX}px, ${img.dataset.translateY}px) scale(${img.dataset.scale})`;
    };

    // Zoom Toggle on Click
    img.addEventListener('click', e => {
      e.stopPropagation(); // Prevents the 'document' click listener from closing it

      let scale = parseFloat(img.dataset.scale);
      
      if (scale === 1) {
        img.dataset.scale = "2";
        img.classList.add('zoomed');
      } else {
        img.dataset.scale = "1";
        img.dataset.translateX = "0";
        img.dataset.translateY = "0";
        img.classList.remove('zoomed');
      }
      applyTransform();
    });

    // Drag / Pan Logic
    img.addEventListener('mousedown', e => {
      if (img.dataset.scale === "1") return;
      isDragging = true;
      startX = e.clientX - parseFloat(img.dataset.translateX);
      startY = e.clientY - parseFloat(img.dataset.translateY);
      img.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', e => {
      if (!isDragging) return;
      img.dataset.translateX = (e.clientX - startX).toString();
      img.dataset.translateY = (e.clientY - startY).toString();
      applyTransform();
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
      if(img.classList.contains('zoomed')) img.style.cursor = 'grab';
    });

    // Touch support for Panning
    img.addEventListener('touchstart', e => {
        if (img.dataset.scale === "1") return;
        isDragging = true;
        startX = e.touches[0].clientX - parseFloat(img.dataset.translateX);
        startY = e.touches[0].clientY - parseFloat(img.dataset.translateY);
    }, {passive: true});

    img.addEventListener('touchmove', e => {
        if (!isDragging) return;
        img.dataset.translateX = (e.touches[0].clientX - startX).toString();
        img.dataset.translateY = (e.touches[0].clientY - startY).toString();
        applyTransform();
    }, {passive: true});

    img.addEventListener('touchend', () => {
        isDragging = false;
    });
  });

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

/* ===============================
    The Secret Retro Toggle
=============================== */
document.addEventListener('DOMContentLoaded', () => {
  const retroBtn = document.getElementById('retro-toggle');
  const rootElement = document.documentElement;

  // Load saved preference
  if (localStorage.getItem('skin') === 'retro') {
    rootElement.setAttribute('data-skin', 'retro');
    retroBtn?.classList.add('active');
  }

  retroBtn?.addEventListener('click', () => {
    const isRetro = rootElement.getAttribute('data-skin') === 'retro';
    
    if (isRetro) {
      rootElement.removeAttribute('data-skin');
      retroBtn.classList.remove('active');
      localStorage.setItem('skin', 'default');
    } else {
      rootElement.setAttribute('data-skin', 'retro');
      retroBtn.classList.add('active');
      localStorage.setItem('skin', 'retro');
    }
  });
});

document.addEventListener('DOMContentLoaded', () => {
  const retroBtn = document.getElementById('retro-toggle');
  const rootElement = document.documentElement;

  // Initialize skin from storage
  if (localStorage.getItem('skin') === 'retro') {
    rootElement.setAttribute('data-skin', 'retro');
    if(retroBtn) retroBtn.classList.add('active');
  }

  if (retroBtn) {
    retroBtn.addEventListener('click', () => {
      const isRetro = rootElement.getAttribute('data-skin') === 'retro';
      
      if (isRetro) {
        rootElement.removeAttribute('data-skin');
        retroBtn.classList.remove('active');
        localStorage.setItem('skin', 'default');
      } else {
        rootElement.setAttribute('data-skin', 'retro');
        retroBtn.classList.add('active');
        localStorage.setItem('skin', 'retro');
        console.log("Skin: 1984 Terminal Mode Active.");
      }
    });
  }
});