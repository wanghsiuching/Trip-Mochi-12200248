import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, Share, PlusSquare, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-sage-light text-sage border-2 border-sage/40 hover:border-sage text-xs font-black shadow-hard-sm transition-all active:scale-95 cursor-pointer flex-shrink-0"
      >
        <Download size={14} strokeWidth={2.5} />
        <span>安裝 App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-sage-light text-sage border-2 border-sage/40 hover:border-sage text-xs font-black shadow-hard-sm transition-all active:scale-95 cursor-pointer flex-shrink-0"
        >
          <Download size={14} strokeWidth={2.5} />
          <span>加入主畫面</span>
        </button>

        {showIOSGuide &&
          typeof document !== 'undefined' &&
          createPortal(
            <div
              className="fixed inset-0 z-[400] flex items-center justify-center bg-cocoa/60 backdrop-blur-sm p-4 animate-fade-in"
              onClick={() => setShowIOSGuide(false)}
            >
              <div
                className="w-full max-w-sm rounded-3xl bg-[#FAF8F2] p-5 border-4 border-beige-dark shadow-2xl space-y-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b-2 border-beige-dark pb-2.5">
                  <h3 className="text-base font-black text-cocoa">加入 iPhone / iPad 主畫面</h3>
                  <button
                    type="button"
                    onClick={() => setShowIOSGuide(false)}
                    className="p-1.5 rounded-full bg-white border border-beige-dark text-gray-400 hover:text-cocoa cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="space-y-2.5 text-xs font-bold text-cocoa">
                  <div className="flex items-center gap-2.5 bg-white p-3 rounded-2xl border border-beige-dark">
                    <span className="w-6 h-6 rounded-full bg-sage text-white font-black flex items-center justify-center flex-shrink-0">1</span>
                    <span className="flex items-center gap-1 flex-wrap">
                      點擊 Safari 下方工具列的 <Share size={14} className="inline text-blue-500 mx-0.5" /> <strong>分享</strong> 按鈕
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 bg-white p-3 rounded-2xl border border-beige-dark">
                    <span className="w-6 h-6 rounded-full bg-sage text-white font-black flex items-center justify-center flex-shrink-0">2</span>
                    <span className="flex items-center gap-1 flex-wrap">
                      往下滑動並選擇 <PlusSquare size={14} className="inline text-cocoa mx-0.5" /> <strong>加入主畫面</strong>
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="w-full py-2.5 rounded-2xl bg-sage text-white font-black text-xs shadow-sm hover:bg-sage-dark transition-colors cursor-pointer"
                >
                  我知道了
                </button>
              </div>
            </div>,
            document.body
          )}
      </>
    );
  }

  return null;
};
