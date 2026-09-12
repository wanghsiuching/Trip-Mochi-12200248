// Firebase Configuration (kept exactly as in production)
export const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyCQj0FvTNuk3mUj0Yc2BduSdnxegwY1xJs",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "tripmochi2026.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "tripmochi2026",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "tripmochi2026.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "234123446942",
  appId: process.env.FIREBASE_APP_ID || "1:234123446942:web:dbb5513393554a3868498f"
};
