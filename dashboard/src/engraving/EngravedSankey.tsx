import { useId, useMemo, useState } from 'react';
import { sankey, sankeyJustify, type SankeyLink, type SankeyNode } from 'd3-sankey';
import {
  contourStrokes,
  flowBandPath,
  hatchRect,
  seedFrom,
  seededRandom,
  wobblyFlowPath,
  wobblyRectEdges,
  type ContourStroke,
  type FlowCurve,
  type HatchStroke,
} from './geometry';
import { palette, shadow, tones, type ToneName } from './palette';
import { Strokes } from './Strokes';
import { timing } from './timing';
import './engraving.css';

export interface FlowNode {
  id: string;
  label: string;
  tone: ToneName;
}

export interface FlowLink {
  source: string;
  target: string;
  value: number;
}

interface EngravedSankeyProps {
  nodes: FlowNode[];
  links: FlowLink[];
  width?: number;
  height?: number;
  seed?: number;
  formatValue?: (v: number) => string;
  inkBleed?: boolean;
  surface?: string;
}

type N = SankeyNode<FlowNode, FlowLink>;
type L = SankeyLink<FlowNode, FlowLink>;

const margin = { top: 12, right: 150, bottom: 12, left: 8 };

// Timeline (ms): each column draws its nodes, then its outgoing flows.
const T = { start: 200, column: 900, node: 380, flow: 1100 };

interface LinkGeom {
  key: string;
  sourceId: string;
  targetId: string;
  tone: ToneName;
  band: string;
  topEdge: string;
  bottomEdge: string;
  contours: ContourStroke[];
  depth: number;
}

interface NodeGeom {
  id: string;
  label: string;
  value: number;
  tone: ToneName;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  depth: number;
  edges: string[];
  hatch: HatchStroke[];
}

