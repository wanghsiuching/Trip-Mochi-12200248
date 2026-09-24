/**
 * MapPopup.tsx
 * 
 * 地圖 Marker 彈出視窗 (Route Map V2)
 * 顯示項目所屬 Day、順序代碼 (D1-02)、景點名稱、預約時間、分類標籤、定位狀態與外部導航連結
 */

import React from 'react';
import { Clock, MapPin, FileText, ArrowRight, ExternalLink, Compass } from 'lucide-react';
import { NormalizedMapItem, getDayTheme } from './MapProvider';
import { getExternalGoogleMapsUrl, resolveLocationData } from './locationUtils';

interface MapPopupProps {
  item: NormalizedMapItem;
  onViewInSchedule?: (item: NormalizedMapItem) => void;
  onClose?: () => void;
  className?: string;
}

export const MapPopup: React.FC<MapPopupProps> = ({
  item,
  onViewInSchedule,
  onClose,
  className = ''
}) => {
  const theme = getDayTheme(item.dayNum);

  // 取得外部 Google Maps 連結 (有原始 URL 就直接開原始 URL，絕不二次包裝損毀)
  const resolved = resolveLocationData(item.originalItem, item.title);
  const externalMapsUrl = getExternalGoogleMapsUrl(resolved);

  return (
    <div className={`p-4 bg-[#FFFDF9] rounded-2xl w-72 max-w-[85vw] font-['Zen_Maru_Gothic'] text-[#4A3E3D] select-none ${className}`}>
      {/* 頂部序號與 Day 標籤 */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <span
            style={{ backgroundColor: item.classification === 'ACCOMMODATION' ? '#7C3AED' : theme.primary }}
            className="px-2 py-0.5 rounded-full text-white text-[11px] font-black font-mono shadow-sm tracking-wide"
          >
            {item.markerCode}
          </span>
          <span
            style={{
              backgroundColor: theme.light,
              color: theme.dark,
              borderColor: theme.border,
            }}
            className="px-2 py-0.5 rounded-full text-[10px] font-black border"
          >
            Day {item.dayNum} · {item.classificationLabel}
          </span>
        </div>

        {item.time && (
          <div className="flex items-center gap-1 text-[11px] font-bold text-gray-500">
            <Clock size={12} className="text-[#88C9A1]" />
            <span>{item.time}</span>
          </div>
        )}
      </div>

      {/* 景點名稱 */}
      <h4 className="text-sm font-black text-[#4A3E3D] leading-snug mb-1.5 line-clamp-2">
        {item.title}
      </h4>

      {/* 地址 */}
      {item.address && (
        <div className="flex items-start gap-1 text-[11px] text-gray-600 mb-2 leading-relaxed">
          <MapPin size={13} className="text-[#88C9A1] flex-shrink-0 mt-0.5" />
          <span className="line-clamp-2">{item.address}</span>
        </div>
      )}

      {/* 定位來源標記 */}
      <div className="flex items-center gap-1.5 text-[10px] text-stone-500 mb-2 bg-[#F7F4EB] px-2 py-1 rounded-lg">
        <Compass size={11} className="text-[#5B8266]" />
        <span>來源：{
          item.locationSource === 'manual_gps' ? '手動 GPS 座標' :
          item.locationSource === 'google_url' ? 'Google Maps 網址座標' :
          item.locationSource === 'geocoding' ? '地理編碼快取 (OSM)' : '文字標記'
        }</span>
      </div>

      {/* 備註 (若有) */}
      {item.notes && (
        <div className="p-2 bg-[#F7F4EB] rounded-xl text-[10px] text-stone-600 mb-3 border border-[#E0E5D5]/60 flex items-start gap-1.5">
          <FileText size={12} className="text-stone-400 flex-shrink-0 mt-0.5" />
          <span className="line-clamp-2">{item.notes}</span>
        </div>
      )}

      {/* 座標狀態 */}
      {!item.hasCoordinates && (
        <div className="text-[10px] text-amber-700 bg-amber-50 px-2 py-1 rounded-lg mb-2 font-bold border border-amber-200">
          尚未取得精確 GPS 座標 (點擊 Google Maps 進行外部地圖查詢)
        </div>
      )}

      {/* 操作按鈕群：[查看行程] 與 [Google Maps] */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E0E5D5]/80">
        {onViewInSchedule && (
          <button
            type="button"
            onClick={() => {
              onViewInSchedule(item);
              if (onClose) onClose();
            }}
            className="w-full py-1.5 px-2 bg-white hover:bg-[#F7F4EB] border border-[#E0E5D5] text-[#5B8266] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-sm active:scale-95 cursor-pointer"
          >
            <span>查看行程</span>
            <ArrowRight size={12} />
          </button>
        )}
        <a
          href={externalMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="w-full py-1.5 px-2 bg-[#5B8266] hover:bg-[#4E7257] text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-hard-sm-sage active:scale-95 text-center"
        >
          <span>Google Maps</span>
          <ExternalLink size={11} />
        </a>
      </div>
    </div>
  );
};
