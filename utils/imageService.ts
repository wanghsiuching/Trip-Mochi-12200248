import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * Robust, mobile-friendly image processing service.
 * Supports:
 * - iPhone HEIC/HEIF conversion
 * - High-resolution camera photo downscaling to max 500px
 * - JPEG compression (~12-20KB per photo)
 * - Firebase Storage upload with automatic Base64 fallback
 */

const isHeicFile = (file: File): boolean => {
  const fileName = (file.name || '').toLowerCase();
  const fileType = (file.type || '').toLowerCase();
  return (
    fileType.includes('heic') ||
    fileType.includes('heif') ||
    fileName.endsWith('.heic') ||
    fileName.endsWith('.heif')
  );
};

/**
 * Converts HEIC/HEIF file to standard JPEG/PNG Blob if needed.
 */
const ensureStandardImageBlob = async (file: File): Promise<Blob | File> => {
  if (!isHeicFile(file)) {
    return file;
  }

  try {
    const heic2anyModule = await import('heic2any');
    const heic2any = (heic2anyModule.default || heic2anyModule) as (options: {
      blob: Blob;
      toType?: string;
      quality?: number;
    }) => Promise<Blob | Blob[]>;

    const converted = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.8,
    });

    if (Array.isArray(converted)) {
      return converted[0] || file;
    }
    return converted || file;
  } catch (err) {
    console.warn('heic2any conversion fallback failed or not applicable:', err);
    return file;
  }
};

/**
 * Resizes and compresses an image Blob/File to a lightweight JPEG Base64 and Blob.
 */
export const compressImageToJpeg = async (
  rawFile: File,
  maxDimension = 500,
  quality = 0.6,
  onProgress?: (percent: number) => void
): Promise<{ base64: string; blob: Blob }> => {
  if (onProgress) onProgress(15);

  const fileOrBlob = await ensureStandardImageBlob(rawFile);
  if (onProgress) onProgress(35);

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(fileOrBlob);
    const img = new Image();

    img.onload = () => {
      if (onProgress) onProgress(65);

      let width = img.naturalWidth || img.width || 500;
      let height = img.naturalHeight || img.height || 375;

      if (width > height) {
        if (width > maxDimension) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        }
      } else {
        if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, width);
      canvas.height = Math.max(1, height);
      const ctx = canvas.getContext('2d', { alpha: false });

      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Canvas 2D context not available'));
        return;
      }

      // Fill white background for transparent PNGs
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'medium';
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      URL.revokeObjectURL(objectUrl);

      if (onProgress) onProgress(85);

      let base64 = canvas.toDataURL('image/jpeg', quality);
      if (base64.length > 35000) {
        base64 = canvas.toDataURL('image/jpeg', Math.max(0.35, quality - 0.2));
      }

      canvas.toBlob(
        (blob) => {
          if (blob) {
            if (onProgress) onProgress(100);
            resolve({ base64, blob });
          } else {
            // Fallback blob from base64
            const byteString = atob(base64.split(',')[1]);
            const mimeString = base64.split(',')[0].split(':')[1].split(';')[0];
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) {
              ia[i] = byteString.charCodeAt(i);
            }
            const fallbackBlob = new Blob([ab], { type: mimeString });
            if (onProgress) onProgress(100);
            resolve({ base64, blob: fallbackBlob });
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      // Fallback: try FileReader
      const reader = new FileReader();
      reader.onload = (e) => {
        const rawBase64 = e.target?.result as string;
        if (!rawBase64) {
          reject(new Error('無法讀取此圖片'));
          return;
        }
        const fallbackImg = new Image();
        fallbackImg.onload = () => {
          const c = document.createElement('canvas');
          let w = fallbackImg.naturalWidth || 500;
          let h = fallbackImg.naturalHeight || 375;
          if (w > h && w > maxDimension) {
            h = Math.round((h * maxDimension) / w);
            w = maxDimension;
          } else if (h > maxDimension) {
            w = Math.round((w * maxDimension) / h);
            h = maxDimension;
          }
          c.width = Math.max(1, w);
          c.height = Math.max(1, h);
          const cCtx = c.getContext('2d');
          if (cCtx) {
            cCtx.drawImage(fallbackImg, 0, 0, c.width, c.height);
            const b64 = c.toDataURL('image/jpeg', 0.55);
            c.toBlob((b) => {
              resolve({ base64: b64, blob: b || new Blob() });
            }, 'image/jpeg', 0.55);
          } else {
            resolve({ base64: rawBase64, blob: new Blob() });
          }
        };
        fallbackImg.onerror = () => {
          reject(new Error('圖片解碼失敗，請確認檔案格式是否正常'));
        };
        fallbackImg.src = rawBase64;
      };
      reader.onerror = () => reject(new Error('檔案讀取失敗'));
      reader.readAsDataURL(fileOrBlob);
    };

    img.src = objectUrl;
  });
};

/**
 * High-level image uploader for pocket items & schedules.
 * Attempts Firebase Storage upload first; falls back immediately to ultra-compressed Base64.
 */
export const uploadOrCompressImage = async (
  file: File,
  tripId: string,
  folder = 'pocket',
  onProgress?: (percent: number) => void
): Promise<string> => {
  try {
    const { base64, blob } = await compressImageToJpeg(file, 500, 0.6, (pct) => {
      // Scale compression to 0-80%
      if (onProgress) onProgress(Math.round(pct * 0.8));
    });

    // Try Firebase Storage upload if available
    try {
      const cleanTripId = tripId || 'general';
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 7);
      const safeFileName = `${timestamp}_${randomStr}.jpg`;
      const storageRef = ref(storage, `trips/${cleanTripId}/${folder}/${safeFileName}`);

      if (onProgress) onProgress(85);
      const uploadTask = await uploadBytes(storageRef, blob, {
        contentType: 'image/jpeg',
      });

      if (onProgress) onProgress(95);
      const downloadUrl = await getDownloadURL(uploadTask.ref);
      if (onProgress) onProgress(100);

      if (downloadUrl && downloadUrl.startsWith('http')) {
        return downloadUrl;
      }
    } catch (storageErr) {
      console.warn('Firebase Storage upload skipped/failed, using compressed base64 fallback:', storageErr);
    }

    if (onProgress) onProgress(100);
    return base64;
  } catch (err: any) {
    console.error('Image compression & upload failed:', err);
    throw new Error(err?.message || '圖片處理失敗，請換一張照片重試');
  }
};
