/**
 * MapTypes.ts
 * 
 * Route Map V2 核心型別、分類與統計模型定義
 * 
 * 嚴格守則：
 * 1. Schedule Item ≠ Map Stop
 * 2. 互斥分類：PLACE + ACCOMMODATION + TRANSPORT + FLIGHT + ACTIVITY + FREE_ACTIVITY + OTHER = Total
 * 3. 清楚狀態：GPS, GOOGLE_URL_COORDINATE, GEOCODED, ADDRESS_ONLY, NAME_ONLY, UNLOCATED
 * 4. 來源標示：manual_gps, google_url, geocoding, none
 */

import { GeoCoordinate } from './locationUtils';

/**
 * 七大互斥 Schedule Item 地圖本質分類
 */
export type MapItemClassification = 
  | 'PLACE'           // 景點、餐廳、商店、車站、觀景點等固定地點
  | 'ACCOMMODATION'   // 飯店、Airbnb、住宿
  | 'TRANSPORT'       // 火車、巴士、接送、移動、轉乘等
  | 'FLIGHT'          // 航班
  | 'ACTIVITY'        // 有明確固定地點的活動
  | 'FREE_ACTIVITY'   // 沒有固定地點的自由活動／漫遊
  | 'OTHER';          // 無法判定的項目

/**
 * 站點定位狀態 (絕非只有已定位/未定位)
 */
export type MapLocationStatus =
  | 'GPS'                     // 使用者手動輸入的明確經緯度
  | 'GOOGLE_URL_COORDINATE'   // Google Maps 網址中直接解析出的經緯度
  | 'GEOCODED'                // 透過快取或 Geocoding Provider 成功解析之座標
  | 'ADDRESS_ONLY'            // 只有具體地址，尚未取得座標
  | 'NAME_ONLY'               // 只有景點名稱，尚未取得座標
  | 'UNLOCATED';              // 無法定位或無有效位置

/**
 * 座標來源
 */
export type MapLocationSource =
  | 'manual_gps'
  | 'google_url'
  | 'geocoding'
  | 'none';

/**
 * 完整地圖統計模型 (全旅程或單日)
 */
export interface MapStatistics {
  totalScheduleItems: number;
  // 七大互斥分類
  placeCount: number;
  accommodationCount: number;
  transportCount: number;
  flightCount: number;
  activityCount: number;
  freeActivityCount: number;
  otherCount: number;

  // 實體 Map Stop (可作為 Marker 的項目：PLACE + ACCOMMODATION + 固定 ACTIVITY)
  totalMapStops: number;

  // 定位狀態分項統計
  locatedCount: number;       // 有有效經緯度者 (GPS + GOOGLE_URL_COORDINATE + GEOCODED)
  gpsCount: number;
  googleUrlCoordCount: number;
  geocodedCount: number;
  addressOnlyCount: number;
  nameOnlyCount: number;
  unlocatedCount: number;
  noFixedLocationCount: number; // 包含自由活動、漫遊或無地點項目
}

/**
 * 標準化地圖顯示項目
 */
export interface NormalizedMapItem {
  id: string | number;
  dayNum: number;             // 1, 2, 3...
  dayCode: string;            // D1, D2, D3...
  sequenceNumber: number;     // 當日順序編號 (1, 2, 3...)
  markerCode: string;         // 地圖標記代號 (D1-01, D1-02, D2-01...)
  time?: string;
  title: string;
  rawTitle: string;
  notes?: string;

  // 分類屬性
  classification: MapItemClassification;
  classificationLabel: string;
  isMapStop: boolean;         // 是否真正具有地圖站點標記 (PLACE, ACCOMMODATION, 固定 ACTIVITY)

  // 位置與解析狀態
  locationStatus: MapLocationStatus;
  locationSource: MapLocationSource;
  hasCoordinates: boolean;
  coordinates: GeoCoordinate | null;
  
  address?: string;
  googleMapUrl?: string;
  statusMessage: string;
  
  // Geocoding 狀態 (UI 標示)
  isGeocodingLoading?: boolean;
  isGeocodingFailed?: boolean;

  // 原始關聯資料
  originalItem: any;
  itemSource: 'schedule' | 'booking' | 'pocket';
  date?: string;
}
