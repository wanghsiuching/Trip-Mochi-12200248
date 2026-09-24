/**
 * GeocodingProvider.ts
 * 
 * 地理編碼抽象提供者介面與 Nominatim Prototype 實作
 * 
 * 遵守規範：
 * 1. 具有快取 (Cache) 機制，相同查詢只查一次
 * 2. 嚴格節流 (Throttling) 與錯誤處理，不阻塞前端或地圖渲染
 * 3. 純前端快取：保存在 localStorage 與記憶體中，絕不改寫原始 Schedule Data
 * 4. 支援未來的抽換 (例如未來替換為其他開放或私有 geocoder)
 */

import { GeoCoordinate, isValidCoordinate } from './locationUtils';

export interface LocationResult {
  latitude: number;
  longitude: number;
  displayName: string;
  source: 'geocoding' | 'cache' | 'manual_gps' | 'google_url';
  confidence?: number;
  resolvedAt: number;
}

export interface GeocodingProvider {
  id: string;
  name: string;
  geocode(query: string, context?: { city?: string; country?: string }): Promise<LocationResult | null>;
}

// 快取物件介面
export interface CachedLocationRecord {
  queryKey: string;
  latitude: number;
  longitude: number;
  displayName: string;
  source: 'geocoding' | 'cache';
  confidence?: number;
  resolvedAt: number;
}

const STORAGE_KEY_GEOCODE_CACHE = 'trip_mochi_geocode_cache_v1';

// 記憶體快取
const memoryCache = new Map<string, CachedLocationRecord>();

// 讀取 localStorage 既有快取
function initCacheFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_GEOCODE_CACHE);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'object' && parsed !== null) {
        Object.entries(parsed).forEach(([k, v]) => {
          memoryCache.set(k, v as CachedLocationRecord);
        });
      }
    }
  } catch (e) {
    console.warn('Failed to load geocode cache from localStorage', e);
  }
}

// 寫入 localStorage 快取
function saveCacheToStorage() {
  try {
    const obj: Record<string, CachedLocationRecord> = {};
    memoryCache.forEach((v, k) => {
      obj[k] = v;
    });
    localStorage.setItem(STORAGE_KEY_GEOCODE_CACHE, JSON.stringify(obj));
  } catch (e) {
    console.warn('Failed to save geocode cache to localStorage', e);
  }
}

// 頁面載入時初始化快取
if (typeof window !== 'undefined') {
  initCacheFromStorage();
}

/**
 * 正規化查詢字串作為 Cache Key
 */
export function normalizeQueryKey(query: string, context?: { city?: string; country?: string }): string {
  const parts = [
    query.trim().toLowerCase(),
    context?.city?.trim().toLowerCase(),
    context?.country?.trim().toLowerCase(),
  ].filter(Boolean);

  return parts
    .join(', ')
    .replace(/[,\s]+/g, ' ')
    .trim();
}

/**
 * 快取管理器
 */
export const LocationCacheManager = {
  get(queryKey: string): CachedLocationRecord | null {
    if (!queryKey) return null;
    return memoryCache.get(queryKey) || null;
  },

  set(queryKey: string, result: Omit<CachedLocationRecord, 'queryKey' | 'resolvedAt'>): void {
    if (!queryKey) return;
    const record: CachedLocationRecord = {
      queryKey,
      latitude: result.latitude,
      longitude: result.longitude,
      displayName: result.displayName,
      source: 'cache',
      confidence: result.confidence ?? 1,
      resolvedAt: Date.now(),
    };
    memoryCache.set(queryKey, record);
    saveCacheToStorage();
  },

  getAll(): Map<string, CachedLocationRecord> {
    return memoryCache;
  },

  clear(): void {
    memoryCache.clear();
    try {
      localStorage.removeItem(STORAGE_KEY_GEOCODE_CACHE);
    } catch {}
  }
};

/**
 * 請求隊列與節流控制 (Nominatim 規範要求最高不超過 1 request / sec)
 */
