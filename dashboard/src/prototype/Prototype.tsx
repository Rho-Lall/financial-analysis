import { useMemo, useState } from 'react';
import { EngravedBarChart, type BarDatum, type BarSeries } from '../engraving/EngravedBarChart';
import { WobblyPanel } from '../engraving/WobblyPanel';
import { HatchSwatch } from '../engraving/HatchSwatch';
import { EngravedSankey, type FlowLink, type FlowNode } from '../engraving/EngravedSankey';
import { EngravedScoreCard } from '../engraving/EngravedScoreCard';
import { HandRule } from '../engraving/HandRule';
import { HandSelect, HandTabs } from '../engraving/HandNav';
import type { ToneName } from '../engraving/palette';

type Page = 'income' | 'balance' | 'cashflow';
const tabs: { key: Page; label: string }[] = [
  { key: 'income', label: 'Income Statement' },
  { key: 'balance', label: 'Balance Sheet' },
  { key: 'cashflow', label: 'Cash Flow' },
];

interface Kpi {
  label: string;
  value: string;
  tone: ToneName;
  trend: number[];
  delta: string;
}

// Sample KPIs per page. Headline metrics in the violet accent, cost-type metrics in grey.
const kpis: Record<Page, Kpi[]> = {
  income: [
    { label: 'Gross Margin', value: '45.2%', tone: 'violet', trend: [43.1, 43.8, 44.5, 44.1, 45.9, 46.2, 45.0, 45.2], delta: '+0.2 pts vs Q3' },
    { label: 'Operating Margin', value: '31.5%', tone: 'violet', trend: [29.8, 28.9, 30.2, 30.6, 31.9, 31.0, 30.7, 31.5], delta: '+0.8 pts vs Q3' },
    { label: 'Revenue Growth YoY', value: '6.07%', tone: 'violet', trend: [-2.5, -1.4, -0.7, 2.1, -4.3, 4.9, 6.1, 6.07], delta: 'flat vs Q3' },
  ],
  balance: [
    { label: 'Total Assets', value: '$411.2B', tone: 'violet', trend: [352, 335, 352, 353, 337, 331, 365, 411], delta: '+12.6% vs Q3' },
    { label: 'Debt-to-Equity', value: '1.24', tone: 'greyDeep', trend: [1.9, 1.8, 1.7, 1.6, 1.5, 1.4, 1.3, 1.24], delta: '−0.06 vs Q3' },
  ],
  cashflow: [
    { label: 'Operating Cash Flow', value: '$29.0B', tone: 'violet', trend: [24.0, 26.4, 28.6, 21.6, 22.7, 28.9, 26.8, 29.0], delta: '+8.2% vs Q3' },
    { label: 'Free Cash Flow', value: '$25.6B', tone: 'violet', trend: [20.1, 23.5, 25.7, 19.4, 20.6, 26.0, 23.9, 25.6], delta: '+7.1% vs Q3' },
    { label: 'FCF Margin', value: '20.65%', tone: 'violet', trend: [17.2, 19.9, 21.0, 18.8, 19.5, 21.4, 20.1, 20.65], delta: '+0.5 pts vs Q3' },
    { label: 'CapEx', value: '$3.4B', tone: 'greyDeep', trend: [3.8, 2.9, 2.9, 2.2, 2.1, 2.9, 2.9, 3.4], delta: '+17% vs Q3' },
  ],
};

// Sample data shaped like the Pencil design (billions). Not real filings.
const sample: BarDatum[] = [
  ["Q1'23", 7.2, 12.5, 3.9],
  ["Q2'23", 6.6, 11.7, 3.6],
  ["Q3'23", 7.8, 13.0, 4.2],
  ["Q4'23", 9.2, 15.0, 4.5],
  ["Q1'24", 7.5, 12.8, 3.9],
  ["Q2'24", 7.2, 12.3, 3.7],
  ["Q3'24", 8.4, 13.6, 4.4],
  ["Q4'24", 9.4, 15.3, 4.7],
].map(([label, opInc, cost, opex]) => ({
  label: label as string,
  values: { opInc: opInc as number, cost: cost as number, opex: opex as number },
}));

