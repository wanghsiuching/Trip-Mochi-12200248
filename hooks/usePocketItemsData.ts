import { useState } from 'react';
import { PocketItem, ScheduleItem, Member } from '../types';
import { placesService } from '../src/features/places/service';
import { itineraryService } from '../src/features/itinerary/service';
import { softDeletePocketItem, restorePocketItem, savePocketItem } from '../services/tripService';
import { LocalUserIdentity } from '../src/features/collaboration/types';

export const usePocketItemsData = (currentTripId: string, currentUser?: LocalUserIdentity | null) => {
  const [pocketItems, setPocketItems] = useState<PocketItem[]>([]);

  const handleAddPocketItem = async (item: Omit<PocketItem, 'id' | 'createdAt'>): Promise<void> => {
    const newItem: PocketItem = {
      ...item,
      id: Date.now().toString(),
      createdAt: Date.now(),
    };
    setPocketItems(prev => [newItem, ...prev.filter(p => p.id !== newItem.id)]);
    await savePocketItem(currentTripId, newItem, currentUser);
  };

  const handleUpdatePocketItem = async (updated: PocketItem, prevItem?: PocketItem): Promise<void> => {
    setPocketItems(prev => prev.map(p => p.id === updated.id ? updated : p));
    await savePocketItem(currentTripId, updated, currentUser, prevItem);
  };

  const handleDeletePocketItem = (id: string) => {
    const pocket = pocketItems.find(p => p.id === id);
    const title = pocket?.title || '口袋名單地點';
    const now = Date.now();
    setPocketItems(prev => prev.map(p => p.id === id ? { ...p, deletedAt: now, deletedBy: currentUser?.userId || 'unknown' } : p));
    softDeletePocketItem(currentTripId, id, currentUser, title).catch(err => {
      console.error('Failed to soft-delete pocket item:', err);
    });
  };

  const handleRestorePocketItem = async (id: string) => {
    const pocket = pocketItems.find(p => p.id === id);
    const title = pocket?.title || '口袋名單地點';
    setPocketItems(prev => prev.map(p => {
      if (p.id === id) {
        const { deletedAt, deletedBy, deletedByMemberId, ...rest } = p as any;
        return rest;
      }
      return p;
    }));
    await restorePocketItem(currentTripId, id, currentUser, title);
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
    savePocketItem(currentTripId, updatedPocket, currentUser, item).catch(err => {
      console.error('Failed to update assignedDate in pocket:', err);
    });
  };

  return {
    pocketItems,
    setPocketItems,
    handleAddPocketItem,
    handleUpdatePocketItem,
    handleDeletePocketItem,
    handleRestorePocketItem,
    handleAddToScheduleFromPocket
  };
};

