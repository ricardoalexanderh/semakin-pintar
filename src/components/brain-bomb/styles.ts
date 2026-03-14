// ===== Brain Bomb — CSS-in-JS Styles =====
// Using the game's dark theme color palette as inline styles
// matching the existing codebase pattern (see sort-attack, math-flip)

import type { CSSProperties } from 'react';

// Color palette from the prototype
export const C = {
  bg: '#0d0d0f',
  surface: '#16161a',
  card: '#1e1e24',
  border: 'rgba(255,255,255,0.07)',
  accent: '#ff3d3d',
  accent2: '#ff9500',
  accent3: '#00e5ff',
  accent4: '#a259ff',
  green: '#00e676',
  yellow: '#ffea00',
  white: '#f0f0f5',
  muted: '#6b6b80',
  danger: '#ff1744',
} as const;

// Category color map
export const CAT_COLORS: Record<string, string> = {
  math: C.accent2,
  logic: C.accent4,
  ct: C.accent3,
  word: C.green,
  memory: C.yellow,
};

export const NOISE_BG: CSSProperties = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
  position: 'fixed' as const,
  inset: 0,
  pointerEvents: 'none' as const,
  zIndex: 1000,
  opacity: 0.4,
};

// Shared styles
export const screenBase: CSSProperties = {
  minHeight: '100vh',
  background: C.bg,
  fontFamily: "'Nunito', sans-serif",
  color: C.white,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  position: 'relative',
  overflowX: 'hidden',
  width: '100%',
  boxSizing: 'border-box',
};

export const lobbyCard: CSSProperties = {
  background: C.card,
  border: `1px solid ${C.border}`,
  borderRadius: 20,
  padding: 28,
  width: '100%',
  maxWidth: 440,
  marginBottom: 16,
};

export const cardTitle: CSSProperties = {
  fontSize: '0.65rem',
  fontFamily: "'Space Mono', monospace",
  letterSpacing: 3,
  color: C.muted,
  textTransform: 'uppercase' as const,
  marginBottom: 16,
};

export const startBtn: CSSProperties = {
  width: '100%',
  maxWidth: 440,
  padding: 18,
  background: `linear-gradient(135deg, ${C.accent}, ${C.accent2})`,
  border: 'none',
  borderRadius: 16,
  color: 'white',
  fontFamily: "'Bebas Neue', sans-serif",
  fontSize: '1.6rem',
  letterSpacing: 3,
  cursor: 'pointer',
  boxShadow: `0 8px 32px rgba(255,61,61,0.4)`,
  marginTop: 8,
};

export const answerBtn: CSSProperties = {
  padding: '14px 10px',
  background: C.surface,
  border: `1.5px solid ${C.border}`,
  borderRadius: 14,
  color: C.white,
  fontFamily: "'Nunito', sans-serif",
  fontSize: '0.95rem',
  fontWeight: 800,
  cursor: 'pointer',
  textAlign: 'center' as const,
  transition: 'all 0.15s',
};

export const playerChip = (isActive: boolean, isEliminated: boolean, color: string): CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '4px 8px',
  borderRadius: 99,
  background: isActive ? `rgba(255,61,61,0.15)` : C.card,
  border: `1.5px solid ${isActive ? color : C.border}`,
  fontSize: 'clamp(0.65rem, 2vw, 0.8rem)',
  fontWeight: 800,
  opacity: isEliminated ? 0.3 : 1,
  textDecoration: isEliminated ? 'line-through' : 'none',
  boxShadow: isActive ? `0 0 20px ${color}44` : 'none',
  transform: isActive ? 'scale(1.05)' : 'scale(1)',
  transition: 'all 0.3s',
});

export const overlayBase: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 500,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'column',
  gap: 12,
  backdropFilter: 'blur(4px)',
};

export const toggleSwitch = (on: boolean): CSSProperties => ({
  width: 44,
  height: 24,
  background: on ? C.accent : C.surface,
  borderRadius: 99,
  position: 'relative' as const,
  cursor: 'pointer',
  border: `1.5px solid ${on ? C.accent : C.border}`,
  transition: 'all 0.2s',
  flexShrink: 0,
});

