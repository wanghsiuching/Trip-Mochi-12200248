/**
 * locationUtils.ts
 * 
 * Location Resolver 與地圖目標統一解析工具 - Route Map V2
 * 
 * 遵守規範：
 * 1. 使用者手動輸入 GPS 永遠最優先，絕不被覆蓋
 * 2. Google Maps URL 優先解析經緯度 (若為短網址則保留 URL，標記為 GOOGLE_URL_ONLY)
 * 3. 整合 LocationCacheManager 快取檢查
 * 4. 區分 GPS, GOOGLE_URL_COORDINATE, GEOCODED, ADDRESS_ONLY, NAME_ONLY, UNLOCATED
 * 5. 絕不瞎猜座標
 */

import { LocationCacheManager, normalizeQueryKey } from './GeocodingProvider';
import { MapLocationStatus, MapLocationSource } from './MapTypes';

export interface GeoCoordinate {
  lat: number;
  lng: number;
}

export type LocationResolutionStatus = 'located' | 'unlocated' | 'empty';

export type LocationSourceType = 
  | 'gps_direct' 
  | 'google_maps_url' 
  | 'location_coord_string'
  | 'geocoding'
  | 'address_name'
  | 'address_only'
  | 'name_only'
  | 'none';

export interface ResolvedLocationData {
  status: LocationResolutionStatus;
  hasCoordinates: boolean;
  coordinates: GeoCoordinate | null;
  locationStatus: MapLocationStatus;
  locationSource: MapLocationSource;
  title: string;
  address?: string;
  googleMapUrl?: string;
  statusMessage: string;
  rawInput?: any;
  cachedDisplayName?: string;
  queryKey?: string; // 供後續非同步 Geocoding 查詢用的 Cache Key
}

/**
 * 判斷是否為有效且合理的經緯度數值
 */
export function isValidCoordinate(lat: number, lng: number): boolean {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    (lat !== 0 || lng !== 0) // 排除 (0, 0) Null Island 預設預留值
  );
}

/**
 * 判斷字串是否為 Google Maps 相關網址
 */
export function isGoogleMapsUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const lower = url.trim().toLowerCase();
  return (
    lower.includes('google.com/maps') ||
    lower.includes('maps.google.') ||
    lower.includes('maps.app.goo.gl') ||
    lower.includes('goo.gl/maps')
  );
}

/**
 * 從 Google Maps URL 中安全解析座標
 * 支援:
 * - @lat,lng (例如 @41.8902,12.4922,17z)
 * - ?q=lat,lng 或 query=lat,lng
 * - ?ll=lat,lng
 * - destination=lat,lng
 * 
 * 若為短網址或無法解析的 place id，回傳 null（絕不猜測）
 */
