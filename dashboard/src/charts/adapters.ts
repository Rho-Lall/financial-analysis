/**
 * Turn long-format dbt export rows into the shapes the engraved charts take.
 */
import type { BarDatum } from '../engraving/EngravedBarChart';
import type { FlowLink, FlowNode } from '../engraving/EngravedSankey';
import type { FinancialDataPoint, FinancialMetric } from '../types/financial';

export const periodKey = (d: { fiscal_year: number; fiscal_quarter: number }) => `${d.fiscal_year} Q${d.fiscal_quarter}`;

/** "2024 Q4" -> "Q4'24" */
export const shortPeriod = (p: string) => {
  const [y, q] = p.split(' ');
  return `${q}'${y.slice(2)}`;
};

export const sortedPeriods = (rows: { fiscal_year: number; fiscal_quarter: number }[]) =>
  Array.from(new Set(rows.map(periodKey))).sort();

export const latestPeriod = (rows: { fiscal_year: number; fiscal_quarter: number }[]) => {
  const p = sortedPeriods(rows);
  return p.length ? p[p.length - 1] : null;
};

/**
 * Value of one account per period. Where an account appears more than once in a
 * period, the largest absolute amount wins (the summary row, not line items).
 */
export function accountByPeriod(rows: FinancialDataPoint[], account: string): Map<string, number> {
  const out = new Map<string, number>();
  for (const r of rows) {
    if (r.gl_account !== account) continue;
    const k = periodKey(r);
    const prev = out.get(k);
    if (prev === undefined || Math.abs(r.amount) > Math.abs(prev)) out.set(k, r.amount);
  }
  return out;
}

/** Build stacked bars: one bar per period, one value per series key (absolute values, negatives dropped to 0). */
export function stackedBars(rows: FinancialDataPoint[], accounts: Record<string, (period: string) => number | undefined>): BarDatum[] {
  return sortedPeriods(rows)
    .map((label) => {
      const values: Record<string, number> = {};
      for (const [key, get] of Object.entries(accounts)) values[key] = Math.max(0, get(label) ?? 0);
      return { label, values };
    })
    .filter((d) => Object.values(d.values).some((v) => v > 0));
}

/** Metric values keyed by period. */
export function metricByPeriod(metrics: FinancialMetric[], name: string): Map<string, number> {
  const out = new Map<string, number>();
  for (const m of metrics) if (m.metric_name === name) out.set(periodKey(m), m.value);
  return out;
}

/** Value at `period`, or the most recent value before it. Returns the period actually used. */
export function valueAt(series: Map<string, number>, period: string | null): { value: number | null; period: string | null } {
  const keys = Array.from(series.keys()).sort().filter((k) => !period || k <= period);
  const k = keys[keys.length - 1];
  return k ? { value: series.get(k) as number, period: k } : { value: null, period: null };
}

/** Last n values (oldest first) up to and including `period`, for sparklines. */
export function trendUpTo(series: Map<string, number>, period: string | null, n = 8): number[] {
  const keys = Array.from(series.keys()).sort().filter((k) => !period || k <= period);
  return keys.slice(-n).map((k) => series.get(k) as number);
}

/** Change vs the prior quarter in the series, as a short note. */
export function deltaNote(series: Map<string, number>, period: string | null, kind: 'pts' | 'pct' | 'abs'): string | undefined {
  const keys = Array.from(series.keys()).sort().filter((k) => !period || k <= period);
  if (keys.length < 2) return undefined;
  const cur = series.get(keys[keys.length - 1]) as number;
  const prev = series.get(keys[keys.length - 2]) as number;
  const prevLabel = shortPeriod(keys[keys.length - 2]);
  const diff = cur - prev;
  const sign = diff > 0 ? '+' : diff < 0 ? '−' : '';
  if (kind === 'pts') return Math.abs(diff) < 0.05 ? `flat vs ${prevLabel}` : `${sign}${Math.abs(diff).toFixed(1)} pts vs ${prevLabel}`;
  if (kind === 'abs') return `${sign}${Math.abs(diff).toFixed(2)} vs ${prevLabel}`;
  if (!prev) return undefined;
  const pct = (diff / Math.abs(prev)) * 100;
  return `${sign}${Math.abs(pct).toFixed(1)}% vs ${prevLabel}`;
}

/**
 * Income flow for one period: Revenue -> Cost of Revenue + Gross Profit ->
 * Operating Expenses + Operating Income -> Income Tax + Net Income.
 * Downstream values are derived so the diagram always balances.
 */
export function incomeFlow(rows: FinancialDataPoint[], period: string): { nodes: FlowNode[]; links: FlowLink[] } | null {
  const get = (acct: string) => accountByPeriod(rows, acct).get(period);
  const revenue = Math.abs(get('Revenue') ?? 0);
  if (!revenue) return null;
  const cost = Math.min(revenue, Math.abs(get('Cost of Revenue') ?? 0));
  const gross = revenue - cost;
  const opexTotal = get('Operating Expenses');
  const opex = Math.min(
    gross,
    Math.abs(opexTotal ?? (get('R&D Expense') ?? 0) + (get('SG&A Expense') ?? 0)),
  );
  const opInc = gross - opex;
  const tax = Math.min(opInc, Math.abs(get('Income Tax Expense') ?? 0));
  const net = opInc - tax;

  const nodes: FlowNode[] = [
    { id: 'rev', label: 'Revenue', tone: 'money' },
    { id: 'gp', label: 'Gross Profit', tone: 'money' },
    { id: 'oi', label: 'Operating Income', tone: 'money' },
    { id: 'ni', label: 'Net Income', tone: 'money' },
    { id: 'tax', label: 'Income Tax', tone: 'lossRed' },
    { id: 'opex', label: 'Operating Expenses', tone: 'lossRed' },
    { id: 'cogs', label: 'Cost of Revenue', tone: 'lossRed' },
  ];
  const links: FlowLink[] = [
    { source: 'rev', target: 'gp', value: gross },
    { source: 'rev', target: 'cogs', value: cost },
    { source: 'gp', target: 'oi', value: opInc },
    { source: 'gp', target: 'opex', value: opex },
    { source: 'oi', target: 'ni', value: net },
    { source: 'oi', target: 'tax', value: tax },
  ].filter((l) => l.value > 0);
  const used = new Set(links.flatMap((l) => [l.source, l.target]));
  return { nodes: nodes.filter((n) => used.has(n.id)), links };
}

/** "$12.3B" style money formatting. */
export function money(v: number, digits = 1): string {
  const a = Math.abs(v);
  const sign = v < 0 ? '−' : '';
  if (a >= 1e12) return `${sign}$${(a / 1e12).toFixed(digits)}T`;
  if (a >= 1e9) return `${sign}$${(a / 1e9).toFixed(digits)}B`;
  if (a >= 1e6) return `${sign}$${(a / 1e6).toFixed(digits)}M`;
  if (a >= 1e3) return `${sign}$${(a / 1e3).toFixed(digits)}K`;
  return `${sign}$${a.toFixed(0)}`;
}
