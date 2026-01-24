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
            {/* Scorecards */}
            <div className="scorecard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              <ScoreCard
                title="Gross Margin"
                value={(getLatestMetric('Gross Margin')?.value ?? 0) / 100}
                format="percentage"
              />
              <ScoreCard
                title="Operating Margin"
                value={(getLatestMetric('Operating Margin')?.value ?? 0) / 100}
                format="percentage"
              />
              <ScoreCard
                title="Revenue Growth YoY"
                value={(getLatestMetric('Revenue Growth YoY')?.value ?? 0) / 100}
                format="percentage"
              />
            </div>

            {/* Stacked Bar Chart with Quarterly Detail */}
            <div className="chart-detail-row" style={{ marginBottom: '2rem', display: 'flex', gap: '1.5rem', alignItems: 'stretch' }}>
              {(() => {
                // Group by period and calculate totals
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
                const result: typeof incomeStatement = [];
                periodMap.forEach((period) => {
                  if (period.operatingExpenses > 0) {
                    result.push({
                      gl_number: 6000,
                      gl_account: 'Operating Expenses',
                      period_end_date: period.period_end_date,
                      fiscal_year: period.fiscal_year,
                      fiscal_quarter: period.fiscal_quarter,
                      amount: period.operatingExpenses
                    });
                  }
                  if (period.costOfRevenue > 0) {
                    result.push({
                      gl_number: 4010,
                      gl_account: 'Cost of Revenue',
                      period_end_date: period.period_end_date,
                      fiscal_year: period.fiscal_year,
                      fiscal_quarter: period.fiscal_quarter,
                      amount: period.costOfRevenue
                    });
                  }
                  if (period.operatingIncome > 0) {
                    result.push({
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
                    <div style={{ flex: '2', background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '1.5rem', minHeight: '400px', boxSizing: 'border-box' }}>
                      <StackedBarChart
                        data={result}
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
                  </>
                );
              })()}
            </div>

            {/* Sankey Diagram */}
            <div style={{ marginBottom: '2rem', display: 'flex', gap: '1.5rem' }}>
              <div style={{ flex: '1', background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <SankeyDiagram
                  data={incomeStatement}
                  selectedPeriod={selectedPeriod}
                  width={900}
                  height={167}
                />
              </div>
              <div style={{ width: '167px', height: '167px', background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img
                  src={`${import.meta.env.BASE_URL}images/1_IncomeStatement.jpg`}
                  alt="Income Statement Flow"
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                />
              </div>
            </div>
          </div>
        )}

        {currentPage === 'balance' && balanceSheet.length > 0 && (
          <div>
            {/* Two-column layout: Left (scorecards + chart) and Right (quarterly detail) */}
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', marginBottom: '2rem' }}>
              {/* Left column: Scorecards + Bar Chart */}
              {(() => {
                // Get Total Assets from balance sheet (most recent period)
                const sortedData = [...balanceSheet].sort((a, b) => {
                  if (a.fiscal_year !== b.fiscal_year) return b.fiscal_year - a.fiscal_year;
                  return b.fiscal_quarter - a.fiscal_quarter;
                });
                const latestTotalAssets = sortedData.find(d => d.gl_account === 'Total Assets');
                const totalAssetsValue = latestTotalAssets?.amount ?? 0;

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

                const debtToEquityData = [
                  { period: '2015 Q4', value: 0.45 },
                  { period: '2016 Q4', value: 0.42 },
                  { period: '2017 Q4', value: 0.40 },
                  { period: '2018 Q4', value: 0.38 },
                  { period: '2019 Q4', value: 0.39 },
                  { period: '2020 Q4', value: 0.41 },
                  { period: '2021 Q4', value: 0.39 },
                  { period: '2022 Q4', value: 0.36 },
                  { period: '2023 Q4', value: 0.35 },
                  { period: '2024 Q4', value: 0.37 }
                ];

                return (
                  <div style={{ flex: '2' }}>
                    {/* 2x2 Scorecard Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                      <ScoreCard
                        title="Total Assets"
                        value={totalAssetsValue}
                        format="currency"
                      />
                      <ScoreCard
                        title="Debt-to-Equity Ratio"
                        value={getLatestMetric('Debt-to-Equity Ratio')?.value ?? 0}
                        format="ratio"
                      />
                      <ScoreCard
                        title="ROA"
                        value={(getLatestMetric('ROA')?.value ?? 0) / 100}
                        format="percentage"
                      />
                      <ScoreCard
                        title="Current Ratio"
                        value={getLatestMetric('Current Ratio')?.value ?? 0}
                        format="ratio"
                      />
                    </div>
                    {/* Bar Chart */}
                    <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '1.5rem', height: '550px', boxSizing: 'border-box' }}>
                      <StackedBarChart
                        data={chartData}
                        width={600}
                        height={490}
                        colors={['#f4c430', '#5a4a8a']}
                        onPeriodHover={setSelectedPeriod}
                        lineOverlay={{
                          data: debtToEquityData,
                          color: '#ef4444',
                          label: 'Debt-to-Equity'
                        }}
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
                // Get latest Operating Cash Flow and calculate Free Cash Flow
                const sortedData = [...cashFlow].sort((a, b) => {
                  if (a.fiscal_year !== b.fiscal_year) return b.fiscal_year - a.fiscal_year;
                  return b.fiscal_quarter - a.fiscal_quarter;
                });
                const latestOperating = sortedData.find(d => d.gl_account === 'Operating Cash Flow');
                const latestCapEx = sortedData.find(d => d.gl_account === 'CapEx');
                const operatingCashFlowValue = latestOperating?.amount ?? 0;
                const capExValue = latestCapEx?.amount ?? 0;
                const freeCashFlow = operatingCashFlowValue - capExValue;

                // Build chart data with Operating, Investing, Financing Cash Flows
                const periodMap = new Map();

                cashFlow.forEach(d => {
                  const periodKey = `${d.fiscal_year} Q${d.fiscal_quarter}`;

                  if (!periodMap.has(periodKey)) {
                    periodMap.set(periodKey, {
                      period_end_date: d.period_end_date,
                      fiscal_year: d.fiscal_year,
                      fiscal_quarter: d.fiscal_quarter,
                      operating: 0,
                      investing: 0,
                      financing: 0
                    });
                  }

                  const period = periodMap.get(periodKey);

                  if (d.gl_account === 'Operating Cash Flow') {
                    period.operating = d.amount;
                  } else if (d.gl_account === 'Investing Cash Flow') {
                    period.investing = d.amount;
                  } else if (d.gl_account === 'Financing Cash Flow') {
                    period.financing = d.amount;
                  }
                });

                // Convert to array format for StackedBarChart
                const chartData: typeof cashFlow = [];
                periodMap.forEach((period) => {
                  // Use absolute values for stacking, show all three cash flow components
                  if (period.financing !== 0) {
                    chartData.push({
                      gl_number: 7300,
                      gl_account: 'Financing Cash Flow',
                      period_end_date: period.period_end_date,
                      fiscal_year: period.fiscal_year,
                      fiscal_quarter: period.fiscal_quarter,
                      amount: Math.abs(period.financing)
                    });
                  }
                  if (period.investing !== 0) {
                    chartData.push({
                      gl_number: 7200,
                      gl_account: 'Investing Cash Flow',
                      period_end_date: period.period_end_date,
                      fiscal_year: period.fiscal_year,
                      fiscal_quarter: period.fiscal_quarter,
                      amount: Math.abs(period.investing)
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
                        title="Operating Cash Flow"
                        value={operatingCashFlowValue}
                        format="currency"
                      />
                      <ScoreCard
                        title="Free Cash Flow"
                        value={freeCashFlow}
                        format="currency"
                      />
                      <ScoreCard
                        title="FCF Margin"
                        value={(getLatestMetric('FCF Margin')?.value ?? 0) / 100}
                        format="percentage"
                      />
                      <ScoreCard
                        title="CapEx"
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
