
import { initializeApp } from 'firebase/app';
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  getFirestore
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

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

// Initialize Firestore with robust multi-tab local cache
let db: ReturnType<typeof getFirestore>;
try {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  });
} catch (err) {
  console.warn('Persistent local cache not available, using default Firestore:', err);
  db = getFirestore(app);
}

const storage = getStorage(app);

export { db, storage };

