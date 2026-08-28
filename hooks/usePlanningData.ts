import { useState } from 'react';
import { TodoItem, TravelDocument, Member } from '../types';
import { updateTripField } from '../services/tripService';

export interface PlanningListsState {
  todo: TodoItem[];
  packing: TodoItem[];
  wish: TodoItem[];
  shopping: TodoItem[];
  documents?: TravelDocument[];
}

export const usePlanningData = (currentTripId: string, members: Member[] = []) => {
  const [planningLists, setPlanningLists] = useState<PlanningListsState>({ 
    todo: [], 
    packing: [], 
    wish: [], 
    shopping: [], 
    documents: [] 
  });

  const handleAddPlanning = (
    type: 'todo' | 'packing' | 'wish' | 'shopping', 
    text: string, 
    assignee: string | string[], 
    image?: string, 
    note?: string, 
    url?: string, 
    category?: string
  ) => {
    const newItem = { id: Date.now(), text, assignee, completedBy: [], done: false, image, note, url, category };
    const currentList = planningLists[type] || [];
    const newLists = { ...planningLists, [type]: [...currentList, newItem] };
    setPlanningLists(newLists);
    updateTripField(currentTripId, 'planning', newLists);
  };

  const handleTogglePlanning = (
    type: 'todo' | 'packing' | 'wish' | 'shopping', 
    id: number, 
    memberName?: string
  ) => {
    const currentList = planningLists[type] || [];
    const newLists = { 
      ...planningLists, 
      [type]: currentList.map(item => { 
        if (item.id !== id) return item; 
        if (type === 'todo' && (item.assignee === '全體' || (Array.isArray(item.assignee) && item.assignee.length > 1))) { 
          if (!memberName) return item; 
          const currentCompleted = item.completedBy || []; 
          const newCompleted = currentCompleted.includes(memberName) 
            ? currentCompleted.filter(m => m !== memberName) 
            : [...currentCompleted, memberName]; 
          let targets: string[] = []; 
          if (item.assignee === '全體') targets = members.map(m => m.name); 
          else if (Array.isArray(item.assignee)) targets = item.assignee; 
          else targets = [item.assignee as string]; 
          const allDone = targets.every(t => newCompleted.includes(t)); 
          return { ...item, completedBy: newCompleted, done: allDone }; 
        } else { 
          return { ...item, done: !item.done }; 
        } 
      }) 
    };
    setPlanningLists(newLists);
    updateTripField(currentTripId, 'planning', newLists);
  };

  const handleUpdatePlanning = (
    type: 'todo' | 'packing' | 'wish' | 'shopping', 
    id: number, 
    updates: Partial<TodoItem>
  ) => {
    const currentList = planningLists[type] || [];
    const newLists = { 
      ...planningLists, 
      [type]: currentList.map(item => item.id === id ? { ...item, ...updates } : item) 
    };
    setPlanningLists(newLists);
    updateTripField(currentTripId, 'planning', newLists);
  };

  const handleDeletePlanning = (
    type: 'todo' | 'packing' | 'wish' | 'shopping', 
    id: number
  ) => {
    const currentList = planningLists[type] || [];
    const newLists = { 
      ...planningLists, 
      [type]: currentList.filter(item => item.id !== id) 
    };
    setPlanningLists(newLists);
    updateTripField(currentTripId, 'planning', newLists);
  };

  const handleAddDocument = (newDoc: Omit<TravelDocument, 'id' | 'createdAt'>) => {
    const docWithId: TravelDocument = {
      ...newDoc,
      id: Date.now().toString(),
      createdAt: Date.now(),
    };
    const updatedDocs = [...(planningLists.documents || []), docWithId];
    const newPlanning = { ...planningLists, documents: updatedDocs };
    setPlanningLists(newPlanning);
    updateTripField(currentTripId, 'planning', newPlanning);
  };

  const handleUpdateDocument = (id: string | number, updates: Partial<TravelDocument>) => {
    const updatedDocs = (planningLists.documents || []).map(d => String(d.id) === String(id) ? { ...d, ...updates } : d);
    const newPlanning = { ...planningLists, documents: updatedDocs };
    setPlanningLists(newPlanning);
    updateTripField(currentTripId, 'planning', newPlanning);
  };

  const handleDeleteDocument = (id: string | number) => {
    const updatedDocs = (planningLists.documents || []).filter(d => String(d.id) !== String(id));
    const newPlanning = { ...planningLists, documents: updatedDocs };
    setPlanningLists(newPlanning);
    updateTripField(currentTripId, 'planning', newPlanning);
  };

  return {
    planningLists,
    setPlanningLists,
    handleAddPlanning,
    handleTogglePlanning,
    handleUpdatePlanning,
    handleDeletePlanning,
    handleAddDocument,
    handleUpdateDocument,
    handleDeleteDocument
  };
};
