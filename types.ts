
export type Tab = 'schedule' | 'bookings' | 'expense' | 'journal' | 'planning' | 'members';
export type ViewState = 'landing' | 'app';
export type ItemType = 'spot' | 'food' | 'transport' | 'stay' | 'flight';

// 通用交通工具型態（涵蓋全球鐵路、地鐵、纜車、渡輪、自駕等）
export type UniversalTransportType = 
  | 'train'         // 火車/新幹線/地鐵
  | 'high_speed'    // 高鐵
  | 'cable_car'     // 纜車/登山鐵道
  | 'boat'          // 遊船/渡輪
  | 'bus'           // 長途巴士/公車
  | 'flight'        // 國內航班
  | 'walk';         // 步行/轉乘

// 統一交通類型 (相容 TransportCard 與跨交通架構)
export type TransportType = 
  | 'train'        // 火車 / 鐵道 / 高鐵
  | 'flight'       // 航班 (國際/國內)
  | 'bus'          // 長途巴士 / 市區公車
  | 'ferry'        // 渡輪 / 遊船
  | 'boat'         // 船舶
  | 'car'          // 租車 / 自駕
  | 'shuttle'      // 接駁車 / 機場專車
  | 'walk'         // 步行 / 徒步轉乘
  | 'cable_car'    // 纜車 / 登山鐵道
  | 'high_speed'   // 高鐵 / 新幹線
  | 'subway';      // 地鐵 / 捷運

// 通用通行證/交通卡類型
export type TransitPassType = 
  | 'pass_free'        // 類 STP / JR Pass（通票涵蓋，實付 0 或僅需訂位費）
  | 'pass_discount'    // 半價卡 / 區域折扣卡（享有特定折扣比率）
  | 'ic_card'          // Suica / 八達通 / 儲值卡扣款
  | 'point_to_point'   // 單程票 / 一般購票
  | 'none';

// 單一航段/區間 (支援 A 點 -> Via 經停 -> B 點)
export interface TransitLeg {
  id: string;
  fromStation: string;        // 出發站 (e.g., Tokyo / Interlaken)
  toStation: string;          // 到達站 (e.g., Kyoto / Grindelwald)
  departureTime: string;      // 發車時間 (e.g., 08:00)
  arrivalTime: string;        // 抵達時間 (e.g., 10:30)
  serviceNumber?: string;     // 車次/航班號 (e.g., Nozomi 21 / RE 452)
  transportType: UniversalTransportType;
  platform?: string;          // 月台/閘口 (e.g., Track 14)
  
  // 火車 / 鐵道專屬與擴充欄位
  carriage?: string;          // 車廂 (e.g., "Car 4", "4車")
  car?: string;               // 車廂簡寫
  seat?: string;              // 座位 (e.g., "12A", "指定席 4車12A")
  class?: string;             // 席級/車廂等級 (e.g., "1st Class", "一等座", "普通車廂")
  classType?: string;         // 席別 (向下相容)
  ticketType?: string;        // 票種 (e.g., "指定席", "自由席", "早鳥票")
  departurePlatform?: string; // 出發月台 (e.g., "Track 3")
  arrivalPlatform?: string;   // 抵達月台 (e.g., "Track 2B")
  operator?: string;          // 營運公司 (e.g., "SBB", "JR East", "SNCF", "Trenitalia")
  operatorSub?: string;       // 次要營運名稱 (e.g., "Swiss Federal Railways")
  direction?: string;         // 行車方向 / 終點站 (e.g., "for Milano Centrale")
  duration?: string;          // 行車時間 (e.g., "1h 45m")
  bookingReference?: string;  // 訂位代碼 / PNR
  note?: string;              // 備註說明
}

// 額外加價項目 (如：指定席、劃位費、行李托運、觀光列車附加費等)
export interface TransitExtraFeeItem {
  id: string;
  name: string;
  amount: number | string;
  currency: string;
  hasServiceFee?: boolean;
  serviceFeePercentage?: number | string;
  serviceFee?: number;
}

