import { RoutePoint, RouteSegment, RouteTransportType, ROUTE_TRANSPORT_CONFIG } from '../types';
import { isValidCoordinate } from '../utils/locationUtils';

/**
 * 路由提供者抽象介面 (Provider Abstraction)
 * 供未來擴充 OpenStreetMap, OSRM, GraphHopper 等，本版本使用 GoogleMapsUrlProvider
 */
export interface RoutingProvider {
  name: string;
  buildRouteUrl(params: {
    origin: RoutePoint;
    waypoints?: RoutePoint[];
    destination: RoutePoint;
    travelMode?: string;
  }): string;
  buildSegmentUrl(params: {
    from: RoutePoint;
    to: RoutePoint;
    transportType: RouteTransportType;
  }): string;
}

/**
 * Google Maps URL 支援的旅行模式
 */
export type GoogleTravelMode = 'walking' | 'transit' | 'driving' | 'bicycling';

/**
 * 將 Trip Mochi RouteTransportType 映射至 Google Maps travelmode
 */
export function mapTransportTypeToGoogleTravelMode(type: RouteTransportType): GoogleTravelMode {
  const config = ROUTE_TRANSPORT_CONFIG[type];
  if (config && config.googleMode) {
    return config.googleMode;
  }
  return 'walking';
}

/**
 * 建構單一完整的 Google Maps 路線規劃官方 URL
 * 零 API Key、零 SDK、零 Cloud Billing
 * 依賴官方 URL: https://www.google.com/maps/dir/?api=1
 */
export function buildGoogleMapsDirectionsUrl(params: {
  origin: RoutePoint;
  waypoints?: RoutePoint[];
  destination: RoutePoint;
  travelMode?: GoogleTravelMode | string;
}): string {
  const { origin, waypoints = [], destination, travelMode } = params;

  if (!isValidCoordinate(origin.latitude, origin.longitude)) {
    throw new Error(`起點「${origin.title || origin.sequence}」尚未設定有效座標。`);
  }
  if (!isValidCoordinate(destination.latitude, destination.longitude)) {
    throw new Error(`終點「${destination.title || destination.sequence}」尚未設定有效座標。`);
  }

  const url = new URL('https://www.google.com/maps/dir/');
  url.searchParams.set('api', '1');
  url.searchParams.set('origin', `${origin.latitude},${origin.longitude}`);
  url.searchParams.set('destination', `${destination.latitude},${destination.longitude}`);

  // 驗證並加入中間站 (Waypoints)
  const validWaypoints = waypoints.filter(wp => isValidCoordinate(wp.latitude, wp.longitude));
  if (validWaypoints.length > 0) {
    const waypointsParam = validWaypoints
      .map(wp => `${wp.latitude},${wp.longitude}`)
      .join('|');
    url.searchParams.set('waypoints', waypointsParam);
  }

  if (travelMode) {
    url.searchParams.set('travelmode', travelMode);
  }

  return url.toString();
}

/**
 * 建構單一路段 (Segment) 的 Google Maps 導航 URL
 */
export function buildGoogleMapsSegmentUrl(params: {
  from: RoutePoint;
  to: RoutePoint;
  transportType: RouteTransportType;
}): string {
  const { from, to, transportType } = params;
  const travelMode = mapTransportTypeToGoogleTravelMode(transportType);
  return buildGoogleMapsDirectionsUrl({
    origin: from,
    destination: to,
    waypoints: [],
    travelMode,
  });
}

/**
 * 路線分段資訊 (因應 Google Maps Waypoints 限制)
 */
export interface RouteLegGroup {
  partIndex: number;
  totalParts: number;
  label: string;
  origin: RoutePoint;
  waypoints: RoutePoint[];
  destination: RoutePoint;
  points: RoutePoint[];
  url: string;
  isMultiPart: boolean;
}

/**
 * 檢查 Waypoint 數量與 URL 長度，若超過 Google Maps 限制 (通常最多 9~10 個 waypoints)，
 * 自動切成多段 (Part 1, Part 2...)，UI 顯示「路線已分段」，不刪除使用者的任何點位。
 */
export function buildDayRouteWithLimits(
  points: RoutePoint[],
  travelMode?: GoogleTravelMode | string,
  maxWaypointsPerLeg: number = 9
): RouteLegGroup[] {
  // 過濾出有有效座標的點
  const validPoints = points.filter(p => isValidCoordinate(p.latitude, p.longitude));

  if (validPoints.length < 2) {
    return [];
  }

  // 若小於等於起點 + 最多 waypoint + 終點 (例如 1 + 9 + 1 = 11 個點)，直接單一段
  const maxPointsPerLeg = maxWaypointsPerLeg + 2;
  if (validPoints.length <= maxPointsPerLeg) {
    const origin = validPoints[0];
    const destination = validPoints[validPoints.length - 1];
    const waypoints = validPoints.slice(1, validPoints.length - 1);
    const url = buildGoogleMapsDirectionsUrl({
      origin,
      waypoints,
      destination,
      travelMode,
    });
    return [
      {
        partIndex: 1,
        totalParts: 1,
        label: '完整路線',
        origin,
        waypoints,
        destination,
        points: validPoints,
        url,
        isMultiPart: false,
      }
    ];
  }

  // 超過上限，進行滑動窗口分段（每一段的終點銜接下一段的起點）
  const groups: RouteLegGroup[] = [];
  let currentIndex = 0;
  let part = 1;

  while (currentIndex < validPoints.length - 1) {
    const endIndex = Math.min(currentIndex + maxWaypointsPerLeg + 1, validPoints.length - 1);
    const legPoints = validPoints.slice(currentIndex, endIndex + 1);
    const origin = legPoints[0];
    const destination = legPoints[legPoints.length - 1];
    const waypoints = legPoints.slice(1, legPoints.length - 1);

    const url = buildGoogleMapsDirectionsUrl({
      origin,
      waypoints,
      destination,
      travelMode,
    });

    groups.push({
      partIndex: part,
      totalParts: 0, // 稍後填入
      label: `第 ${part} 段 (${origin.title || `第${origin.sequence}站`} → ${destination.title || `第${destination.sequence}站`})`,
      origin,
      waypoints,
      destination,
      points: legPoints,
      url,
      isMultiPart: true,
    });

    currentIndex = endIndex;
    part++;
  }

  // 補齊 totalParts
  groups.forEach(g => {
    g.totalParts = groups.length;
  });

  return groups;
}

/**
 * 檢查給定的路段清單是否為混合交通 (Mixed Transport)
 */
export function checkIsMixedTransport(segments: RouteSegment[]): boolean {
  if (segments.length <= 1) return false;
  const firstType = segments[0]?.transportType;
  return segments.some(s => s.transportType !== firstType);
}

/**
 * GoogleMapsUrlProvider 官方 URL 實作類別 (免收費、零 API Key)
 */
export class GoogleMapsUrlProvider implements RoutingProvider {
  public readonly name = 'Google Maps Web URL Provider (Official & Free)';

  public buildRouteUrl(params: {
    origin: RoutePoint;
    waypoints?: RoutePoint[];
    destination: RoutePoint;
    travelMode?: string;
  }): string {
    return buildGoogleMapsDirectionsUrl(params);
  }

  public buildSegmentUrl(params: {
    from: RoutePoint;
    to: RoutePoint;
    transportType: RouteTransportType;
  }): string {
    return buildGoogleMapsSegmentUrl(params);
  }
}

/**
 * 預設單例 RoutingProvider
 */
export const defaultRoutingProvider: RoutingProvider = new GoogleMapsUrlProvider();
