import React from 'react';
import L from 'leaflet';
import { Info } from 'lucide-react';
import { GeoCoordinate, RoutingProvider, SequenceRoutingProvider, RouteSegment } from './MapProvider';

interface MapRouteProps {
  points: GeoCoordinate[];
  routeSegment?: RouteSegment | null;
  className?: string;
}

/**
 * 建立 Leaflet 行程順序 Polyline
 * 以虛線 (dashed line) 繪製，強調這是順序參考線而非道路行車路線
 */
export function createSequencePolylineLayer(coordinates: [number, number][]): L.Polyline {
  return L.polyline(coordinates, {
    color: '#5B8266',
    weight: 3.5,
    opacity: 0.8,
    dashArray: '6, 8',
    lineCap: 'round',
    lineJoin: 'round',
  });
}

/**
 * 行程順序線浮動說明徽章 (清楚告知使用者非真實道路導航)
 */
export const MapRouteBadge: React.FC<MapRouteProps> = ({
  points,
  routeSegment,
  className = ''
}) => {
  if (points.length < 2) return null;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 backdrop-blur-sm border border-[#E0E5D5] shadow-sm text-[10px] font-bold text-[#4A3E3D] pointer-events-auto select-none ${className}`}
      title="此虛線為景點順序參考線，前往各景點可點選卡片開啟 Google Maps 進行真實路況即時導航"
    >
      <span className="w-2 h-2 rounded-full bg-[#5B8266] animate-pulse flex-shrink-0" />
      <span className="text-[#5B8266]">行程順序線</span>
      <span className="text-gray-300">|</span>
      <span>{points.length} 個標記點</span>
      {routeSegment?.distanceKm !== undefined && routeSegment.distanceKm > 0 && (
        <>
          <span className="text-gray-300">|</span>
          <span className="text-gray-500 font-mono">約 {routeSegment.distanceKm} km</span>
        </>
      )}
      <Info size={11} className="text-gray-400 ml-0.5" />
    </div>
  );
};
