import { RoutePointSource, RoutePoint } from '../types';

/**
 * 取得帶圓圈數字字元 ①, ②, ③, ④... (1-based)
 * 若超過 20 則顯示 (n)
 */
export function getCircledNumber(sequence: number): string {
  const circled = ['⓪', '①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩', '⑪', '⑫', '⑬', '⑭', '⑮', '⑯', '⑰', '⑱', '⑲', '⑳'];
  if (sequence >= 0 && sequence <= 20) {
    return circled[sequence];
  }
  return `(${sequence})`;
}

/**
 * 嚴格座標數值驗證
 * 確保 latitude, longitude 均為有效浮點數，且在法定地理範圍內
 */
export function isValidCoordinate(lat?: any, lng?: any): boolean {
  if (typeof lat !== 'number' || typeof lng !== 'number') return false;
  if (isNaN(lat) || isNaN(lng)) return false;
  if (!isFinite(lat) || !isFinite(lng)) return false;
  if (lat < -90 || lat > 90) return false;
  if (lng < -180 || lng > 180) return false;
  return true;
}

/**
 * 檢查 RoutePoint 是否具有有效且已確認之座標
 */
export function isConfirmedPointWithCoords(point: RoutePoint): boolean {
  return point.isConfirmed && isValidCoordinate(point.latitude, point.longitude);
}

/**
 * 從 Google Maps URL 中明確抽取座標數值
 * 嚴格限制：僅提取 URL 本身已有之數字座標（如 @35.681,139.767 或 q=35.681,139.767）
 * 絕不使用文字名稱或地點模糊推測！
 */
export function extractValidCoordinateFromGoogleUrl(url?: string): { lat: number; lng: number } | null {
  if (!url || typeof url !== 'string') return null;

  // 1. @lat,lng 格式 (例如: google.com/maps/@41.8902102,12.4922309,17z)
  const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) {
    const lat = parseFloat(atMatch[1]);
    const lng = parseFloat(atMatch[2]);
    if (isValidCoordinate(lat, lng)) return { lat, lng };
  }

  // 2. !3dlat!4dlng 格式 (Google Maps place data protobuf)
  const dataMatch = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (dataMatch) {
    const lat = parseFloat(dataMatch[1]);
    const lng = parseFloat(dataMatch[2]);
    if (isValidCoordinate(lat, lng)) return { lat, lng };
  }

  // 3. ?q=lat,lng 或 ?query=lat,lng 或 &ll=lat,lng 格式 (純數字座標)
  const qMatch = url.match(/[?&](?:q|ll|query|saddr|daddr)=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (qMatch) {
    const lat = parseFloat(qMatch[1]);
    const lng = parseFloat(qMatch[2]);
    if (isValidCoordinate(lat, lng)) return { lat, lng };
  }

  return null;
}

/**
 * 座標來源優先順序等級（數字越小優先度越高）
 * 1. manual_map: 使用者在 Trip Mochi 地圖上點擊 (最高優先級)
 * 2. existing_manual_gps: 使用者原本手動輸入的 GPS
 * 3. google_url_coordinate: Google Maps URL 明確包含之座標
 * 4. other
 */
export function getSourcePriority(source: RoutePointSource): number {
  switch (source) {
    case 'manual_map':
      return 1;
    case 'existing_manual_gps':
      return 2;
    case 'google_url_coordinate':
      return 3;
    case 'other':
    default:
      return 4;
  }
}

/**
 * 檢查新來源是否允許覆蓋現有座標來源
 * manual_map 絕對不可被任何自動或次級來源覆蓋！
 */
export function canOverrideCoordinate(
  existingSource: RoutePointSource,
  newSource: RoutePointSource
): boolean {
  if (existingSource === 'manual_map' && newSource !== 'manual_map') {
    return false;
  }
  return getSourcePriority(newSource) <= getSourcePriority(existingSource);
}

/**
 * 格式化顯示座標字串
 */
export function formatLatLng(lat: number, lng: number, precision: number = 5): string {
  return `${lat.toFixed(precision)}, ${lng.toFixed(precision)}`;
}
