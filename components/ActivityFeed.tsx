import React, { useState } from 'react';
import { useActivityFeed } from '../src/features/activity/hooks/useActivityFeed';
import { ActivityEntityType, ActivityEvent } from '../src/features/activity/types';
import { 
  Calendar, 
  Plane, 
  Wallet, 
  Bookmark, 
  FileText, 
  BookOpen, 
  CheckSquare, 
  Users, 
  Compass, 
  Clock, 
  Activity, 
  Filter 
} from 'lucide-react';

interface ActivityFeedProps {
  tripId: string;
  onClose?: () => void;
  className?: string;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  tripId,
  onClose,
  className = '',
}) => {
  const { activities, loading } = useActivityFeed(tripId, 50);
  const [filterType, setFilterType] = useState<string>('all');

  const filteredActivities = activities.filter((act) => {
    if (filterType === 'all') return true;
    return act.entityType === filterType;
  });

  const getEntityIcon = (type: ActivityEntityType) => {
    switch (type) {
      case 'schedule':
        return <Calendar size={15} className="text-amber-700" />;
      case 'booking':
        return <Plane size={15} className="text-blue-700" />;
      case 'expense':
        return <Wallet size={15} className="text-emerald-700" />;
      case 'pocket':
        return <Bookmark size={15} className="text-pink-700" />;
      case 'document':
        return <FileText size={15} className="text-purple-700" />;
      case 'journal':
        return <BookOpen size={15} className="text-orange-700" />;
      case 'packing':
        return <CheckSquare size={15} className="text-teal-700" />;
      case 'member':
        return <Users size={15} className="text-indigo-700" />;
      default:
        return <Compass size={15} className="text-cocoa" />;
    }
  };

  const formatRelativeTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return '剛剛';
    if (mins < 60) return `${mins} 分鐘前`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} 小時前`;
    const days = Math.floor(hours / 24);
    if (days === 1) return '昨天';
    if (days < 7) return `${days} 天前`;
    return new Date(timestamp).toLocaleDateString('zh-TW', {
      month: 'numeric',
      day: 'numeric',
    });
  };

  return (
    <div className={`flex flex-col h-full bg-white ${className}`}>
      {/* Feed Filter Bar */}
      <div className="px-4 py-2.5 bg-cream/40 border-b border-sand flex items-center justify-between gap-2 overflow-x-auto shrink-0">
        <div className="flex items-center gap-1.5 shrink-0 text-xs font-bold text-cocoa/70">
          <Filter size={13} />
          <span>篩選：</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          {[
            { key: 'all', label: '全部' },
            { key: 'schedule', label: '行程' },
            { key: 'booking', label: '預訂' },
            { key: 'expense', label: '費用' },
            { key: 'pocket', label: '口袋' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilterType(tab.key)}
              className={`px-2.5 py-1 rounded-full font-bold transition-all ${
                filterType === tab.key
                  ? 'bg-cocoa text-white shadow-xs'
                  : 'bg-sand/30 hover:bg-sand/60 text-cocoa/70'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Activity Timeline List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="py-16 text-center text-cocoa/50 flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 rounded-full border-2 border-sage border-t-transparent animate-spin" />
            <span className="text-xs">載入旅程動態中...</span>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="py-16 text-center text-cocoa/40">
            <div className="w-12 h-12 rounded-full bg-sand/30 flex items-center justify-center mx-auto mb-2 text-cocoa/40">
              <Activity size={24} />
            </div>
            <p className="text-sm font-bold text-cocoa/70">尚無活動動態</p>
            <p className="text-xs mt-1 text-cocoa/40">
              團隊成員新增、編輯或移動項目時，紀錄將即時顯示在此
            </p>
          </div>
        ) : (
          filteredActivities.map((act) => (
            <div
              key={act.id}
              className="flex items-start gap-3 p-3 rounded-xl bg-cream/30 border border-sand/60 hover:bg-cream/60 transition-colors"
            >
              {/* Actor Avatar / Fruit */}
              <div className="relative shrink-0 mt-0.5">
                <div className="w-8 h-8 rounded-full bg-sage/30 border border-sage text-cocoa font-bold text-xs flex items-center justify-center shadow-xs">
                  {act.actorAvatar ? (
                    <img
                      src={act.actorAvatar}
                      alt={act.actorName}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span>{act.actorName ? act.actorName.slice(0, 1) : '友'}</span>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white border border-sand flex items-center justify-center shadow-xs">
                  {getEntityIcon(act.entityType)}
                </div>
              </div>

              {/* Action content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-bold text-cocoa truncate">
                    {act.actorName || '成員'}
                  </span>
                  <span className="text-[10px] text-cocoa/40 shrink-0 flex items-center gap-1 font-mono">
                    <Clock size={10} />
                    {formatRelativeTime(act.timestamp)}
                  </span>
                </div>
                <p className="text-xs text-cocoa/90 mt-0.5 font-medium leading-relaxed break-words">
                  {act.summary}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Info */}
      <div className="px-4 py-2.5 bg-cream/50 border-t border-sand flex items-center justify-between text-[11px] text-cocoa/50 shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span>即時動態連線中</span>
        </div>
        <span>顯示最近 {filteredActivities.length} 筆活動</span>
      </div>
    </div>
  );
};
