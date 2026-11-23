import { wedding as englishWedding } from '/wedding.js?v=17';
import { hindiWedding } from '/hindi.js?v=17';

const isHindi = document.documentElement.lang === 'hi';
const wedding = isHindi ? hindiWedding : englishWedding;
const locale = isHindi ? 'hi-IN' : 'en-GB';
const text = isHindi ? {
  weddingDay: 'शुभ विवाह', units: ['दिन', 'घंटे', 'मिनट', 'सेकंड'],
  revealed: 'विवाह की तारीख दिख रही है', dress: 'पहनावा',
  showEvent: name => name + ' देखें',
  mapPin: name => 'Google Maps पर ' + name + ' का पिन देखें',
  directionsTo: name => name + ' का रास्ता देखें',
 copyAddress: 'पता कॉपी करें',
  addressCopied: name => name + ' का पता कॉपी हो गया।',
} : {
  weddingDay: 'Wedding Day', units: ['days', 'hrs', 'min', 'sec'],
  revealed: 'Wedding date revealed', dress: 'Dress Code',
  showEvent: name => 'Show ' + name,
  mapPin: name => 'View the ' + name + ' pin on Google Maps',
  directionsTo: name => 'Get directions to ' + name,
 copyAddress: 'Copy address',
  addressCopied: name => 'Address copied for ' + name + '.',
};

const motion = matchMedia('(prefers-reduced-motion: reduce)');
const behavior = () => motion.matches ? 'instant' : 'smooth';
const dateOptions = { timeZone: 'UTC' };
const longDate = new Intl.DateTimeFormat(locale, {
  ...dateOptions, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
});
const dateFrom = value => new Date(value + 'T00:00:00Z');

function create(tag, className, content) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (content) element.textContent = content;
  return element;
}

for (const element of document.querySelectorAll('.groom-name')) element.textContent = wedding.groom;
for (const element of document.querySelectorAll('.bride-name')) element.textContent = wedding.bride;

function scatter(container) {
  if (motion.matches) return;
  for (let index = 0; index < 7; index++) {
    const petal = create('i', 'petal');
    const edge = index % 2 ? 82 : 6;
    petal.style.setProperty('--x', edge + Math.round(Math.random() * 12) + '%');
    petal.style.setProperty('--drift', Math.round(Math.random() * 160 - 80) + 'px');
    petal.style.animationDelay = index * 42 + 'ms';
    petal.addEventListener('animationend', () => petal.remove(), { once: true });
    container.append(petal);
  }
}

const root = document.documentElement;
const openingButton = document.querySelector('#cover-hint');
const welcome = document.querySelector('#welcome');
const content = [document.querySelector('main'), document.querySelector('footer')];
let visitRecorded = false;
function recordCardOpen() {
  if (visitRecorded || navigator.globalPrivacyControl || navigator.doNotTrack === '1') return;
  visitRecorded = true;
  if (location.hostname.endsWith('.chatgpt.site')) {
    fetch('/_card-open', { method: 'POST', keepalive: true }).catch(() => {});
  }
}
let opening = false;

function playOpeningChime() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  try {
    const context = new AudioContext();
    const now = context.currentTime;
    for (const [index, frequency] of [520, 782, 1046].entries()) {
      const tone = context.createOscillator();
      const gain = context.createGain();
      const start = now + index * .095;
      tone.type = 'sine';
      tone.frequency.value = frequency;
      gain.gain.setValueAtTime(.001, start);
      gain.gain.exponentialRampToValueAtTime(.07, start + .016);
      gain.gain.exponentialRampToValueAtTime(.001, start + .47);
      tone.connect(gain).connect(context.destination);
      tone.start(start);
      tone.stop(start + .48);
      if (index === 2) tone.addEventListener('ended', () => context.close().catch(() => {}));
    }
    context.resume().catch(() => context.close().catch(() => {}));
  } catch {
    // A blocked sound effect must never prevent the invitation from opening.
  }
}

