const preferenceKey = 'wedding-audio-v2';

/** A single transport keeps the Vaikuntha score and Ganesh bhajan from overlapping. */
export function weddingAudio({ source, control, hindi, isCardOpen }) {
  const score = new Audio(new URL('./vaikuntha-flute.mp3', import.meta.url));
  score.preload = 'none';
  const tracks = [score, source];
  const levels = [.78, 2.05];
  const positions = [0, 0];
  const buffers = [];
  const labels = hindi ? {
    play: ['वैकुंठ संगीत सुनें', 'गणेश भजन सुनें'],
    pause: 'ध्वनि बंद करें', waiting: 'संगीत लोड हो रहा है', retry: 'संगीत फिर चलाएँ'
  } : {
    play: ['Play Vaikuntha music', 'Play Ganesh bhajan'],
    pause: 'Mute sound', waiting: 'Loading sound', retry: 'Retry sound'
  };

  let preference;
  try { preference = sessionStorage.getItem(preferenceKey); } catch {}
  let context, bus;
  let active;
  let phase = Number(isCardOpen());
  let generation = 0;
  let loading = false;
  let failed = false;
  let permitted = preference === 'on';
  let lastCue = -1;

  function show() {
    const playing = Boolean(active && (!active.native || !active.native.paused));
    control.dataset.track = phase ? 'ganesh' : 'vaikuntha';
    control.dataset.status = playing ? 'playing' : loading ? 'loading' : failed ? 'retry' : 'paused';
    control.setAttribute('aria-pressed', String(playing));
    control.textContent = playing ? labels.pause : loading ? labels.waiting : failed ? labels.retry : labels.play[phase];
  }

  function remember(value) {
    preference = value;
    permitted = value === 'on';
    try { sessionStorage.setItem(preferenceKey, value); } catch {}
  }

  function load(index) {
    buffers[index] ??= fetch(tracks[index].src)
      .then(response => {
        if (!response.ok) throw new Error('Unable to load soundtrack');
        return response.arrayBuffer();
      })
      .then(bytes => context.decodeAudioData(bytes))
      .catch(error => { buffers[index] = undefined; throw error; });
    return buffers[index];
  }

  function end(fade = 0) {
    const old = active;
    active = undefined;
    if (!old) return Promise.resolve();
    if (old.native) {
      positions[old.phase] = old.native.currentTime || 0;
      // iOS can ignore programmatic media volume. Pause before changing tracks.
      old.native.pause();
      return Promise.resolve();
    }
    const now = context.currentTime;
    positions[old.phase] = (positions[old.phase] + now - old.start) % old.node.buffer.duration;
    old.gain.gain.cancelScheduledValues(now);
    old.gain.gain.setTargetAtTime(0, now, Math.max(.008, fade / 5));
    old.node.stop(now + Math.max(.045, fade));
    old.node.onended = () => { old.node.disconnect(); old.gain.disconnect(); };
    return fade ? new Promise(resolve => setTimeout(resolve, fade * 1000 + 20)) : Promise.resolve();
  }

  function startNative(token, index) {
    const player = tracks[index];
    player.loop = true;
    player.volume = index ? 1 : .75;
    if (positions[index] > 0) {
      try { player.currentTime = positions[index]; } catch {}
    }
    return player.play().then(() => {
      if (token !== generation || preference === 'off' || document.hidden) {
        if (active?.native !== player) player.pause();
        return;
      }
      active = { native: player, phase: index };
      permitted = true;
    });
  }

  async function play({ gesture = false, fade = 0, fresh = false } = {}) {
    if (preference === 'off' || document.hidden) return;
    const token = ++generation;
    const index = phase;
    loading = true;
    failed = false;
    show();

    let unlocked;
    if (gesture) {
      try {
        const Audio = window.AudioContext || window.webkitAudioContext;
        if (Audio && !context) {
          context = new Audio();
          bus = context.createGain();
          bus.connect(context.destination);
        }
        if (context) unlocked = context.resume().catch(() => {});
      } catch {}
    }

    try {
      // Call native play directly from the sound button when there is no Web Audio route.
      if (!context && !active && gesture) {
        await startNative(token, index);
        return;
      }
      await end(fade);
      if (token !== generation || document.hidden || preference === 'off') return;
      if (fresh) positions[index] = 0;
      if (unlocked) await unlocked;
      if (context?.state === 'running') {
        if (index === 0) load(1).catch(() => {});
        let buffer;
        try { buffer = await load(index); } catch {}
        if (token !== generation || document.hidden || preference === 'off') return;
        if (buffer) {
          const node = context.createBufferSource();
          const gain = context.createGain();
          const start = context.currentTime;
          node.buffer = buffer;
          node.loop = true;
          gain.gain.setValueAtTime(.001, start);
          gain.gain.linearRampToValueAtTime(levels[index], start + .46);
          node.connect(gain).connect(bus);
          node.start(start, positions[index] % buffer.duration);
          active = { node, gain, start, phase: index };
          node.onended = () => {
            if (active?.node === node) { active = undefined; positions[index] = 0; show(); }
            node.disconnect();
            gain.disconnect();
          };
          permitted = true;
          return;
        }
      }
      await startNative(token, index);
    } catch {
      if (token === generation) failed = gesture;
    } finally {
      if (token === generation) { loading = false; show(); }
    }
  }

  function stop() {
    generation++;
    loading = failed = false;
    end(.08);
    for (const track of tracks) if (!track.paused) track.pause();
    show();
  }

  function cue(kind) {
    if (preference === 'off' || !active || document.hidden || context?.state !== 'running') return;
    const now = context.currentTime;
    if (now - lastCue < .48) return;
    lastCue = now;
    const tone = { door: 293.66, sanctum: 392, darshan: 349.23, cord: 523.25 }[kind];
    for (const [index, multiple] of [1, 1.99, 2.42].entries()) {
      const note = context.createOscillator();
      const shape = context.createGain();
      const length = kind === 'sanctum' ? .77 : .47;
      note.frequency.value = tone * multiple;
      shape.gain.setValueAtTime(.0001, now);
      shape.gain.exponentialRampToValueAtTime(.019 / (index + 1), now + .045);
      shape.gain.exponentialRampToValueAtTime(.0001, now + length);
      note.connect(shape).connect(bus);
      note.start(now);
      note.stop(now + length);
      note.onended = () => { note.disconnect(); shape.disconnect(); };
    }
  }

  function usePhase(index, fresh) {
    phase = index;
    if (fresh) positions[index] = 0;
    if (preference !== 'off') play({ fade: .28, fresh });
    else if (loading) stop();
    else show();
  }

  control.addEventListener('click', () => {
    if (active || (loading && permitted)) { remember('off'); stop(); }
    else { remember('on'); play({ gesture: true }); }
  });
  for (const player of tracks) {
    player.addEventListener('ended', () => {
      if (active?.native === player) { active = undefined; show(); }
    });
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else if (permitted) play();
  });
  document.addEventListener('click', event => {
    if (event.target.closest('#sound-toggle') || active || loading || preference === 'off') return;
    play({ gesture: true });
  });
  show();
  return {
    prepare() {
      if (active || permitted) usePhase(0, true);
      else if (preference !== 'off') { phase = 0; play({ fresh: true }); }
    },
    startCard() { usePhase(1, true); },
    cue
  };
}