// 票價與通行證折扣模型
export interface TransitFareDetails {
  passUsed?: TransitPassType;
  originalPrice?: number | string;      // 原票價 (支援多幣別)
  discountedPrice?: number | string;    // 實際支付金額（套用通票或折扣後）
  currency: string;           // 幣別 (TWD, JPY, CHF, EUR 等)
  hasServiceFee?: boolean;              // 是否有含稅/手續費 (例如海外刷卡1.5%或手續費)
  serviceFeePercentage?: number | string; // 手續費百分比
  serviceFee?: number;                  // 手續費金額
  
  // 支援多筆自定義額外加價項目
  extraFees?: TransitExtraFeeItem[];

  // 向下相容單一額外費用欄位
  extraFeeName?: string;      // 自定義額外費用名稱 (如：指定席加價 / 額外訂位費 / 行李加價)
  seatReservationFee?: number | string;// 額外費用金額
  seatReservationFeeCurrency?: string; // 額外費用幣別
  extraFeeHasServiceFee?: boolean;              // 自訂加價項目是否含有手續費
  extraFeeServiceFeePercentage?: number | string; // 自訂加價手續費百分比
  extraFeeServiceFee?: number;                  // 自訂加價手續費金額
  notes?: string;             // 備註 (e.g., "需提前劃位，持有 JR Pass")
}

// 完整的通用交通行程卡片資料結構
export interface UniversalTransitItem {
  id: string;
  tripId: string;
  dayIndex: number;
  title: string;              // 行程標題 (e.g., "東京移動至京都")
  legs: TransitLeg[];         // 多段轉乘陣列 (支援 SBB / JR 般的複雜經停)
  fare: TransitFareDetails;   // 票價與通票折算
  assignedMembers: string[];  // 參與成員 ID
}

export interface Currency {
  code: string;
  rate: number; // Exchange rate relative to base currency (e.g. TWD)
}

export interface Member {
  id: string;
  name: string;
  avatar?: string | null;
  fruit?: string; // Random fruit icon
}

export interface TripDay {
  date: string; // YYYY-MM-DD
  location: string;
  fruit?: string; // Icon for the day
}

export interface TripDate extends TripDay {
    dayNum: number;
    month: number;
    day: number;
    weekday: string;
    full?: string;
}

export interface ExpenseItem {
  id: string;
  name: string;
  amount: number | string;
  currency?: string;
  hasServiceFee?: boolean;
  serviceFeePercentage?: number | string;
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
  flightDuration?: string;
  checkedBag?: string;
  carryOnBag?: string;
  cost?: number;
  currency?: string;
  hasServiceFee?: boolean;
  serviceFee?: number;
  serviceFeePercentage?: number;
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
  hasServiceFee?: boolean;
  serviceFee?: number;
  serviceFeePercentage?: number;
  participants?: string[];
  isPotential?: boolean;
}

export interface SpotDetails {
  hasTicket: boolean;
  ticketCost?: number;
  currency?: string;
  hasServiceFee?: boolean;
  serviceFee?: number;
  serviceFeePercentage?: number;
  participants?: string[];
  isPotential?: boolean;
}

export interface ScheduleItem {
  id: string;
  order?: number; // 順序編號 (保證自訂調換順序後持久化存儲)
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
  images?: string[];
  photoPlacement?: 'top' | 'middle' | 'bottom';
  photoOffsetY?: number;
}

