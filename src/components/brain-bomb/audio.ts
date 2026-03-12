// ===== Brain Bomb — Audio Engine (Web Audio API) =====

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  return audioCtx;
}

export function initAudioContext() {
  getCtx();
}

export type SoundType =
  | 'tick' | 'tickFast' | 'tickDanger'
  | 'correct' | 'wrong' | 'explosion' | 'pass'
  | 'powerup' | 'uiClick' | 'uiOn' | 'uiOff' | 'win';

export function playSound(type: SoundType, enabled: boolean) {
  if (!enabled) return;
  const ctx = getCtx();
  if (ctx.state === 'suspended') ctx.resume();

  const handlers: Record<SoundType, () => void> = {
    tick: () => {
      const now = ctx.currentTime;
      const thud = ctx.createOscillator();
      const thudG = ctx.createGain();
      thud.connect(thudG); thudG.connect(ctx.destination);
      thud.type = 'sine';
      thud.frequency.setValueAtTime(140, now);
      thud.frequency.exponentialRampToValueAtTime(55, now + 0.08);
      thudG.gain.setValueAtTime(0.55, now);
      thudG.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      thud.start(now); thud.stop(now + 0.15);

      const click = ctx.createOscillator();
      const clickG = ctx.createGain();
      const clickF = ctx.createBiquadFilter();
      click.connect(clickF); clickF.connect(clickG); clickG.connect(ctx.destination);
      click.type = 'square';
      clickF.type = 'bandpass'; clickF.frequency.value = 3200; clickF.Q.value = 1.2;
      click.frequency.value = 3800;
      clickG.gain.setValueAtTime(0.22, now);
      clickG.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
      click.start(now); click.stop(now + 0.04);
    },

    tickFast: () => {
      const now = ctx.currentTime;
      function pulse(t: number, freq: number, vol: number) {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        const dist = ctx.createWaveShaper();
        const c = new Float32Array(256);
        for (let i = 0; i < 256; i++) {
          const x = (i * 2) / 256 - 1;
          c[i] = (Math.PI + 200) * x / (Math.PI + 200 * Math.abs(x));
        }
        dist.curve = c;
        o.connect(dist); dist.connect(g); g.connect(ctx.destination);
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(freq, t);
        o.frequency.exponentialRampToValueAtTime(freq * 0.35, t + 0.09);
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.11);
        o.start(t); o.stop(t + 0.13);
      }
      pulse(now, 100, 0.75);
      pulse(now + 0.14, 75, 0.5);
      const w = ctx.createOscillator();
      const wG = ctx.createGain();
      w.connect(wG); wG.connect(ctx.destination);
      w.type = 'sine'; w.frequency.setValueAtTime(2400, now);
      w.frequency.linearRampToValueAtTime(1800, now + 0.28);
      wG.gain.setValueAtTime(0.07, now);
      wG.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      w.start(now); w.stop(now + 0.28);
    },

    tickDanger: () => {
      const now = ctx.currentTime;
      for (let i = 0; i < 3; i++) {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = 'square';
        o.frequency.setValueAtTime(1900 + i * 60, now + i * 0.065);
        o.frequency.linearRampToValueAtTime(1500, now + i * 0.065 + 0.055);
        g.gain.setValueAtTime(0.2, now + i * 0.065);
        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.065 + 0.06);
        o.start(now + i * 0.065); o.stop(now + i * 0.065 + 0.07);
      }
      const sub = ctx.createOscillator();
      const subG = ctx.createGain();
      sub.connect(subG); subG.connect(ctx.destination);
      sub.type = 'sine'; sub.frequency.setValueAtTime(60, now);
      sub.frequency.exponentialRampToValueAtTime(28, now + 0.22);
      subG.gain.setValueAtTime(0.4, now);
      subG.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
      sub.start(now); sub.stop(now + 0.25);
    },

    correct: () => {
      [523, 659, 784].forEach((freq, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
        o.type = 'sine';
        g.gain.setValueAtTime(0, ctx.currentTime + i * 0.1);
        g.gain.linearRampToValueAtTime(0.15, ctx.currentTime + i * 0.1 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.2);
        o.start(ctx.currentTime + i * 0.1);
        o.stop(ctx.currentTime + i * 0.1 + 0.25);
      });
    },

    wrong: () => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(200, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.3);
      g.gain.setValueAtTime(0.2, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      o.start(); o.stop(ctx.currentTime + 0.3);
    },

    explosion: () => {
      const bufSize = (audioCtx?.sampleRate ?? 44100) * 0.8;
      const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
      const src = ctx.createBufferSource();
      const g = ctx.createGain();
      src.buffer = buf;
      src.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(0.8, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      src.start(); src.stop(ctx.currentTime + 0.8);
    },

    pass: () => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = 'sine';
      o.frequency.setValueAtTime(440, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
      g.gain.setValueAtTime(0.2, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      o.start(); o.stop(ctx.currentTime + 0.2);
    },

    powerup: () => {
      [400, 600, 800, 1000].forEach((f, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.frequency.value = f;
        o.type = 'sine';
        g.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.07);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.07 + 0.1);
        o.start(ctx.currentTime + i * 0.07);
        o.stop(ctx.currentTime + i * 0.07 + 0.12);
      });
    },

    uiClick: () => {
      const now = ctx.currentTime;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = 'sine';
      o.frequency.setValueAtTime(600, now);
      o.frequency.exponentialRampToValueAtTime(480, now + 0.06);
      g.gain.setValueAtTime(0.07, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      o.start(now); o.stop(now + 0.09);
    },

    uiOn: () => {
      const now = ctx.currentTime;
      [440, 660].forEach((f, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = 'sine'; o.frequency.value = f;
        g.gain.setValueAtTime(0.06, now + i * 0.05);
        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.08);
        o.start(now + i * 0.05); o.stop(now + i * 0.05 + 0.09);
      });
    },

    uiOff: () => {
      const now = ctx.currentTime;
      [440, 300].forEach((f, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = 'sine'; o.frequency.value = f;
        g.gain.setValueAtTime(0.06, now + i * 0.04);
        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.07);
        o.start(now + i * 0.04); o.stop(now + i * 0.04 + 0.08);
      });
    },

    win: () => {
      [523, 659, 784, 1047].forEach((f, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.frequency.value = f;
        o.type = 'triangle';
        g.gain.setValueAtTime(0, ctx.currentTime + i * 0.15);
        g.gain.linearRampToValueAtTime(0.2, ctx.currentTime + i * 0.15 + 0.05);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.4);
        o.start(ctx.currentTime + i * 0.15);
        o.stop(ctx.currentTime + i * 0.15 + 0.5);
      });
    },
  };

  handlers[type]?.();
}
