import { doc, collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../infrastructure/firebase';
import { TripSnapshot } from './types';
import { CURRENT_SCHEMA_VERSION } from '../../shared/types/schema';

export const historyService = {
  async saveSnapshot(tripId: string, label: string, data: Record<string, any>): Promise<void> {
    try {
      const colRef = collection(db, 'trips', tripId, 'snapshots');
      await addDoc(colRef, {
        tripId,
        label,
        timestamp: Date.now(),
        data,
        schemaVersion: CURRENT_SCHEMA_VERSION,
      });
    } catch (err) {
      console.warn('Snapshot save skipped:', err);
    }
  },

  async fetchSnapshots(tripId: string, maxItems = 10): Promise<TripSnapshot[]> {
    try {
      const colRef = collection(db, 'trips', tripId, 'snapshots');
      const q = query(colRef, orderBy('timestamp', 'desc'), limit(maxItems));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
      } as TripSnapshot));
    } catch (err) {
      console.warn('Failed to fetch snapshots:', err);
      return [];
    }
  },
};
