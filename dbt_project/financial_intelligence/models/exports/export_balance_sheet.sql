{{
  config(
    materialized='table',
    schema='exports'
  )
}}

/*
  Export model for Balance Sheet

  This model pulls from the Information Marts layer (fact_financial_statement and dimensions)
  and transforms the data into the JSON contract format expected by the dashboard.

  Output schema matches the BalanceSheetDataPoint interface:
  - gl_number: Account number for sorting
  - gl_account: Display name of the account
  - period_end_date: End date of the fiscal period
  - fiscal_year: Year of the fiscal period
  - fiscal_quarter: Quarter of the fiscal period
  - amount: Dollar amount

  Future implementation will join:
  - fact_financial_statement (for amounts)
  - dim_period (for period details)
  - dim_account (for account mappings)
  - dim_company (for filtering)
*/

-- TODO: Replace with actual joins to marts layer when available
-- For now, this is a placeholder that returns the expected structure
SELECT
  1000 as gl_number,
  'Cash and cash equivalents' as gl_account,
  '2024-12-31' as period_end_date,
  2024 as fiscal_year,
  4 as fiscal_quarter,
  50000000000 as amount

/*
Future implementation will look like:

SELECT
  a.gl_number,
  a.gl_account_name as gl_account,
  p.period_end_date,
  p.fiscal_year,
  p.fiscal_quarter,
  f.amount
FROM ref('fact_financial_statement') f
INNER JOIN ref('dim_account') a ON f.account_key = a.account_key
INNER JOIN ref('dim_period') p ON f.period_key = p.period_key
INNER JOIN ref('dim_company') c ON f.company_key = c.company_key
WHERE a.statement_type = 'balance_sheet'
  AND c.ticker = 'AAPL'
ORDER BY p.period_end_date, a.gl_number
*/