# dbt Fusion Financial Analytics POC

A proof-of-concept financial analytics platform demonstrating dbt Fusion capabilities, Data Vault 2.0 modeling, and interactive financial reporting.

## Architecture

This project implements an ELT pipeline that:
1. **Extracts** SEC financial data via EDGAR API
2. **Loads** raw data into DuckDB
3. **Transforms** through 4 dbt layers (Raw Vault → Business Vault → Information Marts → Export)
4. **Presents** via a static React dashboard with D3.js visualizations

## Project Structure

```
.
├── extraction/          # Python scripts for SEC data extraction and loading
├── dbt_project/         # dbt models (Raw Vault, Business Vault, Marts, Exports)
├── dashboard/           # React + TypeScript + D3.js frontend
├── data/                # DuckDB database and staging files
├── docs/                # Project documentation
└── .kiro/specs/init/    # Requirements, design, and task specifications
```

## Prerequisites

- **Node.js**: 20.19+ or 22.12+ (for Vite)
- **Python**: 3.9+
- **Homebrew** (macOS) or equivalent package manager

## Setup

### 1. Python Environment

```bash
# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Dashboard (React + Vite)

```bash
cd dashboard

# Dependencies are already installed
# Start development server
npm run dev
```

The dashboard will be available at `http://localhost:5173`

### 3. dbt Project

```bash
cd dbt_project

# Initialize dbt (first time only)
dbt init

# Run transformations
dbt run

# Run tests
dbt test

# Generate documentation
dbt docs generate
dbt docs serve
```

## Development Workflow

1. **Extract data**: Run `extraction/extract_sec_data.py` with a ticker symbol
2. **Load to DuckDB**: Run `extraction/load_to_duckdb.py`
3. **Transform with dbt**: Run `dbt run` to build all layers
4. **Export JSON**: Run `extraction/export_json.py` to generate dashboard data
5. **View dashboard**: Start Vite dev server with `npm run dev`

## Data Flow

```
SEC EDGAR API → Staging Files → DuckDB Raw Tables
    ↓
dbt Raw Vault (Hubs, Links, Satellites)
    ↓
dbt Business Vault (Business Rules)
    ↓
dbt Information Marts (Star Schema)
    ↓
Export Layer (JSON files)
    ↓
React Dashboard (D3.js Visualizations)
```

## Client-Side Rendering Constraints

The dashboard uses client-side rendering (CSR) with the following data limits:
- **Each JSON file**: < 1MB (enforced by design)
- **Total payload**: ~4MB (4 files)
- **Capacity**: ~10,000 rows with 10-15 columns per 5MB
- **Our usage**: ~40 periods × 15 columns = ~20KB per file (< 2% of capacity)

## Documentation

- **Requirements**: `.kiro/specs/init/requirements.md`
- **Design**: `.kiro/specs/init/design.md`
- **Tasks**: `.kiro/specs/init/tasks.md`
- **Data Vault Guide**: `docs/understanding_data_vault.md`

## Tech Stack

- **Extraction**: Python, requests, pandas
- **Database**: DuckDB
- **Transformation**: dbt, dbt-duckdb adapter
- **Frontend**: React 19, TypeScript, Vite 7
- **Visualization**: D3.js 7
- **Deployment**: GitHub Pages (static hosting)
- **Testing**: pytest, hypothesis (Python), fast-check (TypeScript)

## License

This is a proof-of-concept project for demonstration purposes.
