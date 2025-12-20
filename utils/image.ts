
/**
 * Utility for processing images: converting to WebP and optionally resizing.
 */

interface ProcessImageOptions {
    maxWidth?: number; // Optional: Only resize if width exceeds this. 0 means keep original.
    quality?: number;  // 0 to 1.
}

export const processImage = (
    file: File, 
    returnType: 'file' | 'base64', 
    options: ProcessImageOptions = {}
): Promise<File | string> => {
    return new Promise((resolve, reject) => {
        // If not an image, return original (only for File return type)
        if (!file.type.startsWith('image/')) {
            if (returnType === 'file') {
                resolve(file);
                return;
            } else {
                reject(new Error("File is not an image"));
                return;
            }
        }

        // Logic based on file size (3MB Threshold)
        const fileSizeMB = file.size / (1024 * 1024);
        
        // Smart Defaults
        // If > 3MB: Compress to HD (1920px) and 0.8 quality to save space.
        // If <= 3MB: Keep Original Size (0) and High Quality (0.95) for clarity.
        let targetMaxWidth = options.maxWidth !== undefined ? options.maxWidth : (fileSizeMB > 3 ? 1920 : 0);
        let targetQuality = options.quality !== undefined ? options.quality : (fileSizeMB > 3 ? 0.8 : 0.95);

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Resize logic
                if (targetMaxWidth > 0 && width > targetMaxWidth) {
                    height *= targetMaxWidth / width;
                    width = targetMaxWidth;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    // Use better interpolation for resizing
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    if (returnType === 'base64') {
                        // Return Base64 String
                        const dataUrl = canvas.toDataURL('image/webp', targetQuality);
                        resolve(dataUrl);
                    } else {
                        // Return File Object
                        canvas.toBlob((blob) => {
                            if (blob) {
                                const newFileName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
                                const newFile = new File([blob], newFileName, {
                                    type: 'image/webp',
                                    lastModified: Date.now(),
                                });
                                resolve(newFile);
                            } else {
                                resolve(file); // Fallback to original
                            }
                        }, 'image/webp', targetQuality);
                    }
                } else {
                    // Context failed
                    if (returnType === 'file') resolve(file);
                    else resolve(event.target?.result as string);
                }
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
};
