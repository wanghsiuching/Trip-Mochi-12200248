import { ImageAssetReference } from '../../shared/types/image';
import { VersionedEntity } from '../../shared/types/schema';

export type PocketCategory = 'food' | 'spot' | 'shopping';

export interface PocketItemV2 extends VersionedEntity {
  id: string;
  category: PocketCategory;
  title: string;
  location?: string;
  url?: string;
  notes?: string;
  tag?: string;
  rating?: number;
  priceRange?: string;
  assignedDate?: string;
  isVisited?: boolean;
  imageReferences?: ImageAssetReference[];
  images?: string[]; // Backwards compatibility for UI
  createdAt?: number;
}

export type PocketItem = PocketItemV2;

export interface PocketFilterState {
  activeTab: 'all' | PocketCategory;
  searchQuery: string;
  selectedTag: string;
  filterVisited: 'all' | 'unvisited' | 'visited';
  pageSize: number;
  currentPage: number;
}