export interface PocketItem {
  id: string;
  category: 'food' | 'spot' | 'shopping'; // 美食, 探索景點, 購物/伴手禮
  title: string;             // 名稱 (例如：一蘭拉麵、小樽運河、白色戀人)
  location?: string;         // 地址或地點
  url?: string;              // 相關網址 / 超連結 / IG / 官網 / 預約
  notes?: string;            // 備註說明 (推薦必吃、拍照點、必買清單等)
  tag?: string;              // 標籤 (如：拉麵、伴手禮、藥妝、夜景、古蹟)
  rating?: number;           // 推薦星等 (1-5)
  priceRange?: string;       // 預算 / 價格 (如：¥1,000~2,000)
  assignedDate?: string;     // 預計前往日期 (可選)
  isVisited?: boolean;       // 是否已造訪 / 已購買
  images?: string[];         // 照片/圖片 (支援多張照片、免費本機壓縮儲存)
  createdAt?: number;
}

export interface SavedTrip {
  id: string;
  name: string;
  date: string;
}

export interface Comment {
    id: string;
    authorId: string;
    text: string;
    createdAt: string;
}

export interface Expense {
    id: number;
    amount: number;
    title: string;
    currency: string;
    payer: string;
    paymentMethod: string;
    location: string;
    image: string | null;
    date: string;
    time: string;
    
    // Added fields
    involvedMembers?: string[];
    settledMembers?: string[]; 
    images?: string[];
    comments?: Comment[];
    
    // Credit card fields
    isCreditCard?: boolean;
    hasServiceFee?: boolean;
    serviceFeePercentage?: number;

    // Public Fund Fields
    category?: 'general' | 'public_fund'; // Default is 'general'
    fundType?: 'deposit' | 'expense'; // Only for category === 'public_fund'
    
    // Category distribution field (交通, 住宿, 餐飲, 景點, 其他)
    expenseType?: 'transport' | 'accommodation' | 'dining' | 'spot' | 'other' | string;
}

export interface TodoItem {
    id: number;
    text: string;
    done: boolean;
    assignee: string | string[];
    completedBy?: string[];
    note?: string;
    url?: string;
    comments?: Comment[];
    category?: string; // e.g. 'clothes' | 'toiletries' | 'electronics' | 'documents' | 'medicine' | 'other'
}

export type DocumentCategory = 
  | 'passport'     // 護照
  | 'visa'         // 簽證
  | 'insurance'    // 保險單
  | 'hotel'        // 訂房確認
  | 'ticket'       // 機票/車票憑證
  | 'other'        // 其他文件
  | 'license';     // 相容歷史資料

export interface TravelDocument {
  id: number | string;
  title: string;
  category: DocumentCategory;
  holder: string; // 成員姓名或 '全體'
  docNumber?: string;
  expiryDate?: string; // YYYY-MM-DD
  issueDate?: string;  // YYYY-MM-DD
  note?: string;
  url?: string;
  images?: string[];
  comments?: Comment[];
  createdAt?: number;
}

export interface Journal {
    id: number;
    date: string;
    author: string;
    content: string;
    photos: string[];
    comments?: Comment[];
}

// Added missing Booking interfaces
export interface BookingFlight {
  id: number;
  airline: string;
  code: string;
  date: string;
  arrivalDate: string;
  returnDate?: string;
  returnArrivalDate?: string;
  origin: string;
  originCity: string;
  dest: string;
  destCity: string;
  duration: string;
  returnDuration?: string;
  aircraft: string;
  checkedBag: string;
  carryOnBag: string;
  baggage: string;
  color: string;
  purchaseDate: string;
  platform: string;
  type: string;
  tripType: 'oneway' | 'roundtrip';
  cost: number;
  currency: string;
  hasServiceFee: boolean;
  serviceFeePercentage: number;
  participants: string[];
  note: string;
  departureAirport?: string;
  arrivalAirport?: string;
  depTime?: string;
  arrTime?: string;

  // 轉機資訊 (Layover / Transit)
  hasTransit?: boolean;
  transitAirport?: string;       // 轉機機場代碼 (如：AUH, HKG, DXB)
  transitCity?: string;          // 轉機城市 (如：阿布達比, 香港)
  transitDuration?: string;      // 轉機停留時間 (如：2h 15m)
  transitFlightCode?: string;    // 第二段/銜接航班號 (如：EY073)

