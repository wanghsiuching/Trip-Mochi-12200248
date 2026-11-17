import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  Plane, Bed, Car, Plus, MapPin, Compass, House, PenTool, Briefcase, 
  Info, Luggage, Navigation, Leaf, Link as LinkIcon, ExternalLink, X, 
  Calendar as CalendarIcon, ArrowRightLeft, Users, Clock, DollarSign, 
  Trash2, Moon, Sparkles, Building, CheckCircle2, TrendingUp, HelpCircle, Camera
} from 'lucide-react';
import { BookingFlight, BookingAccommodation, BookingCarRental, BookingTicket, Currency, Member } from '../types';
import { ToggleSwitch, PhotoUploadSection } from './modals';
import { DateTimePickerField, TimePickerField, DatePickerField } from './TimePickerComponents';
import { TransportCard } from './transport/TransportCard';
import { bookingFlightToTransport } from './transport/adapters';
import { Lightbox } from './Lightbox';

interface BookingsViewProps {
  tripId?: string;
  onOpenLightbox?: (images: string[], index: number) => void;
  flights: BookingFlight[];
  accommodations: BookingAccommodation[];
  carRentals: BookingCarRental[];
  tickets: BookingTicket[];
  currencies: Currency[];
  members: Member[];
  onAddFlight: (flight: BookingFlight) => Promise<void> | void;
  onUpdateFlight: (flight: BookingFlight) => Promise<void> | void;
  onDeleteFlight: (id: number) => Promise<void> | void;
  onUpdateAccommodation: (acc: BookingAccommodation) => Promise<void> | void;
  onDeleteAccommodation: (id: number) => Promise<void> | void;
  onAddAccommodation: (acc: BookingAccommodation) => Promise<void> | void;
  onAddCar: (car: BookingCarRental) => Promise<void> | void;
  onUpdateCar: (car: BookingCarRental) => Promise<void> | void;
  onDeleteCar: (id: number) => Promise<void> | void;
  onAddTicket: (ticket: BookingTicket) => Promise<void> | void;
  onUpdateTicket: (ticket: BookingTicket) => Promise<void> | void;
  onDeleteTicket: (id: number) => Promise<void> | void;
}

