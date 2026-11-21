import { useMemo } from 'react';
import { hatchRect, seededRandom, wobblyRectEdges } from './geometry';
import { tones, type ToneName } from './palette';

/** Small legend swatch drawn with the same hatching as the chart. */
export function HatchSwatch({ tone, seed = 3, size = 14 }: { tone: ToneName; seed?: number; size?: number }) {
  const t = tones[tone];
  const { layers, edges } = useMemo(() => {
    const rand = seededRandom(seed);
    return {
      layers: t.layers.map((l) => hatchRect(0, 0, size, size, { angle: l.angle, gap: l.gap, weight: l.weight, rand, endJitter: 0.5 })),
      edges: wobblyRectEdges(0, 0, size, size, rand, { amp: 0.5, overshoot: 1.2 }),
    };
  }, [t, seed, size]);

  return (
    <svg width={size + 4} height={size + 4} viewBox={`-2 -2 ${size + 4} ${size + 4}`} aria-hidden>
      {t.wash && <rect width={size} height={size} fill={t.wash.color} opacity={t.wash.opacity} />}
      {layers.map((strokes, li) => (
        <g key={li} fill={t.layers[li].color} opacity={t.layers[li].opacity}>
          {strokes.map((s) => (
            <path key={s.index} d={s.d} transform={`translate(${s.x} ${s.y}) rotate(${s.angle})`} />
          ))}
        </g>
      ))}
      {edges.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="#1A1A2E" strokeWidth={0.9} strokeLinecap="round" opacity={0.8} />
      ))}
    </svg>
  );
}
