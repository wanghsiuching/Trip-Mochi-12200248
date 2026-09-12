import { useState } from 'react';
import { Expense, Currency } from '../types';
import { addTripItem, updateTripField } from '../services/tripService';
import { activityService } from '../src/features/activity/service';
import { historyService } from '../src/features/history/service';

export const useExpensesData = (currentTripId: string) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);

  const handleAddExpense = (newExpense: Omit<Expense, 'id'>, actorName: string = '成員') => {
    const newItem: Expense = { ...newExpense, id: Date.now() };
    addTripItem(currentTripId, 'expenses', newItem);
    
    activityService.recordActivity(currentTripId, {
      actorName,
      action: 'add_expense',
      entityType: 'expense',
      entityId: String(newItem.id),
      summary: `新增了費用「${newItem.title}」(${newItem.currency} ${newItem.amount})`,
    });
  };

  const handleUpdateExpense = (updated: Expense, actorName: string = '成員') => {
    const before = expenses.find(e => e.id === updated.id);
    const updatedList = expenses.map(e => e.id === updated.id ? updated : e);
    setExpenses(updatedList);
    updateTripField(currentTripId, 'expenses', updatedList);

    if (before) {
      historyService.recordChange(currentTripId, {
        entityType: 'expense',
        entityId: String(updated.id),
        actorName,
        action: 'edit',
        summary: `編輯了費用「${updated.title}」`,
        before,
        after: updated,
      });

      activityService.recordActivity(currentTripId, {
        actorName,
        action: 'update',
        entityType: 'expense',
        entityId: String(updated.id),
        summary: `修改了費用「${updated.title}」(${updated.currency} ${updated.amount})`,
      });
    }
  };

  const handleDeleteExpense = (id: number, actorName: string = '成員') => {
    const target = expenses.find(e => e.id === id);
    if (!target) return;

    const softDeleted: Expense = {
      ...target,
      deletedAt: Date.now(),
      deletedBy: actorName,
    };

    const updatedList = expenses.map(e => e.id === id ? softDeleted : e);
    setExpenses(updatedList);
    updateTripField(currentTripId, 'expenses', updatedList);

    historyService.recordChange(currentTripId, {
      entityType: 'expense',
      entityId: String(id),
      actorName,
      action: 'soft_delete',
      summary: `刪除了費用「${target.title}」`,
      before: target,
      after: softDeleted,
    });

    activityService.recordActivity(currentTripId, {
      actorName,
      action: 'delete',
      entityType: 'expense',
      entityId: String(id),
      summary: `刪除了費用「${target.title}」`,
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
    addCurrency,
    removeCurrency
  };
};
