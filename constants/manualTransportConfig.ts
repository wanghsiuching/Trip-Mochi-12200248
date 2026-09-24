import { ManualTransportType, MapPointType, ScheduleItem } from '../types';

export interface TransportVisualConfig {
  label: string;
  shortLabel: string;
  emoji: string;
  color: string;         // Polyline & icon main hex color
  secondaryColor?: string;
  dashArray?: string;    // Leaflet polyline stroke dash
  weight: number;        // Polyline stroke weight
  badgeBg: string;       // Tailwind bg class
  badgeText: string;     // Tailwind text class
  badgeBorder: string;   // Tailwind border class
  desc: string;
}

export const MANUAL_TRANSPORT_CONFIG: Record<ManualTransportType, TransportVisualConfig> = {
  WALK: {
    label: '步行',
    shortLabel: '步行',
    emoji: '🚶',
    color: '#78716C', // Stone 500
    dashArray: '5, 8',
    weight: 4,
    badgeBg: 'bg-stone-100',
    badgeText: 'text-stone-700',
    badgeBorder: 'border-stone-300',
    desc: '徒步或轉乘走道'
  },
  TRAIN: {
    label: '火車 / 鐵道',
    shortLabel: '火車',
    emoji: '🚆',
    color: '#2563EB', // Blue 600
    secondaryColor: '#93C5FD',
    dashArray: '12, 6',
    weight: 5,
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-800',
    badgeBorder: 'border-blue-300',
    desc: '城際鐵路、特急或新幹線'
  },
  SUBWAY: {
    label: '地鐵 / 捷運',
    shortLabel: '地鐵',
    emoji: '🚇',
    color: '#7C3AED', // Violet 600
    dashArray: '6, 6',
    weight: 5,
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-800',
    badgeBorder: 'border-purple-300',
    desc: '市區地下鐵或軌道快線'
  },
  BUS: {
    label: '公車 / 巴士',
    shortLabel: '公車',
    emoji: '🚌',
    color: '#059669', // Emerald 600
    dashArray: '12, 6',
    weight: 5,
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-800',
    badgeBorder: 'border-emerald-300',
    desc: '市區公車或長途客運'
  },
  TRAM: {
    label: '電車 / 輕軌',
    shortLabel: '電車',
    emoji: '🚋',
    color: '#D97706', // Amber 600
    dashArray: '8, 8',
    weight: 5,
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-800',
    badgeBorder: 'border-amber-300',
    desc: '路面電車、輕軌或纜車'
  },
  FERRY: {
    label: '渡輪 / 遊船',
    shortLabel: '渡輪',
    emoji: '🚢',
    color: '#0284C7', // Sky 600
    dashArray: '3, 8, 8, 8',
    weight: 5,
    badgeBg: 'bg-cyan-100',
    badgeText: 'text-cyan-800',
    badgeBorder: 'border-cyan-300',
    desc: '海上遊船或跨港渡輪'
  },
  TAXI: {
    label: '計程車',
    shortLabel: '計程車',
    emoji: '🚕',
    color: '#CA8A04', // Yellow 600
    weight: 5,
    badgeBg: 'bg-yellow-100',
    badgeText: 'text-yellow-800',
    badgeBorder: 'border-yellow-300',
    desc: '計程車或叫車專車'
  },
  CAR: {
    label: '汽車 / 自駕',
    shortLabel: '汽車',
    emoji: '🚗',
    color: '#EA580C', // Orange 600
    weight: 5,
    badgeBg: 'bg-orange-100',
    badgeText: 'text-orange-800',
    badgeBorder: 'border-orange-300',
    desc: '自駕駕車移動'
  },
  RENTAL_CAR: {
    label: '租車',
    shortLabel: '租車',
    emoji: '🚙',
    color: '#C026D3', // Fuchsia 600
    weight: 5,
    badgeBg: 'bg-fuchsia-100',
    badgeText: 'text-fuchsia-800',
    badgeBorder: 'border-fuchsia-300',
    desc: '租借車輛移動'
  },
  FLIGHT: {
    label: '飛機 / 航班',
    shortLabel: '航班',
    emoji: '✈️',
    color: '#0284C7', // Sky 600
    dashArray: '15, 10',
    weight: 4,
    badgeBg: 'bg-sky-100',
    badgeText: 'text-sky-800',
    badgeBorder: 'border-sky-300',
    desc: '國內或國際航線'
  },
  OTHER: {
    label: '其他交通',
    shortLabel: '其他',
    emoji: '📍',
    color: '#4B5563', // Gray 600
    dashArray: '10, 5',
    weight: 4,
    badgeBg: 'bg-gray-100',
    badgeText: 'text-gray-800',
    badgeBorder: 'border-gray-300',
    desc: '自訂或其他移動方式'
  }
};