export function parseCoordinatesFromGoogleUrl(url?: string | null): GeoCoordinate | null {
  if (!url || typeof url !== 'string') return null;

  try {
    // 1. 匹配 @lat,lng (常見於桌面版與分享網址)
    const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (atMatch) {
      const lat = parseFloat(atMatch[1]);
      const lng = parseFloat(atMatch[2]);
      if (isValidCoordinate(lat, lng)) {
        return { lat, lng };
      }
    }

    // 2. 匹配 query=lat,lng 或 q=lat,lng (常見於搜尋 API 連結)
    const qMatch = url.match(/[?&](?:query|q|ll|destination)=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (qMatch) {
      const lat = parseFloat(qMatch[1]);
      const lng = parseFloat(qMatch[2]);
      if (isValidCoordinate(lat, lng)) {
        return { lat, lng };
      }
    }

    // 3. 匹配 /place/名稱/@lat,lng
    const placeMatch = url.match(/\/place\/[^/]+\/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (placeMatch) {
      const lat = parseFloat(placeMatch[1]);
      const lng = parseFloat(placeMatch[2]);
      if (isValidCoordinate(lat, lng)) {
        return { lat, lng };
      }
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * 從字串中提取座標（例如 "41.8902, 12.4922" 或 "41.8902，12.4922"）
 */
export function parseCoordinatesFromString(str?: string | null): GeoCoordinate | null {
  if (!str || typeof str !== 'string') return null;
  const trimmed = str.trim();
  const parts = trimmed.split(/[,，\s]+/).filter(Boolean);
  if (parts.length >= 2) {
    const lat = parseFloat(parts[0]);
    const lng = parseFloat(parts[1]);
    if (isValidCoordinate(lat, lng)) {
      return { lat, lng };
    }
  }
  return null;
}

/**
 * 統一層級化 Location Resolver：
 * 
 * 優先順序：
 * 1. 使用者手動輸入 GPS (latitude/longitude 屬性、gps 物件、gps 字串、location 座標字串) -> 永遠優先
 * 2. Google Maps URL 中可直接解析的座標
 * 3. Cache 快取座標 (已有 Geocoding 快取紀錄)
 * 4. Address + Name -> 標記為 ADDRESS_ONLY
 * 5. Address -> 標記為 ADDRESS_ONLY
 * 6. Name -> 標記為 NAME_ONLY
 * 7. 無法定位 -> 標記為 UNLOCATED
 */
export function resolveLocationData(item: any, fallbackTitle?: string): ResolvedLocationData {
  const title = (item?.title || item?.name || item?.location || fallbackTitle || '未命名行程').trim();
  const rawAddress = (item?.address || (typeof item?.location === 'string' ? item.location : '') || '').trim();
  
  // 提取可能的 Google Maps 網址
  let googleMapUrl: string | undefined = undefined;
  if (isGoogleMapsUrl(item?.googleMapUrl)) {
    googleMapUrl = item.googleMapUrl.trim();
  } else if (isGoogleMapsUrl(item?.url)) {
    googleMapUrl = item.url.trim();
  } else if (isGoogleMapsUrl(item?.link)) {
    googleMapUrl = item.link.trim();
  } else if (isGoogleMapsUrl(rawAddress)) {
    googleMapUrl = rawAddress;
  }

  // ==========================================
  // 1. 使用者手動 GPS (永遠最高優先)
  // ==========================================

  // (A) latitude + longitude 屬性
  if (item?.latitude !== undefined && item?.longitude !== undefined) {
    const lat = parseFloat(String(item.latitude));
    const lng = parseFloat(String(item.longitude));
    if (isValidCoordinate(lat, lng)) {
      return {
        status: 'located',
        hasCoordinates: true,
        coordinates: { lat, lng },
        locationStatus: 'GPS',
        locationSource: 'manual_gps',
        title,
        address: rawAddress !== googleMapUrl ? rawAddress : undefined,
        googleMapUrl,
        statusMessage: '手動精確 GPS 定位',
        rawInput: item,
      };
    }
  }

  // (B) gps 物件 { lat, lng }
  if (item?.gps && typeof item.gps === 'object') {
    const lat = parseFloat(String(item.gps.lat));
    const lng = parseFloat(String(item.gps.lng));
    if (isValidCoordinate(lat, lng)) {
      return {
        status: 'located',
        hasCoordinates: true,
        coordinates: { lat, lng },
        locationStatus: 'GPS',
        locationSource: 'manual_gps',
        title,
        address: rawAddress !== googleMapUrl ? rawAddress : undefined,
        googleMapUrl,
        statusMessage: '手動精確 GPS 定位',
        rawInput: item,
      };
    }
  }

  // (C) gps 為字串格式 "lat, lng"
  if (typeof item?.gps === 'string') {
    const coords = parseCoordinatesFromString(item.gps);
    if (coords) {
      return {
        status: 'located',
        hasCoordinates: true,
        coordinates: coords,
        locationStatus: 'GPS',
        locationSource: 'manual_gps',
        title,
        address: rawAddress !== googleMapUrl ? rawAddress : undefined,
        googleMapUrl,
        statusMessage: '手動填寫 GPS 定位',
        rawInput: item,
      };
    }
  }

  // (D) location 欄位本身為 "lat, lng" 座標格式
  if (typeof item?.location === 'string') {
    const coords = parseCoordinatesFromString(item.location);
    if (coords) {
      return {
        status: 'located',
        hasCoordinates: true,
        coordinates: coords,
        locationStatus: 'GPS',
        locationSource: 'manual_gps',
        title,
        address: undefined,
        googleMapUrl,
        statusMessage: '依填寫座標定位',
        rawInput: item,
      };
    }
  }

  // ==========================================
  // 2. Google Maps URL 中直接解析之座標
  // ==========================================
  if (googleMapUrl) {
    const coordsFromUrl = parseCoordinatesFromGoogleUrl(googleMapUrl);
    if (coordsFromUrl) {
      return {
        status: 'located',
        hasCoordinates: true,
        coordinates: coordsFromUrl,
        locationStatus: 'GOOGLE_URL_COORDINATE',
        locationSource: 'google_url',
        title,
        address: rawAddress !== googleMapUrl ? rawAddress : undefined,
        googleMapUrl,
        statusMessage: 'Google Maps 網址座標',
        rawInput: item,
      };
    }
  }

  // ==========================================
  // 3. Cache 快取檢查 (Address + Name 或 Name)
  // ==========================================
  // 計算有效查詢字串
  let effectiveSearchQuery = '';
  const cleanAddress = rawAddress && rawAddress !== title && rawAddress !== '未指定地點' ? rawAddress : '';
  const cleanTitle = title && title !== '未指定地點' && title !== '未命名行程' ? title : '';

  if (cleanAddress && cleanTitle) {
    effectiveSearchQuery = `${cleanAddress}, ${cleanTitle}`;
  } else if (cleanAddress) {
    effectiveSearchQuery = cleanAddress;
  } else if (cleanTitle) {
    effectiveSearchQuery = cleanTitle;
  }

  const queryKey = effectiveSearchQuery ? normalizeQueryKey(effectiveSearchQuery) : '';

  if (queryKey) {
    const cached = LocationCacheManager.get(queryKey);
    if (cached && isValidCoordinate(cached.latitude, cached.longitude)) {
      return {
        status: 'located',
        hasCoordinates: true,
        coordinates: { lat: cached.latitude, lng: cached.longitude },
        locationStatus: 'GEOCODED',
        locationSource: 'geocoding',
        title,
        address: cleanAddress || undefined,
        googleMapUrl,
        statusMessage: '已自地理編碼快取定位',
        cachedDisplayName: cached.displayName,
        queryKey,
        rawInput: item,
      };
    }
  }

  // ==========================================
  // 4. Address + Name 或純 Address (待定位)
  // ==========================================
  if (cleanAddress) {
    return {
      status: 'unlocated',
      hasCoordinates: false,
      coordinates: null,
      locationStatus: 'ADDRESS_ONLY',
      locationSource: 'none',
      title,
      address: cleanAddress,
      googleMapUrl,
      statusMessage: '具備詳細地址，尚未取得座標',
      queryKey,
      rawInput: item,
    };
  }

  // ==========================================
  // 5. 純名稱 Name (待定位)
  // ==========================================
  if (cleanTitle) {
    return {
      status: 'unlocated',
      hasCoordinates: false,
      coordinates: null,
      locationStatus: 'NAME_ONLY',
      locationSource: 'none',
      title,
      address: undefined,
      googleMapUrl,
      statusMessage: '具備景點名稱，尚未取得座標',
      queryKey,
      rawInput: item,
    };
  }

  // ==========================================
  // 6. 無法定位
  // ==========================================
  return {
    status: 'empty',
    hasCoordinates: false,
    coordinates: null,
    locationStatus: 'UNLOCATED',
    locationSource: 'none',
    title: '未設定地點',
    statusMessage: '未填寫明確地點資訊',
    googleMapUrl,
    rawInput: item,
  };
}

/**
 * 智慧建立外部 Google Maps 連結
 */
export function getExternalGoogleMapsUrl(resolved: ResolvedLocationData): string {
  if (resolved.googleMapUrl) {
    return resolved.googleMapUrl;
  }

  if (resolved.coordinates) {
    return `https://www.google.com/maps/search/?api=1&query=${resolved.coordinates.lat},${resolved.coordinates.lng}`;
  }

  const queryText = [resolved.address, resolved.title].filter(Boolean).join(' ');
  if (queryText && queryText !== '未指定地點') {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(queryText)}`;
  }

  return 'https://www.google.com/maps';
}

/**
 * 多站順序路線 Google Maps 導航 URL
 */
export function buildMultiStopGoogleDirectionsUrl(
  items: { coordinates: GeoCoordinate; title?: string }[]
): string {
  const located = items.filter(i => isValidCoordinate(i.coordinates.lat, i.coordinates.lng));
  if (located.length === 0) return 'https://www.google.com/maps';
  if (located.length === 1) {
    return `https://www.google.com/maps/search/?api=1&query=${located[0].coordinates.lat},${located[0].coordinates.lng}`;
  }

  const origin = `${located[0].coordinates.lat},${located[0].coordinates.lng}`;
  const destination = `${located[located.length - 1].coordinates.lat},${located[located.length - 1].coordinates.lng}`;
  
  if (located.length === 2) {
    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
  }

  const waypoints = located.slice(1, -1).map(p => `${p.coordinates.lat},${p.coordinates.lng}`).join('|');
  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${encodeURIComponent(waypoints)}`;
}

/**
 * 計算兩點之間的大圓直線距離（Haversine 公式，單位：公里）
 */
export function haversineDistance(p1: GeoCoordinate, p2: GeoCoordinate): number {
  const R = 6371; // 地球半徑 (km)
  const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
  const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1.lat * Math.PI) / 180) *
      Math.cos((p2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

