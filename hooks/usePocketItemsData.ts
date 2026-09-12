import { useState } from 'react';
import { PocketItem, ScheduleItem, Member } from '../types';
import { placesService } from '../src/features/places/service';
import { itineraryService } from '../src/features/itinerary/service';
import { activityService } from '../src/features/activity/service';
import { historyService } from '../src/features/history/service';

export const usePocketItemsData = (currentTripId: string) => {
  const [pocketItems, setPocketItems] = useState<PocketItem[]>([]);

  const handleAddPocketItem = async (
    item: Omit<PocketItem, 'id' | 'createdAt'>,
    actorName: string = '成員'
  ): Promise<void> => {
    const saved = await placesService.savePocketItem(currentTripId, item);
    setPocketItems(prev => [saved, ...prev.filter(p => p.id !== saved.id)]);

    activityService.recordActivity(currentTripId, {
      actorName,
      action: 'add_pocket_place',
      entityType: 'pocket',
      entityId: saved.id,
      summary: `新增了口袋名單「${saved.title}」`,
    });
  };

  const handleUpdatePocketItem = async (
    updated: PocketItem,
    actorName: string = '成員'
  ): Promise<void> => {
    const before = pocketItems.find(p => p.id === updated.id);
    const saved = await placesService.savePocketItem(currentTripId, updated);
    setPocketItems(prev => prev.map(p => p.id === saved.id ? saved : p));

    if (before) {
      historyService.recordChange(currentTripId, {
        entityType: 'pocket',
        entityId: updated.id,
        actorName,
        action: 'edit',
        summary: `編輯了口袋名單「${updated.title}」`,
        before,
        after: updated,
      });

      activityService.recordActivity(currentTripId, {
        actorName,
        action: 'update',
        entityType: 'pocket',
        entityId: updated.id,
        summary: `修改了口袋名單「${updated.title}」`,
      });
    }
  };

  const handleDeletePocketItem = (id: string, actorName: string = '成員') => {
    const target = pocketItems.find(p => p.id === id);
    if (!target) return;

    const softDeleted: PocketItem = {
      ...target,
      deletedAt: Date.now(),
      deletedBy: actorName,
    };

    setPocketItems(prev => prev.filter(p => p.id !== id));
    placesService.softDeletePocketItem(currentTripId, id, actorName).catch(err => {
      console.error('Failed to soft-delete pocket item:', err);
    });

    historyService.recordChange(currentTripId, {
      entityType: 'pocket',
      entityId: id,
      actorName,
      action: 'soft_delete',
      summary: `刪除了口袋名單「${target.title}」`,
      before: target,
      after: softDeleted,
    });

    activityService.recordActivity(currentTripId, {
      actorName,
      action: 'delete',
      entityType: 'pocket',
      entityId: id,
      summary: `刪除了口袋名單「${target.title}」`,
    });
  };

  const handleAddToScheduleFromPocket = (
    item: PocketItem, 
    targetDate: string, 
    time: string, 
    fallbackDate: string = '', 
    members: Member[] = [],
    actorName: string = '成員'
  ) => {
    const scheduleDate = targetDate || fallbackDate;
    const newScheduleItem: Partial<ScheduleItem> = {
      id: Date.now().toString(),
      date: scheduleDate,
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

    activityService.recordActivity(currentTripId, {
      actorName,
      action: 'move',
      entityType: 'schedule',
      entityId: newScheduleItem.id!,
      summary: `將口袋名單「${item.title}」排入 ${scheduleDate} 行程`,
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
