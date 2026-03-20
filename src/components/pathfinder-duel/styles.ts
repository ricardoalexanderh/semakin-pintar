// ===== Pathfinder Duel — Styles =====
// Exploration/map theme with navy, emerald, and gold.

import type { CSSProperties } from 'react';

export const C = {
  bg: '#0a1628',
  surface: '#101e36',
  card: '#162644',
  border: 'rgba(255,255,255,0.08)',
  accent: '#22c55e',
  accent2: '#f59e0b',
  accent3: '#06b6d4',
  accent4: '#8b5cf6',
  green: '#22c55e',
  yellow: '#fbbf24',
  white: '#f0f4f8',
  muted: '#64748b',
  danger: '#ef4444',
} as const;

export const screenBase: CSSProperties = {
  minHeight: '100dvh',
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
  background: `linear-gradient(135deg, ${C.accent}, ${C.accent3})`,
  border: 'none',
  borderRadius: 16,
  color: 'white',
  fontFamily: "'Bebas Neue', sans-serif",
  fontSize: '1.6rem',
  letterSpacing: 3,
  cursor: 'pointer',
  boxShadow: `0 8px 32px rgba(34,197,94,0.35)`,
  marginTop: 8,
};

export const playerChip = (isActive: boolean, color: string): CSSProperties => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 2,
  padding: '6px 10px',
  borderRadius: 14,
  background: isActive ? `${color}22` : C.card,
  border: `1.5px solid ${isActive ? color : C.border}`,
  fontSize: 'clamp(0.65rem, 2vw, 0.8rem)',
  fontWeight: 800,
  boxShadow: isActive ? `0 0 20px ${color}44` : 'none',
  transform: isActive ? 'scale(1.05)' : 'scale(1)',
  transition: 'all 0.3s',
  maxWidth: 'clamp(120px, 35vw, 180px)',
  overflow: 'hidden',
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

// Grid cell styles
export const gridCell = (
  isOnPath: boolean,
  isStart: boolean,
  isEnd: boolean,
  isBlocked: boolean,
  pathColor: string,
  multiplier?: 2 | 3,
): CSSProperties => {
  if (isBlocked) {
    return {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 8,
      background: '#1a1a2e',
      border: `1.5px solid ${C.border}`,
      color: C.muted,
      fontWeight: 800,
      fontSize: 'clamp(0.7rem, 3vw, 1rem)',
      cursor: 'not-allowed',
      opacity: 0.5,
      position: 'relative' as const,
      aspectRatio: '1',
      touchAction: 'manipulation' as const,
      WebkitTapHighlightColor: 'transparent',
      userSelect: 'none' as const,
    };
  }

  const baseBg = isOnPath
    ? `${pathColor}33`
    : isStart
    ? `${C.accent}15`
    : isEnd
    ? `${C.accent2}15`
    : C.surface;

  const borderColor = isOnPath
    ? pathColor
    : isStart
    ? C.accent
    : isEnd
    ? C.accent2
    : C.border;

  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    background: baseBg,
    border: `1.5px solid ${borderColor}`,
    color: multiplier ? C.accent4 : C.white,
    fontWeight: 800,
    fontSize: 'clamp(0.7rem, 3vw, 1rem)',
    cursor: 'pointer',
    position: 'relative' as const,
    aspectRatio: '1',
    boxShadow: isOnPath ? `0 0 12px ${pathColor}44` : 'none',
    transition: 'all 0.15s',
    touchAction: 'manipulation' as const,
    WebkitTapHighlightColor: 'transparent',
    userSelect: 'none' as const,
  };
};

// Timer bar
export const timerBar = (_fraction?: number, _danger?: boolean): CSSProperties => ({
  height: 6,
  borderRadius: 3,
  background: C.surface,
  width: '100%',
  maxWidth: 440,
  overflow: 'hidden',
  position: 'relative' as const,
});

export const timerFill = (fraction: number, danger: boolean): CSSProperties => ({
  height: '100%',
  width: `${fraction * 100}%`,
  background: danger
    ? `linear-gradient(90deg, ${C.danger}, ${C.accent2})`
    : `linear-gradient(90deg, ${C.accent}, ${C.accent3})`,
  borderRadius: 3,
  transition: 'width 0.3s linear',
});

// Keyframe animations
export const KEYFRAMES = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Nunito:wght@400;600;700;800;900&family=Space+Mono:wght@400;700&display=swap');

@keyframes pd-pop-in {
  from { transform: scale(0.88); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
@keyframes pd-cell-pop {
  0% { transform: scale(1); }
  50% { transform: scale(1.15); }
  100% { transform: scale(1); }
}
@keyframes pd-path-glow {
  0%, 100% { box-shadow: 0 0 8px rgba(34,197,94,0.3); }
  50% { box-shadow: 0 0 20px rgba(34,197,94,0.6); }
}
@keyframes pd-reveal-sweep {
  from { clip-path: inset(0 100% 0 0); }
  to { clip-path: inset(0 0 0 0); }
}
@keyframes pd-score-pop {
  from { transform: scale(0); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
@keyframes pd-slide-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes pd-pulse-text {
  from { opacity: 1; transform: scale(1); }
  to { opacity: 0.6; transform: scale(1.05); }
}
@keyframes pd-trophy-bounce {
  0%, 100% { transform: translateY(0) rotate(-5deg); }
  50% { transform: translateY(-10px) rotate(5deg); }
}
@keyframes pd-optimal-dash {
  to { stroke-dashoffset: -20; }
}
@keyframes pd-countdown-pop {
  from { transform: scale(0.5); opacity: 0; }
  50% { transform: scale(1.2); opacity: 1; }
  to { transform: scale(1); opacity: 1; }
}
`;
