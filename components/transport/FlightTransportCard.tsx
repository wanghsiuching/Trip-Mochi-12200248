import React, { useState } from 'react';
import {
  Plane,
  Clock,
  ChevronRight,
  ChevronUp,
  Luggage,
  Briefcase,
  ArrowRightLeft,
  Edit3,
  Trash2,
  MapPin,
  Camera,
  StickyNote
} from 'lucide-react';
import { TransportItemModel, TransportSegmentModel } from './types';
import { resolveAirportDisplay, AIRLINE_INFO_MAP } from './airlineMap';
import { defaultMapProvider } from './MapProvider';
import { calculateDurationBetweenTimes } from './adapters';

interface FlightTransportCardProps {
  item: TransportItemModel;
  defaultExpanded?: boolean;
  onEdit?: (item: TransportItemModel) => void;
  onDelete?: (item: TransportItemModel) => void;
  onOpenMap?: () => void;
  onOpenLightbox?: (images: string[], index: number) => void;
  className?: string;
}

export const FlightTransportCard: React.FC<FlightTransportCardProps> = ({
  item,
  defaultExpanded = false,
  onEdit,
  onDelete,
  onOpenMap,
  onOpenLightbox,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const segments = item.segments || [];
  const firstSeg: TransportSegmentModel | undefined = segments[0];
  const lastSeg: TransportSegmentModel | undefined = segments[segments.length - 1];

  // 出發與抵達節點
  const rawDep = firstSeg?.departure;
  const rawArr = lastSeg?.arrival;

  const depDisplay = resolveAirportDisplay(rawDep?.code || rawDep?.name, rawDep?.city);
  const arrDisplay = resolveAirportDisplay(rawArr?.code || rawArr?.name, rawArr?.city);

  // 時間提取（若為直飛或轉機，優先使用對應段已解析的時間）
  const isInbound = item.directionType === 'inbound';
  const depTime =
    rawDep?.time ||
    (isInbound
      ? item.rawBookingFlight?.returnDate?.includes('T')
        ? item.rawBookingFlight.returnDate.slice(11, 16)
        : ''
      : item.rawBookingFlight?.depTime) ||
    '--:--';
  const arrTime =
    rawArr?.time ||
    (isInbound
      ? item.rawBookingFlight?.returnArrivalDate?.includes('T')
        ? item.rawBookingFlight.returnArrivalDate.slice(11, 16)
        : ''
      : item.rawBookingFlight?.arrTime) ||
    '--:--';

  // 航空公司名稱（依紅框修正：Header 僅保留主名稱與飛機圖示，不顯示航班膠囊與英文副標）
  const airlineName = item.operator || item.rawBookingFlight?.airline || '航班資訊';

  // 航班代碼（保留於展開詳情 / 銜接提示中顯示）
  const flightNumber = (item.serviceNumber || item.rawBookingFlight?.code || '').trim().toUpperCase();

  // 格式化飛行時間
  const formatDurationStr = (dur?: string): string => {
    if (!dur) return '';
    const trimmed = dur.trim();
    const match = trimmed.match(/^(\d+)[hH](\d+)[mM]?$/);
    if (match) {
      return `${match[1]}h ${match[2]}m`;
    }
    return trimmed
      .toLowerCase()
      .replace('hours', 'h')
      .replace('hour', 'h')
      .replace('mins', 'm')
      .replace('min', 'm');
  };

  const totalDuration = formatDurationStr(
    item.totalDuration || (isInbound ? item.rawBookingFlight?.returnDuration : item.rawBookingFlight?.duration)
  );

  // 轉機資訊提取
  const hasTransfer =
    segments.length > 1 ||
    Boolean(firstSeg?.transferAfter) ||
    (isInbound ? Boolean(item.rawBookingFlight?.hasReturnTransit) : Boolean(item.rawBookingFlight?.hasTransit));
  const transferInfo = firstSeg?.transferAfter;

  const rawTransitCode =
    transferInfo?.location?.code ||
    (isInbound ? item.rawBookingFlight?.returnTransitAirport : item.rawBookingFlight?.transitAirport);
  const rawTransitCity =
    transferInfo?.location?.city ||
    (isInbound ? item.rawBookingFlight?.returnTransitCity : item.rawBookingFlight?.transitCity);
  // 若轉機城市欄位被瀏覽器自動填入航空公司名稱（如阿聯酋航空），自動改回由機場代碼解析出的城市名稱
  const trimmedTransitCity = (rawTransitCity || '').trim();
  const isAutofilledAirline =
    Boolean(trimmedTransitCity) &&
    (trimmedTransitCity === airlineName.trim() || Boolean(AIRLINE_INFO_MAP[trimmedTransitCity]));
  const transitDisplay = resolveAirportDisplay(
    rawTransitCode,
    isAutofilledAirline ? undefined : rawTransitCity
  );

  const transitArrTime =
    transferInfo?.arrivalTime ||
    transferInfo?.location?.time ||
    (segments.length > 1 ? firstSeg?.arrival?.time : '') ||
    (isInbound ? item.rawBookingFlight?.returnTransitArrivalTime : item.rawBookingFlight?.transitArrivalTime) ||
    '';
  const transitDepTime =
    transferInfo?.departureTime ||
    (segments.length > 1 ? segments[1]?.departure?.time : '') ||
    (isInbound ? item.rawBookingFlight?.returnTransitDepartureTime : item.rawBookingFlight?.transitDepartureTime) ||
    '';

  const rawTransitDuration =
    transferInfo?.duration ||
    (isInbound ? item.rawBookingFlight?.returnTransitDuration : item.rawBookingFlight?.transitDuration) ||
    calculateDurationBetweenTimes(transitArrTime, transitDepTime);
  const transitDuration = rawTransitDuration ? formatDurationStr(rawTransitDuration) : '';

  const nextFlightCode = (
    transferInfo?.nextServiceNumber ||
    (isInbound ? item.rawBookingFlight?.returnTransitFlightCode : item.rawBookingFlight?.transitFlightCode) ||
    ''
  )
    .trim()
    .toUpperCase();

  // 分段飛行時間（若有填寫分段時長則優先顯示）
  const leg1Duration = firstSeg?.duration
    ? formatDurationStr(firstSeg.duration)
    : formatDurationStr(
        isInbound ? item.rawBookingFlight?.returnFirstLegDuration : item.rawBookingFlight?.firstLegDuration
      );
  const leg2Duration =
    segments.length > 1 && lastSeg?.duration
      ? formatDurationStr(lastSeg.duration)
      : formatDurationStr(
          isInbound ? item.rawBookingFlight?.returnSecondLegDuration : item.rawBookingFlight?.secondLegDuration
        );

  // 格式化行李重量
  const formatBagWeight = (val?: string | number, defaultStr: string = '未填寫'): string => {
    if (val === undefined || val === null || val === '') return defaultStr;
    const str = String(val).trim();
    if (/^\d+$/.test(str)) {
      return `${str}kg`;
    }
    return str;
  };

  const baggageChecked = formatBagWeight(
    item.baggage?.checked || item.rawBookingFlight?.checkedBag || item.rawBookingFlight?.baggage,
    '未填寫'
  );
  const baggageCarryOn = formatBagWeight(
    item.baggage?.carryOn || item.rawBookingFlight?.carryOnBag,
    '未填寫'
  );

  // 外部地圖導航
  const handleOpenMap = () => {
    if (onOpenMap) {
      onOpenMap();
      return;
    }
    if (rawDep && rawArr) {
      defaultMapProvider.openRoute(rawDep, rawArr);
    }
  };

  const images = item.images || [];
  const photoPlacement = item.photoPlacement || 'middle';
  const photoOffsetY = item.photoOffsetY ?? 50;

  const renderPhotoBanner = (isTopBanner: boolean) => {
    if (images.length === 0) return null;
    return (
      <div
        className={
          isTopBanner
            ? 'relative w-full h-44 sm:h-56 overflow-hidden border-b border-[#EAE5DC] group/photo cursor-pointer bg-gray-100'
            : 'relative w-full rounded-2xl overflow-hidden border border-[#EAE5DC] shadow-sm group/photo cursor-pointer bg-gray-100 mt-3.5'
        }
        onClick={(e) => {
          e.stopPropagation();
          onOpenLightbox?.(images, 0);
        }}
      >
        <img
          src={images[0]}
          alt={item.title || airlineName}
          className={`w-full ${isTopBanner ? 'h-full' : 'h-44 sm:h-56'} object-cover transition-transform duration-500 group-hover/photo:scale-105`}
          style={{ objectPosition: `center ${photoOffsetY}%` }}
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-end justify-between p-3 text-white">
          <span className="text-xs font-black drop-shadow-md">點擊查看大圖</span>
          <span className="text-[11px] font-bold bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-full drop-shadow-md flex items-center gap-1">
            <Camera size={12} /> {images.length > 1 ? `${images.length} 張相片` : '相片'}
          </span>
        </div>
        {images.length > 1 && (
          <div className="absolute bottom-2.5 right-2.5 bg-cocoa/75 backdrop-blur-md text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1 border border-white/20">
            <Camera size={11} />
            <span>1/{images.length}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`w-full bg-white rounded-[28px] sm:rounded-[32px] border border-[#EAE5DC] shadow-[0_4px_24px_rgba(0,0,0,0.03)] hover:shadow-[0_6px_28px_rgba(0,0,0,0.05)] transition-all overflow-hidden relative select-none ${className}`}
    >
      {/* 卡片頂部封面橫幅 */}
      {photoPlacement === 'top' && renderPhotoBanner(true)}

      <div className="p-4 sm:p-6 relative">
        {/* ===================================================================== */}
        {/* 一、HEADER：墨綠色飛機圓標 + 航空公司名稱 + 右側總時長/操作按鈕          */}
        {/* ===================================================================== */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#F0EBE3] gap-2">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#4A6F52] text-white flex items-center justify-center flex-shrink-0 shadow-xs">
              <Plane size={19} className="transform rotate-45" />
            </div>

            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base sm:text-lg font-black text-[#2D241E] tracking-tight break-words leading-snug">
                  {airlineName}
                </span>
                {item.directionType === 'inbound' && (
                  <span className="bg-[#FDF1E6] text-[#B8652B] text-[10px] font-black px-2 py-0.5 rounded-md">
                    回程
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {totalDuration && (
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="border border-[#E2D6BE] bg-[#FFFDF9] hover:bg-[#F8F6F0] active:scale-95 rounded-full px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-black text-[#3A2E26] flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                title="查看航班詳情"
              >
                <Clock size={13} className="text-[#6D6357]" />
                <span className="font-sans tabular-nums tracking-tight">{totalDuration}</span>
                <ChevronRight
                  size={13}
                  className={`text-[#8C827A] transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                />
              </button>
            )}

            {(onEdit || onDelete) && (
              <div className="flex items-center gap-0.5 ml-0.5">
                {onEdit && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(item);
                    }}
                    className="p-1.5 rounded-full text-[#9C9180] hover:text-[#4A6F52] hover:bg-[#F3F6F4] transition-colors"
                    title="編輯航班"
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
                    title="刪除航班"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ===================================================================== */}
        {/* 二、垂直航程時間軸（支援：第一段航程 -> 中間轉機資訊區塊 -> 第二段航程）  */}
        {/* ===================================================================== */}
        <div className="pt-4 pb-2">
          {hasTransfer ? (
            <div className="relative">
              {/* ---------- 第一段航程 (出發地 -> 轉機地) ---------- */}
              <div className="flex items-stretch gap-3">
                {/* 左側垂直時間軸點與連線 */}
                <div className="flex flex-col items-center pt-1.5 flex-shrink-0 w-4">
                  <div className="w-3.5 h-3.5 rounded-full border-[3px] border-[#4A6F52] bg-white flex-shrink-0 z-10" />
                  <div className="w-[1.5px] flex-1 bg-[#CBD7CD] my-0.5" />
                </div>

                {/* 第一段內容 */}
                <div className="flex-1 min-w-0 pb-3.5">
                  <div className="flex items-start justify-between gap-2">
                    {/* 左側：出發城市與機場 */}
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-baseline gap-1.5 flex-wrap">
                        <span className="text-base sm:text-xl font-black text-[#2A1E17] tracking-tight break-words">
                          {depDisplay.city}
                        </span>
                        <span className="text-xs sm:text-sm font-black font-sans tabular-nums text-[#3D322B]">
                          {depDisplay.code}
                        </span>
                      </div>
                      <div className="text-[11px] sm:text-xs text-[#7D736A] font-medium mt-0.5 leading-snug break-words">
                        {depDisplay.subName}
                      </div>
                      <div className="text-2xl sm:text-[28px] font-black text-[#2A1E17] font-sans tabular-nums tracking-tight mt-1 leading-none">
                        {depTime}
                      </div>
                    </div>

                    {/* 中央虛線 + 小飛機 */}
                    <div className="w-10 sm:w-16 flex-shrink-0 flex items-center justify-center pt-2 gap-1">
                      <div className="flex-1 h-0 border-b-2 border-dashed border-[#CFD8D2]" />
                      <Plane size={13} className="text-[#566B5D] transform rotate-90 flex-shrink-0" />
                      <div className="flex-1 h-0 border-b-2 border-dashed border-[#CFD8D2]" />
                    </div>

                    {/* 右側：轉機抵達城市與機場 */}
                    <div className="flex-1 min-w-0 text-right">
                      <div className="flex items-baseline justify-end gap-1.5 flex-wrap">
                        <span className="text-base sm:text-xl font-black text-[#2A1E17] tracking-tight break-words">
                          {transitDisplay.city}
                        </span>
                        <span className="text-xs sm:text-sm font-black font-sans tabular-nums text-[#3D322B]">
                          {transitDisplay.code}
                        </span>
                      </div>
                      <div className="text-[11px] sm:text-xs text-[#7D736A] font-medium mt-0.5 leading-snug break-words">
                        {transitDisplay.subName}
                      </div>
                      <div className="text-2xl sm:text-[28px] font-black text-[#2A1E17] font-sans tabular-nums tracking-tight mt-1 leading-none">
                        {transitArrTime || '--:--'}
                      </div>
                    </div>
                  </div>

                  {/* 第一段膠囊標籤 */}
                  <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 bg-[#E5F0E8] text-[#2F5338] text-[11px] font-bold px-2.5 py-1 rounded-full">
                      <Plane size={11} className="transform rotate-45" />
                      <span>
                        {leg1Duration
                          ? `飛行時間 ${leg1Duration}`
                          : flightNumber && flightNumber !== 'FLIGHT'
                            ? `第 1 段 · ${flightNumber}`
                            : '第 1 段航程'}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* ---------- 中間轉機資訊區塊（對應附件中間空白處） ---------- */}
              <div className="flex items-stretch gap-3">
                {/* 垂直連接線延續 */}
                <div className="flex flex-col items-center flex-shrink-0 w-4">
                  <div className="w-[1.5px] flex-1 bg-[#CBD7CD]" />
                </div>

                {/* 轉機資訊卡片 */}
                <div className="flex-1 min-w-0 pb-3.5">
                  <div className="bg-[#FDF8EE] border border-[#EFE2C6] rounded-2xl p-3 sm:p-3.5 space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="bg-[#F4E1B8] text-[#7D5720] text-[10px] font-black px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                          <ArrowRightLeft size={10} />
                          <span>轉機資訊</span>
                        </span>
                        <span className="text-xs sm:text-sm font-black text-[#3A2B18]">
                          {transitDisplay.city} {transitDisplay.code}
                        </span>
                      </div>

                      {transitDuration && (
                        <span className="bg-white border border-[#EAD9B5] text-[#8C6219] text-[11px] font-sans tabular-nums font-black px-2.5 py-0.5 rounded-full shadow-2xs">
                          停留 {transitDuration}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2 flex-wrap text-xs text-[#6B5433] pt-1 border-t border-dashed border-[#EAD9B5]">
                      <div className="flex items-center gap-2 sm:gap-3 flex-wrap font-bold">
                        <span>
                          抵達{' '}
                          <strong className="font-sans tabular-nums text-[#2A1E17]">
                            {transitArrTime || '--:--'}
                          </strong>
                        </span>
                        <span className="text-[#C8B289]">➔</span>
                        <span>
                          起飛{' '}
                          <strong className="font-sans tabular-nums text-[#2A1E17]">
                            {transitDepTime || '--:--'}
                          </strong>
                        </span>
                      </div>

                      {nextFlightCode && (
                        <span className="text-[11px] font-sans tabular-nums font-black text-[#4A6F52] bg-[#EAF2EC] px-2 py-0.5 rounded-md">
                          銜接 {nextFlightCode}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* ---------- 第二段航程 (轉機地 -> 目的地) ---------- */}
              <div className="flex items-stretch gap-3">
                {/* 左側垂直時間軸終點圓點與餘線 */}
                <div className="flex flex-col items-center pt-1.5 flex-shrink-0 w-4">
                  <div className="w-3.5 h-3.5 rounded-full border-[3px] border-[#4A6F52] bg-white flex-shrink-0 z-10" />
                  <div className="w-[1.5px] flex-1 bg-gradient-to-b from-[#CBD7CD] to-transparent my-0.5" />
                </div>

                {/* 第二段內容 */}
                <div className="flex-1 min-w-0 pb-1">
                  <div className="flex items-start justify-between gap-2">
                    {/* 左側：轉機起飛城市與機場 */}
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-baseline gap-1.5 flex-wrap">
                        <span className="text-base sm:text-xl font-black text-[#2A1E17] tracking-tight break-words">
                          {transitDisplay.city}
                        </span>
                        <span className="text-xs sm:text-sm font-black font-sans tabular-nums text-[#3D322B]">
                          {transitDisplay.code}
                        </span>
                      </div>
                      <div className="text-[11px] sm:text-xs text-[#7D736A] font-medium mt-0.5 leading-snug break-words">
                        {transitDisplay.subName}
                      </div>
                      <div className="flex items-baseline gap-1.5 flex-wrap mt-1">
                        <span className="text-2xl sm:text-[28px] font-black text-[#2A1E17] font-sans tabular-nums tracking-tight leading-none">
                          {transitDepTime || '--:--'}
                        </span>
                        <span className="text-[10px] sm:text-[11px] text-[#8C827A] font-medium">
                          (當地時間)
                        </span>
                      </div>
                    </div>

                    {/* 中央虛線 + 小飛機 */}
                    <div className="w-10 sm:w-16 flex-shrink-0 flex items-center justify-center pt-2 gap-1">
                      <div className="flex-1 h-0 border-b-2 border-dashed border-[#CFD8D2]" />
                      <Plane size={13} className="text-[#566B5D] transform rotate-90 flex-shrink-0" />
                      <div className="flex-1 h-0 border-b-2 border-dashed border-[#CFD8D2]" />
                    </div>

                    {/* 右側：最終目的地城市與機場 */}
                    <div className="flex-1 min-w-0 text-right">
                      <div className="flex items-baseline justify-end gap-1.5 flex-wrap">
                        <span className="text-base sm:text-xl font-black text-[#2A1E17] tracking-tight break-words">
                          {arrDisplay.city}
                        </span>
                        <span className="text-xs sm:text-sm font-black font-sans tabular-nums text-[#3D322B]">
                          {arrDisplay.code}
                        </span>
                      </div>
                      <div className="text-[11px] sm:text-xs text-[#7D736A] font-medium mt-0.5 leading-snug break-words">
                        {arrDisplay.subName}
                      </div>
                      <div className="mt-1 flex flex-col items-end">
                        <span className="text-2xl sm:text-[28px] font-black text-[#2A1E17] font-sans tabular-nums tracking-tight leading-none">
                          {arrTime}
                        </span>
                        <span className="text-[10px] sm:text-[11px] text-[#8C827A] font-medium mt-0.5">
                          (當地時間)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 第二段膠囊標籤 */}
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 bg-[#E5F0E8] text-[#2F5338] text-[11px] font-bold px-2.5 py-1 rounded-full">
                      <Plane size={11} className="transform rotate-45" />
                      <span>
                        {leg2Duration
                          ? `飛行時間 ${leg2Duration}`
                          : nextFlightCode
                            ? `第 2 段 · ${nextFlightCode}`
                            : '第 2 段航程'}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ---------- 直飛單段航程 ---------- */
            <div className="flex items-stretch gap-3">
              <div className="flex flex-col items-center pt-1.5 flex-shrink-0 w-4">
                <div className="w-3.5 h-3.5 rounded-full border-[3px] border-[#4A6F52] bg-white flex-shrink-0 z-10" />
                <div className="w-[1.5px] flex-1 bg-gradient-to-b from-[#CBD7CD] to-transparent my-0.5" />
              </div>

              <div className="flex-1 min-w-0 pb-1">
                <div className="flex items-start justify-between gap-2">
                  {/* 左側：出發地 */}
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-baseline gap-1.5 flex-wrap">
                      <span className="text-base sm:text-xl font-black text-[#2A1E17] tracking-tight break-words">
                        {depDisplay.city}
                      </span>
                      <span className="text-xs sm:text-sm font-black font-sans tabular-nums text-[#3D322B]">
                        {depDisplay.code}
                      </span>
                    </div>
                    <div className="text-[11px] sm:text-xs text-[#7D736A] font-medium mt-0.5 leading-snug break-words">
                      {depDisplay.subName}
                    </div>
                    <div className="text-2xl sm:text-[28px] font-black text-[#2A1E17] font-sans tabular-nums tracking-tight mt-1.5 leading-none">
                      {depTime}
                    </div>
                  </div>

                  {/* 中央虛線 + 小飛機 */}
                  <div className="w-10 sm:w-16 flex-shrink-0 flex items-center justify-center pt-2 gap-1">
                    <div className="flex-1 h-0 border-b-2 border-dashed border-[#CFD8D2]" />
                    <Plane size={13} className="text-[#566B5D] transform rotate-90 flex-shrink-0" />
                    <div className="flex-1 h-0 border-b-2 border-dashed border-[#CFD8D2]" />
                  </div>

                  {/* 右側：目的地 */}
                  <div className="flex-1 min-w-0 text-right">
                    <div className="flex items-baseline justify-end gap-1.5 flex-wrap">
                      <span className="text-base sm:text-xl font-black text-[#2A1E17] tracking-tight break-words">
                        {arrDisplay.city}
                      </span>
                      <span className="text-xs sm:text-sm font-black font-sans tabular-nums text-[#3D322B]">
                        {arrDisplay.code}
                      </span>
                    </div>
                    <div className="text-[11px] sm:text-xs text-[#7D736A] font-medium mt-0.5 leading-snug break-words">
                      {arrDisplay.subName}
                    </div>
                    <div className="mt-1.5 flex flex-col items-end">
                      <span className="text-2xl sm:text-[28px] font-black text-[#2A1E17] font-sans tabular-nums tracking-tight leading-none">
                        {arrTime}
                      </span>
                      <span className="text-[10px] sm:text-[11px] text-[#8C827A] font-medium mt-0.5">
                        (當地時間)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 bg-[#E5F0E8] text-[#2F5338] text-[11px] font-bold px-2.5 py-1 rounded-full">
                    <Plane size={11} className="transform rotate-45" />
                    <span>{totalDuration ? `直飛 · 飛行時間 ${totalDuration}` : '直飛無中停'}</span>
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 卡片中間相片橫幅 (預設) */}
        {photoPlacement === 'middle' && renderPhotoBanner(false)}

        {/* ===================================================================== */}
        {/* 三、最底層獨立行李條 (託運行李 | 手提行李 | 查看詳情 >)                  */}
        {/* ===================================================================== */}
        <div className="mt-3.5 bg-[#EEF4EE] rounded-2xl px-3.5 py-2.5 flex items-center justify-between text-xs text-[#2F4636] font-semibold gap-2 flex-wrap transition-colors">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Luggage size={13} className="text-[#4A6F52]" />
              <span>
                託運行李 <strong className="font-bold text-[#1F3124]">{baggageChecked}</strong>
              </span>
            </div>

            <span className="text-[#C5D4C8]">|</span>

            <div className="flex items-center gap-1.5">
              <Briefcase size={13} className="text-[#4A6F52]" />
              <span>
                手提行李 <strong className="font-bold text-[#1F3124]">{baggageCarryOn}</strong>
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-0.5 text-xs font-black text-[#2E5438] hover:text-[#1D3724] cursor-pointer ml-auto"
          >
            <span>{isExpanded ? '收合詳情' : '查看詳情'}</span>
            <ChevronRight
              size={13}
              className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
            />
          </button>
        </div>

        {/* ===================================================================== */}
        {/* 四、展開詳情區塊 (票價、訂位資訊、備註、地圖導航)                        */}
        {/* ===================================================================== */}
        {isExpanded && (
          <div className="mt-3.5 pt-3.5 border-t border-[#F0EBE3] space-y-3 text-xs text-[#4A443B] animate-in fade-in duration-200">
            <div className="flex items-center justify-between bg-[#FAF8F5] p-3 rounded-2xl border border-[#EDE7DC] flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                {flightNumber && flightNumber !== 'FLIGHT' && (
                  <span className="font-mono font-black text-[#2E5438] bg-[#E5F0E8] px-2 py-0.5 rounded-md text-[11px]">
                    {flightNumber}
                  </span>
                )}
                {nextFlightCode && (
                  <span className="font-mono font-bold text-[#8C6219] bg-[#FDF8EE] border border-[#EFE2C6] px-2 py-0.5 rounded-md text-[11px]">
                    轉機 {nextFlightCode}
                  </span>
                )}
                <span className="text-gray-400 font-bold">訂位資訊:</span>
                <span className="font-mono font-bold text-cocoa">
                  {item.bookingReference || '確認已開票'}
                </span>
                {item.classType && (
                  <span className="bg-white px-2 py-0.5 rounded border border-[#E0D9CD] text-[10px] text-gray-600 font-bold">
                    {item.classType}
                  </span>
                )}
              </div>

              {item.cost !== undefined && item.cost > 0 && (
                <div className="text-right ml-auto">
                  <span className="text-[11px] text-gray-400 font-bold mr-1">每人費用</span>
                  <span className="font-mono font-black text-sm text-[#4A6F52]">
                    {item.currency || 'TWD'} {Number(item.cost).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {item.note && (
              <div className="flex items-start gap-2 bg-[#FFFDF7] p-3 rounded-2xl border border-[#EFE7D6] text-xs text-[#5A4F42]">
                <StickyNote size={14} className="text-[#B5924C] mt-0.5 flex-shrink-0" />
                <p className="whitespace-pre-wrap leading-relaxed font-medium">{item.note}</p>
              </div>
            )}

            <div className="flex items-center justify-between pt-0.5">
              <button
                type="button"
                onClick={handleOpenMap}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#F3F6F4] text-[#4A6F52] border border-[#D5E2D9] font-black text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <MapPin size={13} />
                <span>在地圖查看航線</span>
              </button>

              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="text-xs font-black text-[#8C806F] hover:text-[#4A4235] flex items-center gap-1 px-3 py-1.5 rounded-full hover:bg-[#F7F4EE] transition-colors"
              >
                <span>收合詳情</span>
                <ChevronUp size={13} />
              </button>
            </div>
          </div>
        )}

        {/* 卡片最底相片橫幅 */}
        {photoPlacement === 'bottom' && renderPhotoBanner(false)}
      </div>
    </div>
  );
};
