import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../infrastructure/firebase';
import { uploadImageAsset } from '../../infrastructure/storage';
import { Journal } from './types';
import { CURRENT_SCHEMA_VERSION } from '../../shared/types/schema';
import { migrateJournalToV2 } from '../../shared/utils/migrationAdapter';
import { normalizeImagesList, toUrlList } from '../../shared/utils/imageAdapter';
import { ImageAssetReference } from '../../shared/types/image';

export const journalService = {
  async saveJournal(
    tripId: string,
    journalData: Partial<Journal>,
    newFiles: File[] = []
  ): Promise<Journal> {
    const id = journalData.id || Date.now();

    const uploadedReferences: ImageAssetReference[] = [];
    for (const file of newFiles) {
      try {
        const { reference } = await uploadImageAsset(file, tripId, { domain: 'journal' });
        uploadedReferences.push(reference);
      } catch (err) {
        console.warn('Failed to upload image asset for journal:', err);
      }
    }

    const existingReferences = normalizeImagesList(
      journalData.imageReferences || journalData.images,
      null,
      journalData.photos
    );
    const combinedReferences = [...existingReferences, ...uploadedReferences];

    const newJournal: Journal = {
      id,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      date: journalData.date || new Date().toISOString().split('T')[0],
      author: journalData.author || '我',
      content: journalData.content || '',
      imageReferences: combinedReferences,
      photos: toUrlList(combinedReferences),
      images: toUrlList(combinedReferences),
      comments: journalData.comments || [],
    };

    // Save to subcollection
    const docRef = doc(db, 'trips', tripId, 'journals', String(id));
    await setDoc(docRef, newJournal, { merge: true });

    return newJournal;
  },

  async deleteJournal(tripId: string, id: number): Promise<void> {
    const docRef = doc(db, 'trips', tripId, 'journals', String(id));
    await deleteDoc(docRef);
  },

  normalize(rawJournal: any): Journal {
    return migrateJournalToV2(rawJournal);
  },
};
