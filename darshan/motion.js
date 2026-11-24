const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const modest = navigator.connection?.saveData || navigator.deviceMemory <= 2 || navigator.hardwareConcurrency <= 2;
const quiet = () => reduced.matches || modest;
const cue = detail => document.dispatchEvent(new CustomEvent('invitation-sound', { detail }));
const footer = document.querySelector('footer');
const hero = document.querySelector('.welcome-painting');
const names = document.querySelector('#welcome-names');
document.documentElement.classList.toggle('light-motion', Boolean(modest));

for (const element of [document.querySelector('.film'), hero, footer]) {
  const dust = document.createElement('span');
  dust.className = 'diya-dust';
  dust.setAttribute('aria-hidden', 'true');
  element.append(dust);
}
let visible = false;
let scheduled = false;
function move() {
  scheduled = false;
  if (quiet() || !visible) return;
  const offset = Math.max(-1, Math.min(1, -hero.getBoundingClientRect().top / innerHeight));
  hero.style.setProperty('--drift', (offset * 12).toFixed(1) + 'px');
}
function schedule() {
  if (!scheduled && visible && !quiet()) {
    scheduled = true;
    requestAnimationFrame(move);
  }
}
addEventListener('scroll', schedule, { passive: true });
function tilt(degrees) {
  if (!quiet() && visible) names.style.setProperty('--tilt', Math.max(-5, Math.min(5, degrees)) + 'deg');
}
hero.addEventListener('pointermove', e => tilt((e.clientX / innerWidth - .5) * 10), { passive: true });
hero.addEventListener('pointerleave', () => tilt(0));
addEventListener('deviceorientation', e => { if (e.gamma != null) tilt(e.gamma / 6); }, { passive: true });
const observer = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (entry.target === hero) { visible = entry.isIntersecting; schedule(); continue; }
    if (!entry.isIntersecting) continue;
    entry.target.classList.add('in-view');
    if (entry.target === footer) cue('finale');
    if (!quiet() && window.gsap) {
      const items = entry.target.querySelectorAll('.venue-card, .date-inner, .closing');
      if (items.length) window.gsap.from(items, { y: 14, rotationX: -3, transformPerspective: 850,
        duration: .58, stagger: .09, ease: 'power2.out', clearProps: 'transform' });
    }
    observer.unobserve(entry.target);
  }
}, { threshold: .07 });
for (const el of [hero, document.querySelector('.date-section'), document.querySelector('.venues'), footer]) observer.observe(el);
if (!quiet()) {
  const lib = document.createElement('script');
  lib.src = '/darshan/vendor/gsap-3.13.0.min.js';
  lib.async = true;
  document.head.append(lib);
}
document.addEventListener('click', e => {
  if (e.target.closest('a,button') && !e.target.closest('#sound-toggle,#open-invitation,#reveal-date')) cue('tap');
});
document.querySelector('#reveal-date').addEventListener('pointerdown', () => cue('tick'));
