/**
 * RoutePolyline.tsx
 * 
 * 每日行程順序線繪製與路線狀態資訊徽章 (Route Map V2)
 * 
 * 核心原則：
 * 1. 嚴格依照行程時間與順序 (① → ② → ③) 繪製
 * 2. 僅連線具備有效經緯度之 Map Stops (排除交通/航班/自由活動)
 * 3. 遇到未定位之 Stop，中斷形成獨立區段，絕不直連假造連線
 * 4. 每日獨立主題色票，全旅程模式各天互不相連
 */

import React from 'react';
import L from 'leaflet';
import { Info, AlertTriangle, CheckCircle2, Loader2, MapPin } from 'lucide-react';
import { getDayTheme, RouteInspectionReport, NormalizedMapItem, SequenceRoutingProvider } from './MapProvider';

/**
 * 建立 Leaflet 順序線 Polyline 圖層
 */
export function createDayPolylineLayer(
  coordinates: [number, number][],
  dayNum: number,
  isAllDaysMode: boolean = false
): L.Polyline {
  const theme = getDayTheme(dayNum);

  return L.polyline(coordinates, {
    color: theme.primary,
    weight: isAllDaysMode ? 3.5 : 4,
    opacity: 0.85,
    dashArray: '7, 9',
    lineCap: 'round',
    lineJoin: 'round',
  });
}

/**
 * 為整天項目建立所有連續線段圖層
 * 若中間有缺失 GPS 之站點，將自動分段，絕不跨越未定位站點假裝直連
 */
export function createDayRouteLayers(
  items: NormalizedMapItem[],
  dayNum: number,
  isAllDaysMode: boolean = false
): L.LayerGroup {
  const layerGroup = L.layerGroup();
  const routing = new SequenceRoutingProvider();
  const { continuousSegments } = routing.calculateDailyRouteSegments(items);

  for (const seg of continuousSegments) {
    if (seg.length >= 2) {
      const polyline = createDayPolylineLayer(seg, dayNum, isAllDaysMode);
      layerGroup.addLayer(polyline);
    }
  }

  return layerGroup;
}

interface RouteInspectionCardProps {
  report: RouteInspectionReport;
  isAllDaysMode?: boolean;
  className?: string;
  onOpenGoogleMapsNav?: () => void;
}

/**
 * 行程順序檢查與統計卡片
 * 客觀呈現當前日期的站點定位率、順序連線距離與可能提醒
 */
export const RouteInspectionCard: React.FC<RouteInspectionCardProps> = ({
  report,
  isAllDaysMode = false,
  className = '',
  onOpenGoogleMapsNav,
}) => {
  const theme = getDayTheme(report.dayNum);

  return (
    <div
      className={`bg-white/95 backdrop-blur-md rounded-2xl border border-[#E0E5D5] p-3 shadow-sm text-[#4A3E3D] font-['Zen_Maru_Gothic'] select-none ${className}`}
    >
      {/* 標題與每日標籤 */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5">
          <span
            style={{ backgroundColor: theme.primary }}
            className="w-2.5 h-2.5 rounded-full inline-block animate-pulse"
          />
          <span className="text-xs font-black text-[#4A3E3D]">
            {isAllDaysMode ? '全旅程路線綜覽' : `Day ${report.dayNum} 行程順序線`}
          </span>
          <span
            style={{
              backgroundColor: theme.light,
              color: theme.dark,
              borderColor: theme.border,
            }}
            className="text-[10px] font-black px-2 py-0.2 rounded-full border"
          >
            {report.dayCode}
          </span>
        </div>

        {/* 距離摘要 */}
        {report.estimatedDistanceKm > 0 && (
          <span className="text-[11px] font-bold text-gray-500 font-mono">
            連線直線約 {report.estimatedDistanceKm} km
          </span>
        )}
      </div>

      {/* 定位狀態條 (精確反映地圖站點) */}
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-600 mb-2">
        <div className="flex items-center gap-1">
          <MapPin size={12} className="text-[#5B8266]" />
          <span>地圖站點 <strong>{report.totalMapStops}</strong> 處</span>
        </div>
        <span className="text-gray-300">|</span>
        <div className="flex items-center gap-1 text-[#5B8266] font-bold">
          <CheckCircle2 size={12} />
          <span>已定位 {report.locatedStops}</span>
        </div>

        {report.pendingGeocodingStops > 0 && (
          <>
            <span className="text-gray-300">|</span>
            <div className="flex items-center gap-1 text-amber-600 font-bold">
              <Loader2 size={11} className="animate-spin" />
              <span>自動定位中 {report.pendingGeocodingStops}</span>
            </div>
          </>
        )}

        {report.unlocatedStops > 0 && (
          <>
            <span className="text-gray-300">|</span>
            <span className="text-stone-500 font-medium">
              待指定座標 {report.unlocatedStops}
            </span>
          </>
        )}
      </div>

      {/* 提示訊息 (若有缺點或長跨距) */}
      {report.warnings.length > 0 && (
        <div className="bg-[#FFFDF9] border border-amber-200/80 rounded-xl p-2 mb-2 flex items-start gap-1.5 text-[10px] text-amber-900 leading-snug">
          <AlertTriangle size={13} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            {report.warnings.map((w, idx) => (
              <p key={idx}>{w}</p>
            ))}
          </div>
        </div>
      )}

      {/* 底部說明與導航按鈕 */}
      <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1.5 border-t border-[#E0E5D5]/60">
        <div className="flex items-center gap-1">
          <Info size={11} className="text-gray-400" />
          <span>順序連線供空間動線檢查 · 避開折返繞路</span>
        </div>
        {onOpenGoogleMapsNav && report.locatedStops >= 2 && (
          <button
            type="button"
            onClick={onOpenGoogleMapsNav}
            className="text-[10px] font-bold text-[#5B8266] hover:underline flex items-center gap-0.5 cursor-pointer ml-auto"
          >
            <span>Google Maps 真實路況</span>
          </button>
        )}
      </div>
    </div>
  );
};
