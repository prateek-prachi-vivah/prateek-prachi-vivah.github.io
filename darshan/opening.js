import './motion.js?v=26';
import { weddingAudio } from './audio.js?v=22';

// Previously shared invitation links can carry an older edition in their query.
const address = new URL(location.href);
if (address.searchParams.has('edition') || address.searchParams.has('v')) {
  address.searchParams.set('edition', '26');
  address.searchParams.set('v', 'darshan26');
  history.replaceState(history.state, '', address);
}

const root = document.documentElement;
const intro = document.querySelector('#top');
const stage = document.querySelector('#film-scene');
const caption = document.querySelector('#scene-caption');
const skip = document.querySelector('#skip-intro');
const opener = document.querySelector('#open-invitation');
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

for (const type of ['pointerdown', 'touchstart', 'keydown', 'scroll', 'click']) {
  document.addEventListener(type, event => {
    if (event.isTrusted && !event.target.closest?.('#sound-toggle, [data-music]')) audio.retry();
  }, { passive: true, capture: true });
}

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
    const ready = img.decode ? img.decode() : new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; });
    cache.set(name, ready.then(() => img, () => null));
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
  clearTimeout(window.invitationFallback);
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
  stage.replaceChildren(layer);
  intro.classList.add('has-shot');
}

function enterDesktop() {
  intro.hidden = true;
  document.body.classList.add('card-visible');
  if (!motion.matches && (!location.hash || location.hash === '#top')) {
    welcome.classList.remove('book-opening');
    requestAnimationFrame(() => requestAnimationFrame(() => welcome.classList.add('book-opening')));
  }
  audio.startCard();
}
async function play() {
  if (root.dataset.entry === 'card') { enterDesktop(); return; }
  clearTimeout(hardStop);
  clearTimeout(window.invitationFallback);
  const token = ++run;
  opened = false;
  main.inert = footer.inert = true;
  intro.hidden = false;
  window.scrollTo({top: 0, behavior: 'instant'});
  intro.inert = false;
  intro.classList.remove('is-dissolving');
  document.body.classList.remove('card-visible');
  root.classList.add('intro-open');
  intro.classList.add('is-playing');
  welcome.classList.remove('book-opening');
  stage.replaceChildren();
  intro.classList.remove('has-shot');
  caption.textContent = scenes.ganesh.textContent;
  intro.setAttribute('aria-label', scenes.ganesh.dataset.description);
  opener.hidden = true;
  hardStop = setTimeout(() => reveal(), 16500);
  audio.prepare();
  load('entry');
  load('hall');
  load('vishnu');
  // The poster is already visible. Downloads enhance later frames and cannot delay the first one.
  for (let number = 2; number <= 7; number++) load('door-' + number);
  await wait(810);
  if (token !== run) return;
  for (let number = 1; number <= 7; number++) {
    const name = number === 1 ? 'entry' : 'door-' + number;
    const [preferred, hall] = await Promise.all([getArt(name), getArt('hall')]);
    if (token !== run) return;
    const image = preferred;
    const behind = hall || image;
    if (image && behind) {
      setFrame(name, image.cloneNode(), { inside: behind.cloneNode(), gate: number });
    } else {
      caption.textContent = sceneList.dataset.gateLabel + ' ' + number + ' / 7';
      load(name).then(late => {
        if (late && token === run && caption.textContent === sceneList.dataset.gateLabel + ' ' + number + ' / 7') {
          setFrame(name, late.cloneNode(), {inside:(hall || late).cloneNode(), gate:number});
        }
      });
    }
    await wait(matchMedia('(min-width: 900px)').matches ? 1180 : number === 7 ? 935 : 680);
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
  audio.unlock();
  reveal({ focus: true });
});
document.querySelector('#replay-invitation').addEventListener('click', event => {
  event.preventDefault();

  history.replaceState(null, '', location.pathname + location.search);
  window.scrollTo({ top: 0, behavior: 'instant' });
  audio.unlock();
  play();
  (root.dataset.entry === 'card' ? target : skip).focus({ preventScroll: true });
});
document.addEventListener('invitation-date-revealed', () => audio.cue('cord'));
window.addEventListener('hashchange', () => {
  const section = document.getElementById(location.hash.slice(1));
  if (section && section !== intro && !opened) {
    reveal();
    section.scrollIntoView();
  }
});
motion.addEventListener?.('change', event => {
  if (event.matches) reveal();
});

if (opened) {
  if (root.dataset.entry === 'card') enterDesktop();
  intro.hidden = true;
  document.body.classList.add('card-visible');
  if (root.dataset.entry !== 'card') audio.startCard();
  document.addEventListener('click',()=>audio.unlock(),{once:true});
  if (location.hash) requestAnimationFrame(() => document.getElementById(location.hash.slice(1))?.scrollIntoView());
} else {
  main.inert = footer.inert = true;
  opener.hidden = false;
  play().catch(() => reveal());
  opener.addEventListener('click', () => {
    if (!motion.matches && typeof window.DeviceOrientationEvent?.requestPermission === 'function') window.DeviceOrientationEvent.requestPermission().catch(()=>{});
    audio.unlock();
    if (motion.matches) { reveal({focus:true}); return; }
    play();
    skip.focus({ preventScroll: true });
  }, { once: true });
}
document.addEventListener('invitation-sound', event => audio.cue(event.detail));

// Browser Back can restore a half-finished timer and a stale scroll position.
window.addEventListener('pageshow', event => {
  if (event.persisted && (!location.hash || location.hash === '#top')) {
    play().catch(() => reveal());
  }
});
