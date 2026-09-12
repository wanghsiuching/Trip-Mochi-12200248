import { useState } from 'react';
import { Expense, Currency } from '../types';
import { addTripItem, updateTripField, softDeleteTripItem, restoreTripItem } from '../services/tripService';
import { LocalUserIdentity } from '../src/features/collaboration/types';

export const useExpensesData = (currentTripId: string, currentUser?: LocalUserIdentity | null) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);

  const handleAddExpense = (newExpense: Omit<Expense, 'id'>) => {
    addTripItem(currentTripId, 'expenses', { ...newExpense, id: Date.now() });
  };

  const handleUpdateExpense = (updated: Expense) => {
    updateTripField(currentTripId, 'expenses', expenses.map(e => e.id === updated.id ? updated : e));
  };

  const handleDeleteExpense = (id: number) => {
    const expense = expenses.find(e => e.id === id);
    const expenseTitle = expense ? `${expense.item} (${expense.amount})` : '記帳項目';
    const now = Date.now();
    // Optimistic update: mark soft deleted
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, deletedAt: now, deletedBy: currentUser?.userId || 'unknown' } : e));
    softDeleteTripItem(currentTripId, 'expenses', id, currentUser, 'expense', expenseTitle).catch(err => {
      console.error("Failed to soft-delete expense:", err);
    });
  };

  const handleRestoreExpense = (id: number) => {
    const expense = expenses.find(e => e.id === id);
    const expenseTitle = expense ? `${expense.item} (${expense.amount})` : '記帳項目';
    setExpenses(prev => prev.map(e => {
      if (e.id === id) {
        const { deletedAt, deletedBy, deletedByMemberId, ...rest } = e as any;
        return rest;
      }
      return e;
    }));
    restoreTripItem(currentTripId, 'expenses', id, currentUser, 'expense', expenseTitle).catch(err => {
      console.error("Failed to restore expense:", err);
    });
  };

  const addCurrency = (c: Currency) => {
    updateTripField(currentTripId, 'currencies', [...currencies, c]);
  };

  const removeCurrency = (code: string) => {
    updateTripField(currentTripId, 'currencies', currencies.filter(c => c.code !== code));
  };

  return {
    expenses,
    setExpenses,
    currencies,
    setCurrencies,
    handleAddExpense,
    handleUpdateExpense,
    handleDeleteExpense,
    handleRestoreExpense,
    addCurrency,
    removeCurrency
  };
};

