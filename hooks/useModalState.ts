import { useState } from 'react';
import { ScheduleItem } from '../types';

export const useModalState = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);
  const [viewingItem, setViewingItem] = useState<ScheduleItem | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deleteModalTarget, setDeleteModalTarget] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isPotentialModalOpen, setIsPotentialModalOpen] = useState(false);
  const [isPocketModalOpen, setIsPocketModalOpen] = useState(false);
  const [pocketInitialTab, setPocketInitialTab] = useState<'food' | 'spot' | 'shopping'>('food');
  const [isEditDayModalOpen, setIsEditDayModalOpen] = useState(false);
  const [isDeleteDayModalOpen, setIsDeleteDayModalOpen] = useState(false);
  const [isBackupConfirmOpen, setIsBackupConfirmOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [highlightExpenseId, setHighlightExpenseId] = useState<string | null>(null);
  const [highlightScheduleItemId, setHighlightScheduleItemId] = useState<string | null>(null);
  const [swappingFromIndex, setSwappingFromIndex] = useState<number | null>(null);
  const [pendingSwapDays, setPendingSwapDays] = useState<{ idx1: number; idx2: number } | null>(null);

  const handleEditClick = (item: ScheduleItem) => {
    setEditingItem(item);
    setIsAddModalOpen(true);
  };

  const handleDeleteItemClick = (itemId: string) => {
    setItemToDelete(itemId);
  };

  return {
    isAddModalOpen,
    setIsAddModalOpen,
    editingItem,
    setEditingItem,
    viewingItem,
    setViewingItem,
    isCreateModalOpen,
    setIsCreateModalOpen,
    deleteModalTarget,
    setDeleteModalTarget,
    itemToDelete,
    setItemToDelete,
    isSettingsModalOpen,
    setIsSettingsModalOpen,
    isPotentialModalOpen,
    setIsPotentialModalOpen,
    isPocketModalOpen,
    setIsPocketModalOpen,
    pocketInitialTab,
    setPocketInitialTab,
    isEditDayModalOpen,
    setIsEditDayModalOpen,
    isDeleteDayModalOpen,
    setIsDeleteDayModalOpen,
    isBackupConfirmOpen,
    setIsBackupConfirmOpen,
    isSearching,
    setIsSearching,
    searchError,
    setSearchError,
    highlightExpenseId,
    setHighlightExpenseId,
    highlightScheduleItemId,
    setHighlightScheduleItemId,
    swappingFromIndex,
    setSwappingFromIndex,
    pendingSwapDays,
    setPendingSwapDays,
    handleEditClick,
    handleDeleteItemClick
  };
};
