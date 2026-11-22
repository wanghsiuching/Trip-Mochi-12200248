import React from 'react';
import { 
  Train, TrainFront, CableCar, Ship, Bus, Plane, Footprints, 
  Tag, Percent, Ticket, CreditCard, Sparkles, Plus, Trash2, 
  ArrowRight, Clock, MapPin, Layers, ChevronDown, ChevronUp,
  Info, AlertCircle
} from 'lucide-react';
import { 
  UniversalTransportType, 
  TransitPassType, 
  TransitLeg, 
  TransitFareDetails, 
  TransitExtraFeeItem,
  Currency,
  Member
} from '../types';
import { TimePickerField } from './TimePickerComponents';
import { AutoWrapInput } from './AutoWrapInput';
import { getExchangeRate, POPULAR_CURRENCIES } from '../utils/currency';
import {
  resolveTransitExtraFeeItems,
  resolveTransitUnitFare,
  splitTicketCost,
  formatTicketAmount
} from '../src/utils/splitCost';

export const TRANSPORT_TYPE_CONFIG: Record<UniversalTransportType, {
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  bg: string;
  border: string;
  emoji: string;
}> = {
  train: {
    label: '火車/鐵道/地鐵',
    shortLabel: '鐵道',
    icon: Train,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    emoji: '🚆'
  },
  high_speed: {
    label: '高鐵/特急',
    shortLabel: '高鐵',
    icon: TrainFront,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    emoji: '🚄'
  },
  cable_car: {
    label: '纜車/登山鐵道',
    shortLabel: '纜車',
    icon: CableCar,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    emoji: '🚡'
  },
  boat: {
    label: '遊船/渡輪',
    shortLabel: '渡輪',
    icon: Ship,
    color: 'text-cyan-600',
    bg: 'bg-cyan-50',
    border: 'border-cyan-200',
    emoji: '🚢'
  },
  bus: {
    label: '長途巴士/公車',
    shortLabel: '巴士',
    icon: Bus,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    emoji: '🚌'
  },
  flight: {
    label: '國內航班',
    shortLabel: '航班',
    icon: Plane,
    color: 'text-sky-600',
    bg: 'bg-sky-50',
    border: 'border-sky-200',
    emoji: '✈️'
  },
  walk: {
    label: '步行/轉乘',
    shortLabel: '步行',
    icon: Footprints,
    color: 'text-stone-600',
    bg: 'bg-stone-100',
    border: 'border-stone-200',
    emoji: '🚶'
  }
};

export const PASS_TYPE_CONFIG: Record<TransitPassType, {
  label: string;
  badgeTitle: string;
  badgeClass: string;
  tagClass: string;
  desc: string;
}> = {
  pass_free: {
    label: '通票涵蓋 (Pass 實付 0)',
    badgeTitle: 'Pass 涵蓋',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    tagClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    desc: '如 JR Pass / STP 全包，實付 0 元'
  },
  pass_discount: {
    label: '半價卡 / 區域折扣卡',
    badgeTitle: '折扣卡適用',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
    tagClass: 'bg-amber-50 text-amber-800 border-amber-200',
    desc: '享有特約折扣 (如半價卡、早鳥優惠)'
  },
  ic_card: {
    label: 'IC 卡 / 儲值卡扣款',
    badgeTitle: 'IC 卡扣款',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
    tagClass: 'bg-blue-50 text-blue-700 border-blue-200',
    desc: 'Suica / ICOCA / 八達通等感應刷卡'
  },
  point_to_point: {
    label: '單程票 / 一般購票',
    badgeTitle: '單程購票',
    badgeClass: 'bg-stone-100 text-stone-700 border-stone-300',
    tagClass: 'bg-stone-50 text-stone-600 border-stone-200',
    desc: '現場購票或官網單程預訂'
  },
  none: {
    label: '無通票 / 自費',
    badgeTitle: '自費',
    badgeClass: 'bg-gray-100 text-gray-600 border-gray-200',
    tagClass: 'bg-gray-50 text-gray-500 border-gray-200',
    desc: '一般自費'
  }
};

export interface EffectiveTransitExtraItem {
  id: string;
  name: string;
  amount: number;
  currency: string;
  hasServiceFee: boolean;
  serviceFeePercentage: number;
  feeAmount: number;
  totalWithFee: number;
}

/**
 * 取得所有標準化的大眾交通加價項目列表 (支援多筆自訂加價與向下相容)
 */
export const getTransitExtraFeeList = (fare?: TransitFareDetails): EffectiveTransitExtraItem[] => {
  return resolveTransitExtraFeeItems(fare);
};

/**
 * 取得大眾交通的實際生效票價與附加費用
 */
export const getTransitEffectiveFare = (fare?: TransitFareDetails): {
  mainAmount: number;
  mainCurrency: string;
  extraItems: EffectiveTransitExtraItem[];
  extraAmount: number;
  extraCurrency: string;
  extraName: string;
  hasServiceFee: boolean;
  serviceFeePercentage: number;
  feeAmount: number;
  totalWithFee: number;
  extraFeeHasServiceFee: boolean;
  extraFeeServiceFeePercentage: number;
  extraFeeAmount: number;
  extraTotalWithFee: number;
} => {
  if (!fare) {
    return {
      mainAmount: 0,
      mainCurrency: 'TWD',
      extraItems: [],
      extraAmount: 0,
      extraCurrency: 'TWD',
      extraName: '',
      hasServiceFee: false,
      serviceFeePercentage: 0,
      feeAmount: 0,
      totalWithFee: 0,
      extraFeeHasServiceFee: false,
      extraFeeServiceFeePercentage: 0,
      extraFeeAmount: 0,
      extraTotalWithFee: 0,
    };
  }
  const { unitPrice: mainAmount } = resolveTransitUnitFare(fare);

  const mainCurrency = fare.currency || 'TWD';
  const hasServiceFee = fare.hasServiceFee || false;
  const serviceFeePercentage = Number(fare.serviceFeePercentage) || 0;
  const feeAmount = (hasServiceFee && mainAmount > 0) ? (mainAmount * serviceFeePercentage) / 100 : 0;
  const totalWithFee = mainAmount + feeAmount;

  const extraItems = getTransitExtraFeeList(fare);
  const firstExtra = extraItems[0];

  const extraAmount = firstExtra ? firstExtra.amount : 0;
  const extraCurrency = firstExtra ? firstExtra.currency : mainCurrency;
  const extraName = firstExtra ? firstExtra.name : '交通加價';
  const extraFeeHasServiceFee = firstExtra ? firstExtra.hasServiceFee : false;
  const extraFeeServiceFeePercentage = firstExtra ? firstExtra.serviceFeePercentage : 0;
  const extraFeeAmount = firstExtra ? firstExtra.feeAmount : 0;
  const extraTotalWithFee = firstExtra ? firstExtra.totalWithFee : 0;

  return {
    mainAmount,
    mainCurrency,
    extraItems,
    extraAmount,
    extraCurrency,
    extraName,
    hasServiceFee,
    serviceFeePercentage,
    feeAmount,
    totalWithFee,
    extraFeeHasServiceFee,
    extraFeeServiceFeePercentage,
    extraFeeAmount,
    extraTotalWithFee,
  };
};

/**
 * 智慧票卡標籤 (Pass Badges) - 日系手帳風格印章/標籤
 */
