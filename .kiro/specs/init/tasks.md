# Implementation Plan

# Setup

- [x] 1. Set up project structure and development environment
  - [x] 1.1 Create directory structure for extraction, dbt_project, and dashboard
    - Create `extraction/`, `dbt_project/`, `dashboard/`, `data/` directories
    - Initialize Python virtual environment with requirements.txt
    - _Requirements: 1.1_
    - _Estimated time: 10 minutes_
    - _Model: Sonnet (straightforward setup)_
  - [x] 1.2 Initialize React dashboard with TypeScript and D3.js
    - Create React app with Vite and TypeScript
    - Install D3.js dependencies
    - _Requirements: 6.1, 7.1, 8.1_
    - _Estimated time: 15 minutes_
    - _Model: Sonnet (standard tooling setup)_

---

- [x] 2. Install and configure dbt Fusion
  - Install dbt Fusion extension from VS Code marketplace
  - Follow setup guide: https://docs.getdbt.com/docs/install-dbt-extension
  - Configure extension settings for project
  - _Requirements: 2.1_
  - _Estimated time: 10 minutes_
  - _Model: Sonnet (configuration task)_

---

- [x] 3. Initialize dbt project with Snowflake adapter
  - Run `dbt init` and configure for Snowflake
  - Create `profiles.yml` pointing to Snowflake Database
  - _Requirements: 2.1_
  - _Estimated time: 15 minutes_
  - _Model: Sonnet (standard dbt setup)_

---

# Present (Dashboard First)

- [x] 4. Set up GitHub Pages deployment pipeline
  - [x] 4.1 Configure GitHub Actions workflow for static site deployment
    - Create `.github/workflows/deploy.yml` for GitHub Pages
    - _Requirements: 10.4_
    - _Estimated time: 20 minutes_
    - _Model: Sonnet (YAML configuration)_
  - [x] 4.2 Deploy placeholder page to verify pipeline works
    - Create simple index.html placeholder
    - Verify site is accessible at GitHub Pages URL
    - _Requirements: 10.4_
    - _Estimated time: 10 minutes_
    - _Model: Sonnet (simple HTML)_

---

- [x] 5. Define JSON data contracts with dummy data
  - [x] 5.1 Create TypeScript interfaces for financial data
    - Define IncomeStatementData, BalanceSheetData, CashFlowData, FinancialMetrics types
    - _Requirements: 6.1, 7.1, 8.1_
    - _Estimated time: 15 minutes_
    - _Model: Sonnet (type definitions)_
  - [x] 5.2 Generate dummy JSON files matching expected schema
    - Create income_statement.json, balance_sheet.json, cash_flow.json, financial_metrics.json with realistic sample data
    - Include metadata object with export_timestamp and ticker
    - _Requirements: 5.1, 5.3_
    - _Estimated time: 20 minutes_
    - _Model: Sonnet (data generation)_

---

- [x] 6. Implement Dashboard - Core Components
  - [x] 6.1 Create shared components (Header, Footer, Navigation, ScoreCard)
    - Implement header with company name, ticker, and navigation links
    - Include navigation link to dbt docs site (placeholder URL for now)
    - Implement scorecard tile component for KPIs
    - _Requirements: 9.1, 9.2, 9.3_
    - _Estimated time: 30 minutes_
    - _Model: Opus (UI component design)_
  - [x] 6.2 Create useFinancialData hook for JSON loading
    - Fetch and parse JSON files from public/data/
    - Handle loading and error states
    - _Requirements: 6.1, 7.1, 8.1_
    - _Estimated time: 20 minutes_
    - _Model: Sonnet (standard React hook)_

---

