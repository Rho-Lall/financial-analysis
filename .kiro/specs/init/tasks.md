# Implementation Plan

# Setup

- [ ] 1. Set up project structure and development environment
  - [ ] 1.1 Create directory structure for extraction, dbt_project, and dashboard
    - Create `extraction/`, `dbt_project/`, `dashboard/`, `data/` directories
    - Initialize Python virtual environment with requirements.txt
    - _Requirements: 1.1_
  - [ ] 1.2 Initialize React dashboard with TypeScript and D3.js
    - Create React app with Vite and TypeScript
    - Install D3.js dependencies
    - _Requirements: 6.1, 7.1, 8.1_

---

- [ ] 2. Install and configure dbt Fusion
  - Install dbt Fusion extension from VS Code marketplace
  - Follow setup guide: https://docs.getdbt.com/docs/install-dbt-extension
  - Configure extension settings for project
  - _Requirements: 2.1_

---

- [ ] 3. Initialize dbt project with DuckDB adapter
  - Run `dbt init` and configure for DuckDB
  - Create `profiles.yml` pointing to local DuckDB database
  - _Requirements: 2.1_

---

# Present (Dashboard First)

- [ ] 4. Set up GitHub Pages deployment pipeline
  - [ ] 4.1 Configure GitHub Actions workflow for static site deployment
    - Create `.github/workflows/deploy.yml` for GitHub Pages
    - _Requirements: 10.4_
  - [ ] 4.2 Deploy placeholder page to verify pipeline works
    - Create simple index.html placeholder
    - Verify site is accessible at GitHub Pages URL
    - _Requirements: 10.4_

---

- [ ] 5. Define JSON data contracts with dummy data
  - [ ] 5.1 Create TypeScript interfaces for financial data
    - Define IncomeStatementData, BalanceSheetData, CashFlowData, FinancialMetrics types
    - _Requirements: 6.1, 7.1, 8.1_
  - [ ] 5.2 Generate dummy JSON files matching expected schema
    - Create income_statement.json, balance_sheet.json, cash_flow.json, financial_metrics.json with realistic sample data
    - Include metadata object with export_timestamp and ticker
    - _Requirements: 5.1, 5.3_

---

- [ ] 6. Implement Dashboard - Core Components
  - [ ] 6.1 Create shared components (Header, Footer, Navigation, ScoreCard)
    - Implement header with company name, ticker, and navigation links
    - Include navigation link to dbt docs site (placeholder URL for now)
    - Implement scorecard tile component for KPIs
    - _Requirements: 9.1, 9.2, 9.3_
  - [ ] 6.2 Create useFinancialData hook for JSON loading
    - Fetch and parse JSON files from public/data/
    - Handle loading and error states
    - _Requirements: 6.1, 7.1, 8.1_

---

- [ ] 7. Implement Dashboard - Chart Components
  - [ ] 7.1 Create StackedBarChart component with D3.js
    - Implement reusable stacked bar chart with tooltips
    - _Requirements: 6.1, 7.1, 8.1_
  - [ ] 7.2 Create SankeyDiagram component for income statement
    - Implement Sankey diagram showing revenue breakdown
    - _Requirements: 6.2_
  - [ ] 7.3 Create LineOverlay component for ratio overlay
    - Implement line chart overlay for debt-to-equity ratio
    - _Requirements: 7.2_
  - [ ] 7.4 Create DataTable component for financial statements
    - Implement table displaying most recent period values
    - _Requirements: 6.3, 7.3_

---

- [ ] 8. Implement Dashboard - Page Views
  - [ ] 8.1 Create Income Statement page
    - Compose stacked bar chart, Sankey diagram, and data table
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  - [ ] 8.2 Create Balance Sheet page
    - Compose stacked bar chart with line overlay, data table, and scorecards
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  - [ ] 8.3 Create Cash Flow page
    - Compose stacked bar chart and FCF scorecard
    - _Requirements: 8.1, 8.2, 8.3, 8.4_
  - [ ] 8.4 Implement responsive mobile layout
    - Add CSS media queries for screens < 768px
    - _Requirements: 9.4_

