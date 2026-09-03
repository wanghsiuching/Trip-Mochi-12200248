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
  arrayRemove,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { PocketItem, Journal, ScheduleItem } from '../types';
import { compressBase64IfNeeded } from '../utils/imageService';

/**
 * Sorts schedule items reliably based on:
 * 1. Root trip document `scheduleOrder` (ordered array of item IDs)
 * 2. Item-level `order` property (numeric position)
 * 3. Fallback to `time` (chronological) and deterministic ID
 */
export const sortScheduleItems = (items: ScheduleItem[], scheduleOrder?: string[]): ScheduleItem[] => {
  if (!Array.isArray(items) || items.length <= 1) return items || [];

  // 1. If explicit scheduleOrder array exists from root doc, strictly adhere to it
  if (Array.isArray(scheduleOrder) && scheduleOrder.length > 0) {
    const orderMap = new Map<string, number>();
    scheduleOrder.forEach((id, idx) => orderMap.set(String(id), idx));

    return [...items].sort((a, b) => {
      const hasA = orderMap.has(String(a.id));
      const hasB = orderMap.has(String(b.id));
      if (hasA && hasB) {
        return orderMap.get(String(a.id))! - orderMap.get(String(b.id))!;
      }
      if (hasA && !hasB) return -1;
      if (!hasA && hasB) return 1;

      const orderA = typeof a.order === 'number' ? a.order : 999999;
      const orderB = typeof b.order === 'number' ? b.order : 999999;
      if (orderA !== orderB) return orderA - orderB;

      const timeComp = (a.time || '').localeCompare(b.time || '');
      if (timeComp !== 0) return timeComp;
      return String(a.id).localeCompare(String(b.id));
    });
  }

  // 2. Check if items have explicit order property
  const hasExplicitOrder = items.some(i => typeof i.order === 'number');
  if (hasExplicitOrder) {
    return [...items].sort((a, b) => {
      const orderA = typeof a.order === 'number' ? a.order : 999999;
      const orderB = typeof b.order === 'number' ? b.order : 999999;
      if (orderA !== orderB) return orderA - orderB;

      const timeComp = (a.time || '').localeCompare(b.time || '');
      if (timeComp !== 0) return timeComp;
      return String(a.id).localeCompare(String(b.id));
    });
  }

  // 3. Fallback for legacy trips without explicit ordering: chronological by time
  return [...items].sort((a, b) => {
    const timeComp = (a.time || '').localeCompare(b.time || '');
    if (timeComp !== 0) return timeComp;
    return String(a.id).localeCompare(String(b.id));
  });
};

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
      scheduleItems: [],
      pocketItems: [],
      journals: [],
    };

    const newTripRef = doc(db, 'trips', newCode);
    await setDoc(newTripRef, newData);

    // Also copy subcollection scheduleItems if any
    try {
      const scheduleCol = collection(db, 'trips', originalTripId, 'scheduleItems');
      const scheduleSnap = await getDocs(scheduleCol);
      for (const itemDoc of scheduleSnap.docs) {
        await setDoc(doc(db, 'trips', newCode, 'scheduleItems', itemDoc.id), itemDoc.data());
      }
    } catch (subErr) {
      console.warn("Failed to copy subcollection scheduleItems:", subErr);
    }

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

    // Fetch schedule items from subcollection and merge
    const scheduleMap = new Map<string, ScheduleItem>();
    if (Array.isArray(data.scheduleItems)) {
      for (const item of data.scheduleItems) {
        if (item && item.id) scheduleMap.set(String(item.id), item);
      }
    }
    try {
      const scheduleCol = collection(db, 'trips', cleanCode, 'scheduleItems');
      const scheduleSnap = await getDocs(scheduleCol);
      for (const d of scheduleSnap.docs) {
        const item = d.data() as ScheduleItem;
        if (item && item.id) scheduleMap.set(String(item.id), item);
      }
    } catch (e) {
      console.warn("Subcollection read fallback (schedule):", e);
    }
    const rawSchedule = Array.from(scheduleMap.values());
    data.scheduleItems = sortScheduleItems(rawSchedule, data.scheduleOrder);

    // Fetch pocket items from subcollection and merge
    const pocketMap = new Map<string, PocketItem>();
    if (Array.isArray(data.pocketItems)) {
      for (const item of data.pocketItems) {
        if (item && item.id) pocketMap.set(String(item.id), item);
      }
    }
    try {
      const pocketCol = collection(db, 'trips', cleanCode, 'pocketItems');
      const pocketSnap = await getDocs(pocketCol);
      for (const d of pocketSnap.docs) {
        const item = d.data() as PocketItem;
        if (item && item.id) pocketMap.set(String(item.id), item);
      }
    } catch (e) {
      console.warn("Subcollection read fallback (pocket):", e);
    }
    data.pocketItems = Array.from(pocketMap.values());

    // Fetch journals from subcollection and merge
    const journalMap = new Map<string, Journal>();
    if (Array.isArray(data.journals)) {
      for (const item of data.journals) {
        if (item && item.id) journalMap.set(String(item.id), item);
      }
    }
    try {
      const journalCol = collection(db, 'trips', cleanCode, 'journals');
      const journalSnap = await getDocs(journalCol);
      for (const d of journalSnap.docs) {
        const item = d.data() as Journal;
        if (item && item.id) journalMap.set(String(item.id), item);
      }
    } catch (e) {
      console.warn("Subcollection read fallback (journal):", e);
    }
    data.journals = Array.from(journalMap.values());

    return data;
  } catch (error: any) {
    console.error("Failed to join trip:", error);
    throw error;
  }
};

