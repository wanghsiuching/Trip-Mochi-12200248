import { useState } from 'react';
import { TripDay, ScheduleItem } from '../types';
import { 
  saveScheduleItem, 
  deleteScheduleItem, 
  updateTripField, 
  sortScheduleItems, 
  reorderScheduleItems, 
  updateTripDaysAndSchedule,
  updateTripDayDateAndDetails
} from '../services/tripService';
import { activityService } from '../src/features/activity/service';
import { historyService } from '../src/features/history/service';

export const useTripData = (currentTripId: string) => {
  const [tripDays, setTripDays] = useState<TripDay[]>([]);
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);

  const handleSaveItem = async (
    itemData: Omit<ScheduleItem, 'id'>, 
    editingItem: ScheduleItem | null, 
    onSaved?: () => void,
    actorName: string = '成員'
  ): Promise<void> => {
    if (editingItem) {
      const fullItem: ScheduleItem = { 
        ...itemData, 
        id: editingItem.id,
        order: editingItem.order !== undefined ? editingItem.order : 0
      };
      setScheduleItems(prev => sortScheduleItems(prev.map(item => item.id === editingItem.id ? fullItem : item)));
      if (onSaved) onSaved();
      try {
        await saveScheduleItem(currentTripId, fullItem);
        // Record field-level history diff
        historyService.recordChange(currentTripId, {
          entityType: 'schedule',
          entityId: fullItem.id,
          actorName,
          action: 'edit',
          summary: `編輯了行程「${fullItem.title}」`,
          before: editingItem,
          after: fullItem,
        });
        // Record activity log
        activityService.recordActivity(currentTripId, {
          actorName,
          action: 'update',
          entityType: 'schedule',
          entityId: fullItem.id,
          summary: `編輯了行程「${fullItem.title}」(${fullItem.time})`,
        });
      } catch (err) {
        console.error("Failed to save edited schedule item:", err);
        throw err;
      }
    } else {
      const sameDayItems = scheduleItems.filter(i => i.date === itemData.date && !i.deletedAt);
      const nextOrder = sameDayItems.length > 0 
        ? Math.max(...sameDayItems.map(i => (typeof i.order === 'number' ? i.order : 0)), -1) + 1 
        : 0;
      const newItem: ScheduleItem = { 
        ...itemData, 
        id: Date.now().toString(),
        order: nextOrder
      };
      setScheduleItems(prev => sortScheduleItems([...prev, newItem]));
      if (onSaved) onSaved();
      try {
        await saveScheduleItem(currentTripId, newItem);
        activityService.recordActivity(currentTripId, {
          actorName,
          action: 'create',
          entityType: 'schedule',
          entityId: newItem.id,
          summary: `新增了行程「${newItem.title}」(${newItem.time})`,
        });
      } catch (err) {
        console.error("Failed to save new schedule item:", err);
        throw err;
      }
    }
  };

  const confirmDeleteItem = (
    itemToDelete: string | null, 
    onDeleted?: () => void,
    actorName: string = '成員'
  ) => {
    if (!itemToDelete) return;
    const targetId = String(itemToDelete);
    const existing = scheduleItems.find(i => String(i.id) === targetId);
    
    // Soft delete: set deletedAt so it's hidden from normal view and recoverable
    const softDeleted: ScheduleItem = existing 
      ? { ...existing, deletedAt: Date.now(), deletedBy: actorName } 
      : { id: targetId, deletedAt: Date.now(), deletedBy: actorName } as any;

    setScheduleItems(prev => prev.filter(item => String(item.id) !== targetId));
    if (onDeleted) onDeleted();

    // Persist soft delete
    saveScheduleItem(currentTripId, softDeleted).catch(err => {
      console.error("Failed to soft-delete schedule item:", err);
    });

    if (existing) {
      historyService.recordChange(currentTripId, {
        entityType: 'schedule',
        entityId: targetId,
        actorName,
        action: 'soft_delete',
        summary: `刪除了行程「${existing.title || '項目'}」`,
        before: existing,
        after: softDeleted,
      });
      activityService.recordActivity(currentTripId, {
        actorName,
        action: 'delete',
        entityType: 'schedule',
        entityId: targetId,
        summary: `刪除了行程「${existing.title || '項目'}」`,
      });
    }
  };

  const handleMoveItem = (
    index: number, 
    direction: 'up' | 'down', 
    selectedDate: string,
    currentId?: string,
    targetId?: string
  ) => {
    // 1. Separate other days from selected date
    const otherDaysItems = scheduleItems.filter(i => i.date !== selectedDate);
    const currentDayRaw = scheduleItems.filter(i => i.date === selectedDate);
    const currentDayItems = sortScheduleItems(currentDayRaw);

    // 2. Identify target items
    let itemA: ScheduleItem | undefined;
    let itemB: ScheduleItem | undefined;

    if (currentId && targetId) {
      itemA = currentDayItems.find(i => String(i.id) === String(currentId));
      itemB = currentDayItems.find(i => String(i.id) === String(targetId));
    }

    if (!itemA || !itemB) {
      itemA = currentDayItems[index];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      itemB = currentDayItems[targetIndex];
    }

    if (!itemA || !itemB) return;

    const idxA = currentDayItems.findIndex(i => String(i.id) === String(itemA!.id));
    const idxB = currentDayItems.findIndex(i => String(i.id) === String(itemB!.id));

    if (idxA === -1 || idxB === -1 || idxA === idxB) return;

    // 3. Swap in currentDayItems
    const swappedDayItems = [...currentDayItems];
    [swappedDayItems[idxA], swappedDayItems[idxB]] = [swappedDayItems[idxB], swappedDayItems[idxA]];

    // 4. Normalize explicit numeric order (0, 1, 2, 3...) for items on this date
    const normalizedDayItems = swappedDayItems.map((item, orderIdx) => ({
      ...item,
      order: orderIdx
    }));

    // 5. Combine with other days and sort
    const updatedArr = sortScheduleItems([...otherDaysItems, ...normalizedDayItems]);

    // 6. Optimistic state update (zero latency)
    setScheduleItems(updatedArr);

    // 7. Persist only the changed day items order (<1KB network payload)
    const changedItems = normalizedDayItems.map(item => ({
      id: item.id,
      order: item.order ?? 0
    }));
    const fullOrderIds = updatedArr.map(item => String(item.id));
    reorderScheduleItems(currentTripId, changedItems, fullOrderIds).catch(err => {
      console.error("Failed to reorder items in Firestore:", err);
    });

    if (itemA) {
      activityService.recordActivity(currentTripId, {
        actorName: '成員',
        action: 'move',
        entityType: 'schedule',
        entityId: String(itemA.id),
        summary: `調整了行程「${itemA.title}」的順序`,
      });
    }
  };

  const handleAddDay = () => {
    if (tripDays.length === 0) return;
    const sortedByDate = [...tripDays].sort((a, b) => a.date.localeCompare(b.date));
    const latestDay = sortedByDate[sortedByDate.length - 1];
    
    // Find the next available non-conflicting date
    const candidate = new Date(latestDay.date);
    let dateStr = '';
    do {
      candidate.setDate(candidate.getDate() + 1);
      dateStr = candidate.toISOString().split('T')[0];
    } while (tripDays.some(d => d.date === dateStr));
    
    const newDays = [
      ...tripDays, 
      { date: dateStr, location: latestDay.location || '自由行程', fruit: latestDay.fruit || '🍎' }
    ].sort((a, b) => a.date.localeCompare(b.date));

    setTripDays(newDays);
    updateTripField(currentTripId, 'tripDays', newDays).catch(err => console.error(err));
  };

  const confirmDeleteDay = (
    selectedDate: string, 
    onDeleted?: (newSelectedDate: string) => void
  ) => {
    if (tripDays.length > 1) {
      const newDays = tripDays.filter(d => d.date !== selectedDate);
      const newSchedule = scheduleItems.filter(item => item.date !== selectedDate);
      setTripDays(newDays);
      setScheduleItems(newSchedule);
      if (onDeleted) {
        if (!newDays.find(d => d.date === selectedDate)) {
          onDeleted(newDays[0].date);
        }
      }
      updateTripDaysAndSchedule(currentTripId, newDays, newSchedule).catch(err => console.error(err));
    }
  };

  const handleUpdateDayDetails = (
    selectedDate: string, 
    newDate: string, 
    newLoc: string, 
    newFruit: string, 
    onUpdated?: (updatedDate: string) => void
  ) => {
    // Prevent duplicate date collision
    if (newDate !== selectedDate && tripDays.some(d => d.date === newDate)) {
      console.warn('防呆阻擋：已存在該日期卡片', newDate);
      return;
    }
    
    const newDays = tripDays.map(d => 
      d.date === selectedDate ? { ...d, date: newDate, location: newLoc, fruit: newFruit } : d
    ).sort((a, b) => a.date.localeCompare(b.date));

    const newSchedule = scheduleItems.map(item => 
      item.date === selectedDate ? { ...item, date: newDate } : item
    );

    setTripDays(newDays);
    setScheduleItems(newSchedule);
    if (onUpdated) onUpdated(newDate);

    updateTripDayDateAndDetails(
      currentTripId, 
      selectedDate, 
      newDate, 
      newLoc, 
      newFruit, 
      tripDays, 
      scheduleItems
    ).catch(err => console.error('Failed to atomically update trip day details:', err));
  };

  const handleSwapLogic = (
    idx1: number, 
    idx2: number, 
    onSwapped?: (newSelectedDate: string) => void
  ) => {
    if (idx1 === idx2) return;

    const newTripDays = [...tripDays];
    const day1 = { ...newTripDays[idx1] };
    const day2 = { ...newTripDays[idx2] };
    
    const date1 = day1.date;
    const date2 = day2.date;

    // Swap logical contents (locations) but keep the original dates at their respective positions
    newTripDays[idx1] = { ...day2, date: date1 };
    newTripDays[idx2] = { ...day1, date: date2 };

    // Update all schedule items to follow their day contents to the new date
    const updatedScheduleItems = scheduleItems.map(item => {
      if (item.date === date1) return { ...item, date: date2 };
      if (item.date === date2) return { ...item, date: date1 };
      return item;
    });

    // Instant optimistic update (0ms latency for user)
    setTripDays(newTripDays);
    setScheduleItems(updatedScheduleItems);
    
    if (onSwapped) onSwapped(date2);

    if (window.navigator.vibrate) window.navigator.vibrate([30, 50, 30]);

    // Atomic coordinated background update
    updateTripDaysAndSchedule(currentTripId, newTripDays, updatedScheduleItems).catch(err => console.error(err));
  };

  return {
    tripDays,
    setTripDays,
    scheduleItems,
    setScheduleItems,
    handleSaveItem,
    confirmDeleteItem,
    handleMoveItem,
    handleAddDay,
    confirmDeleteDay,
    handleUpdateDayDetails,
    handleSwapLogic
  };
};
