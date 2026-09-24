import { useState, useEffect } from 'react';
import { X, MapPin, Compass, Check, ArrowRight } from 'lucide-react';
import { ManualMapPoint, ManualTransportType, MapPointType, ScheduleItem, getCircledNumber } from '../../types';
import { 
  MANUAL_TRANSPORT_CONFIG, 
  POINT_TYPE_CONFIG, 
  guessPointTypeFromSchedule, 
  guessTransportTypeFromSchedule 
} from '../../constants/manualTransportConfig';

interface AddMapPointModalProps {
  isOpen: boolean;
  onClose: () => void;
  day: string;
  dayIndex?: number;
  latitude: number;
  longitude: number;
  sequence: number;
  prevPoint?: ManualMapPoint | null;
  dayScheduleItems: ScheduleItem[];
  onConfirm: (
    pointData: {
      day: string;
      dayIndex?: number;
      title: string;
      latitude: number;
      longitude: number;
      scheduleItemId?: string;
      pointType: MapPointType;
      notes?: string;
    },
    transportFromPrev: ManualTransportType
  ) => void;
}

export const AddMapPointModal: React.FC<AddMapPointModalProps> = ({
  isOpen,
  onClose,
  day,
  dayIndex,
  latitude,
  longitude,
  sequence,
  prevPoint,
  dayScheduleItems,
  onConfirm
}) => {
  const [title, setTitle] = useState('');
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>('');
  const [pointType, setPointType] = useState<MapPointType>('PLACE');
  const [transportType, setTransportType] = useState<ManualTransportType>('WALK');
  const [notes, setNotes] = useState('');

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setSelectedScheduleId('');
      setPointType('PLACE');
      setTransportType('WALK');
      setNotes('');
    }
  }, [isOpen, latitude, longitude]);

  if (!isOpen) return null;

  // 當使用者選擇特定 ScheduleItem
  const handleSelectScheduleItem = (itemId: string) => {
    setSelectedScheduleId(itemId);
    if (!itemId) return;

    const matched = dayScheduleItems.find(i => i.id === itemId);
    if (matched) {
      if (!title || title.startsWith('地點 #')) {
        setTitle(matched.title || matched.location || '');
      }
      setPointType(guessPointTypeFromSchedule(matched));
      if (prevPoint) {
        setTransportType(guessTransportTypeFromSchedule(matched));
      }
      if (matched.note || matched.address) {
        setNotes(matched.address || matched.note || '');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalTitle = title.trim() || `地點 ${getCircledNumber(sequence)}`;

    onConfirm({
      day,
      dayIndex,
      title: finalTitle,
      latitude,
      longitude,
      scheduleItemId: selectedScheduleId || undefined,
      pointType,
      notes: notes.trim() || undefined
    }, transportType);

    onClose();
  };

  const transportOptions = Object.keys(MANUAL_TRANSPORT_CONFIG) as ManualTransportType[];
  const pointTypeOptions = Object.keys(POINT_TYPE_CONFIG) as MapPointType[];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-scale-in">
      <div 
        className="bg-white rounded-[2rem] w-full max-w-lg border-2 border-beige-dark shadow-hard overflow-hidden my-auto max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-beige px-5 py-4 border-b-2 border-beige-dark flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-full bg-sage text-white font-mono font-black text-sm flex items-center justify-center shadow-xs">
              {getCircledNumber(sequence)}
            </span>
            <div>
              <h3 className="text-base font-black text-cocoa leading-tight">新增地圖位置</h3>
              <p className="text-[11px] font-bold text-gray-400">
                {dayIndex ? `Day ${dayIndex}` : day} · 自動編號第 {sequence} 站
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-cocoa">
          {/* Coordinates Info */}
          <div className="flex items-center justify-between bg-beige/60 rounded-xl px-3 py-2 border border-beige-dark/70 text-xs">
            <span className="flex items-center gap-1.5 font-bold text-gray-500">
              <MapPin size={13} className="text-sage" /> 地圖拾取座標
            </span>
            <span className="font-mono font-bold text-cocoa bg-white px-2 py-0.5 rounded-md border border-beige-dark">
              {latitude.toFixed(5)}, {longitude.toFixed(5)}
            </span>
          </div>

          {/* Schedule Binding Selector */}
          <div>
            <label className="block text-xs font-black text-cocoa mb-1.5 flex items-center justify-between">
              <span>是否綁定行程？ (可選)</span>
              {selectedScheduleId && (
                <span className="text-[10px] text-sage font-bold flex items-center gap-1">
                  <Check size={11} /> 已關聯行程
                </span>
              )}
            </label>
            <select
              value={selectedScheduleId}
              onChange={(e) => handleSelectScheduleItem(e.target.value)}
              className="w-full bg-[#FAF9F6] border-2 border-beige-dark focus:border-sage rounded-xl px-3 py-2.5 text-xs font-bold text-cocoa outline-hidden transition-all"
            >
              <option value="">不綁定 (單純建立自訂地圖點)</option>
              {dayScheduleItems.map((item) => (
                <option key={item.id} value={item.id}>
                  [{item.time}] {item.title || item.location} ({item.type})
                </option>
              ))}
            </select>
            <p className="text-[10px] text-gray-400 mt-1">
              綁定後地圖標記可直接跳轉至行程手帳，若無行程亦可作為自訂觀光點。
            </p>
          </div>

          {/* Title Input */}
          <div>
            <label className="block text-xs font-black text-cocoa mb-1.5">
              地點名稱 <span className="text-red-400">*</span>
            </label>
            <input 
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：米蘭中央車站、Oeschinensee 湖畔、飯店"
              className="w-full bg-[#FAF9F6] border-2 border-beige-dark focus:border-sage rounded-xl px-3.5 py-2.5 text-sm font-black text-cocoa placeholder-gray-300 outline-hidden transition-all"
              autoFocus
            />
          </div>

          {/* Point Type */}
          <div>
            <label className="block text-xs font-black text-cocoa mb-1.5">節點類別</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {pointTypeOptions.map((typeKey) => {
                const conf = POINT_TYPE_CONFIG[typeKey];
                const isSelected = pointType === typeKey;
                return (
                  <button
                    key={typeKey}
                    type="button"
                    onClick={() => setPointType(typeKey)}
                    className={`flex items-center gap-1.5 p-2 rounded-xl border-2 text-xs font-bold transition-all text-left ${
                      isSelected 
                        ? 'bg-sage/15 border-sage text-sage-dark font-black shadow-xs' 
                        : 'bg-[#FAF9F6] border-beige-dark text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <span>{conf.iconText}</span>
                    <span className="truncate">{conf.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Previous Point & Transport Type (if sequence > 1) */}
          {prevPoint && (
            <div className="bg-beige/40 rounded-2xl p-3.5 border-2 border-beige-dark space-y-3">
              <div className="flex items-center justify-between text-xs font-black">
                <span className="text-cocoa flex items-center gap-1.5">
                  <Compass size={14} className="text-sage" /> 
                  連線交通方式
                </span>
                <span className="text-[11px] text-gray-500 font-bold flex items-center gap-1">
                  {getCircledNumber(prevPoint.sequence)} {prevPoint.title} 
                  <ArrowRight size={11} className="text-gray-400" /> 
                  {getCircledNumber(sequence)} {title || '新點'}
                </span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                {transportOptions.map((tKey) => {
                  const tConf = MANUAL_TRANSPORT_CONFIG[tKey];
                  const isSelected = transportType === tKey;
                  return (
                    <button
                      key={tKey}
                      type="button"
                      onClick={() => setTransportType(tKey)}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border-2 text-center transition-all ${
                        isSelected 
                          ? 'bg-white border-sage text-sage-dark shadow-xs font-black scale-102' 
                          : 'bg-white/80 border-beige-dark text-gray-500 hover:border-gray-300 font-bold text-xs'
                      }`}
                    >
                      <span className="text-lg leading-none mb-1">{tConf.emoji}</span>
                      <span className="text-[11px] leading-tight">{tConf.shortLabel}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Note */}
          <div>
            <label className="block text-xs font-black text-cocoa mb-1">備註說明 (選填)</label>
            <input 
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="例如：需搭乘纜車、出口 3 號、停留 1.5 小時"
              className="w-full bg-[#FAF9F6] border-2 border-beige-dark focus:border-sage rounded-xl px-3 py-2 text-xs font-bold text-cocoa placeholder-gray-300 outline-hidden"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border-2 border-beige-dark text-gray-500 font-bold text-xs hover:bg-gray-100 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-sage hover:bg-sage-dark text-white font-black text-xs shadow-hard-sm-sage border-2 border-sage active:translate-y-0.5 transition-all flex items-center gap-1.5"
            >
              <Check size={14} strokeWidth={3} />
              建立位置與路線
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
