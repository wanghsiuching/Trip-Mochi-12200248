import { VersionedEntity } from '../../shared/types/schema';

export interface Member {
  id: string;
  name: string;
  avatar?: string | null;
  fruit?: string;
}

export interface TripDay {
  date: string;
  location: string;
  fruit?: string;
}

export interface TripDate extends TripDay {
  dayNum: number;
  month: number;
  day: number;
  weekday: string;
  full?: string;
}

export interface SavedTrip {
  id: string;
  name: string;
  date: string;
}

export interface Activity {
  id: string;
  type: string;
  author: string;
  description: string;
  timestamp: number;
}
