import React, { useState, useMemo } from 'react';
import { Share2, X, Copy, Check, Calendar, Globe, Sparkles, Send } from 'lucide-react';
import { ScheduleItem, TripDate } from '../../types';
import { formatTripAsText, executeShareOrCopy } from '../../utils/shareTrip';

interface ShareTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripName: string;
  dates: TripDate[];
  selectedDate: string;
  scheduleItems: ScheduleItem[];
}

export const ShareTripModal: React.FC<ShareTripModalProps> = ({
  isOpen,
  onClose,
  tripName,
  dates,
  selectedDate,
  scheduleItems,
}) => {
  const [scope, setScope] = useState<'day' | 'all'>('day');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const selectedDayObj = useMemo(() => {
    return dates.find(d => d.date === selectedDate) || dates[0];
  }, [dates, selectedDate]);

  const formattedText = useMemo(() => {
    return formatTripAsText({
      tripName,
      dates,
      scheduleItems,
      scope,
      selectedDate,
    });
  }, [tripName, dates, scheduleItems, scope, selectedDate]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleShare = async () => {
    const title = scope === 'day' 
      ? `${tripName} - ${selectedDayObj?.monthDay || ''} 行程`
      : `${tripName} - 全程行程`;

    const result = await executeShareOrCopy(formattedText, title);
    if (result === 'copied') {
      showToast('已複製到剪貼簿，可直接貼到 LINE！');
    } else {
      showToast('已開啟分享面板！');
    }
  };

  const handleCopyOnly = async () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(formattedText);
      showToast('已複製到剪貼簿！');
    }
  };

  return (
    <div className="fixed inset-0 bg-cocoa/60 backdrop-blur-sm z-[70] flex flex-col items-center justify-end sm:justify-center sm:p-4 animate-fade-in" onClick={onClose}>
      <div 
        className="bg-[#FAF8F2] w-full max-h-[92vh] sm:max-w-lg sm:rounded-[2.5rem] rounded-t-[2.5rem] p-5 sm:p-6 shadow-2xl border-0 sm:border-4 sm:border-beige-dark flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b-2 border-beige-dark flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-sage/20 text-sage flex items-center justify-center border border-sage/30">
              <Share2 size={18} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-lg font-black text-cocoa">分享行程</h3>
              <p className="text-[11px] font-bold text-gray-400">已排版為適合 LINE 聊天的純文字格式</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-white rounded-full text-gray-400 hover:text-red-400 border border-beige-dark shadow-sm transition-colors"
          >
            <X size={18}/>
          </button>
        </div>

        {/* Scope Selector Tabs */}
        <div className="flex gap-2 my-4 p-1.5 bg-white rounded-2xl border-2 border-beige-dark flex-shrink-0">
          <button
            type="button"
            onClick={() => setScope('day')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
              scope === 'day'
                ? 'bg-sage text-white shadow-hard-sm-sage'
                : 'text-gray-400 hover:text-cocoa'
            }`}
          >
            <Calendar size={14} />
            <span>分享今日 (Day {selectedDayObj?.dayNum || 1} · {selectedDayObj?.monthDay || ''})</span>
          </button>
          <button
            type="button"
            onClick={() => setScope('all')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
              scope === 'all'
                ? 'bg-sage text-white shadow-hard-sm-sage'
                : 'text-gray-400 hover:text-cocoa'
            }`}
          >
            <Globe size={14} />
            <span>分享全部 ({dates.length} 天)</span>
          </button>
        </div>

        {/* Text Preview Area */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <div className="flex justify-between items-center mb-1.5 px-1">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles size={11} className="text-sage" /> 文字預覽 (點擊即可分享或複製)
            </span>
            <span className="text-[10px] font-bold text-gray-400">
              {formattedText.split('\n').length} 行文字
            </span>
          </div>

          <div className="flex-1 overflow-y-auto custom-scroll bg-white p-4 rounded-2xl border-2 border-beige-dark font-mono text-xs text-cocoa leading-relaxed whitespace-pre-wrap select-text shadow-inner">
            {formattedText}
          </div>
        </div>

        {/* Toast alert */}
        {toastMessage && (
          <div className="mt-3 py-2 px-3 bg-sage text-white text-xs font-black rounded-xl text-center shadow-lg animate-bounce flex items-center justify-center gap-1.5">
            <Check size={14} /> {toastMessage}
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-4 border-t-2 border-beige-dark mt-3 flex gap-2.5 flex-shrink-0">
          <button
            type="button"
            onClick={handleCopyOnly}
            className="flex-1 py-3.5 bg-white text-cocoa font-black rounded-2xl border-2 border-beige-dark hover:bg-gray-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm text-sm"
          >
            <Copy size={16}/> 僅複製文字
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="flex-1 py-3.5 bg-sage hover:bg-sage-dark text-white font-black rounded-2xl border-2 border-sage-dark active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-hard-sm-sage text-sm"
          >
            <Send size={16}/> 分享 / 發送到 LINE
          </button>
        </div>
      </div>
    </div>
  );
};
