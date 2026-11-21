import { useEffect, useId, useMemo, useState } from 'react';
import * as d3 from 'd3';
import {
  bakeStrokes,
  handPolyline,
  hatchRect,
  seedFrom,
  seededRandom,
  stippleLine,
  wobblyCircle,
  wobblyLine,
  wobblyRectEdges,
  wobblyRectFill,
  type HatchStroke,
} from './geometry';
import { palette, shadow, tones, type ToneName } from './palette';
import { Strokes } from './Strokes';
import { timing } from './timing';
import './engraving.css';

export interface BarSeries {
  key: string;
  label: string;
  tone: ToneName;
}

export interface BarDatum {
  label: string;
  values: Record<string, number>;
}

interface EngravedBarChartProps {
  data: BarDatum[];
  /** Bottom-to-top stacking order. */
  series: BarSeries[];
  width?: number;
  height?: number;
  /** Change to get a different "hand" (a fresh drawing of the same data). */
  seed?: number;
  formatValue?: (v: number) => string;
  /** Subtle ink-bleed displacement filter over the drawing. */
  inkBleed?: boolean;
  /** Color of the surface the chart sits on (used for the rim around columns). */
  surface?: string;
  /** Short display text for a bar label (axis + tooltip). */
  formatLabel?: (label: string) => string;
  /** Called with the hovered bar's label, or null when the pointer leaves. */
  onHoverLabel?: (label: string | null) => void;
  /** Locked (clicked) bar label. The parent should let it win over the hovered label. */
  selectedLabel?: string | null;
  /** Called when a bar is clicked (its label) or the lock is released (null). */
  onSelectLabel?: (label: string | null) => void;
  /** Optional hand-drawn line on a right-hand axis (e.g. a ratio). */
  lineOverlay?: LineOverlay;
}

export interface LineOverlay {
  label: string;
  /** Values keyed by bar label. Missing labels are skipped. */
  values: Record<string, number>;
  format?: (v: number) => string;
  color?: string;
}

/**
 * Max individually animated hatch strokes per chart. Above this the browser
 * starts to stutter, so dense charts space their main hatching out to fit.
 * (Shadow hatching is merged into one path per bar and fades in, so it's free.)
 */
const STROKE_BUDGET = 3600;

// Animation timeline (ms)
const T = {
  background: 0,
  barStart: 350,
  barStagger: 210,
  outline: 120,
  edge: 150,
  segmentStart: 520,
  segmentSpan: 380,
  sweep: 360,
};

interface SegmentGeom {
  key: string;
  tone: ToneName;
  y: number;
  h: number;
  wash: string;
  layers: HatchStroke[][];
  /** Shadow-side hatching, merged into one path per layer. */
  shadow: string[];
  divider: string | null;
}

interface BarGeom {
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rim: string;
  base: string;
  edges: string[];
  segments: SegmentGeom[];
  /** Teal cast shadow to the right of the column (light from upper left). */
  cast: { fill: string; hatch: string };
}

