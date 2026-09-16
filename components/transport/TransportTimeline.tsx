import React from 'react';
import { Clock, ArrowDown, MapPin, CheckCircle2 } from 'lucide-react';
import { TravelTimelineItem, TransportItemModel } from './types';
import { TransportIcon } from './TransportIcon';

interface TransportTimelineProps {
  items: TravelTimelineItem[];
  currentDate?: string;
  onSelectTransport?: (item: TransportItemModel) => void;
  className?: string;
}

export const TransportTimeline: React.FC<TransportTimelineProps> = ({
  items,
  currentDate,
  onSelectTransport,
  className = '',
}) => {
  if (!items || items.length === 0) {
    return (
      <div className="py-8 text-center text-[#9C9180] text-sm bg-white rounded-3xl border border-[#E8E3D8]">
        目前沒有安排交通時間軸
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {currentDate && (
        <div className="flex items-center gap-2 px-1">
          <span className="w-2.5 h-2.5 rounded-full bg-[#2E5A44]"></span>
          <span className="text-sm font-black text-[#2D2A26] font-mono">{currentDate} 移動時間軸</span>
        </div>
      )}

      <div className="relative pl-6 space-y-4">
        {/* 時間軸貫穿豎線 */}
        <div className="absolute left-[15px] top-3 bottom-3 w-[2px] bg-[#E5DFD4] rounded-full -z-0"></div>

        {items.map((item, idx) => {
          const isNow = item.status === 'now';
          const isNext = item.status === 'next';
          const isCompleted = item.status === 'completed';

          return (
            <div key={item.id || idx} className="relative group">
              {/* 節點圓標 */}
              <div className="absolute -left-6 top-3 w-7 h-7 rounded-full flex items-center justify-center z-10">
                {isCompleted ? (
                  <div className="w-6 h-6 rounded-full bg-[#EBF3EE] border-2 border-[#2E5A44] flex items-center justify-center text-[#2E5A44]">
                    <CheckCircle2 size={13} />
                  </div>
                ) : isNow ? (
                  <div className="w-7 h-7 rounded-full bg-[#2E5A44] border-2 border-white shadow-md flex items-center justify-center text-white animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-white"></span>
                  </div>
                ) : isNext ? (
                  <div className="w-6 h-6 rounded-full bg-[#FAF4E6] border-2 border-[#C49A45] flex items-center justify-center text-[#8C651A]">
                    <span className="w-2 h-2 rounded-full bg-[#C49A45]"></span>
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full bg-white border-2 border-[#D5CDBD]"></div>
                )}
              </div>

              {/* 內容卡片 */}
              <div
                className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                  isNow
                    ? 'bg-[#F4F8F5] border-[#B7D8C4] shadow-sm'
                    : isNext
                    ? 'bg-[#FFFDF7] border-[#EEDFBE] shadow-xs'
                    : 'bg-white border-[#EAE4D9]'
                }`}
              >
                {/* 頂部狀態標籤列 */}
                <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs sm:text-sm font-black text-[#1F1C18]">
                      {item.time} {item.endTime ? `— ${item.endTime}` : ''}
                    </span>

                    {/* NOW / NEXT / LATER 狀態膠囊 */}
                    {isNow && (
                      <span className="text-[10px] font-black bg-[#2E5A44] text-white px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                        進行中 {item.remainingMinutes !== undefined ? `(剩 ${item.remainingMinutes} 分鐘)` : ''}
                      </span>
                    )}

                    {isNext && (
                      <span className="text-[10px] font-black bg-[#FAF0D9] text-[#855D16] border border-[#E5CE9F] px-2 py-0.5 rounded-full">
                        下一班 {item.startsInMinutes !== undefined ? `(${item.startsInMinutes} 分鐘後)` : ''}
                      </span>
                    )}
                  </div>

                  {item.transportItem && (
                    <button
                      type="button"
                      onClick={() => onSelectTransport && onSelectTransport(item.transportItem!)}
                      className="text-[11px] font-black text-[#2E5A44] hover:underline"
                    >
                      查看卡片
                    </button>
                  )}
                </div>

                {/* 標題與交通類型 */}
                <div className="flex items-center gap-2">
                  {typeof item.type === 'string' && item.type !== 'stay' && item.type !== 'spot' && (
                    <TransportIcon type={item.type} size={15} className="w-6 h-6" />
                  )}
                  <h4 className="text-sm font-black text-[#2D2A26]">{item.title}</h4>
                </div>

                {/* 備註或詳細說明 */}
                {item.note && (
                  <p className="mt-1.5 text-xs text-[#7A7162] leading-relaxed">
                    {item.note}
                  </p>
                )}
              </div>

              {/* 轉折間隙向下箭頭指示 */}
              {idx < items.length - 1 && (
                <div className="pl-4 py-1 text-[#C7BFB0] flex items-center gap-1 text-[10px]">
                  <ArrowDown size={11} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
