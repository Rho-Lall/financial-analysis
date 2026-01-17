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

export interface FinancialMetadata {
  company: string;
  ticker: string;
  statement_type: StatementType;
  export_timestamp: string;
}

export interface FinancialDataPoint {
  gl_number: number;
  gl_account: string;
  period_end_date: string;
  fiscal_year: number;
  fiscal_quarter: number;
  amount: number;
}

export interface FinancialStatement {
  metadata: FinancialMetadata;
  data: FinancialDataPoint[];
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
  period_start_date: string; // Cash flow includes start date for flow periods
}

/**
 * Income Statement full structure
 */
export interface IncomeStatement {
  metadata: FinancialMetadata;
  data: IncomeStatementDataPoint[];
}

/**
 * Balance Sheet full structure
 */
export interface BalanceSheet {
  metadata: FinancialMetadata;
  data: BalanceSheetDataPoint[];
}

/**
 * Cash Flow Statement full structure
 */
export interface CashFlowStatement {
  metadata: FinancialMetadata;
  data: CashFlowDataPoint[];
}

/**
 * Calculated financial metrics (ratios, growth rates, etc.)
 */
export interface FinancialMetric {
  metric_name: string;
  period_end_date: string;
  fiscal_year: number;
  fiscal_quarter: number;
  value: number;
  unit?: string; // e.g., 'percentage', 'ratio', 'currency'
}

export interface FinancialMetrics {
  metadata: FinancialMetadata;
  data: FinancialMetric[];
}

/**
 * Chart of Accounts - Account master data with hierarchy
 */
export interface ChartOfAccountsEntry {
  gl_number: number;
  gl_account: string;
  account_type: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense' | 'Cash Flow';
  account_category: string;
  statement_type: 'income_statement' | 'balance_sheet' | 'cash_flow';
  parent_gl_number: number | null;
  is_total_line: boolean;
  display_order: number;
}

export interface ChartOfAccounts {
  metadata: FinancialMetadata;
  data: ChartOfAccountsEntry[];
}