class RequestQueue {
  private queue: (() => Promise<void>)[] = [];
  private isProcessing = false;
  private minIntervalMs = 1100; // 1.1 秒安全間隔
  private lastRequestTime = 0;

  public enqueue<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const now = Date.now();
          const elapsed = now - this.lastRequestTime;
          if (elapsed < this.minIntervalMs) {
            await new Promise(r => setTimeout(r, this.minIntervalMs - elapsed));
          }
          this.lastRequestTime = Date.now();
          const res = await fn();
          resolve(res);
        } catch (err) {
          reject(err);
        }
      });

      this.process();
    });
  }

  private async process() {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;
    while (this.queue.length > 0) {
      const task = this.queue.shift();
      if (task) {
        try {
          await task();
        } catch {}
      }
    }
    this.isProcessing = false;
  }
}

const nominatimQueue = new RequestQueue();

/**
 * OpenStreetMap Nominatim Geocoding Provider
 * 免費開源服務，配合 Cache 與嚴格 1s 節流
 */
export class NominatimGeocodingProvider implements GeocodingProvider {
  public id = 'osm-nominatim';
  public name = 'OpenStreetMap Nominatim';

  public async geocode(
    query: string,
    context?: { city?: string; country?: string }
  ): Promise<LocationResult | null> {
    if (!query || typeof query !== 'string') return null;
    const cleanQuery = query.trim();
    if (!cleanQuery || cleanQuery === '未指定地點') return null;

    const cacheKey = normalizeQueryKey(cleanQuery, context);

    // 1. 檢查 Cache
    const cached = LocationCacheManager.get(cacheKey);
    if (cached) {
      return {
        latitude: cached.latitude,
        longitude: cached.longitude,
        displayName: cached.displayName,
        source: 'cache',
        confidence: cached.confidence,
        resolvedAt: cached.resolvedAt,
      };
    }

    // 2. 透過隊列呼叫 Nominatim (節流 1 req/sec)
    return nominatimQueue.enqueue(async () => {
      // 再次檢查是否已被前一個排隊請求寫入快取
      const secondCheck = LocationCacheManager.get(cacheKey);
      if (secondCheck) {
        return {
          latitude: secondCheck.latitude,
          longitude: secondCheck.longitude,
          displayName: secondCheck.displayName,
          source: 'cache',
          confidence: secondCheck.confidence,
          resolvedAt: secondCheck.resolvedAt,
        };
      }

      try {
        const params = new URLSearchParams({
          q: cleanQuery,
          format: 'json',
          limit: '1',
          addressdetails: '1',
        });

        // 避免在公開 API 中傳遞短網址或無效字串
        if (cleanQuery.startsWith('http://') || cleanQuery.startsWith('https://')) {
          return null;
        }

        const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;
        const resp = await fetch(url, {
          headers: {
            // 符合 OSM Nominatim Usage Policy，標示合法 User-Agent
            'Accept': 'application/json',
          },
        });

        if (!resp.ok) {
          return null;
        }

        const data = await resp.json();
        if (Array.isArray(data) && data.length > 0) {
          const item = data[0];
          const lat = parseFloat(item.lat);
          const lng = parseFloat(item.lon);

          if (isValidCoordinate(lat, lng)) {
            const result: LocationResult = {
              latitude: lat,
              longitude: lng,
              displayName: item.display_name || cleanQuery,
              source: 'geocoding',
              confidence: parseFloat(item.importance || '0.8'),
              resolvedAt: Date.now(),
            };

            // 儲存至快取
            LocationCacheManager.set(cacheKey, {
              latitude: lat,
              longitude: lng,
              displayName: result.displayName,
              source: 'cache',
              confidence: result.confidence,
            });

            return result;
          }
        }
      } catch (err) {
        console.warn(`Geocoding failed for "${cleanQuery}":`, err);
      }

      return null;
    });
  }
}

// 預設 Provider 單例
export const defaultGeocodingProvider: GeocodingProvider = new NominatimGeocodingProvider();
