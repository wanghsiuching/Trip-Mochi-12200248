/**
 * MapProvider.ts
 * 
 * 地圖與路線抽象提供層 (Map & Routing Abstraction Layer) - Route Map V2
 * 遵守 OpenStreetMap Tile 使用規範，完全不依賴付費 Google Maps API Key，
 * 支援未來抽換為 Mapbox、MapTiler、Google Maps 等其他 Provider。
 */

import { GeoCoordinate, ResolvedLocationData, resolveLocationData, haversineDistance } from './locationUtils';
import { NormalizedMapItem, MapItemClassification, MapLocationStatus, MapLocationSource } from './MapTypes';

export type { GeoCoordinate };
export type { NormalizedMapItem, MapItemClassification, MapLocationStatus, MapLocationSource };


export type MapItemCategory = 'spot' | 'food' | 'stay' | 'transport' | 'other';

/**
 * 萬用座標解析提取器 (向下相容)
 */
export function extractCoordinates(item: any): GeoCoordinate | null {
  const resolved = resolveLocationData(item);
  return resolved.coordinates;
}

/**
 * 外部 Google Maps 連結產生工具 (向下相容)
 */
export const GoogleMapsUrlBuilder = {
  searchUrl: (coord: GeoCoordinate, title?: string): string => {
    return `https://www.google.com/maps/search/?api=1&query=${coord.lat},${coord.lng}`;
  },
  directionUrl: (origin: GeoCoordinate, destination: GeoCoordinate): string => {
    return `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}`;
  },
  multiStopUrl: (stops: GeoCoordinate[]): string => {
    if (stops.length === 0) return 'https://www.google.com/maps';
    if (stops.length === 1) return GoogleMapsUrlBuilder.searchUrl(stops[0]);
    if (stops.length === 2) return GoogleMapsUrlBuilder.directionUrl(stops[0], stops[1]);
    const origin = stops[0];
    const destination = stops[stops.length - 1];
    const waypoints = stops.slice(1, -1).map(p => `${p.lat},${p.lng}`).join('|');
    return `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&waypoints=${encodeURIComponent(waypoints)}`;
  }
};

/**
 * 路線規劃抽象介面 (向下相容)
 */
export interface RoutingProvider {
  id: string;
  name: string;
  calculateRoute(points: GeoCoordinate[]): Promise<{
    coordinates: [number, number][];
    distanceKm?: number;
    isRealRoadNav: boolean;
    label: string;
  }>;
}

/**
 * 每一天 (Day) 的手帳色彩語彙定義
 */
export interface DayThemeColor {
  primary: string;     // 主色 (Marker 邊框/主體、Polyline 顏色)
  dark: string;        // 選取/懸浮強調深色
  light: string;       // 淺色底色 (Badge、卡片標籤)
  border: string;      // 淺色外框
  badgeBg: string;     // Tailwind 類別字串
  badgeText: string;
}

const DAY_THEME_PALETTE: DayThemeColor[] = [
  // Day 1: 經典鼠尾草綠 (Sage Green)
  {
    primary: '#5B8266',
    dark: '#476950',
    light: '#E8F3ED',
    border: '#A3C6B1',
    badgeBg: 'bg-[#5B8266]/15',
    badgeText: 'text-[#5B8266]',
  },
  // Day 2: 暖杏陶土橘 (Terracotta)
  {
    primary: '#C2410C',
    dark: '#9A3412',
    light: '#FFEDD5',
    border: '#FDBA74',
    badgeBg: 'bg-orange-100',
    badgeText: 'text-orange-700',
  },
  // Day 3: 深海松藍 (Deep Teal)
  {
    primary: '#0F766E',
    dark: '#115E59',
    light: '#CCFBF1',
    border: '#5EEAD4',
    badgeBg: 'bg-teal-100',
    badgeText: 'text-teal-700',
  },
  // Day 4: 薰衣草桑葚紫 (Mulberry Plum)
  {
    primary: '#7E22CE',
    dark: '#6B21A8',
    light: '#F3E8FF',
    border: '#D8B4FE',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-700',
  },
  // Day 5: 暖棕焦糖色 (Warm Amber/Sand)
  {
    primary: '#A16207',
    dark: '#854D0E',
    light: '#FEF9C3',
    border: '#FDE047',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-800',
  },
  // Day 6+: 野莓玫瑰粉 (Berry Rose)
  {
    primary: '#BE185D',
    dark: '#9D174D',
    light: '#FCE7F3',
    border: '#F472B6',
    badgeBg: 'bg-pink-100',
    badgeText: 'text-pink-700',
  },
];

