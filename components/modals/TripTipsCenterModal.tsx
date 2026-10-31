import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  X, Lightbulb, Search, Plus, Calendar, Compass, Image as ImageIcon, 
  Trash2, Edit3, Pin, Tag, Sparkles, Eye, Upload, CheckCircle2, ChevronRight,
  ShieldAlert, Train, SunSnow, Ticket, ShoppingBag, Utensils
} from 'lucide-react';
import { TripDay, TripTipItem } from '../../types';
import { compressImageToBase64 } from '../../utils/imageService';
import { DeleteTipConfirmModal } from './DeleteTipConfirmModal';
import { DayTipModal } from './DayTipModal';

interface TripTipsCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripDays: TripDay[];
  tripTips: TripTipItem[];
  onUpdateTripTips: (tips: TripTipItem[]) => void;
  onUpdateDayTip: (date: string, title: string, tip: string, photos: string[]) => void;
  onOpenLightbox?: (images: string[], index: number) => void;
  initialTab?: 'daily' | 'general' | 'photos';
}

const CATEGORIES = [
  { id: 'general', label: '通用須知', icon: Compass, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { id: 'transport', label: '交通轉乘', icon: Train, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { id: 'weather', label: '天氣裝備', icon: SunSnow, color: 'text-teal-600 bg-teal-50 border-teal-200' },
  { id: 'ticket', label: '門票預約', icon: Ticket, color: 'text-purple-600 bg-purple-50 border-purple-200' },
  { id: 'shopping', label: '購物退稅', icon: ShoppingBag, color: 'text-rose-600 bg-rose-50 border-rose-200' },
  { id: 'food', label: '美食必吃', icon: Utensils, color: 'text-orange-600 bg-orange-50 border-orange-200' }
];

export const TripTipsCenterModal: React.FC<TripTipsCenterModalProps> = ({
  isOpen,
  onClose,
  tripDays = [],
  tripTips = [],
  onUpdateTripTips,
  onUpdateDayTip,
  onOpenLightbox,
  initialTab = 'daily'
}) => {
  const [activeTab, setActiveTab] = useState<'daily' | 'general' | 'photos'>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Daily Tip Editor State (opens identical DayTipModal)
  const [editingDayDate, setEditingDayDate] = useState<string | null>(null);

  // General Tip Editor State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTipId, setEditingTipId] = useState<string | null>(null);
  const [tipTitle, setTipTitle] = useState('');
  const [tipContent, setTipContent] = useState('');
  const [tipCategory, setTipCategory] = useState<TripTipItem['category']>('general');
  const [tipPhotos, setTipPhotos] = useState<string[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);
  const [tipToDelete, setTipToDelete] = useState<TripTipItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setTipToDelete(null);
    }
  }, [isOpen, initialTab]);

  // 1. Gather all Daily Tips from tripDays
  const dailyTipsList = useMemo(() => {
    return tripDays.map((d, index) => {
      const dayNum = index + 1;
      const hasTip = Boolean(d.tip || d.tipTitle || (d.tipPhotos && d.tipPhotos.length > 0));
      return {
        day: d,
        dayNum,
        date: d.date,
        location: d.location,
        fruit: d.fruit || '📍',
        title: d.tipTitle || '',
        content: d.tip || '',
        photos: d.tipPhotos || [],
        hasTip
      };
    });
  }, [tripDays]);

  // 2. Filtered General Tips
  const filteredGeneralTips = useMemo(() => {
    return tripTips.filter(tip => {
      if (tip.date && tip.date !== 'global') return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        (tip.title && tip.title.toLowerCase().includes(q)) ||
        (tip.content && tip.content.toLowerCase().includes(q))
      );
    });
  }, [tripTips, searchQuery]);

  // 3. Filtered Daily Tips
  const filteredDailyTips = useMemo(() => {
    if (!searchQuery.trim()) return dailyTipsList;
    const q = searchQuery.toLowerCase();
    return dailyTipsList.filter(d => 
      d.location.toLowerCase().includes(q) ||
      d.title.toLowerCase().includes(q) ||
      d.content.toLowerCase().includes(q) ||
      `day ${d.dayNum}`.includes(q)
    );
  }, [dailyTipsList, searchQuery]);

  // 4. Gather All Photos across general tips & daily tips
  const allTipPhotos = useMemo(() => {
    const list: { url: string; label: string; date?: string }[] = [];
    // From daily tips
    tripDays.forEach((d, idx) => {
      if (Array.isArray(d.tipPhotos)) {
        d.tipPhotos.forEach(p => {
          list.push({
            url: p,
            label: `Day ${idx + 1} ${d.location || ''} ${d.tipTitle || '每日提醒'}`,
            date: d.date
          });
        });
      }
    });
    // From general tips
    tripTips.forEach(tip => {
      if (Array.isArray(tip.images)) {
        tip.images.forEach(img => {
          list.push({
            url: img,
            label: `通用須知 • ${tip.title || '旅程筆記'}`,
            date: tip.date
          });
        });
      }
    });
    return list;
  }, [tripDays, tripTips]);

  // Active Day being edited via DayTipModal
  const activeEditingDay = useMemo(() => {
    if (!editingDayDate) return null;
    return tripDays.find(d => d.date === editingDayDate) || null;
  }, [editingDayDate, tripDays]);

  const activeEditingDayNum = useMemo(() => {
    if (!editingDayDate) return 1;
    const idx = tripDays.findIndex(d => d.date === editingDayDate);
    return idx >= 0 ? idx + 1 : 1;
  }, [editingDayDate, tripDays]);

  // Open Editor for Specific Day Tip (Opens identical DayTipModal directly!)
  const openEditDayTip = (date: string) => {
    setEditingDayDate(date);
  };

  // Open Editor for General Tip
  const openNewGeneralTip = () => {
    setEditingTipId(null);
    setTipTitle('');
    setTipContent('');
    setTipCategory('general');
    setTipPhotos([]);
    setIsEditorOpen(true);
  };

  // Open Editor for existing General Tip
  const openEditGeneralTip = (tip: TripTipItem) => {
    setEditingTipId(tip.id);
    setTipTitle(tip.title || '');
    setTipContent(tip.content || '');
    setTipCategory(tip.category || 'general');
    setTipPhotos(tip.images ? [...tip.images] : []);
    setIsEditorOpen(true);
  };

  const handleSaveEditor = () => {
    if (!tipTitle.trim() && !tipContent.trim() && tipPhotos.length === 0) {
      alert('請至少填寫標題、說明或上傳一張相片');
      return;
    }

    if (editingTipId) {
      // Update existing general tip
      const updated = tripTips.map(t => 
        t.id === editingTipId 
          ? { ...t, title: tipTitle.trim(), content: tipContent.trim(), category: tipCategory, images: tipPhotos, updatedAt: Date.now() }
          : t
      );
      onUpdateTripTips(updated);
    } else {
      // Create new general tip
      const newTip: TripTipItem = {
        id: `tip-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        title: tipTitle.trim() || '未命名須知',
        content: tipContent.trim(),
        category: tipCategory,
        images: tipPhotos,
        createdAt: Date.now()
      };
      onUpdateTripTips([newTip, ...tripTips]);
    }
    setIsEditorOpen(false);
  };

  const handleDeleteGeneralTip = (tip: TripTipItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setTipToDelete(tip);
  };

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
      setTipPhotos(prev => [...prev, ...newBase64List]);
    } catch (err) {
      console.error('壓縮相片失敗:', err);
      alert('上傳相片失敗，請重試');
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-cocoa/60 backdrop-blur-sm z-[70] flex flex-col items-center justify-end sm:justify-center sm:p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-[#FAF8F2] w-full h-[94vh] sm:max-w-2xl sm:rounded-[2.5rem] rounded-t-[2.5rem] p-4 sm:p-7 shadow-2xl border-0 sm:border-4 sm:border-beige-dark flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b-2 border-beige-dark flex-shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 pr-2">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-400 text-white flex items-center justify-center shadow-md flex-shrink-0">
              <Lightbulb size={22} className="fill-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h2 className="text-base sm:text-xl font-black text-cocoa whitespace-nowrap">
                  全旅程 TIP 中心
                </h2>
                <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">
                  備忘必看
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5 truncate">
                每日行程提醒、跨國須知與車票相片
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={openNewGeneralTip}
              className="hidden sm:inline-flex px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-black text-xs items-center gap-1.5 shadow-hard-sm border-2 border-amber-600 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
            >
              <Plus size={14} strokeWidth={3} />
              <span>新增須知</span>
            </button>
            <button 
              type="button"
              onClick={onClose} 
              className="p-2 bg-white rounded-full text-gray-400 hover:text-red-400 border border-beige-dark shadow-sm transition-colors cursor-pointer flex-shrink-0"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Search Bar & Tabs */}
        <div className="pt-3 pb-2 space-y-2.5 flex-shrink-0">
          {/* Search */}
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="搜尋退稅、插座、車票、防寒或特定城市備忘..."
              className="w-full pl-9 pr-4 py-2 bg-white rounded-2xl border-2 border-beige-dark text-xs sm:text-sm font-bold text-cocoa placeholder:text-gray-300 focus:outline-none focus:border-amber-400 transition-colors shadow-xs"
            />
            {searchQuery && (
              <button 
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-cocoa"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Tab Selector: Symmetrical 3-Column Grid */}
          <div className="grid grid-cols-3 bg-[#EFE9DC] p-1 rounded-2xl border border-beige-dark gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('daily')}
              className={`py-2 px-1 rounded-xl text-xs font-black transition-all flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 cursor-pointer ${
                activeTab === 'daily'
                  ? 'bg-white text-cocoa shadow-sm'
                  : 'text-gray-500 hover:text-cocoa'
              }`}
            >
              <div className="flex items-center gap-1">
                <Calendar size={13} className={activeTab === 'daily' ? 'text-amber-500' : ''} />
                <span>每日 TIP</span>
              </div>
              <span className="text-[10px] font-mono opacity-70">
                ({dailyTipsList.filter(d => d.hasTip).length}/{dailyTipsList.length})
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('general')}
              className={`py-2 px-1 rounded-xl text-xs font-black transition-all flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 cursor-pointer ${
                activeTab === 'general'
                  ? 'bg-white text-cocoa shadow-sm'
                  : 'text-gray-500 hover:text-cocoa'
              }`}
            >
              <div className="flex items-center gap-1">
                <Compass size={13} className={activeTab === 'general' ? 'text-amber-500' : ''} />
                <span>通用須知</span>
              </div>
              <span className="text-[10px] font-mono opacity-70">
                ({filteredGeneralTips.length})
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('photos')}
              className={`py-2 px-1 rounded-xl text-xs font-black transition-all flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 cursor-pointer ${
                activeTab === 'photos'
                  ? 'bg-white text-cocoa shadow-sm'
                  : 'text-gray-500 hover:text-cocoa'
              }`}
            >
              <div className="flex items-center gap-1">
                <ImageIcon size={13} className={activeTab === 'photos' ? 'text-amber-500' : ''} />
                <span>相片圖庫</span>
              </div>
              <span className="text-[10px] font-mono opacity-70">
                ({allTipPhotos.length})
              </span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto no-scrollbar py-2 space-y-3">
          {/* TAB 1: 每日行程 TIP 總覽 */}
          {activeTab === 'daily' && (
            <div className="space-y-3">
              {filteredDailyTips.map(d => (
                <div 
                  key={d.date}
                  className={`bg-white rounded-2xl border-2 p-3.5 sm:p-4 transition-all shadow-xs flex flex-col ${
                    d.hasTip 
                      ? 'border-amber-200/90 hover:border-amber-300' 
                      : 'border-beige-dark/70 hover:border-beige-dark'
                  }`}
                >
                  {/* Row 1: Day Badge & Date on Left */}
                  <div className="flex items-center gap-2 pb-2.5 border-b border-gray-100 min-w-0">
                    <span className="bg-amber-400 text-white text-[11px] font-black px-2.5 py-0.5 rounded-lg shadow-2xs whitespace-nowrap flex-shrink-0">
                      Day {d.dayNum}
                    </span>
                    <span className="font-mono text-xs font-bold text-gray-500 whitespace-nowrap flex-shrink-0">
                      {d.date}
                    </span>
                  </div>

                  {/* Row 2: Location Title (Fruit + Location) */}
                  <div className="pt-2.5 pb-2.5 flex items-center gap-1.5 min-w-0">
                    <span className="text-base flex-shrink-0 leading-none">{d.fruit || '📍'}</span>
                    <h3 className="font-black text-sm sm:text-base text-cocoa truncate">
                      {d.location || '當日行程'}
                    </h3>
                  </div>

                  {/* Row 3: Unified Content Container */}
                  {d.hasTip ? (
                    <div 
                      onClick={() => openEditDayTip(d.date)}
                      className="bg-[#FFFDF7] hover:bg-amber-50/40 p-3 rounded-xl border border-amber-200/70 space-y-2 cursor-pointer transition-colors group shadow-2xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        {d.title ? (
                          <h4 className="text-xs sm:text-sm font-black text-amber-900 flex items-center gap-1.5 min-w-0">
                            <Lightbulb size={13} className="text-amber-500 fill-amber-400 flex-shrink-0" />
                            <span className="truncate">{d.title}</span>
                          </h4>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs font-black text-amber-900">
                            <Lightbulb size={13} className="text-amber-500 fill-amber-400 flex-shrink-0" />
                            <span>今日重點備忘</span>
                          </div>
                        )}
                        <span className="text-[11px] font-black text-amber-800 bg-amber-100/90 group-hover:bg-amber-200/90 px-2.5 py-0.5 rounded-lg border border-amber-300 flex items-center gap-1 flex-shrink-0 transition-colors">
                          <Edit3 size={11} /> 編輯
                        </span>
                      </div>

                      {d.content && (
                        <p className="text-xs font-medium text-cocoa/90 whitespace-pre-line leading-relaxed">
                          {d.content}
                        </p>
                      )}

                      {/* Day Photos */}
                      {d.photos.length > 0 && (
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
                          {d.photos.map((imgUrl, pIdx) => (
                            <div
                              key={pIdx}
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenLightbox && onOpenLightbox(d.photos, pIdx);
                              }}
                              className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border border-amber-200/80 flex-shrink-0 cursor-pointer group/img bg-gray-50 shadow-2xs hover:opacity-90 transition-opacity"
                            >
                              <img src={imgUrl} alt="Tip thumbnail" className="w-full h-full object-cover group-hover/img:scale-105 transition-transform" />
                              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white">
                                <Eye size={12} />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div 
                      onClick={() => openEditDayTip(d.date)}
                      className="bg-[#FAF8F2] hover:bg-amber-50/50 border border-dashed border-beige-dark hover:border-amber-300 rounded-xl p-3 flex items-center gap-2 text-xs text-gray-400 cursor-pointer transition-all group"
                    >
                      <div className="w-5 h-5 rounded-md bg-white border border-beige-dark group-hover:border-amber-300 flex items-center justify-center text-amber-500 flex-shrink-0">
                        <Plus size={12} strokeWidth={2.5} />
                      </div>
                      <span className="text-[11px] sm:text-xs font-bold text-gray-400 group-hover:text-amber-800 transition-colors truncate">
                        尚未新增當日提醒，點此填寫注意事項與相片
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: 全旅程通用須知 */}
          {activeTab === 'general' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <span className="text-xs font-bold text-gray-500">
                  不限特定日期的全旅程重要提醒（退稅、電壓、通票規則等）
                </span>
                <button
                  type="button"
                  onClick={openNewGeneralTip}
                  className="sm:hidden px-2.5 py-1 bg-amber-500 text-white rounded-lg text-[11px] font-black flex items-center gap-1"
                >
                  <Plus size={12} /> 新增
                </button>
              </div>

              {filteredGeneralTips.length > 0 ? (
                filteredGeneralTips.map(tip => {
                  const cat = CATEGORIES.find(c => c.id === tip.category) || CATEGORIES[0];
                  const Icon = cat.icon;
                  return (
                    <div 
                      key={tip.id}
                      className="bg-white rounded-2xl border-2 border-beige-dark hover:border-amber-300 p-4 transition-all shadow-xs space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-lg border text-[10px] font-black flex items-center gap-1 ${cat.color}`}>
                            <Icon size={11} /> {cat.label}
                          </span>
                          <h4 className="font-black text-sm text-cocoa">
                            {tip.title}
                          </h4>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditGeneralTip(tip)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-amber-700 hover:bg-amber-50"
                            title="編輯"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteGeneralTip(tip, e)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                            title="刪除此須知"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {tip.content && (
                        <p className="text-xs font-medium text-cocoa/90 whitespace-pre-line leading-relaxed bg-[#FFFDF7] p-3 rounded-xl border border-amber-100">
                          {tip.content}
                        </p>
                      )}

                      {/* Images */}
                      {tip.images && tip.images.length > 0 && (
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
                          {tip.images.map((imgUrl, iIdx) => (
                            <div
                              key={iIdx}
                              onClick={() => onOpenLightbox && onOpenLightbox(tip.images!, iIdx)}
                              className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-beige-dark flex-shrink-0 cursor-pointer group bg-gray-50 shadow-xs"
                            >
                              <img src={imgUrl} alt="Tip thumbnail" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                <Eye size={14} />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center bg-white rounded-3xl border-2 border-dashed border-gray-200 p-6 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto">
                    <Lightbulb size={24} />
                  </div>
                  <div>
                    <p className="font-black text-sm text-cocoa">尚無全旅程通用須知</p>
                    <p className="text-xs text-gray-400 mt-0.5">點擊下方按鈕新增瑞士插頭規格、退稅門檻或緊急連絡資訊</p>
                  </div>
                  <button
                    type="button"
                    onClick={openNewGeneralTip}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-black text-xs inline-flex items-center gap-1.5 shadow-hard-sm"
                  >
                    <Plus size={14} /> 新增第一則通用須知
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: 全部 TIP 照片庫 */}
          {activeTab === 'photos' && (
            <div>
              {allTipPhotos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {allTipPhotos.map((item, idx) => (
                    <div 
                      key={idx}
                      onClick={() => onOpenLightbox && onOpenLightbox(allTipPhotos.map(p => p.url), idx)}
                      className="group bg-white rounded-2xl overflow-hidden border-2 border-beige-dark hover:border-amber-400 transition-all shadow-xs cursor-pointer flex flex-col"
                    >
                      <div className="aspect-[4/3] w-full overflow-hidden bg-gray-100 relative">
                        <img 
                          src={item.url} 
                          alt={item.label}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <Eye size={20} />
                        </div>
                      </div>
                      <div className="p-2.5 bg-white">
                        <p className="text-[11px] font-black text-cocoa truncate">
                          {item.label}
                        </p>
                        {item.date && (
                          <span className="text-[9px] font-mono text-gray-400 block mt-0.5">
                            {item.date}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center bg-white rounded-3xl border-2 border-dashed border-gray-200 space-y-2">
                  <ImageIcon size={32} className="mx-auto text-gray-300" />
                  <p className="font-black text-sm text-cocoa">相片庫目前還是空的</p>
                  <p className="text-xs text-gray-400">
                    在每日行程或通用須知中上傳地圖截圖、車票步驟或指南，這裡會集中展示！
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t-2 border-beige-dark flex justify-between items-center flex-shrink-0">
          <span className="text-xs font-bold text-gray-400">
            💡 TIP 與相片皆自動雲端同步
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-black text-cocoa bg-white border-2 border-beige-dark hover:bg-gray-50 text-xs shadow-xs"
          >
            關閉
          </button>
        </div>
      </div>

      {/* 1. Daily Tip Editor Modal (100% Identical to "今日 TIP" editor) */}
      <DayTipModal
        isOpen={!!editingDayDate}
        onClose={() => setEditingDayDate(null)}
        day={activeEditingDay}
        dayNum={activeEditingDayNum}
        onSaveDayTip={(date, title, tip, photos) => {
          onUpdateDayTip(date, title, tip, photos);
          setEditingDayDate(null);
        }}
        onOpenTipsCenter={() => {
          setEditingDayDate(null);
          setActiveTab('daily');
        }}
        onOpenLightbox={onOpenLightbox}
        zIndex="z-[85]"
      />

      {/* 2. General Tip Editor Modal (Harmonized layout matching DayTipModal) */}
      {isEditorOpen && (
        <div 
          className="fixed inset-0 bg-cocoa/60 backdrop-blur-sm z-[85] flex flex-col items-center justify-end sm:justify-center sm:p-4 animate-fade-in"
          onClick={() => setIsEditorOpen(false)}
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
                    通用須知
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-cocoa mt-0.5">
                  {editingTipId ? '編輯通用須知' : '新增全旅程通用須知'}
                </h3>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {editingTipId && (
                  <button
                    type="button"
                    onClick={() => {
                      const found = tripTips.find(t => t.id === editingTipId);
                      if (found) {
                        setIsEditorOpen(false);
                        setTipToDelete(found);
                      }
                    }}
                    className="p-2 bg-white rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 border border-beige-dark shadow-sm transition-colors cursor-pointer"
                    title="刪除此須知"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
                <button 
                  type="button"
                  onClick={() => setIsEditorOpen(false)} 
                  className="p-2 bg-white rounded-full text-gray-400 hover:text-red-400 border border-beige-dark shadow-sm transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto no-scrollbar py-4 space-y-4">
              {/* Category Selector */}
              <div className="space-y-1">
                <label className="text-xs font-black text-cocoa block">分類標籤</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {CATEGORIES.map(cat => {
                    const Icon = cat.icon;
                    const isSelected = tipCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setTipCategory(cat.id as any)}
                        className={`py-2 px-2 rounded-xl text-[11px] font-black border transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          isSelected
                            ? 'bg-amber-100 text-amber-900 border-amber-400 shadow-xs'
                            : 'bg-white text-gray-500 border-beige-dark hover:border-amber-200'
                        }`}
                      >
                        <Icon size={12} /> {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title Input */}
              <div className="space-y-1">
                <label className="text-xs font-black text-cocoa block">
                  💡 TIP 核心標題
                </label>
                <input 
                  type="text"
                  value={tipTitle}
                  onChange={e => setTipTitle(e.target.value)}
                  placeholder="例：瑞士 J 型三孔插座規格 / 跨國退稅流程"
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
                  value={tipContent}
                  onChange={e => setTipContent(e.target.value)}
                  placeholder="請填寫詳細重點與撇步..."
                  className="w-full p-3 bg-white rounded-2xl border-2 border-beige-dark font-medium text-cocoa text-xs sm:text-sm focus:border-amber-400 focus:outline-none transition-colors placeholder:text-gray-300 leading-relaxed resize-none"
                />
              </div>

              {/* Photo Upload Section */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-black text-cocoa flex items-center gap-1.5">
                    <ImageIcon size={14} className="text-amber-600" />
                    <span>參考相片與截圖 ({tipPhotos.length} 張)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isCompressing}
                    className="text-[11px] font-black text-amber-700 bg-amber-100/80 hover:bg-amber-200/80 px-2.5 py-1 rounded-xl border border-amber-300 flex items-center gap-1 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
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
                {tipPhotos.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1">
                    {tipPhotos.map((url, idx) => (
                      <div 
                        key={idx}
                        className="relative group aspect-square rounded-2xl overflow-hidden border-2 border-beige-dark bg-white shadow-xs"
                      >
                        <img src={url} alt="upload" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setTipPhotos(prev => prev.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-red-500 transition-colors cursor-pointer"
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
                      點擊上傳轉乘示意圖、插座規格或退稅流程
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      自動高畫質壓縮 WebP，出國離線也能秒開
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 border-t-2 border-beige-dark flex gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="flex-1 py-3 rounded-2xl font-bold text-gray-400 bg-white border-2 border-beige-dark hover:bg-gray-50 transition-colors text-xs sm:text-sm cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSaveEditor}
                className="flex-1 py-3 rounded-2xl font-black text-white bg-amber-500 hover:bg-amber-600 shadow-hard-sm border-2 border-amber-600 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-1.5 text-xs sm:text-sm cursor-pointer"
              >
                <Lightbulb size={15} className="fill-white" />
                <span>保存通用須知</span>
              </button>
            </div>
          </div>
        </div>
      )}
      <DeleteTipConfirmModal
        isOpen={!!tipToDelete}
        onClose={() => setTipToDelete(null)}
        onConfirm={() => {
          if (tipToDelete) {
            onUpdateTripTips(tripTips.filter(t => t.id !== tipToDelete.id));
            setTipToDelete(null);
          }
        }}
        title={tipToDelete?.title || '此旅遊須知'}
        subtitle="確定要刪除這則通用須知及其照片嗎？"
        zIndex="z-[90]"
      />
    </div>
  );
};

