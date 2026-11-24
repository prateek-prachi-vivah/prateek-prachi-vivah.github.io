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
  tassel.style.removeProperty('--pull');
  scroll.classList.remove('dragging');
  scroll.classList.add('revealed');
  paperWindow.style.height = '';
  paperWindow.setAttribute('aria-hidden', 'false');
  tassel.setAttribute('aria-expanded', 'true');
  tassel.setAttribute('aria-label', text.revealed);
  document.querySelector('#save-title').textContent = isHindi ? 'मुख्य विवाह की तारीख' : 'Main wedding date';
  document.querySelector('#date-hint').hidden = true;
  document.querySelector('#date-extras').hidden = false;
  countdownTimer = setInterval(updateCountdown, 1000);
  updateCountdown();
  document.dispatchEvent(new Event('invitation-date-revealed'));
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
  tassel.style.setProperty('--pull', Math.min(14, Math.sqrt(progress) * 1.4) + 'px');
  paperWindow.style.height = progress + 'px';
});
function finishPull(event) {
  if (pullStart === null || event.pointerId !== pointerId) return;
  pullStart = null;
  pointerId = null;
  tassel.style.removeProperty('--pull');
  scroll.classList.remove('dragging');
  if (event.type === 'pointerup' && progress >= 45) revealDate();
  else paperWindow.style.height = '';
}
tassel.addEventListener('pointerup', finishPull);
tassel.addEventListener('pointercancel', finishPull);
tassel.addEventListener('lostpointercapture', finishPull);

