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
import { PocketItem, Journal, ScheduleItem } from '../types';

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

    // Also copy subcollection scheduleItems if any
    try {
      const scheduleCol = collection(db, 'trips', originalTripId, 'scheduleItems');
      const scheduleSnap = await getDocs(scheduleCol);
      for (const scheduleDoc of scheduleSnap.docs) {
        await setDoc(doc(db, 'trips', newCode, 'scheduleItems', scheduleDoc.id), scheduleDoc.data());
      }
    } catch (subErr) {
      console.warn("Failed to copy subcollection scheduleItems:", subErr);
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

    // 1. Merge pocket items from root doc and subcollection (non-destructive)
    try {
      const pocketMap = new Map<string, PocketItem>();
      if (Array.isArray(data.pocketItems)) {
        for (const p of data.pocketItems) {
          if (p && p.id) pocketMap.set(String(p.id), p);
        }
      }
      const pocketCol = collection(db, 'trips', cleanCode, 'pocketItems');
      const pocketSnap = await getDocs(pocketCol);
      for (const d of pocketSnap.docs) {
        const p = d.data() as PocketItem;
        if (p && p.id) {
          const existing = pocketMap.get(String(p.id));
          pocketMap.set(String(p.id), {
            ...(existing || {}),
            ...p,
            images: Array.isArray(p.images) ? p.images : (Array.isArray(existing?.images) ? existing.images : [])
          });
        }
      }
      const mergedPockets = Array.from(pocketMap.values());
      mergedPockets.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      data.pocketItems = mergedPockets;
    } catch (e) {
      console.warn("Subcollection read fallback (pocket):", e);
    }

    // 2. Merge journals from root doc and subcollection (non-destructive)
    try {
      const journalMap = new Map<string, Journal>();
      if (Array.isArray(data.journals)) {
        for (const j of data.journals) {
          if (j && j.id) journalMap.set(String(j.id), j);
        }
      }
      const journalCol = collection(db, 'trips', cleanCode, 'journals');
      const journalSnap = await getDocs(journalCol);
      for (const d of journalSnap.docs) {
        const j = d.data() as Journal;
        if (j && j.id) {
          const existing = journalMap.get(String(j.id));
          journalMap.set(String(j.id), {
            ...(existing || {}),
            ...j,
            photos: Array.isArray(j.photos) ? j.photos : (Array.isArray(existing?.photos) ? existing.photos : [])
          });
        }
      }
      const mergedJournals = Array.from(journalMap.values());
      mergedJournals.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      data.journals = mergedJournals;
    } catch (e) {
      console.warn("Subcollection read fallback (journal):", e);
    }

    // 3. Merge schedule items from root doc and subcollection (non-destructive)
    try {
      const scheduleMap = new Map<string, ScheduleItem>();
      if (Array.isArray(data.scheduleItems)) {
        for (const s of data.scheduleItems) {
          if (s && s.id) scheduleMap.set(String(s.id), s);
        }
      }
      const scheduleCol = collection(db, 'trips', cleanCode, 'scheduleItems');
      const scheduleSnap = await getDocs(scheduleCol);
      for (const d of scheduleSnap.docs) {
        const s = d.data() as ScheduleItem;
        if (s && s.id) {
          const existing = scheduleMap.get(String(s.id));
          scheduleMap.set(String(s.id), {
            ...(existing || {}),
            ...s,
            images: Array.isArray(s.images) ? s.images : (Array.isArray(existing?.images) ? existing.images : [])
          });
        }
      }
      const mergedSchedule = Array.from(scheduleMap.values());
      mergedSchedule.sort((a, b) => {
        const dateA = a.date || '';
        const dateB = b.date || '';
        if (dateA !== dateB) return dateA.localeCompare(dateB);
        const timeA = a.time || '';
        const timeB = b.time || '';
        if (timeA !== timeB) return timeA.localeCompare(timeB);
        return (a.orderIndex ?? 0) - (b.orderIndex ?? 0);
      });
      data.scheduleItems = mergedSchedule;
    } catch (e) {
      console.warn("Subcollection read fallback (schedule):", e);
    }

    return data;
  } catch (error: any) {
    console.error("Failed to join trip:", error);
    throw error;
  }
};

