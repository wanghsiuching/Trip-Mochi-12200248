import { useState } from 'react';
import { TripDay, ScheduleItem } from '../types';
import { saveScheduleItem, deleteScheduleItem, updateTripField, sortScheduleItems } from '../services/tripService';

export const useTripData = (currentTripId: string) => {
  const [tripDays, setTripDays] = useState<TripDay[]>([]);
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);

  const handleSaveItem = (
    itemData: Omit<ScheduleItem, 'id'>, 
    editingItem: ScheduleItem | null, 
    onSaved?: () => void
  ) => {
    if (editingItem) {
      const fullItem: ScheduleItem = { 
        ...itemData, 
        id: editingItem.id,
        order: editingItem.order !== undefined ? editingItem.order : 0
      };
      setScheduleItems(prev => sortScheduleItems(prev.map(item => item.id === editingItem.id ? fullItem : item)));
      if (onSaved) onSaved();
      saveScheduleItem(currentTripId, fullItem).catch(err => {
        console.error("Failed to save edited schedule item:", err);
      });
    } else {
      const sameDayItems = scheduleItems.filter(i => i.date === itemData.date);
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
      saveScheduleItem(currentTripId, newItem).catch(err => {
        console.error("Failed to save new schedule item:", err);
      });
    }
  };

  const confirmDeleteItem = (itemToDelete: string | null, onDeleted?: () => void) => {
    if (itemToDelete) {
      setScheduleItems(prev => {
        const itemToRemove = prev.find(i => String(i.id) === String(itemToDelete));
        const filtered = prev.filter(item => String(item.id) !== String(itemToDelete));
        let updated: ScheduleItem[];
        if (itemToRemove) {
          const sameDayItems = filtered.filter(i => i.date === itemToRemove.date);
          const normalizedSameDay = sortScheduleItems(sameDayItems).map((item, idx) => ({ ...item, order: idx }));
          const otherDays = filtered.filter(i => i.date !== itemToRemove.date);
          updated = sortScheduleItems([...otherDays, ...normalizedSameDay]);
        } else {
          updated = sortScheduleItems(filtered);
        }
        updateTripField(currentTripId, 'scheduleItems', updated).catch(err => {
          console.error("Failed to sync reindexed schedule items after delete:", err);
        });
        return updated;
      });
      if (onDeleted) onDeleted();
      deleteScheduleItem(currentTripId, itemToDelete).catch(err => {
        console.error("Failed to delete schedule item:", err);
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
    setScheduleItems(prevSchedule => {
      // 1. Separate items of other days from items of selected date
      const otherDaysItems = prevSchedule.filter(i => i.date !== selectedDate);
      const currentDayRaw = prevSchedule.filter(i => i.date === selectedDate);
      const currentDayItems = sortScheduleItems(currentDayRaw);

      // 2. Identify the two items to swap (by ID if provided, otherwise by index)
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

      if (!itemA || !itemB) return prevSchedule;

      const idxA = currentDayItems.findIndex(i => String(i.id) === String(itemA!.id));
      const idxB = currentDayItems.findIndex(i => String(i.id) === String(itemB!.id));

      if (idxA === -1 || idxB === -1 || idxA === idxB) return prevSchedule;

      // 3. Swap in currentDayItems
      const swappedDayItems = [...currentDayItems];
      [swappedDayItems[idxA], swappedDayItems[idxB]] = [swappedDayItems[idxB], swappedDayItems[idxA]];

      // 4. Normalize explicit numeric order (0, 1, 2, 3...) for all items on this date
      const normalizedDayItems = swappedDayItems.map((item, orderIdx) => ({
        ...item,
        order: orderIdx
      }));

      // 5. Combine with other days and sort globally
      const updatedArr = sortScheduleItems([...otherDaysItems, ...normalizedDayItems]);

      // 6. Persist to Firestore
      updateTripField(currentTripId, 'scheduleItems', updatedArr).catch(err => {
        console.error("Failed to reorder items in Firestore:", err);
      });

      return updatedArr;
    });
  };

  const handleAddDay = () => {
    if (tripDays.length === 0) return;
    const sortedByDate = [...tripDays].sort((a, b) => a.date.localeCompare(b.date));
    const latestDay = sortedByDate[sortedByDate.length - 1];
    const nextDate = new Date(latestDay.date);
    nextDate.setDate(nextDate.getDate() + 1);
    const dateStr = nextDate.toISOString().split('T')[0];
    
    if (tripDays.some(d => d.date === dateStr)) {
      alert('日期重複：' + dateStr + ' 已存在於行程中！');
      return;
    }
    
    const newDays = [
      ...tripDays, 
      { date: dateStr, location: latestDay.location, fruit: latestDay.fruit }
    ];
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
      updateTripField(currentTripId, 'tripDays', newDays).catch(err => console.error(err));
      updateTripField(currentTripId, 'scheduleItems', newSchedule).catch(err => console.error(err));
    }
  };

  const handleUpdateDayDetails = (
    selectedDate: string, 
    newDate: string, 
    newLoc: string, 
    newFruit: string, 
    onUpdated?: () => void
  ) => {
    if (newDate !== selectedDate && tripDays.some(d => d.date === newDate)) {
      alert('日期重複：' + newDate + ' 已存在於行程中！');
      return;
    }
    const newDays = tripDays.map(d => d.date === selectedDate ? { date: newDate, location: newLoc, fruit: newFruit } : d);
    const newSchedule = scheduleItems.map(item => item.date === selectedDate ? { ...item, date: newDate } : item);
    setTripDays(newDays);
    setScheduleItems(newSchedule);
    if (onUpdated) onUpdated();
    updateTripField(currentTripId, 'tripDays', newDays).catch(err => console.error(err));
    updateTripField(currentTripId, 'scheduleItems', newSchedule).catch(err => console.error(err));
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

    // Atomic fast background update via writeBatch
    updateTripField(currentTripId, 'tripDays', newTripDays).catch(err => console.error(err));
    updateTripField(currentTripId, 'scheduleItems', updatedScheduleItems).catch(err => console.error(err));
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
