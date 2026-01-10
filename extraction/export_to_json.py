"""
JSON Export Script

This script queries the dbt export models from DuckDB and writes them to JSON files
in the dashboard's public/data/ directory.

The script:
1. Connects to DuckDB database
2. Queries each export model
3. Transforms results to match JSON contract schema
4. Writes JSON files with metadata
5. Validates file size constraints

Requirements:
- duckdb
- json
- datetime
"""

import duckdb
import json
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional


class FinancialDataExporter:
    """Exports financial data from dbt models to JSON files for dashboard consumption."""

    def __init__(self,
                 db_path: str = "data/financial_intelligence.duckdb",
                 output_dir: str = "../dashboard/public/data",
                 ticker: str = "AAPL",
                 company_name: Optional[str] = None):
        """
        Initialize the exporter.

        Args:
            db_path: Path to DuckDB database file
            output_dir: Directory to write JSON files
            ticker: Stock ticker symbol
            company_name: Company name (defaults to ticker if not provided)
        """
        self.db_path = db_path
        self.output_dir = Path(output_dir)
        self.ticker = ticker
        self.company_name = company_name or ticker
        self.conn = None

        # Ensure output directory exists
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def connect(self):
        """Establish connection to DuckDB."""
        self.conn = duckdb.connect(self.db_path, read_only=True)
        print(f"✓ Connected to DuckDB: {self.db_path}")

    def close(self):
        """Close database connection."""
        if self.conn:
            self.conn.close()
            print("✓ Closed database connection")

    def _create_metadata(self, statement_type: str) -> Dict[str, str]:
        """
        Create metadata object for JSON export.

        Args:
            statement_type: Type of financial statement

        Returns:
            Dictionary with metadata fields
        """
        return {
            "company": self.company_name,
            "ticker": self.ticker,
            "statement_type": statement_type,
            "export_timestamp": datetime.utcnow().isoformat() + "Z"
        }

    def export_income_statement(self) -> Path:
        """Export income statement data to JSON."""
        print("Exporting income statement...")

        query = """
        SELECT
            gl_number,
            gl_account,
            period_end_date,
            fiscal_year,
            fiscal_quarter,
            amount
        FROM exports.export_income_statement
        ORDER BY period_end_date, gl_number
        """

        result = self.conn.execute(query).fetchall()
        columns = ['gl_number', 'gl_account', 'period_end_date',
                   'fiscal_year', 'fiscal_quarter', 'amount']

        data = [dict(zip(columns, row)) for row in result]

        output = {
            "metadata": self._create_metadata("income_statement"),
            "data": data
        }

        output_path = self.output_dir / "income_statement.json"
        self._write_json(output, output_path)

        return output_path

    def export_balance_sheet(self) -> Path:
        """Export balance sheet data to JSON."""
        print("Exporting balance sheet...")

        query = """
        SELECT
            gl_number,
            gl_account,
            period_end_date,
            fiscal_year,
            fiscal_quarter,
            amount
        FROM exports.export_balance_sheet
        ORDER BY period_end_date, gl_number
        """

        result = self.conn.execute(query).fetchall()
        columns = ['gl_number', 'gl_account', 'period_end_date',
                   'fiscal_year', 'fiscal_quarter', 'amount']

        data = [dict(zip(columns, row)) for row in result]

        output = {
            "metadata": self._create_metadata("balance_sheet"),
            "data": data
        }

        output_path = self.output_dir / "balance_sheet.json"
        self._write_json(output, output_path)

        return output_path

    def export_cash_flow(self) -> Path:
        """Export cash flow statement data to JSON."""
        print("Exporting cash flow...")

        query = """
        SELECT
            gl_number,
            gl_account,
            period_end_date,
            period_start_date,
            fiscal_year,
            fiscal_quarter,
            amount
        FROM exports.export_cash_flow
        ORDER BY period_end_date, gl_number
        """

        result = self.conn.execute(query).fetchall()
        columns = ['gl_number', 'gl_account', 'period_end_date', 'period_start_date',
                   'fiscal_year', 'fiscal_quarter', 'amount']

        data = [dict(zip(columns, row)) for row in result]

        output = {
            "metadata": self._create_metadata("cash_flow"),
            "data": data
        }

        output_path = self.output_dir / "cash_flow.json"
        self._write_json(output, output_path)

        return output_path

    def export_financial_metrics(self) -> Path:
        """Export financial metrics data to JSON."""
        print("Exporting financial metrics...")

        query = """
        SELECT
            metric_name,
            period_end_date,
            fiscal_year,
            fiscal_quarter,
            value,
            unit
        FROM exports.export_financial_metrics
        ORDER BY period_end_date, metric_name
        """

        result = self.conn.execute(query).fetchall()
        columns = ['metric_name', 'period_end_date', 'fiscal_year',
                   'fiscal_quarter', 'value', 'unit']

        data = [dict(zip(columns, row)) for row in result]

        output = {
            "metadata": self._create_metadata("financial_metrics"),
            "data": data
        }

        output_path = self.output_dir / "financial_metrics.json"
        self._write_json(output, output_path)

        return output_path

    def export_chart_of_accounts(self) -> Path:
        """Export chart of accounts data to JSON."""
        print("Exporting chart of accounts...")

        query = """
        SELECT
            gl_number,
            gl_account,
            account_type,
            account_category,
            statement_type,
            parent_gl_number,
            is_total_line,
            display_order
        FROM exports.export_chart_of_accounts
        ORDER BY statement_type, display_order, gl_number
        """

        result = self.conn.execute(query).fetchall()
        columns = ['gl_number', 'gl_account', 'account_type', 'account_category',
                   'statement_type', 'parent_gl_number', 'is_total_line', 'display_order']

        data = [dict(zip(columns, row)) for row in result]

        output = {
            "metadata": self._create_metadata("chart_of_accounts"),
            "data": data
        }

        output_path = self.output_dir / "chart_of_accounts.json"
        self._write_json(output, output_path)

        return output_path

    def _write_json(self, data: Dict[str, Any], output_path: Path, max_size_mb: float = 10.0):
        """
        Write data to JSON file with size validation.

        Args:
            data: Dictionary to write as JSON
            output_path: Path to output file
            max_size_mb: Maximum file size in megabytes

        Raises:
            ValueError: If JSON file exceeds size limit
        """
        # Write JSON with nice formatting
        json_str = json.dumps(data, indent=2)

        # Check file size (convert to MB)
        file_size_mb = len(json_str.encode('utf-8')) / (1024 * 1024)

        if file_size_mb > max_size_mb:
            raise ValueError(
                f"JSON export exceeds size limit: {file_size_mb:.2f}MB > {max_size_mb}MB. "
                f"File: {output_path.name}"
            )

        # Write to file
        with open(output_path, 'w') as f:
            f.write(json_str)

        print(f"  ✓ Wrote {output_path.name} ({file_size_mb:.2f}MB)")

    def export_all(self) -> List[Path]:
        """
        Export all financial data to JSON files.

        Returns:
            List of paths to created JSON files
        """
        try:
            self.connect()

            output_files = [
                self.export_income_statement(),
                self.export_balance_sheet(),
                self.export_cash_flow(),
                self.export_financial_metrics(),
                self.export_chart_of_accounts()
            ]

            print(f"\n✓ Successfully exported {len(output_files)} JSON files")
            return output_files

        finally:
            self.close()


def main():
    """Main entry point for the export script."""
    import argparse

    parser = argparse.ArgumentParser(description='Export dbt models to JSON for dashboard')
    parser.add_argument('--db', default='data/financial_intelligence.duckdb',
                        help='Path to DuckDB database')
    parser.add_argument('--output', default='../dashboard/public/data',
                        help='Output directory for JSON files')
    parser.add_argument('--ticker', default='AAPL',
                        help='Stock ticker symbol')
    parser.add_argument('--company', help='Company name (defaults to ticker)')

    args = parser.parse_args()

    exporter = FinancialDataExporter(
        db_path=args.db,
        output_dir=args.output,
        ticker=args.ticker,
        company_name=args.company
    )

    exporter.export_all()


if __name__ == '__main__':
    main()
