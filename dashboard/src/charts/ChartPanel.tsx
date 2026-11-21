import type { ReactNode } from 'react';
import { WobblyPanel } from '../engraving/WobblyPanel';
import { HatchSwatch } from '../engraving/HatchSwatch';
import type { ToneName } from '../engraving/palette';

export interface LegendItem {
  label: string;
  tone?: ToneName;
  /** Solid line swatch (for line overlays) instead of a hatch swatch. */
  lineColor?: string;
}

/** Hand-bordered panel with a title, an optional legend, and a chart. */
export function ChartPanel({ title, legend = [], seed = 11, children }: { title: string; legend?: LegendItem[]; seed?: number; children: ReactNode }) {
  return (
    <WobblyPanel seed={seed} padding="20px 20px 12px" style={{ height: '100%' }}>
      <div className="panel-head">
        <h2>{title}</h2>
        {legend.length > 0 && (
          <ul className="panel-legend">
            {legend.map((l, i) => (
              <li key={l.label}>
                {l.lineColor ? (
                  <svg width={18} height={10} aria-hidden>
                    <path d="M1 6 C5 3, 11 8, 17 4" fill="none" stroke={l.lineColor} strokeWidth={1.8} strokeLinecap="round" />
                  </svg>
                ) : (
                  <HatchSwatch tone={l.tone ?? 'ink'} seed={13 + i * 7} />
                )}
                {l.label}
              </li>
            ))}
          </ul>
        )}
      </div>
      {children}
    </WobblyPanel>
  );
}