/**
 * Saves a single schedule item into subcollection (prevents 1MB root doc limit)
 */
export const saveScheduleItem = async (tripId: string, item: ScheduleItem): Promise<void> => {
  try {
    if (!tripId || !item || !item.id) return;
    
    // Proactive safety: Re-compress any oversized Base64 images (>58KB) before saving
    if (Array.isArray(item.images) && item.images.length > 0) {
      const sanitizedImages: string[] = [];
      for (const img of item.images) {
        if (typeof img === 'string' && img.startsWith('data:image/') && img.length > 58000) {
          const compressed = await compressBase64IfNeeded(img, 750, 52000);
          sanitizedImages.push(compressed);
        } else {
          sanitizedImages.push(img);
        }
      }
      item = { ...item, images: sanitizedImages };
    }

    const cleaned = cleanData(item);
    const itemRef = doc(db, 'trips', tripId, 'scheduleItems', String(item.id));
    
    try {
      await setDoc(itemRef, cleaned);
    } catch (setErr: any) {
      // Automatic recovery if Firestore throws maximum document size exceeded error
      if (setErr?.message?.includes('size') || setErr?.message?.includes('1,048,576') || setErr?.code === 'resource-exhausted') {
        console.warn("Firestore size exceeded, applying emergency image compression...", setErr);
        if (Array.isArray(cleaned.images)) {
          cleaned.images = await Promise.all(
            cleaned.images.map((img: string) => compressBase64IfNeeded(img, 600, 42000))
          );
          await setDoc(itemRef, cleaned);
        } else {
          throw setErr;
        }
      } else {
        throw setErr;
      }
    }

    // Clean up stale copy in root doc so it doesn't overwrite with outdated photos, and ensure scheduleOrder includes item.id
    try {
      const tripRef = doc(db, 'trips', tripId);
      const snap = await getDoc(tripRef);
      if (snap.exists()) {
        const rootData = snap.data();
        const updates: any = {
          scheduleOrder: arrayUnion(String(item.id))
        };
        if (Array.isArray(rootData.scheduleItems) && rootData.scheduleItems.some((i: any) => String(i.id) === String(item.id))) {
          updates.scheduleItems = rootData.scheduleItems.filter((i: any) => String(i.id) !== String(item.id));
        }
        await setDoc(tripRef, updates, { merge: true });
      }
    } catch (cleanErr) {
      console.warn("Non-fatal root doc schedule item cleanup:", cleanErr);
    }
  } catch (err) {
    console.error("Failed to save schedule item to subcollection:", err);
    throw err;
  }
};

