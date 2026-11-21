import { EngravedScoreCard } from '../engraving/EngravedScoreCard';
import type { ToneName } from '../engraving/palette';
import { money } from '../charts/adapters';

export type ScoreFormat = 'currency' | 'percentage' | 'ratio';

interface ScoreCardProps {
  title: string;
  /** For 'percentage', pass the percent number (45.2 for 45.2%). */
  value: number | null;
  format: ScoreFormat;
  period?: string | null;
  tone?: ToneName;
  trend?: number[];
  delta?: string;
  seed?: number;
  drawDelay?: number;
}

function formatScore(value: number, format: ScoreFormat): string {
  if (format === 'currency') return money(value, 1);
  if (format === 'percentage') return `${value.toFixed(2)}%`;
  return value.toFixed(2);
}

export default function ScoreCard({ title, value, format, period, tone = 'violet', trend, delta, seed, drawDelay }: ScoreCardProps) {
  return (
    <EngravedScoreCard
      label={title}
      value={value === null ? '—' : formatScore(value, format)}
      period={period ?? undefined}
      tone={tone}
      trend={trend}
      delta={delta}
      seed={seed}
      drawDelay={drawDelay}
    />
  );
}
