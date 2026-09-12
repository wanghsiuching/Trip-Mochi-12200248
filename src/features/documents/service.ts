import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../infrastructure/firebase';
import { uploadImageAsset } from '../../infrastructure/storage';
import { TravelDocument } from './types';
import { CURRENT_SCHEMA_VERSION } from '../../shared/types/schema';
import { migrateDocumentToV2 } from '../../shared/utils/migrationAdapter';
import { normalizeImagesList, toUrlList } from '../../shared/utils/imageAdapter';
import { ImageAssetReference } from '../../shared/types/image';

export const documentsService = {
  async saveDocument(
    tripId: string,
    existingDocs: TravelDocument[],
    docData: Partial<TravelDocument>,
    newFiles: File[] = []
  ): Promise<TravelDocument[]> {
    const id = docData.id || Date.now();

    const uploadedReferences: ImageAssetReference[] = [];
    for (const file of newFiles) {
      try {
        const { reference } = await uploadImageAsset(file, tripId, { domain: 'documents' });
        uploadedReferences.push(reference);
      } catch (err) {
        console.warn('Failed to upload image asset for document:', err);
      }
    }

    const existingReferences = normalizeImagesList(
      docData.imageReferences || docData.images
    );
    const combinedReferences = [...existingReferences, ...uploadedReferences];

    const newDoc: TravelDocument = {
      ...(docData as TravelDocument),
      id,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      imageReferences: combinedReferences,
      images: toUrlList(combinedReferences),
      createdAt: docData.createdAt || Date.now(),
    };

    const updated = existingDocs.some(d => String(d.id) === String(id))
      ? existingDocs.map(d => String(d.id) === String(id) ? newDoc : d)
      : [newDoc, ...existingDocs];

    await updateDoc(doc(db, 'trips', tripId), { documents: updated });
    return updated;
  },

  async deleteDocument(
    tripId: string,
    existingDocs: TravelDocument[],
    id: string | number
  ): Promise<TravelDocument[]> {
    const updated = existingDocs.filter(d => String(d.id) !== String(id));
    await updateDoc(doc(db, 'trips', tripId), { documents: updated });
    return updated;
  },

  normalize(rawDoc: any): TravelDocument {
    return migrateDocumentToV2(rawDoc);
  },
};
