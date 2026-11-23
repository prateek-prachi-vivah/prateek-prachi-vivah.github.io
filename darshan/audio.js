const preferenceKey = 'wedding-audio-v2';

/** One gain bus owns the opening cues and the original card bhajan. */
export function weddingAudio({ source, control, hindi, isCardOpen }) {
  const labels = hindi ? {
    play: 'गणेश भजन सुनें', pause: 'भजन रोकें', on: 'ध्वनि चालू करें',
    off: 'ध्वनि बंद करें', loading: 'भजन लोड हो रहा है', retry: 'भजन फिर चलाएँ'
  } : {
    play: 'Play Ganesh bhajan', pause: 'Pause bhajan', on: 'Enable sound',
    off: 'Mute sound', loading: 'Loading bhajan', retry: 'Retry bhajan'
  };
  let choice = '';
  try { choice = sessionStorage.getItem(preferenceKey) || ''; } catch {}
  let context, bus, bufferPromise, track, trackGain, startedAt;
  let offset = 0;
  let pending = 0;
  let status = 'idle';
  let visible = !document.hidden;
  let blocked = false;
  let lastCue = -Infinity;

  function display() {
    const openingSound = !isCardOpen() && choice === 'on' && context?.state === 'running';
    const playing = Boolean(openingSound || track || !source.paused);
    control.textContent = status === 'loading' ? labels.loading
      : playing ? (isCardOpen() ? labels.pause : labels.off)
      : blocked ? labels.retry : (isCardOpen() ? labels.play : labels.on);
    control.setAttribute('aria-pressed', String(playing));
    control.dataset.status = status;
  }

  function setChoice(value) {
    choice = value;
    try { sessionStorage.setItem(preferenceKey, value); } catch {}
    if (value !== 'on') stop();
    display();
  }

  function getContext() {
    if (!context) {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return;
      context = new Audio();
      bus = context.createGain();
      bus.gain.value = .86;
      bus.connect(context.destination);
    }
    return context;
  }

  function load() {
    bufferPromise ??= fetch(source.src)
      .then(response => {
        if (!response.ok) throw new Error('Bhajan unavailable');
        return response.arrayBuffer();
      })
      .then(bytes => context.decodeAudioData(bytes))
      .catch(error => { bufferPromise = undefined; throw error; });
    return bufferPromise;
  }

  async function unlock() {
    try {
      const audio = getContext();
      if (!audio) return false;
      const resume = audio.resume();
      load().catch(() => {});
      await resume;
      display();
      return audio.state === 'running';
    } catch { return false; }
  }

  async function play() {
    if (choice !== 'on' || !visible || !isCardOpen() || track || !source.paused || status === 'loading') return;
    const request = ++pending;
    status = 'loading';
    blocked = false;
    display();
    try {
      if (!context || context.state !== 'running') throw new Error('Audio permission needed');
      const buffer = await load();
      if (request !== pending || choice !== 'on' || !visible || !isCardOpen()) return;
      track = context.createBufferSource();
      track.buffer = buffer;
      track.loop = true;
      trackGain = context.createGain();
      startedAt = context.currentTime;
      trackGain.gain.setValueAtTime(0, startedAt);
      trackGain.gain.linearRampToValueAtTime(3.20, startedAt + .48);
      track.connect(trackGain).connect(bus);
      track.start(startedAt, offset % buffer.duration);
      status = 'playing';
    } catch {
      if (request !== pending) return;
      blocked = true;
      status = 'paused';
    }
    display();
  }

  function silenceCue() {
    if (!context || !bus) return;
    const now = context.currentTime;
    bus.gain.cancelScheduledValues(now);
    bus.gain.setTargetAtTime(.0001, now, .015);
  }

  function restoreBus() {
    if (!context || !bus) return;
    const now = context.currentTime;
    bus.gain.cancelScheduledValues(now);
    bus.gain.setTargetAtTime(.86, now, .035);
  }

  function stop() {
    pending++;
    silenceCue();
    if (track) {
      const now = context.currentTime;
      offset = (offset + now - startedAt) % track.buffer.duration;
      trackGain.gain.cancelScheduledValues(now);
      trackGain.gain.setTargetAtTime(0, now, .018);
      track.stop(now + .08);
      track = undefined;
    }
    source.pause();
    blocked = false;
    status = 'paused';
    display();
  }

  function cue(kind) {
    if (choice !== 'on' || !visible || context?.state !== 'running') return;
    const now = context.currentTime;
    if (now - lastCue < .6) return;
    lastCue = now;
    restoreBus();
    const door = kind === 'door';
    const cueLevel = door ? .07 : kind === 'cord' ? .033 : .05;
    for (const [index, multiple] of [1, 2.01, 2.76, 4.08].entries()) {
      const note = context.createOscillator();
      const gain = context.createGain();
      const tail = .62 - .12 * index;
      note.type = 'sine';
      note.frequency.value = (door ? 392 : 523.25) * multiple;
      gain.gain.setValueAtTime(.0001, now);
      gain.gain.exponentialRampToValueAtTime(cueLevel / (1 + index), now + .012);
      gain.gain.exponentialRampToValueAtTime(.0001, now + tail);
      note.connect(gain).connect(bus);
      note.start(now);
      note.stop(now + tail);
      note.onended = () => { note.disconnect(); gain.disconnect(); };
    }
  }

  function activate() {
    setChoice('on');
    const unlocked = unlock();
    if (isCardOpen()) {
      restoreBus();
      // A direct media play in the button event also works when Web Audio is unavailable.
      if (!context) {
        source.play().catch(() => { blocked = true; display(); });
        return;
      }
      unlocked.then(ready => { if (ready) play(); else { blocked = true; display(); } });
    } else unlocked.then(ready => { if (ready && isCardOpen()) { restoreBus(); play(); } });
  }

  control.addEventListener('click', () => {
    if (choice === 'on' && (track || !source.paused || status === 'loading' || (!isCardOpen() && !blocked))) setChoice('off');
    else activate();
  });
  for (const event of ['play', 'pause', 'ended', 'error']) source.addEventListener(event, display);
  document.addEventListener('visibilitychange', () => {
    visible = !document.hidden;
    if (!visible) stop();
    else if (choice === 'on' && isCardOpen() && context?.state === 'running') { restoreBus(); play(); }
  });
  display();

  return {
    activate,
    mute: () => setChoice('off'),
    startCard() {
      restoreBus();
      if (choice === 'on' && context?.state === 'running') play();
      display();
    },
    stop,
    cue
  };
}
