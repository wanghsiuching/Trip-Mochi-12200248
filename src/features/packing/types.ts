import { VersionedEntity } from '../../shared/types/schema';

export interface PackingComment {
  id: string;
  authorId: string;
  text: string;
  createdAt: string;
}

export interface TodoItemV2 extends VersionedEntity {
  id: number;
  text: string;
  done: boolean;
  assignee: string | string[];
  completedBy?: string[];
  note?: string;
  url?: string;
  comments?: PackingComment[];
  category?: string;
}

export type TodoItem = TodoItemV2;

export interface PlanningState {
  todo: TodoItem[];
  packing: TodoItem[];
  wish: TodoItem[];
  shopping: TodoItem[];
}
