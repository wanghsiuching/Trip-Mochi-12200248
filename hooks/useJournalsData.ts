import { useState } from 'react';
import { Journal } from '../types';
import { saveJournalItem, softDeleteJournalItem, restoreJournalItem } from '../services/tripService';
import { LocalUserIdentity } from '../src/features/collaboration/types';

export const useJournalsData = (currentTripId: string, currentUser?: LocalUserIdentity | null) => {
  const [journals, setJournals] = useState<Journal[]>([]);

  const handleAddJournal = async (newJournal: Journal): Promise<void> => {
    setJournals(prev => [newJournal, ...prev.filter(j => j.id !== newJournal.id)]);
    try {
      await saveJournalItem(currentTripId, newJournal, currentUser);
    } catch (err) {
      console.error("Failed to save journal:", err);
      throw err;
    }
  };

  const handleUpdateJournal = async (updated: Journal, prevItem?: Journal): Promise<void> => {
    setJournals(prev => prev.map(j => j.id === updated.id ? updated : j));
    try {
      await saveJournalItem(currentTripId, updated, currentUser, prevItem);
    } catch (err) {
      console.error("Failed to update journal:", err);
      throw err;
    }
  };

  const handleDeleteJournal = (id: number) => {
    const journal = journals.find(j => j.id === id);
    const title = journal?.title || '旅行日記';
    const now = Date.now();
    setJournals(prev => prev.map(j => j.id === id ? { ...j, deletedAt: now, deletedBy: currentUser?.userId || 'unknown' } : j));
    softDeleteJournalItem(currentTripId, id, currentUser, title).catch(err => {
      console.error("Failed to soft-delete journal:", err);
    });
  };

  const handleRestoreJournal = async (id: number) => {
    const journal = journals.find(j => j.id === id);
    const title = journal?.title || '旅行日記';
    setJournals(prev => prev.map(j => {
      if (j.id === id) {
        const { deletedAt, deletedBy, deletedByMemberId, ...rest } = j as any;
        return rest;
      }
      return j;
    }));
    await restoreJournalItem(currentTripId, id, currentUser, title);
  };

  return {
    journals,
    setJournals,
    handleAddJournal,
    handleUpdateJournal,
    handleDeleteJournal,
    handleRestoreJournal,
  };
};

