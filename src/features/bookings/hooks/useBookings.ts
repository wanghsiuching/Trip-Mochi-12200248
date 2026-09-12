import { useCallback } from 'react';
import { BookingFlight, BookingAccommodation, BookingCarRental, BookingTicket } from '../types';
import { bookingsService } from '../service';

export interface UseBookingsProps {
  tripId: string;
  flights: BookingFlight[];
  accommodations: BookingAccommodation[];
  carRentals: BookingCarRental[];
  tickets: BookingTicket[];
  onFlightsUpdated?: (flights: BookingFlight[]) => void;
  onAccommodationsUpdated?: (stays: BookingAccommodation[]) => void;
  onCarRentalsUpdated?: (rentals: BookingCarRental[]) => void;
  onTicketsUpdated?: (tickets: BookingTicket[]) => void;
}

export function useBookings({
  tripId,
  flights,
  accommodations,
  carRentals,
  tickets,
  onFlightsUpdated,
  onAccommodationsUpdated,
  onCarRentalsUpdated,
  onTicketsUpdated,
}: UseBookingsProps) {
  // Flight operations
  const saveFlight = useCallback(
    async (flight: BookingFlight) => {
      if (!tripId) return;
      const updated = await bookingsService.saveFlight(tripId, flights, flight);
      onFlightsUpdated?.(updated);
      return updated;
    },
    [tripId, flights, onFlightsUpdated]
  );

  const deleteFlight = useCallback(
    async (id: number) => {
      if (!tripId) return;
      const updated = await bookingsService.deleteFlight(tripId, flights, id);
      onFlightsUpdated?.(updated);
      return updated;
    },
    [tripId, flights, onFlightsUpdated]
  );

  // Accommodation operations
  const saveAccommodation = useCallback(
    async (stayData: Partial<BookingAccommodation>, newFiles: File[] = []) => {
      if (!tripId) return;
      const updated = await bookingsService.saveAccommodation(tripId, accommodations, stayData, newFiles);
      onAccommodationsUpdated?.(updated);
      return updated;
    },
    [tripId, accommodations, onAccommodationsUpdated]
  );

  const deleteAccommodation = useCallback(
    async (id: number) => {
      if (!tripId) return;
      const updated = await bookingsService.deleteAccommodation(tripId, accommodations, id);
      onAccommodationsUpdated?.(updated);
      return updated;
    },
    [tripId, accommodations, onAccommodationsUpdated]
  );

  // Car Rental operations
  const saveCarRental = useCallback(
    async (car: BookingCarRental) => {
      if (!tripId) return;
      const updated = await bookingsService.saveCarRental(tripId, carRentals, car);
      onCarRentalsUpdated?.(updated);
      return updated;
    },
    [tripId, carRentals, onCarRentalsUpdated]
  );

  const deleteCarRental = useCallback(
    async (id: number) => {
      if (!tripId) return;
      const updated = await bookingsService.deleteCarRental(tripId, carRentals, id);
      onCarRentalsUpdated?.(updated);
      return updated;
    },
    [tripId, carRentals, onCarRentalsUpdated]
  );

  // Ticket operations
  const saveTicket = useCallback(
    async (ticket: BookingTicket) => {
      if (!tripId) return;
      const updated = await bookingsService.saveTicket(tripId, tickets, ticket);
      onTicketsUpdated?.(updated);
      return updated;
    },
    [tripId, tickets, onTicketsUpdated]
  );

  const deleteTicket = useCallback(
    async (id: number) => {
      if (!tripId) return;
      const updated = await bookingsService.deleteTicket(tripId, tickets, id);
      onTicketsUpdated?.(updated);
      return updated;
    },
    [tripId, tickets, onTicketsUpdated]
  );

  return {
    flights,
    accommodations,
    carRentals,
    tickets,
    saveFlight,
    deleteFlight,
    saveAccommodation,
    deleteAccommodation,
    saveCarRental,
    deleteCarRental,
    saveTicket,
    deleteTicket,
  };
}
