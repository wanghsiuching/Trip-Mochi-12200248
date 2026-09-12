import { VersionedEntity } from '../../shared/types/schema';

/**
 * Local User Identity (Device-level operator identity)
 * NOTE: Local identity !== authenticated identity.
 * In Trip Mochi, all companions share a Trip Code without requiring OAuth accounts.
 * LocalUserIdentity identifies which member the current device operator is acting as.
 */
export interface LocalUserIdentity {
  userId: string; // e.g. "local_1741829384_abc"
  memberId: string; // The selected Member.id in the trip
  displayName: string; // The snapshot of member's name
  avatar?: string | null;
  createdAt: number;
}

export interface Member extends VersionedEntity {
  id: string;
  name: string;
  avatar?: string | null;
  fruit?: string;
  createdAt?: number;
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