/**
 * Deletes a single schedule item from subcollection
 */
export const deleteScheduleItem = async (tripId: string, itemId: string): Promise<void> => {
  try {
    if (!tripId || !itemId) return;
    const itemRef = doc(db, 'trips', tripId, 'scheduleItems', String(itemId));
    await deleteDoc(itemRef);

    // Also remove from root doc if present, and update scheduleOrder
    try {
      const tripRef = doc(db, 'trips', tripId);
      const snap = await getDoc(tripRef);
      if (snap.exists()) {
        const rootData = snap.data();
        const updates: any = {
          scheduleOrder: arrayRemove(String(itemId))
        };
        if (Array.isArray(rootData.scheduleItems) && rootData.scheduleItems.some((i: any) => String(i.id) === String(itemId))) {
          updates.scheduleItems = rootData.scheduleItems.filter((i: any) => String(i.id) !== String(itemId));
        }
        await setDoc(tripRef, updates, { merge: true });
      }
    } catch (cleanErr) {
      console.warn("Non-fatal root doc schedule item delete cleanup:", cleanErr);
    }
  } catch (err) {
    console.error("Failed to delete schedule item from subcollection:", err);
    throw err;
  }
};

/**
 * Saves a single pocket item into subcollection (prevents 1MB root doc limit)
 */
