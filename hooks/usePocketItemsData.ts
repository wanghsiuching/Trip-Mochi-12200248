import { useState } from 'react';
import { PocketItem, ScheduleItem, Member } from '../types';
import { savePocketItem, deletePocketItem, saveScheduleItem } from '../services/tripService';

export const usePocketItemsData = (currentTripId: string) => {
  const [pocketItems, setPocketItems] = useState<PocketItem[]>([]);

  const handleAddPocketItem = (item: Omit<PocketItem, 'id' | 'createdAt'>) => {
    const newItem: PocketItem = {
      ...item,
      id: Date.now().toString(),
      createdAt: Date.now(),
    };
    setPocketItems(prev => [newItem, ...prev.filter(p => p.id !== newItem.id)]);
    savePocketItem(currentTripId, newItem).catch(err => {
      console.error('Failed to add pocket item:', err);
    });
  };

  const handleUpdatePocketItem = (updated: PocketItem) => {
    setPocketItems(prev => prev.map(p => p.id === updated.id ? updated : p));
    savePocketItem(currentTripId, updated).catch(err => {
      console.error('Failed to update pocket item:', err);
    });
  };

  const handleDeletePocketItem = (id: string) => {
    setPocketItems(prev => prev.filter(p => p.id !== id));
    deletePocketItem(currentTripId, id).catch(err => {
      console.error('Failed to delete pocket item:', err);
    });
  };

  const handleAddToScheduleFromPocket = (
    item: PocketItem, 
    targetDate: string, 
    time: string, 
    fallbackDate: string = '', 
    members: Member[] = []
  ) => {
    const newScheduleItem: ScheduleItem = {
      id: Date.now().toString(),
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
      order: Date.now(),
    };
    saveScheduleItem(currentTripId, newScheduleItem).catch(err => {
      console.error('Failed to add schedule item from pocket:', err);
    });

    const updatedPocket: PocketItem = { ...item, assignedDate: targetDate };
    setPocketItems(prev => prev.map(p => p.id === item.id ? updatedPocket : p));
    savePocketItem(currentTripId, updatedPocket).catch(err => {
      console.error('Failed to update assignedDate in pocket:', err);
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
