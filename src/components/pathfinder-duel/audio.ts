// ===== Pathfinder Duel — Audio System =====
// Exploration-themed procedural sounds via Web Audio API.

let audioCtx: AudioContext | null = null;

export function initAudioContext() {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
}

export function resumeAudioContext() {
  if (audioCtx?.state === 'suspended') {
    audioCtx.resume();
  }
}

type SoundType =
  | 'cellTap'
  | 'pathStep'
  | 'pathComplete'
  | 'submit'
  | 'reveal'
  | 'optimalFound'
  | 'roundWin'
  | 'countdown'
  | 'uiClick'
  | 'uiOn'
  | 'uiOff'
  | 'gameOver'
  | 'undo'
  | 'blockerPlace'
  | 'timerTick'
  | 'timerDanger';

export function playSound(type: SoundType, enabled = true) {
  if (!enabled || !audioCtx) return;
  if (audioCtx.state === 'suspended') audioCtx.resume();

  const ctx = audioCtx;
  const t = ctx.currentTime;

  switch (type) {
    case 'cellTap': {
      // Soft woody tap — like placing a tile on a map
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, t);
      osc.frequency.exponentialRampToValueAtTime(400, t + 0.06);
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.08);
      break;
    }

    case 'pathStep': {
      // Soft footstep — gentle thud
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, t);
      osc.frequency.exponentialRampToValueAtTime(120, t + 0.05);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.07);
      break;
    }

    case 'pathComplete': {
      // Rising chime — path reaches destination
      [523, 659, 784, 1047].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, t + i * 0.08);
        gain.gain.linearRampToValueAtTime(0.12, t + i * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.2);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t + i * 0.08);
        osc.stop(t + i * 0.08 + 0.2);
      });
      break;
    }

    case 'submit': {
      // Lock-in swoosh — ascending sweep
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, t);
      osc.frequency.exponentialRampToValueAtTime(900, t + 0.15);
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.2);
      break;
    }

    case 'reveal': {
      // Map-unfolding dramatic sweep
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc1.type = 'sawtooth';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(150, t);
      osc1.frequency.exponentialRampToValueAtTime(600, t + 0.4);
      osc2.frequency.setValueAtTime(200, t);
      osc2.frequency.exponentialRampToValueAtTime(800, t + 0.4);
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.linearRampToValueAtTime(0.12, t + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + 0.5);
      osc2.stop(t + 0.5);
      break;
    }

    case 'optimalFound': {
      // Sparkle — descending arpeggiated tones
      [1200, 1000, 1400, 1100, 1600].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, t + i * 0.06);
        gain.gain.linearRampToValueAtTime(0.08, t + i * 0.06 + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.12);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t + i * 0.06);
        osc.stop(t + i * 0.06 + 0.12);
      });
      break;
    }

    case 'roundWin': {
      // Brief fanfare
      [392, 523, 659, 784].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, t + i * 0.1);
        gain.gain.linearRampToValueAtTime(0.15, t + i * 0.1 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 0.25);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t + i * 0.1);
        osc.stop(t + i * 0.1 + 0.25);
      });
      break;
    }

    case 'countdown': {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 330;
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.15);
      break;
    }

    case 'uiClick': {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, t);
      osc.frequency.exponentialRampToValueAtTime(480, t + 0.04);
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.05);
      break;
    }

    case 'uiOn': {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, t);
      osc.frequency.setValueAtTime(660, t + 0.05);
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.1);
      break;
    }

    case 'uiOff': {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, t);
      osc.frequency.setValueAtTime(300, t + 0.05);
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.1);
      break;
    }

    case 'gameOver': {
      // Victory fanfare — longer, more triumphant
      [392, 440, 523, 659, 784, 1047].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = i < 3 ? 'triangle' : 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, t + i * 0.12);
        gain.gain.linearRampToValueAtTime(0.12, t + i * 0.12 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.12 + 0.4);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t + i * 0.12);
        osc.stop(t + i * 0.12 + 0.4);
      });
      break;
    }

    case 'undo': {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(500, t);
      osc.frequency.exponentialRampToValueAtTime(300, t + 0.06);
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.08);
      break;
    }

    case 'blockerPlace': {
      // Heavy stone drop
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, t);
      osc.frequency.exponentialRampToValueAtTime(60, t + 0.12);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.15);
      break;
    }

    case 'timerTick': {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 440;
      gain.gain.setValueAtTime(0.06, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.05);
      break;
    }

    case 'timerDanger': {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = 660;
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.08);
      break;
    }
  }
}
