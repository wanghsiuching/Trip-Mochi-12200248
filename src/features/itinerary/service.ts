import { doc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../infrastructure/firebase';
import { uploadImageAsset } from '../../infrastructure/storage';
import { ScheduleItem } from './types';
import { CURRENT_SCHEMA_VERSION } from '../../shared/types/schema';
import { migrateScheduleItemToV2 } from '../../shared/utils/migrationAdapter';
import { normalizeImagesList, toUrlList } from '../../shared/utils/imageAdapter';
import { ImageAssetReference } from '../../shared/types/image';

export const itineraryService = {
  /**
   * Save (create or update) a schedule item in the subcollection
   */
  async saveScheduleItem(
    tripId: string,
    itemData: Partial<ScheduleItem>,
    newFiles: File[] = []
  ): Promise<ScheduleItem> {
    const id = itemData.id || `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Upload newly attached images
    const uploadedReferences: ImageAssetReference[] = [];
    for (const file of newFiles) {
      try {
        const { reference } = await uploadImageAsset(file, tripId, { domain: 'itinerary' });
        uploadedReferences.push(reference);
      } catch (err) {
        console.warn('Failed to upload image asset for schedule item:', err);
      }
    }

    const existingReferences = normalizeImagesList(
      itemData.imageReferences || itemData.images,
      (itemData as any)?.image,
      (itemData as any)?.photos
    );
    const combinedReferences = [...existingReferences, ...uploadedReferences];

    const scheduleItem: ScheduleItem = {
      ...itemData,
      id,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      date: itemData.date || '',
      time: itemData.time || '09:00',
      title: (itemData.title || '').trim(),
      type: itemData.type || 'spot',
      location: itemData.location || itemData.address || '',
      notes: itemData.notes || itemData.note || '',
      imageReferences: combinedReferences,
      images: toUrlList(combinedReferences),
    };

    const docRef = doc(db, 'trips', tripId, 'scheduleItems', id);
    await setDoc(docRef, scheduleItem, { merge: true });

    return scheduleItem;
  },

  /**
   * Delete a schedule item
   */
  async deleteScheduleItem(tripId: string, itemId: string): Promise<void> {
    const docRef = doc(db, 'trips', tripId, 'scheduleItems', itemId);
    await deleteDoc(docRef);
  },

  /**
   * Reorder schedule items and update their order in Firestore
   */
  async reorderScheduleItems(tripId: string, items: ScheduleItem[]): Promise<void> {
    const batch = writeBatch(db);
    items.forEach((item, index) => {
      const docRef = doc(db, 'trips', tripId, 'scheduleItems', item.id);
      batch.set(docRef, { order: index, schemaVersion: CURRENT_SCHEMA_VERSION }, { merge: true });
    });
    await batch.commit();
  },

  /**
   * Normalize an incoming raw schedule item (V1 -> V2)
   */
  normalize(rawItem: any): ScheduleItem {
    return migrateScheduleItemToV2(rawItem);
  },
};
