import { useState } from 'react';
import { Expense, Currency } from '../types';
import { addTripItem, updateTripField } from '../services/tripService';

export const useExpensesData = (currentTripId: string) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);

  const handleAddExpense = (newExpense: Omit<Expense, 'id'>) => {
    addTripItem(currentTripId, 'expenses', { ...newExpense, id: Date.now() });
  };

  const handleUpdateExpense = (updated: Expense) => {
    updateTripField(currentTripId, 'expenses', expenses.map(e => e.id === updated.id ? updated : e));
  };

  const handleDeleteExpense = (id: number) => {
    updateTripField(currentTripId, 'expenses', expenses.filter(e => e.id !== id));
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
    addCurrency,
    removeCurrency
  };
};
