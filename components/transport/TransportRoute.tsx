import React from 'react';
import { Plane, ArrowRight } from 'lucide-react';
import { TransportSegmentModel, TransportType } from './types';
import { LocationNodeView } from './LocationNodeView';
import { TransferNode } from './TransferNode';

interface TransportRouteProps {
  segments: TransportSegmentModel[];
  primaryType?: TransportType;
  totalDuration?: string;
  className?: string;
}

export const TransportRoute: React.FC<TransportRouteProps> = ({
  segments,
  primaryType = 'flight',
  className = '',
}) => {
  if (!segments || segments.length === 0) {
    return null;
  }

  const firstSeg = segments[0];
  const lastSeg = segments[segments.length - 1];
  const departure = firstSeg.departure;
  const arrival = lastSeg.arrival;
  const hasTransfers = segments.length > 1 || Boolean(firstSeg.transferAfter);

  // 取得中間所有的轉乘點
  const transferNodes = segments
    .map(seg => seg.transferAfter)
    .filter((t): t is NonNullable<typeof t> => Boolean(t));

  return (
    <div className={`w-full py-2.5 px-0.5 ${className}`}>
      <div className="flex items-center justify-between gap-2 sm:gap-4 relative">
        {/* 起點 (出發) */}
        <div className="flex-1 min-w-0 max-w-[40%]">
          <LocationNodeView
            location={departure}
            align="left"
            role="departure"
            defaultTimeLabel={primaryType === 'flight' ? '出發·當地' : '發車時間'}
          />
        </div>

        {/* 中間路線示意與轉乘節點 */}
        <div className="flex-[1.2] flex flex-col items-center justify-center px-1 relative min-w-0">
          {hasTransfers ? (
            <div className="w-full flex items-center justify-center relative">
              {/* 背景連接貫穿線 */}
              <div className="absolute top-1/2 left-0 right-0 h-[1.5px] border-b-2 border-dashed border-[#DCD5C8] -translate-y-1/2 -z-0"></div>

              {/* 轉乘節點 (支援 1 或多個轉乘) */}
              <div className="flex items-center gap-1 sm:gap-2 z-10">
                {transferNodes.map((transfer, idx) => (
                  <TransferNode
                    key={idx}
                    transfer={transfer}
                    primaryType={primaryType}
                  />
                ))}
              </div>
            </div>
          ) : (
            /* 直飛 / 直達指示 */
            <div className="w-full flex flex-col items-center justify-center py-2">
              <div className="w-full flex items-center justify-center gap-1 relative">
                <div className="flex-1 h-[1.5px] border-b-2 border-dashed border-[#DCD5C8]"></div>
                <div className="w-6 h-6 rounded-full bg-[#F3EFE6] border border-[#E2DDD2] flex items-center justify-center text-[#786D5B] shadow-xs flex-shrink-0">
                  {primaryType === 'flight' ? (
                    <Plane size={12} className="transform rotate-45 text-[#355A44]" />
                  ) : (
                    <ArrowRight size={12} className="text-[#8B3A3A]" />
                  )}
                </div>
                <div className="flex-1 h-[1.5px] border-b-2 border-dashed border-[#DCD5C8]"></div>
              </div>

              <span className="text-[10px] font-black text-[#7A6F5C] mt-1 bg-[#F5F2EA] px-2 py-0.5 rounded-full border border-[#E5E0D4]">
                {primaryType === 'flight' ? '直飛' : '直達'}
              </span>
            </div>
          )}
        </div>

        {/* 終點 (抵達) */}
        <div className="flex-1 min-w-0 max-w-[40%]">
          <LocationNodeView
            location={arrival}
            align="right"
            role="arrival"
            defaultTimeLabel={primaryType === 'flight' ? '抵達·當地' : '抵達時間'}
          />
        </div>
      </div>
    </div>
  );
};
