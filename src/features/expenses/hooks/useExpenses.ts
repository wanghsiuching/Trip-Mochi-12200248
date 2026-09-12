import { useMemo, useCallback } from 'react';
import { Expense } from '../types';
import { expensesService } from '../service';

export interface UseExpensesProps {
  tripId: string;
  expenses: Expense[];
  onExpensesUpdated?: (expenses: Expense[]) => void;
}

export function useExpenses({
  tripId,
  expenses,
  onExpensesUpdated,
}: UseExpensesProps) {
  const normalizedExpenses = useMemo(() => {
    return (expenses || []).map(expensesService.normalize);
  }, [expenses]);

  const handleSave = useCallback(
    async (expenseData: Partial<Expense>, newFiles: File[] = []) => {
      if (!tripId) return;
      const updated = await expensesService.saveExpense(
        tripId,
        normalizedExpenses,
        expenseData,
        newFiles
      );
      onExpensesUpdated?.(updated);
      return updated;
    },
    [tripId, normalizedExpenses, onExpensesUpdated]
  );

  const handleDelete = useCallback(
    async (expenseId: number) => {
      if (!tripId) return;
      const updated = await expensesService.deleteExpense(
        tripId,
        normalizedExpenses,
        expenseId
      );
      onExpensesUpdated?.(updated);
      return updated;
    },
    [tripId, normalizedExpenses, onExpensesUpdated]
  );

  const handleSettle = useCallback(
    async (expenseId: number, memberId: string) => {
      if (!tripId) return;
      const updated = await expensesService.settleExpense(
        tripId,
        normalizedExpenses,
        expenseId,
        memberId
      );
      onExpensesUpdated?.(updated);
      return updated;
    },
    [tripId, normalizedExpenses, onExpensesUpdated]
  );

  return {
    expenses: normalizedExpenses,
    saveExpense: handleSave,
    deleteExpense: handleDelete,
    settleExpense: handleSettle,
  };
}
