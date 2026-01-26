#!/bin/bash

# Script to copy data files from analytics-engineering submodule to public folder
# Run this after updating the submodule to refresh the dashboard data

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DASHBOARD_DIR="$(dirname "$SCRIPT_DIR")"
SUBMODULE_OUTPUT="$DASHBOARD_DIR/../submodules/analytics-engineering/output"
PUBLIC_DIR="$DASHBOARD_DIR/public"

echo "Updating dashboard data files..."

# Copy JSON data files
echo "Copying data files..."
mkdir -p "$PUBLIC_DIR/data"
cp "$SUBMODULE_OUTPUT"/*.json "$PUBLIC_DIR/data/"
echo "  - Copied $(ls -1 "$PUBLIC_DIR/data"/*.json 2>/dev/null | wc -l | tr -d ' ') JSON files to public/data/"

# Copy dbt docs from target folder (where dbt generates them)
echo "Copying dbt docs..."
mkdir -p "$PUBLIC_DIR/dbtdocs"
SUBMODULE_TARGET="$DASHBOARD_DIR/../submodules/analytics-engineering/target"
cp "$SUBMODULE_TARGET/index.html" "$PUBLIC_DIR/dbtdocs/"
cp "$SUBMODULE_TARGET/catalog.json" "$PUBLIC_DIR/dbtdocs/" 2>/dev/null || true
cp "$SUBMODULE_TARGET/manifest.json" "$PUBLIC_DIR/dbtdocs/" 2>/dev/null || true
echo "  - Copied dbt docs to public/dbtdocs/"

# Copy images (from dashboard/images to public/images)
echo "Copying images..."
mkdir -p "$PUBLIC_DIR/images"
cp "$DASHBOARD_DIR/images/"* "$PUBLIC_DIR/images/"
echo "  - Copied $(ls -1 "$PUBLIC_DIR/images/"* 2>/dev/null | wc -l | tr -d ' ') image files to public/images/"

echo ""
echo "Done! Data files updated in public folder."
echo ""
echo "Files copied:"
ls -la "$PUBLIC_DIR/data/"
