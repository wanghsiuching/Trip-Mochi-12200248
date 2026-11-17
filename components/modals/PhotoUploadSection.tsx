import React, { useRef, useState } from 'react';
import { Camera, Upload, Loader2, X, Star, ArrowLeft, ArrowRight, Check, Move } from 'lucide-react';
import { uploadOrCompressImage, calculateImageBudget, balanceImagesForDocument } from '../../utils/imageService';

interface PhotoUploadSectionProps {
  images: string[];
  photoPlacement: 'top' | 'middle' | 'bottom';
  photoOffsetY: number;
  tripId?: string;
  label?: string;
  middleLabel?: string;
  middleDesc?: string;
  bottomDesc?: string;
  inputId?: string;
  onChangeImages: (images: string[]) => void;
  onChangePlacement: (placement: 'top' | 'middle' | 'bottom') => void;
  onChangeOffsetY: (offsetY: number) => void;
  onUploadingChange?: (isUploading: boolean) => void;
}

export const PhotoUploadSection: React.FC<PhotoUploadSectionProps> = ({
  images,
  photoPlacement,
  photoOffsetY,
  tripId,
  label = '相片 / 憑證圖式',
  middleLabel = '卡片中間',
  middleDesc = '置於卡片中間區域（預設）',
  bottomDesc = '置於卡片最底部（備註/明細下方）',
  inputId = 'booking-photo-upload',
  onChangeImages,
  onChangePlacement,
  onChangeOffsetY,
  onUploadingChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState('');

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingImage(true);
    onUploadingChange?.(true);
    setUploadProgressText(`1/${files.length}`);

    try {
      const expectedTotal = images.length + files.length;
      const uploadBudget = calculateImageBudget(expectedTotal);
      const newImages: string[] = [];
      let failedCount = 0;

      for (let i = 0; i < files.length; i++) {
        setUploadProgressText(`${i + 1}/${files.length}`);
        try {
          const compressedOrUrl = await uploadOrCompressImage(files[i], tripId, uploadBudget);
          if (compressedOrUrl) {
            newImages.push(compressedOrUrl);
          }
        } catch (singleErr) {
          failedCount++;
          console.warn(`第 ${i + 1} 張圖片處理失敗:`, singleErr);
        }
      }

      if (newImages.length > 0) {
        const combined = [...images, ...newImages];
        const balanced = await balanceImagesForDocument(combined, 680000);
        onChangeImages(balanced);
      }

      if (failedCount > 0) {
        alert(`有 ${failedCount} 張圖片無法讀取或格式不支援，其餘照片已保留`);
      }
    } catch (err) {
      console.error('圖片處理失敗', err);
      alert('圖片處理失敗，請重試');
    } finally {
      setIsUploadingImage(false);
      onUploadingChange?.(false);
      setUploadProgressText('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    onChangeImages(images.filter((_, idx) => idx !== indexToRemove));
  };

  const handleMoveImage = (fromIndex: number, direction: 'left' | 'right') => {
    const toIndex = direction === 'left' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= images.length) return;
    const next = [...images];
    const temp = next[fromIndex];
    next[fromIndex] = next[toIndex];
    next[toIndex] = temp;
    onChangeImages(next);
  };

  const handleSetMainImage = (index: number) => {
    if (index <= 0 || index >= images.length) return;
    const next = [...images];
    const [selected] = next.splice(index, 1);
    next.unshift(selected);
    onChangeImages(next);
  };

  return (
    <div className="bg-white p-4 rounded-2xl border-2 border-beige-dark shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-xs font-black text-cocoa flex items-center gap-1.5">
          <Camera size={14} className="text-sage" />
          <span>{label}</span>
        </label>
        {images.length > 0 && (() => {
          const base64Bytes = images.reduce((sum, img) => sum + (typeof img === 'string' && img.startsWith('data:image/') ? Math.round(img.length * 0.75) : 0), 0);
          const kbText = base64Bytes > 0 ? ` · 約 ${Math.max(1, Math.round(base64Bytes / 1024))} KB` : '';
          return (
            <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              已選 {images.length} 張相片{kbText}
            </span>
          );
        })()}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleImageUpload}
        className="hidden"
        id={inputId}
      />

      {/* Uploaded Images List with Reorder Controls */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {images.map((img, idx) => (
          <div key={idx} className="relative group rounded-xl overflow-hidden border-2 border-beige-dark bg-gray-50 shadow-xs flex flex-col">
            <div className="relative aspect-video w-full overflow-hidden bg-black/5">
              <img
                src={img}
                alt={`相片 ${idx + 1}`}
                className="w-full h-full object-cover"
                style={{ objectPosition: idx === 0 ? `center ${photoOffsetY}%` : 'center center' }}
                referrerPolicy="no-referrer"
              />
              {idx === 0 ? (
                <span className="absolute top-1 left-1 bg-sage text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm flex items-center gap-0.5">
                  <Star size={9} fill="currentColor" /> 卡片主圖
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSetMainImage(idx)}
                  className="absolute top-1 left-1 bg-black/60 hover:bg-sage text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm transition-colors flex items-center gap-0.5 cursor-pointer"
                  title="設為首張主圖"
                >
                  <Star size={9} /> 設為主圖
                </button>
              )}
              <button
                type="button"
                onClick={() => handleRemoveImage(idx)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-red-500 transition-colors shadow-sm cursor-pointer"
                title="刪除相片"
              >
                <X size={11} strokeWidth={2.5} />
              </button>
            </div>

            {/* Order controls */}
            <div className="flex items-center justify-between p-1 bg-white border-t border-beige-dark text-[10px] text-gray-500">
              <button
                type="button"
                disabled={idx === 0}
                onClick={() => handleMoveImage(idx, 'left')}
                className={`px-2 py-0.5 rounded flex items-center gap-0.5 font-bold transition-colors ${idx === 0 ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-sage/10 text-cocoa hover:text-sage cursor-pointer'}`}
                title="往前移"
              >
                <ArrowLeft size={11} /> 往左
              </button>
              <span className="font-mono text-[9px] font-bold text-gray-400">#{idx + 1}</span>
              <button
                type="button"
                disabled={idx === images.length - 1}
                onClick={() => handleMoveImage(idx, 'right')}
                className={`px-2 py-0.5 rounded flex items-center gap-0.5 font-bold transition-colors ${idx === images.length - 1 ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-sage/10 text-cocoa hover:text-sage cursor-pointer'}`}
                title="往後移"
              >
                往右 <ArrowRight size={11} />
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          disabled={isUploadingImage}
          onClick={() => fileInputRef.current?.click()}
          className={`min-h-[90px] rounded-xl border-2 border-dashed border-sage/60 hover:border-sage bg-sage/5 hover:bg-sage/10 flex flex-col items-center justify-center gap-1 text-sage transition-all ${isUploadingImage ? 'opacity-60 cursor-wait' : 'cursor-pointer active:scale-95'}`}
        >
          {isUploadingImage ? (
            <>
              <Loader2 size={20} className="animate-spin text-sage" />
              <span className="text-[10px] font-black">{uploadProgressText ? `處理中 (${uploadProgressText})` : '處理中...'}</span>
            </>
          ) : (
            <>
              <Upload size={20} />
              <span className="text-[10px] font-black">{images.length === 0 ? '上傳相片' : '加更多相片'}</span>
            </>
          )}
        </button>
      </div>

      {images.length > 0 && (
        <div className="pt-3 border-t border-beige-dark space-y-3.5">
          {/* Placement Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-cocoa flex items-center justify-between">
              <span>卡片顯示位置</span>
              <span className="text-[10px] text-gray-400 font-bold">決定照片出現在卡片的哪一區</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => onChangePlacement('top')}
                className={`p-2.5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                  photoPlacement === 'top'
                    ? 'border-sage bg-sage/10 text-sage shadow-xs'
                    : 'border-beige-dark bg-gray-50 text-gray-600 hover:border-sage/50'
                }`}
              >
                <div className="text-xs font-black flex items-center justify-between mb-0.5">
                  <span>頂部封面</span>
                  {photoPlacement === 'top' && <Check size={12} strokeWidth={3} className="text-sage" />}
                </div>
                <p className="text-[9px] text-gray-400 font-bold leading-tight">置於卡片最上方（標題之上）</p>
              </button>

              <button
                type="button"
                onClick={() => onChangePlacement('middle')}
                className={`p-2.5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                  photoPlacement === 'middle'
                    ? 'border-sage bg-sage/10 text-sage shadow-xs'
                    : 'border-beige-dark bg-gray-50 text-gray-600 hover:border-sage/50'
                }`}
              >
                <div className="text-xs font-black flex items-center justify-between mb-0.5">
                  <span>{middleLabel}</span>
                  {photoPlacement === 'middle' && <Check size={12} strokeWidth={3} className="text-sage" />}
                </div>
                <p className="text-[9px] text-gray-400 font-bold leading-tight">{middleDesc}</p>
              </button>

              <button
                type="button"
                onClick={() => onChangePlacement('bottom')}
                className={`p-2.5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                  photoPlacement === 'bottom'
                    ? 'border-sage bg-sage/10 text-sage shadow-xs'
                    : 'border-beige-dark bg-gray-50 text-gray-600 hover:border-sage/50'
                }`}
              >
                <div className="text-xs font-black flex items-center justify-between mb-0.5">
                  <span>卡片最底</span>
                  {photoPlacement === 'bottom' && <Check size={12} strokeWidth={3} className="text-sage" />}
                </div>
                <p className="text-[9px] text-gray-400 font-bold leading-tight">{bottomDesc}</p>
              </button>
            </div>
          </div>

          {/* Photo Vertical Position / Focal Offset Slider */}
          <div className="bg-sage/5 p-3 rounded-xl border border-sage/20 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black text-cocoa flex items-center gap-1.5">
                <Move size={12} className="text-sage" />
                <span>上下移動照片顯示視野 (焦點對齊)</span>
              </label>
              <span className="font-mono text-xs font-black text-sage bg-white px-2 py-0.5 rounded-md border border-sage/30 shadow-2xs">
                {photoOffsetY}% ({photoOffsetY <= 20 ? '靠頂' : photoOffsetY <= 40 ? '偏上' : photoOffsetY <= 60 ? '置中' : photoOffsetY <= 80 ? '偏下' : '靠底'})
              </span>
            </div>

            {/* Live Preview Box */}
            <div className="relative w-full h-32 rounded-xl overflow-hidden border-2 border-sage/40 bg-gray-100 shadow-inner">
              <img
                src={images[0]}
                alt="視野預覽"
                className="w-full h-full object-cover transition-[object-position] duration-150"
                style={{ objectPosition: `center ${photoOffsetY}%` }}
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-1.5 left-1.5 bg-black/60 backdrop-blur-xs text-white text-[9px] font-black px-2 py-0.5 rounded shadow-sm">
                主圖即時視野預覽
              </div>
            </div>

            {/* Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-bold text-gray-400 px-1">
                <span>⬆️ 顯示頂部 (0%)</span>
                <span>居中 (50%)</span>
                <span>⬇️ 顯示底部 (100%)</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={photoOffsetY}
                onChange={(e) => onChangeOffsetY(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-sage"
              />
            </div>

            {/* Quick Presets */}
            <div className="flex items-center justify-between gap-1 pt-1">
              {[
                { label: '頂端 0%', val: 0 },
                { label: '偏上 25%', val: 25 },
                { label: '置中 50%', val: 50 },
                { label: '偏下 75%', val: 75 },
                { label: '底端 100%', val: 100 },
              ].map((preset) => (
                <button
                  key={preset.val}
                  type="button"
                  onClick={() => onChangeOffsetY(preset.val)}
                  className={`flex-1 py-1 rounded text-[10px] font-bold transition-all border cursor-pointer ${
                    photoOffsetY === preset.val
                      ? 'bg-sage text-white border-sage shadow-2xs'
                      : 'bg-white text-gray-600 border-beige-dark hover:border-sage'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
