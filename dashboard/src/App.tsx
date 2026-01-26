import { useState } from 'react';
import './App.css';
import Header from './components/Header';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import ScoreCard from './components/ScoreCard';
import StackedBarChart from './components/StackedBarChart';
import SankeyDiagram from './components/SankeyDiagram';
import QuarterlyDetail from './components/QuarterlyDetail';
import { useFinancialData } from './hooks/useFinancialData';

function App() {
  const [currentPage, setCurrentPage] = useState<'income' | 'balance' | 'cashflow'>('income');
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const {
    companies,
    selectedCompany,
    setSelectedTicker,
    incomeStatement,
    balanceSheet,
    cashFlow,
    financialMetrics,
    loading,
    error
  } = useFinancialData();

  // Helper to get the latest metric value by name
  const getLatestMetric = (metricName: string) => {
    const metrics = financialMetrics
      .filter((m) => m.metric_name === metricName)
      .sort((a, b) => new Date(b.period_end_date).getTime() - new Date(a.period_end_date).getTime());
    return metrics[0] || null;
  };

  // Helper to get metric by period (e.g., "2024 Q4")
  const getMetricByPeriod = (metricName: string, period: string | null) => {
    if (!period) return getLatestMetric(metricName);

    const [yearStr, quarterStr] = period.split(' ');
    const year = parseInt(yearStr);
    const quarter = parseInt(quarterStr.substring(1));

    const metrics = financialMetrics
      .filter((m) => m.metric_name === metricName && m.fiscal_year === year && m.fiscal_quarter === quarter)
      .sort((a, b) => new Date(b.period_end_date).getTime() - new Date(a.period_end_date).getTime());
    return metrics[0] || null;
  };

  // Get most recent period from income statement data
  const getMostRecentIncomePeriod = () => {
    if (incomeStatement.length === 0) return null;
    const periods = Array.from(new Set(incomeStatement.map(d => `${d.fiscal_year} Q${d.fiscal_quarter}`))).sort();
    return periods[periods.length - 1];
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <p style={{ fontSize: '1.2rem', color: '#666' }}>Loading financial data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', flexDirection: 'column' }}>
        <p style={{ fontSize: '1.2rem', color: '#ef4444', marginBottom: '1rem' }}>Error loading data</p>
        <p style={{ fontSize: '0.9rem', color: '#666' }}>{error.message}</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#e5e5e5', padding: '0' }}>
      <div className="page-container">
        <Header selectedCompany={selectedCompany} />
        <Navigation
          currentPage={currentPage}
          onNavigate={(page) => setCurrentPage(page as 'income' | 'balance' | 'cashflow')}
          companies={companies}
          selectedCompany={selectedCompany}
          onCompanyChange={setSelectedTicker}
        />

        <main className="responsive-container" style={{ paddingTop: '1.5rem', paddingBottom: '2rem' }}>
        {currentPage === 'income' && incomeStatement.length > 0 && (
          <div>
            {(() => {
              // Get the active period (selected or most recent)
              const activePeriod = selectedPeriod || getMostRecentIncomePeriod();

              // Get metrics for the active period
              const grossMargin = getMetricByPeriod('Gross Margin', activePeriod);
              const operatingMargin = getMetricByPeriod('Operating Margin', activePeriod);
              const revenueGrowth = getMetricByPeriod('Revenue Growth YoY', activePeriod);

              // Group by period and calculate totals for bar chart
              const periodMap = new Map();

              incomeStatement.forEach(d => {
                const periodKey = `${d.fiscal_year} Q${d.fiscal_quarter}`;

                if (!periodMap.has(periodKey)) {
                  periodMap.set(periodKey, {
                    period_end_date: d.period_end_date,
                    fiscal_year: d.fiscal_year,
                    fiscal_quarter: d.fiscal_quarter,
                    operatingIncome: 0,
                    costOfRevenue: 0,
                    operatingExpenses: 0
                  });
                }

                const period = periodMap.get(periodKey);

                // Take max absolute value (the total/summary row, not granular items)
                if (d.gl_account === 'Operating Income') {
                  if (Math.abs(d.amount) > Math.abs(period.operatingIncome)) {
                    period.operatingIncome = d.amount;
                  }
                } else if (d.gl_account === 'Cost of Revenue') {
                  if (Math.abs(d.amount) > Math.abs(period.costOfRevenue)) {
                    period.costOfRevenue = d.amount;
                  }
                } else if (d.gl_account === 'Operating Expenses') {
                  if (Math.abs(d.amount) > Math.abs(period.operatingExpenses)) {
                    period.operatingExpenses = d.amount;
                  }
                }
              });

              // Convert to array format expected by StackedBarChart
              // Order matters: items are stacked from bottom to top in the order they appear
              const chartData: typeof incomeStatement = [];
              periodMap.forEach((period) => {
                if (period.operatingExpenses > 0) {
                  chartData.push({
                    gl_number: 6000,
                    gl_account: 'Operating Expenses',
                    period_end_date: period.period_end_date,
                    fiscal_year: period.fiscal_year,
                    fiscal_quarter: period.fiscal_quarter,
                    amount: period.operatingExpenses
                  });
                }
                if (period.costOfRevenue > 0) {
                  chartData.push({
                    gl_number: 4010,
                    gl_account: 'Cost of Revenue',
                    period_end_date: period.period_end_date,
                    fiscal_year: period.fiscal_year,
                    fiscal_quarter: period.fiscal_quarter,
                    amount: period.costOfRevenue
                  });
                }
                if (period.operatingIncome > 0) {
                  chartData.push({
                    gl_number: 9000,
                    gl_account: 'Operating Income',
                    period_end_date: period.period_end_date,
                    fiscal_year: period.fiscal_year,
                    fiscal_quarter: period.fiscal_quarter,
                    amount: period.operatingIncome
                  });
                }
              });

              return (
                <>
                  {/* Scorecards - dynamic based on selected period */}
                  <div className="scorecard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                    <ScoreCard
                      title={`Gross Margin${activePeriod ? ` (${activePeriod})` : ''}`}
                      value={(grossMargin?.value ?? 0) / 100}
                      format="percentage"
                    />
                    <ScoreCard
                      title={`Operating Margin${activePeriod ? ` (${activePeriod})` : ''}`}
                      value={(operatingMargin?.value ?? 0) / 100}
                      format="percentage"
                    />
                    <ScoreCard
                      title={`Revenue Growth YoY${activePeriod ? ` (${activePeriod})` : ''}`}
                      value={(revenueGrowth?.value ?? 0) / 100}
                      format="percentage"
                    />
                  </div>

                  {/* Stacked Bar Chart with Quarterly Detail */}
                  <div className="chart-detail-row" style={{ marginBottom: '2rem', display: 'flex', gap: '1.5rem', alignItems: 'stretch' }}>
                    <div style={{ flex: '2', background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '1.5rem', minHeight: '400px', boxSizing: 'border-box' }}>
                      <StackedBarChart
                        data={chartData}
                        width={600}
                        height={340}
                        colors={['#d4a017', '#f4c430', '#5a4a8a']}
                        onPeriodHover={setSelectedPeriod}
                      />
                    </div>
                    <div style={{ flex: '1' }}>
                      <QuarterlyDetail
                        data={incomeStatement}
                        selectedPeriod={selectedPeriod}
                      />
                    </div>
                  </div>

                  {/* Sankey Diagram */}
                  <div style={{ marginBottom: '2rem', background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <SankeyDiagram
                      data={incomeStatement}
                      selectedPeriod={selectedPeriod}
                      width={1000}
                      height={167}
                    />
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {currentPage === 'balance' && balanceSheet.length > 0 && (
          <div>
            {/* Two-column layout: Left (scorecards + chart) and Right (quarterly detail) */}
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', marginBottom: '2rem' }}>
              {/* Left column: Scorecards + Bar Chart */}
              {(() => {
                // Get the most recent period from balance sheet data
                const getMostRecentBalancePeriod = () => {
                  const periods = Array.from(new Set(balanceSheet.map(d => `${d.fiscal_year} Q${d.fiscal_quarter}`))).sort();
                  return periods[periods.length - 1];
                };

                // Get the active period (selected or most recent)
                const activePeriod = selectedPeriod || getMostRecentBalancePeriod();

                // Parse active period for filtering
                const [activeYear, activeQuarterStr] = activePeriod ? activePeriod.split(' ') : ['', ''];
                const activeYearNum = parseInt(activeYear);
                const activeQuarterNum = parseInt(activeQuarterStr?.substring(1) || '0');

                // Get Total Assets for the active period
                const activePeriodData = balanceSheet.filter(
                  d => d.fiscal_year === activeYearNum && d.fiscal_quarter === activeQuarterNum
                );
                const totalAssetsValue = activePeriodData.find(d => d.gl_account === 'Total Assets')?.amount ?? 0;

                // Get metrics for active period, falling back to most recent if not available
                const debtToEquityMetric = getMetricByPeriod('Debt to Equity', activePeriod) || getLatestMetric('Debt to Equity');

                // Aggregate balance sheet data into Equity and Liabilities for bar chart
                const periodMap = new Map();

                balanceSheet.forEach(d => {
                  const periodKey = `${d.fiscal_year} Q${d.fiscal_quarter}`;

                  if (!periodMap.has(periodKey)) {
                    periodMap.set(periodKey, {
                      period_end_date: d.period_end_date,
                      fiscal_year: d.fiscal_year,
                      fiscal_quarter: d.fiscal_quarter,
                      totalAssets: 0,
                      totalLiabilities: 0,
                      totalEquity: 0
                    });
                  }

                  const period = periodMap.get(periodKey);

                  // Use the total accounts from actual data
                  if (d.gl_account === 'Total Assets') {
                    period.totalAssets = d.amount;
                  } else if (d.gl_account === 'Total Liabilities') {
                    period.totalLiabilities = d.amount;
                  }
                });

                // Calculate equity as Assets - Liabilities for each period
                periodMap.forEach((period) => {
                  period.totalEquity = period.totalAssets - period.totalLiabilities;
                });

                // Convert to array format for StackedBarChart
                const chartData: typeof balanceSheet = [];
                periodMap.forEach((period) => {
                  if (period.totalLiabilities > 0) {
                    chartData.push({
                      gl_number: 2000,
                      gl_account: 'Total Liabilities',
                      period_end_date: period.period_end_date,
                      fiscal_year: period.fiscal_year,
                      fiscal_quarter: period.fiscal_quarter,
                      amount: period.totalLiabilities
                    });
                  }
                  if (period.totalEquity > 0) {
                    chartData.push({
                      gl_number: 3000,
                      gl_account: 'Total Equity',
                      period_end_date: period.period_end_date,
                      fiscal_year: period.fiscal_year,
                      fiscal_quarter: period.fiscal_quarter,
                      amount: period.totalEquity
                    });
                  }
                });

                // Build debt-to-equity line data from financial metrics
                const debtToEquityData = financialMetrics
                  .filter(m => m.metric_name === 'Debt to Equity')
                  .map(m => ({
                    period: `${m.fiscal_year} Q${m.fiscal_quarter}`,
                    value: m.value
                  }))
                  .sort((a, b) => a.period.localeCompare(b.period));

                return (
                  <div style={{ flex: '2' }}>
                    {/* Scorecard Row */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                      <ScoreCard
                        title={`Total Assets${activePeriod ? ` (${activePeriod})` : ''}`}
                        value={totalAssetsValue}
                        format="currency"
                      />
                      <ScoreCard
                        title={`Debt-to-Equity${activePeriod ? ` (${activePeriod})` : ''}`}
                        value={debtToEquityMetric?.value ?? 0}
                        format="ratio"
                      />
                    </div>
                    {/* Bar Chart */}
                    <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '1.5rem', height: '640px', boxSizing: 'border-box' }}>
                      <StackedBarChart
                        data={chartData}
                        width={600}
                        height={580}
                        colors={['#f4c430', '#5a4a8a']}
                        onPeriodHover={setSelectedPeriod}
                        lineOverlay={debtToEquityData.length > 0 ? {
                          data: debtToEquityData,
                          color: '#ef4444',
                          label: 'Debt-to-Equity'
                        } : undefined}
                      />
                    </div>
                  </div>
                );
              })()}
              {/* Right column: Quarterly Detail - height matches scorecards + margin + bar chart */}
              <div style={{ flex: '1', height: '740px' }}>
                <QuarterlyDetail
                  data={balanceSheet}
                  selectedPeriod={selectedPeriod}
                />
              </div>
            </div>

            {/* Data Table */}
          </div>
        )}

        {currentPage === 'cashflow' && cashFlow.length > 0 && (
          <div>
            {/* Two-column layout: Left (scorecards + chart) and Right (quarterly detail) */}
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', marginBottom: '2rem' }}>
              {/* Left column: Scorecards + Bar Chart */}
              {(() => {
                // Get the most recent period from cash flow data
                const getMostRecentCashFlowPeriod = () => {
                  const periods = Array.from(new Set(cashFlow.map(d => `${d.fiscal_year} Q${d.fiscal_quarter}`))).sort();
                  return periods[periods.length - 1];
                };

                // Get the active period (selected or most recent)
                const activePeriod = selectedPeriod || getMostRecentCashFlowPeriod();

                // Parse active period for filtering
                const [activeYear, activeQuarterStr] = activePeriod ? activePeriod.split(' ') : ['', ''];
                const activeYearNum = parseInt(activeYear);
                const activeQuarterNum = parseInt(activeQuarterStr?.substring(1) || '0');

                // Get values for the active period
                const activePeriodData = cashFlow.filter(
                  d => d.fiscal_year === activeYearNum && d.fiscal_quarter === activeQuarterNum
                );
                const operatingCashFlowValue = activePeriodData.find(d => d.gl_account === 'Operating Cash Flow')?.amount ?? 0;
                const capExValue = activePeriodData.find(d => d.gl_account === 'CapEx')?.amount ?? 0;
                const freeCashFlow = operatingCashFlowValue - capExValue;

                // Get FCF Margin for active period
                const fcfMarginMetric = getMetricByPeriod('FCF Margin', activePeriod);

                // Build chart data with Operating Cash Flow, CapEx, and Proceeds from Sale of P&E
                const periodMap = new Map();

                cashFlow.forEach(d => {
                  const periodKey = `${d.fiscal_year} Q${d.fiscal_quarter}`;

                  if (!periodMap.has(periodKey)) {
                    periodMap.set(periodKey, {
                      period_end_date: d.period_end_date,
                      fiscal_year: d.fiscal_year,
                      fiscal_quarter: d.fiscal_quarter,
                      operating: 0,
                      capex: 0,
                      proceeds: 0
                    });
                  }

                  const period = periodMap.get(periodKey);

                  if (d.gl_account === 'Operating Cash Flow') {
                    period.operating = d.amount;
                  } else if (d.gl_account === 'CapEx') {
                    period.capex = d.amount;
                  } else if (d.gl_account === 'Proceeds from Sale of Plant and Equipment') {
                    period.proceeds = d.amount;
                  }
                });

                // Convert to array format for StackedBarChart
                const chartData: typeof cashFlow = [];
                periodMap.forEach((period) => {
                  // Stack: Proceeds (bottom), CapEx (middle), Operating (top)
                  if (period.proceeds !== 0) {
                    chartData.push({
                      gl_number: 7220,
                      gl_account: 'Proceeds from Sale of P&E',
                      period_end_date: period.period_end_date,
                      fiscal_year: period.fiscal_year,
                      fiscal_quarter: period.fiscal_quarter,
                      amount: Math.abs(period.proceeds)
                    });
                  }
                  if (period.capex !== 0) {
                    chartData.push({
                      gl_number: 7210,
                      gl_account: 'CapEx',
                      period_end_date: period.period_end_date,
                      fiscal_year: period.fiscal_year,
                      fiscal_quarter: period.fiscal_quarter,
                      amount: Math.abs(period.capex)
                    });
                  }
                  if (period.operating !== 0) {
                    chartData.push({
                      gl_number: 7100,
                      gl_account: 'Operating Cash Flow',
                      period_end_date: period.period_end_date,
                      fiscal_year: period.fiscal_year,
                      fiscal_quarter: period.fiscal_quarter,
                      amount: period.operating
                    });
                  }
                });

                return (
                  <div style={{ flex: '2' }}>
                    {/* 2x2 Scorecard Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                      <ScoreCard
                        title={`Operating Cash Flow${activePeriod ? ` (${activePeriod})` : ''}`}
                        value={operatingCashFlowValue}
                        format="currency"
                      />
                      <ScoreCard
                        title={`Free Cash Flow${activePeriod ? ` (${activePeriod})` : ''}`}
                        value={freeCashFlow}
                        format="currency"
                      />
                      <ScoreCard
                        title={`FCF Margin${activePeriod ? ` (${activePeriod})` : ''}`}
                        value={(fcfMarginMetric?.value ?? 0) / 100}
                        format="percentage"
                      />
                      <ScoreCard
                        title={`CapEx${activePeriod ? ` (${activePeriod})` : ''}`}
                        value={capExValue}
                        format="currency"
                      />
                    </div>
                    {/* Bar Chart */}
                    <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '1.5rem', height: '550px', boxSizing: 'border-box' }}>
                      <StackedBarChart
                        data={chartData}
                        width={600}
                        height={490}
                        colors={['#d4a017', '#f4c430', '#5a4a8a']}
                        onPeriodHover={setSelectedPeriod}
                      />
                    </div>
                  </div>
                );
              })()}
              {/* Right column: Quarterly Detail - height matches scorecards + margin + bar chart */}
              <div style={{ flex: '1', height: '740px' }}>
                <QuarterlyDetail
                  data={cashFlow}
                  selectedPeriod={selectedPeriod}
                />
              </div>
            </div>

            {/* Data Table */}
          </div>
        )}
        </main>

        <Footer dataSource={selectedCompany?.data_source} />
      </div>
    </div>
  );
}

export default App;