export function EngravedSankey({
  nodes,
  links,
  width = 1100,
  height = 340,
  seed = 7,
  formatValue = (v) => `$${v.toFixed(1)}B`,
  inkBleed = true,
  surface = '#ffffff',
}: EngravedSankeyProps) {
  const filterId = useId().replace(/:/g, '');
  const [hover, setHover] = useState<string | null>(null);
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const { nodeGeoms, linkGeoms } = useMemo(() => {
    const toneOf = new Map(nodes.map((n) => [n.id, n.tone]));
    const layout = sankey<FlowNode, FlowLink>()
      .nodeId((d) => d.id)
      .nodeAlign(sankeyJustify)
      .nodeWidth(12)
      .nodePadding(26)
      .nodeSort(null)
      .linkSort(null)
      .extent([
        [0, 0],
        [innerW, innerH],
      ]);
    const graph = layout({ nodes: nodes.map((n) => ({ ...n })), links: links.map((l) => ({ ...l })) });

    const nodeGeoms: NodeGeom[] = graph.nodes.map((n: N) => {
      const rand = seededRandom(seedFrom(`node-${n.id}`, seed));
      const x0 = n.x0 ?? 0;
      const x1 = n.x1 ?? 0;
      const y0 = n.y0 ?? 0;
      const y1 = n.y1 ?? 0;
      return {
        id: n.id,
        label: n.label,
        value: n.value ?? 0,
        tone: n.tone,
        x0,
        x1,
        y0,
        y1,
        depth: n.depth ?? 0,
        edges: wobblyRectEdges(x0, y0, x1 - x0, y1 - y0, rand, { amp: 0.6, overshoot: 1.5 }),
        hatch: hatchRect(x0, y0, x1 - x0, y1 - y0, { angle: 4, gap: 2.4, weight: 0.8, rand, endJitter: 0.6, bow: 0.3 }),
      };
    });

    const linkGeoms: LinkGeom[] = graph.links.map((l: L) => {
      const s = l.source as N;
      const t = l.target as N;
      const key = `${s.id}->${t.id}`;
      const rand = seededRandom(seedFrom(key, seed));
      const w = l.width ?? 0;
      const c: FlowCurve = { x0: s.x1 ?? 0, y0: l.y0 ?? 0, x1: t.x0 ?? 0, y1: l.y1 ?? 0 };
      // A flow takes the tone of where the money goes.
      const tone = toneOf.get(t.id) ?? 'ink';
      const primary = tones[tone].layers[0];
      return {
        key,
        sourceId: s.id,
        targetId: t.id,
        tone,
        band: flowBandPath(c, w),
        topEdge: wobblyFlowPath({ ...c, y0: c.y0 - w / 2, y1: c.y1 - w / 2 }, rand, 0.8),
        bottomEdge: wobblyFlowPath({ ...c, y0: c.y0 + w / 2, y1: c.y1 + w / 2 }, rand, 0.8),
        contours: contourStrokes(c, w, {
          gap: tone === 'money' ? 4.2 : primary.gap * 0.9,
          weight: primary.weight * 0.9,
          rand,
          shadowDensity: tone === 'money' ? 1.6 : 2,
        }),
        depth: s.depth ?? 0,
      };
    });

    return { nodeGeoms, linkGeoms };
  }, [nodes, links, seed, innerW, innerH]);

  const isActive = (ids: string[]) => hover !== null && ids.includes(hover);
  const nodeStart = (depth: number) => T.start + depth * T.column;
  const flowStart = (depth: number) => nodeStart(depth) + T.node;

  return (
    <svg
      key={seed}
      className="eg-chart"
      data-hovering={hover !== null}
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      role="img"
      aria-label="Income flow diagram"
    >
      <defs>
        <filter id={filterId} x="-2%" y="-4%" width="104%" height="108%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={seed} result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>

      <g transform={`translate(${margin.left} ${margin.top})`}>
        <g filter={inkBleed ? `url(#${filterId})` : undefined}>
          {/* Flows */}
          {linkGeoms.map((l) => {
            const tone = tones[l.tone];
            const t0 = flowStart(l.depth);
            const ink = tone.layers[0];
            return (
              <g
                key={l.key}
                className="eg-item"
                data-active={isActive([l.key, l.sourceId, l.targetId])}
                onMouseEnter={() => setHover(l.key)}
                onMouseLeave={() => setHover(null)}
              >
                <path d={l.band} fill={surface} />
                {tone.wash && (
                  <path d={l.band} fill={tone.wash.color} className="eg-fade" style={timing(t0 + 200, 700, tone.wash.opacity * 0.9)} />
                )}
                {/* Lit side in the warm ink, shadow side in teal for depth */}
                <g fill="none" stroke={ink.color} strokeLinecap="round" opacity={ink.opacity * 0.8}>
                  {l.contours.filter((c) => !c.shadow).map((c, i) => (
                    <path
                      key={i}
                      d={c.d}
                      strokeWidth={c.width}
                      pathLength={1}
                      className="eg-ink"
                      style={timing(t0 + c.delay * T.flow, Math.max(60, c.duration * T.flow))}
                    />
                  ))}
                </g>
                <g fill="none" stroke={shadow.ink} strokeLinecap="round" opacity={shadow.inkOpacity + 0.1}>
                  {l.contours.filter((c) => c.shadow).map((c, i) => (
                    <path
                      key={i}
                      d={c.d}
                      strokeWidth={c.width}
                      pathLength={1}
                      className="eg-ink"
                      style={timing(t0 + c.delay * T.flow, Math.max(60, c.duration * T.flow))}
                    />
                  ))}
                </g>
                {[l.topEdge, l.bottomEdge].map((d, i) => (
                  <path
                    key={i}
                    d={d}
                    fill="none"
                    stroke={palette.ink}
                    strokeWidth={1}
                    strokeLinecap="round"
                    opacity={0.55}
                    pathLength={1}
                    className="eg-ink"
                    style={timing(t0 + i * 80, T.flow * 0.7)}
                  />
                ))}
              </g>
            );
          })}

          {/* Nodes */}
          {nodeGeoms.map((n) => {
            const tone = tones[n.tone];
            const t0 = nodeStart(n.depth);
            return (
              <g
                key={n.id}
                className="eg-item"
                data-active={isActive([n.id]) || linkGeoms.some((l) => l.key === hover && (l.sourceId === n.id || l.targetId === n.id))}
                onMouseEnter={() => setHover(n.id)}
                onMouseLeave={() => setHover(null)}
              >
                <rect x={n.x0 - 2} y={n.y0 - 2} width={n.x1 - n.x0 + 4} height={n.y1 - n.y0 + 4} fill={surface} />
                {tone.wash && (
                  <rect
                    x={n.x0}
                    y={n.y0}
                    width={n.x1 - n.x0}
                    height={n.y1 - n.y0}
                    fill={tone.wash.color}
                    className="eg-fade"
                    style={timing(t0, 300, Math.min(1, tone.wash.opacity * 2))}
                  />
                )}
                <Strokes strokes={n.hatch} color={palette.ink} opacity={0.75} start={t0 + 60} sweep={T.node * 0.6} duration={120} />
                {n.edges.map((d, i) => (
                  <path
                    key={i}
                    d={d}
                    fill="none"
                    stroke={palette.ink}
                    strokeWidth={1.2}
                    strokeLinecap="round"
                    opacity={0.85}
                    pathLength={1}
                    className="eg-ink"
                    style={timing(t0 + i * 60, 160)}
                  />
                ))}
              </g>
            );
          })}
        </g>

        {/* Labels (outside the ink-bleed filter so text stays crisp) */}
        {nodeGeoms.map((n) => {
          const isLast = n.x1 >= innerW - 1;
          const x = isLast ? n.x1 + 10 : n.x1 + 8;
          const y = (n.y0 + n.y1) / 2;
          return (
            <g key={`lbl-${n.id}`} className="eg-fade" style={timing(nodeStart(n.depth) + 200, 400)} pointerEvents="none">
              <text
                x={x}
                y={y - 6}
                fontFamily="'Plus Jakarta Sans', sans-serif"
                fontSize={11}
                fontWeight={600}
                fill={palette.inkSoft}
                stroke={surface}
                strokeWidth={4}
                strokeLinejoin="round"
                paintOrder="stroke"
              >
                {n.label}
              </text>
              <text
                x={x}
                y={y + 9}
                fontFamily="'IBM Plex Mono', monospace"
                fontSize={10.5}
                fill={palette.ink}
                stroke={surface}
                strokeWidth={4}
                strokeLinejoin="round"
                paintOrder="stroke"
              >
                {formatValue(n.value)}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}
