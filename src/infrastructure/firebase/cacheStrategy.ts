import { memoryLocalCache, FirestoreLocalCache } from 'firebase/firestore';

/**
 * Cache strategy module for Firestore.
 * Isolates local cache creation and legacy IndexedDB cleanup.
 * Allows switching cache strategies in the future without touching business logic.
 */
export function cleanupLegacyIndexedDB(): void {
  if (typeof window === 'undefined' || !window.indexedDB) return;

  try {
    const staleDbNames = [
      'firestore/[DEFAULT]/tripmochi2026/(default)',
      'firestore/[DEFAULT]/tripmochi2026',
      '[DEFAULT]-tripmochi2026-(default)',
      'firestore/[DEFAULT]/tripmochi2026/(default)/main'
    ];
    for (const name of staleDbNames) {
      try {
        window.indexedDB.deleteDatabase(name);
      } catch (_) {}
    }
    if (typeof window.indexedDB.databases === 'function') {
      window.indexedDB.databases().then(databases => {
        for (const dbInfo of databases) {
          if (dbInfo.name && dbInfo.name.toLowerCase().includes('firestore')) {
            try {
              window.indexedDB.deleteDatabase(dbInfo.name);
            } catch (_) {}
          }
        }
      }).catch(() => {});
    }
  } catch (_) {}
}

export function getFirestoreLocalCache(): FirestoreLocalCache {
  return memoryLocalCache();
}