- [x] 7. Implement Dashboard - Chart Components
  - [x] 7.1 Create StackedBarChart component with D3.js
    - Implement reusable stacked bar chart with tooltips
    - _Requirements: 6.1, 7.1, 8.1_
    - _Estimated time: 45 minutes_
    - _Model: Opus (complex D3.js visualization)_
  - [x] 7.2 Create SankeyDiagram component for income statement
    - Implement Sankey diagram showing revenue breakdown
    - _Requirements: 6.2_
    - _Estimated time: 60 minutes_
    - _Model: Opus (complex D3.js Sankey)_
  - [x] 7.3 Create LineOverlay component for ratio overlay
    - Implement line chart overlay for debt-to-equity ratio
    - _Requirements: 7.2_
    - _Estimated time: 30 minutes_
    - _Model: Opus (D3.js overlay logic)_
  - [x] 7.4 Create DataTable component for financial statements
    - Implement table displaying most recent period values
    - _Requirements: 6.3, 7.3_
    - _Estimated time: 20 minutes_
    - _Model: Sonnet (standard table component)_

---

- [x] 8. Implement Dashboard - Page Views
  - [x] 8.1 Create Income Statement page
    - Compose stacked bar chart, Sankey diagram, and data table
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
    - _Estimated time: 25 minutes_
    - _Model: Sonnet (component composition)_
  - [x] 8.2 Create Balance Sheet page
    - Compose stacked bar chart with line overlay, data table, and scorecards
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
    - _Estimated time: 25 minutes_
    - _Model: Sonnet (component composition)_
  - [x] 8.3 Create Cash Flow page
    - Compose stacked bar chart and FCF scorecard
    - _Requirements: 8.1, 8.2, 8.3, 8.4_
    - _Estimated time: 20 minutes_
    - _Model: Sonnet (component composition)_
  - [x] 8.4 Implement responsive mobile layout
    - Add CSS media queries for screens < 768px
    - _Requirements: 9.4_
    - _Estimated time: 30 minutes_
    - _Model: Opus (responsive design)_

---

- [x] 9. Deploy production dashboard to GitHub Pages
  - Deploy full dashboard with dummy data
  - Verify all pages render correctly on live site
  - _Requirements: 10.4_
  - _Estimated time: 15 minutes_
  - _Model: Sonnet (deployment verification)_

---

- [x] 10. Checkpoint - Verify production dashboard with dummy data
  - Ensure all tests pass, ask the user if questions arise.
  - _Estimated time: 10 minutes_
  - _Model: Either (manual verification)_

---

# Transform (Working Backwards)

## Scaffold dbt Layer Structure

- [x] 11. Set up dbt project folder structure for all layers
  - Create folder hierarchy: staging/, raw_vault/, business_vault/, marts/, exports/
  - Create subfolders: raw_vault/hubs/, raw_vault/links/, raw_vault/satellites/
  - Create subfolders: marts/dimensions/, marts/facts/
  - Add placeholder .gitkeep or README files to establish structure
  - Create seeds/account_mappings.csv with XBRL tag mappings
  - Create macros/hash_key.sql and macros/hash_diff.sql stubs
  - _Requirements: 2.1_
  - _Estimated time: 20 minutes_
  - _Model: Sonnet (folder structure and scaffolding)_

---

## Export Layer

- [x] 12. Implement Export Layer dbt models
  - [x] 12.1 Create export dbt models matching JSON contracts
    - Create export_income_statement, export_balance_sheet, export_cash_flow, export_financial_metrics models
    - Models pull from Information Marts (dim_period, fact_financial_statement, fact_financial_metrics)
    - Output schema must match dummy JSON contracts
    - _Requirements: 5.1_
    - _Estimated time: 40 minutes_
    - _Model: Opus (complex SQL joins and transformations)_
  - [x] 12.2 Implement JSON export script
    - Query export models and write JSON files to dashboard/public/data/
    - Include metadata with export_timestamp and ticker
    - _Requirements: 5.1, 5.3, 5.4_
    - _Estimated time: 25 minutes_
    - _Model: Sonnet (Python script with DuckDB queries)_
  - [x]* 12.3 Write property test for JSON export size constraint
    - **Property 6: JSON Export Size Constraint**
    - **Validates: Requirements 5.2**
    - _Estimated time: 20 minutes_
    - _Model: Sonnet (property test implementation)_
  - [x]* 12.4 Write property test for JSON metadata presence
    - **Property 7: JSON Metadata Presence**
    - **Validates: Requirements 5.3**
    - _Estimated time: 15 minutes_
    - _Model: Sonnet (property test implementation)_

