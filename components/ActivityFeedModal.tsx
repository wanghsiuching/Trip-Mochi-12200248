import React from 'react';
import { ActivityFeed } from './ActivityFeed';
import { Activity, X } from 'lucide-react';

interface ActivityFeedModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
}

export const ActivityFeedModal: React.FC<ActivityFeedModalProps> = ({
  isOpen,
  onClose,
  tripId,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white border-2 border-sand rounded-2xl w-full max-w-lg h-[82vh] flex flex-col shadow-hard overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 bg-cream/70 border-b border-sand flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sage/30 text-cocoa flex items-center justify-center">
              <Activity size={18} />
            </div>
            <div>
              <h3 className="font-bold text-cocoa text-base">旅程活動紀錄</h3>
              <p className="text-[11px] text-cocoa/60">
                團隊成員的變更、新增與排程操作動態
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-sand/40 text-cocoa/60 hover:text-cocoa transition-colors"
            title="關閉"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-hidden">
          <ActivityFeed tripId={tripId} onClose={onClose} />
        </div>
      </div>
    </div>
  );
};
