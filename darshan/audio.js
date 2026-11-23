const preferenceKey = 'wedding-audio-v2';
const transition = .16;
const tones = { door: 293.66, sanctum: 392, darshan: 349.23, cord: 523.25 };

export function weddingAudio({ source, control, hindi, isCardOpen }) {
  const tracks = [source.src, new URL(source.dataset.cardSrc, document.baseURI).href];
  const labels = hindi ? {
    play: ['वैकुंठ संगीत सुनें', 'गणेश भजन सुनें'],
    pause: 'ध्वनि बंद करें', waiting: 'संगीत लोड हो रहा है', retry: 'संगीत फिर चलाएँ'
  } : {
    play: ['Play Vaikuntha music', 'Play Ganesh bhajan'],
    pause: 'Mute sound', waiting: 'Loading sound', retry: 'Retry sound'
  };
  let preference;
  try { preference = sessionStorage.getItem(preferenceKey); } catch {}
  let phase = Number(isCardOpen());
  let playingPhase = !phase && !source.paused ? 0 : null;
  let context, music, chimes;
  const liveChimes = new Set();
  let generation = 0;
  let loading = false;
  let failed = false;

  function show() {
    const playing = !source.paused && playingPhase === phase;
    control.dataset.track = phase ? 'ganesh' : 'vaikuntha';
    control.dataset.status = playing ? 'playing' : loading ? 'loading' : failed ? 'retry' : 'paused';
    control.setAttribute('aria-pressed', String(playing));
    control.textContent = playing ? labels.pause : loading ? labels.waiting : failed ? labels.retry : labels.play[phase];
  }

  function remember(value) {
    preference = value;
    try { sessionStorage.setItem(preferenceKey, value); } catch {}
  }

  // Keep the same authorized HTML audio element for both tracks. Attach the mixer
  // only after its context runs so a suspended context cannot silence native playback.
  function enableMixer() {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return;
    try {
      context ??= new Audio();
      const attach = () => {
        if (music || context.state !== 'running') return;
        const input = context.createMediaElementSource(source);
        music = context.createGain();
        chimes = context.createGain();
        input.connect(music).connect(context.destination);
        chimes.connect(context.destination);
      };
      if (context.state === 'running') attach();
      else context.resume().then(attach).catch(() => {});
    } catch {}
  }

  function setGain(value, duration = transition) {
    if (!music) return;
    const now = context.currentTime;
    music.gain.cancelScheduledValues(now);
    music.gain.setValueAtTime(music.gain.value, now);
    music.gain.linearRampToValueAtTime(value, now + duration);
  }

  function nativeRamp(from, to, token) {
    const start = performance.now();
    return new Promise(resolve => {
      function step(now) {
        if (token !== generation) { resolve(); return; }
        const progress = Math.max(0, Math.min(1, (now - start) / (transition * 1000)));
        source.volume = from + (to - from) * progress;
        if (progress < 1) requestAnimationFrame(step);
        else resolve();
      }
      requestAnimationFrame(step);
    });
  }

  async function play({ gesture = false, fresh = false } = {}) {
    if (preference === 'off' || document.hidden) return;
    const token = ++generation;
    const index = phase;
    const changing = source.src !== tracks[index] && !source.paused;
    loading = true;
    failed = false;
    show();
    if (gesture) enableMixer();
    try {
      if (changing) {
        if (music && context.state === 'running') {
          setGain(0);
          await new Promise(resolve => setTimeout(resolve, transition * 1000));
        } else {
          // Some mobile browsers ignore element volume. Both files still have
          // matched source levels, and the authorized element is reused.
          source.volume = .98;
          if (source.volume === .98) await nativeRamp(.98, 0, token);
        }
        if (token !== generation || preference === 'off' || document.hidden) return;
        source.pause();
      }
      if (source.src !== tracks[index]) source.src = tracks[index];
      if (fresh) {
        try { source.currentTime = 0; } catch {}
      }
      if (music) setGain(changing ? 0 : 1, .01);
      source.loop = true;
      // Directly within the button handler when browser activation is required.
      await source.play();
      if (token !== generation || preference === 'off' || document.hidden) return;
      playingPhase = index;
      if (changing && !music && source.volume < .95) nativeRamp(source.volume, 1, token);
      else source.volume = 1;
      if (music) setGain(1);
      if (!gesture) enableMixer();
    } catch (error) {
      if (token === generation) {
        failed = error?.name !== 'NotAllowedError';
        source.volume = 1;
        setGain(1, .01);
      }
    } finally {
      if (token === generation) { loading = false; show(); }
    }
  }

  function stop() {
    generation++;
    loading = failed = false;
    playingPhase = null;
    for (const note of liveChimes) {
      try { note.stop(); } catch {}
    }
    source.pause();
    source.volume = 1;
    setGain(1, .01);
    show();
  }

  function cue(kind) {
    if (preference === 'off' || source.paused || document.hidden ||
        !chimes || context.state !== 'running') return;
    const now = context.currentTime;
    const length = kind === 'sanctum' ? .64 : .39;
    const tone = tones[kind];
    if (playingPhase === 0) {
      setGain(.62, .012);
      music.gain.setValueAtTime(.62, now + .07);
      music.gain.linearRampToValueAtTime(1, now + .20);
    }
    for (const [index, multiple] of [1, 1.99, 2.42].entries()) {
      const note = context.createOscillator();
      const envelope = context.createGain();
      note.frequency.value = tone * multiple;
      envelope.gain.setValueAtTime(.0001, now);
      envelope.gain.exponentialRampToValueAtTime(.064 / (index + 1), now + .009);
      envelope.gain.exponentialRampToValueAtTime(.0001, now + length);
      note.connect(envelope).connect(chimes);
      liveChimes.add(note);
      note.onended = () => { liveChimes.delete(note); note.disconnect(); envelope.disconnect(); };
      note.start(now);
      note.stop(now + length);
    }
  }

  control.addEventListener('click', () => {
    if (!source.paused || (loading && preference === 'on')) { remember('off'); stop(); }
    else { remember('on'); play({ gesture: true }); }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else play();
  });
  show();
  return {
    prepare() {
      phase = 0;
      if (preference !== 'off' && playingPhase === 0 && !source.paused) enableMixer();
      else play({ fresh: true });
      show();
    },
    startCard() {
      phase = 1;
      play({ fresh: true });
      show();
    },
    cue
  };
}
