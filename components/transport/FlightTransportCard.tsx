import React from 'react';
import {
  Plane,
  Clock,
  Luggage,
  Briefcase,
  ArrowRightLeft,
  Edit3,
  Trash2,
  Camera
} from 'lucide-react';
import { TransportItemModel, TransportSegmentModel } from './types';
import { resolveAirportDisplay, AIRLINE_INFO_MAP } from './airlineMap';
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
  onEdit,
  onDelete,
  onOpenLightbox,
  className = '',
}) => {

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

  // 日期格式化（與行事曆綠框 10/15 一致的 M/D 格式）
  const formatMonthDay = (dateStr?: string): string => {
    if (!dateStr) return '';
    const match = dateStr.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (!match) return '';
    return `${Number(match[2])}/${Number(match[3])}`;
  };

  const addDaysToIsoDate = (dateStr: string, days: number): string => {
    const match = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (!match) return '';
    const d = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]) + days);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  const rawDepDate = rawDep?.date || (isInbound ? item.rawBookingFlight?.returnDate?.slice(0, 10) : item.rawBookingFlight?.date?.slice(0, 10)) || '';
  const rawArrDate = rawArr?.date || (isInbound ? item.rawBookingFlight?.returnArrivalDate?.slice(0, 10) : item.rawBookingFlight?.arrivalDate?.slice(0, 10)) || '';
  const depDateLabel = formatMonthDay(rawDepDate);
  const arrDateLabel = formatMonthDay(rawArrDate);

  // 推算轉機抵達/起飛日期（僅在有出發日且時間有效時推算）
  const isTimeValid = (t?: string) => Boolean(t && /^\d{1,2}:\d{2}$/.test(t.trim()) && t.trim() !== '--:--');
  let transitArrDateRaw = '';
  let transitDepDateRaw = '';
  if (rawDepDate && isTimeValid(transitArrTime)) {
    if (rawArrDate && rawArrDate === rawDepDate) {
      transitArrDateRaw = rawDepDate;
    } else if (isTimeValid(depTime)) {
      transitArrDateRaw = transitArrTime < depTime ? addDaysToIsoDate(rawDepDate, 1) : rawDepDate;
    } else {
      transitArrDateRaw = rawDepDate;
    }
  }
  if (transitArrDateRaw && isTimeValid(transitDepTime)) {
    transitDepDateRaw = transitDepTime < transitArrTime ? addDaysToIsoDate(transitArrDateRaw, 1) : transitArrDateRaw;
  } else if (rawArrDate && isTimeValid(transitDepTime)) {
    transitDepDateRaw = isTimeValid(arrTime) && arrTime < transitDepTime ? addDaysToIsoDate(rawArrDate, -1) : rawArrDate;
  }
  const transitArrDateLabel = formatMonthDay(transitArrDateRaw);
  const transitDepDateLabel = formatMonthDay(transitDepDateRaw);

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
              <div
                className="border border-[#E2D6BE] bg-[#FFFDF9] rounded-full px-3 py-1 sm:py-1.5 text-sm sm:text-[15px] font-black text-[#3A2E26] flex items-center gap-1.5 shadow-2xs"
              >
                <Clock size={14} className="text-[#6D6357]" />
                <span className="font-sans tabular-nums tracking-tight">{totalDuration}</span>
              </div>
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
                        <span className="text-sm sm:text-[15px] font-black font-sans tabular-nums text-[#3D322B]">
                          {depDisplay.code}
                        </span>
                      </div>
                      <div className="text-xs sm:text-[13px] text-[#6E645B] font-bold mt-0.5 leading-snug break-words">
                        {depDisplay.subName}
                      </div>
                      {depDateLabel && (
                        <div className="text-[15px] font-black text-[#4A6F52] font-sans tabular-nums tracking-tight leading-tight mt-1.5">
                          {depDateLabel}
                        </div>
                      )}
                      <div className={`text-2xl sm:text-[28px] font-black text-[#2A1E17] font-sans tabular-nums tracking-tight leading-none ${depDateLabel ? 'mt-0.5' : 'mt-1.5'}`}>
                        {depTime}
                      </div>
                    </div>

                    {/* 中央虛線 + 小飛機 */}
                    <div className="w-10 sm:w-16 flex-shrink-0 flex items-center justify-center pt-2 gap-1">
                      <div className="flex-1 h-0 border-b-2 border-dashed border-[#CFD8D2]" />
                      <Plane size={13} className="text-[#566B5D] transform rotate-45 flex-shrink-0" />
                      <div className="flex-1 h-0 border-b-2 border-dashed border-[#CFD8D2]" />
                    </div>

                    {/* 右側：轉機抵達城市與機場 */}
                    <div className="flex-1 min-w-0 text-right">
                      <div className="flex items-baseline justify-end gap-1.5 flex-wrap">
                        <span className="text-base sm:text-xl font-black text-[#2A1E17] tracking-tight break-words">
                          {transitDisplay.city}
                        </span>
                        <span className="text-sm sm:text-[15px] font-black font-sans tabular-nums text-[#3D322B]">
                          {transitDisplay.code}
                        </span>
                      </div>
                      <div className="text-xs sm:text-[13px] text-[#6E645B] font-bold mt-0.5 leading-snug break-words">
                        {transitDisplay.subName}
                      </div>
                      {transitArrDateLabel && (
                        <div className="text-[15px] font-black text-[#4A6F52] font-sans tabular-nums tracking-tight leading-tight mt-1.5">
                          {transitArrDateLabel}
                        </div>
                      )}
                      <div className={`text-2xl sm:text-[28px] font-black text-[#2A1E17] font-sans tabular-nums tracking-tight leading-none ${transitArrDateLabel ? 'mt-0.5' : 'mt-1.5'}`}>
                        {transitArrTime || '--:--'}
                      </div>
                    </div>
                  </div>

                  {/* 第一段膠囊標籤 */}
                  <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 bg-[#E5F0E8] text-[#2F5338] text-xs sm:text-[13px] font-bold px-3 py-1 rounded-full">
                      <Plane size={12} className="transform rotate-45" />
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
                  <div className="bg-[#FDF8EE] border border-[#EFE2C6] rounded-2xl p-3.5 sm:p-4 space-y-2.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="bg-[#F4E1B8] text-[#7D5720] text-xs font-black px-2.5 py-0.5 rounded-md inline-flex items-center gap-1">
                          <ArrowRightLeft size={11} />
                          <span>轉機資訊</span>
                        </span>
                        <span className="text-sm sm:text-[15px] font-black text-[#3A2B18]">
                          {transitDisplay.city} {transitDisplay.code}
                        </span>
                      </div>

                      {transitDuration && (
                        <span className="bg-white border-2 border-[#E2CFA3] text-[#7D5720] text-[15px] sm:text-base font-sans tabular-nums font-black px-3 py-1 rounded-full shadow-2xs leading-tight tracking-tight">
                          停留 {transitDuration}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2 flex-wrap text-sm sm:text-[15px] text-[#6B5433] pt-1.5 border-t border-dashed border-[#EAD9B5]">
                      <div className="flex items-center gap-2 sm:gap-3 flex-wrap font-bold">
                        <span>
                          抵達{' '}
                          <strong className="font-sans tabular-nums font-black text-[#2A1E17]">
                            {transitArrTime || '--:--'}
                          </strong>
                        </span>
                        <span className="text-[#C8B289]">➔</span>
                        <span>
                          起飛{' '}
                          <strong className="font-sans tabular-nums font-black text-[#2A1E17]">
                            {transitDepTime || '--:--'}
                          </strong>
                        </span>
                      </div>

                      {nextFlightCode && (
                        <span className="text-xs sm:text-sm font-sans tabular-nums font-black text-[#4A6F52] bg-[#EAF2EC] px-2.5 py-0.5 rounded-md">
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
                        <span className="text-sm sm:text-[15px] font-black font-sans tabular-nums text-[#3D322B]">
                          {transitDisplay.code}
                        </span>
                      </div>
                      <div className="text-xs sm:text-[13px] text-[#6E645B] font-bold mt-0.5 leading-snug break-words">
                        {transitDisplay.subName}
                      </div>
                      {transitDepDateLabel && (
                        <div className="text-[15px] font-black text-[#4A6F52] font-sans tabular-nums tracking-tight leading-tight mt-1.5">
                          {transitDepDateLabel}
                        </div>
                      )}
                      <div className={`flex items-baseline gap-1.5 flex-wrap ${transitDepDateLabel ? 'mt-0.5' : 'mt-1.5'}`}>
                        <span className="text-2xl sm:text-[28px] font-black text-[#2A1E17] font-sans tabular-nums tracking-tight leading-none">
                          {transitDepTime || '--:--'}
                        </span>
                        <span className="text-[11px] sm:text-xs text-[#7D736A] font-bold">
                          (當地時間)
                        </span>
                      </div>
                    </div>

                    {/* 中央虛線 + 小飛機 */}
                    <div className="w-10 sm:w-16 flex-shrink-0 flex items-center justify-center pt-2 gap-1">
                      <div className="flex-1 h-0 border-b-2 border-dashed border-[#CFD8D2]" />
                      <Plane size={13} className="text-[#566B5D] transform rotate-45 flex-shrink-0" />
                      <div className="flex-1 h-0 border-b-2 border-dashed border-[#CFD8D2]" />
                    </div>

                    {/* 右側：最終目的地城市與機場 */}
                    <div className="flex-1 min-w-0 text-right">
                      <div className="flex items-baseline justify-end gap-1.5 flex-wrap">
                        <span className="text-base sm:text-xl font-black text-[#2A1E17] tracking-tight break-words">
                          {arrDisplay.city}
                        </span>
                        <span className="text-sm sm:text-[15px] font-black font-sans tabular-nums text-[#3D322B]">
                          {arrDisplay.code}
                        </span>
                      </div>
                      <div className="text-xs sm:text-[13px] text-[#6E645B] font-bold mt-0.5 leading-snug break-words">
                        {arrDisplay.subName}
                      </div>
                      {arrDateLabel && (
                        <div className="text-[15px] font-black text-[#4A6F52] font-sans tabular-nums tracking-tight leading-tight mt-1.5">
                          {arrDateLabel}
                        </div>
                      )}
                      <div className={`flex flex-col items-end ${arrDateLabel ? 'mt-0.5' : 'mt-1.5'}`}>
                        <span className="text-2xl sm:text-[28px] font-black text-[#2A1E17] font-sans tabular-nums tracking-tight leading-none">
                          {arrTime}
                        </span>
                        <span className="text-[11px] sm:text-xs text-[#7D736A] font-bold mt-0.5">
                          (當地時間)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 第二段膠囊標籤 */}
                  <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 bg-[#E5F0E8] text-[#2F5338] text-xs sm:text-[13px] font-bold px-3 py-1 rounded-full">
                      <Plane size={12} className="transform rotate-45" />
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
                      <span className="text-sm sm:text-[15px] font-black font-sans tabular-nums text-[#3D322B]">
                        {depDisplay.code}
                      </span>
                    </div>
                    <div className="text-xs sm:text-[13px] text-[#6E645B] font-bold mt-0.5 leading-snug break-words">
                      {depDisplay.subName}
                    </div>
                    {depDateLabel && (
                      <div className="text-[15px] font-black text-[#4A6F52] font-sans tabular-nums tracking-tight leading-tight mt-1.5">
                        {depDateLabel}
                      </div>
                    )}
                    <div className={`text-2xl sm:text-[28px] font-black text-[#2A1E17] font-sans tabular-nums tracking-tight leading-none ${depDateLabel ? 'mt-0.5' : 'mt-1.5'}`}>
                      {depTime}
                    </div>
                  </div>

                  {/* 中央虛線 + 小飛機 */}
                  <div className="w-10 sm:w-16 flex-shrink-0 flex items-center justify-center pt-2 gap-1">
                    <div className="flex-1 h-0 border-b-2 border-dashed border-[#CFD8D2]" />
                    <Plane size={13} className="text-[#566B5D] transform rotate-45 flex-shrink-0" />
                    <div className="flex-1 h-0 border-b-2 border-dashed border-[#CFD8D2]" />
                  </div>

                  {/* 右側：目的地 */}
                  <div className="flex-1 min-w-0 text-right">
                    <div className="flex items-baseline justify-end gap-1.5 flex-wrap">
                      <span className="text-base sm:text-xl font-black text-[#2A1E17] tracking-tight break-words">
                        {arrDisplay.city}
                      </span>
                      <span className="text-sm sm:text-[15px] font-black font-sans tabular-nums text-[#3D322B]">
                        {arrDisplay.code}
                      </span>
                    </div>
                    <div className="text-xs sm:text-[13px] text-[#6E645B] font-bold mt-0.5 leading-snug break-words">
                      {arrDisplay.subName}
                    </div>
                    {arrDateLabel && (
                      <div className="text-[15px] font-black text-[#4A6F52] font-sans tabular-nums tracking-tight leading-tight mt-1.5">
                        {arrDateLabel}
                      </div>
                    )}
                    <div className={`flex flex-col items-end ${arrDateLabel ? 'mt-0.5' : 'mt-1.5'}`}>
                      <span className="text-2xl sm:text-[28px] font-black text-[#2A1E17] font-sans tabular-nums tracking-tight leading-none">
                        {arrTime}
                      </span>
                      <span className="text-[11px] sm:text-xs text-[#7D736A] font-bold mt-0.5">
                        (當地時間)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 bg-[#E5F0E8] text-[#2F5338] text-xs sm:text-[13px] font-bold px-3 py-1 rounded-full">
                    <Plane size={12} className="transform rotate-45" />
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
        {/* 三、最底層獨立行李條 (託運行李 | 手提行李)                               */}
        {/* ===================================================================== */}
        <div className="mt-3.5 bg-[#EEF4EE] rounded-2xl px-3.5 py-2.5 flex items-center justify-between text-[13px] sm:text-sm text-[#2F4636] font-semibold gap-2 flex-wrap">
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
        </div>

        {/* 卡片最底相片橫幅 */}
        {photoPlacement === 'bottom' && renderPhotoBanner(false)}
      </div>
    </div>
  );
};
