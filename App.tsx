
import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, ArrowRight, Plane, Plus, X, Copy, BookOpen, ChevronLeft, Trash2,
  ChevronUp, ChevronDown, Navigation, StickyNote, Settings, AlertCircle, 
  CalendarCheck, Coins, Edit3, Users, Luggage, Briefcase, Bed, Car, Coffee, Utensils, Fuel, Ticket, Clock
} from 'lucide-react';

import { 
  Tab, ViewState, ScheduleItem, SavedTrip, Currency, Member, THEME, TripDay,
  BookingFlight, BookingAccommodation, BookingCarRental, BookingTicket, Expense, Journal, TodoItem
} from './types';
import { BottomNav } from './components/UI';
import { 
  AddScheduleModal, CreateTripModal, DeleteConfirmModal, SearchErrorModal, DeleteItemConfirmModal, TripSettingsModal, PotentialExpensesModal, EditDayDetailsModal, DeleteDayConfirmModal 
} from './components/Modals';
import { BookingsView } from './components/BookingsView';
import { ExpensesView } from './components/ExpensesView';
import { JournalView } from './components/JournalView';
import { PlanningView } from './components/PlanningView';
import { MembersView } from './components/MembersView';
import { createTrip, joinTripByCode, subscribeToTrip, addTripItem, updateTripField } from './services/tripService';

