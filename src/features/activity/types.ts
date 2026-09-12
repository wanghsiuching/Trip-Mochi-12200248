import { VersionedEntity } from '../../shared/types/schema';

export type ActivityAction = 'create' | 'update' | 'delete' | 'reorder' | 'settle';

export interface ActivityLogItem extends VersionedEntity {
  id: string;
  tripId: string;
  domain: string;
  action: ActivityAction;
  title: string;
  author: string;
  timestamp: number;
  metadata?: Record<string, any>;
}
