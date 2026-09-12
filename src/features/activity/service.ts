import { collection, addDoc, getDocs, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../infrastructure/firebase';
import { ActivityEvent, FieldChange } from './types';
import { CURRENT_SCHEMA_VERSION } from '../../shared/types/schema';

export const activityService = {
  /**
   * Log an activity event to `trips/{tripId}/activities`
   */
  async logActivity(
    tripId: string,
    event: Omit<ActivityEvent, 'id' | 'timestamp' | 'schemaVersion'>
  ): Promise<void> {
    if (!tripId) return;
    try {
      const colRef = collection(db, 'trips', tripId, 'activities');
      // Ensure actor display name is never empty or fake
      const safeActorName = event.actorName?.trim() || '未知使用者';
      const safeActorId = event.actorId?.trim() || 'unknown';

      await addDoc(colRef, {
        ...event,
        actorName: safeActorName,
        actorId: safeActorId,
        schemaVersion: CURRENT_SCHEMA_VERSION,
        timestamp: Date.now(),
      });
    } catch (err) {
      console.warn('Activity logging skipped:', err);
    }
  },

  /**
   * Subscribe to real-time activities in `trips/{tripId}/activities`
   */
  subscribeToActivities(
    tripId: string,
    onUpdate: (events: ActivityEvent[]) => void,
    maxItems = 100
  ): () => void {
    if (!tripId) {
      onUpdate([]);
      return () => {};
    }
    try {
      const colRef = collection(db, 'trips', tripId, 'activities');
      const q = query(colRef, orderBy('timestamp', 'desc'), limit(maxItems));
      return onSnapshot(q, (snap) => {
        const events = snap.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            tripId,
            actorId: data.actorId || 'unknown',
            actorMemberId: data.actorMemberId,
            actorName: data.actorName || (data.author ? data.author : '早期資料'),
            actorAvatar: data.actorAvatar || null,
            action: data.action || 'update',
            entityType: data.entityType || data.domain || 'schedule',
            entityId: data.entityId || d.id,
            summary: data.summary || data.title || data.description || '異動紀錄',
            changes: data.changes || [],
            timestamp: typeof data.timestamp === 'number' ? data.timestamp : Date.now(),
            schemaVersion: data.schemaVersion || 1,
          } as ActivityEvent;
        });
        onUpdate(events);
      }, (err) => {
        console.warn('Real-time activities subscription failed:', err);
      });
    } catch (err) {
      console.warn('Failed to setup activities listener:', err);
      return () => {};
    }
  },

  /**
   * One-time fetch of recent activities
   */
  async fetchRecentActivities(tripId: string, maxItems = 100): Promise<ActivityEvent[]> {
    if (!tripId) return [];
    try {
      const colRef = collection(db, 'trips', tripId, 'activities');
      const q = query(colRef, orderBy('timestamp', 'desc'), limit(maxItems));
      const snap = await getDocs(q);
      return snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          tripId,
          actorId: data.actorId || 'unknown',
          actorMemberId: data.actorMemberId,
          actorName: data.actorName || (data.author ? data.author : '早期資料'),
          actorAvatar: data.actorAvatar || null,
          action: data.action || 'update',
          entityType: data.entityType || data.domain || 'schedule',
          entityId: data.entityId || d.id,
          summary: data.summary || data.title || data.description || '異動紀錄',
          changes: data.changes || [],
          timestamp: typeof data.timestamp === 'number' ? data.timestamp : Date.now(),
          schemaVersion: data.schemaVersion || 1,
        } as ActivityEvent;
      });
    } catch (err) {
      console.warn('Failed to fetch activities:', err);
      return [];
    }
  },

  /**
   * Helper to compute diff changes between old and new state
   */
  calculateChanges(
    before: Record<string, any> | null | undefined,
    after: Record<string, any> | null | undefined,
    fieldLabels: Record<string, string> = {}
  ): FieldChange[] {
    if (!before || !after) return [];
    const changes: FieldChange[] = [];
    const ignoredKeys = new Set(['id', 'schemaVersion', 'version', 'updatedAt', 'updatedBy', 'updatedByMemberId', 'createdAt', 'comments', 'imageReferences', 'images', 'photos']);

    const allKeys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)]));
    for (const key of allKeys) {
      if (ignoredKeys.has(key)) continue;
      const valBefore = before[key];
      const valAfter = after[key];

      // Deep string comparison for simple objects/primitives
      if (JSON.stringify(valBefore ?? null) !== JSON.stringify(valAfter ?? null)) {
        changes.push({
          field: key,
          fieldLabel: fieldLabels[key] || key,
          before: valBefore ?? '無',
          after: valAfter ?? '無',
        });
      }
    }
    return changes;
  }
};

