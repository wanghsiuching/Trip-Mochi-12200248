/**
 * tripCache.ts - Hybrid High-Capacity Caching Engine for Trip Mochi
 * 
 * Features:
 * 1. In-Memory Cache: 0ms instant retrieval in active session.
 * 2. IndexedDB Persistent Store (50MB+ quota): Stores full trip data including all high-res photos
 *    without being constrained by the browser's 5MB localStorage limit.
 * 3. LocalStorage Synchronous Fallback: Allows synchronous pre-render on initial mount.
 * 4. Stale-While-Revalidate: Instant offline rendering followed by real-time Firestore sync.
 */

const CACHE_PREFIX = 'trip_mochi_cache_';
const IDB_DB_NAME = 'trip_mochi_storage_v1';
const IDB_STORE_NAME = 'trip_data';

export interface CachedTripData {
  data: any;
  cachedAt: number;
}

// In-memory cache for 0ms synchronous access during the session
const memoryCache = new Map<string, any>();

/**
 * Open or create IndexedDB instance for high-capacity trip storage
 */
const openDatabase = (): Promise<IDBDatabase | null> => {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(IDB_DB_NAME, 1);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(IDB_STORE_NAME)) {
          db.createObjectStore(IDB_STORE_NAME);
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = (err) => {
        console.warn('[tripCache] IndexedDB open error:', err);
        resolve(null);
      };
    } catch (e) {
      console.warn('[tripCache] IndexedDB initialization error:', e);
      resolve(null);
    }
  });
};

/**
 * Retrieve full cached trip data from IndexedDB (contains 100% of photos and documents)
 */
export const getCachedTripAsync = async (tripId: string): Promise<any | null> => {
  if (!tripId || typeof window === 'undefined') return null;

  // 1. Check memory cache first
  if (memoryCache.has(tripId)) {
    const mem = memoryCache.get(tripId);
    if (mem) return mem;
  }

  // 2. Read from IndexedDB
  try {
    const db = await openDatabase();
    if (db) {
      const result = await new Promise<any | null>((resolve) => {
        try {
          const transaction = db.transaction(IDB_STORE_NAME, 'readonly');
          const store = transaction.objectStore(IDB_STORE_NAME);
          const request = store.get(tripId);

          request.onsuccess = () => {
            const val = request.result;
            if (val && val.data) {
              resolve(val.data);
            } else {
              resolve(val || null);
            }
          };

          request.onerror = () => resolve(null);
        } catch {
          resolve(null);
        }
      });

      if (result) {
        memoryCache.set(tripId, result);
        return result;
      }
    }
  } catch (err) {
    console.warn('[tripCache] getCachedTripAsync error:', err);
  }

  // 3. Fallback to localStorage
  return getCachedTrip(tripId);
};

/**
 * Synchronous retrieve cached trip data (from memory or localStorage)
 */
export const getCachedTrip = (tripId: string): any | null => {
  if (!tripId || typeof window === 'undefined') return null;

  // Check memory cache first
  if (memoryCache.has(tripId)) {
    return memoryCache.get(tripId);
  }

  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${tripId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const data = parsed && parsed.data ? parsed.data : parsed;
    if (data) {
      memoryCache.set(tripId, data);
    }
    return data;
  } catch (err) {
    console.warn('[tripCache] Failed to read cached trip:', err);
    return null;
  }
};

/**
 * Persist trip data to both IndexedDB (full data with all photos)
 * and LocalStorage (with quota-exceeded fallback handling)
 */