const series: BarSeries[] = [
  { key: 'opex', label: 'Operating Expenses', tone: 'greyDeep' },
  { key: 'cost', label: 'Cost of Revenue', tone: 'greyLight' },
  { key: 'opInc', label: 'Operating Income', tone: 'violet' },
];

// Sample income flow for one quarter (billions). Not real filings.
const flowNodes: FlowNode[] = [
  { id: 'rev', label: 'Revenue', tone: 'money' },
  { id: 'gp', label: 'Gross Profit', tone: 'money' },
  { id: 'oi', label: 'Operating Income', tone: 'money' },
  { id: 'ni', label: 'Net Income', tone: 'money' },
  { id: 'tax', label: 'Income Tax', tone: 'lossRed' },
  { id: 'opex', label: 'Operating Expenses', tone: 'lossRed' },
  { id: 'cogs', label: 'Cost of Revenue', tone: 'lossRed' },
];
const flowLinks: FlowLink[] = [
  { source: 'rev', target: 'gp', value: 58.3 },
  { source: 'rev', target: 'cogs', value: 66.0 },
  { source: 'gp', target: 'oi', value: 42.8 },
  { source: 'gp', target: 'opex', value: 15.5 },
  { source: 'oi', target: 'ni', value: 36.3 },
  { source: 'oi', target: 'tax', value: 6.5 },
];

export function Prototype() {
  const [seed, setSeed] = useState(7);
  const [run, setRun] = useState(0);
  const [page, setPage] = useState<Page>('income');
  const [ticker, setTicker] = useState('AAPL');
  const legend = useMemo(() => [...series].reverse(), []);

  return (
    <main className="proto" key={run}>
      <header className="proto-header">
        <img className="proto-logo" src={`${import.meta.env.BASE_URL}images/rho_lall_logo_.png`} alt="Rho Lall" />
        <div className="proto-tagline">FINANCIAL INTELLIGENCE</div>
      </header>
      <HandRule seed={3} drawDelay={0} />

      <nav className="proto-nav">
        <HandTabs tabs={tabs} active={page} onChange={setPage} drawDelay={150} />
        <HandSelect
          label="Company"
          value={ticker}
          onChange={setTicker}
          options={[
            { value: 'AAPL', label: 'Apple Inc. (AAPL)' },
            { value: 'CAT', label: 'Caterpillar Inc. (CAT)' },
          ]}
          drawDelay={500}
        />
      </nav>
      <HandRule seed={5} opacity={0.32} drawDelay={300} />

      <section className="proto-kpis" key={page}>
        {kpis[page].map((k, i) => (
          <EngravedScoreCard
            key={k.label}
            label={k.label}
            value={k.value}
            period="2024 Q4"
            tone={k.tone}
            trend={k.trend}
            delta={k.delta}
            seed={41 + i * 9}
            drawDelay={400 + i * 180}
          />
        ))}
      </section>

      <WobblyPanel seed={11}>
        <div className="proto-chart-head">
          <h2>Revenue Composition</h2>
          <ul className="proto-legend">
            {legend.map((s) => (
              <li key={s.key}>
                <HatchSwatch tone={s.tone} seed={s.key.length * 13} />
                {s.label}
              </li>
            ))}
          </ul>
        </div>
        <EngravedBarChart key={`${seed}-${run}`} data={sample} series={series} seed={seed} />
      </WobblyPanel>

      <div style={{ height: 24 }} />

      <WobblyPanel seed={23}>
        <div className="proto-chart-head">
          <h2>Income Flow — Q4 2024</h2>
        </div>
        <EngravedSankey key={`${seed}-${run}`} nodes={flowNodes} links={flowLinks} seed={seed} />
      </WobblyPanel>

      <div className="proto-controls">
        <button onClick={() => setSeed((s) => s + 1)}>Redraw</button>
        <button onClick={() => setRun((r) => r + 1)}>Replay</button>
        <span className="proto-note">Sample data · tabs swap KPI cards only · seed {seed}</span>
      </div>
    </main>
  );
}
