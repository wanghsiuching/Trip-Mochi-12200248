import React from 'react';
import { Luggage, Briefcase, DollarSign, MapPin, Hash, Users, StickyNote, ExternalLink } from 'lucide-react';
import { TransportItemModel, TransportSegmentModel } from './types';
import { defaultMapProvider } from './MapProvider';

interface TransportDetailsProps {
  item: TransportItemModel;
  onOpenMap?: () => void;
  className?: string;
}

export const TransportDetails: React.FC<TransportDetailsProps> = ({
  item,
  onOpenMap,
  className = '',
}) => {
  const segments = item.segments || [];
  const baggage = item.baggage;
  const cost = item.cost;
  const currency = item.currency || 'TWD';

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
    <div className={`mt-3 pt-3 border-t border-[#EFECE6] space-y-3.5 text-xs text-[#4A443B] ${className}`}>
      {/* 多段分程明細 (若有 2 段以上，例如 EY899 + EY143) */}
      {segments.length > 1 && (
        <div className="space-y-2 bg-[#FAF7F2] p-3 rounded-2xl border border-[#EBE4D8]">
          <div className="text-[11px] font-black text-[#7A6F5C] uppercase tracking-wider mb-1">
            航程分段明細
          </div>

          {segments.map((seg: TransportSegmentModel, index: number) => (
            <div key={seg.id || index} className="space-y-1.5 pb-2 border-b border-[#E8E0D2] last:border-b-0 last:pb-0">
              <div className="flex items-center justify-between font-black text-[#2D2A26]">
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-[#E5DDD0] text-[#5A5040] flex items-center justify-center text-[10px]">
                    {index + 1}
                  </span>
                  <span>{seg.operator || item.operator}</span>
                  <span className="font-mono text-[#7A6540]">{seg.serviceNumber}</span>
                </div>
                {seg.duration && (
                  <span className="font-mono text-[11px] text-[#8C806F]">飛行 {seg.duration}</span>
                )}
              </div>

              {/* 出發與抵達時間點 */}
              <div className="flex items-center justify-between text-[11px] text-[#6E6454] pl-5 font-mono">
                <div>
                  <span className="font-bold text-[#2D2A26]">{seg.departure.city || seg.departure.name}</span>
                  {seg.departure.code && <span> ({seg.departure.code})</span>}
                  {seg.departure.time && <span className="ml-1 text-[#1F1C18] font-black">{seg.departure.time}</span>}
                </div>
                <div className="text-[#A39886]">→</div>
                <div>
                  <span className="font-bold text-[#2D2A26]">{seg.arrival.city || seg.arrival.name}</span>
                  {seg.arrival.code && <span> ({seg.arrival.code})</span>}
                  {seg.arrival.time && <span className="ml-1 text-[#1F1C18] font-black">{seg.arrival.time}</span>}
                </div>
              </div>

              {/* 轉機停留提示 */}
              {seg.transferAfter && (
                <div className="mt-1 ml-5 p-1.5 bg-[#FFF9ED] border border-[#F2E4C9] rounded-lg text-[10px] text-[#8C6219] flex items-center justify-between">
                  <span>轉機點：{seg.transferAfter.location.city || seg.transferAfter.location.name}</span>
                  <span className="font-bold">停留 {seg.transferAfter.duration}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 行李與座位格狀資訊 */}
      <div className="grid grid-cols-2 gap-2">
        {/* 託運行李 */}
        {baggage?.checked && (
          <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-[#EAE5DA]">
            <Luggage size={14} className="text-[#3E7B62] flex-shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] text-[#8C8272] font-bold">託運行李</span>
              <span className="text-[11px] font-black text-[#2D2A26] truncate">{baggage.checked}</span>
            </div>
          </div>
        )}

        {/* 手提行李 */}
        {baggage?.carryOn && (
          <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-[#EAE5DA]">
            <Briefcase size={14} className="text-[#C47D3B] flex-shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] text-[#8C8272] font-bold">手提行李</span>
              <span className="text-[11px] font-black text-[#2D2A26] truncate">{baggage.carryOn}</span>
            </div>
          </div>
        )}

        {/* 艙等 / 座位 */}
        {(item.seat || item.classType) && (
          <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-[#EAE5DA]">
            <span className="text-[#5C5447] text-xs font-black flex-shrink-0">💺</span>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] text-[#8C8272] font-bold">席別 / 座位</span>
              <span className="text-[11px] font-black text-[#2D2A26] truncate">
                {[item.classType, item.seat].filter(Boolean).join(' · ')}
              </span>
            </div>
          </div>
        )}

        {/* 訂位代號 (PNR) */}
        {item.bookingReference && (
          <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-[#EAE5DA]">
            <Hash size={14} className="text-[#7A6F5C] flex-shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] text-[#8C8272] font-bold">訂位代號 (PNR)</span>
              <span className="text-[11px] font-black font-mono text-[#2D2A26] truncate">
                {item.bookingReference}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 費用與服務費 */}
      {cost !== undefined && cost > 0 && (
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#EAE5DA]">
          <div className="flex items-center gap-1.5 text-[#5C5447] font-bold">
            <DollarSign size={13} className="text-[#3E7B62]" />
            <span>機票 / 交通費用</span>
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
        <div className="flex items-center gap-2 text-[11px] text-[#7A7162]">
          <Users size={12} className="text-[#8C806F]" />
          <span className="font-bold">成員：</span>
          <span className="font-medium">{item.participants.join(', ')}</span>
        </div>
      )}

      {/* Google Maps 導航按鈕 (純 URL 開啟，免 API Key、免收費) */}
      <div className="pt-1">
        <button
          type="button"
          onClick={handleOpenMap}
          className="w-full py-2 px-3 rounded-xl bg-[#F6F4EE] hover:bg-[#EFECE3] active:scale-[0.99] transition-all border border-[#E5DFD4] text-[#4A4235] font-black text-xs flex items-center justify-center gap-1.5 shadow-xs"
        >
          <MapPin size={13} className="text-[#8C3A3A]" />
          <span>在 Google Maps 查看路線</span>
          <ExternalLink size={11} className="text-[#8C806F] ml-0.5" />
        </button>
      </div>
    </div>
  );
};