function closeCover() {
  for (const element of content) element.inert = true;
  root.classList.add('cover-closed');
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function openCover({ animate = true, focus = true } = {}) {
  if (opening || !root.classList.contains('cover-closed')) return;
  recordCardOpen();
  if (focus && !soundOff) {
    playOpeningChime();
    if (music.paused) startBhajan();
  }
  const finish = () => {
    root.classList.remove('cover-closed', 'cover-opening');
    opening = false;
    for (const element of content) element.inert = false;
    if (focus && !motion.matches) {
      welcome.animate([{ opacity: .65 }, { opacity: 1 }], { duration: 330, easing: 'ease-out' });
    }
    if (focus) document.querySelector('#welcome-names').focus({ preventScroll: true });
  };
  if (animate && !motion.matches) {
    opening = true;
    root.classList.add('cover-opening');
    setTimeout(finish, 2150);
  } else {
    finish();
  }
}

root.classList.add('invite-ready');
if (!location.hash || location.hash === '#top') closeCover();
else recordCardOpen();
const blessings = isHindi ? [
  ['श्री गणेश', 'मंगल आरंभ के लिए दीप जलाएँ', 'दीप जलाएँ'],
  ['श्री विष्णु', 'भगवान विष्णु को पुष्प अर्पित करें', 'पुष्प चढ़ाएँ'],
  ['माँ लक्ष्मी', 'माँ लक्ष्मी के चरणों में कमल अर्पित करें', 'कमल अर्पित करें']
] : [
  ['Shri Ganesh', 'Light a diya for an auspicious beginning', 'Light the diya'],
  ['Shri Vishnu', 'Offer a flower to Lord Vishnu', 'Offer a flower'],
  ['Maa Lakshmi', 'Offer a lotus at the feet of Maa Lakshmi', 'Offer a lotus']
];
const emblems = [
  '<path d="M18 55 Q50 67 82 55 Q74 79 50 79 Q27 79 18 55Z M45 80h10m-15 5h20"/><path fill="#ffd58b" d="M50 54C34 47 51 38 53 20c12 18 12 29-3 34Z"/>',
  '<path d="M27 63c-13-18-1-40 18-43 19-4 37 9 35 26-1 15-15 23-28 21l-17 15-11-10 12-13 M44 49c-10-12 7-24 15-14 6 8-2 16-8 11 M30 69l9 8"/>',
  '<path d="M50 73C33 63 35 43 50 25 65 43 67 63 50 73Z M48 74C27 73 18 59 17 41c17 3 26 14 31 33Zm4 0c21-1 30-15 31-33-17 3-26 14-31 33Z M17 56l-9-2c6 17 21 25 42 23 21 2 36-6 42-23l-9 2"/>'
];
const shrine = create('dialog', 'blessing-panel');
shrine.setAttribute('aria-labelledby','blessing-title');
shrine.innerHTML = '<div class="blessing-inner"><p class="blessing-count"></p><svg aria-hidden="true" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"></svg><h2 id="blessing-title"></h2><p class="blessing-message"></p><button class="blessing-act" type="button"></button><button class="blessing-skip" type="button"></button></div>';
document.body.append(shrine);
const blessingCSS = create('style');
blessingCSS.textContent = `
.blessing-panel{box-sizing:border-box;width:min(90vw,28rem);max-height:88dvh;padding:9px;border:1px solid #dcc096;border-radius:48% 48% 8px 8px / 19% 19% 8px 8px;color:#fff4dd;background:radial-gradient(ellipse at top,#863b47,#491727 61%,#32131e);text-align:center;box-shadow:0 20px 80px #1f0b1890}
.blessing-panel::backdrop{background:#211017dc}
.blessing-inner{border:1px solid #c39e68;border-radius:inherit;padding:clamp(24px,7vw,42px) 14px 18px;background:radial-gradient(ellipse at 50% 25%,#dfaa5624,transparent 42%)}
.blessing-panel svg{width:clamp(78px,23vw,110px);color:#ffdb91;border:1px solid #c99d60;border-radius:50%;background:#401522}
.blessing-panel h2{font:normal clamp(30px,8vw,48px)/1.3 Georgia,serif;color:#ffe7b6;margin:12px 0 6px}
.blessing-panel p{font-size:17px;line-height:1.5;color:#fff0d6;margin:10px auto 18px}
.blessing-panel button{display:block;margin:8px auto 0;min-height:44px;font-size:16px;cursor:pointer}
.blessing-act{color:#401522;background:#f5dfb1;border:1px solid #d9ae70;border-radius:4px;padding:8px 24px}
.blessing-skip{background:transparent;color:#fff0db;text-decoration:underline;border:0}
`;
document.head.append(blessingCSS);
let blessingStep = 0;
const action = shrine.querySelector('.blessing-act');
function showBlessing() {
  const [name, message, label] = blessings[blessingStep];
  shrine.querySelector('svg').innerHTML = emblems[blessingStep];
  shrine.querySelector('h2').textContent = name;
  shrine.querySelector('.blessing-count').textContent = (isHindi ? 'मंगल वंदना' : 'Wedding blessings') + ' · ' + (blessingStep + 1) + ' / 3';
  shrine.querySelector('.blessing-message').textContent = message;
  action.textContent = label;
  action.setAttribute('aria-label', name + ' · ' + label);
  if (!motion.matches && shrine.open) shrine.querySelector('svg').animate([{opacity:.4,transform:'scale(.94)'},{opacity:1,transform:'scale(1)'}],{duration:380});
}
function finishBlessings() {
  shrine.close();
  openCover();
}
shrine.querySelector('.blessing-inner').setAttribute('aria-live','polite');
shrine.querySelector('.blessing-skip').textContent = isHindi ? 'सीधे निमंत्रण खोलें' : 'Open invitation directly';
shrine.querySelector('.blessing-skip').addEventListener('click',finishBlessings);
action.addEventListener('click', () => {
  if (++blessingStep === blessings.length) finishBlessings();
  else showBlessing();
});
openingButton.addEventListener('click', () => {
  if (typeof shrine.showModal !== 'function') { openCover(); return; }
  blessingStep = 0;
  showBlessing();
  shrine.showModal();
  action.focus();
  if (!soundOff && music.paused) startBhajan();
});
document.querySelector('.skip').addEventListener('click', () =>
  openCover({ animate: false, focus: false })
);
document.querySelector('#replay-invitation').addEventListener('click', event => {
  event.preventDefault();
  history.replaceState(null, '', location.pathname + location.search);
  closeCover();
  openingButton.focus({ preventScroll: true });
});

const weddingDate = dateFrom(wedding.date);
for (const [id, format] of [
  ['wedding-weekday', { weekday: 'long' }],
  ['wedding-day', { day: '2-digit' }],
  ['wedding-month', { month: 'long', year: 'numeric' }]
]) {
  document.getElementById(id).textContent = weddingDate.toLocaleDateString(locale, { ...dateOptions, ...format });
}
const scroll = document.querySelector('#date-scroll');
const paper = document.querySelector('.date-paper');
const paperWindow = document.querySelector('#date-paper');
const tassel = document.querySelector('#reveal-date');
let pullStart = null;
let progress = 0;
let pointerId = null;
let suppressPointerClick = false;
let revealed = false;
let countdownTimer;

function updateCountdown() {
  const target = new Date(wedding.date + 'T00:00:00+05:30').getTime();
  const seconds = Math.ceil((target - Date.now()) / 1000);
  const element = document.querySelector('#countdown');
  if (seconds <= 0) {
    element.textContent = text.weddingDay + ' · ' + longDate.format(weddingDate);
    clearInterval(countdownTimer);
    return;
  }
  const counts = [Math.floor(seconds / 86400), Math.floor(seconds / 3600) % 24,
    Math.floor(seconds / 60) % 60, seconds % 60];
  element.replaceChildren(...counts.map((count, index) => {
    const block = create('span', 'count-unit');
    block.append(create('strong', '', String(count).padStart(2, '0')), create('small', '', text.units[index]));
    return block;
  }));
}

function revealDate() {
  if (revealed) return;
  revealed = true;
  scroll.classList.remove('dragging');
  scroll.classList.add('revealed');
  paperWindow.style.height = '';
  paperWindow.setAttribute('aria-hidden', 'false');
  tassel.setAttribute('aria-expanded', 'true');
  tassel.setAttribute('aria-label', text.revealed);
  document.querySelector('#date-hint').hidden = true;
  document.querySelector('#date-extras').hidden = false;
  countdownTimer = setInterval(updateCountdown, 1000);
  updateCountdown();
  scatter(document.querySelector('#date-petals'));
}

tassel.addEventListener('click', event => {
  if (event.detail === 0 || !suppressPointerClick) revealDate();
});
tassel.addEventListener('pointerdown', event => {
  if (revealed || !event.isPrimary || event.button !== 0) return;
  pointerId = event.pointerId;
  suppressPointerClick = false;
  pullStart = event.clientY;
  progress = 0;
  scroll.classList.add('dragging');
  tassel.setPointerCapture(event.pointerId);
});
tassel.addEventListener('pointermove', event => {
  if (pullStart === null || event.pointerId !== pointerId) return;
  progress = Math.min(paper.offsetHeight, Math.max(0, event.clientY - pullStart));
  suppressPointerClick ||= Math.abs(event.clientY - pullStart) > 8;
  paperWindow.style.height = progress + 'px';
});
function finishPull(event) {
  if (pullStart === null || event.pointerId !== pointerId) return;
  pullStart = null;
  pointerId = null;
  scroll.classList.remove('dragging');
  if (event.type === 'pointerup' && progress >= 45) revealDate();
  else paperWindow.style.height = '';
}
tassel.addEventListener('pointerup', finishPull);
tassel.addEventListener('pointercancel', finishPull);
tassel.addEventListener('lostpointercapture', finishPull);

const carousel = document.querySelector('#events');
const dots = document.querySelector('#event-dots');
for (const [index, event] of wedding.events.entries()) {
  const card = create('article', 'event-card');
  card.style.setProperty('--accent', event.accent);
  card.id = 'celebration-' + (index + 1);
  const art = create('img', 'event-art');
  art.src = '/shubh-vivah/photos/function-' + (index + 1) + '.webp';
  art.alt = isHindi ? event.title + ' का चित्रण' : 'Illustration for ' + event.title;
  art.width = 768;
  art.height = 512;
  art.loading = 'lazy';
  const body = create('div', 'event-body');
  const time = create('time', 'event-date', longDate.format(dateFrom(event.date)));
  time.dateTime = event.date;
  body.append(time, create('h3', '', event.title), create('p', 'event-clock', event.time));
  if (event.venue) body.append(create('p', 'event-location', event.venue));
  body.append(create('p', 'event-theme', event.theme));
  const dress = create('div', 'dress');
  dress.append(create('p', 'eyebrow', text.dress), create('p', 'attire', event.attire.replaceAll(' | ', ' · ')));
  if (event.colors) {
    const palette = create('ul', 'swatches');
    for (const [name, color] of event.colors) {
      const swatch = create('li', '', name);
      swatch.style.setProperty('--swatch', color);
      palette.append(swatch);
    }
    dress.append(palette);
  }
  body.append(dress, create('p', 'message', event.message));
  if (event.note) body.append(create('p', 'event-note', event.note));
  card.append(art, body);
  carousel.append(card);
  const dot = create('button', 'dot');
  dot.type = 'button';
  dot.setAttribute('aria-label', text.showEvent(event.title));
  const thumbnail = art.cloneNode();
  thumbnail.removeAttribute('width');
  thumbnail.removeAttribute('height');
  thumbnail.className = 'event-thumbnail';
  thumbnail.setAttribute('aria-hidden', 'true');
  dot.append(thumbnail);
  dot.addEventListener('click', () => showCard(index));
  dots.append(dot);
}

const cards = Array.from(carousel.children);
const currentEvent = document.querySelector('#current-event');
const schedule = document.querySelector('#schedule');
const scheduleView = document.querySelector('#schedule-view');
const swipeHint = schedule.querySelector('.swipe-hint');
let listView = false;
scheduleView.addEventListener('click', () => {
  listView = !listView;
  schedule.classList.toggle('schedule-list', listView);
  scheduleView.setAttribute('aria-pressed', String(listView));
  swipeHint.hidden = listView;
  if (!listView) {
    const card = cards[active];
    carousel.scrollTo({
      left: card.offsetLeft - (carousel.clientWidth - card.offsetWidth) / 2,
      behavior: 'instant'
    });
  }
});
let active = -1;
let announced = -1;
let settleTimer;
function announceCard() {
  if (announced === active) return;
  cards[announced]?.classList.remove('entering');
  cards[active].classList.add('entering');
  announced = active;
  currentEvent.textContent = wedding.events[active].title;
}
function selectCard(index) {
  if (active === index) return;
  active = index;
  for (const [position, card] of cards.entries()) {
    card.classList.toggle('active', position === index);
    dots.children[position].setAttribute('aria-current', position === index ? 'true' : 'false');
  }
}
function showCard(index) {
  const position = (index + cards.length) % cards.length;
  const card = cards[position];
  carousel.scrollTo({
    left: card.offsetLeft - (carousel.clientWidth - card.offsetWidth) / 2,
    behavior: behavior()
  });
}
selectCard(0);
announceCard();
let scheduled = false;
carousel.addEventListener('scroll', () => {
  if (scheduled || listView) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    if (listView) return;
    const center = carousel.scrollLeft + carousel.clientWidth / 2;
    const distance = card => Math.abs(card.offsetLeft + card.offsetWidth / 2 - center);
    const closest = cards.reduce((best, card) => distance(card) < distance(best) ? card : best);
    selectCard(cards.indexOf(closest));
    clearTimeout(settleTimer);
    settleTimer = setTimeout(announceCard, 130);
  });
}, { passive: true });
document.querySelector('#previous-event').addEventListener('click', () => showCard(active - 1));
document.querySelector('#next-event').addEventListener('click', () => showCard(active + 1));
carousel.addEventListener('keydown', event => {
  if (listView) return;
  if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
  event.preventDefault();
  showCard(active + (event.key === 'ArrowRight' ? 1 : -1));
});