export const toggleKnob = (on: boolean): CSSProperties => ({
  width: 16,
  height: 16,
  background: 'white',
  borderRadius: '50%',
  position: 'absolute' as const,
  top: 2,
  left: on ? 24 : 2,
  transition: 'left 0.2s',
});

export const diffBadge = (active: boolean, diff: 'easy' | 'medium' | 'hard'): CSSProperties => {
  const colors = { easy: C.green, medium: C.yellow, hard: C.danger };
  const color = colors[diff];
  return {
    padding: '5px 14px',
    borderRadius: 99,
    fontSize: '0.7rem',
    fontWeight: 800,
    letterSpacing: 0.5,
    cursor: 'pointer',
    border: `1.5px solid ${active ? color : C.border}`,
    color: active ? color : C.muted,
    background: active ? `${color}1a` : C.surface,
    transition: 'all 0.15s',
  };
};

export const modeBtn = (active: boolean): CSSProperties => ({
  padding: 12,
  background: active ? 'rgba(255,61,61,0.1)' : C.surface,
  border: `1.5px solid ${active ? C.accent : C.border}`,
  borderRadius: 12,
  cursor: 'pointer',
  textAlign: 'center' as const,
  color: active ? C.white : C.muted,
  transition: 'all 0.2s',
});

export const powerupBtn = (disabled: boolean): CSSProperties => ({
  padding: '6px 10px',
  background: C.card,
  border: `1px solid ${C.border}`,
  borderRadius: 10,
  cursor: disabled ? 'not-allowed' : 'pointer',
  fontSize: 'clamp(0.65rem, 2vw, 0.75rem)',
  fontWeight: 800,
  color: disabled ? C.muted : C.white,
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  opacity: disabled ? 0.3 : 1,
  transition: 'all 0.2s',
  fontFamily: "'Nunito', sans-serif",
});

// Keyframe animations as CSS strings
export const KEYFRAMES = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Nunito:wght@400;600;700;800;900&family=Space+Mono:wght@400;700&display=swap');

@keyframes bb-pulse-bomb {
  0%, 100% { transform: scale(1) rotate(-5deg); filter: drop-shadow(0 0 10px rgba(255,61,61,0.4)); }
  50% { transform: scale(1.1) rotate(5deg); filter: drop-shadow(0 0 30px rgba(255,61,61,0.8)); }
}
@keyframes bb-bomb-tick {
  0%, 100% { transform: rotate(-3deg) scale(1); }
  50% { transform: rotate(3deg) scale(1.05); }
}
@keyframes bb-bomb-panic {
  0%, 100% { transform: rotate(-8deg) scale(1.1); }
  50% { transform: rotate(8deg) scale(0.95); }
}
@keyframes bb-correct-pop {
  0% { transform: scale(1); }
  50% { transform: scale(1.08); }
  100% { transform: scale(1); }
}
@keyframes bb-wrong-shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-6px); }
  75% { transform: translateX(6px); }
}
@keyframes bb-explosion-flash {
  0% { background: rgba(255,23,68,0.8); }
  100% { background: rgba(255,23,68,0.15); }
}
@keyframes bb-explosion-pop {
  from { transform: scale(0); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
@keyframes bb-chain-pop {
  from { transform: scale(0.6); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
@keyframes bb-trophy-bounce {
  0%, 100% { transform: translateY(0) rotate(-5deg); }
  50% { transform: translateY(-10px) rotate(5deg); }
}
@keyframes bb-pop-in {
  from { transform: scale(0.88); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
@keyframes bb-slide-in {
  from { opacity: 0; transform: translateX(-10px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes bb-pulse-text {
  from { opacity: 1; transform: scale(1); }
  to { opacity: 0.6; transform: scale(1.05); }
}
@keyframes bb-toast-show {
  from { transform: translateX(-50%) translateY(-100px); }
  to { transform: translateX(-50%) translateY(0); }
}
@keyframes bb-blur-reveal {
  0% { filter: blur(12px); }
  100% { filter: blur(0px); }
}
`;
