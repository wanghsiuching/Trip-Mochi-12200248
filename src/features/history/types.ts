import { VersionedEntity } from '../../shared/types/schema';

export type HistoryEntityType = 'schedule' | 'booking' | 'expense' | 'pocket';

export interface ChangedField {
  field: string;
  label: string;
  before: any;
  after: any;
}

export interface HistoryRecord extends VersionedEntity {
  id: string;
  tripId: string;
  entityType: HistoryEntityType;
  entityId: string;
  actorId?: string;
  actorName: string;
  timestamp: number;
  action: 'edit' | 'move' | 'complete' | 'uncomplete' | 'soft_delete' | 'restore';
  summary?: string;
  changedFields: ChangedField[];
  canUndo?: boolean;
  isUndone?: boolean;
}

export interface SoftDeletable {
  deletedAt?: number | null;
  deletedBy?: string | null;
}

// Backward compatibility alias
export interface TripSnapshot extends VersionedEntity {
  id: string;
  tripId: string;
  timestamp: number;
  label: string;
  data: Record<string, any>;
}

export interface HistoryState {
  canUndo: boolean;
  canRedo: boolean;
  historyLength: number;
}
