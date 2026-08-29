import React from 'react';
import { X, ArrowUpDown, Clock, MapPin, ArrowUp, ArrowDown } from 'lucide-react';
import { ScheduleItem } from '../../types';

interface MoveItemConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  direction: 'up' | 'down';
  currentItem: ScheduleItem | null;
  targetItem: ScheduleItem | null;
}

export const MoveItemConfirmModal: React.FC<MoveItemConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  direction,
  currentItem,
  targetItem,
}) => {
  if (!isOpen || !currentItem || !targetItem) return null;

  const firstItem = direction === 'up' ? targetItem : currentItem;
  const secondItem = direction === 'up' ? currentItem : targetItem;

  return (
    <div 
      className="fixed inset-0 bg-cocoa/60 backdrop-blur-sm z-[70] flex flex-col items-center justify-end sm:justify-center sm:p-4 animate-fade-in" 
      onClick={onClose}
    >
      <div 
        className="bg-[#FAF8F2] w-full h-auto max-h-[92vh] sm:max-w-md sm:rounded-[2.5rem] rounded-t-[2.5rem] p-6 shadow-2xl border-0 sm:border-4 sm:border-beige-dark flex flex-col justify-between overflow-hidden" 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b-2 border-beige-dark flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-sage/20 border border-sage/40 flex items-center justify-center text-sage">
              <ArrowUpDown size={16} strokeWidth={2.5} />
            </div>
            <h3 className="text-xl font-black text-cocoa">確認調換順序</h3>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 bg-white rounded-full text-gray-400 hover:text-red-400 border border-beige-dark shadow-sm transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="py-5 space-y-4">
          <p className="text-xs text-gray-500 font-bold text-center leading-relaxed">
            確定要將此行程與相鄰行程的<span className="text-cocoa font-black">前後順序對調</span>嗎？
          </p>

          {/* Cards Comparison Container */}
          <div className="relative flex flex-col gap-2.5">
            {/* Current Item Card */}
            <div className="bg-white p-3.5 rounded-2xl border-2 border-sage shadow-hard-sm-sage relative">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-black text-sage bg-sage/10 px-2 py-0.5 rounded-md flex items-center gap-1 font-mono">
                  <Clock size={10} /> {currentItem.time || '未設定時間'}
                </span>
                <span className="text-[10px] font-black text-white bg-sage px-2 py-0.5 rounded-full uppercase tracking-wider">
                  目前選中（要往{direction === 'up' ? '上' : '下'}移）
                </span>
              </div>
              <h4 className="text-sm font-black text-cocoa truncate">{currentItem.title}</h4>
              {currentItem.location && (
                <p className="text-[11px] text-gray-400 font-bold truncate flex items-center gap-1 mt-0.5">
                  <MapPin size={10} className="text-sage flex-shrink-0" />
                  {currentItem.location}
                </p>
              )}
            </div>

            {/* Swap Indicator Icon */}
            <div className="flex justify-center -my-1 z-10">
              <div className="w-8 h-8 rounded-full bg-sage text-white flex items-center justify-center shadow-md border-2 border-white">
                {direction === 'up' ? (
                  <ArrowUp size={16} strokeWidth={3} />
                ) : (
                  <ArrowDown size={16} strokeWidth={3} />
                )}
              </div>
            </div>

            {/* Target Item Card */}
            <div className="bg-white/80 p-3.5 rounded-2xl border-2 border-beige-dark shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-black text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md flex items-center gap-1 font-mono">
                  <Clock size={10} /> {targetItem.time || '未設定時間'}
                </span>
                <span className="text-[10px] font-bold text-gray-400">
                  對調對象（原本在{direction === 'up' ? '上' : '下'}方）
                </span>
              </div>
              <h4 className="text-sm font-black text-cocoa/80 truncate">{targetItem.title}</h4>
              {targetItem.location && (
                <p className="text-[11px] text-gray-400 font-bold truncate flex items-center gap-1 mt-0.5">
                  <MapPin size={10} className="text-gray-300 flex-shrink-0" />
                  {targetItem.location}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-3 border-t-2 border-beige-dark flex-shrink-0">
          <button 
            type="button"
            onClick={onClose} 
            className="flex-1 py-3 bg-white text-cocoa font-black rounded-2xl border-2 border-beige-dark hover:bg-gray-50 active:scale-[0.98] transition-all shadow-sm text-sm"
          >
            取消
          </button>
          <button 
            type="button"
            onClick={onConfirm} 
            className="flex-1 py-3 bg-sage hover:bg-sage-dark text-white font-black rounded-2xl border-2 border-sage-dark active:scale-[0.98] transition-all shadow-hard-sm-sage text-sm flex items-center justify-center gap-1.5"
          >
            <ArrowUpDown size={15} strokeWidth={2.5} />
            確認調換
          </button>
        </div>
      </div>
    </div>
  );
};
