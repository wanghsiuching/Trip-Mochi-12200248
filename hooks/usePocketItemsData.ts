import { useState } from 'react';
import { PocketItem, ScheduleItem, Member } from '../types';
import { placesService } from '../src/features/places/service';
import { itineraryService } from '../src/features/itinerary/service';

export const usePocketItemsData = (currentTripId: string) => {
  const [pocketItems, setPocketItems] = useState<PocketItem[]>([]);

  const handleAddPocketItem = async (item: Omit<PocketItem, 'id' | 'createdAt'>): Promise<void> => {
    const saved = await placesService.savePocketItem(currentTripId, item);
    setPocketItems(prev => [saved, ...prev.filter(p => p.id !== saved.id)]);
  };

  const handleUpdatePocketItem = async (updated: PocketItem): Promise<void> => {
    const saved = await placesService.savePocketItem(currentTripId, updated);
    setPocketItems(prev => prev.map(p => p.id === saved.id ? saved : p));
  };

  const handleDeletePocketItem = (id: string) => {
    setPocketItems(prev => prev.filter(p => p.id !== id));
    placesService.deletePocketItem(currentTripId, id).catch(err => {
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
    const newScheduleItem: Partial<ScheduleItem> = {
      id: Date.now().toString(),
      date: targetDate || fallbackDate,
      time: time || '12:00',
      title: item.title,
      type: item.category === 'food' ? 'food' : 'spot',
      location: item.location || (item as any).address || item.title,
      notes: item.notes || (item as any).note || '',
      address: item.location || (item as any).address,
      googleMapUrl: item.url || (item as any).googleMapUrl || ((item.location || (item as any).address) ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.location || (item as any).address)}` : undefined),
      spotDetails: {
        hasTicket: false,
        participants: members.map(m => m.id),
        isPotential: false,
      },
      order: Date.now(),
    };
    
    itineraryService.saveScheduleItem(currentTripId, newScheduleItem).catch(err => {
      console.error('Failed to add schedule item from pocket:', err);
    });

    const updatedPocket: PocketItem = { ...item, assignedDate: targetDate };
    setPocketItems(prev => prev.map(p => p.id === item.id ? updatedPocket : p));
    placesService.savePocketItem(currentTripId, updatedPocket).catch(err => {
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
