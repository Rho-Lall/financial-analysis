import { useState } from 'react';
import './App.css';
import Header from './components/Header';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import ScoreCard from './components/ScoreCard';
import { useFinancialData } from './hooks/useFinancialData';

function App() {
  const [currentPage, setCurrentPage] = useState<'income' | 'balance' | 'cashflow'>('income');
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

        <main className="responsive-container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
        {currentPage === 'income' && (
          <div>
            <h2 style={{ marginBottom: '2rem' }}>Income Statement</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
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
            <div style={{ marginTop: '2rem', padding: '2rem', background: '#f8f9fa', borderRadius: '8px', textAlign: 'center' }}>
              <p style={{ color: '#666' }}>Charts coming soon...</p>
              <p style={{ fontSize: '0.9rem', color: '#999', marginTop: '0.5rem' }}>
                Data loaded: {incomeStatement?.data.length} records
              </p>
            </div>
          </div>
        )}

        {currentPage === 'balance' && (
          <div>
            <h2 style={{ marginBottom: '2rem' }}>Balance Sheet</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
              <ScoreCard
                title="Total Assets"
                value={207000000000}
                format="currency"
              />
              <ScoreCard
                title="Total Equity"
                value={150975000000}
                format="currency"
              />
              <ScoreCard
                title="Debt-to-Equity Ratio"
                value={0.37}
                format="ratio"
              />
            </div>
            <div style={{ marginTop: '2rem', padding: '2rem', background: '#f8f9fa', borderRadius: '8px', textAlign: 'center' }}>
              <p style={{ color: '#666' }}>Charts coming soon...</p>
              <p style={{ fontSize: '0.9rem', color: '#999', marginTop: '0.5rem' }}>
                Data loaded: {balanceSheet?.data.length} records
              </p>
            </div>
          </div>
        )}

        {currentPage === 'cashflow' && (
          <div>
            <h2 style={{ marginBottom: '2rem' }}>Cash Flow</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
              <ScoreCard
                title="Operating Cash Flow"
                value={37260000000}
                format="currency"
                trend={0.078}
              />
              <ScoreCard
                title="Capital Expenditures"
                value={-20700000000}
                format="currency"
              />
              <ScoreCard
                title="Free Cash Flow"
                value={16560000000}
                format="currency"
              />
            </div>
            <div style={{ marginTop: '2rem', padding: '2rem', background: '#f8f9fa', borderRadius: '8px', textAlign: 'center' }}>
              <p style={{ color: '#666' }}>Charts coming soon...</p>
              <p style={{ fontSize: '0.9rem', color: '#999', marginTop: '0.5rem' }}>
                Data loaded: {cashFlow?.data.length} records
              </p>
            </div>
          </div>
        )}
        </main>

        <Footer />
      </div>
    </div>
  );
}

export default App;