/**
 * 依 Day 編號取得主題色票 (若超過 6 天則以模數循環)
 */
export function getDayTheme(dayNum: number): DayThemeColor {
  const index = Math.max(0, dayNum - 1) % DAY_THEME_PALETTE.length;
  return DAY_THEME_PALETTE[index];
}

/**
 * 向量/圖資提供者介面 (Tile Provider Interface)
 */
export interface MapTileProvider {
  id: string;
  name: string;
  tileUrl: string;
  options: {
    maxZoom: number;
    minZoom?: number;
    attribution: string;
  };
}

/**
 * 預設 OpenStreetMap 合規圖資來源 (免費、開放、標準 Attribution)
 */
export const OpenStreetMapProvider: MapTileProvider = {
  id: 'osm-standard',
  name: 'OpenStreetMap Standard',
  tileUrl: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  options: {
    maxZoom: 19,
    minZoom: 2,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OSM</a>',
  }
};

/**
 * 路線區段模型
 */
export interface RouteSegment {
  dayNum: number;
  dayCode: string;
  coordinates: [number, number][]; // [lat, lng] 陣列
  distanceKm?: number;
  isRealRoadNav: boolean;
  label: string;
  hasGap: boolean;
  gapCount: number;
}

export { haversineDistance };

/**
 * 真正 Map Stop 的行程順序線（Sequence Line）提供者
 * 規範十一、十二、十三、十四：
 * - 只有具備有效 coordinates 的真實 Map Stop 才會連線
 * - 順序嚴格依照 Schedule 的原生時間或排序 (① → ② → ③)
 * - 遇到未定位的 Stop 立即中斷為獨立區段，絕不直連假裝有路線
 * - 交通 (TRANSPORT) 與航班 (FLIGHT) 絕不納入 Polyline
 * - 住宿 (ACCOMMODATION) 僅在作為當天實際 Schedule 排程項目時納入
 */
export class SequenceRoutingProvider {
  public calculateDailyRouteSegments(items: NormalizedMapItem[]): {
    continuousSegments: [number, number][][];
    totalDistanceKm: number;
    hasGaps: boolean;
    gapCount: number;
  } {
    // 僅過濾出當日真正的 Map Stop (排除 TRANSPORT, FLIGHT, 純漫遊 FREE_ACTIVITY)
    const mapStops = items.filter(i => i.isMapStop);

    const continuousSegments: [number, number][][] = [];
    let currentSegment: [number, number][] = [];
    let totalDistanceKm = 0;
    let gapCount = 0;

    for (let i = 0; i < mapStops.length; i++) {
      const stop = mapStops[i];
      if (stop.hasCoordinates && stop.coordinates) {
        currentSegment.push([stop.coordinates.lat, stop.coordinates.lng]);
      } else {
        // 遇到未定位的 Map Stop，結算前段並中斷
        if (currentSegment.length >= 2) {
          continuousSegments.push(currentSegment);
        }
        currentSegment = [];
        gapCount++;
      }
    }

    if (currentSegment.length >= 2) {
      continuousSegments.push(currentSegment);
    }

    // 計算各連續區段之直線累計距離
    for (const seg of continuousSegments) {
      for (let j = 0; j < seg.length - 1; j++) {
        totalDistanceKm += haversineDistance(
          { lat: seg[j][0], lng: seg[j][1] },
          { lat: seg[j + 1][0], lng: seg[j + 1][1] }
        );
      }
    }

    return {
      continuousSegments,
      totalDistanceKm: Math.round(totalDistanceKm * 10) / 10,
      hasGaps: gapCount > 0,
      gapCount,
    };
  }

