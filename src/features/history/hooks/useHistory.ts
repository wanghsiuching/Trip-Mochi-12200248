import { useState, useCallback, useEffect } from 'react';
import { TripSnapshot } from '../types';
import { historyService } from '../service';

export function useHistory(tripId: string) {
  const [snapshots, setSnapshots] = useState<TripSnapshot[]>([]);
  const [loading, setLoading] = useState(false);

  const loadSnapshots = useCallback(async () => {
    if (!tripId) return;
    setLoading(true);
    try {
      const items = await historyService.fetchSnapshots(tripId);
      setSnapshots(items);
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    loadSnapshots();
  }, [loadSnapshots]);

  const saveSnapshot = useCallback(
    async (label: string, data: Record<string, any>) => {
      if (!tripId) return;
      await historyService.saveSnapshot(tripId, label, data);
      loadSnapshots();
    },
    [tripId, loadSnapshots]
  );

  return {
    snapshots,
    loading,
    saveSnapshot,
    refreshSnapshots: loadSnapshots,
  };
}
