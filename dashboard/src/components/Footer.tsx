import { HandRule } from '../engraving/HandRule';

interface FooterProps {
  dataSource?: string;
  lastUpdated?: string;
}

export default function Footer({ dataSource, lastUpdated }: FooterProps) {
  const updated = lastUpdated ? new Date(lastUpdated).toISOString().slice(0, 10) : null;
  return (
    <>
      <HandRule seed={9} opacity={0.3} />
      <footer className="site-footer">
        <span>
          {dataSource && <>Data: {dataSource}</>}
          {updated && <> · Updated {updated}</>}
          <> · © 2026 Rho Lall</>
        </span>
        <span>
          Built with{' '}
          <a href={`${import.meta.env.BASE_URL}dbtdocs/index.html`} target="_blank" rel="noopener noreferrer">
            dbt
          </a>{' '}
          +{' '}
          <a href="https://rho-lall.github.io/analytics-engineering/" target="_blank" rel="noopener noreferrer">
            Snowflake
          </a>{' '}
          +{' '}
          <a href="https://github.com/rho-lall/financial-analysis" target="_blank" rel="noopener noreferrer">
            D3.js
          </a>
        </span>
      </footer>
    </>
  );
}
