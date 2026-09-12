import { useMemo, useCallback } from 'react';
import { Journal } from '../types';
import { journalService } from '../service';

export interface UseJournalProps {
  tripId: string;
  journals: Journal[];
  onJournalUpdated?: (journal: Journal) => void;
  onJournalDeleted?: (id: number) => void;
}

export function useJournal({
  tripId,
  journals,
  onJournalUpdated,
  onJournalDeleted,
}: UseJournalProps) {
  const normalizedJournals = useMemo(() => {
    return (journals || []).map(journalService.normalize);
  }, [journals]);

  const saveJournal = useCallback(
    async (journalData: Partial<Journal>, newFiles: File[] = []) => {
      if (!tripId) return;
      const saved = await journalService.saveJournal(tripId, journalData, newFiles);
      onJournalUpdated?.(saved);
      return saved;
    },
    [tripId, onJournalUpdated]
  );

  const deleteJournal = useCallback(
    async (id: number) => {
      if (!tripId) return;
      await journalService.deleteJournal(tripId, id);
      onJournalDeleted?.(id);
    },
    [tripId, onJournalDeleted]
  );

  return {
    journals: normalizedJournals,
    saveJournal,
    deleteJournal,
  };
}
