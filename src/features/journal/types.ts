import { ImageAssetReference } from '../../shared/types/image';
import { VersionedEntity } from '../../shared/types/schema';

export interface JournalComment {
  id: string;
  authorId: string;
  text: string;
  createdAt: string;
}

export interface JournalV2 extends VersionedEntity {
  id: number;
  date: string;
  author: string;
  content: string;
  imageReferences?: ImageAssetReference[];
  photos: string[]; // Backwards compatibility
  images?: string[]; // Backwards compatibility
  comments?: JournalComment[];
}

export type Journal = JournalV2;