  // 回程轉機資訊 (Return Transit)
  hasReturnTransit?: boolean;
  returnTransitAirport?: string; // 回程轉機機場代碼
  returnTransitCity?: string;    // 回程轉機城市
  returnTransitDuration?: string;// 回程轉機停留時間
  returnTransitFlightCode?: string; // 回程第二段/銜接航班號
  isPotential?: boolean;         // 列入潛在花費 (預算參考)
}

export interface BookingAccommodation {
  id: number;
  name: string;
  city: string;
  platform: string;
  ref?: string;
  address: string;
  gps?: string;
  url?: string;
  checkInDate: string;
  checkOutDate: string;
  checkInTime?: string;
  latestCheckInTime?: string;
  checkOutTime?: string;
  checkIn?: string;
  nights: number;
  cost: number;
  currency: string;
  hasServiceFee: boolean;
  serviceFeePercentage: number;
  participants: string[];
  pax?: number;
  photos?: string[];
  note: string;
  isPotential?: boolean;         // 列入潛在花費 (預算參考)
}

export interface BookingCarRental {
  id: number;
  company: string;
  platform: string;
  carModel: string;
  ref?: string;
  pickupDate: string;
  pickupTime?: string;
  pickupLocation: string;
  returnDate: string;
  returnTime?: string;
  returnLocation: string;
  gps?: string;
  url?: string;
  note: string;
  price: number;
  currency: string;
  hasServiceFee: boolean;
  serviceFeePercentage: number;
  pax?: number;
  participants: string[];
  hasRental: boolean;
  isPotential?: boolean;         // 列入潛在花費 (預算參考)
}

export interface BookingTicket {
  id: number;
  name: string;
  date: string;
  cost: number;
  currency: string;
  participants: string[];
  note?: string;
}

export interface BookingTrain {
  id: number | string;
  trainName?: string;          // 列車名稱 (如：歐洲之星 Eurostar, 冰河列車 Glacier Express, 新幹線 Nozomi)
  operator?: string;           // 營運商 (如：SBB, SNCF, JR, 台灣高鐵, Trenitalia)
  operatorSub?: string;        // 次要營運名稱 (如：Swiss Federal Railways)
  code?: string;               // 車次編號 (如：IC 8, TGV 9576, G123)
  serviceNumber?: string;      // 車次號
  fromStation: string;         // 出發車站 (如：Zürich HB, 東京站)
  toStation: string;           // 抵達車站 (如：Interlaken Ost, 京都站)
  departureDate?: string;      // 出發日期 (YYYY-MM-DD)
  departureTime?: string;      // 出發時間 (HH:mm)
  arrivalDate?: string;        // 抵達日期 (YYYY-MM-DD)
  arrivalTime?: string;        // 抵達時間 (HH:mm)
  duration?: string;           // 行駛時間 (如：2h 15m)
  platform?: string;           // 出發月台 (如：Track 4, 3號月台)
  arrivalPlatform?: string;    // 抵達月台
  carriage?: string;           // 車廂 (如：Car 6, 7號車)
  seat?: string;               // 座位 (如：14A, 14B)
  class?: string;              // 席位等別 (如：一等席 1st Class, 二等席 2nd Class, 商務艙)
  classType?: string;          // 席別 (向下相容)
  ticketType?: string;         // 票種 (如：指定席、自由席、Pass+劃位票)
  bookingReference?: string;   // 訂位代碼 / PNR
  cost?: number;               // 費用
  currency?: string;           // 幣別
  hasServiceFee?: boolean;     // 是否含手續費
  serviceFeePercentage?: number; // 手續費百分比
  participants?: string[];     // 參與人
  note?: string;               // 備註說明
  hasTransfer?: boolean;       // 是否需中途轉車
  transferStation?: string;    // 轉乘車站
  transferDuration?: string;   // 轉乘候車時間
  transferTrainCode?: string;  // 轉乘班次編號
  transferPlatform?: string;   // 轉乘月台
  isPotential?: boolean;       // 預算參考標記
}

