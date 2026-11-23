const preferenceKey = 'wedding-audio-v2';
const levels = { opening: 1.65, card: 2.75 };

/** Reuse the original credited Ganesh bhajan across both scenes and the card. */
export function weddingAudio({ source, control, hindi, isCardOpen }) {
  const labels = hindi ? {
    on: 'भक्ति संगीत सुनें', off: 'ध्वनि बंद करें',
    play: 'गणेश भजन सुनें', pause: 'भजन रोकें', loading: 'संगीत लोड हो रहा है'
  } : {
    on: 'Play devotional music', off: 'Mute sound',
    play: 'Play Ganesh bhajan', pause: 'Pause bhajan', loading: 'Loading music'
  };
  let choice;
  try { choice = sessionStorage.getItem(preferenceKey); } catch {}
  let context, mix, decoded, track, gain, startedAt, roomFade;
  let offset = 0;
  let sequence = 0;
  let pending = false;
  let nativePending = false;
  let wantsSound = choice === 'on';
  let lastCue = -Infinity;

  function display() {
    const sound = Boolean(track || !source.paused);
    control.dataset.status = sound ? 'playing' : pending || nativePending ? 'loading' : 'paused';
    control.setAttribute('aria-pressed', String(sound));
    control.textContent = sound ? (isCardOpen() ? labels.pause : labels.off)
      : pending || nativePending ? labels.loading : (isCardOpen() ? labels.play : labels.on);
  }

  function level() {
    const next = isCardOpen() ? levels.card : levels.opening;
    if (track) gain.gain.setTargetAtTime(next, context.currentTime, .24);
    else {
      clearInterval(roomFade);
      const desired = isCardOpen() ? 1 : .78;
      if (source.paused) {
        source.volume = desired;
        return;
      }
      roomFade = setInterval(() => {
        source.volume += (desired - source.volume) * .17;
        if (Math.abs(desired - source.volume) < .015) {
          source.volume = desired;
          clearInterval(roomFade);
        }
      }, 50);
    }
  }

  function stop() {
    sequence++;
    pending = nativePending = false;
    clearInterval(roomFade);
    if (track) {
      const now = context.currentTime;
      const node = track;
      const nodeGain = gain;
      offset = (offset + now - startedAt) % node.buffer.duration;
      nodeGain.gain.cancelScheduledValues(now);
      nodeGain.gain.setTargetAtTime(0, now, .018);
      node.stop(now + .075);
      node.onended = () => { node.disconnect(); nodeGain.disconnect(); };
      track = undefined;
    }
    if (!source.paused) offset = source.currentTime;
    source.pause();
    display();
  }

  function remember(value) {
    choice = value;
    wantsSound = value === 'on';
    try { sessionStorage.setItem(preferenceKey, value); } catch {}
  }

  function decode() {
    decoded ??= fetch(source.src)
      .then(response => {
        if (!response.ok) throw new Error('Bhajan unavailable');
        return response.arrayBuffer();
      })
      .then(bytes => context.decodeAudioData(bytes))
      .catch(error => { decoded = undefined; throw error; });
    return decoded;
  }

  function playNative() {
    if (document.hidden || choice === 'off' || track || nativePending || pending || !source.paused) return;
    const id = ++sequence;
    nativePending = true;
    source.volume = isCardOpen() ? 1 : .78;
    display();
    source.play().then(() => {
      if (choice === 'off' || document.hidden) source.pause();
      else if (id === sequence) wantsSound = true;
    }).catch(() => {}).finally(() => {
      if (id === sequence) { nativePending = false; display(); }
    });
  }

  function activate() {
    remember('on');
    if (track || pending || document.hidden) return;
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) { playNative(); return; }
      if (!context) {
        context = new Audio();
        mix = context.createGain();
        mix.connect(context.destination);
      }
      if (!source.paused || nativePending) stop();
      const id = ++sequence;
      pending = true;
      display();
      Promise.all([context.resume(), decode()]).then(([, buffer]) => {
        if (id !== sequence || choice === 'off' || document.hidden) return;
        track = context.createBufferSource();
        track.buffer = buffer;
        track.loop = true;
        gain = context.createGain();
        startedAt = context.currentTime;
        gain.gain.value = .001;
        track.connect(gain).connect(mix);
        track.start(startedAt, offset % buffer.duration);
        level();
      }).catch(() => {
        if (id !== sequence) return;
        pending = false;
        playNative();
      }).finally(() => {
        if (id === sequence) { pending = false; display(); }
      });
    } catch { playNative(); }
  }

  function cue(kind) {
    if (choice === 'off' || !wantsSound || document.hidden || context?.state !== 'running') return;
    const now = context.currentTime;
    if (now - lastCue < .51) return;
    lastCue = now;
    const fundamental = { door: 440, sanctum: 587.33, darshan: 523.25, cord: 659.25 }[kind];
    for (const [i, ratio] of [1, 2.02, 2.73, 4.04].entries()) {
      const voice = context.createOscillator();
      const decay = context.createGain();
      const length = (kind === 'sanctum' ? .9 : .47) - .08 * i;
      voice.frequency.value = fundamental * ratio;
      decay.gain.setValueAtTime(.0001, now);
      decay.gain.exponentialRampToValueAtTime(.053 / (1 + i), now + .021);
      decay.gain.exponentialRampToValueAtTime(.0001, now + length);
      voice.connect(decay).connect(mix);
      voice.start(now);
      voice.stop(now + length);
      voice.onended = () => { voice.disconnect(); decay.disconnect(); };
    }
  }

  control.addEventListener('click', () => {
    if (track || !source.paused || pending) { remember('off'); stop(); }
    else activate();
  });
  for (const event of ['play', 'pause', 'error']) source.addEventListener(event, display);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else if (wantsSound && choice !== 'off') {
      if (context?.state === 'running') activate();
      else playNative();
    }
  });
  display();
  return {
    prepare() { level(); playNative(); },
    startCard() { level(); if (wantsSound && !track) playNative(); display(); },
    cue
  };
}
