import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  FolderClosed, 
  Plus, 
  ShieldCheck, 
  AlertTriangle, 
  XCircle, 
  Calendar, 
  Copy, 
  Check, 
  ExternalLink, 
  Eye, 
  EyeOff, 
  Trash2, 
  Edit3, 
  Maximize2, 
  Camera, 
  Upload, 
  X, 
  FileText, 
  Hotel, 
  Ticket, 
  Car, 
  Shield, 
  FileCheck2, 
  BookUser,
  Info,
  Clock,
  Users
} from 'lucide-react';
import { TravelDocument, DocumentCategory, Member } from '../types';
import { MemberAvatar } from './MemberAvatar';
import { compressImageToBase64 } from '../utils/imageService';
import { Lightbox } from './Lightbox';

interface DocumentsViewProps {
  documents: TravelDocument[];
  members: Member[];
  onAddDocument: (doc: Omit<TravelDocument, 'id' | 'createdAt'>) => void;
  onUpdateDocument: (id: string | number, updates: Partial<TravelDocument>) => void;
  onDeleteDocument: (id: string | number) => void;
}

export const ACTIVE_DOCUMENT_CATEGORIES: DocumentCategory[] = [
  'passport',
  'visa',
  'insurance',
  'hotel',
  'ticket',
  'other',
];

export const CATEGORY_CONFIG: Record<DocumentCategory, {
  label: string;
  icon: any;
  color: string;
  bgGradient: string;
  badgeBg: string;
  badgeText: string;
  defaultTitle: string;
}> = {
  passport: {
    label: '入境資料',
    icon: BookUser,
    color: 'text-sky-700',
    bgGradient: 'from-sky-800 via-sky-900 to-slate-900 text-sky-100',
    badgeBg: 'bg-sky-50 border-sky-200',
    badgeText: 'text-sky-800',
    defaultTitle: '入境資料',
  },
  visa: {
    label: '簽證',
    icon: FileCheck2,
    color: 'text-indigo-700',
    bgGradient: 'from-indigo-800 via-indigo-900 to-slate-900 text-indigo-100',
    badgeBg: 'bg-indigo-50 border-indigo-200',
    badgeText: 'text-indigo-800',
    defaultTitle: '入境簽證 (Visa)',
  },
  insurance: {
    label: '保險單',
    icon: ShieldCheck,
    color: 'text-emerald-700',
    bgGradient: 'from-emerald-800 via-teal-900 to-slate-900 text-emerald-100',
    badgeBg: 'bg-emerald-50 border-emerald-200',
    badgeText: 'text-emerald-800',
    defaultTitle: '旅遊平安/不便險保單',
  },
  hotel: {
    label: '訂房確認',
    icon: Hotel,
    color: 'text-amber-700',
    bgGradient: 'from-amber-800 via-orange-900 to-slate-900 text-amber-100',
    badgeBg: 'bg-amber-50 border-amber-200',
    badgeText: 'text-amber-800',
    defaultTitle: '飯店訂房確認憑證',
  },
  ticket: {
    label: '交通憑證',
    icon: Ticket,
    color: 'text-purple-700',
    bgGradient: 'from-purple-800 via-violet-900 to-slate-900 text-purple-100',
    badgeBg: 'bg-purple-50 border-purple-200',
    badgeText: 'text-purple-800',
    defaultTitle: '機票/火車/票券憑證',
  },
  other: {
    label: '其他文件',
    icon: FileText,
    color: 'text-stone-700',
    bgGradient: 'from-stone-700 via-stone-800 to-slate-900 text-stone-100',
    badgeBg: 'bg-stone-100 border-stone-200',
    badgeText: 'text-stone-800',
    defaultTitle: '重要證明文件',
  },
  license: {
    label: '其他憑證',
    icon: Car,
    color: 'text-blue-700',
    bgGradient: 'from-blue-800 via-cyan-900 to-slate-900 text-blue-100',
    badgeBg: 'bg-blue-50 border-blue-200',
    badgeText: 'text-blue-800',
    defaultTitle: '重要旅行憑證',
  },
};

