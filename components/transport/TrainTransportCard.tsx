import React, { useState } from 'react';
import { 
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
import { getTransportMeta } from './TransportIcon';

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

  const meta = getTransportMeta(item.type);
  const IconComp = meta.icon;

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

  // 營運商與班次編號
  const operatorName = item.operator || item.rawBookingTrain?.operator || meta.defaultOperator;
  const operatorSub = item.operatorSub || item.rawBookingTrain?.operatorSub || item.rawBookingTrain?.trainName || '';
  const serviceNumber = (item.serviceNumber || item.rawBookingTrain?.code || item.rawBookingTrain?.serviceNumber || meta.categoryName).toUpperCase();

  // 總行車/航程時間
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

  // 出發 / 抵達 標籤文字
  const depTagText = item.type === 'ferry' ? '啟航' : (item.type === 'flight' ? '起飛' : '發車');
  const arrTagText = item.type === 'ferry' ? '靠港' : (item.type === 'flight' ? '降落' : '抵達');
  const platformLabel = item.type === 'ferry' ? '碼頭' : (item.type === 'cable_car' ? '纜車站' : (item.type === 'bus' ? '月台/站牌' : '月台'));
  const carriageEmoji = item.type === 'cable_car' ? '🚡' : (item.type === 'ferry' ? '🚢' : (item.type === 'bus' ? '🚌' : '🚃'));

  return (
    <div 
      className={`w-full bg-[#FCFBF8] rounded-[1.75rem] border border-[#E5DFD3] shadow-xs hover:border-[#D6CDBF] transition-all p-4 sm:p-5 relative ${className}`}
    >
      {/* ========================================================================= */}
      {/* 一、頂部標題區 (運具圖示 + 營運商 + 班次膠囊 + 乘車時間 + 操作按鈕)         */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-between gap-2.5 pb-3 border-b border-[#EFEBE3] flex-wrap sm:flex-nowrap">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* 動態運具圖示徽章 (纜車、渡輪、巴士、鐵路各自專屬顏色) */}
          <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl ${meta.bgLight} ${meta.textColor} border border-black/10 flex items-center justify-center flex-shrink-0 shadow-2xs`}>
            <IconComp size={18} strokeWidth={2.2} />
          </div>

          {/* 營運商名稱與班次 */}
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm sm:text-base font-black text-[#2D2A26] tracking-tight break-words">
                {operatorName}
              </span>
              {serviceNumber && (
                serviceNumber.includes('→') ? (
                  <div className="flex items-center gap-1 flex-wrap">
                    {serviceNumber.split('→').map((seg, idx, arr) => (
                      <React.Fragment key={idx}>
                        <span className="font-mono text-[10px] sm:text-[11px] font-bold bg-[#EFECE4] text-[#5A5043] px-1.5 py-0.5 rounded-md border border-[#E0D9CC] whitespace-nowrap">
                          {seg.trim()}
                        </span>
                        {idx < arr.length - 1 && (
                          <ArrowRight size={10} className="text-[#A0988A] flex-shrink-0" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                ) : (
                  <span className="font-mono text-[10px] sm:text-[11px] font-black bg-[#EFECE4] text-[#5A5043] px-1.5 py-0.5 rounded-md border border-[#E0D9CC] max-w-full break-all">
                    {serviceNumber}
                  </span>
                )
              )}
            </div>
            {operatorSub && (
              <span className="text-[11px] font-medium text-[#8C8272] break-words">
                {operatorSub}
              </span>
            )}
          </div>
        </div>

        {/* 右側：時長膠囊與操作按鈕群 (避免絕對定位互相擠壓或遮擋) */}
        <div className="flex items-center gap-1.5 flex-shrink-0 ml-auto">
          {duration && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="border border-[#DCD5CA] bg-white hover:bg-[#F8F6F0] active:scale-95 rounded-full px-2.5 sm:px-3 py-1 text-xs font-black text-[#4B443D] flex items-center gap-1.5 flex-shrink-0 transition-all shadow-2xs cursor-pointer"
              title={`查看${meta.label}詳情`}
            >
              <Clock size={12} className="text-[#6D6357]" />
              <span className="font-mono tracking-tight">{duration}</span>
              <ChevronRight 
                size={12} 
                className={`text-[#8C827A] transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} 
              />
            </button>
          )}

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
      </div>

      {/* ========================================================================= */}
      {/* 二、主要路線區域 (出發站 - 路線軌跡/轉乘 - 抵達站)                         */}
      {/* ========================================================================= */}
      <div className="pt-3.5 pb-2.5">
        <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-2 sm:gap-3">
          {/* 左：出發站 */}
          <div className="min-w-0">
            <div className="inline-block bg-[#F2EDE2] text-[#7A6448] text-[10px] font-black px-2 py-0.5 rounded mb-1 shadow-2xs">
              {depTagText}
            </div>
            <div className="font-mono text-2xl sm:text-3xl font-black text-[#2D2A26] tracking-tight leading-none mb-1">
              {depTime}
            </div>
            <div className="text-xs sm:text-sm font-black text-[#4A4235] break-words leading-snug">
              {depStation}
            </div>
            {depPlatform && (
              <div className="inline-flex items-center gap-1 text-[10px] font-bold text-[#8C6219] bg-[#FFF8EB] border border-[#F3E3C6] px-1.5 py-0.5 rounded mt-1 max-w-full break-words">
                <span>{platformLabel}</span>
                <span className="font-mono font-black">{depPlatform.replace(/^(月台|Track|碼頭|纜車站|站牌)\s*/i, '')}</span>
              </div>
            )}
          </div>

          {/* 中間：路線軌跡與轉乘標記 */}
          <div className="flex flex-col items-center justify-center px-1 min-w-[70px] sm:min-w-[90px]">
            <div className="text-[10px] font-mono text-[#8C806F] mb-1 font-bold whitespace-nowrap">
              {hasTransfer ? '轉乘路線' : (item.type === 'flight' ? '直飛航班' : `直達${meta.categoryName}`)}
            </div>

            {/* 軌道/航程視覺線 */}
            <div className="flex items-center gap-1 w-full max-w-[90px]">
              <div className={`w-1.5 h-1.5 rounded-full ${meta.bgColor}`} />
              <div className="flex-1 h-0.5 bg-[#D2C8B8] border-t border-b border-dashed border-[#A89C8A]" />
              <div className="w-5 h-5 rounded-full bg-[#F0ECE2] border border-[#D5CDBD] flex items-center justify-center text-[10px] text-[#5A5040] flex-shrink-0 shadow-2xs">
                {meta.emoji}
              </div>
              <div className="flex-1 h-0.5 bg-[#D2C8B8] border-t border-b border-dashed border-[#A89C8A]" />
              <div className={`w-1.5 h-1.5 rounded-full ${meta.bgColor}`} />
            </div>

            {/* 轉乘節點提示 (例如: 經 伯恩 Bern) */}
            {hasTransfer && transferInfo && (
              <div className="mt-1 text-[9px] font-black text-[#96631E] bg-[#FFF8EA] border border-[#F3E3C4] px-1.5 py-0.5 rounded-full text-center break-words max-w-[120px]">
                經 {transferInfo.location.name}
              </div>
            )}
          </div>

          {/* 右：抵達站 */}
          <div className="min-w-0 text-right">
            <div className="inline-block bg-[#E8EFEA] text-[#33684F] text-[10px] font-black px-2 py-0.5 rounded mb-1 shadow-2xs">
              {arrTagText}
            </div>
            <div className="font-mono text-2xl sm:text-3xl font-black text-[#2D2A26] tracking-tight leading-none mb-1">
              {arrTime}
            </div>
            <div className="text-xs sm:text-sm font-black text-[#4A4235] break-words leading-snug">
              {arrStation}
            </div>
            {arrPlatform && (
              <div className="inline-flex items-center gap-1 text-[10px] font-bold text-[#8C6219] bg-[#FFF8EB] border border-[#F3E3C6] px-1.5 py-0.5 rounded mt-1 max-w-full break-words">
                <span>{platformLabel}</span>
                <span className="font-mono font-black">{arrPlatform.replace(/^(月台|Track|碼頭|纜車站|站牌)\s*/i, '')}</span>
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
          {/* 車廂 / 艙位 */}
          {item.carriage && (
            <span className="flex items-center gap-1 text-[#3E7B62] bg-[#EAF3EE] px-2 py-0.5 rounded-lg border border-[#D6E6DC]">
              <span>{carriageEmoji}</span>
              <span>{item.carriage.includes('車') || item.carriage.includes('艙') ? item.carriage : `${item.carriage}車`}</span>
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
          <span>{isExpanded ? `收合${meta.label}詳情` : `查看${meta.label}詳情`}</span>
          {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>
    </div>
  );
};
