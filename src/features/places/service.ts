import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../infrastructure/firebase';
import { uploadImageAsset } from '../../infrastructure/storage';
import { PocketItem } from './types';
import { CURRENT_SCHEMA_VERSION } from '../../shared/types/schema';
import { migratePocketItemToV2 } from '../../shared/utils/migrationAdapter';
import { normalizeImagesList, toUrlList } from '../../shared/utils/imageAdapter';
import { ImageAssetReference } from '../../shared/types/image';

/**
 * PocketPlaces Domain Service
 * Handles persistence, image storage references, and Schema V2 compliance.
 */
export const placesService = {
  /**
   * Save (create or update) a pocket place item
   */
  async savePocketItem(
    tripId: string,
    itemData: Partial<PocketItem>,
    newFiles: File[] = []
  ): Promise<PocketItem> {
    const id = itemData.id || `pocket_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    
    // Upload any newly attached files to Firebase Storage
    const uploadedReferences: ImageAssetReference[] = [];
    for (const file of newFiles) {
      try {
        const { reference } = await uploadImageAsset(file, tripId, { domain: 'pocketPlaces' });
        uploadedReferences.push(reference);
      } catch (err) {
        console.warn('Failed to upload image asset for pocket item:', err);
      }
    }

    // Merge existing and new image references
    const existingReferences = normalizeImagesList(
      itemData.imageReferences || itemData.images,
      (itemData as any)?.image,
      (itemData as any)?.photos
    );
    const combinedReferences = [...existingReferences, ...uploadedReferences];

    const pocketItem: PocketItem = {
      id,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      category: itemData.category || 'food',
      title: (itemData.title || '').trim(),
      location: itemData.location || '',
      url: itemData.url || '',
      notes: itemData.notes || '',
      tag: (itemData.tag || '').trim(),
      rating: typeof itemData.rating === 'number' ? itemData.rating : 5,
      priceRange: (itemData.priceRange || '').trim(),
      assignedDate: itemData.assignedDate || '',
      isVisited: Boolean(itemData.isVisited),
      imageReferences: combinedReferences,
      images: toUrlList(combinedReferences),
      createdAt: itemData.createdAt || Date.now(),
    };

    const docRef = doc(db, 'trips', tripId, 'pocketItems', id);
    await setDoc(docRef, pocketItem, { merge: true });

    return pocketItem;
  },

  /**
   * Delete a pocket place item
   */
  async deletePocketItem(tripId: string, itemId: string): Promise<void> {
    const docRef = doc(db, 'trips', tripId, 'pocketItems', itemId);
    await deleteDoc(docRef);
  },

  /**
   * Toggle visited status
   */
  async toggleVisited(tripId: string, item: PocketItem): Promise<void> {
    const docRef = doc(db, 'trips', tripId, 'pocketItems', item.id);
    await setDoc(
      docRef,
      {
        isVisited: !item.isVisited,
        schemaVersion: CURRENT_SCHEMA_VERSION,
      },
      { merge: true }
    );
  },

  /**
   * Normalize an incoming raw pocket item (V1 -> V2)
   */
  normalize(rawItem: any): PocketItem {
    return migratePocketItemToV2(rawItem);
  },
};
