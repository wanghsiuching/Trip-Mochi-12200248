import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { 
  X, Plus, Utensils, Compass, ShoppingBag, MapPin, ExternalLink, StickyNote, 
  Trash2, Edit3, CheckCircle2, Circle, Navigation, Tag, Star, 
  Search, CalendarPlus, ChevronRight, ChevronLeft, ChevronsLeft, ChevronsRight, Copy, Check,
  Image as ImageIcon, Upload, Camera, Loader2, ZoomIn, AlertCircle,
  FileText, Layers, ArrowUp, ChevronDown, ChevronUp, History
} from 'lucide-react';
import { PocketItem, TripDay } from '../types';
import { Lightbox } from './Lightbox';
import { compressImageToBase64, uploadOrCompressImage } from '../utils/imageService';
import { HistoryPanel } from './HistoryPanel';

interface FormImageItem {
  id: string;
  url: string;
  progress: number;
  isReady: boolean;
  error?: string;
}

interface PocketPlacesModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'all' | 'food' | 'spot' | 'shopping';
  tripId?: string;
  pocketItems: PocketItem[];
  tripDays: TripDay[];
  onAddItem: (item: Omit<PocketItem, 'id' | 'createdAt'>) => Promise<void> | void;
  onUpdateItem: (item: PocketItem) => Promise<void> | void;
  onDeleteItem: (id: string) => void;
  onAddToSchedule?: (item: PocketItem, targetDate: string, time: string) => void;
}

const FOOD_PRESET_TAGS = ['拉麵', '燒肉', '甜點/咖啡', '壽司/海鮮', '居酒屋', '米其林/名店', '排隊美食', '伴手禮', '早午餐'];
const SPOT_PRESET_TAGS = ['熱門景點', '自然風光', '夜景', '神社/古蹟', '體驗/手作', '文青展覽', '溫泉', '拍照打卡', '公園/散步'];
const SHOPPING_PRESET_TAGS = ['伴手禮', '藥妝', '百貨商場', '零食/點心', '服飾/潮牌', '家電/雜貨', '文具/雜貨', '免稅店', '超市/量販', '限定商品'];

interface PocketItemCardProps {
  item: PocketItem;
  activeTab: 'all' | 'food' | 'spot' | 'shopping';
  isFood: boolean;
  isSpot: boolean;
  isShopping: boolean;
  isCopied: boolean;
  canAddToSchedule: boolean;
  onToggleVisited: (item: PocketItem) => void;
  onAddToSchedule: (item: PocketItem) => void;
  onOpenEditForm: (item: PocketItem) => void;
  onViewHistory?: (item: PocketItem) => void;
  onDeleteItem: (id: string, title: string) => void;
  onCopyText: (text: string, id: string) => void;
  onOpenMap: (location: string) => void;
  onOpenLightbox: (images: string[], index: number) => void;
}

