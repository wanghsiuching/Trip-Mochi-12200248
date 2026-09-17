import React, { useState } from 'react';
import { 
  Train, 
  Clock, 
  ChevronRight, 
  ChevronDown, 
  ChevronUp, 
  MapPin, 
  Edit3, 
  Trash2,
  ArrowRight,
  Hash,
  DollarSign
} from 'lucide-react';
import { TransportItemModel, TransportSegmentModel } from './types';
import { defaultMapProvider } from './MapProvider';
import { TransportDetails } from './TransportDetails';

interface TrainTransportCardProps {
  item: TransportItemModel;
  defaultExpanded?: boolean;
  onEdit?: (item: TransportItemModel) => void;
  onDelete?: (item: TransportItemModel) => void;
  onOpenMap?: () => void;
  className?: string;
}

export const TrainTransportCard: React.FC<TrainTransportCardProps> = ({
  item,
  defaultExpanded = false,
  onEdit,
  onDelete,
  onOpenMap,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const segments = item.segments || [];
  const firstSeg: TransportSegmentModel | undefined = segments[0];
  const lastSeg: TransportSegmentModel | undefined = segments[segments.length - 1];

  // 出發與抵達節點
  const rawDep = firstSeg?.departure;
  const rawArr = lastSeg?.arrival;

  const depStation = rawDep?.name || item.rawBookingTrain?.fromStation || '出發站';
  const arrStation = rawArr?.name || item.rawBookingTrain?.toStation || '抵達站';

  const depTime = rawDep?.time || item.rawBookingTrain?.departureTime || '--:--';
  const arrTime = rawArr?.time || item.rawBookingTrain?.arrivalTime || '--:--';

  const depPlatform = rawDep?.platform || item.departurePlatform || item.platform;
  const arrPlatform = rawArr?.platform || item.arrivalPlatform;

  // 營運商與車次編號
  const operatorName = item.operator || item.rawBookingTrain?.operator || '鐵路運輸';
  const operatorSub = item.operatorSub || item.rawBookingTrain?.operatorSub || item.rawBookingTrain?.trainName || '';
  const serviceNumber = (item.serviceNumber || item.rawBookingTrain?.code || item.rawBookingTrain?.serviceNumber || 'TRAIN').toUpperCase();

  // 總行車時間
  const duration = item.totalDuration || item.rawBookingTrain?.duration || '';

  // 轉乘資訊
  const hasTransfer = segments.length > 1 || Boolean(firstSeg?.transferAfter) || Boolean(item.rawBookingTrain?.hasTransfer);
  const transferInfo = firstSeg?.transferAfter;

  const handleOpenMap = () => {
    if (onOpenMap) {
      onOpenMap();
      return;
    }
    if (rawDep && rawArr) {
      defaultMapProvider.openRoute(rawDep, rawArr);
    }
  };

  return (
    <div 
      className={`w-full bg-[#FCFBF8] rounded-[1.75rem] border border-[#E5DFD3] shadow-xs hover:border-[#D6CDBF] transition-all p-4 sm:p-5 relative ${className}`}
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
              className="p-1.5 rounded-full text-[#9C9180] hover:text-[#2E5A44] hover:bg-[#F3F6F4] transition-colors cursor-pointer"
              title="編輯"
            >
              <Edit3 size={13} />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item);
              }}
              className="p-1.5 rounded-full text-[#9C9180] hover:text-[#C54E4E] hover:bg-[#FDF2F2] transition-colors cursor-pointer"
              title="刪除"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 一、頂部標題區 (火車標誌 + 營運商 + 車次膠囊 + 乘車時間)                    */}
      {/* ========================================================================= */}
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#EFEBE3]">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* 火車圖示徽章 */}
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#EAF3EE] text-[#3E7B62] border border-[#D5E5DC] flex items-center justify-center flex-shrink-0 shadow-2xs">
            <Train size={18} strokeWidth={2.2} />
          </div>

          {/* 營運商名稱與車次 */}
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm sm:text-base font-black text-[#2D2A26] tracking-tight truncate">
                {operatorName}
              </span>
              {serviceNumber && (
                <span className="font-mono text-[10px] sm:text-[11px] font-black bg-[#EFECE4] text-[#5A5043] px-1.5 py-0.5 rounded-md border border-[#E0D9CC]">
                  {serviceNumber}
                </span>
              )}
            </div>
            {operatorSub && (
              <span className="text-[11px] font-medium text-[#8C8272] truncate">
                {operatorSub}
              </span>
            )}
          </div>
        </div>

        {/* 右側：時長膠囊 (含點擊展開箭頭) */}
        {duration && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="border border-[#DCD5CA] bg-white hover:bg-[#F8F6F0] active:scale-95 rounded-full px-2.5 sm:px-3 py-1 text-xs font-black text-[#4B443D] flex items-center gap-1.5 flex-shrink-0 transition-all shadow-2xs cursor-pointer"
            title="查看火車詳情"
          >
            <Clock size={12} className="text-[#6D6357]" />
            <span className="font-mono tracking-tight">{duration}</span>
            <ChevronRight 
              size={12} 
              className={`text-[#8C827A] transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} 
            />
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 二、主要路線區域 (出發站 - 鐵道軌跡/轉乘 - 抵達站)                         */}
      {/* ========================================================================= */}
      <div className="pt-3.5 pb-2.5">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          {/* 左：出發站 */}
          <div className="min-w-0">
            <div className="inline-block bg-[#F2EDE2] text-[#7A6448] text-[10px] font-black px-2 py-0.5 rounded mb-1 shadow-2xs">
              發車
            </div>
            <div className="font-mono text-2xl sm:text-3xl font-black text-[#2D2A26] tracking-tight leading-none mb-1">
              {depTime}
            </div>
            <div className="text-xs sm:text-sm font-black text-[#4A4235] truncate leading-tight">
              {depStation}
            </div>
            {depPlatform && (
              <div className="inline-flex items-center gap-1 text-[10px] font-bold text-[#8C6219] bg-[#FFF8EB] border border-[#F3E3C6] px-1.5 py-0.5 rounded mt-1">
                <span>月台</span>
                <span className="font-mono font-black">{depPlatform.replace(/^(月台|Track)\s*/i, '')}</span>
              </div>
            )}
          </div>

          {/* 中間：鐵道路線軌跡與轉乘標記 */}
          <div className="flex flex-col items-center justify-center px-1">
            <div className="text-[10px] font-mono text-[#8C806F] mb-1 font-bold">
              {hasTransfer ? '轉乘路線' : '直達列車'}
            </div>

            {/* 軌道視覺線 */}
            <div className="flex items-center gap-1 w-16 sm:w-24">
              <div className="w-1.5 h-1.5 rounded-full bg-[#3E7B62]" />
              <div className="flex-1 h-0.5 bg-[#D2C8B8] border-t border-b border-dashed border-[#A89C8A]" />
              <div className="w-4 h-4 rounded-full bg-[#F0ECE2] border border-[#D5CDBD] flex items-center justify-center text-[9px] text-[#5A5040]">
                🚆
              </div>
              <div className="flex-1 h-0.5 bg-[#D2C8B8] border-t border-b border-dashed border-[#A89C8A]" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#3E7B62]" />
            </div>

            {/* 轉乘節點提示 (例如: 經 伯恩 Bern) */}
            {hasTransfer && transferInfo && (
              <div className="mt-1 text-[9px] font-black text-[#96631E] bg-[#FFF8EA] border border-[#F3E3C4] px-1.5 py-0.5 rounded-full text-center truncate max-w-[100px]">
                經 {transferInfo.location.name}
              </div>
            )}
          </div>

          {/* 右：抵達站 */}
          <div className="min-w-0 text-right">
            <div className="inline-block bg-[#E8EFEA] text-[#33684F] text-[10px] font-black px-2 py-0.5 rounded mb-1 shadow-2xs">
              抵達
            </div>
            <div className="font-mono text-2xl sm:text-3xl font-black text-[#2D2A26] tracking-tight leading-none mb-1">
              {arrTime}
            </div>
            <div className="text-xs sm:text-sm font-black text-[#4A4235] truncate leading-tight">
              {arrStation}
            </div>
            {arrPlatform && (
              <div className="inline-flex items-center gap-1 text-[10px] font-bold text-[#8C6219] bg-[#FFF8EB] border border-[#F3E3C6] px-1.5 py-0.5 rounded mt-1">
                <span>月台</span>
                <span className="font-mono font-black">{arrPlatform.replace(/^(月台|Track)\s*/i, '')}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 三、摘要快速標籤列 (月台 / 車廂 / 座位 / 席等 / 票價)                       */}
      {/* ========================================================================= */}
      <div className="mt-1 pt-2.5 border-t border-[#EFECE4] flex items-center justify-between text-[11px] font-bold text-[#6D6357] flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {/* 車廂 */}
          {item.carriage && (
            <span className="flex items-center gap-1 text-[#3E7B62] bg-[#EAF3EE] px-2 py-0.5 rounded-lg border border-[#D6E6DC]">
              <span>🚃</span>
              <span>{item.carriage.includes('車') ? item.carriage : `${item.carriage}車`}</span>
            </span>
          )}

          {/* 座位 */}
          {item.seat && (
            <span className="flex items-center gap-1 text-[#4A443B] bg-white px-2 py-0.5 rounded-lg border border-[#E5DFD4]">
              <span>💺</span>
              <span>{item.seat}</span>
            </span>
          )}

          {/* 席別 */}
          {item.classType && (
            <span className="flex items-center gap-1 text-[#785E43] bg-[#F7F3EB] px-2 py-0.5 rounded-lg border border-[#E9E1D2]">
              <span>🎫</span>
              <span>{item.classType}</span>
            </span>
          )}

          {/* 訂位代碼 */}
          {item.bookingReference && (
            <span className="flex items-center gap-1 text-[#5A5040] bg-white px-2 py-0.5 rounded-lg border border-[#E5DFD4] font-mono">
              <Hash size={10} className="text-[#8C806F]" />
              <span>{item.bookingReference}</span>
            </span>
          )}
        </div>

        {/* 費用 */}
        {item.cost !== undefined && item.cost > 0 && (
          <div className="flex items-center gap-0.5 font-mono text-xs font-black text-[#2E5A44] ml-auto">
            <DollarSign size={12} className="-mr-0.5" />
            <span>{item.currency || 'TWD'} {Number(item.cost).toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 四、詳細資訊展開區塊 (含通用手風琴與各段明細)                              */}
      {/* ========================================================================= */}
      <TransportDetails
        item={item}
        onOpenMap={handleOpenMap}
        expanded={isExpanded}
        isCollapsible={false}
      />

      {/* 底部展開 / 收合 按鈕 */}
      <div className="mt-2.5 pt-1 flex justify-center">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs font-black text-[#8C806F] hover:text-[#4A4235] flex items-center gap-1 px-3 py-1 rounded-full hover:bg-[#F7F4EE] transition-colors cursor-pointer"
        >
          <span>{isExpanded ? '收合乘車詳情' : '查看乘車詳情'}</span>
          {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>
    </div>
  );
};