/**
 * Calculates real-time expiry status and returns color badges
 * 綠色 = 安全 (效期 > 180 天 / 6 個月)
 * 橘色 = 快到期 / 需注意 (0 <= 效期 <= 180 天，出國多數要求 6 個月以上效期)
 * 紅色 = 已過期 (效期 < 0 天)
 */
export const getExpiryStatus = (expiryDate?: string) => {
  if (!expiryDate) {
    return {
      status: 'none' as const,
      label: '無效期限制',
      shortLabel: '常態有效',
      badgeClass: 'bg-gray-100 text-gray-600 border-gray-200',
      dotColor: 'bg-gray-400',
      borderClass: 'border-beige-dark',
      daysLeft: null,
      icon: Check,
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(expiryDate);
  exp.setHours(0, 0, 0, 0);

  const diffTime = exp.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      status: 'expired' as const,
      label: `已過期 (${Math.abs(diffDays)} 天前)`,
      shortLabel: '已過期',
      badgeClass: 'bg-red-500 text-white border-red-600 shadow-sm animate-pulse',
      cardBadge: 'bg-red-50 text-red-700 border-red-200 font-black',
      dotColor: 'bg-red-500',
      borderClass: 'border-red-300',
      daysLeft: diffDays,
      icon: XCircle,
      warningText: '此證件已失效，請務必重新辦理或換發！',
    };
  } else if (diffDays <= 180) {
    return {
      status: 'warning' as const,
      label: diffDays <= 30 ? `即將到期 • 剩 ${diffDays} 天` : `效期不足半年 • 剩 ${diffDays} 天`,
      shortLabel: `剩 ${diffDays} 天`,
      badgeClass: 'bg-amber-500 text-white border-amber-600 shadow-sm',
      cardBadge: 'bg-amber-50 text-amber-800 border-amber-300 font-black',
      dotColor: 'bg-amber-500',
      borderClass: 'border-amber-300',
      daysLeft: diffDays,
      icon: AlertTriangle,
      warningText: '注意：出國旅行多數國家規定護照需有 6 個月以上效期！',
    };
  } else {
    const years = (diffDays / 365).toFixed(1);
    return {
      status: 'safe' as const,
      label: `安全 • 剩 ${diffDays > 365 ? `${years} 年` : `${diffDays} 天`}`,
      shortLabel: `安全 (${diffDays > 365 ? `${years}年` : `${diffDays}天`})`,
      badgeClass: 'bg-emerald-600 text-white border-emerald-700 shadow-sm',
      cardBadge: 'bg-emerald-50 text-emerald-800 border-emerald-200 font-bold',
      dotColor: 'bg-emerald-500',
      borderClass: 'border-emerald-200/80',
      daysLeft: diffDays,
      icon: ShieldCheck,
    };
  }
};

