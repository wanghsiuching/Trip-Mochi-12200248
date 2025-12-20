
import React, { useState, useEffect } from 'react';
import { ClipboardList, Luggage, Heart, ShoppingCart, PenTool, Trash2, Link, X, Check, Plus, Edit3 } from 'lucide-react';
import { TodoItem, Member } from '../types';

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
  
  // Extra Fields
  const [newNote, setNewNote] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [showExtraInput, setShowExtraInput] = useState(false);
  
  // Unified Filter & Assignment State
  const [filterSelection, setFilterSelection] = useState<string[]>(['全體']);

  // Editing State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingForm, setEditingForm] = useState<{text: string, note: string, url: string}>({text: '', note: '', url: ''});

  // Delete Confirmation State
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Reset inputs when switching tabs, default filter to All
  useEffect(() => {
      setFilterSelection(['全體']);
      setNewItem('');
      setNewNote('');
      setNewUrl('');
      setShowExtraInput(false);
  }, [currentList]);

  // Logic to toggle filter pills
  const toggleMemberFilter = (name: string) => {
      if (name === '全體') {
          setFilterSelection(['全體']);
          return;
      }

      if (currentList === 'todo') {
          // Multi-select logic for Todo
          setFilterSelection(prev => {
              // If currently 'All', clear it and start fresh with the clicked name
              let newSel = prev.includes('全體') ? [] : [...prev];

              if (newSel.includes(name)) {
                  newSel = newSel.filter(n => n !== name);
              } else {
                  newSel.push(name);
              }

              // If deselecting the last one, revert to 'All'
              return newSel.length === 0 ? ['全體'] : newSel;
          });
      } else {
          // Single-select logic for packing/wish/shopping
          setFilterSelection(prev => {
              // If clicking the already selected member, revert to 'All'
              if (prev.includes(name)) {
                  return ['全體'];
              }
              // Otherwise switch to this member (Single Select)
              return [name];
          });
      }
  };

  const handleAdd = () => {
    if (!newItem.trim()) return;
    
    // Determine assignee based on filter selection
    let finalAssignee: string | string[];

    if (filterSelection.includes('全體')) {
        finalAssignee = '全體';
    } else if (filterSelection.length === 1) {
        finalAssignee = filterSelection[0];
    } else {
        // Multi-assign
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

  // --- Filter Logic for List Display ---
  const activeListItems = (lists[currentList] || []).filter(item => {
      // 1. Show all if '全體' is selected
      if (filterSelection.includes('全體')) return true;

      // 2. Logic: Show item if it's assigned to 'All', 
      //    OR if the item's assignee overlaps with the selected members.
      if (item.assignee === '全體') return true;

      const itemAssignees = Array.isArray(item.assignee) ? item.assignee : [item.assignee];
      
      // Check for intersection
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
        {/* Sticky Header Tabs */}
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

        {/* Content Area */}
        <div className="px-4 pb-4 lg:p-0">
            
            {/* --- UNIFIED FILTER & ASSIGN BAR --- */}
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

            {/* --- INPUT AREA (Card) --- */}
            <div className="mb-6 bg-white p-4 rounded-[2rem] shadow-hard-sm border-2 border-beige-dark space-y-3 flex-shrink-0">
                <div className="flex gap-2 items-start">
                    <div className="flex-1 min-w-0 space-y-2">
                            <input 
                            type="text" 
                            value={newItem} 
                            onChange={e => setNewItem(e.target.value)} 
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                                    e.preventDefault();
                                    handleAdd();
                                }
                            }}
                            placeholder={getPlaceholderText()} 
                            className="w-full bg-beige/50 text-cocoa rounded-xl px-4 py-3.5 text-base outline-none focus:border-sage border-2 border-beige-dark font-bold placeholder-gray-300 transition-colors" 
                        />
                        
                        {/* Extra Input Fields (Note & URL) */}
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

            {/* --- LIST CONTENT --- */}
            <div className="space-y-3 pb-20 lg:pb-0">
                {activeListItems.length === 0 && (
                    <div className="text-center py-10 text-gray-300 opacity-60 bg-white rounded-[2rem] border-2 border-dashed border-beige-dark">
                        <ClipboardList size={40} className="mx-auto mb-2" />
                        <p className="text-sm font-bold">
                            這裡空空如也
                        </p>
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

                            <div className="flex items-start gap-3">
                                {/* Checkbox */}
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

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    {editingId === item.id ? (
                                        <div className="flex flex-col gap-2">
                                            <input 
                                                type="text" 
                                                value={editingForm.text} 
                                                onChange={(e) => setEditingForm({...editingForm, text: e.target.value})}
                                                className="w-full bg-beige/50 text-cocoa border-2 border-sage rounded-lg px-2 py-1 outline-none text-sm font-bold"
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
                                            <span className={`block font-bold text-base leading-relaxed break-words ${item.done ? 'text-gray-300 line-through' : 'text-cocoa'}`}>{item.text}</span>
                                            
                                            {/* Note Display */}
                                            {item.note && (
                                                <p className={`text-xs mt-1 whitespace-pre-line font-bold ${item.done ? 'text-gray-300' : 'text-gray-400'}`}>
                                                    {item.note}
                                                </p>
                                            )}

                                            {/* URL Display */}
                                            {item.url && (
                                                <a href={item.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1.5 mt-2 text-xs font-bold bg-blue-50 text-blue-500 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors border border-blue-100">
                                                    <Link size={12} /> 相關連結
                                                </a>
                                            )}
                                        </div>
                                    )}

                                    {/* Member Buttons (Only for Group Tasks) */}
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

                                {/* Actions */}
                                {editingId !== item.id && (
                                    <div className="flex gap-1 ml-2 relative z-10">
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
                        </div>
                    );
                })}
            </div>
        </div>
    </div>
  );
};
