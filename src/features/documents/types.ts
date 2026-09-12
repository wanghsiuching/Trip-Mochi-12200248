import { ImageAssetReference } from '../../shared/types/image';
import { VersionedEntity } from '../../shared/types/schema';

export type DocumentCategory = 
  | 'passport'     // 護照
  | 'visa'         // 簽證
  | 'insurance'    // 保險單
  | 'hotel'        // 訂房確認
  | 'ticket'       // 機票/車票憑證
  | 'other'        // 其他文件
  | 'license';     // 相容歷史資料

export interface DocumentComment {
  id: string;
  authorId: string;
  text: string;
  createdAt: string;
}

export interface TravelDocumentV2 extends VersionedEntity {
  id: number | string;
  title: string;
  category: DocumentCategory;
  holder: string;
  docNumber?: string;
  expiryDate?: string;
  issueDate?: string;
  note?: string;
  url?: string;
  imageReferences?: ImageAssetReference[];
  images?: string[]; // Backwards compatibility for UI
  comments?: DocumentComment[];
  createdAt?: number;
}

export type TravelDocument = TravelDocumentV2;