const PocketItemCard: React.FC<PocketItemCardProps> = React.memo(({
  item,
  activeTab,
  isFood,
  isSpot,
  isShopping,
  isCopied,
  canAddToSchedule,
  onToggleVisited,
  onAddToSchedule,
  onOpenEditForm,
  onViewHistory,
  onDeleteItem,
  onCopyText,
  onOpenMap,
  onOpenLightbox,
}) => {
  // Normalize fields so legacy or alternative property names are NEVER lost
  const displayNotes = item.notes || (item as any).note || '';
  const displayLocation = item.location || (item as any).address || '';
  const displayUrl = item.url || (item as any).googleMapUrl || (item as any).link || '';
  const displayPriceRange = item.priceRange || (item as any).price || '';

  const displayImages = useMemo(() => {
    const list: string[] = [];
    if (Array.isArray(item.images)) {
      list.push(...item.images.filter(Boolean));
    }
    if ((item as any).image && typeof (item as any).image === 'string' && !list.includes((item as any).image)) {
      list.push((item as any).image);
    }
    return list;
  }, [item.images, (item as any).image]);

  const resolvedCategory = item.category || 'spot';
  const isFoodCategory = resolvedCategory === 'food';
  const isShoppingCategory = resolvedCategory === 'shopping';

  return (
    <div
      className={`bg-white rounded-3xl p-4 sm:p-5 border-2 ${
        item.isVisited ? 'border-gray-200 opacity-75' : 'border-beige-dark hover:border-sage/50'
      } shadow-sm transition-all`}
    >
      {/* Card Header */}
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="flex items-start gap-2.5 flex-1 min-w-0">
          <button
            type="button"
            onClick={() => onToggleVisited(item)}
            className="mt-0.5 text-gray-400 hover:text-sage transition-colors flex-shrink-0"
            title={item.isVisited ? '標記為未造訪/未購買' : '標記為已造訪/已購買'}
          >
            {item.isVisited ? (
              <CheckCircle2 size={20} className="text-emerald-500 fill-emerald-50" />
            ) : (
              <Circle size={20} className="text-gray-300" />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h4 className={`text-base font-black text-cocoa break-words ${item.isVisited ? 'line-through text-gray-400' : ''}`}>
                {item.title}
              </h4>

              {/* Show category chip when in 'All' tab */}
              {activeTab === 'all' && (
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                  isFoodCategory 
                    ? 'bg-orange-50 text-orange-700 border-orange-200' 
                    : isShoppingCategory
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-teal-50 text-teal-700 border-teal-200'
                }`}>
                  {isFoodCategory ? '美食' : isShoppingCategory ? '購物' : '景點'}
                </span>
              )}

              {item.tag && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  isFoodCategory 
                    ? 'bg-orange-50 text-orange-700 border-orange-200' 
                    : isSpot 
                    ? 'bg-teal-50 text-teal-700 border-teal-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}>
                  {item.tag}
                </span>
              )}

              {item.assignedDate && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sage/10 text-sage border border-sage/20">
                  預計: {item.assignedDate}
                </span>
              )}
            </div>

            {/* Rating Stars */}
            {item.rating && item.rating > 0 && (
              <div className="flex items-center gap-0.5 text-amber-400">
                {Array.from({ length: item.rating }).map((_, i) => (
                  <Star key={i} size={12} className="fill-amber-400 text-amber-400" />
                ))}
                <span className="text-[10px] font-bold text-gray-400 ml-1">
                  {item.rating}.0
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {canAddToSchedule && (
            <button
              type="button"
              onClick={() => onAddToSchedule(item)}
              className="p-1.5 text-sage hover:bg-sage/10 rounded-lg transition-colors"
              title="加入每日行程"
            >
              <CalendarPlus size={16} />
            </button>
          )}
          <button
            type="button"
            onClick={() => onOpenEditForm(item)}
            className="p-1.5 text-gray-400 hover:text-cocoa hover:bg-gray-100 rounded-lg transition-colors"
            title="編輯"
          >
            <Edit3 size={15} />
          </button>
          {onViewHistory && (
            <button
              type="button"
              onClick={() => onViewHistory(item)}
              className="p-1.5 text-gray-400 hover:text-cocoa hover:bg-gray-100 rounded-lg transition-colors"
              title="查看修改紀錄"
            >
              <History size={15} />
            </button>
          )}
          <button
            type="button"
            onClick={() => onDeleteItem(item.id, item.title)}
            className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="刪除"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Location & Address with Map navigation */}
      {displayLocation && (
        <div className="flex items-center gap-2 text-xs font-bold text-gray-600 bg-gray-50 px-3 py-2 rounded-xl mb-2 border border-gray-100 flex-wrap sm:flex-nowrap">
          <MapPin size={14} className="text-sage flex-shrink-0" />
          <span className="flex-1 break-words leading-snug">{displayLocation}</span>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              type="button"
              onClick={() => onCopyText(displayLocation, item.id)}
              className="p-1 bg-white hover:bg-gray-100 rounded-lg text-gray-500 border border-gray-200 transition-colors"
              title="複製地址"
            >
              {isCopied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
            </button>
            <button
              type="button"
              onClick={() => onOpenMap(displayLocation)}
              className="p-1 bg-white hover:bg-sage hover:text-white rounded-lg text-cocoa border border-gray-200 transition-colors flex items-center gap-1 px-2 text-[11px]"
              title="在 Google Maps 開啟"
            >
              <Navigation size={11} /> 導航
            </button>
          </div>
        </div>
      )}

      {/* Price Range */}
      {displayPriceRange && (
        <div className="mb-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200/80">
            <span className="text-emerald-600 font-medium">預算/價格:</span>
            <span className="font-black text-emerald-950">{displayPriceRange}</span>
          </span>
        </div>
      )}

      {/* URL Hyperlink */}
      {displayUrl && (
        <div className="mb-2">
          <a
            href={displayUrl.startsWith('http') ? displayUrl : `https://${displayUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50/80 hover:bg-blue-100 px-3 py-1.5 rounded-xl border border-blue-200/80 transition-colors break-all"
          >
            <ExternalLink size={13} className="flex-shrink-0" />
            <span className="break-all">
              {displayUrl.replace(/^https?:\/\//, '')}
            </span>
          </a>
        </div>
      )}

      {/* Photo Thumbnails */}
      {displayImages.length > 0 && (
        <div className="mb-2.5">
          <div className="flex items-center gap-2 overflow-x-auto custom-scroll pb-1">
            {displayImages.map((imgSrc, imgIdx) => (
              <button
                key={imgIdx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenLightbox(displayImages, imgIdx);
                }}
                className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 border-beige-dark flex-shrink-0 group shadow-2xs hover:border-sage transition-all"
                title="點擊放大檢視"
              >
                <img
                  src={imgSrc}
                  alt={`${item.title} 照片 ${imgIdx + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                  <ZoomIn size={14} />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Notes Box - Full content always visible, never truncated or clamped */}
      {displayNotes && (
        <div className="bg-amber-50/80 p-3.5 rounded-2xl border border-amber-200/80 shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-800 mb-1.5">
            <StickyNote size={14} className="text-amber-600 flex-shrink-0" />
            <span>備註說明:</span>
          </div>
          <div className="text-[11pt] font-medium text-amber-950 whitespace-pre-wrap leading-relaxed select-text break-words">
            {displayNotes}
          </div>
        </div>
      )}
    </div>
  );
});

PocketItemCard.displayName = 'PocketItemCard';

export const PocketPlacesModal: React.FC<PocketPlacesModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'food',
  tripId,
  pocketItems,
  tripDays,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onAddToSchedule,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'food' | 'spot' | 'shopping'>(initialTab || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('全部');
  const [filterVisited, setFilterVisited] = useState<'all' | 'unvisited' | 'visited'>('all');
  const [historyTarget, setHistoryTarget] = useState<PocketItem | null>(null);

  // Sync activeTab if initialTab prop changes
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Pagination & Progressive Virtual Loading State
  const [viewMode, setViewMode] = useState<'pagination' | 'stream'>('pagination');
  const [pageSize, setPageSize] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [streamCount, setStreamCount] = useState<number>(20);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  const listContainerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formImages, setFormImages] = useState<FormImageItem[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lightbox State
  const [lightboxState, setLightboxState] = useState<{ images: string[]; index: number } | null>(null);

  const [formData, setFormData] = useState<{
    category: 'food' | 'spot' | 'shopping';
    title: string;
    location: string;
    url: string;
    notes: string;
    tag: string;
    rating: number;
    assignedDate: string;
    priceRange: string;
  }>({
    category: (initialTab === 'food' || initialTab === 'shopping' || initialTab === 'spot') ? initialTab : 'food',
    title: '',
    location: '',
    url: '',
    notes: '',
    tag: '',
    rating: 5,
    assignedDate: '',
    priceRange: '',
  });

  // Add to Schedule dialog state
  const [addToScheduleTarget, setAddToScheduleTarget] = useState<PocketItem | null>(null);
  const [targetScheduleDate, setTargetScheduleDate] = useState<string>(tripDays[0]?.date || '');
  const [targetScheduleTime, setTargetScheduleTime] = useState<string>('12:00');

  // Copy feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Reset pagination when category, search, tag, visited filter or pageSize changes
  useEffect(() => {
    setCurrentPage(1);
    setStreamCount(pageSize);
    if (listContainerRef.current) {
      listContainerRef.current.scrollTop = 0;
    }
  }, [activeTab, searchQuery, selectedTag, filterVisited, pageSize]);

  // Filter items by category
  const currentTabItems = useMemo(() => {
    return pocketItems.filter(item => {
      if (activeTab === 'all') return true;
      const cat = item.category || 'spot';
      if (activeTab === 'food') return cat === 'food';
      if (activeTab === 'shopping') return cat === 'shopping';
      if (activeTab === 'spot') return cat === 'spot' || (cat !== 'food' && cat !== 'shopping');
      return true;
    });
  }, [pocketItems, activeTab]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return currentTabItems.filter(item => {
      const title = item.title || '';
      const location = item.location || (item as any).address || '';
      const notes = item.notes || (item as any).note || '';
      const tag = item.tag || '';
      const priceRange = item.priceRange || (item as any).price || '';
      const url = item.url || (item as any).googleMapUrl || (item as any).link || '';

      const matchesSearch = !q ||
        title.toLowerCase().includes(q) ||
        location.toLowerCase().includes(q) ||
        notes.toLowerCase().includes(q) ||
        tag.toLowerCase().includes(q) ||
        priceRange.toLowerCase().includes(q) ||
        url.toLowerCase().includes(q);

      const matchesTag = selectedTag === '全部' || item.tag === selectedTag;

      const matchesVisited = 
        filterVisited === 'all' ||
        (filterVisited === 'visited' && item.isVisited) ||
        (filterVisited === 'unvisited' && !item.isVisited);

      return matchesSearch && matchesTag && matchesVisited;
    });
  }, [currentTabItems, searchQuery, selectedTag, filterVisited]);

  const availableTags = useMemo(
    () => ['全部', ...Array.from(new Set(currentTabItems.map(i => i.tag).filter(Boolean))) as string[]],
    [currentTabItems]
  );

  const totalItems = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  // Slice items for rendering to eliminate the 10-second DOM mount freeze
  const displayedItems = useMemo(() => {
    if (viewMode === 'pagination') {
      const startIndex = (safeCurrentPage - 1) * pageSize;
      return filteredItems.slice(startIndex, startIndex + pageSize);
    } else {
      return filteredItems.slice(0, streamCount);
    }
  }, [filteredItems, viewMode, safeCurrentPage, pageSize, streamCount]);

  // IntersectionObserver for Stream / Progressive loading mode
  useEffect(() => {
    if (viewMode !== 'stream') return;
    if (streamCount >= filteredItems.length) return;

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isLoadingMore) {
          setIsLoadingMore(true);
          setTimeout(() => {
            setStreamCount(prev => Math.min(prev + pageSize, filteredItems.length));
            setIsLoadingMore(false);
          }, 80);
        }
      },
      {
        root: listContainerRef.current,
        rootMargin: '120px',
        threshold: 0.1,
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [viewMode, streamCount, filteredItems.length, pageSize, isLoadingMore]);

  const handlePageChange = useCallback((newPage: number) => {
    const targetPage = Math.max(1, Math.min(newPage, totalPages));
    setCurrentPage(targetPage);
    listContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [totalPages]);

  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (safeCurrentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }
    if (safeCurrentPage >= totalPages - 3) {
      return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, '...', safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1, '...', totalPages];
  }, [totalPages, safeCurrentPage]);

  const handleOpenAddForm = (category: 'food' | 'spot' | 'shopping') => {
    setEditingId(null);
    setUploadError(null);
    setFormData({
      category,
      title: '',
      location: '',
      url: '',
      notes: '',
      tag: '',
      rating: 5,
      assignedDate: '',
      priceRange: '',
    });
    setFormImages([]);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (item: PocketItem) => {
    setEditingId(item.id);
    setUploadError(null);
    const cat = (item.category === 'food' || item.category === 'shopping' || item.category === 'spot')
      ? item.category
      : 'spot';

    setFormData({
      category: cat,
      title: item.title || '',
      location: item.location || (item as any).address || '',
      url: item.url || (item as any).googleMapUrl || (item as any).link || '',
      notes: item.notes || (item as any).note || '',
      tag: item.tag || '',
      rating: item.rating || 5,
      assignedDate: item.assignedDate || '',
      priceRange: item.priceRange || (item as any).price || '',
    });

    // Gather images from both array and legacy single image string
    const existingImages: string[] = [];
    if (Array.isArray(item.images)) {
      existingImages.push(...item.images.filter(Boolean));
    }
    if ((item as any).image && typeof (item as any).image === 'string' && !existingImages.includes((item as any).image)) {
      existingImages.push((item as any).image);
    }

    setFormImages(
      existingImages.map((imgUrl, i) => ({
        id: `existing-${item.id}-${i}-${Date.now()}`,
        url: imgUrl,
        progress: 100,
        isReady: true,
      }))
    );
    setIsFormOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadError(null);
    const currentCount = formImages.length;
    const remaining = 10 - currentCount;
    if (remaining <= 0) return;

    const filesToUpload = Array.from(files).slice(0, remaining);

    // 1. Create immediate placeholder items
    const newItems: FormImageItem[] = filesToUpload.map((file, idx) => {
      let previewUrl = '';
      try {
        previewUrl = URL.createObjectURL(file);
      } catch (err) {
        console.warn('URL.createObjectURL failed:', err);
      }
      return {
        id: `upload-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
        url: previewUrl,
        progress: 30,
        isReady: false,
      };
    });

    setFormImages(prev => [...prev, ...newItems]);

    // Reset input immediately so user can select again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // 2. Compress each file directly using Stepped Downsampling and Psycho-Visual WebP Engine
    const compressionPromises = filesToUpload.map(async (file, idx) => {
      const targetItem = newItems[idx];
      try {
        const compressedOrUrl = await uploadOrCompressImage(file, tripId);

        if (compressedOrUrl && (compressedOrUrl.startsWith('data:image/') || compressedOrUrl.startsWith('http'))) {
          setFormImages(prev =>
            prev.map(item =>
              item.id === targetItem.id
                ? { ...item, url: compressedOrUrl, progress: 100, isReady: true, error: undefined }
                : item
            )
          );
        } else {
          throw new Error('圖片格式無法解碼');
        }
      } catch (error: any) {
        console.error(`Error processing image #${idx + 1}:`, error);
        setUploadError(`第 ${idx + 1} 張圖片「${file.name || '照片'}」處理失敗，已自動跳過`);
        setFormImages(prev => prev.filter(item => item.id !== targetItem.id));
      }
    });

    await Promise.allSettled(compressionPromises);
  };

  const handleRemoveFormImage = (idToRemove: string) => {
    setFormImages(prev => prev.filter(img => img.id !== idToRemove));
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || isSaving) return;

    if (formImages.some(img => !img.isReady)) {
      setUploadError('圖片尚在壓縮中，請稍候片刻再儲存');
      return;
    }

    setIsSaving(true);
    setUploadError(null);

    try {
      // Filter only fully compressed base64 / valid URLs (never allow transient blob: URLs to database)
      const finalImages = formImages
        .filter(img => img.isReady && img.url && (img.url.startsWith('data:image/') || img.url.startsWith('http')))
        .map(img => img.url);

      if (editingId) {
        const original = pocketItems.find(p => p.id === editingId);
        if (original) {
          await onUpdateItem({
            ...original,
            category: formData.category,
            title: formData.title.trim(),
            location: formData.location.trim(),
            url: formData.url.trim(),
            notes: formData.notes.trim(),
            tag: formData.tag.trim(),
            rating: formData.rating,
            assignedDate: formData.assignedDate,
            priceRange: formData.priceRange.trim() || undefined,
            images: finalImages,
          });
        }
      } else {
        await onAddItem({
          category: formData.category,
          title: formData.title.trim(),
          location: formData.location.trim(),
          url: formData.url.trim(),
          notes: formData.notes.trim(),
          tag: formData.tag.trim(),
          rating: formData.rating,
          assignedDate: formData.assignedDate,
          priceRange: formData.priceRange.trim() || undefined,
          images: finalImages,
          isVisited: false,
        });
      }

      // 儲存成功才關閉表單，確保使用者編輯資料絕不遺失
      setIsFormOpen(false);
      setEditingId(null);
    } catch (err: any) {
      console.error('儲存口袋名單失敗:', err);
      setUploadError(
        err?.message?.includes('size') || err?.message?.includes('1,048,576')
          ? '照片總容量過大超出儲存限制，請嘗試刪除 1～2 張照片後再按儲存（您的筆記文字已完整保留！）。'
          : '儲存失敗，請重試！您的編輯內容與備註皆已完整保留，未遺失。'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleVisited = useCallback((item: PocketItem) => {
    onUpdateItem({
      ...item,
      isVisited: !item.isVisited,
    });
  }, [onUpdateItem]);

  const handleCopyText = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const handleOpenMap = useCallback((location: string) => {
    const encoded = encodeURIComponent(location);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encoded}`, '_blank', 'noopener,noreferrer');
  }, []);

  const handleDeleteItem = useCallback((id: string, title: string) => {
    if (window.confirm(`確定要刪除「${title}」嗎？`)) {
      onDeleteItem(id);
    }
  }, [onDeleteItem]);

  const handleOpenLightbox = useCallback((images: string[], index: number) => {
    setLightboxState({ images, index });
  }, []);

  const handleAddToScheduleClick = useCallback((item: PocketItem) => {
    setAddToScheduleTarget(item);
    setTargetScheduleDate(item.assignedDate || tripDays[0]?.date || '');
  }, [tripDays]);

  const confirmAddToSchedule = () => {
    if (addToScheduleTarget && onAddToSchedule) {
      onAddToSchedule(addToScheduleTarget, targetScheduleDate, targetScheduleTime);
      setAddToScheduleTarget(null);
    }
  };

  const currentTheme = activeTab === 'food' 
    ? {
        primary: 'bg-orange-500',
        primaryHover: 'hover:bg-orange-600',
        lightBg: 'bg-orange-50',
        badgeBg: 'bg-orange-100 text-orange-700 border-orange-200',
        border: 'border-orange-200',
        iconColor: 'text-orange-500',
        name: '美食口袋名單',
        itemType: '美食',
      }
    : activeTab === 'spot'
    ? {
        primary: 'bg-teal-600',
        primaryHover: 'hover:bg-teal-700',
        lightBg: 'bg-teal-50',
        badgeBg: 'bg-teal-100 text-teal-800 border-teal-200',
        border: 'border-teal-200',
        iconColor: 'text-teal-600',
        name: '探索景點名單',
        itemType: '探索景點',
      }
    : activeTab === 'shopping'
    ? {
        primary: 'bg-rose-500',
        primaryHover: 'hover:bg-rose-600',
        lightBg: 'bg-rose-50',
        badgeBg: 'bg-rose-100 text-rose-800 border-rose-200',
        border: 'border-rose-200',
        iconColor: 'text-rose-500',
        name: '購物/伴手禮名單',
        itemType: '購物/伴手禮',
      }
    : {
        primary: 'bg-cocoa',
        primaryHover: 'hover:bg-cocoa/90',
        lightBg: 'bg-beige-light',
        badgeBg: 'bg-cocoa/10 text-cocoa border-cocoa/20',
        border: 'border-beige-dark',
        iconColor: 'text-cocoa',
        name: '全部口袋名單',
        itemType: '口袋名單',
      };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-cocoa/60 backdrop-blur-sm z-[70] flex flex-col items-center justify-end sm:justify-center sm:p-4 animate-fade-in" onClick={onClose}>
      <div 
        className="bg-[#FAF8F2] w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-2xl sm:rounded-[2.5rem] rounded-none shadow-2xl border-0 sm:border-4 sm:border-beige-dark flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header with Switchable Tabs */}
        <div className="bg-white px-4 sm:px-6 pt-5 pb-3 border-b-2 border-beige-dark flex-shrink-0">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-cocoa">口袋名單筆記</span>
              <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                共 {pocketItems.length} 項
              </span>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 bg-white rounded-full text-gray-400 hover:text-red-400 border border-beige-dark shadow-sm transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Main Category Tabs (全部, 美食清單, 探索景點, 購物/伴手禮) */}
          <div className="grid grid-cols-4 gap-1 sm:gap-1.5 bg-gray-100 p-1 sm:p-1.5 rounded-2xl">
            <button
              onClick={() => { setActiveTab('all'); setSelectedTag('全部'); }}
              className={`flex items-center justify-center gap-1 sm:gap-1.5 py-2 sm:py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all ${
                activeTab === 'all'
                  ? 'bg-cocoa text-white shadow-sm'
                  : 'text-gray-500 hover:text-cocoa hover:bg-white/50'
              }`}
            >
              <Layers size={15} className="flex-shrink-0" /> <span className="truncate">全部</span>
              <span className={`text-[10px] sm:text-xs px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'all' ? 'bg-cocoa-light text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {pocketItems.length}
              </span>
            </button>
            <button
              onClick={() => { setActiveTab('food'); setSelectedTag('全部'); }}
              className={`flex items-center justify-center gap-1 sm:gap-1.5 py-2 sm:py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all ${
                activeTab === 'food'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-gray-500 hover:text-orange-600 hover:bg-white/50'
              }`}
            >
              <Utensils size={15} className="flex-shrink-0" /> <span className="truncate">美食</span>
              <span className={`text-[10px] sm:text-xs px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'food' ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {pocketItems.filter(p => p.category === 'food').length}
              </span>
            </button>
            <button
              onClick={() => { setActiveTab('spot'); setSelectedTag('全部'); }}
              className={`flex items-center justify-center gap-1 sm:gap-1.5 py-2 sm:py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all ${
                activeTab === 'spot'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-teal-700 hover:bg-white/50'
              }`}
            >
              <Compass size={15} className="flex-shrink-0" /> <span className="truncate">景點</span>
              <span className={`text-[10px] sm:text-xs px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'spot' ? 'bg-teal-700 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {pocketItems.filter(p => (p.category || 'spot') === 'spot').length}
              </span>
            </button>
            <button
              onClick={() => { setActiveTab('shopping'); setSelectedTag('全部'); }}
              className={`flex items-center justify-center gap-1 sm:gap-1.5 py-2 sm:py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all ${
                activeTab === 'shopping'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-gray-500 hover:text-rose-600 hover:bg-white/50'
              }`}
            >
              <ShoppingBag size={15} className="flex-shrink-0" /> <span className="truncate">購物</span>
              <span className={`text-[10px] sm:text-xs px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'shopping' ? 'bg-rose-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {pocketItems.filter(p => p.category === 'shopping').length}
              </span>
            </button>
          </div>

          {/* Search, Tag Filters & Quick Add */}
          <div className="mt-3 flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={
                  activeTab === 'food' 
                    ? '搜尋美食店名、地址、備註、預算...' 
                    : activeTab === 'spot' 
                    ? '搜尋景點、地名、備註...' 
                    : activeTab === 'shopping'
                    ? '搜尋伴手禮、商品、店名、備註...'
                    : '搜尋口袋名單店名、地址、備註、標籤、預算...'
                }
                className="w-full bg-gray-50 pl-9 pr-3 py-2 rounded-xl text-xs font-bold border border-gray-200 focus:border-sage outline-none"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')} 
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <button
              onClick={() => handleOpenAddForm(activeTab === 'all' ? 'food' : activeTab)}
              className={`${currentTheme.primary} ${currentTheme.primaryHover} text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 flex-shrink-0`}
            >
              <Plus size={15} strokeWidth={2.5} /> 新增{activeTab === 'food' ? '美食' : activeTab === 'spot' ? '景點' : activeTab === 'shopping' ? '購物' : '筆記'}
            </button>
          </div>

          {/* Tag Chips Horizontal Scroll */}
          {availableTags.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto py-2 no-scrollbar text-xs">
              {availableTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition-all ${
                    selectedTag === tag
                      ? `${activeTab === 'food' ? 'bg-orange-100 text-orange-800 border-orange-300' : activeTab === 'spot' ? 'bg-teal-100 text-teal-800 border-teal-300' : activeTab === 'shopping' ? 'bg-rose-100 text-rose-800 border-rose-300' : 'bg-cocoa text-white border-cocoa'} border`
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          {/* Pagination & View Mode Toolbar */}
          <div className="mt-2.5 pt-2 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-gray-500">
              <span className="text-cocoa font-black">共 {filteredItems.length} 項</span>
              {filteredItems.length > 0 && (
                <span className="text-gray-400 font-medium">
                  {viewMode === 'pagination'
                    ? (pageSize >= 9999 ? '· 完整列表' : `· 第 ${safeCurrentPage}/${totalPages} 頁 (第 ${((safeCurrentPage - 1) * pageSize) + 1} ~ ${Math.min(safeCurrentPage * pageSize, filteredItems.length)} 項)`)
                    : `· 已載入 ${displayedItems.length} 項`}
                </span>
              )}
              {(searchQuery || selectedTag !== '全部' || filterVisited !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedTag('全部');
                    setFilterVisited('all');
                  }}
                  className="ml-1 text-[11px] text-amber-600 hover:text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md font-bold"
                >
                  清除篩選 (顯示全部)
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 ml-auto">
              {/* Mode switch */}
              <div className="flex items-center bg-gray-100 p-0.5 rounded-xl border border-gray-200">
                <button
                  type="button"
                  onClick={() => setViewMode('pagination')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    viewMode === 'pagination'
                      ? 'bg-white text-cocoa shadow-2xs'
                      : 'text-gray-400 hover:text-gray-700'
                  }`}
                  title="分頁瀏覽模式"
                >
                  <FileText size={12} /> 分頁模式
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('stream')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    viewMode === 'stream'
                      ? 'bg-white text-cocoa shadow-2xs'
                      : 'text-gray-400 hover:text-gray-700'
                  }`}
                  title="連續捲動加載模式"
                >
                  <Layers size={12} /> 捲動加載
                </button>
              </div>

              {/* Page size select */}
              {viewMode === 'pagination' && (
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="bg-gray-100 text-gray-600 text-[11px] font-bold px-2 py-1 rounded-lg border border-gray-200 outline-none cursor-pointer"
                  title="每頁顯示筆數"
                >
                  <option value={10}>10 筆/頁</option>
                  <option value={20}>20 筆/頁</option>
                  <option value={50}>50 筆/頁</option>
                  <option value={9999}>全部顯示 (不分頁)</option>
                </select>
              )}
            </div>
          </div>
        </div>

        {/* Content Body - Card List */}
        <div ref={listContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 no-scrollbar">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 px-4 bg-white/70 rounded-3xl border-2 border-dashed border-beige-dark">
              <div className={`w-16 h-16 mx-auto rounded-full ${currentTheme.lightBg} flex items-center justify-center mb-3`}>
                {activeTab === 'food' ? (
                  <Utensils size={28} className="text-orange-400" />
                ) : activeTab === 'spot' ? (
                  <Compass size={28} className="text-teal-500" />
                ) : activeTab === 'shopping' ? (
                  <ShoppingBag size={28} className="text-rose-500" />
                ) : (
                  <Layers size={28} className="text-cocoa" />
                )}
              </div>
              <h4 className="font-black text-cocoa text-base mb-1">
                {searchQuery || selectedTag !== '全部' || filterVisited !== 'all' ? '沒有符合篩選條件的項目' : `尚未新增任何${currentTheme.itemType}`}
              </h4>
              <p className="text-xs text-gray-400 font-bold mb-4">
                {activeTab === 'shopping' 
                  ? '可以記錄想買的伴手禮、藥妝清單、推薦零食、特色紀念品與購買地點！'
                  : activeTab === 'food'
                  ? '可以記錄網路上查到想吃的私房餐廳、必逛打卡點、地址超連結與備註！'
                  : '可以記錄美食、景點、購物清單，隨時隨地加入行程中！'}
              </p>
              <button
                onClick={() => handleOpenAddForm(activeTab === 'all' ? 'food' : activeTab)}
                className={`inline-flex items-center gap-1.5 ${currentTheme.primary} ${currentTheme.primaryHover} text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all`}
              >
                <Plus size={16} /> 立即新增第一筆{currentTheme.itemType}
              </button>
            </div>
          ) : (
            <>
              {displayedItems.map(item => (
                <PocketItemCard
                  key={item.id}
                  item={item}
                  activeTab={activeTab}
                  isFood={item.category === 'food'}
                  isSpot={item.category === 'spot'}
                  isShopping={item.category === 'shopping'}
                  isCopied={copiedId === item.id}
                  canAddToSchedule={!!onAddToSchedule}
                  onToggleVisited={handleToggleVisited}
                  onAddToSchedule={handleAddToScheduleClick}
                  onOpenEditForm={handleOpenEditForm}
                  onViewHistory={setHistoryTarget}
                  onDeleteItem={handleDeleteItem}
                  onCopyText={handleCopyText}
                  onOpenMap={handleOpenMap}
                  onOpenLightbox={handleOpenLightbox}
                />
              ))}

              {/* Pagination Bar */}
              {viewMode === 'pagination' && totalPages > 1 && (
                <div className="pt-4 pb-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-beige-dark/70">
                  <div className="text-xs font-bold text-gray-400">
                    第 <span className="text-cocoa font-black">{safeCurrentPage}</span> 頁，共 {totalPages} 頁 ({filteredItems.length} 項)
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handlePageChange(1)}
                      disabled={safeCurrentPage === 1}
                      className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-cocoa hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                      title="第一頁"
                    >
                      <ChevronsLeft size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePageChange(safeCurrentPage - 1)}
                      disabled={safeCurrentPage === 1}
                      className="px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-600 hover:text-cocoa hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none transition-colors flex items-center gap-1"
                    >
                      <ChevronLeft size={14} /> 上一頁
                    </button>

                    <div className="flex items-center gap-1 mx-1">
                      {pageNumbers.map((p, idx) => {
                        if (p === '...') {
                          return (
                            <span key={`ellipsis-${idx}`} className="px-1 text-xs text-gray-400 font-bold">
                              …
                            </span>
                          );
                        }
                        const pageNum = p as number;
                        const isActive = pageNum === safeCurrentPage;
                        return (
                          <button
                            key={pageNum}
                            type="button"
                            onClick={() => handlePageChange(pageNum)}
                            className={`min-w-[32px] h-8 rounded-lg text-xs font-black transition-all ${
                              isActive
                                ? `${currentTheme.primary} text-white shadow-2xs scale-105`
                                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={() => handlePageChange(safeCurrentPage + 1)}
                      disabled={safeCurrentPage === totalPages}
                      className="px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-600 hover:text-cocoa hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none transition-colors flex items-center gap-1"
                    >
                      下一頁 <ChevronRight size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePageChange(totalPages)}
                      disabled={safeCurrentPage === totalPages}
                      className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-cocoa hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                      title="最後一頁"
                    >
                      <ChevronsRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* Stream Mode Sentinel / Load More / Completed state */}
              {viewMode === 'stream' && (
                <div className="pt-3 pb-2 text-center">
                  {displayedItems.length < filteredItems.length ? (
                    <div ref={sentinelRef} className="py-2">
                      {isLoadingMore ? (
                        <div className="flex items-center justify-center gap-2 text-xs font-bold text-gray-400 py-1">
                          <Loader2 size={16} className="animate-spin text-orange-500" />
                          <span>正在載入更多口袋名單筆記...</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setIsLoadingMore(true);
                            setTimeout(() => {
                              setStreamCount(prev => Math.min(prev + pageSize, filteredItems.length));
                              setIsLoadingMore(false);
                            }, 80);
                          }}
                          className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 shadow-2xs transition-all active:scale-95"
                        >
                          載入更多 (還有 {filteredItems.length - displayedItems.length} 項)
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="py-2">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/80 border border-beige-dark rounded-full text-xs font-bold text-gray-400">
                        <CheckCircle2 size={13} className="text-sage" />
                        <span>已顯示全部 {filteredItems.length} 項名單</span>
                      </div>
                    </div>
                  )}

                  {displayedItems.length > 12 && (
                    <button
                      type="button"
                      onClick={() => listContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
                      className="mx-auto mt-2 flex items-center gap-1 text-[11px] font-bold text-gray-400 hover:text-cocoa py-1 px-2.5 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <ArrowUp size={12} /> 回到頂部
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-white p-4 border-t border-beige-dark flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-400">狀態篩選：</span>
            <button
              onClick={() => setFilterVisited('all')}
              className={`text-xs px-2.5 py-1 rounded-lg font-bold ${
                filterVisited === 'all' ? 'bg-cocoa text-white' : 'bg-gray-100 text-gray-500'
              }`}
            >
              全部
            </button>
            <button
              onClick={() => setFilterVisited('unvisited')}
              className={`text-xs px-2.5 py-1 rounded-lg font-bold ${
                filterVisited === 'unvisited' ? 'bg-cocoa text-white' : 'bg-gray-100 text-gray-500'
              }`}
            >
              想去
            </button>
            <button
              onClick={() => setFilterVisited('visited')}
              className={`text-xs px-2.5 py-1 rounded-lg font-bold ${
                filterVisited === 'visited' ? 'bg-cocoa text-white' : 'bg-gray-100 text-gray-500'
              }`}
            >
              已去
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-cocoa font-bold rounded-xl text-xs transition-colors"
          >
            關閉
          </button>
        </div>
      </div>

      {/* Add / Edit Item Sub-Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-cocoa/60 backdrop-blur-sm z-[80] flex flex-col items-center justify-end sm:justify-center sm:p-4 animate-fade-in" onClick={() => setIsFormOpen(false)}>
          <div 
            className="bg-[#FAF8F2] w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-lg sm:rounded-[2.5rem] rounded-none p-5 sm:p-6 shadow-2xl border-0 sm:border-4 sm:border-beige-dark flex flex-col justify-between overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-3 border-b-2 border-beige-dark flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full ${
                  formData.category === 'food' ? 'bg-orange-100 text-orange-600' : formData.category === 'spot' ? 'bg-teal-100 text-teal-700' : 'bg-rose-100 text-rose-600'
                } flex items-center justify-center`}>
                  {formData.category === 'food' ? <Utensils size={16} /> : formData.category === 'spot' ? <Compass size={16} /> : <ShoppingBag size={16} />}
                </div>
                <h3 className="text-lg font-black text-cocoa">
                  {editingId ? '編輯' : '新增'} {formData.category === 'food' ? '美食' : formData.category === 'spot' ? '探索地點' : '購物/伴手禮'}
                </h3>
              </div>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="p-2 bg-white rounded-full text-gray-400 hover:text-red-400 border border-beige-dark shadow-sm transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="flex flex-col h-full overflow-hidden justify-between">
              <div className="space-y-4 overflow-y-auto custom-scroll flex-1 py-4 pr-1">
              {/* Category selector */}
              <div>
                <label className="text-xs font-black text-gray-400 block mb-1.5 uppercase">類型</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, category: 'food' })}
                    className={`py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1 border-2 transition-all ${
                      formData.category === 'food' 
                        ? 'bg-orange-500 text-white border-orange-500 shadow-sm' 
                        : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <Utensils size={14} /> 美食
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, category: 'spot' })}
                    className={`py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1 border-2 transition-all ${
                      formData.category === 'spot' 
                        ? 'bg-teal-600 text-white border-teal-600 shadow-sm' 
                        : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <Compass size={14} /> 探索景點
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, category: 'shopping' })}
                    className={`py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1 border-2 transition-all ${
                      formData.category === 'shopping' 
                        ? 'bg-rose-500 text-white border-rose-500 shadow-sm' 
                        : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <ShoppingBag size={14} /> 購物/伴手禮
                  </button>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="text-xs font-black text-gray-400 block mb-1">
                  {formData.category === 'food' ? '餐廳 / 美食店名 *' : formData.category === 'spot' ? '景點 / 地點名稱 *' : '商品 / 伴手禮 / 店家名稱 *'}
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder={
                    formData.category === 'food' 
                      ? '例：一蘭拉麵 本店 / 六花亭' 
                      : formData.category === 'spot' 
                      ? '例：小樽運河 / 函館山夜景' 
                      : '例：白色戀人 / 大國藥妝 / 獺祭二割三分'
                  }
                  className="w-full bg-gray-50 p-3 rounded-xl border border-gray-200 focus:border-sage outline-none font-bold text-sm text-cocoa"
                />
              </div>

              {/* Address / Location */}
              <div>
                <label className="text-xs font-black text-gray-400 block mb-1">
                  {formData.category === 'shopping' ? '購買地點 / 店家地址' : '地址 / 地點'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                    placeholder="例：北海道函館市若松町 / 新千歲機場免稅店"
                    className="w-full bg-gray-50 p-3 pr-10 rounded-xl border border-gray-200 focus:border-sage outline-none font-bold text-sm text-cocoa"
                  />
                  <MapPin size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              {/* URL Hyperlink */}
              <div>
                <label className="text-xs font-black text-gray-400 block mb-1">超連結 (網址)</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.url}
                    onChange={e => setFormData({ ...formData, url: e.target.value })}
                    placeholder="https://..."
                    className="w-full bg-gray-50 p-3 pr-10 rounded-xl border border-gray-200 focus:border-sage outline-none font-bold text-sm text-cocoa font-mono text-xs"
                  />
                  <ExternalLink size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="text-xs font-black text-gray-400 block mb-1">標籤分類</label>
                <input
                  type="text"
                  value={formData.tag}
                  onChange={e => setFormData({ ...formData, tag: e.target.value })}
                  placeholder="自訂標籤或點選下方預設"
                  className="w-full bg-gray-50 p-2.5 rounded-xl border border-gray-200 focus:border-sage outline-none font-bold text-xs text-cocoa mb-1.5"
                />
                <div className="flex flex-wrap gap-1">
                  {(formData.category === 'food' ? FOOD_PRESET_TAGS : formData.category === 'spot' ? SPOT_PRESET_TAGS : SHOPPING_PRESET_TAGS).map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setFormData({ ...formData, tag: preset })}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-all ${
                        formData.tag === preset 
                          ? 'bg-sage text-white border-sage' 
                          : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rating & Assigned Day */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black text-gray-400 block mb-1">推薦星等</label>
                  <select
                    value={formData.rating}
                    onChange={e => setFormData({ ...formData, rating: Number(e.target.value) })}
                    className="w-full bg-gray-50 p-2.5 rounded-xl border border-gray-200 focus:border-sage outline-none font-bold text-xs text-cocoa"
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ (必去/必吃)</option>
                    <option value={4}>⭐⭐⭐⭐ (非常推薦)</option>
                    <option value={3}>⭐⭐⭐ (順路可去)</option>
                    <option value={2}>⭐⭐ (備選方案)</option>
                    <option value={1}>⭐ (好奇看看)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-black text-gray-400 block mb-1">預計前往日期 (可選)</label>
                  <select
                    value={formData.assignedDate}
                    onChange={e => setFormData({ ...formData, assignedDate: e.target.value })}
                    className="w-full bg-gray-50 p-2.5 rounded-xl border border-gray-200 focus:border-sage outline-none font-bold text-xs text-cocoa"
                  >
                    <option value="">未指定 (保留在口袋名單)</option>
                    {tripDays.map((d, i) => (
                      <option key={d.date} value={d.date}>
                        Day {i + 1} ({d.date} {d.location || ''})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Photo Upload & Preview Section */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-black text-gray-400 flex items-center gap-1.5">
                    <ImageIcon size={14} className="text-orange-500" /> 照片記錄 / 菜單圖片
                  </label>
                  <span className="text-[10px] font-bold text-sage bg-sage/10 px-2 py-0.5 rounded-full">
                    {formImages.length}/10 張
                  </span>
                </div>

                {uploadError && (
                  <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs font-bold text-red-600 animate-fade-in">
                    <AlertCircle size={14} className="flex-shrink-0 text-red-500" />
                    <span className="flex-1">{uploadError}</span>
                    <button
                      type="button"
                      onClick={() => setUploadError(null)}
                      className="p-1 hover:bg-red-100 rounded-lg text-red-400"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}

                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />

                {/* Upload Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={formImages.some(img => !img.isReady) || formImages.length >= 10}
                  className={`w-full py-3 px-4 rounded-xl border-2 border-dashed transition-all flex items-center justify-center gap-2 text-xs font-black mb-2 ${
                    formImages.length >= 10
                      ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                      : 'border-orange-200 bg-orange-50/50 text-orange-700 hover:bg-orange-100/70 hover:border-orange-300'
                  }`}
                >
                  {formImages.some(img => !img.isReady) ? (
                    <>
                      <Loader2 size={16} className="animate-spin text-orange-500" />
                      <span>正在上傳處理圖片 ({formImages.filter(img => img.isReady).length}/{formImages.length})...</span>
                    </>
                  ) : (
                    <>
                      <Camera size={16} className="text-orange-500" />
                      <span>點此上傳圖片</span>
                    </>
                  )}
                </button>

                {/* Image Thumbnails Grid */}
                {formImages.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                    {formImages.map((img, index) => (
                      <div 
                        key={img.id} 
                        className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group bg-black/5 cursor-pointer shadow-2xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (img.isReady) {
                            const readyImages = formImages.filter(i => i.isReady).map(i => i.url);
                            const activeIdx = readyImages.indexOf(img.url);
                            setLightboxState({ images: readyImages, index: Math.max(0, activeIdx) });
                          }
                        }}
                        title={img.isReady ? "點擊放大預覽" : `正在上傳中 ${img.progress}%`}
                      >
                        <img
                          src={img.url}
                          alt={`上傳照片 ${index + 1}`}
                          className={`w-full h-full object-cover transition-all ${
                            img.isReady ? 'group-hover:scale-105' : 'opacity-60 scale-95'
                          }`}
                        />

                        {/* Active Uploading Progress Overlay (只在正在上傳時顯示進度條與百分比，上傳完成後不顯示) */}
                        {!img.isReady && (
                          <div className="absolute inset-0 bg-black/65 backdrop-blur-[1px] flex flex-col items-center justify-center p-2 z-10">
                            <Loader2 size={16} className="animate-spin text-amber-300 mb-1" />
                            <span className="text-[10px] font-black text-amber-200 tracking-tight leading-none mb-1.5">
                              {img.progress}%
                            </span>
                            <div className="w-full h-1.5 bg-white/25 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-amber-400 rounded-full transition-all duration-200 ease-out"
                                style={{ width: `${img.progress}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Delete Button (Only for ready images or user cancel) */}
                        {img.isReady && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveFormImage(img.id);
                            }}
                            className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-red-500 text-white rounded-full transition-colors shadow-sm z-20 opacity-90 group-hover:opacity-100"
                            title="刪除這張照片"
                          >
                            <X size={11} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Price / Budget Range */}
              <div>
                <label className="text-xs font-black text-gray-400 block mb-1">預算 / 價格區間 (可選)</label>
                <input
                  type="text"
                  value={formData.priceRange}
                  onChange={e => setFormData({ ...formData, priceRange: e.target.value })}
                  placeholder="例：¥1,000 ~ ¥2,000 / NT$500 / 免費"
                  className="w-full bg-gray-50 p-2.5 rounded-xl border border-gray-200 focus:border-sage outline-none font-bold text-xs text-cocoa"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-black text-gray-400 block mb-1">備註說明</label>
                <textarea
                  rows={6}
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="例：推薦必吃必買品項、注意事項、營業時間、心得等..."
                  className="w-full bg-gray-50 p-3.5 rounded-xl border border-gray-200 focus:border-sage outline-none font-medium text-[11pt] text-cocoa min-h-[140px] leading-relaxed resize-y"
                />
              </div>

              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-3 border-t-2 border-beige-dark mt-auto flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1 py-3.5 rounded-2xl border-2 border-beige-dark font-black text-gray-400 hover:bg-gray-50 text-sm transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isSaving || formImages.some(img => !img.isReady)}
                  className={`flex-1 py-3.5 rounded-2xl ${
                    isSaving || formImages.some(img => !img.isReady)
                      ? 'bg-gray-400 cursor-not-allowed opacity-80'
                      : formData.category === 'food' 
                      ? 'bg-orange-500 hover:bg-orange-600 active:scale-95' 
                      : formData.category === 'spot'
                      ? 'bg-teal-600 hover:bg-teal-700 active:scale-95'
                      : 'bg-rose-500 hover:bg-rose-600 active:scale-95'
                  } text-white font-black text-sm shadow-md transition-all flex items-center justify-center gap-2`}
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>儲存資料中...</span>
                    </>
                  ) : formImages.some(img => !img.isReady) ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>圖片處理中...</span>
                    </>
                  ) : (
                    editingId ? '儲存變更' : '新增項目'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add To Schedule Modal */}
      {addToScheduleTarget && (
        <div className="fixed inset-0 bg-cocoa/60 backdrop-blur-sm z-[80] flex flex-col items-center justify-end sm:justify-center sm:p-4 animate-fade-in" onClick={() => setAddToScheduleTarget(null)}>
          <div 
            className="bg-[#FAF8F2] w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-sm sm:rounded-[2.5rem] rounded-none p-5 sm:p-6 shadow-2xl border-0 sm:border-4 sm:border-beige-dark flex flex-col justify-between overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-3 border-b-2 border-beige-dark flex-shrink-0">
              <h3 className="text-lg font-black text-cocoa flex items-center gap-2">
                <CalendarPlus size={20} className="text-sage" /> 加入行程安排
              </h3>
              <button 
                onClick={() => setAddToScheduleTarget(null)}
                className="p-2 bg-white rounded-full text-gray-400 hover:text-red-400 border border-beige-dark shadow-sm transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto custom-scroll flex-1 py-4">
              <p className="text-xs font-bold text-gray-500 mb-4">
                將「<span className="text-cocoa font-black">{addToScheduleTarget.title}</span>」加到行程中：
              </p>

              <div className="space-y-3">
                <div className="bg-white p-3.5 rounded-2xl border-2 border-beige-dark shadow-sm">
                  <label className="text-[11px] font-black text-gray-400 block mb-1">選擇日期</label>
                  <select
                    value={targetScheduleDate}
                    onChange={e => setTargetScheduleDate(e.target.value)}
                    className="w-full bg-beige/30 p-2.5 rounded-xl border border-beige-dark font-bold text-xs text-cocoa outline-none"
                  >
                    {tripDays.map((d, i) => (
                      <option key={d.date} value={d.date}>
                        Day {i + 1} ({d.date} {d.location || ''})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-white p-3.5 rounded-2xl border-2 border-beige-dark shadow-sm">
                  <label className="text-[11px] font-black text-gray-400 block mb-1">預計時間</label>
                  <input
                    type="time"
                    value={targetScheduleTime}
                    onChange={e => setTargetScheduleTime(e.target.value)}
                    className="w-full bg-beige/30 p-2.5 rounded-xl border border-beige-dark font-bold text-xs text-cocoa outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-3 border-t-2 border-beige-dark mt-auto flex-shrink-0">
              <button
                type="button"
                onClick={() => setAddToScheduleTarget(null)}
                className="flex-1 py-3.5 rounded-2xl border-2 border-beige-dark text-gray-400 font-bold text-sm bg-white hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                type="button"
                onClick={confirmAddToSchedule}
                className="flex-1 py-3.5 rounded-2xl bg-sage hover:bg-sage/90 text-white font-black text-sm shadow-md transition-all active:scale-95"
              >
                確認加入
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox for Fullscreen Image Viewing */}
      {lightboxState && (
        <Lightbox
          images={lightboxState.images}
          initialIndex={lightboxState.index}
          onClose={() => setLightboxState(null)}
        />
      )}

      {tripId && historyTarget && (
        <HistoryPanel
          isOpen={!!historyTarget}
          onClose={() => setHistoryTarget(null)}
          tripId={tripId}
          entityId={historyTarget.id}
          entityType="pocket"
          entityTitle={historyTarget.title}
          getCurrentEntity={async () => pocketItems.find(p => p.id === historyTarget.id) || historyTarget}
          onReverted={async (reverted) => {
            await onUpdateItem(reverted as PocketItem);
            setHistoryTarget(null);
          }}
        />
      )}
    </div>
  );
};
