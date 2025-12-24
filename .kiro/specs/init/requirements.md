# Requirements Document: dbt Fusion Financial Analytics POC

## Introduction

This document specifies requirements for a proof-of-concept financial analytics platform demonstrating dbt Fusion capabilities, Data Vault 2.0 modeling, and interactive financial reporting. The POC extracts SEC financial data, transforms it through a Data Vault architecture, and presents it via a static React dashboard with integrated dbt documentation.

## Glossary

- **Data Extraction System**: The Python-based component that retrieves SEC financial data via API
- **Raw Vault**: The dbt models implementing source-aligned Data Vault 2.0 (Hubs, Links, Satellites) with no business logic
- **Business Vault**: The dbt models applying business rules, standardization, and derived calculations
- **Information Marts**: The dbt models implementing Star Schema (dimensions and facts) for analytics consumption
- **Export Layer**: The dbt models and scripts generating JSON files for dashboard consumption
- **Dashboard**: The React + D3.js web application displaying financial visualizations
- **Documentation Site**: The combined GitHub Pages deployment including dashboard and dbt docs
- **Ticker Symbol**: A stock market identifier (e.g., AAPL, MSFT)
- **SEC EDGAR**: The SEC's Electronic Data Gathering, Analysis, and Retrieval system
- **Hub**: A Data Vault entity storing unique business keys
- **Link**: A Data Vault entity storing relationships between Hubs
- **Satellite**: A Data Vault entity storing descriptive attributes and history

## Requirements

### Requirement 1: SEC Data Extraction

**User Story:** As a data engineer, I want to extract SEC financial data for any ticker symbol, so that I can populate the data warehouse with historical financial statements.

#### Acceptance Criteria

1. WHEN a user provides a ticker symbol as input THEN the Data Extraction System SHALL retrieve 10-K and 10-Q filings from SEC EDGAR API for that ticker
2. WHEN the Data Extraction System retrieves filings THEN the Data Extraction System SHALL extract Income Statement, Balance Sheet, and Cash Flow Statement data spanning at minimum 10 years of quarterly periods
3. WHEN extraction completes THEN the Data Extraction System SHALL stage raw JSON files using the path pattern `ticker={TICKER}/filing_date={YYYY-MM-DD}/` to either local directory or S3 bucket
4. IF the SEC EDGAR API returns a rate limit error THEN the Data Extraction System SHALL retry with exponential backoff up to 3 attempts
5. IF a filing contains missing or null values for required fields THEN the Data Extraction System SHALL log the missing fields and continue processing remaining data
6. WHEN staged data is successfully loaded into DuckDB THEN the Data Extraction System SHALL delete the staging files

---

### Requirement 2: Raw Vault Transformation

**User Story:** As a data architect, I want financial data modeled using Data Vault 2.0 methodology in a Raw Vault, so that I can maintain full history and support future source integration.

#### Acceptance Criteria

1. WHEN raw SEC data is loaded into DuckDB THEN the Raw Vault SHALL create Hub_Company with ticker symbol as business key
2. WHEN raw SEC data is loaded into DuckDB THEN the Raw Vault SHALL create Hub_Financial_Period with fiscal year and quarter as composite business key
3. WHEN raw SEC data is loaded into DuckDB THEN the Raw Vault SHALL create Hub_Account with SEC account identifier as business key
4. WHEN Hubs are populated THEN the Raw Vault SHALL create Link_Company_Period connecting companies to their reporting periods
5. WHEN Hubs are populated THEN the Raw Vault SHALL create Link_Period_Account connecting periods to financial line items
6. WHEN Links are created THEN the Raw Vault SHALL create Sat_Company_Details storing company name, sector, and industry
7. WHEN Links are created THEN the Raw Vault SHALL create Sat_Financial_Statement storing line item values and statement type
8. WHEN Links are created THEN the Raw Vault SHALL create Sat_Period_Attributes storing filing date and fiscal year end
9. WHEN any Raw Vault model is created THEN the Raw Vault SHALL include load_datetime, record_source, and hash_key columns
10. WHEN any Satellite is created THEN the Raw Vault SHALL include hash_diff column for change detection
11. WHEN Raw Vault models are materialized THEN the Raw Vault SHALL store output as tables in the DuckDB database

---

### Requirement 3: Business Vault Transformation

**User Story:** As a data engineer, I want business rules applied in a Business Vault layer, so that downstream consumers get standardized, clean data.

#### Acceptance Criteria

1. WHEN Raw Vault is populated THEN the Business Vault SHALL create bv_company_current with latest company attributes (SCD Type 1)
2. WHEN Raw Vault is populated THEN the Business Vault SHALL create bv_period_calendar mapping fiscal periods to calendar dates
3. WHEN Raw Vault is populated THEN the Business Vault SHALL create bv_account_standardized mapping XBRL tags to display names
4. WHEN Raw Vault is populated THEN the Business Vault SHALL create bv_financial_values with NULL handling and unit standardization

---

### Requirement 4: Information Marts Transformation

**User Story:** As a business analyst, I want financial data in a Star Schema format in Information Marts, so that I can perform analytical queries and calculate financial metrics.

#### Acceptance Criteria

1. WHEN Business Vault is populated THEN the Information Marts SHALL create Dim_Company containing company identifiers and metadata
2. WHEN Business Vault is populated THEN the Information Marts SHALL create Dim_Period containing fiscal periods with calendar date mapping
3. WHEN Business Vault is populated THEN the Information Marts SHALL create Dim_Account containing financial line item names and categories
4. WHEN dimension tables exist THEN the Information Marts SHALL create Fact_Financial_Statement at grain of company + period + account
5. WHEN Fact_Financial_Statement exists THEN the Information Marts SHALL create Fact_Financial_Metrics containing calculated ratios
6. WHEN calculating metrics THEN the Information Marts SHALL compute: revenue growth (YoY, QoQ), gross margin, operating margin, net margin, debt-to-equity ratio, ROA, FCF, and FCF-to-assets ratio
7. WHEN Information Mart models are materialized THEN the Information Marts SHALL store output as tables in the DuckDB database

