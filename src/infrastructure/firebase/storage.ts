import { getStorage, FirebaseStorage } from 'firebase/storage';
import { app } from './app';

export const storage: FirebaseStorage = getStorage(app);
