import React, { useEffect } from 'react';
import { RotateCcw, X, Trash2 } from 'lucide-react';

export interface UndoItem {
  id: string;
  title: string;
  onUndo: () => Promise<void> | void;
}

interface UndoToastProps {
  undoItem: UndoItem | null;
  onClose: () => void;
  durationMs?: number;
}

export const UndoToast: React.FC<UndoToastProps> = ({
  undoItem,
  onClose,
  durationMs = 6000,
}) => {
  useEffect(() => {
    if (!undoItem) return;
    const timer = setTimeout(() => {
      onClose();
    }, durationMs);
    return () => clearTimeout(timer);
  }, [undoItem, onClose, durationMs]);

  if (!undoItem) return null;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[90] w-[92%] max-w-sm animate-slide-up">
      <div className="bg-cocoa text-white px-4 py-3 rounded-2xl shadow-2xl border-2 border-white/20 flex items-center justify-between gap-3 backdrop-blur-md">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            <Trash2 size={14} className="text-rose-300" />
          </div>
          <span className="text-xs font-bold truncate">
            已刪除「<span className="text-sand">{undoItem.title}</span>」
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={async () => {
              await undoItem.onUndo();
              onClose();
            }}
            className="px-3 py-1.5 bg-sage hover:bg-sage-dark text-white rounded-xl text-xs font-black shadow-sm flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
          >
            <RotateCcw size={12} />
            <span>復原</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-1 text-white/50 hover:text-white transition-colors cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
