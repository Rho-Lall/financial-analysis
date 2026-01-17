"""
Property Tests for JSON Exports

Validates:
- Property 6: JSON Export Size Constraint (Requirement 5.2)
- Property 7: JSON Metadata Presence (Requirement 5.3)
"""

import json
from datetime import datetime
from pathlib import Path

import pytest

# Shared test constants
DATA_DIR = Path(__file__).parent.parent.parent / "dashboard" / "public" / "data"
MAX_FILE_SIZE_MB = 10.0
MAX_RECORD_SIZE_KB = 5.0

VALID_STATEMENT_TYPES = {
    "income_statement",
    "balance_sheet",
    "cash_flow",
    "financial_metrics",
    "chart_of_accounts",
}

FINANCIAL_STATEMENT_FILES = {"income_statement.json", "balance_sheet.json", "cash_flow.json"}
REQUIRED_METADATA_FIELDS = ["company", "ticker", "statement_type", "export_timestamp"]
REQUIRED_STATEMENT_FIELDS = {"gl_number", "gl_account", "period_end_date", "fiscal_year", "fiscal_quarter", "amount"}


@pytest.fixture
def json_files() -> list[Path]:
    """Get all JSON export files."""
    return list(DATA_DIR.glob("*.json"))


@pytest.fixture
def loaded_json_files(json_files: list[Path]) -> list[tuple[Path, dict]]:
    """Load all JSON files with their content."""
    return [(path, json.loads(path.read_text())) for path in json_files]


class TestJSONExportSizeConstraint:
    """Property 6: JSON files must be under 10MB (Requirement 5.2)."""

    def test_file_size_under_limit(self, json_files: list[Path]) -> None:
        """Each JSON file must be under 10MB."""
        failures = [
            f"{p.name}: {p.stat().st_size / (1024 * 1024):.2f}MB"
            for p in json_files
            if p.stat().st_size / (1024 * 1024) > MAX_FILE_SIZE_MB
        ]
        assert not failures, f"Files exceed {MAX_FILE_SIZE_MB}MB:\n" + "\n".join(failures)

    def test_individual_records_reasonable_size(self, loaded_json_files: list[tuple[Path, dict]]) -> None:
        """Individual records shouldn't be excessively large."""
        for path, content in loaded_json_files:
            for idx, record in enumerate(content.get("data", [])):
                size_kb = len(json.dumps(record).encode("utf-8")) / 1024
                assert size_kb < MAX_RECORD_SIZE_KB, (
                    f"{path.name} record {idx}: {size_kb:.2f}KB > {MAX_RECORD_SIZE_KB}KB"
                )


class TestJSONMetadataPresence:
    """Property 7: JSON exports must include required metadata (Requirement 5.3)."""

    def test_metadata_exists(self, loaded_json_files: list[tuple[Path, dict]]) -> None:
        """Each file must have a metadata object."""
        for path, content in loaded_json_files:
            assert "metadata" in content, f"{path.name} missing 'metadata'"
            assert isinstance(content["metadata"], dict), f"{path.name} metadata is not a dict"

    def test_metadata_has_required_fields(self, loaded_json_files: list[tuple[Path, dict]]) -> None:
        """Metadata must contain all required fields."""
        for path, content in loaded_json_files:
            metadata = content.get("metadata", {})
            for field in REQUIRED_METADATA_FIELDS:
                assert field in metadata, f"{path.name} missing metadata.{field}"
                assert metadata[field], f"{path.name} metadata.{field} is empty"

    def test_export_timestamp_is_valid_iso8601(self, loaded_json_files: list[tuple[Path, dict]]) -> None:
        """export_timestamp must be valid ISO 8601."""
        for path, content in loaded_json_files:
            timestamp = content.get("metadata", {}).get("export_timestamp", "")
            try:
                datetime.fromisoformat(timestamp.rstrip("Z"))
            except ValueError:
                pytest.fail(f"{path.name} has invalid timestamp: {timestamp}")

    def test_ticker_is_uppercase(self, loaded_json_files: list[tuple[Path, dict]]) -> None:
        """Ticker should be uppercase."""
        for path, content in loaded_json_files:
            ticker = content.get("metadata", {}).get("ticker", "")
            assert ticker.isupper(), f"{path.name} ticker not uppercase: {ticker}"

    def test_statement_type_is_valid(self, loaded_json_files: list[tuple[Path, dict]]) -> None:
        """statement_type must be a recognized value."""
        for path, content in loaded_json_files:
            statement_type = content.get("metadata", {}).get("statement_type")
            assert statement_type in VALID_STATEMENT_TYPES, (
                f"{path.name} invalid statement_type: {statement_type}"
            )

    def test_data_array_exists(self, loaded_json_files: list[tuple[Path, dict]]) -> None:
        """Each file must have a data array."""
        for path, content in loaded_json_files:
            assert "data" in content, f"{path.name} missing 'data'"
            assert isinstance(content["data"], list), f"{path.name} data is not a list"

    def test_only_metadata_and_data_keys(self, loaded_json_files: list[tuple[Path, dict]]) -> None:
        """Top-level should only contain metadata and data."""
        for path, content in loaded_json_files:
            extra_keys = set(content.keys()) - {"metadata", "data"}
            assert not extra_keys, f"{path.name} has unexpected keys: {extra_keys}"


class TestJSONDataIntegrity:
    """Additional data structure validation."""

    def test_json_is_valid(self, json_files: list[Path]) -> None:
        """Each file must be valid JSON."""
        for path in json_files:
            try:
                json.loads(path.read_text())
            except json.JSONDecodeError as e:
                pytest.fail(f"{path.name} is not valid JSON: {e}")

    def test_financial_statements_have_required_fields(self, loaded_json_files: list[tuple[Path, dict]]) -> None:
        """Financial statement records must have required fields."""
        for path, content in loaded_json_files:
            if path.name not in FINANCIAL_STATEMENT_FILES:
                continue

            for idx, record in enumerate(content.get("data", [])):
                missing = REQUIRED_STATEMENT_FIELDS - set(record.keys())
                assert not missing, f"{path.name} record {idx} missing: {missing}"

    def test_cash_flow_has_period_start_date(self, loaded_json_files: list[tuple[Path, dict]]) -> None:
        """Cash flow records must include period_start_date."""
        for path, content in loaded_json_files:
            if path.name != "cash_flow.json":
                continue

            for idx, record in enumerate(content.get("data", [])):
                assert "period_start_date" in record, (
                    f"cash_flow.json record {idx} missing period_start_date"
                )
