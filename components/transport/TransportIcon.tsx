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
        categoryName: '航班',
        defaultOperator: '民航航班',
        emoji: '✈️',
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
        categoryName: '列車',
        defaultOperator: '鐵路運輸',
        emoji: '🚆',
        color: '#8B3A3A',      // 沉穩酒紅/瑞士鐵道紅
        bgColor: 'bg-[#8B3A3A]',
        bgLight: 'bg-[#FDF2F2]',
        textColor: 'text-[#8B3A3A]',
        borderColor: 'border-[#8B3A3A]',
        icon: Train,
      };
    case 'high_speed':
      return {
        label: '高鐵',
        categoryName: '高鐵',
        defaultOperator: '高速鐵路',
        emoji: '🚄',
        color: '#4338CA',      // 靛藍
        bgColor: 'bg-[#4338CA]',
        bgLight: 'bg-[#EEF2FF]',
        textColor: 'text-[#4338CA]',
        borderColor: 'border-[#4338CA]',
        icon: Train,
      };
    case 'subway':
      return {
        label: '地鐵',
        categoryName: '地鐵',
        defaultOperator: '捷運地鐵',
        emoji: '🚇',
        color: '#1D4ED8',      // 藍
        bgColor: 'bg-[#1D4ED8]',
        bgLight: 'bg-[#EFF6FF]',
        textColor: 'text-[#1D4ED8]',
        borderColor: 'border-[#1D4ED8]',
        icon: Train,
      };
    case 'bus':
      return {
        label: '巴士',
        categoryName: '巴士',
        defaultOperator: '公路巴士',
        emoji: '🚌',
        color: '#2B6E6A',      // 綠翡翠/湖水深青
        bgColor: 'bg-[#2B6E6A]',
        bgLight: 'bg-[#EFF9F7]',
        textColor: 'text-[#2B6E6A]',
        borderColor: 'border-[#2B6E6A]',
        icon: Bus,
      };
    case 'ferry':
    case 'boat':
      return {
        label: '渡輪',
        categoryName: '渡輪',
        defaultOperator: '水上渡輪',
        emoji: '🚢',
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
        categoryName: '自駕',
        defaultOperator: '租車自駕',
        emoji: '🚗',
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
        categoryName: '接駁',
        defaultOperator: '接駁專車',
        emoji: '🚐',
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
        categoryName: '纜車',
        defaultOperator: '登山纜車',
        emoji: '🚡',
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
        categoryName: '步行',
        defaultOperator: '徒步健行',
        emoji: '🚶',
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
