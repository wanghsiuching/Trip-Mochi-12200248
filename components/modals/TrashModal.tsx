import React, { useState, useMemo } from 'react';
import { 
  X, Trash2, RotateCcw, AlertTriangle, Clock, Calendar, CheckCircle2, 
  MapPin, Plane, DollarSign, BookOpen, Layers, CheckSquare
} from 'lucide-react';
import { ScheduleItem, PocketItem, Journal, BookingFlight, BookingAccommodation, BookingCarRental, BookingTicket, Expense } from '../../types';
import { ActivityEntityType } from '../../src/features/activity/types';

export interface DeletedItemEntry {
  id: string;
  title: string;
  entityType: ActivityEntityType;
  deletedAt: number;
  deletedByName?: string;
  deletedBy?: string;
  originalItem: any;
}

interface TrashModalProps {
  isOpen: boolean;
  onClose: () => void;
  deletedItems: DeletedItemEntry[];
  onRestore: (item: DeletedItemEntry) => Promise<void>;
  onPermanentDelete?: (item: DeletedItemEntry) => Promise<void>;
}

export const TrashModal: React.FC<TrashModalProps> = ({
  isOpen,
  onClose,
  deletedItems,
  onRestore,
  onPermanentDelete,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'schedule' | 'booking' | 'expense' | 'pocket' | 'journal'>('all');
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    return deletedItems
      .filter(item => {
        if (selectedFilter === 'all') return true;
        return item.entityType === selectedFilter;
      })
      .sort((a, b) => b.deletedAt - a.deletedAt);
  }, [deletedItems, selectedFilter]);

  if (!isOpen) return null;

  const formatTime = (ts: number): string => {
    if (!ts) return '未知時間';
    const date = new Date(ts);
    return date.toLocaleString('zh-TW', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getItemIcon = (type: ActivityEntityType) => {
    switch (type) {
      case 'schedule': return <MapPin size={14} className="text-sage" />;
      case 'booking': return <Plane size={14} className="text-blue-500" />;
      case 'expense': return <DollarSign size={14} className="text-mustard" />;
      case 'pocket': return <MapPin size={14} className="text-orange-500" />;
      case 'journal': return <BookOpen size={14} className="text-purple-500" />;
      default: return <Layers size={14} className="text-gray-400" />;
    }
  };

  const getItemTypeLabel = (type: ActivityEntityType) => {
    switch (type) {
      case 'schedule': return '行程';
      case 'booking': return '預訂';
      case 'expense': return '記帳';
      case 'pocket': return '口袋';
      case 'journal': return '日記';
      default: return '項目';
    }
  };

  const handleRestoreClick = async (item: DeletedItemEntry) => {
    setRestoringId(item.id);
    try {
      await onRestore(item);
    } finally {
      setRestoringId(null);
    }
  };

  const handlePermanentDeleteClick = async (item: DeletedItemEntry) => {
    if (!window.confirm(`確定要永久刪除「${item.title}」嗎？此操作將無法再恢復！`)) {
      return;
    }
    setDeletingId(item.id);
    try {
      if (onPermanentDelete) {
        await onPermanentDelete(item);
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-cocoa/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div 
        className="bg-[#FAF8F2] w-full max-w-lg max-h-[90vh] rounded-[2.2rem] shadow-2xl border-4 border-sand flex flex-col overflow-hidden text-cocoa animate-scale-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 pb-3 border-b-2 border-sand/70 bg-white/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border-2 border-rose-200 shadow-sm">
              <Trash2 size={20} />
            </div>
            <div>
              <h2 className="text-base font-black text-cocoa">最近刪除・回收桶</h2>
              <p className="text-[11px] text-gray-400 font-bold">誤刪的行程、記帳、日記均可一鍵無損恢復</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-sand/60 hover:bg-sand text-cocoa flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Filters */}
        <div className="px-4 py-2.5 bg-white/40 border-b border-sand/50 flex flex-wrap gap-1.5 text-xs font-bold">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-black transition-all cursor-pointer ${
              selectedFilter === 'all'
                ? 'bg-cocoa text-white shadow-sm'
                : 'bg-white border border-sand/80 text-gray-500 hover:bg-sand/30'
            }`}
          >
            全部 ({deletedItems.length})
          </button>
          <button
            onClick={() => setSelectedFilter('schedule')}
            className={`px-3 py-1 rounded-full text-xs font-black transition-all cursor-pointer ${
              selectedFilter === 'schedule'
                ? 'bg-sage text-white shadow-sm'
                : 'bg-white border border-sand/80 text-gray-500 hover:bg-sand/30'
            }`}
          >
            行程
          </button>
          <button
            onClick={() => setSelectedFilter('booking')}
            className={`px-3 py-1 rounded-full text-xs font-black transition-all cursor-pointer ${
              selectedFilter === 'booking'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white border border-sand/80 text-gray-500 hover:bg-sand/30'
            }`}
          >
            預訂
          </button>
          <button
            onClick={() => setSelectedFilter('expense')}
            className={`px-3 py-1 rounded-full text-xs font-black transition-all cursor-pointer ${
              selectedFilter === 'expense'
                ? 'bg-mustard text-cocoa shadow-sm'
                : 'bg-white border border-sand/80 text-gray-500 hover:bg-sand/30'
            }`}
          >
            記帳
          </button>
          <button
            onClick={() => setSelectedFilter('pocket')}
            className={`px-3 py-1 rounded-full text-xs font-black transition-all cursor-pointer ${
              selectedFilter === 'pocket'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'bg-white border border-sand/80 text-gray-500 hover:bg-sand/30'
            }`}
          >
            口袋
          </button>
          <button
            onClick={() => setSelectedFilter('journal')}
            className={`px-3 py-1 rounded-full text-xs font-black transition-all cursor-pointer ${
              selectedFilter === 'journal'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-white border border-sand/80 text-gray-500 hover:bg-sand/30'
            }`}
          >
            日記
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filteredItems.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <CheckCircle2 size={36} className="mx-auto mb-2 text-emerald-500/60" />
              <p className="text-sm font-bold text-gray-500">回收桶是空的</p>
              <p className="text-xs text-gray-400 mt-1">目前沒有被刪除的項目</p>
            </div>
          ) : (
            filteredItems.map(item => (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-3.5 shadow-sm border border-sand flex items-center justify-between gap-3 hover:border-sand-dark transition-all"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-sand/50 flex items-center justify-center shrink-0 mt-0.5">
                    {getItemIcon(item.entityType)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] px-1.5 py-0.2 bg-gray-100 text-gray-600 font-bold rounded">
                        {getItemTypeLabel(item.entityType)}
                      </span>
                      <h4 className="text-xs font-black text-cocoa truncate">
                        {item.title || '未命名項目'}
                      </h4>
                    </div>
                    <div className="text-[10px] text-gray-400 font-bold mt-1 flex items-center gap-2">
                      <span>刪除者: {item.deletedByName || '未知使用者'}</span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5">
                        <Clock size={10} />
                        {formatTime(item.deletedAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleRestoreClick(item)}
                    disabled={restoringId === item.id}
                    className="px-3 py-1.5 bg-sage hover:bg-sage-dark text-white rounded-xl text-xs font-black shadow-hard-sm-sage flex items-center gap-1 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    <RotateCcw size={12} />
                    <span>{restoringId === item.id ? '恢復中...' : '恢復'}</span>
                  </button>

                  {onPermanentDelete && (
                    <button
                      type="button"
                      onClick={() => handlePermanentDeleteClick(item)}
                      disabled={deletingId === item.id}
                      className="p-1.5 text-gray-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                      title="永久刪除"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-white/70 border-t border-sand/70 flex justify-between items-center text-xs">
          <div className="text-[11px] text-gray-400 font-bold">
            共 {filteredItems.length} 項已刪除內容
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-cocoa text-white font-black rounded-xl hover:bg-cocoa/90 transition-all active:scale-95 cursor-pointer shadow-sm"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
};
