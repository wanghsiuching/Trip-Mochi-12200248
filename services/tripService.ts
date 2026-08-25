import { db } from '../firebase';
import { 
  doc, 
  setDoc, 
  getDoc, 
  deleteDoc,
  collection,
  getDocs,
  onSnapshot, 
  arrayUnion, 
  Timestamp 
} from 'firebase/firestore';
import { PocketItem, Journal } from '../types';

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
      carRentals: [],
      tickets: [],
      expenses: [],
      journals: [],
      planning: { todo: [], packing: [], wish: [], shopping: [] },
      currencies: [
        { code: 'JPY', rate: 0.21 }, 
        { code: 'USD', rate: 32.5 }, 
        { code: 'KRW', rate: 0.024 }
      ],
      pocketItems: []
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
 * Duplicates an existing trip with a new code.
 */
export const duplicateTrip = async (originalTripId: string): Promise<string> => {
  try {
    const originalRef = doc(db, 'trips', originalTripId);
    const snap = await getDoc(originalRef);

    if (!snap.exists()) {
      throw new Error("找不到原始行程資料");
    }

    const data = snap.data();
    let newCode = generateTripCode();
    let collision = true;
    let attempts = 0;

    while (collision && attempts < 5) {
      const docRef = doc(db, 'trips', newCode);
      const s = await getDoc(docRef);
      if (!s.exists()) {
        collision = false;
      } else {
        newCode = generateTripCode();
        attempts++;
      }
    }

    const newData = {
      ...data,
      id: newCode,
      name: `${data.name} (副本)`,
      createdAt: Timestamp.now(),
    };

    const newTripRef = doc(db, 'trips', newCode);
    await setDoc(newTripRef, newData);

    // Also copy subcollection pocketItems if any
    try {
      const pocketCol = collection(db, 'trips', originalTripId, 'pocketItems');
      const pocketSnap = await getDocs(pocketCol);
      for (const pocketDoc of pocketSnap.docs) {
        await setDoc(doc(db, 'trips', newCode, 'pocketItems', pocketDoc.id), pocketDoc.data());
      }
    } catch (subErr) {
      console.warn("Failed to copy subcollection pocketItems:", subErr);
    }

    // Also copy subcollection journals if any
    try {
      const journalCol = collection(db, 'trips', originalTripId, 'journals');
      const journalSnap = await getDocs(journalCol);
      for (const journalDoc of journalSnap.docs) {
        await setDoc(doc(db, 'trips', newCode, 'journals', journalDoc.id), journalDoc.data());
      }
    } catch (subErr) {
      console.warn("Failed to copy subcollection journals:", subErr);
    }
    
    return newCode;
  } catch (error) {
    console.error("Duplicate trip failed", error);
    throw new Error("建立副本失敗");
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

    const data = snap.data();
    // Fetch pocket items from subcollection
    try {
      const pocketCol = collection(db, 'trips', cleanCode, 'pocketItems');
      const pocketSnap = await getDocs(pocketCol);
      if (!pocketSnap.empty) {
        data.pocketItems = pocketSnap.docs.map(d => d.data() as PocketItem);
      }
    } catch (e) {
      console.warn("Subcollection read fallback (pocket):", e);
    }

    // Fetch journals from subcollection
    try {
      const journalCol = collection(db, 'trips', cleanCode, 'journals');
      const journalSnap = await getDocs(journalCol);
      if (!journalSnap.empty) {
        data.journals = journalSnap.docs.map(d => d.data() as Journal);
      }
    } catch (e) {
      console.warn("Subcollection read fallback (journal):", e);
    }

    return data;
  } catch (error: any) {
    console.error("Failed to join trip:", error);
    throw error;
  }
};

/**
 * Saves a single pocket item into subcollection (prevents 1MB root doc limit)
 */
export const savePocketItem = async (tripId: string, item: PocketItem): Promise<void> => {
  try {
    if (!tripId || !item || !item.id) return;
    const cleaned = cleanData(item);
    const itemRef = doc(db, 'trips', tripId, 'pocketItems', String(item.id));
    await setDoc(itemRef, cleaned, { merge: true });
  } catch (err) {
    console.error("Failed to save pocket item to subcollection:", err);
    throw err;
  }
};

/**
 * Deletes a single pocket item from subcollection
 */
export const deletePocketItem = async (tripId: string, itemId: string): Promise<void> => {
  try {
    if (!tripId || !itemId) return;
    const itemRef = doc(db, 'trips', tripId, 'pocketItems', String(itemId));
    await deleteDoc(itemRef);
  } catch (err) {
    console.error("Failed to delete pocket item from subcollection:", err);
    throw err;
  }
};

/**
 * Saves a single journal item into subcollection (prevents 1MB root doc limit for photos)
 */
export const saveJournalItem = async (tripId: string, journal: Journal): Promise<void> => {
  try {
    if (!tripId || !journal || !journal.id) return;
    const cleaned = cleanData(journal);
    const itemRef = doc(db, 'trips', tripId, 'journals', String(journal.id));
    await setDoc(itemRef, cleaned, { merge: true });
  } catch (err) {
    console.error("Failed to save journal item to subcollection:", err);
    throw err;
  }
};

/**
 * Deletes a single journal item from subcollection
 */
export const deleteJournalItem = async (tripId: string, journalId: number | string): Promise<void> => {
  try {
    if (!tripId || !journalId) return;
    const itemRef = doc(db, 'trips', tripId, 'journals', String(journalId));
    await deleteDoc(itemRef);
  } catch (err) {
    console.error("Failed to delete journal item from subcollection:", err);
    throw err;
  }
};

/**
 * Subscribes to real-time updates for a specific trip.
 * Automatically synchronizes subcollections `pocketItems` and `journals` to avoid 1MB document limit.
 */
