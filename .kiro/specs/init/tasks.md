# Implementation Plan

- [ ] 1. Set up project structure and development environment
  - [ ] 1.1 Create directory structure for extraction, dbt_project, and dashboard
    - Create `extraction/`, `dbt_project/`, `dashboard/`, `data/` directories
    - Initialize Python virtual environment with requirements.txt
    - _Requirements: 1.1_
  - [ ] 1.2 Initialize dbt project with DuckDB adapter
    - Run `dbt init` and configure for DuckDB
    - Create `profiles.yml` pointing to local DuckDB database
    - _Requirements: 2.1_
  - [ ] 1.3 Initialize React dashboard with TypeScript and D3.js
    - Create React app with Vite and TypeScript
    - Install D3.js dependencies
    - _Requirements: 6.1, 7.1, 8.1_

---

- [ ] 2. Implement SEC Data Extraction
  - [ ] 2.1 Create SEC EDGAR API client with rate limiting
    - Implement `SECExtractor` class with ticker lookup and company facts retrieval
    - Add exponential backoff retry logic for rate limits
    - _Requirements: 1.1, 1.4_
  - [ ]* 2.2 Write property test for staging path format
    - **Property 1: Staging Path Format Consistency**
    - **Validates: Requirements 1.3**
  - [ ] 2.3 Implement financial statement extraction and staging
    - Parse XBRL response to extract income statement, balance sheet, cash flow data
    - Stage JSON files to local directory with ticker/date partitioning
    - _Requirements: 1.2, 1.3_
  - [ ]* 2.4 Write property test for financial statement completeness
    - **Property 2: Financial Statement Completeness**
    - **Validates: Requirements 1.2**
  - [ ] 2.5 Implement missing field handling and logging
    - Log warnings for missing XBRL fields, continue processing
    - _Requirements: 1.5_

---

- [ ] 3. Implement DuckDB Loader
  - [ ] 3.1 Create DuckDB loader to ingest staged JSON files
    - Implement `DuckDBLoader` class to read staged files into raw tables
    - Create raw tables mirroring SEC API response structure
    - _Requirements: 1.6, 2.1_
  - [ ] 3.2 Implement staging file cleanup after successful load
    - Delete staging files after data is loaded into DuckDB
    - _Requirements: 1.6_

---

- [ ] 4. Checkpoint - Verify extraction and load pipeline
  - Ensure all tests pass, ask the user if questions arise.

---

- [ ] 5. Implement Raw Vault dbt models
  - [ ] 5.1 Create Hub models (hub_company, hub_financial_period, hub_account)
    - Implement hash key generation, load_datetime, record_source columns
    - _Requirements: 2.1, 2.2, 2.3, 2.9_
  - [ ]* 5.2 Write property test for Data Vault model structure
    - **Property 3: Data Vault Model Structure**
    - **Validates: Requirements 2.9, 2.10**
  - [ ] 5.3 Create Link models (link_company_period, link_period_account)
    - Implement relationship hash keys connecting Hubs
    - _Requirements: 2.4, 2.5, 2.9_
  - [ ] 5.4 Create Satellite models (sat_company_details, sat_financial_statement, sat_period_attributes)
    - Implement hash_diff for change detection
    - _Requirements: 2.6, 2.7, 2.8, 2.10_
  - [ ] 5.5 Add dbt schema tests for Raw Vault
    - Add unique and not_null tests for hash keys and business keys
    - _Requirements: 11.1, 11.2_

---

- [ ] 6. Implement Business Vault dbt models
  - [ ] 6.1 Create bv_company_current model
    - Apply SCD Type 1 logic to get latest company attributes
    - _Requirements: 3.1_
  - [ ] 6.2 Create bv_period_calendar model
    - Map fiscal periods to calendar dates
    - _Requirements: 3.2_
  - [ ] 6.3 Create bv_account_standardized model
    - Map XBRL tags to display names using account mapping table
    - _Requirements: 3.3_
  - [ ] 6.4 Create bv_financial_values model
    - Handle NULLs and standardize units
    - _Requirements: 3.4_

---