/**
 * Saves a single pocket item into subcollection
 */
export const savePocketItem = async (tripId: string, item: PocketItem): Promise<void> => {
  try {
    if (!tripId || !item || !item.id) return;
    const itemWithImages = {
      ...item,
      images: Array.isArray(item.images) ? item.images : []
    };
    const cleaned = cleanData(itemWithImages);
    const itemRef = doc(db, 'trips', tripId, 'pocketItems', String(item.id));
    await setDoc(itemRef, cleaned);

    // Also keep root doc pocketItems updated if present
    const tripRef = doc(db, 'trips', tripId);
    const snap = await getDoc(tripRef);
    if (snap.exists()) {
      const data = snap.data();
      if (Array.isArray(data.pocketItems)) {
        const currentItems: PocketItem[] = [...data.pocketItems];
        const existingIdx = currentItems.findIndex(p => String(p.id) === String(item.id));
        if (existingIdx >= 0) {
          currentItems[existingIdx] = cleaned;
          await setDoc(tripRef, { pocketItems: cleanData(currentItems) }, { merge: true });
        }
      }
    }
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

    // Also remove from root doc if present
    const tripRef = doc(db, 'trips', tripId);
    const snap = await getDoc(tripRef);
    if (snap.exists()) {
      const data = snap.data();
      if (Array.isArray(data.pocketItems)) {
        const remaining = data.pocketItems.filter((p: PocketItem) => String(p.id) !== String(itemId));
        await setDoc(tripRef, { pocketItems: cleanData(remaining) }, { merge: true });
      }
    }
  } catch (err) {
    console.error("Failed to delete pocket item:", err);
  }
};

/**
 * Saves a single journal item into subcollection
 */
export const saveJournalItem = async (tripId: string, journal: Journal): Promise<void> => {
  try {
    if (!tripId || !journal || !journal.id) return;
    const itemWithPhotos = {
      ...journal,
      photos: Array.isArray(journal.photos) ? journal.photos : []
    };
    const cleaned = cleanData(itemWithPhotos);
    const itemRef = doc(db, 'trips', tripId, 'journals', String(journal.id));
    await setDoc(itemRef, cleaned);

    // Also keep root doc journals updated if present
    const tripRef = doc(db, 'trips', tripId);
    const snap = await getDoc(tripRef);
    if (snap.exists()) {
      const data = snap.data();
      if (Array.isArray(data.journals)) {
        const currentItems: Journal[] = [...data.journals];
        const existingIdx = currentItems.findIndex(j => String(j.id) === String(journal.id));
        if (existingIdx >= 0) {
          currentItems[existingIdx] = cleaned;
          await setDoc(tripRef, { journals: cleanData(currentItems) }, { merge: true });
        }
      }
    }
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

    // Also remove from root doc if present
    const tripRef = doc(db, 'trips', tripId);
    const snap = await getDoc(tripRef);
    if (snap.exists()) {
      const data = snap.data();
      if (Array.isArray(data.journals)) {
        const remaining = data.journals.filter((j: Journal) => String(j.id) !== String(journalId));
        await setDoc(tripRef, { journals: cleanData(remaining) }, { merge: true });
      }
    }
  } catch (err) {
    console.error("Failed to delete journal item:", err);
  }
};

/**
 * Saves a single schedule item into subcollection and root document
 */
export const saveScheduleItem = async (tripId: string, item: ScheduleItem): Promise<void> => {
  try {
    if (!tripId || !item || !item.id) return;
    const itemWithImages = {
      ...item,
      images: Array.isArray(item.images) ? item.images : []
    };
    const cleaned = cleanData(itemWithImages);
    
    // 1. Save to subcollection (authoritative full replacement)
    const itemRef = doc(db, 'trips', tripId, 'scheduleItems', String(item.id));
    await setDoc(itemRef, cleaned);

    // 2. Also keep root doc scheduleItems updated
    const tripRef = doc(db, 'trips', tripId);
    const snap = await getDoc(tripRef);
    if (snap.exists()) {
      const data = snap.data();
      const currentItems: ScheduleItem[] = Array.isArray(data.scheduleItems) ? [...data.scheduleItems] : [];
      const existingIdx = currentItems.findIndex(i => String(i.id) === String(item.id));
      if (existingIdx >= 0) {
        currentItems[existingIdx] = cleaned;
      } else {
        currentItems.push(cleaned);
      }
      await setDoc(tripRef, { scheduleItems: cleanData(currentItems) }, { merge: true });
    }
  } catch (err) {
    console.error("Failed to save schedule item:", err);
    throw err;
  }
};

