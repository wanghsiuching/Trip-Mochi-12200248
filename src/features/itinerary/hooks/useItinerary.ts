import { useState, useMemo, useCallback } from 'react';
import { ScheduleItem } from '../types';
import { itineraryService } from '../service';

export interface UseItineraryProps {
  tripId: string;
  items: ScheduleItem[];
  currentDate?: string;
  onItemUpdated?: (item: ScheduleItem) => void;
  onItemDeleted?: (itemId: string) => void;
}

export function useItinerary({
  tripId,
  items,
  currentDate,
  onItemUpdated,
  onItemDeleted,
}: UseItineraryProps) {
  const [selectedDate, setSelectedDate] = useState<string>(currentDate || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Normalize all schedule items via V2 migration adapter
  const normalizedItems = useMemo(() => {
    return items.map(itineraryService.normalize);
  }, [items]);

  // Filter items for current selected date
  const dateItems = useMemo(() => {
    if (!selectedDate) return normalizedItems;
    return normalizedItems.filter(item => item.date === selectedDate);
  }, [normalizedItems, selectedDate]);

  const handleSaveItem = useCallback(
    async (itemData: Partial<ScheduleItem>, newFiles: File[] = []) => {
      if (!tripId) return;
      setIsSaving(true);
      setError(null);
      try {
        const saved = await itineraryService.saveScheduleItem(tripId, itemData, newFiles);
        onItemUpdated?.(saved);
        return saved;
      } catch (err: any) {
        setError(err.message || '儲存行程失敗');
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [tripId, onItemUpdated]
  );

  const handleDeleteItem = useCallback(
    async (itemId: string) => {
      if (!tripId) return;
      setIsSaving(true);
      setError(null);
      try {
        await itineraryService.deleteScheduleItem(tripId, itemId);
        onItemDeleted?.(itemId);
      } catch (err: any) {
        setError(err.message || '刪除行程失敗');
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [tripId, onItemDeleted]
  );

  const handleReorder = useCallback(
    async (reorderedItems: ScheduleItem[]) => {
      if (!tripId) return;
      try {
        await itineraryService.reorderScheduleItems(tripId, reorderedItems);
      } catch (err: any) {
        console.warn('Failed to persist reordered schedule:', err);
      }
    },
    [tripId]
  );

  return {
    selectedDate,
    setSelectedDate,
    normalizedItems,
    dateItems,
    isSaving,
    error,
    saveItem: handleSaveItem,
    deleteItem: handleDeleteItem,
    reorderItems: handleReorder,
  };
}
