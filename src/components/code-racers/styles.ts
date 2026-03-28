// ===== Code Racers — CSS-in-JS Styles =====

import type { CSSProperties } from 'react';

export const C = {
  bg: '#0d0d0f',
  surface: '#16161a',
  card: '#1e1e24',
  border: 'rgba(255,255,255,0.07)',
  accent: '#00e5ff',
  accent2: '#a259ff',
  accent3: '#ff9500',
  accent4: '#ff3d3d',
  green: '#00e676',
  yellow: '#ffea00',
  white: '#f0f0f5',
  muted: '#6b6b80',
  danger: '#ff1744',
} as const;

export const CELL_COLORS: Record<string, string> = {
  empty: 'transparent',
  wall: '#2a2a35',
  gem: '#ffea00',
  hiddenGem: 'transparent',
  portal: '#a259ff',
  conveyor: '#4a4a5a',
  oilSlick: '#3d2b00',
  bonusStar: '#ff9500',
  rechargePad: '#00e676',
};

export const NOISE_BG: CSSProperties = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
  position: 'fixed' as const,
  inset: 0,
  pointerEvents: 'none' as const,
  zIndex: 1000,
  opacity: 0.4,
};

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
  background: `linear-gradient(135deg, ${C.accent}, ${C.accent2})`,
  border: 'none',
  borderRadius: 16,
  color: 'white',
  fontFamily: "'Bebas Neue', sans-serif",
  fontSize: '1.6rem',
  letterSpacing: 3,
  cursor: 'pointer',
  boxShadow: `0 8px 32px rgba(0,229,255,0.3)`,
  marginTop: 8,
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

export const playerChip = (isActive: boolean, color: string): CSSProperties => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 2,
  padding: '6px 10px',
  borderRadius: 14,
  background: isActive ? `${color}1a` : C.card,
  border: `1.5px solid ${isActive ? color : C.border}`,
  fontSize: 'clamp(0.65rem, 2vw, 0.8rem)',
  fontWeight: 800,
  boxShadow: isActive ? `0 0 20px ${color}44` : 'none',
  transition: 'all 0.3s',
  maxWidth: 'clamp(100px, 30vw, 160px)',
  overflow: 'hidden',
});

export const blockStyle = (color: string, isDragging = false): CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '8px 12px',
  background: isDragging ? `${color}33` : `${color}1a`,
  border: `2px solid ${isDragging ? color : `${color}66`}`,
  borderRadius: 10,
  cursor: 'grab',
  fontSize: '0.75rem',
  fontWeight: 800,
  color: C.white,
  userSelect: 'none' as const,
  transition: 'all 0.15s',
  whiteSpace: 'nowrap' as const,
});

export const programSlot = (filled: boolean, isOver = false): CSSProperties => ({
  width: '100%',
  minHeight: 44,
  background: filled ? C.card : isOver ? 'rgba(0,229,255,0.1)' : C.surface,
  border: `2px dashed ${filled ? C.accent : isOver ? C.accent : C.border}`,
  borderRadius: 10,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.15s',
});

export const KEYFRAMES = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Nunito:wght@400;600;700;800;900&family=Space+Mono:wght@400;700&display=swap');

@keyframes cr-pop-in {
  from { transform: scale(0.88); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
@keyframes cr-slide-in {
  from { opacity: 0; transform: translateX(-10px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes cr-pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.15); opacity: 0.7; }
}
@keyframes cr-robot-move {
  0% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
  100% { transform: translateY(0); }
}
@keyframes cr-gem-collect {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.5); opacity: 0.8; }
  100% { transform: scale(0); opacity: 0; }
}
@keyframes cr-collision {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}
@keyframes cr-countdown-pulse {
  from { transform: scale(0.5); opacity: 0; }
  50% { transform: scale(1.2); opacity: 1; }
  to { transform: scale(1); opacity: 1; }
}
@keyframes cr-trophy-bounce {
  0%, 100% { transform: translateY(0) rotate(-5deg); }
  50% { transform: translateY(-10px) rotate(5deg); }
}
@keyframes cr-toast-show {
  from { transform: translateX(-50%) translateY(-100px); }
  to { transform: translateX(-50%) translateY(0); }
}
@keyframes cr-scan-ring {
  from { transform: scale(0.5); opacity: 0.8; border-width: 3px; }
  to { transform: scale(2); opacity: 0; border-width: 1px; }
}
`;