export const THEME = {
  colors: {
    bg: 'bg-beige',
    card: 'bg-white',
    primary: 'bg-sage', 
    text: 'text-cocoa', 
    shadow: 'shadow-hard',
    shadowActive: 'active:shadow-none active:translate-x-[2px] active:translate-y-[2px]',
  },
  animation: {
    overshoot: 'transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
  }
};

// ==========================================
// Trip Mochi 路線模型 (Route Points & Segments)
// ==========================================

export type RoutePointSource = 
  | 'manual_map'            // 1. 使用者在 Trip Mochi 地圖上點擊 (最高優先級)
  | 'existing_manual_gps'   // 2. 使用者原本手動輸入的 GPS
  | 'google_url_coordinate' // 3. Google Maps URL 明確包含之座標
  | 'other';                // 4. 其他合法解析來源

export type RouteTransportType = 
  | 'WALK'
  | 'TRAIN'
  | 'SUBWAY'
  | 'BUS'
  | 'TRAM'
  | 'FERRY'
  | 'TAXI'
  | 'CAR'
  | 'RENTAL_CAR'
  | 'FLIGHT'
  | 'OTHER';

export interface RoutePoint {
  id: string;
  dayId: string;              // 日期 / Day 標籤 (e.g. "2026-10-24")
  sequence: number;           // 每日重新從 1 起算 (1-based: ①, ②, ③, ④...)
  title: string;              // 點位名稱
  latitude: number;           // 緯度
  longitude: number;          // 經度
  linkedScheduleItemId?: string; // 關聯之 Schedule Item ID (不複製整個物件)
  isConfirmed: boolean;       // 座標是否已確認 (只有 confirmed 才能匯出)
  source: RoutePointSource;   // 座標來源 (manual_map 優先級最高)
  address?: string;           // 僅供參考之地址
  notes?: string;             // 備註說明
}

export interface RouteSegment {
  id: string;
  dayId: string;
  fromPointId: string;
  toPointId: string;
  transportType: RouteTransportType;
}

export interface TransportTypeMeta {
  type: RouteTransportType;
  label: string;
  emoji: string;
  googleMode: 'walking' | 'transit' | 'driving' | 'bicycling';
}

export const ROUTE_TRANSPORT_CONFIG: Record<RouteTransportType, TransportTypeMeta> = {
  WALK: { type: 'WALK', label: '步行', emoji: '🚶', googleMode: 'walking' },
  SUBWAY: { type: 'SUBWAY', label: '地鐵/捷運', emoji: '🚇', googleMode: 'transit' },
  TRAIN: { type: 'TRAIN', label: '火車/鐵道', emoji: '🚆', googleMode: 'transit' },
  BUS: { type: 'BUS', label: '公車/巴士', emoji: '🚌', googleMode: 'transit' },
  TRAM: { type: 'TRAM', label: '路面電車', emoji: '🚊', googleMode: 'transit' },
  FERRY: { type: 'FERRY', label: '渡輪/遊船', emoji: '⛴️', googleMode: 'transit' },
  TAXI: { type: 'TAXI', label: '計程車', emoji: '🚕', googleMode: 'driving' },
  CAR: { type: 'CAR', label: '自駕', emoji: '🚗', googleMode: 'driving' },
  RENTAL_CAR: { type: 'RENTAL_CAR', label: '租車', emoji: '🚙', googleMode: 'driving' },
  FLIGHT: { type: 'FLIGHT', label: '航班', emoji: '✈️', googleMode: 'transit' },
  OTHER: { type: 'OTHER', label: '其他', emoji: '📍', googleMode: 'walking' },
};

