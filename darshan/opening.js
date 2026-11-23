import { weddingAudio } from './audio.js?v=2';

const root = document.documentElement;
const intro = document.querySelector('#top');
const stage = document.querySelector('#film-scene');
const caption = document.querySelector('#scene-caption');
const skip = document.querySelector('#skip-intro');
const main = document.querySelector('main');
const footer = document.querySelector('footer');
const welcome = document.querySelector('#welcome');
const target = document.querySelector('#welcome-names');
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const sceneList = document.querySelector('#scene-list');
const scenes = Object.fromEntries([...sceneList.children].map(element => [element.dataset.art, element]));
const cache = new Map();
let run = 0;
let hardStop;
let opened = !root.classList.contains('intro-open');

const audio = weddingAudio({
  source: document.querySelector('#wedding-music'),
  control: document.querySelector('#sound-toggle'),
  hindi: root.lang === 'hi',
  isCardOpen: () => opened
});
clearTimeout(window.invitationFallback);

function artUrl(name) {
  const smallScene = name === 'entry' || name === 'hall' || name === 'vishnu' || name === 'mandap';
  const asset = smallScene && matchMedia('(max-width: 650px)').matches ? name + '-mobile' : name;
  return new URL(asset + '.webp', import.meta.url).href;
}

function load(name) {
  if (!cache.has(name)) {
    const img = new Image();
    img.alt = '';
    img.decoding = 'async';
    img.src = artUrl(name);
    cache.set(name, img.decode().then(() => img, () => null));
  }
  return cache.get(name);
}

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

function getArt(name, deadline = 320) {
  return Promise.race([load(name), wait(deadline).then(() => null)]);
}

function reveal({ cinematic = false, focus = false } = {}) {
  if (opened) return;
  run++;
  clearTimeout(hardStop);
  opened = true;
  root.classList.remove('intro-open');
  intro.hidden = true;
  main.inert = footer.inert = false;
  if (cinematic && !motion.matches) {
    welcome.classList.remove('book-opening');
    requestAnimationFrame(() => {
      if (opened) welcome.classList.add('book-opening');
    });
  }
  if (focus || window.scrollY > 0) window.scrollTo({ top: 0, behavior: 'instant' });
  if (focus) target.focus({ preventScroll: true });
  audio.startCard();
}

function setFrame(name, image, { inside, gate } = {}) {
  const layer = document.createElement('div');
  layer.className = 'film-shot';
  layer.dataset.shot = name;
  layer.style.setProperty('--frame-photo', 'url("' + image.src + '")');
  if (gate) {
    layer.dataset.gate = String(gate);
    const aperture = document.createElement('div');
    aperture.className = 'gate-opening';
    aperture.style.setProperty('--gate', 'url("' + image.src + '")');
    aperture.append(document.createElement('span'), document.createElement('span'));
    layer.append(inside, aperture);
    caption.textContent = sceneList.dataset.gateLabel + ' ' + gate + ' / 7';
    intro.setAttribute('aria-label', caption.textContent);
    audio.cue(gate === 7 ? 'sanctum' : 'door');
  } else {
    layer.append(image);
    caption.textContent = scenes[name].textContent;
    intro.setAttribute('aria-label', scenes[name].dataset.description);
  }
  stage.replaceChildren(layer);
}

async function play() {
  const token = ++run;
  opened = false;
  main.inert = footer.inert = true;
  intro.hidden = false;
  root.classList.add('intro-open');
  intro.classList.add('is-playing');
  stage.replaceChildren();
  caption.textContent = scenes.ganesh.textContent;
  intro.setAttribute('aria-label', scenes.ganesh.dataset.description);
  audio.prepare();
  hardStop = setTimeout(() => reveal({ cinematic: true }), 14500);
  load('entry');
  load('hall');
  load('vishnu');
  // The poster is already visible. Downloads enhance later frames and cannot delay the first one.
  for (let number = 2; number <= 7; number++) load('door-' + number);
  await wait(1550);
  if (token !== run) return;
  for (let number = 1; number <= 7; number++) {
    const name = number === 1 ? 'entry' : 'door-' + number;
    const [preferred, hall, fallback] = await Promise.all([getArt(name), getArt('hall'), getArt('entry')]);
    if (token !== run) return;
    const image = preferred || fallback;
    const behind = hall || image;
    if (image && behind) {
      setFrame(name, image.cloneNode(), { inside: behind.cloneNode(), gate: number });
    } else {
      caption.textContent = sceneList.dataset.gateLabel + ' ' + number + ' / 7';
      audio.cue(number === 7 ? 'sanctum' : 'door');
    }
    await wait(number === 7 ? 1080 : 760);
    if (token !== run) return;
  }

  for (const [name, duration] of [['vishnu', 2350], ['mandap', 1050]]) {
    const image = await getArt(name, 500);
    if (token !== run) return;
    if (!image) continue;
    setFrame(name, image.cloneNode());
    if (name === 'vishnu') audio.cue('darshan');
    await wait(duration);
    if (token !== run) return;
  }
  reveal({ cinematic: true, focus: document.activeElement === skip });
}

skip.addEventListener('click', event => {
  event.preventDefault();
  reveal({ focus: true });
});
document.querySelector('#replay-invitation').addEventListener('click', event => {
  event.preventDefault();
  if (motion.matches) return;
  history.replaceState(null, '', location.pathname + location.search);
  window.scrollTo({ top: 0, behavior: 'instant' });
  play();
  skip.focus({ preventScroll: true });
});
document.addEventListener('invitation-date-revealed', () => audio.cue('cord'));
window.addEventListener('hashchange', () => {
  const section = document.getElementById(location.hash.slice(1));
  if (section && section !== intro && !opened) {
    reveal();
    section.scrollIntoView();
  }
});
motion.addEventListener('change', event => {
  if (event.matches) reveal();
});

if (opened) {
  intro.hidden = true;
  if (location.hash) requestAnimationFrame(() => document.getElementById(location.hash.slice(1))?.scrollIntoView());
} else {
  play();
}
