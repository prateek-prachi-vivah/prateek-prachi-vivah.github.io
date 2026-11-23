import { weddingAudio } from './audio.js?v=13';

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
  const smallScene = name === 'entry' || name === 'hall' || name === 'vishnu';
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
  const animate = cinematic && !motion.matches;
  if (animate) {
    intro.inert = true;
    intro.classList.add('is-dissolving');
  } else intro.hidden = true;
  document.body.classList.add('card-visible');
  main.inert = footer.inert = false;
  if (animate) {
    welcome.classList.add('book-opening');
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
    const portal = document.createElement('div');
    portal.className = 'portal';
    portal.style.setProperty('--portal-ratio', gate === 1 ? '2 / 3' : '764 / 337');
    image.className = 'portal-architecture';

    const aperture = document.createElement('div');
    aperture.className = 'portal-aperture';
    const [left, top, width, height] = gate === 1 ? [28, 26, 44, 64] : [27, 14, 46, 79];
    for (const [key, value] of Object.entries({ left, top, width, height })) {
      aperture.style.setProperty('--portal-' + key, value + '%');
    }
    aperture.style.setProperty('--door-texture', 'url("' + image.src + '")');
    aperture.style.setProperty('--texture-size', (20000 / width) + '% ' + (10000 / height) + '%');
    aperture.style.setProperty('--texture-left', (100 * left / (100 - width / 2)) + '%');
    aperture.style.setProperty('--texture-right', (100 * (left + width / 2) / (100 - width / 2)) + '%');
    aperture.style.setProperty('--texture-y', (100 * top / (100 - height)) + '%');

    inside.className = 'portal-interior';
    const doors = document.createElement('div');
    doors.className = 'portal-doors';
    for (const side of ['left', 'right']) {
      const leaf = document.createElement('span');
      leaf.className = 'portal-leaf ' + side;
      if (side === 'left') {
        leaf.addEventListener('animationstart', event => {
          if (event.animationName === 'swing-in' && !opened && leaf.isConnected) {
            audio.cue(gate === 7 ? 'sanctum' : 'door');
          }
        });
      }
      doors.append(leaf);
    }
    aperture.append(inside, doors);
    portal.append(image, aperture);
    layer.append(portal);
    caption.textContent = sceneList.dataset.gateLabel + ' ' + gate + ' / 7';
    intro.setAttribute('aria-label', caption.textContent);
  } else {
    layer.append(image);
    caption.textContent = scenes[name].textContent;
    intro.setAttribute('aria-label', scenes[name].dataset.description);
  }
  const previous = stage.lastElementChild;
  stage.append(layer);
  if (previous) setTimeout(() => previous.remove(), 320);
}

async function play() {
  const token = ++run;
  opened = false;
  main.inert = footer.inert = true;
  intro.hidden = false;
  intro.inert = false;
  intro.classList.remove('is-dissolving');
  document.body.classList.remove('card-visible');
  root.classList.add('intro-open');
  intro.classList.add('is-playing');
  welcome.classList.remove('book-opening');
  stage.replaceChildren();
  caption.textContent = scenes.ganesh.textContent;
  intro.setAttribute('aria-label', scenes.ganesh.dataset.description);
  audio.prepare();
  hardStop = setTimeout(() => reveal({ cinematic: true }), 10500);
  load('entry');
  load('hall');
  load('vishnu');
  // The poster is already visible. Downloads enhance later frames and cannot delay the first one.
  for (let number = 2; number <= 7; number++) load('door-' + number);
  await wait(810);
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
    }
    await wait(number === 7 ? 935 : 680);
    if (token !== run) return;
  }

  const darshan = await getArt('vishnu', 500);
  if (token !== run) return;
  if (darshan) {
    setFrame('vishnu', darshan.cloneNode());
    audio.cue('darshan');
    await wait(1670);
    if (token !== run) return;
  }
  reveal({ cinematic: true, focus: document.activeElement === skip });
}

intro.addEventListener('animationend', event => {
  if (opened && event.target === intro && event.animationName === 'darshan-dissolve') intro.hidden = true;
});
welcome.addEventListener('animationend', event => {
  if (event.animationName === 'bound-cover-open') welcome.classList.remove('book-opening');
});
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
  document.body.classList.add('card-visible');
  audio.startCard();
  if (location.hash) requestAnimationFrame(() => document.getElementById(location.hash.slice(1))?.scrollIntoView());
} else {
  play();
}
