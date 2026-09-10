/**
 * tripCache.ts - Local storage caching layer for Trip Mochi (Stale-While-Revalidate)
 * Provides instant 0-millisecond trip rendering when switching or opening trips,
 * eliminating the empty data flicker caused by Firestore network roundtrips.
 */

const CACHE_PREFIX = 'trip_mochi_cache_';

export interface CachedTripData {
  data: any;
  cachedAt: number;
}

/**
 * Retrieve cached trip data from localStorage
 */
export const getCachedTrip = (tripId: string): any | null => {
  if (!tripId || typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${tripId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.data) {
      return parsed.data;
    }
    return parsed;
  } catch (err) {
    console.warn('[tripCache] Failed to read cached trip:', err);
    return null;
  }
};

/**
 * Persist trip data to localStorage with quota-exceeded fallback handling
 */
export const setCachedTrip = (tripId: string, tripData: any): void => {
  if (!tripId || !tripData || typeof window === 'undefined') return;
  try {
    const prev = getCachedTrip(tripId);

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

    // Merge defensively: don't accidentally wipe out pocketItems or scheduleItems if a partial update arrived
    const mergedData = {
      ...(prev || {}),
      ...tripData,
      pocketItems: mergedPocketItems,
      scheduleItems: (Array.isArray(tripData.scheduleItems) && tripData.scheduleItems.length > 0)
        ? tripData.scheduleItems
        : (prev?.scheduleItems || tripData.scheduleItems || []),
      journals: (Array.isArray(tripData.journals) && tripData.journals.length > 0)
        ? tripData.journals
        : (prev?.journals || tripData.journals || [])
    };

    const payload: CachedTripData = {
      data: mergedData,
      cachedAt: Date.now()
    };
    const serialized = JSON.stringify(payload);
    localStorage.setItem(`${CACHE_PREFIX}${tripId}`, serialized);
  } catch (err: any) {
    // Quota exceeded: clean older caches or strip heavy photo strings
    console.warn('[tripCache] Storage quota exceeded, purging older trip caches...');
    try {
      // 1. Remove caches of all OTHER trips
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.startsWith(CACHE_PREFIX) && key !== `${CACHE_PREFIX}${tripId}`) {
          localStorage.removeItem(key);
        }
      }

      const prev = getCachedTrip(tripId);
      const mergedData = {
        ...(prev || {}),
        ...tripData,
        pocketItems: (Array.isArray(tripData.pocketItems) && tripData.pocketItems.length > 0)
          ? tripData.pocketItems
          : (prev?.pocketItems || tripData.pocketItems || []),
        scheduleItems: (Array.isArray(tripData.scheduleItems) && tripData.scheduleItems.length > 0)
          ? tripData.scheduleItems
          : (prev?.scheduleItems || tripData.scheduleItems || []),
        journals: (Array.isArray(tripData.journals) && tripData.journals.length > 0)
          ? tripData.journals
          : (prev?.journals || tripData.journals || [])
      };

      // Try saving again
      const payload: CachedTripData = {
        data: mergedData,
        cachedAt: Date.now()
      };
      localStorage.setItem(`${CACHE_PREFIX}${tripId}`, JSON.stringify(payload));
    } catch (retryErr) {
      // 2. If still exceeding, create a lightweight version without heavy image base64, keeping all text & notes intact
      try {
        const prev = getCachedTrip(tripId);
        const sourceData = {
          ...(prev || {}),
          ...tripData,
          pocketItems: (Array.isArray(tripData.pocketItems) && tripData.pocketItems.length > 0)
            ? tripData.pocketItems
            : (prev?.pocketItems || tripData.pocketItems || [])
        };

        const lightweightData = {
          ...sourceData,
          scheduleItems: Array.isArray(sourceData.scheduleItems)
            ? sourceData.scheduleItems.map((item: any) => ({
                ...item,
                images: [] // strip images in cache to guarantee text, notes & titles fit easily in quota
              }))
            : [],
          pocketItems: Array.isArray(sourceData.pocketItems)
            ? sourceData.pocketItems.map((p: any) => ({
                ...p,
                images: [] // preserve all titles, categories, notes, ratings, locations, tags
              }))
            : [],
          journals: Array.isArray(sourceData.journals)
            ? sourceData.journals.map((j: any) => ({
                ...j,
                photos: []
              }))
            : []
        };
        localStorage.setItem(`${CACHE_PREFIX}${tripId}`, JSON.stringify({ data: lightweightData, cachedAt: Date.now() }));
      } catch (finalErr) {
        console.warn('[tripCache] Could not save cache even after pruning:', finalErr);
      }
    }
  }
};

/**
 * Remove cached trip data
 */
export const clearCachedTrip = (tripId: string): void => {
  if (!tripId || typeof window === 'undefined') return;
  try {
    localStorage.removeItem(`${CACHE_PREFIX}${tripId}`);
  } catch (_) {}
};
