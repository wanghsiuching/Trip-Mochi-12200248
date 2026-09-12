import { useState, useMemo, useCallback } from 'react';
import { PocketItem, PocketCategory } from '../types';
import { placesService } from '../service';

export interface UsePocketPlacesProps {
  tripId: string;
  items: PocketItem[];
  onItemUpdated?: (item: PocketItem) => void;
  onItemDeleted?: (itemId: string) => void;
}

export function usePocketPlaces({
  tripId,
  items,
  onItemUpdated,
  onItemDeleted,
}: UsePocketPlacesProps) {
  const [activeTab, setActiveTab] = useState<'all' | PocketCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('全部');
  const [filterVisited, setFilterVisited] = useState<'all' | 'unvisited' | 'visited'>('all');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Normalize items via Schema V2 adapter
  const normalizedItems = useMemo(() => {
    return items.map(placesService.normalize);
  }, [items]);

  // Tags list
  const availableTags = useMemo(() => {
    const set = new Set<string>();
    normalizedItems.forEach(item => {
      if (item.tag && item.tag.trim()) {
        set.add(item.tag.trim());
      }
    });
    return ['全部', ...Array.from(set)];
  }, [normalizedItems]);

  // Filter items
  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return normalizedItems.filter(item => {
      if (activeTab !== 'all') {
        const cat = item.category || 'spot';
        if (activeTab !== cat) return false;
      }

      if (filterVisited === 'visited' && !item.isVisited) return false;
      if (filterVisited === 'unvisited' && item.isVisited) return false;

      if (selectedTag !== '全部' && item.tag !== selectedTag) return false;

      if (q) {
        const matches =
          (item.title && item.title.toLowerCase().includes(q)) ||
          (item.location && item.location.toLowerCase().includes(q)) ||
          (item.notes && item.notes.toLowerCase().includes(q)) ||
          (item.tag && item.tag.toLowerCase().includes(q)) ||
          (item.priceRange && item.priceRange.toLowerCase().includes(q));
        if (!matches) return false;
      }

      return true;
    });
  }, [normalizedItems, activeTab, filterVisited, selectedTag, searchQuery]);

  // Handlers
  const handleSave = useCallback(
    async (itemData: Partial<PocketItem>, newFiles: File[] = []) => {
      if (!tripId) return;
      setIsSaving(true);
      setError(null);
      try {
        const saved = await placesService.savePocketItem(tripId, itemData, newFiles);
        onItemUpdated?.(saved);
        return saved;
      } catch (err: any) {
        setError(err.message || '儲存失敗');
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [tripId, onItemUpdated]
  );

  const handleDelete = useCallback(
    async (itemId: string) => {
      if (!tripId) return;
      setIsSaving(true);
      setError(null);
      try {
        await placesService.deletePocketItem(tripId, itemId);
        onItemDeleted?.(itemId);
      } catch (err: any) {
        setError(err.message || '刪除失敗');
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [tripId, onItemDeleted]
  );

  const handleToggleVisited = useCallback(
    async (item: PocketItem) => {
      if (!tripId) return;
      try {
        await placesService.toggleVisited(tripId, item);
      } catch (err: any) {
        console.warn('Failed to toggle visited:', err);
      }
    },
    [tripId]
  );

  return {
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    selectedTag,
    setSelectedTag,
    filterVisited,
    setFilterVisited,
    availableTags,
    filteredItems,
    isSaving,
    error,
    saveItem: handleSave,
    deleteItem: handleDelete,
    toggleVisited: handleToggleVisited,
  };
}
