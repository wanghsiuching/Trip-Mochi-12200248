import React, { useState } from 'react';
import { 
  X, Plus, Utensils, Compass, MapPin, ExternalLink, StickyNote, 
  Trash2, Edit3, CheckCircle2, Circle, Navigation, Tag, Star, 
  Search, CalendarPlus, ChevronRight, Copy, Check
} from 'lucide-react';
import { PocketItem, TripDay } from '../types';

interface PocketPlacesModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'food' | 'spot';
  pocketItems: PocketItem[];
  tripDays: TripDay[];
  onAddItem: (item: Omit<PocketItem, 'id' | 'createdAt'>) => void;
  onUpdateItem: (item: PocketItem) => void;
  onDeleteItem: (id: string) => void;
  onAddToSchedule?: (item: PocketItem, targetDate: string, time: string) => void;
}

const FOOD_PRESET_TAGS = ['拉麵', '燒肉', '甜點/咖啡', '壽司/海鮮', '居酒屋', '米其林/名店', '排隊美食', '伴手禮', '早午餐'];
const SPOT_PRESET_TAGS = ['熱門景點', '自然風光', '夜景', '神社/古蹟', '購物商場', '體驗/手作', '文青展覽', '溫泉', '拍照打卡'];

export const PocketPlacesModal: React.FC<PocketPlacesModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'food',
  pocketItems,
  tripDays,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onAddToSchedule,
}) => {
  const [activeTab, setActiveTab] = useState<'food' | 'spot'>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('全部');
  const [filterVisited, setFilterVisited] = useState<'all' | 'unvisited' | 'visited'>('all');

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    category: 'food' | 'spot';
    title: string;
    location: string;
    url: string;
    notes: string;
    tag: string;
    rating: number;
    assignedDate: string;
  }>({
    category: initialTab,
    title: '',
    location: '',
    url: '',
    notes: '',
    tag: '',
    rating: 5,
    assignedDate: '',
  });

  // Add to Schedule dialog state
  const [addToScheduleTarget, setAddToScheduleTarget] = useState<PocketItem | null>(null);
  const [targetScheduleDate, setTargetScheduleDate] = useState<string>(tripDays[0]?.date || '');
  const [targetScheduleTime, setTargetScheduleTime] = useState<string>('12:00');

  // Copy feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentTabItems = pocketItems.filter(item => item.category === activeTab);

  // Filter items
  const filteredItems = currentTabItems.filter(item => {
    const matchesSearch = 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.location && item.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.tag && item.tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTag = selectedTag === '全部' || item.tag === selectedTag;

    const matchesVisited = 
      filterVisited === 'all' ||
      (filterVisited === 'visited' && item.isVisited) ||
      (filterVisited === 'unvisited' && !item.isVisited);

    return matchesSearch && matchesTag && matchesVisited;
  });

  const availableTags = ['全部', ...Array.from(new Set(currentTabItems.map(i => i.tag).filter(Boolean))) as string[]];

  const handleOpenAddForm = (category: 'food' | 'spot') => {
    setEditingId(null);
    setFormData({
      category,
      title: '',
      location: '',
      url: '',
      notes: '',
      tag: '',
      rating: 5,
      assignedDate: '',
    });
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (item: PocketItem) => {
    setEditingId(item.id);
    setFormData({
      category: item.category,
      title: item.title,
      location: item.location || '',
      url: item.url || '',
      notes: item.notes || '',
      tag: item.tag || '',
      rating: item.rating || 5,
      assignedDate: item.assignedDate || '',
    });
    setIsFormOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    if (editingId) {
      const original = pocketItems.find(p => p.id === editingId);
      if (original) {
        onUpdateItem({
          ...original,
          category: formData.category,
          title: formData.title.trim(),
          location: formData.location.trim(),
          url: formData.url.trim(),
          notes: formData.notes.trim(),
          tag: formData.tag.trim(),
          rating: formData.rating,
          assignedDate: formData.assignedDate,
        });
      }
    } else {
      onAddItem({
        category: formData.category,
        title: formData.title.trim(),
        location: formData.location.trim(),
        url: formData.url.trim(),
        notes: formData.notes.trim(),
        tag: formData.tag.trim(),
        rating: formData.rating,
        assignedDate: formData.assignedDate,
        isVisited: false,
      });
    }

    setIsFormOpen(false);
    setEditingId(null);
  };

  const handleToggleVisited = (item: PocketItem) => {
    onUpdateItem({
      ...item,
      isVisited: !item.isVisited,
    });
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenMap = (location: string) => {
    const encoded = encodeURIComponent(location);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encoded}`, '_blank', 'noopener,noreferrer');
  };

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
    : {
        primary: 'bg-teal-600',
        primaryHover: 'hover:bg-teal-700',
        lightBg: 'bg-teal-50',
        badgeBg: 'bg-teal-100 text-teal-800 border-teal-200',
        border: 'border-teal-200',
        iconColor: 'text-teal-600',
        name: '探索景點名單',
        itemType: '探索景點',
      };

  return (
    <div className="fixed inset-0 bg-cocoa/60 backdrop-blur-sm z-[70] flex flex-col items-center justify-end sm:justify-center sm:p-4 animate-fade-in" onClick={onClose}>
      <div 
        className="bg-[#FAF8F2] w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-2xl sm:rounded-[2.5rem] rounded-none shadow-2xl border-0 sm:border-4 sm:border-beige-dark flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header with Switchable Tabs */}
        <div className="bg-white px-5 sm:px-6 pt-5 pb-3 border-b-2 border-beige-dark flex-shrink-0">
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

          {/* Main Category Tabs */}
          <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1.5 rounded-2xl">
            <button
              onClick={() => { setActiveTab('food'); setSelectedTag('全部'); }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-black text-sm transition-all ${
                activeTab === 'food'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-gray-500 hover:text-orange-600 hover:bg-white/50'
              }`}
            >
              <Utensils size={16} /> 美食清單
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                activeTab === 'food' ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {pocketItems.filter(p => p.category === 'food').length}
              </span>
            </button>
            <button
              onClick={() => { setActiveTab('spot'); setSelectedTag('全部'); }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-black text-sm transition-all ${
                activeTab === 'spot'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-teal-700 hover:bg-white/50'
              }`}
            >
              <Compass size={16} /> 探索景點
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                activeTab === 'spot' ? 'bg-teal-700 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {pocketItems.filter(p => p.category === 'spot').length}
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
                placeholder={`搜尋${activeTab === 'food' ? '美食店名、地址、備註' : '景點、地名、備註'}...`}
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
              onClick={() => handleOpenAddForm(activeTab)}
              className={`${currentTheme.primary} ${currentTheme.primaryHover} text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 flex-shrink-0`}
            >
              <Plus size={15} strokeWidth={2.5} /> 新增{activeTab === 'food' ? '美食' : '探索'}
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
                      ? `${activeTab === 'food' ? 'bg-orange-100 text-orange-800 border-orange-300' : 'bg-teal-100 text-teal-800 border-teal-300'} border`
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content Body - Card List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 no-scrollbar">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 px-4 bg-white/70 rounded-3xl border-2 border-dashed border-beige-dark">
              <div className={`w-16 h-16 mx-auto rounded-full ${currentTheme.lightBg} flex items-center justify-center mb-3`}>
                {activeTab === 'food' ? (
                  <Utensils size={28} className="text-orange-400" />
                ) : (
                  <Compass size={28} className="text-teal-500" />
                )}
              </div>
              <h4 className="font-black text-cocoa text-base mb-1">
                {searchQuery || selectedTag !== '全部' ? '沒有符合篩選條件的項目' : `尚未新增任何${currentTheme.itemType}`}
              </h4>
              <p className="text-xs text-gray-400 font-bold mb-4">
                可以記錄網路上查到想吃的私房餐廳、必逛打卡點、地址超連結與備註！
              </p>
              <button
                onClick={() => handleOpenAddForm(activeTab)}
                className={`inline-flex items-center gap-1.5 ${currentTheme.primary} ${currentTheme.primaryHover} text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all`}
              >
                <Plus size={16} /> 立即新增第一筆{currentTheme.itemType}
              </button>
            </div>
          ) : (
            filteredItems.map(item => {
              const isFood = item.category === 'food';
              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-3xl p-4 sm:p-5 border-2 ${
                    item.isVisited ? 'border-gray-200 opacity-75' : 'border-beige-dark hover:border-sage/50'
                  } shadow-sm transition-all`}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                      <button
                        onClick={() => handleToggleVisited(item)}
                        className="mt-0.5 text-gray-400 hover:text-sage transition-colors flex-shrink-0"
                        title={item.isVisited ? '標記為未造訪' : '標記為已造訪'}
                      >
                        {item.isVisited ? (
                          <CheckCircle2 size={20} className="text-emerald-500 fill-emerald-50" />
                        ) : (
                          <Circle size={20} className="text-gray-300" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h4 className={`text-base font-black text-cocoa truncate ${item.isVisited ? 'line-through text-gray-400' : ''}`}>
                            {item.title}
                          </h4>

                          {item.tag && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              isFood ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-teal-50 text-teal-700 border-teal-200'
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
                      {onAddToSchedule && (
                        <button
                          onClick={() => {
                            setAddToScheduleTarget(item);
                            setTargetScheduleDate(item.assignedDate || tripDays[0]?.date || '');
                          }}
                          className="p-1.5 text-sage hover:bg-sage/10 rounded-lg transition-colors"
                          title="加入每日行程"
                        >
                          <CalendarPlus size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenEditForm(item)}
                        className="p-1.5 text-gray-400 hover:text-cocoa hover:bg-gray-100 rounded-lg transition-colors"
                        title="編輯"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`確定要刪除「${item.title}」嗎？`)) {
                            onDeleteItem(item.id);
                          }
                        }}
                        className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="刪除"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Location & Address with Map navigation */}
                  {item.location && (
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-600 bg-gray-50 px-3 py-2 rounded-xl mb-2 border border-gray-100">
                      <MapPin size={14} className="text-sage flex-shrink-0" />
                      <span className="flex-1 truncate">{item.location}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleCopyText(item.location!, item.id)}
                          className="p-1 bg-white hover:bg-gray-100 rounded-lg text-gray-500 border border-gray-200 transition-colors"
                          title="複製地址"
                        >
                          {copiedId === item.id ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                        </button>
                        <button
                          onClick={() => handleOpenMap(item.location!)}
                          className="p-1 bg-white hover:bg-sage hover:text-white rounded-lg text-cocoa border border-gray-200 transition-colors flex items-center gap-1 px-2 text-[11px]"
                          title="在 Google Maps 開啟"
                        >
                          <Navigation size={11} /> 導航
                        </button>
                      </div>
                    </div>
                  )}

                  {/* URL Hyperlink */}
                  {item.url && (
                    <div className="mb-2">
                      <a
                        href={item.url.startsWith('http') ? item.url : `https://${item.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50/80 hover:bg-blue-100 px-3 py-1.5 rounded-xl border border-blue-200/80 transition-colors break-all"
                      >
                        <ExternalLink size={13} className="flex-shrink-0" />
                        <span className="truncate max-w-[280px] sm:max-w-md">
                          {item.url.replace(/^https?:\/\//, '')}
                        </span>
                      </a>
                    </div>
                  )}

                  {/* Notes Box */}
                  {item.notes && (
                    <div className="bg-amber-50/70 p-3 rounded-2xl border border-amber-200/70 flex items-start gap-2">
                      <StickyNote size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                      <div className="text-xs font-bold text-amber-950/90 whitespace-pre-wrap leading-relaxed flex-1">
                        <span className="text-amber-800/80 font-black mr-1">備註:</span>
                        {item.notes}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
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
                <div className={`w-8 h-8 rounded-full ${formData.category === 'food' ? 'bg-orange-100 text-orange-600' : 'bg-teal-100 text-teal-700'} flex items-center justify-center`}>
                  {formData.category === 'food' ? <Utensils size={16} /> : <Compass size={16} />}
                </div>
                <h3 className="text-lg font-black text-cocoa">
                  {editingId ? '編輯' : '新增'} {formData.category === 'food' ? '美食' : '探索地點'}
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
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, category: 'food' })}
                    className={`py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 border-2 transition-all ${
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
                    className={`py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 border-2 transition-all ${
                      formData.category === 'spot' 
                        ? 'bg-teal-600 text-white border-teal-600 shadow-sm' 
                        : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <Compass size={14} /> 探索景點
                  </button>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="text-xs font-black text-gray-400 block mb-1">
                  {formData.category === 'food' ? '餐廳 / 美食店名 *' : '景點 / 地點名稱 *'}
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder={formData.category === 'food' ? '例：一蘭拉麵 本店 / 六花亭' : '例：小樽運河 / 函館山夜景'}
                  className="w-full bg-gray-50 p-3 rounded-xl border border-gray-200 focus:border-sage outline-none font-bold text-sm text-cocoa"
                />
              </div>

              {/* Address / Location */}
              <div>
                <label className="text-xs font-black text-gray-400 block mb-1">地址 / 地點</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                    placeholder="例：北海道函館市若松町 / 地址"
                    className="w-full bg-gray-50 p-3 pr-10 rounded-xl border border-gray-200 focus:border-sage outline-none font-bold text-sm text-cocoa"
                  />
                  <MapPin size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              {/* URL Hyperlink */}
              <div>
                <label className="text-xs font-black text-gray-400 block mb-1">超連結 (官網 / IG / 預約 / 食記)</label>
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
                  {(formData.category === 'food' ? FOOD_PRESET_TAGS : SPOT_PRESET_TAGS).map(preset => (
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

              {/* Notes */}
              <div>
                <label className="text-xs font-black text-gray-400 block mb-1">備註說明 (推薦菜色、注意事項、營業時間等)</label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="例：推薦點海鮮丼、晚上8點後免排隊、週二公休..."
                  className="w-full bg-gray-50 p-3 rounded-xl border border-gray-200 focus:border-sage outline-none font-bold text-xs text-cocoa resize-none"
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
                  className={`flex-1 py-3.5 rounded-2xl ${
                    formData.category === 'food' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-teal-600 hover:bg-teal-700'
                  } text-white font-black text-sm shadow-md transition-all active:scale-95`}
                >
                  {editingId ? '儲存變更' : '新增項目'}
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
    </div>
  );
};
