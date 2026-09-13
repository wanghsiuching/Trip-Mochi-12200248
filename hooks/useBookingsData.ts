import { useState } from 'react';
import { BookingFlight, BookingAccommodation, BookingCarRental, BookingTicket } from '../types';
import { addTripItem, updateTripField } from '../services/tripService';

export const useBookingsData = (currentTripId: string) => {
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
    updateTripField(currentTripId, 'flights', bookingFlights.filter(f => String(f.id) !== String(id)));
  };

  // Accommodation handlers
  const handleAddAccommodation = (a: BookingAccommodation) => {
    addTripItem(currentTripId, 'accommodations', a);
  };
  const handleUpdateAccommodation = (a: BookingAccommodation) => {
    updateTripField(currentTripId, 'accommodations', bookingAccommodations.map(x => x.id === a.id ? a : x));
  };
  const handleDeleteAccommodation = (id: number) => {
    updateTripField(currentTripId, 'accommodations', bookingAccommodations.filter(x => x.id !== id));
  };

  // Car Rental handlers
  const handleAddCar = (car: BookingCarRental) => {
    addTripItem(currentTripId, 'carRentals', car);
  };
  const handleUpdateCar = (updated: BookingCarRental) => {
    updateTripField(currentTripId, 'carRentals', bookingCarRentals.map(c => String(c.id) === String(updated.id) ? updated : c));
  };
  const handleDeleteCar = (id: number) => {
    updateTripField(currentTripId, 'carRentals', bookingCarRentals.filter(c => String(c.id) !== String(id)));
  };

  // Ticket handlers
  const handleAddTicket = (t: BookingTicket) => {
    addTripItem(currentTripId, 'tickets', t);
  };
  const handleUpdateTicket = (t: BookingTicket) => {
    updateTripField(currentTripId, 'tickets', bookingTickets.map(x => x.id === t.id ? t : x));
  };
  const handleDeleteTicket = (id: number) => {
    updateTripField(currentTripId, 'tickets', bookingTickets.filter(x => x.id !== id));
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
    handleAddAccommodation,
    handleUpdateAccommodation,
    handleDeleteAccommodation,
    handleAddCar,
    handleUpdateCar,
    handleDeleteCar,
    handleAddTicket,
    handleUpdateTicket,
    handleDeleteTicket
  };
};
