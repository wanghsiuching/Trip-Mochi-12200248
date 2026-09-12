import { useState } from 'react';
import { BookingFlight, BookingAccommodation, BookingCarRental, BookingTicket } from '../types';
import { addTripItem, updateTripField, softDeleteTripItem, restoreTripItem } from '../services/tripService';
import { LocalUserIdentity } from '../src/features/collaboration/types';

export const useBookingsData = (currentTripId: string, currentUser?: LocalUserIdentity | null) => {
  const [bookingFlights, setBookingFlights] = useState<BookingFlight[]>([]);
  const [bookingAccommodations, setBookingAccommodations] = useState<BookingAccommodation[]>([]);
  const [bookingCarRentals, setBookingCarRentals] = useState<BookingCarRental[]>([]);
  const [bookingTickets, setBookingTickets] = useState<BookingTicket[]>([]);

  // Flight handlers
  const handleAddFlight = (flight: BookingFlight) => {
    addTripItem(currentTripId, 'flights', flight);
  };
  const handleUpdateFlight = (updated: BookingFlight) => {
    updateTripField(currentTripId, 'flights', bookingFlights.map(f => String(f.id) === String(updated.id) ? updated : f));
  };
  const handleDeleteFlight = (id: number) => {
    const flight = bookingFlights.find(f => String(f.id) === String(id));
    const flightTitle = flight ? `${flight.departureAirport} → ${flight.arrivalAirport} 航班` : '航班';
    const now = Date.now();
    setBookingFlights(prev => prev.map(f => String(f.id) === String(id) ? { ...f, deletedAt: now, deletedBy: currentUser?.userId || 'unknown' } : f));
    softDeleteTripItem(currentTripId, 'flights', id, currentUser, 'booking', flightTitle).catch(err => {
      console.error("Failed to soft-delete flight:", err);
    });
  };
  const handleRestoreFlight = (id: number) => {
    const flight = bookingFlights.find(f => String(f.id) === String(id));
    const flightTitle = flight ? `${flight.departureAirport} → ${flight.arrivalAirport} 航班` : '航班';
    setBookingFlights(prev => prev.map(f => {
      if (String(f.id) === String(id)) {
        const { deletedAt, deletedBy, deletedByMemberId, ...rest } = f as any;
        return rest;
      }
      return f;
    }));
    restoreTripItem(currentTripId, 'flights', id, currentUser, 'booking', flightTitle).catch(err => {
      console.error("Failed to restore flight:", err);
    });
  };

  // Accommodation handlers
  const handleAddAccommodation = (a: BookingAccommodation) => {
    addTripItem(currentTripId, 'accommodations', a);
  };
  const handleUpdateAccommodation = (a: BookingAccommodation) => {
    updateTripField(currentTripId, 'accommodations', bookingAccommodations.map(x => x.id === a.id ? a : x));
  };
  const handleDeleteAccommodation = (id: number) => {
    const acc = bookingAccommodations.find(x => x.id === id);
    const accTitle = acc?.name || '住宿預訂';
    const now = Date.now();
    setBookingAccommodations(prev => prev.map(x => x.id === id ? { ...x, deletedAt: now, deletedBy: currentUser?.userId || 'unknown' } : x));
    softDeleteTripItem(currentTripId, 'accommodations', id, currentUser, 'booking', accTitle).catch(err => {
      console.error("Failed to soft-delete accommodation:", err);
    });
  };
  const handleRestoreAccommodation = (id: number) => {
    const acc = bookingAccommodations.find(x => x.id === id);
    const accTitle = acc?.name || '住宿預訂';
    setBookingAccommodations(prev => prev.map(x => {
      if (x.id === id) {
        const { deletedAt, deletedBy, deletedByMemberId, ...rest } = x as any;
        return rest;
      }
      return x;
    }));
    restoreTripItem(currentTripId, 'accommodations', id, currentUser, 'booking', accTitle).catch(err => {
      console.error("Failed to restore accommodation:", err);
    });
  };

  // Car Rental handlers
  const handleAddCar = (car: BookingCarRental) => {
    addTripItem(currentTripId, 'carRentals', car);
  };
  const handleUpdateCar = (updated: BookingCarRental) => {
    updateTripField(currentTripId, 'carRentals', bookingCarRentals.map(c => String(c.id) === String(updated.id) ? updated : c));
  };
  const handleDeleteCar = (id: number) => {
    const car = bookingCarRentals.find(c => String(c.id) === String(id));
    const carTitle = car?.company ? `${car.company} 租車` : '租車預訂';
    const now = Date.now();
    setBookingCarRentals(prev => prev.map(c => String(c.id) === String(id) ? { ...c, deletedAt: now, deletedBy: currentUser?.userId || 'unknown' } : c));
    softDeleteTripItem(currentTripId, 'carRentals', id, currentUser, 'booking', carTitle).catch(err => {
      console.error("Failed to soft-delete car rental:", err);
    });
  };
  const handleRestoreCar = (id: number) => {
    const car = bookingCarRentals.find(c => String(c.id) === String(id));
    const carTitle = car?.company ? `${car.company} 租車` : '租車預訂';
    setBookingCarRentals(prev => prev.map(c => {
      if (String(c.id) === String(id)) {
        const { deletedAt, deletedBy, deletedByMemberId, ...rest } = c as any;
        return rest;
      }
      return c;
    }));
    restoreTripItem(currentTripId, 'carRentals', id, currentUser, 'booking', carTitle).catch(err => {
      console.error("Failed to restore car rental:", err);
    });
  };

  // Ticket handlers
  const handleAddTicket = (t: BookingTicket) => {
    addTripItem(currentTripId, 'tickets', t);
  };
  const handleUpdateTicket = (t: BookingTicket) => {
    updateTripField(currentTripId, 'tickets', bookingTickets.map(x => x.id === t.id ? t : x));
  };
  const handleDeleteTicket = (id: number) => {
    const ticket = bookingTickets.find(x => x.id === id);
    const ticketTitle = ticket?.name || '票券預訂';
    const now = Date.now();
    setBookingTickets(prev => prev.map(x => x.id === id ? { ...x, deletedAt: now, deletedBy: currentUser?.userId || 'unknown' } : x));
    softDeleteTripItem(currentTripId, 'tickets', id, currentUser, 'booking', ticketTitle).catch(err => {
      console.error("Failed to soft-delete ticket:", err);
    });
  };
  const handleRestoreTicket = (id: number) => {
    const ticket = bookingTickets.find(x => x.id === id);
    const ticketTitle = ticket?.name || '票券預訂';
    setBookingTickets(prev => prev.map(x => {
      if (x.id === id) {
        const { deletedAt, deletedBy, deletedByMemberId, ...rest } = x as any;
        return rest;
      }
      return x;
    }));
    restoreTripItem(currentTripId, 'tickets', id, currentUser, 'booking', ticketTitle).catch(err => {
      console.error("Failed to restore ticket:", err);
    });
  };

  return {
    bookingFlights,
    setBookingFlights,
    bookingAccommodations,
    setBookingAccommodations,
    bookingCarRentals,
    setBookingCarRentals,
    bookingTickets,
    setBookingTickets,
    handleAddFlight,
    handleUpdateFlight,
    handleDeleteFlight,
    handleRestoreFlight,
    handleAddAccommodation,
    handleUpdateAccommodation,
    handleDeleteAccommodation,
    handleRestoreAccommodation,
    handleAddCar,
    handleUpdateCar,
    handleDeleteCar,
    handleRestoreCar,
    handleAddTicket,
    handleUpdateTicket,
    handleDeleteTicket,
    handleRestoreTicket,
  };
};

