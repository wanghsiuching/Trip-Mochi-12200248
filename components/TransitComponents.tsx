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
  Currency 
} from '../types';

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

/**
 * 智慧票卡標籤 (Pass Badges) - 日系手帳風格印章/標籤
 */
export const TransitPassBadge: React.FC<{
  fare: TransitFareDetails;
  compact?: boolean;
}> = ({ fare, compact = false }) => {
  const { passUsed, originalPrice, discountedPrice, currency, seatReservationFee, notes } = fare;
  const config = PASS_TYPE_CONFIG[passUsed] || PASS_TYPE_CONFIG.none;
  const savings = Math.max(0, originalPrice - discountedPrice);

  if (compact) {
    if (passUsed === 'pass_free') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm">
          <Ticket size={10} className="text-emerald-700" />
          <span>Pass 涵蓋 0元</span>
          {Number(seatReservationFee) > 0 && <span className="text-[9px] opacity-80">(指定席 +{currency} {Number(seatReservationFee).toLocaleString()})</span>}
        </span>
      );
    }
    if (passUsed === 'pass_discount') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 shadow-sm">
          <Percent size={10} className="text-amber-700" />
          <span>{currency} {Number(discountedPrice).toLocaleString()}</span>
          {savings > 0 && <span className="text-[9px] text-amber-700 font-bold">(省 {currency} {Number(savings).toLocaleString()})</span>}
        </span>
      );
    }
    if (passUsed === 'ic_card') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-blue-100 text-blue-800 border border-blue-300 shadow-sm">
          <CreditCard size={10} className="text-blue-700" />
          <span>IC 刷卡 {currency} {Number(discountedPrice).toLocaleString()}</span>
        </span>
      );
    }
    if (Number(discountedPrice) > 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-stone-100 text-stone-700 border border-stone-300 shadow-sm">
          <span>{currency} {Number(discountedPrice).toLocaleString()}</span>
        </span>
      );
    }
    return null;
  }

  // Full Badge View (手帳風印章 + 票價試算)
  return (
    <div className="rounded-2xl p-3.5 border-2 space-y-2 bg-white shadow-sm border-beige-dark">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className={`px-2.5 py-1 rounded-xl text-xs font-black border flex items-center gap-1.5 shadow-sm ${config.badgeClass}`}>
            <Ticket size={14} />
            <span>{config.badgeTitle}</span>
          </div>
          {passUsed === 'pass_free' && (
            <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
              實付 0 元
            </span>
          )}
        </div>

        {/* Price Breakdown */}
        <div className="text-right">
          {passUsed === 'pass_discount' && savings > 0 ? (
            <div className="flex items-baseline gap-2 justify-end">
              <span className="text-[11px] text-gray-400 line-through font-mono">
                {currency} {Number(originalPrice).toLocaleString()}
              </span>
              <span className="text-base font-black text-amber-800 font-mono">
                {currency} {Number(discountedPrice).toLocaleString()}
              </span>
            </div>
          ) : passUsed === 'pass_free' ? (
            <div className="text-right">
              {Number(originalPrice) > 0 && (
                <span className="text-[10px] text-gray-400 line-through font-mono block">
                  原價 {currency} {Number(originalPrice).toLocaleString()}
                </span>
              )}
              <span className="text-sm font-black text-emerald-700 font-mono">
                實付 {currency} 0
              </span>
            </div>
          ) : (
            <span className="text-base font-black text-cocoa font-mono">
              {currency} {Number(discountedPrice).toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {/* Savings Notification or Extra fees */}
      <div className="pt-2 border-t border-dashed border-beige-dark flex items-center justify-between flex-wrap text-xs font-bold gap-2">
        {savings > 0 && passUsed === 'pass_discount' && (
          <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200 text-[11px] font-black inline-flex items-center gap-1">
            <Sparkles size={12} className="text-amber-600" />
            省下 {currency} {Number(savings).toLocaleString()}
          </span>
        )}
        {Number(seatReservationFee) > 0 && (
          <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200 text-[11px] font-black inline-flex items-center gap-1 ml-auto">
            <span>強制訂位/指定席:</span>
            <span className="font-mono">{currency} {Number(seatReservationFee).toLocaleString()}</span>
          </span>
        )}
      </div>

      {notes && (
        <div className="text-[11px] text-gray-500 bg-yellow-50/70 p-2 rounded-xl border border-yellow-200/60 font-bold flex items-start gap-1.5 mt-1">
          <Info size={13} className="text-yellow-600 mt-0.5 flex-shrink-0" />
          <span>{notes}</span>
        </div>
      )}
    </div>
  );
};

/**
 * 模組化多段轉乘檢視 (Leg Chain Timeline)
 */
export const TransitLegChainView: React.FC<{
  legs: TransitLeg[];
  fare?: TransitFareDetails;
  isDetailed?: boolean;
}> = ({ legs, fare, isDetailed = false }) => {
  const [expanded, setExpanded] = React.useState(false);

  if (!legs || legs.length === 0) return null;

  const firstLeg = legs[0];
  const lastLeg = legs[legs.length - 1];
  const isMultiLeg = legs.length > 1;

  return (
    <div className="space-y-2">
      {/* Route Header Banner */}
      <div className="bg-gradient-to-r from-blue-50/90 to-indigo-50/80 p-3.5 rounded-2xl border-2 border-blue-100 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {legs.map((leg, idx) => {
              const typeCfg = TRANSPORT_TYPE_CONFIG[leg.transportType] || TRANSPORT_TYPE_CONFIG.train;
              const IconComp = typeCfg.icon;
              return (
                <React.Fragment key={leg.id || idx}>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black border shadow-xs ${typeCfg.bg} ${typeCfg.color} ${typeCfg.border}`}>
                    <IconComp size={11} />
                    <span>{typeCfg.shortLabel}</span>
                    {leg.serviceNumber && <span className="opacity-90 font-mono">{leg.serviceNumber}</span>}
                  </span>
                  {idx < legs.length - 1 && (
                    <ArrowRight size={12} className="text-blue-300 flex-shrink-0" />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {isMultiLeg && !isDetailed && (
            <button 
              onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
              className="text-[11px] font-black text-blue-600 hover:text-blue-800 bg-white px-2 py-1 rounded-xl border border-blue-200 shadow-xs flex items-center gap-1 transition-colors"
            >
              <Layers size={12} />
              <span>{expanded ? '收合轉乘' : `${legs.length}段轉乘`}</span>
              {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          )}
        </div>

        {/* Origin to Destination Bar */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-blue-100 flex-shrink-0" />
            <div>
              <span className="text-xs font-black text-cocoa block leading-tight">{firstLeg.fromStation || '起點'}</span>
              {firstLeg.departureTime && (
                <span className="text-[10px] font-mono font-bold text-gray-400">{firstLeg.departureTime} 發</span>
              )}
            </div>
          </div>

          <div className="flex-1 mx-3 flex flex-col items-center">
            <div className="w-full h-0.5 bg-dashed bg-blue-200 relative my-1">
              <div className="absolute left-1/2 -top-1.5 -translate-x-1/2 bg-white px-1.5 py-0.5 rounded text-[9px] font-black text-blue-500 border border-blue-100 shadow-xs whitespace-nowrap">
                {isMultiLeg ? `經停 ${legs.length - 1} 站` : '直達'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-right">
            <div>
              <span className="text-xs font-black text-cocoa block leading-tight">{lastLeg.toStation || '終點'}</span>
              {lastLeg.arrivalTime && (
                <span className="text-[10px] font-mono font-bold text-gray-400">{lastLeg.arrivalTime} 到</span>
              )}
            </div>
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-indigo-100 flex-shrink-0" />
          </div>
        </div>
      </div>

      {/* Expandable or Detailed Leg Timeline Chain */}
      {(expanded || isDetailed || !isMultiLeg) && (
        <div className="bg-white/80 p-3 rounded-2xl border border-beige-dark space-y-3 animate-scale-in">
          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
            <Clock size={12} className="text-blue-500" />
            <span>轉乘詳細區間 (Leg Chain)</span>
          </div>

          <div className="relative pl-4 space-y-3 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-blue-100">
            {legs.map((leg, idx) => {
              const typeCfg = TRANSPORT_TYPE_CONFIG[leg.transportType] || TRANSPORT_TYPE_CONFIG.train;
              const IconComp = typeCfg.icon;
              return (
                <div key={leg.id || idx} className="relative pl-3">
                  {/* Step Dot */}
                  <div className="absolute -left-4 top-1.5 w-3 h-3 rounded-full bg-white border-2 border-blue-500 shadow-xs flex items-center justify-center">
                    <div className="w-1 h-1 rounded-full bg-blue-500" />
                  </div>

                  <div className="bg-beige/40 p-2.5 rounded-xl border border-beige-dark hover:border-blue-200 transition-colors space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className={`p-1 rounded-lg border text-xs ${typeCfg.bg} ${typeCfg.color} ${typeCfg.border}`}>
                          <IconComp size={13} />
                        </span>
                        <span className="text-xs font-black text-cocoa">
                          {leg.fromStation} <span className="text-gray-300">➔</span> {leg.toStation}
                        </span>
                      </div>
                      <span className="text-[10px] font-black text-gray-400 bg-white px-1.5 py-0.5 rounded border border-gray-100">
                        區間 {idx + 1}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] font-bold text-gray-500 pt-0.5">
                      <div className="flex items-center gap-1">
                        <Clock size={11} className="text-blue-400" />
                        <span>時間: <span className="font-mono text-cocoa">{leg.departureTime || '--'} ~ {leg.arrivalTime || '--'}</span></span>
                      </div>
                      {leg.serviceNumber && (
                        <div className="flex items-center gap-1">
                          <Tag size={11} className="text-indigo-400" />
                          <span>班次: <span className="font-mono font-black text-indigo-600">{leg.serviceNumber}</span></span>
                        </div>
                      )}
                      {leg.platform && (
                        <div className="flex items-center gap-1 col-span-2">
                          <MapPin size={11} className="text-amber-500" />
                          <span>月台/閘口: <span className="text-cocoa">{leg.platform}</span></span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
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
}> = ({ legs, setLegs, fare, setFare, currencies }) => {

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
      setFare(prev => ({ ...prev, passUsed: 'pass_free', discountedPrice: 0 }));
    } else if (type === 'half') {
      setFare(prev => ({ ...prev, passUsed: 'pass_discount', discountedPrice: Math.round(orig * 0.5) }));
    } else if (type === 'eighty') {
      setFare(prev => ({ ...prev, passUsed: 'pass_discount', discountedPrice: Math.round(orig * 0.8) }));
    } else if (type === 'ic') {
      setFare(prev => ({ ...prev, passUsed: 'ic_card', discountedPrice: orig }));
    } else if (type === 'full') {
      setFare(prev => ({ ...prev, passUsed: 'point_to_point', discountedPrice: orig }));
    }
  };

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
                  <input
                    value={leg.fromStation}
                    onChange={e => updateLeg(leg.id, 'fromStation', e.target.value)}
                    placeholder="e.g., Tokyo / 新宿"
                    className="w-full bg-transparent font-bold text-cocoa text-xs outline-none"
                  />
                </div>
                <div className="bg-beige/40 p-2 rounded-xl border border-beige-dark">
                  <label className="text-[9px] font-bold text-gray-400 block mb-0.5">抵達站</label>
                  <input
                    value={leg.toStation}
                    onChange={e => updateLeg(leg.id, 'toStation', e.target.value)}
                    placeholder="e.g., Kyoto / 箱根湯本"
                    className="w-full bg-transparent font-bold text-cocoa text-xs outline-none"
                  />
                </div>
              </div>

              {/* Time Inputs */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-beige/40 p-2 rounded-xl border border-beige-dark flex items-center gap-2">
                  <Clock size={14} className="text-blue-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <label className="text-[9px] font-bold text-gray-400 block mb-0.5">發車時間</label>
                    <input
                      type="time"
                      value={leg.departureTime}
                      onChange={e => updateLeg(leg.id, 'departureTime', e.target.value)}
                      className="w-full bg-transparent font-bold text-cocoa text-xs outline-none"
                      style={{ colorScheme: 'light' }}
                    />
                  </div>
                </div>
                <div className="bg-beige/40 p-2 rounded-xl border border-beige-dark flex items-center gap-2">
                  <Clock size={14} className="text-blue-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <label className="text-[9px] font-bold text-gray-400 block mb-0.5">抵達時間</label>
                    <input
                      type="time"
                      value={leg.arrivalTime}
                      onChange={e => updateLeg(leg.id, 'arrivalTime', e.target.value)}
                      className="w-full bg-transparent font-bold text-cocoa text-xs outline-none"
                      style={{ colorScheme: 'light' }}
                    />
                  </div>
                </div>
              </div>

              {/* Service Number & Platform */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-beige/40 p-2 rounded-xl border border-beige-dark">
                  <label className="text-[9px] font-bold text-gray-400 block mb-0.5">車次 / 班號 (選填)</label>
                  <input
                    value={leg.serviceNumber || ''}
                    onChange={e => updateLeg(leg.id, 'serviceNumber', e.target.value)}
                    placeholder="e.g., Nozomi 21"
                    className="w-full bg-transparent font-bold text-cocoa text-xs outline-none font-mono"
                  />
                </div>
                <div className="bg-beige/40 p-2 rounded-xl border border-beige-dark">
                  <label className="text-[9px] font-bold text-gray-400 block mb-0.5">月台 / 閘口 (選填)</label>
                  <input
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

      {/* Fare & Pass Details Section */}
      <div className="bg-white p-4 rounded-2xl border-2 border-beige-dark shadow-sm space-y-3.5">
        <div className="flex items-center justify-between border-b border-beige-dark pb-2">
          <label className="text-xs font-black text-cocoa flex items-center gap-1.5">
            <Ticket size={15} className="text-amber-600" />
            <span>票價與通行證折扣 (Pass & Fare)</span>
          </label>
          <span className="text-[10px] text-gray-400 font-bold">支援 JR Pass / 半價卡 / IC卡</span>
        </div>

        {/* Pass Type Selection */}
        <div>
          <label className="text-[10px] font-bold text-gray-400 block mb-1.5">通行證 / 票種類型</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {(['pass_free', 'pass_discount', 'ic_card', 'point_to_point', 'none'] as TransitPassType[]).map(pType => {
              const cfg = PASS_TYPE_CONFIG[pType];
              const isSelected = fare.passUsed === pType;
              return (
                <button
                  key={pType}
                  type="button"
                  onClick={() => setFare(prev => ({ ...prev, passUsed: pType }))}
                  className={`p-2 rounded-xl text-left border text-xs transition-all ${
                    isSelected
                      ? `${cfg.badgeClass} ring-2 ring-blue-300 font-black shadow-xs`
                      : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <span className="block font-black text-[11px] leading-tight">{cfg.badgeTitle}</span>
                  <span className="text-[9px] opacity-75 block truncate mt-0.5">{cfg.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Calculation Buttons */}
        <div>
          <label className="text-[10px] font-bold text-gray-400 block mb-1">快捷折扣試算</label>
          <div className="flex gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => applyDiscount('pass_free')}
              className="px-2.5 py-1 rounded-lg text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200 transition-colors shadow-xs"
            >
              🎉 通票 0 元 (Pass)
            </button>
            <button
              type="button"
              onClick={() => applyDiscount('half')}
              className="px-2.5 py-1 rounded-lg text-[11px] font-black bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 transition-colors shadow-xs"
            >
              🏷️ 半價 (50%)
            </button>
            <button
              type="button"
              onClick={() => applyDiscount('eighty')}
              className="px-2.5 py-1 rounded-lg text-[11px] font-black bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 transition-colors shadow-xs"
            >
              🏷️ 八折 (80%)
            </button>
            <button
              type="button"
              onClick={() => applyDiscount('ic')}
              className="px-2.5 py-1 rounded-lg text-[11px] font-black bg-blue-100 text-blue-800 border border-blue-300 hover:bg-blue-200 transition-colors shadow-xs"
            >
              💳 IC 扣款
            </button>
            <button
              type="button"
              onClick={() => applyDiscount('full')}
              className="px-2.5 py-1 rounded-lg text-[11px] font-black bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 transition-colors shadow-xs"
            >
              全額原價
            </button>
          </div>
        </div>

        {/* Prices Input */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="bg-beige/40 p-2.5 rounded-xl border border-beige-dark">
            <label className="text-[9px] font-bold text-gray-400 block mb-0.5">原票價 (牌告價)</label>
            <div className="flex gap-1.5 items-center">
              <input
                type="number"
                value={fare.originalPrice || ''}
                onChange={e => {
                  const val = Number(e.target.value) || 0;
                  setFare(prev => {
                    const next = { ...prev, originalPrice: val };
                    if (prev.passUsed === 'pass_free') next.discountedPrice = 0;
                    else if (prev.passUsed === 'pass_discount') next.discountedPrice = Math.round(val * 0.5);
                    else if (prev.passUsed === 'none' || prev.passUsed === 'point_to_point' || prev.passUsed === 'ic_card') next.discountedPrice = val;
                    return next;
                  });
                }}
                placeholder="0"
                className="flex-1 bg-transparent font-mono font-bold text-cocoa text-sm outline-none"
              />
              <select
                value={fare.currency}
                onChange={e => setFare(prev => ({ ...prev, currency: e.target.value }))}
                className="bg-white p-1 rounded-lg border border-beige-dark text-xs font-bold text-cocoa outline-none"
              >
                <option value="TWD">TWD</option>
                {currencies.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
              </select>
            </div>
          </div>

          <div className="bg-beige/40 p-2.5 rounded-xl border border-beige-dark">
            <label className="text-[9px] font-bold text-gray-400 block mb-0.5">實際支付 (折後或Pass)</label>
            <div className="flex gap-1.5 items-center">
              <input
                type="number"
                value={fare.discountedPrice !== undefined ? fare.discountedPrice : ''}
                onChange={e => setFare(prev => ({ ...prev, discountedPrice: Number(e.target.value) || 0 }))}
                placeholder="0"
                className="flex-1 bg-transparent font-mono font-black text-amber-800 text-sm outline-none"
              />
              <span className="text-xs font-bold text-gray-500">{fare.currency}</span>
            </div>
          </div>
        </div>

        {/* Seat Reservation Fee */}
        <div className="bg-blue-50/40 p-2.5 rounded-xl border border-blue-100 space-y-1">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-bold text-blue-700 flex items-center gap-1">
              <Tag size={12} />
              <span>額外強制訂位費 / 指定席加價 (選填)</span>
            </label>
            <span className="text-[9px] text-blue-400">如觀景列車、新幹線指定席</span>
          </div>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              value={fare.seatReservationFee || ''}
              onChange={e => setFare(prev => ({ ...prev, seatReservationFee: Number(e.target.value) || 0 }))}
              placeholder="0"
              className="flex-1 bg-white p-1.5 rounded-lg border border-blue-200 font-mono font-bold text-cocoa text-xs outline-none"
            />
            <span className="text-xs font-bold text-blue-600">{fare.currency}</span>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-beige/30 p-2.5 rounded-xl border border-beige-dark">
          <label className="text-[9px] font-bold text-gray-400 block mb-0.5">備註 (劃位提醒 / 通票說明)</label>
          <input
            value={fare.notes || ''}
            onChange={e => setFare(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="e.g., 需提前一個月劃位，憑 JR Pass 進站"
            className="w-full bg-transparent font-bold text-cocoa text-xs outline-none"
          />
        </div>
      </div>
    </div>
  );
};

