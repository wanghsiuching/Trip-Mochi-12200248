import { CURRENT_SCHEMA_VERSION, SchemaVersion, VersionedEntity } from '../types/schema';
import { normalizeImagesList, toUrlList } from './imageAdapter';
import { ImageAssetReference } from '../types/image';

/**
 * Migration & Backward-Compatibility Layer (V1 -> V2)
 *
 * Rules:
 * 1. Non-destructive: Never deletes or throws away existing fields.
 * 2. Idempotent: Running migration multiple times produces the same safe result.
 * 3. Fallback: If schemaVersion is missing or unrecognized, safely treats as V1.
 * 4. Dual-format output: Prepares V2 normalized fields while keeping legacy string arrays
 *    for components not yet fully migrated.
 */

export function detectSchemaVersion(data: any): SchemaVersion {
  if (!data || typeof data !== 'object') return 1;
  if (data.schemaVersion === 2) return 2;
  return 1;
}

/**
 * Migrates a PocketItem from V1 to V2
 */
export function migratePocketItemToV2(item: any): any {
  if (!item) return item;

  const version = detectSchemaVersion(item);
  const normalizedImages: ImageAssetReference[] = normalizeImagesList(
    item.images,
    item.image,
    item.photos
  );

  const v2Item = {
    ...item,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    title: item.title || '',
    category: item.category || 'spot',
    location: item.location || item.address || '',
    notes: item.notes || item.note || '',
    url: item.url || item.googleMapUrl || item.link || '',
    tag: item.tag || '',
    rating: typeof item.rating === 'number' ? item.rating : 5,
    priceRange: item.priceRange || item.price || '',
    isVisited: Boolean(item.isVisited),
    // V2 references
    imageReferences: normalizedImages,
    // Backward compatibility string array for legacy UI
    images: toUrlList(normalizedImages),
  };

  return v2Item;
}

/**
 * Migrates a ScheduleItem from V1 to V2
 */
export function migrateScheduleItemToV2(item: any): any {
  if (!item) return item;

  const normalizedImages: ImageAssetReference[] = normalizeImagesList(
    item.images,
    item.image,
    item.photos
  );

  return {
    ...item,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    title: item.title || '',
    location: item.location || item.address || '',
    notes: item.notes || item.note || '',
    imageReferences: normalizedImages,
    images: toUrlList(normalizedImages),
  };
}

/**
 * Migrates an Expense from V1 to V2
 */
export function migrateExpenseToV2(item: any): any {
  if (!item) return item;

  const normalizedImages: ImageAssetReference[] = normalizeImagesList(
    item.images,
    item.image,
    item.photos
  );

  return {
    ...item,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    imageReferences: normalizedImages,
    images: toUrlList(normalizedImages),
    image: normalizedImages.length > 0 ? normalizedImages[0].downloadUrl : (item.image || null),
  };
}

/**
 * Migrates a Journal from V1 to V2
 */
export function migrateJournalToV2(item: any): any {
  if (!item) return item;

  const normalizedImages: ImageAssetReference[] = normalizeImagesList(
    item.images,
    item.image,
    item.photos
  );

  return {
    ...item,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    imageReferences: normalizedImages,
    photos: toUrlList(normalizedImages),
    images: toUrlList(normalizedImages),
  };
}

/**
 * Migrates a TravelDocument from V1 to V2
 */
export function migrateDocumentToV2(item: any): any {
  if (!item) return item;

  const normalizedImages: ImageAssetReference[] = normalizeImagesList(
    item.images,
    item.image,
    item.photos
  );

  return {
    ...item,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    imageReferences: normalizedImages,
    images: toUrlList(normalizedImages),
  };
}

/**
 * Migrates an entire Trip object from V1 to V2
 */
export function migrateTripToV2(trip: any): any {
  if (!trip) return trip;

  const migrated: any = {
    ...trip,
    schemaVersion: CURRENT_SCHEMA_VERSION,
  };

  if (Array.isArray(trip.scheduleItems)) {
    migrated.scheduleItems = trip.scheduleItems.map(migrateScheduleItemToV2);
  }

  if (Array.isArray(trip.pocketItems)) {
    migrated.pocketItems = trip.pocketItems.map(migratePocketItemToV2);
  }

  if (Array.isArray(trip.expenses)) {
    migrated.expenses = trip.expenses.map(migrateExpenseToV2);
  }

  if (Array.isArray(trip.journals)) {
    migrated.journals = trip.journals.map(migrateJournalToV2);
  }

  if (Array.isArray(trip.documents)) {
    migrated.documents = trip.documents.map(migrateDocumentToV2);
  }

  return migrated;
}
