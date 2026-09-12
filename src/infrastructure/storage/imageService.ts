import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { storage } from '../firebase';
import { ImageAsset, ImageAssetReference, ImageUploadProgress } from '../../shared/types/image';
import { compressImageToBase64 } from '../../../utils/imageService';

export interface UploadImageOptions {
  domain?: string;
  generateThumbnail?: boolean;
  maxWidth?: number;
  quality?: number;
  onProgress?: (progress: ImageUploadProgress) => void;
  maxRetries?: number;
}

/**
 * Generate lightweight canvas thumbnail (e.g. 240px wide)
 */
export async function createThumbnailDataUrl(sourceBase64: string, maxWidth = 240): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const ratio = img.height / img.width;
        const width = Math.min(img.width, maxWidth);
        const height = Math.round(width * ratio);

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(sourceBase64);

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const thumbUrl = canvas.toDataURL('image/webp', 0.75);
        resolve(thumbUrl);
      } catch {
        resolve(sourceBase64);
      }
    };
    img.onerror = () => resolve(sourceBase64);
    img.src = sourceBase64;
  });
}

/**
 * Upload an image using Firebase Storage with client-side compression and resumable progress.
 * Returns a normalized ImageAsset.
 * In case of storage/permission issues, provides an automatic, safe, graceful fallback.
 */
export async function uploadImageAsset(
  file: File,
  tripId: string,
  options: UploadImageOptions = {}
): Promise<{ asset: ImageAsset; reference: ImageAssetReference }> {
  const {
    domain = 'general',
    generateThumbnail = true,
    maxWidth = 1200,
    quality = 0.82,
    onProgress,
  } = options;

  const assetId = `img_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  // Step 1: Client-side compression
  onProgress?.({
    bytesTransferred: 0,
    totalBytes: file.size,
    progressPercentage: 10,
    status: 'compressing',
  });

  const compressedBase64 = await compressImageToBase64(file, {
    maxWidth,
    quality,
    sharpen: true,
  });

  // Step 2: Generate thumbnail if requested
  let thumbnailUrl: string | undefined;
  if (generateThumbnail) {
    thumbnailUrl = await createThumbnailDataUrl(compressedBase64, 260);
  }

  // Get compressed blob
  const res = await fetch(compressedBase64);
  const blob = await res.blob();

  // Try Firebase Storage upload
  if (storage && tripId) {
    try {
      const storagePath = `trips/${tripId}/${domain}/${assetId}.webp`;
      const storageRef = ref(storage, storagePath);

      onProgress?.({
        bytesTransferred: 0,
        totalBytes: blob.size,
        progressPercentage: 30,
        status: 'uploading',
      });

      const uploadTask = uploadBytesResumable(storageRef, blob, {
        contentType: 'image/webp',
        cacheControl: 'public, max-age=31536000',
        customMetadata: {
          originalName: file.name,
          domain,
          tripId,
          assetId,
        },
      });

      const downloadUrl = await new Promise<string>((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const pct = Math.round(
              (snapshot.bytesTransferred / (snapshot.totalBytes || 1)) * 65 + 30
            );
            onProgress?.({
              bytesTransferred: snapshot.bytesTransferred,
              totalBytes: snapshot.totalBytes,
              progressPercentage: Math.min(pct, 95),
              status: 'uploading',
            });
          },
          (error) => {
            reject(error);
          },
          async () => {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(url);
          }
        );
      });

      onProgress?.({
        bytesTransferred: blob.size,
        totalBytes: blob.size,
        progressPercentage: 100,
        status: 'completed',
      });

      const asset: ImageAsset = {
        id: assetId,
        storagePath,
        downloadUrl,
        thumbnailUrl: thumbnailUrl || downloadUrl,
        size: blob.size,
        mimeType: 'image/webp',
        createdAt: Date.now(),
      };

      const reference: ImageAssetReference = {
        id: assetId,
        storagePath,
        downloadUrl,
        thumbnailUrl: thumbnailUrl || downloadUrl,
      };

      return { asset, reference };
    } catch (storageErr) {
      console.warn('Firebase Storage upload failed or unauthorized, activating safe fallback:', storageErr);
    }
  }

  // Fallback: Use compact compressed base64 if Storage unavailable or offline
  onProgress?.({
    bytesTransferred: blob.size,
    totalBytes: blob.size,
    progressPercentage: 100,
    status: 'completed',
  });

  const fallbackAsset: ImageAsset = {
    id: assetId,
    storagePath: '',
    downloadUrl: compressedBase64,
    thumbnailUrl: thumbnailUrl || compressedBase64,
    size: blob.size,
    mimeType: 'image/webp',
    createdAt: Date.now(),
  };

  const fallbackRef: ImageAssetReference = {
    id: assetId,
    downloadUrl: compressedBase64,
    thumbnailUrl: thumbnailUrl || compressedBase64,
  };

  return { asset: fallbackAsset, reference: fallbackRef };
}

/**
 * Delete an image asset from Firebase Storage.
 */
export async function deleteImageAsset(storagePath: string): Promise<boolean> {
  if (!storage || !storagePath) return false;
  try {
    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);
    return true;
  } catch (err) {
    console.warn('Failed to delete image asset from storage:', err);
    return false;
  }
}
