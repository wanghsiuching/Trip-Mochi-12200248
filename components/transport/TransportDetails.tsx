import React, { useState } from 'react';
import { 
  Luggage, 
  Briefcase, 
  DollarSign, 
  MapPin, 
  Hash, 
  Users, 
  StickyNote, 
  ExternalLink,
  ChevronDown,
  Train,
  ArrowRight
} from 'lucide-react';
import { TransportItemModel, TransportSegmentModel } from './types';
import { defaultMapProvider } from './MapProvider';

interface TransportDetailsProps {
  item: TransportItemModel;
  onOpenMap?: () => void;
  className?: string;
  isCollapsible?: boolean;
  defaultExpanded?: boolean;
  expanded?: boolean;
  onToggle?: (expanded: boolean) => void;
}

export const TransportDetails: React.FC<TransportDetailsProps> = ({
  item,
  onOpenMap,
  className = '',
  isCollapsible = false,
  defaultExpanded = true,
  expanded: controlledExpanded,
  onToggle,
}) => {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  const isControlled = controlledExpanded !== undefined;
  const isOpen = isControlled ? controlledExpanded : internalExpanded;

  const handleToggle = (nextState: boolean) => {
    if (!isControlled) {
      setInternalExpanded(nextState);
    }
    if (onToggle) {
      onToggle(nextState);
    }
  };

  const segments = item.segments || [];
  const baggage = item.baggage;
  const cost = item.cost;
  const currency = item.currency || 'TWD';
  const isTrain = item.type === 'train';

  const handleOpenMap = () => {
    if (onOpenMap) {
      onOpenMap();
      return;
    }
    if (segments.length > 0) {
      const dep = segments[0].departure;
      const arr = segments[segments.length - 1].arrival;
      defaultMapProvider.openRoute(dep, arr);
    }
  };

  return (
    <div className={`mt-2.5 text-xs text-[#4A443B] ${className}`}>
      {/* 若設定為可折疊模式，顯示質感展開/收合開關 */}
      {isCollapsible && (
        <button
          type="button"
          onClick={() => handleToggle(!isOpen)}
          className="w-full flex items-center justify-between px-3 py-2 bg-[#F9F7F2] hover:bg-[#F3EFE6] active:scale-[0.99] rounded-xl border border-[#EAE3D5] text-xs font-black text-[#5C5447] transition-all cursor-pointer shadow-2xs"
        >
          <span className="flex items-center gap-1.5">
            <span>{isTrain ? '🚆' : (item.type === 'flight' ? '✈️' : '🗺️')}</span>
            <span>{isOpen ? '收合詳細乘車資訊' : (isTrain ? '展開詳細鐵路資訊 (月台 / 車廂 / 座位)' : '展開詳細乘車與行程資訊')}</span>
          </span>
          <ChevronDown 
            size={14} 
            className={`text-[#8C806F] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
          />
        </button>
      )}

      {/* 詳細資訊內容區塊 (優雅高度淡入淡出動畫) */}
      <div 
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen ? 'max-h-[2000px] opacity-100 pt-2 space-y-3' : 'max-h-0 opacity-0 pt-0 pointer-events-none'
        }`}
      >
        {/* 多段分程明細 (若有 2 段以上，例如 SBB 轉乘 或 多航段航班) */}
        {segments.length > 1 && (
          <div className="space-y-2 bg-[#FAF7F2] p-3 rounded-2xl border border-[#EBE4D8]">
            <div className="text-[11px] font-black text-[#7A6F5C] uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>{isTrain ? '鐵道轉乘分段明細' : '航程分段明細'}</span>
              <span className="text-[10px] text-[#A69B89] font-mono">共 {segments.length} 段</span>
            </div>

            {segments.map((seg: TransportSegmentModel, index: number) => (
              <div key={seg.id || index} className="space-y-1.5 pb-2.5 border-b border-[#E8E0D2] last:border-b-0 last:pb-0">
                <div className="flex items-center justify-between font-black text-[#2D2A26] flex-wrap gap-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-4 h-4 rounded-full bg-[#E5DDD0] text-[#5A5040] flex items-center justify-center text-[10px] flex-shrink-0">
                      {index + 1}
                    </span>
                    <span className="truncate">{seg.operator || item.operator}</span>
                    <span className="font-mono text-[#7A6540] bg-[#EFE9DD] px-1.5 py-0.5 rounded text-[10px] font-bold">
                      {seg.serviceNumber}
                    </span>
                  </div>
                  {seg.duration && (
                    <span className="font-mono text-[10px] text-[#8C806F] flex-shrink-0">
                      {isTrain ? `乘車 ${seg.duration}` : `飛行 ${seg.duration}`}
                    </span>
                  )}
                </div>

                {/* 出發與抵達時間點 (適應 375px-412px 手機螢幕) */}
                <div className="flex items-center justify-between text-[11px] text-[#6E6454] pl-2 sm:pl-5 font-mono gap-1">
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-[#2D2A26] truncate">{seg.departure.city || seg.departure.name}</div>
                    <div className="flex items-center gap-1 text-[10px] text-[#8C8272]">
                      {seg.departure.time && <span className="text-[#1F1C18] font-black">{seg.departure.time}</span>}
                      {seg.departure.platform && <span className="text-[#7A6340] font-bold">({seg.departure.platform})</span>}
                    </div>
                  </div>
                  
                  <ArrowRight size={12} className="text-[#A39886] flex-shrink-0 mx-1" />

                  <div className="min-w-0 flex-1 text-right">
                    <div className="font-bold text-[#2D2A26] truncate">{seg.arrival.city || seg.arrival.name}</div>
                    <div className="flex items-center justify-end gap-1 text-[10px] text-[#8C8272]">
                      {seg.arrival.time && <span className="text-[#1F1C18] font-black">{seg.arrival.time}</span>}
                      {seg.arrival.platform && <span className="text-[#7A6340] font-bold">({seg.arrival.platform})</span>}
                    </div>
                  </div>
                </div>

                {/* 轉機/轉乘停留提示 */}
                {seg.transferAfter && (
                  <div className="mt-1 ml-2 sm:ml-5 p-2 bg-[#FFF9ED] border border-[#F2E4C9] rounded-xl text-[10px] text-[#8C6219] flex items-center justify-between flex-wrap gap-1">
                    <span className="truncate">
                      轉乘站：<strong>{seg.transferAfter.location.name || seg.transferAfter.location.city}</strong>
                      {seg.transferAfter.location.platform ? ` (${seg.transferAfter.location.platform})` : ''}
                    </span>
                    <span className="font-bold font-mono flex-shrink-0">停留 {seg.transferAfter.duration}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 核心資訊網格 (月台 / 車廂 / 座位 / 席別 / 行李 / PNR) - 適應 375px~412px */}
        <div className="grid grid-cols-2 gap-2">
          {/* 月台資訊 (Train Platform) */}
          {(item.platform || item.departurePlatform) && (
            <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-[#EAE5DA] min-w-0">
              <span className="text-[#8C6219] text-xs font-black flex-shrink-0">🚉</span>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-[#8C8272] font-bold">發車月台</span>
                <span className="text-[11px] font-black text-[#2D2A26] truncate">
                  {item.platform || item.departurePlatform}
                </span>
              </div>
            </div>
          )}

          {/* 車廂與座位 (Carriage & Seat) */}
          {(item.carriage || item.seat) && (
            <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-[#EAE5DA] min-w-0">
              <span className="text-[#4A6351] text-xs font-black flex-shrink-0">💺</span>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-[#8C8272] font-bold">
                  {item.carriage ? '車廂 / 座位' : '座位號碼'}
                </span>
                <span className="text-[11px] font-black text-[#2D2A26] truncate">
                  {[
                    item.carriage ? (item.carriage.includes('車') ? item.carriage : `${item.carriage}車`) : '',
                    item.seat
                  ].filter(Boolean).join(' · ')}
                </span>
              </div>
            </div>
          )}

          {/* 艙等 / 席別等級 (Class) */}
          {item.classType && (
            <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-[#EAE5DA] min-w-0">
              <span className="text-[#3E7B62] text-xs font-black flex-shrink-0">🎫</span>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-[#8C8272] font-bold">席位 / 等別</span>
                <span className="text-[11px] font-black text-[#2D2A26] truncate">{item.classType}</span>
              </div>
            </div>
          )}

          {/* 訂位代號 (PNR) */}
          {item.bookingReference && (
            <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-[#EAE5DA] min-w-0">
              <Hash size={13} className="text-[#7A6F5C] flex-shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-[#8C8272] font-bold">訂位代號 (PNR)</span>
                <span className="text-[11px] font-black font-mono text-[#2D2A26] truncate">
                  {item.bookingReference}
                </span>
              </div>
            </div>
          )}

          {/* 託運行李 */}
          {baggage?.checked && (
            <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-[#EAE5DA] min-w-0">
              <Luggage size={13} className="text-[#3E7B62] flex-shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-[#8C8272] font-bold">託運行李</span>
                <span className="text-[11px] font-black text-[#2D2A26] truncate">{baggage.checked}</span>
              </div>
            </div>
          )}

          {/* 手提行李 */}
          {baggage?.carryOn && (
            <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-[#EAE5DA] min-w-0">
              <Briefcase size={13} className="text-[#C47D3B] flex-shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-[#8C8272] font-bold">手提行李</span>
                <span className="text-[11px] font-black text-[#2D2A26] truncate">{baggage.carryOn}</span>
              </div>
            </div>
          )}
        </div>

        {/* 費用與服務費 */}
        {cost !== undefined && cost > 0 && (
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#EAE5DA]">
            <div className="flex items-center gap-1.5 text-[#5C5447] font-bold">
              <DollarSign size={13} className="text-[#3E7B62]" />
              <span>{isTrain ? '車票費用' : '機票 / 交通費用'}</span>
            </div>
            <div className="text-right">
              <span className="font-mono text-sm font-black text-[#2E5A44]">
                {currency} {cost.toLocaleString()}
              </span>
              {item.hasServiceFee && item.serviceFeePercentage ? (
                <span className="block text-[10px] text-[#8C8272]">
                  含手續費 {item.serviceFeePercentage}%
                </span>
              ) : null}
            </div>
          </div>
        )}

        {/* 備註 (Note) */}
        {item.note && (
          <div className="flex items-start gap-2 p-2.5 rounded-xl bg-[#FFFDF7] border border-[#F0E8D5] text-[#5C5447]">
            <StickyNote size={14} className="text-[#C4A053] mt-0.5 flex-shrink-0" />
            <p className="text-[11px] font-medium leading-relaxed whitespace-pre-wrap break-words">
              {item.note}
            </p>
          </div>
        )}

        {/* 成員參與人 */}
        {item.participants && item.participants.length > 0 && (
          <div className="flex items-center gap-2 text-[11px] text-[#7A7162] px-1">
            <Users size={12} className="text-[#8C806F] flex-shrink-0" />
            <span className="font-bold flex-shrink-0">同行成員：</span>
            <span className="font-medium truncate">{item.participants.join(', ')}</span>
          </div>
        )}

        {/* Google Maps 導航按鈕 (純 URL 開啟，免 API Key、免收費) */}
        <div className="pt-0.5">
          <button
            type="button"
            onClick={handleOpenMap}
            className="w-full py-2 px-3 rounded-xl bg-[#F6F4EE] hover:bg-[#EFECE3] active:scale-[0.99] transition-all border border-[#E5DFD4] text-[#4A4235] font-black text-xs flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <MapPin size={13} className="text-[#8C3A3A]" />
            <span>在 Google Maps 查看路線</span>
            <ExternalLink size={11} className="text-[#8C806F] ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
