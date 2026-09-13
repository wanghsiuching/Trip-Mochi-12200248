import { doc, collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../infrastructure/firebase';
import { ActivityLogItem } from './types';
import { CURRENT_SCHEMA_VERSION } from '../../shared/types/schema';

export const activityService = {
  async logActivity(
    tripId: string,
    activity: Omit<ActivityLogItem, 'id' | 'timestamp' | 'schemaVersion'>
  ): Promise<void> {
    try {
      const colRef = collection(db, 'trips', tripId, 'activities');
      await addDoc(colRef, {
        ...activity,
        schemaVersion: CURRENT_SCHEMA_VERSION,
        timestamp: Date.now(),
      });
    } catch (err) {
      console.warn('Activity logging skipped:', err);
    }
  },

  async fetchRecentActivities(tripId: string, maxItems = 30): Promise<ActivityLogItem[]> {
    try {
      const colRef = collection(db, 'trips', tripId, 'activities');
      const q = query(colRef, orderBy('timestamp', 'desc'), limit(maxItems));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
      } as ActivityLogItem));
    } catch (err) {
      console.warn('Failed to fetch activities:', err);
      return [];
    }
  },
};
