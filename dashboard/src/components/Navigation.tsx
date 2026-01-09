import type { CSSProperties } from 'react';

interface NavigationProps {
  currentPage?: 'income' | 'balance' | 'cashflow';
  onNavigate?: (page: string) => void;
}

export default function Navigation({ currentPage = 'income', onNavigate }: NavigationProps) {
  const navStyle: CSSProperties = {
    background: '#f8f9fa',
    borderBottom: '1px solid #e0e0e0',
    padding: '0',
  };

  const containerStyle: CSSProperties = {
    display: 'flex',
    gap: '0',
  };

  const getNavItemStyle = (isActive: boolean): CSSProperties => ({
    padding: '1rem 2rem',
    background: isActive ? 'white' : 'transparent',
    border: 'none',
    borderBottom: isActive ? '3px solid #667eea' : '3px solid transparent',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: isActive ? 600 : 400,
    color: isActive ? '#667eea' : '#666',
    transition: 'all 0.2s',
    textDecoration: 'none',
    display: 'inline-block',
  });

  const handleClick = (page: string) => {
    if (onNavigate) {
      onNavigate(page);
    }
  };

  return (
    <nav style={navStyle}>
      <div className="responsive-container" style={containerStyle}>
        <button
          style={getNavItemStyle(currentPage === 'income')}
          onClick={() => handleClick('income')}
          onMouseEnter={(e) => {
            if (currentPage !== 'income') {
              e.currentTarget.style.background = 'rgba(102, 126, 234, 0.05)';
            }
          }}
          onMouseLeave={(e) => {
            if (currentPage !== 'income') {
              e.currentTarget.style.background = 'transparent';
            }
          }}
        >
          Income Statement
        </button>
        <button
          style={getNavItemStyle(currentPage === 'balance')}
          onClick={() => handleClick('balance')}
          onMouseEnter={(e) => {
            if (currentPage !== 'balance') {
              e.currentTarget.style.background = 'rgba(102, 126, 234, 0.05)';
            }
          }}
          onMouseLeave={(e) => {
            if (currentPage !== 'balance') {
              e.currentTarget.style.background = 'transparent';
            }
          }}
        >
          Balance Sheet
        </button>
        <button
          style={getNavItemStyle(currentPage === 'cashflow')}
          onClick={() => handleClick('cashflow')}
          onMouseEnter={(e) => {
            if (currentPage !== 'cashflow') {
              e.currentTarget.style.background = 'rgba(102, 126, 234, 0.05)';
            }
          }}
          onMouseLeave={(e) => {
            if (currentPage !== 'cashflow') {
              e.currentTarget.style.background = 'transparent';
            }
          }}
        >
          Cash Flow
        </button>
        <a
          href="#dbt-docs"
          style={{
            ...getNavItemStyle(false),
            marginLeft: 'auto',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(102, 126, 234, 0.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          Docs
        </a>
      </div>
    </nav>
  );
}