---

- [ ] 9. Deploy production dashboard to GitHub Pages
  - Deploy full dashboard with dummy data
  - Verify all pages render correctly on live site
  - _Requirements: 10.4_

---

- [ ] 10. Checkpoint - Verify production dashboard with dummy data
  - Ensure all tests pass, ask the user if questions arise.

---

# Transform (Working Backwards)

## Scaffold dbt Layer Structure

- [ ] 11. Set up dbt project folder structure for all layers
  - Create folder hierarchy: staging/, raw_vault/, business_vault/, marts/, exports/
  - Create subfolders: raw_vault/hubs/, raw_vault/links/, raw_vault/satellites/
  - Create subfolders: marts/dimensions/, marts/facts/
  - Add placeholder .gitkeep or README files to establish structure
  - Create seeds/account_mappings.csv with XBRL tag mappings
  - Create macros/hash_key.sql and macros/hash_diff.sql stubs
  - _Requirements: 2.1_

---

## Export Layer

- [ ] 12. Implement Export Layer dbt models
  - [ ] 12.1 Create export dbt models matching JSON contracts
    - Create export_income_statement, export_balance_sheet, export_cash_flow, export_financial_metrics models
    - Models pull from Information Marts (dim_period, fact_financial_statement, fact_financial_metrics)
    - Output schema must match dummy JSON contracts
    - _Requirements: 5.1_
  - [ ] 12.2 Implement JSON export script
    - Query export models and write JSON files to dashboard/public/data/
    - Include metadata with export_timestamp and ticker
    - _Requirements: 5.1, 5.3, 5.4_
  - [ ]* 12.3 Write property test for JSON export size constraint
    - **Property 6: JSON Export Size Constraint**
    - **Validates: Requirements 5.2**
  - [ ]* 12.4 Write property test for JSON metadata presence
    - **Property 7: JSON Metadata Presence**
    - **Validates: Requirements 5.3**

---

## Information Marts (Star Schema)

- [ ] 13. Implement Information Marts dbt models
  - [ ] 13.1 Create dimension models (dim_company, dim_period, dim_account)
    - dim_company sourced from bv_company
    - dim_period sourced from bv_financial_period  
    - dim_account sourced from bv_account
    - _Requirements: 4.1, 4.2, 4.3_
  - [ ] 13.2 Create fact_financial_statement model
    - Grain: company + period + account
    - Joins dim_company, dim_period, dim_account with bv_ledger
    - _Requirements: 4.4_
  - [ ] 13.3 Create fact_financial_metrics model with calculated ratios
    - Implement revenue growth, margins, leverage ratios, FCF metrics
    - _Requirements: 4.5, 4.6_
  - [ ]* 13.4 Write property test for financial metric calculations
    - **Property 4: Financial Metric Calculation Correctness**
    - **Validates: Requirements 4.6**
  - [ ]* 13.5 Write property test for margin calculation bounds
    - **Property 5: Margin Calculation Bounds**
    - **Validates: Requirements 4.6**
  - [ ] 13.6 Add dbt schema tests for Information Marts
    - Add referential integrity tests between facts and dimensions
    - _Requirements: 11.3_

---

- [ ] 14. Checkpoint - Verify mart layer produces correct export output
  - Ensure all tests pass, ask the user if questions arise.

---

# Extract (Pivot to Source Data)

- [ ] 15. Implement SEC Data Extraction
  - [ ] 15.1 Create SEC EDGAR API client with rate limiting
    - Implement `SECExtractor` class with ticker lookup and company facts retrieval
    - Add exponential backoff retry logic for rate limits
    - _Requirements: 1.1, 1.4_
  - [ ] 15.2 Implement financial statement extraction and staging
    - Parse XBRL response to extract income statement, balance sheet, cash flow data
    - Stage JSON files to local directory with ticker/date partitioning
    - _Requirements: 1.2, 1.3_
  - [ ]* 15.3 Write property test for staging path format
    - **Property 1: Staging Path Format Consistency**
    - **Validates: Requirements 1.3**
  - [ ]* 15.4 Write property test for financial statement completeness
    - **Property 2: Financial Statement Completeness**
    - **Validates: Requirements 1.2**
  - [ ] 15.5 Implement missing field handling and logging
    - Log warnings for missing XBRL fields, continue processing
    - _Requirements: 1.5_