export const POINT_TYPE_CONFIG: Record<MapPointType, {
  label: string;
  iconText: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}> = {
  PLACE: {
    label: '景點 / 餐廳',
    iconText: '📸',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    badgeBorder: 'border-emerald-200'
  },
  ACCOMMODATION: {
    label: '飯店 / 住宿',
    iconText: '🛏️',
    badgeBg: 'bg-indigo-50',
    badgeText: 'text-indigo-700',
    badgeBorder: 'border-indigo-200'
  },
  TRANSPORT_POINT: {
    label: '火車站 / 交通點',
    iconText: '🚉',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700',
    badgeBorder: 'border-blue-200'
  },
  FLIGHT_POINT: {
    label: '機場 / 航班點',
    iconText: '🛫',
    badgeBg: 'bg-sky-50',
    badgeText: 'text-sky-700',
    badgeBorder: 'border-sky-200'
  },
  CUSTOM_POINT: {
    label: '自訂標記點',
    iconText: '📍',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-700',
    badgeBorder: 'border-amber-200'
  }
};

/**
 * 依 ScheduleItem 屬性自動推導建議的交通類型
 */
export const guessTransportTypeFromSchedule = (item?: ScheduleItem): ManualTransportType => {
  if (!item) return 'WALK';

  if (item.type === 'flight') return 'FLIGHT';

  if (item.carRental?.hasRental) return 'RENTAL_CAR';

  if (item.transitDetails?.legs && item.transitDetails.legs.length > 0) {
    const legType = item.transitDetails.legs[0].transportType;
    switch (legType) {
      case 'train':
      case 'high_speed':
        return 'TRAIN';
      case 'bus':
        return 'BUS';
      case 'boat':
        return 'FERRY';
      case 'cable_car':
        return 'TRAM';
      case 'flight':
        return 'FLIGHT';
      case 'walk':
        return 'WALK';
      default:
        return 'TRAIN';
    }
  }

  const titleLower = (item.title + ' ' + item.location).toLowerCase();
  if (titleLower.includes('train') || titleLower.includes('火車') || titleLower.includes('鐵路') || titleLower.includes('新幹線') || titleLower.includes('hb') || titleLower.includes('station')) {
    return 'TRAIN';
  }
  if (titleLower.includes('subway') || titleLower.includes('地鐵') || titleLower.includes('捷運') || titleLower.includes('metro')) {
    return 'SUBWAY';
  }
  if (titleLower.includes('bus') || titleLower.includes('公車') || titleLower.includes('巴士')) {
    return 'BUS';
  }
  if (titleLower.includes('car') || titleLower.includes('租車') || titleLower.includes('自駕')) {
    return 'CAR';
  }
  if (titleLower.includes('ferry') || titleLower.includes('渡輪') || titleLower.includes('船')) {
    return 'FERRY';
  }
  if (titleLower.includes('walk') || titleLower.includes('步') || titleLower.includes('徒步')) {
    return 'WALK';
  }

  return 'WALK';
};

/**
 * 依 ScheduleItem 推導節點類型
 */
export const guessPointTypeFromSchedule = (item?: ScheduleItem): MapPointType => {
  if (!item) return 'CUSTOM_POINT';

  if (item.type === 'stay') return 'ACCOMMODATION';
  if (item.type === 'flight') return 'FLIGHT_POINT';
  if (item.type === 'transport') return 'TRANSPORT_POINT';
  if (item.type === 'spot' || item.type === 'food') return 'PLACE';

  return 'PLACE';
};
