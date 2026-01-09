import type { CSSProperties } from 'react';

interface HeaderProps {
  companyName?: string;
  ticker?: string;
}

export default function Header({ companyName = 'ACME', ticker = 'ACME' }: HeaderProps) {
  const headerStyle: CSSProperties = {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '1.5rem 2rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  };

  const containerStyle: CSSProperties = {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const titleStyle: CSSProperties = {
    margin: 0,
    fontSize: '1.75rem',
    fontWeight: 600,
  };

  const tickerStyle: CSSProperties = {
    fontSize: '0.9rem',
    opacity: 0.9,
    fontWeight: 400,
  };

  const linkStyle: CSSProperties = {
    color: 'white',
    textDecoration: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    border: '1px solid rgba(255,255,255,0.3)',
    transition: 'all 0.2s',
    fontSize: '0.9rem',
  };

  return (
    <header style={headerStyle}>
      <div style={containerStyle}>
        <div>
          <h1 style={titleStyle}>
            {companyName} <span style={tickerStyle}>({ticker})</span>
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', opacity: 0.8 }}>
            Financial Intelligence Dashboard
          </p>
        </div>
        <a
          href="#dbt-docs"
          style={linkStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          dbt Docs →
        </a>
      </div>
    </header>
  );
}