import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../infrastructure/firebase';
import { uploadImageAsset } from '../../infrastructure/storage';
import { BookingFlight, BookingAccommodation, BookingCarRental, BookingTicket } from './types';
import { CURRENT_SCHEMA_VERSION } from '../../shared/types/schema';
import { normalizeImagesList, toUrlList } from '../../shared/utils/imageAdapter';
import { ImageAssetReference } from '../../shared/types/image';

export const bookingsService = {
  // Flight operations
  async saveFlight(tripId: string, flights: BookingFlight[], flight: BookingFlight): Promise<BookingFlight[]> {
    const updated = flights.some(f => f.id === flight.id)
      ? flights.map(f => f.id === flight.id ? { ...flight, schemaVersion: CURRENT_SCHEMA_VERSION } : f)
      : [{ ...flight, schemaVersion: CURRENT_SCHEMA_VERSION }, ...flights];

    await updateDoc(doc(db, 'trips', tripId), { flights: updated });
    return updated;
  },

  async deleteFlight(tripId: string, flights: BookingFlight[], id: number): Promise<BookingFlight[]> {
    const updated = flights.filter(f => f.id !== id);
    await updateDoc(doc(db, 'trips', tripId), { flights: updated });
    return updated;
  },

  // Accommodation operations
  async saveAccommodation(
    tripId: string,
    stays: BookingAccommodation[],
    stayData: Partial<BookingAccommodation>,
    newFiles: File[] = []
  ): Promise<BookingAccommodation[]> {
    const id = stayData.id || Date.now();

    const uploadedReferences: ImageAssetReference[] = [];
    for (const file of newFiles) {
      try {
        const { reference } = await uploadImageAsset(file, tripId, { domain: 'bookings' });
        uploadedReferences.push(reference);
      } catch (err) {
        console.warn('Failed to upload accommodation image asset:', err);
      }
    }

    const existingReferences = normalizeImagesList(
      stayData.imageReferences || stayData.photos
    );
    const combinedReferences = [...existingReferences, ...uploadedReferences];

    const newStay: BookingAccommodation = {
      ...(stayData as BookingAccommodation),
      id,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      imageReferences: combinedReferences,
      photos: toUrlList(combinedReferences),
    };

    const updated = stays.some(s => s.id === id)
      ? stays.map(s => s.id === id ? newStay : s)
      : [newStay, ...stays];

    await updateDoc(doc(db, 'trips', tripId), { accommodations: updated });
    return updated;
  },

  async deleteAccommodation(tripId: string, stays: BookingAccommodation[], id: number): Promise<BookingAccommodation[]> {
    const updated = stays.filter(s => s.id !== id);
    await updateDoc(doc(db, 'trips', tripId), { accommodations: updated });
    return updated;
  },

  // Car Rental operations
  async saveCarRental(tripId: string, rentals: BookingCarRental[], car: BookingCarRental): Promise<BookingCarRental[]> {
    const updated = rentals.some(c => c.id === car.id)
      ? rentals.map(c => c.id === car.id ? { ...car, schemaVersion: CURRENT_SCHEMA_VERSION } : c)
      : [{ ...car, schemaVersion: CURRENT_SCHEMA_VERSION }, ...rentals];

    await updateDoc(doc(db, 'trips', tripId), { carRentals: updated });
    return updated;
  },

  async deleteCarRental(tripId: string, rentals: BookingCarRental[], id: number): Promise<BookingCarRental[]> {
    const updated = rentals.filter(c => c.id !== id);
    await updateDoc(doc(db, 'trips', tripId), { carRentals: updated });
    return updated;
  },

  // Ticket operations
  async saveTicket(tripId: string, tickets: BookingTicket[], ticket: BookingTicket): Promise<BookingTicket[]> {
    const updated = tickets.some(t => t.id === ticket.id)
      ? tickets.map(t => t.id === ticket.id ? { ...ticket, schemaVersion: CURRENT_SCHEMA_VERSION } : t)
      : [{ ...ticket, schemaVersion: CURRENT_SCHEMA_VERSION }, ...tickets];

    await updateDoc(doc(db, 'trips', tripId), { tickets: updated });
    return updated;
  },

  async deleteTicket(tripId: string, tickets: BookingTicket[], id: number): Promise<BookingTicket[]> {
    const updated = tickets.filter(t => t.id !== id);
    await updateDoc(doc(db, 'trips', tripId), { tickets: updated });
    return updated;
  },
};
