# Tutorial: Updating Scorecards to Use Financial Metrics Data

## Overview

The scorecards pull data from `export_financial_metrics.json`, which contains metrics with this structure:

```json
{
  "ticker": "CAT",
  "metric_name": "Gross Margin",
  "period_end_date": "2025-06-30",
  "fiscal_year": 2025,
  "fiscal_quarter": 2,
  "value": 34.97,
  "unit": "percentage"
}
```

## Available Metrics

Check your metrics file to see what's available:

```bash
cat submodules/analytics-engineering/output/export_financial_metrics.json | jq '.[].metric_name' | sort -u
```

Current metrics include:
- `Gross Margin` (percentage)
- `Operating Margin` (percentage)
- `Revenue Growth YoY` (percentage)
- `Current Ratio` (ratio)
- `FCF Margin` (percentage)
- `Free Cash Flow` (currency)

---

## How It Works

### 1. Data flows through the hook

**File:** `src/hooks/useFinancialData.ts`

The hook fetches `export_financial_metrics.json` and filters by ticker:

```typescript
const filteredMetrics = rawMetrics.filter((m) => m.ticker === selectedTicker);
```

### 2. Helper function in App.tsx

**File:** `src/App.tsx` (lines 27-33)

```typescript
const getLatestMetric = (metricName: string) => {
  const metrics = financialMetrics
    .filter((m) => m.metric_name === metricName)
    .sort((a, b) => new Date(b.period_end_date).getTime() - new Date(a.period_end_date).getTime());
  return metrics[0] || null;
};
```

This finds all metrics with the given name and returns the most recent one.

### 3. ScoreCard usage

```typescript
<ScoreCard
  title="Gross Margin"
  value={(getLatestMetric('Gross Margin')?.value ?? 0) / 100}
  format="percentage"
/>
```

---

## Format Conversion Rules

| Metric Unit | ScoreCard Format | Conversion |
|-------------|------------------|------------|
| `percentage` | `"percentage"` | Divide by 100 (34.97 → 0.3497) |
| `ratio` | `"ratio"` | Use as-is (1.32 → 1.32) |
| `currency` | `"currency"` | Use as-is (1999000000 → 1999000000) |

---

## Step-by-Step: Update Balance Sheet Scorecards

**Location:** `src/App.tsx` (around lines 201-219)

### Current (hardcoded):

```typescript
<ScoreCard title="Debt-to-Equity Ratio" value={0.37} format="ratio" />
<ScoreCard title="ROA" value={0.12} format="percentage" />
<ScoreCard title="Total Assets" value={207000000000} format="currency" />
```

### To update:

1. Identify which metrics you want (check your JSON file)
2. Replace hardcoded values:

```typescript
<ScoreCard
  title="Current Ratio"
  value={getLatestMetric('Current Ratio')?.value ?? 0}
  format="ratio"
/>
```

If you need metrics that don't exist yet, you'll need to add them in your dbt project's `export_financial_metrics` model.

---

## Step-by-Step: Update Cash Flow Scorecards

**Location:** `src/App.tsx` (around lines 324-334)

### Current (hardcoded):

```typescript
<ScoreCard title="FCF to Assets Ratio" value={0.08} format="ratio" />
<ScoreCard title="Free Cash Flow" value={16560000000} format="currency" />
```

### Updated:

```typescript
<ScoreCard
  title="FCF Margin"
  value={(getLatestMetric('FCF Margin')?.value ?? 0) / 100}
  format="percentage"
/>
<ScoreCard
  title="Free Cash Flow"
  value={getLatestMetric('Free Cash Flow')?.value ?? 0}
  format="currency"
/>
```

---

## Adding New Metrics

If you need metrics that don't exist in the JSON:

1. Add the calculation to your dbt model in `submodules/analytics-engineering/`
2. Run `dbt run` to regenerate `export_financial_metrics.json`
3. Pull the submodule update
4. Use `getLatestMetric('Your New Metric Name')` in App.tsx

---

## Quick Reference

```typescript
// Percentage metric (stored as 34.97, display as 34.97%)
value={(getLatestMetric('Metric Name')?.value ?? 0) / 100}
format="percentage"

// Ratio metric (stored as 1.32, display as 1.32)
value={getLatestMetric('Metric Name')?.value ?? 0}
format="ratio"

// Currency metric (stored as 1999000000, display as $2.0B)
value={getLatestMetric('Metric Name')?.value ?? 0}
format="currency"
```

---

## Example: Complete Income Statement Scorecards

This is the working implementation you can reference:

```typescript
{/* Scorecards */}
<div className="scorecard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
  <ScoreCard
    title="Gross Margin"
    value={(getLatestMetric('Gross Margin')?.value ?? 0) / 100}
    format="percentage"
  />
  <ScoreCard
    title="Operating Margin"
    value={(getLatestMetric('Operating Margin')?.value ?? 0) / 100}
    format="percentage"
  />
  <ScoreCard
    title="Revenue Growth YoY"
    value={(getLatestMetric('Revenue Growth YoY')?.value ?? 0) / 100}
    format="percentage"
  />
</div>
```
