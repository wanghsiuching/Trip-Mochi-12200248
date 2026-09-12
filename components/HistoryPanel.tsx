import React, { useEffect } from 'react';
import { HistoryRecord, HistoryEntityType } from '../src/features/history/types';
import { useHistoryUndo } from '../src/features/history/hooks/useHistoryUndo';
import { HistoryItem } from './HistoryItem';
import { X, History, AlertTriangle, RefreshCw, ShieldCheck } from 'lucide-react';

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  entityId: string;
  entityType: HistoryEntityType;
  entityTitle: string;
  getCurrentEntity: () => Promise<Record<string, any> | null>;
  onReverted: (reverted: Record<string, any>) => Promise<void>;
  currentUserName?: string;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  isOpen,
  onClose,
  tripId,
  entityId,
  entityType,
  entityTitle,
  getCurrentEntity,
  onReverted,
  currentUserName = '我',
}) => {
  const { historyList, loading, undoError, fetchHistory, undo, clearError } =
    useHistoryUndo(tripId);

  useEffect(() => {
    if (isOpen && entityId) {
      clearError();
      fetchHistory(entityId);
    }
  }, [isOpen, entityId, fetchHistory, clearError]);

  if (!isOpen) return null;

  const handleUndo = async (record: HistoryRecord): Promise<{ success: boolean; message?: string }> => {
    const res = await undo(
      record,
      getCurrentEntity,
      onReverted,
      currentUserName
    );
    if (res.success) {
      // Re-fetch history to sync
      fetchHistory(entityId);
    }
    return res;
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="bg-white border-3 border-sand rounded-3xl w-full max-w-lg max-h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-cream/80 border-b-2 border-sand flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sage/30 text-cocoa flex items-center justify-center border-2 border-white shadow-xs">
              <History size={20} className="text-cocoa" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-cocoa text-base sm:text-lg">視覺化修訂面板</h3>
                <span className="text-[11px] font-black text-cocoa/70 bg-sand/60 px-2.5 py-0.5 rounded-full truncate max-w-[150px]">
                  {entityTitle || '項目'}
                </span>
              </div>
              <p className="text-xs text-cocoa/70 font-bold mt-0.5 flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-sage-dark shrink-0" />
                <span>已啟用版本衝突防護（Concurrency Guard）</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl hover:bg-sand/40 text-cocoa/60 hover:text-cocoa transition-colors cursor-pointer"
            title="關閉"
          >
            <X size={20} />
          </button>
        </div>

        {/* Error Notification Banner - Concurrency Guard Conflict */}
        {undoError && (
          <div className="mx-4 mt-3 p-3.5 rounded-2xl bg-red-50 border-2 border-red-200 flex items-start gap-3 text-xs text-red-800 shadow-sm animate-shake">
            <AlertTriangle size={18} className="shrink-0 mt-0.5 text-red-600" />
            <div className="flex-1">
              <div className="font-black text-sm text-red-900">版本衝突防護（Concurrency Guard）</div>
              <div className="font-bold text-xs mt-1 text-red-700 leading-relaxed">
                {undoError}
              </div>
              <div className="text-[11px] text-red-600/80 mt-1">
                此項目已被其他最新操作更新，系統自動阻擋復原以防覆蓋衝突。
              </div>
            </div>
            <button
              onClick={clearError}
              className="text-xs font-black text-red-700 underline shrink-0 hover:text-red-900 cursor-pointer"
            >
              我知道了
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3.5">
          {loading ? (
            <div className="py-14 flex flex-col items-center justify-center text-cocoa/50 gap-2.5">
              <RefreshCw size={26} className="animate-spin text-sage" />
              <p className="text-xs font-bold text-cocoa/60">載入修訂歷史中...</p>
            </div>
          ) : historyList.length === 0 ? (
            <div className="py-14 text-center text-cocoa/50">
              <div className="w-14 h-14 rounded-full bg-sand/30 flex items-center justify-center mx-auto mb-2.5 text-cocoa/40">
                <History size={26} />
              </div>
              <p className="text-sm font-black text-cocoa/80">尚無修訂紀錄</p>
              <p className="text-xs text-cocoa/50 mt-1 max-w-xs mx-auto">
                此項目目前為初始建立版本，尚未產生任何變更。在每次編輯或移動後將自動記錄修訂前後差異。
              </p>
            </div>
          ) : (
            historyList.map((record) => (
              <HistoryItem
                key={record.id}
                record={record}
                onUndo={handleUndo}
              />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-cream/50 border-t-2 border-sand flex justify-between items-center text-xs text-cocoa/60 font-bold shrink-0">
          <span>共 {historyList.length} 筆歷史更動</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-cocoa text-white font-black text-xs hover:bg-cocoa/90 transition-colors cursor-pointer"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
};
