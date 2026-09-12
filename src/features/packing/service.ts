import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../infrastructure/firebase';
import { TodoItem, PlanningState } from './types';
import { CURRENT_SCHEMA_VERSION } from '../../shared/types/schema';

export const packingService = {
  async updatePlanningCategory(
    tripId: string,
    currentPlanning: PlanningState,
    categoryKey: keyof PlanningState,
    items: TodoItem[]
  ): Promise<PlanningState> {
    const updatedPlanning: PlanningState = {
      ...currentPlanning,
      [categoryKey]: items.map(item => ({
        ...item,
        schemaVersion: CURRENT_SCHEMA_VERSION,
      })),
    };

    await updateDoc(doc(db, 'trips', tripId), {
      planning: updatedPlanning,
      schemaVersion: CURRENT_SCHEMA_VERSION,
    });

    return updatedPlanning;
  },

  async toggleTodoItem(
    tripId: string,
    currentPlanning: PlanningState,
    categoryKey: keyof PlanningState,
    itemId: number,
    memberName?: string
  ): Promise<PlanningState> {
    const list = currentPlanning[categoryKey] || [];
    const updatedList = list.map(item => {
      if (item.id !== itemId) return item;

      const newDone = !item.done;
      let completedBy = item.completedBy ? [...item.completedBy] : [];

      if (memberName) {
        if (newDone && !completedBy.includes(memberName)) {
          completedBy.push(memberName);
        } else if (!newDone) {
          completedBy = completedBy.filter(m => m !== memberName);
        }
      }

      return {
        ...item,
        done: newDone,
        completedBy,
        schemaVersion: CURRENT_SCHEMA_VERSION,
      };
    });

    return this.updatePlanningCategory(tripId, currentPlanning, categoryKey, updatedList);
  },
};
