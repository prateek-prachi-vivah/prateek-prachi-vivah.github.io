// The overview and full-screen rooms read the same bilingual event cards.
const hi = document.documentElement.lang === 'hi';
const tr = (en, hindi) => hi ? hindi : en;
const dialog = document.createElement('dialog');
dialog.className = 'celebration-room';
dialog.setAttribute('aria-labelledby', 'room-title');
dialog.innerHTML = '<header><button type="button" data-close></button><output aria-live="polite"></output></header><section class="room-scroll"></section><nav><button data-prev>←</button><button data-tour></button><button data-overview></button><button data-next>→</button></nav><div class="doorway" aria-hidden="true"><i></i><i></i></div>';
document.body.append(dialog);
const get = s => dialog.querySelector(s);
const cards = () => [...document.querySelectorAll('#events .event-card')];
let current = 0;
let returnTo;
let gesture;
let timer;
let touring = true;
const tour = get('[data-tour]');
function scheduleTour() {
  clearTimeout(timer);
  tour.textContent = touring ? tr('Hold','रोकें') : tr('Continue','जारी रखें');
  if (!touring || !dialog.open || document.hidden) return;
  timer = setTimeout(() => current === cards().length - 1 ? closeRoom() : render(current + 1), 18000);
}
tour.onclick = () => { touring = !touring; scheduleTour(); };
document.addEventListener('visibilitychange', scheduleTour);
get('[data-close]').textContent = tr('Close','बंद करें');
get('[data-overview]').textContent = tr('View all celebrations','सभी कार्यक्रम देखें');
get('[data-prev]').ariaLabel = tr('Previous celebration','पिछला कार्यक्रम');
get('[data-next]').ariaLabel = tr('Next celebration','अगला कार्यक्रम');
function render(index) {
  const entries = cards();
  current = (index + entries.length) % entries.length;
  const card = entries[current];
  const picture = card.querySelector('.event-art').cloneNode();
  picture.loading = 'eager';
  const body = card.querySelector('.event-body').cloneNode(true);
  body.querySelector('h3').id = 'room-title';
  const content = get('.room-scroll');
  content.replaceChildren(body, picture);
  content.classList.add('room-enter');
  content.scrollTop = 0;
  dialog.style.setProperty('--room-accent', card.style.getPropertyValue('--accent'));
  get('output').textContent = (current + 1) + ' / ' + entries.length;
  scheduleTour();
  const doors = get('.doorway');
  doors.replaceWith(doors.cloneNode(true));
  document.dispatchEvent(new CustomEvent('invitation-sound', {detail:'room'}));
}
function openRoom(index, button) {
  if (!dialog.open) {
    returnTo = button;
    touring = true;
    history.pushState({...history.state, invitationRoom:true}, '');
    dialog.showModal();
  }
  render(index);
}
function closeRoom() {
  if (history.state?.invitationRoom) history.back();
  else dialog.close();
}
addEventListener('popstate', () => { if (dialog.open) dialog.close(); });
dialog.addEventListener('close', () => { clearTimeout(timer); returnTo?.focus({preventScroll:true}); });
get('.room-scroll').addEventListener('scroll', () => { if (touring && get('.room-scroll').scrollTop > 0) { touring = false; scheduleTour(); } }, {passive:true});
dialog.addEventListener('cancel', e => { e.preventDefault(); closeRoom(); });
get('[data-prev]').onclick = () => render(current - 1);
get('[data-next]').onclick = () => current === cards().length - 1 ? closeRoom() : render(current + 1);
get('[data-close]').onclick = get('[data-overview]').onclick = closeRoom;
dialog.addEventListener('keydown', e => {
  if (['ArrowLeft','ArrowRight'].includes(e.key)) { e.preventDefault(); render(current + (e.key === 'ArrowLeft' ? -1 : 1)); }
});
dialog.addEventListener('touchstart', e => { gesture = e.touches[0]; }, {passive:true});
dialog.addEventListener('touchend', e => {
  if (!gesture) return;
  const dx = e.changedTouches[0].clientX - gesture.clientX;
  if (Math.abs(dx) > 55 && Math.abs(dx) > 1.5 * Math.abs(e.changedTouches[0].clientY - gesture.clientY)) render(current + (dx < 0 ? 1 : -1));
  gesture = null;
}, {passive:true});
for (const [i, card] of cards().entries()) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'room-open';
  button.textContent = tr('Open celebration','कार्यक्रम खोलें') + ' · ' + (i+1) + '/7';
  button.onclick = () => openRoom(i,button);
  card.querySelector('.event-art-frame').append(button);
}
