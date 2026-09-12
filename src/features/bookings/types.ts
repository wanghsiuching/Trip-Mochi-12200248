import { ImageAssetReference } from '../../shared/types/image';
import { VersionedEntity } from '../../shared/types/schema';

export interface BookingFlight extends VersionedEntity {
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
  hasTransit?: boolean;
  transitAirport?: string;
  transitCity?: string;
  transitDuration?: string;
  transitFlightCode?: string;
  hasReturnTransit?: boolean;
  returnTransitAirport?: string;
  returnTransitCity?: string;
  returnTransitDuration?: string;
  returnTransitFlightCode?: string;
  isPotential?: boolean;
}

export interface BookingAccommodation extends VersionedEntity {
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
  imageReferences?: ImageAssetReference[];
  note: string;
  isPotential?: boolean;
}

export interface BookingCarRental extends VersionedEntity {
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
  isPotential?: boolean;
}

export interface BookingTicket extends VersionedEntity {
  id: number;
  name: string;
  date: string;
  cost: number;
  currency: string;
  participants: string[];
  note?: string;
}

export interface BookingsState {
  flights: BookingFlight[];
  accommodations: BookingAccommodation[];
  carRentals: BookingCarRental[];
  tickets: BookingTicket[];
}
