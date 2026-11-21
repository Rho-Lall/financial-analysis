import { HandRule } from '../engraving/HandRule';
import { HandSelect, HandTabs } from '../engraving/HandNav';
import type { Company } from '../types/financial';

export type Page = 'income' | 'balance' | 'cashflow';

const tabs: { key: Page; label: string }[] = [
  { key: 'income', label: 'Income Statement' },
  { key: 'balance', label: 'Balance Sheet' },
  { key: 'cashflow', label: 'Cash Flow' },
];

interface NavigationProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  companies: Company[];
  selectedCompany: Company | null;
  onCompanyChange: (ticker: string) => void;
}

export default function Navigation({ currentPage, onNavigate, companies, selectedCompany, onCompanyChange }: NavigationProps) {
  return (
    <>
      <nav className="site-nav">
        <HandTabs tabs={tabs} active={currentPage} onChange={onNavigate} drawDelay={150} />
        <div className="site-nav-right">
          <a className="site-docs-link" href={`${import.meta.env.BASE_URL}dbtdocs/index.html`} target="_blank" rel="noopener noreferrer">
            Docs ↗
          </a>
          {companies.length > 0 && (
            <HandSelect
              label="Company"
              value={selectedCompany?.ticker ?? ''}
              onChange={onCompanyChange}
              options={companies.map((c) => ({ value: c.ticker, label: `${titleCase(c.company_name)} (${c.ticker})` }))}
              drawDelay={500}
            />
          )}
        </div>
      </nav>
      <HandRule seed={5} opacity={0.32} drawDelay={300} />
    </>
  );
}

/** "CATERPILLAR INC" -> "Caterpillar Inc" */
function titleCase(s: string) {
  return s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}
