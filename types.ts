
export type Tab = 'schedule' | 'bookings' | 'expense' | 'journal' | 'planning' | 'members';
export type ViewState = 'landing' | 'app';
export type ItemType = 'spot' | 'food' | 'transport' | 'stay' | 'flight';

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

export interface ScheduleItem {
  id: string;
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
  stayDetails?: any;
  flightDetails?: any;
  spotDetails?: {
    hasTicket: boolean;
    ticketCost?: number;
    currency?: string;
    hasServiceFee?: boolean;
    serviceFee?: number;
    serviceFeePercentage?: number;
    participants?: string[];
    isPotential?: boolean;
  };
  address?: string;
  googleMapUrl?: string;
  naverMapUrl?: string;
  note?: string;
  images?: string[];
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
