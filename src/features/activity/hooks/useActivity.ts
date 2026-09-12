import { useState, useEffect, useCallback } from 'react';
import { ActivityLogItem } from '../types';
import { activityService } from '../service';

export function useActivity(tripId: string) {
  const [activities, setActivities] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState(false);

  const loadActivities = useCallback(async () => {
    if (!tripId) return;
    setLoading(true);
    try {
      const items = await activityService.fetchRecentActivities(tripId);
      setActivities(items);
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  const logActivity = useCallback(
    async (activity: Omit<ActivityLogItem, 'id' | 'timestamp' | 'schemaVersion'>) => {
      if (!tripId) return;
      await activityService.logActivity(tripId, activity);
      loadActivities();
    },
    [tripId, loadActivities]
  );

  return {
    activities,
    loading,
    logActivity,
    refreshActivities: loadActivities,
  };
}
