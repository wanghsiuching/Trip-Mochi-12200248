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
        if (p && p.id) pocketMap.set(String(p.id), { ...(pocketMap.get(String(p.id)) || {}), ...p });
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
        if (j && j.id) journalMap.set(String(j.id), { ...(journalMap.get(String(j.id)) || {}), ...j });
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
        if (s && s.id) scheduleMap.set(String(s.id), { ...(scheduleMap.get(String(s.id)) || {}), ...s });
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
 * Saves a single pocket item into subcollection and root document
 */
export const savePocketItem = async (tripId: string, item: PocketItem): Promise<void> => {
  try {
    if (!tripId || !item || !item.id) return;
    const cleaned = cleanData(item);
    
    // 1. Save to subcollection
    const itemRef = doc(db, 'trips', tripId, 'pocketItems', String(item.id));
    await setDoc(itemRef, cleaned, { merge: true });

    // 2. Keep root doc updated
    const tripRef = doc(db, 'trips', tripId);
    const snap = await getDoc(tripRef);
    if (snap.exists()) {
      const data = snap.data();
      const currentItems: PocketItem[] = Array.isArray(data.pocketItems) ? [...data.pocketItems] : [];
      const existingIdx = currentItems.findIndex(p => String(p.id) === String(item.id));
      if (existingIdx >= 0) {
        currentItems[existingIdx] = cleaned;
      } else {
        currentItems.push(cleaned);
      }
      await setDoc(tripRef, { pocketItems: cleanData(currentItems) }, { merge: true });
    }
  } catch (err) {
    console.error("Failed to save pocket item:", err);
    throw err;
  }
};

/**
 * Deletes a single pocket item from subcollection and root document
 */
