import { VersionedEntity } from '../../shared/types/schema';

export type ActivityAction = 
  | 'create' 
  | 'update' 
  | 'delete' 
  | 'restore' 
  | 'complete' 
  | 'uncomplete' 
  | 'move' 
  | 'copy' 
  | 'add_member' 
  | 'remove_member'
  | 'reorder'
  | 'settle';

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

export interface FieldChange {
  field: string;
  fieldLabel?: string;
  before: any;
  after: any;
}

/**
 * ActivityEvent represents a real-time event log item stored in `trips/{tripId}/activities`
 * It snapshots actor identity (name, avatar) at the moment of modification so that
 * subsequent member edits or deletions do not corrupt historic records.
 */
export interface ActivityEvent extends VersionedEntity {
  id: string;
  tripId: string;
  actorId: string; // Device/local user ID, e.g. "local_xxx"
  actorMemberId?: string; // Associated Member.id if assigned
  actorName: string; // Snapshot of actor display name at action time (e.g. "王小明" or "早期資料")
  actorAvatar?: string | null;
  action: ActivityAction;
  entityType: ActivityEntityType;
  entityId: string;
  summary: string;
  changes?: FieldChange[];
  timestamp: number;
}

// Backward-compatibility alias
export type ActivityLogItem = ActivityEvent;

