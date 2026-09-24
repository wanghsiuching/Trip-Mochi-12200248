/**
 * MapMarker.tsx
 * 
 * 客製化 Leaflet Marker 與 React 徽章元件 (Route Map V2)
 * 
 * 核心規範：
 * 1. 標記顯示 Day 與順序編號（例如 D1-01、D1-02、D2-01）
 * 2. 住宿特殊造型/圖示（Bed/Home 識別），景點/活動為主題序號針
 * 3. 清楚區分：已有 GPS、Geocoding 解析成功、以及不同狀態徽章
 */

import React from 'react';
import L from 'leaflet';
import { NormalizedMapItem, getDayTheme } from './MapProvider';

/**
 * 為 Leaflet 建立客製化 HTML DivIcon
 */
export function createLeafletMarkerIcon(item: NormalizedMapItem, isSelected: boolean): L.DivIcon {
  const theme = getDayTheme(item.dayNum);
  const isStay = item.classification === 'ACCOMMODATION';
  const width = isSelected ? (isStay ? 72 : 68) : (isStay ? 62 : 58);
  const height = isSelected ? 48 : 42;

  // 乾淨逃逸名稱字串
  const escapedTitle = (item.title || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const badgeContent = isStay 
    ? `🏨 ${item.markerCode}`
    : item.markerCode;

  const html = `
    <div class="relative group cursor-pointer select-none" style="width: ${width}px; height: ${height}px;">
      <!-- 點擊選取光環波紋 -->
      ${isSelected ? `
        <div 
          class="absolute -inset-1.5 rounded-full animate-ping opacity-40" 
          style="background-color: ${isStay ? '#7C3AED' : theme.primary};"
        ></div>
      ` : ''}

      <!-- 標記主體膠囊 -->
      <div 
        class="relative flex flex-col items-center justify-center transition-transform duration-200 ${
          isSelected ? 'scale-110 z-30' : 'hover:scale-105 z-20'
        }"
      >
        <!-- 頂部膠囊牌 -->
        <div 
          style="
            background-color: ${isSelected ? (isStay ? '#6D28D9' : theme.dark) : (isStay ? '#7C3AED' : theme.primary)};
            border: 2px solid #FFFDF9;
            box-shadow: 0 4px 10px rgba(74, 62, 61, 0.28);
            color: #FFFFFF;
          "
          class="px-2 py-0.5 rounded-full flex items-center gap-1 font-black font-['Zen_Maru_Gothic'] text-[11px] leading-tight tracking-wider"
        >
          <span>${badgeContent}</span>
        </div>

        <!-- 景點名稱浮動微標籤 -->
        <div 
          style="
            background-color: rgba(255, 253, 249, 0.96);
            border: 1px solid ${isStay ? '#D8B4FE' : theme.border};
            color: #4A3E3D;
            max-width: 96px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.12);
          "
          class="mt-0.5 px-1.5 py-0.2 rounded-md text-[9px] font-bold truncate text-center ${
            isSelected ? 'block font-black' : 'hidden group-hover:block'
          }"
        >
          ${escapedTitle}
        </div>

        <!-- 底部定位三角定位針 -->
        <div 
          style="
            width: 0; 
            height: 0; 
            border-left: 5px solid transparent;
            border-right: 5px solid transparent;
            border-top: 6px solid ${isSelected ? (isStay ? '#6D28D9' : theme.dark) : (isStay ? '#7C3AED' : theme.primary)};
            margin-top: 1px;
          "
        ></div>
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'trip-mochi-custom-marker',
    iconSize: [width, height],
    iconAnchor: [width / 2, height - 2],
    popupAnchor: [0, -height + 4],
  });
}

/**
 * 供行程列表與卡片中使用的 React 標記代碼徽章 (例如 D1-01)
 */
export const MapMarkerBadge: React.FC<{
  markerCode: string;
  dayNum: number;
  size?: 'sm' | 'md' | 'lg';
  isUnlocated?: boolean;
  isGeocodingLoading?: boolean;
  classification?: NormalizedMapItem['classification'];
  className?: string;
}> = ({
  markerCode,
  dayNum,
  size = 'md',
  isUnlocated = false,
  isGeocodingLoading = false,
  classification,
  className = '',
}) => {
  const theme = getDayTheme(dayNum);
  const isStay = classification === 'ACCOMMODATION';

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-0.5',
    lg: 'text-sm px-2.5 py-1',
  }[size];

  if (isGeocodingLoading) {
    return (
      <span
        className={`rounded-full border border-amber-300 bg-amber-50 text-amber-600 font-bold font-mono inline-flex items-center justify-center flex-shrink-0 animate-pulse select-none ${sizeClasses} ${className}`}
        title="正在嘗試由地點名稱/地址自動解析 GPS 座標中..."
      >
        ⏳ {markerCode}
      </span>
    );
  }

  if (isUnlocated) {
    return (
      <span
        className={`rounded-full border border-dashed border-gray-300 bg-stone-100 text-stone-400 font-bold font-mono inline-flex items-center justify-center flex-shrink-0 select-none ${sizeClasses} ${className}`}
        title="此地點尚未取得精確 GPS 座標"
      >
        {markerCode}
      </span>
    );
  }

  return (
    <span
      style={{
        backgroundColor: isStay ? '#7C3AED' : theme.primary,
        borderColor: '#FFFDF9',
        color: '#FFFFFF',
        boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
      }}
      className={`rounded-full border-2 font-black font-mono tracking-wider inline-flex items-center justify-center flex-shrink-0 select-none ${sizeClasses} ${className}`}
    >
      {isStay ? `🏨 ${markerCode}` : markerCode}
    </span>
  );
};
