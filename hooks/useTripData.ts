import { useState } from 'react';
import { TripDay, ScheduleItem } from '../types';
import { saveScheduleItem, deleteScheduleItem, updateTripField } from '../services/tripService';

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
      setScheduleItems(prev => prev.map(item => item.id === editingItem.id ? fullItem : item));
      if (onSaved) onSaved();
      saveScheduleItem(currentTripId, fullItem).catch(err => {
        console.error("Failed to save edited schedule item:", err);
      });
    } else {
      const nextOrder = scheduleItems.length > 0 
        ? Math.max(...scheduleItems.map(i => (typeof i.order === 'number' ? i.order : 0)), 0) + 1 
        : 0;
      const newItem: ScheduleItem = { 
        ...itemData, 
        id: Date.now().toString(),
        order: nextOrder
      };
      setScheduleItems(prev => [...prev, newItem]);
      if (onSaved) onSaved();
      saveScheduleItem(currentTripId, newItem).catch(err => {
        console.error("Failed to save new schedule item:", err);
      });
    }
  };

  const confirmDeleteItem = (itemToDelete: string | null, onDeleted?: () => void) => {
    if (itemToDelete) {
      setScheduleItems(prev => {
        const filtered = prev.filter(item => item.id !== itemToDelete);
        const updated = filtered.map((item, idx) => ({ ...item, order: idx }));
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

  const handleMoveItem = (index: number, direction: 'up' | 'down', selectedDate: string) => {
    setScheduleItems(prevSchedule => {
      // 1. Get current day items sorted strictly by order/time
      const dayItems = prevSchedule
        .filter(i => i.date === selectedDate)
        .sort((a, b) => {
          const orderA = typeof a.order === 'number' ? a.order : 999999;
          const orderB = typeof b.order === 'number' ? b.order : 999999;
          if (orderA !== orderB) return orderA - orderB;
          return (a.time || '').localeCompare(b.time || '');
        });

      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (index < 0 || index >= dayItems.length || targetIndex < 0 || targetIndex >= dayItems.length) {
        return prevSchedule;
      }

      // 2. Swap items in the sorted day array
      const newDayItems = [...dayItems];
      const temp = newDayItems[index];
      newDayItems[index] = newDayItems[targetIndex];
      newDayItems[targetIndex] = temp;

      // 3. Rebuild complete schedule with chronological dates and cleanly ordered items
      const otherDaysItems = prevSchedule.filter(i => i.date !== selectedDate);
      const allDates = Array.from(new Set(prevSchedule.map(i => i.date))).sort();
      if (!allDates.includes(selectedDate)) allDates.push(selectedDate);

      const fullReordered: ScheduleItem[] = [];
      for (const d of allDates) {
        if (d === selectedDate) {
          fullReordered.push(...newDayItems);
        } else {
          const dItems = otherDaysItems
            .filter(i => i.date === d)
            .sort((a, b) => (a.order ?? 999999) - (b.order ?? 999999));
          fullReordered.push(...dItems);
        }
      }

      // 4. Assign sequential clean order index to all items
      const finalUpdated = fullReordered.map((item, idx) => ({
        ...item,
        order: idx
      }));

      // 5. Persist to Firestore atomically
      updateTripField(currentTripId, 'scheduleItems', finalUpdated).catch(err => {
        console.error("Failed to reorder items:", err);
      });

      return finalUpdated;
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
