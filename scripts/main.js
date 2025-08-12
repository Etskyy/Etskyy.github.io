document.getElementById('year').textContent = new Date().getFullYear();

const btn = document.getElementById('menu-btn');
const nav = document.getElementById('nav-links');
btn?.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  btn.setAttribute('aria-expanded', String(open));
});
