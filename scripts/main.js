document.getElementById('year').textContent = new Date().getFullYear();

// Mobile nav toggle
const btn = document.getElementById('menu-btn');
const nav = document.getElementById('nav-links');
btn?.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  btn.setAttribute('aria-expanded', String(open));
});

// Smooth scroll for internal links (on single-page home)
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
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
const links = Array.from(document.querySelectorAll('.nav-link'));
const sections = links
  .map(l => {
    const href = l.getAttribute('href') || '';
    // Only treat on-page anchors as sections
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
window.addEventListener('scroll', setActive);
window.addEventListener('load', setActive);

// ---------- Work page sorting ----------
const sortSelect = document.getElementById('sort');
const workGrid = document.getElementById('work-grid');

function sortCards(mode) {
  if (!workGrid) return;
  const cards = Array.from(workGrid.children);

  cards.sort((a, b) => {
    const aDate = new Date(a.dataset.date || 0);
    const bDate = new Date(b.dataset.date || 0);
    const aType = (a.dataset.type || '').toLowerCase();
    const bType = (b.dataset.type || '').toLowerCase();

    if (mode === 'oldest') return aDate - bDate;
    if (mode === 'type') return aType.localeCompare(bType);
    // default newest
    return bDate - aDate;
  });

  // Re-append in new order
  cards.forEach(card => workGrid.appendChild(card));
}

sortSelect?.addEventListener('change', e => sortCards(e.target.value));
// initial sort (newest by default)
if (sortSelect) sortCards(sortSelect.value || 'newest');


// Support stacked layout container
const workStack = document.getElementById('work-stack');
function sortSections(mode) {
  if (!workStack) return;
  const sections = Array.from(workStack.children);
  sections.sort((a, b) => {
    const aDate = new Date(a.dataset.date || 0);
    const bDate = new Date(b.dataset.date || 0);
    const aType = (a.dataset.type || '').toLowerCase();
    const bType = (b.dataset.type || '').toLowerCase();
    if (mode === 'oldest') return aDate - bDate;
    if (mode === 'type') return aType.localeCompare(bType);
    return bDate - aDate;
  });
  sections.forEach(s => workStack.appendChild(s));
}

if (sortSelect && workStack) {
  // override previous listener to sort sections
  sortSelect.addEventListener('change', e => sortSections(e.target.value));
  sortSections(sortSelect.value || 'newest');
}


// Solidify nav when scrolled
const setNavSolid = () => {
  const y = window.scrollY || document.documentElement.scrollTop;
  document.body.classList.toggle('scrolled', y > 8);
};
window.addEventListener('scroll', setNavSolid);
window.addEventListener('load', setNavSolid);


// Search filter for work page
const searchInput = document.getElementById('search');
if (searchInput && workStack) {
  searchInput.addEventListener('input', e => {
    const term = e.target.value.toLowerCase();
    Array.from(workStack.children).forEach(sec => {
      const text = sec.innerText.toLowerCase();
      sec.style.display = text.includes(term) ? '' : 'none';
    });
  });
}


// --- Work page search filtering ---
const searchInput = document.getElementById('work-search');
if (searchInput && workStack) {
  const normalize = s => (s || '').toLowerCase();
  const getText = el => normalize(el.textContent);
  searchInput.addEventListener('input', () => {
    const q = normalize(searchInput.value);
    const sections = Array.from(workStack.children);
    sections.forEach(sec => {
      const hay = [
        getText(sec),
        normalize(sec.dataset.type)
      ].join(' ');
      const match = hay.includes(q);
      sec.style.display = match ? '' : 'none';
    });
  });
}