/**
 * Deletes a single schedule item from both subcollection and root document
 */
export const deleteScheduleItem = async (tripId: string, itemId: string): Promise<void> => {
  try {
    if (!tripId || !itemId) return;
    
    // 1. Delete from subcollection
    const itemRef = doc(db, 'trips', tripId, 'scheduleItems', String(itemId));
    await deleteDoc(itemRef).catch(() => {});

    // 2. Remove from root document
    const tripRef = doc(db, 'trips', tripId);
    const snap = await getDoc(tripRef);
    if (snap.exists()) {
      const data = snap.data();
      if (Array.isArray(data.scheduleItems)) {
        const remaining = data.scheduleItems.filter((i: ScheduleItem) => String(i.id) !== String(itemId));
        await setDoc(tripRef, { scheduleItems: cleanData(remaining) }, { merge: true });
      }
    }
  } catch (err) {
    console.error("Failed to delete schedule item:", err);
    throw err;
  }
};

/**
 * Subscribes to real-time updates for a specific trip.
 * Safely merges data from the root document and subcollections to ensure NO data loss.
 */
export const subscribeToTrip = (tripId: string, onUpdate: (data: any) => void) => {
  try {
    const tripRef = doc(db, 'trips', tripId);
    const pocketColRef = collection(db, 'trips', tripId, 'pocketItems');
    const journalColRef = collection(db, 'trips', tripId, 'journals');
    const scheduleColRef = collection(db, 'trips', tripId, 'scheduleItems');
    
    let currentTripData: any = null;
    let subcollectionPocketItems: PocketItem[] = [];
    let subcollectionJournals: Journal[] = [];
    let subcollectionScheduleItems: ScheduleItem[] = [];

    const notifyCombined = () => {
      if (!currentTripData) return;

      // 1. Merge Schedule Items from root document and subcollection (lossless)
      const scheduleMap = new Map<string, ScheduleItem>();
      if (Array.isArray(currentTripData.scheduleItems)) {
        for (const s of currentTripData.scheduleItems) {
          if (s && s.id) scheduleMap.set(String(s.id), s);
        }
      }
      for (const s of subcollectionScheduleItems) {
        if (s && s.id) {
          const existing = scheduleMap.get(String(s.id));
          scheduleMap.set(String(s.id), {
            ...(existing || {}),
            ...s,
            images: Array.isArray(s.images) ? s.images : (Array.isArray(existing?.images) ? existing.images : [])
          });
        }
      }
      const combinedSchedule = Array.from(scheduleMap.values());
      combinedSchedule.sort((a, b) => {
        const dateA = a.date || '';
        const dateB = b.date || '';
        if (dateA !== dateB) return dateA.localeCompare(dateB);
        const timeA = a.time || '';
        const timeB = b.time || '';
        if (timeA !== timeB) return timeA.localeCompare(timeB);
        return (a.orderIndex ?? 0) - (b.orderIndex ?? 0);
      });

      // 2. Merge Pocket Items (lossless)
      const pocketMap = new Map<string, PocketItem>();
      if (Array.isArray(currentTripData.pocketItems)) {
        for (const p of currentTripData.pocketItems) {
          if (p && p.id) pocketMap.set(String(p.id), p);
        }
      }
      for (const p of subcollectionPocketItems) {
        if (p && p.id) {
          const existing = pocketMap.get(String(p.id));
          pocketMap.set(String(p.id), {
            ...(existing || {}),
            ...p,
            images: Array.isArray(p.images) ? p.images : (Array.isArray(existing?.images) ? existing.images : [])
          });
        }
      }
      const combinedPocket = Array.from(pocketMap.values());
      combinedPocket.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

      // 3. Merge Journals (lossless)
      const journalMap = new Map<string, Journal>();
      if (Array.isArray(currentTripData.journals)) {
        for (const j of currentTripData.journals) {
          if (j && j.id) journalMap.set(String(j.id), j);
        }
      }
      for (const j of subcollectionJournals) {
        if (j && j.id) {
          const existing = journalMap.get(String(j.id));
          journalMap.set(String(j.id), {
            ...(existing || {}),
            ...j,
            photos: Array.isArray(j.photos) ? j.photos : (Array.isArray(existing?.photos) ? existing.photos : [])
          });
        }
      }
      const combinedJournals = Array.from(journalMap.values());
      combinedJournals.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

      const combined = {
        ...currentTripData,
        scheduleItems: combinedSchedule,
        pocketItems: combinedPocket,
        journals: combinedJournals
      };
      onUpdate(combined);
    };

    // 1. Subscribe to main trip document
    const unsubTrip = onSnapshot(tripRef, (docSnap) => {
      if (docSnap.exists()) {
        currentTripData = docSnap.data();
        notifyCombined();
      }
    }, (error) => {
      console.error("Real-time sync error (trip doc):", error);
    });

    // 2. Subscribe to scheduleItems subcollection
    const unsubSchedule = onSnapshot(scheduleColRef, (colSnap) => {
      subcollectionScheduleItems = colSnap.docs.map(d => d.data() as ScheduleItem);
      notifyCombined();
    }, (error) => {
      console.warn("Real-time sync notice (schedule subcollection):", error);
    });

    // 3. Subscribe to pocketItems subcollection
    const unsubPocket = onSnapshot(pocketColRef, (colSnap) => {
      subcollectionPocketItems = colSnap.docs.map(d => d.data() as PocketItem);
      notifyCombined();
    }, (error) => {
      console.warn("Real-time sync notice (pocket subcollection):", error);
    });

    // 4. Subscribe to journals subcollection
    const unsubJournal = onSnapshot(journalColRef, (colSnap) => {
      subcollectionJournals = colSnap.docs.map(d => d.data() as Journal);
      notifyCombined();
    }, (error) => {
      console.warn("Real-time sync notice (journal subcollection):", error);
    });

    return () => {
      unsubTrip();
      unsubSchedule();
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
    if (collectionName === 'scheduleItems') {
      await saveScheduleItem(tripId, item);
      return;
    }
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
 * Updates a specific field or replaces a full list in the trip document safely.
 */
export const updateTripField = async (tripId: string, field: string, value: any): Promise<void> => {
  try {
    const tripRef = doc(db, 'trips', tripId);
    const cleanedValue = cleanData(value);

    // Save directly to main trip document
    await setDoc(tripRef, {
      [field]: cleanedValue
    }, { merge: true });

    // Asynchronously update subcollections as backup without blocking or deleting
    if (field === 'scheduleItems' && Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        const item = value[i];
        if (item && item.id) {
          const itemRef = doc(db, 'trips', tripId, 'scheduleItems', String(item.id));
          setDoc(itemRef, cleanData({ ...item, orderIndex: i }), { merge: true }).catch(() => {});
        }
      }
    } else if (field === 'pocketItems' && Array.isArray(value)) {
      for (const item of value) {
        if (item && item.id) {
          const itemRef = doc(db, 'trips', tripId, 'pocketItems', String(item.id));
          setDoc(itemRef, cleanData(item), { merge: true }).catch(() => {});
        }
      }
    } else if (field === 'journals' && Array.isArray(value)) {
      for (const item of value) {
        if (item && item.id) {
          const itemRef = doc(db, 'trips', tripId, 'journals', String(item.id));
          setDoc(itemRef, cleanData(item), { merge: true }).catch(() => {});
        }
      }
    }
  } catch (error) {
    console.error(`Failed to update field ${field}:`, error);
    throw new Error("同步資料失敗");
  }
};
