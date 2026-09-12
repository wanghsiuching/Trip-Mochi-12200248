import { ImageAsset, ImageAssetReference, LegacyImageInput } from '../types/image';

/**
 * Normalizes any legacy or modern image input into an ImageAssetReference.
 */
export function normalizeToImageAssetRef(
  input: LegacyImageInput | any,
  index = 0
): ImageAssetReference {
  if (!input) {
    return {
      id: `ref_${Date.now()}_${index}`,
      downloadUrl: '',
    };
  }

  // If already an ImageAssetReference or ImageAsset
  if (typeof input === 'object' && input.downloadUrl) {
    return {
      id: input.id || `ref_${Date.now()}_${index}`,
      storagePath: input.storagePath,
      downloadUrl: input.downloadUrl,
      thumbnailUrl: input.thumbnailUrl || input.downloadUrl,
      caption: input.caption,
      width: input.width,
      height: input.height,
    };
  }

  // If legacy object with url property
  if (typeof input === 'object' && input.url) {
    return {
      id: input.id || `ref_${Date.now()}_${index}`,
      downloadUrl: input.url,
      thumbnailUrl: input.thumbnailUrl || input.url,
      caption: input.caption,
    };
  }

  // If raw string (URL or Base64)
  if (typeof input === 'string') {
    return {
      id: `ref_${Date.now()}_${index}`,
      downloadUrl: input,
      thumbnailUrl: input,
    };
  }

  return {
    id: `ref_${Date.now()}_${index}`,
    downloadUrl: String(input),
  };
}

/**
 * Normalizes image arrays and legacy single images/photos into ImageAssetReference[]
 */
export function normalizeImagesList(
  images?: any,
  singleImage?: any,
  photos?: any
): ImageAssetReference[] {
  const result: ImageAssetReference[] = [];
  const seenUrls = new Set<string>();

  const add = (item: any, idx: number) => {
    if (!item) return;
    const ref = normalizeToImageAssetRef(item, idx);
    if (ref.downloadUrl && !seenUrls.has(ref.downloadUrl)) {
      seenUrls.add(ref.downloadUrl);
      result.push(ref);
    }
  };

  // Process images array
  if (Array.isArray(images)) {
    images.forEach((img, i) => add(img, i));
  } else if (images) {
    add(images, 0);
  }

  // Process legacy photos array
  if (Array.isArray(photos)) {
    photos.forEach((photo, i) => add(photo, result.length + i));
  }

  // Process legacy single image
  if (singleImage) {
    add(singleImage, result.length);
  }

  return result;
}

/**
 * Helper to convert ImageAssetReference[] back to string[] URLs for legacy components
 */
export function toUrlList(images?: (ImageAssetReference | string)[] | null): string[] {
  if (!images || !Array.isArray(images)) return [];
  return images.map(img => {
    if (typeof img === 'string') return img;
    return img.downloadUrl || img.thumbnailUrl || '';
  }).filter(Boolean);
}

/**
 * Helper to get primary display URL from ImageAssetReference or legacy string
 */
export function getPrimaryImageUrl(imageOrRef?: ImageAssetReference | string | null): string {
  if (!imageOrRef) return '';
  if (typeof imageOrRef === 'string') return imageOrRef;
  return imageOrRef.downloadUrl || imageOrRef.thumbnailUrl || '';
}