---

### Requirement 5: Export Layer

**User Story:** As a frontend developer, I want Information Mart data exported as JSON files via an Export Layer, so that the static dashboard can consume data without a backend API.

#### Acceptance Criteria

1. WHEN Information Marts are complete THEN the Export Layer SHALL generate income_statement.json, balance_sheet.json, cash_flow.json, and financial_metrics.json
2. WHEN exporting JSON THEN the Export Layer SHALL ensure each file is smaller than 1MB
3. WHEN exporting JSON THEN the Export Layer SHALL include a metadata object with export_timestamp and ticker_symbol
4. WHEN export completes THEN the Export Layer SHALL write files to `dashboard/public/data/` folder for static serving

---

### Requirement 6: Income Statement Dashboard

**User Story:** As a financial analyst, I want to visualize income statement trends, so that I can understand revenue and expense patterns over time.

#### Acceptance Criteria

1. WHEN a user navigates to the Income Statement view THEN the Dashboard SHALL display a stacked bar chart showing quarterly net profit, cost of revenue, and total operating expenses
2. WHEN a user navigates to the Income Statement view THEN the Dashboard SHALL display a Sankey diagram showing revenue breakdown into expense categories and profit
3. WHEN a user navigates to the Income Statement view THEN the Dashboard SHALL display a table of the most recent quarter's income statement values
4. WHEN a user hovers over any chart element THEN the Dashboard SHALL display a tooltip with the exact value and period
5. WHEN rendering charts THEN the Dashboard SHALL include axis labels, legends, and a consistent color scheme

---

### Requirement 7: Balance Sheet Dashboard

**User Story:** As a financial analyst, I want to visualize balance sheet composition, so that I can assess the company's financial position and leverage.

#### Acceptance Criteria

1. WHEN a user navigates to the Balance Sheet view THEN the Dashboard SHALL display a stacked bar chart showing quarterly total equity and total liabilities
2. WHEN displaying the balance sheet chart THEN the Dashboard SHALL overlay a line showing debt-to-equity ratio for each period
3. WHEN a user navigates to the Balance Sheet view THEN the Dashboard SHALL display a table of the most recent balance sheet values
4. WHEN a user navigates to the Balance Sheet view THEN the Dashboard SHALL display scorecard tiles for current debt-to-equity ratio and ROA
5. WHEN a user hovers over any chart element THEN the Dashboard SHALL display a tooltip with the exact value and period

---

### Requirement 8: Cash Flow Dashboard

**User Story:** As a financial analyst, I want to visualize cash flow trends, so that I can evaluate the company's cash generation and capital allocation.

#### Acceptance Criteria

1. WHEN a user navigates to the Cash Flow view THEN the Dashboard SHALL display a stacked bar chart showing yearly values for capital expenditures, asset sale proceeds, and operating cash flow
2. WHEN a user navigates to the Cash Flow view THEN the Dashboard SHALL display a scorecard tile showing FCF-to-assets ratio
3. WHEN a user hovers over any chart element THEN the Dashboard SHALL display a tooltip with the exact value and period
4. WHEN rendering charts THEN the Dashboard SHALL include axis labels, legends, and a consistent color scheme

---

### Requirement 9: Dashboard Navigation and Layout

**User Story:** As a user, I want consistent navigation across dashboard views, so that I can easily move between financial statements and access documentation.

#### Acceptance Criteria

1. WHEN the Dashboard loads THEN the Dashboard SHALL display a header with company name and ticker symbol
2. WHEN the Dashboard loads THEN the Dashboard SHALL display navigation links to Income Statement, Balance Sheet, and Cash Flow views
3. WHEN the Dashboard loads THEN the Dashboard SHALL display a navigation link to dbt documentation
4. WHEN viewed on a screen narrower than 768px THEN the Dashboard SHALL reflow to a single-column mobile layout
5. WHEN any view loads THEN the Dashboard SHALL display the data-as-of date from the JSON metadata

---

### Requirement 10: Documentation Site

**User Story:** As a stakeholder, I want to view data lineage and model documentation, so that I can understand how financial metrics are derived.

#### Acceptance Criteria

1. WHEN dbt models are complete THEN the Documentation Site SHALL generate documentation using `dbt docs generate`
2. WHEN documentation is generated THEN the Documentation Site SHALL include a DAG visualization showing all model dependencies
3. WHEN documentation is generated THEN the Documentation Site SHALL include descriptions for all models and columns
4. WHEN deployed THEN the Documentation Site SHALL be accessible via GitHub Pages without requiring compute resources
5. WHEN a user clicks the dbt docs link from the Dashboard THEN the Documentation Site SHALL open the dbt documentation in a new browser tab

---

### Requirement 11: Data Quality

**User Story:** As a data engineer, I want automated data quality checks, so that I can trust the accuracy of financial data in the dashboard.

#### Acceptance Criteria

1. WHEN dbt models run THEN the Data Vault Layer SHALL execute unique key tests on all Hub hash keys
2. WHEN dbt models run THEN the Data Vault Layer SHALL execute not-null tests on all business keys and required columns
3. WHEN dbt models run THEN the Mart Layer SHALL execute referential integrity tests between facts and dimensions
4. IF any dbt test fails THEN the Data Vault Layer SHALL halt the pipeline and report the failing test name and row count
