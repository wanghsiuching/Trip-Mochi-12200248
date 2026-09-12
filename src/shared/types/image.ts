/**
 * Unified Image Model (Schema V2)
 * Eliminates fragmented `image`, `images`, `photos` data inconsistencies.
 */

export interface ImageAsset {
  id: string;
  storagePath: string;
  downloadUrl: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  size?: number;
  mimeType?: string;
  createdAt: number;
  uploadedBy?: string;
}

export interface ImageAssetReference {
  id: string;
  storagePath?: string;
  downloadUrl: string;
  thumbnailUrl?: string;
  caption?: string;
  width?: number;
  height?: number;
}

export interface ImageUploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  progressPercentage: number;
  status: 'compressing' | 'uploading' | 'completed' | 'error';
}

export type LegacyImageInput = string | ImageAsset | ImageAssetReference;
