import type { CSSProperties } from 'react';

interface HeaderProps {
  companyName?: string;
  ticker?: string;
}

export default function Header({ companyName = 'ACME', ticker = 'ACME' }: HeaderProps) {
  const headerStyle: CSSProperties = {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '1.5rem 0',
    width: '100%',
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

  return (
    <header style={headerStyle}>
      <div className="responsive-container">
        <h1 style={titleStyle}>
          {companyName} <span style={tickerStyle}>({ticker})</span>
        </h1>
        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', opacity: 0.8 }}>
          Financial Intelligence Dashboard
        </p>
      </div>
    </header>
  );
}