export function EngravedBarChart({
  data,
  series,
  width = 900,
  height = 420,
  seed = 7,
  formatValue = (v) => `$${v.toFixed(1)}B`,
  inkBleed = true,
  surface = '#ffffff',
  formatLabel = (l) => l,
  onHoverLabel,
  selectedLabel = null,
  onSelectLabel,
  lineOverlay,
}: EngravedBarChartProps) {
  const filterId = useId().replace(/:/g, '');
  const [hover, setHoverState] = useState<number | null>(null);
  const lockedIndex = selectedLabel === null ? null : data.findIndex((d) => d.label === selectedLabel);
  const locked = lockedIndex !== null && lockedIndex >= 0 ? lockedIndex : null;
  const setHover = (i: number | null) => {
    setHoverState(i);
    // Always report hover; the parent gives a locked label priority over a hovered one.
    onHoverLabel?.(i === null ? null : data[i]?.label ?? null);
  };
  const toggleLock = (i: number) => onSelectLabel?.(locked === i ? null : data[i].label);

  // Escape releases the lock.
  useEffect(() => {
    if (locked === null || !onSelectLabel) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onSelectLabel(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [locked, onSelectLabel]);
  const margin = { top: 18, right: lineOverlay ? 54 : 18, bottom: 40, left: 58 };
  // Keep the whole drawing around 2.5s no matter how many bars there are.
  const stagger = Math.min(T.barStagger, 2600 / Math.max(1, data.length));
  const labelEvery = Math.max(1, Math.ceil(data.length / 12));
  const lineColor = lineOverlay?.color ?? palette.accent;
  const lineFormat = lineOverlay?.format ?? ((v: number) => v.toFixed(2));

  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const { x, bars, background, grid, baseline, line } = useMemo(() => {
    const totals = data.map((d) => series.reduce((sum, s) => sum + (d.values[s.key] ?? 0), 0));
    const y = d3
      .scaleLinear()
      .domain([0, d3.max(totals) ?? 1])
      .nice(5)
      .range([innerH, 0]);
    const x = d3
      .scaleBand()
      .domain(data.map((d) => d.label))
      .range([0, innerW])
      .paddingInner(0.28)
      .paddingOuter(0.18);

    // Estimate stroke count at full density, then scale gaps to fit the budget.
    const bwEst = x.bandwidth();
    let estimate = 0;
    for (const d of data) {
      for (const s of series) {
        const h = innerH - y(d.values[s.key] ?? 0);
        if (h <= 1) continue;
        for (const l of tones[s.tone].layers) estimate += ((bwEst + h) * 0.71) / l.gap;
      }
    }
    const density = Math.max(1, estimate / STROKE_BUDGET);
    // Slightly heavier strokes when spaced out, so the tone doesn't wash out.
    const weightBoost = Math.min(1.35, Math.sqrt(density));

    const bars: BarGeom[] = data.map((d, i) => {
      const rand = seededRandom(seedFrom(d.label, seed));
      const bx = x(d.label) ?? 0;
      const bw = x.bandwidth();
      const top = y(totals[i]);
      const bh = innerH - top;

      let cursor = innerH;
      const segments: SegmentGeom[] = series.map((s, si) => {
        const v = d.values[s.key] ?? 0;
        const h = innerH - y(v);
        const sy = cursor - h;
        cursor = sy;
        const tone = tones[s.tone];
        const layers = tone.layers.map((l) =>
          hatchRect(bx, sy, bw, h, { angle: l.angle, gap: l.gap * density, weight: l.weight * weightBoost, rand }),
        );
        // Light from the upper left: the right side of every column falls into shadow.
        const primary = tone.layers[0];
        const shadow = [
          hatchRect(bx + bw * 0.64, sy, bw * 0.36, h, {
            angle: primary.angle - 90,
            gap: Math.max(3, primary.gap * 0.95),
            weight: primary.weight * 0.85,
            rand,
          }),
          hatchRect(bx + bw * 0.86, sy, bw * 0.14, h, {
            angle: 88,
            gap: 2.6,
            weight: 0.6,
            rand,
            endJitter: 0.8,
          }),
        ].map(bakeStrokes);
        return {
          key: s.key,
          tone: s.tone,
          y: sy,
          h,
          wash: wobblyRectFill(bx, sy, bw, h, rand, 0.7),
          layers,
          shadow,
          divider: si < series.length - 1 ? wobblyLine({ x: bx - 1, y: sy }, { x: bx + bw + 1, y: sy }, rand, 0.7) : null,
        };
      });

      return {
        label: d.label,
        x: bx,
        y: top,
        w: bw,
        h: bh,
        rim: wobblyRectFill(bx - 3, top - 3, bw + 6, bh + 3, rand, 0.8),
        base: wobblyRectFill(bx, top, bw, bh, rand, 0.8),
        edges: wobblyRectEdges(bx, top, bw, bh, rand),
        segments,
        cast: {
          fill: wobblyRectFill(bx + bw + 1, top + 8, Math.min(9, bw * 0.16), bh - 8, rand, 0.6),
          hatch: bakeStrokes(
            hatchRect(bx + bw + 1, top + 9, Math.min(9, bw * 0.16), bh - 9, {
              angle: 45,
              gap: 2.8,
              weight: 0.6,
              rand,
              endJitter: 0.5,
            }),
          ),
        },
      };
    });

    // Cool, sparse background "sky" lines: the split-tone backdrop.
    const bgRand = seededRandom(seedFrom('background', seed));
    const background = hatchRect(0, 0, innerW, innerH, {
      angle: 0,
      gap: 11,
      weight: 0.7,
      rand: bgRand,
      angleJitter: 0.4,
      endJitter: 6,
      skip: 0.12,
      bow: 1.4,
    });

    const gridRand = seededRandom(seedFrom('grid', seed));
    const grid = y.ticks(5).map((t) => ({ t, y: y(t), dots: t === 0 ? [] : stippleLine(0, innerW, y(t), gridRand) }));
    const baseline = wobblyLine({ x: -6, y: innerH }, { x: innerW + 6, y: innerH }, gridRand, 0.8);

    // Right-axis line overlay
    let line: { d: string; dots: { d: string; label: string }[]; ticks: { t: number; y: number }[] } | null = null;
    if (lineOverlay) {
      const pts = data
        .filter((d) => lineOverlay.values[d.label] !== undefined)
        .map((d) => ({ label: d.label, v: lineOverlay.values[d.label] }));
      if (pts.length > 1) {
        const y2 = d3
          .scaleLinear()
          .domain([0, (d3.max(pts, (p) => p.v) ?? 1) * 1.1])
          .nice(5)
          .range([innerH, 0]);
        const lineRand = seededRandom(seedFrom('line', seed));
        const xy = pts.map((p) => ({ label: p.label, x: (x(p.label) ?? 0) + x.bandwidth() / 2, y: y2(p.v) }));
        line = {
          d: handPolyline(xy, lineRand, 1),
          dots: xy.map((p) => ({ label: p.label, d: wobblyCircle(p.x, p.y, 3, lineRand) })),
          ticks: y2.ticks(5).map((t) => ({ t, y: y2(t) })),
        };
      }
    }

    return { x, bars, background, grid, baseline, line };
  }, [data, series, seed, innerW, innerH, lineOverlay]);

  const tipIndex = hover ?? locked;
  const hovered = tipIndex !== null ? data[tipIndex] : null;
  const hoveredBar = tipIndex !== null ? bars[tipIndex] : null;

  return (
    <svg
      key={seed}
      className="eg-chart"
      data-hovering={hover !== null || locked !== null}
      onClick={() => locked !== null && onSelectLabel?.(null)}
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      role="img"
      aria-label="Stacked bar chart"
    >
      <defs>
        <filter id={filterId} x="-2%" y="-2%" width="104%" height="104%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={seed} result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>

      <g transform={`translate(${margin.left} ${margin.top})`}>
        {/* Background zone */}
        <Strokes strokes={background} color={palette.tealInk} opacity={0.28} start={T.background} sweep={700} duration={260} />

        {/* Dotted gridlines + labels */}
        {grid.map((g, gi) => (
          <g key={g.t} className="eg-fade" style={timing(80 + gi * 60, 400)}>
            {g.dots.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={0.75} fill={palette.ink} opacity={0.3} />
            ))}
            <text
              x={-12}
              y={g.y}
              dy="0.32em"
              textAnchor="end"
              fontFamily="'IBM Plex Mono', monospace"
              fontSize={10}
              fill={palette.muted}
            >
              {formatValue(g.t).replace('.0', '')}
            </text>
          </g>
        ))}

        <g filter={inkBleed ? `url(#${filterId})` : undefined}>
          {bars.map((b, i) => {
            const t0 = T.barStart + i * stagger;
            return (
              <g
                key={b.label}
                className="eg-bar"
                data-active={hover === i || locked === i}
                data-locked={locked === i}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLock(i);
                }}
              >
                {/* Surface-colored rim keeps the column clear of the background lines */}
                <path d={b.rim} fill={surface} stroke={surface} strokeWidth={4} />

                {/* 0. Teal cast shadow: depth, drawn once the column is finished */}
                <path
                  d={b.cast.fill}
                  fill={shadow.wash}
                  className="eg-fade"
                  style={timing(t0 + T.segmentStart + series.length * T.segmentSpan, 500, shadow.washOpacity * 1.4)}
                />
                <path
                  d={b.cast.hatch}
                  fill={shadow.ink}
                  className="eg-fade"
                  style={timing(t0 + T.segmentStart + series.length * T.segmentSpan + 100, 450, shadow.inkOpacity)}
                />

                {/* 1. Gray base tone: the bar exists before it is drawn */}
                <path d={b.base} fill={palette.ink} className="eg-fade" style={timing(t0, 320, 0.07)} />

                {/* 2. Washes (color hint) */}
                {b.segments.map((s, si) => {
                  const wash = tones[s.tone].wash;
                  if (!wash) return null;
                  const ts = t0 + T.segmentStart + si * T.segmentSpan;
                  const glow = tones[s.tone].glow;
                  return (
                    <g key={`w-${s.key}`}>
                      <path d={s.wash} fill={wash.color} className="eg-fade" style={timing(ts + 120, 500, wash.opacity)} />
                      {glow && <path d={s.wash} fill={glow.color} className="eg-fade" style={timing(ts + 220, 600, glow.opacity)} />}
                    </g>
                  );
                })}

                {/* 3. Hatching, bottom segment first */}
                {b.segments.map((s, si) => {
                  const tone = tones[s.tone];
                  const ts = t0 + T.segmentStart + si * T.segmentSpan;
                  return (
                    <g key={`h-${s.key}`}>
                      {s.layers.map((strokes, li) => (
                        <Strokes
                          key={li}
                          strokes={strokes}
                          color={tone.layers[li].color}
                          opacity={tone.layers[li].opacity}
                          start={ts + li * 200}
                          sweep={T.sweep}
                        />
                      ))}
                    </g>
                  );
                })}

                {/* 4. Shadow side, last pass */}
                {b.segments.map((s, si) => {
                  const tone = tones[s.tone];
                  const ts = t0 + T.segmentStart + series.length * T.segmentSpan + si * 90;
                  return (
                    <g key={`s-${s.key}`}>
                      {s.shadow.map((d, li) => (
                        <path
                          key={li}
                          d={d}
                          fill={tone.shadowColor}
                          className="eg-fade"
                          style={timing(ts + li * 160, 380, shadow.inkOpacity + 0.05)}
                        />
                      ))}
                    </g>
                  );
                })}

                {/* Gold rim light on glowing segments: narrow, tight to the edge */}
                {b.segments.map((s, si) => {
                  const glow = tones[s.tone].glow;
                  if (!glow) return null;
                  return (
                    <path
                      key={`g-${s.key}`}
                      d={s.wash}
                      fill="none"
                      stroke={glow.color}
                      strokeWidth={2.2}
                      strokeLinejoin="round"
                      className="eg-fade"
                      style={timing(t0 + T.segmentStart + series.length * T.segmentSpan + si * 90, 500, glow.rim)}
                    />
                  );
                })}

                {/* 5. Segment dividers + outline in ink */}
                {b.segments.map((s, si) =>
                  s.divider ? (
                    <path
                      key={`d-${s.key}`}
                      d={s.divider}
                      pathLength={1}
                      fill="none"
                      stroke={palette.ink}
                      strokeWidth={0.9}
                      strokeLinecap="round"
                      opacity={0.6}
                      className="eg-ink"
                      style={timing(t0 + T.segmentStart + si * T.segmentSpan + 300, 220)}
                    />
                  ) : null,
                )}
                {b.edges.map((d, ei) => (
                  <path
                    key={`e-${ei}`}
                    d={d}
                    pathLength={1}
                    fill="none"
                    stroke={palette.ink}
                    strokeWidth={1.35}
                    strokeLinecap="round"
                    opacity={0.85}
                    className="eg-ink"
                    style={timing(t0 + T.outline + ei * T.edge, 200)}
                  />
                ))}

                {/* Hit area */}
                <rect x={b.x - 6} y={0} width={b.w + 12} height={innerH} fill="transparent" />
              </g>
            );
          })}

          <path
            d={baseline}
            pathLength={1}
            fill="none"
            stroke={palette.ink}
            strokeWidth={1.2}
            strokeLinecap="round"
            opacity={0.7}
            className="eg-ink"
            style={timing(150, 600)}
          />
        </g>

        {/* Line overlay on a right-hand axis */}
        {line && lineOverlay && (
          <g pointerEvents="none">
            {line.ticks.map((t) => (
              <text
                key={t.t}
                x={innerW + 12}
                y={t.y}
                dy="0.32em"
                fontFamily="'IBM Plex Mono', monospace"
                fontSize={10}
                fill={lineColor}
                className="eg-fade"
                style={timing(200, 400)}
              >
                {lineFormat(t.t)}
              </text>
            ))}
            <path
              d={line.d}
              fill="none"
              stroke={lineColor}
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.9}
              pathLength={1}
              className="eg-ink"
              style={timing(T.barStart + data.length * stagger + 600, 1400)}
            />
            {line.dots.map((p, i) => (
              <path
                key={p.label}
                d={p.d}
                fill={surface}
                stroke={lineColor}
                strokeWidth={hover !== null && data[hover]?.label === p.label ? 2 : 1.2}
                className="eg-fade"
                style={timing(T.barStart + data.length * stagger + 700 + (i / line.dots.length) * 1300, 200)}
              />
            ))}
          </g>
        )}

        {/* Lock marker: a hand-drawn violet bracket under the locked bar */}
        {locked !== null && bars[locked] && (
          <path
            d={wobblyLine(
              { x: bars[locked].x - 2, y: innerH + 8 },
              { x: bars[locked].x + bars[locked].w + 2, y: innerH + 8 },
              seededRandom(seedFrom(`lock-${bars[locked].label}`, seed)),
              0.8,
            )}
            fill="none"
            stroke={palette.violet}
            strokeWidth={2.4}
            strokeLinecap="round"
            pointerEvents="none"
          />
        )}

        {/* X labels */}
        {data.map((d, i) => (i % labelEvery !== 0 && hover !== i && locked !== i ? null : (
          <text
            key={d.label}
            x={(x(d.label) ?? 0) + x.bandwidth() / 2}
            y={innerH + 22}
            textAnchor="middle"
            fontFamily="'IBM Plex Mono', monospace"
            fontSize={10}
            fill={locked === i ? palette.violetInk : hover === i ? palette.ink : palette.muted}
            fontWeight={locked === i ? 600 : 400}
            className="eg-fade"
            style={timing(T.barStart + i * stagger, 400)}
          >
            {formatLabel(d.label)}
          </text>
        )))}

        {/* Tooltip */}
        {hovered && hoveredBar && (
          <Tooltip
            x={hoveredBar.x + hoveredBar.w + 10 > innerW - 170 ? hoveredBar.x - 180 : hoveredBar.x + hoveredBar.w + 10}
            y={Math.max(0, Math.min(hoveredBar.y, innerH - 130))}
            title={formatLabel(hovered.label)}
            rows={[
              ...[...series].reverse().map((s) => ({ label: s.label, value: formatValue(hovered.values[s.key] ?? 0), tone: s.tone })),
              ...(lineOverlay && lineOverlay.values[hovered.label] !== undefined
                ? [{ label: lineOverlay.label, value: lineFormat(lineOverlay.values[hovered.label]), tone: 'ink' as ToneName }]
                : []),
            ]}
            seed={seed + (tipIndex ?? 0)}
          />
        )}
      </g>
    </svg>
  );
}

