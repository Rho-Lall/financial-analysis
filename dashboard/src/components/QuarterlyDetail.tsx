import { WobblyPanel } from '../engraving/WobblyPanel';
import { HandRule } from '../engraving/HandRule';
import { money, periodKey } from '../charts/adapters';
import type { FinancialDataPoint } from '../types/financial';

interface QuarterlyDetailProps {
  title: string;
  data: FinancialDataPoint[];
  period: string | null;
  /** Accounts rendered bold with a rule above (subtotals). */
  emphasize?: string[];
}

export default function QuarterlyDetail({ title, data, period, emphasize = [] }: QuarterlyDetailProps) {
  // One row per account: the largest absolute amount (summary row, not line items).
  const rows = new Map<string, { gl_number: number; gl_account: string; amount: number }>();
  if (period) {
    for (const d of data) {
      if (periodKey(d) !== period) continue;
      const prev = rows.get(d.gl_account);
      if (!prev || Math.abs(d.amount) > Math.abs(prev.amount)) {
        rows.set(d.gl_account, { gl_number: d.gl_number, gl_account: d.gl_account, amount: d.amount });
      }
    }
  }
  const sorted = Array.from(rows.values()).sort((a, b) => a.gl_number - b.gl_number);

  return (
    <WobblyPanel seed={61} padding="20px 22px" castShadow={6} drawDelay={600} style={{ height: '100%' }}>
      <div className="detail">
        <h3 className="detail-title">{title}</h3>
        <div className="detail-period">{period ?? '—'}</div>
        {sorted.length === 0 ? (
          <p className="detail-empty">No data for this period</p>
        ) : (
          <ul className="detail-rows">
            {sorted.map((r, i) => {
              const strong = emphasize.includes(r.gl_account);
              return (
                <li key={r.gl_account} className={strong ? 'detail-row detail-row-strong' : 'detail-row'}>
                  {strong && i > 0 && <HandRule seed={70 + i} opacity={0.35} />}
                  <div className="detail-row-inner">
                    <span>{r.gl_account}</span>
                    <span className="detail-amount">{money(r.amount, 2)}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </WobblyPanel>
  );
}
