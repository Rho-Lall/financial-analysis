import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { hatchRect, seededRandom, wobblyRectEdges, wobblyRectFill } from './geometry';
import { palette, shadow } from './palette';
import { timing } from './timing';

export interface PanelHatch {
  angle: number;
  gap: number;
  color: string;
  opacity: number;
  weight?: number;
}

interface WobblyPanelProps {
  children: ReactNode;
  seed?: number;
  padding?: CSSProperties['padding'];
  /** Fill inside the hand-drawn border, or 'none'. */
  surface?: string;
  /** Optional wash color layered over the surface. */
  wash?: { color: string; opacity: number };
  /** Optional sparse hatching inside the box. */
  hatch?: PanelHatch;
  strokeWidth?: number;
  strokeOpacity?: number;
  /** Border wobble in px. */
  amp?: number;
  overshoot?: number;
  /** If set, the border inks itself in starting at this many ms. */
  drawDelay?: number;
  /** Teal hatched cast shadow offset down-right, in px (0 = none). */
  castShadow?: number;
  className?: string;
  style?: CSSProperties;
}

/** A box with a hand-drawn border that tracks its own size. */
export function WobblyPanel({
  children,
  seed = 1,
  padding = 20,
  surface = '#ffffff',
  wash,
  hatch,
  strokeWidth = 1.5,
  strokeOpacity = 0.7,
  amp = 1.6,
  overshoot = 4,
  drawDelay,
  castShadow = 0,
  className,
  style,
}: WobblyPanelProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.offsetWidth, h: el.offsetHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const hatchKey = hatch ? `${hatch.angle}|${hatch.gap}|${hatch.weight ?? 0.7}` : '';
  const geom = useMemo(() => {
    if (!size.w) return null;
    const rand = seededRandom(seed);
    const [x, y, w, h] = [3, 3, size.w - 6, size.h - 6];
    const [angle, gap, weight] = hatchKey ? hatchKey.split('|').map(Number) : [0, 0, 0];
    const cs = castShadow;
    return {
      shadowFill: cs ? wobblyRectFill(x + cs, y + cs, w, h, rand, Math.min(1.2, amp)) : '',
      shadowHatch: cs
        ? hatchRect(x + w, y + cs + 2, cs, h - 2, { angle: 45, gap: 3, weight: 0.6, rand, endJitter: 0.6 }).concat(
            hatchRect(x + cs + 2, y + h, w - 2, cs, { angle: 45, gap: 3, weight: 0.6, rand, endJitter: 0.6 }),
          )
        : [],
      fill: wobblyRectFill(x, y, w, h, rand, Math.min(1.2, amp)),
      edges: wobblyRectEdges(x, y, w, h, rand, { amp, overshoot }),
      hatch: hatchKey ? hatchRect(x + 2, y + 2, w - 4, h - 4, { angle, gap, weight, rand, endJitter: 1 }) : [],
    };
  }, [size, seed, amp, overshoot, hatchKey, castShadow]);

  return (
    <div ref={ref} className={className} style={{ position: 'relative', padding, ...style }}>
      {geom && (
        <svg
          width={size.w}
          height={size.h}
          style={{ position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none' }}
          aria-hidden
        >
          {geom.shadowFill && (
            <g className={drawDelay !== undefined ? 'eg-fade' : undefined} style={drawDelay !== undefined ? timing(drawDelay + 450, 500) : undefined}>
              <path d={geom.shadowFill} fill={shadow.wash} opacity={shadow.washOpacity} />
              <g fill={shadow.ink} opacity={shadow.inkOpacity * 0.8}>
                {geom.shadowHatch.map((s, i) => (
                  <path key={i} d={s.d} transform={`translate(${s.x} ${s.y}) rotate(${s.angle})`} />
                ))}
              </g>
            </g>
          )}
          {surface !== 'none' && <path d={geom.fill} fill={surface} />}
          {wash && <path d={geom.fill} fill={wash.color} opacity={wash.opacity} />}
          {hatch && (
            <g fill={hatch.color} opacity={hatch.opacity}>
              {geom.hatch.map((s) => (
                <path key={s.index} d={s.d} transform={`translate(${s.x} ${s.y}) rotate(${s.angle})`} />
              ))}
            </g>
          )}
          {geom.edges.map((d, i) => (
            <path
              key={i}
              d={d}
              fill="none"
              stroke={palette.inkSoft}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              opacity={strokeOpacity}
              pathLength={drawDelay !== undefined ? 1 : undefined}
              className={drawDelay !== undefined ? 'eg-ink' : undefined}
              style={drawDelay !== undefined ? timing(drawDelay + i * 120, 260) : undefined}
            />
          ))}
        </svg>
      )}
      <div style={{ position: 'relative' }}>{children}</div>
    </div>
  );
}