---

# Load

- [ ] 16. Implement DuckDB Loader
  - [ ] 16.1 Create DuckDB loader to ingest staged JSON files
    - Implement `DuckDBLoader` class to read staged files into raw tables
    - Create raw tables mirroring SEC API response structure
    - _Requirements: 1.6, 2.1_
  - [ ] 16.2 Implement staging file cleanup after successful load
    - Delete staging files after data is loaded into DuckDB
    - _Requirements: 1.6_

---

- [ ] 17. Checkpoint - Verify extraction and load with real SEC data
  - Ensure all tests pass, ask the user if questions arise.

---

# Transform (Raw Vault & Business Vault)

- [ ] 18. Implement Raw Vault dbt models
  - [ ] 18.1 Create Hub models (hub_company, hub_financial_period, hub_account)
    - Implement hash key generation, load_datetime, record_source columns
    - Map SEC XBRL fields to hub business keys
    - _Requirements: 2.1, 2.2, 2.3, 2.11_
  - [ ]* 18.2 Write property test for Data Vault model structure
    - **Property 3: Data Vault Model Structure**
    - **Validates: Requirements 2.9, 2.10**
  - [ ] 18.3 Create Link models (link_company_period_filing_header, link_period_account_filing_detail)
    - link_company_period_filing_header connects hub_company and hub_financial_period
    - link_period_account_filing_detail connects link_company_period_filing_header and hub_account
    - Implement relationship hash keys
    - _Requirements: 2.4, 2.5, 2.11_
  - [ ] 18.4 Create Satellite models (sat_company, sat_account, sat_filing_header, sat_filing_detail, sat_financial_period)
    - sat_company hangs off hub_company
    - sat_account hangs off hub_account
    - sat_filing_header hangs off link_company_period_filing_header
    - sat_filing_detail hangs off link_period_account_filing_detail
    - sat_financial_period hangs off hub_financial_period
    - Implement hash_diff for change detection
    - _Requirements: 2.6, 2.7, 2.8, 2.9, 2.10, 2.11, 2.12_
  - [ ] 18.5 Add dbt schema tests for Raw Vault
    - Add unique and not_null tests for hash keys and business keys
    - _Requirements: 11.1, 11.2_

---

- [ ] 19. Implement Business Vault dbt models
  - [ ] 19.1 Create bv_company model
    - Apply SCD Type 1 logic to get latest company attributes
    - _Requirements: 3.1_
  - [ ] 19.2 Create bv_financial_period model
    - Map fiscal periods to calendar dates
    - _Requirements: 3.2_
  - [ ] 19.3 Create bv_account model
    - Map XBRL tags to display names using account mapping table
    - _Requirements: 3.3_
  - [ ] 19.4 Create bv_ledger model
    - Join sat_filing_header and sat_filing_detail for complete filing context
    - Handle NULLs and standardize units
    - _Requirements: 3.4_

---

- [ ] 20. Checkpoint - Verify full dbt pipeline end-to-end
  - Ensure all tests pass, ask the user if questions arise.

---

# dbt Docs Site

- [ ] 21. Generate and deploy dbt docs site
  - [ ] 21.1 Add model and column descriptions to schema.yml files
    - Add descriptions for all dbt models and columns
    - _Requirements: 10.3_
  - [ ] 21.2 Run `dbt docs generate` and verify DAG visualization
    - Generate dbt docs site with lineage graph
    - _Requirements: 10.1, 10.2_
  - [ ] 21.3 Deploy dbt docs site alongside dashboard
    - Update GitHub Pages deployment to include dbt docs
    - Update dashboard navigation link to point to dbt docs site
    - _Requirements: 10.4, 10.5_

---

- [ ] 22. Final Checkpoint - End-to-end verification with real data
  - Ensure all tests pass, ask the user if questions arise.
