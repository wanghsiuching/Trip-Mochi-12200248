import { ImageAssetReference } from '../../shared/types/image';
import { VersionedEntity } from '../../shared/types/schema';

export type ItemType = 'spot' | 'food' | 'transport' | 'stay' | 'flight';

export type UniversalTransportType = 
  | 'train'         // 火車/新幹線/地鐵
  | 'high_speed'    // 高鐵
  | 'cable_car'     // 纜車/登山鐵道
  | 'boat'          // 遊船/渡輪
  | 'bus'           // 長途巴士/公車
  | 'flight'        // 國內航班
  | 'walk';         // 步行/轉乘

export type TransitPassType = 
  | 'pass_free'        // 類 STP / JR Pass
  | 'pass_discount'    // 半價卡 / 折扣卡
  | 'ic_card'          // Suica / 儲值卡
  | 'point_to_point'   // 單程票
  | 'none';

export interface TransitLeg {
  id: string;
  fromStation: string;
  toStation: string;
  departureTime: string;
  arrivalTime: string;
  serviceNumber?: string;
  transportType: UniversalTransportType;
  platform?: string;
}

export interface TransitExtraFeeItem {
  id: string;
  name: string;
  amount: number | string;
  currency: string;
  hasServiceFee?: boolean;
  serviceFeePercentage?: number | string;
  serviceFee?: number;
}

export interface TransitFareDetails {
  passUsed?: TransitPassType;
  originalPrice?: number | string;
  discountedPrice?: number | string;
  currency: string;
  hasServiceFee?: boolean;
  serviceFeePercentage?: number | string;
  serviceFee?: number;
  extraFees?: TransitExtraFeeItem[];
  extraFeeName?: string;
  seatReservationFee?: number | string;
  seatReservationFeeCurrency?: string;
  notes?: string;
}

export interface FlightDetails {
  airline?: string;
  flightCode?: string;
  departureDate?: string;
  departureTime?: string;
  arrivalDate?: string;
  arrivalTime?: string;
  departureAirport?: string;
  arrivalAirport?: string;
  hasTransit?: boolean;
  transitAirport?: string;
  transitCity?: string;
  transitDuration?: string;
  transitFlightCode?: string;
  cost?: number;
  currency?: string;
  participants?: string[];
  isPotential?: boolean;
}

export interface StayDetails {
  checkInDate?: string;
  checkInTime?: string;
  checkOutDate?: string;
  checkOutTime?: string;
  cost?: number;
  currency?: string;
  participants?: string[];
  isPotential?: boolean;
}

export interface SpotDetails {
  hasTicket: boolean;
  ticketCost?: number;
  currency?: string;
  participants?: string[];
  isPotential?: boolean;
}

export interface ScheduleItemV2 extends VersionedEntity {
  id: string;
  order?: number;
  date: string;
  time: string;
  title: string;
  type: ItemType;
  location: string;
  gps?: { lat: string; lng: string };
  notes?: string;
  checkIn?: string;
  checkOut?: string;
  meals?: { breakfast: boolean; dinner: boolean };
  carRental?: any;
  transitDetails?: {
    legs: TransitLeg[];
    fare: TransitFareDetails;
    isPotential?: boolean;
    participants?: string[];
  };
  stayDetails?: StayDetails;
  flightDetails?: FlightDetails;
  spotDetails?: SpotDetails;
  address?: string;
  googleMapUrl?: string;
  naverMapUrl?: string;
  note?: string;
  imageReferences?: ImageAssetReference[];
  images?: string[]; // Backwards compatibility for UI
  photoPlacement?: 'top' | 'middle' | 'bottom';
  photoOffsetY?: number;
  deletedAt?: number | null;
  deletedBy?: string | null;
}

export type ScheduleItem = ScheduleItemV2;
