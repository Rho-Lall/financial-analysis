"""
Property Tests for JSON Exports

These tests validate that JSON exports meet the requirements:
- Property 6: JSON Export Size Constraint (Requirement 5.2)
- Property 7: JSON Metadata Presence (Requirement 5.3)

Tests use property-based testing to ensure exports are always valid.
"""

import json
import pytest
from pathlib import Path
from datetime import datetime


class TestJSONExportSizeConstraint:
    """
    Property 6: JSON Export Size Constraint

    Validates Requirement 5.2: Each JSON export file must be under 10MB
    to ensure fast loading in the browser.
    """

    MAX_FILE_SIZE_MB = 10.0

    @pytest.fixture
    def json_files(self):
        """Get all JSON export files."""
        data_dir = Path(__file__).parent.parent.parent / "dashboard" / "public" / "data"
        return list(data_dir.glob("*.json"))

    def test_json_file_size_under_limit(self, json_files):
        """Test that each JSON file is under the 10MB size limit."""
        failures = []

        for json_file in json_files:
            file_size_bytes = json_file.stat().st_size
            file_size_mb = file_size_bytes / (1024 * 1024)

            if file_size_mb > self.MAX_FILE_SIZE_MB:
                failures.append({
                    'file': json_file.name,
                    'size_mb': file_size_mb,
                    'limit_mb': self.MAX_FILE_SIZE_MB
                })

        assert len(failures) == 0, (
            f"JSON files exceed size limit:\n" +
            "\n".join([f"  {f['file']}: {f['size_mb']:.2f}MB > {f['limit_mb']}MB"
                       for f in failures])
        )

    def test_empty_data_arrays_are_small(self, json_files):
        """Test that even files with empty data arrays are reasonably sized."""
        for json_file in json_files:
            with open(json_file) as f:
                data = json.load(f)

            # Create a version with empty data array
            empty_version = {
                "metadata": data.get("metadata", {}),
                "data": []
            }

            # Empty version should be very small (< 1KB)
            empty_size = len(json.dumps(empty_version).encode('utf-8'))
            assert empty_size < 1024, (
                f"{json_file.name} metadata structure is too large: {empty_size} bytes"
            )

    def test_individual_records_are_reasonable(self, json_files):
        """Test that individual data records aren't excessively large."""
        MAX_RECORD_SIZE_KB = 5  # 5KB per record is generous

        for json_file in json_files:
            with open(json_file) as f:
                data = json.load(f)

            data_array = data.get("data", [])
            if not data_array:
                continue

            for idx, record in enumerate(data_array):
                record_size = len(json.dumps(record).encode('utf-8'))
                record_size_kb = record_size / 1024

                assert record_size_kb < MAX_RECORD_SIZE_KB, (
                    f"{json_file.name} record {idx} is too large: "
                    f"{record_size_kb:.2f}KB > {MAX_RECORD_SIZE_KB}KB"
                )


