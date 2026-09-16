import { LocationNode } from './types';

/**
 * MapProvider 抽象介面
 * 保持完全解耦，不依賴任何第三方收費地圖 SDK / Google Maps JavaScript API
 */
export interface MapProvider {
  name: string;
  openLocation(location: LocationNode): void;
  openRoute(origin: LocationNode, destination: LocationNode): void;
}

/**
 * 預設外部免收費 MapProvider 實作 (ExternalMapProvider)
 * 透過瀏覽器安全視窗開啟 Google Maps 官方 Web URL / Directions URL
 * 零 API Key、零額外計費、斷網時不拋出異常
 */
export class ExternalMapProvider implements MapProvider {
  public readonly name = 'External Google Maps (Free URL)';

  /**
   * 開啟單一地點查詢
   */
  public openLocation(location: LocationNode): void {
    if (typeof window === 'undefined') return;

    // 1. 若有經緯度，優先以精確座標導航
    if (location.latitude && location.longitude) {
      const latLng = `${location.latitude},${location.longitude}`;
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(latLng)}`,
        '_blank',
        'noopener,noreferrer'
      );
      return;
    }

    // 2. 若有地址或名稱，進行關鍵字查詢
    const query = [
      location.city,
      location.name,
      location.code ? `(${location.code})` : '',
      location.address
    ].filter(Boolean).join(' ').trim();

    if (query) {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`,
        '_blank',
        'noopener,noreferrer'
      );
    }
  }

  /**
   * 開啟兩點路線規劃
   */
  public openRoute(origin: LocationNode, destination: LocationNode): void {
    if (typeof window === 'undefined') return;

    const originQuery = [origin.city, origin.name, origin.code].filter(Boolean).join(' ').trim();
    const destQuery = [destination.city, destination.name, destination.code].filter(Boolean).join(' ').trim();

    if (originQuery && destQuery) {
      const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(originQuery)}&destination=${encodeURIComponent(destQuery)}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    } else if (destQuery) {
      this.openLocation(destination);
    }
  }
}

/**
 * 預設單例提供者實例
 */
export const defaultMapProvider: MapProvider = new ExternalMapProvider();
