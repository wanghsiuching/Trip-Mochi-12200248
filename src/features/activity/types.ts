import { VersionedEntity } from '../../shared/types/schema';

export type ActivityAction = 
  | 'create'
  | 'update'
  | 'delete'
  | 'complete'
  | 'uncomplete'
  | 'move'
  | 'copy'
  | 'add_member'
  | 'remove_member'
  | 'add_expense'
  | 'add_booking'
  | 'add_document'
  | 'add_pocket_place';

export type ActivityEntityType = 
  | 'schedule'
  | 'booking'
  | 'expense'
  | 'pocket'
  | 'document'
  | 'journal'
  | 'packing'
  | 'member'
  | 'trip';

export interface ActivityEvent extends VersionedEntity {
  id: string;
  tripId: string;
  actorId?: string;
  actorName: string;
  actorAvatar?: string | null;
  action: ActivityAction;
  entityType: ActivityEntityType;
  entityId: string;
  timestamp: number;
  summary: string;
  metadata?: Record<string, any>;
}

// Backward compatibility alias
export type ActivityLogItem = ActivityEvent;