export const setCachedTrip = (tripId: string, tripData: any): void => {
  if (!tripId || !tripData || typeof window === 'undefined') return;

  try {
    const prev = memoryCache.get(tripId) || getCachedTrip(tripId);

    // Merge pocket items defensively by ID to prevent dropping any items or fields
    const pocketMap = new Map<string, any>();
    if (prev?.pocketItems && Array.isArray(prev.pocketItems)) {
      for (const p of prev.pocketItems) {
        if (p && p.id) pocketMap.set(String(p.id), p);
      }
    }
    if (tripData.pocketItems && Array.isArray(tripData.pocketItems)) {
      for (const p of tripData.pocketItems) {
        if (p && p.id) {
          const old = pocketMap.get(String(p.id));
          pocketMap.set(String(p.id), old ? { ...old, ...p } : p);
        }
      }
    }
    const mergedPocketItems = pocketMap.size > 0
      ? Array.from(pocketMap.values())
      : (Array.isArray(tripData.pocketItems) ? tripData.pocketItems : (prev?.pocketItems || []));

    // Merge journals defensively to never drop photos if a partial update arrived
    const journalMap = new Map<string, any>();
    if (prev?.journals && Array.isArray(prev.journals)) {
      for (const j of prev.journals) {
        if (j && j.id) journalMap.set(String(j.id), j);
      }
    }
    if (tripData.journals && Array.isArray(tripData.journals)) {
      for (const j of tripData.journals) {
        if (j && j.id) {
          const old = journalMap.get(String(j.id));
          const photos = (Array.isArray(j.photos) && j.photos.length > 0)
            ? j.photos
            : (Array.isArray((j as any).images) && (j as any).images.length > 0)
            ? (j as any).images
            : (old?.photos || (old as any)?.images || []);

          journalMap.set(String(j.id), {
            ...(old || {}),
            ...j,
            photos
          });
        }
      }
    }
    const mergedJournals = journalMap.size > 0
      ? Array.from(journalMap.values())
      : (Array.isArray(tripData.journals) ? tripData.journals : (prev?.journals || []));

    const mergedData = {
      ...(prev || {}),
      ...tripData,
      pocketItems: mergedPocketItems,
      scheduleItems: (Array.isArray(tripData.scheduleItems) && tripData.scheduleItems.length > 0)
        ? tripData.scheduleItems
        : (prev?.scheduleItems || tripData.scheduleItems || []),
      journals: mergedJournals
    };

    // 1. Update in-memory cache
    memoryCache.set(tripId, mergedData);

    const payload: CachedTripData = {
      data: mergedData,
      cachedAt: Date.now()
    };

    // 2. Save full data (including ALL high-res photos) to IndexedDB asynchronously
    openDatabase().then(db => {
      if (db) {
        try {
          const tx = db.transaction(IDB_STORE_NAME, 'readwrite');
          const store = tx.objectStore(IDB_STORE_NAME);
          store.put(payload, tripId);
        } catch (idbErr) {
          console.warn('[tripCache] IndexedDB save error:', idbErr);
        }
      }
    }).catch(() => {});

    // 3. Save to localStorage (with fallback if 5MB quota is exceeded)
    try {
      const serialized = JSON.stringify(payload);
      localStorage.setItem(`${CACHE_PREFIX}${tripId}`, serialized);
    } catch (lsErr) {
      // Quota exceeded: clean other trip caches
      try {
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && key.startsWith(CACHE_PREFIX) && key !== `${CACHE_PREFIX}${tripId}`) {
            localStorage.removeItem(key);
          }
        }
        localStorage.setItem(`${CACHE_PREFIX}${tripId}`, JSON.stringify(payload));
      } catch (retryErr) {
        // If still exceeding, create lightweight sync copy for localStorage
        // while IndexedDB retains the full copy with all photos!
        try {
          const lightweightData = {
            ...mergedData,
            scheduleItems: Array.isArray(mergedData.scheduleItems)
              ? mergedData.scheduleItems.map((item: any) => ({ ...item, images: (item.images || []).slice(0, 1) }))
              : [],
            pocketItems: Array.isArray(mergedData.pocketItems)
              ? mergedData.pocketItems.map((p: any) => ({ ...p, images: (p.images || []).slice(0, 1) }))
              : [],
            journals: Array.isArray(mergedData.journals)
              ? mergedData.journals.map((j: any) => ({ ...j, photos: (j.photos || []).slice(0, 1) }))
              : []
          };
          localStorage.setItem(`${CACHE_PREFIX}${tripId}`, JSON.stringify({ data: lightweightData, cachedAt: Date.now() }));
        } catch (_) {}
      }
    }
  } catch (err) {
    console.warn('[tripCache] setCachedTrip error:', err);
  }
};

/**
 * Remove cached trip data from memory, localStorage, and IndexedDB
 */
export const clearCachedTrip = (tripId: string): void => {
  if (!tripId || typeof window === 'undefined') return;
  memoryCache.delete(tripId);
  try {
    localStorage.removeItem(`${CACHE_PREFIX}${tripId}`);
  } catch (_) {}

  openDatabase().then(db => {
    if (db) {
      try {
        const tx = db.transaction(IDB_STORE_NAME, 'readwrite');
        tx.objectStore(IDB_STORE_NAME).delete(tripId);
      } catch (_) {}
    }
  }).catch(() => {});
};
