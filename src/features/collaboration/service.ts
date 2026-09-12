import { doc, updateDoc, onSnapshot, collection } from 'firebase/firestore';
import { db } from '../../infrastructure/firebase';
import { Member, TripDay } from './types';
import { CURRENT_SCHEMA_VERSION } from '../../shared/types/schema';
import { subscribeToTripUpdates, createTrip, duplicateTrip } from '../../../services/tripService';

export const collaborationService = {
  createTrip,
  duplicateTrip,
  subscribeToTrip: subscribeToTripUpdates,

  async updateMembers(tripId: string, members: Member[]): Promise<Member[]> {
    await updateDoc(doc(db, 'trips', tripId), {
      members,
      schemaVersion: CURRENT_SCHEMA_VERSION,
    });
    return members;
  },

  async updateTripDays(tripId: string, tripDays: TripDay[]): Promise<TripDay[]> {
    await updateDoc(doc(db, 'trips', tripId), {
      tripDays,
      schemaVersion: CURRENT_SCHEMA_VERSION,
    });
    return tripDays;
  },

  async updateTripTitle(tripId: string, name: string): Promise<string> {
    await updateDoc(doc(db, 'trips', tripId), {
      name,
      schemaVersion: CURRENT_SCHEMA_VERSION,
    });
    return name;
  },
};
