# Export Layer

The export layer provides JSON-ready outputs that power the financial analysis dashboard. These models transform data from the Information Marts layer into the exact format expected by the dashboard's TypeScript interfaces.

## Overview

The export layer consists of 5 models that map to 5 JSON files consumed by the dashboard:

| Model | JSON File | Purpose |
|-------|-----------|---------|
| `export_income_statement` | `income_statement.json` | Income statement line items by period |
| `export_balance_sheet` | `balance_sheet.json` | Balance sheet line items by period |
| `export_cash_flow` | `cash_flow.json` | Cash flow statement line items by period |
| `export_financial_metrics` | `financial_metrics.json` | Calculated ratios and KPIs |
| `export_chart_of_accounts` | `chart_of_accounts.json` | Account master data with hierarchy |

## JSON Contract Structure

All export files follow a consistent structure:

```json
{
  "metadata": {
    "company": "Apple Inc.",
    "ticker": "AAPL",
    "statement_type": "income_statement",
    "export_timestamp": "2025-01-10T12:00:00Z"
  },
  "data": [
    // Array of data points specific to each export type
  ]
}
```

### Financial Statement Data Points

Income statement, balance sheet, and cash flow exports share common fields:

```typescript
{
  gl_number: number;          // Account number for sorting
  gl_account: string;         // Display name
  period_end_date: string;    // YYYY-MM-DD format
  fiscal_year: number;        // e.g., 2024
  fiscal_quarter: number;     // 1-4
  amount: number;             // Dollar amount
}
```

**Note:** Cash flow includes an additional `period_start_date` field since cash flows represent activity over a period.

### Financial Metrics Data Points

```typescript
{
  metric_name: string;        // e.g., "Revenue Growth YoY"
  period_end_date: string;    // YYYY-MM-DD format
  fiscal_year: number;
  fiscal_quarter: number;
  value: number;              // Calculated metric value
  unit?: string;              // e.g., "percentage", "ratio"
}
```

### Chart of Accounts Data Points

```typescript
{
  gl_number: number;
  gl_account: string;
  account_type: string;       // Asset, Liability, Equity, Revenue, Expense, Cash Flow
  account_category: string;   // e.g., "Current Assets", "Operating Expenses"
  statement_type: string;     // income_statement, balance_sheet, cash_flow
  parent_gl_number: number | null;  // For hierarchical rollups
  is_total_line: boolean;     // True if this is a calculated total
  display_order: number;      // Sort order for presentation
}
```

## Account Hierarchy

The `export_chart_of_accounts` model provides hierarchical relationships through the `parent_gl_number` field:

- **Top-level accounts**: `parent_gl_number = null`
- **Child accounts**: `parent_gl_number` points to the parent GL number

Example hierarchy:
```
1900 - Total assets (parent_gl_number: null)
  ├─ 1050 - Current assets (parent_gl_number: 1900)
  │   ├─ 1000 - Cash (parent_gl_number: 1050)
  │   └─ 1030 - Inventory (parent_gl_number: 1050)
  └─ 1070 - PP&E (parent_gl_number: 1900)
```

This enables:
- Sankey diagrams showing account flow
- Hierarchical rollups and drill-downs
- Proper categorization in charts

## Export Process

### 1. Build dbt Models

```bash
cd dbt_project/financial_intelligence
dbt build --select exports
```

This creates tables in the `exports` schema within DuckDB.

### 2. Run Export Script

```bash
cd extraction
python export_to_json.py --ticker AAPL --company "Apple Inc."
```

**Script options:**
- `--db`: Path to DuckDB database (default: `data/financial_intelligence.duckdb`)
- `--output`: Output directory (default: `../dashboard/public/data`)
- `--ticker`: Stock ticker symbol (default: `AAPL`)
- `--company`: Company name (defaults to ticker)

### 3. Validate Exports

Run property tests to ensure exports meet requirements:

```bash
cd extraction
pytest tests/test_json_exports.py -v
```

**Tests validate:**
- **Property 6**: JSON files are under 10MB (Requirement 5.2)
- **Property 7**: Metadata includes required fields (Requirement 5.3)
- Data integrity and schema conformance

## Future Implementation

Currently, the export models contain placeholder data. Once the Information Marts layer is implemented (Task 13), the models will be updated to:

1. Join `fact_financial_statement` with dimension tables
2. Join `fact_financial_metrics` for calculated metrics
3. Pull account hierarchy from `dim_account`

Example future implementation:

```sql
-- export_income_statement.sql
SELECT
  a.gl_number,
  a.gl_account_name as gl_account,
  p.period_end_date,
  p.fiscal_year,
  p.fiscal_quarter,
  f.amount
FROM {{ ref('fact_financial_statement') }} f
INNER JOIN {{ ref('dim_account') }} a ON f.account_key = a.account_key
INNER JOIN {{ ref('dim_period') }} p ON f.period_key = p.period_key
INNER JOIN {{ ref('dim_company') }} c ON f.company_key = c.company_key
WHERE a.statement_type = 'income_statement'
  AND c.ticker = 'AAPL'
ORDER BY p.period_end_date, a.gl_number
```

## Size Constraints

**Requirement 5.2**: Each JSON export must be under 10MB to ensure fast dashboard loading.

The export script validates file size before writing. If a file exceeds the limit:
- An error is raised
- The file is not written
- The dashboard will continue using existing data

To reduce file size:
- Filter to recent periods only (e.g., last 10 years)
- Exclude unnecessary detail accounts
- Aggregate quarterly data to annual where appropriate

## Dashboard Integration

The dashboard loads these JSON files using the `useFinancialData` hook:

```typescript
import { useFinancialData } from '@/hooks/useFinancialData';

const { incomeStatement, balanceSheet, chartOfAccounts, loading, error } =
  useFinancialData();
```

The hook:
1. Fetches JSON files from `/data/` directory
2. Validates against TypeScript interfaces
3. Provides typed data to React components
4. Handles loading and error states

## Schema Documentation

See [schema.yml](schema.yml) for complete column-level documentation and dbt tests.
