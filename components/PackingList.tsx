import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  ShoppingBag, 
  Shirt, 
  HeartPulse, 
  FileText, 
  Smartphone, 
  MoreHorizontal, 
  Sparkles,
  CheckCircle2,
  Lock,
  UserCheck,
  PackageOpen,
  ArrowRight
} from 'lucide-react';
import { TodoItem, Member } from '../types';
import { MemberAvatar } from './MemberAvatar';

export type PackingCategoryKey = 'clothes' | 'toiletries' | 'electronics' | 'documents' | 'medicine' | 'other';

export interface CategoryMeta {
  key: PackingCategoryKey;
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  ringColor: string;
}

export const PACKING_CATEGORIES: CategoryMeta[] = [
  { key: 'clothes', label: '衣物', icon: Shirt, color: 'text-amber-700', bgColor: 'bg-amber-50', borderColor: 'border-amber-200', ringColor: '#d97706' },
  { key: 'toiletries', label: '盥洗用品', icon: ShoppingBag, color: 'text-sky-700', bgColor: 'bg-sky-50', borderColor: 'border-sky-200', ringColor: '#0284c7' },
  { key: 'electronics', label: '3C 電子', icon: Smartphone, color: 'text-purple-700', bgColor: 'bg-purple-50', borderColor: 'border-purple-200', ringColor: '#9333ea' },
  { key: 'documents', label: '證件財物', icon: FileText, color: 'text-emerald-700', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200', ringColor: '#059669' },
  { key: 'medicine', label: '藥品保健', icon: HeartPulse, color: 'text-rose-700', bgColor: 'bg-rose-50', borderColor: 'border-rose-200', ringColor: '#e11d48' },
  { key: 'other', label: '其他', icon: MoreHorizontal, color: 'text-gray-700', bgColor: 'bg-gray-50', borderColor: 'border-gray-200', ringColor: '#6b7280' },
];

const PRESET_PACKING_ITEMS: Record<PackingCategoryKey, string[]> = {
  clothes: ['換洗衣物', '保暖外套 / 羽絨衣', '發熱衣 / 發熱褲', '換洗內衣褲', '免洗襪 / 保暖襪', '舒適休閒鞋 / 運動鞋', '睡衣 / 居家服', '圍巾 / 毛帽 / 手套'],
  toiletries: ['旅行裝牙刷牙膏', '洗面乳 / 卸妝用品', '旅行保養品 / 乳液 / 面膜', '防曬乳 / 護唇膏', '隨身乾洗手 / 濕紙巾', '化妝水 / 精華液', '刮鬍刀 / 修容工具', '小梳子 / 髮圈'],
  electronics: ['手機充電線與豆腐頭', '大容量行動電源', '萬國轉接頭 / 歐規轉接頭', '相機 / 記憶卡 / 電池', '降噪耳機 / 藍牙耳機', '多孔延長線 / 分接頭', '電子書 / 平板電腦'],
  documents: ['護照正本（效期需6個月以上）', '海外旅遊平安保險單', '申根保險證明 / 醫療證明', '機票電子憑證 / 登機證', '瑞士通行證 (Swiss Pass)', '緊急備用現金 (CHF / EUR)', '雙幣信用卡 / 跨國提款卡', '護照影本與大頭照備份'],
  medicine: ['綜合感冒藥 / 止痛退燒藥', '腸胃藥 / 止瀉藥 / 胃散', '暈車藥 / 高山症預備藥', '個人慢性病日常藥品', '綜合維他命 / B群 / 益生菌', 'OK繃 / 消毒棉片', '眼藥水 / 人工淚液', '防蚊液 / 止癢膏'],
  other: ['隨身保溫水壺 / 折疊水袋', '輕便摺疊傘 / 輕便雨衣', '行李束帶 / 行李秤', '旅行防盜腰包 / 貼身暗袋', '隨身購物袋 / 環保袋', '太陽眼鏡 / 遮陽帽', 'U型充氣頸枕 / 護眼罩'],
};

// Circular Progress Bar Component
const CircularProgress: React.FC<{ percentage: number; color: string; size?: number; strokeWidth?: number }> = ({
  percentage,
  color,
  size = 48,
  strokeWidth = 4.5,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="stroke-gray-200/80"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[11px] font-black text-cocoa">{percentage}%</span>
      </div>
    </div>
  );
};

interface PackingListProps {
  items: TodoItem[];
  members: Member[];
  onAdd: (text: string, assignee: string | string[], category?: string) => void;
  onToggle: (id: number) => void;
  onUpdate: (id: number, updates: Partial<TodoItem>) => void;
  onDelete: (id: number) => void;
}

export const PackingList: React.FC<PackingListProps> = ({
  items,
  members,
  onAdd,
  onToggle,
  onUpdate,
  onDelete,
}) => {
  // Selected member whose list is currently being viewed
  const defaultMemberName = members[0]?.name || 'Show';
  const [selectedMember, setSelectedMember] = useState<string>(() => {
    return localStorage.getItem('packing_selected_member') || defaultMemberName;
  });

  // Sync if members load or change
  useEffect(() => {
    if (members.length > 0) {
      const exists = members.some(m => m.name === selectedMember);
      if (!exists) {
        const first = members[0].name;
        setSelectedMember(first);
        localStorage.setItem('packing_selected_member', first);
      }
    }
  }, [members, selectedMember]);

  const handleSelectMember = (name: string) => {
    setSelectedMember(name);
    localStorage.setItem('packing_selected_member', name);
  };

  // Category quick-add input text state per category
  const [categoryInputs, setCategoryInputs] = useState<Record<string, string>>({});

  // Global quick add modal / input
  const [isAddingGlobal, setIsAddingGlobal] = useState(false);
  const [globalName, setGlobalName] = useState('');
  const [globalCategory, setGlobalCategory] = useState<PackingCategoryKey>('clothes');

  // Item Editing state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState<PackingCategoryKey>('clothes');

  // Recommendation presets modal state
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [selectedPresetCategory, setSelectedPresetCategory] = useState<PackingCategoryKey>('clothes');
  const [selectedPresets, setSelectedPresets] = useState<string[]>([]);

  // Helper to normalize category
  const getItemCategory = (item: TodoItem): PackingCategoryKey => {
    if (item.category && PACKING_CATEGORIES.some(c => c.key === item.category)) {
      return item.category as PackingCategoryKey;
    }
    // Auto-detect based on keywords if not explicitly set
    const text = (item.text || '').toLowerCase();
    if (/衣|褲|裙|外套|發熱|襪|帽|鞋|圍巾|內衣|內褲|手套|泳衣|洋裝|睡衣/.test(text)) return 'clothes';
    if (/洗|牙|沐浴|洗髮|保養|乳液|毛巾|化妝|刮鬍|卸妝|面膜|防曬|護唇/.test(text)) return 'toiletries';
    if (/充電|線|行動電源|轉接|相機|手機|耳機|ipad|筆電|變壓器|電池|延長線/.test(text)) return 'electronics';
    if (/護照|簽證|卡|錢|外幣|保險|票|身分證|機票|憑證|錢包|證件/.test(text)) return 'documents';
    if (/藥|感冒|胃|止痛|暈車|防蚊|ok繃|維他命|眼藥水|過敏|高山症/.test(text)) return 'medicine';
    return 'other';
  };

  // Helper to check if an item belongs to the selected member
  const itemBelongsToMember = (item: TodoItem, memberName: string) => {
    if (!item.assignee) return true; // Legacy items without assignee visible
    if (item.assignee === '全體' || item.assignee === 'all') return true;
    if (Array.isArray(item.assignee)) {
      return item.assignee.includes(memberName);
    }
    return item.assignee === memberName;
  };

  // Items for the selected member
  const memberItems = items.filter(item => itemBelongsToMember(item, selectedMember));

  // Handle Quick Add directly in category card
  const handleAddCategoryItem = (categoryKey: PackingCategoryKey, e: React.FormEvent) => {
    e.preventDefault();
    const text = (categoryInputs[categoryKey] || '').trim();
    if (!text) return;

    // Item strictly belongs to the currently viewed member
    onAdd(text, selectedMember, categoryKey);
    setCategoryInputs(prev => ({ ...prev, [categoryKey]: '' }));
  };

  // Handle Global Add
  const handleGlobalAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!globalName.trim()) return;

    onAdd(globalName.trim(), selectedMember, globalCategory);
    setGlobalName('');
    setIsAddingGlobal(false);
  };

  // Handle Presets Add
  const handleAddPresets = () => {
    if (selectedPresets.length === 0) return;
    
    selectedPresets.forEach((itemText) => {
      // Avoid duplicate text for the same member
      const exists = memberItems.some(
        (i) => i.text.trim().toLowerCase() === itemText.trim().toLowerCase()
      );
      if (!exists) {
        onAdd(itemText, selectedMember, selectedPresetCategory);
      }
    });

    setSelectedPresets([]);
    setShowPresetModal(false);
  };

  const startEdit = (item: TodoItem) => {
    setEditingId(item.id);
    setEditName(item.text);
    setEditCategory(getItemCategory(item));
  };

  const saveEdit = (id: number) => {
    if (!editName.trim()) return;
    onUpdate(id, {
      text: editName.trim(),
      category: editCategory,
      assignee: selectedMember,
    });
    setEditingId(null);
  };

  // Overall member packing stats
  const totalItemsCount = memberItems.length;
  const packedItemsCount = memberItems.filter((i) => i.done).length;
  const overallPercentage = totalItemsCount > 0 ? Math.round((packedItemsCount / totalItemsCount) * 100) : 0;

  return (
    <div className="w-full space-y-4 animate-scale-in pb-16">
      {/* Member Avatar Selector Pills */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {members.map((m) => {
          const isSelected = selectedMember === m.name;
          const memberTotal = items.filter(i => itemBelongsToMember(i, m.name)).length;
          const memberPacked = items.filter(i => itemBelongsToMember(i, m.name) && i.done).length;

          return (
            <button
              key={m.id}
              onClick={() => handleSelectMember(m.name)}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl border-2 text-xs font-bold transition-all whitespace-nowrap active:scale-95 shadow-sm ${
                isSelected
                  ? 'bg-sage text-white border-sage scale-[1.02]'
                  : 'bg-white text-cocoa border-beige-dark hover:bg-beige-light'
              }`}
            >
              <div className="relative">
                <MemberAvatar
                  avatar={m.avatar}
                  id={m.id}
                  size="xs"
                  showBorder={false}
                  className="w-5 h-5 rounded-full"
                />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-black text-xs leading-none">
                  {m.name}
                </span>
                <span className={`text-[9px] font-mono mt-0.5 ${isSelected ? 'text-white/80' : 'text-gray-400'}`}>
                  {memberTotal > 0 ? `${memberPacked}/${memberTotal}` : '尚未新增'}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Top Quick Add Bar for Selected Member */}
      <div className="bg-white p-3.5 sm:p-4 rounded-[2rem] border-2 border-beige-dark shadow-hard-sm">
        {!isAddingGlobal ? (
          <button
            onClick={() => setIsAddingGlobal(true)}
            className="w-full py-2.5 px-4 bg-beige-light/80 hover:bg-beige-light text-cocoa/70 hover:text-cocoa rounded-2xl border-2 border-dashed border-beige-dark flex items-center justify-between text-xs font-bold transition-all active:scale-[0.99]"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-sage-light text-sage flex items-center justify-center border border-sage/30">
                <Plus size={16} strokeWidth={3} />
              </div>
              <span className="font-bold">新增 {selectedMember} 的行李物品...</span>
            </div>
            <span className="text-[11px] font-black text-sage bg-white px-3 py-1 rounded-full border border-beige-dark shadow-xs">
              + 新增物品
            </span>
          </button>
        ) : (
          <form onSubmit={handleGlobalAdd} className="space-y-3 animate-scale-in">
            <div className="flex items-center justify-between pb-2 border-b border-beige-dark/50">
              <span className="text-xs font-black text-cocoa flex items-center gap-1.5">
                <Plus size={16} className="text-sage" /> 新增行李物品（{selectedMember}）
              </span>
              <button
                type="button"
                onClick={() => setIsAddingGlobal(false)}
                className="text-gray-400 hover:text-cocoa p-1"
              >
                <X size={16} />
              </button>
            </div>

            {/* Item Input */}
            <input
              type="text"
              required
              autoFocus
              value={globalName}
              onChange={(e) => setGlobalName(e.target.value)}
              placeholder="物品名稱（例: 換洗衣物、行動電源、轉接頭、眼藥水...）"
              className="w-full bg-beige-light text-cocoa px-4 py-2.5 rounded-2xl border-2 border-beige-dark outline-none font-bold text-xs focus:border-sage shadow-inner"
            />

            {/* Category Selector */}
            <div>
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1.5">選擇分類</div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {PACKING_CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = globalCategory === cat.key;
                  return (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => setGlobalCategory(cat.key)}
                      className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl border text-[11px] font-black transition-all ${
                        isSelected
                          ? 'bg-sage text-white border-sage shadow-xs scale-[1.02]'
                          : 'bg-white text-gray-500 border-beige-dark hover:bg-beige-light'
                      }`}
                    >
                      <Icon size={12} />
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAddingGlobal(false)}
                className="px-3.5 py-1.5 rounded-xl border border-beige-dark text-xs font-bold text-gray-500 hover:bg-beige-light"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-sage text-white font-black text-xs border border-sage-dark shadow-sm hover:bg-sage-dark active:scale-95"
              >
                加入 {selectedMember} 的行李
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Total Progress Summary Banner */}
      <div className="bg-white p-4 rounded-[2rem] border-2 border-beige-dark shadow-hard-sm flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 flex-shrink-0">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div className="text-xs font-black text-cocoa">
              {selectedMember} 的總體打包完成度
            </div>
            <div className="text-[11px] font-bold text-gray-400">
              {totalItemsCount === 0 ? '尚未新增任何行李項目' : `已打包 ${packedItemsCount} / 共 ${totalItemsCount} 件物品`}
            </div>
          </div>
        </div>

        {totalItemsCount > 0 ? (
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-24 sm:w-36 bg-gray-100 rounded-full h-2.5 overflow-hidden border border-beige-dark">
              <div
                className="bg-sage h-full rounded-full transition-all duration-500"
                style={{ width: `${overallPercentage}%` }}
              ></div>
            </div>
            <span className="text-xs font-black text-cocoa font-mono">{overallPercentage}%</span>
          </div>
        ) : (
          <span className="text-xs font-bold text-gray-400 bg-beige-light px-3 py-1 rounded-full border border-beige-dark">
            尚未新增
          </span>
        )}
      </div>

      {/* Six Fixed Category Cards */}
      <div className="space-y-4">
        {PACKING_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const categoryItems = memberItems.filter((i) => getItemCategory(i) === cat.key);
          const catTotal = categoryItems.length;
          const catPacked = categoryItems.filter((i) => i.done).length;
          const percentage = catTotal > 0 ? Math.round((catPacked / catTotal) * 100) : 0;
          const inputValue = categoryInputs[cat.key] || '';

          return (
            <div
              key={cat.key}
              className="bg-white rounded-[2rem] border-2 border-beige-dark shadow-hard-sm overflow-hidden transition-all hover:shadow-hard"
            >
              {/* Category Card Header */}
              <div className="p-4 sm:p-5 flex items-center justify-between border-b border-beige-dark/60 bg-gradient-to-r from-white via-beige/25 to-transparent">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className={`w-12 h-12 rounded-2xl ${cat.bgColor} ${cat.color} ${cat.borderColor} border-2 flex items-center justify-center shadow-sm flex-shrink-0`}>
                    <Icon size={24} strokeWidth={2.2} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-black text-cocoa">{cat.label}</h3>
                      {catTotal > 0 && (
                        <span className="text-[11px] font-black text-gray-500 bg-beige-light px-2.5 py-0.5 rounded-full border border-beige-dark font-mono">
                          {catPacked}/{catTotal}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-bold text-gray-400 mt-0.5 truncate">
                      {catTotal === 0 ? '尚未新增任何項目' : percentage === 100 ? '🎉 此分類已全部打包完成！' : `還有 ${catTotal - catPacked} 件物品待打包`}
                    </div>
                  </div>
                </div>

                {/* Progress or Empty State Tag Requirement: 若某分類沒有任何項目，顯示「尚未新增」的空狀態提示，而非0%進度條 */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {catTotal > 0 ? (
                    <CircularProgress
                      percentage={percentage}
                      color={cat.ringColor}
                      size={46}
                      strokeWidth={4.5}
                    />
                  ) : (
                    <span className="text-xs font-bold text-gray-400 bg-beige-light/80 px-3 py-1.5 rounded-full border border-beige-dark">
                      尚未新增
                    </span>
                  )}
                </div>
              </div>

              {/* Items List Inside Category */}
              <div className="p-3 sm:p-4 divide-y divide-beige-dark/40">
                {/* Empty State when no items in this category */}
                {catTotal === 0 && (
                  <div className="py-4 text-center text-xs font-bold text-gray-400 flex items-center justify-center gap-2">
                    <PackageOpen size={16} className="text-gray-300" />
                    <span>尚未新增任何{cat.label}項目</span>
                  </div>
                )}

                {/* Render Items */}
                {categoryItems.map((item) => {
                  const isEditing = editingId === item.id;

                  if (isEditing) {
                    return (
                      <div key={item.id} className="py-3 space-y-2 animate-scale-in">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="flex-1 bg-beige-light text-cocoa px-3 py-1.5 rounded-xl border-2 border-sage font-bold text-xs outline-none"
                            placeholder="物品名稱..."
                          />
                          <button
                            type="button"
                            onClick={() => saveEdit(item.id)}
                            className="p-1.5 bg-sage text-white rounded-xl hover:bg-sage-dark active:scale-95 shadow-xs"
                            title="儲存"
                          >
                            <Check size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="p-1.5 bg-gray-100 text-gray-500 rounded-xl hover:bg-gray-200"
                            title="取消"
                          >
                            <X size={15} />
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={item.id}
                      className={`py-2.5 flex items-center justify-between gap-3 group transition-colors rounded-xl px-2 hover:bg-beige-light/60 ${
                        item.done ? 'opacity-60' : ''
                      }`}
                    >
                      {/* Checkbox and Item Title */}
                      <button
                        type="button"
                        onClick={() => onToggle(item.id)}
                        className="flex items-center gap-3 min-w-0 flex-1 text-left select-none"
                      >
                        <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                          item.done
                            ? 'bg-sage border-sage text-white shadow-xs'
                            : 'bg-white border-beige-dark text-transparent hover:border-sage'
                        }`}>
                          <Check size={12} strokeWidth={3} />
                        </div>
                        <span
                          className={`text-xs font-black truncate transition-all ${
                            item.done ? 'line-through text-gray-400' : 'text-cocoa'
                          }`}
                        >
                          {item.text}
                        </span>
                      </button>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => startEdit(item)}
                          className="p-1.5 text-gray-400 hover:text-sage transition-colors rounded-lg hover:bg-white"
                          title="編輯"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(item.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-white"
                          title="刪除"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* In-Card Quick Add Input Form */}
                <form
                  onSubmit={(e) => handleAddCategoryItem(cat.key, e)}
                  className="pt-2.5 flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setCategoryInputs(prev => ({ ...prev, [cat.key]: e.target.value }))}
                    placeholder={`+ 新增${cat.label}（按 Enter 或點擊新增）...`}
                    className="flex-1 bg-beige-light/80 focus:bg-white text-cocoa px-3.5 py-2 rounded-xl border border-beige-dark focus:border-sage font-bold text-xs outline-none transition-all shadow-inner placeholder:text-gray-400"
                  />
                  <button
                    type="submit"
                    disabled={!inputValue.trim()}
                    className="px-3.5 py-2 bg-sage hover:bg-sage-dark disabled:opacity-40 text-white font-black text-xs rounded-xl transition-all shadow-xs active:scale-95 flex-shrink-0 flex items-center gap-1"
                  >
                    <Plus size={14} strokeWidth={3} />
                    <span>新增</span>
                  </button>
                </form>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recommended Presets Modal */}
      {showPresetModal && (
        <div
          className="fixed inset-0 bg-cocoa/70 backdrop-blur-md z-[9999] flex items-center justify-center p-3 sm:p-4 animate-fade-in"
          onClick={() => setShowPresetModal(false)}
        >
          <div
            className="bg-beige-light w-full max-w-lg max-h-[90vh] rounded-[2rem] border-3 border-cocoa shadow-hard flex flex-col overflow-hidden animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-beige border-b-2 border-beige-dark flex justify-between items-center flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-500 text-white flex items-center justify-center border-2 border-amber-600 shadow-sm">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="text-base font-black text-cocoa">行李必備推薦清單</h3>
                  <p className="text-[10px] font-bold text-gray-400">快速加入 {selectedMember} 的行李清單</p>
                </div>
              </div>
              <button onClick={() => setShowPresetModal(false)} className="text-gray-400 hover:text-cocoa p-1">
                <X size={20} />
              </button>
            </div>

            {/* Category Tabs inside Modal */}
            <div className="p-3.5 bg-white border-b border-beige-dark flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {PACKING_CATEGORIES.map((cat) => {
                const isSelected = selectedPresetCategory === cat.key;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => {
                      setSelectedPresetCategory(cat.key);
                      setSelectedPresets(PRESET_PACKING_ITEMS[cat.key].slice(0, 4));
                    }}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-black whitespace-nowrap transition-all ${
                      isSelected ? 'bg-sage text-white border-sage-dark shadow-xs' : 'bg-beige-light text-cocoa/70 border-beige-dark hover:bg-beige'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto space-y-2 flex-1">
              <div className="text-xs font-black text-cocoa mb-2">
                推薦「{PACKING_CATEGORIES.find(c => c.key === selectedPresetCategory)?.label}」常備物品：
              </div>
              <div className="space-y-1.5">
                {PRESET_PACKING_ITEMS[selectedPresetCategory].map((presetText) => {
                  const isChecked = selectedPresets.includes(presetText);
                  return (
                    <button
                      key={presetText}
                      type="button"
                      onClick={() => {
                        if (isChecked) {
                          setSelectedPresets(selectedPresets.filter(p => p !== presetText));
                        } else {
                          setSelectedPresets([...selectedPresets, presetText]);
                        }
                      }}
                      className={`w-full p-3 rounded-2xl border-2 flex items-center justify-between text-left transition-all ${
                        isChecked ? 'bg-sage-light/60 border-sage text-cocoa shadow-xs' : 'bg-white border-beige-dark text-gray-500 hover:bg-beige-light/40'
                      }`}
                    >
                      <span className="text-xs font-bold">{presetText}</span>
                      <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center ${
                        isChecked ? 'bg-sage border-sage text-white' : 'border-beige-dark bg-white'
                      }`}>
                        {isChecked && <Check size={12} strokeWidth={3} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-4 bg-beige border-t-2 border-beige-dark flex items-center justify-between gap-3">
              <span className="text-xs font-bold text-gray-500">已選取 {selectedPresets.length} 項</span>
              <button
                type="button"
                onClick={handleAddPresets}
                disabled={selectedPresets.length === 0}
                className="px-5 py-2 rounded-xl bg-sage hover:bg-sage-dark disabled:opacity-40 text-white text-xs font-black border border-sage-dark shadow-sm active:scale-95"
              >
                加入 {selectedMember} 的行李清單 (+{selectedPresets.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PackingList;
