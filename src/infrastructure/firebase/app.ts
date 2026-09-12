import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { firebaseConfig } from './config';

export function getOrInitializeFirebaseApp(): FirebaseApp {
  const apps = getApps();
  if (apps.length > 0) {
    return getApp();
  }
  return initializeApp(firebaseConfig);
}

export const app: FirebaseApp = getOrInitializeFirebaseApp();
