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
      <div className="responsive-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        {/* Left side: Logo + Copyright */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <img
            src={`${import.meta.env.BASE_URL}images/rho_lall_logo_.png`}
            alt="Rho Lall Logo"
            style={{ height: '40px', marginBottom: '0.5rem' }}
          />
          <p style={{ ...textStyle, fontSize: '0.8rem', color: '#999', margin: 0 }}>
            © 2026 Rho Lall
          </p>
        </div>

        {/* Right side: Data Source + Powered by */}
        <div style={{ textAlign: 'right' }}>
          {dataSource && (
            <p style={{ ...textStyle, fontSize: '0.8rem', margin: 0 }}>
              Data Source: {dataSource}
            </p>
          )}
          <p style={{ ...textStyle, fontSize: '0.8rem', margin: dataSource ? '0.5rem 0 0 0' : 0 }}>
            Powered by{' '}
            <a
              href={`${import.meta.env.BASE_URL}dbtdocs/index.html`}
              target="_blank"
              rel="noopener noreferrer"
              style={linkStyle}
            >
              dbt
            </a>
            {' + '}
            <a
              href="https://rho-lall.github.io/analytics-engineering/"
              target="_blank"
              rel="noopener noreferrer"
              style={linkStyle}
            >
              Snowflake
            </a>
            {' + '}
            <a
              href="https://github.com/rho-lall/financial-analysis"
              target="_blank"
              rel="noopener noreferrer"
              style={linkStyle}
            >
              D3.js
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