function mapsLink(action, parameters) {
  const url = new URL('https://www.google.com/maps/' + action + '/');
  url.search = new URLSearchParams({ api: '1', ...parameters });
  return url.href;
}

async function copyText(value, message, status) {
  try {
    await navigator.clipboard.writeText(value);
    status.textContent = message;
  } catch {
    status.textContent = value;
  }
}

const venueCards = document.querySelector('#venue-cards');
for (const venue of wedding.venues) {
  const card = create('article', 'venue-card');
  const map = create('a', 'button secondary', isHindi ? 'Google Maps पर स्थल देखें' : 'View venue on Google Maps');
  map.href = venue.googleMapsPlace || mapsLink('search', { query: venue.coordinates });
  map.target = '_blank';
  map.rel = 'noopener noreferrer';
  map.setAttribute('aria-label', text.mapPin(venue.name));
  card.append(create('p', 'eyebrow', venue.occasion), create('h3', '', venue.name), create('p', '', venue.address));
  const controls = create('div', 'map-controls');
  const getDirections = create('a', 'button', isHindi ? 'Google Maps से रास्ता' : 'Google Maps directions');
  getDirections.href = mapsLink('dir', { destination: venue.directionsDestination || venue.coordinates });
  getDirections.target = '_blank';
  getDirections.rel = 'noopener noreferrer';
  getDirections.setAttribute('aria-label', text.directionsTo(venue.name));
  controls.append(map, getDirections);
  const appleUrl = new URL('https://maps.apple.com/directions');
  appleUrl.searchParams.set('destination', venue.coordinates);
  const apple = create('a', 'button secondary', isHindi ? 'Apple Maps से रास्ता' : 'Apple Maps directions');
  apple.href = appleUrl.href;
  apple.target = '_blank';
  apple.rel = 'noopener noreferrer';
  const photos = venue.googleMapsPlace
    ? create('a', 'button secondary', isHindi ? 'गार्डन की असली फ़ोटो देखें' : 'View garden photos')
    : create('a', 'jump', isHindi ? 'वेन्यू की फोटो गैलरी' : 'Venue photo gallery');
  photos.href = venue.photos;
  photos.target = '_blank';
  photos.rel = 'noopener noreferrer';
  if (!/Android/i.test(navigator.userAgent)) controls.append(apple);
  controls.append(photos);
  const copy = create('button', 'copy-address', text.copyAddress);
  copy.type = 'button';
  copy.addEventListener('click', () => copyText(
    venue.name + ', ' + venue.address, text.addressCopied(venue.name),
    document.querySelector('#copy-status')
  ));
  controls.append(copy);
  const isKurwai = Boolean(venue.googleMapsPlace);
  const figure = create('figure', 'venue-photo-frame');
  const photo = create('img', 'venue-gate-photo');
  photo.src = '/shubh-vivah/photos/' + (isKurwai ? 'patel-landmark-gate.webp' : 'bhopal-venue.webp');
  photo.alt = isKurwai
    ? (isHindi ? 'पटेल लैंडमार्क का मुख्य द्वार' : 'The Patel Landmark main entrance')
    : (isHindi ? 'रॉयल सेलिब्रेशन्स क्लब की इमारत और लॉन' : 'Royal Celebrations Club building and lawn');
  photo.loading = 'lazy';
  photo.decoding = 'async';
  photo.width = isKurwai ? 1440 : 1280;
  photo.height = isKurwai ? 989 : 720;
  const caption = create('figcaption', 'venue-photo-caption');
  caption.append(create('span', '', isKurwai
    ? (isHindi ? 'मुख्य द्वार · कुरवाई' : 'Main entrance · Kurwai')
    : (isHindi ? 'इमारत और लॉन · भोपाल' : 'Building and lawn · Bhopal')));
  if (!isKurwai) {
    const credit = create('a', '', 'Weddingz.in');
    credit.href = 'https://weddingz.in/bhopal/royal-celebrations-club-hotel-misrod/';
    credit.target = '_blank';
    credit.rel = 'noopener noreferrer';
    caption.append(credit);
  }
  figure.append(photo, caption);
  card.append(figure);
  card.append(controls);
  venueCards.append(card);
}

const music = document.querySelector('#wedding-music');
const musicToggle = document.querySelector('#sound-toggle');
let soundOff = false;
function updateMusicButton() {
  musicToggle.setAttribute('aria-pressed', String(!music.paused));
  musicToggle.textContent = music.paused
    ? (isHindi ? 'गणेश भजन सुनें' : 'Play Ganesh bhajan')
    : (isHindi ? 'भजन रोकें' : 'Pause bhajan');
}
music.addEventListener('play', updateMusicButton);
music.addEventListener('pause', updateMusicButton);
music.addEventListener('ended', updateMusicButton);
function startBhajan() {
  music.play().catch(updateMusicButton);
}
musicToggle.addEventListener('click', () => {
  soundOff = !music.paused;
  if (music.paused) {
    startBhajan();
  } else {
    music.pause();
  }
});

if ('IntersectionObserver' in window && !motion.matches) {
  const reveal = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      reveal.unobserve(entry.target);
      entry.target.animate([{ opacity: .78 }, { opacity: 1 }], {
        duration: 360, easing: 'ease-out',
      });
    }
  }, { threshold: .14 });
  for (const section of document.querySelectorAll('.date-section, .schedule, .venues')) {
    reveal.observe(section);
  }
}
