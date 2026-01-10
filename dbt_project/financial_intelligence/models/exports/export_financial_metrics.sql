{{
  config(
    materialized='table',
    schema='exports'
  )
}}

/*
  Export model for Financial Metrics

  This model pulls from the Information Marts layer (fact_financial_metrics)
  and transforms the data into the JSON contract format expected by the dashboard.

  Output schema matches the FinancialMetric interface:
  - metric_name: Name of the financial metric (e.g., 'Revenue Growth YoY', 'Gross Margin')
  - period_end_date: End date of the fiscal period
  - fiscal_year: Year of the fiscal period
  - fiscal_quarter: Quarter of the fiscal period
  - value: Calculated metric value
  - unit: Unit of measure (e.g., 'percentage', 'ratio', 'currency')

  Future implementation will join:
  - fact_financial_metrics (for calculated metric values)
  - dim_period (for period details)
  - dim_company (for filtering)
*/

-- TODO: Replace with actual joins to marts layer when available
-- For now, this is a placeholder that returns the expected structure
SELECT
  'Revenue Growth YoY' as metric_name,
  '2024-12-31' as period_end_date,
  2024 as fiscal_year,
  4 as fiscal_quarter,
  7.8 as value,
  'percentage' as unit

/*
Future implementation will look like:

SELECT
  m.metric_name,
  p.period_end_date,
  p.fiscal_year,
  p.fiscal_quarter,
  m.metric_value as value,
  m.metric_unit as unit
FROM ref('fact_financial_metrics') m
INNER JOIN ref('dim_period') p ON m.period_key = p.period_key
INNER JOIN ref('dim_company') c ON m.company_key = c.company_key
WHERE c.ticker = 'AAPL'
ORDER BY p.period_end_date, m.metric_name
*/