---

## Information Marts (Star Schema)

- [x] 13. Implement Information Marts dbt models
  - [x] 13.1 Create dimension models (dim_company, dim_period, dim_account)
    - dim_company sourced from bv_company
    - dim_period sourced from bv_financial_period
    - dim_account sourced from bv_account
    - _Requirements: 4.1, 4.2, 4.3_
    - _Estimated time: 35 minutes_
    - _Model: Opus (dimension modeling with SCD logic)_
  - [x] 13.2 Create fact_financial_statement model
    - Grain: company + period + account
    - Joins dim_company, dim_period, dim_account with bv_ledger
    - _Requirements: 4.4_
    - _Estimated time: 30 minutes_
    - _Model: Opus (complex fact table joins)_
  - [x] 13.3 Create fact_financial_metrics model with calculated ratios
    - Implement revenue growth, margins, leverage ratios, FCF metrics
    - _Requirements: 4.5, 4.6_
    - _Estimated time: 45 minutes_
    - _Model: Opus (complex financial calculations)_
  - [x] 13.4 Add dbt schema tests for Information Marts
    - Add referential integrity tests between facts and dimensions
    - _Requirements: 11.3_
    - _Estimated time: 15 minutes_
    - _Model: Sonnet (dbt test configuration)_

---

# Extract (Pivot to Source Data)

- [x] 14. Create dbt Sources for Snowflake Cybersyn
  - [x] 14.1 Create dbt source definitions for Cybersyn tables
    - Location: `models/sourcing/sources.yml`
    - _Requirements: 1.1_
  - [x] 14.2 Create company seed for ticker-to-CIK mapping
    - Location: `seeds/companies.csv`
    - _Requirements: 1.1_
  - [x] 14.3 Create src_ source models with company filtering
    - `src_sec_cik_index.sql` - company index data
    - `src_sec_report_attributes.sql` - financial data filtered by companies seed
    - _Requirements: 1.2, 1.3_
  - [x] 14.4 Add schema tests for sourcing models (deferred)
    - _Requirements: 11.1_

---

- [x] 15. Checkpoint - Verify Cybersyn source and sourcing models
  - Run `dbt seed` to load companies.csv
  - Run `dbt run --select sourcing` to verify sourcing models work
  - Verify data is being pulled correctly from Snowflake Cybersyn
  - _Model: Either (manual verification)_

---

# Transform (Raw Vault & Business Vault)