  public async calculateRoute(points: GeoCoordinate[]): Promise<{
    coordinates: [number, number][];
    distanceKm?: number;
    isRealRoadNav: boolean;
    label: string;
  }> {
    const coordinates: [number, number][] = points.map(p => [p.lat, p.lng]);
    let totalDistanceKm = 0;
    for (let j = 0; j < points.length - 1; j++) {
      totalDistanceKm += haversineDistance(points[j], points[j + 1]);
    }
    return {
      coordinates,
      distanceKm: Math.round(totalDistanceKm * 10) / 10,
      isRealRoadNav: false,
      label: '行程順序直線參考（無導航路況）'
    };
  }
}

/**
 * 行程路線客觀檢查與統計報告 (Route Inspection Report)
 */
export interface RouteInspectionReport {
  dayNum: number;
  dayCode: string;
  totalScheduleItems: number;
  totalMapStops: number;
  locatedStops: number;
  pendingGeocodingStops: number;
  unlocatedStops: number;
  estimatedDistanceKm: number;
  warnings: string[];
  isBacktrackingLikely: boolean;
  hasGapInterruption: boolean;
}

export function inspectDailyRoute(
  dayNum: number,
  items: NormalizedMapItem[]
): RouteInspectionReport {
  const dayCode = dayNum === 0 ? 'ALL' : `D${dayNum}`;
  const totalScheduleItems = items.length;
  // 僅針對真正的 Map Stop 進行路線品質檢查
  const mapStops = items.filter(i => i.isMapStop);
  const totalMapStops = mapStops.length;
  const located = mapStops.filter(i => i.hasCoordinates && i.coordinates);
  const locatedStops = located.length;
  const pendingGeocodingStops = mapStops.filter(i => i.isGeocodingLoading).length;
  const unlocatedStops = mapStops.filter(i => !i.hasCoordinates && !i.isGeocodingLoading).length;

  const warnings: string[] = [];

  let estimatedDistanceKm = 0;
  let isBacktrackingLikely = false;
  let hasGapInterruption = false;

  const routing = new SequenceRoutingProvider();
  const { continuousSegments, hasGaps } = routing.calculateDailyRouteSegments(items);
  hasGapInterruption = hasGaps;

  if (locatedStops >= 2) {
    for (let i = 0; i < located.length - 1; i++) {
      const p1 = located[i].coordinates!;
      const p2 = located[i + 1].coordinates!;
      estimatedDistanceKm += haversineDistance(p1, p2);
    }
    estimatedDistanceKm = Math.round(estimatedDistanceKm * 10) / 10;

    if (locatedStops >= 3) {
      const startPt = located[0].coordinates!;
      const endPt = located[located.length - 1].coordinates!;
      const netSpan = haversineDistance(startPt, endPt);
      if (netSpan > 1 && estimatedDistanceKm > netSpan * 2.3) {
        isBacktrackingLikely = true;
      }
    }
  }

  // 規範十二：若有缺少座標的 Stop，顯示「此段路線因地點尚未定位而中斷」
  if (hasGaps && unlocatedStops > 0) {
    warnings.push(`此日有 ${unlocatedStops} 個地點待定位，路線在此處中斷分段`);
  }

  if (estimatedDistanceKm > 35) {
    warnings.push(`站點直線累計約 ${estimatedDistanceKm} km，跨區範圍較廣`);
  } else if (isBacktrackingLikely) {
    warnings.push(`站點空間順序可能有折返情況，可檢視拜訪先後`);
  }

  return {
    dayNum,
    dayCode,
    totalScheduleItems,
    totalMapStops,
    locatedStops,
    pendingGeocodingStops,
    unlocatedStops,
    estimatedDistanceKm,
    warnings,
    isBacktrackingLikely,
    hasGapInterruption,
  };
}
