{{
  config(
    materialized='table',
    schema='exports'
  )
}}

/*
  Export model for Chart of Accounts

  This model provides account master data including hierarchy, categorization,
  and metadata needed for proper financial statement presentation and analysis.

  Output schema provides account metadata:
  - gl_number: Account number (unique identifier)
  - gl_account: Display name of the account
  - account_type: High-level type (Asset, Liability, Equity, Revenue, Expense, Cash Flow)
  - account_category: More specific grouping (e.g., 'Current Assets', 'Operating Expenses')
  - statement_type: Which financial statement (income_statement, balance_sheet, cash_flow)
  - parent_gl_number: Parent account for hierarchical rollups (null for top-level)
  - is_total_line: Boolean indicating if this is a calculated total/subtotal
  - display_order: Sort order for presentation

  This metadata enables:
  - Sankey diagrams (parent-child relationships)
  - Proper account categorization
  - Hierarchical rollups
  - Statement-specific filtering

  Future implementation will pull from:
  - dim_account (account master data with hierarchy)
*/

-- TODO: Replace with actual dim_account data when available
-- For now, this is a placeholder that returns the expected structure
SELECT
  4000 as gl_number,
  'Revenue' as gl_account,
  'Revenue' as account_type,
  'Revenue' as account_category,
  'income_statement' as statement_type,
  null as parent_gl_number,
  false as is_total_line,
  1 as display_order

/*
Future implementation will look like:

SELECT
  a.gl_number,
  a.gl_account_name as gl_account,
  a.account_type,
  a.account_category,
  a.statement_type,
  a.parent_gl_number,
  a.is_total_line,
  a.display_order
FROM ref('dim_account') a
ORDER BY a.statement_type, a.display_order, a.gl_number
*/