- [x] 17. Implement Raw Vault dbt models
  - [x] 17.1 Create Hub models (hub_company, hub_financial_period, hub_account)
    - Implement hash key generation, load_datetime, record_source columns
    - Map SEC XBRL fields to hub business keys
    - _Requirements: 2.1, 2.2, 2.3, 2.11_
    - _Estimated time: 35 minutes_
    - _Model: Opus (Data Vault hash key logic)_
  - [x]* 17.2 Write property test for Data Vault model structure
    - **Property 3: Data Vault Model Structure**
    - **Validates: Requirements 2.9, 2.10**
    - _Estimated time: 25 minutes_
    - _Model: Sonnet (property test for structure)_
  - [x] 17.3 Create Link models (link_company_period_filing_header, link_period_account_filing_detail)
    - link_company_period_filing_header connects hub_company and hub_financial_period
    - link_period_account_filing_detail connects link_company_period_filing_header and hub_account
    - Implement relationship hash keys
    - _Requirements: 2.4, 2.5, 2.11_
    - _Estimated time: 40 minutes_
    - _Model: Opus (complex link relationships)_
  - [x] 17.4 Create Satellite models (sat_company, sat_account, sat_filing_header, sat_filing_detail, sat_financial_period)
    - sat_company hangs off hub_company
    - sat_account hangs off hub_account
    - sat_filing_header hangs off link_company_period_filing_header
    - sat_filing_detail hangs off link_period_account_filing_detail
    - sat_financial_period hangs off hub_financial_period
    - Implement hash_diff for change detection
    - _Requirements: 2.6, 2.7, 2.8, 2.9, 2.10, 2.11, 2.12_
    - _Estimated time: 50 minutes_
    - _Model: Opus (5 satellites with hash_diff logic)_
  - [x] 17.5 Add dbt schema tests for Raw Vault
    - Add unique and not_null tests for hash keys and business keys
    - _Requirements: 11.1, 11.2_
    - _Estimated time: 20 minutes_
    - _Model: Sonnet (dbt test configuration)_
  - [x]* 17.6 Write property test for financial metric calculations
    - **Property 4: Financial Metric Calculation Correctness**
    - **Validates: Requirements 4.6**
    - _Estimated time: 25 minutes_
    - _Model: Sonnet (property test with calculations)_
  - [x]* 17.7 Write property test for margin calculation bounds
    - **Property 5: Margin Calculation Bounds**
    - **Validates: Requirements 4.6**
    - _Estimated time: 20 minutes_
    - _Model: Sonnet (property test with bounds checking)_

---

- [x] 18. Implement Business Vault dbt models
  - [x] 18.1 Create bv_company model
    - Apply SCD Type 1 logic to get latest company attributes
    - _Requirements: 3.1_
    - _Estimated time: 25 minutes_
    - _Model: Opus (SCD Type 1 logic)_
  - [x] 18.2 Create bv_financial_period model
    - Map fiscal periods to calendar dates
    - _Requirements: 3.2_
    - _Estimated time: 30 minutes_
    - _Model: Opus (fiscal-to-calendar conversion)_
  - [x] 18.3 Create bv_account model
    - Map XBRL tags to display names using account mapping table
    - _Requirements: 3.3_
    - _Estimated time: 20 minutes_
    - _Model: Sonnet (seed table join)_
  - [x] 18.4 Create bv_ledger model
    - Join sat_filing_header and sat_filing_detail for complete filing context
    - Handle NULLs and standardize units
    - _Requirements: 3.4_
    - _Estimated time: 35 minutes_
    - _Model: Opus (complex multi-satellite join)_

---

- [x] 19. Checkpoint - Verify full dbt pipeline end-to-end
  - Verify Raw Vault, Business Vault, and Information Marts produce correct output
  - Verify mart layer produces correct export output with real data
  - Ensure all dbt tests pass
  - _Estimated time: 20 minutes_
  - _Model: Either (manual verification)_

---

# dbt Docs Site

- [x] 20. Generate and deploy dbt docs site
  - [x] 20.1 Add model and column descriptions to schema.yml files
    - Add descriptions for all dbt models and columns
    - _Requirements: 10.3_
    - _Estimated time: 40 minutes_
    - _Model: Opus (comprehensive documentation)_
  - [x] 20.2 Run `dbt docs generate` and verify DAG visualization
    - Generate dbt docs site with lineage graph
    - _Requirements: 10.1, 10.2_
    - _Estimated time: 15 minutes_
    - _Model: Sonnet (command execution and verification)_
  - [x] 20.3 Deploy dbt docs site alongside dashboard
    - Update GitHub Pages deployment to include dbt docs
    - Update dashboard navigation link to point to dbt docs site
    - _Requirements: 10.4, 10.5_
    - _Estimated time: 25 minutes_
    - _Model: Sonnet (deployment configuration)_

---

- [ ] 21. Final Checkpoint - End-to-end verification with real data
  - Ensure all tests pass, ask the user if questions arise.
  - _Estimated time: 20 minutes_
  - _Model: Either (manual verification)_
