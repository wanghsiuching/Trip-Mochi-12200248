import React, { useState } from 'react';
import { Plane, Bed, Car, Plus, MapPin, Compass, House, PenTool, Briefcase, Info, Luggage, Navigation, Leaf, Link as LinkIcon, X, Calendar as CalendarIcon, ArrowRightLeft, Users, Clock, DollarSign, Trash2 } from 'lucide-react';
import { BookingFlight, BookingAccommodation, BookingCarRental, BookingTicket, Currency, Member } from '../types';
import { ToggleSwitch } from './Modals';
import { DateTimePickerField, TimePickerField, DatePickerField } from './TimePickerComponents';

interface BookingsViewProps {
  flights: BookingFlight[];
  accommodations: BookingAccommodation[];
  carRentals: BookingCarRental[];
  tickets: BookingTicket[];
  currencies: Currency[];
  members: Member[];
  onAddFlight: (flight: BookingFlight) => void;
  onUpdateFlight: (flight: BookingFlight) => void;
  onDeleteFlight: (id: number) => void;
  onUpdateAccommodation: (acc: BookingAccommodation) => void;
  onDeleteAccommodation: (id: number) => void;
  onAddAccommodation: (acc: BookingAccommodation) => void;
  onAddCar: (car: BookingCarRental) => void;
  onUpdateCar: (car: BookingCarRental) => void;
  onDeleteCar: (id: number) => void;
  onAddTicket: (ticket: BookingTicket) => void;
  onUpdateTicket: (ticket: BookingTicket) => void;
  onDeleteTicket: (id: number) => void;
}

