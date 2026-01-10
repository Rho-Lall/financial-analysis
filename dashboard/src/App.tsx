import { useState } from 'react';
import './App.css';
import Header from './components/Header';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import ScoreCard from './components/ScoreCard';
import StackedBarChart from './components/StackedBarChart';
import SankeyDiagram from './components/SankeyDiagram';
import DataTable from './components/DataTable';
import QuarterlyDetail from './components/QuarterlyDetail';
import { useFinancialData } from './hooks/useFinancialData';

function App() {
  const [currentPage, setCurrentPage] = useState<'income' | 'balance' | 'cashflow'>('income');
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const { incomeStatement, balanceSheet, cashFlow, loading, error } = useFinancialData();

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
        <Header
          companyName={incomeStatement?.metadata.company}
          ticker={incomeStatement?.metadata.ticker}
        />
        <Navigation currentPage={currentPage} onNavigate={(page) => setCurrentPage(page as any)} />

        <main className="responsive-container" style={{ paddingTop: '1.5rem', paddingBottom: '2rem' }}>
        {currentPage === 'income' && incomeStatement && (
          <div>
            {/* Scorecards */}
            <div className="scorecard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              <ScoreCard
                title="Revenue (Latest)"
                value={207000000000}
                format="currency"
                trend={0.078}
              />
              <ScoreCard
                title="Net Profit (Latest)"
                value={24840000000}
                format="currency"
                trend={0.078}
              />
              <ScoreCard
                title="Net Margin"
                value={0.12}
                format="percentage"
              />
            </div>

            {/* Stacked Bar Chart with Quarterly Detail */}
            <div className="chart-detail-row" style={{ marginBottom: '2rem', display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
              {(() => {
                // Filter and aggregate operating expenses
                const filtered = incomeStatement.data.filter(d => d.fiscal_quarter !== 4);

                // Group by period and calculate totals
                const periodMap = new Map();

                filtered.forEach(d => {
                  const periodKey = `${d.fiscal_year} Q${d.fiscal_quarter}`;

                  if (!periodMap.has(periodKey)) {
                    periodMap.set(periodKey, {
                      period_end_date: d.period_end_date,
                      fiscal_year: d.fiscal_year,
                      fiscal_quarter: d.fiscal_quarter,
                      netProfit: 0,
                      costOfRevenue: 0,
                      totalOpex: 0
                    });
                  }

                  const period = periodMap.get(periodKey);

                  if (d.gl_account === 'Net profit') {
                    period.netProfit = d.amount;
                  } else if (d.gl_account === 'Cost of revenue') {
                    period.costOfRevenue = d.amount;
                  } else if (d.gl_account === 'Marketing' || d.gl_account === 'Technology and development') {
                    period.totalOpex += Math.abs(d.amount);
                  }
                });

                // Convert to array format expected by StackedBarChart
                // Order matters: items are stacked from bottom to top in the order they appear
                const result: typeof incomeStatement.data = [];
                periodMap.forEach((period) => {
                  if (period.totalOpex > 0) {
                    result.push({
                      gl_number: 6000,
                      gl_account: 'Total operating expenses',
                      period_end_date: period.period_end_date,
                      fiscal_year: period.fiscal_year,
                      fiscal_quarter: period.fiscal_quarter,
                      amount: period.totalOpex
                    });
                  }
                  if (period.costOfRevenue > 0) {
                    result.push({
                      gl_number: 4010,
                      gl_account: 'Cost of revenue',
                      period_end_date: period.period_end_date,
                      fiscal_year: period.fiscal_year,
                      fiscal_quarter: period.fiscal_quarter,
                      amount: period.costOfRevenue
                    });
                  }
                  if (period.netProfit > 0) {
                    result.push({
                      gl_number: 9000,
                      gl_account: 'Net profit',
                      period_end_date: period.period_end_date,
                      fiscal_year: period.fiscal_year,
                      fiscal_quarter: period.fiscal_quarter,
                      amount: period.netProfit
                    });
                  }
                });

                return (
                  <>
                    <div style={{ flex: '2', background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '1.5rem', height: '400px', boxSizing: 'border-box' }}>
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
                        data={result}
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
                  data={incomeStatement.data}
                  fiscalYear={2024}
                  fiscalQuarter={4}
                  width={900}
                  height={167}
                />
              </div>
              <div style={{ width: '167px', height: '167px', background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img
                  src="/income-statement.jpg"
                  alt="Income Statement Flow"
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                />
              </div>
            </div>
          </div>
        )}

        {currentPage === 'balance' && balanceSheet && (
          <div>
            {/* Scorecards */}
            <div className="scorecard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              <ScoreCard
                title="Debt-to-Equity Ratio"
                value={0.37}
                format="ratio"
              />
              <ScoreCard
                title="ROA"
                value={0.12}
                format="percentage"
              />
              <ScoreCard
                title="Total Assets"
                value={207000000000}
                format="currency"
              />
            </div>

            {/* Stacked Bar Chart with Quarterly Detail */}
            <div className="chart-detail-row" style={{ marginBottom: '2rem', display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
              {(() => {
                // Aggregate balance sheet data into Equity and Liabilities for bar chart
                const periodMap = new Map();

                balanceSheet.data.forEach(d => {
                  const periodKey = `${d.fiscal_year} Q${d.fiscal_quarter}`;

                  if (!periodMap.has(periodKey)) {
                    periodMap.set(periodKey, {
                      period_end_date: d.period_end_date,
                      fiscal_year: d.fiscal_year,
                      fiscal_quarter: d.fiscal_quarter,
                      totalEquity: 0,
                      totalLiabilities: 0
                    });
                  }

                  const period = periodMap.get(periodKey);

                  // Use the total accounts for cleaner aggregation
                  if (d.gl_account === "Total stockholders' equity") {
                    period.totalEquity = d.amount;
                  } else if (d.gl_account === 'Total current liabilities') {
                    period.totalLiabilities += d.amount;
                  } else if (d.gl_account === 'Long-term debt, non-current') {
                    period.totalLiabilities += d.amount;
                  }
                });

                // Convert to array format for StackedBarChart
                const chartData: typeof balanceSheet.data = [];
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
                  <>
                    <div style={{ flex: '2', background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '1.5rem', height: '400px', boxSizing: 'border-box' }}>
                      <StackedBarChart 
                        data={chartData} 
                        width={600} 
                        height={340}
                        colors={['#f4c430', '#5a4a8a']}
                        onPeriodHover={setSelectedPeriod}
                        lineOverlay={{
                          data: debtToEquityData,
                          color: '#ef4444',
                          label: 'Debt-to-Equity'
                        }}
                      />
                    </div>
                    <div style={{ flex: '1' }}>
                      <QuarterlyDetail
                        data={balanceSheet.data}
                        selectedPeriod={selectedPeriod}
                      />
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Data Table */}
          </div>
        )}

        {currentPage === 'cashflow' && cashFlow && (
          <div>
            {/* Scorecards */}
            <div className="scorecard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
              <ScoreCard
                title="FCF to Assets Ratio"
                value={0.08}
                format="ratio"
              />
              <ScoreCard
                title="Free Cash Flow"
                value={16560000000}
                format="currency"
              />
            </div>

            {/* Stacked Bar Chart with Quarterly Detail */}
            <div className="chart-detail-row" style={{ marginBottom: '2rem', display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
              {(() => {
                // Build chart data with explicit ordering for stacking
                // Order: bottom to top in the stack
                const periods = Array.from(new Set(cashFlow.data.map(d => `${d.fiscal_year} Q${d.fiscal_quarter}`))).sort();
                
                const chartData: typeof cashFlow.data = [];
                
                // Add in order: first added = bottom of stack
                periods.forEach(period => {
                  const [year, quarterStr] = period.split(' ');
                  const fiscalYear = parseInt(year);
                  const fiscalQuarter = parseInt(quarterStr.substring(1));
                  
                  // 1. Purchases (bottom - light yellow)
                  const purchases = cashFlow.data.find(d => 
                    d.fiscal_year === fiscalYear && 
                    d.fiscal_quarter === fiscalQuarter && 
                    d.gl_account === 'Purchases of property and equipment'
                  );
                  if (purchases) {
                    chartData.push({ ...purchases, amount: Math.abs(purchases.amount) });
                  }
                  
                  // 2. Proceeds (middle - dark yellow)
                  const proceeds = cashFlow.data.find(d => 
                    d.fiscal_year === fiscalYear && 
                    d.fiscal_quarter === fiscalQuarter && 
                    d.gl_account === 'Proceeds from asset sales and incentives'
                  );
                  if (proceeds) {
                    chartData.push(proceeds);
                  }
                  
                  // 3. Operating (top - purple)
                  const operating = cashFlow.data.find(d => 
                    d.fiscal_year === fiscalYear && 
                    d.fiscal_quarter === fiscalQuarter && 
                    d.gl_account === 'Net cash provided by operating activities'
                  );
                  if (operating) {
                    chartData.push(operating);
                  }
                });

                return (
                  <>
                    <div style={{ flex: '2', background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '1.5rem', height: '400px', boxSizing: 'border-box' }}>
                      <StackedBarChart 
                        data={chartData} 
                        width={600} 
                        height={340}
                        colors={['#f4c430', '#d4a017', '#5a4a8a']}
                        onPeriodHover={setSelectedPeriod}
                      />
                    </div>
                    <div style={{ flex: '1' }}>
                      <QuarterlyDetail
                        data={cashFlow.data}
                        selectedPeriod={selectedPeriod}
                      />
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Data Table */}
          </div>
        )}
        </main>

        <Footer />
      </div>
    </div>
  );
}

export default App;
