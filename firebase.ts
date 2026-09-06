
import { initializeApp } from 'firebase/app';
import { 
  initializeFirestore, 
  memoryLocalCache,
  getFirestore
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Clean up any legacy or corrupt IndexedDB Firestore databases from previous sessions
// that may contain an exhausted backlog of queued offline writes
if (typeof window !== 'undefined' && window.indexedDB) {
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

// Hardcoded Firebase configuration as requested for robust connection
const firebaseConfig = {
  apiKey: "AIzaSyCQj0FvTNuk3mUj0Yc2BduSdnxegwY1xJs",
  authDomain: "tripmochi2026.firebaseapp.com",
  projectId: "tripmochi2026",
  storageBucket: "tripmochi2026.firebasestorage.app",
  messagingSenderId: "234123446942",
  appId: "1:234123446942:web:dbb5513393554a3868498f"
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore with pure in-memory cache to prevent WriteStream queue exhaustion
let db: ReturnType<typeof getFirestore>;
try {
  db = initializeFirestore(app, {
    localCache: memoryLocalCache()
  });
} catch (err) {
  console.warn('Memory local cache init fallback:', err);
  db = getFirestore(app);
}

const storage = getStorage(app);

export { db, storage };


