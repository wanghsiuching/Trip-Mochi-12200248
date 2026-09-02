/**
 * 次世代智慧近無損壓縮演算法 (Next-Gen Smart Near-Lossless Image Compression Engine)
 * 
 * 特色：
 * 1. 支援 1080p Retina 高清解析度 (寬度/高度最高 1080~1280px，手機/桌機視網膜螢幕極致細膩)
 * 2. WebP 智慧自適應壓縮 (優先 WebP 編碼，自動階梯式品質調控，大小約 30KB~75KB，兼顧畫質與極速載入)
 * 3. 色彩銳化與微對比增強 (Canvas 卷積 Unsharp Mask 濾鏡，還原縮放後丟失的細節與鮮豔度)
 * 4. HEIC / HEIF iPhone 照片智慧轉換支援
 * 5. 純前端本機記憶體處理，零伺服器依賴，安全存入 Firestore
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
 * 輕量級色彩銳化與微對比度增強濾鏡 (Unsharp Mask Convolution)
 * 在圖片縮放後套用，消除雙線性內插造成的模糊感，使文字、景點建築與美食照片線條更加立體清晰。
 */
export const applyColorSharpening = (
  ctx: CanvasRenderingContext2D, 
  width: number, 
  height: number, 
  amount: number = 0.10
) => {
  try {
    if (width <= 0 || height <= 0) return;
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const buffer = new Uint8ClampedArray(data);

    // 3x3 輕度銳化矩陣: [0, -k, 0], [-k, 1+4k, -k], [0, -k, 0]
    const k = Math.max(0.04, Math.min(0.20, amount));
    const centerWeight = 1 + 4 * k;

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        const top = ((y - 1) * width + x) * 4;
        const bottom = ((y + 1) * width + x) * 4;
        const left = (y * width + (x - 1)) * 4;
        const right = (y * width + (x + 1)) * 4;

        // R
        data[idx] = buffer[idx] * centerWeight - (buffer[top] + buffer[bottom] + buffer[left] + buffer[right]) * k;
        // G
        data[idx + 1] = buffer[idx + 1] * centerWeight - (buffer[top + 1] + buffer[bottom + 1] + buffer[left + 1] + buffer[right + 1]) * k;
        // B
        data[idx + 2] = buffer[idx + 2] * centerWeight - (buffer[top + 2] + buffer[bottom + 2] + buffer[left + 2] + buffer[right + 2]) * k;
      }
    }

    ctx.putImageData(imageData, 0, 0);
  } catch (err) {
    // 若受限於跨來源安全性或記憶體限制，安全跳過銳化
    console.warn('Color sharpening filter skipped gracefully:', err);
  }
};

export interface ImageCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  sharpen?: boolean;
  sharpenAmount?: number;
}

/**
 * 次世代智慧近無損壓縮：將 File 轉為高品質 1080p Retina WebP/JPEG Base64
 */
export const compressImageToBase64 = async (
  rawFile: File,
  options: ImageCompressionOptions = {}
): Promise<string> => {
  if (!rawFile) {
    throw new Error('未選擇檔案');
  }

  let fileOrBlob: Blob | File = rawFile;

  // 1. HEIC / HEIF 支援
  if (isHeicFile(rawFile)) {
    try {
      const heic2anyModule = await import('heic2any');
      const heic2any = (heic2anyModule.default || heic2anyModule) as any;
      const converted = await heic2any({
        blob: rawFile,
        toType: 'image/jpeg',
        quality: 0.82,
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
        if (rawDataUrl.startsWith('data:image/') && rawDataUrl.length < 100000) {
          resolve(rawDataUrl);
        } else {
          reject(new Error('此圖片格式無法解析，請嘗試使用 JPG / PNG / WebP 格式'));
        }
      };

      img.onload = () => {
        try {
          // 1080p Retina 高畫質尺寸設定 (最長邊 1080px 或自訂 maxWidth)
          const targetMax = options.maxWidth || 1080;
          let width = img.naturalWidth || img.width || 1080;
          let height = img.naturalHeight || img.height || 720;

          if (width > height) {
            if (width > targetMax) {
              height = Math.round((height * targetMax) / width);
              width = targetMax;
            }
          } else {
            if (height > targetMax) {
              width = Math.round((width * targetMax) / height);
              height = targetMax;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);
          const ctx = canvas.getContext('2d', { alpha: false, willReadFrequently: true });

          if (!ctx) {
            resolve(rawDataUrl);
            return;
          }

          // 填補白色背景 (避免透明 PNG 轉 WebP/JPG 產生黑色背景)
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // 高畫質縮放內插運算
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          // 色彩銳化與微對比增強
          if (options.sharpen !== false) {
            applyColorSharpening(ctx, canvas.width, canvas.height, options.sharpenAmount || 0.10);
          }

          // 智慧 WebP / JPEG 自適應編碼
          const initialQuality = options.quality !== undefined ? options.quality : 0.80;
          let compressed = '';
          let isWebpSupported = false;

          try {
            const webpCandidate = canvas.toDataURL('image/webp', initialQuality);
            if (webpCandidate.startsWith('data:image/webp')) {
              compressed = webpCandidate;
              isWebpSupported = true;
            }
          } catch {
            isWebpSupported = false;
          }

          if (!compressed) {
            compressed = canvas.toDataURL('image/jpeg', 0.78);
          }

          // 自適應階梯式容量控制 (若單圖依然 > 85KB，適度調降品質至 0.70，確保快速存取)
          if (compressed.length > 95000) {
            if (isWebpSupported) {
              compressed = canvas.toDataURL('image/webp', 0.70);
            } else {
              compressed = canvas.toDataURL('image/jpeg', 0.68);
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

/**
 * 完整支援 File 或 Base64 雙輸出的統一封裝函式
 */
export const processImage = async (
  file: File, 
  returnType: 'file' | 'base64' = 'base64', 
  options: ImageCompressionOptions = {}
): Promise<File | string> => {
  if (returnType === 'base64') {
    return compressImageToBase64(file, options);
  }

  const base64 = await compressImageToBase64(file, options);
  const res = await fetch(base64);
  const blob = await res.blob();
  const newFileName = (file.name || 'photo').replace(/\.[^/.]+$/, "") + ".webp";
  return new File([blob], newFileName, {
    type: 'image/webp',
    lastModified: Date.now(),
  });
};

