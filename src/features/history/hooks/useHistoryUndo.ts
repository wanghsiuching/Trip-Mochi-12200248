import { useState, useCallback } from 'react';
import { HistoryRecord } from '../types';
import { historyService } from '../service';

export function useHistoryUndo(tripId: string) {
  const [historyList, setHistoryList] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [undoError, setUndoError] = useState<string | null>(null);

  const fetchHistory = useCallback(
    async (entityId: string) => {
      if (!tripId || !entityId) return [];
      setLoading(true);
      setUndoError(null);
      try {
        const records = await historyService.fetchEntityHistory(tripId, entityId);
        setHistoryList(records);
        return records;
      } finally {
        setLoading(false);
      }
    },
    [tripId]
  );

  const undo = useCallback(
    async (
      record: HistoryRecord,
      getCurrentEntity: () => Promise<Record<string, any> | null>,
      applyRevert: (reverted: Record<string, any>) => Promise<void>,
      actorName: string = '我'
    ): Promise<{ success: boolean; message?: string }> => {
      setUndoError(null);
      const res = await historyService.executeUndo(
        tripId,
        record,
        getCurrentEntity,
        applyRevert,
        actorName
      );

      if (!res.success) {
        setUndoError(res.message || '復原失敗');
        return { success: false, message: res.message || '復原失敗' };
      }

      // Update local history state
      setHistoryList((prev) =>
        prev.map((h) => (h.id === record.id ? { ...h, isUndone: true } : h))
      );
      return { success: true };
    },
    [tripId]
  );

  return {
    historyList,
    loading,
    undoError,
    fetchHistory,
    undo,
    clearError: () => setUndoError(null),
  };
}
