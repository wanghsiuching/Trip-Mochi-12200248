import React, { useState, useEffect, useRef } from 'react';
import { 
  Plane, Plus, ArrowRight, BookOpen, Trash2, ChevronLeft, Copy, Settings, 
  CalendarCheck, Coins, Edit3 
} from 'lucide-react';
import { 
  TripDay, ScheduleItem, Member, SavedTrip, Currency, 
  BookingFlight, BookingAccommodation, BookingCarRental, BookingTicket,
  Expense, Journal, TodoItem, THEME, ViewState, Tab, TripDate
} from './types';
import { 
  createTrip, joinTripByCode, subscribeToTrip, updateTripField, 
  addTripItem 
} from './services/tripService';
import { BottomNav } from './components/UI';
import { 
  CreateTripModal, DeleteConfirmModal, SearchErrorModal, TripSettingsModal, 
  EditDayDetailsModal, DeleteDayConfirmModal, PotentialExpensesModal 
} from './components/Modals';
import { ScheduleView } from './components/ScheduleView';
import { BookingsView } from './components/BookingsView';
import { ExpensesView } from './components/ExpensesView';
import { JournalView } from './components/JournalView';
import { PlanningView } from './components/PlanningView';
import { MembersView } from './components/MembersView';

const App = () => {
  // State definitions
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<ViewState>('landing');
  const [activeTab, setActiveTab] = useState<Tab>('schedule');
  const [currentTripId, setCurrentTripId] = useState('');
  const [currentTripName, setCurrentTripName] = useState('');
  const [savedTrips, setSavedTrips] = useState<SavedTrip[]>([]);
  
  // Trip Data
  const [tripDays, setTripDays] = useState<TripDay[]>([]);
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [flights, setFlights] = useState<BookingFlight[]>([]);
  const [accommodations, setAccommodations] = useState<BookingAccommodation[]>([]);
  const [carRentals, setCarRentals] = useState<BookingCarRental[]>([]);
  const [tickets, setTickets] = useState<BookingTicket[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [journals, setJournals] = useState<Journal[]>([]);
  const [planning, setPlanning] = useState<{ todo: TodoItem[]; packing: TodoItem[]; wish: TodoItem[]; shopping: TodoItem[] }>({ todo: [], packing: [], wish: [], shopping: [] });

  // UI State
  const [selectedDate, setSelectedDate] = useState('');
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deleteModalTarget, setDeleteModalTarget] = useState<string | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [isEditDayModalOpen, setIsEditDayModalOpen] = useState(false);
  const [isDeleteDayModalOpen, setIsDeleteDayModalOpen] = useState(false);
  const [isPotentialModalOpen, setIsPotentialModalOpen] = useState(false);

  // Load saved trips on mount
  useEffect(() => {
    const saved = localStorage.getItem('tripmochi_saved_trips');
    if (saved) {
      setSavedTrips(JSON.parse(saved));
    }
  }, []);

  // Update localStorage when savedTrips changes
  useEffect(() => {
    localStorage.setItem('tripmochi_saved_trips', JSON.stringify(savedTrips));
  }, [savedTrips]);

  // Subscribe to trip updates
  useEffect(() => {
    if (currentTripId) {
        const unsubscribe = subscribeToTrip(currentTripId, (data) => {
            if (data) {
                setCurrentTripName(data.name);
                setTripDays(data.tripDays || []);
                setScheduleItems(data.scheduleItems || []);
                setMembers(data.members || []);
                setCurrencies(data.currencies || []);
                setFlights(data.flights || []);
                setAccommodations(data.accommodations || []);
                setCarRentals(data.carRentals || []);
                setTickets(data.tickets || []);
                setExpenses(data.expenses || []);
                setJournals(data.journals || []);
                setPlanning(data.planning || { todo: [], packing: [], wish: [], shopping: [] });
                
                // Set initial selected date if not set
                if (!selectedDate && data.tripDays && data.tripDays.length > 0) {
                    setSelectedDate(data.tripDays[0].date);
                }
            }
        });
        return () => unsubscribe();
    }
  }, [currentTripId]);

  // Handlers
  const handleCreateTrip = async (name: string) => {
      setLoading(true);
      try {
          const newId = await createTrip(name);
          const newTrip = { id: newId, name, date: new Date().toISOString() };
          setSavedTrips(prev => [...prev, newTrip]);
          openTrip(newId, name);
          setIsCreateModalOpen(false);
      } catch (err) {
          console.error(err);
      } finally {
          setLoading(false);
      }
  };

  const handleJoinTrip = async (code: string) => {
      if (!code) return;
      setLoading(true);
      try {
          const data = await joinTripByCode(code);
          const exists = savedTrips.find(t => t.id === data.id);
          if (!exists) {
              setSavedTrips(prev => [...prev, { id: data.id, name: data.name, date: new Date().toISOString() }]);
          }
          openTrip(data.id, data.name);
      } catch (err: any) {
          setSearchError(err.message || "找不到行程");
      } finally {
          setLoading(false);
      }
  };

  const openTrip = (id: string, name: string) => {
      setCurrentTripId(id);
      setCurrentTripName(name);
      setView('app');
  };

  const handleDeleteTrip = () => {
      if (deleteModalTarget) {
          setSavedTrips(prev => prev.filter(t => t.id !== deleteModalTarget));
          setDeleteModalTarget(null);
      }
  };

  const handleBackToHome = () => {
      setView('landing');
      setCurrentTripId('');
  };

  const handleShare = () => {
      navigator.clipboard.writeText(currentTripId);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
  };

  const handleAddDay = () => {
      const lastDay = tripDays.length > 0 ? new Date(tripDays[tripDays.length - 1].date) : new Date();
      const nextDay = new Date(lastDay);
      nextDay.setDate(lastDay.getDate() + 1);
      const newDateStr = nextDay.toISOString().split('T')[0];
      const newDays = [...tripDays, { date: newDateStr, location: `Day ${tripDays.length + 1}` }];
      updateTripField(currentTripId, 'tripDays', newDays);
  };

  // --- Enhanced Reordering Logic ---
  const [swappingFromIndex, setSwappingFromIndex] = useState<number | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ignoreClickRef = useRef(false);
  const touchStartPos = useRef<{ x: number, y: number } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleSwapLogic = (idx1: number, idx2: number) => {
    if (idx1 === idx2) return;

    const newTripDays = [...tripDays];
    const day1 = { ...newTripDays[idx1] };
    const day2 = { ...newTripDays[idx2] };
    
    const date1 = day1.date;
    const date2 = day2.date;

    // Swap logical contents (locations, fruit) but keep the original dates at their respective positions
    newTripDays[idx1] = { ...day2, date: date1 };
    newTripDays[idx2] = { ...day1, date: date2 };

    // Update all schedule items to follow their day contents to the new date
    const updatedScheduleItems = scheduleItems.map(item => {
        if (item.date === date1) return { ...item, date: date2 };
        if (item.date === date2) return { ...item, date: date1 };
        return item;
    });

    updateTripField(currentTripId, 'tripDays', newTripDays);
    updateTripField(currentTripId, 'scheduleItems', updatedScheduleItems);
    
    // Switch view to the date we just moved the content to
    setSelectedDate(date2);

    if (window.navigator.vibrate) window.navigator.vibrate([30, 50, 30]);
  };

  const handleDayTouchStart = (idx: number, e: React.TouchEvent | React.MouseEvent) => {
    ignoreClickRef.current = false;
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    
    let clientX, clientY;
    if ('touches' in e) {
         clientX = e.touches[0].clientX;
         clientY = e.touches[0].clientY;
    } else {
         clientX = (e as React.MouseEvent).clientX;
         clientY = (e as React.MouseEvent).clientY;
    }
    touchStartPos.current = { x: clientX, y: clientY };

    longPressTimer.current = setTimeout(() => {
        setSwappingFromIndex(idx);
        ignoreClickRef.current = true;
        if (window.navigator.vibrate) window.navigator.vibrate(80);
    }, 600);
  };

  const handleDayTouchEnd = () => {
    if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
    }
    touchStartPos.current = null;
  };

  const handleDayTouchMove = (e: React.TouchEvent) => {
      if (longPressTimer.current && touchStartPos.current) {
          const touch = e.touches[0];
          const moveX = Math.abs(touch.clientX - touchStartPos.current.x);
          const moveY = Math.abs(touch.clientY - touchStartPos.current.y);
          
          if (moveX > 10 || moveY > 10) {
              clearTimeout(longPressTimer.current);
              longPressTimer.current = null;
          }
      }
  };

  const handleDayItemClick = (idx: number, dateStr: string) => {
    if (ignoreClickRef.current) {
        ignoreClickRef.current = false;
        return;
    }

    if (swappingFromIndex !== null) {
        if (swappingFromIndex === idx) {
            setSwappingFromIndex(null);
        } else {
            handleSwapLogic(swappingFromIndex, idx);
            setSwappingFromIndex(null);
        }
    } else {
        setSelectedDate(dateStr);
    }
  };

  const handleJumpToSchedule = (date: string, itemId: string) => {
      setActiveTab('schedule');
      setSelectedDate(date);
      // Logic to scroll to item can be added in ScheduleView using useEffect and props
  };

  // Derived Dates with Metadata
  const dates: TripDate[] = tripDays.map((d, i) => {
      const dateObj = new Date(d.date);
      const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return {
          ...d,
          dayNum: i + 1,
          month: dateObj.getMonth() + 1,
          day: dateObj.getDate(),
          weekday: weekdays[dateObj.getDay()],
          full: d.date
      };
  });

  const currentDayData = tripDays.find(d => d.date === selectedDate);
  const currentFruit = currentDayData?.fruit || '📅';
  const currentLocation = currentDayData?.location || '未定地點';

  // Render Logic
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

  const currentTripDateObj = dates.find(d => d.date === selectedDate);
  const scheduleProps = {
    dates, 
    selectedDate: currentTripDateObj || dates[0], 
    onSelectDate: (d: TripDate) => setSelectedDate(d.date),
    itinerary: scheduleItems.filter(i => i.date === selectedDate).sort((a,b) => a.time.localeCompare(b.time)),
    onSave: (item: ScheduleItem) => {
        if(item.id && scheduleItems.find(s => s.id === item.id)) {
            const updated = scheduleItems.map(s => s.id === item.id ? item : s);
            updateTripField(currentTripId, 'scheduleItems', updated);
        } else {
            addTripItem(currentTripId, 'scheduleItems', item);
        }
    },
    onDelete: (id: string) => updateTripField(currentTripId, 'scheduleItems', scheduleItems.filter(s => s.id !== id)),
    tripStatus: 'during' as const,
    countdownDays: 0, countdownHours: 0, countdownProgress: 0, currentDayNum: 1, tripProgress: 0
  };

  return (
    <div className={`min-h-screen ${THEME.colors.bg}`}>
      <div className="max-w-md mx-auto min-h-screen relative shadow-2xl bg-beige overflow-hidden">
        <header className="px-6 pt-12 pb-2 flex justify-between items-start bg-beige">
          <div className="flex flex-col">
            <button onClick={handleBackToHome} className="flex items-center gap-1 text-sm font-bold text-gray-400 mb-3"><ChevronLeft size={16} strokeWidth={3}/> 返回首頁</button>
            <h1 className="text-3xl font-black text-cocoa tracking-tight">{currentTripName}</h1>
            <div onClick={handleShare} className="flex items-center gap-2 mt-2 cursor-pointer group"><span className="text-xs font-bold text-sage bg-white px-3 py-1.5 rounded-lg border-2 border-beige-dark group-hover:border-sage flex items-center gap-2 shadow-hard-sm">Code: {currentTripId} <Copy size={12} /></span>{copyFeedback && <span className="text-xs text-sage font-bold animate-pulse bg-white px-2 py-1 rounded-lg">已複製代碼！</span>}</div>
          </div>
          <div className="flex items-center gap-3 pt-6">
            {activeTab === 'schedule' && (
              <button onClick={() => setIsSettingsModalOpen(true)} className="p-3 bg-white rounded-full shadow-hard-sm border-2 border-beige-dark text-gray-400 hover:text-sage"><Settings size={20} strokeWidth={2.5} /></button>
            )}
          </div>
        </header>

        <main className="min-h-[calc(100vh-160px)]">
          {activeTab === 'schedule' && (
            <div className="space-y-6 pb-24 relative">
              <div className="lg:hidden sticky top-0 z-30 bg-beige/85 backdrop-blur-md border-b border-[#E0E5D5]/50 px-4 pb-2 pt-1">
                 <div className="flex items-center justify-between mb-2 px-1">
                    <button onClick={() => setIsEditDayModalOpen(true)} className="text-sm font-black text-cocoa flex items-center gap-1.5"><CalendarCheck size={14} className="text-sage" /> 行程日期 <Edit3 size={10} className="text-gray-300"/></button>
                    <div className="flex items-center gap-2">{tripDays.length > 1 && <button onClick={() => setIsDeleteDayModalOpen(true)} className="p-1.5 bg-red-100 text-red-500 rounded-full border border-red-200"><Trash2 size={12} /></button>}<button onClick={() => setIsEditDayModalOpen(true)} className="text-[10px] font-bold px-2 py-1 rounded-full border bg-white border-[#E0E5D5] text-cocoa flex items-center gap-1 shadow-sm"><span>{currentFruit} {currentLocation}</span></button></div>
                 </div>
                 
                 <div ref={scrollRef} className="flex space-x-2 overflow-x-auto no-scrollbar pb-1 snap-x touch-pan-x">
                   {dates.map((date, idx) => {
                     const isSelected = selectedDate === date.date;
                     const isSwapping = swappingFromIndex === idx;
                     const isPotentialTarget = swappingFromIndex !== null && swappingFromIndex !== idx;

                     return (
                        <div 
                            key={date.date} 
                            data-day-index={idx}
                            onTouchStart={(e) => handleDayTouchStart(idx, e)}
                            onTouchMove={handleDayTouchMove}
                            onTouchEnd={handleDayTouchEnd}
                            onMouseDown={(e) => handleDayTouchStart(idx, e as any)}
                            onMouseUp={handleDayTouchEnd}
                            onClick={() => handleDayItemClick(idx, date.date)}
                            className={`flex-shrink-0 flex flex-col items-center justify-center w-[3.5rem] h-16 rounded-2xl transition-all snap-center cursor-pointer relative overflow-hidden select-none
                                ${isSwapping ? 'animate-pulse bg-orange-100 border-orange-400 scale-110 shadow-lg border-2 z-20' : 
                                  isPotentialTarget ? 'bg-white border-dashed border-orange-200 opacity-90 scale-95' :
                                  isSelected ? `bg-sage shadow-hard-sm-sage border-sage text-white scale-105 border-2` : 
                                  'bg-white border-2 border-[#E0E5D5] text-gray-400 hover:border-sage'}`}
                        >
                            {isSwapping && (
                                <div className="absolute top-0 left-0 w-full bg-orange-400 text-white text-[7px] font-black text-center py-0.5 uppercase tracking-tighter shadow-sm z-30">
                                    對調中
                                </div>
                            )}
                            <span className={`text-[9px] font-black uppercase mb-0.5 ${isSelected ? 'opacity-90' : 'text-[#B0A590]'}`}>Day {date.dayNum}</span>
                            <span className="text-lg font-black leading-none">{date.day}</span>
                            <span className={`text-[10px] font-bold mt-0.5 ${isSelected ? 'opacity-80' : 'opacity-60'}`}>{date.weekday}</span>
                        </div>
                     );
                   })}
                   <button onClick={handleAddDay} className="flex-shrink-0 flex flex-col items-center justify-center w-[3.5rem] h-16 rounded-2xl border-2 border-dashed border-[#E0E5D5] text-gray-300 hover:text-sage bg-white/50 snap-center"><Plus size={24} strokeWidth={3} /></button>
                 </div>
                 <div className="mt-2 text-right flex justify-between items-center px-1">
                    <span className="text-[10px] font-black text-gray-400 italic">
                        {swappingFromIndex !== null ? '💡 點擊其他日期來完成對調' : '💡 長按日期方塊後釋放，再點擊目標可對調'}
                    </span>
                    <button onClick={() => setIsPotentialModalOpen(true)} className="bg-yellow-100 text-yellow-600 p-2 rounded-xl border border-yellow-200 shadow-sm text-xs font-bold inline-flex items-center gap-1"><Coins size={12}/> 潛在花費</button>
                 </div>
               </div>
               <ScheduleView {...scheduleProps} />
            </div>
          )}

          {activeTab === 'bookings' && (
              <BookingsView 
                  flights={flights} accommodations={accommodations} carRentals={carRentals} tickets={tickets} currencies={currencies} members={members}
                  onAddFlight={(f) => addTripItem(currentTripId, 'flights', f)}
                  onUpdateFlight={(f) => updateTripField(currentTripId, 'flights', flights.map(x => x.id === f.id ? f : x))}
                  onDeleteFlight={(id) => updateTripField(currentTripId, 'flights', flights.filter(x => x.id !== id))}
                  onAddAccommodation={(a) => addTripItem(currentTripId, 'accommodations', a)}
                  onUpdateAccommodation={(a) => updateTripField(currentTripId, 'accommodations', accommodations.map(x => x.id === a.id ? a : x))}
                  onDeleteAccommodation={(id) => updateTripField(currentTripId, 'accommodations', accommodations.filter(x => x.id !== id))}
                  onAddCar={(c) => addTripItem(currentTripId, 'carRentals', c)}
                  onUpdateCar={(c) => updateTripField(currentTripId, 'carRentals', carRentals.map(x => x.id === c.id ? c : x))}
                  onDeleteCar={(id) => updateTripField(currentTripId, 'carRentals', carRentals.filter(x => x.id !== id))}
                  onAddTicket={(t) => addTripItem(currentTripId, 'tickets', t)}
                  onUpdateTicket={(t) => updateTripField(currentTripId, 'tickets', tickets.map(x => x.id === t.id ? t : x))}
                  onDeleteTicket={(id) => updateTripField(currentTripId, 'tickets', tickets.filter(x => x.id !== id))}
              />
          )}

          {activeTab === 'expense' && (
              <ExpensesView 
                  expenses={expenses} members={members} currencies={currencies}
                  onAdd={(e) => addTripItem(currentTripId, 'expenses', { id: Date.now(), ...e })}
                  onUpdate={(e) => updateTripField(currentTripId, 'expenses', expenses.map(x => x.id === e.id ? e : x))}
                  onDelete={(id) => updateTripField(currentTripId, 'expenses', expenses.filter(x => x.id !== id))}
                  onShowToast={(msg, type) => { /* Toast Implementation */ console.log(msg, type); }}
              />
          )}

          {activeTab === 'journal' && (
              <JournalView 
                  journals={journals} members={members}
                  onAdd={(j) => addTripItem(currentTripId, 'journals', j)}
                  onUpdate={(j) => updateTripField(currentTripId, 'journals', journals.map(x => x.id === j.id ? j : x))}
                  onDelete={(id) => updateTripField(currentTripId, 'journals', journals.filter(x => x.id !== id))}
              />
          )}

          {activeTab === 'planning' && (
              <PlanningView 
                  lists={planning} members={members}
                  onAdd={(type, text, assignee, image, note, url) => {
                      const newItem = { id: Date.now(), text, done: false, assignee, image, note, url, comments: [] };
                      updateTripField(currentTripId, `planning.${type}`, [...(planning[type] || []), newItem]);
                  }}
                  onToggle={(type, id, memberName) => {
                      const list = planning[type] || [];
                      const updated = list.map(item => {
                          if (item.id === id) {
                              if (memberName) {
                                  // For group tasks, toggle specific member completion
                                  const currentCompleted = item.completedBy || [];
                                  const newCompleted = currentCompleted.includes(memberName)
                                      ? currentCompleted.filter(m => m !== memberName)
                                      : [...currentCompleted, memberName];
                                  
                                  // Determine if fully done (all assignees completed)
                                  const assignees = Array.isArray(item.assignee) ? item.assignee : [item.assignee];
                                  const isAllDone = assignees.every(a => newCompleted.includes(a));
                                  return { ...item, completedBy: newCompleted, done: isAllDone };
                              } else {
                                  // Simple toggle for single assignee
                                  return { ...item, done: !item.done };
                              }
                          }
                          return item;
                      });
                      updateTripField(currentTripId, `planning.${type}`, updated);
                  }}
                  onUpdate={(type, id, updates) => {
                      const updated = (planning[type] || []).map(item => item.id === id ? { ...item, ...updates } : item);
                      updateTripField(currentTripId, `planning.${type}`, updated);
                  }}
                  onDelete={(type, id) => {
                      const updated = (planning[type] || []).filter(item => item.id !== id);
                      updateTripField(currentTripId, `planning.${type}`, updated);
                  }}
              />
          )}

          {activeTab === 'members' && (
              <MembersView 
                  members={members} scheduleItems={scheduleItems} currencies={currencies}
                  onAdd={(name, avatar) => addTripItem(currentTripId, 'members', { id: Date.now().toString(), name, avatar, fruit: '🍎' })}
                  onUpdate={(m) => updateTripField(currentTripId, 'members', members.map(x => x.id === m.id ? m : x))}
                  onDelete={(id) => updateTripField(currentTripId, 'members', members.filter(x => x.id !== id))}
                  onJumpToSchedule={handleJumpToSchedule}
              />
          )}
        </main>

        <BottomNav activeTab={activeTab} setTab={setActiveTab} />

        {/* Global Modals */}
        <TripSettingsModal 
            isOpen={isSettingsModalOpen} 
            onClose={() => setIsSettingsModalOpen(false)}
            currencies={currencies}
            onAddCurrency={(c) => updateTripField(currentTripId, 'currencies', [...currencies, c])}
            onRemoveCurrency={(code) => updateTripField(currentTripId, 'currencies', currencies.filter(c => c.code !== code))}
            onDuplicate={async () => {
                // Implementation for duplication (service needed)
            }}
        />
        
        {currentTripDateObj && (
            <EditDayDetailsModal 
                isOpen={isEditDayModalOpen} 
                onClose={() => setIsEditDayModalOpen(false)} 
                onConfirm={(date, loc, fruit) => {
                    const newDays = tripDays.map(d => d.date === selectedDate ? { ...d, date, location: loc, fruit } : d);
                    updateTripField(currentTripId, 'tripDays', newDays);
                    if (date !== selectedDate) {
                        const newSchedule = scheduleItems.map(s => s.date === selectedDate ? { ...s, date } : s);
                        updateTripField(currentTripId, 'scheduleItems', newSchedule);
                        setSelectedDate(date);
                    }
                    setIsEditDayModalOpen(false);
                }}
                initialDate={selectedDate}
                initialLocation={currentLocation}
                initialFruit={currentFruit}
            />
        )}

        <DeleteDayConfirmModal 
            isOpen={isDeleteDayModalOpen} 
            onClose={() => setIsDeleteDayModalOpen(false)} 
            onConfirm={() => {
                const newDays = tripDays.filter(d => d.date !== selectedDate);
                const newSchedule = scheduleItems.filter(s => s.date !== selectedDate);
                updateTripField(currentTripId, 'tripDays', newDays);
                updateTripField(currentTripId, 'scheduleItems', newSchedule);
                if (newDays.length > 0) setSelectedDate(newDays[0].date);
                setIsDeleteDayModalOpen(false);
            }} 
            date={selectedDate}
        />

        <PotentialExpensesModal 
            isOpen={isPotentialModalOpen} 
            onClose={() => setIsPotentialModalOpen(false)} 
            items={scheduleItems} 
            currencies={currencies} 
            members={members}
        />
      </div>
    </div>
  );
};

export default App;