function Tooltip({
  x,
  y,
  title,
  rows,
  seed,
}: {
  x: number;
  y: number;
  title: string;
  rows: { label: string; value: string; tone: ToneName }[];
  seed: number;
}) {
  const w = 170;
  const h = 34 + rows.length * 20;
  const edges = useMemo(() => wobblyRectEdges(0, 0, w, h, seededRandom(seed), { amp: 0.9, overshoot: 2 }), [seed, h]);
  return (
    <g transform={`translate(${x} ${y})`} pointerEvents="none">
      <rect x={0} y={0} width={w} height={h} fill={palette.paper} opacity={0.96} />
      {edges.map((d, i) => (
        <path key={i} d={d} fill="none" stroke={palette.ink} strokeWidth={1.1} strokeLinecap="round" opacity={0.8} />
      ))}
      <text x={12} y={21} fontFamily="'Plus Jakarta Sans', sans-serif" fontWeight={700} fontSize={13} fill={palette.ink}>
        {title}
      </text>
      {rows.map((r, i) => (
        <g key={r.label} transform={`translate(12 ${40 + i * 20})`}>
          <rect
            x={0}
            y={-8}
            width={9}
            height={9}
            fill={tones[r.tone].wash?.color ?? palette.paper}
            stroke={palette.ink}
            strokeWidth={0.8}
          />
          <text x={16} y={0} fontFamily="'Plus Jakarta Sans', sans-serif" fontSize={11} fill={palette.inkSoft}>
            {r.label}
          </text>
          <text x={w - 24} y={0} textAnchor="end" fontFamily="'IBM Plex Mono', monospace" fontSize={11} fill={palette.ink}>
            {r.value}
          </text>
        </g>
      ))}
    </g>
  );
}
