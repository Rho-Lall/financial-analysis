/**
 * Hand-drawn, engraving-inspired geometry.
 *
 * Everything here is pure math: given a seeded random source it returns
 * SVG path data. React components decide how to render and animate it.
 * Same seed => same drawing, so live data updates never make lines jitter.
 */

export type Rand = () => number;

/** Deterministic PRNG (mulberry32). */
export function seededRandom(seed: number): Rand {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Stable seed derived from a string key (e.g. "Q3'24|cost"). */
export function seedFrom(key: string, base = 0): number {
  let h = 2166136261 ^ base;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const r2 = (n: number) => Math.round(n * 100) / 100;
const jitter = (rand: Rand, amount: number) => (rand() * 2 - 1) * amount;

interface Pt {
  x: number;
  y: number;
}

/** Smooth path through points (Catmull-Rom converted to cubic Béziers). */
function smoothPath(pts: Pt[]): string {
  if (pts.length < 2) return '';
  let d = `M${r2(pts[0].x)} ${r2(pts[0].y)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${r2(c1x)} ${r2(c1y)} ${r2(c2x)} ${r2(c2y)} ${r2(p2.x)} ${r2(p2.y)}`;
  }
  return d;
}

/** One wobbly stroke from a to b, the way a hand drags a pen along a ruler-less edge. */
export function wobblyLine(a: Pt, b: Pt, rand: Rand, amp = 1.1): string {
  const len = Math.hypot(b.x - a.x, b.y - a.y);
  const nx = -(b.y - a.y) / (len || 1);
  const ny = (b.x - a.x) / (len || 1);
  const steps = Math.max(2, Math.round(len / 55));
  const pts: Pt[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // Endpoints stay put; the middle drifts.
    const off = i === 0 || i === steps ? jitter(rand, amp * 0.3) : jitter(rand, amp);
    pts.push({ x: a.x + (b.x - a.x) * t + nx * off, y: a.y + (b.y - a.y) * t + ny * off });
  }
  return smoothPath(pts);
}

/**
 * Hand-drawn box: four separate edge strokes that overshoot the corners a
 * little, like a quick doodle. Returned separately so they can draw in order.
 */
export function wobblyRectEdges(
  x: number,
  y: number,
  w: number,
  h: number,
  rand: Rand,
  { amp = 1.1, overshoot = 2.5 }: { amp?: number; overshoot?: number } = {},
): string[] {
  const o = () => overshoot * (0.4 + rand() * 0.8);
  const c = () => jitter(rand, 0.8);
  return [
    wobblyLine({ x: x - o(), y: y + c() }, { x: x + w + o(), y: y + c() }, rand, amp), // top
    wobblyLine({ x: x + w + c(), y: y - o() }, { x: x + w + c(), y: y + h + o() }, rand, amp), // right
    wobblyLine({ x: x + w + o(), y: y + h + c() }, { x: x - o(), y: y + h + c() }, rand, amp), // bottom
    wobblyLine({ x: x + c(), y: y + h + o() }, { x: x + c(), y: y - o() }, rand, amp), // left
  ];
}

/** Closed, slightly irregular outline for fills (washes, clip shapes). */
export function wobblyRectFill(x: number, y: number, w: number, h: number, rand: Rand, amp = 0.9): string {
  const pts: Pt[] = [];
  const edge = (ax: number, ay: number, bx: number, by: number) => {
    const len = Math.hypot(bx - ax, by - ay);
    const steps = Math.max(1, Math.round(len / 40));
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      pts.push({ x: ax + (bx - ax) * t + jitter(rand, amp), y: ay + (by - ay) * t + jitter(rand, amp) });
    }
  };
  edge(x, y, x + w, y);
  edge(x + w, y, x + w, y + h);
  edge(x + w, y + h, x, y + h);
  edge(x, y + h, x, y);
  return smoothPath([...pts, pts[0]]) + ' Z';
}

/** A single hatch stroke, stored in its own local frame so it can "grow" along its length. */
export interface HatchStroke {
  /** Start point in chart coordinates. */
  x: number;
  y: number;
  /** Direction in degrees. */
  angle: number;
  /** Tapered outline in local coordinates (start at 0,0, runs along +x). */
  d: string;
  /** Order within its layer (0 = first cut). */
  index: number;
}

