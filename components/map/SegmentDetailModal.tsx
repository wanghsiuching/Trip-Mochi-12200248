import { useState, useEffect } from 'react';
import { X, ArrowRight, Check, Clock, Edit2 } from 'lucide-react';
import { ManualMapPoint, ManualRouteSegment, ManualTransportType, ScheduleItem, getCircledNumber } from '../../types';
import { MANUAL_TRANSPORT_CONFIG } from '../../constants/manualTransportConfig';

interface SegmentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  segment: ManualRouteSegment | null;
  fromPoint?: ManualMapPoint | null;
  toPoint?: ManualMapPoint | null;
  linkedScheduleItem?: ScheduleItem | null;
  onSaveTransport: (segmentId: string, transportType: ManualTransportType, extraData?: Partial<ManualRouteSegment>) => void;
}

export const SegmentDetailModal: React.FC<SegmentDetailModalProps> = ({
  isOpen,
  onClose,
  segment,
  fromPoint,
  toPoint,
  linkedScheduleItem,
  onSaveTransport
}) => {
  const [selectedTransport, setSelectedTransport] = useState<ManualTransportType>('WALK');
  const [departureTime, setDepartureTime] = useState('');
  const [arrivalTime, setArrivalTime] = useState('');
  const [operator, setOperator] = useState('');
  const [serviceNumber, setServiceNumber] = useState('');
  const [note, setNote] = useState('');
  const [isEditingCustom, setIsEditingCustom] = useState(false);

  useEffect(() => {
    if (segment) {
      setSelectedTransport(segment.transportType || 'WALK');
      setDepartureTime(segment.departureTime || linkedScheduleItem?.time || linkedScheduleItem?.transitDetails?.legs[0]?.departureTime || '');
      setArrivalTime(segment.arrivalTime || linkedScheduleItem?.transitDetails?.legs[0]?.arrivalTime || '');
      setOperator(segment.operator || linkedScheduleItem?.transitDetails?.legs[0]?.operator || '');
      setServiceNumber(segment.serviceNumber || linkedScheduleItem?.transitDetails?.legs[0]?.serviceNumber || '');
      setNote(segment.note || linkedScheduleItem?.note || '');
      setIsEditingCustom(false);
    }
  }, [segment, linkedScheduleItem]);

  if (!isOpen || !segment) return null;

  const currentConfig = MANUAL_TRANSPORT_CONFIG[selectedTransport] || MANUAL_TRANSPORT_CONFIG.WALK;
  const transportOptions = Object.keys(MANUAL_TRANSPORT_CONFIG) as ManualTransportType[];

  const handleSave = () => {
    onSaveTransport(segment.id, selectedTransport, {
      departureTime: departureTime.trim() || undefined,
      arrivalTime: arrivalTime.trim() || undefined,
      operator: operator.trim() || undefined,
      serviceNumber: serviceNumber.trim() || undefined,
      note: note.trim() || undefined
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-scale-in">
      <div 
        className="bg-white rounded-[2rem] w-full max-w-md border-2 border-beige-dark shadow-hard overflow-hidden my-auto flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-beige px-5 py-4 border-b-2 border-beige-dark flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{currentConfig.emoji}</span>
            <div>
              <h3 className="text-base font-black text-cocoa leading-tight">交通路段詳情</h3>
              <p className="text-[11px] font-bold text-gray-400">
                第 {segment.sequence} 段移動路線
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white text-gray-400 hover:text-cocoa transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 text-cocoa">
          {/* Origin -> Destination Banner */}
          <div className="bg-[#FAF9F6] p-4 rounded-2xl border-2 border-beige-dark space-y-3">
            <div className="flex items-center justify-between gap-2">
              {/* Origin */}
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">出發起點</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {fromPoint && (
                    <span className="text-xs font-mono font-black text-sage">
                      {getCircledNumber(fromPoint.sequence)}
                    </span>
                  )}
                  <span className="text-sm font-black text-cocoa truncate">
                    {fromPoint?.title || '起點'}
                  </span>
                </div>
              </div>

              {/* Transit indicator */}
              <div className="flex flex-col items-center justify-center px-2 flex-shrink-0">
                <span className="text-base">{currentConfig.emoji}</span>
                <ArrowRight size={14} className="text-gray-300 -mt-0.5" />
              </div>

              {/* Destination */}
              <div className="flex-1 min-w-0 text-right">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">抵達終點</span>
                <div className="flex items-center justify-end gap-1.5 mt-0.5">
                  <span className="text-sm font-black text-cocoa truncate">
                    {toPoint?.title || '終點'}
                  </span>
                  {toPoint && (
                    <span className="text-xs font-mono font-black text-sage">
                      {getCircledNumber(toPoint.sequence)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Timing & info if present */}
            {(departureTime || arrivalTime || operator || serviceNumber) && (
              <div className="pt-2 border-t border-beige-dark/70 flex items-center justify-between text-xs font-bold text-gray-500">
                <div className="flex items-center gap-1">
                  <Clock size={12} className="text-sage" />
                  <span>{departureTime || '--:--'}</span>
                  <span className="text-gray-300">→</span>
                  <span>{arrivalTime || '--:--'}</span>
                </div>
                {(operator || serviceNumber) && (
                  <span className="text-[10px] bg-white px-2 py-0.5 rounded-md border border-beige-dark text-cocoa font-mono">
                    {[operator, serviceNumber].filter(Boolean).join(' ')}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Transport Type Grid */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-black text-cocoa">
                變更交通方式
              </label>
              <span className="text-[11px] font-bold text-sage">
                {currentConfig.label} ({currentConfig.shortLabel})
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
              {transportOptions.map((tKey) => {
                const conf = MANUAL_TRANSPORT_CONFIG[tKey];
                const isSelected = selectedTransport === tKey;
                return (
                  <button
                    key={tKey}
                    type="button"
                    onClick={() => setSelectedTransport(tKey)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all ${
                      isSelected 
                        ? 'bg-sage/15 border-sage text-sage-dark font-black scale-102 shadow-xs' 
                        : 'bg-[#FAF9F6] border-beige-dark text-gray-500 hover:border-gray-300 font-bold'
                    }`}
                  >
                    <span className="text-xl leading-none mb-1">{conf.emoji}</span>
                    <span className="text-[11px]">{conf.shortLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Toggle additional details (Time, Operator, Note) */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setIsEditingCustom(!isEditingCustom)}
              className="text-xs font-bold text-sage hover:underline flex items-center gap-1"
            >
              <Edit2 size={11} />
              {isEditingCustom ? '收起車次與時間設定' : '進階設定：發車/抵達時間與車次'}
            </button>

            {isEditingCustom && (
              <div className="mt-2.5 p-3 rounded-xl bg-beige/40 border border-beige-dark space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 block mb-0.5">發車時間</label>
                    <input 
                      type="text" 
                      value={departureTime}
                      onChange={(e) => setDepartureTime(e.target.value)}
                      placeholder="例: 08:32"
                      className="w-full bg-white border border-beige-dark rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-cocoa"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 block mb-0.5">抵達時間</label>
                    <input 
                      type="text" 
                      value={arrivalTime}
                      onChange={(e) => setArrivalTime(e.target.value)}
                      placeholder="例: 10:55"
                      className="w-full bg-white border border-beige-dark rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-cocoa"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 block mb-0.5">營運商 / 公司</label>
                    <input 
                      type="text" 
                      value={operator}
                      onChange={(e) => setOperator(e.target.value)}
                      placeholder="例: SBB, JR, Trenitalia"
                      className="w-full bg-white border border-beige-dark rounded-lg px-2.5 py-1.5 text-xs font-bold text-cocoa"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 block mb-0.5">車次 / 班號</label>
                    <input 
                      type="text" 
                      value={serviceNumber}
                      onChange={(e) => setServiceNumber(e.target.value)}
                      placeholder="例: IC 8, RE 452"
                      className="w-full bg-white border border-beige-dark rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-cocoa"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 block mb-0.5">備註</label>
                  <input 
                    type="text" 
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="例: 需在 Track 4 轉乘"
                    className="w-full bg-white border border-beige-dark rounded-lg px-2.5 py-1.5 text-xs font-bold text-cocoa"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-beige-dark/50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border-2 border-beige-dark text-gray-500 font-bold text-xs hover:bg-gray-100 transition-colors"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-sage hover:bg-sage-dark text-white font-black text-xs shadow-hard-sm-sage border-2 border-sage active:translate-y-0.5 transition-all flex items-center gap-1.5"
            >
              <Check size={14} strokeWidth={3} />
              儲存交通方式
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