export const savePocketItem = async (tripId: string, item: PocketItem): Promise<void> => {
  try {
    if (!tripId || !item || !item.id) return;

    if (item.image && typeof item.image === 'string' && item.image.startsWith('data:image/') && item.image.length > 58000) {
      item = { ...item, image: await compressBase64IfNeeded(item.image, 750, 52000) };
    }

    const cleaned = cleanData(item);
    const itemRef = doc(db, 'trips', tripId, 'pocketItems', String(item.id));
    await setDoc(itemRef, cleaned);

    // Clean up stale copy in root doc
    try {
      const tripRef = doc(db, 'trips', tripId);
      const snap = await getDoc(tripRef);
      if (snap.exists()) {
        const rootData = snap.data();
        if (Array.isArray(rootData.pocketItems) && rootData.pocketItems.some((i: any) => String(i.id) === String(item.id))) {
          await setDoc(tripRef, {
            pocketItems: rootData.pocketItems.filter((i: any) => String(i.id) !== String(item.id))
          }, { merge: true });
        }
      }
    } catch (cleanErr) {
      console.warn("Non-fatal root doc pocket item cleanup:", cleanErr);
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
    try {
      const tripRef = doc(db, 'trips', tripId);
      const snap = await getDoc(tripRef);
      if (snap.exists()) {
        const rootData = snap.data();
        if (Array.isArray(rootData.pocketItems) && rootData.pocketItems.some((i: any) => String(i.id) === String(itemId))) {
          await setDoc(tripRef, {
            pocketItems: rootData.pocketItems.filter((i: any) => String(i.id) !== String(itemId))
          }, { merge: true });
        }
      }
    } catch (cleanErr) {
      console.warn("Non-fatal root doc pocket item delete cleanup:", cleanErr);
    }
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

    if (Array.isArray(journal.images) && journal.images.length > 0) {
      const sanitizedImages: string[] = [];
      for (const img of journal.images) {
        if (typeof img === 'string' && img.startsWith('data:image/') && img.length > 58000) {
          sanitizedImages.push(await compressBase64IfNeeded(img, 750, 52000));
        } else {
          sanitizedImages.push(img);
        }
      }
      journal = { ...journal, images: sanitizedImages };
    }

    const cleaned = cleanData(journal);
    const itemRef = doc(db, 'trips', tripId, 'journals', String(journal.id));
    await setDoc(itemRef, cleaned);

    // Clean up stale copy in root doc
    try {
      const tripRef = doc(db, 'trips', tripId);
      const snap = await getDoc(tripRef);
      if (snap.exists()) {
        const rootData = snap.data();
        if (Array.isArray(rootData.journals) && rootData.journals.some((i: any) => String(i.id) === String(journal.id))) {
          await setDoc(tripRef, {
            journals: rootData.journals.filter((i: any) => String(i.id) !== String(journal.id))
          }, { merge: true });
        }
      }
    } catch (cleanErr) {
      console.warn("Non-fatal root doc journal item cleanup:", cleanErr);
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
    try {
      const tripRef = doc(db, 'trips', tripId);
      const snap = await getDoc(tripRef);
      if (snap.exists()) {
        const rootData = snap.data();
        if (Array.isArray(rootData.journals) && rootData.journals.some((i: any) => String(i.id) === String(journalId))) {
          await setDoc(tripRef, {
            journals: rootData.journals.filter((i: any) => String(i.id) !== String(journalId))
          }, { merge: true });
        }
      }
    } catch (cleanErr) {
      console.warn("Non-fatal root doc journal item delete cleanup:", cleanErr);
    }
  } catch (err) {
    console.error("Failed to delete journal item from subcollection:", err);
    throw err;
  }
};

/**
 * Subscribes to real-time updates for a specific trip.
 * Automatically synchronizes subcollections `scheduleItems`, `pocketItems`, and `journals` to avoid 1MB document limit.
 */
export const subscribeToTrip = (tripId: string, onUpdate: (data: any) => void) => {
  try {
    const tripRef = doc(db, 'trips', tripId);
    const scheduleColRef = collection(db, 'trips', tripId, 'scheduleItems');
    const pocketColRef = collection(db, 'trips', tripId, 'pocketItems');
    const journalColRef = collection(db, 'trips', tripId, 'journals');
    
    let currentTripData: any = null;
    let subcollectionScheduleItems: ScheduleItem[] = [];
    let subcollectionPocketItems: PocketItem[] = [];
    let subcollectionJournals: Journal[] = [];

    const notifyCombined = () => {
      if (!currentTripData) return;

      // 1. Merge schedule items: Subcollection takes precedence over legacy root array
      const scheduleMap = new Map<string, ScheduleItem>();
      if (Array.isArray(currentTripData.scheduleItems)) {
        for (const item of currentTripData.scheduleItems) {
          if (item && item.id) {
            scheduleMap.set(String(item.id), item);
          }
        }
      }
      for (const item of subcollectionScheduleItems) {
        if (item && item.id) {
          scheduleMap.set(String(item.id), item);
        }
      }
      const rawSchedule = Array.from(scheduleMap.values());
      const finalSchedule = sortScheduleItems(rawSchedule, currentTripData.scheduleOrder);

      // 2. Merge pocket items: Subcollection takes precedence
      const pocketMap = new Map<string, PocketItem>();
      if (Array.isArray(currentTripData.pocketItems)) {
        for (const item of currentTripData.pocketItems) {
          if (item && item.id) {
            pocketMap.set(String(item.id), item);
          }
        }
      }
      for (const item of subcollectionPocketItems) {
        if (item && item.id) {
          pocketMap.set(String(item.id), item);
        }
      }
      const finalPocket = Array.from(pocketMap.values());
      finalPocket.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

      // 3. Merge journals: Subcollection takes precedence
      const journalMap = new Map<string, Journal>();
      if (Array.isArray(currentTripData.journals)) {
        for (const item of currentTripData.journals) {
          if (item && item.id) {
            journalMap.set(String(item.id), item);
          }
        }
      }
      for (const item of subcollectionJournals) {
        if (item && item.id) {
          journalMap.set(String(item.id), item);
        }
      }
      const finalJournals = Array.from(journalMap.values());
      finalJournals.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

      const combined = {
        ...currentTripData,
        scheduleItems: finalSchedule,
        pocketItems: finalPocket,
        journals: finalJournals
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
      console.error("Real-time sync error (schedule subcollection):", error);
    });

    // 3. Subscribe to pocketItems subcollection
    const unsubPocket = onSnapshot(pocketColRef, (colSnap) => {
      subcollectionPocketItems = colSnap.docs.map(d => d.data() as PocketItem);
      notifyCombined();
    }, (error) => {
      console.error("Real-time sync error (pocket subcollection):", error);
    });

    // 4. Subscribe to journals subcollection
    const unsubJournal = onSnapshot(journalColRef, (colSnap) => {
      subcollectionJournals = colSnap.docs.map(d => d.data() as Journal);
      notifyCombined();
    }, (error) => {
      console.error("Real-time sync error (journal subcollection):", error);
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
 * Adds an item to a specific collection or array field in the trip document atomically.
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
 * Updates a specific field or replaces a full list in the trip document with ultra-fast writeBatch.
 */
export const updateTripField = async (tripId: string, field: string, value: any): Promise<void> => {
  try {
    if (!tripId) return;

    // If updating scheduleItems, store them in the subcollection using atomic writeBatch
    if (field === 'scheduleItems' && Array.isArray(value)) {
      const scheduleColRef = collection(db, 'trips', tripId, 'scheduleItems');
      const existingSnap = await getDocs(scheduleColRef);
      const newIds = new Set(value.map(s => String(s.id)));

      const batch = writeBatch(db);

      for (const existingDoc of existingSnap.docs) {
        if (!newIds.has(existingDoc.id)) {
          batch.delete(existingDoc.ref);
        }
      }

      for (let idx = 0; idx < value.length; idx++) {
        const item = value[idx];
        if (item && item.id) {
          const itemRef = doc(db, 'trips', tripId, 'scheduleItems', String(item.id));
          const itemWithOrder = {
            ...item,
            order: item.order !== undefined ? item.order : idx
          };
          batch.set(itemRef, cleanData(itemWithOrder));
        }
      }

      await batch.commit();

      const tripRef = doc(db, 'trips', tripId);
      const orderIds = value.map(i => String(i.id));
      await setDoc(tripRef, { 
        scheduleItems: [],
        scheduleOrder: orderIds 
      }, { merge: true });
      return;
    }

    // If updating pocketItems, store them in the subcollection using atomic writeBatch
    if (field === 'pocketItems' && Array.isArray(value)) {
      const pocketColRef = collection(db, 'trips', tripId, 'pocketItems');
      const existingSnap = await getDocs(pocketColRef);
      const newIds = new Set(value.map(p => String(p.id)));

      const batch = writeBatch(db);

      for (const existingDoc of existingSnap.docs) {
        if (!newIds.has(existingDoc.id)) {
          batch.delete(existingDoc.ref);
        }
      }

      for (const item of value) {
        if (item && item.id) {
          const itemRef = doc(db, 'trips', tripId, 'pocketItems', String(item.id));
          batch.set(itemRef, cleanData(item));
        }
      }

      await batch.commit();

      const tripRef = doc(db, 'trips', tripId);
      await setDoc(tripRef, { pocketItems: [] }, { merge: true });
      return;
    }

    // If updating journals, store them in the subcollection using atomic writeBatch
    if (field === 'journals' && Array.isArray(value)) {
      const journalColRef = collection(db, 'trips', tripId, 'journals');
      const existingSnap = await getDocs(journalColRef);
      const newIds = new Set(value.map(j => String(j.id)));

      const batch = writeBatch(db);

      for (const existingDoc of existingSnap.docs) {
        if (!newIds.has(existingDoc.id)) {
          batch.delete(existingDoc.ref);
        }
      }

      for (const item of value) {
        if (item && item.id) {
          const itemRef = doc(db, 'trips', tripId, 'journals', String(item.id));
          batch.set(itemRef, cleanData(item));
        }
      }

      await batch.commit();

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
