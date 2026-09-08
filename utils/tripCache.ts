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
    const payload: CachedTripData = {
      data: tripData,
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

      // Try saving again
      const payload: CachedTripData = {
        data: tripData,
        cachedAt: Date.now()
      };
      localStorage.setItem(`${CACHE_PREFIX}${tripId}`, JSON.stringify(payload));
    } catch (retryErr) {
      // 2. If still exceeding, create a lightweight version without large photos
      try {
        const lightweightData = {
          ...tripData,
          scheduleItems: Array.isArray(tripData.scheduleItems)
            ? tripData.scheduleItems.map((item: any) => ({
                ...item,
                images: Array.isArray(item.images) ? item.images.slice(0, 1) : []
              }))
            : [],
          pocketItems: Array.isArray(tripData.pocketItems)
            ? tripData.pocketItems.map((p: any) => ({
                ...p,
                images: Array.isArray(p.images) ? p.images.slice(0, 1) : []
              }))
            : [],
          journals: Array.isArray(tripData.journals)
            ? tripData.journals.map((j: any) => ({
                ...j,
                photos: Array.isArray(j.photos) ? j.photos.slice(0, 1) : []
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
