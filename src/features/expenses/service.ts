import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../infrastructure/firebase';
import { uploadImageAsset } from '../../infrastructure/storage';
import { Expense } from './types';
import { CURRENT_SCHEMA_VERSION } from '../../shared/types/schema';
import { migrateExpenseToV2 } from '../../shared/utils/migrationAdapter';
import { normalizeImagesList, toUrlList } from '../../shared/utils/imageAdapter';
import { ImageAssetReference } from '../../shared/types/image';

export const expensesService = {
  /**
   * Save (create or update) an expense item
   */
  async saveExpense(
    tripId: string,
    existingExpenses: Expense[],
    expenseData: Partial<Expense>,
    newFiles: File[] = []
  ): Promise<Expense[]> {
    const id = expenseData.id || Date.now();

    // Upload newly attached images
    const uploadedReferences: ImageAssetReference[] = [];
    for (const file of newFiles) {
      try {
        const { reference } = await uploadImageAsset(file, tripId, { domain: 'expenses' });
        uploadedReferences.push(reference);
      } catch (err) {
        console.warn('Failed to upload image asset for expense:', err);
      }
    }

    const existingReferences = normalizeImagesList(
      expenseData.imageReferences || expenseData.images,
      expenseData.image
    );
    const combinedReferences = [...existingReferences, ...uploadedReferences];

    const newOrUpdatedExpense: Expense = {
      id,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      title: (expenseData.title || '').trim(),
      amount: Number(expenseData.amount) || 0,
      currency: expenseData.currency || 'TWD',
      payer: expenseData.payer || '我',
      paymentMethod: expenseData.paymentMethod || 'cash',
      location: expenseData.location || '',
      date: expenseData.date || new Date().toISOString().split('T')[0],
      time: expenseData.time || '12:00',
      involvedMembers: expenseData.involvedMembers || [],
      settledMembers: expenseData.settledMembers || [],
      imageReferences: combinedReferences,
      images: toUrlList(combinedReferences),
      image: combinedReferences.length > 0 ? combinedReferences[0].downloadUrl : null,
      comments: expenseData.comments || [],
      isCreditCard: Boolean(expenseData.isCreditCard),
      hasServiceFee: Boolean(expenseData.hasServiceFee),
      serviceFeePercentage: Number(expenseData.serviceFeePercentage) || 0,
      category: expenseData.category || 'general',
      fundType: expenseData.fundType,
      expenseType: expenseData.expenseType || 'other',
    };

    let updatedExpenses: Expense[];
    const index = existingExpenses.findIndex(e => e.id === id);
    if (index >= 0) {
      updatedExpenses = [...existingExpenses];
      updatedExpenses[index] = newOrUpdatedExpense;
    } else {
      updatedExpenses = [newOrUpdatedExpense, ...existingExpenses];
    }

    const tripRef = doc(db, 'trips', tripId);
    await updateDoc(tripRef, {
      expenses: updatedExpenses,
      schemaVersion: CURRENT_SCHEMA_VERSION,
    });

    return updatedExpenses;
  },

  /**
   * Delete an expense
   */
  async deleteExpense(tripId: string, existingExpenses: Expense[], expenseId: number): Promise<Expense[]> {
    const updatedExpenses = existingExpenses.filter(e => e.id !== expenseId);
    const tripRef = doc(db, 'trips', tripId);
    await updateDoc(tripRef, {
      expenses: updatedExpenses,
    });
    return updatedExpenses;
  },

  /**
   * Settle an expense for a member
   */
  async settleExpense(
    tripId: string,
    existingExpenses: Expense[],
    expenseId: number,
    memberId: string
  ): Promise<Expense[]> {
    const updatedExpenses = existingExpenses.map(expense => {
      if (expense.id !== expenseId) return expense;
      const settled = new Set(expense.settledMembers || []);
      if (settled.has(memberId)) {
        settled.delete(memberId);
      } else {
        settled.add(memberId);
      }
      return {
        ...expense,
        settledMembers: Array.from(settled),
        schemaVersion: CURRENT_SCHEMA_VERSION,
      };
    });

    const tripRef = doc(db, 'trips', tripId);
    await updateDoc(tripRef, {
      expenses: updatedExpenses,
    });
    return updatedExpenses;
  },

  /**
   * Normalize an incoming raw expense (V1 -> V2)
   */
  normalize(rawExpense: any): Expense {
    return migrateExpenseToV2(rawExpense);
  },
};
