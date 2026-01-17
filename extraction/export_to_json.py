"""
JSON Export Script

Queries dbt export models from DuckDB and writes JSON files for the dashboard.
"""

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import duckdb


# Export configurations: (table_name, statement_type, columns, output_filename)
EXPORT_CONFIGS = [
    (
        "export_income_statement",
        "income_statement",
        ["gl_number", "gl_account", "period_end_date", "fiscal_year", "fiscal_quarter", "amount"],
        "income_statement.json",
    ),
    (
        "export_balance_sheet",
        "balance_sheet",
        ["gl_number", "gl_account", "period_end_date", "fiscal_year", "fiscal_quarter", "amount"],
        "balance_sheet.json",
    ),
    (
        "export_cash_flow",
        "cash_flow",
        ["gl_number", "gl_account", "period_end_date", "period_start_date", "fiscal_year", "fiscal_quarter", "amount"],
        "cash_flow.json",
    ),
    (
        "export_financial_metrics",
        "financial_metrics",
        ["metric_name", "period_end_date", "fiscal_year", "fiscal_quarter", "value", "unit"],
        "financial_metrics.json",
    ),
    (
        "export_chart_of_accounts",
        "chart_of_accounts",
        ["gl_number", "gl_account", "account_type", "account_category", "statement_type", "parent_gl_number", "is_total_line", "display_order"],
        "chart_of_accounts.json",
    ),
]

MAX_FILE_SIZE_MB = 10.0


class FinancialDataExporter:
    """Exports financial data from dbt models to JSON files."""

    def __init__(
        self,
        db_path: str = "data/financial_intelligence.duckdb",
        output_dir: str = "../dashboard/public/data",
        ticker: str = "AAPL",
        company_name: str | None = None,
    ):
        self.db_path = Path(db_path)
        self.output_dir = Path(output_dir)
        self.ticker = ticker
        self.company_name = company_name or ticker
        self.conn: duckdb.DuckDBPyConnection | None = None

    def connect(self) -> None:
        """Connect to DuckDB database."""
        if not self.db_path.exists():
            raise FileNotFoundError(f"Database not found: {self.db_path}")

        self.conn = duckdb.connect(str(self.db_path), read_only=True)
        print(f"Connected to: {self.db_path}")

    def close(self) -> None:
        """Close database connection."""
        if self.conn:
            self.conn.close()
            self.conn = None

    def _create_metadata(self, statement_type: str) -> dict[str, str]:
        """Create metadata object for JSON export."""
        return {
            "company": self.company_name,
            "ticker": self.ticker,
            "statement_type": statement_type,
            "export_timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        }

    def _export_table(self, table: str, statement_type: str, columns: list[str], output_file: str) -> Path:
        """Export a single table to JSON."""
        if not self.conn:
            raise RuntimeError("Not connected to database. Call connect() first.")

        print(f"Exporting {statement_type}...")

        cols = ", ".join(columns)
        order_col = "period_end_date, " + columns[0] if "period_end_date" in columns else columns[0]
        query = f"SELECT {cols} FROM exports.{table} ORDER BY {order_col}"

        rows = self.conn.execute(query).fetchall()
        data = [dict(zip(columns, row)) for row in rows]

        output = {
            "metadata": self._create_metadata(statement_type),
            "data": data,
        }

        output_path = self.output_dir / output_file
        self._write_json(output, output_path)
        return output_path

    def _write_json(self, data: dict[str, Any], output_path: Path) -> None:
        """Write JSON with size validation."""
        output_path.parent.mkdir(parents=True, exist_ok=True)

        json_str = json.dumps(data, indent=2)
        size_mb = len(json_str.encode("utf-8")) / (1024 * 1024)

        if size_mb > MAX_FILE_SIZE_MB:
            raise ValueError(f"{output_path.name} exceeds {MAX_FILE_SIZE_MB}MB limit ({size_mb:.2f}MB)")

        output_path.write_text(json_str)
        print(f"  Wrote {output_path.name} ({size_mb:.2f}MB)")

    def export_all(self) -> list[Path]:
        """Export all tables to JSON files."""
        try:
            self.connect()
            return [self._export_table(*config) for config in EXPORT_CONFIGS]
        finally:
            self.close()


def main() -> None:
    """CLI entry point."""
    import argparse

    parser = argparse.ArgumentParser(description="Export dbt models to JSON")
    parser.add_argument("--db", default="data/financial_intelligence.duckdb", help="DuckDB database path")
    parser.add_argument("--output", default="../dashboard/public/data", help="Output directory")
    parser.add_argument("--ticker", default="AAPL", help="Stock ticker")
    parser.add_argument("--company", help="Company name (defaults to ticker)")
    args = parser.parse_args()

    exporter = FinancialDataExporter(
        db_path=args.db,
        output_dir=args.output,
        ticker=args.ticker,
        company_name=args.company,
    )

    try:
        files = exporter.export_all()
        print(f"\nExported {len(files)} files")
    except FileNotFoundError as e:
        print(f"Error: {e}")
        raise SystemExit(1)


if __name__ == "__main__":
    main()
