
import { db } from '../firebase';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  onSnapshot, 
  arrayUnion, 
  Timestamp 
} from 'firebase/firestore';

/**
 * Utility to recursively remove undefined properties from an object.
 * Firestore does not allow undefined values.
 */
const cleanData = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(cleanData);
  } else if (obj !== null && typeof obj === 'object' && !(obj instanceof Timestamp)) {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([_, v]) => v !== undefined)
        .map(([k, v]) => [k, cleanData(v)])
    );
  }
  return obj;
};

/**
 * Generates a readable 6-digit trip code.
 * Excludes confusing characters like I, 1, O, 0.
 */
export const generateTripCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

/**
 * Creates a new trip document with a unique 6-digit ID.
 * Performs collision check to ensure ID uniqueness.
 */
export const createTrip = async (name: string): Promise<string> => {
  try {
    let code = generateTripCode();
    let collision = true;
    let attempts = 0;

    // Basic collision check
    while (collision && attempts < 5) {
      const docRef = doc(db, 'trips', code);
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        collision = false;
      } else {
        code = generateTripCode();
        attempts++;
      }
    }

    const initialData = {
      id: code,
      name,
      createdAt: Timestamp.now(),
      tripDays: [{ date: new Date().toISOString().split('T')[0], location: '第一天' }],
      scheduleItems: [],
      members: [{ id: '1', name: '我', fruit: '🍎' }],
      flights: [],
      accommodations: [],
      carRentals: [], // Changed from carRental object to carRentals array
      tickets: [],
      expenses: [],
      journals: [],
      planning: { todo: [], packing: [], wish: [], shopping: [] },
      currencies: [
        { code: 'JPY', rate: 0.21 }, 
        { code: 'USD', rate: 32.5 }, 
        { code: 'KRW', rate: 0.024 }
      ]
    };

    const tripRef = doc(db, 'trips', code);
    await setDoc(tripRef, initialData);
    
    return code;
  } catch (error) {
    console.error("Failed to create trip:", error);
    throw new Error("建立行程失敗，請檢查網路連線。");
  }
};

/**
 * Joins an existing trip by its 6-digit code.
 */
export const joinTripByCode = async (code: string): Promise<any> => {
  try {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) throw new Error("請輸入代碼");

    const tripRef = doc(db, 'trips', cleanCode);
    const snap = await getDoc(tripRef);

    if (!snap.exists()) {
      throw new Error("找不到此行程碼，請檢查是否輸入正確。");
    }

    return snap.data();
  } catch (error: any) {
    console.error("Failed to join trip:", error);
    throw error;
  }
};

/**
 * Subscribes to real-time updates for a specific trip.
 */
export const subscribeToTrip = (tripId: string, onUpdate: (data: any) => void) => {
  try {
    const tripRef = doc(db, 'trips', tripId);
    
    const unsubscribe = onSnapshot(tripRef, (docSnap) => {
      if (docSnap.exists()) {
        onUpdate(docSnap.data());
      }
    }, (error) => {
      console.error("Real-time sync error:", error);
    });

    return unsubscribe;
  } catch (error) {
    console.error("Failed to subscribe to trip:", error);
    return () => {};
  }
};

/**
 * Adds an item to a specific array field in the trip document atomically.
 */
export const addTripItem = async (tripId: string, collectionName: string, item: any): Promise<void> => {
  try {
    const tripRef = doc(db, 'trips', tripId);
    // Firestore does not allow 'undefined' values. Clean the item first.
    const cleanedItem = cleanData(item);
    await updateDoc(tripRef, {
      [collectionName]: arrayUnion(cleanedItem)
    });
  } catch (error) {
    console.error(`Failed to add item to ${collectionName}:`, error);
    throw new Error("更新資料失敗");
  }
};

/**
 * Updates a specific field or replaces a full list in the trip document.
 */
export const updateTripField = async (tripId: string, field: string, value: any): Promise<void> => {
  try {
    const tripRef = doc(db, 'trips', tripId);
    // Firestore does not allow 'undefined' values. Clean the value first.
    const cleanedValue = cleanData(value);
    await updateDoc(tripRef, {
      [field]: cleanedValue
    });
  } catch (error) {
    console.error(`Failed to update field ${field}:`, error);
    throw new Error("同步資料失敗");
  }
};
