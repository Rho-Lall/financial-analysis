import { useMemo, useState } from 'react';
import './App.css';
import Header from './components/Header';
import Navigation, { type Page } from './components/Navigation';
import Footer from './components/Footer';
import LineageButton from './components/LineageButton';
import ScoreCard from './components/ScoreCard';
import QuarterlyDetail from './components/QuarterlyDetail';
import { ChartPanel } from './charts/ChartPanel';
import { EngravedBarChart, type BarSeries } from './engraving/EngravedBarChart';
import { EngravedSankey } from './engraving/EngravedSankey';
import { palette } from './engraving/palette';
import {
  accountByPeriod,
  deltaNote,
  incomeFlow,
  latestPeriod,
  metricByPeriod,
  money,
  shortPeriod,
  stackedBars,
  trendUpTo,
  valueAt,
} from './charts/adapters';
import { useFinancialData } from './hooks/useFinancialData';

const SEED = 7;

// Bottom-to-top stacking order for each page's bar chart.
const incomeSeries: BarSeries[] = [
  { key: 'opex', label: 'Operating Expenses', tone: 'ash' },
  { key: 'cost', label: 'Cost of Revenue', tone: 'offWhite' },
  { key: 'opInc', label: 'Operating Income', tone: 'violet' },
];
const balanceSeries: BarSeries[] = [
  { key: 'liabilities', label: 'Total Liabilities', tone: 'offWhite' },
  { key: 'equity', label: 'Total Equity', tone: 'violet' },
];
const cashSeries: BarSeries[] = [
  { key: 'capex', label: 'CapEx', tone: 'offWhite' },
  { key: 'fcf', label: 'Free Cash Flow', tone: 'violet' },
];

const pages: Page[] = ['income', 'balance', 'cashflow'];
const initialPage = (): Page => {
  const p = new URLSearchParams(window.location.search).get('page');
  return pages.includes(p as Page) ? (p as Page) : 'income';
};

const legendFor = (series: BarSeries[]) => [...series].reverse().map((s) => ({ label: s.label, tone: s.tone }));

