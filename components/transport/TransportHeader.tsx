import React from 'react';
import { Clock } from 'lucide-react';
import { TransportType } from './types';
import { TransportIcon } from './TransportIcon';

interface TransportHeaderProps {
  type: TransportType;
  operator?: string;
  operatorSub?: string;
  serviceNumber?: string;
  totalDuration?: string;
  directionType?: 'oneway' | 'roundtrip' | 'outbound' | 'inbound';
  className?: string;
}

export const TransportHeader: React.FC<TransportHeaderProps> = ({
  type,
  operator,
  operatorSub,
  serviceNumber,
  totalDuration,
  directionType,
  className = '',
}) => {
  const getDirectionBadge = () => {
    switch (directionType) {
      case 'outbound':
        return { label: '去程', bg: 'bg-[#EBF3EE] text-[#2E5A44] border-[#D4E5DB]' };
      case 'inbound':
        return { label: '回程', bg: 'bg-[#F2EDFA] text-[#634882] border-[#E1D7F2]' };
      case 'oneway':
        return { label: '單程', bg: 'bg-[#F4F1EA] text-[#6E6454] border-[#E5DFD4]' };
      default:
        return null;
    }
  };

  const directionBadge = getDirectionBadge();

  return (
    <div className={`flex items-center justify-between pb-3 border-b border-[#EFECE6] ${className}`}>
      {/* 左側：圖標 + 營運商 + 班次代號 */}
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <TransportIcon type={type} size={18} />

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* 班次代碼 (Level 1 核心視覺) */}
            {serviceNumber && (
              <span className="font-mono text-base sm:text-lg font-black text-[#1F1C18] tracking-tight">
                {serviceNumber}
              </span>
            )}

            {/* 方向標籤 (去程 / 回程) */}
            {directionBadge && (
              <span className={`text-[10px] font-black px-1.5 py-0.2 rounded border ${directionBadge.bg}`}>
                {directionBadge.label}
              </span>
            )}
          </div>

          {/* 營運商名稱 */}
          {(operator || operatorSub) && (
            <div className="flex items-center gap-1 text-xs text-[#7A7162] font-bold truncate">
              {operator && <span>{operator}</span>}
              {operatorSub && (
                <span className="text-[11px] font-normal text-[#998F7F] hidden sm:inline">
                  {operatorSub}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 右側：總時長標籤 */}
      {totalDuration && (
        <div className="flex items-center gap-1 text-xs font-black font-mono text-[#6E6454] bg-[#F5F2EA] px-2.5 py-1 rounded-full border border-[#E8E2D5] flex-shrink-0">
          <Clock size={12} className="text-[#8C806F]" />
          <span>{totalDuration}</span>
        </div>
      )}
    </div>
  );
};
