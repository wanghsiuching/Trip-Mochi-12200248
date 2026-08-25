import React, { useState, useRef } from 'react';
import { PenTool, Trash2, X, Feather, Send, Check, AlertCircle, Camera, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Journal, Member, Comment } from '../types';
import { DateTimePickerField } from './TimePickerComponents';
import { MemberAvatar } from './MemberAvatar';
import { compressImageToBase64 } from '../utils/imageService';
import { Lightbox } from './Lightbox';

interface FormImageItem {
  id: string;
  url: string;
  progress: number;
  isReady: boolean;
  error?: string;
}

interface JournalViewProps {
  journals: Journal[];
  members: Member[];
  onAdd: (journal: Journal) => void;
  onUpdate: (journal: Journal) => void;
  onDelete: (id: number) => void;
}

export const JournalView: React.FC<JournalViewProps> = ({ journals, members, onAdd, onUpdate, onDelete }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingJournal, setEditingJournal] = useState<Journal | null>(null);
  
  // Initialize with current date and time
  const getCurrentDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  const [form, setForm] = useState({ 
      content: '', 
      date: getCurrentDateTime(), 
      author: members[0]?.name || '我', 
      photos: [] as string[] 
  });

  const [formImages, setFormImages] = useState<FormImageItem[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lightbox view state
  const [lightboxImages, setLightboxImages] = useState<string[] | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  
  // Delete Confirmation State
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Inline Comment State
  const [commentDrafts, setCommentDrafts] = useState<Record<number, string>>({});
  const [commentAuthors, setCommentAuthors] = useState<Record<number, string>>({});
  
  // Comment Edit/Delete State
  const [editingComment, setEditingComment] = useState<{ itemId: number, commentId: string, text: string } | null>(null);
  const [deletingComment, setDeletingComment] = useState<{ itemId: number, commentId: string } | null>(null);

  const openAdd = () => {
      setEditingJournal(null);
      setForm({ content: '', date: getCurrentDateTime(), author: members[0]?.name || '我', photos: [] });
      setFormImages([]);
      setUploadError(null);
      setShowModal(true);
  };

  const openEdit = (journal: Journal) => {
      setEditingJournal(journal);
      let formattedDate = journal.date;
      if (formattedDate.length === 10) { 
          formattedDate += 'T12:00';
      }
      const existingPhotos = journal.photos || [];
      setForm({ ...journal, date: formattedDate, photos: existingPhotos });
      setFormImages(existingPhotos.map((url, idx) => ({
        id: `existing-${idx}-${Date.now()}`,
        url,
        progress: 100,
        isReady: true,
      })));
      setUploadError(null);
      setShowModal(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadError(null);
    const currentCount = formImages.length;
    const remaining = 30 - currentCount;
    if (remaining <= 0) return;

    const filesToUpload = Array.from(files).slice(0, remaining);

    // 1. Create immediate preview placeholders
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

    // Reset input immediately so user can select again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // 2. Compress each file to lightweight JPEG Base64
    const compressionPromises = filesToUpload.map(async (file, idx) => {
      const targetItem = newItems[idx];
      try {
        const compressedBase64 = await compressImageToBase64(file);

        if (compressedBase64 && compressedBase64.startsWith('data:image/')) {
          setFormImages(prev =>
            prev.map(item =>
              item.id === targetItem.id
                ? { ...item, url: compressedBase64, progress: 100, isReady: true, error: undefined }
                : item
            )
          );
        } else {
          throw new Error('圖片格式無法解碼');
        }
      } catch (error: any) {
        console.error(`Error processing journal image #${idx + 1}:`, error);
        setUploadError(`第 ${idx + 1} 張圖片「${file.name || '照片'}」處理失敗，已自動跳過`);
        setFormImages(prev => prev.filter(item => item.id !== targetItem.id));
      }
    });

    await Promise.allSettled(compressionPromises);
  };

  const handleRemoveFormImage = (idToRemove: string) => {
    setFormImages(prev => prev.filter(img => img.id !== idToRemove));
  };

  const handleSave = () => {
    if (!form.content && formImages.length === 0) return;

    // Filter only valid base64 / http images
    const finalPhotos = formImages
      .filter(img => img.isReady && img.url && (img.url.startsWith('data:image/') || img.url.startsWith('http')))
      .map(img => img.url);

    const journalPayload = {
      content: form.content.trim(),
      date: form.date,
      author: form.author,
      photos: finalPhotos,
    };

    if (editingJournal) {
      onUpdate({ ...editingJournal, ...journalPayload });
    } else {
      onAdd({ id: Date.now(), ...journalPayload });
    }
    setShowModal(false);
  };

  const confirmDelete = () => {
      if (deletingId) {
          onDelete(deletingId);
          setDeletingId(null);
      }
  };

  // --- Inline Comment Logic ---
  const handleInlineCommentChange = (id: number, text: string) => {
      setCommentDrafts(prev => ({ ...prev, [id]: text }));
  };

  const selectCommentAuthor = (journalId: number, memberId: string) => {
      setCommentAuthors(prev => ({ ...prev, [journalId]: memberId }));
  };

  const submitInlineComment = (e: React.MouseEvent | React.KeyboardEvent, journal: Journal) => {
      e.stopPropagation();
      const text = commentDrafts[journal.id];
      if (!text || !text.trim()) return;

      const authorId = commentAuthors[journal.id] || members[0]?.id;
      const newComment: Comment = {
          id: Date.now().toString(),
          authorId,
          text: text.trim(),
          createdAt: new Date().toISOString()
      };

      const updatedComments = [...(journal.comments || []), newComment];
      onUpdate({ ...journal, comments: updatedComments });
      
      setCommentDrafts(prev => ({ ...prev, [journal.id]: '' }));
  };

  // --- Comment Actions ---
  const startEditComment = (journalId: number, comment: Comment) => {
      setDeletingComment(null);
      setEditingComment({ itemId: journalId, commentId: comment.id, text: comment.text });
  };

  const cancelEditComment = () => {
      setEditingComment(null);
  };

  const saveEditComment = (journal: Journal) => {
      if (!editingComment) return;
      const updatedComments = journal.comments?.map(c => 
          c.id === editingComment.commentId ? { ...c, text: editingComment.text } : c
      );
      onUpdate({ ...journal, comments: updatedComments });
      setEditingComment(null);
  };

  const promptDeleteComment = (journalId: number, commentId: string) => {
      setEditingComment(null);
      setDeletingComment({ itemId: journalId, commentId });
  };

  const confirmDeleteComment = (journal: Journal) => {
      if (!deletingComment) return;
      const updatedComments = journal.comments?.filter(c => c.id !== deletingComment.commentId);
      onUpdate({ ...journal, comments: updatedComments });
      setDeletingComment(null);
  };

  // Group journals by date (YYYY-MM-DD)
  const groupedJournals = journals.reduce((acc, journal) => {
      const dateKey = (journal.date || '').split('T')[0] || '未分類';
      (acc[dateKey] = acc[dateKey] || []).push(journal);
      return acc;
  }, {} as Record<string, Journal[]>);

  const sortedDates = Object.keys(groupedJournals).sort((a, b) => b.localeCompare(a));

  return (
    <div className="w-full lg:p-0 animate-scale-in">
      {/* Lightbox for viewing photos */}
      {lightboxImages && (
        <Lightbox
          images={lightboxImages}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxImages(null)}
        />
      )}

      <div className="sticky top-0 bg-beige/95 backdrop-blur-md z-20 px-4 py-3 border-b border-beige-dark border-dashed flex justify-between items-center shadow-sm">
        <div>
            <h2 className="text-xl font-black text-cocoa">旅行日誌</h2>
            <p className="text-[10px] text-gray-400 font-bold">紀錄旅途中的每一個精彩瞬間與照片回憶</p>
        </div>
        <button onClick={openAdd} className="text-xs bg-sage text-white px-4 py-2 rounded-full shadow-hard-sm-sage active:shadow-none active:translate-y-[3px] transition-all hover:bg-sage-dark font-black border-2 border-white flex items-center gap-1.5">
          <PenTool size={14} /> 寫日誌
        </button>
      </div>

      <div className="p-4 space-y-10 min-h-[50vh] pb-32">
        {!journals.length && (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-white rounded-[2.5rem] border-4 border-dashed border-beige-dark">
                <div className="w-24 h-24 bg-sage-light rounded-full flex items-center justify-center mb-4">
                    <Feather size={48} className="text-sage/50" />
                </div>
                <p className="font-bold text-lg">還沒有寫下任何回憶...</p>
                <p className="text-xs text-gray-400 mt-1">點擊上方「寫日誌」記錄旅程與上傳照片</p>
            </div>
        )}

        {sortedDates.map(date => (
            <div key={date}>
                <div className="flex items-center gap-3 mb-5">
                    <span className="px-4 py-1.5 rounded-full bg-blue-50 text-blue-500 font-black text-sm border-2 border-blue-100 shadow-sm tracking-wider">{date}</span>
                    <div className="h-0.5 flex-1 bg-beige-dark border-t-2 border-dashed border-beige-dark"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {groupedJournals[date].map(journal => {
                        const journalTime = journal.date && journal.date.includes('T') ? journal.date.split('T')[1] : '';
                        
                        const currentDraft = commentDrafts[journal.id] || '';
                        const currentAuthorId = commentAuthors[journal.id] || members[0]?.id;
                        const currentAuthor = members.find(m => m.id === currentAuthorId);
                        const journalAuthorMember = members.find(mem => mem.name === journal.author);
                        const photos = journal.photos || [];
                        
                        return (
                        <div key={journal.id} className="bg-white rounded-[2rem] p-5 shadow-hard-sm border-2 border-beige-dark flex flex-col relative group hover:-translate-y-1 transition-transform duration-300">
                            <div className="flex justify-between items-center mb-3">
                                <div className="flex items-center gap-2">
                                     <div className="w-8 h-8 rounded-full overflow-hidden shadow-sm">
                                         <MemberAvatar 
                                           avatar={journalAuthorMember?.avatar} 
                                           name={journal.author} 
                                           id={journalAuthorMember?.id} 
                                           size="sm"
                                           className="w-full h-full"
                                         />
                                     </div>
                                     <div className="flex flex-col">
                                         <span className="text-sm font-black text-cocoa">{journal.author}</span>
                                         {journalTime && <span className="text-[10px] text-gray-400 font-bold">{journalTime}</span>}
                                     </div>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={(e) => { e.stopPropagation(); openEdit(journal); }} className="text-gray-300 hover:text-sage p-2 bg-[#F9FAFB] rounded-full hover:bg-sage-light transition-colors" title="編輯日誌"><PenTool size={14}/></button>
                                    <button onClick={(e) => { e.stopPropagation(); setDeletingId(journal.id); }} className="text-gray-300 hover:text-red-400 p-2 bg-[#F9FAFB] rounded-full hover:bg-red-50 transition-colors" title="刪除日誌"><Trash2 size={14}/></button>
                                </div>
                            </div>

                            {/* Journal Text Content */}
                            {journal.content && (
                              <p className="text-cocoa text-base leading-7 whitespace-pre-line font-medium mb-3">
                                  {journal.content}
                              </p>
                            )}

                            {/* Photo Gallery Grid */}
                            {photos.length > 0 && (
                              <div className="mb-4">
                                {photos.length === 1 ? (
                                  <div 
                                    onClick={() => { setLightboxImages(photos); setLightboxIndex(0); }}
                                    className="relative rounded-2xl overflow-hidden cursor-pointer group/single border border-beige-dark shadow-sm aspect-video max-h-56 bg-beige/20"
                                  >
                                    <img 
                                      src={photos[0]} 
                                      alt="日誌照片" 
                                      referrerPolicy="no-referrer"
                                      className="w-full h-full object-cover group-hover/single:scale-105 transition-transform duration-300" 
                                    />
                                  </div>
                                ) : photos.length === 2 ? (
                                  <div className="grid grid-cols-2 gap-2">
                                    {photos.map((p, idx) => (
                                      <div 
                                        key={idx}
                                        onClick={() => { setLightboxImages(photos); setLightboxIndex(idx); }}
                                        className="relative aspect-square rounded-2xl overflow-hidden cursor-pointer group/photo border border-beige-dark shadow-sm bg-beige/20"
                                      >
                                        <img 
                                          src={p} 
                                          alt={`照片 ${idx + 1}`} 
                                          referrerPolicy="no-referrer"
                                          className="w-full h-full object-cover group-hover/photo:scale-105 transition-transform duration-300" 
                                        />
                                      </div>
                                    ))}
                                  </div>
                                ) : photos.length === 3 ? (
                                  <div className="grid grid-cols-3 gap-2">
                                    {photos.map((p, idx) => (
                                      <div 
                                        key={idx}
                                        onClick={() => { setLightboxImages(photos); setLightboxIndex(idx); }}
                                        className="relative aspect-square rounded-2xl overflow-hidden cursor-pointer group/photo border border-beige-dark shadow-sm bg-beige/20"
                                      >
                                        <img 
                                          src={p} 
                                          alt={`照片 ${idx + 1}`} 
                                          referrerPolicy="no-referrer"
                                          className="w-full h-full object-cover group-hover/photo:scale-105 transition-transform duration-300" 
                                        />
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-3 gap-2">
                                    {photos.slice(0, 3).map((p, idx) => (
                                      <div 
                                        key={idx}
                                        onClick={() => { setLightboxImages(photos); setLightboxIndex(idx); }}
                                        className="relative aspect-square rounded-2xl overflow-hidden cursor-pointer group/photo border border-beige-dark shadow-sm bg-beige/20"
                                      >
                                        <img 
                                          src={p} 
                                          alt={`照片 ${idx + 1}`} 
                                          referrerPolicy="no-referrer"
                                          className="w-full h-full object-cover group-hover/photo:scale-105 transition-transform duration-300" 
                                        />
                                        {idx === 2 && photos.length > 3 && (
                                          <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center text-white font-black text-sm">
                                            +{photos.length - 3}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Comments Section */}
                            <div className="pt-3 border-t-2 border-dashed border-gray-100 mt-auto">
                                {journal.comments && journal.comments.length > 0 && (
                                    <div className="space-y-2 mb-3">
                                        {journal.comments.map(c => {
                                            const author = members.find(m => m.id === c.authorId);
                                            const isEditing = editingComment?.commentId === c.id && editingComment?.itemId === journal.id;
                                            const isDeleting = deletingComment?.commentId === c.id && deletingComment?.itemId === journal.id;

                                            return (
                                                <div key={c.id} className="flex gap-2 items-start group/comment">
                                                    <div className="w-6 h-6 rounded-full flex-shrink-0 overflow-hidden">
                                                        <MemberAvatar 
                                                          avatar={author?.avatar} 
                                                          name={author?.name || '成員'} 
                                                          id={author?.id} 
                                                          size="xs"
                                                          className="w-full h-full"
                                                        />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        {isEditing ? (
                                                            <div className="flex flex-col gap-2">
                                                                <textarea 
                                                                    value={editingComment.text} 
                                                                    onChange={(e) => setEditingComment({ ...editingComment, text: e.target.value })}
                                                                    className="w-full bg-white border-2 border-sage rounded-lg px-2 py-1.5 text-xs font-bold text-cocoa outline-none resize-none h-16"
                                                                    autoFocus
                                                                />
                                                                <div className="flex gap-2 justify-end">
                                                                    <button onClick={() => cancelEditComment()} className="px-2 py-1 rounded-lg bg-gray-100 text-gray-400 hover:bg-gray-200 text-[10px] font-bold">取消</button>
                                                                    <button onClick={() => saveEditComment(journal)} className="px-2 py-1 rounded-lg bg-sage text-white hover:bg-sage-dark text-[10px] font-bold">儲存</button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <div className="bg-gray-50 rounded-lg rounded-tl-none px-3 py-2 inline-block border border-beige-dark/50 max-w-full">
                                                                    <p className="text-xs font-bold text-cocoa leading-snug whitespace-pre-wrap break-words">{c.text}</p>
                                                                </div>
                                                                <div className="flex items-center justify-between mt-0.5 ml-1 pr-1">
                                                                    <div className="text-[9px] font-bold text-gray-300">
                                                                        {author?.name} • {new Date(c.createdAt).toLocaleDateString([], {month:'numeric', day:'numeric'})}
                                                                    </div>
                                                                    
                                                                    {/* Action Buttons */}
                                                                    <div className="flex items-center gap-1.5">
                                                                        {isDeleting ? (
                                                                            <div className="flex items-center gap-1 animate-scale-in">
                                                                                <button onClick={() => confirmDeleteComment(journal)} className="bg-red-500 text-white text-[9px] px-2 py-0.5 rounded-full font-bold hover:bg-red-600 shadow-sm">確定?</button>
                                                                                <button onClick={() => setDeletingComment(null)} className="text-gray-300 hover:text-gray-500"><X size={12}/></button>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="flex gap-1.5 opacity-100 lg:opacity-0 lg:group-hover/comment:opacity-100 transition-opacity">
                                                                                <button onClick={() => startEditComment(journal.id, c)} className="text-gray-300 hover:text-sage transition-colors"><PenTool size={10}/></button>
                                                                                <button onClick={() => promptDeleteComment(journal.id, c.id)} className="text-gray-300 hover:text-red-400 transition-colors"><Trash2 size={10}/></button>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Member Selector (Scrollable) */}
                                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-2 items-center" onMouseDown={e => e.stopPropagation()}>
                                    {members.map(m => {
                                        const isSelected = (commentAuthors[journal.id] || members[0]?.id) === m.id;
                                        return (
                                            <button
                                                key={m.id}
                                                onClick={(e) => { e.stopPropagation(); selectCommentAuthor(journal.id, m.id); }}
                                                className={`flex-shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-full border-2 transition-all ${isSelected ? 'bg-sage text-white border-sage shadow-sm' : 'bg-white text-gray-400 border-beige-dark hover:bg-gray-50'}`}
                                            >
                                                <MemberAvatar 
                                                  avatar={m.avatar} 
                                                  name={m.name} 
                                                  id={m.id} 
                                                  size="xs" 
                                                  showBorder={false}
                                                  className="w-4 h-4"
                                                />
                                                <span className="text-xs font-bold">{m.name}</span>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Input Field */}
                                <div className="relative">
                                    <input 
                                        value={currentDraft}
                                        onChange={e => handleInlineCommentChange(journal.id, e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && submitInlineComment(e, journal)}
                                        placeholder={`用 ${currentAuthor?.name} 的身份留言...`}
                                        className="w-full bg-gray-50 text-cocoa rounded-xl px-3 py-2 outline-none border border-beige-dark/50 font-bold text-xs placeholder-gray-300 focus:border-sage focus:bg-white transition-colors pr-9"
                                        onClick={e => e.stopPropagation()}
                                    />
                                    {currentDraft.trim() && (
                                        <button 
                                            onClick={(e) => submitInlineComment(e, journal)} 
                                            className="absolute right-1.5 top-1/2 -translate-y-1/2 text-sage hover:text-sage-dark p-1"
                                        >
                                            <Send size={14}/>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )})}
                </div>
            </div>
        ))}
      </div>

      {/* Add / Edit Journal Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-cocoa/60 z-[150] flex flex-col items-center justify-end sm:justify-center sm:p-4 backdrop-blur-sm animate-fade-in" onClick={() => setShowModal(false)}>
            <div className="bg-[#FAF8F2] w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-lg sm:rounded-[2.5rem] rounded-none p-5 sm:p-6 shadow-2xl border-0 sm:border-4 sm:border-beige-dark flex flex-col justify-between overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center pb-3 border-b-2 border-beige-dark flex-shrink-0">
                    <h3 className="font-black text-xl text-cocoa flex items-center gap-2">
                      <PenTool size={20} className="text-sage" />
                      {editingJournal ? '編輯旅行日誌' : '寫新日誌'}
                    </h3>
                    <button onClick={() => setShowModal(false)} className="p-2 bg-white rounded-full text-gray-400 hover:text-red-400 border border-beige-dark shadow-sm transition-colors">
                        <X size={18} />
                    </button>
                </div>
                
                <div className="overflow-y-auto custom-scroll flex-1 py-4 space-y-4">
                    <DateTimePickerField
                        label="記錄日期與時間"
                        value={form.date}
                        onChange={val => setForm({...form, date: val})}
                        themeColor="sage"
                    />

                    {/* Author Member Selection */}
                    <div className="bg-white p-3.5 rounded-2xl border-2 border-beige-dark shadow-sm">
                        <label className="text-[10px] text-gray-400 block mb-2 font-bold uppercase tracking-wider">記錄人</label>
                        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                            {members.map(m => (
                                <button
                                    type="button"
                                    key={m.id}
                                    onClick={() => setForm({...form, author: m.name})}
                                    className={`px-3 py-1.5 rounded-xl text-xs border-2 whitespace-nowrap transition-all flex items-center gap-1.5 font-bold ${form.author === m.name ? 'bg-sage text-white border-sage-dark shadow-sm' : 'border-beige-dark text-gray-400 bg-beige/40'}`}
                                >
                                    <MemberAvatar 
                                      avatar={m.avatar} 
                                      name={m.name} 
                                      id={m.id} 
                                      size="xs" 
                                      showBorder={false}
                                      className="w-4 h-4"
                                    />
                                    {m.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Photos Upload Section */}
                    <div className="bg-white p-3.5 rounded-2xl border-2 border-beige-dark shadow-sm space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1">
                          <ImageIcon size={13} className="text-sage" />
                          照片記錄 ({formImages.length}/30 張)
                        </label>
                        <span className="text-[9px] text-gray-400 font-medium">支援多張上傳</span>
                      </div>

                      {uploadError && (
                        <div className="flex items-center gap-1.5 p-2 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-bold animate-fade-in">
                          <AlertCircle size={14} className="flex-shrink-0" />
                          <span>{uploadError}</span>
                        </div>
                      )}

                      {/* Image Thumbnails Grid (scrollable if many photos) */}
                      {formImages.length > 0 && (
                        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-56 overflow-y-auto custom-scroll p-1 bg-beige/30 rounded-xl border border-beige-dark/50">
                          {formImages.map(img => (
                            <div
                              key={img.id}
                              className="relative aspect-square rounded-xl overflow-hidden border-2 border-beige-dark bg-beige/20 group"
                            >
                              <img
                                src={img.url}
                                alt="預覽照片"
                                referrerPolicy="no-referrer"
                                className={`w-full h-full object-cover transition-opacity ${img.isReady ? 'opacity-100' : 'opacity-50'}`}
                              />
                              {!img.isReady && (
                                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center p-1">
                                  <Loader2 size={16} className="text-white animate-spin mb-1" />
                                  <div className="w-full bg-white/30 rounded-full h-1 overflow-hidden">
                                    <div
                                      className="bg-sage h-full transition-all duration-200"
                                      style={{ width: `${img.progress}%` }}
                                    />
                                  </div>
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={() => handleRemoveFormImage(img.id)}
                                className="absolute top-1 right-1 w-5 h-5 bg-cocoa/80 text-white rounded-full flex items-center justify-center opacity-80 hover:opacity-100 shadow-sm"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Upload Button */}
                      {formImages.length < 30 && (
                        <div>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageUpload}
                            className="hidden"
                            id="journal-file-input"
                          />
                          <label
                            htmlFor="journal-file-input"
                            className="w-full py-3.5 border-2 border-dashed border-sage/50 rounded-xl bg-sage-light/30 hover:bg-sage-light/60 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer text-sage font-black text-xs shadow-sm"
                          >
                            <Camera size={16} />
                            點此選擇照片 (可一次選多張)
                          </label>
                        </div>
                      )}
                    </div>

                    {/* Content Textarea */}
                    <div className="bg-white p-3.5 rounded-2xl border-2 border-beige-dark shadow-sm">
                        <label className="text-[10px] text-gray-400 block mb-1 font-bold uppercase tracking-wider">心得 / 趣事筆記</label>
                        <textarea 
                          value={form.content} 
                          onChange={e => setForm({...form, content: e.target.value})} 
                          className="w-full bg-beige/30 text-cocoa rounded-xl p-3 text-sm outline-none h-36 resize-none border border-beige-dark font-medium leading-relaxed placeholder-gray-300 focus:bg-white focus:border-sage transition-colors" 
                          placeholder="寫下今天發生的精彩趣事、美食感受或行程心情..."
                        ></textarea>
                    </div>
                </div>

                <div className="flex gap-3 pt-3 border-t-2 border-beige-dark mt-auto flex-shrink-0">
                    <button 
                      type="button"
                      onClick={() => setShowModal(false)} 
                      className="flex-1 py-3.5 rounded-2xl bg-white text-gray-400 font-bold hover:bg-gray-50 border-2 border-beige-dark transition-colors"
                    >
                      取消
                    </button>
                    <button 
                      type="button"
                      onClick={handleSave} 
                      disabled={!form.content && formImages.length === 0}
                      className="flex-1 py-3.5 rounded-2xl bg-sage text-white font-bold shadow-hard-sage border-2 border-sage-dark active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      <Check size={16} />
                      保存日誌
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 bg-cocoa/60 backdrop-blur-sm z-[200] flex flex-col items-center justify-end sm:justify-center sm:p-4 animate-fade-in" onClick={() => setDeletingId(null)}>
            <div className="bg-[#FAF8F2] w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-sm sm:rounded-[2.5rem] rounded-none p-6 shadow-2xl border-0 sm:border-4 sm:border-beige-dark flex flex-col justify-between overflow-hidden" onClick={e => e.stopPropagation()}>
                 <div className="flex justify-between items-center pb-3 border-b-2 border-beige-dark flex-shrink-0 sm:hidden">
                     <h3 className="font-black text-lg text-cocoa">刪除確認</h3>
                     <button onClick={() => setDeletingId(null)} className="p-2 bg-white rounded-full text-gray-400 hover:text-red-400 border border-beige-dark shadow-sm transition-colors">
                         <X size={18} />
                     </button>
                 </div>
                 <div className="my-auto py-6 text-center">
                     <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500 border-2 border-red-200 shadow-sm">
                         <Trash2 size={28} />
                     </div>
                     <h3 className="text-xl font-black text-cocoa mb-2 text-center">刪除日誌?</h3>
                     <p className="text-gray-400 font-bold text-center text-sm leading-relaxed">確定要刪除這篇日誌嗎？日誌與照片將會一併移除。</p>
                 </div>
                 <div className="flex gap-3 pt-3 border-t-2 border-beige-dark mt-auto flex-shrink-0">
                    <button onClick={() => setDeletingId(null)} className="flex-1 py-4 rounded-2xl font-bold text-gray-400 bg-white border-2 border-beige-dark hover:bg-gray-50 transition-colors">取消</button>
                    <button onClick={confirmDelete} className="flex-1 py-4 rounded-2xl font-bold text-white bg-red-400 hover:bg-red-500 shadow-hard-sm border-2 border-red-500 active:translate-y-1 active:shadow-none transition-all">刪除</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