export const DocumentsView: React.FC<DocumentsViewProps> = ({
  documents = [],
  members = [],
  onAddDocument,
  onUpdateDocument,
  onDeleteDocument,
  activeMemberFilter,
  onToggleMemberFilter,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory | 'all'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<TravelDocument | null>(null);
  const [viewingDoc, setViewingDoc] = useState<TravelDocument | null>(null);
  const [deletingId, setDeletingId] = useState<string | number | null>(null);

  // Lightbox
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Mask toggle state for numbers
  const [unmaskedDocs, setUnmaskedDocs] = useState<Record<string | number, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | number | null>(null);

  // Filter selection
  const filteredDocs = selectedCategory === 'all' 
    ? documents 
    : documents.filter((doc) => doc.category === selectedCategory);

  // Calculate statistics
  const stats = {
    total: documents.length,
    safe: documents.filter(d => getExpiryStatus(d.expiryDate).status === 'safe').length,
    warning: documents.filter(d => getExpiryStatus(d.expiryDate).status === 'warning').length,
    expired: documents.filter(d => getExpiryStatus(d.expiryDate).status === 'expired').length,
  };

  const handleCopyNumber = (e: React.MouseEvent, docId: string | number, text?: string) => {
    e.stopPropagation();
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(docId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const toggleMask = (e: React.MouseEvent, docId: string | number) => {
    e.stopPropagation();
    setUnmaskedDocs(prev => ({ ...prev, [docId]: !prev[docId] }));
  };

  const openLightbox = (e: React.MouseEvent, images: string[], index = 0) => {
    e.stopPropagation();
    setLightboxImages(images);
    setLightboxIndex(index);
  };

  const handleDelete = (e: React.MouseEvent, id: string | number) => {
    e.stopPropagation();
    onDeleteDocument(id);
    setDeletingId(null);
    if (viewingDoc?.id === id) setViewingDoc(null);
  };

  return (
    <div className="w-full space-y-4 animate-scale-in">
      {/* Category Pills Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3.5 py-2 rounded-full border-2 text-xs font-black transition-all whitespace-nowrap active:scale-95 ${
            selectedCategory === 'all'
              ? 'bg-cocoa text-white border-cocoa shadow-sm scale-105'
              : 'bg-white text-gray-500 border-beige-dark hover:bg-beige-light'
          }`}
        >
          全部 ({documents.length})
        </button>
        {ACTIVE_DOCUMENT_CATEGORIES.map((catKey) => {
          const config = CATEGORY_CONFIG[catKey];
          if (!config) return null;
          const Icon = config.icon;
          const count = documents.filter((d) => d.category === catKey).length;
          const isSelected = selectedCategory === catKey;
          return (
            <button
              key={catKey}
              onClick={() => setSelectedCategory(catKey)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full border-2 text-xs font-bold transition-all whitespace-nowrap active:scale-95 ${
                isSelected
                  ? 'bg-sage text-white border-sage shadow-sm scale-105'
                  : 'bg-white text-gray-500 border-beige-dark hover:bg-beige-light'
              }`}
            >
              <Icon size={13} />
              <span>{config.label}</span>
              {count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/30 text-white' : 'bg-beige text-cocoa'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Document Grid (Vertical Cards) */}
      {filteredDocs.length === 0 ? (
        <div className="bg-white p-10 rounded-[2.5rem] border-2 border-dashed border-beige-dark text-center space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-beige-light text-gray-300 mx-auto flex items-center justify-center border-2 border-beige-dark">
            <FolderClosed size={32} />
          </div>
          <div className="font-black text-cocoa text-base">尚無入境資料或文件</div>
          <p className="text-xs font-bold text-gray-400 max-w-xs mx-auto">
            點擊下方「新增資料」上傳護照、簽證、保單或訂房確認，自動追蹤到期日確保行程順暢！
          </p>
          <button
            onClick={() => {
              setEditingDoc(null);
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center gap-2 bg-cocoa text-white px-5 py-2.5 rounded-full border-2 border-cocoa text-xs font-black shadow-hard-sm hover:bg-cocoa/90 transition-all active:scale-95"
          >
            <Plus size={16} strokeWidth={3} /> 新增資料
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-20 lg:pb-6">
          {filteredDocs.map((doc) => {
            const config = CATEGORY_CONFIG[doc.category] || CATEGORY_CONFIG.other;
            const CategoryIcon = config.icon;
            const hasPhotos = doc.images && doc.images.length > 0;
            const memberObj = members.find((m) => m.name === doc.holder);

            return (
              <div
                key={doc.id}
                onClick={() => setViewingDoc(doc)}
                className="group bg-white rounded-[2rem] border-2 border-beige-dark shadow-hard-sm hover:shadow-hard hover:-translate-y-0.5 transition-all flex flex-col overflow-hidden cursor-pointer relative"
              >
                {/* Top Section: Photo Thumbnail or Stylized Category Header */}
                <div className="relative w-full aspect-[16/9] bg-slate-900 overflow-hidden flex-shrink-0">
                  {hasPhotos ? (
                    <div className="w-full h-full relative group/img">
                      <img
                        src={doc.images![0]}
                        alt={doc.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/40"></div>

                      {/* Expand / View Photos Button */}
                      <button
                        onClick={(e) => openLightbox(e, doc.images!, 0)}
                        className="absolute bottom-2.5 right-2.5 bg-black/60 hover:bg-black/80 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1.5 rounded-xl border border-white/30 flex items-center gap-1.5 transition-transform active:scale-95"
                      >
                        <Maximize2 size={12} />
                        <span>{doc.images!.length > 1 ? `${doc.images!.length} 張圖檔` : '查看圖檔'}</span>
                      </button>
                    </div>
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${config.bgGradient} p-4 flex flex-col justify-between relative`}>
                      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px]"></div>

                      <div className="flex items-center justify-between z-10">
                        <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20 text-white text-[10px] font-black">
                          <CategoryIcon size={12} />
                          <span>{config.label}</span>
                        </div>
                      </div>

                      <div className="z-10 text-center py-2">
                        <CategoryIcon size={36} className="mx-auto opacity-70 mb-1" />
                        <div className="text-[11px] font-bold tracking-wider opacity-80 uppercase">Travel Document</div>
                      </div>
                    </div>
                  )}

                  {/* Top-Left Floating Badge: Member Holder */}
                  <div className="absolute top-2.5 left-2.5 z-10">
                    <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full border border-white shadow-sm">
                      {doc.holder === '全體' ? (
                        <span className="text-[10px] font-black text-cocoa">👥 全體</span>
                      ) : (
                        <>
                          <MemberAvatar
                            avatar={memberObj?.avatar}
                            name={doc.holder}
                            id={memberObj?.id}
                            size="xs"
                            showBorder={false}
                            className="w-4 h-4"
                          />
                          <span className="text-[10px] font-black text-cocoa">{doc.holder}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Top-Right Floating Badge: Category Pill */}
                  <div className="absolute top-2.5 right-2.5 z-10">
                    <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-md text-white px-2.5 py-1 rounded-full text-[10px] font-black border border-white/20">
                      <CategoryIcon size={11} />
                      <span>{config.label}</span>
                    </div>
                  </div>
                </div>

                {/* Vertical Card Body */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    {/* Document Title */}
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-black text-cocoa text-base leading-snug break-words group-hover:text-sage transition-colors">
                        {doc.title}
                      </h3>
                    </div>

                    {/* Notes preview if any */}
                    {doc.note && (
                      <p className="text-[11px] font-bold text-gray-500 mt-2 line-clamp-2 bg-beige/40 p-2.5 rounded-xl border border-beige-dark/60">
                        {doc.note}
                      </p>
                    )}
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="pt-2 border-t border-beige-dark/50 flex items-center justify-between text-xs font-bold text-gray-400">
                    <span className="text-[11px] font-bold text-gray-400">
                      {hasPhotos ? `📷 ${doc.images!.length} 張檔案` : '📄 無圖檔'}
                    </span>

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      {deletingId === doc.id ? (
                        <div className="flex items-center gap-1 animate-scale-in">
                          <button
                            type="button"
                            onClick={(e) => handleDelete(e, doc.id)}
                            className="bg-red-500 text-white text-[10px] px-2.5 py-1 rounded-full font-black hover:bg-red-600 active:scale-95"
                          >
                            確定刪除?
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingId(null)}
                            className="text-gray-400 p-1 hover:text-gray-600"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingDoc(doc);
                              setIsAddModalOpen(true);
                            }}
                            className="p-1.5 text-gray-400 hover:text-sage hover:bg-sage-light rounded-lg transition-colors"
                            title="編輯"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingId(doc.id);
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="刪除"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Add New Document Card in Grid */}
          <button
            onClick={() => {
              setEditingDoc(null);
              setIsAddModalOpen(true);
            }}
            className="bg-white/60 hover:bg-white rounded-[2rem] border-2 border-dashed border-beige-dark hover:border-cocoa p-6 flex flex-col items-center justify-center gap-2 text-cocoa transition-all min-h-[180px] active:scale-95 group shadow-sm hover:shadow-hard-sm"
          >
            <div className="w-12 h-12 rounded-full bg-sage-light group-hover:bg-sage text-sage group-hover:text-white flex items-center justify-center transition-all border border-sage/30">
              <Plus size={24} strokeWidth={2.5} />
            </div>
            <span className="text-xs font-black">新增資料</span>
          </button>
        </div>
      )}

      {/* Add / Edit Document Modal */}
      {isAddModalOpen && (
        <DocumentModal
          isOpen={isAddModalOpen}
          initialData={editingDoc}
          members={members}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingDoc(null);
          }}
          onSave={(docData) => {
            if (editingDoc) {
              onUpdateDocument(editingDoc.id, docData);
            } else {
              onAddDocument(docData);
            }
            setIsAddModalOpen(false);
            setEditingDoc(null);
          }}
        />
      )}

      {/* Full Document Detail View Modal */}
      {viewingDoc && (
        <DocumentDetailModal
          doc={viewingDoc}
          members={members}
          onClose={() => setViewingDoc(null)}
          onEdit={() => {
            setEditingDoc(viewingDoc);
            setViewingDoc(null);
            setIsAddModalOpen(true);
          }}
          onDelete={() => {
            onDeleteDocument(viewingDoc.id);
            setViewingDoc(null);
          }}
          onOpenLightbox={(images, index) => {
            setLightboxImages(images);
            setLightboxIndex(index);
          }}
        />
      )}

      {/* Lightbox for zooming photos */}
      {lightboxImages.length > 0 && (
        <Lightbox
          images={lightboxImages}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxImages([])}
        />
      )}
    </div>
  );
};

interface DocumentModalProps {
  isOpen: boolean;
  initialData?: TravelDocument | null;
  members: Member[];
  onClose: () => void;
  onSave: (doc: Omit<TravelDocument, 'id' | 'createdAt'>) => void;
}

const DocumentModal: React.FC<DocumentModalProps> = ({
  isOpen,
  initialData,
  members,
  onClose,
  onSave,
}) => {
  const [category, setCategory] = useState<DocumentCategory>(initialData?.category || 'passport');
  const [title, setTitle] = useState(initialData?.title || CATEGORY_CONFIG.passport.defaultTitle);
  const [holder, setHolder] = useState<string>(initialData?.holder || members[0]?.name || '全體');
  const [note, setNote] = useState(initialData?.note || '');
  const [images, setImages] = useState<string[]>(initialData?.images || []);
  const [isCompressing, setIsCompressing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleCategorySelect = (cat: DocumentCategory) => {
    setCategory(cat);
    if (!initialData || title === CATEGORY_CONFIG[initialData.category]?.defaultTitle) {
      setTitle(CATEGORY_CONFIG[cat].defaultTitle);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsCompressing(true);
    try {
      const newBase64List: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const compressed = await compressImageToBase64(file);
        newBase64List.push(compressed);
      }
      setImages((prev) => [...prev, ...newBase64List]);
    } catch (err) {
      console.error('Image compression failed:', err);
      alert('圖片處理失敗，請嘗試其他格式');
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('請輸入資料名稱');
      return;
    }

    onSave({
      title: title.trim(),
      category,
      holder,
      note: note.trim() || undefined,
      images: images.length > 0 ? images : undefined,
    });
  };

  const modalContent = (
    <div
      className="fixed inset-0 bg-cocoa/70 backdrop-blur-md z-[9999] flex flex-col items-center justify-center p-0 sm:p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[#FAF8F2] w-full max-w-lg sm:max-w-xl max-h-[92vh] rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl border-2 sm:border-4 border-beige-dark flex flex-col overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 sm:px-6 pt-5 pb-4 bg-beige border-b-2 border-beige-dark flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-sage text-white flex items-center justify-center border-2 border-sage-dark shadow-sm">
              <FolderClosed size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-xl font-black text-cocoa">
                {initialData ? '編輯資料' : '新增資料'}
              </h2>
              <p className="text-xs font-bold text-gray-400">登錄重要旅行資料與文件憑證</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white text-gray-400 hover:text-cocoa border-2 border-beige-dark transition-colors"
          >
            <X size={18} strokeWidth={3} />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 flex-1">
          {/* Category Selector */}
          <div>
            <label className="block text-xs font-black text-cocoa uppercase tracking-wider mb-2">
              資料類別
            </label>
            <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
              {ACTIVE_DOCUMENT_CATEGORIES.map((catKey) => {
                const config = CATEGORY_CONFIG[catKey];
                if (!config) return null;
                const Icon = config.icon;
                const isSelected = category === catKey;
                return (
                  <button
                    type="button"
                    key={catKey}
                    onClick={() => handleCategorySelect(catKey)}
                    className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-2xl border-2 transition-all text-xs font-black gap-1.5 active:scale-95 ${
                      isSelected
                        ? 'bg-sage text-white border-sage-dark shadow-hard-sm scale-[1.02]'
                        : 'bg-white text-gray-600 border-beige-dark hover:bg-beige-light'
                    }`}
                  >
                    <Icon size={18} />
                    <span className="truncate w-full text-center">{config.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-black text-cocoa uppercase tracking-wider mb-1.5">
              資料名稱 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例: 瑞士入境卡 / 申根簽證 / 醫療保險單 / 瑞士通行證"
              className="w-full bg-white text-cocoa px-4 py-3 rounded-2xl border-2 border-beige-dark outline-none font-bold text-sm focus:border-sage shadow-sm"
            />
          </div>

          {/* Holder / Member Assignment */}
          <div>
            <label className="block text-xs font-black text-cocoa uppercase tracking-wider mb-2">
              所屬成員
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setHolder('全體')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border-2 text-xs font-black transition-all active:scale-95 ${
                  holder === '全體'
                    ? 'bg-cocoa text-white border-cocoa shadow-sm scale-105'
                    : 'bg-white text-gray-600 border-beige-dark hover:border-cocoa/40'
                }`}
              >
                <Users size={14} />
                <span>全體共同</span>
              </button>
              {members.map((m) => {
                const isSelected = holder === m.name;
                return (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => setHolder(m.name)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 text-xs font-bold transition-all active:scale-95 ${
                      isSelected
                        ? 'bg-sage text-white border-sage-dark shadow-sm scale-105'
                        : 'bg-white text-cocoa border-beige-dark hover:border-sage/60'
                    }`}
                  >
                    <MemberAvatar
                      avatar={m.avatar}
                      name={m.name}
                      id={m.id}
                      size="xs"
                      showBorder={false}
                      className="w-4 h-4 rounded-full"
                    />
                    <span>{m.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Photo / Screenshot Upload */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-black text-cocoa uppercase tracking-wider">
                上傳資料
              </label>
              {images.length > 0 && (
                <span className="text-[10px] font-bold text-sage bg-sage/10 px-2 py-0.5 rounded-full border border-sage/20">
                  已選取 {images.length} 張
                </span>
              )}
            </div>

            {images.length === 0 ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isCompressing}
                className="w-full py-4 rounded-2xl border-2 border-dashed border-sage/70 hover:border-sage bg-white hover:bg-sage/5 text-sage flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] cursor-pointer shadow-sm"
              >
                {isCompressing ? (
                  <div className="w-5 h-5 border-2 border-sage border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <div className="w-8 h-8 rounded-full bg-sage-light flex items-center justify-center border border-sage/30">
                      <Camera size={18} strokeWidth={2.5} />
                    </div>
                    <span className="text-xs font-black text-cocoa">拍照或選擇圖檔</span>
                  </>
                )}
              </button>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                {images.map((img, idx) => (
                  <div key={idx} className="relative aspect-[4/3] rounded-xl overflow-hidden border-2 border-beige-dark group shadow-sm bg-black/5">
                    <img src={img} alt={`doc-${idx}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1 right-1 bg-black/70 hover:bg-red-500 text-white p-1 rounded-full transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isCompressing}
                  className="aspect-[4/3] rounded-xl border-2 border-dashed border-sage hover:border-sage-dark bg-white hover:bg-sage/5 text-sage flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer shadow-sm"
                >
                  {isCompressing ? (
                    <div className="w-5 h-5 border-2 border-sage border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Plus size={18} strokeWidth={3} />
                      <span className="text-[10px] font-black">新增照片</span>
                    </>
                  )}
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageUpload}
            />
          </div>

          {/* Notes - Expanded & Clean */}
          <div>
            <label className="block text-xs font-black text-cocoa uppercase tracking-wider mb-1.5">
              備註說明
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="輸入備註事項或重要說明..."
              rows={4}
              className="w-full bg-white text-cocoa px-4 py-3 rounded-2xl border-2 border-beige-dark outline-none font-bold text-xs focus:border-sage shadow-sm resize-y leading-relaxed min-h-[90px]"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white text-gray-500 py-3.5 rounded-2xl border-2 border-beige-dark font-black text-sm hover:bg-beige-light transition-colors active:scale-95"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isCompressing}
              className="flex-1 bg-sage hover:bg-sage-dark text-white py-3.5 rounded-2xl border-2 border-sage-dark font-black text-sm shadow-hard-sage active:translate-y-0.5 active:shadow-none transition-all"
            >
              {initialData ? '儲存更新' : '確認新增'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};

interface DocumentDetailModalProps {
  doc: TravelDocument;
  members: Member[];
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onOpenLightbox: (images: string[], index: number) => void;
}

const DocumentDetailModal: React.FC<DocumentDetailModalProps> = ({
  doc,
  members,
  onClose,
  onEdit,
  onDelete,
  onOpenLightbox,
}) => {
  const config = CATEGORY_CONFIG[doc.category] || CATEGORY_CONFIG.other;
  const CategoryIcon = config.icon;
  const memberObj = members.find((m) => m.name === doc.holder);

  const modalContent = (
    <div
      className="fixed inset-0 bg-cocoa/70 backdrop-blur-md z-[9999] flex flex-col items-center justify-center p-0 sm:p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[#FAF8F2] w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-lg sm:rounded-[2.5rem] rounded-none shadow-2xl border-0 sm:border-4 sm:border-beige-dark flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header with Category Badge & Close */}
        <div className="p-5 bg-beige flex justify-between items-center border-b-2 border-beige-dark flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white border-2 border-beige-dark flex items-center justify-center text-sage">
              <CategoryIcon size={16} />
            </div>
            <span className="text-xs font-black text-cocoa">{config.label}</span>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white text-gray-400 hover:text-cocoa border-2 border-beige-dark"
          >
            <X size={18} strokeWidth={3} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Title & Member Tag */}
          <div>
            <h2 className="text-2xl font-black text-cocoa">{doc.title}</h2>

            <div className="flex items-center gap-2 mt-3">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-beige-light border border-beige-dark text-xs font-black text-cocoa">
                {doc.holder === '全體' ? (
                  <span>👥 全體成員</span>
                ) : (
                  <>
                    <MemberAvatar
                      avatar={memberObj?.avatar}
                      name={doc.holder}
                      id={memberObj?.id}
                      size="xs"
                      showBorder={false}
                      className="w-4 h-4"
                    />
                    <span>{doc.holder}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Photo Gallery with Lightbox trigger */}
          {doc.images && doc.images.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-black text-cocoa uppercase tracking-wider">文件圖檔 ({doc.images.length})</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {doc.images.map((img, idx) => (
                  <div
                    key={idx}
                    onClick={() => onOpenLightbox(doc.images!, idx)}
                    className="aspect-[4/3] rounded-2xl overflow-hidden border-2 border-beige-dark cursor-pointer group relative shadow-sm"
                  >
                    <img src={img} alt={`doc-preview-${idx}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                      <Maximize2 size={20} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {doc.note && (
            <div>
              <span className="text-xs font-black text-cocoa uppercase tracking-wider block mb-1.5">
                備註說明
              </span>
              <div className="bg-yellow-50/70 p-3.5 rounded-2xl border border-yellow-200 text-xs font-bold text-cocoa whitespace-pre-wrap leading-relaxed">
                {doc.note}
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Actions */}
        <div className="p-4 sm:p-5 bg-beige border-t-2 border-beige-dark flex gap-3 flex-shrink-0">
          <button
            onClick={onDelete}
            className="px-4 py-3 bg-red-50 text-red-600 rounded-2xl border-2 border-red-200 font-black text-xs hover:bg-red-100 flex items-center justify-center gap-1.5 active:scale-95"
          >
            <Trash2 size={15} /> 刪除
          </button>
          <button
            onClick={onEdit}
            className="flex-1 bg-sage hover:bg-sage-dark text-white py-3 rounded-2xl border-2 border-sage-dark font-black text-sm shadow-hard-sage flex items-center justify-center gap-2 active:translate-y-0.5 active:shadow-none"
          >
            <Edit3 size={16} /> 編輯資料
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
