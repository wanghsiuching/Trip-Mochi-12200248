import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Tab, ViewState, TripDay, TripDate, ScheduleItem, Member, Currency, 
  BookingFlight, BookingAccommodation, BookingCarRental, BookingTicket, 
  Expense, Journal, TodoItem, THEME 
} from './types';
import { 
  subscribeToTrip, createTrip, joinTripByCode, 
  addTripItem, updateTripField, duplicateTrip 
} from './services/tripService';
import { ScheduleView } from './components/ScheduleView';
import { BookingsView } from './components/BookingsView';
import { ExpensesView } from './components/ExpensesView';
import { JournalView } from './components/JournalView';
import { PlanningView } from './components/PlanningView';
import { MembersView } from './components/MembersView';
import { BottomNav } from './components/UI';
import { CreateTripModal, TripSettingsModal } from './components/Modals';
import { 
  Settings, ArrowRight, Loader, MapPin, Calendar as CalendarIcon, 
  Search, Plus 
} from 'lucide-react';

const Toast = ({ message, type }: { message: string, type: 'success' | 'error' }) => (
  <div className={`fixed top-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl shadow-xl z-[200] animate-fade-in-down font-black text-sm border-2 ${type === 'success' ? 'bg-sage text-white border-sage-dark' : 'bg-red-50 text-red-500 border-red-100'}`}>
    {message}
  </div>
);

