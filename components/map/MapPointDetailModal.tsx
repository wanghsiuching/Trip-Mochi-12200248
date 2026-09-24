import { useState } from 'react';
import { X, MapPin, Calendar, Clock, Trash2, ArrowUpRight, Check, Edit3 } from 'lucide-react';
import { ManualMapPoint, MapPointType, ScheduleItem, getCircledNumber } from '../../types';
import { POINT_TYPE_CONFIG } from '../../constants/manualTransportConfig';

interface MapPointDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  point: ManualMapPoint | null;
  linkedScheduleItem?: ScheduleItem | null;
  isEditMode: boolean;
  onJumpToSchedule?: (date: string, itemId: string) => void;
  onDeletePoint?: (pointId: string, day: string) => void;
  onUpdatePointTitle?: (pointId: string, title: string, pointType: MapPointType) => void;
}

export const MapPointDetailModal: React.FC<MapPointDetailModalProps> = ({
  isOpen,
  onClose,
  point,
  linkedScheduleItem,
  isEditMode,
  onJumpToSchedule,
  onDeletePoint,
  onUpdatePointTitle
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editType, setEditType] = useState<MapPointType>('PLACE');

  if (!isOpen || !point) return null;

  const typeConfig = POINT_TYPE_CONFIG[point.pointType] || POINT_TYPE_CONFIG.CUSTOM_POINT;

  const handleStartEdit = () => {
    setEditTitle(point.title);
    setEditType(point.pointType);
    setIsEditingTitle(true);
  };

  const handleSaveEdit = () => {
    if (onUpdatePointTitle && editTitle.trim()) {
      onUpdatePointTitle(point.id, editTitle.trim(), editType);
    }
    setIsEditingTitle(false);
  };

  const handleDelete = () => {
    if (onDeletePoint && confirm(`確定要刪除第 ${point.sequence} 站「${point.title}」嗎？\n（此操作只調整地圖路線與編號，不會刪除原始行程）`)) {
      onDeletePoint(point.id, point.day);
      onClose();
    }
  };

  const handleViewSchedule = () => {
    if (onJumpToSchedule && point.scheduleItemId) {
      onJumpToSchedule(point.day, point.scheduleItemId);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-scale-in">
      <div 
        className="bg-white rounded-[2rem] w-full max-w-sm border-2 border-beige-dark shadow-hard overflow-hidden my-auto flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-beige px-5 py-4 border-b-2 border-beige-dark flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-sage text-white font-mono font-black text-sm flex items-center justify-center shadow-xs">
              {getCircledNumber(point.sequence)}
            </span>
            <div>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${typeConfig.badgeBg} ${typeConfig.badgeText} ${typeConfig.badgeBorder}`}>
                {typeConfig.iconText} {typeConfig.label}
              </span>
              <p className="text-[11px] font-bold text-gray-400 mt-0.5">
                {point.dayIndex ? `Day ${point.dayIndex}` : point.day} · 第 {point.sequence} 站
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
          {isEditingTitle ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">編輯名稱</label>
                <input 
                  type="text" 
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-[#FAF9F6] border-2 border-sage rounded-xl px-3 py-2 text-sm font-black text-cocoa outline-hidden"
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingTitle(false)}
                  className="flex-1 py-1.5 rounded-lg border border-gray-300 text-xs font-bold text-gray-500"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="flex-1 py-1.5 rounded-lg bg-sage text-white text-xs font-black"
                >
                  儲存
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-lg font-black text-cocoa leading-snug break-words">
                  {point.title}
                </h3>
                {isEditMode && (
                  <button 
                    onClick={handleStartEdit}
                    className="p-1 rounded-lg text-gray-400 hover:text-sage hover:bg-beige transition-colors flex-shrink-0"
                    title="編輯名稱"
                  >
                    <Edit3 size={15} />
                  </button>
                )}
              </div>
              {point.notes && (
                <p className="text-xs text-gray-500 mt-1 font-bold">
                  {point.notes}
                </p>
              )}
            </div>
          )}

          {/* Coordinates & Location badge */}
          <div className="bg-[#FAF9F6] rounded-xl p-3 border border-beige-dark space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-400 flex items-center gap-1">
                <MapPin size={12} className="text-sage" /> 地圖經緯度
              </span>
              <span className="font-mono text-cocoa font-bold">
                {point.latitude.toFixed(5)}, {point.longitude.toFixed(5)}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-gray-400 font-bold">定位來源</span>
              <span className="bg-sage/10 text-sage-dark font-black px-1.5 py-0.5 rounded text-[10px]">
                {point.locationSource === 'manual_map' ? '手動地圖定位 (已鎖定)' : '手動設定'}
              </span>
            </div>
          </div>

          {/* Linked Schedule Item Preview */}
          {linkedScheduleItem ? (
            <div className="bg-beige/40 rounded-xl p-3.5 border-2 border-beige-dark space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-sage flex items-center gap-1">
                  <Calendar size={12} /> 關聯行程手帳
                </span>
                <span className="text-[10px] font-mono font-bold bg-white px-2 py-0.5 rounded text-cocoa border border-beige-dark flex items-center gap-1">
                  <Clock size={10} /> {linkedScheduleItem.time}
                </span>
              </div>
              <p className="text-xs font-black text-cocoa truncate">
                {linkedScheduleItem.title}
              </p>
              {linkedScheduleItem.location && (
                <p className="text-[11px] text-gray-400 truncate">
                  📍 {linkedScheduleItem.location}
                </p>
              )}
              {onJumpToSchedule && (
                <button
                  type="button"
                  onClick={handleViewSchedule}
                  className="w-full mt-1.5 py-2 bg-white hover:bg-sage hover:text-white text-sage font-black text-xs rounded-xl border border-sage/40 shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-98"
                >
                  <ArrowUpRight size={13} strokeWidth={2.5} />
                  前往行程手帳查看
                </button>
              )}
            </div>
          ) : (
            <div className="text-center py-2 text-[11px] text-gray-400 font-bold">
              此標記點為獨立地圖位置，未綁定行程項目
            </div>
          )}

          {/* Footer Actions in Edit Mode */}
          {isEditMode && (
            <div className="pt-2 border-t border-beige-dark/50 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleDelete}
                className="px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 text-xs font-black border border-red-200 flex items-center gap-1.5 transition-colors"
              >
                <Trash2 size={13} />
                刪除此點
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-cocoa text-xs font-bold transition-colors"
              >
                關閉
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
