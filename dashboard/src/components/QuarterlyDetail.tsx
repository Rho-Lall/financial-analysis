import type { CSSProperties } from 'react';
import type { FinancialDataPoint } from '../types/financial';

interface QuarterlyDetailProps {
  data: FinancialDataPoint[];
  selectedPeriod: string | null;
}

export default function QuarterlyDetail({ data, selectedPeriod }: QuarterlyDetailProps) {
  const formatCurrency = (val: number): string => {
    const absVal = Math.abs(val);
    if (absVal >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
    if (absVal >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
    if (absVal >= 1e3) return `$${(val / 1e3).toFixed(2)}K`;
    return `$${val.toFixed(2)}`;
  };

  // Get the most recent quarter if no period is selected
  const getMostRecentPeriod = (): string | null => {
    if (data.length === 0) return null;

    // Extract all unique periods
    const periods = Array.from(new Set(data.map(d => `${d.fiscal_year} Q${d.fiscal_quarter}`))).sort();

    // Return the last period (most recent)
    return periods[periods.length - 1];
  };

  const displayPeriod = selectedPeriod || getMostRecentPeriod();

  const containerStyle: CSSProperties = {
    background: 'white',
    borderRadius: '8px',
    padding: '1.5rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    height: '400px',
    overflowY: 'auto',
  };

  const titleStyle: CSSProperties = {
    marginTop: 0,
    marginBottom: '1rem',
    fontSize: '0.9rem',
    fontWeight: 600,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  };

  const tableStyle: CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.85rem',
  };

  const thStyle: CSSProperties = {
    textAlign: 'left',
    padding: '0.5rem 0.25rem',
    borderBottom: '2px solid #e0e0e0',
    fontWeight: 600,
    color: '#333',
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  };

  const tdStyle: CSSProperties = {
    padding: '0.5rem 0.25rem',
    borderBottom: '1px solid #f0f0f0',
    color: '#333',
  };

  const amountStyle: CSSProperties = {
    textAlign: 'right',
    fontWeight: 500,
  };

  const emptyStyle: CSSProperties = {
    textAlign: 'center',
    color: '#999',
    padding: '2rem',
    fontSize: '0.9rem',
  };

  if (!displayPeriod) {
    return (
      <div style={containerStyle}>
        <h4 style={titleStyle}>Quarter Details</h4>
        <div style={emptyStyle}>No data available</div>
      </div>
    );
  }

  // Parse the period string (e.g., "2024 Q1")
  const [year, quarterStr] = displayPeriod.split(' ');
  const quarter = parseInt(quarterStr.substring(1));

  // Filter data for the selected period
  const periodData = data.filter(
    d => d.fiscal_year === parseInt(year) && d.fiscal_quarter === quarter
  );

  return (
    <div style={containerStyle}>
      <h4 style={titleStyle}>{displayPeriod}</h4>
      {periodData.length === 0 ? (
        <div style={emptyStyle}>No data available for this period</div>
      ) : (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Account</th>
              <th style={{ ...thStyle, ...amountStyle }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {periodData.map((item, idx) => (
              <tr key={idx}>
                <td style={tdStyle}>{item.gl_account}</td>
                <td style={{ ...tdStyle, ...amountStyle }}>{formatCurrency(item.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}