export interface HatchOptions {
  /** Stroke direction in degrees (0 = horizontal, 45 = down-right). */
  angle: number;
  /** Average distance between strokes in px. Smaller = darker tone. */
  gap: number;
  /** Peak stroke width in px. */
  weight: number;
  rand: Rand;
  /** Random angle wobble per stroke, degrees. */
  angleJitter?: number;
  /** Spacing irregularity as a fraction of gap. */
  gapJitter?: number;
  /** How far stroke ends may fall short of / overshoot the edge, px. */
  endJitter?: number;
  /** Max sideways bow at the middle of a stroke, px. */
  bow?: number;
  /** Chance a stroke is skipped entirely (a hand misses a few). */
  skip?: number;
}

/** Tapered stroke outline: thin at both ends, swelling in the middle. */
function taperedStroke(len: number, weight: number, bow: number): string {
  const n = Math.max(4, Math.min(10, Math.round(len / 12)));
  const upper: Pt[] = [];
  const lower: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const cy = bow * 4 * t * (1 - t);
    const hw = (weight / 2) * (0.2 + 0.8 * Math.pow(Math.sin(Math.PI * t), 0.6));
    upper.push({ x: len * t, y: cy - hw });
    lower.push({ x: len * t, y: cy + hw });
  }
  const pts = [...upper, ...lower.reverse()];
  return 'M' + pts.map((p) => `${r2(p.x)} ${r2(p.y)}`).join(' L') + ' Z';
}

/**
 * Fill a rectangle with hand-cut parallel strokes.
 * Strokes are returned in sweep order so animation looks like one hand working across.
 */
export function hatchRect(
  rx: number,
  ry: number,
  rw: number,
  rh: number,
  opts: HatchOptions,
): HatchStroke[] {
  const {
    angle,
    gap,
    weight,
    rand,
    angleJitter = 1.6,
    gapJitter = 0.22,
    endJitter = 1.6,
    bow = 0.9,
    skip = 0.03,
  } = opts;
  if (rw <= 1 || rh <= 1) return [];

  const a = (angle * Math.PI) / 180;
  const dx = Math.cos(a);
  const dy = Math.sin(a);
  const nx = -dy;
  const ny = dx;

  const corners: Pt[] = [
    { x: rx, y: ry },
    { x: rx + rw, y: ry },
    { x: rx, y: ry + rh },
    { x: rx + rw, y: ry + rh },
  ];
  const proj = corners.map((p) => p.x * nx + p.y * ny);
  const sMin = Math.min(...proj);
  const sMax = Math.max(...proj);

  const strokes: HatchStroke[] = [];
  let s = sMin + gap * (0.3 + rand() * 0.5);
  let index = 0;
  while (s < sMax) {
    if (rand() >= skip) {
      // Line: P(t) = n*s + d*t. Clip t to the rectangle (slab method).
      const ox = nx * s;
      const oy = ny * s;
      let t0 = -Infinity;
      let t1 = Infinity;
      const slab = (o: number, d: number, lo: number, hi: number) => {
        if (Math.abs(d) < 1e-9) {
          if (o < lo || o > hi) t0 = Infinity;
          return;
        }
        const ta = (lo - o) / d;
        const tb = (hi - o) / d;
        t0 = Math.max(t0, Math.min(ta, tb));
        t1 = Math.min(t1, Math.max(ta, tb));
      };
      slab(ox, dx, rx, rx + rw);
      slab(oy, dy, ry, ry + rh);

      if (t1 - t0 > 2) {
        // Hand-drawn ends: sometimes short, sometimes a hair past the edge.
        t0 += jitter(rand, endJitter) + endJitter * 0.35;
        t1 += jitter(rand, endJitter) - endJitter * 0.35;
        const len = t1 - t0;
        if (len > 1.5) {
          const pressure = 0.75 + rand() * 0.45;
          strokes.push({
            x: r2(ox + dx * t0),
            y: r2(oy + dy * t0),
            angle: r2(angle + jitter(rand, angleJitter)),
            d: taperedStroke(len, weight * pressure, jitter(rand, bow)),
            index: index++,
          });
        }
      }
    }
    s += gap * (1 + jitter(rand, gapJitter));
  }
  return strokes;
}

