import React, { useState } from 'react';
import { HistoryRecord } from '../src/features/history/types';
import { formatValueForDisplay } from '../src/features/history/diffHelper';
import { RotateCcw, Check, AlertCircle, Clock, User, ChevronDown, ChevronUp, History } from 'lucide-react';

interface HistoryItemProps {
  record: HistoryRecord;
  onUndo?: (record: HistoryRecord) => Promise<{ success: boolean; message?: string } | boolean>;
}

export const HistoryItem: React.FC<HistoryItemProps> = ({ record, onUndo }) => {
  const [isUndoing, setIsUndoing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  const formattedTime = new Date(record.timestamp).toLocaleString('zh-TW', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleUndoClick = async () => {
    if (!onUndo || isUndoing || record.isUndone) return;
    setIsUndoing(true);
    setActionError(null);
    try {
      const res = await onUndo(record);
      if (typeof res === 'object' && res !== null) {
        if (!res.success) {
          setActionError(res.message || '此資料已被其他成員更新，請重新確認。');
        }
      } else if (res === false) {
        setActionError('此資料已被其他成員更新，請重新確認。');
      }
    } catch (err: any) {
      setActionError(err?.message || '復原失敗');
    } finally {
      setIsUndoing(false);
    }
  };

  const getActionBadge = () => {
    switch (record.action) {
      case 'edit':
        return <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-sand/40 text-cocoa">編輯</span>;
      case 'move':
        return <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">移動</span>;
      case 'complete':
        return <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-800">完成</span>;
      case 'uncomplete':
        return <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">取消完成</span>;
      case 'soft_delete':
        return <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800">移至垃圾桶</span>;
      case 'restore':
        return <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">已還原</span>;
      default:
        return <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">更新</span>;
    }
  };

  return (
    <div className={`p-4 rounded-2xl border transition-all ${record.isUndone ? 'bg-gray-50/80 border-gray-200 opacity-70' : 'bg-white border-sand shadow-sm'}`}>
      {/* Header: Actor, Action badge & Timestamp */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-sage/30 border border-sage/40 text-cocoa flex items-center justify-center text-xs font-black shrink-0">
            {record.actorName ? record.actorName.slice(0, 1) : <User size={12} />}
          </div>
          <span className="text-xs font-black text-cocoa">{record.actorName || '成員'}</span>
          {getActionBadge()}
        </div>

        <div className="flex items-center gap-1 text-[11px] text-cocoa/50 font-mono">
          <Clock size={12} />
          <span>{formattedTime}</span>
        </div>
      </div>

      {/* Summary if present */}
      {record.summary && (
        <p className="text-xs text-cocoa/90 mb-2 font-bold leading-relaxed">
          {record.summary}
        </p>
      )}

      {/* Changed Fields (Diff) Collapsible Header */}
      {record.changedFields && record.changedFields.length > 0 && (
        <div className="my-2.5 pt-2 border-t border-sand/40">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between text-xs font-bold text-cocoa/60 hover:text-cocoa py-1 cursor-pointer transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <History size={12} className="text-sage" />
              <span>變更細項對比 ({record.changedFields.length} 項修改)</span>
            </span>
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {isExpanded && (
            <div className="space-y-2 mt-2">
              {record.changedFields.map((change, idx) => (
                <div key={idx} className="text-xs bg-cream/40 p-2.5 rounded-xl border border-sand/30">
                  <div className="font-bold text-cocoa/80 mb-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-sage" />
                    <span>{change.label}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                    <div className="flex items-start gap-1.5 bg-red-50/60 p-1.5 rounded-lg border border-red-100/70 text-cocoa">
                      <span className="text-[10px] font-black text-red-600 bg-red-100 px-1 py-0.5 rounded shrink-0">舊值</span>
                      <span className="line-through text-cocoa/60 font-mono break-all">
                        {formatValueForDisplay(change.field, change.before)}
                      </span>
                    </div>
                    <div className="flex items-start gap-1.5 bg-emerald-50/60 p-1.5 rounded-lg border border-emerald-100/70 text-cocoa">
                      <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-1 py-0.5 rounded shrink-0">新值</span>
                      <span className="font-bold text-emerald-900 font-mono break-all">
                        {formatValueForDisplay(change.field, change.after)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Error display - Version Conflict Guard warning */}
      {actionError && (
        <div className="flex items-start gap-2 mt-2 text-xs font-bold text-red-700 bg-red-50 border border-red-200 p-2.5 rounded-xl animate-shake">
          <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600" />
          <div className="flex-1">
            <div className="font-black">版本衝突防護通知</div>
            <div className="font-medium text-[11px] mt-0.5">{actionError}</div>
          </div>
        </div>
      )}

      {/* Undo Action Button */}
      {record.canUndo && (
        <div className="mt-3 flex justify-end">
          {record.isUndone ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-cocoa/40 bg-sand/30 px-3 py-1.5 rounded-xl">
              <Check size={14} />
              已復原此版本
            </span>
          ) : (
            <button
              onClick={handleUndoClick}
              disabled={isUndoing}
              className="inline-flex items-center gap-1.5 text-xs font-black text-cocoa bg-sage-light hover:bg-sage/40 px-3.5 py-2 rounded-xl border-2 border-sage/40 shadow-xs active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
              title="將資料復原至此歷史版本"
            >
              <RotateCcw size={14} className={`text-cocoa ${isUndoing ? 'animate-spin' : ''}`} />
              <span>{isUndoing ? '復原中...' : '復原至此版本'}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
