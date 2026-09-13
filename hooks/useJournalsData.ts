import { useState } from 'react';
import { Journal } from '../types';
import { saveJournalItem, deleteJournalItem } from '../services/tripService';

export const useJournalsData = (currentTripId: string) => {
  const [journals, setJournals] = useState<Journal[]>([]);

  const handleAddJournal = async (newJournal: Journal): Promise<void> => {
    setJournals(prev => [newJournal, ...prev.filter(j => j.id !== newJournal.id)]);
    try {
      await saveJournalItem(currentTripId, newJournal);
    } catch (err) {
      console.error("Failed to save journal:", err);
      throw err;
    }
  };

  const handleUpdateJournal = async (updated: Journal): Promise<void> => {
    setJournals(prev => prev.map(j => j.id === updated.id ? updated : j));
    try {
      await saveJournalItem(currentTripId, updated);
    } catch (err) {
      console.error("Failed to update journal:", err);
      throw err;
    }
  };

  const handleDeleteJournal = (id: number) => {
    setJournals(prev => prev.filter(j => j.id !== id));
    deleteJournalItem(currentTripId, id).catch(err => {
      console.error("Failed to delete journal:", err);
    });
  };

  return {
    journals,
    setJournals,
    handleAddJournal,
    handleUpdateJournal,
    handleDeleteJournal
  };
};