export const subscribeToTrip = (tripId: string, onUpdate: (data: any) => void) => {
  try {
    const tripRef = doc(db, 'trips', tripId);
    const pocketColRef = collection(db, 'trips', tripId, 'pocketItems');
    const journalColRef = collection(db, 'trips', tripId, 'journals');
    
    let currentTripData: any = null;
    let subcollectionPocketItems: PocketItem[] = [];
    let subcollectionJournals: Journal[] = [];

    const notifyCombined = () => {
      if (!currentTripData) return;
      const combined = {
        ...currentTripData,
        pocketItems: subcollectionPocketItems.length > 0 
          ? subcollectionPocketItems 
          : (currentTripData.pocketItems || []),
        journals: subcollectionJournals.length > 0
          ? subcollectionJournals
          : (currentTripData.journals || [])
      };
      onUpdate(combined);
    };

    // 1. Subscribe to main trip document
    const unsubTrip = onSnapshot(tripRef, async (docSnap) => {
      if (docSnap.exists()) {
        const rawData = docSnap.data();
        currentTripData = rawData;

        // Auto-Migration & Document Slimming for pocketItems:
        if (Array.isArray(rawData.pocketItems) && rawData.pocketItems.length > 0) {
          try {
            for (const item of rawData.pocketItems) {
              if (item && item.id) {
                await setDoc(doc(db, 'trips', tripId, 'pocketItems', String(item.id)), cleanData(item), { merge: true });
              }
            }
            await setDoc(tripRef, { pocketItems: [] }, { merge: true });
            currentTripData.pocketItems = [];
          } catch (migrateErr) {
            console.warn("Migration/slimming of pocketItems:", migrateErr);
          }
        }

        // Auto-Migration & Document Slimming for journals:
        if (Array.isArray(rawData.journals) && rawData.journals.length > 0) {
          try {
            for (const j of rawData.journals) {
              if (j && j.id) {
                await setDoc(doc(db, 'trips', tripId, 'journals', String(j.id)), cleanData(j), { merge: true });
              }
            }
            await setDoc(tripRef, { journals: [] }, { merge: true });
            currentTripData.journals = [];
          } catch (migrateErr) {
            console.warn("Migration/slimming of journals:", migrateErr);
          }
        }

        notifyCombined();
      }
    }, (error) => {
      console.error("Real-time sync error (trip doc):", error);
    });

    // 2. Subscribe to pocketItems subcollection
    const unsubPocket = onSnapshot(pocketColRef, (colSnap) => {
      subcollectionPocketItems = colSnap.docs.map(d => d.data() as PocketItem);
      subcollectionPocketItems.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      notifyCombined();
    }, (error) => {
      console.error("Real-time sync error (pocket subcollection):", error);
    });

    // 3. Subscribe to journals subcollection
    const unsubJournal = onSnapshot(journalColRef, (colSnap) => {
      subcollectionJournals = colSnap.docs.map(d => d.data() as Journal);
      subcollectionJournals.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      notifyCombined();
    }, (error) => {
      console.error("Real-time sync error (journal subcollection):", error);
    });

    return () => {
      unsubTrip();
      unsubPocket();
      unsubJournal();
    };
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
    if (collectionName === 'pocketItems') {
      await savePocketItem(tripId, item);
      return;
    }
    if (collectionName === 'journals') {
      await saveJournalItem(tripId, item);
      return;
    }

    const tripRef = doc(db, 'trips', tripId);
    const cleanedItem = cleanData(item);
    await setDoc(tripRef, {
      [collectionName]: arrayUnion(cleanedItem)
    }, { merge: true });
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
    // If updating pocketItems, store them in the subcollection to prevent 1MB document explosion
    if (field === 'pocketItems' && Array.isArray(value)) {
      const pocketColRef = collection(db, 'trips', tripId, 'pocketItems');
      const existingSnap = await getDocs(pocketColRef);
      const newIds = new Set(value.map(p => String(p.id)));

      for (const existingDoc of existingSnap.docs) {
        if (!newIds.has(existingDoc.id)) {
          await deleteDoc(existingDoc.ref);
        }
      }

      for (const item of value) {
        if (item && item.id) {
          const itemRef = doc(db, 'trips', tripId, 'pocketItems', String(item.id));
          await setDoc(itemRef, cleanData(item), { merge: true });
        }
      }

      const tripRef = doc(db, 'trips', tripId);
      await setDoc(tripRef, { pocketItems: [] }, { merge: true });
      return;
    }

    // If updating journals, store them in the subcollection to prevent 1MB document explosion
    if (field === 'journals' && Array.isArray(value)) {
      const journalColRef = collection(db, 'trips', tripId, 'journals');
      const existingSnap = await getDocs(journalColRef);
      const newIds = new Set(value.map(j => String(j.id)));

      for (const existingDoc of existingSnap.docs) {
        if (!newIds.has(existingDoc.id)) {
          await deleteDoc(existingDoc.ref);
        }
      }

      for (const item of value) {
        if (item && item.id) {
          const itemRef = doc(db, 'trips', tripId, 'journals', String(item.id));
          await setDoc(itemRef, cleanData(item), { merge: true });
        }
      }

      const tripRef = doc(db, 'trips', tripId);
      await setDoc(tripRef, { journals: [] }, { merge: true });
      return;
    }

    const tripRef = doc(db, 'trips', tripId);
    const cleanedValue = cleanData(value);
    await setDoc(tripRef, {
      [field]: cleanedValue
    }, { merge: true });
  } catch (error) {
    console.error(`Failed to update field ${field}:`, error);
    throw new Error("同步資料失敗");
  }
};
