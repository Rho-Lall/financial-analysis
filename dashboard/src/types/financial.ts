/**
 * Financial data type definitions
 * Based on the long-format structure from dbt exports
 */

export type StatementType =
  | 'income_statement'
  | 'balance_sheet'
  | 'cash_flow'
  | 'financial_metrics'
  | 'chart_of_accounts';

/**
 * Company information from export_companies.json
 */
export interface Company {
  company_name: string;
  ticker: string;
  last_updated: string;
  data_source: string;
}

/**
 * Raw financial data point from export files (flat array format with ticker)
 */
export interface RawFinancialDataPoint {
  ticker: string;
  gl_number: number;
  gl_account: string;
  period_end_date: string;
  fiscal_year: number;
  fiscal_quarter: number;
  amount: number;
}

/**
 * Financial data point (for internal use after filtering by ticker)
 */
export interface FinancialDataPoint {
  gl_number: number;
  gl_account: string;
  period_end_date: string;
  fiscal_year: number;
  fiscal_quarter: number;
  amount: number;
}

/**
 * Income Statement specific data point
 */
export interface IncomeStatementDataPoint extends FinancialDataPoint {
  // Income statement specific fields can be added here if needed
}

/**
 * Balance Sheet specific data point
 */
export interface BalanceSheetDataPoint extends FinancialDataPoint {
  // Balance sheet specific fields can be added here if needed
}

/**
 * Cash Flow Statement specific data point
 */
export interface CashFlowDataPoint extends FinancialDataPoint {
  period_start_date?: string; // Cash flow may include start date for flow periods
}

/**
 * Chart of Accounts entry
 */
export interface ChartOfAccountsEntry {
  gl_number: number;
  gl_account: string;
  category: string;
  subcategory: string;
  statement_type: string;
}

/**
 * Calculated financial metrics
 */
export interface FinancialMetric {
  ticker: string;
  metric_name: string;
  period_end_date: string;
  fiscal_year: number;
  fiscal_quarter: number;
  value: number;
  unit?: string;
}
