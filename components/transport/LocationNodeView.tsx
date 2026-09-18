import React from 'react';
import { LocationNode } from './types';

interface LocationNodeViewProps {
  location: LocationNode;
  align?: 'left' | 'right' | 'center';
  role?: 'departure' | 'arrival' | 'waypoint';
  defaultCity?: string;
  defaultTimeLabel?: string;
}

export const LocationNodeView: React.FC<LocationNodeViewProps> = ({
  location,
  align = 'left',
  role = 'departure',
  defaultCity,
  defaultTimeLabel,
}) => {
  const isRight = align === 'right';
  const cityName = location.city || defaultCity || location.name;
  const isCodeDistinct = location.code && location.code.toUpperCase() !== cityName.toUpperCase();
  const timeLabel = location.timeZoneLabel || defaultTimeLabel || (role === 'departure' ? '出發時間' : '抵達時間');

  return (
    <div className={`flex flex-col min-w-0 ${isRight ? 'items-end text-right' : 'items-start text-left'}`}>
      {/* 城市與機場/車站代碼 (Level 3) */}
      <div className={`flex items-baseline gap-1.5 flex-wrap ${isRight ? 'justify-end' : 'justify-start'}`}>
        <span className="text-sm sm:text-base font-black text-[#2D2A26] tracking-tight break-words">
          {cityName}
        </span>
        {isCodeDistinct && (
          <span className="text-xs sm:text-sm font-black font-mono text-[#7A7265] tracking-wider">
            {location.code}
          </span>
        )}
      </div>

      {/* 時間 (Level 2 - 顯眼、容易掃視) */}
      <div className="font-mono text-2xl sm:text-[28px] font-black text-[#1F1C18] tracking-tight leading-none mt-1">
        {location.time || '--:--'}
      </div>

      {/* 時間標籤與日期 (Level 3 / 輔助) */}
      <div className="flex items-center gap-1 mt-1 text-[11px] font-bold text-[#8C8272] flex-wrap">
        <span>{timeLabel}</span>
        {location.date && (
          <span className="text-[10px] font-mono opacity-85">
            ({location.date.length > 5 ? location.date.slice(5) : location.date})
          </span>
        )}
      </div>

      {/* 航廈 / 月台 / 登機門 (若有) */}
      {(location.terminal || location.platform || location.gate) && (
        <div className={`mt-1 flex items-center gap-1 text-[10px] font-black ${isRight ? 'justify-end' : 'justify-start'}`}>
          {location.terminal && (
            <span className="px-1.5 py-0.5 rounded bg-[#F4F1EA] text-[#5C5447] border border-[#E8E3D8]">
              {location.terminal}
            </span>
          )}
          {location.platform && (
            <span className="px-1.5 py-0.5 rounded bg-[#F4F1EA] text-[#5C5447] border border-[#E8E3D8]">
              {location.platform}
            </span>
          )}
          {location.gate && (
            <span className="px-1.5 py-0.5 rounded bg-[#FAF2EB] text-[#8C5228] border border-[#EED7C5]">
              登機門 {location.gate}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
