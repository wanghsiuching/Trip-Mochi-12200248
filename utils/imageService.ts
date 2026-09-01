/**
 * Fast, pure client-side image compression to lightweight WebP/JPEG Base64.
 * 
 * - Max dimension: 640px (crisp on mobile retina screens, optimal for travel cards & preview)
 * - Format: Prefer WebP with automatic fallback to JPEG
 * - Zero external storage / Firebase Storage dependency
 * - 100% saved directly in Firestore database as Base64 strings
 * - Instant processing (<100ms per image)
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

export const compressImageToBase64 = async (rawFile: File): Promise<string> => {
  if (!rawFile) {
    throw new Error('未選擇檔案');
  }

  let fileOrBlob: Blob | File = rawFile;

  // Handle HEIC if needed
  if (isHeicFile(rawFile)) {
    try {
      const heic2anyModule = await import('heic2any');
      const heic2any = (heic2anyModule.default || heic2anyModule) as any;
      const converted = await heic2any({
        blob: rawFile,
        toType: 'image/jpeg',
        quality: 0.65,
      });
      fileOrBlob = Array.isArray(converted) ? converted[0] : converted;
    } catch (e) {
      console.warn('heic2any fallback skipped:', e);
    }
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error('無法讀取本機圖片檔案'));
    };

    reader.onload = (e) => {
      const rawDataUrl = e.target?.result as string;
      if (!rawDataUrl) {
        reject(new Error('讀取的檔案內容為空'));
        return;
      }

      const img = new Image();
      img.onerror = () => {
        if (rawDataUrl.startsWith('data:image/') && rawDataUrl.length < 50000) {
          resolve(rawDataUrl);
        } else {
          reject(new Error('此圖片格式無法解析，請嘗試使用 JPG / PNG 格式'));
        }
      };

      img.onload = () => {
        try {
          const maxDimension = 640;
          let width = img.naturalWidth || img.width || 640;
          let height = img.naturalHeight || img.height || 480;

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
            resolve(rawDataUrl);
            return;
          }

          // Fill white background for transparent PNGs
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'medium';
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          // Prefer WebP format; fallback to JPEG if browser does not support WebP canvas encoding
          let isWebpSupported = false;
          let compressed = '';
          try {
            const webpCandidate = canvas.toDataURL('image/webp', 0.6);
            if (webpCandidate.startsWith('data:image/webp')) {
              compressed = webpCandidate;
              isWebpSupported = true;
            }
          } catch {
            isWebpSupported = false;
          }

          if (!compressed) {
            compressed = canvas.toDataURL('image/jpeg', 0.55);
          }

          // If still large (>35KB), apply secondary compression
          if (compressed.length > 35000) {
            if (isWebpSupported) {
              compressed = canvas.toDataURL('image/webp', 0.4);
            } else {
              compressed = canvas.toDataURL('image/jpeg', 0.4);
            }
          }

          resolve(compressed);
        } catch (canvasErr) {
          console.warn('Canvas compression fallback to raw data:', canvasErr);
          resolve(rawDataUrl);
        }
      };

      img.src = rawDataUrl;
    };

    reader.readAsDataURL(fileOrBlob);
  });
};
