
import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, ArrowRight, Plane, Plus, X, Copy, BookOpen, ChevronLeft, Trash2,
  ChevronUp, ChevronDown, Navigation, StickyNote, Settings, AlertCircle, 
  CalendarCheck, Coins, Edit3, Users, Luggage, Briefcase, Bed, Car, Coffee, Utensils, Fuel, Ticket, Clock,
  Train, Camera, Compass
} from 'lucide-react';

import { 
  Tab, ViewState, ScheduleItem, SavedTrip, Currency, Member, THEME, TripDay,
  BookingFlight, BookingAccommodation, BookingCarRental, BookingTicket, Expense, Journal, TodoItem,
  PocketItem
} from './types';
import { BottomNav } from './components/CommonUI';
import { 
  AddScheduleModal, CreateTripModal, DeleteConfirmModal, SearchErrorModal, DeleteItemConfirmModal, TripSettingsModal, PotentialExpensesModal, EditDayDetailsModal, DeleteDayConfirmModal, BackupConfirmModal, ScheduleDetailModal
} from './components/Modals';
import { PocketPlacesModal } from './components/PocketPlacesModal';
import { TransitLegChainView } from './components/TransitComponents';
import { BookingsView } from './components/BookingsView';
import { ExpensesView } from './components/ExpensesView';
import { JournalView } from './components/JournalView';
import { PlanningView } from './components/PlanningView';
import { MembersView } from './components/MembersView';
import { getDefaultMemberAvatar } from './constants/avatars';
import { createTrip, joinTripByCode, subscribeToTrip, addTripItem, updateTripField, duplicateTrip } from './services/tripService';

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
  const [bookingCarRentals, setBookingCarRentals] = useState<BookingCarRental[]>([]);
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
  const [pocketItems, setPocketItems] = useState<PocketItem[]>([]);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);
  const [viewingItem, setViewingItem] = useState<ScheduleItem | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deleteModalTarget, setDeleteModalTarget] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isPotentialModalOpen, setIsPotentialModalOpen] = useState(false);
  const [isPocketModalOpen, setIsPocketModalOpen] = useState(false);
  const [pocketInitialTab, setPocketInitialTab] = useState<'food' | 'spot'>('food');
  const [isEditDayModalOpen, setIsEditDayModalOpen] = useState(false);
  const [isDeleteDayModalOpen, setIsDeleteDayModalOpen] = useState(false);
  const [isBackupConfirmOpen, setIsBackupConfirmOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [highlightExpenseId, setHighlightExpenseId] = useState<string | null>(null);

  // --- Optimized Swap State ---
  const [swappingFromIndex, setSwappingFromIndex] = useState<number | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggeredAtRef = useRef<number>(0);
  const touchStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const dates = tripDays.map((day, i) => {
    let month = 1;
    let dateNum = 1;
    let weekday = '週一';
    if (day.date) {
      const parts = day.date.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10);
        dateNum = parseInt(parts[2], 10);
        const d = new Date(year, month - 1, dateNum);
        const chineseWeekdays = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
        weekday = chineseWeekdays[d.getDay()] || '週一';
      } else {
        const d = new Date(day.date);
        month = d.getMonth() + 1;
        dateNum = d.getDate();
        const chineseWeekdays = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
        weekday = chineseWeekdays[d.getDay()] || '週一';
      }
    }
    const monthDay = `${month}/${dateNum}`;
    return { ...day, dayNum: i + 1, month, day: dateNum, monthDay, weekday };
  });

  const currentDayObj = tripDays.find(d => d.date === selectedDate);
  const currentLocation = currentDayObj?.location || '旅行地點';
  const currentFruit = currentDayObj?.fruit || '🍎';

  const getACFruit = (str: string) => {
      const fruits = ['🍎', '🍊', '🍐', '🍑', '🍒', '🥥'];
      if (!str) return '✈️';
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
          hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      return fruits[Math.abs(hash) % fruits.length];
  };

  const SCHEDULE_ICONS = [
      '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈',
      '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🥑', '🍆', '🥕',
      '🌽', '🌶️', '🫑', '🥒', '🥬', '🥦', '🍄', '遷', '🌰', '🍠'
  ];

  const getScheduleIcon = (id: string) => {
      let hash = 0;
      for (let i = 0; i < id.length; i++) {
          hash = id.charCodeAt(i) + ((hash << 5) - hash);
      }
      return SCHEDULE_ICONS[Math.abs(hash) % SCHEDULE_ICONS.length];
  };

  const getMemberNames = (ids?: string[]) => {
      if (!ids || ids.length === 0) return '';
      return ids.map(id => members.find(m => m.id === id)?.name).filter(Boolean).join(', ');
  };

  useEffect(() => {
    const storedTrips = localStorage.getItem('trip_mochi_index');
    if (storedTrips) {
      try {
        const parsed = JSON.parse(storedTrips);
        if (Array.isArray(parsed)) {
          // Deduplicate trips by id to avoid duplicate React keys
          const seen = new Set<string>();
          const uniqueTrips: SavedTrip[] = [];
          for (const trip of parsed) {
            if (trip && trip.id && !seen.has(trip.id)) {
              seen.add(trip.id);
              uniqueTrips.push(trip);
            }
          }
          setSavedTrips(uniqueTrips);
        }
      } catch (e) {
        console.error("Failed to parse saved trips", e);
      }
    }
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
          const cars = data.carRentals || (data.carRental && data.carRental.company ? [data.carRental] : []);
          setBookingCarRentals(cars);
          setBookingTickets(data.tickets || []);
          setExpenses(data.expenses || []);
          setJournals(data.journals || []);
          setPlanningLists(data.planning || { todo: [], packing: [], wish: [], shopping: [] });
          setCurrencies(data.currencies || []);
          setMembers(data.members || []);
          setPocketItems(data.pocketItems || []);
          setCurrentTripName(data.name || '未命名行程');
          setLoading(false);
      });
      return () => unsubscribe();
  }, [currentTripId, selectedDate]);

  useEffect(() => {
      if (savedTrips.length > 0) localStorage.setItem('trip_mochi_index', JSON.stringify(savedTrips));
  }, [savedTrips]);

  const handleCreateTrip = async (customName: string) => {
    setIsCreateModalOpen(false); setLoading(true);
    try {
        const newId = await createTrip(customName);
        const today = new Date().toISOString().split('T')[0];
        setSavedTrips(prev => [{ id: newId, name: customName, date: today }, ...prev.filter(t => t.id !== newId)]);
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
        setSavedTrips(prev => [{ id: cleanId, name: tripData.name, date: new Date().toISOString().split('T')[0] }, ...prev.filter(t => t.id !== cleanId)]);
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

  const handleOpenBackupModal = () => {
      setIsBackupConfirmOpen(true);
  };

  const executeBackupTrip = async () => {
    if (!currentTripId) return;
    setLoading(true);
    setIsBackupConfirmOpen(false);
    try {
        const newId = await duplicateTrip(currentTripId);
        const newName = `${currentTripName} (副本)`;
        const today = new Date().toISOString().split('T')[0];
        setSavedTrips(prev => [{ id: newId, name: newName, date: today }, ...prev]);
        setIsSettingsModalOpen(false);
        alert(`行程副本建立成功！代碼：${newId}`);
    } catch(e) {
        console.error(e);
        alert("建立副本失敗");
    } finally {
        setLoading(false);
    }
  }

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
  
  const handleAddMember = (name: string, avatar: string | null) => {
      const fruits = [
          '🍎', '🍏', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', 
          '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🥑', '🍆',
          '🥕', '🌽', '🌶️', '🫑', '🥒', '🥬', '🥦', '🍄', '栗', '🌰'
      ];
      const randomFruit = fruits[Math.floor(Math.random() * fruits.length)];
      const finalAvatar = avatar || getDefaultMemberAvatar(name || `member-${Date.now()}`);
      addTripItem(currentTripId, 'members', { id: Date.now().toString(), name, avatar: finalAvatar, fruit: randomFruit });
  };
  
  const handleUpdateMember = (updated: Member) => updateTripField(currentTripId, 'members', members.map(m => m.id === updated.id ? updated : m));
  const handleDeleteMember = (id: string) => { if (members.length > 1) updateTripField(currentTripId, 'members', members.filter(m => m.id !== id)); };
  
  const handleAddFlight = (flight: BookingFlight) => addTripItem(currentTripId, 'flights', flight);
  const handleUpdateFlight = (updated: BookingFlight) => updateTripField(currentTripId, 'flights', bookingFlights.map(f => String(f.id) === String(updated.id) ? updated : f));
  const handleDeleteFlight = (id: number) => updateTripField(currentTripId, 'flights', bookingFlights.filter(f => String(f.id) !== String(id)));
  
  const handleAddCar = (car: BookingCarRental) => addTripItem(currentTripId, 'carRentals', car);
  const handleUpdateCar = (updated: BookingCarRental) => updateTripField(currentTripId, 'carRentals', bookingCarRentals.map(c => String(c.id) === String(updated.id) ? updated : c));
  const handleDeleteCar = (id: number) => updateTripField(currentTripId, 'carRentals', bookingCarRentals.filter(c => String(c.id) !== String(id)));

  const handleAddPocketItem = (item: Omit<PocketItem, 'id' | 'createdAt'>) => {
    const newItem: PocketItem = {
      ...item,
      id: Date.now().toString(),
      createdAt: Date.now(),
    };
    setPocketItems(prev => {
      const next = [...prev, newItem];
      updateTripField(currentTripId, 'pocketItems', next).catch(err => {
        console.error('Failed to add pocket item:', err);
      });
      return next;
    });
  };

  const handleUpdatePocketItem = (updated: PocketItem) => {
    setPocketItems(prev => {
      const next = prev.map(p => p.id === updated.id ? updated : p);
      updateTripField(currentTripId, 'pocketItems', next).catch(err => {
        console.error('Failed to update pocket item:', err);
      });
      return next;
    });
  };

  const handleDeletePocketItem = (id: string) => {
    setPocketItems(prev => {
      const next = prev.filter(p => p.id !== id);
      updateTripField(currentTripId, 'pocketItems', next).catch(err => {
        console.error('Failed to delete pocket item:', err);
      });
      return next;
    });
  };

  const handleAddToScheduleFromPocket = (item: PocketItem, targetDate: string, time: string) => {
    const newScheduleItem: Omit<ScheduleItem, 'id'> = {
      date: targetDate || selectedDate,
      time: time || '12:00',
      title: item.title,
      type: item.category === 'food' ? 'food' : 'spot',
      location: item.location || item.title,
      notes: item.notes || '',
      address: item.location,
      googleMapUrl: item.url || (item.location ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.location)}` : undefined),
      spotDetails: {
        hasTicket: false,
        participants: members.map(m => m.id),
        isPotential: false,
      },
    };
    addTripItem(currentTripId, 'scheduleItems', { ...newScheduleItem, id: Date.now().toString() });
    setPocketItems(prev => {
      const next = prev.map(p => p.id === item.id ? { ...p, assignedDate: targetDate } : p);
      updateTripField(currentTripId, 'pocketItems', next).catch(err => {
        console.error('Failed to update assignedDate in pocket:', err);
      });
      return next;
    });
  };

  const handleSaveItem = (itemData: Omit<ScheduleItem, 'id'>) => { if (editingItem) { updateTripField(currentTripId, 'scheduleItems', scheduleItems.map(item => item.id === editingItem.id ? { ...itemData, id: item.id } : item)); setEditingItem(null); } else { addTripItem(currentTripId, 'scheduleItems', { ...itemData, id: Date.now().toString() }); } };
  const handleEditClick = (item: ScheduleItem) => { setEditingItem(item); setIsAddModalOpen(true); };
  const handleDeleteItemClick = (itemId: string) => setItemToDelete(itemId);
  const confirmDeleteItem = () => { if (itemToDelete) { updateTripField(currentTripId, 'scheduleItems', scheduleItems.filter(item => item.id !== itemToDelete)); setItemToDelete(null); } };
  const handleMoveItem = (index: number, direction: 'up' | 'down') => { const currentDayItems = scheduleItems.filter(i => i.date === selectedDate); const itemA = currentDayItems[index]; const targetIndex = direction === 'up' ? index - 1 : index + 1; const itemB = currentDayItems[targetIndex]; const itemAId = itemA.id; const itemBId = itemB.id; const newArr = [...scheduleItems]; const idxA = newArr.findIndex(i => i.id === itemAId); const idxB = newArr.findIndex(i => i.id === itemBId); if (idxA > -1 && idxB > -1) { [newArr[idxA], newArr[idxB]] = [newArr[idxB], newArr[idxA]]; updateTripField(currentTripId, 'scheduleItems', newArr); } };
  const openMap = (location: string) => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`, '_blank');
  
  const handleAddDay = () => {
    const sortedByDate = [...tripDays].sort((a, b) => a.date.localeCompare(b.date));
    const latestDay = sortedByDate[sortedByDate.length - 1];
    const nextDate = new Date(latestDay.date);
    nextDate.setDate(nextDate.getDate() + 1);
    const dateStr = nextDate.toISOString().split('T')[0];
    
    if (tripDays.some(d => d.date === dateStr)) {
        alert('日期重複：' + dateStr + ' 已存在於行程中！');
        return;
    }
    
    updateTripField(currentTripId, 'tripDays', [...tripDays, { date: dateStr, location: latestDay.location, fruit: latestDay.fruit }]);
  };

  const confirmDeleteDay = () => { if (tripDays.length > 1) { const newDays = tripDays.filter(d => d.date !== selectedDate); updateTripField(currentTripId, 'tripDays', newDays); updateTripField(currentTripId, 'scheduleItems', scheduleItems.filter(item => item.date !== selectedDate)); if (!newDays.find(d => d.date === selectedDate)) setSelectedDate(newDays[0].date); setIsDeleteDayModalOpen(false); } };
  
  const handleUpdateDayDetails = (newDate: string, newLoc: string, newFruit: string) => { 
    if (newDate !== selectedDate && tripDays.some(d => d.date === newDate)) {
        alert('日期重複：' + newDate + ' 已存在於行程中！');
        return;
    }
    updateTripField(currentTripId, 'tripDays', tripDays.map(d => d.date === selectedDate ? { date: newDate, location: newLoc, fruit: newFruit } : d)); 
    updateTripField(currentTripId, 'scheduleItems', scheduleItems.map(item => item.date === selectedDate ? { ...item, date: newDate } : item)); 
    setSelectedDate(newDate); 
    setIsEditDayModalOpen(false); 
  };
  
  const addCurrency = (c: Currency) => updateTripField(currentTripId, 'currencies', [...currencies, c]);
  const removeCurrency = (code: string) => updateTripField(currentTripId, 'currencies', currencies.filter(c => c.code !== code));
  
  // --- Enhanced Reordering Logic: Long Press -> Released -> Click Target to Swap ---
  const handleSwapLogic = (idx1: number, idx2: number) => {
    if (idx1 === idx2) return;

    const newTripDays = [...tripDays];
    const day1 = { ...newTripDays[idx1] };
    const day2 = { ...newTripDays[idx2] };
    
    const date1 = day1.date;
    const date2 = day2.date;

    // Swap logical contents (locations) but keep the original dates at their respective positions
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
    if ('touches' in e && e.touches.length > 0) {
      touchStartPosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if ('clientX' in e) {
      touchStartPosRef.current = { x: e.clientX, y: e.clientY };
    }

    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    
    longPressTimer.current = setTimeout(() => {
        longPressTriggeredAtRef.current = Date.now();
        setSwappingFromIndex(idx);
        if (window.navigator.vibrate) window.navigator.vibrate(80);
    }, 450); // 450ms long press threshold
  };

  const handleDayTouchEnd = () => {
    if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
    }
  };

  const handleDayTouchMove = (e: React.TouchEvent) => {
    if (!longPressTimer.current) return;
    if (e.touches.length > 0) {
      const dx = Math.abs(e.touches[0].clientX - touchStartPosRef.current.x);
      const dy = Math.abs(e.touches[0].clientY - touchStartPosRef.current.y);
      // Cancel long press only if user genuinely scrolled more than 10px
      if (dx > 10 || dy > 10) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    }
  };

  const handleDayItemClick = (idx: number, dateStr: string) => {
    // If this click is fired within 600ms of long press triggering (e.g. touch release synthetic click), ignore it!
    const elapsedSinceLongPress = Date.now() - longPressTriggeredAtRef.current;
    if (elapsedSinceLongPress < 600) {
        return;
    }

    if (swappingFromIndex !== null) {
        if (swappingFromIndex === idx) {
            // Cancel mode only if the user deliberately clicks the selected day again AFTER long press
            setSwappingFromIndex(null);
        } else {
            // Execute swap with the target day
            handleSwapLogic(swappingFromIndex, idx);
            setSwappingFromIndex(null);
        }
    } else {
        // Normal behavior: Select date
        setSelectedDate(dateStr);
    }
  };

  // --- Jump to Schedule Logic ---
  const handleJumpToSchedule = (date: string, itemId: string) => {
      setActiveTab('schedule');
      setSelectedDate(date);
  };

  const handleJumpToExpense = (expenseId: string) => {
      setActiveTab('expense');
      setHighlightExpenseId(expenseId);
      // Reset after a delay so subsequent jumps work
      setTimeout(() => setHighlightExpenseId(null), 5000);
  };

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
          <div className="flex flex-col flex-1 min-w-0 pr-2">
            <button onClick={handleBackToHome} className="flex items-center gap-1 text-sm font-bold text-gray-400 mb-3"><ChevronLeft size={16} strokeWidth={3}/> 返回首頁</button>
            <h1 className="text-2xl sm:text-3xl font-black text-cocoa tracking-tight break-words leading-snug">{currentTripName}</h1>
            <div onClick={handleShare} className="flex items-center gap-2 mt-2 cursor-pointer group flex-wrap"><span className="text-xs font-bold text-sage bg-white px-3 py-1.5 rounded-lg border-2 border-beige-dark group-hover:border-sage flex items-center gap-2 shadow-hard-sm">Code: {currentTripId} <Copy size={12} /></span>{copyFeedback && <span className="text-xs text-sage font-bold animate-pulse bg-white px-2 py-1 rounded-lg">已複製代碼！</span>}</div>
          </div>
          <div className="flex items-center gap-3 pt-6 flex-shrink-0">
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
                            onTouchCancel={handleDayTouchEnd}
                            onMouseDown={(e) => handleDayTouchStart(idx, e)}
                            onMouseUp={handleDayTouchEnd}
                            onContextMenu={(e) => e.preventDefault()}
                            onClick={() => handleDayItemClick(idx, date.date)}
                            style={{ WebkitTouchCallout: 'none', userSelect: 'none' }}
                            className={`flex-shrink-0 flex flex-col items-center justify-center w-[3.75rem] min-w-[3.75rem] h-16 rounded-2xl transition-all snap-center cursor-pointer relative overflow-hidden select-none px-1
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
                            <span className={`text-[9px] font-black uppercase tracking-tight ${isSelected ? 'opacity-90' : 'text-[#B0A590]'}`}>Day {date.dayNum}</span>
                            <span className="text-[15px] font-black leading-tight my-0.5 tracking-tight">{date.monthDay}</span>
                            <span className={`text-[10px] font-bold ${isSelected ? 'opacity-90' : 'opacity-70'}`}>{date.weekday}</span>
                        </div>
                     );
                   })}
                   <button onClick={handleAddDay} className="flex-shrink-0 flex flex-col items-center justify-center w-[3.75rem] min-w-[3.75rem] h-16 rounded-2xl border-2 border-dashed border-[#E0E5D5] text-gray-300 hover:text-sage bg-white/50 snap-center"><Plus size={24} strokeWidth={3} /></button>
                 </div>
                 <div className="mt-2 flex flex-col sm:flex-row sm:justify-between sm:items-center px-1 gap-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-sage/80 flex-shrink-0"></span>
                        <span>{swappingFromIndex !== null ? '點擊其他日期來完成對調' : '長按日期方塊後釋放，再點擊目標可對調'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                        <button 
                            onClick={() => { setPocketInitialTab('food'); setIsPocketModalOpen(true); }} 
                            className="bg-orange-100 hover:bg-orange-200 text-orange-700 px-2.5 py-1.5 rounded-xl border border-orange-200 shadow-sm text-xs font-bold inline-flex items-center gap-1.5 transition-all active:scale-95 whitespace-nowrap"
                            title="美食口袋名單"
                        >
                            <Utensils size={13} className="text-orange-500" /> 美食
                            {pocketItems.filter(p => p.category === 'food').length > 0 && (
                                <span className="bg-orange-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-mono leading-none">
                                    {pocketItems.filter(p => p.category === 'food').length}
                                </span>
                            )}
                        </button>
                        <button 
                            onClick={() => { setPocketInitialTab('spot'); setIsPocketModalOpen(true); }} 
                            className="bg-teal-100 hover:bg-teal-200 text-teal-800 px-2.5 py-1.5 rounded-xl border border-teal-200 shadow-sm text-xs font-bold inline-flex items-center gap-1.5 transition-all active:scale-95 whitespace-nowrap"
                            title="探索景點名單"
                        >
                            <Compass size={13} className="text-teal-600" /> 探索
                            {pocketItems.filter(p => p.category === 'spot').length > 0 && (
                                <span className="bg-teal-600 text-white text-[9px] px-1.5 py-0.5 rounded-full font-mono leading-none">
                                    {pocketItems.filter(p => p.category === 'spot').length}
                                </span>
                            )}
                        </button>
                        <button onClick={() => setIsPotentialModalOpen(true)} className="bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-2.5 py-1.5 rounded-xl border border-yellow-200 shadow-sm text-xs font-bold inline-flex items-center gap-1 transition-all active:scale-95 whitespace-nowrap"><Coins size={12}/> 潛在花費</button>
                    </div>
                 </div>
               </div>

               <div className="px-2.5 sm:px-4 pt-2">
                  <div className="relative border-l-2 border-beige-dark ml-2.5 sm:ml-3 space-y-6 py-2">
                    {scheduleItems.filter(item => item.date === selectedDate).length === 0 && (<div className="pl-6 text-gray-400 font-bold italic py-10">此日期尚無行程，點擊右下角新增！</div>)}
                    {scheduleItems.filter(item => item.date === selectedDate).map((item, index) => {
                      let icon = MapPin; let colorClass = 'bg-gray-100 text-gray-500';
                      if (item.type === 'food') { icon = Utensils; colorClass = 'bg-orange-100 text-orange-500'; }
                      if (item.type === 'transport') { icon = Train; colorClass = 'bg-blue-100 text-blue-500'; }
                      if (item.type === 'stay') { icon = Bed; colorClass = 'bg-purple-100 text-purple-500'; }
                      if (item.type === 'spot') { icon = Camera; colorClass = 'bg-green-100 text-green-600'; }
                      if (item.type === 'flight') { icon = Plane; colorClass = 'bg-cyan-100 text-cyan-600'; }
                      const IconComp = icon;
                      const partIds = item.type === 'flight' ? item.flightDetails?.participants : item.type === 'stay' ? item.stayDetails?.participants : item.type === 'transport' ? (item.transitDetails?.participants || item.carRental?.participants) : (item.type === 'spot' || item.type === 'food') ? item.spotDetails?.participants : [];
                      const participantNames = getMemberNames(partIds);
                      const fruitIcon = getScheduleIcon(item.id);
                      return (
                        <div key={item.id} className="relative pl-3.5 sm:pl-4 group mb-6">
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteItemClick(item.id); }} className="absolute right-0 -top-3 bg-red-100 text-red-400 p-1.5 rounded-full opacity-0 group-hover:opacity-100 z-30 border border-red-200 shadow-sm"><X size={12} strokeWidth={3} /></button>
                          <div className="absolute -left-[7px] top-6 z-10 w-3 h-3 rounded-full bg-white border-2 border-sage shadow-sm flex items-center justify-center">
                              <div className="w-1 h-1 rounded-full bg-sage"></div>
                          </div>
                          <div onClick={() => setViewingItem(item)} className="bg-white rounded-[1.75rem] shadow-hard-sm border-2 border-beige-dark overflow-hidden relative transition-all cursor-pointer hover:border-sage group-hover:-translate-y-1">
                            <div className="p-3.5 sm:p-4">
                                <div className="flex justify-between items-start mb-3 gap-2">
                                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                                         <div className={`p-2.5 rounded-xl ${colorClass} border-2 border-white shadow-sm flex-shrink-0`}><IconComp size={20} strokeWidth={2.5} /></div>
                                         <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                                                <span className="font-mono text-xs font-black text-white bg-sage px-2 py-0.5 rounded-md shadow-sm">{item.time}</span>
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{item.type}</span>
                                            </div>
                                            <h3 className="text-base sm:text-lg font-black text-cocoa leading-snug break-words">{item.title}</h3>
                                         </div>
                                    </div>
                                    <div className="flex flex-col gap-1 flex-shrink-0"><button onClick={(e) => { e.stopPropagation(); handleMoveItem(index, 'up'); }} disabled={index === 0} className={`p-1 rounded-full border border-beige-dark ${index === 0 ? 'opacity-0' : 'text-gray-300 hover:bg-sage hover:text-white'}`}><ChevronUp size={12} /></button><button onClick={(e) => { e.stopPropagation(); handleMoveItem(index, 'down'); }} disabled={index === scheduleItems.filter(i => i.date === selectedDate).length - 1} className={`p-1 rounded-full border border-beige-dark ${index === scheduleItems.filter(i => i.date === selectedDate).length - 1 ? 'opacity-0' : 'text-gray-300 hover:bg-sage hover:text-white'}`}><ChevronDown size={12} /></button></div>
                                </div>
                                <div className="flex items-center text-gray-500 text-xs sm:text-sm gap-2 font-bold bg-gray-50 px-3 py-2 rounded-xl border border-gray-100 w-full"><MapPin size={15} className="text-sage flex-shrink-0" /><span className="truncate flex-1">{item.location}</span><button onClick={(e) => { e.stopPropagation(); openMap(item.location); }} className="p-1.5 bg-white rounded-lg text-cocoa hover:text-white hover:bg-sage shadow-sm border border-gray-200 transition-colors flex-shrink-0"><Navigation size={12} strokeWidth={2.5} /></button></div>
                            </div>
                            <div className="relative w-full h-0 border-t-2 border-dashed border-beige-dark flex justify-between items-center"><div className="absolute -left-3 -top-3 w-6 h-6 bg-beige rounded-full border-r-2 border-beige-dark"></div><div className="absolute -right-3 -top-3 w-6 h-6 bg-beige rounded-full border-l-2 border-beige-dark"></div></div>
                            <div className="bg-[#FAF9F6] p-3.5 sm:p-4">
                                <div className="space-y-3">
                                    {item.type === 'flight' && item.flightDetails && (
                                        <div className="bg-gradient-to-br from-cyan-50/80 via-sky-50/40 to-blue-50/50 p-3 rounded-2xl border border-cyan-200/80 space-y-2.5">
                                            {/* Header: Airline & Flight Code */}
                                            <div className="flex items-center justify-between gap-2 border-b border-cyan-200/60 pb-2">
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    <div className="w-5 h-5 rounded-md bg-cyan-500 text-white flex items-center justify-center flex-shrink-0">
                                                        <Plane size={12} />
                                                    </div>
                                                    <span className="text-xs sm:text-sm font-black text-cocoa truncate">
                                                        {item.flightDetails.airline || '航班'}
                                                    </span>
                                                    {item.flightDetails.flightCode && (
                                                        <span className="font-mono text-[11px] font-black bg-cyan-100/90 text-cyan-800 px-1.5 py-0.5 rounded border border-cyan-200 flex-shrink-0">
                                                            {item.flightDetails.flightCode.toUpperCase()}
                                                        </span>
                                                    )}
                                                </div>
                                                {item.flightDetails.flightDuration && (
                                                    <div className="flex items-center gap-1 text-[10px] font-bold text-cyan-800 bg-white/90 px-1.5 py-0.5 rounded border border-cyan-200 flex-shrink-0 font-mono">
                                                        <Clock size={10} className="text-cyan-600"/>
                                                        <span>{item.flightDetails.flightDuration}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Flight Route Boarding-Pass Box */}
                                            <div className="bg-white/95 rounded-xl p-2.5 border border-cyan-100 space-y-1.5">
                                                <div className="flex items-center justify-between gap-1 text-xs">
                                                    {/* Departure */}
                                                    <div className="flex-1 min-w-0 text-left">
                                                        <div className="font-mono text-xs sm:text-sm font-black text-cyan-950 truncate" title={item.flightDetails.departureAirport}>
                                                            {item.flightDetails.departureAirport?.toUpperCase() || 'DEP'}
                                                        </div>
                                                        {item.flightDetails.departureTime && (
                                                            <div className="text-[10px] font-bold text-gray-500 flex items-center gap-1 mt-0.5">
                                                                <span className="text-[8px] px-1 py-0.2 bg-gray-100 text-gray-600 rounded">起飛</span>
                                                                <span className="font-mono">{item.flightDetails.departureTime}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Arrow / Transit Center Indicator */}
                                                    {item.flightDetails.transitAirport || item.flightDetails.transitCity ? (
                                                        <div className="flex flex-col items-center px-1 flex-shrink-0">
                                                            <div className="flex items-center gap-1">
                                                                <span className="w-2.5 h-0.5 bg-amber-200"></span>
                                                                <span className="text-[8px] font-black bg-amber-200 text-amber-900 px-1 py-0.2 rounded">
                                                                    轉機
                                                                </span>
                                                                <span className="w-2.5 h-0.5 bg-amber-200"></span>
                                                            </div>
                                                            <span className="font-mono text-[11px] font-black text-amber-900 mt-0.5">
                                                                {item.flightDetails.transitAirport?.toUpperCase()}
                                                            </span>
                                                            {item.flightDetails.transitDuration && (
                                                                <span className="text-[8px] font-bold text-amber-700">
                                                                    停 {item.flightDetails.transitDuration}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col items-center px-1 flex-shrink-0">
                                                            <div className="flex items-center text-cyan-300">
                                                                <span className="w-3 h-0.5 bg-cyan-200"></span>
                                                                <Plane size={10} className="text-cyan-500 mx-0.5" />
                                                                <span className="w-3 h-0.5 bg-cyan-200"></span>
                                                            </div>
                                                            <span className="text-[8px] font-bold text-cyan-600 mt-0.5">直飛</span>
                                                        </div>
                                                    )}

                                                    {/* Arrival */}
                                                    <div className="flex-1 min-w-0 text-right">
                                                        <div className="font-mono text-xs sm:text-sm font-black text-cyan-950 truncate" title={item.flightDetails.arrivalAirport}>
                                                            {item.flightDetails.arrivalAirport?.toUpperCase() || 'ARR'}
                                                        </div>
                                                        {item.flightDetails.arrivalTime && (
                                                            <div className="text-[10px] font-bold text-gray-500 flex items-center justify-end gap-1 mt-0.5">
                                                                <span className="font-mono">{item.flightDetails.arrivalTime}</span>
                                                                <span className="text-[8px] px-1 py-0.2 bg-gray-100 text-gray-600 rounded">抵達</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Transit Detail Line if city or transit flight code exists */}
                                                {(item.flightDetails.transitCity || item.flightDetails.transitFlightCode) && (
                                                    <div className="pt-1.5 border-t border-dashed border-amber-100 flex items-center justify-between text-[10px] text-amber-900">
                                                        <span className="flex items-center gap-1 truncate">
                                                            <span className="text-gray-400">轉機城市:</span>
                                                            <span className="font-bold">{item.flightDetails.transitCity || item.flightDetails.transitAirport}</span>
                                                        </span>
                                                        {item.flightDetails.transitFlightCode && (
                                                            <span className="font-mono font-bold text-amber-800 flex-shrink-0 ml-1">
                                                                銜接: {item.flightDetails.transitFlightCode.toUpperCase()}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Baggage & Cost */}
                                            <div className="flex items-center justify-between text-[11px] font-bold text-gray-500 px-0.5 pt-0.5">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-1">
                                                        <Luggage size={12} className="text-teal-600"/>
                                                        <span>託運: {item.flightDetails.checkedBag || '--'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Briefcase size={12} className="text-orange-500"/>
                                                        <span>手提: {item.flightDetails.carryOnBag || '--'}</span>
                                                    </div>
                                                </div>
                                                {Number(item.flightDetails.cost) > 0 && (
                                                    <div className="text-[11px] font-black text-sage font-mono">
                                                        費用: {item.flightDetails.currency} {Number(item.flightDetails.cost).toLocaleString()}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    {item.type === 'stay' && item.stayDetails && (
                                        <div className="bg-purple-50/30 p-3 rounded-2xl border border-purple-100/50 space-y-2">
                                            <div className="flex justify-between items-center border-b border-purple-100/50 pb-2">
                                                <div className="flex items-center gap-2"><Bed size={14} className="text-purple-600"/><span className="text-sm font-black text-cocoa">住宿詳情</span></div>
                                            </div>
                                            <div className="flex gap-4 text-[11px] font-bold text-gray-500">
                                                <div className="flex items-center gap-1"><Clock size={12} className="text-gray-300"/>CI: {item.checkIn}</div>
                                                <div className="flex items-center gap-1"><Clock size={12} className="text-gray-300"/>CO: {item.checkOut}</div>
                                            </div>
                                            <div className="flex gap-3 mt-1">
                                                {item.meals?.breakfast && <span className="text-[10px] bg-white px-2 py-0.5 rounded-full border border-purple-200 text-purple-400 flex items-center gap-1"><Coffee size={10}/> 早餐</span>}
                                                {item.meals?.dinner && <span className="text-[10px] bg-white px-2 py-0.5 rounded-full border border-purple-200 text-purple-400 flex items-center gap-1"><Utensils size={10}/> 晚餐</span>}
                                            </div>
                                            {Number(item.stayDetails.cost) > 0 && <div className="text-right text-[10px] font-black text-sage">費用: {item.stayDetails.currency} {Number(item.stayDetails.cost).toLocaleString()}</div>}
                                        </div>
                                    )}
                                    {item.type === 'transport' && item.transitDetails && (
                                        <div className="pt-1">
                                            <TransitLegChainView legs={item.transitDetails.legs} fare={item.transitDetails.fare} currencies={currencies} />
                                        </div>
                                    )}
                                    {item.type === 'transport' && !item.transitDetails && item.carRental?.hasRental && (() => {
                                        const baseRental = Number(item.carRental.rentalCost) || 0;
                                        const baseFeePct = Number(item.carRental.serviceFeePercentage) || 0;
                                        const baseWithFee = baseRental + (item.carRental.hasServiceFee ? (baseRental * baseFeePct / 100) : 0);
                                        let extrasTotal = 0;
                                        item.carRental.expenses?.forEach(exp => {
                                            const amt = Number(exp.amount) || 0;
                                            const feePct = Number(exp.serviceFeePercentage) || 0;
                                            extrasTotal += amt + (exp.hasServiceFee ? (amt * feePct / 100) : 0);
                                        });
                                        const grandTotal = baseWithFee + extrasTotal;
                                        return (
                                            <div className="bg-blue-50/30 p-3 rounded-2xl border border-blue-100/50 space-y-2">
                                                <div className="flex justify-between items-center border-b border-blue-100/50 pb-2">
                                                    <div className="flex items-center gap-2"><Car size={14} className="text-blue-600"/><span className="text-sm font-black text-cocoa">{item.carRental.company} - {item.carRental.carModel}</span></div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 text-[11px] font-bold text-gray-500">
                                                    <div className="flex items-center gap-1"><Clock size={12} className="text-gray-300"/>取車: {item.carRental.pickupDate} {item.carRental.pickupTime}</div>
                                                    <div className="flex items-center gap-1"><Clock size={12} className="text-gray-300"/>還車: {item.carRental.returnDate} {item.carRental.returnTime}</div>
                                                    {Number(item.carRental.estimatedFuelCost) > 0 && <div className="flex items-center gap-1 col-span-2"><Fuel size={12} className="text-orange-400"/>預估油資: {item.carRental.fuelCurrency} {Number(item.carRental.estimatedFuelCost).toLocaleString()}</div>}
                                                </div>
                                                <div className="pt-1 mt-1 border-t border-dashed border-blue-200/50 space-y-1">
                                                    <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 italic">
                                                        <span>基本租金</span>
                                                        <span className="font-mono">{item.carRental.rentalCurrency} {Math.round(baseWithFee).toLocaleString()}</span>
                                                    </div>
                                                    {item.carRental.expenses?.map((exp, idx) => {
                                                        const expAmt = Number(exp.amount) || 0;
                                                        const expFeePct = Number(exp.serviceFeePercentage) || 0;
                                                        const expTotal = expAmt + (exp.hasServiceFee ? (expAmt * expFeePct / 100) : 0);
                                                        return (
                                                            <div key={idx} className="flex justify-between items-center text-[10px] font-bold text-gray-400 italic">
                                                                <span>• {exp.name}</span>
                                                                <span className="font-mono">{exp.currency || item.carRental?.rentalCurrency} {Math.round(expTotal).toLocaleString()}</span>
                                                            </div>
                                                        );
                                                    })}
                                                    <div className="flex justify-between items-center text-[11px] font-black text-blue-600 pt-1 border-t border-blue-100 mt-1">
                                                        <span>租車總計金額</span>
                                                        <span className="font-mono">{item.carRental.rentalCurrency} {Math.round(grandTotal).toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()}
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
              <ScheduleDetailModal isOpen={!!viewingItem} onClose={() => setViewingItem(null)} item={viewingItem} onEdit={() => { if(viewingItem) { setViewingItem(null); handleEditClick(viewingItem); } }} currencies={currencies} members={members} />
              <DeleteItemConfirmModal isOpen={!!itemToDelete} onClose={() => setItemToDelete(null)} onConfirm={confirmDeleteItem} title={scheduleItems.find(i => i.id === itemToDelete)?.title || '此項目'} />
              <PotentialExpensesModal isOpen={isPotentialModalOpen} onClose={() => setIsPotentialModalOpen(false)} items={scheduleItems} currencies={currencies} members={members} />
              <EditDayDetailsModal isOpen={isEditDayModalOpen} onClose={() => setIsEditDayModalOpen(false)} onConfirm={handleUpdateDayDetails} initialDate={selectedDate} initialLocation={currentLocation} initialFruit={currentFruit} />
              <DeleteDayConfirmModal isOpen={isDeleteDayModalOpen} onClose={() => setIsDeleteDayModalOpen(false)} onConfirm={confirmDeleteDay} date={selectedDate} />
              <TripSettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} currencies={currencies} onAddCurrency={addCurrency} onRemoveCurrency={removeCurrency} onDuplicate={handleOpenBackupModal} />
              <BackupConfirmModal isOpen={isBackupConfirmOpen} onClose={() => setIsBackupConfirmOpen(false)} onConfirm={executeBackupTrip} tripName={currentTripName} />
              <PocketPlacesModal 
                isOpen={isPocketModalOpen} 
                onClose={() => setIsPocketModalOpen(false)} 
                initialTab={pocketInitialTab}
                tripId={currentTripId}
                pocketItems={pocketItems}
                tripDays={tripDays}
                onAddItem={handleAddPocketItem}
                onUpdateItem={handleUpdatePocketItem}
                onDeleteItem={handleDeletePocketItem}
                onAddToSchedule={handleAddToScheduleFromPocket}
              />
            </div>
          )}
          {activeTab === 'bookings' && (<BookingsView flights={bookingFlights} accommodations={bookingAccommodations} carRentals={bookingCarRentals} tickets={bookingTickets} currencies={currencies} members={members} onAddFlight={handleAddFlight} onUpdateFlight={handleUpdateFlight} onDeleteFlight={handleDeleteFlight} onAddAccommodation={(a) => addTripItem(currentTripId, 'accommodations', a)} onUpdateAccommodation={(a) => updateTripField(currentTripId, 'accommodations', bookingAccommodations.map(x => x.id === a.id ? a : x))} onDeleteAccommodation={(id) => updateTripField(currentTripId, 'accommodations', bookingAccommodations.filter(x => x.id !== id))} onAddCar={handleAddCar} onUpdateCar={handleUpdateCar} onDeleteCar={handleDeleteCar} onAddTicket={(t) => addTripItem(currentTripId, 'tickets', t)} onUpdateTicket={(t) => updateTripField(currentTripId, 'tickets', bookingTickets.map(x => x.id === t.id ? t : x))} onDeleteTicket={(id) => updateTripField(currentTripId, 'tickets', bookingTickets.filter(x => x.id !== id))} />)}
          {activeTab === 'expense' && (<ExpensesView expenses={expenses} members={members} currencies={currencies} onAdd={handleAddExpense} onUpdate={handleUpdateExpense} onDelete={handleDeleteExpense} onShowToast={(m, t) => { if (t === 'error') alert(m); }} highlightId={highlightExpenseId} />)}
          {activeTab === 'journal' && (<JournalView journals={journals} members={members} onAdd={handleAddJournal} onUpdate={handleUpdateJournal} onDelete={handleDeleteJournal} />)}
          {activeTab === 'planning' && (<PlanningView lists={planningLists} members={members} onAdd={handleAddPlanning} onToggle={handleTogglePlanning} onUpdate={handleUpdatePlanning} onDelete={handleDeletePlanning} />)}
          {activeTab === 'members' && (<MembersView members={members} scheduleItems={scheduleItems} expenses={expenses} currencies={currencies} onAdd={handleAddMember} onUpdate={handleUpdateMember} onDelete={handleDeleteMember} onJumpToSchedule={handleJumpToSchedule} onJumpToExpense={handleJumpToExpense} />)}
        </main>
        <BottomNav activeTab={activeTab} setTab={setActiveTab} />
      </div>
    </div>
  );
}
