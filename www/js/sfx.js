(function (Q) {
  'use strict';
  // Tiny chiptune synth (WebAudio). No audio files, works offline.
  let ctx = null, master = null;
  function ac() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = 0.14; master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function tone(freq, start, dur, type, vol, slideTo) {
    const c = ac(); if (!c) return;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type || 'square';
    const t0 = c.currentTime + start;
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.6, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(master);
    o.start(t0); o.stop(t0 + dur + 0.02);
  }
  function noise(start, dur, vol) {
    const c = ac(); if (!c) return;
    const len = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = c.createBufferSource(), g = c.createGain();
    s.buffer = buf; g.gain.value = vol || 0.4;
    s.connect(g); g.connect(master); s.start(c.currentTime + start);
  }
  const seq = (notes, step, type, vol) => notes.forEach((f, i) => f && tone(f, i * step, step * 1.4, type, vol));

  const S = {
    tap: () => tone(1200, 0, 0.035, 'sine', 0.18),
    tick: () => { tone(880, 0, 0.09, 'sine', 0.45); tone(1320, 0.05, 0.16, 'sine', 0.35); },
    hit: () => { noise(0, 0.08, 0.25); tone(180, 0, 0.16, 'sine', 0.55, 70); },
    combo: n => { tone(660 + n * 40, 0, 0.08, 'triangle', 0.3); tone(990 + n * 40, 0.06, 0.12, 'triangle', 0.3); },
    undo: () => tone(520, 0, 0.12, 'sine', 0.3, 300),
    coin: () => { tone(1046, 0, 0.08, 'sine', 0.4); tone(1568, 0.07, 0.22, 'sine', 0.35); },
    defeat: () => { tone(110, 0, 0.5, 'sine', 0.6, 55); seq([392, 523, 659, 784, 1046], 0.09, 'triangle', 0.35); },
    level: () => { tone(98, 0, 0.9, 'sine', 0.5); seq([523, 659, 784, 1046, 1318, 1568], 0.085, 'triangle', 0.35); },
    chest: () => { noise(0, 0.12, 0.15); seq([784, 988, 1175, 1568, 1976], 0.06, 'sine', 0.35); },
    ach: () => seq([659, 880, 1175], 0.09, 'sine', 0.4),
    error: () => tone(200, 0, 0.16, 'sine', 0.35, 140),
    pledge: () => { tone(65, 0, 1.4, 'sine', 0.55); seq([262, 392, 523, 659, 784], 0.12, 'triangle', 0.35); },
    breathe: up => tone(up ? 330 : 247, 0, 0.5, 'sine', 0.35, up ? 440 : 196),
    shield: () => seq([440, 554, 659, 880], 0.06, 'triangle', 0.45)
  };

  Q.sfx = (name, arg) => {
    try {
      if (!Q.S || !Q.S.settings || Q.S.settings.sound === false) return;
      if (S[name]) S[name](arg);
    } catch (e) { /* audio is best-effort */ }
  };
  Q.buzz = p => {
    try {
      if (Q.S && Q.S.settings && Q.S.settings.haptics === false) return;
      const H = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Haptics;
      if (H && typeof p === 'number') { H.impact({ style: p > 30 ? 'HEAVY' : p > 15 ? 'MEDIUM' : 'LIGHT' }); return; }
      if (navigator.vibrate && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) navigator.vibrate(p);
    } catch (e) { /* ignore */ }
  };
})(window.Q);
