
import React, { useState, useEffect } from 'react';
import { ClipboardList, Luggage, Heart, ShoppingCart, PenTool, Trash2, Link, X, Check, Plus, Edit3, MessageCircle, Send } from 'lucide-react';
import { TodoItem, Member, Comment } from '../types';

interface PlanningViewProps {
  lists: { todo: TodoItem[]; packing: TodoItem[]; wish: TodoItem[]; shopping: TodoItem[] };
  members: Member[];
  onAdd: (type: 'todo' | 'packing' | 'wish' | 'shopping', text: string, assignee: string | string[], image?: string, note?: string, url?: string) => void;
  onToggle: (type: 'todo' | 'packing' | 'wish' | 'shopping', id: number, memberName?: string) => void;
  onUpdate: (type: 'todo' | 'packing' | 'wish' | 'shopping', id: number, updates: Partial<TodoItem>) => void;
  onDelete: (type: 'todo' | 'packing' | 'wish' | 'shopping', id: number) => void;
}

export const PlanningView: React.FC<PlanningViewProps> = ({ lists, members, onAdd, onToggle, onUpdate, onDelete }) => {
  const [currentList, setCurrentList] = useState<'todo' | 'packing' | 'wish' | 'shopping'>('todo');
  const [newItem, setNewItem] = useState('');
  
  const [newNote, setNewNote] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [showExtraInput, setShowExtraInput] = useState(false);
  
  const [filterSelection, setFilterSelection] = useState<string[]>(['全體']);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingForm, setEditingForm] = useState<{text: string, note: string, url: string}>({text: '', note: '', url: ''});

  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Inline Comment State
  const [commentDrafts, setCommentDrafts] = useState<Record<number, string>>({});
  const [commentAuthors, setCommentAuthors] = useState<Record<number, string>>({});
  
  // Comment Edit/Delete State
  const [editingComment, setEditingComment] = useState<{ itemId: number, commentId: string, text: string } | null>(null);
  const [deletingComment, setDeletingComment] = useState<{ itemId: number, commentId: string } | null>(null);

  useEffect(() => {
      setFilterSelection(['全體']);
      setNewItem('');
      setNewNote('');
      setNewUrl('');
      setShowExtraInput(false);
      setEditingComment(null); 
      setDeletingComment(null);
  }, [currentList]);

  const toggleMemberFilter = (name: string) => {
      if (name === '全體') {
          setFilterSelection(['全體']);
          return;
      }

      if (currentList === 'todo') {
          setFilterSelection(prev => {
              let newSel = prev.includes('全體') ? [] : [...prev];
              if (newSel.includes(name)) {
                  newSel = newSel.filter(n => n !== name);
              } else {
                  newSel.push(name);
              }
              return newSel.length === 0 ? ['全體'] : newSel;
          });
      } else {
          setFilterSelection(prev => {
              if (prev.includes(name)) {
                  return ['全體'];
              }
              return [name];
          });
      }
  };

  const handleAdd = () => {
    if (!newItem.trim()) return;
    
    let finalAssignee: string | string[];
    if (filterSelection.includes('全體')) {
        finalAssignee = '全體';
    } else if (filterSelection.length === 1) {
        finalAssignee = filterSelection[0];
    } else {
        finalAssignee = filterSelection;
    }

    onAdd(currentList, newItem, finalAssignee, undefined, newNote, newUrl);
    setNewItem('');
    setNewNote('');
    setNewUrl('');
    setShowExtraInput(false);
  };

  // --- CRUD Handlers ---
  const startEditing = (e: React.MouseEvent, item: TodoItem) => {
      e.preventDefault(); e.stopPropagation();
      setDeletingId(null);
      setEditingId(item.id);
      setEditingForm({ text: item.text, note: item.note || '', url: item.url || '' });
  };

  const saveEditing = () => {
      if (editingId && editingForm.text.trim()) {
          onUpdate(currentList, editingId, { 
              text: editingForm.text,
              note: editingForm.note,
              url: editingForm.url
          });
          setEditingId(null);
      }
  };

  const cancelEditing = (e?: React.MouseEvent) => {
      e?.preventDefault(); e?.stopPropagation();
      setEditingId(null);
  };

  const promptDelete = (e: React.MouseEvent, id: number) => {
      e.preventDefault(); e.stopPropagation();
      setDeletingId(id);
      setEditingId(null);
  };

  const confirmDelete = (e: React.MouseEvent, id: number) => {
      e.preventDefault(); e.stopPropagation();
      onDelete(currentList, id);
      setDeletingId(null);
  };

  // --- Inline Comment Logic ---
  const handleInlineCommentChange = (id: number, text: string) => {
      setCommentDrafts(prev => ({ ...prev, [id]: text }));
  };

  const selectCommentAuthor = (itemId: number, memberId: string) => {
      setCommentAuthors(prev => ({ ...prev, [itemId]: memberId }));
  };

  const submitInlineComment = (e: React.MouseEvent | React.KeyboardEvent, item: TodoItem) => {
      e.stopPropagation();
      const text = commentDrafts[item.id];
      if (!text || !text.trim()) return;

      const authorId = commentAuthors[item.id] || members[0]?.id;
      const newComment: Comment = {
          id: Date.now().toString(),
          authorId,
          text: text.trim(),
          createdAt: new Date().toISOString()
      };

      const updatedComments = [...(item.comments || []), newComment];
      onUpdate(currentList, item.id, { comments: updatedComments });
      
      setCommentDrafts(prev => ({ ...prev, [item.id]: '' }));
  };

  // --- Comment Actions ---
  const startEditComment = (itemId: number, comment: Comment) => {
      setDeletingComment(null);
      setEditingComment({ itemId, commentId: comment.id, text: comment.text });
  };

  const cancelEditComment = () => {
      setEditingComment(null);
  };

  const saveEditComment = (item: TodoItem) => {
      if (!editingComment) return;
      const updatedComments = item.comments?.map(c => 
          c.id === editingComment.commentId ? { ...c, text: editingComment.text } : c
      );
      onUpdate(currentList, item.id, { comments: updatedComments });
      setEditingComment(null);
  };

  const promptDeleteComment = (itemId: number, commentId: string) => {
      setEditingComment(null);
      setDeletingComment({ itemId, commentId });
  };

  const confirmDeleteComment = (item: TodoItem) => {
      if (!deletingComment) return;
      const updatedComments = item.comments?.filter(c => c.id !== deletingComment.commentId);
      onUpdate(currentList, item.id, { comments: updatedComments });
      setDeletingComment(null);
  };

  const activeListItems = (lists[currentList] || []).filter(item => {
      if (filterSelection.includes('全體')) return true;
      if (item.assignee === '全體') return true;
      const itemAssignees = Array.isArray(item.assignee) ? item.assignee : [item.assignee];
      return itemAssignees.some(person => filterSelection.includes(person));
  });

  const getPlaceholderText = () => {
      if (filterSelection.includes('全體')) {
          return `新增${currentList === 'todo' ? '待辦' : currentList === 'packing' ? '行李' : currentList === 'wish' ? '願望' : '採購'} (全體)...`;
      }
      const names = filterSelection.join(', ');
      return `新增給 ${names}...`;
  };

  return (
    <div className="w-full lg:p-0 animate-scale-in">
        <div className="sticky top-0 z-30 bg-beige/95 backdrop-blur-md px-4 py-3 border-b border-beige-dark/50 mb-5 lg:static lg:bg-transparent lg:p-0 lg:border-none lg:mb-6">
            <div className="bg-white p-1.5 rounded-full flex text-sm font-bold text-gray-400 border-2 border-beige-dark shadow-sm w-full max-w-lg mx-auto lg:mx-0">
                {[
                    { id: 'todo', label: '待辦', icon: ClipboardList },
                    { id: 'packing', label: '行李', icon: Luggage },
                    { id: 'wish', label: '想去', icon: Heart },
                    { id: 'shopping', label: '採購', icon: ShoppingCart }
                ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button 
                            key={tab.id}
                            onClick={() => { 
                                setCurrentList(tab.id as any); 
                                setDeletingId(null); setEditingId(null);
                            }} 
                            className={`flex-1 py-2.5 rounded-full transition-all flex items-center justify-center gap-1.5 
                                ${currentList === tab.id 
                                ? 'bg-sage text-white shadow-md' 
                                : 'hover:bg-sage-light text-gray-400'}`}
                        >
                            <Icon size={14} />
                            <span className="text-xs sm:text-sm">{tab.label}</span>
                        </button>
                    )
                })}
            </div>
        </div>

        <div className="px-4 pb-4 lg:p-0">
            <div className="mb-4">
                <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-2 items-center">
                    <button
                        onClick={() => toggleMemberFilter('全體')}
                        className={`flex items-center justify-center px-4 py-2 rounded-full border-2 transition-all active:scale-95 whitespace-nowrap font-black text-sm ${filterSelection.includes('全體') ? 'bg-cocoa text-white border-cocoa shadow-md scale-105' : 'bg-white text-gray-400 border-beige-dark'}`}
                    >
                        全部
                    </button>

                    {members.map(m => {
                        const isSelected = filterSelection.includes(m.name);
                        return (
                            <button
                                key={m.id}
                                onClick={() => toggleMemberFilter(m.name)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-full border-2 transition-all active:scale-95 whitespace-nowrap ${isSelected ? 'bg-sage text-white border-sage shadow-md scale-105' : 'bg-white text-gray-400 border-beige-dark'}`}
                            >
                                <div className="w-5 h-5 rounded-full overflow-hidden border border-white/50 flex items-center justify-center bg-beige text-[10px] font-black text-cocoa">
                                    {m.avatar ? <img src={m.avatar} className="w-full h-full object-cover" loading="lazy"/> : m.name[0]}
                                </div>
                                <span className="text-sm font-bold">{m.name}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="mb-6 bg-white p-4 rounded-[2rem] shadow-hard-sm border-2 border-beige-dark space-y-3 flex-shrink-0">
                <div className="flex gap-2 items-start">
                    <div className="flex-1 min-w-0 space-y-2">
                        <textarea
                            value={newItem} 
                            onChange={e => setNewItem(e.target.value)} 
                            placeholder={getPlaceholderText()} 
                            className="w-full bg-beige/50 text-cocoa rounded-xl px-4 py-3.5 text-base outline-none focus:border-sage border-2 border-beige-dark font-bold placeholder-gray-300 transition-colors resize-none h-[54px] leading-tight"
                        />
                        {showExtraInput && (
                            <div className="space-y-2 animate-scale-in">
                                <input 
                                    type="text" 
                                    value={newNote} 
                                    onChange={e => setNewNote(e.target.value)} 
                                    placeholder="備註 (選填)" 
                                    className="w-full bg-white text-cocoa rounded-xl px-4 py-2.5 text-sm outline-none border-2 border-beige-dark font-bold placeholder-gray-300" 
                                />
                                <div className="relative">
                                    <Link size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"/>
                                    <input 
                                        type="text" 
                                        value={newUrl} 
                                        onChange={e => setNewUrl(e.target.value)} 
                                        placeholder="相關連結 URL (選填)" 
                                        className="w-full bg-white text-cocoa rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none border-2 border-beige-dark font-bold placeholder-gray-300" 
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col gap-2">
                        <button 
                            onClick={() => setShowExtraInput(!showExtraInput)}
                            className={`w-14 h-[54px] flex-shrink-0 flex items-center justify-center rounded-xl border-2 shadow-sm active:scale-95 transition-all ${showExtraInput ? 'bg-cocoa text-white border-cocoa' : 'bg-white text-gray-400 border-beige-dark'}`}
                        >
                            <Edit3 size={20} />
                        </button>
                        <button onClick={handleAdd} className="w-14 h-[54px] flex-shrink-0 text-white bg-sage rounded-xl border-2 border-sage-dark shadow-hard-sage active:shadow-none active:translate-y-[3px] transition-all text-xl flex items-center justify-center">
                            <Plus size={24} strokeWidth={3} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="space-y-3 pb-20 lg:pb-0">
                {activeListItems.length === 0 && (
                    <div className="text-center py-10 text-gray-300 opacity-60 bg-white rounded-[2rem] border-2 border-dashed border-beige-dark">
                        <ClipboardList size={40} className="mx-auto mb-2" />
                        <p className="text-sm font-bold">這裡空空如也</p>
                    </div>
                )}
                
                {activeListItems.slice().reverse().map((item) => {
                    const isGroupTask = currentList === 'todo' && (item.assignee === '全體' || (Array.isArray(item.assignee) && item.assignee.length > 1));
                    
                    let targets: string[] = [];
                    if (currentList === 'todo') {
                        if (item.assignee === '全體') targets = members.map(m => m.name);
                        else if (Array.isArray(item.assignee)) targets = item.assignee;
                        else targets = [item.assignee as string];
                    } else {
                        targets = Array.isArray(item.assignee) ? item.assignee : [item.assignee as string];
                    }

                    const completedCount = (item.completedBy || []).filter(name => targets.includes(name)).length;
                    const totalTargets = targets.length;
                    const isViewAllMode = filterSelection.includes('全體');
                    
                    const currentDraft = commentDrafts[item.id] || '';
                    const currentAuthorId = commentAuthors[item.id] || members[0]?.id;
                    const currentAuthor = members.find(m => m.id === currentAuthorId);

                    return (
                        <div key={item.id} className={`p-4 rounded-[1.5rem] border-2 transition-all relative group shadow-hard-sm ${item.done ? 'bg-gray-50 border-beige-dark opacity-80' : 'bg-white border-beige-dark'}`}>
                            {(isViewAllMode || filterSelection.length > 1) && (
                                <div className="mb-2">
                                    {targets.map(t => (
                                        <span key={t} className="inline-block bg-beige-dark text-cocoa text-[10px] px-2 py-0.5 rounded-lg mr-1 font-bold">
                                            {t}
                                        </span>
                                    ))}
                                </div>
                            )}

                            <div className="flex items-start gap-3 mb-2">
                                <div className={`flex-shrink-0 pt-0.5 ${!isViewAllMode ? 'cursor-pointer' : 'cursor-default'}`} onMouseDown={(e) => {
                                    if (isViewAllMode && !isGroupTask) return;
                                    if (!isGroupTask) {
                                        e.stopPropagation();
                                        onToggle(currentList, item.id); 
                                    }
                                }}>
                                    {isGroupTask ? (
                                        <div className="relative w-6 h-6 flex items-center justify-center">
                                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                                <path className="text-beige-dark" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                                                <path className={`${item.done ? 'text-sage' : 'text-yellow-400'} transition-all duration-500`} strokeDasharray={`${totalTargets > 0 ? (completedCount / totalTargets) * 100 : 0}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                                            </svg>
                                            <span className={`absolute text-[8px] font-black ${item.done ? 'text-sage' : 'text-gray-400'}`}>{completedCount}/{totalTargets}</span>
                                        </div>
                                    ) : (
                                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${item.done ? 'bg-sage border-sage text-white' : 'border-beige-dark text-transparent bg-white'}`}>
                                            <Check size={12} strokeWidth={4} />
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    {editingId === item.id ? (
                                        <div className="flex flex-col gap-2">
                                            <textarea 
                                                value={editingForm.text} 
                                                onChange={(e) => setEditingForm({...editingForm, text: e.target.value})}
                                                className="w-full bg-beige/50 text-cocoa border-2 border-sage rounded-lg px-2 py-1 outline-none text-sm font-bold resize-none h-20"
                                                autoFocus
                                                placeholder="事項名稱"
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                            <input 
                                                type="text" 
                                                value={editingForm.note} 
                                                onChange={(e) => setEditingForm({...editingForm, note: e.target.value})}
                                                className="w-full bg-beige/50 text-cocoa border-2 border-beige-dark rounded-lg px-2 py-1 outline-none text-xs font-bold"
                                                placeholder="備註"
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                            <input 
                                                type="text" 
                                                value={editingForm.url} 
                                                onChange={(e) => setEditingForm({...editingForm, url: e.target.value})}
                                                className="w-full bg-beige/50 text-cocoa border-2 border-beige-dark rounded-lg px-2 py-1 outline-none text-xs font-bold"
                                                placeholder="URL"
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                            <div className="flex gap-2 justify-end mt-1">
                                                <button type="button" onMouseDown={cancelEditing} className="text-gray-400 text-xs font-bold px-2 py-1">取消</button>
                                                <button type="button" onMouseDown={saveEditing} className="bg-sage text-white text-xs font-bold px-3 py-1 rounded-lg shadow-sm">儲存</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <span className={`block font-bold text-base leading-relaxed break-words whitespace-pre-line ${item.done ? 'text-gray-300 line-through' : 'text-cocoa'}`}>{item.text}</span>
                                            {item.note && <p className={`text-xs mt-1 whitespace-pre-line font-bold ${item.done ? 'text-gray-300' : 'text-gray-400'}`}>{item.note}</p>}
                                            {item.url && <a href={item.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1.5 mt-2 text-xs font-bold bg-blue-50 text-blue-500 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors border border-blue-100"><Link size={12} /> 相關連結</a>}
                                        </div>
                                    )}

                                    {isGroupTask && (
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {members.filter(m => targets.includes(m.name)).map(m => {
                                                const isDone = (item.completedBy || []).includes(m.name);
                                                return (
                                                    <button 
                                                        key={m.id}
                                                        onMouseDown={(e) => { e.stopPropagation(); onToggle(currentList, item.id, m.name); }}
                                                        className={`text-[10px] px-2 py-1 rounded-full font-bold transition-colors border-2 flex items-center gap-1 ${isDone ? 'bg-sage text-white border-sage' : 'bg-white text-gray-400 border-beige-dark hover:bg-gray-50'}`}
                                                    >
                                                        {isDone && <Check size={8} strokeWidth={3} />}
                                                        {m.name}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {editingId !== item.id && (
                                    <div className="flex gap-1 ml-2 relative z-10 flex-col sm:flex-row">
                                        {deletingId === item.id ? (
                                            <div className="flex items-center gap-1 animate-scale-in">
                                                <button type="button" onMouseDown={(e) => confirmDelete(e, item.id)} className="text-xs bg-red-500 text-white px-3 py-1.5 rounded-full font-bold hover:bg-red-600 shadow-sm border-2 border-red-500">確定?</button>
                                                <button type="button" onMouseDown={(e) => {e.stopPropagation(); setDeletingId(null)}} className="text-gray-300 p-1.5 rounded-full hover:bg-gray-100"><X size={14} /></button>
                                            </div>
                                        ) : (
                                            <>
                                                <button type="button" onMouseDown={(e) => startEditing(e, item)} className="text-gray-300 hover:text-sage p-2 rounded-full hover:bg-sage-light transition-colors"><PenTool size={14} /></button>
                                                <button type="button" onMouseDown={(e) => promptDelete(e, item.id)} className="text-gray-300 hover:text-red-400 p-2 rounded-full hover:bg-red-50 transition-colors"><Trash2 size={14} /></button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="mt-3 pt-3 border-t-2 border-dashed border-gray-100">
                                {item.comments && item.comments.length > 0 && (
                                    <div className="space-y-2 mb-3">
                                        {item.comments.map(c => {
                                            const author = members.find(m => m.id === c.authorId);
                                            const isEditing = editingComment?.commentId === c.id && editingComment?.itemId === item.id;
                                            const isDeleting = deletingComment?.commentId === c.id && deletingComment?.itemId === item.id;

                                            return (
                                                <div key={c.id} className="flex gap-2 items-start group/comment">
                                                    <div className="w-5 h-5 rounded-full bg-beige border border-beige-dark flex-shrink-0 overflow-hidden flex items-center justify-center">
                                                        {author?.avatar ? <img src={author.avatar} className="w-full h-full object-cover"/> : <span className="text-[9px] font-black text-gray-400">{author?.name?.[0]}</span>}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        {isEditing ? (
                                                            <div className="flex flex-col gap-2">
                                                                <textarea 
                                                                    value={editingComment.text} 
                                                                    onChange={(e) => setEditingComment({ ...editingComment, text: e.target.value })}
                                                                    className="w-full bg-white border-2 border-sage rounded-lg px-2 py-1 text-xs font-bold text-cocoa outline-none resize-none h-16"
                                                                    autoFocus
                                                                />
                                                                <div className="flex gap-2 justify-end">
                                                                    <button onClick={() => cancelEditComment()} className="px-2 py-1 rounded-lg bg-gray-100 text-gray-400 hover:bg-gray-200 text-[10px] font-bold">取消</button>
                                                                    <button onClick={() => saveEditComment(item)} className="px-2 py-1 rounded-lg bg-sage text-white hover:bg-sage-dark text-[10px] font-bold">儲存</button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <div className="bg-gray-50 rounded-lg rounded-tl-none px-2 py-1.5 inline-block border border-beige-dark/50 max-w-full">
                                                                    <p className="text-xs font-bold text-cocoa leading-snug whitespace-pre-wrap break-words">{c.text}</p>
                                                                </div>
                                                                <div className="flex items-center justify-between mt-0.5 ml-1 pr-1">
                                                                    <div className="text-[9px] font-bold text-gray-300">
                                                                        {author?.name} • {new Date(c.createdAt).toLocaleDateString([], {month:'numeric', day:'numeric'})}
                                                                    </div>
                                                                    
                                                                    <div className="flex items-center gap-1.5">
                                                                        {isDeleting ? (
                                                                            <div className="flex items-center gap-1 animate-scale-in">
                                                                                <button onClick={() => confirmDeleteComment(item)} className="bg-red-500 text-white text-[9px] px-2 py-0.5 rounded-full font-bold hover:bg-red-600 shadow-sm">確定?</button>
                                                                                <button onClick={() => setDeletingComment(null)} className="text-gray-300 hover:text-gray-500"><X size={12}/></button>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="flex gap-1.5 opacity-100 lg:opacity-0 lg:group-hover/comment:opacity-100 transition-opacity">
                                                                                <button onClick={() => startEditComment(item.id, c)} className="text-gray-300 hover:text-sage transition-colors"><PenTool size={10}/></button>
                                                                                <button onClick={() => promptDeleteComment(item.id, c.id)} className="text-gray-300 hover:text-red-400 transition-colors"><Trash2 size={10}/></button>
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
                                        const isSelected = (commentAuthors[item.id] || members[0]?.id) === m.id;
                                        return (
                                            <button
                                                key={m.id}
                                                onClick={(e) => { e.stopPropagation(); selectCommentAuthor(item.id, m.id); }}
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
                                        onChange={e => handleInlineCommentChange(item.id, e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && submitInlineComment(e, item)}
                                        placeholder={`用 ${currentAuthor?.name} 的身份留言...`}
                                        className="w-full bg-gray-50 text-cocoa rounded-xl px-3 py-2 outline-none border border-beige-dark/50 font-bold text-xs placeholder-gray-300 focus:border-sage focus:bg-white transition-colors pr-9"
                                        onClick={e => e.stopPropagation()}
                                    />
                                    {currentDraft.trim() && (
                                        <button 
                                            onClick={(e) => submitInlineComment(e, item)} 
                                            className="absolute right-1.5 top-1/2 -translate-y-1/2 text-sage hover:text-sage-dark p-1"
                                        >
                                            <Send size={14}/>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    </div>
  );
};
