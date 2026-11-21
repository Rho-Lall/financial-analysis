import { useMemo } from 'react';
import { handPolyline, seededRandom, wobblyCircle, wobblyLine } from './geometry';
import { palette, tones, type ToneName } from './palette';
import { timing } from './timing';
import { WobblyPanel } from './WobblyPanel';

interface EngravedScoreCardProps {
  label: string;
  value: string;
  period?: string;
  /** Warm foreground shade: violet (brand accent, headline), greyDeep (cost-type), or any tone. */
  tone?: ToneName;
  /** Optional recent history, oldest first, drawn as a tiny hand sparkline. */
  trend?: number[];
  /** Optional change note, e.g. "+1.2 pts vs Q3". */
  delta?: string;
  seed?: number;
  /** ms before this card starts drawing. */
  drawDelay?: number;
}

const SPARK_W = 96;
const SPARK_H = 30;

export function EngravedScoreCard({
  label,
  value,
  period,
  tone = 'violet',
  trend,
  delta,
  seed = 1,
  drawDelay = 0,
}: EngravedScoreCardProps) {
  const accent = tones[tone].accent;
  const lineInk = tones[tone].layers[tones[tone].layers.length - 1].color;

  const geom = useMemo(() => {
    const rand = seededRandom(seed * 31 + 5);
    const underline = wobblyLine({ x: 1, y: 4 }, { x: 118, y: 3 }, rand, 1.2);
    if (!trend || trend.length < 2) return { underline, spark: null, dot: null };
    const min = Math.min(...trend);
    const max = Math.max(...trend);
    const span = max - min || 1;
    const pts = trend.map((v, i) => ({
      x: 4 + (i / (trend.length - 1)) * (SPARK_W - 8),
      y: SPARK_H - 5 - ((v - min) / span) * (SPARK_H - 10),
    }));
    const last = pts[pts.length - 1];
    return { underline, spark: handPolyline(pts, rand, 0.6), dot: wobblyCircle(last.x, last.y, 2.6, rand) };
  }, [seed, trend]);

  return (
    <WobblyPanel seed={seed} padding="18px 22px 16px" drawDelay={drawDelay} castShadow={6} style={{ height: '100%' }}>
      <div className="eg-card">
        <div className="eg-card-main">
          <div className="eg-card-value eg-fade" style={timing(drawDelay + 250, 450)}>
            {value}
          </div>
          <svg width={120} height={8} className="eg-card-underline" aria-hidden>
            <path
              d={geom.underline}
              fill="none"
              stroke={accent}
              strokeWidth={2.2}
              strokeLinecap="round"
              opacity={0.75}
              pathLength={1}
              className="eg-ink"
              style={timing(drawDelay + 500, 420)}
            />
          </svg>
          <div className="eg-card-label eg-fade" style={timing(drawDelay + 350, 400)}>
            {label}
          </div>
        </div>
        <div className="eg-card-side">
          {period && (
            <div className="eg-card-period eg-fade" style={{ ...timing(drawDelay + 350, 400), color: palette.tealInk }}>
              {period}
            </div>
          )}
          {geom.spark && (
            <svg width={SPARK_W} height={SPARK_H} aria-hidden>
              <path
                d={geom.spark}
                fill="none"
                stroke={lineInk}
                strokeWidth={1.4}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.85}
                pathLength={1}
                className="eg-ink"
                style={timing(drawDelay + 600, 700)}
              />
              {geom.dot && (
                <path
                  d={geom.dot}
                  fill={palette.paper}
                  stroke={palette.ink}
                  strokeWidth={1}
                  className="eg-fade"
                  style={timing(drawDelay + 1250, 250)}
                />
              )}
            </svg>
          )}
          {delta && (
            <div className="eg-card-delta eg-fade" style={timing(drawDelay + 900, 400)}>
              {delta}
            </div>
          )}
        </div>
      </div>
    </WobblyPanel>
  );
}