- [ ] 7. Implement Information Marts dbt models
  - [ ] 7.1 Create dimension models (dim_company, dim_period, dim_account)
    - Build star schema dimensions from Business Vault
    - _Requirements: 4.1, 4.2, 4.3_
  - [ ] 7.2 Create fact_financial_statement model
    - Grain: company + period + account
    - _Requirements: 4.4_
  - [ ] 7.3 Create fact_financial_metrics model with calculated ratios
    - Implement revenue growth, margins, leverage ratios, FCF metrics
    - _Requirements: 4.5, 4.6_
  - [ ]* 7.4 Write property test for financial metric calculations
    - **Property 4: Financial Metric Calculation Correctness**
    - **Validates: Requirements 4.6**
  - [ ]* 7.5 Write property test for margin calculation bounds
    - **Property 5: Margin Calculation Bounds**
    - **Validates: Requirements 4.6**
  - [ ] 7.6 Add dbt schema tests for Information Marts
    - Add referential integrity tests between facts and dimensions
    - _Requirements: 11.3_

---

- [ ] 8. Checkpoint - Verify dbt pipeline end-to-end
  - Ensure all tests pass, ask the user if questions arise.

---

- [ ] 9. Implement Export Layer
  - [ ] 9.1 Create export dbt models for JSON-ready datasets
    - Create export_income_statement, export_balance_sheet, export_cash_flow, export_financial_metrics models
    - _Requirements: 5.1_
  - [ ] 9.2 Implement JSON export script
    - Query export models and write JSON files to dashboard/public/data/
    - Include metadata with export_timestamp and ticker
    - _Requirements: 5.1, 5.3, 5.4_
  - [ ]* 9.3 Write property test for JSON export size constraint
    - **Property 6: JSON Export Size Constraint**
    - **Validates: Requirements 5.2**
  - [ ]* 9.4 Write property test for JSON metadata presence
    - **Property 7: JSON Metadata Presence**
    - **Validates: Requirements 5.3**

---

- [ ] 10. Implement Dashboard - Core Components
  - [ ] 10.1 Create shared components (Header, Footer, Navigation, ScoreCard)
    - Implement header with company name, ticker, and navigation links
    - Implement scorecard tile component for KPIs
    - _Requirements: 9.1, 9.2, 9.3_
  - [ ] 10.2 Create useFinancialData hook for JSON loading
    - Fetch and parse JSON files from public/data/
    - Handle loading and error states
    - _Requirements: 6.1, 7.1, 8.1_
  - [ ] 10.3 Create TypeScript interfaces for financial data
    - Define IncomeStatementData, BalanceSheetData, CashFlowData, FinancialMetrics types
    - _Requirements: 6.1, 7.1, 8.1_

---

- [ ] 11. Implement Dashboard - Chart Components
  - [ ] 11.1 Create StackedBarChart component with D3.js
    - Implement reusable stacked bar chart with tooltips
    - _Requirements: 6.1, 7.1, 8.1_
  - [ ] 11.2 Create SankeyDiagram component for income statement
    - Implement Sankey diagram showing revenue breakdown
    - _Requirements: 6.2_
  - [ ] 11.3 Create LineOverlay component for ratio overlay
    - Implement line chart overlay for debt-to-equity ratio
    - _Requirements: 7.2_
  - [ ] 11.4 Create DataTable component for financial statements
    - Implement table displaying most recent period values
    - _Requirements: 6.3, 7.3_

---

- [ ] 12. Implement Dashboard - Page Views
  - [ ] 12.1 Create Income Statement page
    - Compose stacked bar chart, Sankey diagram, and data table
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  - [ ] 12.2 Create Balance Sheet page
    - Compose stacked bar chart with line overlay, data table, and scorecards
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  - [ ] 12.3 Create Cash Flow page
    - Compose stacked bar chart and FCF scorecard
    - _Requirements: 8.1, 8.2, 8.3, 8.4_
  - [ ] 12.4 Implement responsive mobile layout
    - Add CSS media queries for screens < 768px
    - _Requirements: 9.4_

---

- [ ] 13. Checkpoint - Verify dashboard renders correctly
  - Ensure all tests pass, ask the user if questions arise.

---

- [ ] 14. Implement Documentation Site
  - [ ] 14.1 Add dbt model descriptions and column documentation
    - Add descriptions to all models in schema.yml files
    - _Requirements: 10.3_
  - [ ] 14.2 Configure dbt docs generation
    - Run `dbt docs generate` and verify DAG visualization
    - _Requirements: 10.1, 10.2_
  - [ ] 14.3 Set up GitHub Pages deployment
    - Configure build script to combine dashboard and dbt docs
    - Add navigation link from dashboard to dbt docs
    - _Requirements: 9.3, 10.4, 10.5_

---

- [ ] 15. Final Checkpoint - End-to-end verification
  - Ensure all tests pass, ask the user if questions arise.
