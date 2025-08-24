// ====== Shared utils ======
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const on = (el, evt, fn) => el && el.addEventListener(evt, fn);

// Set year
on(window, 'load', () => {
  const y = $('#year');
  if (y) y.textContent = new Date().getFullYear();
});

// Mobile nav toggle
const btn = $('#menu-btn');
const nav = $('#nav-links');
on(btn, 'click', () => {
  const open = nav.classList.toggle('open');
  btn.setAttribute('aria-expanded', String(open));
});

// Smooth scroll for internal links (on single-page home)
$$('a[href^="#"]').forEach(a => {
  on(a, 'click', e => {
    const href = a.getAttribute('href');
    if (!href || href === '#') return;
    const target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    nav?.classList.remove('open');
    btn?.setAttribute('aria-expanded', 'false');
  });
});

// Active link highlight on scroll (home page only)
const links = $$('.nav-link');
const sections = links
  .map(l => {
    const href = l.getAttribute('href') || '';
    return href.startsWith('#') ? document.querySelector(href) : null;
  })
  .filter(Boolean);

const setActive = () => {
  if (!sections.length) return;
  const y = window.scrollY + 100;
  let activeId = null;
  for (const sec of sections) {
    const top = sec.offsetTop;
    const bottom = top + sec.offsetHeight;
    if (y >= top && y < bottom) { activeId = '#' + sec.id; break; }
  }
  links.forEach(l => {
    const href = l.getAttribute('href') || '';
    l.classList.toggle('active', href === activeId);
  });
};
on(window, 'scroll', setActive);
on(window, 'load', setActive);

// Solidify nav when scrolled
const setNavSolid = () => {
  const y = window.scrollY || document.documentElement.scrollTop;
  document.body.classList.toggle('scrolled', y > 8);
};
on(window, 'scroll', setNavSolid);
on(window, 'load', setNavSolid);

// ====== Work page logic (work.html) ======
const workStack = $('#work-stack');
const workGrid  = $('#work-grid');
const sortSelect = $('#sort');
const searchInput = $('#search');
const typeFilter = $('#filter-type'); // optional if you add later

// Helper: normalize text
const norm = s => (s || '').toLowerCase().trim();

// Get list of items to operate on (sections or cards)
const getItems = () => {
  if (workStack) return Array.from(workStack.children);
  if (workGrid)  return Array.from(workGrid.children);
  return [];
};

// Helpers for search (name + tags only)
const getName = el => norm(el.querySelector('h3')?.textContent || '');
const getTags = el => $$('.project-tags li', el).map(li => norm(li.textContent)).join(' ');

// Apply search / type filter (does not sort)
function applyFilters() {
  const q = norm(searchInput?.value || '');
  const type = norm(typeFilter?.value || ''); // e.g., "game", "program", "model" or "" for all

  const items = getItems();
  items.forEach(el => {
    const dataType = norm(el.dataset?.type || '');

    // Only match against project name and tags
    const name = getName(el);
    const tags = getTags(el);

    const matchesSearch = q === '' || name.includes(q) || tags.includes(q);
    const matchesType   = !type || dataType === type;

    const show = matchesSearch && matchesType;
    el.style.display = show ? '' : 'none';
  });
}

// Sort items by newest/oldest/type
function sortItems(mode) {
  const container = workStack || workGrid;
  if (!container) return;

  const items = getItems();
  items.sort((a, b) => {
    const aDate = new Date(a.dataset?.date || 0);
    const bDate = new Date(b.dataset?.date || 0);
    const aType = norm(a.dataset?.type);
    const bType = norm(b.dataset?.type);

    switch (mode) {
      case 'oldest': return aDate - bDate;
      case 'type':   return aType.localeCompare(bType);
      case 'newest':
      default:       return bDate - aDate;
    }
  });

  items.forEach(el => container.appendChild(el));
}

// Debounce for search input
function debounce(fn, wait = 120) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(null, args), wait);
  };
}

// Wire up controls only if the containers exist (i.e., on work.html)
if (workStack || workGrid) {
  // Initial sort (newest)
  sortItems(sortSelect?.value || 'newest');
  // Initial filter
  applyFilters();

  on(sortSelect, 'change', e => {
    sortItems(e.target.value);
    // keep filters applied post-sort
    applyFilters();
  });

  on(searchInput, 'input', debounce(applyFilters, 120));
  on(typeFilter, 'change', () => { applyFilters(); });
}


// ====== Contact form (index.html) -> Formspree hookup ======
(() => {
  const form = document.querySelector('form[name="contact"]');
  if (!form) return;
  const status = document.getElementById('form-status');
  const honeypot = form.querySelector('input[name="website"]'); // spam trap

  const showStatus = (msg, ok=true) => {
    if (!status) return;
    status.textContent = msg;
    status.classList.add('show');
    status.classList.toggle('success', !!ok);
    status.classList.toggle('error', !ok);
  };

  form.addEventListener('submit', async (e) => {
    // Only intercept if the user actually clicked an explicit submit control
    const submitter = e.submitter;
    if (!submitter || !submitter.matches('button[type="submit"], input[type="submit"]')) {
      return; // allow navigation/refresh without interference
    }

    e.preventDefault(); // stop default only for intentional sends

    // If action hasn't been updated with a real Formspree ID
    if ((form.getAttribute('action') || '').includes('YOUR_FORM_ID')) {
      showStatus('Form is not configured yet. Replace YOUR_FORM_ID in index.html with your Formspree form ID.', false);
      return;
    }

    // Honeypot spam check
    if (honeypot && honeypot.value) {
      showStatus('Spam detected. Message not sent.', false);
      return;
    }

    const data = new FormData(form);
    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: data,
        headers: { 'Accept': 'application/json' }
      });

      if (res.ok) {
        showStatus('Thanks! Your message was sent.');
        form.reset();
      } else {
        const out = await res.json().catch(() => ({}));
        const msg = out.errors?.map(e => e.message).join(', ') || 'Something went wrong. Please try again.';
        showStatus(msg, false);
      }
    } catch (err) {
      showStatus('Network error. Please try again later.', false);
    }
  });
})();

// ====== Lightbox for project galleries (e.g., necroascent.html) ======
(() => {
  const lb = document.getElementById('lightbox');
  const lbImg = document.getElementById('lightbox-img');
  const closeBtn = document.querySelector('.lightbox-close');

  if (!lb || !lbImg) return;

  document.querySelectorAll('.gallery-grid img').forEach(img => {
    img.addEventListener('click', () => {
      lb.classList.add('open');
      lbImg.src = img.src;
      lbImg.alt = img.alt || 'Gallery image';
    });
  });

  const close = () => lb.classList.remove('open');
  closeBtn && closeBtn.addEventListener('click', close);
  lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
})();


// ====== Lazy-load gallery videos when in view ======
(() => {
  const vids = document.querySelectorAll('video[data-src]');
  if (!('IntersectionObserver' in window) || vids.length === 0) {
    // Fallback: set src immediately if IO unsupported
    vids.forEach(v => { v.src = v.dataset.src; v.removeAttribute('data-src'); });
    return;
  }
  const onEnter = entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const v = entry.target;
        if (v.dataset.src) {
          v.src = v.dataset.src;
          v.removeAttribute('data-src');
          // Don't autoplay; load metadata only
          try { v.load(); } catch {}
        }
        obs.unobserve(v);
      }
    });
  };
  const obs = new IntersectionObserver(onEnter, { rootMargin: '200px 0px' });
  vids.forEach(v => obs.observe(v));
})();
