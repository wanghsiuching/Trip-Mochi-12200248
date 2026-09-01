import { useState } from 'react';
import { PocketItem, ScheduleItem, Member } from '../types';
import { addTripItem, updateTripField } from '../services/tripService';

export const usePocketItemsData = (currentTripId: string) => {
  const [pocketItems, setPocketItems] = useState<PocketItem[]>([]);

  const handleAddPocketItem = (item: Omit<PocketItem, 'id' | 'createdAt'>) => {
    const newItem: PocketItem = {
      ...item,
      id: Date.now().toString(),
      createdAt: Date.now(),
    };
    setPocketItems(prev => {
      const next = [...prev, newItem];
      updateTripField(currentTripId, 'pocketItems', next).catch(err => {
        console.error('Failed to add pocket item:', err);
      });
      return next;
    });
  };

  const handleUpdatePocketItem = (updated: PocketItem) => {
    setPocketItems(prev => {
      const next = prev.map(p => p.id === updated.id ? updated : p);
      updateTripField(currentTripId, 'pocketItems', next).catch(err => {
        console.error('Failed to update pocket item:', err);
      });
      return next;
    });
  };

  const handleDeletePocketItem = (id: string) => {
    setPocketItems(prev => {
      const next = prev.filter(p => p.id !== id);
      updateTripField(currentTripId, 'pocketItems', next).catch(err => {
        console.error('Failed to delete pocket item:', err);
      });
      return next;
    });
  };

  const handleAddToScheduleFromPocket = (
    item: PocketItem, 
    targetDate: string, 
    time: string, 
    fallbackDate: string = '', 
    members: Member[] = []
  ) => {
    const newScheduleItem: Omit<ScheduleItem, 'id'> = {
      date: targetDate || fallbackDate,
      time: time || '12:00',
      title: item.title,
      type: item.category === 'food' ? 'food' : 'spot',
      location: item.location || item.title,
      notes: item.notes || '',
      address: item.location,
      googleMapUrl: item.url || (item.location ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.location)}` : undefined),
      spotDetails: {
        hasTicket: false,
        participants: members.map(m => m.id),
        isPotential: false,
      },
    };
    addTripItem(currentTripId, 'scheduleItems', { ...newScheduleItem, id: Date.now().toString() });
    setPocketItems(prev => {
      const next = prev.map(p => p.id === item.id ? { ...p, assignedDate: targetDate } : p);
      updateTripField(currentTripId, 'pocketItems', next).catch(err => {
        console.error('Failed to update assignedDate in pocket:', err);
      });
      return next;
    });
  };

  return {
    pocketItems,
    setPocketItems,
    handleAddPocketItem,
    handleUpdatePocketItem,
    handleDeletePocketItem,
    handleAddToScheduleFromPocket
  };
};
