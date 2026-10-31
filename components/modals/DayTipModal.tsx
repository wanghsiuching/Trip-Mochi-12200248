import React, { useState, useEffect, useRef } from 'react';
import { X, Lightbulb, Image as ImageIcon, Trash2, Plus, Sparkles, Compass, AlertCircle, Eye, Upload } from 'lucide-react';
import { TripDay } from '../../types';
import { compressImageToBase64 } from '../../utils/imageService';
import { DeleteTipConfirmModal } from './DeleteTipConfirmModal';

interface DayTipModalProps {
  isOpen: boolean;
  onClose: () => void;
  day: TripDay | null;
  dayNum: number;
  onSaveDayTip: (date: string, tipTitle: string, tip: string, tipPhotos: string[]) => void;
  onOpenTipsCenter: () => void;
  onOpenLightbox?: (images: string[], index: number) => void;
  zIndex?: string;
}

export const DayTipModal: React.FC<DayTipModalProps> = ({
  isOpen,
  onClose,
  day,
  dayNum,
  onSaveDayTip,
  onOpenTipsCenter,
  onOpenLightbox,
  zIndex = 'z-[75]'
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (day && isOpen) {
      setTitle(day.tipTitle || '');
      setContent(day.tip || '');
      setPhotos(Array.isArray(day.tipPhotos) ? [...day.tipPhotos] : []);
      setIsDeleteModalOpen(false);
    }
  }, [day, isOpen]);

  if (!isOpen || !day) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsCompressing(true);
    try {
      const newBase64List: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const compressed = await compressImageToBase64(file, {
          maxWidth: 1200,
          quality: 0.78,
          maxChars: 160000,
          sharpen: true
        });
        if (compressed) {
          newBase64List.push(compressed);
        }
      }
      setPhotos(prev => [...prev, ...newBase64List]);
    } catch (err) {
      console.error('壓縮相片失敗:', err);
      alert('上傳相片失敗，請重試');
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeletePhoto = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setPhotos(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    onSaveDayTip(day.date, title.trim(), content.trim(), photos);
    onClose();
  };

  const handleExecuteDelete = () => {
    onSaveDayTip(day.date, '', '', []);
    setTitle('');
    setContent('');
    setPhotos([]);
    setIsDeleteModalOpen(false);
    onClose();
  };

  const hasAnyContent = Boolean(
    title.trim() || 
    content.trim() || 
    photos.length > 0 || 
    day.tip || 
    day.tipTitle || 
    (day.tipPhotos && day.tipPhotos.length > 0)
  );

  return (
    <>
      <div 
        className={`fixed inset-0 bg-cocoa/60 backdrop-blur-sm ${zIndex} flex flex-col items-center justify-end sm:justify-center sm:p-4 animate-fade-in`}
        onClick={onClose}
      >
        <div 
          className="bg-[#FAF8F2] w-full max-h-[92vh] sm:max-w-lg sm:rounded-[2.5rem] rounded-t-[2.5rem] p-5 sm:p-6 shadow-2xl border-0 sm:border-4 sm:border-beige-dark flex flex-col overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-center pb-3.5 border-b-2 border-beige-dark flex-shrink-0">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="bg-amber-400 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                  Day {dayNum}
                </span>
                <span className="text-xs font-bold text-gray-400 font-mono">
                  {day.date}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-cocoa mt-0.5">
                {day.fruit || '📍'} {day.location || '當日行程'} 旅遊 TIP
              </h3>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {hasAnyContent && (
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="p-2 bg-white rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 border border-beige-dark shadow-sm transition-colors cursor-pointer"
                  title="刪除今日 TIP"
                >
                  <Trash2 size={16} />
                </button>
              )}
              <button 
                type="button"
                onClick={onClose} 
                className="p-2 bg-white rounded-full text-gray-400 hover:text-red-400 border border-beige-dark shadow-sm transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Content Body */}
          <div className="flex-1 overflow-y-auto no-scrollbar py-4 space-y-4">

          {/* Title Input */}
          <div className="space-y-1">
            <label className="text-xs font-black text-cocoa block">
              💡 TIP 核心標題
            </label>
            <input 
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="例：少女峰登頂防寒與換票重點"
              className="w-full p-3 bg-white rounded-2xl border-2 border-beige-dark font-bold text-cocoa text-xs sm:text-sm focus:border-amber-400 focus:outline-none transition-colors placeholder:text-gray-300"
            />
          </div>

          {/* Content Input */}
          <div className="space-y-1">
            <label className="text-xs font-black text-cocoa block">
              📝 重點提醒說明
            </label>
            <textarea 
              rows={4}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="請填寫當天注意事項，例如：&#10;1. 早上 08:30 需抵達纜車站出示 STP 半價票換實體券&#10;2. 山頂風大氣溫約 -2°C，手套圍巾需放隨身包&#10;3. 車站置物櫃只收 5 瑞郎硬幣"
              className="w-full p-3 bg-white rounded-2xl border-2 border-beige-dark font-medium text-cocoa text-xs sm:text-sm focus:border-amber-400 focus:outline-none transition-colors placeholder:text-gray-300 leading-relaxed resize-none"
            />
          </div>

          {/* Photo Upload Section */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-black text-cocoa flex items-center gap-1.5">
                <ImageIcon size={14} className="text-amber-600" />
                <span>參考相片與截圖 ({photos.length} 張)</span>
              </label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isCompressing}
                className="text-[11px] font-black text-amber-700 bg-amber-100/80 hover:bg-amber-200/80 px-2.5 py-1 rounded-xl border border-amber-300 flex items-center gap-1 transition-all active:scale-95 disabled:opacity-50"
              >
                <Plus size={12} strokeWidth={3} />
                <span>{isCompressing ? '處理中...' : '上傳相片'}</span>
              </button>
            </div>

            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple 
              accept="image/*" 
              className="hidden" 
            />

            {/* Photos Preview Grid */}
            {photos.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1">
                {photos.map((imgUrl, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => onOpenLightbox && onOpenLightbox(photos, idx)}
                    className="relative group aspect-square rounded-2xl overflow-hidden border-2 border-beige-dark bg-white shadow-xs cursor-pointer hover:border-amber-400 transition-all"
                  >
                    <img 
                      src={imgUrl} 
                      alt={`Tip photo ${idx + 1}`} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                      <Eye size={16} />
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleDeletePhoto(idx, e)}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-red-500 transition-colors z-10"
                      title="刪除相片"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="py-6 px-4 bg-white/70 border-2 border-dashed border-gray-300 hover:border-amber-400 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-colors group text-center"
              >
                <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                  <Upload size={18} />
                </div>
                <p className="text-xs font-black text-gray-500 group-hover:text-amber-700">
                  點擊上傳轉乘示意圖、票券流程或菜單截圖
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  自動高畫質壓縮 WebP，出國離線也能秒開
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="pt-3 border-t-2 border-beige-dark flex flex-col sm:flex-row gap-2.5 flex-shrink-0">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenTipsCenter();
            }}
            className="w-full sm:w-auto px-4 py-3 rounded-2xl font-black text-amber-800 bg-amber-100/70 hover:bg-amber-200/80 border border-amber-300 transition-colors text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
          >
            <Compass size={14} />
            <span>全旅程 TIP 中心</span>
          </button>

          <div className="flex gap-2 flex-1 w-full">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl font-bold text-gray-400 bg-white border-2 border-beige-dark hover:bg-gray-50 transition-colors text-xs sm:text-sm cursor-pointer"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 py-3 rounded-2xl font-black text-white bg-amber-500 hover:bg-amber-600 shadow-hard-sm border-2 border-amber-600 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-1.5 text-xs sm:text-sm cursor-pointer"
            >
              <Lightbulb size={15} className="fill-white" />
              <span>保存當日 TIP</span>
            </button>
          </div>
        </div>
      </div>
    </div>
    <DeleteTipConfirmModal
      isOpen={isDeleteModalOpen}
      onClose={() => setIsDeleteModalOpen(false)}
      onConfirm={handleExecuteDelete}
      title={`Day ${dayNum} (${day.location || '當日'}) 旅遊 TIP`}
      subtitle="確定要清空今天的所有備忘筆記與相片嗎？"
      zIndex="z-[90]"
    />
  </>
  );
};