function App() {
  const [currentPage, setCurrentPage] = useState<Page>(initialPage);
  const [hoveredPeriod, setHoveredPeriod] = useState<string | null>(null);
  // A clicked bar locks the period until it's clicked again (or Escape / click on empty chart).
  const [lockedPeriod, setLockedPeriod] = useState<string | null>(null);
  const { companies, selectedCompany, setSelectedTicker, incomeStatement, balanceSheet, cashFlow, financialMetrics, loading, error } =
    useFinancialData();

  const metric = useMemo(
    () => ({
      grossMargin: metricByPeriod(financialMetrics, 'Gross Margin'),
      operatingMargin: metricByPeriod(financialMetrics, 'Operating Margin'),
      revenueGrowth: metricByPeriod(financialMetrics, 'Revenue Growth YoY'),
      debtToEquity: metricByPeriod(financialMetrics, 'Debt to Equity'),
      currentRatio: metricByPeriod(financialMetrics, 'Current Ratio'),
      fcfMargin: metricByPeriod(financialMetrics, 'FCF Margin'),
    }),
    [financialMetrics],
  );

  const income = useMemo(() => {
    const opex = accountByPeriod(incomeStatement, 'Operating Expenses');
    const cost = accountByPeriod(incomeStatement, 'Cost of Revenue');
    const opInc = accountByPeriod(incomeStatement, 'Operating Income');
    return {
      bars: stackedBars(incomeStatement, { opex: (p) => opex.get(p), cost: (p) => cost.get(p), opInc: (p) => opInc.get(p) }),
      latest: latestPeriod(incomeStatement),
    };
  }, [incomeStatement]);

  const balance = useMemo(() => {
    const assets = accountByPeriod(balanceSheet, 'Total Assets');
    const liabilities = accountByPeriod(balanceSheet, 'Total Liabilities');
    return {
      assets,
      bars: stackedBars(balanceSheet, {
        liabilities: (p) => liabilities.get(p),
        equity: (p) => {
          const a = assets.get(p);
          const l = liabilities.get(p);
          return a !== undefined && l !== undefined ? a - l : undefined;
        },
      }),
      latest: latestPeriod(balanceSheet),
    };
  }, [balanceSheet]);

  const cash = useMemo(() => {
    const ocf = accountByPeriod(cashFlow, 'Operating Cash Flow');
    const capex = accountByPeriod(cashFlow, 'CapEx');
    const fcf = new Map<string, number>();
    for (const [p, v] of ocf) fcf.set(p, v - Math.abs(capex.get(p) ?? 0));
    const capexAbs = new Map(Array.from(capex, ([p, v]) => [p, Math.abs(v)]));
    return {
      ocf,
      capex: capexAbs,
      fcf,
      bars: stackedBars(cashFlow, { capex: (p) => capexAbs.get(p), fcf: (p) => fcf.get(p) }),
      latest: latestPeriod(cashFlow),
    };
  }, [cashFlow]);

  const dteLine = useMemo(
    () => ({ label: 'Debt-to-Equity', values: Object.fromEntries(metric.debtToEquity), color: palette.accent }),
    [metric.debtToEquity],
  );

  if (loading) {
    return (
      <div className="site-status">
        <p>Loading financial data…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="site-status">
        <p className="site-status-error">Error loading data</p>
        <p>{error.message}</p>
      </div>
    );
  }

  // Replay the drawing when the page or company changes.
  const drawKey = `${currentPage}-${selectedCompany?.ticker ?? ''}`;
  const latestFor = { income: income.latest, balance: balance.latest, cashflow: cash.latest }[currentPage];
  const period = lockedPeriod ?? hoveredPeriod ?? latestFor;

  const kpiDelay = (i: number) => 400 + i * 180;
  /** Value + its actual period (falls back to the latest earlier period if this one is missing). */
  const card = (series: Map<string, number>) => valueAt(series, period);

  return (
    <div className="site">
      <Header />
      <Navigation
        currentPage={currentPage}
        onNavigate={(p) => {
          setCurrentPage(p);
          setHoveredPeriod(null);
          setLockedPeriod(null);
          const url = new URL(window.location.href);
          url.searchParams.set('page', p);
          window.history.replaceState(null, '', url);
        }}
        companies={companies}
        selectedCompany={selectedCompany}
        onCompanyChange={(t) => {
          setSelectedTicker(t);
          setLockedPeriod(null);
        }}
      />

      <main className="site-main" key={drawKey}>
        {currentPage === 'income' && (
          <>
            <section className="kpi-row">
              <ScoreCard
                title="Gross Margin"
                {...card(metric.grossMargin)}
                format="percentage"

                trend={trendUpTo(metric.grossMargin, period)}
                delta={deltaNote(metric.grossMargin, period, 'pts')}
                seed={41}
                drawDelay={kpiDelay(0)}
              />
              <ScoreCard
                title="Operating Margin"
                {...card(metric.operatingMargin)}
                format="percentage"

                trend={trendUpTo(metric.operatingMargin, period)}
                delta={deltaNote(metric.operatingMargin, period, 'pts')}
                seed={50}
                drawDelay={kpiDelay(1)}
              />
              <ScoreCard
                title="Revenue Growth YoY"
                {...card(metric.revenueGrowth)}
                format="percentage"

                trend={trendUpTo(metric.revenueGrowth, period)}
                delta={deltaNote(metric.revenueGrowth, period, 'pts')}
                seed={59}
                drawDelay={kpiDelay(2)}
              />
            </section>

            <section className="chart-row">
              <ChartPanel title="Revenue Composition" legend={legendFor(incomeSeries)}>
                <EngravedBarChart
                  data={income.bars}
                  series={incomeSeries}
                  seed={SEED}
                  height={440}
                  formatValue={(v) => money(v)}
                  formatLabel={shortPeriod}
                  onHoverLabel={setHoveredPeriod}
                  selectedLabel={lockedPeriod}
                  onSelectLabel={setLockedPeriod}
                />
              </ChartPanel>
              <QuarterlyDetail title="Quarterly Breakdown" data={incomeStatement} period={period} emphasize={['Revenue', 'Operating Income']} />
            </section>

            {period && (
              <section className="flow-row">
                {(() => {
                  const flow = incomeFlow(incomeStatement, period);
                  return (
                    <ChartPanel title={`Income Flow — ${period}`} seed={23}>
                      {flow ? (
                        <EngravedSankey nodes={flow.nodes} links={flow.links} seed={SEED} formatValue={(v) => money(v)} />
                      ) : (
                        <p className="panel-empty">No revenue reported for {period}.</p>
                      )}
                    </ChartPanel>
                  );
                })()}
              </section>
            )}
          </>
        )}

        {currentPage === 'balance' && (
          <>
            <section className="kpi-row">
              <ScoreCard
                title="Total Assets"
                {...card(balance.assets)}
                format="currency"

                trend={trendUpTo(balance.assets, period)}
                delta={deltaNote(balance.assets, period, 'pct')}
                seed={41}
                drawDelay={kpiDelay(0)}
              />
              <ScoreCard
                title="Debt-to-Equity"
                {...card(metric.debtToEquity)}
                format="ratio"
                tone="ash"

                trend={trendUpTo(metric.debtToEquity, period)}
                delta={deltaNote(metric.debtToEquity, period, 'abs')}
                seed={50}
                drawDelay={kpiDelay(1)}
              />
              <ScoreCard
                title="Current Ratio"
                {...card(metric.currentRatio)}
                format="ratio"

                trend={trendUpTo(metric.currentRatio, period)}
                delta={deltaNote(metric.currentRatio, period, 'abs')}
                seed={59}
                drawDelay={kpiDelay(2)}
              />
            </section>

            <section className="chart-row">
              <ChartPanel
                title="Capital Structure"
                legend={[...legendFor(balanceSeries), { label: 'Debt-to-Equity', lineColor: palette.accent }]}
              >
                <EngravedBarChart
                  data={balance.bars}
                  series={balanceSeries}
                  seed={SEED}
                  height={500}
                  formatValue={(v) => money(v)}
                  formatLabel={shortPeriod}
                  onHoverLabel={setHoveredPeriod}
                  selectedLabel={lockedPeriod}
                  onSelectLabel={setLockedPeriod}
                  lineOverlay={dteLine}
                />
              </ChartPanel>
              <QuarterlyDetail
                title="Balance Sheet Detail"
                data={balanceSheet}
                period={period}
                emphasize={['Total Assets', 'Total Liabilities']}
              />
            </section>
          </>
        )}

        {currentPage === 'cashflow' && (
          <>
            <section className="kpi-row">
              <ScoreCard
                title="Operating Cash Flow"
                {...card(cash.ocf)}
                format="currency"

                trend={trendUpTo(cash.ocf, period)}
                delta={deltaNote(cash.ocf, period, 'pct')}
                seed={41}
                drawDelay={kpiDelay(0)}
              />
              <ScoreCard
                title="Free Cash Flow"
                {...card(cash.fcf)}
                format="currency"

                trend={trendUpTo(cash.fcf, period)}
                delta={deltaNote(cash.fcf, period, 'pct')}
                seed={50}
                drawDelay={kpiDelay(1)}
              />
              <ScoreCard
                title="FCF Margin"
                {...card(metric.fcfMargin)}
                format="percentage"

                trend={trendUpTo(metric.fcfMargin, period)}
                delta={deltaNote(metric.fcfMargin, period, 'pts')}
                seed={59}
                drawDelay={kpiDelay(2)}
              />
              <ScoreCard
                title="CapEx"
                {...card(cash.capex)}
                format="currency"
                tone="ash"

                trend={trendUpTo(cash.capex, period)}
                delta={deltaNote(cash.capex, period, 'pct')}
                seed={68}
                drawDelay={kpiDelay(3)}
              />
            </section>

            <section className="chart-row">
              <ChartPanel title="Operating Cash Flow: CapEx + Free Cash Flow" legend={legendFor(cashSeries)}>
                <EngravedBarChart
                  data={cash.bars}
                  series={cashSeries}
                  seed={SEED}
                  height={440}
                  formatValue={(v) => money(v)}
                  formatLabel={shortPeriod}
                  onHoverLabel={setHoveredPeriod}
                  selectedLabel={lockedPeriod}
                  onSelectLabel={setLockedPeriod}
                />
              </ChartPanel>
              <QuarterlyDetail
                title="Cash Flow Detail"
                data={cashFlow}
                period={period}
                emphasize={['Operating Cash Flow', 'Net Change in Cash']}
              />
            </section>
          </>
        )}
      </main>

      <Footer dataSource={selectedCompany?.data_source} lastUpdated={selectedCompany?.last_updated} />
      <LineageButton />
    </div>
  );
}

export default App;
