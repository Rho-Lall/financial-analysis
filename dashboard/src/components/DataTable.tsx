import { useState, useMemo } from 'react';
import type { CSSProperties } from 'react';
import type { FinancialDataPoint } from '../types/financial';

interface DataTableProps {
  data: FinancialDataPoint[];
  title?: string;
}

type SortField = 'gl_number' | 'gl_account' | 'period_end_date' | 'amount';
type SortDirection = 'asc' | 'desc';

export default function DataTable({ data, title }: DataTableProps) {
  const [sortField, setSortField] = useState<SortField>('gl_number');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      let aVal: string | number = 0;
      let bVal: string | number = 0;

      if (sortField === 'amount') {
        aVal = a.amount;
        bVal = b.amount;
      } else if (sortField === 'gl_number') {
        aVal = a.gl_number;
        bVal = b.gl_number;
      } else if (sortField === 'gl_account') {
        aVal = a.gl_account;
        bVal = b.gl_account;
      } else if (sortField === 'period_end_date') {
        aVal = a.period_end_date ?? '';
        bVal = b.period_end_date ?? '';
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortField, sortDirection]);

  const formatCurrency = (value: number): string => {
    const absValue = Math.abs(value);
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(absValue);
    return value < 0 ? `(${formatted})` : formatted;
  };

  const containerStyle: CSSProperties = {
    width: '100%',
    overflowX: 'auto',
    background: 'white',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  };

  const tableStyle: CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.9rem',
  };

  const thStyle: CSSProperties = {
    padding: '0.75rem 1rem',
    textAlign: 'left',
    background: '#f8f9fa',
    borderBottom: '2px solid #dee2e6',
    fontWeight: 600,
    cursor: 'pointer',
    userSelect: 'none',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  };

  const tdStyle: CSSProperties = {
    padding: '0.75rem 1rem',
    borderBottom: '1px solid #e9ecef',
  };

  const getSortIcon = (field: SortField): string => {
    if (sortField !== field) return '⇅';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  return (
    <div>
      {title && (
        <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: 600 }}>
          {title}
        </h3>
      )}
      <div style={containerStyle}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle} onClick={() => handleSort('gl_number')}>
                GL # {getSortIcon('gl_number')}
              </th>
              <th style={thStyle} onClick={() => handleSort('gl_account')}>
                Account {getSortIcon('gl_account')}
              </th>
              <th style={thStyle} onClick={() => handleSort('period_end_date')}>
                Period {getSortIcon('period_end_date')}
              </th>
              <th style={{ ...thStyle, textAlign: 'right' }}>
                Fiscal Year
              </th>
              <th style={{ ...thStyle, textAlign: 'right' }}>
                Quarter
              </th>
              <th
                style={{ ...thStyle, textAlign: 'right' }}
                onClick={() => handleSort('amount')}
              >
                Amount {getSortIcon('amount')}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, index) => (
              <tr
                key={`${row.gl_number}-${row.period_end_date}-${index}`}
                style={{
                  background: index % 2 === 0 ? 'white' : '#f8f9fa',
                }}
              >
                <td style={tdStyle}>{row.gl_number}</td>
                <td style={tdStyle}>{row.gl_account}</td>
                <td style={tdStyle}>{row.period_end_date}</td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>{row.fiscal_year}</td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>Q{row.fiscal_quarter}</td>
                <td
                  style={{
                    ...tdStyle,
                    textAlign: 'right',
                    fontWeight: 500,
                    color: row.amount < 0 ? '#dc3545' : '#212529',
                  }}
                >
                  {formatCurrency(row.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sortedData.length === 0 && (
          <div
            style={{
              padding: '2rem',
              textAlign: 'center',
              color: '#6c757d',
            }}
          >
            No data available
          </div>
        )}
      </div>
    </div>
  );
}