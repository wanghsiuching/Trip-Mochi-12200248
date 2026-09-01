import { useState } from 'react';
import { Journal } from '../types';
import { addTripItem, updateTripField, deleteJournalItem } from '../services/tripService';

export const useJournalsData = (currentTripId: string) => {
  const [journals, setJournals] = useState<Journal[]>([]);

  const handleAddJournal = (newJournal: Journal) => {
    addTripItem(currentTripId, 'journals', newJournal);
  };

  const handleUpdateJournal = (updated: Journal) => {
    updateTripField(currentTripId, 'journals', journals.map(j => j.id === updated.id ? updated : j));
  };

  const handleDeleteJournal = (id: number) => {
    deleteJournalItem(currentTripId, id).catch(() => {});
    updateTripField(currentTripId, 'journals', journals.filter(j => j.id !== id));
  };

  return {
    journals,
    setJournals,
    handleAddJournal,
    handleUpdateJournal,
    handleDeleteJournal
  };
};
