import React from 'react';
import { Plane, Clock } from 'lucide-react';
import { TransferInfo, TransportType } from './types';

interface TransferNodeProps {
  transfer: TransferInfo;
  primaryType?: TransportType;
}

export const TransferNode: React.FC<TransferNodeProps> = ({ transfer, primaryType = 'flight' }) => {
  const isFlight = primaryType === 'flight' || transfer.transferType === 'flight';
  const location = transfer.location;

  return (
    <div className="flex flex-col items-center justify-center flex-shrink-0 px-1 py-1 z-10">
      {/* 轉乘節點核心膠囊 */}
      <div className="bg-[#FAF4E6] border border-[#ECDDBF] text-[#704F18] rounded-xl px-2 sm:px-2.5 py-1 sm:py-1.5 shadow-xs flex flex-col items-center text-center max-w-[120px] sm:max-w-[140px] transition-all">
        {/* 轉乘地點代碼與名稱 */}
        <div className="flex items-center gap-1 font-mono font-black text-xs sm:text-[13px] text-[#5A3E0F]">
          {isFlight && <Plane size={11} className="text-[#8F651C] transform rotate-45 flex-shrink-0" />}
          <span>{location.code || location.name}</span>
        </div>

        {/* 城市名稱 */}
        {location.city && location.city !== location.code && (
          <span className="text-[10px] sm:text-[11px] font-bold text-[#7E5E26] truncate max-w-[100px]">
            {location.city}
          </span>
        )}

        {/* 停留/轉乘時長 */}
        {transfer.duration && (
          <div className="mt-0.5 flex items-center gap-0.5 text-[9px] sm:text-[10px] font-black text-[#96671A] bg-[#F2E5C7] px-1.5 py-0.2 rounded-full">
            <Clock size={9} />
            <span>{isFlight ? `轉機 ${transfer.duration}` : `轉乘 ${transfer.duration}`}</span>
          </div>
        )}
      </div>

      {/* 銜接資訊提示 (如果有下一段號碼) */}
      {transfer.nextServiceNumber && (
        <span className="text-[9px] font-mono font-black text-[#8B6E3C] mt-1 bg-white/80 px-1.5 py-0.2 rounded border border-[#ECDDBF]/60">
          接 {transfer.nextServiceNumber}
        </span>
      )}
    </div>
  );
};
