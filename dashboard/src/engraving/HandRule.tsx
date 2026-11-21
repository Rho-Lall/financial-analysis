import { useMemo } from 'react';
import { seededRandom, wobblyLine } from './geometry';
import { palette } from './palette';
import { timing } from './timing';

/** Full-width hand-drawn divider line. */
export function HandRule({ seed = 1, opacity = 0.4, drawDelay }: { seed?: number; opacity?: number; drawDelay?: number }) {
  const d = useMemo(() => wobblyLine({ x: 2, y: 3 }, { x: 998, y: 3 }, seededRandom(seed), 1.4), [seed]);
  return (
    <svg viewBox="0 0 1000 6" preserveAspectRatio="none" width="100%" height={6} style={{ display: 'block' }} aria-hidden>
      <path
        d={d}
        fill="none"
        stroke={palette.inkSoft}
        strokeWidth={1.2}
        strokeLinecap="round"
        opacity={opacity}
        pathLength={drawDelay !== undefined ? 1 : undefined}
        className={drawDelay !== undefined ? 'eg-ink' : undefined}
        style={drawDelay !== undefined ? timing(drawDelay, 700) : undefined}
      />
    </svg>
  );
}
