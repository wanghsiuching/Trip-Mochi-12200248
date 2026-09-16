import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Edit3, Trash2, Luggage, DollarSign } from 'lucide-react';
import { TransportItemModel } from './types';
import { TransportHeader } from './TransportHeader';
import { TransportRoute } from './TransportRoute';
import { TransportDetails } from './TransportDetails';
import { FlightTransportCard } from './FlightTransportCard';

interface TransportCardProps {
  item: TransportItemModel;
  defaultExpanded?: boolean;
  onEdit?: (item: TransportItemModel) => void;
  onDelete?: (item: TransportItemModel) => void;
  onOpenMap?: () => void;
  className?: string;
}

export const TransportCard: React.FC<TransportCardProps> = ({
  item,
  defaultExpanded = false,
  onEdit,
  onDelete,
  onOpenMap,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (item.type === 'flight') {
    return (
      <FlightTransportCard
        item={item}
        defaultExpanded={defaultExpanded}
        onEdit={onEdit}
        onDelete={onDelete}
        onOpenMap={onOpenMap}
        className={className}
      />
    );
  }

  const baggage = item.baggage;
  const cost = item.cost;
  const currency = item.currency || 'TWD';
  const seat = item.seat;

  return (
    <div
      className={`w-full bg-white rounded-3xl border border-[#E8E3D8] shadow-xs hover:border-[#D6CDBF] transition-all p-4 sm:p-5 relative ${className}`}
    >
      {/* 頂部操作按鈕 (編輯 / 刪除) */}
      {(onEdit || onDelete) && (
        <div className="absolute top-4 right-4 flex items-center gap-1 z-10">
          {onEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(item);
              }}
              className="p-1.5 rounded-full text-[#9C9180] hover:text-[#2E5A44] hover:bg-[#F3F6F4] transition-colors"
              title="編輯"
            >
              <Edit3 size={14} />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item);
              }}
              className="p-1.5 rounded-full text-[#9C9180] hover:text-[#C54E4E] hover:bg-[#FDF2F2] transition-colors"
              title="刪除"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      )}

      {/* 1. Header (Level 1 識別) */}
      <TransportHeader
        type={item.type}
        operator={item.operator}
        operatorSub={item.operatorSub}
        serviceNumber={item.serviceNumber}
        totalDuration={item.totalDuration}
        directionType={item.directionType}
        className={(onEdit || onDelete) ? 'pr-16' : ''}
      />

      {/* 2. Route (Level 2 & 3 時間、路線、轉乘節點) */}
      <TransportRoute
        segments={item.segments}
        primaryType={item.type}
        totalDuration={item.totalDuration}
      />

      {/* 3. 摘要快捷資訊列 (Level 4/5 輕量預覽) */}
      <div className="mt-1 pt-2.5 border-t border-[#F5F2EA] flex items-center justify-between text-[11px] font-bold text-[#7A7162] flex-wrap gap-2">
        <div className="flex items-center gap-2.5 flex-wrap">
          {baggage?.checked && (
            <span className="flex items-center gap-1 text-[#4A443B]">
              <Luggage size={12} className="text-[#3E7B62]" />
              <span>託運 {baggage.checked}</span>
            </span>
          )}

          {baggage?.carryOn && (
            <span className="flex items-center gap-1 text-[#4A443B]">
              <span className="text-[#C47D3B]">🎒</span>
              <span>手提 {baggage.carryOn}</span>
            </span>
          )}

          {seat && (
            <span className="flex items-center gap-1 text-[#4A443B]">
              <span>💺</span>
              <span>{seat}</span>
            </span>
          )}
        </div>

        {cost !== undefined && cost > 0 && (
          <div className="flex items-center gap-0.5 font-mono text-xs font-black text-[#2E5A44] ml-auto">
            <DollarSign size={12} className="-mr-0.5" />
            <span>{currency} {cost.toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* 4. 詳細資訊展開區塊 (Level 5) */}
      {isExpanded && (
        <TransportDetails
          item={item}
          onOpenMap={onOpenMap}
        />
      )}

      {/* 5. 展開 / 收合 切換按鈕 */}
      <div className="mt-2.5 pt-1.5 flex justify-center">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs font-black text-[#8C806F] hover:text-[#4A4235] flex items-center gap-1 px-3 py-1 rounded-full hover:bg-[#F7F4EE] transition-colors"
        >
          <span>{isExpanded ? '收合詳細資訊' : '查看詳細資訊'}</span>
          {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>
    </div>
  );
};
