// Original Vaikuntha score on one persistent element. Effects share a quiet hall return.
export function weddingAudio({source}) {
  let ctx, music, effects, hall, unlocked = false;
  const tones = {bell:440,door:150,sanctum:245,darshan:349,cord:523,tick:310,swipe:180,tap:660,finale:784,room:140};
  function setup() {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio || ctx) return;
    ctx = new Audio();
    const master = ctx.createGain();
    master.gain.value = .8;
    master.connect(ctx.destination);
    effects = ctx.createGain();
    effects.gain.value = .24;
    effects.connect(master);
    hall = ctx.createConvolver();
    const impulse = ctx.createBuffer(2, Math.floor(ctx.sampleRate * .74), ctx.sampleRate);
    for (let c=0;c<2;c++) {
      const data = impulse.getChannelData(c);
      for (let i=0;i<data.length;i++) data[i]=(Math.random()*2-1)*Math.pow(1-i/data.length,3);
    }
    hall.buffer=impulse;
    const wet=ctx.createGain(); wet.gain.value=.12;
    effects.connect(hall).connect(wet).connect(master);
    ctx.resume().then(() => {
      if (ctx.state !== 'running' || music) return;
      const input=ctx.createMediaElementSource(source);
      music=ctx.createGain(); music.gain.value=.9;
      input.connect(music).connect(master);
    }).catch(()=>{});
  }
  function resume() {
    if (!unlocked || document.hidden) return;
    ctx?.resume().catch(()=>{});
    if (source.paused) source.play().catch(()=>{});
  }
  function cue(kind) {
    if (!ctx || ctx.state !== 'running' || document.hidden || !tones[kind]) return;
    const now=ctx.currentTime, wide=kind==='room'||kind==='door';
    const length=kind==='room'?1.85:wide?.44:kind==='tap'||kind==='tick'?.09:.55;
    const osc=ctx.createOscillator(), env=ctx.createGain();
    osc.type=wide||kind==='swipe'?'triangle':'sine';
    osc.frequency.setValueAtTime(tones[kind],now);
    osc.frequency.exponentialRampToValueAtTime(tones[kind]*(wide?.42:1.003),now+length);
    env.gain.setValueAtTime(.0001,now);env.gain.exponentialRampToValueAtTime(.049,now+.018);
    env.gain.exponentialRampToValueAtTime(.0001,now+length);
    const pan=ctx.createStereoPanner?.();
    osc.connect(env);
    if (pan) {
      pan.pan.setValueAtTime(wide?-.72:kind==='cord'?-.18:.16,now);
      if (wide) pan.pan.linearRampToValueAtTime(.68,now+length*.63);
      pan.pan.linearRampToValueAtTime(0,now+length);
      env.connect(pan).connect(effects);
    } else env.connect(effects);
    if (music) {music.gain.cancelScheduledValues(now);music.gain.setTargetAtTime(.78,now,.025);music.gain.setTargetAtTime(.9,now+length*.55,.09);}
    osc.start(now);osc.stop(now+length);osc.onended=()=>{osc.disconnect();env.disconnect();pan?.disconnect();};
  }
  document.addEventListener('visibilitychange',()=>{if(document.hidden){source.pause();ctx?.suspend().catch(()=>{});}else resume();});
  addEventListener('pagehide',()=>source.pause());addEventListener('pageshow',resume);
  return {unlock(){unlocked=true;try{setup();}catch{}resume();},prepare(){resume();cue('bell');},startCard(){resume();},cue};
}