export const deletePocketItem = async (tripId: string, itemId: string): Promise<void> => {
  try {
    if (!tripId || !itemId) return;
    const itemRef = doc(db, 'trips', tripId, 'pocketItems', String(itemId));
    await deleteDoc(itemRef).catch(() => {});

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
 * Saves a single journal item into subcollection and root document
 */
export const saveJournalItem = async (tripId: string, journal: Journal): Promise<void> => {
  try {
    if (!tripId || !journal || !journal.id) return;
    const cleaned = cleanData(journal);
    
    // 1. Save to subcollection
    const itemRef = doc(db, 'trips', tripId, 'journals', String(journal.id));
    await setDoc(itemRef, cleaned, { merge: true });

    // 2. Keep root doc updated
    const tripRef = doc(db, 'trips', tripId);
    const snap = await getDoc(tripRef);
    if (snap.exists()) {
      const data = snap.data();
      const currentJournals: Journal[] = Array.isArray(data.journals) ? [...data.journals] : [];
      const existingIdx = currentJournals.findIndex(j => String(j.id) === String(journal.id));
      if (existingIdx >= 0) {
        currentJournals[existingIdx] = cleaned;
      } else {
        currentJournals.push(cleaned);
      }
      await setDoc(tripRef, { journals: cleanData(currentJournals) }, { merge: true });
    }
  } catch (err) {
    console.error("Failed to save journal item:", err);
    throw err;
  }
};

/**
 * Deletes a single journal item from subcollection and root document
 */
export const deleteJournalItem = async (tripId: string, journalId: number | string): Promise<void> => {
  try {
    if (!tripId || !journalId) return;
    const itemRef = doc(db, 'trips', tripId, 'journals', String(journalId));
    await deleteDoc(itemRef).catch(() => {});

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
    const cleaned = cleanData(item);
    
    // 1. Save to subcollection
    const itemRef = doc(db, 'trips', tripId, 'scheduleItems', String(item.id));
    await setDoc(itemRef, cleaned, { merge: true });

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
 * Uses the main trip document as the single authoritative source of truth.
 */
export const subscribeToTrip = (tripId: string, onUpdate: (data: any) => void) => {
  try {
    const tripRef = doc(db, 'trips', tripId);
    let isInitialLoad = true;

    const unsubTrip = onSnapshot(tripRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();

        // On first load, check if any subcollection items need to be merged into root doc (lossless recovery)
        if (isInitialLoad) {
          isInitialLoad = false;
          let needsUpdate = false;
          const patch: Record<string, any> = {};

          try {
            const scheduleMap = new Map<string, ScheduleItem>();
            if (Array.isArray(data.scheduleItems)) {
              for (const s of data.scheduleItems) {
                if (s && s.id) scheduleMap.set(String(s.id), s);
              }
            }
            const snap = await getDocs(collection(db, 'trips', tripId, 'scheduleItems'));
            for (const d of snap.docs) {
              const s = d.data() as ScheduleItem;
              if (s && s.id && !scheduleMap.has(String(s.id))) {
                scheduleMap.set(String(s.id), s);
                needsUpdate = true;
              }
            }
            if (needsUpdate) {
              const merged = Array.from(scheduleMap.values());
              merged.sort((a, b) => {
                const dateA = a.date || '';
                const dateB = b.date || '';
                if (dateA !== dateB) return dateA.localeCompare(dateB);
                const timeA = a.time || '';
                const timeB = b.time || '';
                if (timeA !== timeB) return timeA.localeCompare(timeB);
                return (a.orderIndex ?? 0) - (b.orderIndex ?? 0);
              });
              data.scheduleItems = merged;
              patch.scheduleItems = cleanData(merged);
            }
          } catch (e) {
            console.warn("Legacy recovery failed (schedule):", e);
          }

          try {
            const pocketMap = new Map<string, PocketItem>();
            if (Array.isArray(data.pocketItems)) {
              for (const p of data.pocketItems) {
                if (p && p.id) pocketMap.set(String(p.id), p);
              }
            }
            const snap = await getDocs(collection(db, 'trips', tripId, 'pocketItems'));
            let pocketAdded = false;
            for (const d of snap.docs) {
              const p = d.data() as PocketItem;
              if (p && p.id && !pocketMap.has(String(p.id))) {
                pocketMap.set(String(p.id), p);
                pocketAdded = true;
              }
            }
            if (pocketAdded) {
              const merged = Array.from(pocketMap.values());
              merged.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
              data.pocketItems = merged;
              patch.pocketItems = cleanData(merged);
              needsUpdate = true;
            }
          } catch (e) {
            console.warn("Legacy recovery failed (pocket):", e);
          }

          try {
            const journalMap = new Map<string, Journal>();
            if (Array.isArray(data.journals)) {
              for (const j of data.journals) {
                if (j && j.id) journalMap.set(String(j.id), j);
              }
            }
            const snap = await getDocs(collection(db, 'trips', tripId, 'journals'));
            let journalAdded = false;
            for (const d of snap.docs) {
              const j = d.data() as Journal;
              if (j && j.id && !journalMap.has(String(j.id))) {
                journalMap.set(String(j.id), j);
                journalAdded = true;
              }
            }
            if (journalAdded) {
              const merged = Array.from(journalMap.values());
              merged.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
              data.journals = merged;
              patch.journals = cleanData(merged);
              needsUpdate = true;
            }
          } catch (e) {
            console.warn("Legacy recovery failed (journal):", e);
          }

          if (needsUpdate) {
            setDoc(tripRef, patch, { merge: true }).catch(() => {});
          }
        }

        onUpdate(data);
      }
    }, (error) => {
      console.error("Real-time sync error (trip doc):", error);
    });

    return () => {
      unsubTrip();
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
 * Cleanly reconciles and purges deleted items from subcollections.
 */
export const updateTripField = async (tripId: string, field: string, value: any): Promise<void> => {
  try {
    const tripRef = doc(db, 'trips', tripId);
    const cleanedValue = cleanData(value);

    // Save directly to main trip document (authoritative source)
    await setDoc(tripRef, {
      [field]: cleanedValue
    }, { merge: true });

    // Asynchronously reconcile subcollections to remove deleted items and update remaining
    if (field === 'scheduleItems' && Array.isArray(value)) {
      const activeIds = new Set(value.map(s => String(s.id)));
      
      // 1. Delete removed items from subcollection
      getDocs(collection(db, 'trips', tripId, 'scheduleItems')).then((snap) => {
        for (const d of snap.docs) {
          if (!activeIds.has(d.id)) {
            deleteDoc(d.ref).catch(() => {});
          }
        }
      }).catch(() => {});

      // 2. Save/update active items
      for (let i = 0; i < value.length; i++) {
        const item = value[i];
        if (item && item.id) {
          const itemRef = doc(db, 'trips', tripId, 'scheduleItems', String(item.id));
          setDoc(itemRef, cleanData({ ...item, orderIndex: i }), { merge: true }).catch(() => {});
        }
      }
    } else if (field === 'pocketItems' && Array.isArray(value)) {
      const activeIds = new Set(value.map(p => String(p.id)));

      // 1. Delete removed items from subcollection
      getDocs(collection(db, 'trips', tripId, 'pocketItems')).then((snap) => {
        for (const d of snap.docs) {
          if (!activeIds.has(d.id)) {
            deleteDoc(d.ref).catch(() => {});
          }
        }
      }).catch(() => {});

      // 2. Save active items
      for (const item of value) {
        if (item && item.id) {
          const itemRef = doc(db, 'trips', tripId, 'pocketItems', String(item.id));
          setDoc(itemRef, cleanData(item), { merge: true }).catch(() => {});
        }
      }
    } else if (field === 'journals' && Array.isArray(value)) {
      const activeIds = new Set(value.map(j => String(j.id)));

      // 1. Delete removed items from subcollection
      getDocs(collection(db, 'trips', tripId, 'journals')).then((snap) => {
        for (const d of snap.docs) {
          if (!activeIds.has(d.id)) {
            deleteDoc(d.ref).catch(() => {});
          }
        }
      }).catch(() => {});

      // 2. Save active items
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
