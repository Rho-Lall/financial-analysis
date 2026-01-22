import type { CSSProperties } from 'react';

interface FooterProps {
  dataSource?: string;
}

export default function Footer({ dataSource }: FooterProps) {
  const footerStyle: CSSProperties = {
    background: '#f8f9fa',
    borderTop: '1px solid #e0e0e0',
    padding: '2rem',
    marginTop: '4rem',
    textAlign: 'center',
  };

  const textStyle: CSSProperties = {
    margin: '0.5rem 0',
    color: '#666',
    fontSize: '0.9rem',
  };

  const linkStyle: CSSProperties = {
    color: '#667eea',
    textDecoration: 'none',
    fontWeight: 500,
  };

  return (
    <footer style={footerStyle}>
      <div className="responsive-container">
        {dataSource && (
          <p style={{ ...textStyle, fontSize: '0.8rem', marginBottom: '1rem' }}>
            Data Source: {dataSource}
          </p>
        )}
        <p style={textStyle}>
          Powered by{' '}
          <a
            href="https://www.getdbt.com/"
            target="_blank"
            rel="noopener noreferrer"
            style={linkStyle}
          >
            dbt
          </a>
          {' + '}
          <a
            href="https://react.dev/"
            target="_blank"
            rel="noopener noreferrer"
            style={linkStyle}
          >
            React
          </a>
          {' + '}
          <a
            href="https://d3js.org/"
            target="_blank"
            rel="noopener noreferrer"
            style={linkStyle}
          >
            D3.js
          </a>
        </p>
        <p style={{ ...textStyle, fontSize: '0.8rem', color: '#999' }}>
          © 2026 Rho Lall
        </p>
      </div>
    </footer>
  );
}
