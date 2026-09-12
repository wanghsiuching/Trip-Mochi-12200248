import { initializeFirestore, getFirestore, Firestore } from 'firebase/firestore';
import { app } from './app';
import { cleanupLegacyIndexedDB, getFirestoreLocalCache } from './cacheStrategy';

// Run cleanup of legacy or corrupt IndexedDB databases on client
cleanupLegacyIndexedDB();

let dbInstance: Firestore;

try {
  dbInstance = initializeFirestore(app, {
    localCache: getFirestoreLocalCache(),
  });
} catch (err) {
  console.warn('Firestore initialization fallback:', err);
  dbInstance = getFirestore(app);
}

export const db: Firestore = dbInstance;
