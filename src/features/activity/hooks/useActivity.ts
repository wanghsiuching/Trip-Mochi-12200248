import { useState, useEffect, useCallback } from 'react';
import { ActivityEvent } from '../types';
import { activityService } from '../service';

export function useActivity(tripId: string) {
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tripId) {
      setActivities([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = activityService.subscribeToActivities(tripId, (items) => {
      setActivities(items);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [tripId]);

  const logActivity = useCallback(
    async (activity: Omit<ActivityEvent, 'id' | 'timestamp' | 'schemaVersion'>) => {
      if (!tripId) return;
      await activityService.logActivity(tripId, activity);
    },
    [tripId]
  );

  return {
    activities,
    loading,
    logActivity,
  };
}

