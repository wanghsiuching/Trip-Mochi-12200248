import React from 'react';
import { createPortal } from 'react-dom';
import { RefreshCw, Sparkles, X } from 'lucide-react';

interface PWAUpdateBannerProps {
  visible: boolean;
  isUpdating: boolean;
  onUpdate: () => void;
  onDismiss: () => void;
}

export const PWAUpdateBanner: React.FC<PWAUpdateBannerProps> = ({
  visible,
  isUpdating,
  onUpdate,
  onDismiss,
}) => {
  if (!visible || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed left-0 right-0 z-[500] flex justify-center px-3 pointer-events-none"
      style={{ top: 'max(0.75rem, env(safe-area-inset-top, 0px))' }}
    >
      <div className="pointer-events-auto w-full max-w-md bg-[#FFFDF7] border-2 border-sage rounded-2xl shadow-hard-sm px-3.5 py-2.5 flex items-center justify-between gap-2.5 animate-scale-in">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-sage-light border border-sage/30 text-sage flex items-center justify-center flex-shrink-0">
            <Sparkles size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-black text-cocoa leading-tight">
              發現新版本功能
            </p>
            <p className="text-[10px] sm:text-[11px] font-bold text-gray-500 leading-tight mt-0.5 truncate">
              點選立即更新，無須重開 App
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            type="button"
            onClick={onUpdate}
            disabled={isUpdating}
            className="px-3 py-1.5 rounded-xl bg-sage hover:bg-sage-dark text-white text-xs font-black border border-sage-dark shadow-xs flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-60 cursor-pointer whitespace-nowrap"
          >
            <RefreshCw size={13} className={isUpdating ? 'animate-spin' : ''} />
            <span>{isUpdating ? '更新中...' : '立即更新'}</span>
          </button>
          <button
            type="button"
            onClick={onDismiss}
            disabled={isUpdating}
            className="p-1.5 rounded-xl text-gray-400 hover:text-cocoa hover:bg-gray-100 transition-colors cursor-pointer"
            title="稍後再更新"
            aria-label="稍後再更新"
          >
            <X size={15} />
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
