import { useState } from 'react';
import { TripDay, ScheduleItem } from '../types';
import { 
  saveScheduleItem, 
  softDeleteScheduleItem,
  restoreScheduleItem,
  deleteScheduleItem, 
  updateTripField, 
  sortScheduleItems, 
  reorderScheduleItems, 
  updateTripDaysAndSchedule,
  updateTripDayDateAndDetails
} from '../services/tripService';
import { LocalUserIdentity } from '../src/features/collaboration/types';

export const useTripData = (currentTripId: string, currentUser?: LocalUserIdentity | null) => {
  const [tripDays, setTripDays] = useState<TripDay[]>([]);
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);

  const handleSaveItem = async (
    itemData: Omit<ScheduleItem, 'id'>, 
    editingItem: ScheduleItem | null, 
    onSaved?: () => void
  ): Promise<void> => {
    if (editingItem) {
      const fullItem: ScheduleItem = { 
        ...itemData, 
        id: editingItem.id,
        order: editingItem.order !== undefined ? editingItem.order : 0,
        version: editingItem.version,
      };
      setScheduleItems(prev => sortScheduleItems(prev.map(item => item.id === editingItem.id ? fullItem : item)));
      if (onSaved) onSaved();
      try {
        await saveScheduleItem(currentTripId, fullItem, currentUser, editingItem);
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
        await saveScheduleItem(currentTripId, newItem, currentUser);
      } catch (err) {
        console.error("Failed to save new schedule item:", err);
        throw err;
      }
    }
  };

  const confirmDeleteItem = (itemToDelete: string | null, onDeleted?: () => void, itemTitle?: string) => {
    if (!itemToDelete) return;
    const targetId = String(itemToDelete);
    const targetItem = scheduleItems.find(item => String(item.id) === targetId);
    const title = itemTitle || targetItem?.title || '行程項目';
    
    // Optimistic local state update: soft delete
    const now = Date.now();
    setScheduleItems(prev => prev.map(item => {
      if (String(item.id) === targetId) {
        return {
          ...item,
          deletedAt: now,
          deletedBy: currentUser?.userId || 'unknown',
          deletedByMemberId: currentUser?.memberId || null,
        };
      }
      return item;
    }));
    if (onDeleted) onDeleted();

    // Soft delete via tripService
    softDeleteScheduleItem(currentTripId, targetId, currentUser, title).catch(err => {
      console.error("Failed to soft-delete schedule item:", err);
    });
  };

  const handleRestoreItem = async (itemId: string, itemTitle?: string) => {
    const targetId = String(itemId);
    const targetItem = scheduleItems.find(item => String(item.id) === targetId);
    const title = itemTitle || targetItem?.title || '行程項目';

    // Optimistic local state update: restore
    setScheduleItems(prev => prev.map(item => {
      if (String(item.id) === targetId) {
        const { deletedAt, deletedBy, deletedByMemberId, ...rest } = item;
        return rest as ScheduleItem;
      }
      return item;
    }));

    await restoreScheduleItem(currentTripId, targetId, currentUser, title);
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
    handleRestoreItem,
    handleMoveItem,
    handleAddDay,
    confirmDeleteDay,
    handleUpdateDayDetails,
    handleSwapLogic
  };
};