export default function App() {
  // State
  const [view, setView] = useState<ViewState>('landing');
  const [loading, setLoading] = useState(false);
  const [currentTripId, setCurrentTripId] = useState<string>('');
  const [currentTripName, setCurrentTripName] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('schedule');
  
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Trip Data State
  const [tripDays, setTripDays] = useState<TripDay[]>([]);
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [flights, setFlights] = useState<BookingFlight[]>([]);
  const [accommodations, setAccommodations] = useState<BookingAccommodation[]>([]);
  const [carRentals, setCarRentals] = useState<BookingCarRental[]>([]);
  const [tickets, setTickets] = useState<BookingTicket[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [journals, setJournals] = useState<Journal[]>([]);
  const [planning, setPlanning] = useState<{ todo: TodoItem[]; packing: TodoItem[]; wish: TodoItem[]; shopping: TodoItem[] }>({ todo: [], packing: [], wish: [], shopping: [] });
  const [currencies, setCurrencies] = useState<Currency[]>([]);

  // UI State
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [selectedDate, setSelectedDate] = useState<TripDate | null>(null);

  // Helper: Toast
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Helper: Process Dates
  const processedDates = useMemo<TripDate[]>(() => {
    const weekdays = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
    return tripDays.map((day, index) => {
        const d = new Date(day.date);
        return {
            ...day,
            dayNum: index + 1,
            month: d.getMonth() + 1,
            day: d.getDate(),
            weekday: weekdays[d.getDay()],
            full: day.date
        };
    });
  }, [tripDays]);

  useEffect(() => {
    if (processedDates.length > 0 && !selectedDate) {
        // Select today if in range, otherwise first day
        const today = new Date().toISOString().split('T')[0];
        const found = processedDates.find(d => d.date === today);
        setSelectedDate(found || processedDates[0]);
    } else if (processedDates.length > 0 && selectedDate) {
        // Keep selection valid
        const found = processedDates.find(d => d.date === selectedDate.date);
        if (found) setSelectedDate(found);
    }
  }, [processedDates, selectedDate]);

  // Subscribe to Trip Data
  useEffect(() => {
    if (!currentTripId) return;

    const unsubscribe = subscribeToTrip(currentTripId, (data) => {
      if (data) {
        setCurrentTripName(data.name);
        setTripDays(data.tripDays || []);
        setScheduleItems(data.scheduleItems || []);
        setMembers(data.members || []);
        setFlights(data.flights || []);
        setAccommodations(data.accommodations || []);
        setCarRentals(data.carRentals || []);
        setTickets(data.tickets || []);
        setExpenses(data.expenses || []);
        setJournals(data.journals || []);
        setPlanning(data.planning || { todo: [], packing: [], wish: [], shopping: [] });
        setCurrencies(data.currencies || []);
      }
    });

    return () => unsubscribe();
  }, [currentTripId]);

  // Handlers
  const handleJoinTrip = async () => {
    if (!joinCode.trim()) return;
    setLoading(true);
    try {
      const tripData = await joinTripByCode(joinCode);
      setCurrentTripId(tripData.id);
      setView('app');
      showToast('成功加入行程！');
      // Save to local storage for persistence could be added here
    } catch (error: any) {
      showToast(error.message || '加入失敗', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTrip = async (name: string) => {
    setLoading(true);
    try {
      const code = await createTrip(name);
      setCurrentTripId(code);
      setIsCreateModalOpen(false);
      setView('app');
      showToast('行程建立成功！');
    } catch (error: any) {
      showToast(error.message || '建立失敗', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicateTrip = async () => {
    if(!currentTripId) return;
    setLoading(true);
    try {
       const newCode = await duplicateTrip(currentTripId);
       setCurrentTripId(newCode);
       setIsSettingsModalOpen(false);
       showToast(`已建立副本 (代碼: ${newCode})`);
    } catch(e) {
       showToast("建立副本失敗", "error");
    } finally {
       setLoading(false);
    }
  };

  // Generic Update Handler for Arrays
  const updateList = async (field: string, list: any[]) => {
      if (!currentTripId) return;
      try {
          await updateTripField(currentTripId, field, list);
      } catch (e) {
          showToast("更新失敗", "error");
      }
  };

  // Schedule View Handlers
  const handleSaveSchedule = async (item: ScheduleItem) => {
      if (!currentTripId) return;
      const exists = scheduleItems.find(i => i.id === item.id);
      if (exists) {
          const updated = scheduleItems.map(i => i.id === item.id ? item : i);
          await updateList('scheduleItems', updated);
      } else {
          await addTripItem(currentTripId, 'scheduleItems', item);
      }
      showToast('行程已儲存');
  };

  const handleDeleteSchedule = async (id: string) => {
      const updated = scheduleItems.filter(i => i.id !== id);
      await updateList('scheduleItems', updated);
      showToast('行程已刪除');
  };

  // Bookings Handlers (Generic pattern)
  const handleSaveBooking = async (field: string, items: any[], item: any) => {
      const exists = items.find(i => i.id === item.id);
      if (exists) {
          const updated = items.map(i => i.id === item.id ? item : i);
          await updateList(field, updated);
      } else {
          await addTripItem(currentTripId, field, item);
      }
      showToast('預訂已更新');
  };

  const handleDeleteBooking = async (field: string, items: any[], id: number) => {
      const updated = items.filter(i => i.id !== id);
      await updateList(field, updated);
      showToast('預訂已刪除');
  };

  // Planning Handlers
  const handleAddTodo = async (type: 'todo' | 'packing' | 'wish' | 'shopping', text: string, assignee: string | string[], image?: string, note?: string, url?: string) => {
      const newItem: TodoItem = {
          id: Date.now(),
          text,
          done: false,
          assignee,
          image,
          note,
          url,
          comments: []
      };
      const updatedList = [...planning[type], newItem];
      await updateTripField(currentTripId, `planning.${type}`, updatedList);
  };

  const handleToggleTodo = async (type: 'todo' | 'packing' | 'wish' | 'shopping', id: number, memberName?: string) => {
      const updatedList = planning[type].map(item => {
          if (item.id === id) {
              if (memberName) {
                  // Group task toggle logic
                  const currentCompleted = item.completedBy || [];
                  const newCompleted = currentCompleted.includes(memberName) 
                      ? currentCompleted.filter(n => n !== memberName) 
                      : [...currentCompleted, memberName];
                  
                  // Check if all assignees (if array) completed
                  let isFullyDone = false;
                  if (Array.isArray(item.assignee)) {
                      isFullyDone = item.assignee.every(a => newCompleted.includes(a));
                  }
                  
                  return { ...item, completedBy: newCompleted, done: isFullyDone };
              } else {
                  // Single task toggle
                  return { ...item, done: !item.done };
              }
          }
          return item;
      });
      await updateTripField(currentTripId, `planning.${type}`, updatedList);
  };

  const handleUpdateTodo = async (type: 'todo' | 'packing' | 'wish' | 'shopping', id: number, updates: Partial<TodoItem>) => {
      const updatedList = planning[type].map(item => item.id === id ? { ...item, ...updates } : item);
      await updateTripField(currentTripId, `planning.${type}`, updatedList);
  };

  const handleDeleteTodo = async (type: 'todo' | 'packing' | 'wish' | 'shopping', id: number) => {
      const updatedList = planning[type].filter(item => item.id !== id);
      await updateTripField(currentTripId, `planning.${type}`, updatedList);
  };

  // Member Handlers
  const handleAddMember = async (name: string, avatar: string | null) => {
      const newMember: Member = { id: Date.now().toString(), name, avatar, fruit: '🍎' };
      await addTripItem(currentTripId, 'members', newMember);
      showToast('成員已新增');
  };

  const handleUpdateMember = async (member: Member) => {
      const updated = members.map(m => m.id === member.id ? member : m);
      await updateList('members', updated);
      showToast('成員資料已更新');
  };

  const handleDeleteMember = async (id: string) => {
      const updated = members.filter(m => m.id !== id);
      await updateList('members', updated);
      showToast('成員已移除');
  };

  // Currency Handlers
  const handleAddCurrency = async (currency: Currency) => {
      const updated = [...currencies.filter(c => c.code !== currency.code), currency];
      await updateList('currencies', updated);
  };
  
  const handleRemoveCurrency = async (code: string) => {
      const updated = currencies.filter(c => c.code !== code);
      await updateList('currencies', updated);
  };

  if (view === 'landing') {
    return (
      <div className={`min-h-screen ${THEME.colors.bg} flex flex-col items-center justify-center p-6 relative overflow-hidden`}>
        {toast && <Toast message={toast.message} type={toast.type} />}
        
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10 pointer-events-none">
           <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-sage rounded-full blur-[100px]"></div>
           <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-orange-200 rounded-full blur-[100px]"></div>
        </div>

        <div className="w-full max-w-sm relative z-10">
          <div className="text-center mb-12">
            <div className="inline-block p-4 rounded-[2rem] bg-white border-2 border-beige-dark shadow-hard mb-4">
               <MapPin size={40} className="text-sage" strokeWidth={2.5}/>
            </div>
            <h1 className="text-4xl font-black text-cocoa mb-2 tracking-tight">Trip Mochi</h1>
            <p className="text-gray-400 font-bold text-sm">與朋友共同規劃美好旅程</p>
          </div>

          <div className="space-y-4">
            <div className="bg-white p-2 rounded-[2rem] shadow-hard border-2 border-beige-dark flex items-center">
               <div className="w-12 h-12 rounded-full bg-beige flex items-center justify-center text-gray-400 border border-beige-dark">
                  <Search size={20}/>
               </div>
               <input 
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="輸入行程代碼"
                  className="flex-1 bg-transparent px-4 font-black text-cocoa placeholder-gray-300 outline-none text-lg uppercase tracking-wider"
               />
               <button 
                  onClick={handleJoinTrip}
                  disabled={!joinCode || loading}
                  className="w-12 h-12 rounded-full bg-sage text-white flex items-center justify-center shadow-md active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
               >
                  {loading ? <Loader size={20} className="animate-spin"/> : <ArrowRight size={20} strokeWidth={3}/>}
               </button>
            </div>

            <div className="relative text-center">
               <span className="bg-beige px-2 text-xs font-bold text-gray-400 relative z-10">OR</span>
               <div className="absolute top-1/2 left-0 w-full h-0.5 bg-beige-dark opacity-20 -z-0"></div>
            </div>

            <button 
               onClick={() => setIsCreateModalOpen(true)}
               className="w-full py-4 bg-white rounded-[2rem] font-black text-cocoa border-2 border-beige-dark shadow-hard hover:-translate-y-1 transition-all flex items-center justify-center gap-2 group"
            >
               <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300 text-sage"/> 建立新行程
            </button>
          </div>
        </div>

        <CreateTripModal 
           isOpen={isCreateModalOpen} 
           onClose={() => setIsCreateModalOpen(false)} 
           onConfirm={handleCreateTrip}
        />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${THEME.colors.bg} lg:flex lg:justify-center`}>
      {toast && <Toast message={toast.message} type={toast.type} />}

      {/* Main Content Container */}
      <div className="w-full max-w-md lg:max-w-4xl lg:flex lg:gap-8 lg:p-8 min-h-screen bg-beige lg:bg-transparent relative">
         
         {/* Desktop Sidebar (Optional, simple nav for now) */}
         
         <div className="flex-1 flex flex-col h-full">
            {/* Top Bar */}
            <header className="sticky top-0 z-20 bg-beige/90 backdrop-blur-md px-4 py-4 lg:rounded-2xl lg:mb-4 lg:bg-white lg:shadow-sm lg:border-2 lg:border-beige-dark flex justify-between items-center">
                <div>
                   <h1 className="text-xl font-black text-cocoa flex items-center gap-2">
                      {currentTripName}
                      <span className="text-[10px] bg-sage text-white px-2 py-0.5 rounded-full tracking-widest font-mono opacity-80">{currentTripId}</span>
                   </h1>
                </div>
                <button onClick={() => setIsSettingsModalOpen(true)} className="p-2 bg-white rounded-full text-gray-400 hover:text-cocoa border border-beige-dark shadow-sm transition-colors">
                   <Settings size={20}/>
                </button>
            </header>

            {/* Views */}
            <main className="flex-1 pb-24 lg:pb-0 relative">
               {activeTab === 'schedule' && selectedDate && (
                 <ScheduleView 
                    dates={processedDates}
                    selectedDate={selectedDate}
                    onSelectDate={setSelectedDate}
                    itinerary={scheduleItems.filter(i => i.date === (selectedDate.full || selectedDate.date))}
                    onSave={handleSaveSchedule}
                    onDelete={handleDeleteSchedule}
                    tripStatus="during" // Should calculate based on date
                    countdownDays={0}
                    countdownHours={0}
                    countdownProgress={100}
                    currentDayNum={selectedDate.dayNum}
                    tripProgress={50}
                 />
               )}

               {activeTab === 'bookings' && (
                  <BookingsView 
                     flights={flights}
                     accommodations={accommodations}
                     carRentals={carRentals}
                     tickets={tickets}
                     currencies={currencies}
                     members={members}
                     onAddFlight={f => handleSaveBooking('flights', flights, f)}
                     onUpdateFlight={f => handleSaveBooking('flights', flights, f)}
                     onDeleteFlight={id => handleDeleteBooking('flights', flights, id)}
                     onAddAccommodation={a => handleSaveBooking('accommodations', accommodations, a)}
                     onUpdateAccommodation={a => handleSaveBooking('accommodations', accommodations, a)}
                     onDeleteAccommodation={id => handleDeleteBooking('accommodations', accommodations, id)}
                     onAddCar={c => handleSaveBooking('carRentals', carRentals, c)}
                     onUpdateCar={c => handleSaveBooking('carRentals', carRentals, c)}
                     onDeleteCar={id => handleDeleteBooking('carRentals', carRentals, id)}
                     onAddTicket={t => handleSaveBooking('tickets', tickets, t)}
                     onUpdateTicket={t => handleSaveBooking('tickets', tickets, t)}
                     onDeleteTicket={id => handleDeleteBooking('tickets', tickets, id)}
                  />
               )}

               {activeTab === 'expense' && (
                  <ExpensesView 
                     expenses={expenses}
                     members={members}
                     currencies={currencies}
                     onAdd={e => handleSaveBooking('expenses', expenses, { ...e, id: Date.now() })}
                     onUpdate={e => handleSaveBooking('expenses', expenses, e)}
                     onDelete={id => handleDeleteBooking('expenses', expenses, id)}
                     onShowToast={(msg, type) => showToast(msg, type)}
                  />
               )}

               {activeTab === 'journal' && (
                  <JournalView 
                     journals={journals}
                     members={members}
                     onAdd={j => handleSaveBooking('journals', journals, j)}
                     onUpdate={j => handleSaveBooking('journals', journals, j)}
                     onDelete={id => handleDeleteBooking('journals', journals, id)}
                  />
               )}

               {activeTab === 'planning' && (
                  <PlanningView 
                     lists={planning}
                     members={members}
                     onAdd={handleAddTodo}
                     onToggle={handleToggleTodo}
                     onUpdate={handleUpdateTodo}
                     onDelete={handleDeleteTodo}
                  />
               )}

               {activeTab === 'members' && (
                  <MembersView 
                     members={members}
                     scheduleItems={scheduleItems}
                     currencies={currencies}
                     onAdd={handleAddMember}
                     onUpdate={handleUpdateMember}
                     onDelete={handleDeleteMember}
                     onJumpToSchedule={(date, id) => {
                        const targetDate = processedDates.find(d => d.date === date);
                        if (targetDate) {
                            setSelectedDate(targetDate);
                            setActiveTab('schedule');
                            // Logic to scroll to item could be added via ref or context
                        }
                     }}
                  />
               )}
            </main>

            <BottomNav activeTab={activeTab} setTab={setActiveTab} />
         </div>
      </div>

      <TripSettingsModal 
         isOpen={isSettingsModalOpen}
         onClose={() => setIsSettingsModalOpen(false)}
         currencies={currencies}
         onAddCurrency={handleAddCurrency}
         onRemoveCurrency={handleRemoveCurrency}
         onDuplicate={handleDuplicateTrip}
      />
    </div>
  );
}