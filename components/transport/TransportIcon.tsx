import React from 'react';
import { Plane, Train, Bus, Ship, Car, Footprints, CableCar, Navigation } from 'lucide-react';
import { TransportType } from './types';

interface TransportIconProps {
  type: TransportType;
  size?: number;
  className?: string;
}

export const getTransportMeta = (type: TransportType) => {
  switch (type) {
    case 'flight':
      return {
        label: '航班',
        color: '#2E5A44',      // 森林沉穩綠 / 深鼠尾草
        bgColor: 'bg-[#2E5A44]',
        bgLight: 'bg-[#EBF3EE]',
        textColor: 'text-[#2E5A44]',
        borderColor: 'border-[#2E5A44]',
        icon: Plane,
      };
    case 'train':
      return {
        label: '鐵路',
        color: '#8B3A3A',      // 沉穩酒紅/瑞士鐵道紅
        bgColor: 'bg-[#8B3A3A]',
        bgLight: 'bg-[#FDF2F2]',
        textColor: 'text-[#8B3A3A]',
        borderColor: 'border-[#8B3A3A]',
        icon: Train,
      };
    case 'bus':
      return {
        label: '巴士',
        color: '#3B6E8C',      // 湖水藍
        bgColor: 'bg-[#3B6E8C]',
        bgLight: 'bg-[#F0F7FA]',
        textColor: 'text-[#3B6E8C]',
        borderColor: 'border-[#3B6E8C]',
        icon: Bus,
      };
    case 'ferry':
      return {
        label: '渡輪',
        color: '#1E6B7B',      // 海洋青
        bgColor: 'bg-[#1E6B7B]',
        bgLight: 'bg-[#EBF7F9]',
        textColor: 'text-[#1E6B7B]',
        borderColor: 'border-[#1E6B7B]',
        icon: Ship,
      };
    case 'car':
      return {
        label: '自駕',
        color: '#5C5470',      // 沉穩紫灰
        bgColor: 'bg-[#5C5470]',
        bgLight: 'bg-[#F3F2F7]',
        textColor: 'text-[#5C5470]',
        borderColor: 'border-[#5C5470]',
        icon: Car,
      };
    case 'shuttle':
      return {
        label: '接駁',
        color: '#A06D3B',      // 暖琥珀
        bgColor: 'bg-[#A06D3B]',
        bgLight: 'bg-[#FAF3EB]',
        textColor: 'text-[#A06D3B]',
        borderColor: 'border-[#A06D3B]',
        icon: Navigation,
      };
    case 'cable_car':
      return {
        label: '纜車',
        color: '#9C5B3E',      // 赤陶土色
        bgColor: 'bg-[#9C5B3E]',
        bgLight: 'bg-[#FAF1EC]',
        textColor: 'text-[#9C5B3E]',
        borderColor: 'border-[#9C5B3E]',
        icon: CableCar,
      };
    case 'walk':
    default:
      return {
        label: '步行',
        color: '#5C6B5E',      // 溫和灰綠
        bgColor: 'bg-[#5C6B5E]',
        bgLight: 'bg-[#F1F4F1]',
        textColor: 'text-[#5C6B5E]',
        borderColor: 'border-[#5C6B5E]',
        icon: Footprints,
      };
  }
};

export const TransportIcon: React.FC<TransportIconProps> = ({ type, size = 18, className = '' }) => {
  const meta = getTransportMeta(type);
  const IconComponent = meta.icon;

  return (
    <div
      className={`w-9 h-9 rounded-full flex items-center justify-center shadow-xs flex-shrink-0 text-white ${meta.bgColor} ${className}`}
      title={meta.label}
    >
      <IconComponent size={size} strokeWidth={2.2} />
    </div>
  );
};