export const TransitPassBadge: React.FC<{
  fare: TransitFareDetails;
  compact?: boolean;
  currencies?: Currency[];
}> = ({ fare, compact = false, currencies = [] }) => {
  const { 
    currency = 'TWD', 
    notes, 
    hasServiceFee, 
    serviceFeePercentage,
    ticketCount,
  } = fare;
  const { originalUnitPrice: numOrig, unitPrice: numDisc } = resolveTransitUnitFare(fare);
  const resolvedCount =
    ticketCount !== undefined && ticketCount !== null && String(ticketCount).trim() !== '' && !Number.isNaN(Number(ticketCount))
      ? Math.max(0, Math.floor(Number(ticketCount)))
      : 1;
  const hasSavings = numOrig > 0 && numDisc < numOrig;
  const savings = hasSavings ? numOrig - numDisc : 0;
  
  const feePct = Number(serviceFeePercentage) || 0;
  const ticketSubtotal = numDisc * resolvedCount;
  const feeVal = (hasServiceFee && ticketSubtotal > 0) ? (ticketSubtotal * feePct / 100) : 0;
  const totalDiscWithFee = ticketSubtotal + feeVal;

  const extraItems = getTransitExtraFeeList(fare);

  const mainRate = getExchangeRate(currency, currencies);
  const twdMain = Math.round(totalDiscWithFee * mainRate);

  let twdExtraTotal = 0;
  const extraCalculated = extraItems.map(item => {
    const rate = getExchangeRate(item.currency, currencies);
    const twd = Math.round(item.totalWithFee * rate);
    twdExtraTotal += twd;
    return {
      ...item,
      rate,
      twd,
    };
  });

  const grandTotalTWD = twdMain + twdExtraTotal;

  if (compact) {
    if (numDisc === 0 && numOrig > 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm flex-wrap">
          <Ticket size={10} className="text-emerald-700" />
          <span>實付 0 元 (Pass)</span>
          {extraCalculated.map(item => (
            <span key={item.id} className="text-[9px] text-blue-700 font-bold">
              +{item.name ? `${item.name}: ` : ''}{item.currency} {Math.round(item.totalWithFee).toLocaleString()}
              {item.hasServiceFee && item.serviceFeePercentage > 0 && `(含${item.serviceFeePercentage}%)`}
              {item.currency !== 'TWD' && `(約 NT$${item.twd.toLocaleString()})`}
            </span>
          ))}
        </span>
      );
    }
    if (numDisc > 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 shadow-sm flex-wrap">
          <Ticket size={10} className="text-amber-700" />
          <span>{currency} {hasServiceFee ? Math.round(totalDiscWithFee).toLocaleString() : numDisc.toLocaleString()}</span>
          {currency !== 'TWD' && <span className="text-[9px] text-amber-900/80 font-sans tabular-nums font-bold">(約 NT${twdMain.toLocaleString()})</span>}
          {hasServiceFee && feePct > 0 && <span className="text-[9px] text-amber-700 font-bold">(含{feePct}%)</span>}
          {savings > 0 && !hasServiceFee && <span className="text-[9px] text-amber-700 font-bold">(省 {currency} {savings.toLocaleString()})</span>}
          {extraCalculated.map(item => (
            <span key={item.id} className="text-[9px] text-blue-700 font-bold">
              +{item.name ? `${item.name}: ` : ''}{item.currency} {Math.round(item.totalWithFee).toLocaleString()}
              {item.hasServiceFee && item.serviceFeePercentage > 0 && `(含${item.serviceFeePercentage}%)`}
              {item.currency !== 'TWD' && `(約 NT$${item.twd.toLocaleString()})`}
            </span>
          ))}
        </span>
      );
    }
    if (extraCalculated.length > 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-blue-100 text-blue-800 border border-blue-300 shadow-sm flex-wrap">
          <Tag size={10} className="text-blue-700" />
          {extraCalculated.map(item => (
            <span key={item.id}>
              {item.name} {item.currency} {Math.round(item.totalWithFee).toLocaleString()}
              {item.hasServiceFee && item.serviceFeePercentage > 0 && `(含${item.serviceFeePercentage}%)`}
              {item.currency !== 'TWD' && `(約 NT$${item.twd.toLocaleString()})`}
            </span>
          ))}
        </span>
      );
    }
    return null;
  }

  // Full Badge View (手帳風印章 + 票價試算)
  return (
    <div className="rounded-2xl p-3.5 border-2 space-y-2 bg-white shadow-sm border-beige-dark">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-2.5 py-1 rounded-xl text-xs font-black border flex items-center gap-1.5 shadow-sm bg-amber-50 text-amber-900 border-amber-200">
            <Ticket size={14} className="text-amber-600" />
            <span>大眾運輸票價</span>
          </div>
          {numDisc === 0 && numOrig > 0 && (
            <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
              實付 0 元 (Pass全包)
            </span>
          )}
          {hasServiceFee && numDisc > 0 && (
            <span className="text-[10px] font-black text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-lg border border-amber-300">
              含手續費 {feePct}%
            </span>
          )}
        </div>

        {/* Price Breakdown */}
        <div className="text-right">
          {hasSavings ? (
            <div className="flex flex-col items-end">
              <div className="flex items-baseline gap-2 justify-end">
                <span className="text-[11px] text-gray-400 line-through font-sans tabular-nums">
                  {currency} {numOrig.toLocaleString()}
                </span>
                <span className="text-base font-black text-amber-800 font-sans tabular-nums tracking-tight">
                  {currency} {hasServiceFee ? Math.round(totalDiscWithFee).toLocaleString() : numDisc.toLocaleString()}
                </span>
              </div>
              {currency !== 'TWD' && totalDiscWithFee > 0 && (
                <span className="text-[10px] font-black text-sage font-sans tabular-nums">
                  約 NT$ {twdMain.toLocaleString()}
                </span>
              )}
            </div>
          ) : numDisc === 0 && numOrig > 0 ? (
            <div className="text-right">
              <span className="text-[10px] text-gray-400 line-through font-sans tabular-nums block">
                原價 {currency} {numOrig.toLocaleString()}
              </span>
              <span className="text-sm font-black text-emerald-700 font-sans tabular-nums tracking-tight">
                實付 {currency} 0
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-end">
              <span className="text-base font-black text-cocoa font-sans tabular-nums tracking-tight">
                {currency} {hasServiceFee ? Math.round(totalDiscWithFee).toLocaleString() : numDisc.toLocaleString()}
              </span>
              {currency !== 'TWD' && totalDiscWithFee > 0 && (
                <span className="text-[10px] font-black text-sage font-sans tabular-nums">
                  約 NT$ {twdMain.toLocaleString()}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Savings Notification or Extra fees */}
      <div className="pt-2 border-t border-dashed border-beige-dark space-y-1.5 text-xs font-bold">
        {savings > 0 && (
          <div className="flex items-center">
            <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200 text-[11px] font-black inline-flex items-center gap-1">
              <Sparkles size={12} className="text-amber-600" />
              省下 {currency} {savings.toLocaleString()}
            </span>
          </div>
        )}
        {extraCalculated.length > 0 && (
          <div className="space-y-1">
            {extraCalculated.map(item => (
              <div key={item.id} className="flex items-center justify-between text-blue-800 bg-blue-50/70 px-2 py-1 rounded-lg border border-blue-200 text-[11px] font-bold">
                <span className="flex items-center gap-1 font-black">
                  <Tag size={11} className="text-blue-600" />
                  <span>{item.name}:</span>
                  {item.hasServiceFee && item.serviceFeePercentage > 0 && (
                    <span className="text-[10px] text-blue-600 font-normal">(含{item.serviceFeePercentage}%手續費)</span>
                  )}
                </span>
                <span className="font-sans tabular-nums font-black">
                  {item.currency} {Math.round(item.totalWithFee).toLocaleString()}
                  {item.currency !== 'TWD' && <span className="text-[10px] text-blue-600 font-normal ml-1">(約 NT${item.twd.toLocaleString()})</span>}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Combined Grand Total Converted display if non-TWD or multiple items */}
      {grandTotalTWD > 0 && (currency !== 'TWD' || extraCalculated.some(e => e.currency !== 'TWD')) && (
        <div className="pt-1.5 border-t border-dashed border-beige-dark flex items-center justify-between text-xs font-black">
          <span className="text-gray-400 text-[10px] font-bold">交通換算總計 (含各加價與手續費)</span>
          <span className="text-sage font-sans tabular-nums tracking-tight">約 NT$ {grandTotalTWD.toLocaleString()}</span>
        </div>
      )}

      {notes && (
        <div className="text-[11px] text-gray-500 bg-yellow-50/70 p-2 rounded-xl border border-yellow-200/60 font-bold flex items-start gap-1.5 mt-1">
          <Info size={13} className="text-yellow-600 mt-0.5 shrink-0" />
          <span>{notes}</span>
        </div>
      )}
    </div>
  );
};

/**
 * 模組化多段轉乘檢視 (Leg Chain Timeline with Clickable Anchor Navigation & Reverse Sync)
 */
export const TransitLegChainView: React.FC<{
  legs: TransitLeg[];
  fare?: TransitFareDetails;
  isDetailed?: boolean;
  currencies?: Currency[];
}> = ({ legs, fare, isDetailed = false, currencies = [] }) => {
  const [expanded, setExpanded] = React.useState(true);
  const [activeIndex, setActiveIndex] = React.useState<number>(0);
  const [highlightedIndex, setHighlightedIndex] = React.useState<number | null>(null);

  // Refs for horizontal nav scrolling and edge gradient shadow detection
  const navContainerRef = React.useRef<HTMLDivElement | null>(null);
  const navItemRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const legCardRefs = React.useRef<(HTMLDivElement | null)[]>([]);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);

  // Highlight refs
  const highlightTimeoutRef = React.useRef<any>(null);

  // Check scroll position to display edge gradient shadows
  const updateScrollShadows = React.useCallback(() => {
    const el = navContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 4);
  }, []);

  React.useEffect(() => {
    updateScrollShadows();
    const el = navContainerRef.current;
    if (el) {
      el.addEventListener('scroll', updateScrollShadows, { passive: true });
      window.addEventListener('resize', updateScrollShadows);
      return () => {
        el.removeEventListener('scroll', updateScrollShadows);
        window.removeEventListener('resize', updateScrollShadows);
      };
    }
  }, [updateScrollShadows, legs]);

  // Helper to scroll the top horizontal navigation container internally when clicked
  const scrollNavToCenter = (index: number) => {
    const container = navContainerRef.current;
    const item = navItemRefs.current[index];
    if (!container || !item) return;
    const containerRect = container.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();
    const relativeLeft = itemRect.left - containerRect.left;
    const scrollOffset = relativeLeft + container.scrollLeft - (container.clientWidth / 2) + (item.clientWidth / 2);
    container.scrollTo({ left: Math.max(0, scrollOffset), behavior: 'smooth' });
  };

  // Click on a top nav icon: scroll to leg card and center it in the mobile screen
  const handleSelectLeg = (index: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    
    setActiveIndex(index);
    setHighlightedIndex(index);

    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current);
    }
    highlightTimeoutRef.current = setTimeout(() => {
      setHighlightedIndex(null);
    }, 2200);

    // Scroll corresponding card into view AND CENTER it in the mobile viewport
    const targetCard = legCardRefs.current[index];
    if (targetCard) {
      targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Scroll the top nav bar internally to keep the active icon centered
    scrollNavToCenter(index);
  };

  if (!legs || legs.length === 0) return null;

  const firstLeg = legs[0];
  const lastLeg = legs[legs.length - 1];
  const isMultiLeg = legs.length > 1;
  const currentLeg = legs[activeIndex] || legs[0];

  return (
    <div className="space-y-2.5">
      {/* Route Header Banner */}
      <div className="bg-gradient-to-r from-blue-50/90 via-sky-50/70 to-indigo-50/80 p-3.5 rounded-2xl border-2 border-blue-100 shadow-sm space-y-2.5">
        
        {/* Origin to Destination Bar */}
        <div className="flex items-center justify-between gap-2">
          {/* Origin Station */}
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <div className="w-3 h-3 rounded-full bg-blue-500 ring-4 ring-blue-100 flex-shrink-0 mt-1" />
            <div className="min-w-0 flex-1">
              <span className="text-xs sm:text-sm font-black text-cocoa block leading-snug break-words">
                {firstLeg.fromStation || '起點'}
              </span>
              {firstLeg.departureTime && (
                <span className="text-[10px] font-sans tabular-nums font-bold text-blue-600 bg-white/90 px-1.5 py-0.5 rounded-md border border-blue-100 inline-block mt-0.5">
                  {firstLeg.departureTime} 發
                </span>
              )}
            </div>
          </div>

          {/* Clean Middle Connector without text overlap */}
          <div className="flex flex-col items-center px-1 flex-shrink-0 text-blue-300">
            <div className="flex items-center gap-1">
              <div className="w-2.5 sm:w-5 h-0.5 bg-blue-200" />
              <ArrowRight size={13} className="text-blue-400" />
              <div className="w-2.5 sm:w-5 h-0.5 bg-blue-200" />
            </div>
          </div>

          {/* Destination Station */}
          <div className="flex items-start justify-end gap-2 flex-1 min-w-0 text-right">
            <div className="min-w-0 flex-1">
              <span className="text-xs sm:text-sm font-black text-cocoa block leading-snug break-words">
                {lastLeg.toStation || '終點'}
              </span>
              {lastLeg.arrivalTime && (
                <span className="text-[10px] font-sans tabular-nums font-bold text-indigo-600 bg-white/90 px-1.5 py-0.5 rounded-md border border-indigo-100 inline-block mt-0.5">
                  {lastLeg.arrivalTime} 到
                </span>
              )}
            </div>
            <div className="w-3 h-3 rounded-full bg-indigo-500 ring-4 ring-indigo-100 flex-shrink-0 mt-1" />
          </div>
        </div>

        {/* Bottom Bar: Route Transit Summary & Toggle Button */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-blue-100/70 flex-wrap">
          <div className="inline-flex items-center gap-1.5 bg-white/90 px-2.5 py-1 rounded-xl text-[10px] sm:text-[11px] font-black text-blue-700 border border-blue-200/80 shadow-xs">
            <Layers size={12} className="text-blue-500 flex-shrink-0" />
            <span>{isMultiLeg ? `經停 ${legs.length - 1} 轉乘 · 共 ${legs.length} 段` : '直達路線'}</span>
          </div>

          {isMultiLeg && !isDetailed && (
            <button 
              onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
              className="text-[11px] font-black text-blue-600 hover:text-blue-800 bg-white px-2.5 py-1 rounded-xl border border-blue-200 shadow-xs flex items-center gap-1.5 transition-all active:scale-95 ml-auto"
            >
              <span>{expanded ? '收合轉乘區間' : `展開 ${legs.length} 段詳細轉乘`}</span>
              {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          )}
        </div>
      </div>

      {/* Expandable or Detailed Leg Timeline Chain with Interactive Sticky Anchor Nav */}
      {(expanded || isDetailed || !isMultiLeg) && (
        <div className="bg-white rounded-2xl border-2 border-beige-dark shadow-sm overflow-hidden animate-scale-in">
          
          {/* === STICKY HORIZONTAL TRANSIT ANCHOR NAVIGATION BAR === */}
          <div className="sticky top-0 z-20 bg-[#FAF8F2]/95 backdrop-blur-md border-b-2 border-beige-dark px-2 pt-2.5 pb-2">
            
            <div className="flex items-center justify-between px-1 mb-1.5">
              <div className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                <Clock size={11} className="text-blue-500" />
                <span>轉乘導航 (點擊圖示跳轉)</span>
              </div>
              <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                第 {activeIndex + 1} / {legs.length} 段
              </span>
            </div>

            {/* Scrollable Icon Track with Edge Gradient Shadows */}
            <div className="relative group">
              {/* Left Gradient Shadow */}
              <div 
                className={`pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#FAF8F2] via-[#FAF8F2]/80 to-transparent z-10 transition-opacity duration-300 ${
                  canScrollLeft ? 'opacity-100' : 'opacity-0'
                }`} 
              />

              {/* Right Gradient Shadow */}
              <div 
                className={`pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#FAF8F2] via-[#FAF8F2]/80 to-transparent z-10 transition-opacity duration-300 ${
                  canScrollRight ? 'opacity-100' : 'opacity-0'
                }`} 
              />

              {/* Horizontal Scroll Track */}
              <div 
                ref={navContainerRef}
                className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 px-1 snap-x snap-mandatory scroll-smooth"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {legs.map((leg, idx) => {
                  const typeCfg = TRANSPORT_TYPE_CONFIG[leg.transportType] || TRANSPORT_TYPE_CONFIG.train;
                  const IconComp = typeCfg.icon;
                  const isActive = activeIndex === idx;

                  return (
                    <React.Fragment key={leg.id || idx}>
                      <button
                        ref={el => (navItemRefs.current[idx] = el)}
                        type="button"
                        onClick={(e) => handleSelectLeg(idx, e)}
                        className={`flex-shrink-0 snap-center flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all duration-200 border-2 cursor-pointer select-none active:scale-95 ${
                          isActive
                            ? `${typeCfg.bg} ${typeCfg.color} ${typeCfg.border} shadow-md ring-2 ring-blue-300/80 scale-[1.03]`
                            : 'bg-white text-gray-500 border-beige-dark hover:bg-gray-50 hover:text-cocoa hover:border-gray-300 shadow-xs'
                        }`}
                        title={`第 ${idx + 1} 段: ${typeCfg.label} (${leg.fromStation} ➔ ${leg.toStation})`}
                      >
                        <span className={`p-0.5 rounded-md ${isActive ? 'bg-white/80' : 'bg-gray-100'} flex items-center justify-center`}>
                          <IconComp size={13} />
                        </span>
                        <span className="whitespace-nowrap">{typeCfg.shortLabel}</span>
                        {leg.serviceNumber ? (
                          <span className={`font-sans tabular-nums text-[10px] px-1 py-0.2 rounded ${isActive ? 'bg-white/90 font-black' : 'bg-gray-100 text-gray-600'}`}>
                            {leg.serviceNumber}
                          </span>
                        ) : (
                          <span className={`text-[10px] ${isActive ? 'opacity-90 font-bold' : 'text-gray-400'}`}>
                            #{idx + 1}
                          </span>
                        )}
                      </button>

                      {idx < legs.length - 1 && (
                        <ArrowRight size={12} className="text-gray-300 flex-shrink-0 mx-0.5" />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* Pagination Dots Progress Indicator */}
            {isMultiLeg && (
              <div className="flex items-center justify-between pt-2 px-1 border-t border-dashed border-beige-dark/70 mt-1.5">
                <div className="flex items-center gap-1.5">
                  {legs.map((_, dotIdx) => (
                    <button
                      key={dotIdx}
                      type="button"
                      onClick={(e) => handleSelectLeg(dotIdx, e)}
                      className={`transition-all duration-300 rounded-full ${
                        activeIndex === dotIdx
                          ? 'w-6 h-2 bg-blue-500 shadow-xs'
                          : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
                      }`}
                      title={`切換至第 ${dotIdx + 1} 段`}
                    />
                  ))}
                </div>

                <div className="text-[10px] font-bold text-gray-500 break-words text-right flex-1 min-w-0">
                  <span className="text-cocoa font-black">第 {activeIndex + 1} 段：</span>
                  <span>{currentLeg.fromStation || '起點'}</span>
                  <span className="text-gray-300 mx-0.5">➔</span>
                  <span>{currentLeg.toStation || '終點'}</span>
                </div>
              </div>
            )}
          </div>

          {/* === DETAILED TRANSIT LEG CARDS === */}
          <div className="p-3 sm:p-4 space-y-3 bg-[#FAF9F6]">
            <div className="relative pl-4 space-y-3 before:absolute before:left-1.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-blue-200/80">
              {legs.map((leg, idx) => {
                const typeCfg = TRANSPORT_TYPE_CONFIG[leg.transportType] || TRANSPORT_TYPE_CONFIG.train;
                const IconComp = typeCfg.icon;
                const isSelected = activeIndex === idx;
                const isHighlighted = highlightedIndex === idx;

                return (
                  <div
                    key={leg.id || idx}
                    ref={el => (legCardRefs.current[idx] = el)}
                    data-leg-index={idx}
                    className="relative pl-3 scroll-mt-28"
                  >
                    {/* Step Timeline Circle */}
                    <div className={`absolute -left-4 top-2.5 w-3.5 h-3.5 rounded-full bg-white border-2 shadow-xs flex items-center justify-center transition-all ${
                      isSelected ? 'border-blue-500 ring-4 ring-blue-100 scale-110' : 'border-gray-300'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-blue-500' : 'bg-gray-300'}`} />
                    </div>

                    {/* Card Container (Display card, no click trigger so mobile swiping is completely smooth) */}
                    <div 
                      className={`rounded-2xl p-3 sm:p-3.5 transition-all duration-300 border-2 space-y-2 select-text ${
                        isHighlighted
                          ? 'bg-blue-50/90 border-blue-400 shadow-md ring-4 ring-blue-200/60 -translate-y-0.5'
                          : isSelected
                          ? 'bg-white border-blue-300 shadow-sm ring-2 ring-blue-100'
                          : 'bg-white/90 border-beige-dark hover:border-blue-200 hover:bg-white shadow-xs'
                      }`}
                    >
                      {/* Top Header of Leg Card */}
                      <div className="flex items-center justify-between gap-2 border-b border-dashed border-gray-200 pb-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className={`p-1.5 rounded-xl border text-xs shadow-xs flex-shrink-0 ${typeCfg.bg} ${typeCfg.color} ${typeCfg.border}`}>
                            <IconComp size={15} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] font-black text-gray-400 block uppercase leading-none mb-0.5">
                              {typeCfg.label}
                            </span>
                            <h4 className="text-xs sm:text-sm font-black text-cocoa break-words leading-snug">
                              {leg.fromStation || '起點'} <span className="text-blue-400 mx-0.5">➔</span> {leg.toStation || '目的地'}
                            </h4>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          <span className={`text-[10px] font-sans tabular-nums font-black px-2 py-0.5 rounded-lg border ${
                            isSelected ? 'bg-blue-500 text-white border-blue-600' : 'bg-gray-100 text-gray-500 border-gray-200'
                          }`}>
                            區間 #{idx + 1}
                          </span>
                        </div>
                      </div>

                      {/* Leg Details Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-bold text-gray-600 pt-0.5">
                        <div className="flex items-center gap-1.5 bg-gray-50/80 p-2 rounded-xl border border-gray-100">
                          <Clock size={13} className="text-blue-500 flex-shrink-0" />
                          <div className="min-w-0">
                            <span className="text-[9px] font-bold text-gray-400 block leading-none">發車 / 抵達</span>
                            <span className="font-sans tabular-nums tracking-tight font-black text-cocoa text-xs">
                              {leg.departureTime || '--:--'} ~ {leg.arrivalTime || '--:--'}
                            </span>
                          </div>
                        </div>

                        {leg.serviceNumber && (
                          <div className="flex items-center gap-1.5 bg-indigo-50/60 p-2 rounded-xl border border-indigo-100">
                            <Tag size={13} className="text-indigo-500 flex-shrink-0" />
                            <div className="min-w-0">
                              <span className="text-[9px] font-bold text-indigo-400 block leading-none">車次 / 班號</span>
                              <span className="font-sans tabular-nums tracking-tight font-black text-indigo-700 text-xs break-all block leading-tight">
                                {leg.serviceNumber}
                              </span>
                            </div>
                          </div>
                        )}

                        {leg.platform && (
                          <div className="flex items-center gap-1.5 bg-amber-50/60 p-2 rounded-xl border border-amber-100 col-span-2 sm:col-span-1">
                            <MapPin size={13} className="text-amber-500 flex-shrink-0" />
                            <div className="min-w-0">
                              <span className="text-[9px] font-bold text-amber-500 block leading-none">月台 / 乘車處</span>
                              <span className="font-black text-amber-900 text-xs break-words block leading-tight">
                                {leg.platform}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Pass Badge in Leg Chain if provided */}
      {fare && <TransitPassBadge fare={fare} compact={!isDetailed} />}
    </div>
  );
};

/**
 * 轉乘區間與票價編輯器 (TransitLegEditor)
 */
export const TransitLegEditor: React.FC<{
  legs: TransitLeg[];
  setLegs: React.Dispatch<React.SetStateAction<TransitLeg[]>>;
  fare: TransitFareDetails;
  setFare: React.Dispatch<React.SetStateAction<TransitFareDetails>>;
  currencies: Currency[];
  participants?: string[];
  onToggleParticipant?: (id: string) => void;
  members?: Member[];
  includeInBudget?: boolean;
  onChangeIncludeInBudget?: (val: boolean) => void;
}> = ({
  legs,
  setLegs,
  fare,
  setFare,
  currencies,
  participants,
  onToggleParticipant,
  members = [],
  includeInBudget,
  onChangeIncludeInBudget,
}) => {

  const addLeg = () => {
    const lastLeg = legs[legs.length - 1];
    const newLeg: TransitLeg = {
      id: Date.now().toString(),
      fromStation: lastLeg ? lastLeg.toStation : '',
      toStation: '',
      departureTime: lastLeg ? lastLeg.arrivalTime : '',
      arrivalTime: '',
      transportType: 'train',
      serviceNumber: '',
      platform: ''
    };
    setLegs(prev => [...prev, newLeg]);
  };

  const removeLeg = (id: string) => {
    if (legs.length <= 1) return;
    setLegs(prev => prev.filter(l => l.id !== id));
  };

  const updateLeg = (id: string, field: keyof TransitLeg, value: any) => {
    setLegs(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  const applyDiscount = (type: 'pass_free' | 'half' | 'eighty' | 'ic' | 'full') => {
    const orig = Number(fare.originalPrice) || 0;
    if (type === 'pass_free') {
      setFare(prev => ({ ...prev, passUsed: 'pass_free', discountedPrice: '0' }));
    } else if (type === 'half') {
      const halfPrice = orig > 0 ? (Math.round(orig * 0.5 * 100) / 100).toString() : '';
      setFare(prev => ({ ...prev, passUsed: 'pass_discount', discountedPrice: halfPrice }));
    } else if (type === 'eighty') {
      const eightyPrice = orig > 0 ? (Math.round(orig * 0.8 * 100) / 100).toString() : '';
      setFare(prev => ({ ...prev, passUsed: 'pass_discount', discountedPrice: eightyPrice }));
    } else if (type === 'ic') {
      setFare(prev => ({ ...prev, passUsed: 'ic_card', discountedPrice: orig > 0 ? orig.toString() : prev.discountedPrice }));
    } else if (type === 'full') {
      setFare(prev => ({ ...prev, passUsed: 'point_to_point', discountedPrice: orig > 0 ? orig.toString() : prev.discountedPrice }));
    }
  };

  const numOrig = Number(fare.originalPrice) || 0;
  const numDisc = Number(fare.discountedPrice) || 0;
  const isPassFreeActive = fare.passUsed === 'pass_free' || (fare.discountedPrice === '0' || fare.discountedPrice === 0);
  const isHalfActive = !isPassFreeActive && fare.passUsed === 'pass_discount' && numOrig > 0 && numDisc === Math.round(numOrig * 0.5 * 100) / 100;
  const isEightyActive = !isPassFreeActive && fare.passUsed === 'pass_discount' && numOrig > 0 && numDisc === Math.round(numOrig * 0.8 * 100) / 100;
  const isFullActive = !isPassFreeActive && !isHalfActive && !isEightyActive && (fare.passUsed === 'point_to_point' || !fare.passUsed);

  const selectedParticipantIds = Array.isArray(participants) ? participants : [];
  const peopleCount = selectedParticipantIds.length;
  const hasCustomTicketCount =
    fare.ticketCount !== undefined &&
    fare.ticketCount !== null &&
    String(fare.ticketCount).trim() !== '' &&
    !Number.isNaN(Number(fare.ticketCount));
  const effectiveTicketCount = hasCustomTicketCount
    ? Math.max(0, Math.floor(Number(fare.ticketCount)))
    : (peopleCount > 0 ? peopleCount : 1);

  return (
    <div className="space-y-4">
      {/* Legs List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-black text-blue-600 flex items-center gap-1.5">
            <Layers size={14} />
            <span>轉乘區間與路線 ({legs.length} 段)</span>
          </label>
          <button
            type="button"
            onClick={addLeg}
            className="text-[11px] font-black bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-xl shadow-sm flex items-center gap-1 transition-all active:scale-95"
          >
            <Plus size={13} strokeWidth={3} />
            <span>新增轉乘 / Via 經停</span>
          </button>
        </div>

        {legs.map((leg, index) => {
          const typeCfg = TRANSPORT_TYPE_CONFIG[leg.transportType] || TRANSPORT_TYPE_CONFIG.train;
          return (
            <div key={leg.id || index} className="bg-white p-3.5 rounded-2xl border-2 border-beige-dark shadow-sm space-y-3 relative">
              {/* Header & Type selector */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-[10px] font-black flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="text-xs font-black text-cocoa">
                    {index === 0 ? '出發區間' : index === legs.length - 1 ? '最終區間' : `經停區間 ${index}`}
                  </span>
                </div>

                {legs.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLeg(leg.id)}
                    className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="刪除此區間"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>

              {/* Transport Type Chips */}
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                {(Object.keys(TRANSPORT_TYPE_CONFIG) as UniversalTransportType[]).map((tType) => {
                  const cfg = TRANSPORT_TYPE_CONFIG[tType];
                  const IconComp = cfg.icon;
                  const isSelected = leg.transportType === tType;
                  return (
                    <button
                      key={tType}
                      type="button"
                      onClick={() => updateLeg(leg.id, 'transportType', tType)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all whitespace-nowrap ${
                        isSelected
                          ? `${cfg.bg} ${cfg.color} ${cfg.border} ring-2 ring-blue-300 font-black shadow-xs`
                          : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <IconComp size={12} />
                      <span>{cfg.shortLabel}</span>
                    </button>
                  );
                })}
              </div>

              {/* Station Inputs */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-beige/40 p-2 rounded-xl border border-beige-dark">
                  <label className="text-[9px] font-bold text-gray-400 block mb-0.5">
                    {index > 0 ? '出發站 (自動繼承上段)' : '出發站'}
                  </label>
                  <AutoWrapInput
                    value={leg.fromStation}
                    onChange={e => updateLeg(leg.id, 'fromStation', e.target.value)}
                    placeholder="e.g., Tokyo / 新宿"
                    className="w-full bg-transparent font-bold text-cocoa text-xs outline-none"
                  />
                </div>
                <div className="bg-beige/40 p-2 rounded-xl border border-beige-dark">
                  <label className="text-[9px] font-bold text-gray-400 block mb-0.5">抵達站</label>
                  <AutoWrapInput
                    value={leg.toStation}
                    onChange={e => updateLeg(leg.id, 'toStation', e.target.value)}
                    placeholder="e.g., Kyoto / 箱根湯本"
                    className="w-full bg-transparent font-bold text-cocoa text-xs outline-none"
                  />
                </div>
              </div>

              {/* Time Inputs */}
              <div className="grid grid-cols-2 gap-2">
                <TimePickerField
                  label="發車時間"
                  value={leg.departureTime}
                  onChange={val => updateLeg(leg.id, 'departureTime', val)}
                  themeColor="blue"
                />
                <TimePickerField
                  label="抵達時間"
                  value={leg.arrivalTime}
                  onChange={val => updateLeg(leg.id, 'arrivalTime', val)}
                  themeColor="blue"
                />
              </div>

              {/* Service Number & Platform */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-beige/40 p-2 rounded-xl border border-beige-dark">
                  <label className="text-[9px] font-bold text-gray-400 block mb-0.5">車次 / 班號 (選填)</label>
                  <AutoWrapInput
                    value={leg.serviceNumber || ''}
                    onChange={e => updateLeg(leg.id, 'serviceNumber', e.target.value)}
                    placeholder="e.g., Nozomi 21"
                    className="w-full bg-transparent font-bold text-cocoa text-xs outline-none font-sans tabular-nums"
                  />
                </div>
                <div className="bg-beige/40 p-2 rounded-xl border border-beige-dark">
                  <label className="text-[9px] font-bold text-gray-400 block mb-0.5">月台 / 閘口 (選填)</label>
                  <AutoWrapInput
                    value={leg.platform || ''}
                    onChange={e => updateLeg(leg.id, 'platform', e.target.value)}
                    placeholder="e.g., 14號月台 / 2番線"
                    className="w-full bg-transparent font-bold text-cocoa text-xs outline-none"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Fare & Expenses Section */}
      <div className="bg-white p-4 rounded-2xl border-2 border-beige-dark shadow-sm space-y-3.5">
        <div className="flex items-center justify-between border-b border-beige-dark pb-2">
          <label className="text-xs font-black text-cocoa flex items-center gap-1.5">
            <Ticket size={15} className="text-amber-600" />
            <span>票價與花費設定 (Fare & Expenses)</span>
          </label>
          <span className="text-[10px] text-gray-400 font-bold">可自由設定幣別與實付金額</span>
        </div>

        {/* Quick Pass & Discount Presets */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-gray-500 flex items-center gap-1">
            <Sparkles size={12} className="text-amber-500" />
            <span>通票 / 折扣快速套用：</span>
          </label>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <button
              type="button"
              onClick={() => applyDiscount('full')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-black border transition-all whitespace-nowrap flex items-center gap-1 active:scale-95 ${
                isFullActive
                  ? 'bg-cocoa text-white border-cocoa shadow-sm'
                  : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
              }`}
            >
              <span>全額原價 (100%)</span>
            </button>
            <button
              type="button"
              onClick={() => applyDiscount('half')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-black border transition-all whitespace-nowrap flex items-center gap-1 active:scale-95 ${
                isHalfActive
                  ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
              }`}
            >
              <span>🟡 半價卡 (50%)</span>
            </button>
            <button
              type="button"
              onClick={() => applyDiscount('eighty')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-black border transition-all whitespace-nowrap flex items-center gap-1 active:scale-95 ${
                isEightyActive
                  ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                  : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
              }`}
            >
              <span>八折 (80%)</span>
            </button>
            <button
              type="button"
              onClick={() => applyDiscount('pass_free')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-black border transition-all whitespace-nowrap flex items-center gap-1 active:scale-95 ${
                isPassFreeActive
                  ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
              }`}
            >
              <span>🟢 憑Pass免費 (實付0元)</span>
            </button>
          </div>
        </div>

        {/* Prices Input */}
        <div className="space-y-1.5">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-beige/40 p-2.5 rounded-xl border border-beige-dark">
              <label className="text-[9px] font-bold text-gray-400 block mb-0.5">每張原票價 (單張牌告/參考)</label>
              <div className="flex gap-1.5 items-center">
                <input
                  type="number"
                  inputMode="decimal"
                  value={fare.originalPrice !== undefined && fare.originalPrice !== null ? fare.originalPrice : ''}
                  onChange={e => {
                    const nextOrig = e.target.value;
                    setFare(prev => {
                      const prevOrigNum = Number(prev.originalPrice) || 0;
                      const prevDiscNum = Number(prev.discountedPrice) || 0;
                      const nextOrigNum = Number(nextOrig) || 0;
                      let nextDisc = prev.discountedPrice;

                      if (prev.passUsed === 'pass_free') {
                        nextDisc = '0';
                      } else if (prev.passUsed === 'pass_discount') {
                        const isPrevEighty = prevOrigNum > 0 && prevDiscNum === Math.round(prevOrigNum * 0.8 * 100) / 100;
                        const ratio = isPrevEighty ? 0.8 : 0.5;
                        nextDisc = nextOrig === '' ? '' : (Math.round(nextOrigNum * ratio * 100) / 100).toString();
                      } else if (
                        prev.discountedPrice === '' ||
                        prev.discountedPrice === undefined ||
                        prev.discountedPrice === prev.originalPrice ||
                        prev.passUsed === 'point_to_point' ||
                        prev.passUsed === 'ic_card'
                      ) {
                        nextDisc = nextOrig;
                      }

                      return {
                        ...prev,
                        originalPrice: nextOrig,
                        discountedPrice: nextDisc,
                        passUsed: prev.passUsed || 'point_to_point',
                      };
                    });
                  }}
                  placeholder="0"
                  className="flex-1 bg-transparent font-sans tabular-nums font-bold text-cocoa text-sm outline-none w-0 min-w-0"
                />
                <select
                  value={fare.currency || 'TWD'}
                  onChange={e => setFare(prev => ({ ...prev, currency: e.target.value }))}
                  className="bg-white p-1 rounded-lg border border-beige-dark text-xs font-bold text-cocoa outline-none cursor-pointer"
                >
                  {Array.from(new Set(['TWD', ...currencies.map(c => c.code), ...POPULAR_CURRENCIES.map(c => c.code)])).map(code => (
                    <option key={code} value={code}>{code}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-beige/40 p-2.5 rounded-xl border border-beige-dark">
              <label className="text-[9px] font-bold text-gray-400 block mb-0.5">每張實付票價 (單張實際價格)</label>
              <div className="flex gap-1.5 items-center">
                <input
                  type="number"
                  inputMode="decimal"
                  value={fare.discountedPrice !== undefined && fare.discountedPrice !== null ? fare.discountedPrice : ''}
                  onChange={e => {
                    const nextVal = e.target.value;
                    setFare(prev => ({
                      ...prev,
                      discountedPrice: nextVal,
                      passUsed:
                        nextVal === '0'
                          ? prev.passUsed
                          : prev.passUsed === 'pass_free' || !prev.passUsed
                          ? 'point_to_point'
                          : prev.passUsed,
                    }));
                  }}
                  placeholder="0"
                  className="flex-1 bg-transparent font-sans tabular-nums font-black text-amber-800 text-sm outline-none w-0 min-w-0"
                />
                <span className="text-xs font-bold text-gray-500">{fare.currency || 'TWD'}</span>
              </div>
            </div>
          </div>
          <p className="text-[11px] font-bold text-gray-500">直接填每張車票的價格，下方會依張數與分攤人數自動計算</p>
        </div>

        {/* 誰要分攤 & 車票張數（共幾張） */}
        {onToggleParticipant && members.length > 0 && (
          <div className="pt-2 border-t border-dashed border-beige-dark space-y-3">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-black text-gray-600">誰要分攤</span>
                <span className={`text-xs font-black font-sans tabular-nums ${peopleCount > 0 ? 'text-sage-dark' : 'text-red-500'}`}>
                  {peopleCount > 0 ? `已選 ${peopleCount} 人` : '請至少選 1 人'}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {members.map(m => {
                  const isSelected = selectedParticipantIds.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => onToggleParticipant(m.id)}
                      className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold border-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-sage text-white border-sage shadow-sm'
                          : 'bg-white text-gray-500 border-beige-dark hover:border-sage/50'
                      }`}
                    >
                      {m.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 車票張數（共 N 張） */}
            <div className="bg-beige/40 p-2.5 rounded-xl border border-beige-dark flex items-center justify-between gap-2 flex-wrap">
              <div className="min-w-0">
                <div className="text-xs font-black text-cocoa">車票張數（共幾張）</div>
                <div className="text-[10px] font-bold text-gray-500">
                  {hasCustomTicketCount
                    ? `自訂購買 ${effectiveTicketCount} 張 · 由 ${peopleCount} 人分攤`
                    : `預設與分攤人數相同（共 ${effectiveTicketCount} 張）`}
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {hasCustomTicketCount && peopleCount > 0 && effectiveTicketCount !== peopleCount && (
                  <button
                    type="button"
                    onClick={() => setFare(prev => ({ ...prev, ticketCount: undefined }))}
                    className="px-2 py-1 rounded-lg bg-white border border-beige-dark text-[10px] font-black text-sage-dark hover:bg-sage-light/40 transition-colors cursor-pointer"
                  >
                    同人數 ({peopleCount})
                  </button>
                )}
                <button
                  type="button"
                  onClick={() =>
                    setFare(prev => ({
                      ...prev,
                      ticketCount: Math.max(1, effectiveTicketCount - 1),
                    }))
                  }
                  className="w-8 h-8 rounded-lg bg-white border border-beige-dark font-black text-cocoa hover:bg-gray-50 active:scale-95 transition-all cursor-pointer"
                  aria-label="減少車票張數"
                >
                  -
                </button>
                <div className="flex items-center bg-white px-2.5 py-1 rounded-lg border border-beige-dark shadow-2xs">
                  <input
                    type="number"
                    min={1}
                    inputMode="numeric"
                    value={effectiveTicketCount}
                    onChange={e => {
                      const raw = e.target.value;
                      if (raw === '') {
                        setFare(prev => ({ ...prev, ticketCount: undefined }));
                      } else {
                        const parsed = Math.max(0, Math.floor(Number(raw) || 0));
                        setFare(prev => ({ ...prev, ticketCount: parsed }));
                      }
                    }}
                    className="w-10 bg-transparent text-center text-sm font-black text-cocoa outline-none font-sans tabular-nums"
                  />
                  <span className="text-[11px] font-bold text-gray-400">張</span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setFare(prev => ({
                      ...prev,
                      ticketCount: effectiveTicketCount + 1,
                    }))
                  }
                  className="w-8 h-8 rounded-lg bg-white border border-beige-dark font-black text-cocoa hover:bg-gray-50 active:scale-95 transition-all cursor-pointer"
                  aria-label="增加車票張數"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Service Fee Toggle & Rate (加計刷卡手續費) */}
        <div className="space-y-1">
          <div className="flex items-center justify-between bg-beige/40 p-2.5 rounded-xl border border-beige-dark">
            <div className="flex items-center gap-3">
              <div 
                className="flex items-center gap-2 cursor-pointer group" 
                onClick={() => setFare(prev => {
                  const nextHasFee = !prev.hasServiceFee;
                  const hasRate = prev.serviceFeePercentage !== undefined && prev.serviceFeePercentage !== null && String(prev.serviceFeePercentage).trim() !== '';
                  return {
                    ...prev,
                    hasServiceFee: nextHasFee,
                    serviceFeePercentage: nextHasFee && !hasRate ? '1.5' : prev.serviceFeePercentage,
                  };
                })}
              >
                <div className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out ${fare.hasServiceFee ? 'bg-amber-600' : 'bg-gray-200'}`}>
                  <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform duration-200 ease-in-out ${fare.hasServiceFee ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
                <span className="text-xs font-bold text-gray-600 select-none group-hover:text-cocoa transition-colors">
                  加計刷卡手續費
                </span>
              </div>
              {fare.hasServiceFee && (
                <div className="flex items-center bg-white px-2 py-0.5 rounded-lg border border-beige-dark shadow-xs">
                  <input
                    type="number"
                    step="0.1"
                    inputMode="decimal"
                    value={fare.serviceFeePercentage !== undefined && fare.serviceFeePercentage !== null ? fare.serviceFeePercentage : ''}
                    onChange={e => setFare(prev => ({ ...prev, serviceFeePercentage: e.target.value }))}
                    className="w-11 bg-transparent text-xs font-bold outline-none text-right text-cocoa font-sans tabular-nums"
                    placeholder="1.5"
                  />
                  <span className="text-[10px] font-bold text-gray-400 ml-1">%</span>
                </div>
              )}
            </div>
            {fare.hasServiceFee && resolveTransitUnitFare(fare).unitPrice > 0 && (() => {
              const unitP = resolveTransitUnitFare(fare).unitPrice;
              const pct = Number(fare.serviceFeePercentage) || 0;
              const feeTotal = unitP * effectiveTicketCount * (pct / 100);
              return (
                <div className="text-right">
                  <span className="text-[9px] text-gray-400 font-bold block leading-none">手續費合計</span>
                  <span className="text-xs font-black text-amber-800 font-sans tabular-nums">
                    +{fare.currency || 'TWD'} {formatTicketAmount(feeTotal)}
                  </span>
                </div>
              );
            })()}
          </div>
          <p className="text-[11px] font-bold text-gray-500 ml-1">預設費率 1.5%（可自訂），算在車票總計上</p>
        </div>

        {/* Customizable Extra Fee Section (支援多筆自定義加價項目) */}
        {(() => {
          const currentExtraFees: TransitExtraFeeItem[] = (Array.isArray(fare.extraFees) && fare.extraFees.length > 0)
            ? fare.extraFees
            : (fare.seatReservationFee || fare.extraFeeName)
              ? [{
                  id: 'extra-1',
                  name: fare.extraFeeName || '',
                  amount: fare.seatReservationFee || '',
                  currency: fare.seatReservationFeeCurrency || fare.currency || 'TWD',
                  hasServiceFee: fare.extraFeeHasServiceFee || false,
                  serviceFeePercentage: fare.extraFeeServiceFeePercentage || '',
                }]
              : [{
                  id: 'extra-1',
                  name: '',
                  amount: '',
                  currency: fare.currency || 'TWD',
                  hasServiceFee: false,
                  serviceFeePercentage: '',
                }];

          const handleAddExtraFee = () => {
            setFare(prev => {
              const list = (prev.extraFees && prev.extraFees.length > 0)
                ? [...prev.extraFees]
                : (prev.seatReservationFee || prev.extraFeeName)
                  ? [{
                      id: 'extra-1',
                      name: prev.extraFeeName || '',
                      amount: prev.seatReservationFee || '',
                      currency: prev.seatReservationFeeCurrency || prev.currency || 'TWD',
                      hasServiceFee: prev.extraFeeHasServiceFee || false,
                      serviceFeePercentage: prev.extraFeeServiceFeePercentage || '',
                    }]
                  : [];
              
              const newItems = [
                ...list,
                {
                  id: `extra-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                  name: '',
                  amount: '',
                  currency: prev.currency || 'TWD',
                  hasServiceFee: false,
                  serviceFeePercentage: '',
                }
              ];

              const first = newItems[0];
              return {
                ...prev,
                extraFees: newItems,
                extraFeeName: first?.name,
                seatReservationFee: first?.amount,
                seatReservationFeeCurrency: first?.currency,
                extraFeeHasServiceFee: first?.hasServiceFee,
                extraFeeServiceFeePercentage: first?.serviceFeePercentage,
              };
            });
          };

          const handleUpdateExtraFee = (idx: number, updates: Partial<TransitExtraFeeItem>) => {
            setFare(prev => {
              const existing = (prev.extraFees && prev.extraFees.length > 0)
                ? [...prev.extraFees]
                : (prev.seatReservationFee || prev.extraFeeName)
                  ? [{
                      id: 'extra-1',
                      name: prev.extraFeeName || '',
                      amount: prev.seatReservationFee || '',
                      currency: prev.seatReservationFeeCurrency || prev.currency || 'TWD',
                      hasServiceFee: prev.extraFeeHasServiceFee || false,
                      serviceFeePercentage: prev.extraFeeServiceFeePercentage || '',
                    }]
                  : [{
                      id: 'extra-1',
                      name: '',
                      amount: '',
                      currency: prev.currency || 'TWD',
                      hasServiceFee: false,
                      serviceFeePercentage: '',
                    }];

              if (!existing[idx]) return prev;
              existing[idx] = { ...existing[idx], ...updates };

              const first = existing[0];
              return {
                ...prev,
                extraFees: existing,
                extraFeeName: first?.name,
                seatReservationFee: first?.amount,
                seatReservationFeeCurrency: first?.currency,
                extraFeeHasServiceFee: first?.hasServiceFee,
                extraFeeServiceFeePercentage: first?.serviceFeePercentage,
              };
            });
          };

          const handleRemoveExtraFee = (idx: number) => {
            setFare(prev => {
              const existing = (prev.extraFees && prev.extraFees.length > 0)
                ? [...prev.extraFees]
                : [];
              const updated = existing.filter((_, i) => i !== idx);
              const first = updated[0];
              return {
                ...prev,
                extraFees: updated,
                extraFeeName: first?.name || '',
                seatReservationFee: first?.amount || '',
                seatReservationFeeCurrency: first?.currency || prev.currency || 'TWD',
                extraFeeHasServiceFee: first?.hasServiceFee || false,
                extraFeeServiceFeePercentage: first?.serviceFeePercentage || '',
              };
            });
          };

          return (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Tag size={13} className="text-blue-600" />
                  <span className="text-xs font-black text-blue-900">
                    自訂加價項目 (如：指定席、劃位費、行李加價等)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleAddExtraFee}
                  className="px-2.5 py-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black flex items-center gap-1 shadow-xs active:scale-95 transition-all cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Plus size={13} />
                  <span>新增自訂項目</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {currentExtraFees.map((item, idx) => {
                  const itemAmt = Number(item.amount) || 0;
                  const itemCurr = item.currency || fare.currency || 'TWD';
                  const itemFeePct = Number(item.serviceFeePercentage) || 0;
                  const itemFeeVal = item.hasServiceFee && itemAmt > 0 ? (itemAmt * itemFeePct / 100) : 0;

                  return (
                    <div 
                      key={item.id || idx} 
                      className="bg-blue-50/60 p-3 rounded-2xl border-2 border-blue-100/90 space-y-2 shadow-xs"
                    >
                      <div className="flex items-center gap-1.5 justify-between">
                        <div className="flex items-center gap-1.5 flex-1">
                          <span className="w-5 h-5 rounded-full bg-blue-200/80 text-blue-900 text-[10px] font-black flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <AutoWrapInput
                            value={item.name || ''}
                            onChange={e => handleUpdateExtraFee(idx, { name: e.target.value })}
                            placeholder="自訂加價項目 (如：指定席加價 / 額外訂位費 / 行李加價)"
                            className="flex-1 bg-white/90 px-2.5 py-1.5 rounded-lg border border-blue-200 text-xs font-black text-blue-900 placeholder:text-blue-300 outline-none focus:bg-white focus:border-blue-400"
                          />
                        </div>
                        {currentExtraFees.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveExtraFee(idx)}
                            className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-1 cursor-pointer"
                            title="刪除此加價項目"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>

                      <div className="flex gap-2 items-center">
                        <div className="flex-1 bg-white px-2.5 py-1.5 rounded-xl border border-blue-200 flex items-center gap-1.5 shadow-xs">
                          <label className="text-[9px] font-bold text-gray-400">每人金額</label>
                          <input
                            type="number"
                            value={item.amount !== undefined && item.amount !== null ? item.amount : ''}
                            onChange={e => handleUpdateExtraFee(idx, { amount: e.target.value })}
                            placeholder="0"
                            className="flex-1 bg-transparent font-sans tabular-nums font-black text-blue-900 text-sm outline-none w-0 min-w-0"
                          />
                        </div>
                        <select
                          value={item.currency || fare.currency || 'TWD'}
                          onChange={e => handleUpdateExtraFee(idx, { currency: e.target.value })}
                          className="bg-white px-2.5 py-2 rounded-xl border border-blue-200 text-xs font-black text-blue-700 outline-none cursor-pointer shadow-xs"
                        >
                          {Array.from(new Set(['TWD', ...currencies.map(c => c.code), ...POPULAR_CURRENCIES.map(c => c.code)])).map(code => (
                            <option key={code} value={code}>{code}</option>
                          ))}
                        </select>
                      </div>

                      {/* Extra Fee Service Fee Toggle & Rate (加價項目專屬含稅/手續費) */}
                      <div className="flex items-center justify-between bg-white/90 p-2 rounded-xl border border-blue-200/80">
                        <div className="flex items-center gap-2.5">
                          <div 
                            className="flex items-center gap-1.5 cursor-pointer group" 
                            onClick={() => handleUpdateExtraFee(idx, { hasServiceFee: !item.hasServiceFee })}
                          >
                            <div className={`w-8 h-4.5 rounded-full p-0.5 transition-colors duration-200 ease-in-out ${item.hasServiceFee ? 'bg-blue-600' : 'bg-gray-200'}`}>
                              <div className={`bg-white w-3.5 h-3.5 rounded-full shadow-xs transform transition-transform duration-200 ease-in-out ${item.hasServiceFee ? 'translate-x-3.5' : 'translate-x-0'}`} />
                            </div>
                            <span className="text-[11px] font-bold text-blue-900/80 select-none group-hover:text-blue-950 transition-colors">
                              加價含稅 / 手續費
                            </span>
                          </div>
                          {item.hasServiceFee && (
                            <div className="flex items-center bg-white px-2 py-0.5 rounded-lg border border-blue-200 shadow-xs">
                              <input
                                type="number"
                                value={item.serviceFeePercentage !== undefined && item.serviceFeePercentage !== null ? item.serviceFeePercentage : ''}
                                onChange={e => handleUpdateExtraFee(idx, { serviceFeePercentage: e.target.value })}
                                className="w-10 bg-transparent text-xs font-bold outline-none text-right text-blue-900 font-sans tabular-nums"
                                placeholder="1.5"
                              />
                              <span className="text-[10px] font-bold text-gray-400 ml-1">%</span>
                            </div>
                          )}
                        </div>
                        {item.hasServiceFee && itemAmt > 0 && (
                          <div className="text-right">
                            <span className="text-[9px] text-gray-400 font-bold block leading-none">加價手續費</span>
                            <span className="text-xs font-black text-blue-800 font-sans tabular-nums">
                              +{itemCurr} {Math.round(itemFeeVal * 100) / 100}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Notes */}
        <div className="bg-beige/30 p-2.5 rounded-xl border border-beige-dark">
          <label className="text-[9px] font-bold text-gray-400 block mb-0.5">備註 (劃位提醒 / 通票說明)</label>
          <AutoWrapInput
            value={fare.notes || ''}
            onChange={e => setFare(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="e.g., 需提前劃位，憑 Pass 進站"
            className="w-full bg-transparent font-bold text-cocoa text-xs outline-none"
          />
        </div>

        {/* 自動計算區塊（唯讀，深綠底卡片 - 對齊住宿邏輯） */}
        {(() => {
          const { unitPrice, originalUnitPrice } = resolveTransitUnitFare(fare);
          const hasPriceInput =
            (fare.discountedPrice !== undefined && fare.discountedPrice !== null && String(fare.discountedPrice).trim() !== '') ||
            (fare.originalPrice !== undefined && fare.originalPrice !== null && String(fare.originalPrice).trim() !== '') ||
            fare.passUsed === 'pass_free';
          const mainFeePct = fare.hasServiceFee ? (Number(fare.serviceFeePercentage) || 0) : 0;
          const ticketSplit = splitTicketCost({
            unitPrice,
            ticketCount: effectiveTicketCount,
            feeEnabled: Boolean(fare.hasServiceFee),
            feeRate: mainFeePct / 100,
            people: onToggleParticipant ? peopleCount : 1,
          });
          const mainCurrency = fare.currency || 'TWD';
          const mainRate = getExchangeRate(mainCurrency, currencies);
          const totalTicketsTWD = Math.round(ticketSplit.sum * mainRate);
          const perPersonTicketsTWD =
            ticketSplit.exactPerPerson !== null ? Math.round(ticketSplit.exactPerPerson * mainRate) : null;

          const extraItems = getTransitExtraFeeList(fare);
          const effectiveSplitPeople = onToggleParticipant ? peopleCount : 1;
          let extraTotalAcrossPeopleTWD = 0;
          let extraPerPersonTWD = 0;
          const extraCalculated = extraItems.map(item => {
            const rate = getExchangeRate(item.currency, currencies);
            const perPersonTwd = Math.round(item.totalWithFee * rate);
            const totalAcrossPeople = item.totalWithFee * (effectiveSplitPeople > 0 ? effectiveSplitPeople : 1);
            const totalTwd = Math.round(totalAcrossPeople * rate);
            extraPerPersonTWD += perPersonTwd;
            extraTotalAcrossPeopleTWD += totalTwd;
            return {
              ...item,
              rate,
              perPersonTwd,
              totalAcrossPeople,
              totalTwd,
            };
          });

          const grandTotalTWD = totalTicketsTWD + extraTotalAcrossPeopleTWD;
          const perPersonGrandTWD =
            perPersonTicketsTWD !== null ? perPersonTicketsTWD + extraPerPersonTWD : null;

          // 若額外加價項目與主票價同幣別，計算同幣別含加價之每人應付
          const allExtraSameCurrency =
            extraCalculated.length > 0 && extraCalculated.every(e => e.currency === mainCurrency);
          const extraSameCurrencyPerPerson = allExtraSameCurrency
            ? extraCalculated.reduce((acc, e) => acc + e.totalWithFee, 0)
            : 0;
          const displayPerPersonSameCurrency =
            ticketSplit.exactPerPerson !== null
              ? ticketSplit.exactPerPerson + extraSameCurrencyPerPerson
              : null;

          return (
            <div className="space-y-3 pt-1">
              <div
                aria-live="polite"
                className="bg-[#2D5037] text-white p-4 rounded-2xl shadow-sm space-y-2 border border-[#23402B]"
              >
                <div className="flex justify-between items-center text-xs font-bold text-white/85">
                  <span>每張車票</span>
                  <span className="font-sans tabular-nums font-black text-white">
                    {hasPriceInput
                      ? unitPrice === 0 && originalUnitPrice > 0
                        ? `${mainCurrency} 0 (憑 Pass 免費 · 原價 ${formatTicketAmount(originalUnitPrice)})`
                        : `${mainCurrency} ${formatTicketAmount(unitPrice)}`
                      : '—'}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs font-bold text-white/85">
                  <span>× 車票張數</span>
                  <span className="font-sans tabular-nums font-black text-white">
                    共 {effectiveTicketCount} 張
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs font-bold text-white/85">
                  <span>車票小計（{effectiveTicketCount} 張）</span>
                  <span className="font-sans tabular-nums font-black text-white">
                    {hasPriceInput ? `${mainCurrency} ${formatTicketAmount(ticketSplit.subtotal)}` : '—'}
                  </span>
                </div>

                {fare.hasServiceFee && (
                  <div className="flex justify-between items-center text-xs font-bold text-white/85">
                    <span>＋ 手續費 {mainFeePct}%</span>
                    <span className="font-sans tabular-nums font-black text-white">
                      {hasPriceInput ? `${mainCurrency} ${formatTicketAmount(ticketSplit.fee)}` : '—'}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center text-xs font-bold text-white/95 pt-1 border-t border-white/15">
                  <span>車票總計</span>
                  <span className="font-sans tabular-nums font-black text-white">
                    {hasPriceInput ? `${mainCurrency} ${formatTicketAmount(ticketSplit.sum)}` : '—'}
                  </span>
                </div>

                {extraCalculated.map(item => (
                  <div key={item.id} className="flex justify-between items-center text-xs font-bold text-emerald-100/95">
                    <span>
                      ＋ {item.name}（每人 {item.currency} {formatTicketAmount(item.totalWithFee)}
                      {effectiveSplitPeople > 1 ? ` × ${effectiveSplitPeople} 人` : ''}）
                    </span>
                    <span className="font-sans tabular-nums font-black text-white">
                      {item.currency} {formatTicketAmount(item.totalAcrossPeople)}
                    </span>
                  </div>
                ))}

                {onToggleParticipant && (
                  <div className="flex justify-between items-center text-xs font-bold text-white/85">
                    <span>÷ 分攤人數</span>
                    <span className="font-sans tabular-nums font-black text-white">
                      {peopleCount} 人
                    </span>
                  </div>
                )}

                <div className="pt-2.5 mt-1 border-t border-white/20">
                  <div className="flex justify-between items-baseline gap-2">
                    <span className="text-sm font-black text-white">每人應付</span>
                    <span className="text-2xl font-black text-white font-sans tabular-nums tracking-tight">
                      {hasPriceInput || extraCalculated.length > 0
                        ? displayPerPersonSameCurrency !== null
                          ? `${mainCurrency} ${formatTicketAmount(displayPerPersonSameCurrency)}`
                          : extraCalculated.length > 0 && peopleCount > 0 && perPersonGrandTWD !== null
                          ? `約 NT$ ${perPersonGrandTWD.toLocaleString('en-US')}`
                          : '—'
                        : '—'}
                    </span>
                  </div>
                  <p className="text-[11px] font-bold text-emerald-100/90 mt-1 text-right font-sans tabular-nums">
                    {onToggleParticipant && peopleCount === 0 && (hasPriceInput || extraCalculated.length > 0)
                      ? '請至少選 1 人'
                      : hasPriceInput
                      ? mainCurrency !== 'TWD' && perPersonGrandTWD !== null
                        ? `每張 ${mainCurrency} ${formatTicketAmount(unitPrice)} × 共 ${effectiveTicketCount} 張 · 每人約 NT$ ${perPersonGrandTWD.toLocaleString('en-US')}（總計約 NT$ ${grandTotalTWD.toLocaleString('en-US')}）`
                        : `每張 ${mainCurrency} ${formatTicketAmount(unitPrice)} × 共 ${effectiveTicketCount} 張`
                      : '輸入每張票價後自動計算'}
                  </p>
                </div>
              </div>

              {/* 列入預算開關（與住宿一致） */}
              {onChangeIncludeInBudget !== undefined && typeof includeInBudget === 'boolean' && (
                <div className="pt-1">
                  <div
                    className="flex items-center justify-between cursor-pointer group py-1"
                    onClick={() => onChangeIncludeInBudget(!includeInBudget)}
                  >
                    <span className="text-xs font-bold text-cocoa">列入預算</span>
                    <div className={`w-11 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${includeInBudget ? 'bg-sage' : 'bg-gray-200'}`}>
                      <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${includeInBudget ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                  </div>
                  <p className="text-[11px] font-bold text-gray-500 ml-0.5">
                    打開後，這筆會計入成員分攤明細與旅程總預算；關閉則只當潛在花費參考
                  </p>
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
};