const carousel = document.querySelector('#events');
const dots = document.querySelector('#event-dots');
const ceremonyArtwork = isHindi ? [
  'श्रीराम और माता सीता के तिलक और सगाई का भक्तिमय चित्र',
  'माता पूजन में दीप अर्पित करते श्रीराम और माता सीता',
  'मेहंदी की रस्म में श्रीराम और माता सीता',
  'श्रीराम और माता सीता के सान्निध्य में संगीत करते दिव्य कलाकार',
  'हल्दी की रस्म में श्रीराम और माता सीता',
  'मंडप मामेरा में श्रीराम और माता सीता के समक्ष भेंट अर्पित करते दिव्य परिचारक',
  'श्रीराम और उनकी बारात में दिव्य देवगण'
] : [
  'Devotional depiction of Shri Ram and Mata Sita at Tilak and Sagai',
  'Shri Ram and Mata Sita offering a lamp at Mata Pujan',
  'Shri Ram and Mata Sita during the Mehendi ceremony',
  'Celestial musicians performing for Shri Ram and Mata Sita at Sangeet',
  'Shri Ram and Mata Sita during the Haldi ceremony',
  'Divine attendants offering gifts before Shri Ram and Mata Sita at Mandap Mamera',
  'Shri Ram with celestial devas in the Baraat'
];
for (const [index, event] of wedding.events.entries()) {
  const card = create('article', 'event-card');
  card.style.setProperty('--accent', event.accent);
  card.id = 'celebration-' + (index + 1);
  const art = create('img', 'event-art');
  art.src = '/darshan/miniature-ceremony-' + (index + 1) + '.webp';
  art.alt = ceremonyArtwork[index] || event.title;
  art.width = 1536;
  art.height = 1024;
  art.decoding = 'async';
  art.loading = 'lazy';
  art.fetchPriority = index === 0 ? 'auto' : 'low';
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
  const frame = create('div', 'event-art-frame');
  frame.append(art);
  const actions = create('div', 'event-calendar');
  const calendar = create('a', 'jump', isHindi ? 'Google कैलेंडर' : 'Google Calendar');
  const file = create('a', 'jump', isHindi ? 'कैलेंडर फ़ाइल' : 'Calendar file');
  const [start, end] = [['1600'],['1000','1200'],['1600','1800'],['2100','2300'],['0800','1000'],['1200','1500'],['1900']][index];
  const stamp = event.date.replaceAll('-', '') + 'T';
  const query = new URLSearchParams({ action: 'TEMPLATE', text: event.title, ctz: 'Asia/Kolkata',
    dates: stamp + start + '00/' + stamp + (end || start) + '00', details: event.time });
  if (event.venue) query.set('location', event.venue);
  calendar.href = 'https://calendar.google.com/calendar/render?' + query;
  calendar.target = '_blank';
  calendar.rel = 'noopener noreferrer';
  file.href = '/assets/calendar/' + (isHindi ? 'hi' : 'en') + '-' + (index + 1) + '.ics';
  file.download = '';
  actions.append(calendar, file);
  body.append(actions);
  card.append(frame, body);
  carousel.append(card);
  const dot = create('button', 'dot');
  dot.type = 'button';
  dot.setAttribute('aria-label', text.showEvent(event.title));
  const thumbnail = art.cloneNode();
  thumbnail.removeAttribute('width');
  thumbnail.removeAttribute('height');
  thumbnail.className = 'event-thumbnail';
  thumbnail.alt = '';
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
  scheduleView.textContent = listView
    ? (isHindi ? 'समारोह एक-एक करके देखें' : 'View celebrations one at a time')
    : (isHindi ? 'सभी समारोह एक साथ देखें' : 'View all celebrations');
  swipeHint.hidden = listView;
  if (!listView) {
    showCard(active, 'instant');
  }
});
let active = -1;
let requestedCard = null;
let announced = -1;
let settleTimer;
function announceCard() {
  requestedCard = null;
  if (announced === active) return;
  cards[announced]?.classList.remove('entering');
  cards[active].classList.add('entering');
  announced = active;
  currentEvent.textContent = wedding.events[active].title;
  const selected = dots.children[active];
  const left = selected.offsetLeft - dots.offsetLeft;
  if (left < dots.scrollLeft || left + selected.offsetWidth > dots.scrollLeft + dots.clientWidth) {
    dots.scrollTo({ left: left - (dots.clientWidth - selected.offsetWidth) / 2, behavior: behavior() });
  }
}
function selectCard(index) {
  if (active === index) return;
  if (active >= 0) document.dispatchEvent(new CustomEvent('invitation-sound', { detail: 'swipe' }));
  active = index;
  for (const [position, card] of cards.entries()) {
    card.style.setProperty('--fan', (Math.sign(index - position) * 11) + 'deg');
    card.classList.toggle('active', position === index);
    dots.children[position].setAttribute('aria-current', position === index ? 'true' : 'false');
  }
}
function showCard(index, scrollBehavior = behavior()) {
  const position = (index + cards.length) % cards.length;
  const card = cards[position];
  const left = card.offsetLeft - (carousel.clientWidth - card.offsetWidth) / 2;
  requestedCard = Math.abs(left - carousel.scrollLeft) > 1 ? position : null;
  carousel.scrollTo({ left, behavior: scrollBehavior });
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
document.querySelector('#previous-event').addEventListener('click', () => showCard((requestedCard ?? active) - 1));
document.querySelector('#next-event').addEventListener('click', () => showCard((requestedCard ?? active) + 1));
carousel.addEventListener('keydown', event => {
  if (listView) return;
  if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
  event.preventDefault();
  showCard((requestedCard ?? active) + (event.key === 'ArrowRight' ? 1 : -1));
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
  const details = create('div', 'venue-meta');
  details.append(create('p', 'eyebrow', venue.occasion), create('h3', '', venue.name), create('p', '', venue.address));
  const controls = create('div', 'map-controls');
  const getDirections = create('a', 'button', isHindi ? 'Google Maps से रास्ता' : 'Google Maps directions');
  getDirections.href = mapsLink('dir', { destination: venue.coordinates });
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
  photo.srcset = '/darshan/' + (isKurwai ? 'kurwai' : 'bhopal') + '-venue-mobile.webp 650w, ' +
    photo.src + (isKurwai ? ' 1440w' : ' 1280w');
  photo.sizes = '(max-width: 720px) 95vw, 540px';
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
  card.append(figure, details, controls);
  venueCards.append(card);
}

if ('IntersectionObserver' in window && !motion.matches) {
  const reveal = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      reveal.unobserve(entry.target);
      const photoCard = entry.target.matches('.venue-card');
      if (motion.matches) continue;
      const frames = photoCard
        ? [{ opacity: .64, transform: 'perspective(900px) rotateX(8deg) translateY(15px)' },
           { opacity: 1, transform: 'perspective(900px) rotateX(0deg) translateY(0)' }]
        : [{ opacity: .78 }, { opacity: 1 }];
      entry.target.animate(frames, { duration: photoCard ? 660 : 360, easing: 'cubic-bezier(.2,.65,.25,1)' });
    }
  }, { threshold: .14 });
  for (const section of document.querySelectorAll('.date-section, .schedule, .venue-card')) {
    reveal.observe(section);
  }
}

import('/darshan/celebrations.js?v=19');
