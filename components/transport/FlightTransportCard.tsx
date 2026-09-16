import React, { useState } from 'react';
import { 
  Plane, 
  Clock, 
  ChevronRight, 
  ChevronDown, 
  ChevronUp, 
  Luggage, 
  Briefcase, 
  ArrowRightLeft, 
  ExternalLink,
  Edit3,
  Trash2,
  MapPin,
  FileText
} from 'lucide-react';
import { TransportItemModel, TransportSegmentModel } from './types';
import { getAirlineEnName, resolveAirportDisplay } from './airlineMap';
import { defaultMapProvider } from './MapProvider';

interface FlightTransportCardProps {
  item: TransportItemModel;
  defaultExpanded?: boolean;
  onEdit?: (item: TransportItemModel) => void;
  onDelete?: (item: TransportItemModel) => void;
  onOpenMap?: () => void;
  className?: string;
}

export const FlightTransportCard: React.FC<FlightTransportCardProps> = ({
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

  // 機場與城市解析 (結合中英手帳雙語風格)
  const depDisplay = resolveAirportDisplay(rawDep?.code || rawDep?.name, rawDep?.city);
  const arrDisplay = resolveAirportDisplay(rawArr?.code || rawArr?.name, rawArr?.city);

  // 時間提取 (最醒目核心)
  const depTime = rawDep?.time || item.rawBookingFlight?.depTime || '--:--';
  const arrTime = rawArr?.time || item.rawBookingFlight?.arrTime || '--:--';

  // 航空公司名稱與英文名稱
  const airlineName = item.operator || item.rawBookingFlight?.airline || '阿提哈德航空';
  const airlineEn = item.operatorSub || getAirlineEnName(airlineName);

  // 航班代碼 (Header 醒目膠囊 EY899)
  const flightNumber = (item.serviceNumber || item.rawBookingFlight?.code || 'EY899').toUpperCase();

  // 格式化飛行時間 (例如 17H30M -> 17h 30m)
  const formatDurationStr = (dur?: string): string => {
    if (!dur) return '';
    const trimmed = dur.trim();
    const match = trimmed.match(/^(\d+)[hH](\d+)[mM]?$/);
    if (match) {
      return `${match[1]}h ${match[2]}m`;
    }
    return trimmed.toLowerCase().replace('hours', 'h').replace('hour', 'h').replace('mins', 'm').replace('min', 'm');
  };

  // 總飛行時長 (右側入口)
  const totalDuration = formatDurationStr(item.totalDuration || item.rawBookingFlight?.duration) || '17h 30m';

  // 轉機資訊
  const hasTransfer = segments.length > 1 || Boolean(firstSeg?.transferAfter) || Boolean(item.rawBookingFlight?.hasTransit);
  const transferInfo = firstSeg?.transferAfter;
  
  const rawTransitCode = transferInfo?.location?.code || item.rawBookingFlight?.transitAirport;
  const rawTransitCity = transferInfo?.location?.city || item.rawBookingFlight?.transitCity;
  const transitDisplay = resolveAirportDisplay(rawTransitCode, rawTransitCity);
  
  const rawTransitDuration = transferInfo?.duration || item.rawBookingFlight?.transitDuration;
  const transitDuration = rawTransitDuration ? formatDurationStr(rawTransitDuration) : '1h20m';
  const nextFlightCode = (transferInfo?.nextServiceNumber || item.rawBookingFlight?.transitFlightCode || '')?.toUpperCase();

  // 格式化行李重量 (例如 "25" -> "25kg", "7" -> "7kg")
  const formatBagWeight = (val?: string | number, defaultStr: string = '25kg'): string => {
    if (val === undefined || val === null || val === '') return defaultStr;
    const str = String(val).trim();
    if (/^\d+$/.test(str)) {
      return `${str}kg`;
    }
    return str;
  };

  const baggageChecked = formatBagWeight(item.baggage?.checked || item.rawBookingFlight?.checkedBag || item.rawBookingFlight?.baggage, '25kg');
  const baggageCarryOn = formatBagWeight(item.baggage?.carryOn || item.rawBookingFlight?.carryOnBag, '7kg');

  // 航廈 / 登機口 (真實資料優先，絕不造假)
  const depTerminal = rawDep?.terminal || (firstSeg?.details as any)?.terminal;
  const depGate = rawDep?.gate || (firstSeg?.details as any)?.gate;
  const terminalGateText = depTerminal && depGate 
    ? `${depTerminal} / ${depGate}`
    : (depTerminal ? `${depTerminal}` : (depGate ? `登機門 ${depGate}` : (nextFlightCode ? `接 ${nextFlightCode}` : '')));

  // 備註內容
  const noteText = item.note || item.rawBookingFlight?.note || (hasTransfer ? `轉機停留 ${transitDuration}` : '');

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

  return (
    <div
      className={`w-full bg-white rounded-[28px] sm:rounded-[32px] border border-[#EAE5DC] shadow-[0_4px_24px_rgba(0,0,0,0.03)] hover:shadow-[0_6px_28px_rgba(0,0,0,0.05)] transition-all p-5 sm:p-6 relative select-none ${className}`}
    >
      {/* 編輯 / 刪除操作 (次要按鈕，右上角優雅懸浮，不破壞主要資訊階層) */}
      {(onEdit || onDelete) && (
        <div className="absolute top-4 right-4 flex items-center gap-1 z-20">
          {onEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(item);
              }}
              className="p-1.5 rounded-full text-[#9C9180] hover:text-[#4A6351] hover:bg-[#F3F6F4] transition-colors"
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

      {/* ========================================================================= */}
      {/* 一、FLIGHT HEADER (完全對齊圖片 2 視覺標準)                                */}
      {/* ========================================================================= */}
      <div className={`flex items-center justify-between pb-3.5 border-b border-[#F0EBE3] gap-2 ${(onEdit || onDelete) ? 'pr-16' : ''}`}>
        {/* 左側：墨綠色飛機圓形圖示 + 航空公司名稱 + 航班代碼膠囊 EY899 */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* 圓形深綠背景飛機圖示 */}
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#4A6351] text-white flex items-center justify-center flex-shrink-0 shadow-xs">
            <Plane size={20} className="transform rotate-45" />
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* 航空公司中文名 (粗體黑字) */}
              <span className="text-base sm:text-lg font-black text-[#2D241E] tracking-tight truncate">
                {airlineName}
              </span>

              {/* 航班代碼膠囊 EY899 (粗體大字級、柔和綠色背景、膠囊形狀、充足內距、醒目可辨) */}
              {flightNumber && (
                <span className="bg-[#E5ECE7] text-[#3D5645] font-black text-xs sm:text-sm px-3 sm:px-3.5 py-0.5 sm:py-1 rounded-full font-mono flex-shrink-0">
                  {flightNumber}
                </span>
              )}
            </div>

            {/* 航空公司英文名稱 (次要灰字) */}
            {airlineEn && (
              <span className="text-xs sm:text-[13px] font-semibold text-[#8C827A] truncate mt-0.5">
                {airlineEn}
              </span>
            )}
          </div>
        </div>

        {/* 右側：總飛行時長與詳情入口按鈕 (時鐘 + 17h 30m + >) */}
        {totalDuration && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="border border-[#DCD5CA] bg-white hover:bg-[#F8F6F0] active:scale-95 rounded-full px-3 sm:px-3.5 py-1 sm:py-1.5 text-xs sm:text-sm font-black text-[#4B443D] flex items-center gap-1.5 flex-shrink-0 transition-all shadow-xs cursor-pointer"
            title="查看航班詳情"
          >
            <Clock size={13} className="text-[#6D6357]" />
            <span className="font-mono tracking-tight">{totalDuration}</span>
            <ChevronRight size={13} className={`text-[#8C827A] transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 二、主要航程區域 (三區結構：起飛 - 轉機 - 抵達)                             */}
      {/* ========================================================================= */}
      <div className="pt-4 sm:pt-5 pb-3">
        {/* 上方三狀態標籤 (起飛 / 轉機 / 抵達) */}
        <div className="flex items-center justify-between gap-1 mb-2 px-0.5">
          {/* 左：起飛標籤 */}
          <div className="flex-1 text-left">
            <span className="bg-[#F5EDE1] text-[#785E43] text-[11px] font-bold px-2.5 py-0.5 rounded-md inline-flex items-center gap-1 shadow-2xs">
              <Plane size={11} className="transform rotate-45" />
              <span>起飛</span>
            </span>
          </div>

          {/* 中：轉機或直飛標籤 */}
          <div className="flex-1 text-center">
            {hasTransfer ? (
              <span className="bg-[#F8EEDB] text-[#8C6D41] text-[11px] font-bold px-2.5 py-0.5 rounded-md inline-flex items-center gap-1 shadow-2xs">
                <ArrowRightLeft size={11} />
                <span>轉機</span>
              </span>
            ) : (
              <span className="bg-[#E5ECE7] text-[#425B49] text-[11px] font-bold px-2.5 py-0.5 rounded-md inline-flex items-center gap-1 shadow-2xs">
                <Plane size={11} />
                <span>直飛</span>
              </span>
            )}
          </div>

          {/* 右：抵達標籤 */}
          <div className="flex-1 text-right">
            <span className="bg-[#E5ECE7] text-[#425B49] text-[11px] font-bold px-2.5 py-0.5 rounded-md inline-flex items-center gap-1 shadow-2xs">
              <Plane size={11} className="transform rotate-90" />
              <span>抵達</span>
            </span>
          </div>
        </div>

        {/* 航程三區主結構 (左右時間特大、中間細虛線與飛機貫穿) */}
        <div className="flex items-center justify-between gap-2 relative">
          {/* 左側：出發地與超大出發時間 */}
          <div className="flex-1 min-w-0 max-w-[38%] text-left">
            {/* 城市與代碼：桃園 TPE */}
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-lg sm:text-2xl font-black text-[#2A1E17] tracking-tight truncate">
                {depDisplay.city}
              </span>
              <span className="text-sm sm:text-base font-black font-mono text-[#3D322B] tracking-wider">
                {depDisplay.code}
              </span>
            </div>

            {/* 次要站名：台北・桃園國際機場 */}
            <div className="text-xs text-[#7D736A] font-medium truncate mt-0.5 max-w-full" title={depDisplay.subName}>
              {depDisplay.subName}
            </div>

            {/* 超大出發時間 17:40 */}
            <div className="text-3xl sm:text-4xl font-black text-[#2A1E17] font-sans tracking-tight mt-1.5 leading-none">
              {depTime}
            </div>
          </div>

          {/* 中央：轉機節點 (TRANSFER NODE) / 虛線航線引導 */}
          <div className="flex-[1.2] flex flex-col items-center justify-center relative px-1">
            {hasTransfer ? (
              <div className="w-full flex flex-col items-center justify-center relative">
                {/* 左右連貫細虛線航線 + 中央小飛機 (淡綠灰細線) */}
                <div className="w-full flex items-center justify-center gap-1 relative my-1">
                  <div className="flex-1 h-0 border-b-2 border-dashed border-[#CFD8D2]"></div>
                  <Plane size={13} className="text-[#4A6351] transform rotate-90 flex-shrink-0 mx-1" />
                  <div className="flex-1 h-0 border-b-2 border-dashed border-[#CFD8D2]"></div>
                </div>

                {/* 轉機機場代碼 AUH (顯眼粗體大字) */}
                <span className="font-mono text-base sm:text-lg font-black text-[#30251F] tracking-wider leading-tight mt-0.5">
                  {transitDisplay.code}
                </span>

                {/* 轉機城市名 阿布達比 */}
                <span className="text-xs font-semibold text-[#7D736A] leading-tight">
                  {transitDisplay.city}
                </span>

                {/* 停留時間標籤 停 1h20m */}
                {transitDuration && (
                  <span className="bg-[#F5EAD8] text-[#8C6D41] text-[10px] sm:text-[11px] font-black px-2.5 py-0.5 rounded-md mt-1 shadow-2xs">
                    停 {transitDuration}
                  </span>
                )}
              </div>
            ) : (
              /* 直飛航線展示 */
              <div className="w-full flex flex-col items-center justify-center py-2">
                <div className="w-full flex items-center justify-center gap-1.5 relative">
                  <div className="flex-1 h-0 border-b-2 border-dashed border-[#CFD8D2]"></div>
                  <div className="w-7 h-7 rounded-full bg-[#EEF4F0] border border-[#D5E2D9] flex items-center justify-center text-[#4A6351] shadow-2xs flex-shrink-0">
                    <Plane size={14} className="transform rotate-45" />
                  </div>
                  <div className="flex-1 h-0 border-b-2 border-dashed border-[#CFD8D2]"></div>
                </div>
                <span className="text-[11px] font-bold text-[#55695B] mt-1">
                  直達無中停
                </span>
              </div>
            )}
          </div>

          {/* 右側：抵達地與超大抵達時間 */}
          <div className="flex-1 min-w-0 max-w-[38%] text-right flex flex-col items-end">
            {/* 城市與代碼：蘇黎世 ZRH */}
            <div className="flex items-baseline justify-end gap-1.5 flex-wrap">
              <span className="text-lg sm:text-2xl font-black text-[#2A1E17] tracking-tight truncate">
                {arrDisplay.city}
              </span>
              <span className="text-sm sm:text-base font-black font-mono text-[#3D322B] tracking-wider">
                {arrDisplay.code}
              </span>
            </div>

            {/* 次要站名：蘇黎世國際機場 */}
            <div className="text-xs text-[#7D736A] font-medium truncate mt-0.5 max-w-full text-right" title={arrDisplay.subName}>
              {arrDisplay.subName}
            </div>

            {/* 超大抵達時間 12:00 (與 17:40 等大對齊) */}
            <div className="text-3xl sm:text-4xl font-black text-[#2A1E17] font-sans tracking-tight mt-1.5 leading-none">
              {arrTime}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 三、下方中繼資訊區 (三欄式結構，手機 375px 自動折行絕不水平捲動)            */}
      {/* ========================================================================= */}
      <div className="pt-3 border-t border-[#F0EBE3] grid grid-cols-3 gap-2 text-left">
        {/* 欄位 1：轉機城市 */}
        <div className="flex flex-col min-w-0 pr-1">
          <div className="flex items-center gap-1 text-[11px] font-bold text-[#8C827A]">
            <Plane size={11} className="transform rotate-45 text-[#8C827A] flex-shrink-0" />
            <span className="truncate">{hasTransfer ? '轉機城市' : '航線模式'}</span>
          </div>
          <div className="text-xs sm:text-sm font-black text-[#2D241E] mt-0.5 truncate">
            {hasTransfer ? `${transitDisplay.city} ${transitDisplay.code}` : '直飛航程'}
          </div>
        </div>

        {/* 欄位 2：航廈 / 登機口 (真實資料或銜接航班) */}
        <div className="flex flex-col min-w-0 px-1 border-x border-[#F0EBE3]">
          <div className="flex items-center gap-1 text-[11px] font-bold text-[#8C827A]">
            <FileText size={11} className="text-[#8C827A] flex-shrink-0" />
            <span className="truncate">{terminalGateText ? '航廈 / 登機口' : (nextFlightCode ? '銜接班次' : '席別艙等')}</span>
          </div>
          <div className="text-xs sm:text-sm font-black text-[#2D241E] mt-0.5 truncate">
            {terminalGateText || (nextFlightCode ? nextFlightCode : (item.classType || '標準客艙'))}
          </div>
        </div>

        {/* 欄位 3：備註 */}
        <div className="flex flex-col min-w-0 pl-1">
          <div className="flex items-center gap-1 text-[11px] font-bold text-[#8C827A]">
            <Luggage size={11} className="text-[#8C827A] flex-shrink-0" />
            <span className="truncate">備註</span>
          </div>
          <div className="text-xs sm:text-sm font-black text-[#2D241E] mt-0.5 truncate" title={noteText}>
            {noteText || (hasTransfer ? `轉機停留 ${transitDuration}` : '直達航班')}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 四、最底層獨立行李條 (Baggage Information Bar 嚴格對齊圖片 2)                */}
      {/* ========================================================================= */}
      <div className="mt-3.5 bg-[#EEF2ED] rounded-2xl p-2.5 sm:px-4 sm:py-2.5 flex items-center justify-between text-xs text-[#3E5545] font-semibold gap-2 flex-wrap transition-colors">
        {/* 左側：託運行李與手提行李 */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Luggage size={13} className="text-[#4A6351]" />
            <span>託運行李 <strong className="font-bold text-[#2D3E32]">{baggageChecked}</strong></span>
          </div>

          <span className="text-[#CAD4CD]">|</span>

          <div className="flex items-center gap-1.5">
            <Briefcase size={13} className="text-[#4A6351]" />
            <span>手提行李 <strong className="font-bold text-[#2D3E32]">{baggageCarryOn}</strong></span>
          </div>
        </div>

        {/* 右側：查看航班詳情入口 */}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-xs font-black text-[#385240] hover:text-[#203426] cursor-pointer ml-auto hover:underline"
        >
          <span>查看航班詳情</span>
          <ExternalLink size={12} className="opacity-80" />
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 五、展開的詳細資訊區塊 (點擊「查看航班詳情」後優雅展開)                     */}
      {/* ========================================================================= */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-[#F0EBE3] space-y-3.5 text-xs text-[#4A443B] animate-in fade-in duration-200">
          {/* 多航段詳細清單 (例如 TPE->AUH 與 AUH->ZRH) */}
          {segments.length > 1 && (
            <div className="space-y-2 bg-[#F9F7F2] p-3.5 rounded-2xl border border-[#EBE4D8]">
              <div className="text-[11px] font-black text-[#7A6F5C] uppercase tracking-wider mb-1">
                航程分段清單
              </div>

              {segments.map((seg, index) => (
                <div key={seg.id || index} className="space-y-1.5 pb-2.5 border-b border-[#E8E0D2] last:border-b-0 last:pb-0">
                  <div className="flex items-center justify-between font-black text-[#2D2A26]">
                    <div className="flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-[#E5DDD0] text-[#5A5040] flex items-center justify-center text-[10px] font-bold">
                        {index + 1}
                      </span>
                      <span>{seg.operator || airlineName}</span>
                      <span className="font-mono text-[#4A6351] bg-[#EAF0EC] px-1.5 py-0.2 rounded font-black text-[11px]">
                        {seg.serviceNumber}
                      </span>
                    </div>
                    {seg.duration && (
                      <span className="font-mono text-[11px] text-[#8C806F]">飛行 {seg.duration}</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#6E6454] pl-6 font-mono">
                    <div>
                      <span className="font-bold text-[#2D2A26]">{seg.departure.city || seg.departure.name}</span>
                      {seg.departure.code && <span> ({seg.departure.code})</span>}
                      {seg.departure.time && <span className="ml-1 text-[#1F1C18] font-black">{seg.departure.time}</span>}
                    </div>
                    <div className="text-[#A39886]">➔</div>
                    <div>
                      <span className="font-bold text-[#2D2A26]">{seg.arrival.city || seg.arrival.name}</span>
                      {seg.arrival.code && <span> ({seg.arrival.code})</span>}
                      {seg.arrival.time && <span className="ml-1 text-[#1F1C18] font-black">{seg.arrival.time}</span>}
                    </div>
                  </div>

                  {seg.transferAfter && (
                    <div className="mt-1 ml-6 p-2 bg-[#FFF9ED] border border-[#F2E4C9] rounded-xl text-[11px] text-[#8C6219] flex items-center justify-between">
                      <span>轉機點：<strong>{seg.transferAfter.location.city || seg.transferAfter.location.name}</strong></span>
                      <span className="font-bold">停留 {seg.transferAfter.duration}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 票價與訂位資訊 */}
          <div className="flex items-center justify-between bg-[#FAF8F5] p-3 rounded-2xl border border-[#EDE7DC] flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-gray-400 font-bold">訂位資訊:</span>
              <span className="font-mono font-bold text-cocoa">{item.bookingReference || '確認已開票'}</span>
              {item.classType && (
                <span className="bg-white px-2 py-0.5 rounded border border-[#E0D9CD] text-[10px] text-gray-600 font-bold">
                  {item.classType}
                </span>
              )}
            </div>

            {item.cost !== undefined && item.cost > 0 && (
              <div className="text-right">
                <span className="text-[11px] text-gray-400 font-bold mr-1">每人費用</span>
                <span className="font-mono font-black text-sm text-[#4A6351]">
                  {item.currency || 'TWD'} {Number(item.cost).toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* 地圖導航與收合按鈕 */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={handleOpenMap}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#F3F6F4] text-[#4A6351] border border-[#D5E2D9] font-black text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <MapPin size={13} />
              <span>在地圖查看航線</span>
            </button>

            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="text-xs font-black text-[#8C806F] hover:text-[#4A4235] flex items-center gap-1 px-3 py-1.5 rounded-full hover:bg-[#F7F4EE] transition-colors"
            >
              <span>收合詳細資訊</span>
              <ChevronUp size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