class TestJSONMetadataPresence:
    """
    Property 7: JSON Metadata Presence

    Validates Requirement 5.3: Each JSON export must include metadata
    with export_timestamp and ticker fields.
    """

    @pytest.fixture
    def json_files(self):
        """Get all JSON export files."""
        data_dir = Path(__file__).parent.parent.parent / "dashboard" / "public" / "data"
        return list(data_dir.glob("*.json"))

    def test_metadata_object_exists(self, json_files):
        """Test that each JSON file has a metadata object."""
        for json_file in json_files:
            with open(json_file) as f:
                data = json.load(f)

            assert "metadata" in data, (
                f"{json_file.name} is missing 'metadata' object"
            )

            assert isinstance(data["metadata"], dict), (
                f"{json_file.name} metadata is not a dictionary"
            )

    def test_metadata_has_required_fields(self, json_files):
        """Test that metadata contains all required fields."""
        required_fields = ['company', 'ticker', 'statement_type', 'export_timestamp']

        for json_file in json_files:
            with open(json_file) as f:
                data = json.load(f)

            metadata = data.get("metadata", {})

            for field in required_fields:
                assert field in metadata, (
                    f"{json_file.name} metadata is missing required field: {field}"
                )

                assert metadata[field] is not None, (
                    f"{json_file.name} metadata field '{field}' is null"
                )

                assert metadata[field] != "", (
                    f"{json_file.name} metadata field '{field}' is empty string"
                )

    def test_export_timestamp_is_valid_iso8601(self, json_files):
        """Test that export_timestamp is a valid ISO 8601 datetime."""
        for json_file in json_files:
            with open(json_file) as f:
                data = json.load(f)

            timestamp = data.get("metadata", {}).get("export_timestamp")

            # Should be able to parse as ISO 8601
            try:
                # Remove 'Z' suffix if present and parse
                timestamp_str = timestamp.rstrip('Z')
                parsed = datetime.fromisoformat(timestamp_str)

                assert parsed is not None, (
                    f"{json_file.name} export_timestamp could not be parsed"
                )

            except (ValueError, AttributeError) as e:
                pytest.fail(
                    f"{json_file.name} export_timestamp is not valid ISO 8601: "
                    f"{timestamp}. Error: {e}"
                )

    def test_ticker_is_uppercase(self, json_files):
        """Test that ticker symbol is uppercase (convention)."""
        for json_file in json_files:
            with open(json_file) as f:
                data = json.load(f)

            ticker = data.get("metadata", {}).get("ticker", "")

            assert ticker.isupper() or ticker == "", (
                f"{json_file.name} ticker should be uppercase: {ticker}"
            )

    def test_statement_type_is_valid(self, json_files):
        """Test that statement_type is one of the expected values."""
        valid_statement_types = {
            'income_statement',
            'balance_sheet',
            'cash_flow',
            'financial_metrics',
            'chart_of_accounts'
        }

        for json_file in json_files:
            with open(json_file) as f:
                data = json.load(f)

            statement_type = data.get("metadata", {}).get("statement_type")

            assert statement_type in valid_statement_types, (
                f"{json_file.name} has invalid statement_type: {statement_type}. "
                f"Must be one of: {valid_statement_types}"
            )

    def test_data_array_exists(self, json_files):
        """Test that each JSON file has a data array."""
        for json_file in json_files:
            with open(json_file) as f:
                data = json.load(f)

            assert "data" in data, (
                f"{json_file.name} is missing 'data' array"
            )

            assert isinstance(data["data"], list), (
                f"{json_file.name} data is not an array"
            )

    def test_metadata_and_data_only_top_level_keys(self, json_files):
        """Test that JSON structure only contains metadata and data at top level."""
        for json_file in json_files:
            with open(json_file) as f:
                data = json.load(f)

            top_level_keys = set(data.keys())
            expected_keys = {'metadata', 'data'}

            assert top_level_keys == expected_keys, (
                f"{json_file.name} has unexpected top-level keys: "
                f"{top_level_keys - expected_keys}"
            )


class TestJSONDataIntegrity:
    """Additional data integrity tests for JSON exports."""

    @pytest.fixture
    def json_files(self):
        """Get all JSON export files."""
        data_dir = Path(__file__).parent.parent.parent / "dashboard" / "public" / "data"
        return list(data_dir.glob("*.json"))

    def test_json_is_valid(self, json_files):
        """Test that each file is valid JSON."""
        for json_file in json_files:
            with open(json_file) as f:
                try:
                    json.load(f)
                except json.JSONDecodeError as e:
                    pytest.fail(f"{json_file.name} is not valid JSON: {e}")

    def test_financial_statement_data_has_required_fields(self, json_files):
        """Test that financial statement data points have required fields."""
        statement_files = ['income_statement.json', 'balance_sheet.json', 'cash_flow.json']

        required_fields = {
            'gl_number', 'gl_account', 'period_end_date',
            'fiscal_year', 'fiscal_quarter', 'amount'
        }

        for json_file in json_files:
            if json_file.name not in statement_files:
                continue

            with open(json_file) as f:
                data = json.load(f)

            for idx, record in enumerate(data.get("data", [])):
                missing_fields = required_fields - set(record.keys())

                assert len(missing_fields) == 0, (
                    f"{json_file.name} record {idx} is missing fields: {missing_fields}"
                )

    def test_cash_flow_has_period_start_date(self, json_files):
        """Test that cash flow data includes period_start_date."""
        cash_flow_file = None
        for json_file in json_files:
            if json_file.name == 'cash_flow.json':
                cash_flow_file = json_file
                break

        if not cash_flow_file:
            pytest.skip("cash_flow.json not found")

        with open(cash_flow_file) as f:
            data = json.load(f)

        for idx, record in enumerate(data.get("data", [])):
            assert 'period_start_date' in record, (
                f"cash_flow.json record {idx} is missing period_start_date"
            )