export const BookingsView: React.FC<BookingsViewProps> = ({ 
    tripId, onOpenLightbox,
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

  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [localLightbox, setLocalLightbox] = useState<{ images: string[]; index: number } | null>(null);

  const openLightbox = (images: string[], index: number) => {
    if (onOpenLightbox) {
      onOpenLightbox(images, index);
    } else {
      setLocalLightbox({ images, index });
    }
  };

  const renderBookingPhotoBanner = (
    images: string[],
    title: string,
    offsetY: number = 50,
    variant: 'top' | 'middle' | 'bottom' = 'middle'
  ) => {
    if (!images || images.length === 0) return null;
    const containerClass =
      variant === 'top'
        ? 'relative w-full h-44 sm:h-56 overflow-hidden border-b-2 border-beige-dark group/photo cursor-pointer bg-gray-100'
        : variant === 'bottom'
          ? 'relative w-full rounded-2xl overflow-hidden border-2 border-beige-dark shadow-sm group/photo cursor-pointer bg-gray-100 mt-2'
          : 'relative w-full rounded-2xl overflow-hidden border-2 border-beige-dark shadow-sm group/photo cursor-pointer bg-gray-100';

    return (
      <div
        className={containerClass}
        onClick={(e) => {
          e.stopPropagation();
          openLightbox(images, 0);
        }}
      >
        <img
          src={images[0]}
          alt={title}
          className={`w-full ${variant === 'top' ? 'h-full' : 'h-44 sm:h-56'} object-cover transition-transform duration-500 group-hover/photo:scale-105`}
          style={{ objectPosition: `center ${offsetY}%` }}
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-end justify-between p-3 text-white">
          <span className="text-xs font-black drop-shadow-md">點擊查看大圖</span>
          <span className="text-[11px] font-bold bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-full drop-shadow-md flex items-center gap-1">
            <Camera size={12} /> {images.length > 1 ? `${images.length} 張相片` : '相片'}
          </span>
        </div>
        {images.length > 1 && (
          <div className="absolute bottom-2.5 right-2.5 bg-cocoa/75 backdrop-blur-md text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1 border border-white/20">
            <Camera size={11} />
            <span>1/{images.length}</span>
          </div>
        )}
      </div>
    );
  };

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
  const toLocalDateTimeStr = (d: Date) => {
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const normalizeDateTimeInput = (val?: string, fallbackTime?: string) => {
      if (!val) return '';
      if (val.includes('T')) return val.slice(0, 16);
      if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
          const t = fallbackTime && /^\d{2}:\d{2}$/.test(fallbackTime) ? fallbackTime : '09:00';
          return `${val}T${t}`;
      }
      return val;
  };

  const openFlightEdit = (flight?: BookingFlight) => {
      setIsUploadingPhoto(false);
      setIsSaving(false);
      setSaveError(null);
      if (flight) {
          const normDate = normalizeDateTimeInput(flight.date, flight.depTime);
          const normArrivalDate = normalizeDateTimeInput(flight.arrivalDate || flight.date, flight.arrTime);
          const normReturnDate = normalizeDateTimeInput(flight.returnDate);
          const normReturnArrivalDate = normalizeDateTimeInput(flight.returnArrivalDate);
          const parsedDep = normDate.includes('T') ? normDate.slice(11, 16) : '';
          const parsedArr = normArrivalDate.includes('T') ? normArrivalDate.slice(11, 16) : '';
          const resolvedDepTime = (parsedDep && parsedDep !== '00:00')
              ? parsedDep
              : ((flight.depTime && flight.depTime !== '00:00') ? flight.depTime : parsedDep);
          const resolvedArrTime = (parsedArr && parsedArr !== '00:00')
              ? parsedArr
              : ((flight.arrTime && flight.arrTime !== '00:00') ? flight.arrTime : parsedArr);

          setEditingFlight({
              ...flight,
              date: resolvedDepTime && normDate ? `${normDate.slice(0, 10)}T${resolvedDepTime}` : normDate,
              arrivalDate: resolvedArrTime && normArrivalDate ? `${normArrivalDate.slice(0, 10)}T${resolvedArrTime}` : normArrivalDate,
              returnDate: normReturnDate,
              returnArrivalDate: normReturnArrivalDate,
              depTime: resolvedDepTime || '',
              arrTime: resolvedArrTime || '',
              images: flight.images || [],
              photoPlacement: flight.photoPlacement || 'middle',
              photoOffsetY: flight.photoOffsetY ?? 50
          });
      } else {
          const nowLocal = toLocalDateTimeStr(new Date());
          const nowTime = nowLocal.slice(11, 16);
          const newFlight: BookingFlight = {
              id: Date.now(),
              airline: '',
              code: '',
              date: nowLocal,
              arrivalDate: nowLocal,
              origin: 'TPE',
              originCity: '台北',
              dest: 'PUS',
              destCity: '釜山',
              depTime: nowTime,
              arrTime: nowTime,
              duration: '',
              returnDuration: '',
              aircraft: '',
              checkedBag: '',
              carryOnBag: '',
              baggage: '',
              color: 'bg-blue-500', 
              purchaseDate: nowLocal.slice(0, 10),
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
              arrivalAirport: '',
              images: [],
              photoPlacement: 'middle',
              photoOffsetY: 50
          };
          setEditingFlight(newFlight);
      }
      setShowFlightModal(true);
  };

  const saveFlight = async () => {
      if (!editingFlight || isSaving || isUploadingPhoto) return;
      setIsSaving(true);
      setSaveError(null);
      try {
          const syncedFlight: BookingFlight = {
              ...editingFlight,
              depTime: editingFlight.date?.includes('T')
                  ? editingFlight.date.slice(11, 16)
                  : (editingFlight.depTime || ''),
              arrTime: editingFlight.arrivalDate?.includes('T')
                  ? editingFlight.arrivalDate.slice(11, 16)
                  : (editingFlight.arrTime || ''),
          };
          if (flights.find(f => String(f.id) === String(syncedFlight.id))) {
             await onUpdateFlight(syncedFlight);
          } else {
             await onAddFlight(syncedFlight);
          }
          setShowFlightModal(false);
      } catch (err: any) {
          console.error('保存航班失敗:', err);
          setSaveError(err?.message || '儲存失敗，若相片過多或檔案過大請嘗試減少張數後再試。');
      } finally {
          setIsSaving(false);
      }
  };

  const deleteFlight = async () => {
      if (!editingFlight || isSaving) return;
      if (window.confirm('確定刪除此航班？')) {
          setIsSaving(true);
          setSaveError(null);
          try {
              await onDeleteFlight(editingFlight.id);
              setShowFlightModal(false);
          } catch (err: any) {
              console.error('刪除航班失敗:', err);
              setSaveError(err?.message || '刪除失敗，請稍後再試。');
          } finally {
              setIsSaving(false);
          }
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
  const calculateStayNights = (inDate?: string, outDate?: string, fallbackNights?: number) => {
      if (!inDate || !outDate) return fallbackNights || 1;
      try {
          const d1 = new Date(inDate);
          const d2 = new Date(outDate);
          const d1Zero = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate()).getTime();
          const d2Zero = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate()).getTime();
          const diffDays = Math.round((d2Zero - d1Zero) / (1000 * 60 * 60 * 24));
          return diffDays > 0 ? diffDays : (fallbackNights || 1);
      } catch {
          return fallbackNights || 1;
      }
  };

  const openAccEdit = (acc?: BookingAccommodation) => {
      setIsUploadingPhoto(false);
      setIsSaving(false);
      setSaveError(null);
      if(acc) {
          const stayNights = calculateStayNights(acc.checkInDate, acc.checkOutDate, acc.nights);
          const existingImages = (acc.images && acc.images.length > 0) ? acc.images : (acc.photos || []);
          setEditingAcc({
              ...acc,
              nights: stayNights,
              photos: undefined,
              images: existingImages,
              photoPlacement: acc.photoPlacement || 'middle',
              photoOffsetY: acc.photoOffsetY ?? 50
          });
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
              city: '', 
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
              images: [],
              photoPlacement: 'middle',
              photoOffsetY: 50,
              note: '',
              isPotential: false
          });
      }
      setShowAccModal(true);
  };

  const saveAcc = async () => {
      if (!editingAcc || isSaving || isUploadingPhoto) return;
      setIsSaving(true);
      setSaveError(null);
      try {
          const stayNights = calculateStayNights(editingAcc.checkInDate, editingAcc.checkOutDate, editingAcc.nights);
          const syncedImages = editingAcc.images || editingAcc.photos || [];
          const accToSave: BookingAccommodation = { ...editingAcc, nights: stayNights, images: syncedImages, photos: undefined };
          if (accommodations.find(a => a.id === editingAcc.id)) {
              await onUpdateAccommodation(accToSave);
          } else {
              await onAddAccommodation(accToSave);
          }
          setShowAccModal(false);
      } catch (err: any) {
          console.error('保存住宿失敗:', err);
          setSaveError(err?.message || '儲存失敗，若相片過多或檔案過大請嘗試減少張數後再試。');
      } finally {
          setIsSaving(false);
      }
  };

  const toggleAccParticipant = (id: string) => {
      if (!editingAcc) return;
      const current = editingAcc.participants || [];
      const updated = current.includes(id) 
          ? current.filter(p => p !== id) 
          : [...current, id];
      setEditingAcc({ ...editingAcc, participants: updated });
  };

  // Direct Link or Smart Navigation Handler (directly opens web URLs or searches address without pasting raw URLs into Google search)
  const openMapNav = (options: { address?: string; gps?: string; name?: string; city?: string }) => {
      const { address, gps, name, city } = options;
      const target = (address || gps || '').trim();

      // If user provided an address / link / GPS
      if (target) {
          // If it is a web URL or Google Maps share link (http://, https://, maps.app.goo.gl, goo.gl, www., etc.)
          if (/^(https?:\/\/|www\.|maps\.app\.goo\.gl|goo\.gl)/i.test(target)) {
              const fullUrl = /^https?:\/\//i.test(target) ? target : `https://${target}`;
              window.open(fullUrl, '_blank', 'noopener,noreferrer');
              return;
          }

          // If plain text address / place name, search on Google Maps
          window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(target)}`, '_blank', 'noopener,noreferrer');
          return;
      }

      // Fallback: If no address/gps given, search by city and name
      const fallbackPlace = [city, name].filter(Boolean).join(' ').trim();
      if (fallbackPlace) {
          window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fallbackPlace)}`, '_blank', 'noopener,noreferrer');
      }
  };

  const openWebLink = (url?: string) => {
      if (!url) return;
      const formatted = (url.startsWith('http://') || url.startsWith('https://')) ? url : `https://${url}`;
      window.open(formatted, '_blank', 'noopener,noreferrer');
  };

  const openNav = (address: string, gps?: string) => {
      openMapNav({ address, gps });
  };

  // --- Car Logic ---
  const openCarEdit = (car?: BookingCarRental) => {
      setIsUploadingPhoto(false);
      setIsSaving(false);
      setSaveError(null);
      if (car) {
          setEditingCar({
              ...car,
              images: car.images || [],
              photoPlacement: car.photoPlacement || 'middle',
              photoOffsetY: car.photoOffsetY ?? 50
          });
      } else {
          const initialCar: BookingCarRental = { 
              id: Date.now(),
              company: '', platform: '', carModel: '', ref: '', 
              pickupDate: new Date().toISOString().slice(0, 16), pickupTime: '10:00', pickupLocation: '', 
              returnDate: new Date(Date.now() + 86400000).toISOString().slice(0, 16), returnTime: '10:00', returnLocation: '', 
              gps: '', url: '', note: '', 
              price: 0, currency: 'TWD', hasServiceFee: false, serviceFeePercentage: 0, 
              pax: 4, participants: members.map(m => m.id),
              hasRental: true,
              images: [],
              photoPlacement: 'middle',
              photoOffsetY: 50
          };
          setEditingCar(initialCar);
      }
      setShowCarModal(true);
  };

  const saveCar = async () => {
      if (!editingCar || isSaving || isUploadingPhoto) return;
      setIsSaving(true);
      setSaveError(null);
      try {
          if (carRentals.find(c => c.id === editingCar.id)) {
              await onUpdateCar(editingCar);
          } else {
              await onAddCar(editingCar);
          }
          setShowCarModal(false);
      } catch (err: any) {
          console.error('保存租車失敗:', err);
          setSaveError(err?.message || '儲存失敗，若相片過多或檔案過大請嘗試減少張數後再試。');
      } finally {
          setIsSaving(false);
      }
  };

  const deleteCar = async () => {
      if (!editingCar || isSaving) return;
      if (window.confirm('確定刪除此租車紀錄？')) {
          setIsSaving(true);
          setSaveError(null);
          try {
              await onDeleteCar(editingCar.id);
              setShowCarModal(false);
          } catch (err: any) {
              console.error('刪除租車失敗:', err);
              setSaveError(err?.message || '刪除失敗，請稍後再試。');
          } finally {
              setIsSaving(false);
          }
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
                <div className="space-y-4 animate-scale-in">
                    <div className="mb-4">
                        <button 
                            type="button"
                            onClick={() => openFlightEdit()} 
                            className="w-full py-3 rounded-2xl border-2 border-dashed border-gray-300 text-gray-400 font-black hover:bg-white hover:border-sage transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <Plus size={16}/> 新增機票
                        </button>
                    </div>

                    {flights.length > 0 && (
                        <div className="space-y-4">
                            {flights.map((flight) => {
                                const transportItems = bookingFlightToTransport(flight);
                                return (
                                    <div key={flight.id} className="space-y-3">
                                        {transportItems.map((item) => (
                                            <TransportCard
                                                key={item.id}
                                                item={item}
                                                defaultExpanded={false}
                                                onEdit={() => openFlightEdit(flight)}
                                                onDelete={() => onDeleteFlight(Number(flight.id))}
                                                onOpenLightbox={openLightbox}
                                            />
                                        ))}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {flights.length === 0 && (
                        <div className="text-center py-16 bg-white rounded-[2.5rem] border-2 border-dashed border-gray-300">
                            <div className="w-16 h-16 rounded-full bg-cyan-50 text-cyan-500 flex items-center justify-center mx-auto mb-3">
                                <Plane size={32} />
                            </div>
                            <p className="text-cocoa font-black text-lg">尚未新增機票</p>
                            <p className="text-xs text-gray-400 mt-1">點擊上方按鈕新增第一筆機票資料</p>
                        </div>
                    )}
                </div>
            )}

            {/* Accommodation Tab */}
            {subTab === 'hotel' && (
                <div className="animate-scale-in">
                    <div className="mb-4">
                        <button onClick={() => openAccEdit()} className="w-full py-3 rounded-2xl border-2 border-dashed border-gray-300 text-gray-400 font-black hover:bg-white hover:border-sage transition-all flex items-center justify-center gap-2 cursor-pointer">
                            <Plus size={16}/> 新增住宿
                        </button>
                    </div>

                    {accommodations.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-[2.5rem] border-2 border-dashed border-gray-300">
                            <div className="w-16 h-16 rounded-full bg-purple-50 text-purple-400 flex items-center justify-center mx-auto mb-3">
                                <Bed size={32} />
                            </div>
                            <p className="text-cocoa font-black text-lg">尚未新增住宿</p>
                            <p className="text-gray-400 text-xs font-bold mt-1">點擊上方按鈕新增飯店、民宿或 Airbnb 資訊</p>
                        </div>
                    ) : (
                    <div className="space-y-5">
                    {accommodations.map(acc => {
                        const stayNights = calculateStayNights(acc.checkInDate, acc.checkOutDate, acc.nights);
                        const totalCost = calculateTotal(acc.cost, acc.hasServiceFee, acc.serviceFeePercentage);
                        const perPerson = Math.round(totalCost / (acc.participants.length || 1));
                        const checkInDisplay = new Date(acc.checkInDate).toLocaleDateString('zh-TW', {month:'numeric', day:'numeric'}) + ' ' + new Date(acc.checkInDate).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
                        const checkOutDisplay = new Date(acc.checkOutDate).toLocaleDateString('zh-TW', {month:'numeric', day:'numeric'}) + ' ' + new Date(acc.checkOutDate).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
                        const hasAddress = !!(acc.address && acc.address.trim());
                        const accImages = (acc.images && acc.images.length > 0) ? acc.images : (acc.photos || []);
                        const accPlacement = acc.photoPlacement || 'middle';
                        const accOffsetY = acc.photoOffsetY ?? 50;
                        return (
                        <div 
                            key={acc.id} 
                            onClick={() => openAccEdit(acc)} 
                            className="bg-white rounded-[2rem] shadow-sm hover:shadow-md border-2 border-beige-dark flex flex-col transition-all cursor-pointer group active:scale-[0.995] relative overflow-hidden"
                        >
                            {/* 頂部封面橫幅 */}
                            {accPlacement === 'top' && renderBookingPhotoBanner(accImages, acc.name || '住宿相片', accOffsetY, 'top')}

                            <div className="p-5 sm:p-6 space-y-4">
                                {/* Card Top Category & Duration Pills */}
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex flex-wrap gap-1.5 items-center">
                                        <div className="bg-beige-light px-3 py-1 rounded-full text-xs font-black text-cocoa border border-beige-dark flex items-center gap-1.5 shadow-2xs">
                                            <Leaf size={12} className="text-sage"/>
                                            {acc.platform || '住宿預訂'}
                                        </div>
                                        {acc.city && (
                                            <div className="bg-purple-600 text-white px-2.5 py-0.5 rounded-full text-[11px] font-black shadow-2xs">
                                                {acc.city}
                                            </div>
                                        )}
                                        {acc.isPotential && (
                                            <div className="bg-amber-500 text-white px-2.5 py-0.5 rounded-full text-[11px] font-black shadow-2xs flex items-center gap-1">
                                                <Sparkles size={11} /> 潛在預算
                                            </div>
                                        )}
                                    </div>
                                    <div className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-xs font-black border border-purple-200 shadow-2xs flex items-center gap-1">
                                        <Moon size={12} /> {stayNights} 晚
                                    </div>
                                </div>

                                {/* Card Title & Cost */}
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                                    <div>
                                        <h3 className="text-xl font-black text-cocoa leading-snug group-hover:text-purple-700 transition-colors">
                                            {acc.name || '未命名住宿'}
                                        </h3>
                                        {acc.ref && (
                                            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 mt-0.5">
                                                <span>確認碼: {acc.ref}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="sm:text-right">
                                        <div className="text-2xl font-black text-cocoa font-mono">{acc.currency} {totalCost.toLocaleString()}</div>
                                        {acc.currency !== 'TWD' && (
                                            <div className="text-xs font-bold text-sage font-mono">≈ NT$ {Math.round(totalCost * getExchangeRate(acc.currency)).toLocaleString()}</div>
                                        )}
                                        <div className="text-[10px] font-bold text-gray-400">總金額 {acc.hasServiceFee ? `(含稅 ${acc.serviceFeePercentage}%)` : '(含稅)'}</div>
                                    </div>
                                </div>

                                {/* Check-in & Check-out time badge */}
                                <div className="bg-gray-50/80 rounded-2xl p-3.5 border border-beige-dark flex justify-between items-center relative">
                                    <div className="text-center pl-2">
                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">入住時間</div>
                                        <div className="text-xs sm:text-sm font-black text-cocoa">{checkInDisplay}</div>
                                    </div>
                                    <div className="flex-1 border-b-2 border-dashed border-gray-300 mx-3 sm:mx-6 relative top-[-6px]">
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-50 px-2 text-purple-400">
                                            <House size={14}/>
                                        </div>
                                    </div>
                                    <div className="text-center pr-2">
                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">退房時間</div>
                                        <div className="text-xs sm:text-sm font-black text-cocoa">{checkOutDisplay}</div>
                                    </div>
                                </div>

                                {/* 卡片中間相片橫幅 (預設) */}
                                {accPlacement === 'middle' && renderBookingPhotoBanner(accImages, acc.name || '住宿相片', accOffsetY, 'middle')}

                                {/* Location & Map Search Row - strictly bound to address field */}
                                <div className="space-y-2.5 pt-1">
                                    {hasAddress ? (
                                        <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-purple-50/50 border border-purple-100 text-xs font-bold text-cocoa flex-wrap sm:flex-nowrap">
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                <MapPin size={14} className="text-purple-600 flex-shrink-0"/>
                                                <span className="break-words flex-1 leading-snug">{acc.address}</span>
                                            </div>
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation(); 
                                                    openMapNav({ address: acc.address });
                                                }} 
                                                className="px-2.5 py-1 rounded-lg bg-white hover:bg-purple-100 text-purple-700 border border-purple-200 shadow-2xs text-[11px] font-black flex items-center gap-1 flex-shrink-0 transition-colors"
                                                title="開啟地圖或直接導航"
                                            >
                                                <Navigation size={12}/> 地圖搜尋
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-gray-50/80 border border-gray-200 text-xs font-bold text-gray-400">
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                <MapPin size={14} className="text-gray-400 flex-shrink-0"/>
                                                <span className="break-words italic">尚未設定地址 (點擊卡片編輯)</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Note */}
                                    {acc.note && (
                                        <div className="flex items-start gap-2 text-xs font-bold text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-100">
                                            <Info size={13} className="flex-shrink-0 mt-0.5 text-amber-500"/>
                                            <span>{acc.note}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Card Footer with Members and Per-person Split */}
                                <div className="pt-3 border-t-2 border-dashed border-beige-dark flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <div className="flex -space-x-2">
                                            {acc.participants.slice(0, 3).map((pid, i) => (
                                                <div key={i} className="w-6 h-6 rounded-full bg-purple-100 border-2 border-white flex items-center justify-center text-[10px] font-black text-purple-700 shadow-xs">
                                                    {members.find(m => m.id === pid)?.name[0] || '人'}
                                                </div>
                                            ))}
                                            {(acc.participants.length > 3) && (
                                                <div className="w-6 h-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[8px] font-bold text-gray-500">
                                                    +{acc.participants.length - 3}
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-400">{acc.participants.length} 人分攤</span>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] font-bold text-gray-400 uppercase">每人分攤金額</div>
                                        <div className="text-base font-black text-sage font-mono">{acc.currency} {perPerson.toLocaleString()}</div>
                                    </div>
                                </div>

                                {/* 卡片最底相片橫幅 */}
                                {accPlacement === 'bottom' && renderBookingPhotoBanner(accImages, acc.name || '住宿相片', accOffsetY, 'bottom')}
                            </div>
                        </div>
                    )})}
                    </div>
                    )}
                </div>
            )}
            
            {/* Car Rental Tab */}
            {subTab === 'car' && (
               <div className="animate-scale-in">
                   <div className="mb-4">
                        <button 
                            onClick={() => openCarEdit()}
                            className="w-full py-3 rounded-2xl border-2 border-dashed border-gray-300 text-gray-400 font-black hover:bg-white hover:border-sage transition-all flex items-center justify-center gap-2 cursor-pointer"
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

                   {carRentals.map((car) => {
                       const carImages = car.images || [];
                       const carPlacement = car.photoPlacement || 'middle';
                       const carOffsetY = car.photoOffsetY ?? 50;
                       return (
                       <div key={car.id} className="w-full bg-white rounded-[2.5rem] overflow-hidden shadow-hard-sm border-2 border-beige-dark flex flex-col group relative mb-6">
                            {/* 頂部封面橫幅 */}
                            {carPlacement === 'top' && renderBookingPhotoBanner(carImages, car.company || '租車相片', carOffsetY, 'top')}

                            <div className="bg-blue-50 p-6 border-b-2 border-dashed border-blue-100 flex justify-between items-center relative gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="p-3 bg-white rounded-2xl shadow-sm text-blue-500 flex-shrink-0"><Car size={24}/></div>
                                    <div className="min-w-0">
                                        <span className="text-[10px] font-black text-blue-400 tracking-widest uppercase block mb-0.5">租車資訊</span>
                                        <h3 className="text-2xl font-black text-cocoa leading-none break-words">{car.company || '未命名租車'}</h3>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2.5 flex-shrink-0">
                                    <div className="text-right">
                                        <span className="bg-white text-blue-500 px-3 py-1 rounded-full text-xs font-black shadow-sm border border-blue-100">{car.platform || '租車'}</span>
                                        <div className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-wider">{car.carModel}</div>
                                    </div>
                                    <button onClick={() => openCarEdit(car)} className="w-8 h-8 rounded-full bg-white border-2 border-beige-dark text-gray-400 flex items-center justify-center hover:bg-blue-500 hover:border-blue-500 hover:text-white transition-all shadow-sm flex-shrink-0 cursor-pointer" title="編輯租車">
                                        <PenTool size={14}/>
                                    </button>
                                </div>
                            </div>

                            <div className="p-6">
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

                                {/* 卡片中間相片橫幅 (預設) */}
                                {carPlacement === 'middle' && carImages.length > 0 && (
                                    <div className="mb-6">
                                        {renderBookingPhotoBanner(carImages, car.company || '租車相片', carOffsetY, 'middle')}
                                    </div>
                                )}

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

                                {/* 卡片最底相片橫幅 */}
                                {carPlacement === 'bottom' && carImages.length > 0 && (
                                    <div className="mt-4">
                                        {renderBookingPhotoBanner(carImages, car.company || '租車相片', carOffsetY, 'bottom')}
                                    </div>
                                )}
                            </div>
                       </div>
                   );})}
               </div>
            )}
        </div>

        {showFlightModal && editingFlight && createPortal(
            <div className="fixed inset-0 bg-cocoa/60 backdrop-blur-sm z-[150] flex flex-col items-center justify-end sm:justify-center sm:p-4 animate-fade-in" onClick={() => setShowFlightModal(false)}>
                <div className="bg-[#FAF8F2] w-full h-[100dvh] sm:h-auto sm:max-h-[92vh] sm:max-w-md sm:rounded-[2.5rem] rounded-none p-5 sm:p-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:pb-6 shadow-2xl border-0 sm:border-4 sm:border-beige-dark flex flex-col justify-between overflow-hidden" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center pb-3 border-b-2 border-beige-dark flex-shrink-0">
                        <h3 className="font-black text-xl text-cocoa">{flights.find(f => String(f.id) === String(editingFlight.id)) ? '編輯航班' : '新增航班'}</h3>
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
                            <input autoComplete="off" value={editingFlight.airline} onChange={e => setEditingFlight({...editingFlight, airline: e.target.value})} className="w-full bg-white p-3 rounded-xl border-2 border-beige-dark outline-none font-bold text-cocoa text-sm" placeholder="航空公司 (如 阿聯酋航空)"/>
                            <input autoComplete="off" value={editingFlight.code} onChange={e => setEditingFlight({...editingFlight, code: e.target.value.toUpperCase()})} className="w-full bg-white p-3 rounded-xl border-2 border-beige-dark outline-none font-black text-cocoa uppercase text-sm" placeholder="航班號 (如 EK367)"/>
                        </div>

                        <div className="space-y-3">
                            <DateTimePickerField
                                label="去程出發 (Departure)"
                                value={editingFlight.date}
                                onChange={val => setEditingFlight({
                                    ...editingFlight,
                                    date: val,
                                    depTime: val?.includes('T') ? val.slice(11, 16) : ''
                                })}
                                themeColor="cyan"
                                icon={Plane}
                            />

                            <DateTimePickerField
                                label="去程抵達 (Arrival)"
                                value={editingFlight.arrivalDate || ''}
                                onChange={val => setEditingFlight({
                                    ...editingFlight,
                                    arrivalDate: val,
                                    arrTime: val?.includes('T') ? val.slice(11, 16) : ''
                                })}
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
                                    <input autoComplete="off" value={editingFlight.origin} onChange={e => setEditingFlight({...editingFlight, origin: e.target.value.toUpperCase()})} className="w-full bg-beige/50 p-2 rounded-lg border border-beige-dark font-black text-cocoa uppercase mb-1 text-center" placeholder="TPE"/>
                                </div>
                                <div className="flex-[2]">
                                    <label className="text-[9px] font-bold text-gray-400 ml-1">出發城市</label>
                                    <input autoComplete="off" value={editingFlight.originCity} onChange={e => setEditingFlight({...editingFlight, originCity: e.target.value})} className="w-full bg-white p-2 rounded-lg border border-beige-dark font-bold text-cocoa outline-none text-sm" placeholder="例如：台北"/>
                                </div>
                            </div>
                            <div className="text-center text-gray-300 font-bold text-xs">⬇</div>
                            <div className="flex gap-2">
                                <div className="flex-[1]">
                                    <label className="text-[9px] font-bold text-gray-400 ml-1">代碼 (如 ZRH)</label>
                                    <input autoComplete="off" value={editingFlight.dest} onChange={e => setEditingFlight({...editingFlight, dest: e.target.value.toUpperCase()})} className="w-full bg-beige/50 p-2 rounded-lg border border-beige-dark font-black text-cocoa uppercase mb-1 text-center" placeholder="ZRH"/>
                                </div>
                                <div className="flex-[2]">
                                    <label className="text-[9px] font-bold text-gray-400 ml-1">抵達城市</label>
                                    <input autoComplete="off" value={editingFlight.destCity} onChange={e => setEditingFlight({...editingFlight, destCity: e.target.value})} className="w-full bg-white p-2 rounded-lg border border-beige-dark font-bold text-cocoa outline-none text-sm" placeholder="例如：蘇黎世"/>
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
                                        ...(!checked ? { transitAirport: '', transitCity: '', transitArrivalTime: '', transitDepartureTime: '', transitDuration: '', transitFlightCode: '', firstLegDuration: '', secondLegDuration: '' } : {})
                                    })} 
                                    label={editingFlight.hasTransit || !!editingFlight.transitAirport ? "有轉機" : "直飛/無轉機"} 
                                    colorClass="bg-amber-400" 
                                />
                            </div>

                            {(editingFlight.hasTransit || !!editingFlight.transitAirport || !!editingFlight.transitCity) && (
                                <div className="space-y-2 pt-2 border-t border-amber-200/60">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-[9px] font-bold text-amber-800 ml-1 block mb-0.5">轉機機場代碼 (如 DXB)</label>
                                            <input autoComplete="off" value={editingFlight.transitAirport || ''} onChange={e => setEditingFlight({...editingFlight, transitAirport: e.target.value.toUpperCase()})} className="w-full bg-white p-2 rounded-lg border border-amber-200 font-black text-cocoa uppercase text-sm outline-none" placeholder="DXB"/>
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-bold text-amber-800 ml-1 block mb-0.5">轉機城市 (如 杜拜)</label>
                                            <input autoComplete="off" value={editingFlight.transitCity || ''} onChange={e => setEditingFlight({...editingFlight, transitCity: e.target.value})} className="w-full bg-white p-2 rounded-lg border border-amber-200 font-bold text-cocoa text-sm outline-none" placeholder="杜拜"/>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <TimePickerField
                                            label="轉機抵達時間"
                                            value={editingFlight.transitArrivalTime || ''}
                                            onChange={val => setEditingFlight({...editingFlight, transitArrivalTime: val})}
                                            className="!border !border-amber-200 !p-2.5 !rounded-xl !shadow-xs"
                                        />
                                        <TimePickerField
                                            label="轉機起飛時間"
                                            value={editingFlight.transitDepartureTime || ''}
                                            onChange={val => setEditingFlight({...editingFlight, transitDepartureTime: val})}
                                            className="!border !border-amber-200 !p-2.5 !rounded-xl !shadow-xs"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-[9px] font-bold text-amber-800 ml-1 block mb-0.5">轉機停留時間</label>
                                            <input autoComplete="off" value={editingFlight.transitDuration || ''} onChange={e => setEditingFlight({...editingFlight, transitDuration: e.target.value})} className="w-full bg-white p-2 rounded-lg border border-amber-200 font-bold text-cocoa text-sm outline-none" placeholder="例如：3h 25m"/>
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-bold text-amber-800 ml-1 block mb-0.5">銜接航班號 (可選)</label>
                                            <input autoComplete="off" value={editingFlight.transitFlightCode || ''} onChange={e => setEditingFlight({...editingFlight, transitFlightCode: e.target.value.toUpperCase()})} className="w-full bg-white p-2 rounded-lg border border-amber-200 font-black text-cocoa uppercase text-sm outline-none" placeholder="EK087"/>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-[9px] font-bold text-amber-800 ml-1 block mb-0.5">第 1 段飛行時間 (可選)</label>
                                            <input autoComplete="off" value={editingFlight.firstLegDuration || ''} onChange={e => setEditingFlight({...editingFlight, firstLegDuration: e.target.value})} className="w-full bg-white p-2 rounded-lg border border-amber-200 font-bold text-cocoa text-sm outline-none" placeholder="例如：9h 30m"/>
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-bold text-amber-800 ml-1 block mb-0.5">第 2 段飛行時間 (可選)</label>
                                            <input autoComplete="off" value={editingFlight.secondLegDuration || ''} onChange={e => setEditingFlight({...editingFlight, secondLegDuration: e.target.value})} className="w-full bg-white p-2 rounded-lg border border-amber-200 font-bold text-cocoa text-sm outline-none" placeholder="例如：6h 45m"/>
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
                                            ...(!checked ? { returnTransitAirport: '', returnTransitCity: '', returnTransitArrivalTime: '', returnTransitDepartureTime: '', returnTransitDuration: '', returnTransitFlightCode: '', returnFirstLegDuration: '', returnSecondLegDuration: '' } : {})
                                        })} 
                                        label={editingFlight.hasReturnTransit || !!editingFlight.returnTransitAirport ? "有轉機" : "直飛/無轉機"} 
                                        colorClass="bg-amber-400" 
                                    />
                                </div>

                                {(editingFlight.hasReturnTransit || !!editingFlight.returnTransitAirport || !!editingFlight.returnTransitCity) && (
                                    <div className="space-y-2 pt-2 border-t border-amber-200/60">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="text-[9px] font-bold text-amber-800 ml-1 block mb-0.5">回程轉機機場 (如 DXB)</label>
                                                <input autoComplete="off" value={editingFlight.returnTransitAirport || ''} onChange={e => setEditingFlight({...editingFlight, returnTransitAirport: e.target.value.toUpperCase()})} className="w-full bg-white p-2 rounded-lg border border-amber-200 font-black text-cocoa uppercase text-sm outline-none" placeholder="DXB"/>
                                            </div>
                                            <div>
                                                <label className="text-[9px] font-bold text-amber-800 ml-1 block mb-0.5">回程轉機城市</label>
                                                <input autoComplete="off" value={editingFlight.returnTransitCity || ''} onChange={e => setEditingFlight({...editingFlight, returnTransitCity: e.target.value})} className="w-full bg-white p-2 rounded-lg border border-amber-200 font-bold text-cocoa text-sm outline-none" placeholder="杜拜"/>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <TimePickerField
                                                label="回程轉機抵達時間"
                                                value={editingFlight.returnTransitArrivalTime || ''}
                                                onChange={val => setEditingFlight({...editingFlight, returnTransitArrivalTime: val})}
                                                className="!border !border-amber-200 !p-2.5 !rounded-xl !shadow-xs"
                                            />
                                            <TimePickerField
                                                label="回程轉機起飛時間"
                                                value={editingFlight.returnTransitDepartureTime || ''}
                                                onChange={val => setEditingFlight({...editingFlight, returnTransitDepartureTime: val})}
                                                className="!border !border-amber-200 !p-2.5 !rounded-xl !shadow-xs"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="text-[9px] font-bold text-amber-800 ml-1 block mb-0.5">回程轉機停留時間</label>
                                                <input autoComplete="off" value={editingFlight.returnTransitDuration || ''} onChange={e => setEditingFlight({...editingFlight, returnTransitDuration: e.target.value})} className="w-full bg-white p-2 rounded-lg border border-amber-200 font-bold text-cocoa text-sm outline-none" placeholder="例如：2h 30m"/>
                                            </div>
                                            <div>
                                                <label className="text-[9px] font-bold text-amber-800 ml-1 block mb-0.5">回程銜接航班號 (可選)</label>
                                                <input autoComplete="off" value={editingFlight.returnTransitFlightCode || ''} onChange={e => setEditingFlight({...editingFlight, returnTransitFlightCode: e.target.value.toUpperCase()})} className="w-full bg-white p-2 rounded-lg border border-amber-200 font-black text-cocoa uppercase text-sm outline-none" placeholder="EK366"/>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="text-[9px] font-bold text-amber-800 ml-1 block mb-0.5">回程第 1 段飛行時間 (可選)</label>
                                                <input autoComplete="off" value={editingFlight.returnFirstLegDuration || ''} onChange={e => setEditingFlight({...editingFlight, returnFirstLegDuration: e.target.value})} className="w-full bg-white p-2 rounded-lg border border-amber-200 font-bold text-cocoa text-sm outline-none" placeholder="例如：6h 30m"/>
                                            </div>
                                            <div>
                                                <label className="text-[9px] font-bold text-amber-800 ml-1 block mb-0.5">回程第 2 段飛行時間 (可選)</label>
                                                <input autoComplete="off" value={editingFlight.returnSecondLegDuration || ''} onChange={e => setEditingFlight({...editingFlight, returnSecondLegDuration: e.target.value})} className="w-full bg-white p-2 rounded-lg border border-amber-200 font-bold text-cocoa text-sm outline-none" placeholder="例如：8h 30m"/>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex gap-2">
                            <div className="flex-[1]">
                                <label className="text-[10px] font-bold text-gray-400 ml-1 block mb-1">去程總飛行時間 (可選)</label>
                                <input autoComplete="off" value={editingFlight.duration} onChange={e => setEditingFlight({...editingFlight, duration: e.target.value})} className="w-full bg-white p-3 rounded-xl border-2 border-beige-dark outline-none font-bold text-cocoa text-sm" placeholder="例如：16h 40m"/>
                            </div>
                            {editingFlight.tripType === 'roundtrip' && (
                                <div className="flex-[1]">
                                    <label className="text-[10px] font-bold text-gray-400 ml-1 block mb-1">回程總飛行時間 (可選)</label>
                                    <input autoComplete="off" value={editingFlight.returnDuration || ''} onChange={e => setEditingFlight({...editingFlight, returnDuration: e.target.value})} className="w-full bg-white p-3 rounded-xl border-2 border-beige-dark outline-none font-bold text-cocoa text-sm" placeholder="例如：15h 20m"/>
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

                        <PhotoUploadSection
                            images={editingFlight.images || []}
                            photoPlacement={editingFlight.photoPlacement || 'middle'}
                            photoOffsetY={editingFlight.photoOffsetY ?? 50}
                            tripId={tripId}
                            inputId="flight-photo-upload"
                            middleLabel="卡片中間"
                            middleDesc="置於航程與行李條之間（預設）"
                            bottomDesc="置於卡片最底部（詳情區塊下方）"
                            onChangeImages={(images) => setEditingFlight({ ...editingFlight, images })}
                            onChangePlacement={(photoPlacement) => setEditingFlight({ ...editingFlight, photoPlacement })}
                            onChangeOffsetY={(photoOffsetY) => setEditingFlight({ ...editingFlight, photoOffsetY })}
                            onUploadingChange={setIsUploadingPhoto}
                        />

                        <div>
                            <label className="text-[10px] font-bold text-gray-400 ml-1">備註</label>
                            <textarea value={editingFlight.note} onChange={e => setEditingFlight({...editingFlight, note: e.target.value})} className="w-full bg-white p-3 rounded-xl border-2 border-beige-dark outline-none font-bold h-20 text-cocoa placeholder:text-gray-300" placeholder="例如：在 2 航廈集合..."></textarea>
                        </div>
                    </div>

                    {saveError && (
                        <div className="mt-2 px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-bold flex items-center justify-between gap-2">
                            <span>{saveError}</span>
                            <button type="button" onClick={() => setSaveError(null)} className="text-red-400 hover:text-red-600"><X size={14}/></button>
                        </div>
                    )}

                    <div className="flex gap-3 pt-3 border-t-2 border-beige-dark mt-auto flex-shrink-0">
                        {editingFlight.id && flights.find(f => String(f.id) === String(editingFlight.id)) && (
                            <button onClick={deleteFlight} disabled={isSaving} type="button" className={`px-5 py-3.5 rounded-2xl bg-red-50 text-red-400 font-bold border-2 border-red-100 flex items-center justify-center gap-2 hover:bg-red-100 transition-colors ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                <Trash2 size={18}/> 刪除
                            </button>
                        )}
                        <button onClick={() => setShowFlightModal(false)} disabled={isSaving} className="flex-1 py-3.5 rounded-2xl bg-white text-gray-400 font-bold border-2 border-beige-dark hover:bg-gray-50 transition-colors">取消</button>
                        <button onClick={saveFlight} disabled={isUploadingPhoto || isSaving} className={`flex-1 py-3.5 rounded-2xl bg-sage text-white font-bold shadow-hard-sage border-2 border-sage-dark active:translate-y-1 active:shadow-none transition-all ${(isUploadingPhoto || isSaving) ? 'opacity-50 cursor-not-allowed' : ''}`}>{isSaving ? '保存中...' : '保存'}</button>
                    </div>
                </div>
            </div>,
            document.body
        )}

        {showAccModal && editingAcc && createPortal(
            <div className="fixed inset-0 bg-cocoa/60 backdrop-blur-sm z-[150] flex flex-col items-center justify-end sm:justify-center sm:p-4 animate-fade-in" onClick={() => setShowAccModal(false)}>
                <div className="bg-[#FAF8F2] w-full h-[100dvh] sm:h-auto sm:max-h-[92vh] sm:max-w-md sm:rounded-[2.5rem] rounded-none p-5 sm:p-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:pb-6 shadow-2xl border-0 sm:border-4 sm:border-beige-dark flex flex-col justify-between overflow-hidden" onClick={e => e.stopPropagation()}>
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

                        <div>
                            <label className="text-[10px] font-bold text-gray-400 ml-1 flex items-center gap-1">
                                <MapPin size={12} className="text-sage" /> 地址 (Google Maps 導航/地點)
                            </label>
                            <input 
                                value={editingAcc.address || ''} 
                                onChange={e => setEditingAcc({...editingAcc, address: e.target.value})} 
                                className="w-full bg-white p-3 rounded-xl border-2 border-beige-dark outline-none font-bold text-cocoa text-sm" 
                                placeholder="例如：詳細地址 或 Google Maps 地點/導航連結"
                            />
                        </div>

                        <div className="bg-purple-50/50 p-3.5 rounded-2xl border-2 border-purple-100 space-y-3">
                            <DateTimePickerField
                                label="入住時間 (Check-in)"
                                value={editingAcc.checkInDate}
                                onChange={val => {
                                    const newNights = calculateStayNights(val, editingAcc.checkOutDate, editingAcc.nights);
                                    setEditingAcc({...editingAcc, checkInDate: val, nights: newNights});
                                }}
                                themeColor="purple"
                                icon={House}
                            />
                            <DateTimePickerField
                                label="退房時間 (Check-out)"
                                value={editingAcc.checkOutDate}
                                onChange={val => {
                                    const newNights = calculateStayNights(editingAcc.checkInDate, val, editingAcc.nights);
                                    setEditingAcc({...editingAcc, checkOutDate: val, nights: newNights});
                                }}
                                themeColor="purple"
                                icon={House}
                            />
                            <div className="flex items-center justify-between px-1 pt-1 text-xs font-bold text-purple-700">
                                <span>入住天數計算：</span>
                                <span className="bg-purple-100/80 px-2.5 py-0.5 rounded-full font-black">
                                    共 {calculateStayNights(editingAcc.checkInDate, editingAcc.checkOutDate, editingAcc.nights)} 晚
                                </span>
                            </div>
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

                            <div className="pt-1 border-t border-gray-100 flex items-center justify-between">
                                <ToggleSwitch 
                                    checked={!!editingAcc.isPotential} 
                                    onChange={(checked) => setEditingAcc({...editingAcc, isPotential: checked})} 
                                    label="列入潛在花費 (預算參考)" 
                                    colorClass="bg-amber-400" 
                                />
                                <span className="text-[10px] font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-md">
                                    {editingAcc.isPotential ? '暫定/預估' : '已確認訂房'}
                                </span>
                            </div>

                            <CostPreview 
                                cost={editingAcc.cost} 
                                currency={editingAcc.currency} 
                                hasFee={editingAcc.hasServiceFee} 
                                feePct={editingAcc.serviceFeePercentage} 
                            />

                            <div><label className="text-[10px] font-bold text-gray-400 block mb-2">分攤成員</label><div className="flex flex-wrap gap-2">{members.map(m => (<button key={m.id} onClick={() => toggleAccParticipant(m.id)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all ${editingAcc.participants.includes(m.id) ? 'bg-sage text-white border-sage' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>{m.name}</button>))}</div></div>
                        </div>

                        <PhotoUploadSection
                            images={editingAcc.images || editingAcc.photos || []}
                            photoPlacement={editingAcc.photoPlacement || 'middle'}
                            photoOffsetY={editingAcc.photoOffsetY ?? 50}
                            tripId={tripId}
                            inputId="acc-photo-upload"
                            middleLabel="卡片中間"
                            middleDesc="置於入住時間與地址之間（預設）"
                            bottomDesc="置於卡片最底部（分攤明細下方）"
                            onChangeImages={(images) => setEditingAcc({ ...editingAcc, images, photos: undefined })}
                            onChangePlacement={(photoPlacement) => setEditingAcc({ ...editingAcc, photoPlacement })}
                            onChangeOffsetY={(photoOffsetY) => setEditingAcc({ ...editingAcc, photoOffsetY })}
                            onUploadingChange={setIsUploadingPhoto}
                        />

                        <div><label className="text-[10px] font-bold text-gray-400 ml-1">備註</label><textarea value={editingAcc.note} onChange={e => setEditingAcc({...editingAcc, note: e.target.value})} className="w-full bg-white p-3 rounded-xl border-2 border-beige-dark outline-none font-bold h-20 text-cocoa"></textarea></div>
                    </div>
                    {saveError && (
                        <div className="mt-2 px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-bold flex items-center justify-between gap-2">
                            <span>{saveError}</span>
                            <button type="button" onClick={() => setSaveError(null)} className="text-red-400 hover:text-red-600"><X size={14}/></button>
                        </div>
                    )}
                    <div className="flex gap-3 pt-3 border-t-2 border-beige-dark mt-auto flex-shrink-0">
                        {editingAcc.id && accommodations.find(a => a.id === editingAcc.id) && (
                            <button onClick={async () => {
                                if (isSaving) return;
                                if (window.confirm('確定刪除此住宿紀錄？')) {
                                    setIsSaving(true);
                                    setSaveError(null);
                                    try {
                                        await onDeleteAccommodation(editingAcc.id);
                                        setShowAccModal(false);
                                    } catch (err: any) {
                                        console.error('刪除住宿失敗:', err);
                                        setSaveError(err?.message || '刪除失敗，請稍後再試。');
                                    } finally {
                                        setIsSaving(false);
                                    }
                                }
                            }} disabled={isSaving} type="button" className={`px-5 py-3.5 rounded-2xl bg-red-50 text-red-400 font-bold border-2 border-red-100 flex items-center justify-center gap-2 hover:bg-red-100 transition-colors ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                <Trash2 size={18}/> 刪除
                            </button>
                        )}
                        <button onClick={() => setShowAccModal(false)} disabled={isSaving} className="flex-1 py-3.5 rounded-2xl bg-white text-gray-400 font-bold border-2 border-beige-dark hover:bg-gray-50 transition-colors">取消</button>
                        <button onClick={saveAcc} disabled={isUploadingPhoto || isSaving} className={`flex-1 py-3.5 rounded-2xl bg-sage text-white font-bold shadow-hard-sage border-2 border-sage-dark active:translate-y-1 active:shadow-none transition-all ${(isUploadingPhoto || isSaving) ? 'opacity-50 cursor-not-allowed' : ''}`}>{isSaving ? '保存中...' : '保存'}</button>
                    </div>
                </div>
            </div>,
            document.body
        )}

        {showCarModal && editingCar && createPortal(
            <div className="fixed inset-0 bg-cocoa/60 backdrop-blur-sm z-[150] flex flex-col items-center justify-end sm:justify-center sm:p-4 animate-fade-in" onClick={() => setShowCarModal(false)}>
                <div className="bg-[#FAF8F2] w-full h-[100dvh] sm:h-auto sm:max-h-[92vh] sm:max-w-md sm:rounded-[2.5rem] rounded-none p-5 sm:p-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:pb-6 shadow-2xl border-0 sm:border-4 sm:border-beige-dark flex flex-col justify-between overflow-hidden" onClick={e => e.stopPropagation()}>
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

                        <PhotoUploadSection
                            images={editingCar.images || []}
                            photoPlacement={editingCar.photoPlacement || 'middle'}
                            photoOffsetY={editingCar.photoOffsetY ?? 50}
                            tripId={tripId}
                            inputId="car-photo-upload"
                            middleLabel="卡片中間"
                            middleDesc="置於取還車地點下方（預設）"
                            bottomDesc="置於卡片最底部（分攤明細下方）"
                            onChangeImages={(images) => setEditingCar({ ...editingCar, images })}
                            onChangePlacement={(photoPlacement) => setEditingCar({ ...editingCar, photoPlacement })}
                            onChangeOffsetY={(photoOffsetY) => setEditingCar({ ...editingCar, photoOffsetY })}
                            onUploadingChange={setIsUploadingPhoto}
                        />

                        <div><label className="text-[10px] font-bold text-gray-400 ml-1">備註</label><textarea value={editingCar.note} onChange={e => setEditingCar({...editingCar, note: e.target.value})} className="w-full bg-white p-3 rounded-xl border-2 border-beige-dark outline-none font-bold h-20 text-cocoa"></textarea></div>
                    </div>
                    {saveError && (
                        <div className="mt-2 px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-bold flex items-center justify-between gap-2">
                            <span>{saveError}</span>
                            <button type="button" onClick={() => setSaveError(null)} className="text-red-400 hover:text-red-600"><X size={14}/></button>
                        </div>
                    )}
                    <div className="flex gap-3 pt-3 border-t-2 border-beige-dark mt-auto flex-shrink-0">
                        {carRentals.find(c => c.id === editingCar.id) && (
                            <button onClick={deleteCar} disabled={isSaving} type="button" className={`px-5 py-3.5 rounded-2xl bg-red-50 text-red-400 font-bold border-2 border-red-100 flex items-center justify-center gap-2 hover:bg-red-100 transition-colors ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                <Trash2 size={18}/> 刪除
                            </button>
                        )}
                        <button onClick={() => setShowCarModal(false)} disabled={isSaving} className="flex-1 py-3.5 rounded-2xl bg-white text-gray-400 font-bold border-2 border-beige-dark hover:bg-gray-50 transition-colors">取消</button>
                        <button onClick={saveCar} disabled={isUploadingPhoto || isSaving} className={`flex-1 py-3.5 rounded-2xl bg-sage text-white font-bold shadow-hard-sage border-2 border-sage-dark active:translate-y-1 active:shadow-none transition-all ${(isUploadingPhoto || isSaving) ? 'opacity-50 cursor-not-allowed' : ''}`}>{isSaving ? '保存中...' : '保存'}</button>
                    </div>
                </div>
            </div>,
            document.body
        )}

        {localLightbox && (
            <Lightbox
                images={localLightbox.images}
                initialIndex={localLightbox.index}
                onClose={() => setLocalLightbox(null)}
            />
        )}
    </div>
  );
};