
import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
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
const db = getFirestore(app);
const storage = getStorage(app);

// Enable Offline Persistence for a smoother travel experience
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Persistence failed: Multiple tabs open.');
    } else if (err.code === 'unimplemented') {
      console.warn('Persistence failed: Browser not supported.');
    }
  });
}

export { db, storage };
