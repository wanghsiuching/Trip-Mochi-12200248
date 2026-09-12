import { useCallback } from 'react';
import { PlanningState, TodoItem } from '../types';
import { packingService } from '../service';

export interface UsePackingProps {
  tripId: string;
  planning: PlanningState;
  onPlanningUpdated?: (planning: PlanningState) => void;
}

export function usePacking({
  tripId,
  planning,
  onPlanningUpdated,
}: UsePackingProps) {
  const updateCategory = useCallback(
    async (categoryKey: keyof PlanningState, items: TodoItem[]) => {
      if (!tripId) return;
      const updated = await packingService.updatePlanningCategory(
        tripId,
        planning,
        categoryKey,
        items
      );
      onPlanningUpdated?.(updated);
      return updated;
    },
    [tripId, planning, onPlanningUpdated]
  );

  const toggleItem = useCallback(
    async (categoryKey: keyof PlanningState, itemId: number, memberName?: string) => {
      if (!tripId) return;
      const updated = await packingService.toggleTodoItem(
        tripId,
        planning,
        categoryKey,
        itemId,
        memberName
      );
      onPlanningUpdated?.(updated);
      return updated;
    },
    [tripId, planning, onPlanningUpdated]
  );

  return {
    planning,
    updateCategory,
    toggleItem,
  };
}
