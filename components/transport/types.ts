import { BookingFlight, BookingCarRental, TransitLeg, TransitFareDetails } from '../../types';

export type TransportType =
  | 'flight'       // 航班 (國際/國內)
  | 'train'        // 火車 / 鐵道 / 高鐵
  | 'bus'          // 長途巴士 / 市區公車
  | 'ferry'        // 渡輪 / 遊船
  | 'car'          // 租車 / 自駕
  | 'shuttle'      // 接駁車 / 機場專車
  | 'walk'         // 步行 / 徒步轉乘
  | 'cable_car';   // 纜車 / 登山鐵道

/**
 * 地點節點 (LocationNode)
 * 通用支援：Airport, Station, Bus Stop, Port, Rental Location, Hotel, Meeting Point
 */
export interface LocationNode {
  name: string;             // 主要名稱 (例如: "桃園", "蘇黎世", "Kandersteg", "Paris Gare de Lyon")
  code?: string;            // 代碼 (例如: "TPE", "ZRH", "KAN", "CDG")
  city?: string;            // 城市名稱 (例如: "台北", "蘇黎世", "巴黎")
  subName?: string;         // 次要/站名全稱 (例如: "Paris Gare de Lyon", "第2航廈")
  terminal?: string;        // 航廈 (例如: "T2", "第一航廈")
  gate?: string;            // 登機門 (例如: "B7")
  platform?: string;        // 月台/軌道 (例如: "Track 3", "2B 月台")
  address?: string;         // 詳細地址
  latitude?: number | string;
  longitude?: number | string;
  time?: string;            // 時間 (例如: "17:40")
  date?: string;            // 日期 (例如: "2026-10-19")
  timeZoneLabel?: string;   // 時區標註 (例如: "台灣時間", "當地時間")
}

/**
 * 轉機 / 轉乘節點資訊 (TransferInfo)
 */
export interface TransferInfo {
  location: LocationNode;       // 轉機/轉乘地點 (例如: AUH 阿布達比, Bern 伯恩)
  duration?: string;            // 停留/轉乘時間 (例如: "1h 20m", "18m")
  nextServiceNumber?: string;   // 銜接代碼 (例如: "EY143", "IC 6")
  nextOperator?: string;        // 銜接營運商 (例如: "阿提哈德航空", "SBB")
  nextTransportType?: TransportType;
  transferType?: 'flight' | 'train' | 'bus' | 'mixed';
  note?: string;                // 備註 (例如: "行李直掛蘇黎世", "需更換第 4 月台")
  terminalChange?: boolean;     // 是否需要更換航廈
}

/**
 * 交通分段模型 (TransportSegmentModel)
 * 一次 Journey 或多段交通中的單一子區段
 */
export interface TransportSegmentModel {
  id: string;
  type: TransportType;
  operator?: string;         // 營運商主要名稱 (例如: "阿提哈德航空", "長榮航空", "SNCF", "SBB")
  operatorSub?: string;      // 營運商次要/英文名稱 (例如: "Etihad Airways", "EVA Air")
  serviceNumber?: string;    // 班次識別碼 LEVEL 1 (例如: "EY899", "BR87", "TGV 9576", "IC 8", "Bus 12")
  duration?: string;         // 區間時間 (例如: "8h 40m", "3h 12m")
  departure: LocationNode;
  arrival: LocationNode;
  transferAfter?: TransferInfo; // 到達後的轉乘資訊 (如果有下一段)
  
  // LEVEL 5 細節資訊 (專屬欄位)
  details?: {
    seat?: string;           // 座位 (例如: "24A", "2nd Class", "Car 3, Seat 42")
    carriage?: string;       // 車廂 (例如: "Car 4")
    classType?: string;      // 艙等/席別 (例如: "經濟艙", "頭等艙", "指定席", "2nd Class")
    bookingReference?: string;// 訂位代號 / PNR (例如: "P7WX9K")
    baggage?: {
      checked?: string;      // 託運行李 (例如: "25kg", "23kg")
      carryOn?: string;      // 手提行李 (例如: "7kg")
    };
    carInfo?: {              // 租車專用
      carModel?: string;
      company?: string;
      pickupDate?: string;
      pickupTime?: string;
      returnDate?: string;
      returnTime?: string;
    };
    cost?: number;
    currency?: string;
    notes?: string;
  };
}

/**
 * 統一交通卡片資料模型 (TransportItemModel)
 */
export interface TransportItemModel {
  id: string;
  tripId?: string;
  type: TransportType;
  title?: string;
  operator?: string;
  operatorSub?: string;
  serviceNumber?: string;       // LEVEL 1 交通識別
  totalDuration?: string;       // 總時長
  directionType?: 'oneway' | 'roundtrip' | 'outbound' | 'inbound';
  segments: TransportSegmentModel[];
  
  // LEVEL 5 快速摘要資訊
  cost?: number;
  currency?: string;
  hasServiceFee?: boolean;
  serviceFeePercentage?: number;
  baggage?: {
    checked?: string;
    carryOn?: string;
  };
  seat?: string;
  classType?: string;
  bookingReference?: string;
  note?: string;
  participants?: string[];
  
  // 原始關聯資料引用 (完全向下相容，不破壞舊資料)
  rawBookingFlight?: BookingFlight;
  rawTransitLegs?: TransitLeg[];
  rawTransitFare?: TransitFareDetails;
  rawCarRental?: BookingCarRental;
}

/**
 * 完整旅程模型 (TransportJourneyModel)
 * 串接一整段跨工具聯運旅程 (例如: Flight TPE->ZRH -> Train ZRH->Bern -> Train Bern->Kandersteg -> Walk Hotel)
 */
export interface TransportJourneyModel {
  id: string;
  title: string;              // 旅程標題 (例如: "台灣 → 坎德施泰格 (Kandersteg)")
  date: string;               // 旅程主要日期
  totalDuration?: string;
  items: TransportItemModel[];
}

/**
 * 旅行時間軸項目 (TravelTimelineItem)
 * 支援 Travel Mode (NOW / NEXT / LATER)
 */
export interface TravelTimelineItem {
  id: string;
  time: string;               // 起始時間 (HH:mm)
  endTime?: string;           // 抵達時間 (HH:mm)
  date?: string;              // 日期 (YYYY-MM-DD)
  title: string;
  type: TransportType | 'stay' | 'spot';
  transportItem?: TransportItemModel;
  status: 'now' | 'next' | 'later' | 'completed';
  remainingMinutes?: number;  // 剩餘分鐘數 (NOW 模式)
  startsInMinutes?: number;   // 幾分鐘後開始 (NEXT 模式)
  note?: string;
}
