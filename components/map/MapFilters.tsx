/**
 * MapFilters.tsx
 * 
 * 日期切換器 (Day Filter) 與行程分類篩選器 (Route Map V2)
 * 支援七大互斥分類篩選與動態天數過濾
 */

import React from 'react';
import { Calendar, Layers, MapPin, Bed, Train, Plane, Footprints, MoreHorizontal, Sparkles } from 'lucide-react';
import { getDayTheme } from './MapProvider';
import { MapItemClassification } from './MapTypes';

export type FilterCategory = 'all' | MapItemClassification;

export interface DayOption {
  dayNum: number;      // 1, 2, 3...
  dayCode: string;     // D1, D2, D3...
  dateStr?: string;    // 2026-09-20
  label?: string;      // 例如 "9/20 週六"
  totalScheduleCount: number;
  totalMapStops: number;
  locatedStopsCount: number;
}

interface MapFiltersProps {
  // 日期切換
  dayOptions: DayOption[];
  selectedDay: number | 'all'; // 'all' 代表全部旅程
  onSelectDay: (day: number | 'all') => void;

  // 分類過濾
  selectedCategory: FilterCategory;
  onSelectCategory: (category: FilterCategory) => void;
  categoryCounts?: Partial<Record<FilterCategory, number>>;
  
  className?: string;
}

const CATEGORY_ITEMS: { id: FilterCategory; label: string; icon: React.FC<{ size?: number; className?: string }> }[] = [
  { id: 'all', label: '全部項目', icon: Layers },
  { id: 'PLACE', label: '景點/地標', icon: MapPin },
  { id: 'ACCOMMODATION', label: '住宿', icon: Bed },
  { id: 'TRANSPORT', label: '交通移動', icon: Train },
  { id: 'FLIGHT', label: '航班', icon: Plane },
  { id: 'ACTIVITY', label: '活動', icon: Sparkles },
  { id: 'FREE_ACTIVITY', label: '自由漫遊', icon: Footprints },
  { id: 'OTHER', label: '其他', icon: MoreHorizontal },
];

export const MapFilters: React.FC<MapFiltersProps> = ({
  dayOptions,
  selectedDay,
  onSelectDay,
  selectedCategory,
  onSelectCategory,
  categoryCounts = {},
  className = '',
}) => {
  return (
    <div className={`space-y-2 select-none ${className}`}>
      {/* 1. 日期切換列 (Day Selector) */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 px-1 touch-pan-x">
        {/* [全部] 按鈕 */}
        <button
          type="button"
          onClick={() => onSelectDay('all')}
          className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black transition-all border shadow-sm cursor-pointer ${
            selectedDay === 'all'
              ? 'bg-[#4A3E3D] border-[#4A3E3D] text-white shadow-sm scale-105'
              : 'bg-white/90 backdrop-blur-sm border-[#E0E5D5] text-[#4A3E3D] hover:border-[#88C9A1]'
          }`}
        >
          <Calendar size={13} className={selectedDay === 'all' ? 'text-white' : 'text-[#88C9A1]'} />
          <span className="whitespace-nowrap">全部日程</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold leading-tight ${
              selectedDay === 'all' ? 'bg-white/20 text-white' : 'bg-[#F7F4EB] text-gray-500'
            }`}
          >
            {dayOptions.reduce((acc, d) => acc + d.locatedStopsCount, 0)} 站已定位
          </span>
        </button>

        {/* 動態產生各天 [Day 1] [Day 2] ... */}
        {dayOptions.map((opt) => {
          const isSelected = selectedDay === opt.dayNum;
          const theme = getDayTheme(opt.dayNum);

          return (
            <button
              key={opt.dayNum}
              type="button"
              onClick={() => onSelectDay(opt.dayNum)}
              style={
                isSelected
                  ? {
                      backgroundColor: theme.primary,
                      borderColor: theme.primary,
                      color: '#FFFFFF',
                    }
                  : undefined
              }
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black transition-all border shadow-sm cursor-pointer ${
                isSelected
                  ? 'shadow-sm scale-105'
                  : 'bg-white/90 backdrop-blur-sm border-[#E0E5D5] text-[#4A3E3D] hover:border-[#88C9A1]'
              }`}
            >
              <span
                style={
                  !isSelected
                    ? {
                        backgroundColor: theme.light,
                        color: theme.dark,
                        borderColor: theme.border,
                      }
                    : { backgroundColor: 'rgba(255,255,255,0.25)', color: '#FFFFFF' }
                }
                className="w-5 h-5 rounded-full text-[10px] font-mono font-black flex items-center justify-center"
              >
                {opt.dayCode}
              </span>
              <span className="whitespace-nowrap font-bold">
                Day {opt.dayNum}
              </span>
              {opt.totalMapStops > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold leading-tight ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-[#F7F4EB] text-gray-500'
                  }`}
                  title={`${opt.locatedStopsCount} 個站點已定位 / 共 ${opt.totalMapStops} 個地圖站點 (含行程 ${opt.totalScheduleCount} 項)`}
                >
                  {opt.locatedStopsCount}/{opt.totalMapStops} 站
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 2. 分類篩選列 (Category Filters) */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar px-1 touch-pan-x">
        {CATEGORY_ITEMS.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const count = categoryCounts[cat.id] ?? 0;
          const Icon = cat.icon;

          // 數量為 0 時亦可顯示，但視覺低調
          if (cat.id !== 'all' && count === 0) return null;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all border ${
                isSelected
                  ? 'bg-[#88C9A1] border-[#88C9A1] text-white'
                  : 'bg-white/80 border-stone-200 text-stone-600 hover:text-[#5B8266] hover:border-[#88C9A1]'
              }`}
            >
              <Icon size={12} className={isSelected ? 'text-white' : 'text-stone-400'} />
              <span>{cat.label}</span>
              {count > 0 && (
                <span className={`text-[9px] px-1 rounded-full font-mono ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-500'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
