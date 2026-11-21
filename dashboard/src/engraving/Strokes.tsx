import type { CSSProperties } from 'react';
import type { HatchStroke } from './geometry';

interface StrokesProps {
  strokes: HatchStroke[];
  color: string;
  opacity?: number;
  /** ms before the first stroke starts. */
  start: number;
  /** ms over which the whole layer is swept, first stroke to last. */
  sweep: number;
  /** ms each individual stroke takes to grow. */
  duration?: number;
}

/** Renders a hatch layer whose strokes are cut one after another. */
export function Strokes({ strokes, color, opacity = 1, start, sweep, duration = 170 }: StrokesProps) {
  const n = Math.max(1, strokes.length - 1);
  return (
    <g fill={color} opacity={opacity}>
      {strokes.map((s) => {
        const style: CSSProperties = {
          animationDelay: `${Math.round(start + (s.index / n) * sweep)}ms`,
          animationDuration: `${duration}ms`,
        };
        return (
          <g key={s.index} transform={`translate(${s.x} ${s.y}) rotate(${s.angle})`}>
            <path className="eg-stroke" d={s.d} style={style} />
          </g>
        );
      })}
    </g>
  );
}
