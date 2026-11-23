const root = document.documentElement;
const gate = document.querySelector('#top');
const film = document.querySelector('#darshan-film');
const scenes = [...gate.querySelectorAll('.darshan-scene')];
const titles = [...gate.querySelectorAll('[data-scene-title]')];
const welcome = document.querySelector('#welcome');
const main = document.querySelector('main');
const footer = document.querySelector('footer');
const enter = document.querySelector('#cover-hint');
const skip = document.querySelector('.skip');
const replay = document.querySelector('#replay-invitation');
const music = document.querySelector('#wedding-music');
const tapSound = document.querySelector('#tap-sound');
const sound = document.querySelector('#sound-toggle');
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const hindi = root.lang === 'hi';
const boundaries = [0, 3.4, 5.8, 10.2, 14.3, 17.5];
let state = 'idle';
let soundEnabled = false;
let startTimer;
let animationFrame;
let filmStarted;
let lastProgress;
let lastFilmTime;
let fallbackOrigin;
let currentScene = -1;

function showScene(index) {
  if (index === currentScene) return;
  currentScene = index;
  for (const [position, scene] of scenes.entries()) scene.classList.toggle('show', position === index);
  for (const [position, title] of titles.entries()) title.hidden = position !== index;
  gate.dataset.scene = String(index);
  gate.style.setProperty('--progress', (index / scenes.length) * 100 + '%');
}

function tick(now) {
  const newTime = film.currentTime;
  if (newTime > lastFilmTime + .022) {
    lastFilmTime = newTime;
    lastProgress = now;
    if (!fallbackOrigin && !filmStarted) {
      filmStarted = true;
      gate.classList.add('film-playing');
    }
  }
  if (!fallbackOrigin && (film.error || now - lastProgress > 2450)) {
    fallbackOrigin = now - lastFilmTime * 1000;
    gate.classList.remove('film-playing');
    film.pause();
  }
  const elapsed = fallbackOrigin ? (now - fallbackOrigin) / 1000 : lastFilmTime;
  if (elapsed >= boundaries.at(-1) || (!fallbackOrigin && film.ended)) {
    reveal({ focus: true });
    return;
  }
  const index = boundaries.findIndex(boundary => boundary > elapsed) - 1;
  showScene(Math.max(0, index));
  animationFrame = requestAnimationFrame(tick);
}

function start() {
  if (state !== 'idle') return;
  clearTimeout(startTimer);
  if (motion.matches) {
    reveal({ focus: true });
    return;
  }
  state = 'playing';
  filmStarted = false;
  lastProgress = performance.now();
  lastFilmTime = 0;
  fallbackOrigin = 0;
  gate.classList.add('darshan-playing');
  enter.hidden = true;
  showScene(0);
  film.currentTime = 0;
  film.play().catch(() => {
    if (state === 'playing' && !filmStarted && !fallbackOrigin) fallbackOrigin = performance.now();
  });
  animationFrame = requestAnimationFrame(tick);
}

function reveal({ focus = false } = {}) {
  if (state === 'open') return;
  state = 'open';
  clearTimeout(startTimer);
  cancelAnimationFrame(animationFrame);
  film.pause();
  if (soundEnabled && !music.paused) {
    if (!focus || lastFilmTime < 15) music.pause();
  }
  gate.hidden = true;
  main.inert = footer.inert = false;
  root.classList.remove('darshan-closed');
  if (focus) {
    window.scrollTo({ top: 0, behavior: 'instant' });
    document.querySelector('#welcome-names').focus({ preventScroll: true });
    if (!motion.matches) welcome.animate([{ opacity: .68 }, { opacity: 1 }], { duration: 550, easing: 'ease-out' });
  }
}

function close() {
  state = 'idle';
  if (!music.paused) music.pause();
  gate.hidden = false;
  enter.hidden = false;
  main.inert = footer.inert = true;
  root.classList.add('darshan-closed');
  gate.classList.remove('darshan-playing', 'film-playing');
  showScene(0);
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function syncSound() {
  sound.setAttribute('aria-pressed', String(soundEnabled));
  sound.textContent = soundEnabled
    ? (hindi ? 'संगीत बंद करें' : 'Mute sound')
    : (hindi ? 'संगीत चालू करें' : 'Enable sound');
}

function playScore() {
  music.currentTime = state === 'playing' ? Math.max(0, lastFilmTime) : 0;
  music.play().catch(() => {
    soundEnabled = false;
    syncSound();
  });
}

sound.addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  syncSound();
  if (!soundEnabled) {
    music.pause();
    tapSound.pause();
    return;
  }
  playScore();
});
syncSound();

enter.addEventListener('click', () => {
  soundEnabled = true;
  syncSound();
  start();
  playScore();
});
gate.addEventListener('pointerup', event => {
  if (state !== 'playing' || event.target.closest('a, button')) return;
  if (!soundEnabled) {
    soundEnabled = true;
    syncSound();
    playScore();
  }
  tapSound.currentTime = 0;
  tapSound.play().catch(() => {});
});
skip.addEventListener('click', event => {
  if (state === 'open') return;
  event.preventDefault();
  reveal({ focus: true });
});
replay.addEventListener('click', event => {
  event.preventDefault();
  history.replaceState(null, '', location.pathname + location.search);
  close();
  if (motion.matches) enter.focus();
  else {
    skip.focus({ preventScroll: true });
    start();
    if (soundEnabled) playScore();
  }
});
window.addEventListener('hashchange', () => {
  if (location.hash && location.hash !== '#top' && state !== 'open') {
    reveal();
    document.getElementById(location.hash.slice(1))?.scrollIntoView();
  }
});
motion.addEventListener('change', event => {
  if (event.matches && state === 'playing') reveal({ focus: true });
});

if (location.hash && location.hash !== '#top') {
  reveal();
  requestAnimationFrame(() => document.getElementById(location.hash.slice(1))?.scrollIntoView());
} else {
  close();
  if (!motion.matches) startTimer = setTimeout(start, 2400);
}
