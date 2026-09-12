import { VersionedEntity } from '../../shared/types/schema';

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
