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
import { getTransportMeta } from './TransportIcon';
import { formatTicketAmount } from '../../src/utils/splitCost';

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
  const meta = getTransportMeta(item.type);
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
            <span>{meta.emoji}</span>
            <span>{isOpen ? `收合詳細${meta.label}資訊` : `展開詳細${meta.label}資訊 (站點 / 席別 / 費用)`}</span>
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
              <span>{meta.label}分段與轉乘明細</span>
              <span className="text-[10px] text-[#A69B89] font-sans tabular-nums">共 {segments.length} 段</span>
            </div>

            {segments.map((seg: TransportSegmentModel, index: number) => {
              const segMeta = getTransportMeta(seg.type || item.type);
              return (
              <div key={seg.id || index} className="space-y-1.5 pb-2.5 border-b border-[#E8E0D2] last:border-b-0 last:pb-0">
                <div className="flex items-center justify-between font-black text-[#2D2A26] flex-wrap gap-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-4 h-4 rounded-full bg-[#E5DDD0] text-[#5A5040] flex items-center justify-center text-[10px] flex-shrink-0">
                      {index + 1}
                    </span>
                    <span className="text-xs flex-shrink-0">{segMeta.emoji}</span>
                    <span className="break-words">{seg.operator || item.operator}</span>
                    <span className="font-sans tabular-nums tracking-tight text-[#7A6540] bg-[#EFE9DD] px-1.5 py-0.5 rounded text-[10px] font-bold">
                      {seg.serviceNumber}
                    </span>
                  </div>
                  {seg.duration && (
                    <span className="font-sans tabular-nums tracking-tight text-[10px] text-[#8C806F] flex-shrink-0">
                      {seg.type === 'flight' ? `飛行 ${seg.duration}` : `時長 ${seg.duration}`}
                    </span>
                  )}
                </div>

                {/* 出發與抵達時間點 (適應 375px-412px 手機螢幕) */}
                <div className="flex items-center justify-between text-[11px] text-[#6E6454] pl-2 sm:pl-5 font-sans tabular-nums gap-1">
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-[#2D2A26] break-words leading-tight">{seg.departure.city || seg.departure.name}</div>
                    <div className="flex items-center gap-1 text-[10px] text-[#8C8272]">
                      {seg.departure.time && <span className="text-[#1F1C18] font-black">{seg.departure.time}</span>}
                      {seg.departure.platform && <span className="text-[#7A6340] font-bold">({seg.departure.platform})</span>}
                    </div>
                  </div>
                  
                  <ArrowRight size={12} className="text-[#A39886] flex-shrink-0 mx-1" />

                  <div className="min-w-0 flex-1 text-right">
                    <div className="font-bold text-[#2D2A26] break-words leading-tight">{seg.arrival.city || seg.arrival.name}</div>
                    <div className="flex items-center justify-end gap-1 text-[10px] text-[#8C8272]">
                      {seg.arrival.time && <span className="text-[#1F1C18] font-black">{seg.arrival.time}</span>}
                      {seg.arrival.platform && <span className="text-[#7A6340] font-bold">({seg.arrival.platform})</span>}
                    </div>
                  </div>
                </div>

                {/* 轉機/轉乘停留提示 */}
                {seg.transferAfter && (
                  <div className="mt-1 ml-2 sm:ml-5 p-2 bg-[#FFF9ED] border border-[#F2E4C9] rounded-xl text-[10px] text-[#8C6219] flex items-center justify-between flex-wrap gap-1">
                    <span className="break-words">
                      轉乘站：<strong>{seg.transferAfter.location.name || seg.transferAfter.location.city}</strong>
                      {seg.transferAfter.location.platform ? ` (${seg.transferAfter.location.platform})` : ''}
                    </span>
                    <span className="font-bold font-sans tabular-nums flex-shrink-0">停留 {seg.transferAfter.duration}</span>
                  </div>
                )}
              </div>
              );
            })}
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
                <span className="text-[11px] font-black text-[#2D2A26] break-words">
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
                <span className="text-[11px] font-black text-[#2D2A26] break-words">
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
                <span className="text-[11px] font-black text-[#2D2A26] break-words">{item.classType}</span>
              </div>
            </div>
          )}

          {/* 訂位代號 (PNR) */}
          {item.bookingReference && (
            <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-[#EAE5DA] min-w-0">
              <Hash size={13} className="text-[#7A6F5C] flex-shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-[#8C8272] font-bold">訂位代號 (PNR)</span>
                <span className="text-[11px] font-black font-sans tabular-nums tracking-tight text-[#2D2A26] break-all">
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
                <span className="text-[11px] font-black text-[#2D2A26] break-words">{baggage.checked}</span>
              </div>
            </div>
          )}

          {/* 手提行李 */}
          {baggage?.carryOn && (
            <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-[#EAE5DA] min-w-0">
              <Briefcase size={13} className="text-[#C47D3B] flex-shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-[#8C8272] font-bold">手提行李</span>
                <span className="text-[11px] font-black text-[#2D2A26] break-words">{baggage.carryOn}</span>
              </div>
            </div>
          )}
        </div>

        {/* 費用與服務費 (支援車票張數/手續費/每人分攤明細) */}
        {item.ticketSummary && (item.ticketSummary.unitPrice > 0 || item.ticketSummary.passUsed === 'pass_free' || (item.ticketSummary.extraItems && item.ticketSummary.extraItems.length > 0)) ? (
          <div className="p-3 rounded-xl bg-white border border-[#EAE5DA] space-y-1.5 text-xs">
            <div className="flex items-center justify-between border-b border-[#F2EDE3] pb-1.5">
              <div className="flex items-center gap-1.5 text-[#5C5447] font-black">
                <DollarSign size={13} className="text-[#3E7B62]" />
                <span>車票費用試算明細</span>
              </div>
              {item.ticketSummary.isPotential && (
                <span className="text-[10px] font-black text-amber-800 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded-md">
                  未列入預算
                </span>
              )}
            </div>

            {item.ticketSummary.unitPrice > 0 ? (
              <>
                <div className="flex justify-between items-center text-[11px] font-bold text-[#6E6455]">
                  <span>每張車票（實付）</span>
                  <span className="font-sans tabular-nums font-black text-[#2D2A26]">
                    {item.ticketSummary.originalUnitPrice !== undefined && item.ticketSummary.originalUnitPrice > item.ticketSummary.unitPrice && (
                      <span className="text-[#A89E8E] line-through mr-1.5 font-normal">
                        {item.ticketSummary.currency} {formatTicketAmount(item.ticketSummary.originalUnitPrice)}
                      </span>
                    )}
                    {item.ticketSummary.currency} {formatTicketAmount(item.ticketSummary.unitPrice)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px] font-bold text-[#6E6455]">
                  <span>車票張數</span>
                  <span className="font-sans tabular-nums font-black text-[#2D2A26]">
                    共 {item.ticketSummary.ticketCount} 張
                  </span>
                </div>
                {item.ticketSummary.hasServiceFee && item.ticketSummary.feeAmount > 0 && (
                  <div className="flex justify-between items-center text-[11px] font-bold text-[#6E6455]">
                    <span>＋ 手續費 ({item.ticketSummary.serviceFeePercentage}%)</span>
                    <span className="font-sans tabular-nums font-black text-[#2D2A26]">
                      {item.ticketSummary.currency} {formatTicketAmount(item.ticketSummary.feeAmount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center text-[11px] font-bold text-[#6E6455]">
                  <span>車票總計</span>
                  <span className="font-sans tabular-nums font-black text-[#2D2A26]">
                    {item.ticketSummary.currency} {formatTicketAmount(item.ticketSummary.ticketTotalWithFee)}
                    {item.ticketSummary.totalTWD !== undefined && (
                      <span className="text-[10px] text-[#8C8272] font-normal ml-1">
                        (約 NT$ {item.ticketSummary.totalTWD.toLocaleString()})
                      </span>
                    )}
                  </span>
                </div>
              </>
            ) : item.ticketSummary.passUsed === 'pass_free' ? (
              <div className="flex justify-between items-center text-[11px] font-bold text-[#2E5A44]">
                <span>票種優惠</span>
                <span className="font-black">Pass 全包（實付 {item.ticketSummary.currency} 0 · 共 {item.ticketSummary.ticketCount} 張）</span>
              </div>
            ) : null}

            {item.ticketSummary.extraItems && item.ticketSummary.extraItems.length > 0 && (
              <div className="pt-1 border-t border-dashed border-[#EFEAE0] space-y-1">
                {item.ticketSummary.extraItems.map((extra) => (
                  <div key={extra.id} className="flex justify-between items-center text-[11px] font-bold text-blue-800">
                    <span>
                      • {extra.name}（每人）
                      {extra.hasServiceFee && extra.serviceFeePercentage > 0 && (
                        <span className="text-[10px] text-blue-600 font-normal ml-1">(含{extra.serviceFeePercentage}%)</span>
                      )}
                    </span>
                    <span className="font-sans tabular-nums font-black">
                      {extra.currency} {formatTicketAmount(extra.totalWithFee)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {item.ticketSummary.perPerson !== null && item.ticketSummary.perPerson > 0 && (
              <div className="flex justify-between items-center pt-1.5 border-t border-[#EAE5DA]">
                <span className="text-xs font-bold text-[#5C5447]">
                  每人應付（{item.ticketSummary.peopleCount} 人分攤）
                </span>
                <div className="text-right">
                  <span className="font-sans tabular-nums tracking-tight text-sm sm:text-base font-black text-[#2E5A44]">
                    {item.ticketSummary.currency} {formatTicketAmount(item.ticketSummary.perPerson)}
                  </span>
                  {item.ticketSummary.perPersonTWD !== undefined && (
                    <span className="block text-[10px] font-bold text-[#4A7C59] font-sans tabular-nums">
                      約 NT$ {item.ticketSummary.perPersonTWD.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : cost !== undefined && cost > 0 && (
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#EAE5DA]">
            <div className="flex items-center gap-1.5 text-[#5C5447] font-bold">
              <DollarSign size={13} className="text-[#3E7B62]" />
              <span>{isTrain ? '車票費用' : (item.type === 'flight' ? '機票費用' : `${meta.label}費用`)}</span>
            </div>
            <div className="text-right">
              <span className="font-sans tabular-nums tracking-tight text-sm font-black text-[#2E5A44]">
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
            <span className="font-medium break-words">{item.participants.join(', ')}</span>
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
