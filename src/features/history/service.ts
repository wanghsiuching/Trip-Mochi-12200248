import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  doc, 
  updateDoc 
} from 'firebase/firestore';
import { db } from '../../infrastructure/firebase';
import { HistoryRecord, HistoryEntityType, ChangedField } from './types';
import { CURRENT_SCHEMA_VERSION } from '../../shared/types/schema';
import { computeEntityDiff } from './diffHelper';
import { activityService } from '../activity/service';

export const historyService = {
  /**
   * Records a history entry if fields have actually changed
   */
  async recordChange(
    tripId: string,
    params: {
      entityType: HistoryEntityType;
      entityId: string;
      actorId?: string;
      actorName: string;
      action: HistoryRecord['action'];
      summary?: string;
      before: Record<string, any>;
      after: Record<string, any>;
      canUndo?: boolean;
    }
  ): Promise<HistoryRecord | null> {
    if (!tripId || !params.entityId) return null;

    const changedFields = computeEntityDiff(params.before, params.after, params.entityType);

    // If nothing changed and it's not a soft delete/restore action, skip
    if (changedFields.length === 0 && params.action !== 'soft_delete' && params.action !== 'restore') {
      return null;
    }

    try {
      const colRef = collection(db, 'trips', tripId, 'history');
      const recordData = {
        tripId,
        entityType: params.entityType,
        entityId: String(params.entityId),
        actorId: params.actorId || '',
        actorName: params.actorName || '成員',
        timestamp: Date.now(),
        action: params.action,
        summary: params.summary || '',
        changedFields,
        canUndo: params.canUndo !== false,
        isUndone: false,
        schemaVersion: CURRENT_SCHEMA_VERSION,
      };

      const docRef = await addDoc(colRef, recordData);
      return {
        id: docRef.id,
        ...recordData,
      };
    } catch (err) {
      console.warn('[HistoryService] Failed to record history entry:', err);
      return null;
    }
  },

  /**
   * Fetch history for a specific entity (e.g. for a ScheduleItem, Booking, etc.)
   */
  async fetchEntityHistory(
    tripId: string,
    entityId: string,
    maxItems = 15
  ): Promise<HistoryRecord[]> {
    if (!tripId || !entityId) return [];

    try {
      const colRef = collection(db, 'trips', tripId, 'history');
      // Attempt compound query with order
      try {
        const q = query(
          colRef,
          where('entityId', '==', String(entityId)),
          orderBy('timestamp', 'desc'),
          limit(maxItems)
        );
        const snap = await getDocs(q);
        return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      } catch (compoundErr) {
        // Fallback for missing compound index: query where and sort in memory
        const qFallback = query(
          colRef,
          where('entityId', '==', String(entityId)),
          limit(maxItems * 2)
        );
        const snapFallback = await getDocs(qFallback);
        const items = snapFallback.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as HistoryRecord[];
        return items.sort((a, b) => b.timestamp - a.timestamp).slice(0, maxItems);
      }
    } catch (err) {
      console.warn('[HistoryService] Fetch entity history error:', err);
      return [];
    }
  },

  /**
   * Safe Undo operation:
   * Validates whether current entity state matches the "after" values.
   * If conflict is detected, throws error with message: "此資料已被其他成員更新，請重新確認。"
   */
  async executeUndo(
    tripId: string,
    historyRecord: HistoryRecord,
    getCurrentEntity: () => Promise<Record<string, any> | null>,
    applyRevert: (revertedEntity: Record<string, any>) => Promise<void>,
    actorName: string = '我'
  ): Promise<{ success: boolean; message?: string }> {
    if (!historyRecord.canUndo || historyRecord.isUndone) {
      return { success: false, message: '此操作不可復原或已復原過。' };
    }

    const current = await getCurrentEntity();
    if (!current) {
      return { success: false, message: '找不到對應的項目資料。' };
    }

    // Version conflict validation:
    // Check if each changed field in current entity still matches the "after" value
    for (const change of historyRecord.changedFields) {
      const currentVal = current[change.field];
      const afterVal = change.after;

      const isCurrentMatchingAfter = 
        currentVal === afterVal || 
        JSON.stringify(currentVal ?? null) === JSON.stringify(afterVal ?? null);

      if (!isCurrentMatchingAfter) {
        return {
          success: false,
          message: '此資料已被其他成員更新，請重新確認。',
        };
      }
    }

    // Apply revert to changed fields
    const reverted = { ...current };
    for (const change of historyRecord.changedFields) {
      reverted[change.field] = change.before;
    }

    // Save reverted entity
    await applyRevert(reverted);

    // Mark history record as undone
    try {
      const histDocRef = doc(db, 'trips', tripId, 'history', historyRecord.id);
      await updateDoc(histDocRef, { isUndone: true });
    } catch (err) {
      console.warn('[HistoryService] Failed to mark history as undone:', err);
    }

    // Record activity for the undo
    await activityService.recordActivity(tripId, {
      actorName,
      action: 'update',
      entityType: historyRecord.entityType,
      entityId: historyRecord.entityId,
      summary: `復原了「${reverted.title || reverted.name || '項目'}」的修改`,
    });

    return { success: true };
  },
};