/** Stipple dots along a horizontal line (dotted gridlines, drawn by hand). */
export function stippleLine(x0: number, x1: number, y: number, rand: Rand, spacing = 6): Pt[] {
  const pts: Pt[] = [];
  for (let x = x0 + rand() * spacing; x < x1; x += spacing * (0.7 + rand() * 0.6)) {
    pts.push({ x: r2(x), y: r2(y + jitter(rand, 0.5)) });
  }
  return pts;
}

/* ------------------------------------------------------------------ */
/* Curved flows (Sankey links)                                         */
/* ------------------------------------------------------------------ */

/** Horizontal S-curve from (x0,y0) to (x1,y1), the shape d3-sankey uses. */
export interface FlowCurve {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

function curvePoint(c: FlowCurve, t: number): Pt {
  const xm = (c.x0 + c.x1) / 2;
  const u = 1 - t;
  return {
    x: u * u * u * c.x0 + 3 * u * u * t * xm + 3 * u * t * t * xm + t * t * t * c.x1,
    y: u * u * u * c.y0 + 3 * u * u * t * c.y0 + 3 * u * t * t * c.y1 + t * t * t * c.y1,
  };
}

function curveNormal(c: FlowCurve, t: number): Pt {
  const xm = (c.x0 + c.x1) / 2;
  const u = 1 - t;
  const dx = 3 * u * u * (xm - c.x0) + 3 * t * t * (c.x1 - xm);
  const dy = 6 * u * t * (c.y1 - c.y0);
  const len = Math.hypot(dx, dy) || 1;
  return { x: -dy / len, y: dx / len };
}

/** Exact (non-wobbly) curve path, for fills. */
export function flowCurvePath(c: FlowCurve): string {
  const xm = (c.x0 + c.x1) / 2;
  return `M${r2(c.x0)} ${r2(c.y0)} C${r2(xm)} ${r2(c.y0)} ${r2(xm)} ${r2(c.y1)} ${r2(c.x1)} ${r2(c.y1)}`;
}

/** Filled band between two parallel flow curves (top edge y0/y1, thickness w). */
export function flowBandPath(c: FlowCurve, w: number): string {
  const xm = (c.x0 + c.x1) / 2;
  const t0 = c.y0 - w / 2;
  const t1 = c.y1 - w / 2;
  const b0 = c.y0 + w / 2;
  const b1 = c.y1 + w / 2;
  return (
    `M${r2(c.x0)} ${r2(t0)} C${r2(xm)} ${r2(t0)} ${r2(xm)} ${r2(t1)} ${r2(c.x1)} ${r2(t1)}` +
    ` L${r2(c.x1)} ${r2(b1)} C${r2(xm)} ${r2(b1)} ${r2(xm)} ${r2(b0)} ${r2(c.x0)} ${r2(b0)} Z`
  );
}

/** Hand-drawn version of a flow curve between tStart and tEnd. */
export function wobblyFlowPath(c: FlowCurve, rand: Rand, amp = 0.9, tStart = 0, tEnd = 1): string {
  const len = Math.abs(c.x1 - c.x0) * (tEnd - tStart) + Math.abs(c.y1 - c.y0) * 0.5;
  const steps = Math.max(3, Math.round(len / 28));
  const pts: Pt[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = tStart + ((tEnd - tStart) * i) / steps;
    const p = curvePoint(c, t);
    const n = curveNormal(c, t);
    const off = jitter(rand, amp);
    pts.push({ x: p.x + n.x * off, y: p.y + n.y * off });
  }
  return smoothPath(pts);
}

/** One hand-cut contour stroke segment along a flow. Timing values are 0..1 fractions. */
export interface ContourStroke {
  d: string;
  width: number;
  /** Start delay as a fraction of the layer's total draw time. */
  delay: number;
  /** Draw duration as a fraction of the layer's total draw time. */
  duration: number;
  /** True for strokes on the shadow side of the band (rendered in the shadow color). */
  shadow: boolean;
}

export interface ContourOptions {
  gap: number;
  weight: number;
  rand: Rand;
  /** Fraction across the band (from top) where the shadow side begins. */
  shadowFrom?: number;
  /** Extra density multiplier on the shadow side (2 = twice as many lines). */
  shadowDensity?: number;
  /** Fraction of the band at the top left bare (highlight). */
  highlight?: number;
}

/**
 * Engraver-style contour lines that run WITH the flow, parallel to its edges.
 * Lines break where a hand would lift the pen; the lower (shadow) side is denser.
 */
export function contourStrokes(c: FlowCurve, w: number, opts: ContourOptions): ContourStroke[] {
  const { gap, weight, rand, shadowFrom = 0.62, shadowDensity = 2, highlight = 0.12 } = opts;
  if (w < 1.5) return [];
  const out: ContourStroke[] = [];
  const offsets: number[] = [];
  for (let f = highlight + (gap / w) * rand(); f < 1; ) {
    offsets.push(f);
    const local = f > shadowFrom ? gap / shadowDensity : gap;
    f += (local / w) * (1 + jitter(rand, 0.25));
  }
  const n = offsets.length;
  offsets.forEach((f, k) => {
    const off = -w / 2 + f * w;
    const curve: FlowCurve = { x0: c.x0, y0: c.y0 + off, x1: c.x1, y1: c.y1 + off };
    const stagger = (k / Math.max(1, n)) * 0.3;
    // Break the line into 1-3 pen strokes with small gaps.
    const pieces = 1 + Math.floor(rand() * 2.6);
    const cuts = [0];
    for (let p = 1; p < pieces; p++) cuts.push(p / pieces + jitter(rand, 0.08));
    cuts.push(1);
    for (let p = 0; p < pieces; p++) {
      const ts = Math.max(0, cuts[p] + (p === 0 ? rand() * 0.03 : 0.012 + rand() * 0.02));
      const te = Math.min(1, cuts[p + 1] - (p === pieces - 1 ? rand() * 0.03 : 0));
      if (te - ts < 0.04) continue;
      const shade = f > shadowFrom ? 0.8 : 1;
      out.push({
        d: wobblyFlowPath(curve, rand, 0.6, ts, te),
        width: r2(weight * shade * (0.75 + rand() * 0.45)),
        delay: stagger + ts * 0.7,
        duration: (te - ts) * 0.7,
        shadow: f > shadowFrom,
      });
    }
  });
  return out;
}

/* ------------------------------------------------------------------ */
/* Lines and marks                                                     */
/* ------------------------------------------------------------------ */

/** Hand-drawn smooth line through data points (for line overlays). */
export function handPolyline(points: Pt[], rand: Rand, amp = 0.8): string {
  if (points.length < 2) return '';
  const pts: Pt[] = [];
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    pts.push({ x: p.x + jitter(rand, amp * 0.4), y: p.y + jitter(rand, amp * 0.4) });
    const q = points[i + 1];
    if (q) {
      // A drifting midpoint between data points so the pen never runs perfectly straight.
      pts.push({ x: (p.x + q.x) / 2 + jitter(rand, amp), y: (p.y + q.y) / 2 + jitter(rand, amp) });
    }
  }
  return smoothPath(pts);
}

/** A quickly drawn circle that doesn't quite close. */
export function wobblyCircle(cx: number, cy: number, r: number, rand: Rand): string {
  const start = rand() * Math.PI * 2;
  const sweep = Math.PI * 2 * (1.04 + rand() * 0.08);
  const n = 9;
  const pts: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const a = start + (sweep * i) / n;
    const rr = r * (1 + jitter(rand, 0.1));
    pts.push({ x: cx + Math.cos(a) * rr, y: cy + Math.sin(a) * rr });
  }
  return smoothPath(pts);
}

/**
 * Merge many hatch strokes into one path in chart coordinates. Use for layers
 * that fade in as a whole (shadows) instead of animating stroke by stroke:
 * one DOM node instead of hundreds.
 */
export function bakeStrokes(strokes: HatchStroke[]): string {
  let out = '';
  for (const s of strokes) {
    const a = (s.angle * Math.PI) / 180;
    const c = Math.cos(a);
    const n = Math.sin(a);
    out += s.d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_, px: string, py: string) => {
      const x = Number(px);
      const y = Number(py);
      return `${r2(s.x + x * c - y * n)} ${r2(s.y + x * n + y * c)}`;
    });
  }
  return out;
}
