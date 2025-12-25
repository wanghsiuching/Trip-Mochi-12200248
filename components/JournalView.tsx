
import React, { useState } from 'react';
import { PenTool, Trash2, X, Feather, Send, Check, AlertCircle } from 'lucide-react';
import { Journal, Member, Comment } from '../types';

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
      setShowModal(true);
  };

  const openEdit = (journal: Journal) => {
      setEditingJournal(journal);
      let formattedDate = journal.date;
      if (formattedDate.length === 10) { 
          formattedDate += 'T12:00';
      }
      setForm({ ...journal, date: formattedDate });
      setShowModal(true);
  };

  const handleSave = () => {
    if (!form.content) return;
    if (editingJournal) {
        onUpdate({ ...editingJournal, ...form });
    } else {
        onAdd({ id: Date.now(), ...form });
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
      setDeletingComment(null); // Clear delete state if any
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
      setEditingComment(null); // Clear edit state if any
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
      const dateKey = journal.date.split('T')[0];
      (acc[dateKey] = acc[dateKey] || []).push(journal);
      return acc;
  }, {} as Record<string, Journal[]>);

  const sortedDates = Object.keys(groupedJournals).sort((a, b) => b.localeCompare(a));

  return (
    <div className="w-full lg:p-0 animate-scale-in">
      <div className="sticky top-0 bg-beige/95 backdrop-blur-md z-20 px-4 py-3 border-b border-beige-dark border-dashed flex justify-between items-center shadow-sm">
        <div>
            <h2 className="text-xl font-black text-cocoa">旅行日誌</h2>
            <p className="text-[10px] text-gray-400 font-bold">紀錄旅途中的每一個精彩瞬間</p>
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
                        const journalTime = journal.date.includes('T') ? journal.date.split('T')[1] : '';
                        
                        const currentDraft = commentDrafts[journal.id] || '';
                        const currentAuthorId = commentAuthors[journal.id] || members[0]?.id;
                        const currentAuthor = members.find(m => m.id === currentAuthorId);
                        
                        return (
                        <div key={journal.id} className="bg-white rounded-[2rem] p-5 shadow-hard-sm border-2 border-beige-dark flex flex-col relative group hover:-translate-y-1 transition-transform duration-300">
                            <div className="flex justify-between items-center mb-3">
                                <div className="flex items-center gap-2">
                                     <div className="w-8 h-8 rounded-full bg-beige overflow-hidden border-2 border-white flex items-center justify-center text-cocoa shadow-sm">
                                         {(() => {
                                            const m = members.find(mem => mem.name === journal.author);
                                            return m?.avatar ? <img src={m.avatar} className="w-full h-full object-cover" loading="lazy"/> : <span className="text-xs font-black">{journal.author.charAt(0)}</span>;
                                         })()}
                                     </div>
                                     <div className="flex flex-col">
                                         <span className="text-sm font-black text-cocoa">{journal.author}</span>
                                         {journalTime && <span className="text-[10px] text-gray-400 font-bold">{journalTime}</span>}
                                     </div>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={(e) => { e.stopPropagation(); openEdit(journal); }} className="text-gray-300 hover:text-sage p-2 bg-[#F9FAFB] rounded-full hover:bg-sage-light transition-colors"><PenTool size={14}/></button>
                                    <button onClick={(e) => { e.stopPropagation(); setDeletingId(journal.id); }} className="text-gray-300 hover:text-red-400 p-2 bg-[#F9FAFB] rounded-full hover:bg-red-50 transition-colors"><Trash2 size={14}/></button>
                                </div>
                            </div>

                            <p className="text-cocoa text-base leading-7 whitespace-pre-line font-medium mb-4">
                                {journal.content}
                            </p>

                            <div className="pt-3 border-t-2 border-dashed border-gray-100 mt-auto">
                                {journal.comments && journal.comments.length > 0 && (
                                    <div className="space-y-2 mb-3">
                                        {journal.comments.map(c => {
                                            const author = members.find(m => m.id === c.authorId);
                                            const isEditing = editingComment?.commentId === c.id && editingComment?.itemId === journal.id;
                                            const isDeleting = deletingComment?.commentId === c.id && deletingComment?.itemId === journal.id;

                                            return (
                                                <div key={c.id} className="flex gap-2 items-start group/comment">
                                                    <div className="w-6 h-6 rounded-full bg-beige border border-beige-dark flex-shrink-0 overflow-hidden flex items-center justify-center">
                                                        {author?.avatar ? <img src={author.avatar} className="w-full h-full object-cover"/> : <span className="text-[9px] font-black text-gray-400">{author?.name?.[0]}</span>}
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
                                                <div className="w-4 h-4 rounded-full overflow-hidden border border-white/50 flex items-center justify-center bg-beige text-[8px] font-black text-cocoa">
                                                    {m.avatar ? <img src={m.avatar} className="w-full h-full object-cover" loading="lazy"/> : m.name[0]}
                                                </div>
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

      {showModal && (
        <div className="fixed inset-0 bg-cocoa/50 z-[150] flex items-center justify-center px-4 backdrop-blur-sm">
            <div className="bg-beige w-full max-w-md rounded-[2rem] p-6 shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto custom-scroll border-4 border-beige-dark">
                <h3 className="font-black text-lg mb-4 text-cocoa text-center bg-white px-4 py-1 rounded-full w-max mx-auto border border-beige-dark">{editingJournal ? '編輯日誌' : '寫新日誌'}</h3>
                <div className="space-y-4">
                    <div>
                        <label className="text-[10px] text-gray-400 block mb-1 font-bold">日期與時間</label>
                        <input value={form.date} onChange={e => setForm({...form, date: e.target.value})} type="datetime-local" className="w-full bg-white text-cocoa rounded-xl px-3 py-2 text-sm outline-none border-2 border-beige-dark font-bold" style={{ colorScheme: 'light' }}/>
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-400 block mb-1 font-bold">記錄人</label>
                        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                            {members.map(m => (
                                <button
                                    key={m.id}
                                    onClick={() => setForm({...form, author: m.name})}
                                    className={`px-3 py-1.5 rounded-full text-xs border-2 whitespace-nowrap transition-all flex items-center gap-1.5 ${form.author === m.name ? 'bg-sage text-white border-sage font-black shadow-md' : 'border-beige-dark text-gray-400 bg-white font-bold'}`}
                                >
                                    {m.avatar && <div className="w-4 h-4 rounded-full overflow-hidden border border-white/50"><img src={m.avatar} className="w-full h-full object-cover" loading="lazy"/></div>}
                                    {m.name}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-400 block mb-1 font-bold">內容</label>
                        <textarea value={form.content} onChange={e => setForm({...form, content: e.target.value})} className="w-full bg-white text-cocoa rounded-xl p-4 text-sm outline-none h-40 resize-none border-2 border-beige-dark font-medium leading-relaxed placeholder-gray-300" placeholder="寫下今天發生的趣事..."></textarea>
                    </div>
                </div>
                <div className="flex gap-3 mt-6">
                    <button onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-2xl bg-white text-gray-400 font-black hover:bg-gray-50 border-2 border-beige-dark">取消</button>
                    <button onClick={handleSave} className="flex-1 py-3 rounded-2xl bg-sage text-white font-black shadow-hard-sage active:shadow-none active:translate-y-[4px] transition-all border-2 border-sage-dark disabled:opacity-50">
                        保存
                    </button>
                </div>
            </div>
        </div>
      )}

      {deletingId && (
        <div className="fixed inset-0 bg-cocoa/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={() => setDeletingId(null)}>
            <div className="bg-white p-6 rounded-3xl w-full max-w-sm shadow-2xl border-2 border-beige-dark animate-scale-in" onClick={e => e.stopPropagation()}>
                 <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500 border-2 border-red-200">
                    <Trash2 size={24} />
                </div>
                <h3 className="text-xl font-black text-cocoa mb-2 text-center">刪除日誌?</h3>
                <p className="text-gray-400 font-bold text-center text-sm mb-6">確定要刪除這篇日誌嗎？此動作無法復原。</p>
                <div className="flex gap-3">
                    <button onClick={() => setDeletingId(null)} className="flex-1 py-3 rounded-xl font-bold text-gray-400 bg-gray-100 hover:bg-gray-200 transition-colors">取消</button>
                    <button onClick={confirmDelete} className="flex-1 py-3 rounded-xl font-bold text-white bg-red-400 hover:bg-red-50 shadow-hard-sm border-2 border-red-500 active:translate-y-1 active:shadow-none transition-all">刪除</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
