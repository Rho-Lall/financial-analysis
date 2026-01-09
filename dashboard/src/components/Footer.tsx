import type { CSSProperties } from 'react';

export default function Footer() {
  const footerStyle: CSSProperties = {
    background: '#f8f9fa',
    borderTop: '1px solid #e0e0e0',
    padding: '2rem',
    marginTop: '4rem',
    textAlign: 'center',
  };

  const containerStyle: CSSProperties = {
    maxWidth: '1200px',
    margin: '0 auto',
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

  const currentYear = new Date().getFullYear();

  return (
    <footer style={footerStyle}>
      <div style={containerStyle}>
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
          © {currentYear} Financial Intelligence Dashboard
        </p>
      </div>
    </footer>
  );
}