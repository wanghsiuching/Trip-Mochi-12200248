import { useState, useEffect } from 'react';
import { ActivityEvent } from '../types';
import { activityService } from '../service';

export function useActivityFeed(tripId: string, maxItems = 35) {
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tripId) {
      setActivities([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = activityService.subscribeToActivity(
      tripId,
      (events) => {
        setActivities(events);
        setLoading(false);
      },
      maxItems
    );

    return () => {
      unsubscribe();
    };
  }, [tripId, maxItems]);

  return {
    activities,
    loading,
    recordActivity: (event: Parameters<typeof activityService.recordActivity>[1]) =>
      activityService.recordActivity(tripId, event),
  };
}

export const useActivity = useActivityFeed;
