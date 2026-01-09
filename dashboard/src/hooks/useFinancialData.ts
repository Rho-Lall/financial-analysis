import { useState, useEffect } from 'react';
import {
  IncomeStatement,
  BalanceSheet,
  CashFlowStatement,
} from '../types/financial';

interface UseFinancialDataReturn {
  incomeStatement: IncomeStatement | null;
  balanceSheet: BalanceSheet | null;
  cashFlow: CashFlowStatement | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Custom hook to fetch and manage financial statement data
 * Loads JSON files from the public/data directory
 */
export function useFinancialData(): UseFinancialDataReturn {
  const [incomeStatement, setIncomeStatement] = useState<IncomeStatement | null>(null);
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheet | null>(null);
  const [cashFlow, setCashFlow] = useState<CashFlowStatement | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all three financial statements in parallel
        const [incomeRes, balanceRes, cashFlowRes] = await Promise.all([
          fetch('/data/income_statement.json'),
          fetch('/data/balance_sheet.json'),
          fetch('/data/cash_flow.json'),
        ]);

        // Check if all requests were successful
        if (!incomeRes.ok) {
          throw new Error(`Failed to fetch income statement: ${incomeRes.statusText}`);
        }
        if (!balanceRes.ok) {
          throw new Error(`Failed to fetch balance sheet: ${balanceRes.statusText}`);
        }
        if (!cashFlowRes.ok) {
          throw new Error(`Failed to fetch cash flow: ${cashFlowRes.statusText}`);
        }

        // Parse JSON responses
        const [incomeData, balanceData, cashFlowData] = await Promise.all([
          incomeRes.json(),
          balanceRes.json(),
          cashFlowRes.json(),
        ]);

        // Update state with fetched data
        setIncomeStatement(incomeData as IncomeStatement);
        setBalanceSheet(balanceData as BalanceSheet);
        setCashFlow(cashFlowData as CashFlowStatement);
      } catch (err) {
        console.error('Error fetching financial data:', err);
        setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // Empty dependency array means this runs once on mount

  return {
    incomeStatement,
    balanceSheet,
    cashFlow,
    loading,
    error,
  };
}