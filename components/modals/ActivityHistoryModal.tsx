import React, { useState, useMemo } from 'react';
import { 
  X, History, Filter, ChevronDown, ChevronUp, Clock, Plus, Edit3, Trash2, 
  RotateCcw, CheckCircle2, User, Calendar, MapPin, DollarSign, Tag, ArrowRight
} from 'lucide-react';
import { ActivityEvent, ActivityAction, ActivityEntityType, FieldChange } from '../../src/features/activity/types';
import { Member } from '../../types';
import { ActorAvatar } from '../MemberAvatar';

interface ActivityHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  activities: ActivityEvent[];
  members: Member[];
  loading?: boolean;
}

export const ActivityHistoryModal: React.FC<ActivityHistoryModalProps> = ({
  isOpen,
  onClose,
  activities,
  members,
  loading = false,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'schedule' | 'expense' | 'delete_restore' | 'member'>('all');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [expandedCardIds, setExpandedCardIds] = useState<Set<string>>(new Set());

  // Quick lookup for members
  const memberMap = useMemo(() => {
    const map = new Map<string, Member>();
    for (const m of members) {
      if (m.id) map.set(String(m.id), m);
    }
    return map;
  }, [members]);

  const toggleExpand = (id: string) => {
    setExpandedCardIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const filteredActivities = useMemo(() => {
    return activities.filter(act => {
      if (selectedFilter === 'schedule') {
        return act.entityType === 'schedule';
      }
      if (selectedFilter === 'expense') {
        return act.entityType === 'expense';
      }
      if (selectedFilter === 'delete_restore') {
        return act.action === 'delete' || act.action === 'restore';
      }
      if (selectedFilter === 'member') {
        if (!selectedMemberId) return true;
        return act.actorMemberId === selectedMemberId || act.actorId === selectedMemberId;
      }
      return true;
    });
  }, [activities, selectedFilter, selectedMemberId]);

  if (!isOpen) return null;

  const formatRelativeTime = (ts: number): string => {
    const now = Date.now();
    const diffSec = Math.max(0, Math.floor((now - ts) / 1000));
    if (diffSec < 60) return '剛剛';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} 分鐘前`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr} 小時前`;
    const diffDays = Math.floor(diffHr / 24);
    if (diffDays < 7) return `${diffDays} 天前`;
    return new Date(ts).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' });
  };

  const formatAbsoluteTime = (ts: number): string => {
    const date = new Date(ts);
    return date.toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionBadgeStyle = (action: ActivityAction) => {
    switch (action) {
      case 'create':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          cardBorder: 'border-l-4 border-l-emerald-500 border-emerald-100',
          icon: <Plus size={13} className="text-emerald-600" />,
          label: '新增',
        };
      case 'update':
        return {
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          cardBorder: 'border-l-4 border-l-blue-500 border-blue-100',
          icon: <Edit3 size={13} className="text-blue-600" />,
          label: '編輯',
        };
      case 'delete':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          cardBorder: 'border-l-4 border-l-rose-500 border-rose-100',
          icon: <Trash2 size={13} className="text-rose-600" />,
          label: '刪除',
        };
      case 'restore':
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          cardBorder: 'border-l-4 border-l-amber-500 border-amber-100',
          icon: <RotateCcw size={13} className="text-amber-600" />,
          label: '恢復',
        };
      default:
        return {
          bg: 'bg-gray-50 text-gray-700 border-gray-200',
          cardBorder: 'border-l-4 border-l-gray-400 border-gray-100',
          icon: <CheckCircle2 size={13} className="text-gray-500" />,
          label: '異動',
        };
    }
  };

  const getEntityLabel = (type: ActivityEntityType) => {
    switch (type) {
      case 'schedule': return '行程';
      case 'booking': return '預訂';
      case 'expense': return '記帳';
      case 'pocket': return '口袋';
      case 'journal': return '日記';
      case 'document': return '文件';
      case 'packing': return '行李清單';
      case 'member': return '成員';
      default: return '旅程';
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
            <div className="w-10 h-10 rounded-2xl bg-terracotta/10 text-terracotta flex items-center justify-center border-2 border-terracotta/20 shadow-sm">
              <History size={20} />
            </div>
            <div>
              <h2 className="text-base font-black text-cocoa">歷史紀錄・旅程時間軸</h2>
              <p className="text-[11px] text-gray-400 font-bold">誰在何時做了什麼，清晰可溯</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-sand/60 hover:bg-sand text-cocoa flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="px-4 py-3 bg-white/40 border-b border-sand/50 flex flex-wrap items-center gap-1.5 text-xs font-bold">
          <span className="text-[11px] text-gray-400 mr-1 flex items-center gap-1">
            <Filter size={12} /> 篩選:
          </span>
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-black transition-all cursor-pointer ${
              selectedFilter === 'all'
                ? 'bg-cocoa text-white shadow-sm'
                : 'bg-white border border-sand/80 text-gray-500 hover:bg-sand/30'
            }`}
          >
            全部
          </button>
          <button
            onClick={() => setSelectedFilter('schedule')}
            className={`px-3 py-1 rounded-full text-xs font-black transition-all cursor-pointer ${
              selectedFilter === 'schedule'
                ? 'bg-sage text-white shadow-sm'
                : 'bg-white border border-sand/80 text-gray-500 hover:bg-sand/30'
            }`}
          >
            只看行程
          </button>
          <button
            onClick={() => setSelectedFilter('expense')}
            className={`px-3 py-1 rounded-full text-xs font-black transition-all cursor-pointer ${
              selectedFilter === 'expense'
                ? 'bg-mustard text-cocoa shadow-sm'
                : 'bg-white border border-sand/80 text-gray-500 hover:bg-sand/30'
            }`}
          >
            只看記帳
          </button>
          <button
            onClick={() => setSelectedFilter('delete_restore')}
            className={`px-3 py-1 rounded-full text-xs font-black transition-all cursor-pointer ${
              selectedFilter === 'delete_restore'
                ? 'bg-terracotta text-white shadow-sm'
                : 'bg-white border border-sand/80 text-gray-500 hover:bg-sand/30'
            }`}
          >
            刪除／恢復
          </button>
          <button
            onClick={() => setSelectedFilter('member')}
            className={`px-3 py-1 rounded-full text-xs font-black transition-all cursor-pointer ${
              selectedFilter === 'member'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-white border border-sand/80 text-gray-500 hover:bg-sand/30'
            }`}
          >
            依成員
          </button>
        </div>

        {/* Member Select Dropdown if filter is member */}
        {selectedFilter === 'member' && (
          <div className="px-4 py-2 bg-amber-50/70 border-b border-amber-100 flex items-center gap-2">
            <span className="text-[11px] font-bold text-amber-800">選擇成員:</span>
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="bg-white border border-amber-200 rounded-lg px-2.5 py-1 text-xs font-bold text-cocoa outline-none shadow-sm"
            >
              <option value="">所有成員</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>
                  {m.fruit || '👤'} {m.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Timeline Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading && activities.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <div className="w-8 h-8 border-3 border-sage border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs font-bold">載入異動紀錄中...</p>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <History size={36} className="mx-auto mb-2 text-gray-300" />
              <p className="text-sm font-bold text-gray-400">目前尚無符合的異動紀錄</p>
              <p className="text-xs text-gray-400 mt-1">所有新增、修改、刪除都將自動即時顯示於此</p>
            </div>
          ) : (
            filteredActivities.map((act) => {
              const badge = getActionBadgeStyle(act.action);
              const isExpanded = expandedCardIds.has(act.id);
              const hasChanges = Array.isArray(act.changes) && act.changes.length > 0;
              const linkedMember = act.actorMemberId ? memberMap.get(act.actorMemberId) : null;

              return (
                <div 
                  key={act.id}
                  className={`bg-white rounded-2xl p-3.5 shadow-sm border ${badge.cardBorder} transition-all hover:shadow-md`}
                >
                  {/* Top Bar: Actor, Action badge, and relative time */}
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-sand/60 text-cocoa flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden border border-sand">
                        <ActorAvatar 
                          avatar={act.actorAvatar || linkedMember?.avatar || linkedMember?.fruit} 
                          className="w-full h-full object-cover"
                          fallback="👤"
                        />
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xs font-black text-cocoa">
                          {act.actorName}
                        </span>
                        {linkedMember ? (
                          <span className="text-[9px] px-1.5 py-0.2 bg-sage/20 text-sage-dark font-bold rounded-full">
                            成員
                          </span>
                        ) : (
                          <span className="text-[9px] px-1.5 py-0.2 bg-gray-100 text-gray-500 font-bold rounded-full">
                            操作者
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border flex items-center gap-1 ${badge.bg}`}>
                        {badge.icon}
                        {badge.label}・{getEntityLabel(act.entityType)}
                      </span>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="text-xs font-bold text-cocoa/90 pl-9 leading-relaxed">
                    {act.summary}
                  </div>

                  {/* Field changes preview if available */}
                  {hasChanges && (
                    <div className="mt-2 pl-9">
                      <button
                        type="button"
                        onClick={() => toggleExpand(act.id)}
                        className="text-[11px] font-black text-sage-dark hover:text-sage flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <span>{isExpanded ? '收合欄位變更' : `查看 ${act.changes!.length} 項欄位變更`}</span>
                        {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>

                      {isExpanded && (
                        <div className="mt-2 bg-[#FAF8F2] rounded-xl p-2.5 border border-sand/80 space-y-1.5 text-[11px]">
                          {act.changes!.map((ch: FieldChange, idx: number) => (
                            <div key={idx} className="flex items-start gap-1.5 text-gray-600">
                              <span className="font-bold text-cocoa shrink-0 min-w-[3.5rem]">
                                {ch.fieldLabel || ch.field}:
                              </span>
                              <span className="line-through text-rose-500/80 shrink-0">
                                {typeof ch.before === 'object' ? JSON.stringify(ch.before) : String(ch.before || '無')}
                              </span>
                              <ArrowRight size={10} className="mt-1 text-gray-400 shrink-0" />
                              <span className="font-bold text-emerald-600 shrink-0">
                                {typeof ch.after === 'object' ? JSON.stringify(ch.after) : String(ch.after || '無')}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Footer: Detailed Timestamps */}
                  <div className="mt-2 pl-9 flex items-center justify-between text-[10px] text-gray-400 font-semibold border-t border-gray-100 pt-1.5">
                    <span title={formatAbsoluteTime(act.timestamp)} className="flex items-center gap-1">
                      <Clock size={10} />
                      {formatRelativeTime(act.timestamp)}
                    </span>
                    <span className="text-[9px] text-gray-300">
                      {formatAbsoluteTime(act.timestamp)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-white/70 border-t border-sand/70 flex justify-between items-center text-xs">
          <div className="text-[11px] text-gray-400 font-bold">
            即時共編記錄・共 {filteredActivities.length} 筆
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
