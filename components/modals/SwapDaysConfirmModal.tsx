import React from 'react';
import { X, ArrowLeftRight, Calendar } from 'lucide-react';
import { TripDay, ScheduleItem } from '../../types';

interface SwapDaysConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  fromIndex: number | null;
  toIndex: number | null;
  tripDays: TripDay[];
  scheduleItems: ScheduleItem[];
  dates: { dayNum: number; date: string; monthDay: string; weekday: string }[];
}

export const SwapDaysConfirmModal: React.FC<SwapDaysConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  fromIndex,
  toIndex,
  tripDays,
  scheduleItems,
  dates,
}) => {
  if (!isOpen || fromIndex === null || toIndex === null) return null;

  const day1 = tripDays[fromIndex];
  const day2 = tripDays[toIndex];
  const dateInfo1 = dates[fromIndex];
  const dateInfo2 = dates[toIndex];

  if (!day1 || !day2 || !dateInfo1 || !dateInfo2) return null;

  const items1Count = scheduleItems.filter(item => item.date === day1.date).length;
  const items2Count = scheduleItems.filter(item => item.date === day2.date).length;

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
            <div className="w-8 h-8 rounded-full bg-orange-100 border border-orange-300 flex items-center justify-center text-orange-500">
              <ArrowLeftRight size={16} strokeWidth={2.5} />
            </div>
            <h3 className="text-xl font-black text-cocoa">確認對調日期</h3>
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
            確定要將以下兩天的<span className="text-cocoa font-black">地點與所有行程內容</span>互相對調嗎？
          </p>

          {/* Cards Comparison Container */}
          <div className="relative flex flex-col gap-2.5">
            {/* Day 1 Card */}
            <div className="bg-white p-4 rounded-2xl border-2 border-orange-200 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-1.5">
                <span className="bg-orange-400 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-xs">
                  Day {dateInfo1.dayNum}
                </span>
                <span className="text-xs font-black text-cocoa flex items-center gap-1">
                  <Calendar size={13} className="text-orange-400" />
                  {dateInfo1.monthDay} ({dateInfo1.weekday})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="font-black text-cocoa text-sm truncate max-w-[200px]">
                  {day1.fruit || '📍'} {day1.location || '未設定地點'}
                </div>
                <div className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-lg border border-gray-100">
                  {items1Count} 個行程
                </div>
              </div>
            </div>

            {/* Swap Icon Badge in between */}
            <div className="flex justify-center -my-2 z-10">
              <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-md border-2 border-[#FAF8F2] animate-bounce">
                <ArrowLeftRight size={14} strokeWidth={2.8} />
              </div>
            </div>

            {/* Day 2 Card */}
            <div className="bg-white p-4 rounded-2xl border-2 border-sage shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-1.5">
                <span className="bg-sage text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-xs">
                  Day {dateInfo2.dayNum}
                </span>
                <span className="text-xs font-black text-cocoa flex items-center gap-1">
                  <Calendar size={13} className="text-sage" />
                  {dateInfo2.monthDay} ({dateInfo2.weekday})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="font-black text-cocoa text-sm truncate max-w-[200px]">
                  {day2.fruit || '📍'} {day2.location || '未設定地點'}
                </div>
                <div className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-lg border border-gray-100">
                  {items2Count} 個行程
                </div>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-200/70 rounded-xl p-3 text-[11px] font-bold text-orange-700 leading-normal">
            💡 提示：對調後，兩天內的所有行程項目與地點將交換，原本的日期標籤與順序不受影響。
          </div>
        </div>

        {/* Actions Footer */}
        <div className="flex gap-3 pt-3 border-t-2 border-beige-dark mt-auto flex-shrink-0">
          <button 
            onClick={onClose} 
            className="flex-1 py-3.5 rounded-2xl font-bold text-gray-400 bg-white border-2 border-beige-dark hover:bg-gray-50 transition-colors text-sm"
          >
            取消
          </button>
          <button 
            onClick={onConfirm} 
            className="flex-1 py-3.5 rounded-2xl font-black text-white bg-orange-400 hover:bg-orange-500 shadow-hard-sm border-2 border-orange-500 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-1.5 text-sm"
          >
            <ArrowLeftRight size={15} strokeWidth={3} />
            確認對調
          </button>
        </div>
      </div>
    </div>
  );
};
