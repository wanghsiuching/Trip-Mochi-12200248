import React from 'react';
import { AlertTriangle, RefreshCw, CheckCircle2, X } from 'lucide-react';

interface ConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemName: string;
  onViewLatest: () => void;
  onOverwrite: () => void;
}

export const ConflictModal: React.FC<ConflictModalProps> = ({
  isOpen,
  onClose,
  itemName,
  onViewLatest,
  onOverwrite,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-cocoa/60 backdrop-blur-sm z-[95] flex flex-col items-center justify-center p-4 animate-fade-in">
      <div 
        className="bg-[#FAF8F2] w-full max-w-sm rounded-[2rem] p-6 shadow-2xl border-4 border-orange-200 flex flex-col overflow-hidden text-center animate-scale-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-14 h-14 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border-2 border-orange-200 shadow-sm">
          <AlertTriangle size={28} strokeWidth={2.5} />
        </div>

        <h3 className="text-lg font-black text-cocoa">這筆資料已被其他旅伴更新</h3>
        <p className="text-xs text-gray-500 mt-2 leading-relaxed px-2">
          在您編輯「<span className="font-bold text-cocoa">{itemName || '此項目'}</span>」的同時，有其他旅伴儲存了新版本。
        </p>

        <div className="mt-5 space-y-2.5">
          <button
            type="button"
            onClick={onViewLatest}
            className="w-full py-3 px-4 bg-sage hover:bg-sage-dark text-white text-xs font-black rounded-xl shadow-hard-sm-sage flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            <RefreshCw size={15} />
            <span>放棄我的暫存，載入最新版本</span>
          </button>

          <button
            type="button"
            onClick={onOverwrite}
            className="w-full py-2.5 px-4 bg-white border-2 border-orange-200 hover:border-orange-300 text-orange-700 text-xs font-black rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            <CheckCircle2 size={15} />
            <span>強制覆蓋並保留我的修改</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 text-xs font-bold text-gray-400 hover:text-gray-600"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
};