export const BookingsView: React.FC<BookingsViewProps> = ({ 
    flights, accommodations, carRentals, tickets, currencies, members,
    onAddFlight, onUpdateFlight, onDeleteFlight, 
    onUpdateAccommodation, onDeleteAccommodation, onAddAccommodation, 
    onAddCar, onUpdateCar, onDeleteCar, onAddTicket, onUpdateTicket, onDeleteTicket 
}) => {
  const [subTab, setSubTab] = useState<'flight' | 'hotel' | 'car'>('flight');

  // Modal states
  const [showFlightModal, setShowFlightModal] = useState(false);
  const [editingFlight, setEditingFlight] = useState<BookingFlight | null>(null);

  const [showAccModal, setShowAccModal] = useState(false);
  const [editingAcc, setEditingAcc] = useState<BookingAccommodation | null>(null);
  
  const [showCarModal, setShowCarModal] = useState(false);
  const [editingCar, setEditingCar] = useState<BookingCarRental | null>(null);

  // Helper for Cost Calculation
  const calculateTotal = (cost: number, hasFee: boolean, feePct: number) => {
      if (!hasFee) return cost;
      return cost + (cost * Number(feePct) / 100);
  };

  // Helper for Exchange Rate
  const getExchangeRate = (code: string) => currencies.find(c => c.code === code)?.rate || 1;

  const CostPreview = ({ cost, currency, hasFee, feePct }: any) => {
      const total = calculateTotal(Number(cost) || 0, hasFee, Number(feePct) || 0);
      const rate = getExchangeRate(currency);
      const twd = Math.round(total * rate);

      if (!cost || Number(cost) <= 0) return null;

      return (
          <div className="mt-2 bg-gray-50 p-3 rounded-xl border border-dashed border-gray-200 space-y-1">
              <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">總計 (含稅)</span>
                  <span className="text-sm font-black text-cocoa font-mono">{currency} {Math.round(total).toLocaleString()}</span>
              </div>
              {currency !== 'TWD' && (
                  <div className="flex justify-between items-center border-t border-gray-100 pt-1">
                      <span className="text-[10px] font-black text-sage uppercase tracking-widest">約台幣 (TWD)</span>
                      <span className="text-sm font-black text-sage font-mono">${twd.toLocaleString()}</span>
                  </div>
              )}
          </div>
      );
  };

  // --- Flight Logic ---
  const openFlightEdit = (flight?: BookingFlight) => {
      if (flight) {
          setEditingFlight({ ...flight });
      } else {
          const newFlight: BookingFlight = {
              id: Date.now(),
              airline: '',
              code: '',
              date: new Date().toISOString().slice(0, 16),
              arrivalDate: new Date().toISOString().slice(0, 16),
              origin: 'TPE',
              originCity: '台北',
              dest: 'PUS',
              destCity: '釜山',
              depTime: '00:00',
              arrTime: '00:00',
              duration: '2h 0m',
              returnDuration: '2h 30m',
              aircraft: '',
              checkedBag: '',
              carryOnBag: '',
              baggage: '',
              color: 'bg-blue-500', 
              purchaseDate: new Date().toISOString().split('T')[0],
              platform: '',
              type: '來回', 
              tripType: 'roundtrip',
              cost: 0,
              currency: 'TWD',
              hasServiceFee: false,
              serviceFeePercentage: 0,
              participants: members.map(m => m.id),
              note: '',
              departureAirport: '',
              arrivalAirport: ''
          };
          setEditingFlight(newFlight);
      }
      setShowFlightModal(true);
  };

  const saveFlight = () => {
      if(editingFlight) {
          if (flights.find(f => f.id === editingFlight.id)) {
             onUpdateFlight(editingFlight);
          } else {
             onAddFlight(editingFlight);
          }
          setShowFlightModal(false);
      }
  };

  const deleteFlight = () => {
      if (editingFlight && window.confirm('確定刪除此航班？')) {
          onDeleteFlight(editingFlight.id);
          setShowFlightModal(false);
      }
  };

  const toggleFlightParticipant = (id: string) => {
      if (!editingFlight) return;
      const current = editingFlight.participants || [];
      const updated = current.includes(id) 
          ? current.filter(p => p !== id) 
          : [...current, id];
      setEditingFlight({ ...editingFlight, participants: updated });
  };

  // --- Accommodation Logic ---
  const openAccEdit = (acc?: BookingAccommodation) => {
      if(acc) {
          setEditingAcc({ ...acc, photos: acc.photos || [] });
      } else {
          const today = new Date();
          today.setHours(15, 0, 0, 0);
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(11, 0, 0, 0);

          const timeOffset = today.getTimezoneOffset() * 60000;
          const localToday = new Date(today.getTime() - timeOffset).toISOString().slice(0, 16);
          const localTomorrow = new Date(tomorrow.getTime() - timeOffset).toISOString().slice(0, 16);

          setEditingAcc({ 
              id: Date.now(), 
              name: '', 
              city: '釜山', 
              platform: '',
              ref: '',
              address: '',
              gps: '',
              url: '',
              checkInDate: localToday, 
              checkOutDate: localTomorrow,
              checkInTime: '15:00',
              latestCheckInTime: '22:00',
              checkOutTime: '11:00',
              checkIn: '15:00',
              nights: 1,
              cost: 0,
              currency: 'TWD',
              hasServiceFee: false,
              serviceFeePercentage: 0,
              participants: members.map(m => m.id),
              pax: 2,
              photos: [],
              note: ''
          });
      }
      setShowAccModal(true);
  };

  const saveAcc = () => {
      if(!editingAcc) return;
      if(accommodations.find(a => a.id === editingAcc.id)) {
          onUpdateAccommodation(editingAcc);
      } else {
          onAddAccommodation(editingAcc);
      }
      setShowAccModal(false);
  };

  const toggleAccParticipant = (id: string) => {
      if (!editingAcc) return;
      const current = editingAcc.participants || [];
      const updated = current.includes(id) 
          ? current.filter(p => p !== id) 
          : [...current, id];
      setEditingAcc({ ...editingAcc, participants: updated });
  };

  const openNav = (address: string, gps?: string) => {
      const query = gps || address;
      if (query) {
          window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, '_blank');
      }
  };

  // --- Car Logic ---
  const openCarEdit = (car?: BookingCarRental) => {
      if (car) {
          setEditingCar({ ...car });
      } else {
          const initialCar: BookingCarRental = { 
              id: Date.now(),
              company: '', platform: '', carModel: '', ref: '', 
              pickupDate: new Date().toISOString().slice(0, 16), pickupTime: '10:00', pickupLocation: '', 
              returnDate: new Date(Date.now() + 86400000).toISOString().slice(0, 16), returnTime: '10:00', returnLocation: '', 
              gps: '', url: '', note: '', 
              price: 0, currency: 'TWD', hasServiceFee: false, serviceFeePercentage: 0, 
              pax: 4, participants: members.map(m => m.id),
              hasRental: true
          };
          setEditingCar(initialCar);
      }
      setShowCarModal(true);
  };

  const saveCar = () => {
      if (!editingCar) return;
      if (carRentals.find(c => c.id === editingCar.id)) {
          onUpdateCar(editingCar);
      } else {
          onAddCar(editingCar);
      }
      setShowCarModal(false);
  };

  const deleteCar = () => {
      if (editingCar && window.confirm('確定刪除此租車紀錄？')) {
          onDeleteCar(editingCar.id);
          setShowCarModal(false);
      }
  };

  const toggleCarParticipant = (id: string) => {
      if (!editingCar) return;
      const current = editingCar.participants || [];
      const updated = current.includes(id) 
          ? current.filter(p => p !== id) 
          : [...current, id];
      setEditingCar({ ...editingCar, participants: updated });
  };

  return (
    <div className="w-full lg:p-0">
        <div className="sticky top-0 z-30 bg-beige/95 backdrop-blur-md px-4 py-3 border-b border-beige-dark/50 mb-5 lg:static lg:bg-transparent lg:p-0 lg:border-none lg:mb-8">
            <div className="bg-white p-1.5 rounded-full flex text-sm font-bold text-gray-400 border-2 border-beige-dark shadow-sm w-full max-w-lg mx-auto lg:mx-0">
                {[
                    { id: 'flight', label: '機票', icon: Plane },
                    { id: 'hotel', label: '住宿', icon: Bed },
                    { id: 'car', label: '租車', icon: Car }
                ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button 
                            key={tab.id}
                            onClick={() => setSubTab(tab.id as any)} 
                            className={`flex-1 py-2.5 rounded-full transition-all flex items-center justify-center gap-1.5 
                                ${subTab === tab.id 
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

        <div className="px-4 pb-20 lg:p-0 lg:pb-0 min-h-[50vh]">
            {subTab === 'flight' && (
                <div className="grid grid-cols-1 xl:grid-cols-1 gap-6 animate-scale-in">
                    <div className="mb-2 lg:mb-4 lg:flex lg:justify-end">
                        <button onClick={() => openFlightEdit()} className="w-full lg:w-auto lg:px-6 py-3 rounded-2xl border-2 border-dashed border-gray-300 text-gray-400 font-black hover:bg-white hover:border-sage transition-all flex items-center justify-center gap-2">
                            <Plus size={16}/> 新增機票
                        </button>
                    </div>
                    {flights.map((flight) => {
                         const totalCost = calculateTotal(flight.cost, flight.hasServiceFee, flight.serviceFeePercentage);
                         const perPersonCost = Math.round(totalCost / (flight.participants?.length || 1));
                         const displayDate = flight.date ? new Date(flight.date).toLocaleString('zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute:'2-digit' }) : '';
                         const displayArrDate = flight.arrivalDate ? new Date(flight.arrivalDate).toLocaleString('zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute:'2-digit' }) : '';
                         const displayReturnDate = flight.returnDate ? new Date(flight.returnDate).toLocaleString('zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute:'2-digit' }) : '';
                         const displayReturnArrDate = flight.returnArrivalDate ? new Date(flight.returnArrivalDate).toLocaleString('zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute:'2-digit' }) : '';

                         return (
                         <div key={flight.id} className="group">
                            <div className="bg-white rounded-[2rem] shadow-hard-sm border-2 border-beige-dark overflow-hidden relative transition-all hover:shadow-lg flex flex-col">
                                <div className="flex-[3] p-6 lg:p-8 flex flex-col justify-between relative">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-1.5 h-12 rounded-full ${flight.color}`}></div>
                                            <div>
                                                <div className="text-sm font-bold text-gray-400 tracking-wider uppercase mb-0.5">{flight.airline}</div>
                                                <h3 className="text-4xl lg:text-5xl font-black text-cocoa font-mono tracking-wide select-all cursor-text hover:bg-yellow-50 px-2 -ml-2 rounded-lg transition-colors">{flight.code ? flight.code.toUpperCase() : ''}</h3>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="mt-1 text-[10px] font-bold bg-beige/50 text-gray-400 px-3 py-1.5 rounded-lg inline-block border border-beige-dark uppercase tracking-widest">
                                                {flight.tripType === 'roundtrip' ? '回程機票' : '單程機票'}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className={`relative bg-gray-50 rounded-2xl p-4 border border-beige-dark ${flight.tripType === 'roundtrip' ? 'mb-4' : ''}`}>
                                        <div className="absolute top-0 left-4 -translate-y-1/2 bg-white px-2 text-[10px] font-black text-gray-400 tracking-widest uppercase border border-beige-dark rounded-md">去程</div>
                                        
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex flex-col">
                                                <span className="text-2xl font-black text-cocoa font-mono">{flight.origin ? flight.origin.toUpperCase() : ''}</span>
                                                <span className="text-xs font-bold text-sage bg-sage-light px-2 py-0.5 rounded-md inline-block mt-1 w-max">{flight.originCity}</span>
                                            </div>
                                            
                                            <div className="flex flex-col items-center px-4 flex-1">
                                                <div className="text-[10px] font-bold text-gray-400 mb-1 tracking-widest">{flight.duration}</div>
                                                <div className="w-full flex items-center gap-1">
                                                    <div className="w-1 h-1 rounded-full bg-gray-300"></div>
                                                    <div className="h-0.5 flex-1 bg-gray-300 relative">
                                                        <Plane className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 ${flight.color.replace('bg-', 'text-')} rotate-90 bg-gray-50 rounded-full border border-gray-200 p-0.5`} />
                                                    </div>
                                                    <div className="w-1 h-1 rounded-full bg-gray-300"></div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col text-right">
                                                <span className="text-2xl font-black text-cocoa font-mono">{flight.dest ? flight.dest.toUpperCase() : ''}</span>
                                                <span className="text-xs font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-md inline-block mt-1 w-max ml-auto">{flight.destCity}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 bg-white border border-dashed border-gray-300 rounded-lg py-1 px-4">
                                            <span>DEP: {displayDate}</span>
                                            <span>ARR: {displayArrDate}</span>
                                        </div>

                                        {(flight.transitAirport || flight.transitCity) && (
                                            <div className="mt-2 flex items-center justify-between text-[11px] font-bold text-amber-800 bg-amber-50/90 border border-amber-200/80 rounded-xl px-3 py-1.5 shadow-xs">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="px-1.5 py-0.5 bg-amber-200 text-amber-900 rounded-md text-[9px] font-black uppercase tracking-wider">轉機</span>
                                                    <span className="font-mono font-black">{flight.transitAirport ? flight.transitAirport.toUpperCase() : ''}</span>
                                                    {flight.transitCity && <span>{flight.transitCity}</span>}
                                                    {flight.transitFlightCode && <span className="font-mono text-gray-500 font-semibold">({flight.transitFlightCode.toUpperCase()})</span>}
                                                </div>
                                                {flight.transitDuration && (
                                                    <div className="flex items-center gap-1 text-[10px] font-black text-amber-700 font-mono">
                                                        <Clock size={11} />
                                                        <span>停留 {flight.transitDuration}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {flight.tripType === 'roundtrip' && (
                                        <div className="relative bg-gray-50 rounded-2xl p-4 border border-beige-dark">
                                            <div className="absolute top-0 left-4 -translate-y-1/2 bg-white px-2 text-[10px] font-black text-gray-400 tracking-widest uppercase border border-beige-dark rounded-md">回程</div>
                                            
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex flex-col">
                                                    <span className="text-2xl font-black text-cocoa font-mono">{flight.dest ? flight.dest.toUpperCase() : ''}</span>
                                                    <span className="text-xs font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-md inline-block mt-1 w-max">{flight.destCity}</span>
                                                </div>
                                                
                                                <div className="flex flex-col items-center px-4 flex-1">
                                                    <div className="text-[10px] font-bold text-gray-400 mb-1 tracking-widest">{flight.returnDuration || '飛航時間'}</div>
                                                    <div className="w-full flex items-center gap-1">
                                                        <div className="w-1 h-1 rounded-full bg-gray-300"></div>
                                                        <div className="h-0.5 flex-1 bg-gray-300 relative">
                                                            <ArrowRightLeft className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 bg-gray-50 rounded-full p-0.5" />
                                                        </div>
                                                        <div className="w-1 h-1 rounded-full bg-gray-300"></div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col text-right">
                                                    <span className="text-2xl font-black text-cocoa font-mono">{flight.origin ? flight.origin.toUpperCase() : ''}</span>
                                                    <span className="text-xs font-bold text-sage bg-sage-light px-2 py-0.5 rounded-md inline-block mt-1 w-max ml-auto">{flight.originCity}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 bg-white border border-dashed border-gray-300 rounded-lg py-1 px-4">
                                                <span>DEP: {displayReturnDate}</span>
                                                <span>ARR: {displayReturnArrDate}</span>
                                            </div>

                                            {(flight.returnTransitAirport || flight.returnTransitCity) && (
                                                <div className="mt-2 flex items-center justify-between text-[11px] font-bold text-amber-800 bg-amber-50/90 border border-amber-200/80 rounded-xl px-3 py-1.5 shadow-xs">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="px-1.5 py-0.5 bg-amber-200 text-amber-900 rounded-md text-[9px] font-black uppercase tracking-wider">轉機</span>
                                                        <span className="font-mono font-black">{flight.returnTransitAirport ? flight.returnTransitAirport.toUpperCase() : ''}</span>
                                                        {flight.returnTransitCity && <span>{flight.returnTransitCity}</span>}
                                                        {flight.returnTransitFlightCode && <span className="font-mono text-gray-500 font-semibold">({flight.returnTransitFlightCode.toUpperCase()})</span>}
                                                    </div>
                                                    {flight.returnTransitDuration && (
                                                        <div className="flex items-center gap-1 text-[10px] font-black text-amber-700 font-mono">
                                                            <Clock size={11} />
                                                            <span>停留 {flight.returnTransitDuration}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="relative w-full h-0 border-t-2 border-dashed border-beige-dark flex justify-between items-center">
                                    <div className="absolute -left-3 -top-3 w-6 h-6 bg-beige rounded-full border-r-2 border-beige-dark"></div>
                                    <div className="absolute -right-3 -top-3 w-6 h-6 bg-beige rounded-full border-l-2 border-beige-dark"></div>
                                </div>

                                <div className="bg-gray-50 p-4 lg:p-6 flex flex-col justify-between relative group/edit">
                                    <button onClick={() => openFlightEdit(flight)} className="absolute -top-4 right-6 w-8 h-8 rounded-full bg-white border-2 border-beige-dark text-gray-300 flex items-center justify-center hover:bg-sage hover:border-sage hover:text-white transition-all shadow-sm z-20"><PenTool size={14}/></button>
                                    <div className="space-y-3 mt-1">
                                        <div className="flex gap-4 border-b border-beige-dark pb-3 border-dashed">
                                             {flight.checkedBag && (
                                                 <div className="flex flex-col">
                                                     <span className="text-[9px] font-black text-gray-400 tracking-widest block mb-1">託運行李</span>
                                                     <div className="text-sm font-black text-cocoa flex items-center gap-1.5"><Luggage size={14} className="text-teal-500"/> {flight.checkedBag}</div>
                                                 </div>
                                             )}
                                             {flight.carryOnBag && (
                                                 <div className="flex flex-col">
                                                     <span className="text-[9px] font-black text-gray-400 tracking-widest block mb-1">手提行李</span>
                                                     <div className="text-sm font-black text-cocoa flex items-center gap-1.5"><Briefcase size={14} className="text-orange-400"/> {flight.carryOnBag}</div>
                                                 </div>
                                             )}
                                             {flight.aircraft && (
                                                 <div className="ml-auto flex flex-col items-end">
                                                     <span className="text-[9px] font-black text-gray-400 tracking-widest block mb-1">機型</span>
                                                     <div className="text-sm font-black text-cocoa flex items-center gap-1.5">{flight.aircraft} <Plane size={14} className="text-gray-400"/></div>
                                                 </div>
                                             )}
                                        </div>
                                        <div className="flex justify-between items-end">
                                             <div>
                                                 <span className="text-[9px] font-black text-gray-400 tracking-widest block mb-1">總金額</span>
                                                 <div className="flex flex-col">
                                                     <div className="flex items-baseline gap-1">
                                                         <span className="text-sm font-black text-cocoa font-mono">{flight.currency} {totalCost.toLocaleString()}</span>
                                                         {flight.currency !== 'TWD' && (
                                                             <span className="text-[10px] text-gray-400 font-bold ml-1">
                                                                 (≈ TWD {Math.round(totalCost * getExchangeRate(flight.currency)).toLocaleString()})
                                                             </span>
                                                         )}
                                                     </div>
                                                     {flight.participants && flight.participants.length > 0 && (
                                                         <div className="flex items-center gap-1 mt-1">
                                                             <span className="text-[10px] text-white bg-sage px-1.5 py-0.5 rounded font-bold">
                                                                 {flight.participants.length} 人分攤
                                                             </span>
                                                             <span className="text-[10px] text-sage font-bold">
                                                                 每人: {flight.currency} {perPersonCost.toLocaleString()}
                                                             </span>
                                                         </div>
                                                     )}
                                                 </div>
                                             </div>
                                             <div className="text-right">
                                                 {flight.purchaseDate && <div className="text-[10px] text-gray-400 font-bold">購買日期: {flight.purchaseDate}</div>}
                                                 {flight.platform && <div className="text-[10px] text-gray-400 font-bold opacity-70">{flight.platform}</div>}
                                             </div>
                                        </div>
                                        {flight.note && <div className="bg-white p-2 rounded-xl border border-beige-dark text-[10px] font-bold text-gray-400 flex items-center gap-1"><Info size={12} className="text-yellow-500"/> {flight.note}</div>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )})}
                    {flights.length === 0 && (
                        <div className="text-center py-12 bg-white rounded-[2rem] border-2 border-dashed border-gray-300">
                            <Plane size={40} className="mx-auto mb-3 text-gray-300" />
                            <p className="text-cocoa font-black">尚未新增航班</p>
                        </div>
                    )}
                </div>
            )}

            {/* Accommodation Tab */}
            {subTab === 'hotel' && (
                <div className="animate-scale-in">
                    <div className="mb-4 lg:mb-6 lg:flex lg:justify-end">
                        <button onClick={() => openAccEdit()} className="w-full lg:w-auto lg:px-6 py-3 rounded-2xl border-2 border-dashed border-gray-300 text-gray-400 font-black hover:bg-white hover:border-sage transition-all flex items-center justify-center gap-2">
                            <Plus size={16}/> 新增住宿
                        </button>
                    </div>
                    {accommodations.length === 0 && <div className="text-center py-12 bg-white rounded-[2rem] border-2 border-dashed border-gray-300"><Bed size={40} className="mx-auto mb-3 text-gray-300" /><p className="text-cocoa font-black">尚未新增住宿</p></div>}
                    {accommodations.map(acc => {
                        const totalCost = calculateTotal(acc.cost, acc.hasServiceFee, acc.serviceFeePercentage);
                        const perPerson = Math.round(totalCost / (acc.participants.length || 1));
                        const checkInDisplay = new Date(acc.checkInDate).toLocaleDateString('zh-TW', {month:'numeric', day:'numeric'}) + ' ' + new Date(acc.checkInDate).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
                        const checkOutDisplay = new Date(acc.checkOutDate).toLocaleDateString('zh-TW', {month:'numeric', day:'numeric'}) + ' ' + new Date(acc.checkOutDate).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});

                        return (
                        <div key={acc.id} onClick={() => openAccEdit(acc)} className="bg-white rounded-[2.5rem] overflow-hidden shadow-hard-sm border-2 border-beige-dark flex flex-col group transition-all hover:shadow-lg cursor-pointer active:scale-[0.99] mb-6 relative">
                            {/* ... accommodation card content ... */}
                            <div className="h-48 relative bg-gray-100 border-b-2 border-dashed border-beige-dark">
                                <div className="w-full h-full flex items-center justify-center bg-beige"><Bed size={48} className="text-gray-300"/></div>
                                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-black text-cocoa shadow-sm border border-beige-dark flex items-center gap-1">
                                    <Leaf size={12} className="text-sage"/>
                                    {acc.platform || 'Booking'}
                                </div>
                                <div className="absolute bottom-0 w-full h-4 bg-white rounded-t-[2rem]"></div>
                            </div>

                            <div className="px-6 pt-2 pb-6">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="text-xl font-black text-cocoa leading-tight mb-1">{acc.name}</h3>
                                        <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                                            <span className="bg-sage-light text-sage px-2 py-0.5 rounded-md">{acc.city}</span>
                                            <span>{acc.nights} 晚</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-black text-cocoa font-mono">{acc.currency} {totalCost.toLocaleString()}</div>
                                        {acc.currency !== 'TWD' && (
                                            <div className="text-[10px] font-bold text-gray-400 font-mono">≈ TWD {Math.round(totalCost * getExchangeRate(acc.currency)).toLocaleString()}</div>
                                        )}
                                        <div className="text-[10px] font-bold text-gray-400">總金額 (含稅)</div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-2xl p-4 border border-beige-dark flex justify-between items-center my-4 relative">
                                    <div className="text-center pl-2">
                                        <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">入住時間</div>
                                        <div className="text-sm font-black text-cocoa">{checkInDisplay}</div>
                                    </div>
                                    <div className="flex-1 border-b-2 border-dashed border-gray-300 mx-4 relative top-[-10px]">
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-50 px-2 text-gray-300">
                                            <House size={14}/>
                                        </div>
                                    </div>
                                    <div className="text-center pr-2">
                                        <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">退房時間</div>
                                        <div className="text-sm font-black text-cocoa">{checkOutDisplay}</div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                                        <MapPin size={14} className="text-sage"/>
                                        <span className="truncate flex-1">{acc.address}</span>
                                        <button onClick={(e) => {e.stopPropagation(); openNav(acc.address, acc.gps)}} className="text-sage hover:text-sage-dark"><Navigation size={14}/></button>
                                    </div>
                                    {acc.url && (
                                        <a href={acc.url} target="_blank" onClick={e => e.stopPropagation()} className="flex items-center gap-2 text-xs font-bold text-blue-400 hover:underline">
                                            <LinkIcon size={14}/> 訂房連結 / 官網
                                        </a>
                                    )}
                                    {acc.note && (
                                        <div className="flex items-start gap-2 text-[10px] font-bold text-orange-400 bg-orange-50 p-2 rounded-lg border border-orange-100 mt-2">
                                            <Info size={12} className="flex-shrink-0 mt-0.5"/>
                                            <span>{acc.note}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-4 pt-4 border-t-2 border-dashed border-beige-dark flex justify-between items-center">
                                    <div className="flex -space-x-2">
                                        {acc.participants.slice(0, 3).map((pid, i) => (
                                            <div key={i} className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-gray-500">
                                                {members.find(m => m.id === pid)?.name[0]}
                                            </div>
                                        ))}
                                        {(acc.participants.length > 3) && <div className="w-6 h-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[8px] font-bold">+{acc.participants.length - 3}</div>}
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] font-bold text-gray-400 uppercase">每人分攤金額</div>
                                        <div className="text-sm font-black text-sage font-mono">{acc.currency} {perPerson.toLocaleString()}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )})}
                </div>
            )}
            
            {/* Car Rental Tab */}
            {subTab === 'car' && (
               <div className="animate-scale-in">
                   <div className="mb-4 lg:mb-6 lg:flex lg:justify-end">
                        <button 
                            onClick={() => openCarEdit()}
                            className="w-full lg:w-auto lg:px-6 py-3 rounded-2xl border-2 border-dashed border-gray-300 text-gray-400 font-black hover:bg-white hover:border-sage transition-all flex items-center justify-center gap-2"
                        >
                            <Plus size={16}/> 新增租車
                        </button>
                   </div>

                   {carRentals.length === 0 && (
                       <div className="text-center py-24 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center">
                           <div className="w-24 h-24 bg-beige rounded-full flex items-center justify-center mb-6"><Car size={32} className="text-gray-400"/></div>
                           <p className="text-cocoa font-black text-2xl">尚未安排租車</p>
                       </div>
                   )}

                   {carRentals.map((car) => (
                       <div key={car.id} className="w-full bg-white rounded-[2.5rem] overflow-hidden shadow-hard-sm border-2 border-beige-dark flex flex-col group relative mb-6">
                            <div className="bg-blue-50 p-6 border-b-2 border-dashed border-blue-100 flex justify-between items-center relative">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-white rounded-2xl shadow-sm text-blue-500"><Car size={24}/></div>
                                    <div>
                                        <span className="text-[10px] font-black text-blue-400 tracking-widest uppercase block mb-0.5">租車資訊</span>
                                        <h3 className="text-2xl font-black text-cocoa leading-none">{car.company}</h3>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="bg-white text-blue-500 px-3 py-1 rounded-full text-xs font-black shadow-sm border border-blue-100">{car.platform || '租車'}</span>
                                    <div className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-wider">{car.carModel}</div>
                                </div>
                            </div>

                            <div className="p-6">
                                <button onClick={() => openCarEdit(car)} className="absolute top-4 right-6 w-8 h-8 rounded-full bg-white border-2 border-beige-dark text-gray-300 flex items-center justify-center hover:bg-blue-500 hover:border-blue-500 hover:text-white transition-all shadow-sm z-20"><PenTool size={14}/></button>
                                <div className="flex items-center justify-between mb-6 relative">
                                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -z-0"></div>
                                    <div className="bg-white z-10 pr-4">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">取車時間</span>
                                        <div className="text-sm font-black text-cocoa">
                                            {new Date(car.pickupDate).toLocaleString('zh-TW', {month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit'})}
                                        </div>
                                    </div>
                                    <div className="bg-white z-10 px-2">
                                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-400 flex items-center justify-center border-2 border-blue-100">
                                            <Compass size={16}/>
                                        </div>
                                    </div>
                                    <div className="bg-white z-10 pl-4 text-right">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">還車時間</span>
                                        <div className="text-sm font-black text-cocoa">
                                            {new Date(car.returnDate).toLocaleString('zh-TW', {month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit'})}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-6">
                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-beige-dark">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                                            <div>
                                                 <span className="text-[10px] font-bold text-gray-400 block uppercase">取車地點</span>
                                                <span className="text-sm font-bold text-cocoa">{car.pickupLocation}</span>
                                            </div>
                                        </div>
                                        <button onClick={() => openNav(car.pickupLocation)} className="text-blue-400 hover:text-blue-600"><Navigation size={16}/></button>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-beige-dark">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                                            <div>
                                                 <span className="text-[10px] font-bold text-gray-400 block uppercase">還車地點</span>
                                                <span className="text-sm font-bold text-cocoa">{car.returnLocation}</span>
                                            </div>
                                        </div>
                                        <button onClick={() => openNav(car.returnLocation)} className="text-orange-400 hover:text-orange-600"><Navigation size={16}/></button>
                                    </div>
                                </div>

                                <div className="flex gap-2 mb-6">
                                    {car.gps && (
                                        <button onClick={() => openNav('', car.gps)} className="flex-1 py-2 bg-white border-2 border-beige-dark rounded-xl text-xs font-bold text-sage flex items-center justify-center gap-1 hover:bg-sage hover:text-white transition-colors">
                                            <MapPin size={14}/> GPS 導航
                                        </button>
                                    )}
                                    {car.url && (
                                        <a href={car.url} target="_blank" className="flex-1 py-2 bg-white border-2 border-beige-dark rounded-xl text-xs font-bold text-blue-400 flex items-center justify-center gap-1 hover:bg-blue-50 transition-colors">
                                            <LinkIcon size={14}/> 租車網站
                                        </a>
                                    )}
                                </div>
                                {car.note && <div className="mb-4 text-xs font-bold text-gray-500 bg-yellow-50 p-3 rounded-xl border border-yellow-100">{car.note}</div>}

                                <div className="pt-4 border-t-2 border-dashed border-beige-dark flex justify-between items-center">
                                    <div className="flex -space-x-2">
                                        {car.participants?.slice(0, 3).map((pid, i) => (
                                            <div key={i} className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-bold text-gray-500 shadow-sm">
                                                {members.find(m => m.id === pid)?.name[0]}
                                            </div>
                                        ))}
                                        {(car.participants?.length || 0) > 3 && <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[10px] font-bold">+{car.participants!.length - 3}</div>}
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] font-bold text-gray-400 uppercase">每人分攤 (含稅)</div>
                                        <div className="text-base font-black text-cocoa font-mono">
                                            {car.currency} {Math.round(calculateTotal(car.price, car.hasServiceFee, car.serviceFeePercentage) / (car.participants?.length || 1)).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                       </div>
                   ))}
               </div>
            )}
        </div>

        {showFlightModal && editingFlight && (
            <div className="fixed inset-0 bg-cocoa/60 backdrop-blur-sm z-[150] flex flex-col items-center justify-end sm:justify-center sm:p-4 animate-fade-in" onClick={() => setShowFlightModal(false)}>
                <div className="bg-[#FAF8F2] w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-md sm:rounded-[2.5rem] rounded-none p-5 sm:p-6 shadow-2xl border-0 sm:border-4 sm:border-beige-dark flex flex-col justify-between overflow-hidden" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center pb-3 border-b-2 border-beige-dark flex-shrink-0">
                        <h3 className="font-black text-xl text-cocoa">{flights.find(f => f.id === editingFlight.id) ? '編輯航班' : '新增航班'}</h3>
                        <button onClick={() => setShowFlightModal(false)} className="p-2 bg-white rounded-full text-gray-400 hover:text-red-400 border border-beige-dark shadow-sm transition-colors">
                            <X size={18} />
                        </button>
                    </div>
                    
                    <div className="space-y-3 overflow-y-auto custom-scroll flex-1 py-4 pr-1">
                        <div className="flex bg-white p-1 rounded-xl border-2 border-beige-dark mb-4">
                            {['oneway', 'roundtrip'].map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setEditingFlight({...editingFlight, tripType: type as any})}
                                    className={`flex-1 py-2 rounded-lg text-xs font-black transition-all ${editingFlight.tripType === type ? 'bg-sage text-white shadow-sm' : 'text-gray-400 hover:bg-gray-50'}`}
                                >
                                    {type === 'oneway' ? '單程 (One-way)' : '來回 (Round-trip)'}
                                </button>
                            ))}
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <input value={editingFlight.airline} onChange={e => setEditingFlight({...editingFlight, airline: e.target.value})} className="w-full bg-white p-3 rounded-xl border-2 border-beige-dark outline-none font-bold text-cocoa text-sm" placeholder="航空公司 (EVA)"/>
                            <input value={editingFlight.code} onChange={e => setEditingFlight({...editingFlight, code: e.target.value.toUpperCase()})} className="w-full bg-white p-3 rounded-xl border-2 border-beige-dark outline-none font-black text-cocoa uppercase text-sm" placeholder="航班號 (BR123)"/>
                        </div>

                        <div className="space-y-3">
                            <DateTimePickerField
                                label="去程出發 (Departure)"
                                value={editingFlight.date}
                                onChange={val => setEditingFlight({...editingFlight, date: val})}
                                themeColor="cyan"
                                icon={Plane}
                            />

                            <DateTimePickerField
                                label="去程抵達 (Arrival)"
                                value={editingFlight.arrivalDate || editingFlight.date}
                                onChange={val => setEditingFlight({...editingFlight, arrivalDate: val})}
                                themeColor="cyan"
                                icon={Clock}
                            />

                            {editingFlight.tripType === 'roundtrip' && (
                                <div className="space-y-3 pt-2 border-t-2 border-dashed border-orange-200">
                                    <DateTimePickerField
                                        label="回程出發 (Return Departure)"
                                        value={editingFlight.returnDate || ''}
                                        onChange={val => setEditingFlight({...editingFlight, returnDate: val})}
                                        themeColor="orange"
                                        icon={ArrowRightLeft}
                                    />
                                    <DateTimePickerField
                                        label="回程抵達 (Return Arrival)"
                                        value={editingFlight.returnArrivalDate || ''}
                                        onChange={val => setEditingFlight({...editingFlight, returnArrivalDate: val})}
                                        themeColor="orange"
                                        icon={Clock}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="bg-white p-3 rounded-2xl border-2 border-beige-dark space-y-2">
                            <div className="flex items-center gap-2">
                                <Plane size={14} className="text-sage rotate-45"/> <span className="text-xs font-bold text-gray-400">航線資訊</span>
                            </div>
                            <div className="flex gap-2">
                                <div className="flex-[1]">
                                    <label className="text-[9px] font-bold text-gray-400 ml-1">代碼 (如 TPE)</label>
                                    <input value={editingFlight.origin} onChange={e => setEditingFlight({...editingFlight, origin: e.target.value.toUpperCase()})} className="w-full bg-beige/50 p-2 rounded-lg border border-beige-dark font-black text-cocoa uppercase mb-1 text-center" placeholder="TPE"/>
                                </div>
                                <div className="flex-[2]">
                                    <label className="text-[9px] font-bold text-gray-400 ml-1">出發城市</label>
                                    <input value={editingFlight.originCity} onChange={e => setEditingFlight({...editingFlight, originCity: e.target.value})} className="w-full bg-white p-2 rounded-lg border border-beige-dark font-bold text-cocoa outline-none text-sm" placeholder="例如：台北"/>
                                </div>
                            </div>
                            <div className="text-center text-gray-300 font-bold text-xs">⬇</div>
                            <div className="flex gap-2">
                                <div className="flex-[1]">
                                    <label className="text-[9px] font-bold text-gray-400 ml-1">代碼 (如 ZRH)</label>
                                    <input value={editingFlight.dest} onChange={e => setEditingFlight({...editingFlight, dest: e.target.value.toUpperCase()})} className="w-full bg-beige/50 p-2 rounded-lg border border-beige-dark font-black text-cocoa uppercase mb-1 text-center" placeholder="ZRH"/>
                                </div>
                                <div className="flex-[2]">
                                    <label className="text-[9px] font-bold text-gray-400 ml-1">抵達城市</label>
                                    <input value={editingFlight.destCity} onChange={e => setEditingFlight({...editingFlight, destCity: e.target.value})} className="w-full bg-white p-2 rounded-lg border border-beige-dark font-bold text-cocoa outline-none text-sm" placeholder="例如：蘇黎世"/>
                                </div>
                            </div>
                        </div>

                        {/* 去程轉機資訊 */}
                        <div className="bg-amber-50/60 p-3 rounded-2xl border border-amber-200/80 space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center text-xs font-black">轉</div>
                                    <span className="text-xs font-black text-amber-900">去程轉機資訊 (可選)</span>
                                </div>
                                <ToggleSwitch 
                                    checked={editingFlight.hasTransit || !!editingFlight.transitAirport || !!editingFlight.transitCity} 
                                    onChange={(checked) => setEditingFlight({
                                        ...editingFlight, 
                                        hasTransit: checked,
                                        ...(!checked ? { transitAirport: '', transitCity: '', transitDuration: '', transitFlightCode: '' } : {})
                                    })} 
                                    label={editingFlight.hasTransit || !!editingFlight.transitAirport ? "有轉機" : "直飛/無轉機"} 
                                    colorClass="bg-amber-400" 
                                />
                            </div>

                            {(editingFlight.hasTransit || !!editingFlight.transitAirport || !!editingFlight.transitCity) && (
                                <div className="space-y-2 pt-2 border-t border-amber-200/60">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-[9px] font-bold text-amber-800 ml-1 block mb-0.5">轉機機場代碼 (如 AUH)</label>
                                            <input value={editingFlight.transitAirport || ''} onChange={e => setEditingFlight({...editingFlight, transitAirport: e.target.value.toUpperCase()})} className="w-full bg-white p-2 rounded-lg border border-amber-200 font-black text-cocoa uppercase text-sm outline-none" placeholder="AUH"/>
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-bold text-amber-800 ml-1 block mb-0.5">轉機城市 (如 阿布達比)</label>
                                            <input value={editingFlight.transitCity || ''} onChange={e => setEditingFlight({...editingFlight, transitCity: e.target.value})} className="w-full bg-white p-2 rounded-lg border border-amber-200 font-bold text-cocoa text-sm outline-none" placeholder="阿布達比"/>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-[9px] font-bold text-amber-800 ml-1 block mb-0.5">轉機停留時間</label>
                                            <input value={editingFlight.transitDuration || ''} onChange={e => setEditingFlight({...editingFlight, transitDuration: e.target.value})} className="w-full bg-white p-2 rounded-lg border border-amber-200 font-bold text-cocoa text-sm outline-none" placeholder="例如：2h 30m"/>
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-bold text-amber-800 ml-1 block mb-0.5">銜接航班號 (可選)</label>
                                            <input value={editingFlight.transitFlightCode || ''} onChange={e => setEditingFlight({...editingFlight, transitFlightCode: e.target.value.toUpperCase()})} className="w-full bg-white p-2 rounded-lg border border-amber-200 font-black text-cocoa uppercase text-sm outline-none" placeholder="EY073"/>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 回程轉機資訊 */}
                        {editingFlight.tripType === 'roundtrip' && (
                            <div className="bg-amber-50/60 p-3 rounded-2xl border border-amber-200/80 space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center text-xs font-black">轉</div>
                                        <span className="text-xs font-black text-amber-900">回程轉機資訊 (可選)</span>
                                    </div>
                                    <ToggleSwitch 
                                        checked={editingFlight.hasReturnTransit || !!editingFlight.returnTransitAirport || !!editingFlight.returnTransitCity} 
                                        onChange={(checked) => setEditingFlight({
                                            ...editingFlight, 
                                            hasReturnTransit: checked,
                                            ...(!checked ? { returnTransitAirport: '', returnTransitCity: '', returnTransitDuration: '', returnTransitFlightCode: '' } : {})
                                        })} 
                                        label={editingFlight.hasReturnTransit || !!editingFlight.returnTransitAirport ? "有轉機" : "直飛/無轉機"} 
                                        colorClass="bg-amber-400" 
                                    />
                                </div>

                                {(editingFlight.hasReturnTransit || !!editingFlight.returnTransitAirport || !!editingFlight.returnTransitCity) && (
                                    <div className="space-y-2 pt-2 border-t border-amber-200/60">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="text-[9px] font-bold text-amber-800 ml-1 block mb-0.5">回程轉機機場 (如 AUH)</label>
                                                <input value={editingFlight.returnTransitAirport || ''} onChange={e => setEditingFlight({...editingFlight, returnTransitAirport: e.target.value.toUpperCase()})} className="w-full bg-white p-2 rounded-lg border border-amber-200 font-black text-cocoa uppercase text-sm outline-none" placeholder="AUH"/>
                                            </div>
                                            <div>
                                                <label className="text-[9px] font-bold text-amber-800 ml-1 block mb-0.5">回程轉機城市</label>
                                                <input value={editingFlight.returnTransitCity || ''} onChange={e => setEditingFlight({...editingFlight, returnTransitCity: e.target.value})} className="w-full bg-white p-2 rounded-lg border border-amber-200 font-bold text-cocoa text-sm outline-none" placeholder="阿布達比"/>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="text-[9px] font-bold text-amber-800 ml-1 block mb-0.5">回程轉機停留時間</label>
                                                <input value={editingFlight.returnTransitDuration || ''} onChange={e => setEditingFlight({...editingFlight, returnTransitDuration: e.target.value})} className="w-full bg-white p-2 rounded-lg border border-amber-200 font-bold text-cocoa text-sm outline-none" placeholder="例如：2h 30m"/>
                                            </div>
                                            <div>
                                                <label className="text-[9px] font-bold text-amber-800 ml-1 block mb-0.5">回程銜接航班號 (可選)</label>
                                                <input value={editingFlight.returnTransitFlightCode || ''} onChange={e => setEditingFlight({...editingFlight, returnTransitFlightCode: e.target.value.toUpperCase()})} className="w-full bg-white p-2 rounded-lg border border-amber-200 font-black text-cocoa uppercase text-sm outline-none" placeholder="EY898"/>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex gap-2">
                            <div className="flex-[1]">
                                <label className="text-[10px] font-bold text-gray-400 ml-1 block mb-1">去程時間</label>
                                <input value={editingFlight.duration} onChange={e => setEditingFlight({...editingFlight, duration: e.target.value})} className="w-full bg-white p-3 rounded-xl border-2 border-beige-dark outline-none font-bold text-cocoa text-sm" placeholder="2h 30m"/>
                            </div>
                            {editingFlight.tripType === 'roundtrip' && (
                                <div className="flex-[1]">
                                    <label className="text-[10px] font-bold text-gray-400 ml-1 block mb-1">回程時間</label>
                                    <input value={editingFlight.returnDuration || ''} onChange={e => setEditingFlight({...editingFlight, returnDuration: e.target.value})} className="w-full bg-white p-3 rounded-xl border-2 border-beige-dark outline-none font-bold text-cocoa text-sm" placeholder="2h 30m"/>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div className="bg-white p-3 rounded-2xl border border-beige-dark shadow-sm">
                                <label className="text-[10px] font-bold text-gray-400 block mb-1">託運行李</label>
                                <input value={editingFlight.checkedBag || ''} onChange={e => setEditingFlight({...editingFlight, checkedBag: e.target.value})} className="w-full text-sm font-bold text-cocoa outline-none bg-transparent" placeholder="23kg"/>
                            </div>
                            <div className="bg-white p-3 rounded-2xl border border-beige-dark shadow-sm">
                                <label className="text-[10px] font-bold text-gray-400 block mb-1">手提行李</label>
                                <input value={editingFlight.carryOnBag || ''} onChange={e => setEditingFlight({...editingFlight, carryOnBag: e.target.value})} className="w-full text-sm font-bold text-cocoa outline-none bg-transparent" placeholder="7kg"/>
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-2xl border-2 border-beige-dark space-y-3">
                            <div className="flex gap-2">
                               <div className="flex-[2]">
                                  <label className="text-[10px] font-bold text-gray-400 block mb-1">總金額</label>
                                  <input type="number" value={editingFlight.cost || ''} onChange={e => setEditingFlight({...editingFlight, cost: Number(e.target.value)})} className="w-full bg-beige/50 p-2 rounded-lg border border-beige-dark outline-none font-bold text-cocoa text-sm" placeholder="0"/>
                               </div>
                               <div className="flex-1">
                                  <label className="text-[10px] font-bold text-gray-400 block mb-1">幣別</label>
                                  <select value={editingFlight.currency} onChange={e => setEditingFlight({...editingFlight, currency: e.target.value})} className="w-full bg-beige/50 p-2 rounded-lg border border-beige-dark outline-none font-bold text-cocoa text-sm"><option value="TWD">TWD</option>{currencies.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}</select>
                               </div>
                            </div>
                            
                            <div className="flex items-center justify-between">
                                <ToggleSwitch 
                                    checked={editingFlight.hasServiceFee} 
                                    onChange={(checked) => setEditingFlight({...editingFlight, hasServiceFee: checked})} 
                                    label="額外稅金/手續費" 
                                    colorClass="bg-cyan-400" 
                                />
                                {editingFlight.hasServiceFee && (
                                   <div className="flex items-center gap-2 bg-white px-2 py-1 rounded border border-beige-dark"><input type="number" value={editingFlight.serviceFeePercentage || ''} onChange={(e) => setEditingFlight({...editingFlight, serviceFeePercentage: Number(e.target.value)})} placeholder="%" className="w-10 bg-transparent text-xs font-bold text-center outline-none text-cocoa border-b border-gray-200"/>                                        <span className="text-xs text-gray-400 font-bold">%</span>
                                   </div>
                                )}
                            </div>
                            
                            <CostPreview 
                                cost={editingFlight.cost} 
                                currency={editingFlight.currency} 
                                hasFee={editingFlight.hasServiceFee} 
                                feePct={editingFlight.serviceFeePercentage} 
                            />

                            <div>
                                <label className="text-[10px] font-bold text-gray-400 block mb-2">參與分攤成員</label>
                                <div className="flex flex-wrap gap-2">
                                    {members.map(m => (
                                       <button key={m.id} onClick={() => toggleFlightParticipant(m.id)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all ${editingFlight.participants?.includes(m.id) ? 'bg-sage text-white border-sage' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>{m.name}</button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-gray-400 ml-1">備註</label>
                            <textarea value={editingFlight.note} onChange={e => setEditingFlight({...editingFlight, note: e.target.value})} className="w-full bg-white p-3 rounded-xl border-2 border-beige-dark outline-none font-bold h-20 text-cocoa placeholder:text-gray-300" placeholder="例如：在 2 航廈集合..."></textarea>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-3 border-t-2 border-beige-dark mt-auto flex-shrink-0">
                        {editingFlight.id && flights.find(f => f.id === editingFlight.id) && (
                            <button onClick={deleteFlight} type="button" className="px-5 py-3.5 rounded-2xl bg-red-50 text-red-400 font-bold border-2 border-red-100 flex items-center justify-center gap-2 hover:bg-red-100 transition-colors">
                                <Trash2 size={18}/> 刪除
                            </button>
                        )}
                        <button onClick={() => setShowFlightModal(false)} className="flex-1 py-3.5 rounded-2xl bg-white text-gray-400 font-bold border-2 border-beige-dark hover:bg-gray-50 transition-colors">取消</button>
                        <button onClick={saveFlight} className="flex-1 py-3.5 rounded-2xl bg-sage text-white font-bold shadow-hard-sage border-2 border-sage-dark active:translate-y-1 active:shadow-none transition-all">保存</button>
                    </div>
                </div>
            </div>
        )}

        {showAccModal && editingAcc && (
            <div className="fixed inset-0 bg-cocoa/60 backdrop-blur-sm z-[150] flex flex-col items-center justify-end sm:justify-center sm:p-4 animate-fade-in" onClick={() => setShowAccModal(false)}>
                <div className="bg-[#FAF8F2] w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-md sm:rounded-[2.5rem] rounded-none p-5 sm:p-6 shadow-2xl border-0 sm:border-4 sm:border-beige-dark flex flex-col justify-between overflow-hidden" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center pb-3 border-b-2 border-beige-dark flex-shrink-0">
                        <h3 className="font-black text-xl text-cocoa">{editingAcc.id && accommodations.find(a => a.id === editingAcc.id) ? '編輯住宿' : '新增住宿'}</h3>
                        <button onClick={() => setShowAccModal(false)} className="p-2 bg-white rounded-full text-gray-400 hover:text-red-400 border border-beige-dark shadow-sm transition-colors">
                            <X size={18} />
                        </button>
                    </div>
                    <div className="space-y-4 overflow-y-auto custom-scroll flex-1 py-4 pr-1">
                        <div className="grid grid-cols-2 gap-2">
                            <div><label className="text-[10px] font-bold text-gray-400 ml-1">平台</label><input value={editingAcc.platform} onChange={e => setEditingAcc({...editingAcc, platform: e.target.value})} className="w-full bg-white p-3 rounded-xl border-2 border-beige-dark outline-none font-bold text-cocoa text-sm" placeholder="Agoda"/></div>
                            <div><label className="text-[10px] font-bold text-gray-400 ml-1">城市</label><input value={editingAcc.city} onChange={e => setEditingAcc({...editingAcc, city: e.target.value})} className="w-full bg-white p-3 rounded-xl border-2 border-beige-dark outline-none font-bold text-cocoa text-sm" placeholder="釜山"/></div>
                        </div>

                        <div><label className="text-[10px] font-bold text-gray-400 ml-1">住宿名稱</label><input value={editingAcc.name} onChange={e => setEditingAcc({...editingAcc, name: e.target.value})} className="w-full bg-white p-3 rounded-xl border-2 border-beige-dark outline-none font-bold text-cocoa" placeholder="飯店名稱"/></div>

                        <div className="bg-purple-50/50 p-3.5 rounded-2xl border-2 border-purple-100 space-y-3">
                            <DateTimePickerField
                                label="入住時間 (Check-in)"
                                value={editingAcc.checkInDate}
                                onChange={val => setEditingAcc({...editingAcc, checkInDate: val})}
                                themeColor="purple"
                                icon={House}
                            />
                            <DateTimePickerField
                                label="退房時間 (Check-out)"
                                value={editingAcc.checkOutDate}
                                onChange={val => setEditingAcc({...editingAcc, checkOutDate: val})}
                                themeColor="purple"
                                icon={House}
                            />
                        </div>

                        <div className="bg-white p-4 rounded-2xl border-2 border-beige-dark space-y-3">
                            <div className="flex gap-2">
                               <div className="flex-[2]">
                                  <label className="text-[10px] font-bold text-gray-400 block mb-1">總金額</label>
                                  <input type="number" value={editingAcc.cost || ''} onChange={e => setEditingAcc({...editingAcc, cost: Number(e.target.value)})} className="w-full bg-beige/50 p-2 rounded-lg border border-beige-dark outline-none font-bold text-cocoa text-sm" placeholder="0"/>
                               </div>
                               <div className="flex-1">
                                  <label className="text-[10px] font-bold text-gray-400 block mb-1">幣別</label>
                                  <select value={editingAcc.currency} onChange={e => setEditingAcc({...editingAcc, currency: e.target.value})} className="w-full bg-beige/50 p-2 rounded-lg border border-beige-dark outline-none font-bold text-cocoa text-sm"><option value="TWD">TWD</option>{currencies.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}</select>
                               </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <ToggleSwitch 
                                    checked={editingAcc.hasServiceFee} 
                                    onChange={(checked) => setEditingAcc({...editingAcc, hasServiceFee: checked})} 
                                    label="額外稅金/手續費" 
                                    colorClass="bg-purple-400" 
                                />
                                {editingAcc.hasServiceFee && (
                                    <div className="flex items-center gap-1">
                                        <input type="number" value={editingAcc.serviceFeePercentage || ''} onChange={(e) => setEditingAcc({...editingAcc, serviceFeePercentage: Number(e.target.value)})} placeholder="%" className="w-12 bg-transparent text-xs font-bold text-center outline-none text-cocoa border-b border-gray-300"/>
                                        <span className="text-xs text-gray-400 font-bold">%</span>
                                    </div>
                                )}
                            </div>

                            <CostPreview 
                                cost={editingAcc.cost} 
                                currency={editingAcc.currency} 
                                hasFee={editingAcc.hasServiceFee} 
                                feePct={editingAcc.serviceFeePercentage} 
                            />

                            <div><label className="text-[10px] font-bold text-gray-400 block mb-2">分攤成員</label><div className="flex flex-wrap gap-2">{members.map(m => (<button key={m.id} onClick={() => toggleAccParticipant(m.id)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all ${editingAcc.participants.includes(m.id) ? 'bg-sage text-white border-sage' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>{m.name}</button>))}</div></div>
                        </div>

                        <div><label className="text-[10px] font-bold text-gray-400 ml-1">備註</label><textarea value={editingAcc.note} onChange={e => setEditingAcc({...editingAcc, note: e.target.value})} className="w-full bg-white p-3 rounded-xl border-2 border-beige-dark outline-none font-bold h-20 text-cocoa"></textarea></div>
                    </div>
                    <div className="flex gap-3 pt-3 border-t-2 border-beige-dark mt-auto flex-shrink-0">
                        <button onClick={() => setShowAccModal(false)} className="flex-1 py-3.5 rounded-2xl bg-white text-gray-400 font-bold border-2 border-beige-dark hover:bg-gray-50 transition-colors">取消</button>
                        <button onClick={saveAcc} className="flex-1 py-3.5 rounded-2xl bg-sage text-white font-bold shadow-hard-sage border-2 border-sage-dark active:translate-y-1 active:shadow-none transition-all">保存</button>
                    </div>
                </div>
            </div>
        )}

        {showCarModal && editingCar && (
            <div className="fixed inset-0 bg-cocoa/60 backdrop-blur-sm z-[150] flex flex-col items-center justify-end sm:justify-center sm:p-4 animate-fade-in" onClick={() => setShowCarModal(false)}>
                <div className="bg-[#FAF8F2] w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-md sm:rounded-[2.5rem] rounded-none p-5 sm:p-6 shadow-2xl border-0 sm:border-4 sm:border-beige-dark flex flex-col justify-between overflow-hidden" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center pb-3 border-b-2 border-beige-dark flex-shrink-0">
                        <h3 className="font-black text-xl text-cocoa">{carRentals.find(c => c.id === editingCar.id) ? '編輯租車' : '新增租車'}</h3>
                        <button onClick={() => setShowCarModal(false)} className="p-2 bg-white rounded-full text-gray-400 hover:text-red-400 border border-beige-dark shadow-sm transition-colors">
                            <X size={18} />
                        </button>
                    </div>
                    <div className="space-y-4 overflow-y-auto custom-scroll flex-1 py-4 pr-1">
                        <div className="grid grid-cols-2 gap-2">
                            <div><label className="text-[10px] font-bold text-gray-400 ml-1">平台</label><input value={editingCar.platform} onChange={e => setEditingCar({...editingCar, platform: e.target.value})} className="w-full bg-white p-3 rounded-xl border-2 border-beige-dark outline-none font-bold text-cocoa text-sm" placeholder="Klook"/></div>
                            <div><label className="text-[10px] font-bold text-gray-400 ml-1">租車公司</label><input value={editingCar.company} onChange={e => setEditingCar({...editingCar, company: e.target.value})} className="w-full bg-white p-3 rounded-xl border-2 border-beige-dark outline-none font-bold text-cocoa text-sm" placeholder="Lotte"/></div>
                        </div>

                        <div className="bg-blue-50/50 p-3.5 rounded-2xl border-2 border-blue-100 space-y-3.5">
                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-blue-700 flex items-center gap-1.5 px-1">
                                    <Compass size={13} className="text-blue-600"/> 取車時間 (Pick-up)
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <DatePickerField
                                        label="日期"
                                        value={editingCar.pickupDate}
                                        onChange={val => setEditingCar({...editingCar, pickupDate: val})}
                                        themeColor="blue"
                                    />
                                    <TimePickerField
                                        label="時間"
                                        value={editingCar.pickupTime}
                                        onChange={val => setEditingCar({...editingCar, pickupTime: val})}
                                        themeColor="blue"
                                    />
                                </div>
                                <input value={editingCar.pickupLocation} onChange={e => setEditingCar({...editingCar, pickupLocation: e.target.value})} className="w-full bg-white p-2.5 rounded-xl border border-blue-200 font-bold text-cocoa text-xs mt-1 outline-none focus:border-blue-400" placeholder="取車地點 (例: 千歲機場營業所)"/>
                            </div>

                            <div className="space-y-1.5 pt-2 border-t border-dashed border-blue-200">
                                <label className="text-xs font-black text-orange-600 flex items-center gap-1.5 px-1">
                                    <Compass size={13} className="text-orange-500"/> 還車時間 (Return)
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <DatePickerField
                                        label="日期"
                                        value={editingCar.returnDate}
                                        onChange={val => setEditingCar({...editingCar, returnDate: val})}
                                        themeColor="orange"
                                    />
                                    <TimePickerField
                                        label="時間"
                                        value={editingCar.returnTime}
                                        onChange={val => setEditingCar({...editingCar, returnTime: val})}
                                        themeColor="orange"
                                    />
                                </div>
                                <input value={editingCar.returnLocation} onChange={e => setEditingCar({...editingCar, returnLocation: e.target.value})} className="w-full bg-white p-2.5 rounded-xl border border-orange-200 font-bold text-cocoa text-xs mt-1 outline-none focus:border-orange-400" placeholder="還車地點"/>
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-2xl border-2 border-beige-dark space-y-3">
                            <div className="flex gap-2">
                               <div className="flex-[2]">
                                  <label className="text-[10px] font-bold text-gray-400 block mb-1">總金額</label>
                                  <input type="number" value={editingCar.price || ''} onChange={e => setEditingCar({...editingCar, price: Number(e.target.value)})} className="w-full bg-beige/50 p-2 rounded-lg border border-beige-dark outline-none font-bold text-cocoa text-sm" placeholder="0"/>
                               </div>
                               <div className="flex-1">
                                  <label className="text-[10px] font-bold text-gray-400 block mb-1">幣別</label>
                                  <select value={editingCar.currency} onChange={e => setEditingCar({...editingCar, currency: e.target.value})} className="w-full bg-beige/50 p-2 rounded-lg border border-beige-dark outline-none font-bold text-cocoa text-sm"><option value="TWD">TWD</option>{currencies.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}</select>
                               </div>
                            </div>

                            <CostPreview 
                                cost={editingCar.price} 
                                currency={editingCar.currency} 
                                hasFee={editingCar.hasServiceFee} 
                                feePct={editingCar.serviceFeePercentage} 
                            />

                            <div><label className="text-[10px] font-bold text-gray-400 block mb-2">分攤成員</label><div className="flex flex-wrap gap-2">{members.map(m => (<button key={m.id} onClick={() => toggleCarParticipant(m.id)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all ${editingCar.participants?.includes(m.id) ? 'bg-sage text-white border-sage' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>{m.name}</button>))}</div></div>
                        </div>

                        <div><label className="text-[10px] font-bold text-gray-400 ml-1">備註</label><textarea value={editingCar.note} onChange={e => setEditingCar({...editingCar, note: e.target.value})} className="w-full bg-white p-3 rounded-xl border-2 border-beige-dark outline-none font-bold h-20 text-cocoa"></textarea></div>
                    </div>
                    <div className="flex gap-3 pt-3 border-t-2 border-beige-dark mt-auto flex-shrink-0">
                        {carRentals.find(c => c.id === editingCar.id) && (
                            <button onClick={deleteCar} type="button" className="px-5 py-3.5 rounded-2xl bg-red-50 text-red-400 font-bold border-2 border-red-100 flex items-center justify-center gap-2 hover:bg-red-100 transition-colors">
                                <Trash2 size={18}/> 刪除
                            </button>
                        )}
                        <button onClick={() => setShowCarModal(false)} className="flex-1 py-3.5 rounded-2xl bg-white text-gray-400 font-bold border-2 border-beige-dark hover:bg-gray-50 transition-colors">取消</button>
                        <button onClick={saveCar} className="flex-1 py-3.5 rounded-2xl bg-sage text-white font-bold shadow-hard-sage border-2 border-sage-dark active:translate-y-1 active:shadow-none transition-all">保存</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};