import { useState, useEffect, useCallback } from 'react';
import type {
  Company,
  RawFinancialDataPoint,
  FinancialDataPoint,
  FinancialMetric,
} from '../types/financial';

interface UseFinancialDataReturn {
  companies: Company[];
  selectedCompany: Company | null;
  setSelectedTicker: (ticker: string) => void;
  incomeStatement: FinancialDataPoint[];
  balanceSheet: FinancialDataPoint[];
  cashFlow: FinancialDataPoint[];
  financialMetrics: FinancialMetric[];
  loading: boolean;
  error: Error | null;
}

/**
 * Custom hook to fetch and manage financial statement data
 * Loads JSON files from the output directory and filters by selected ticker
 */
export function useFinancialData(): UseFinancialDataReturn {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedTicker, setSelectedTicker] = useState<string>('');
  const [rawIncomeStatement, setRawIncomeStatement] = useState<RawFinancialDataPoint[]>([]);
  const [rawBalanceSheet, setRawBalanceSheet] = useState<RawFinancialDataPoint[]>([]);
  const [rawCashFlow, setRawCashFlow] = useState<RawFinancialDataPoint[]>([]);
  const [rawMetrics, setRawMetrics] = useState<FinancialMetric[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Load all data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch companies first, then all financial data in parallel
        // Files served from submodules/analytics-engineering/output via custom Vite plugin
        const [companiesRes, incomeRes, balanceRes, cashFlowRes, metricsRes] = await Promise.all([
          fetch(`${import.meta.env.BASE_URL}data/export_companies.json`),
          fetch(`${import.meta.env.BASE_URL}data/export_income_statement.json`),
          fetch(`${import.meta.env.BASE_URL}data/export_balance_sheet.json`),
          fetch(`${import.meta.env.BASE_URL}data/export_cash_flow.json`),
          fetch(`${import.meta.env.BASE_URL}data/export_financial_metrics.json`),
        ]);

        // Check if all requests were successful
        if (!companiesRes.ok) {
          throw new Error(`Failed to fetch companies: ${companiesRes.statusText}`);
        }
        if (!incomeRes.ok) {
          throw new Error(`Failed to fetch income statement: ${incomeRes.statusText}`);
        }
        if (!balanceRes.ok) {
          throw new Error(`Failed to fetch balance sheet: ${balanceRes.statusText}`);
        }
        if (!cashFlowRes.ok) {
          throw new Error(`Failed to fetch cash flow: ${cashFlowRes.statusText}`);
        }
        if (!metricsRes.ok) {
          throw new Error(`Failed to fetch financial metrics: ${metricsRes.statusText}`);
        }

        // Parse JSON responses
        const [companiesData, incomeData, balanceData, cashFlowData, metricsData] = await Promise.all([
          companiesRes.json(),
          incomeRes.json(),
          balanceRes.json(),
          cashFlowRes.json(),
          metricsRes.json(),
        ]);

        // Update state with fetched data
        setCompanies(companiesData as Company[]);
        setRawIncomeStatement(incomeData as RawFinancialDataPoint[]);
        setRawBalanceSheet(balanceData as RawFinancialDataPoint[]);
        setRawCashFlow(cashFlowData as RawFinancialDataPoint[]);
        setRawMetrics(metricsData as FinancialMetric[]);

        // Set default selected ticker to first company
        if (companiesData.length > 0) {
          setSelectedTicker(companiesData[0].ticker);
        }
      } catch (err) {
        console.error('Error fetching financial data:', err);
        setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter data by selected ticker
  const filterByTicker = useCallback(
    (data: RawFinancialDataPoint[]): FinancialDataPoint[] => {
      if (!selectedTicker) return [];
      return data
        .filter((d) => d.ticker === selectedTicker)
        .map(({ ticker: _ticker, ...rest }) => rest);
    },
    [selectedTicker]
  );

  // Filter metrics by selected ticker
  const filteredMetrics = rawMetrics.filter((m) => m.ticker === selectedTicker);

  // Get selected company info
  const selectedCompany = companies.find((c) => c.ticker === selectedTicker) || null;

  return {
    companies,
    selectedCompany,
    setSelectedTicker,
    incomeStatement: filterByTicker(rawIncomeStatement),
    balanceSheet: filterByTicker(rawBalanceSheet),
    cashFlow: filterByTicker(rawCashFlow),
    financialMetrics: filteredMetrics,
    loading,
    error,
  };
}