export default function App() {
  const [view, setView] = useState<ViewState>('landing');
  const [activeTab, setActiveTab] = useState<Tab>('schedule');
  const [selectedDate, setSelectedDate] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [copyFeedback, setCopyFeedback] = useState(false);
  
  const [currentTripId, setCurrentTripId] = useState<string>('');
  const [currentTripName, setCurrentTripName] = useState('');
  const [savedTrips, setSavedTrips] = useState<SavedTrip[]>([]);
  
  const [tripDays, setTripDays] = useState<TripDay[]>([]);
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [bookingFlights, setBookingFlights] = useState<BookingFlight[]>([]);
  const [bookingAccommodations, setBookingAccommodations] = useState<BookingAccommodation[]>([]);
  const [bookingCarRental, setBookingCarRental] = useState<BookingCarRental>({} as BookingCarRental);
  const [bookingTickets, setBookingTickets] = useState<BookingTicket[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [journals, setJournals] = useState<Journal[]>([]);
  const [planningLists, setPlanningLists] = useState<{
      todo: TodoItem[];
      packing: TodoItem[];
      wish: TodoItem[];
      shopping: TodoItem[];
  }>({ todo: [], packing: [], wish: [], shopping: [] });
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deleteModalTarget, setDeleteModalTarget] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isPotentialModalOpen, setIsPotentialModalOpen] = useState(false);
  const [isEditDayModalOpen, setIsEditDayModalOpen] = useState(false);
  const [isDeleteDayModalOpen, setIsDeleteDayModalOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const dates = tripDays.map((day, i) => {
    const d = new Date(day.date);
    const month = d.getMonth() + 1;
    const dateNum = d.getDate();
    const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
    return { ...day, dayNum: i + 1, month, day: dateNum, weekday };
  });

  const currentLocation = tripDays.find(d => d.date === selectedDate)?.location || '旅行地點';

  const getACFruit = (str: string) => {
      const fruits = ['🍎', '🍊', '🍐', '🍑', '🍒', '🥥'];
      if (!str) return '✈️';
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
          hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      return fruits[Math.abs(hash) % fruits.length];
  };

  const currentFruit = getACFruit(currentLocation);

  const getMemberNames = (ids?: string[]) => {
      if (!ids || ids.length === 0) return '';
      return ids.map(id => members.find(m => m.id === id)?.name).filter(Boolean).join(', ');
  };

  useEffect(() => {
    const storedTrips = localStorage.getItem('trip_mochi_index');
    if (storedTrips) setSavedTrips(JSON.parse(storedTrips));
    try {
      const params = new URLSearchParams(window.location.search);
      const urlTripCode = params.get('tripCode');
      if (urlTripCode) handleJoinTrip(urlTripCode);
      else setLoading(false);
    } catch (e) {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
      if (!currentTripId) return;
      const unsubscribe = subscribeToTrip(currentTripId, (data) => {
          setTripDays(data.tripDays || []);
          if (!selectedDate && data.tripDays?.length > 0) setSelectedDate(data.tripDays[0].date);
          else if (data.tripDays?.length > 0 && !data.tripDays.find((d: TripDay) => d.date === selectedDate)) setSelectedDate(data.tripDays[0].date);
          setScheduleItems(data.scheduleItems || []);
          setBookingFlights(data.flights || []);
          setBookingAccommodations(data.accommodations || []);
          setBookingCarRental(data.carRental || {});
          setBookingTickets(data.tickets || []);
          setExpenses(data.expenses || []);
          setJournals(data.journals || []);
          setPlanningLists(data.planning || { todo: [], packing: [], wish: [], shopping: [] });
          setCurrencies(data.currencies || []);
          setMembers(data.members || []);
          setCurrentTripName(data.name || '未命名行程');
          setLoading(false);
      });
      return () => unsubscribe();
  }, [currentTripId]);

  useEffect(() => {
      if (savedTrips.length > 0) localStorage.setItem('trip_mochi_index', JSON.stringify(savedTrips));
  }, [savedTrips]);

  const handleCreateTrip = async (customName: string) => {
    setIsCreateModalOpen(false); setLoading(true);
    try {
        const newId = await createTrip(customName);
        const today = new Date().toISOString().split('T')[0];
        setSavedTrips(prev => [{ id: newId, name: customName, date: today }, ...prev]);
        openTrip(newId, customName);
    } catch (e) {
        alert('建立失敗'); setLoading(false);
    }
  };

  const handleJoinTrip = async (inputDetail: string) => {
    if(!inputDetail) return; setIsSearching(true);
    const cleanId = inputDetail.trim().toUpperCase();
    try {
        const tripData = await joinTripByCode(cleanId);
        if (!savedTrips.find(t => t.id === cleanId)) setSavedTrips(prev => [{ id: cleanId, name: tripData.name, date: new Date().toISOString().split('T')[0] }, ...prev]);
        openTrip(cleanId, tripData.name);
    } catch (e) { setSearchError('找不到此行程碼'); } finally { setIsSearching(false); }
  };

  const handleDeleteTrip = () => {
    if (!deleteModalTarget) return;
    setSavedTrips(prev => prev.filter(t => t.id !== deleteModalTarget));
    setDeleteModalTarget(null);
  };

  const openTrip = (id: string, name: string) => {
    setCurrentTripId(id); setCurrentTripName(name);
    try {
      const newUrl = `${window.location.pathname}?tripCode=${id}`;
      window.history.pushState({ path: newUrl }, '', newUrl);
    } catch (e) {}
    setView('app'); window.scrollTo(0, 0);
  };

  const handleBackToHome = () => {
      setView('landing'); setCurrentTripId('');
      try { window.history.pushState({ path: window.location.pathname }, '', window.location.pathname); } catch (e) {}
  };

  const handleShare = () => {
    navigator.clipboard.writeText(currentTripId).then(() => {
      setCopyFeedback(true); setTimeout(() => setCopyFeedback(false), 2000);
    });
  };

  const handleAddExpense = (newExpense: Omit<Expense, 'id'>) => addTripItem(currentTripId, 'expenses', { ...newExpense, id: Date.now() });
  const handleUpdateExpense = (updated: Expense) => updateTripField(currentTripId, 'expenses', expenses.map(e => e.id === updated.id ? updated : e));
  const handleDeleteExpense = (id: number) => updateTripField(currentTripId, 'expenses', expenses.filter(e => e.id !== id));
  const handleAddJournal = (newJournal: Journal) => addTripItem(currentTripId, 'journals', newJournal);
  const handleUpdateJournal = (updated: Journal) => updateTripField(currentTripId, 'journals', journals.map(j => j.id === updated.id ? updated : j));
  const handleDeleteJournal = (id: number) => updateTripField(currentTripId, 'journals', journals.filter(j => j.id !== id));
  const handleAddPlanning = (type: 'todo' | 'packing' | 'wish' | 'shopping', text: string, assignee: string | string[], image?: string, note?: string, url?: string) => {
      const newItem = { id: Date.now(), text, assignee, completedBy: [], done: false, image, note, url };
      updateTripField(currentTripId, 'planning', { ...planningLists, [type]: [...planningLists[type], newItem] });
  };
  const handleTogglePlanning = (type: 'todo' | 'packing' | 'wish' | 'shopping', id: number, memberName?: string) => {
      const newLists = { ...planningLists, [type]: planningLists[type].map(item => { if (item.id !== id) return item; if (type === 'todo' && (item.assignee === '全體' || (Array.isArray(item.assignee) && item.assignee.length > 1))) { if (!memberName) return item; const currentCompleted = item.completedBy || []; const newCompleted = currentCompleted.includes(memberName) ? currentCompleted.filter(m => m !== memberName) : [...currentCompleted, memberName]; let targets: string[] = []; if (item.assignee === '全體') targets = members.map(m => m.name); else if (Array.isArray(item.assignee)) targets = item.assignee; else targets = [item.assignee as string]; const allDone = targets.every(t => newCompleted.includes(t)); return { ...item, completedBy: newCompleted, done: allDone }; } else { return { ...item, done: !item.done }; } }) };
      updateTripField(currentTripId, 'planning', newLists);
  };
  const handleUpdatePlanning = (type: 'todo' | 'packing' | 'wish' | 'shopping', id: number, updates: Partial<TodoItem>) => updateTripField(currentTripId, 'planning', { ...planningLists, [type]: planningLists[type].map(item => item.id === id ? { ...item, ...updates } : item) });
  const handleDeletePlanning = (type: 'todo' | 'packing' | 'wish' | 'shopping', id: number) => updateTripField(currentTripId, 'planning', { ...planningLists, [type]: planningLists[type].filter(item => item.id !== id) });
  const handleAddMember = (name: string, avatar: string | null) => addTripItem(currentTripId, 'members', { id: Date.now().toString(), name, avatar, fruit: '🍎' });
  const handleUpdateMember = (updated: Member) => updateTripField(currentTripId, 'members', members.map(m => m.id === updated.id ? updated : m));
  const handleDeleteMember = (id: string) => { if (members.length > 1) updateTripField(currentTripId, 'members', members.filter(m => m.id !== id)); };
  const handleAddFlight = (flight: BookingFlight) => addTripItem(currentTripId, 'flights', flight);
  const handleDeleteFlight = (id: number) => updateTripField(currentTripId, 'flights', bookingFlights.filter(f => f.id !== id));
  const handleSaveItem = (itemData: Omit<ScheduleItem, 'id'>) => { if (editingItem) { updateTripField(currentTripId, 'scheduleItems', scheduleItems.map(item => item.id === editingItem.id ? { ...itemData, id: item.id } : item)); setEditingItem(null); } else { addTripItem(currentTripId, 'scheduleItems', { ...itemData, id: Date.now().toString() }); } };
  const handleEditClick = (item: ScheduleItem) => { setEditingItem(item); setIsAddModalOpen(true); };
  const handleDeleteItemClick = (itemId: string) => setItemToDelete(itemId);
  const confirmDeleteItem = () => { if (itemToDelete) { updateTripField(currentTripId, 'scheduleItems', scheduleItems.filter(item => item.id !== itemToDelete)); setItemToDelete(null); } };
  const handleMoveItem = (index: number, direction: 'up' | 'down') => { const currentDayItems = scheduleItems.filter(i => i.date === selectedDate); const itemA = currentDayItems[index]; const targetIndex = direction === 'up' ? index - 1 : index + 1; const itemB = currentDayItems[targetIndex]; const newArr = [...scheduleItems]; const idxA = newArr.findIndex(i => i.id === itemA.id); const idxB = newArr.findIndex(i => i.id === itemB.id); if (idxA > -1 && idxB > -1) { [newArr[idxA], newArr[idxB]] = [newArr[idxB], newArr[idxA]]; updateTripField(currentTripId, 'scheduleItems', newArr); } };
  const openMap = (location: string) => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`, '_blank');
  const handleAddDay = () => { const lastDay = tripDays[tripDays.length - 1]; const nextDate = new Date(lastDay.date); nextDate.setDate(nextDate.getDate() + 1); updateTripField(currentTripId, 'tripDays', [...tripDays, { date: nextDate.toISOString().split('T')[0], location: lastDay.location }]); };
  const confirmDeleteDay = () => { if (tripDays.length > 1) { const newDays = tripDays.filter(d => d.date !== selectedDate); updateTripField(currentTripId, 'tripDays', newDays); updateTripField(currentTripId, 'scheduleItems', scheduleItems.filter(item => item.date !== selectedDate)); if (!newDays.find(d => d.date === selectedDate)) setSelectedDate(newDays[0].date); setIsDeleteDayModalOpen(false); } };
  const handleUpdateDayDetails = (newDate: string, newLoc: string) => { updateTripField(currentTripId, 'tripDays', tripDays.map(d => d.date === selectedDate ? { date: newDate, location: newLoc } : d)); updateTripField(currentTripId, 'scheduleItems', scheduleItems.map(item => item.date === selectedDate ? { ...item, date: newDate } : item)); setSelectedDate(newDate); setIsEditDayModalOpen(false); };
  const addCurrency = (c: Currency) => updateTripField(currentTripId, 'currencies', [...currencies, c]);
  const removeCurrency = (code: string) => updateTripField(currentTripId, 'currencies', currencies.filter(c => c.code !== code));
  const handleClearData = () => { if (window.confirm("警告：這將會清除您本機的所有行程資料！")) { localStorage.removeItem('trip_mochi_index'); window.location.reload(); } };

  if (loading) {
    return (
      <div className="min-h-screen bg-beige flex flex-col items-center justify-center relative overflow-hidden">
        <div className="relative z-10 animate-float-fly flex flex-col items-center">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-hard border-4 border-beige-dark mb-6"><Plane size={80} className="text-sage" strokeWidth={2.5} /></div>
            <h1 className="text-4xl font-black text-cocoa tracking-tight mb-3">Trip Mochi</h1>
            <div className="bg-sage text-white px-6 py-2 rounded-full text-xl font-bold animate-pulse">載入中...</div>
        </div>
      </div>
    );
  }

  const renderLanding = () => (
    <div className="flex flex-col min-h-screen px-6 bg-beige relative overflow-hidden pt-12 items-center text-center">
      <div className="mb-8 w-full flex justify-between items-end border-b-2 border-beige-dark pb-4">
         <div className="text-left"><h1 className="text-2xl font-black text-cocoa tracking-tight">我的旅遊手帳</h1><p className="text-gray-400 font-bold text-xs mt-1">準備好出發了嗎？</p></div>
      </div>
      <div className="w-full space-y-4 relative z-20 mb-8">
        <button onClick={() => setIsCreateModalOpen(true)} className="w-full bg-sage hover:bg-sage-dark text-white p-4 rounded-[2rem] shadow-hard-sage transition-all flex items-center justify-center gap-3 border-2 border-sage-dark group"><Plus size={24} strokeWidth={3} /><span className="font-bold text-lg tracking-widest">建立新行程</span></button>
        <div className="flex gap-2 relative">
           <input type="text" placeholder="輸入行程碼 (TRIP88)..." className="flex-1 bg-white px-4 py-3 rounded-[1.5rem] text-cocoa font-bold outline-none border-2 border-beige-dark shadow-hard-sm uppercase" onKeyDown={(e) => e.key === 'Enter' && handleJoinTrip(e.currentTarget.value)} />
           <button className="bg-cocoa text-white px-5 rounded-[1.5rem] shadow-hard-sm border-2 border-[#333] flex items-center justify-center" onClick={(e) => handleJoinTrip((e.currentTarget.previousElementSibling as HTMLInputElement).value)}><ArrowRight size={24} strokeWidth={3} /></button>
        </div>
      </div>
      <div className="w-full flex-1 overflow-y-auto pb-10 no-scrollbar relative z-10">
        <h2 className="text-sm font-bold text-gray-400 tracking-widest mb-4 uppercase text-left pl-2">我的收藏</h2>
        <div className="flex flex-col gap-3">
        {savedTrips.length === 0 ? (<div className="py-10 border-2 border-dashed border-beige-dark rounded-3xl bg-white/50 flex flex-col items-center justify-center text-gray-300"><BookOpen size={40} className="mb-2" /><p className="font-bold">還沒有行程</p></div>) : 
          savedTrips.map(trip => (
            <div key={trip.id} onClick={() => openTrip(trip.id, trip.name)} className="group relative bg-white p-4 rounded-3xl shadow-hard-sm border-2 border-beige-dark active:scale-[0.98] transition-transform cursor-pointer flex justify-between items-center hover:border-sage">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-sage-light rounded-2xl flex items-center justify-center text-sage border-2 border-white shadow-sm"><Plane size={20} className="rotate-[-45deg]" strokeWidth={2.5} /></div>
                  <div className="text-left"><h3 className="font-bold text-cocoa text-lg">{trip.name}</h3><p className="text-xs text-gray-400 font-mono font-bold bg-gray-100 px-2 py-0.5 rounded-md inline-block">Code: {trip.id}</p></div>
               </div>
               <button onClick={(e) => { e.stopPropagation(); setDeleteModalTarget(trip.id); }} className="p-3 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-xl"><Trash2 size={20} /></button>
            </div>
          ))
        }
        </div>
      </div>
      <DeleteConfirmModal isOpen={!!deleteModalTarget} onClose={() => setDeleteModalTarget(null)} onConfirm={handleDeleteTrip} tripName={savedTrips.find(t => t.id === deleteModalTarget)?.name || 'Trip'} />
      <SearchErrorModal isOpen={!!searchError} onClose={() => setSearchError(null)} message={searchError || ''} />
      <CreateTripModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onConfirm={handleCreateTrip} />
    </div>
  );

  if (view === 'landing') return renderLanding();

  return (
    <div className={`min-h-screen ${THEME.colors.bg}`}>
      <div className="max-w-md mx-auto min-h-screen relative shadow-2xl bg-beige overflow-hidden">
        <header className="px-6 pt-12 pb-2 flex justify-between items-start bg-beige">
          <div className="flex flex-col">
            <button onClick={handleBackToHome} className="flex items-center gap-1 text-sm font-bold text-gray-400 mb-3"><ChevronLeft size={16} strokeWidth={3}/> 返回首頁</button>
            <h1 className="text-3xl font-black text-cocoa tracking-tight">{currentTripName}</h1>
            <div onClick={handleShare} className="flex items-center gap-2 mt-2 cursor-pointer group"><span className="text-xs font-bold text-sage bg-white px-3 py-1.5 rounded-lg border-2 border-beige-dark group-hover:border-sage flex items-center gap-2 shadow-hard-sm">Code: {currentTripId} <Copy size={12} /></span>{copyFeedback && <span className="text-xs text-sage font-bold animate-pulse bg-white px-2 py-1 rounded-lg">已複製代碼！</span>}</div>
          </div>
          <div className="flex items-center gap-3 pt-6"><button onClick={() => setIsSettingsModalOpen(true)} className="p-3 bg-white rounded-full shadow-hard-sm border-2 border-beige-dark text-gray-400 hover:text-sage"><Settings size={20} strokeWidth={2.5} /></button></div>
        </header>

        <main className="min-h-[calc(100vh-160px)]">
          {activeTab === 'schedule' && (
            <div className="space-y-6 pb-24 relative">
              <div className="lg:hidden sticky top-0 z-30 bg-beige/85 backdrop-blur-md border-b border-[#E0E5D5]/50 px-4 pb-2 pt-1">
                 <div className="flex items-center justify-between mb-2 px-1">
                    <button onClick={() => setIsEditDayModalOpen(true)} className="text-sm font-black text-cocoa flex items-center gap-1.5"><CalendarCheck size={14} className="text-sage" /> 行程日期 <Edit3 size={10} className="text-gray-300"/></button>
                    <div className="flex items-center gap-2">{tripDays.length > 1 && <button onClick={() => setIsDeleteDayModalOpen(true)} className="p-1.5 bg-red-100 text-red-500 rounded-full border border-red-200"><Trash2 size={12} /></button>}<button onClick={() => setIsEditDayModalOpen(true)} className="text-[10px] font-bold px-2 py-1 rounded-full border bg-white border-[#E0E5D5] text-cocoa flex items-center gap-1 shadow-sm"><span>{currentFruit} {currentLocation}</span></button></div>
                 </div>
                 <div ref={scrollRef} className="flex space-x-2 overflow-x-auto no-scrollbar pb-1 snap-x">
                   {dates.map((date) => {
                     const isSelected = selectedDate === date.date;
                     return (<div key={date.date} onClick={() => setSelectedDate(date.date)} className={`flex-shrink-0 flex flex-col items-center justify-center w-[3.5rem] h-16 rounded-2xl transition-all snap-center cursor-pointer relative overflow-hidden ${isSelected ? `bg-sage shadow-hard-sm-sage border-sage text-white scale-105 border-2` : 'bg-white border-2 border-[#E0E5D5] text-gray-400 hover:border-sage'}`}><span className={`text-[9px] font-black uppercase mb-0.5 ${isSelected ? 'opacity-90' : 'text-[#B0A590]'}`}>Day {date.dayNum}</span><span className="text-lg font-black leading-none">{date.day}</span><span className={`text-[10px] font-bold mt-0.5 ${isSelected ? 'opacity-80' : 'opacity-60'}`}>{date.weekday}</span></div>);
                   })}
                   <button onClick={handleAddDay} className="flex-shrink-0 flex flex-col items-center justify-center w-[3.5rem] h-16 rounded-2xl border-2 border-dashed border-[#E0E5D5] text-gray-300 hover:text-sage bg-white/50 snap-center"><Plus size={24} strokeWidth={3} /></button>
                 </div>
                 <div className="mt-2 text-right"><button onClick={() => setIsPotentialModalOpen(true)} className="bg-yellow-100 text-yellow-600 p-2 rounded-xl border border-yellow-200 shadow-sm text-xs font-bold inline-flex items-center gap-1"><Coins size={12}/> 潛在花費</button></div>
               </div>

               <div className="px-5 pt-2">
                  <div className="relative border-l-[3px] border-beige-dark ml-4 space-y-8 py-2">
                    {scheduleItems.filter(item => item.date === selectedDate).length === 0 && (<div className="pl-8 text-gray-400 font-bold italic py-10">此日期尚無行程，點擊右下角新增！</div>)}
                    {scheduleItems.filter(item => item.date === selectedDate).map((item, index) => {
                      let icon = MapPin; let colorClass = 'bg-gray-100 text-gray-500';
                      if (item.type === 'food') { icon = Utensils; colorClass = 'bg-orange-100 text-orange-500'; }
                      if (item.type === 'transport') { icon = Navigation; colorClass = 'bg-blue-100 text-blue-500'; }
                      if (item.type === 'stay') { icon = Bed; colorClass = 'bg-purple-100 text-purple-500'; }
                      if (item.type === 'spot') { icon = MapPin; colorClass = 'bg-green-100 text-green-600'; }
                      if (item.type === 'flight') { icon = Plane; colorClass = 'bg-cyan-100 text-cyan-600'; }
                      const IconComp = icon;
                      const dotColor = ['bg-sage', 'bg-orange-400', 'bg-blue-400', 'bg-purple-400', 'bg-pink-400', 'bg-yellow-400'][index % 6];
                      const partIds = item.type === 'flight' ? item.flightDetails?.participants : item.type === 'stay' ? item.stayDetails?.participants : item.type === 'transport' ? item.carRental?.participants : (item.type === 'spot' || item.type === 'food') ? item.spotDetails?.participants : [];
                      const participantNames = getMemberNames(partIds);

                      return (
                        <div key={item.id} className="relative pl-8 group mb-8">
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteItemClick(item.id); }} className="absolute right-0 -top-3 bg-red-100 text-red-400 p-1.5 rounded-full opacity-0 group-hover:opacity-100 z-30 border border-red-200 shadow-sm"><X size={12} strokeWidth={3} /></button>
                          <div className={`absolute -left-[12px] top-8 w-4 h-4 rounded-full border-4 border-beige shadow-sm ${dotColor} z-10`}></div>
                          <div onClick={() => handleEditClick(item)} className="bg-white rounded-[2rem] shadow-hard-sm border-2 border-beige-dark overflow-hidden relative transition-all cursor-pointer hover:border-sage group-hover:-translate-y-1">
                            <div className="p-5">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                         <div className={`p-3 rounded-2xl ${colorClass} border-2 border-white shadow-sm`}><IconComp size={22} strokeWidth={2.5} /></div>
                                         <div><div className="flex items-center gap-2 mb-1"><span className="font-mono text-sm font-black text-white bg-sage px-2 py-0.5 rounded-lg shadow-sm">{item.time}</span><span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{item.type}</span></div><h3 className="text-xl font-black text-cocoa tracking-tight leading-tight">{item.title}</h3></div>
                                    </div>
                                    <div className="flex flex-col gap-1"><button onClick={(e) => { e.stopPropagation(); handleMoveItem(index, 'up'); }} disabled={index === 0} className={`p-1 rounded-full border border-beige-dark ${index === 0 ? 'opacity-0' : 'text-gray-300 hover:bg-sage hover:text-white'}`}><ChevronUp size={12} /></button><button onClick={(e) => { e.stopPropagation(); handleMoveItem(index, 'down'); }} disabled={index === scheduleItems.filter(i => i.date === selectedDate).length - 1} className={`p-1 rounded-full border border-beige-dark ${index === scheduleItems.filter(i => i.date === selectedDate).length - 1 ? 'opacity-0' : 'text-gray-300 hover:bg-sage hover:text-white'}`}><ChevronDown size={12} /></button></div>
                                </div>
                                <div className="flex items-center text-gray-500 text-sm gap-2 font-bold bg-gray-50 px-3 py-2 rounded-xl border border-gray-100 w-full"><MapPin size={16} className="text-sage" /><span className="truncate flex-1">{item.location}</span><button onClick={(e) => { e.stopPropagation(); openMap(item.location); }} className="p-1.5 bg-white rounded-lg text-cocoa hover:text-white hover:bg-sage shadow-sm border border-gray-200 transition-colors"><Navigation size={12} strokeWidth={2.5} /></button></div>
                            </div>
                            <div className="relative w-full h-0 border-t-2 border-dashed border-beige-dark flex justify-between items-center"><div className="absolute -left-3 -top-3 w-6 h-6 bg-beige rounded-full border-r-2 border-beige-dark"></div><div className="absolute -right-3 -top-3 w-6 h-6 bg-beige rounded-full border-l-2 border-beige-dark"></div></div>
                            <div className="bg-[#FAF9F6] p-5">
                                {/* DETAIL LISTING BELOW DASHED LINE */}
                                <div className="space-y-3">
                                    {/* Flight Info */}
                                    {item.type === 'flight' && item.flightDetails && (
                                        <div className="bg-cyan-50/30 p-3 rounded-2xl border border-cyan-100/50 space-y-2">
                                            <div className="flex justify-between items-center border-b border-cyan-100/50 pb-2">
                                                <div className="flex items-center gap-2"><Plane size={14} className="text-cyan-600"/><span className="text-sm font-black text-cocoa">{item.flightDetails.airline} {item.flightDetails.flightCode}</span></div>
                                                <span className="text-[10px] font-bold text-cyan-600">{item.flightDetails.departureAirport} → {item.flightDetails.arrivalAirport}</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-[11px] font-bold text-gray-500">
                                                {/* Fix: Using Clock from lucide-react */}
                                                <div className="flex items-center gap-1"><Clock size={12} className="text-gray-300"/>DEP: {item.flightDetails.departureTime}</div>
                                                <div className="flex items-center gap-1"><Clock size={12} className="text-gray-300"/>ARR: {item.flightDetails.arrivalTime}</div>
                                                <div className="flex items-center gap-1"><Luggage size={12} className="text-teal-500"/>託運: {item.flightDetails.checkedBag || '--'}</div>
                                                <div className="flex items-center gap-1"><Briefcase size={12} className="text-orange-400"/>手提: {item.flightDetails.carryOnBag || '--'}</div>
                                            </div>
                                            {/* Fix: Wrap item.flightDetails.cost in Number() for comparison */}
                                            {(Number(item.flightDetails.cost) || 0) > 0 && <div className="text-right text-[10px] font-black text-sage">費用: {item.flightDetails.currency} {Number(item.flightDetails.cost).toLocaleString()}</div>}
                                        </div>
                                    )}

                                    {/* Stay Info */}
                                    {item.type === 'stay' && item.stayDetails && (
                                        <div className="bg-purple-50/30 p-3 rounded-2xl border border-purple-100/50 space-y-2">
                                            <div className="flex justify-between items-center border-b border-purple-100/50 pb-2">
                                                <div className="flex items-center gap-2"><Bed size={14} className="text-purple-600"/><span className="text-sm font-black text-cocoa">住宿詳情</span></div>
                                            </div>
                                            <div className="flex gap-4 text-[11px] font-bold text-gray-500">
                                                {/* Fix: Using Clock from lucide-react */}
                                                <div className="flex items-center gap-1"><Clock size={12} className="text-gray-300"/>CI: {item.checkIn}</div>
                                                <div className="flex items-center gap-1"><Clock size={12} className="text-gray-300"/>CO: {item.checkOut}</div>
                                            </div>
                                            <div className="flex gap-3 mt-1">
                                                {item.meals?.breakfast && <span className="text-[10px] bg-white px-2 py-0.5 rounded-full border border-purple-200 text-purple-400 flex items-center gap-1"><Coffee size={10}/> 早餐</span>}
                                                {item.meals?.dinner && <span className="text-[10px] bg-white px-2 py-0.5 rounded-full border border-purple-200 text-purple-400 flex items-center gap-1"><Utensils size={10}/> 晚餐</span>}
                                            </div>
                                            {/* Fix: Wrap item.stayDetails.cost in Number() for comparison */}
                                            {(Number(item.stayDetails.cost) || 0) > 0 && <div className="text-right text-[10px] font-black text-sage">費用: {item.stayDetails.currency} {Number(item.stayDetails.cost).toLocaleString()}</div>}
                                        </div>
                                    )}

                                    {/* Car Rental Info */}
                                    {item.type === 'transport' && item.carRental?.hasRental && (
                                        <div className="bg-blue-50/30 p-3 rounded-2xl border border-blue-100/50 space-y-2">
                                            <div className="flex justify-between items-center border-b border-blue-100/50 pb-2">
                                                <div className="flex items-center gap-2"><Car size={14} className="text-blue-600"/><span className="text-sm font-black text-cocoa">{item.carRental.company} - {item.carRental.carModel}</span></div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-[11px] font-bold text-gray-500">
                                                {/* Fix: Using Clock from lucide-react */}
                                                <div className="flex items-center gap-1"><Clock size={12} className="text-gray-300"/>取車: {item.carRental.pickupTime}</div>
                                                <div className="flex items-center gap-1"><Clock size={12} className="text-gray-300"/>還車: {item.carRental.returnTime}</div>
                                                {/* Fix: Wrap item.carRental fields in Number() for comparison */}
                                                {(Number(item.carRental.estimatedFuelCost) || 0) > 0 && <div className="flex items-center gap-1 col-span-2"><Fuel size={12} className="text-orange-400"/>預估油資: {item.carRental.fuelCurrency} {Number(item.carRental.estimatedFuelCost).toLocaleString()}</div>}
                                            </div>
                                            {(Number(item.carRental.rentalCost) || 0) > 0 && <div className="text-right text-[10px] font-black text-sage">租金: {item.carRental.rentalCurrency} {Number(item.carRental.rentalCost).toLocaleString()}</div>}
                                        </div>
                                    )}

                                    {/* Spot/Food Expense Info */}
                                    {(item.type === 'spot' || item.type === 'food') && item.spotDetails?.hasTicket && (
                                        <div className="bg-white p-3 rounded-2xl border border-beige-dark flex justify-between items-center">
                                            <div className="flex items-center gap-2"><Ticket size={14} className="text-sage"/><span className="text-xs font-bold text-cocoa">{item.type === 'food' ? '餐飲支出' : '預訂門票'}</span></div>
                                            <span className="text-sm font-black text-sage font-mono">{item.spotDetails.currency} {Number(item.spotDetails.ticketCost).toLocaleString()}</span>
                                        </div>
                                    )}

                                    {item.notes && (
                                        <div className="flex gap-2 items-start bg-yellow-50/50 p-2 rounded-xl border border-yellow-100/50"><StickyNote size={14} className="text-yellow-400 mt-0.5" /><p className="text-xs font-bold text-gray-500 whitespace-pre-wrap">{item.notes}</p></div>
                                    )}

                                    {participantNames && (
                                        <div className="mt-2 pt-2 border-t border-dashed border-gray-200 flex items-start gap-2"><Users size={12} className="text-gray-400 mt-0.5" /><div className="flex flex-col"><span className="text-[9px] font-black text-gray-400 uppercase">MEMBERS</span><span className="text-xs font-bold text-cocoa">{participantNames}</span></div></div>
                                    )}
                                </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
               </div>
              <button onClick={() => { setEditingItem(null); setIsAddModalOpen(true); }} className="fixed bottom-24 right-5 bg-cocoa text-white shadow-hard-sage active:translate-y-1 active:shadow-none z-30 flex items-center gap-2 px-4 py-3 rounded-[2rem] border-2 border-cocoa"><Plus size={20} strokeWidth={3} /><span className="font-bold tracking-widest text-base">新增</span></button>
              <AddScheduleModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSave={handleSaveItem} initialData={editingItem} currencies={currencies} members={members} currentDate={selectedDate} />
              <DeleteItemConfirmModal isOpen={!!itemToDelete} onClose={() => setItemToDelete(null)} onConfirm={confirmDeleteItem} title={scheduleItems.find(i => i.id === itemToDelete)?.title || '此項目'} />
              <PotentialExpensesModal isOpen={isPotentialModalOpen} onClose={() => setIsPotentialModalOpen(false)} items={scheduleItems} currencies={currencies} members={members} />
              <EditDayDetailsModal isOpen={isEditDayModalOpen} onClose={() => setIsEditDayModalOpen(false)} onConfirm={handleUpdateDayDetails} initialDate={selectedDate} initialLocation={currentLocation} />
              <DeleteDayConfirmModal isOpen={isDeleteDayModalOpen} onClose={() => setIsDeleteDayModalOpen(false)} onConfirm={confirmDeleteDay} date={selectedDate} />
              <TripSettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} currencies={currencies} onAddCurrency={addCurrency} onRemoveCurrency={removeCurrency} onClearData={handleClearData} />
            </div>
          )}
          {activeTab === 'bookings' && (<BookingsView flights={bookingFlights} accommodations={bookingAccommodations} carRental={bookingCarRental} tickets={bookingTickets} currencies={currencies} members={members} onAddFlight={handleAddFlight} onUpdateFlight={(f) => updateTripField(currentTripId, 'flights', bookingFlights.map(x => x.id === f.id ? f : x))} onDeleteFlight={handleDeleteFlight} onAddAccommodation={(a) => addTripItem(currentTripId, 'accommodations', a)} onUpdateAccommodation={(a) => updateTripField(currentTripId, 'accommodations', bookingAccommodations.map(x => x.id === a.id ? a : x))} onDeleteAccommodation={(id) => updateTripField(currentTripId, 'accommodations', bookingAccommodations.filter(x => x.id !== id))} onUpdateCar={(c) => updateTripField(currentTripId, 'carRental', c)} onAddTicket={(t) => addTripItem(currentTripId, 'tickets', t)} onUpdateTicket={(t) => updateTripField(currentTripId, 'tickets', bookingTickets.map(x => x.id === t.id ? t : x))} onDeleteTicket={(id) => updateTripField(currentTripId, 'tickets', bookingTickets.filter(x => x.id !== id))} />)}
          {activeTab === 'expense' && (<ExpensesView expenses={expenses} members={members} currencies={currencies} onAdd={handleAddExpense} onUpdate={handleUpdateExpense} onDelete={handleDeleteExpense} onShowToast={(m, t) => { if (t === 'error') alert(m); }} />)}
          {activeTab === 'journal' && (<JournalView journals={journals} members={members} onAdd={handleAddJournal} onUpdate={handleUpdateJournal} onDelete={handleDeleteJournal} />)}
          {activeTab === 'planning' && (<PlanningView lists={planningLists} members={members} onAdd={handleAddPlanning} onToggle={handleTogglePlanning} onUpdate={handleUpdatePlanning} onDelete={handleDeletePlanning} />)}
          {activeTab === 'members' && (<MembersView members={members} scheduleItems={scheduleItems} currencies={currencies} onAdd={handleAddMember} onUpdate={handleUpdateMember} onDelete={handleDeleteMember} />)}
        </main>
        <BottomNav activeTab={activeTab} setTab={setActiveTab} />
      </div>
    </div>
  );
}
