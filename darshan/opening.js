import { weddingAudio } from './audio.js?v=1';

const root = document.documentElement;
const intro = document.querySelector('#top');
const stage = document.querySelector('#film-scene');
const caption = document.querySelector('#scene-caption');
const actions = document.querySelector('#intro-actions');
const enter = document.querySelector('#cover-hint');
const silent = document.querySelector('#open-silent');
const skip = document.querySelector('#skip-intro');
const main = document.querySelector('main');
const footer = document.querySelector('footer');
const welcome = document.querySelector('#welcome');
const target = document.querySelector('#welcome-names');
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const frames = [...document.querySelectorAll('#scene-list li')];
const durations = [1800, 2450, 1600, 3100, 2000];
const prefetched = new Map();
let revision = 0;
let currentDelay;
let completeTimer;
let started = false;
let opened = !root.classList.contains('intro-open');

const audio = weddingAudio({
  source: document.querySelector('#wedding-music'),
  control: document.querySelector('#sound-toggle'),
  hindi: root.lang === 'hi',
  isCardOpen: () => opened
});

function img(index) {
  if (!prefetched.has(index) && frames[index]) {
    const art = new Image(1024, 1536);
    art.alt = '';
    art.decoding = 'async';
    art.src = new URL(frames[index].dataset.art + '.webp', import.meta.url).href;
    const loaded = art.decode().then(() => art, () => null);
    prefetched.set(index, loaded);
  }
  return prefetched.get(index);
}

function stopTimers() {
  revision++;
  clearTimeout(completeTimer);
  currentDelay?.cancel();
}

function delay(ms) {
  return new Promise(resolve => {
    const timer = setTimeout(() => resolve(true), ms);
    currentDelay = { cancel() { clearTimeout(timer); resolve(false); } };
  });
}

function reveal({ focus = true } = {}) {
  if (opened) return;
  stopTimers();
  opened = true;
  root.classList.remove('intro-open');
  intro.hidden = true;
  main.inert = footer.inert = false;
  if (focus) {
    window.scrollTo({ top: 0, behavior: 'instant' });
    target.focus({ preventScroll: true });
    if (!motion.matches) welcome.animate([{ opacity: .80 }, { opacity: 1 }], { duration: 475, easing: 'ease-out' });
  }
  audio.startCard();
}

function show(index, art, inside) {
  const layer = document.createElement('div');
  layer.className = 'film-shot';
  layer.dataset.shot = frames[index].dataset.art;
  if (inside) {
    layer.classList.add('gates-open');
    const entrance = document.createElement('div');
    entrance.className = 'gate-opening';
    const left = document.createElement('span');
    const right = document.createElement('span');
    entrance.style.setProperty('--gate', 'url("' + art.src + '")');
    entrance.append(left, right);
    layer.append(inside, entrance);
  } else {
    layer.append(art);
  }
  stage.replaceChildren(layer);
  caption.textContent = frames[index].textContent;
  intro.setAttribute('aria-label', frames[index].dataset.description);
  if (inside) audio.cue('door');
}

async function start() {
  if (started || opened) return;
  if (motion.matches) {
    reveal();
    return;
  }
  started = true;
  const token = ++revision;
  actions.hidden = true;
  skip.focus({ preventScroll: true });
  intro.classList.add('is-playing');
  completeTimer = setTimeout(() => reveal(), 15000);
  img(1);
  img(2);
  if (!await delay(durations[0]) || token !== revision) return;
  for (let index = 1; index < frames.length; index++) {
    // A slow or unavailable painting cannot trap guests on the opening.
    const art = await Promise.race([img(index), delay(1700).then(() => null)]);
    if (token !== revision) return;
    img(index + 1);
    if (!art) continue;
    const inside = index === 1 ? await Promise.race([img(2), delay(800).then(() => null)]) : null;
    if (token !== revision) return;
    show(index, art, inside);
    if (!await delay(durations[index]) || token !== revision) return;
  }
  reveal();
}

function showLanding() {
  stopTimers();
  opened = false;
  started = false;
  main.inert = footer.inert = true;
  intro.hidden = false;
  intro.classList.remove('is-playing');
  root.classList.add('intro-open');
  caption.textContent = frames[0].textContent;
  intro.setAttribute('aria-label', frames[0].dataset.description);
  stage.replaceChildren();
  actions.hidden = false;
  window.scrollTo({ top: 0, behavior: 'instant' });
}

enter.addEventListener('click', () => { audio.activate(); start(); });
silent.addEventListener('click', () => { audio.mute(); start(); });
skip.addEventListener('click', event => {
  event.preventDefault();
  reveal();
});
document.querySelector('#replay-invitation').addEventListener('click', event => {
  event.preventDefault();
  if (motion.matches) return;
  history.replaceState(null, '', location.pathname + location.search);
  audio.stop();
  showLanding();
  start();
});
document.addEventListener('invitation-date-revealed', () => audio.cue('cord'));
window.addEventListener('hashchange', () => {
  const section = document.getElementById(location.hash.slice(1));
  if (section && section !== intro && !opened) {
    reveal({ focus: false });
    section.scrollIntoView();
  }
});
motion.addEventListener('change', event => {
  if (event.matches) reveal();
});

if (opened) {
  intro.hidden = true;
  if (location.hash) requestAnimationFrame(() => document.getElementById(location.hash.slice(1))?.scrollIntoView());
} else showLanding();
