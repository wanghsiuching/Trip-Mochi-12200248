import { useState } from 'react';
import { BookingFlight, BookingAccommodation, BookingCarRental, BookingTicket } from '../types';
import { addTripItem, updateTripField } from '../services/tripService';
import { activityService } from '../src/features/activity/service';
import { historyService } from '../src/features/history/service';

export const useBookingsData = (currentTripId: string) => {
  const [bookingFlights, setBookingFlights] = useState<BookingFlight[]>([]);
  const [bookingAccommodations, setBookingAccommodations] = useState<BookingAccommodation[]>([]);
  const [bookingCarRentals, setBookingCarRentals] = useState<BookingCarRental[]>([]);
  const [bookingTickets, setBookingTickets] = useState<BookingTicket[]>([]);

  // Flight handlers
  const handleAddFlight = (flight: BookingFlight, actorName: string = '成員') => {
    addTripItem(currentTripId, 'flights', flight);
    activityService.recordActivity(currentTripId, {
      actorName,
      action: 'add_booking',
      entityType: 'booking',
      entityId: String(flight.id),
      summary: `新增了航班「${flight.airline} ${flight.code}」`,
    });
  };

  const handleUpdateFlight = (updated: BookingFlight, actorName: string = '成員') => {
    const before = bookingFlights.find(f => String(f.id) === String(updated.id));
    const updatedList = bookingFlights.map(f => String(f.id) === String(updated.id) ? updated : f);
    setBookingFlights(updatedList);
    updateTripField(currentTripId, 'flights', updatedList);

    if (before) {
      historyService.recordChange(currentTripId, {
        entityType: 'booking',
        entityId: String(updated.id),
        actorName,
        action: 'edit',
        summary: `修改了航班「${updated.airline} ${updated.code}」`,
        before,
        after: updated,
      });
      activityService.recordActivity(currentTripId, {
        actorName,
        action: 'update',
        entityType: 'booking',
        entityId: String(updated.id),
        summary: `修改了航班「${updated.airline} ${updated.code}」`,
      });
    }
  };

  const handleDeleteFlight = (id: number, actorName: string = '成員') => {
    const target = bookingFlights.find(f => String(f.id) === String(id));
    if (!target) return;

    const softDeleted: BookingFlight = {
      ...target,
      deletedAt: Date.now(),
      deletedBy: actorName,
    };
    const updatedList = bookingFlights.map(f => String(f.id) === String(id) ? softDeleted : f);
    setBookingFlights(updatedList);
    updateTripField(currentTripId, 'flights', updatedList);

    historyService.recordChange(currentTripId, {
      entityType: 'booking',
      entityId: String(id),
      actorName,
      action: 'soft_delete',
      summary: `刪除了航班「${target.airline} ${target.code}」`,
      before: target,
      after: softDeleted,
    });
    activityService.recordActivity(currentTripId, {
      actorName,
      action: 'delete',
      entityType: 'booking',
      entityId: String(id),
      summary: `刪除了航班「${target.airline} ${target.code}」`,
    });
  };

  // Accommodation handlers
  const handleAddAccommodation = (a: BookingAccommodation, actorName: string = '成員') => {
    addTripItem(currentTripId, 'accommodations', a);
    activityService.recordActivity(currentTripId, {
      actorName,
      action: 'add_booking',
      entityType: 'booking',
      entityId: String(a.id),
      summary: `新增了住宿「${a.name}」`,
    });
  };

  const handleUpdateAccommodation = (updated: BookingAccommodation, actorName: string = '成員') => {
    const before = bookingAccommodations.find(x => x.id === updated.id);
    const updatedList = bookingAccommodations.map(x => x.id === updated.id ? updated : x);
    setBookingAccommodations(updatedList);
    updateTripField(currentTripId, 'accommodations', updatedList);

    if (before) {
      historyService.recordChange(currentTripId, {
        entityType: 'booking',
        entityId: String(updated.id),
        actorName,
        action: 'edit',
        summary: `修改了住宿「${updated.name}」`,
        before,
        after: updated,
      });
      activityService.recordActivity(currentTripId, {
        actorName,
        action: 'update',
        entityType: 'booking',
        entityId: String(updated.id),
        summary: `修改了住宿「${updated.name}」`,
      });
    }
  };

  const handleDeleteAccommodation = (id: number, actorName: string = '成員') => {
    const target = bookingAccommodations.find(x => x.id === id);
    if (!target) return;

    const softDeleted: BookingAccommodation = {
      ...target,
      deletedAt: Date.now(),
      deletedBy: actorName,
    };
    const updatedList = bookingAccommodations.map(x => x.id === id ? softDeleted : x);
    setBookingAccommodations(updatedList);
    updateTripField(currentTripId, 'accommodations', updatedList);

    historyService.recordChange(currentTripId, {
      entityType: 'booking',
      entityId: String(id),
      actorName,
      action: 'soft_delete',
      summary: `刪除了住宿「${target.name}」`,
      before: target,
      after: softDeleted,
    });
    activityService.recordActivity(currentTripId, {
      actorName,
      action: 'delete',
      entityType: 'booking',
      entityId: String(id),
      summary: `刪除了住宿「${target.name}」`,
    });
  };

  // Car Rental handlers
  const handleAddCar = (car: BookingCarRental, actorName: string = '成員') => {
    addTripItem(currentTripId, 'carRentals', car);
    activityService.recordActivity(currentTripId, {
      actorName,
      action: 'add_booking',
      entityType: 'booking',
      entityId: String(car.id),
      summary: `新增了租車「${car.company} - ${car.carModel}」`,
    });
  };

  const handleUpdateCar = (updated: BookingCarRental, actorName: string = '成員') => {
    const before = bookingCarRentals.find(c => String(c.id) === String(updated.id));
    const updatedList = bookingCarRentals.map(c => String(c.id) === String(updated.id) ? updated : c);
    setBookingCarRentals(updatedList);
    updateTripField(currentTripId, 'carRentals', updatedList);

    if (before) {
      historyService.recordChange(currentTripId, {
        entityType: 'booking',
        entityId: String(updated.id),
        actorName,
        action: 'edit',
        summary: `修改了租車「${updated.company} - ${updated.carModel}」`,
        before,
        after: updated,
      });
      activityService.recordActivity(currentTripId, {
        actorName,
        action: 'update',
        entityType: 'booking',
        entityId: String(updated.id),
        summary: `修改了租車「${updated.company} - ${updated.carModel}」`,
      });
    }
  };

  const handleDeleteCar = (id: number, actorName: string = '成員') => {
    const target = bookingCarRentals.find(c => String(c.id) === String(id));
    if (!target) return;

    const softDeleted: BookingCarRental = {
      ...target,
      deletedAt: Date.now(),
      deletedBy: actorName,
    };
    const updatedList = bookingCarRentals.map(c => String(c.id) === String(id) ? softDeleted : c);
    setBookingCarRentals(updatedList);
    updateTripField(currentTripId, 'carRentals', updatedList);

    historyService.recordChange(currentTripId, {
      entityType: 'booking',
      entityId: String(id),
      actorName,
      action: 'soft_delete',
      summary: `刪除了租車「${target.company} - ${target.carModel}」`,
      before: target,
      after: softDeleted,
    });
    activityService.recordActivity(currentTripId, {
      actorName,
      action: 'delete',
      entityType: 'booking',
      entityId: String(id),
      summary: `刪除了租車「${target.company} - ${target.carModel}」`,
    });
  };

  // Ticket handlers
  const handleAddTicket = (t: BookingTicket, actorName: string = '成員') => {
    addTripItem(currentTripId, 'tickets', t);
    activityService.recordActivity(currentTripId, {
      actorName,
      action: 'add_booking',
      entityType: 'booking',
      entityId: String(t.id),
      summary: `新增了票券「${t.name}」`,
    });
  };

  const handleUpdateTicket = (updated: BookingTicket, actorName: string = '成員') => {
    const before = bookingTickets.find(x => x.id === updated.id);
    const updatedList = bookingTickets.map(x => x.id === updated.id ? updated : x);
    setBookingTickets(updatedList);
    updateTripField(currentTripId, 'tickets', updatedList);

    if (before) {
      historyService.recordChange(currentTripId, {
        entityType: 'booking',
        entityId: String(updated.id),
        actorName,
        action: 'edit',
        summary: `修改了票券「${updated.name}」`,
        before,
        after: updated,
      });
      activityService.recordActivity(currentTripId, {
        actorName,
        action: 'update',
        entityType: 'booking',
        entityId: String(updated.id),
        summary: `修改了票券「${updated.name}」`,
      });
    }
  };

  const handleDeleteTicket = (id: number, actorName: string = '成員') => {
    const target = bookingTickets.find(x => x.id === id);
    if (!target) return;

    const softDeleted: BookingTicket = {
      ...target,
      deletedAt: Date.now(),
      deletedBy: actorName,
    };
    const updatedList = bookingTickets.map(x => x.id === id ? softDeleted : x);
    setBookingTickets(updatedList);
    updateTripField(currentTripId, 'tickets', updatedList);

    historyService.recordChange(currentTripId, {
      entityType: 'booking',
      entityId: String(id),
      actorName,
      action: 'soft_delete',
      summary: `刪除了票券「${target.name}」`,
      before: target,
      after: softDeleted,
    });
    activityService.recordActivity(currentTripId, {
      actorName,
      action: 'delete',
      entityType: 'booking',
      entityId: String(id),
      summary: `刪除了票券「${target.name}」`,
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
