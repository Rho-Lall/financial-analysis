import { useMemo, useState } from 'react';
import { seededRandom, wobblyLine } from './geometry';
import { palette } from './palette';
import { WobblyPanel } from './WobblyPanel';

export interface NavTab<K extends string> {
  key: K;
  label: string;
}

/** Hand-drawn tab row. The active tab gets a teal wash with sparse hatching. */
export function HandTabs<K extends string>({
  tabs,
  active,
  onChange,
  drawDelay = 0,
}: {
  tabs: NavTab<K>[];
  active: K;
  onChange: (key: K) => void;
  drawDelay?: number;
}) {
  const [hover, setHover] = useState<K | null>(null);
  return (
    <div className="eg-tabs" role="tablist">
      {tabs.map((t, i) => {
        const isActive = t.key === active;
        const isHover = hover === t.key && !isActive;
        return (
          <button
            key={t.key}
            role="tab"
            aria-selected={isActive}
            className="eg-tab"
            onClick={() => onChange(t.key)}
            onMouseEnter={() => setHover(t.key)}
            onMouseLeave={() => setHover(null)}
          >
            <WobblyPanel
              seed={101 + i * 7}
              padding="8px 18px"
              surface={isActive ? '#ffffff' : 'none'}
              wash={isActive ? { color: palette.violet, opacity: 0.3 } : isHover ? { color: palette.violet, opacity: 0.12 } : undefined}
              hatch={isActive ? { angle: 66, gap: 5, color: palette.violetInk, opacity: 0.45, weight: 0.65 } : undefined}
              castShadow={isActive ? 4 : 0}
              strokeWidth={isActive ? 1.6 : 1.1}
              strokeOpacity={isActive ? 0.85 : 0.5}
              amp={1}
              overshoot={2.5}
              drawDelay={drawDelay + i * 150}
            >
              <span className={isActive ? 'eg-tab-label eg-tab-label-active' : 'eg-tab-label'}>{t.label}</span>
            </WobblyPanel>
          </button>
        );
      })}
    </div>
  );
}

/** Native select inside a hand-drawn box, with a sketched chevron. */
export function HandSelect({
  value,
  options,
  onChange,
  label,
  drawDelay,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  label: string;
  drawDelay?: number;
}) {
  const chevron = useMemo(() => {
    const rand = seededRandom(77);
    return wobblyLine({ x: 1, y: 2 }, { x: 5.5, y: 7 }, rand, 0.3) + ' ' + wobblyLine({ x: 5.5, y: 7 }, { x: 10, y: 2 }, rand, 0.3).replace(/^M/, 'L');
  }, []);
  return (
    <WobblyPanel seed={211} padding={0} amp={1} overshoot={2.5} strokeWidth={1.1} strokeOpacity={0.6} drawDelay={drawDelay}>
      <div className="eg-select">
        <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <svg width={12} height={10} className="eg-select-chevron" aria-hidden>
          <path d={chevron} fill="none" stroke={palette.inkSoft} strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </WobblyPanel>
  );
}
