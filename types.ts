
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
  amount: number | string; // Changed to allow empty string input
  currency?: string;
  hasServiceFee?: boolean;
  serviceFeePercentage?: number | string; // Changed to allow empty input
}

export interface CarRentalDetails {
  hasRental: boolean;
  company?: string;
  carModel?: string;
  pickupDate?: string;
  pickupTime?: string;
  returnDate?: string;
  returnTime?: string;
  
  // Base Rental Cost
  rentalCost?: number | string;
  rentalCurrency?: string;
  hasServiceFee?: boolean;
  serviceFeePercentage?: number | string;
  
  // Fuel
  estimatedFuelCost?: number | string;
  fuelCurrency?: string;

  expenses?: ExpenseItem[];
  participants?: string[];
  isPotential?: boolean;
}

export interface StayDetails {
  cost?: number | string;
  currency?: string;
  hasServiceFee?: boolean;
  serviceFeePercentage?: number | string;
  participants?: string[];
  isPotential?: boolean;
}

export interface FlightDetails {
  airline?: string;
  flightCode?: string;
  departureTime?: string;
  arrivalTime?: string;
  arrivalDate?: string; // Added for detailed schedule
  departureAirport?: string;
  arrivalAirport?: string;
  checkedBag?: string;
  carryOnBag?: string;
  
  cost?: number | string;
  currency?: string;
  hasServiceFee?: boolean;
  serviceFeePercentage?: number | string;
  participants?: string[];
  isPotential?: boolean;
}

export interface ScheduleItem {
  id: string;
  date: string; // YYYY-MM-DD
  time: string;
  title: string;
  type: ItemType;
  location: string;
  gps?: { lat: string; lng: string };
  notes?: string;
  
  // Accommodation specific fields
  checkIn?: string;
  checkOut?: string;
  meals?: { breakfast: boolean; dinner: boolean };
  
  // Detailed Data Structures
  carRental?: CarRentalDetails;
  stayDetails?: StayDetails;
  flightDetails?: FlightDetails;
  
  // Spot/Food specific fields
  spotDetails?: {
    hasTicket: boolean;
    ticketCost?: number;
    currency?: string; // Currency code
    hasServiceFee?: boolean;
    serviceFee?: number;
    serviceFeePercentage?: number;
    participants?: string[]; // List of member IDs
    isPotential?: boolean;
  };

  // Additional fields for ScheduleView
  address?: string;
  googleMapUrl?: string;
  naverMapUrl?: string;
  note?: string; // Alias for notes
  images?: string[];
}

export interface SavedTrip {
  id: string;
  name: string;
  date: string;
}

export interface BookingFlight {
  id: number;
  airline: string;
  code: string;
  date: string; // Departure date/time
  arrivalDate?: string; // Added for departure flight arrival
  origin: string;
  originCity: string;
  dest: string;
  destCity: string;
  depTime: string;
  arrTime: string;
  duration: string;
  aircraft: string;
  baggage: string;
  color: string;
  purchaseDate: string;
  platform: string;
  type: string;
  note: string;
  
  // Added fields
  checkedBag?: string;
  carryOnBag?: string;
  departureAirport?: string;
  arrivalAirport?: string;
  cost: number;
  currency: string;
  hasServiceFee: boolean;
  serviceFeePercentage: number;
  participants: string[];
  isPotential?: boolean;

  // Added missing fields for BookingsView
  tripType?: 'oneway' | 'roundtrip';
  returnDate?: string; // Return departure
  returnArrivalDate?: string; // Return arrival
  returnDuration?: string;
}

export interface BookingAccommodation {
  id: number;
  name: string;
  city: string;
  platform: string;
  ref: string;
  address: string;
  gps: string;
  url: string;
  checkInDate: string;
  checkOutDate: string;
  checkInTime: string;
  latestCheckInTime: string;
  checkOutTime: string;
  nights: number;
  pax: number;
  priceKRW?: number;
  priceTWD?: number;
  photos: string[]; // base64 strings
  note: string;
  googleMapUrl?: string;
  naverMapUrl?: string;
  checkIn: string; // display time

  // Added fields
  cost: number;
  currency: string;
  hasServiceFee: boolean;
  serviceFeePercentage: number;
  participants: string[];
}

export interface BookingCarRental {
  id: number;
  company: string;
  platform: string;
  carModel: string;
  ref: string;
  pickupDate: string;
  pickupTime: string;
  pickupLocation: string;
  returnDate: string;
  returnTime: string;
  returnLocation: string;
  gps: string;
  url: string;
  note: string;
  price: number;
  currency: string;
  pax: number;

  // Added fields
  hasServiceFee: boolean;
  serviceFeePercentage: number;
  participants: string[];
  
  // Optional for ScheduleItem compatibility/usage
  hasRental?: boolean;
  rentalCost?: number | string;
  rentalCurrency?: string;
  estimatedFuelCost?: number | string;
  fuelCurrency?: string;
  expenses?: ExpenseItem[];
  isPotential?: boolean;
}

export interface BookingTicket {
  id: number;
  name: string;
  platform: string;
  files: string[]; // base64 strings
}

// Aliases for Components
export type Flight = BookingFlight;
export type Accommodation = BookingAccommodation;
export type CarRental = BookingCarRental;
export type Ticket = BookingTicket;

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
    images?: string[];
    comments?: Comment[];
}

export interface TodoItem {
    id: number;
    text: string;
    done: boolean;
    // Added fields
    assignee: string | string[];
    completedBy?: string[];
    note?: string;
    url?: string;
    image?: string;
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
