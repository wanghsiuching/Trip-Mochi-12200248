import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  Unsubscribe 
} from 'firebase/firestore';
import { db } from '../../infrastructure/firebase';
import { ActivityEvent, ActivityAction, ActivityEntityType } from './types';
import { CURRENT_SCHEMA_VERSION } from '../../shared/types/schema';

export const activityService = {
  /**
   * Log an activity event to trips/{tripId}/activity
   */
  async recordActivity(
    tripId: string,
    event: {
      actorId?: string;
      actorName: string;
      actorAvatar?: string | null;
      action: ActivityAction;
      entityType: ActivityEntityType;
      entityId: string;
      summary: string;
      metadata?: Record<string, any>;
    }
  ): Promise<void> {
    if (!tripId) return;
    try {
      const colRef = collection(db, 'trips', tripId, 'activity');
      await addDoc(colRef, {
        ...event,
        tripId,
        actorName: event.actorName || '成員',
        actorAvatar: event.actorAvatar || null,
        timestamp: Date.now(),
        schemaVersion: CURRENT_SCHEMA_VERSION,
      });
    } catch (err) {
      console.warn('[ActivityService] Activity logging skipped:', err);
    }
  },

  /**
   * Realtime subscription to the latest activity stream
   */
  subscribeToActivity(
    tripId: string,
    callback: (events: ActivityEvent[]) => void,
    maxItems = 30
  ): Unsubscribe {
    if (!tripId) {
      callback([]);
      return () => {};
    }

    try {
      const colRef = collection(db, 'trips', tripId, 'activity');
      const q = query(colRef, orderBy('timestamp', 'desc'), limit(maxItems));

      return onSnapshot(
        q,
        (snap) => {
          const events: ActivityEvent[] = snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as any),
          }));
          callback(events);
        },
        (err) => {
          console.warn('[ActivityService] Subscription error:', err);
          callback([]);
        }
      );
    } catch (err) {
      console.warn('[ActivityService] Failed to establish listener:', err);
      callback([]);
      return () => {};
    }
  },

  /**
   * Fetch recent activities once
   */
  async fetchActivities(tripId: string, maxItems = 30): Promise<ActivityEvent[]> {
    if (!tripId) return [];
    try {
      const colRef = collection(db, 'trips', tripId, 'activity');
      const q = query(colRef, orderBy('timestamp', 'desc'), limit(maxItems));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));
    } catch (err) {
      console.warn('[ActivityService] Fetch error:', err);
      return [];
    }
  },
};
