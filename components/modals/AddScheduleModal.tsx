import React, { useState, useEffect } from 'react';
import { 
  Camera, Utensils, Train, Bed, Plane, X, Navigation, 
  ExternalLink, Clock, DollarSign, Fuel, Plus, AlignLeft, Car, Ticket, Coffee 
} from 'lucide-react';
import { ItemType, ScheduleItem, Currency, Member, ExpenseItem, TransitLeg, TransitFareDetails } from '../../types';
import { TransitLegEditor } from '../TransitComponents';
import { DateTimePickerField } from '../TimePickerComponents';
import { ToggleSwitch } from './ToggleSwitch';
import { DeleteItemConfirmModal } from './DeleteItemConfirmModal';

const CuteButton = ({ checked, onChange, icon: Icon, label, activeColor = 'bg-orange-100 text-orange-500 border-orange-200' }: any) => (
    <button
        onClick={() => onChange(!checked)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black transition-all shadow-sm border-2 ${
            checked 
            ? activeColor
            : 'bg-white text-gray-400 border-beige-dark hover:bg-gray-50'
        }`}
    >
        {Icon && <Icon size={12} />}
        {label}
    </button>
);

const CostDisplay = ({ amount, currency, hasFee, feePct, currencies }: { amount: number, currency: string, hasFee: boolean, feePct: number, currencies: Currency[] }) => {
    const total = amount + (hasFee ? amount * (Number(feePct) / 100) : 0);
    const rate = currencies.find(c => c.code === currency)?.rate || (currency === 'TWD' ? 1 : 1);
    const twdTotal = Math.round(total * rate);

    if (total <= 0) return null;
    return (
        <div className="mt-2 bg-gray-50 p-3 rounded-xl border border-dashed border-gray-200 space-y-1">
            <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">總計 ({currency})</span>
                <span className="text-sm font-black text-cocoa font-mono">{currency} {Math.round(total).toLocaleString()}</span>
            </div>
            {currency !== 'TWD' && (
                <div className="flex justify-between items-center border-t border-gray-100 pt-1">
                    <span className="text-[10px] font-bold text-sage uppercase tracking-wider">約台幣 (TWD)</span>
                    <span className="text-sm font-black text-sage font-mono">${twdTotal.toLocaleString()}</span>
                </div>
            )}
        </div>
    );
};

export const AddScheduleModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  initialData,
  currencies = [],
  members = [],
  currentDate
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onSave: (item: Omit<ScheduleItem, 'id'>) => void,
  initialData?: ScheduleItem | null,
  currencies?: Currency[],
  members?: Member[],
  currentDate: string
}) => {
  const [step, setStep] = useState<'category' | 'details'>('category');
  const [selectedType, setSelectedType] = useState<ItemType>('spot');
  
  // Basic Fields
  const [title, setTitle] = useState('');
  const [itemDate, setItemDate] = useState(currentDate || '');
  const [time, setTime] = useState('09:00');
  const [location, setLocation] = useState('');
  const [gpsInput, setGpsInput] = useState('');
  const [notes, setNotes] = useState('');

  // Flight Fields
  const [flightAirline, setFlightAirline] = useState('');
  const [flightCode, setFlightCode] = useState('');
  const [flightDepDate, setFlightDepDate] = useState('');
  const [flightDepTime, setFlightDepTime] = useState('');
  const [flightArrDate, setFlightArrDate] = useState('');
  const [flightArrTime, setFlightArrTime] = useState('');
  const [flightDepAirport, setFlightDepAirport] = useState('');
  const [flightArrAirport, setFlightArrAirport] = useState('');
  const [flightCheckedBag, setFlightCheckedBag] = useState('');
  const [flightCarryOnBag, setFlightCarryOnBag] = useState('');
  const [flightCost, setFlightCost] = useState('');
  const [flightCurrency, setFlightCurrency] = useState('TWD');
  const [flightHasServiceFee, setFlightHasServiceFee] = useState(false);
  const [flightServiceFeePercentage, setFlightServiceFeePercentage] = useState('');
  const [flightHasTransit, setFlightHasTransit] = useState(false);
  const [flightTransitAirport, setFlightTransitAirport] = useState('');
  const [flightTransitCity, setFlightTransitCity] = useState('');
  const [flightTransitDuration, setFlightTransitDuration] = useState('');
  const [flightTransitFlightCode, setFlightTransitFlightCode] = useState('');
  const [flightDuration, setFlightDuration] = useState('');
  const [flightParticipants, setFlightParticipants] = useState<string[]>([]);
  const [isFlightPotential, setIsFlightPotential] = useState(false);

  // Stay Fields
  const [checkInDate, setCheckInDate] = useState('');
  const [checkInTime, setCheckInTime] = useState('15:00');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [checkOutTime, setCheckOutTime] = useState('11:00');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [hasBreakfast, setHasBreakfast] = useState(false);
  const [hasDinner, setHasDinner] = useState(false);
  const [stayCost, setStayCost] = useState('');
  const [stayCurrency, setStayCurrency] = useState('TWD');
  const [stayHasServiceFee, setStayHasServiceFee] = useState(false);
  const [stayServiceFeePercentage, setStayServiceFeePercentage] = useState('');
  const [stayParticipants, setStayParticipants] = useState<string[]>([]);
  const [isStayPotential, setIsStayPotential] = useState(false);

  // Car Rental Fields
  const [transportMode, setTransportMode] = useState<'transit' | 'rental'>('transit');
  const [transitLegs, setTransitLegs] = useState<TransitLeg[]>([
    { id: '1', fromStation: '', toStation: '', departureTime: '09:00', arrivalTime: '', transportType: 'train', serviceNumber: '', platform: '' }
  ]);
  const [transitFare, setTransitFare] = useState<TransitFareDetails>({
    passUsed: 'pass_free',
    originalPrice: '',
    discountedPrice: '',
    currency: 'TWD',
    extraFeeName: '',
    seatReservationFee: '',
    seatReservationFeeCurrency: 'TWD',
    notes: ''
  });
  const [transitParticipants, setTransitParticipants] = useState<string[]>([]);
  const [isTransitPotential, setIsTransitPotential] = useState(false);

  const [hasRental, setHasRental] = useState(false);
  const [rentalCompany, setRentalCompany] = useState('');
  const [carModel, setCarModel] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [returnTime, setReturnTime] = useState('');
  const [rentalCost, setRentalCost] = useState('');
  const [rentalCurrency, setRentalCurrency] = useState('TWD');
  const [rentalHasServiceFee, setRentalHasServiceFee] = useState(false);
  const [rentalServiceFeePercentage, setRentalServiceFeePercentage] = useState('');
  const [estimatedFuelCost, setEstimatedFuelCost] = useState('');
  const [fuelCurrency, setFuelCurrency] = useState('TWD');
  const [rentalExpenses, setRentalExpenses] = useState<ExpenseItem[]>([]);
  const [rentalParticipants, setRentalParticipants] = useState<string[]>([]);
  const [isRentalPotential, setIsRentalPotential] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);

  // Spot/Food Fields
  const [hasTicket, setHasTicket] = useState(false);
  const [ticketCost, setTicketCost] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('TWD');
  const [hasServiceFee, setHasServiceFee] = useState(false);
  const [serviceFeePercentage, setServiceFeePercentage] = useState('');
  const [participantIds, setParticipantIds] = useState<string[]>([]);
  const [isPotential, setIsPotential] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setStep('details');
        setSelectedType(initialData.type);
        setTitle(initialData.title);
        setItemDate(initialData.date || currentDate || '');
        setTime(initialData.time || '09:00');
        setLocation(initialData.location);
        setNotes(initialData.notes || '');
        if (initialData.gps) setGpsInput(`${initialData.gps.lat}, ${initialData.gps.lng}`);
        else setGpsInput('');

        // Flight
        if (initialData.flightDetails) {
            setFlightAirline(initialData.flightDetails.airline || '');
            setFlightCode(initialData.flightDetails.flightCode || '');
            setFlightDepDate(initialData.flightDetails.departureDate || initialData.date || currentDate || '');
            setFlightDepTime(initialData.flightDetails.departureTime || initialData.time || '09:00');
            setFlightArrDate(initialData.flightDetails.arrivalDate || initialData.date || currentDate || '');
            setFlightArrTime(initialData.flightDetails.arrivalTime || '12:00');
            setFlightDepAirport(initialData.flightDetails.departureAirport || '');
            setFlightArrAirport(initialData.flightDetails.arrivalAirport || '');
            setFlightHasTransit(initialData.flightDetails.hasTransit || !!initialData.flightDetails.transitAirport || !!initialData.flightDetails.transitCity);
            setFlightTransitAirport(initialData.flightDetails.transitAirport || '');
            setFlightTransitCity(initialData.flightDetails.transitCity || '');
            setFlightTransitDuration(initialData.flightDetails.transitDuration || '');
            setFlightTransitFlightCode(initialData.flightDetails.transitFlightCode || '');
            setFlightDuration(initialData.flightDetails.flightDuration || '');
            setFlightCheckedBag(initialData.flightDetails.checkedBag || '');
            setFlightCarryOnBag(initialData.flightDetails.carryOnBag || '');
            setFlightCost(initialData.flightDetails.cost?.toString() || '');
            setFlightCurrency(initialData.flightDetails.currency || 'TWD');
            setFlightHasServiceFee(initialData.flightDetails.hasServiceFee || false);
            setFlightServiceFeePercentage(initialData.flightDetails.serviceFeePercentage?.toString() || '');
            setFlightParticipants(initialData.flightDetails.participants && initialData.flightDetails.participants.length > 0 ? initialData.flightDetails.participants : members.map(m => m.id));
            setIsFlightPotential(initialData.flightDetails.isPotential || false);
        } else {
            setFlightDepDate(initialData.date || currentDate || '');
            setFlightDepTime(initialData.time || '09:00');
            setFlightArrDate(initialData.date || currentDate || '');
            setFlightArrTime('12:00');
            setFlightHasTransit(false);
            setFlightTransitAirport('');
            setFlightTransitCity('');
            setFlightTransitDuration('');
            setFlightTransitFlightCode('');
            setFlightDuration('');
            setFlightParticipants(members.map(m => m.id));
        }

        // Stay
        const initCheckInTime = initialData.checkIn || '15:00';
        const initCheckOutTime = initialData.checkOut || '11:00';
        setCheckIn(initCheckInTime);
        setCheckOut(initCheckOutTime);
        setCheckInDate(initialData.stayDetails?.checkInDate || initialData.date || currentDate || '');
        setCheckInTime(initCheckInTime);
        setCheckOutDate(initialData.stayDetails?.checkOutDate || initialData.date || currentDate || '');
        setCheckOutTime(initCheckOutTime);
        setHasBreakfast(initialData.meals?.breakfast || false);
        setHasDinner(initialData.meals?.dinner || false);
        if (initialData.stayDetails) {
            setStayCost(initialData.stayDetails.cost?.toString() || '');
            setStayCurrency(initialData.stayDetails.currency || 'TWD');
            setStayHasServiceFee(initialData.stayDetails.hasServiceFee || false);
            setStayServiceFeePercentage(initialData.stayDetails.serviceFeePercentage?.toString() || '');
            setStayParticipants(initialData.stayDetails.participants && initialData.stayDetails.participants.length > 0 ? initialData.stayDetails.participants : members.map(m => m.id));
            setIsStayPotential(initialData.stayDetails.isPotential || false);
        } else {
            setStayParticipants(members.map(m => m.id));
        }

        // Transport: Universal Transit or Car Rental
        if (initialData.transitDetails) {
            setTransportMode('transit');
            setTransitLegs(initialData.transitDetails.legs && initialData.transitDetails.legs.length > 0 ? initialData.transitDetails.legs : [
              { id: '1', fromStation: initialData.location || '', toStation: '', departureTime: initialData.time || '09:00', arrivalTime: '', transportType: 'train', serviceNumber: '', platform: '' }
            ]);
            setTransitFare(initialData.transitDetails.fare ? {
              ...initialData.transitDetails.fare,
              originalPrice: initialData.transitDetails.fare.originalPrice !== undefined ? initialData.transitDetails.fare.originalPrice : '',
              discountedPrice: initialData.transitDetails.fare.discountedPrice !== undefined ? initialData.transitDetails.fare.discountedPrice : '',
              currency: initialData.transitDetails.fare.currency || 'TWD',
              hasServiceFee: initialData.transitDetails.fare.hasServiceFee || false,
              serviceFeePercentage: initialData.transitDetails.fare.serviceFeePercentage !== undefined ? initialData.transitDetails.fare.serviceFeePercentage : '',
              extraFeeName: initialData.transitDetails.fare.extraFeeName || '',
              seatReservationFee: initialData.transitDetails.fare.seatReservationFee !== undefined ? initialData.transitDetails.fare.seatReservationFee : '',
              seatReservationFeeCurrency: initialData.transitDetails.fare.seatReservationFeeCurrency || initialData.transitDetails.fare.currency || 'TWD',
              notes: initialData.transitDetails.fare.notes || ''
            } : {
              originalPrice: '',
              discountedPrice: '',
              currency: 'TWD',
              hasServiceFee: false,
              serviceFeePercentage: '',
              extraFeeName: '',
              seatReservationFee: '',
              seatReservationFeeCurrency: 'TWD',
              notes: ''
            });
            setTransitParticipants(initialData.transitDetails.participants && initialData.transitDetails.participants.length > 0 ? initialData.transitDetails.participants : members.map(m => m.id));
            setIsTransitPotential(initialData.transitDetails.isPotential || false);
        } else if (initialData.carRental?.hasRental) {
            setTransportMode('rental');
            setTransitParticipants(members.map(m => m.id));
        } else {
            setTransportMode('transit');
            setTransitLegs([
              { id: '1', fromStation: initialData.location || '', toStation: '', departureTime: initialData.time || '09:00', arrivalTime: '', transportType: 'train', serviceNumber: '', platform: '' }
            ]);
            setTransitFare({
              originalPrice: '',
              discountedPrice: '',
              currency: 'TWD',
              extraFeeName: '',
              seatReservationFee: '',
              seatReservationFeeCurrency: 'TWD',
              notes: ''
            });
            setTransitParticipants(members.map(m => m.id));
            setIsTransitPotential(false);
        }

        // Car Rental
        if (initialData.carRental) {
           setHasRental(initialData.carRental.hasRental);
           setRentalCompany(initialData.carRental.company || '');
           setCarModel(initialData.carRental.carModel || '');
           setPickupDate(initialData.carRental.pickupDate || initialData.date || currentDate || '');
           setPickupTime(initialData.carRental.pickupTime || '09:00');
           setReturnDate(initialData.carRental.returnDate || initialData.date || currentDate || '');
           setReturnTime(initialData.carRental.returnTime || '18:00');
           setRentalCost(initialData.carRental.rentalCost?.toString() || '');
           setRentalCurrency(initialData.carRental.rentalCurrency || 'TWD');
           setRentalHasServiceFee(initialData.carRental.hasServiceFee || false);
           setRentalServiceFeePercentage(initialData.carRental.serviceFeePercentage?.toString() || '');
           setEstimatedFuelCost(initialData.carRental.estimatedFuelCost?.toString() || '');
           setFuelCurrency(initialData.carRental.fuelCurrency || 'TWD');
           setRentalExpenses(initialData.carRental.expenses || []);
           setRentalParticipants(initialData.carRental.participants && initialData.carRental.participants.length > 0 ? initialData.carRental.participants : members.map(m => m.id));
           setIsRentalPotential(initialData.carRental.isPotential || false);
        } else {
           setPickupDate(initialData.date || currentDate || '');
           setPickupTime('09:00');
           setReturnDate(initialData.date || currentDate || '');
           setReturnTime('18:00');
           setRentalParticipants(members.map(m => m.id));
        }

        // Spot
        if (initialData.spotDetails) {
          setHasTicket(initialData.spotDetails.hasTicket);
          setTicketCost(initialData.spotDetails.ticketCost?.toString() || '');
          setSelectedCurrency(initialData.spotDetails.currency || 'TWD');
          setHasServiceFee(initialData.spotDetails.hasServiceFee || false);
          setServiceFeePercentage(initialData.spotDetails.serviceFeePercentage?.toString() || '');
          setParticipantIds(initialData.spotDetails.participants && initialData.spotDetails.participants.length > 0 ? initialData.spotDetails.participants : members.map(m => m.id));
          setIsPotential(initialData.spotDetails.isPotential || false);
        } else {
            setParticipantIds(members.map(m => m.id));
        }
      } else {
        // Reset Logic
        setStep('category'); setTitle(''); setItemDate(currentDate || ''); setTime('09:00'); setLocation(''); setNotes(''); setGpsInput('');
        // Reset Category Specifics
        setFlightAirline(''); setFlightCode(''); setFlightDepDate(currentDate || ''); setFlightDepTime('09:00'); setFlightArrDate(currentDate || ''); setFlightArrTime('12:00'); setFlightDepAirport(''); setFlightArrAirport(''); setFlightHasTransit(false); setFlightTransitAirport(''); setFlightTransitCity(''); setFlightTransitDuration(''); setFlightTransitFlightCode(''); setFlightDuration(''); setFlightCheckedBag(''); setFlightCarryOnBag(''); setFlightCost(''); setFlightCurrency('TWD'); setFlightHasServiceFee(false); setFlightServiceFeePercentage(''); setFlightParticipants(members.map(m => m.id)); setIsFlightPotential(false);
        setCheckIn('15:00'); setCheckOut('11:00'); setCheckInDate(currentDate || ''); setCheckInTime('15:00'); setCheckOutDate(currentDate || ''); setCheckOutTime('11:00'); setHasBreakfast(false); setHasDinner(false); setStayCost(''); setStayCurrency('TWD'); setStayHasServiceFee(false); setStayServiceFeePercentage(''); setStayParticipants(members.map(m => m.id)); setIsStayPotential(false);
        setTransportMode('transit');
        setTransitLegs([
          { id: '1', fromStation: '', toStation: '', departureTime: '09:00', arrivalTime: '', transportType: 'train', serviceNumber: '', platform: '' }
        ]);
        setTransitFare({
          originalPrice: '',
          discountedPrice: '',
          currency: 'TWD',
          hasServiceFee: false,
          serviceFeePercentage: '',
          extraFeeName: '',
          seatReservationFee: '',
          seatReservationFeeCurrency: 'TWD',
          notes: ''
        });
        setTransitParticipants(members.map(m => m.id));
        setIsTransitPotential(false);
        setHasRental(false); setRentalCompany(''); setCarModel(''); setPickupDate(currentDate || ''); setPickupTime('09:00'); setReturnDate(currentDate || ''); setReturnTime('18:00'); setRentalCost(''); setRentalCurrency('TWD'); setRentalHasServiceFee(false); setRentalServiceFeePercentage(''); setEstimatedFuelCost(''); setFuelCurrency('TWD'); setRentalExpenses([]); setRentalParticipants(members.map(m => m.id)); setIsRentalPotential(false); setExpenseToDelete(null);
        setHasTicket(false); setTicketCost(''); setSelectedCurrency('TWD'); setHasServiceFee(false); setServiceFeePercentage(''); setParticipantIds(members.map(m => m.id)); setIsPotential(false);
      }
    }
  }, [isOpen, initialData, members, currentDate]);

  // Toggle Helpers
  const toggleParticipant = (id: string, setFunc: React.Dispatch<React.SetStateAction<string[]>>) => {
    setFunc(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  // Helper for opening maps
  const openExternalMap = (query: string) => {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, '_blank');
  };

  // Rental Expense Helpers
  const addRentalExpense = () => setRentalExpenses([...rentalExpenses, { id: Date.now().toString(), name: '', amount: '', currency: 'TWD', hasServiceFee: false, serviceFeePercentage: '' }]);
  const updateRentalExpense = (id: string, field: keyof ExpenseItem, value: any) => setRentalExpenses(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  const removeRentalExpense = (id: string) => setRentalExpenses(prev => prev.filter(item => item.id !== id));
  const confirmRemoveExpense = () => { if (expenseToDelete) { removeRentalExpense(expenseToDelete); setExpenseToDelete(null); } };

  const handleSubmit = () => {
    let finalTitle = title;
    let finalLocation = location || '未指定地點';

    if (selectedType === 'transport' && transportMode === 'transit') {
      if (!finalTitle) {
        if (transitLegs.length > 0 && (transitLegs[0].fromStation || transitLegs[transitLegs.length - 1].toStation)) {
          finalTitle = `${transitLegs[0].fromStation || '出發'} ➔ ${transitLegs[transitLegs.length - 1].toStation || '目的地'}`;
        } else {
          finalTitle = '交通轉乘路線';
        }
      }
      if ((!location || location === '未指定地點') && transitLegs.length > 0 && transitLegs[0].fromStation) {
        finalLocation = transitLegs[0].fromStation;
      }
    }

    if (!finalTitle) return;

    const finalDate = itemDate || (initialData ? initialData.date : currentDate);
    const finalTime = time || '09:00';
    const itemData: Omit<ScheduleItem, 'id'> = { date: finalDate, time: finalTime, title: finalTitle, type: selectedType, location: finalLocation, notes };
    const gpsParts = gpsInput.split(/[,，\s]+/).filter(Boolean);
    if (gpsParts.length >= 2) itemData.gps = { lat: gpsParts[0], lng: gpsParts[1] };

    if (selectedType === 'flight') {
        itemData.flightDetails = {
            airline: flightAirline, flightCode, departureDate: flightDepDate, departureTime: flightDepTime, arrivalDate: flightArrDate, arrivalTime: flightArrTime, departureAirport: flightDepAirport, arrivalAirport: flightArrAirport,
            hasTransit: flightHasTransit || !!flightTransitAirport || !!flightTransitCity,
            transitAirport: flightTransitAirport,
            transitCity: flightTransitCity,
            transitDuration: flightTransitDuration,
            transitFlightCode: flightTransitFlightCode,
            flightDuration: flightDuration,
            checkedBag: flightCheckedBag, carryOnBag: flightCarryOnBag,
            cost: Number(flightCost) || 0, currency: flightCurrency, hasServiceFee: flightHasServiceFee, serviceFeePercentage: flightHasServiceFee ? (Number(flightServiceFeePercentage) || 0) : undefined, participants: flightParticipants, isPotential: isFlightPotential
        };
        if (flightDepDate) itemData.date = flightDepDate;
        if (flightDepTime) itemData.time = flightDepTime;
    }
    if (selectedType === 'stay') {
      itemData.checkIn = checkInTime || checkIn;
      itemData.checkOut = checkOutTime || checkOut;
      itemData.meals = { breakfast: hasBreakfast, dinner: hasDinner };
      itemData.stayDetails = {
        checkInDate,
        checkInTime: checkInTime || checkIn,
        checkOutDate,
        checkOutTime: checkOutTime || checkOut,
        cost: Number(stayCost) || 0,
        currency: stayCurrency,
        hasServiceFee: stayHasServiceFee,
        serviceFeePercentage: stayHasServiceFee ? (Number(stayServiceFeePercentage) || 0) : undefined,
        participants: stayParticipants,
        isPotential: isStayPotential
      };
      if (checkInDate) itemData.date = checkInDate;
      if (checkInTime) itemData.time = checkInTime;
    }
    if (selectedType === 'transport') {
      if (transportMode === 'transit') {
        const updatedLegs = transitLegs.map((leg, idx) => (idx === 0) ? { ...leg, departureTime: finalTime } : leg);
        itemData.transitDetails = {
          legs: updatedLegs,
          fare: transitFare,
          participants: transitParticipants,
          isPotential: isTransitPotential
        };
        itemData.time = finalTime;
      } else {
        itemData.carRental = {
          hasRental, company: hasRental ? rentalCompany : undefined, carModel: hasRental ? carModel : undefined,
          pickupDate: hasRental ? pickupDate : undefined,
          pickupTime: hasRental ? pickupTime : undefined,
          returnDate: hasRental ? returnDate : undefined,
          returnTime: hasRental ? returnTime : undefined,
          rentalCost: hasRental ? (Number(rentalCost) || 0) : undefined, rentalCurrency: hasRental ? rentalCurrency : undefined, hasServiceFee: hasRental ? rentalHasServiceFee : false, serviceFeePercentage: hasRental ? (Number(rentalServiceFeePercentage) || 0) : undefined,
          estimatedFuelCost: hasRental ? (Number(estimatedFuelCost) || 0) : undefined, fuelCurrency: hasRental ? fuelCurrency : undefined, expenses: hasRental ? rentalExpenses.map(e => ({...e, amount: Number(e.amount)||0, serviceFeePercentage: Number(e.serviceFeePercentage)||0})) : [], participants: hasRental ? rentalParticipants : [], isPotential: hasRental ? isRentalPotential : false
        };
        if (pickupDate) itemData.date = pickupDate;
        if (pickupTime) itemData.time = pickupTime;
        else itemData.time = finalTime;
      }
    }
    if (selectedType === 'spot' || selectedType === 'food') {
      itemData.spotDetails = {
        hasTicket, ticketCost: hasTicket ? (Number(ticketCost) || 0) : undefined, currency: hasTicket ? selectedCurrency : undefined, hasServiceFee, serviceFee: (hasTicket && hasServiceFee) ? (Number(ticketCost) || 0) * (Number(serviceFeePercentage) || 0) / 100 : undefined, serviceFeePercentage: (hasTicket && hasServiceFee) ? (Number(serviceFeePercentage) || 0) : undefined, participants: hasTicket ? participantIds : undefined, isPotential: hasTicket ? isPotential : false
      };
    }
    onSave(itemData); onClose();
  };

  // Reusable Components
  const CurrencySelect = ({ value, onChange }: { value: string, onChange: (v: string) => void }) => (
      <select value={value} onChange={e => onChange(e.target.value)} className="bg-white p-2 rounded-lg border border-beige-dark outline-none text-xs font-bold text-cocoa max-w-full">
          <option value="TWD">TWD</option>{currencies.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
      </select>
  );

  const ParticipantsSelector = ({ selected, toggle }: { selected: string[], toggle: (id: string) => void }) => (
      <div className="flex flex-wrap gap-2 mt-2">
          {members.map(m => (
              <button key={m.id} onClick={() => toggle(m.id)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all ${selected.includes(m.id) ? 'bg-sage text-white border-sage shadow-sm' : 'bg-white text-gray-400 border-beige-dark'}`}>{m.name}</button>
          ))}
      </div>
  );

  // Helper to calculate total rental cost including extras and fees
  const calculateTotalRental = () => {
    let totalInRentalCurrency = 0;
    const baseAmount = Number(rentalCost) || 0;
    const baseWithFee = baseAmount + (rentalHasServiceFee ? baseAmount * (Number(rentalServiceFeePercentage) || 0) / 100 : 0);
    
    totalInRentalCurrency += baseWithFee;

    // Convert each extra expense to rentalCurrency if possible
    const rentalRate = currencies.find(c => c.code === rentalCurrency)?.rate || (rentalCurrency === 'TWD' ? 1 : 1);
    
    rentalExpenses.forEach(exp => {
      const expAmount = Number(exp.amount) || 0;
      const expWithFee = expAmount + (exp.hasServiceFee ? expAmount * (Number(exp.serviceFeePercentage) || 0) / 100 : 0);
      const expRate = currencies.find(c => c.code === exp.currency)?.rate || (exp.currency === 'TWD' ? 1 : 1);
      
      // Convert extra to TWD then to rentalCurrency
      const amountInTWD = expWithFee * expRate;
      totalInRentalCurrency += amountInTWD / (rentalRate || 1);
    });

    return totalInRentalCurrency;
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-cocoa/60 backdrop-blur-sm z-50 flex flex-col items-center justify-end sm:justify-center sm:p-4 animate-fade-in" onClick={onClose}>
        <div className="bg-[#FAF8F2] w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-xl sm:rounded-[2.5rem] rounded-none p-5 sm:p-6 shadow-2xl border-0 sm:border-4 sm:border-beige-dark flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
          
          {step === 'category' ? (
            <div className="flex flex-col h-full justify-between overflow-y-auto custom-scroll">
              <div className="flex justify-between items-center pb-3 border-b-2 border-beige-dark flex-shrink-0">
                <h3 className="text-xl font-black text-cocoa tracking-wider">選擇項目類型</h3>
                <button onClick={onClose} className="p-2 bg-white rounded-full text-gray-400 hover:text-red-400 border border-beige-dark shadow-sm transition-colors"><X size={18}/></button>
              </div>
              <div className="grid grid-cols-2 gap-4 py-6 my-auto">
                {[ { type: 'spot', label: '景點', icon: Camera, color: 'bg-green-100 text-green-600' }, { type: 'food', label: '美食', icon: Utensils, color: 'bg-orange-100 text-orange-500' }, { type: 'transport', label: '交通', icon: Train, color: 'bg-blue-100 text-blue-500' }, { type: 'stay', label: '住宿', icon: Bed, color: 'bg-purple-100 text-purple-500' }, { type: 'flight', label: '航班', icon: Plane, color: 'bg-cyan-100 text-cyan-600' } ].map((item, i) => (
                  <button key={i} onClick={() => { setSelectedType(item.type as ItemType); setStep('details'); }} className="flex flex-col items-center justify-center p-5 bg-white rounded-3xl shadow-sm hover:shadow-md active:translate-y-1 transition-all border-2 border-beige-dark hover:border-sage">
                    <div className={`w-14 h-14 rounded-2xl ${item.color} flex items-center justify-center mb-3 border-2 border-white shadow-sm`}><item.icon size={28} strokeWidth={2.5} /></div>
                    <span className="font-black text-cocoa text-lg">{item.label}</span>
                  </button>
                ))}
              </div>
              <div className="pt-3 border-t-2 border-beige-dark mt-auto flex-shrink-0">
                <button onClick={onClose} className="w-full py-3.5 rounded-2xl font-bold text-cocoa bg-white border-2 border-beige-dark hover:bg-gray-50 transition-colors">取消</button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full overflow-hidden">
               <div className="flex items-center justify-between pb-3 border-b-2 border-beige-dark flex-shrink-0 mb-3">
                  <button onClick={() => !initialData && setStep('category')} className={`text-gray-400 font-bold text-sm ${initialData ? 'opacity-0 pointer-events-none' : 'hover:text-sage'}`}>← 返回種類</button>
                  <h3 className="text-xl font-black text-cocoa tracking-wider">{initialData ? '編輯項目' : '輸入細節'}</h3>
                  <button onClick={onClose} className="p-2 bg-white rounded-full text-gray-400 hover:text-red-400 border border-beige-dark shadow-sm transition-colors"><X size={18}/></button>
               </div>

               <div className="space-y-4 overflow-y-auto custom-scroll flex-1 pr-1 pb-4">
               {/* Basic Info */}
             <div className="bg-white p-4 rounded-2xl border-2 border-beige-dark shadow-sm">
                <label className="text-xs font-bold text-gray-400 block mb-1">標題</label>
                <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} className="w-full text-lg font-bold text-cocoa outline-none placeholder:text-gray-300 bg-transparent" placeholder={selectedType === 'flight' ? "例如: 台北 -> 東京" : selectedType === 'food' ? "例如：一蘭拉麵..." : selectedType === 'stay' ? "例如：希爾頓酒店..." : selectedType === 'transport' ? "例如：自駕或搭車..." : "例如：清水寺..."} />
             </div>
             {/* Date & Time Picker */}
             {selectedType !== 'flight' && selectedType !== 'stay' && (selectedType !== 'transport' || transportMode === 'transit') && (
                <DateTimePickerField
                   label={selectedType === 'food' ? '用餐時間與日期' : selectedType === 'spot' ? '參訪時間與日期' : '行程時間與日期'}
                   value={itemDate && time ? `${itemDate}T${time}` : itemDate ? `${itemDate}T09:00` : ''}
                   onChange={val => {
                      const [d, t] = val.split('T');
                      if (d) setItemDate(d);
                      if (t) {
                        setTime(t);
                        if (selectedType === 'transport' && transportMode === 'transit') {
                          setTransitLegs(prev => prev.map((leg, idx) => idx === 0 ? { ...leg, departureTime: t } : leg));
                        }
                      }
                   }}
                   themeColor={selectedType === 'spot' ? 'green' : selectedType === 'food' ? 'orange' : 'sage'}
                   icon={selectedType === 'food' ? Utensils : selectedType === 'spot' ? Camera : Clock}
                />
             )}
             <div className="bg-white p-4 rounded-2xl border-2 border-beige-dark shadow-sm">
                <label className="text-xs font-bold text-gray-400 block mb-1">地點 / 地址</label>
                <div className="flex gap-2"><input value={location} onChange={(e) => setLocation(e.target.value)} className="flex-1 text-lg font-bold text-cocoa outline-none placeholder:text-gray-300 bg-transparent" placeholder="輸入地址..." />{location && <button onClick={() => openExternalMap(location)} className="text-gray-400 hover:text-blue-500"><Navigation size={20} /></button>}</div>
             </div>
             {(selectedType === 'stay' || selectedType === 'spot' || selectedType === 'food' || selectedType === 'transport' || selectedType === 'flight') && (
                 <div className="bg-white p-3 rounded-2xl border-2 border-beige-dark shadow-sm">
                    <label className="text-[10px] font-bold text-gray-400 block mb-1">GPS (Lat, Lng)</label>
                    <div className="flex gap-2"><input value={gpsInput} onChange={(e) => setGpsInput(e.target.value)} className="flex-1 text-sm font-bold text-cocoa outline-none placeholder:text-gray-300 bg-transparent" placeholder="例如: 35.689, 139.691" />{gpsInput && <button onClick={() => openExternalMap(gpsInput)} className="text-gray-400 hover:text-blue-500"><ExternalLink size={20} /></button>}</div>
                 </div>
             )}

             {/* === FLIGHT SECTION === */}
              {selectedType === 'flight' && (
                  <div className="space-y-4 pt-2 border-t-2 border-dashed border-beige-dark animate-scale-in">
                      <div className="bg-cyan-50/50 p-3 rounded-2xl border-2 border-cyan-100 space-y-3">
                          {/* ... flight inputs ... */}
                          <div className="grid grid-cols-2 gap-2">
                              <div className="bg-white p-3 rounded-2xl border border-beige-dark shadow-sm"><label className="text-[10px] font-bold text-gray-400 block mb-1">航空公司</label><input value={flightAirline} onChange={e => setFlightAirline(e.target.value)} className="w-full text-sm font-bold text-cocoa outline-none bg-transparent" placeholder="Ex: EVA"/></div>
                              <div className="bg-white p-3 rounded-2xl border border-beige-dark shadow-sm"><label className="text-[10px] font-bold text-gray-400 block mb-1">航班代碼</label><input value={flightCode} onChange={e => setFlightCode(e.target.value)} className="w-full text-sm font-bold text-cocoa outline-none bg-transparent" placeholder="Ex: BR123"/></div>
                          </div>
                          {/* Route/Times */}
                          <div className="space-y-3">
                              <DateTimePickerField
                                  label="去程出發 (Departure)"
                                  value={flightDepDate && flightDepTime ? `${flightDepDate}T${flightDepTime}` : flightDepDate ? `${flightDepDate}T09:00` : ''}
                                  onChange={val => {
                                      const [d, t] = val.split('T');
                                      if (d) {
                                          setFlightDepDate(d);
                                          setItemDate(d);
                                      }
                                      if (t) {
                                          setFlightDepTime(t);
                                          setTime(t);
                                      }
                                  }}
                                  themeColor="cyan"
                                  icon={Plane}
                              />
                              <DateTimePickerField
                                  label="去程抵達 (Arrival)"
                                  value={flightArrDate && flightArrTime ? `${flightArrDate}T${flightArrTime}` : flightArrDate ? `${flightArrDate}T12:00` : ''}
                                  onChange={val => {
                                      const [d, t] = val.split('T');
                                      if (d) setFlightArrDate(d);
                                      if (t) setFlightArrTime(t);
                                  }}
                                  themeColor="cyan"
                                  icon={Clock}
                              />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                              <div className="bg-white p-3 rounded-2xl border border-beige-dark shadow-sm"><label className="text-[10px] font-bold text-gray-400 block mb-1">起飛機場</label><input value={flightDepAirport} onChange={e => setFlightDepAirport(e.target.value)} className="w-full text-sm font-bold text-cocoa outline-none bg-transparent" placeholder="TPE T2"/></div>
                              <div className="bg-white p-3 rounded-2xl border border-beige-dark shadow-sm"><label className="text-[10px] font-bold text-gray-400 block mb-1">抵達機場</label><input value={flightArrAirport} onChange={e => setFlightArrAirport(e.target.value)} className="w-full text-sm font-bold text-cocoa outline-none bg-transparent" placeholder="KIX T1"/></div>
                          </div>

                          {/* 轉機資訊 (Transit / Layover) */}
                          <div className="bg-amber-50/70 p-3 rounded-2xl border border-amber-200/80 space-y-2">
                              <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                      <div className="w-5 h-5 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center text-xs font-black">轉</div>
                                      <span className="text-xs font-black text-amber-900">轉機資訊 (可選)</span>
                                  </div>
                                  <ToggleSwitch 
                                      checked={flightHasTransit || !!flightTransitAirport || !!flightTransitCity} 
                                      onChange={(checked) => {
                                          setFlightHasTransit(checked);
                                          if (!checked) {
                                              setFlightTransitAirport('');
                                              setFlightTransitCity('');
                                              setFlightTransitDuration('');
                                              setFlightTransitFlightCode('');
                                          }
                                      }} 
                                      label={flightHasTransit || !!flightTransitAirport ? "有轉機" : "直飛 / 無轉機"} 
                                      colorClass="bg-amber-400" 
                                  />
                              </div>

                              {(flightHasTransit || !!flightTransitAirport || !!flightTransitCity) && (
                                  <div className="space-y-2 pt-2 border-t border-amber-200/60">
                                      <div className="grid grid-cols-2 gap-2">
                                          <div className="bg-white p-2.5 rounded-xl border border-amber-200 shadow-xs">
                                              <label className="text-[9px] font-bold text-amber-800 block mb-0.5">轉機機場代碼 (如 AUH)</label>
                                              <input value={flightTransitAirport} onChange={e => setFlightTransitAirport(e.target.value.toUpperCase())} className="w-full font-mono text-sm font-black text-cocoa outline-none bg-transparent" placeholder="AUH"/>
                                          </div>
                                          <div className="bg-white p-2.5 rounded-xl border border-amber-200 shadow-xs">
                                              <label className="text-[9px] font-bold text-amber-800 block mb-0.5">轉機城市 (如 阿布達比)</label>
                                              <input value={flightTransitCity} onChange={e => setFlightTransitCity(e.target.value)} className="w-full text-sm font-bold text-cocoa outline-none bg-transparent" placeholder="阿布達比"/>
                                          </div>
                                      </div>
                                      <div className="grid grid-cols-2 gap-2">
                                          <div className="bg-white p-2.5 rounded-xl border border-amber-200 shadow-xs">
                                              <label className="text-[9px] font-bold text-amber-800 block mb-0.5">轉機時間 / 停留時長</label>
                                              <input value={flightTransitDuration} onChange={e => setFlightTransitDuration(e.target.value)} className="w-full text-sm font-bold text-cocoa outline-none bg-transparent" placeholder="如：2h 15m 或 3小時"/>
                                          </div>
                                          <div className="bg-white p-2.5 rounded-xl border border-amber-200 shadow-xs">
                                              <label className="text-[9px] font-bold text-amber-800 block mb-0.5">銜接航班號 (可選)</label>
                                              <input value={flightTransitFlightCode} onChange={e => setFlightTransitFlightCode(e.target.value.toUpperCase())} className="w-full font-mono text-sm font-black text-cocoa outline-none bg-transparent" placeholder="EY073"/>
                                          </div>
                                      </div>
                                  </div>
                              )}
                          </div>

                          {/* 總飛行/航程時間 */}
                          <div className="bg-white p-3 rounded-2xl border border-beige-dark shadow-sm">
                              <label className="text-[10px] font-bold text-gray-400 block mb-1">飛行時間 / 總航程時長 (可選)</label>
                              <div className="flex items-center gap-2">
                                  <Clock size={15} className="text-cyan-600 flex-shrink-0"/>
                                  <input value={flightDuration} onChange={e => setFlightDuration(e.target.value)} className="w-full text-sm font-bold text-cocoa outline-none bg-transparent" placeholder="例如：16h 40m 或 4小時30分"/>
                              </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                              <div className="bg-white p-3 rounded-2xl border border-beige-dark shadow-sm"><label className="text-[10px] font-bold text-gray-400 block mb-1">託運行李</label><input value={flightCheckedBag} onChange={e => setFlightCheckedBag(e.target.value)} className="w-full text-sm font-bold text-cocoa outline-none bg-transparent" placeholder="23kg"/></div>
                              <div className="bg-white p-3 rounded-2xl border border-beige-dark shadow-sm"><label className="text-[10px] font-bold text-gray-400 block mb-1">手提行李</label><input value={flightCarryOnBag} onChange={e => setFlightCarryOnBag(e.target.value)} className="w-full text-sm font-bold text-cocoa outline-none bg-transparent" placeholder="7kg"/></div>
                          </div>
                          {/* Cost */}
                          <div className="pt-2 border-t border-dashed border-cyan-200 mt-2">
                             <div className="text-xs font-bold text-cyan-600 mb-2 flex items-center gap-1"><DollarSign size={12}/> 機票費用 (總計)</div>
                             <div className="flex gap-2 mb-2">
                                <div className="bg-white p-2 rounded-xl border border-beige-dark shadow-sm flex-[2]"><input type="number" value={flightCost} onChange={(e) => setFlightCost(e.target.value)} className="w-full text-sm font-bold text-cocoa outline-none bg-transparent" placeholder="0"/></div>
                                <div className="w-24"><CurrencySelect value={flightCurrency} onChange={setFlightCurrency}/></div>
                             </div>
                             <div className="flex items-center gap-4 mb-2">
                                 <ToggleSwitch checked={flightHasServiceFee} onChange={setFlightHasServiceFee} label="含稅/手續費" colorClass="bg-cyan-400" />
                                 {flightHasServiceFee && <div className="flex items-center bg-white px-2 py-1 rounded border border-beige-dark"><input type="number" value={flightServiceFeePercentage} onChange={e => setFlightServiceFeePercentage(e.target.value)} className="w-8 bg-transparent text-xs font-bold outline-none text-right text-cocoa" placeholder="0"/><span className="text-xs font-bold text-gray-400 ml-1">%</span></div>}
                             </div>
                             <CostDisplay amount={Number(flightCost)} currency={flightCurrency} hasFee={flightHasServiceFee} feePct={Number(flightServiceFeePercentage)} currencies={currencies} />
                             
                             <label className="text-[10px] font-bold text-gray-400 block mb-1 mt-2">參與分攤人員</label>
                             <ParticipantsSelector selected={flightParticipants} toggle={(id) => toggleParticipant(id, setFlightParticipants)}/>
                             <div className="mt-2">
                                 <ToggleSwitch checked={isFlightPotential} onChange={setIsFlightPotential} label="列入潛在花費 (預算參考)" colorClass="bg-yellow-400" />
                             </div>
                          </div>
                      </div>
                  </div>
              )}

              {/* === STAY SECTION === */}
             {selectedType === 'stay' && (
               <div className="space-y-4 pt-2 border-t-2 border-dashed border-beige-dark animate-scale-in">
                 <div className="space-y-3 bg-purple-50/50 p-3 rounded-2xl border-2 border-purple-100 mt-2">
                      {/* Stay Check-in / Check-out */}
                      <div className="space-y-3">
                          <DateTimePickerField
                              label="入住時間 (Check-in)"
                              value={checkInDate && checkInTime ? `${checkInDate}T${checkInTime}` : checkInDate ? `${checkInDate}T15:00` : ''}
                              onChange={val => {
                                  const [d, t] = val.split('T');
                                  if (d) {
                                      setCheckInDate(d);
                                      setItemDate(d);
                                  }
                                  if (t) {
                                      setCheckInTime(t);
                                      setCheckIn(t);
                                      setTime(t);
                                  }
                              }}
                              themeColor="purple"
                              icon={Bed}
                          />
                          <DateTimePickerField
                              label="退房時間 (Check-out)"
                              value={checkOutDate && checkOutTime ? `${checkOutDate}T${checkOutTime}` : checkOutDate ? `${checkOutDate}T11:00` : ''}
                              onChange={val => {
                                  const [d, t] = val.split('T');
                                  if (d) setCheckOutDate(d);
                                  if (t) {
                                      setCheckOutTime(t);
                                      setCheckOut(t);
                                  }
                              }}
                              themeColor="purple"
                              icon={Clock}
                          />
                      </div>
                      <div className="flex gap-2 px-1">
                          <CuteButton checked={hasBreakfast} onChange={setHasBreakfast} icon={Coffee} label="供應早餐" activeColor="bg-purple-100 text-purple-600 border-purple-200" />
                          <CuteButton checked={hasDinner} onChange={setHasDinner} icon={Utensils} label="供應晚餐" activeColor="bg-purple-100 text-purple-600 border-purple-200" />
                      </div>
                      <div className="pt-2 border-t border-dashed border-purple-200 mt-2">
                          <div className="text-xs font-bold text-purple-600 mb-2 flex items-center gap-1"><DollarSign size={12}/> 住宿費用</div>
                          <div className="flex gap-2 mb-2">
                             <div className="bg-white p-2 rounded-xl border border-beige-dark shadow-sm flex-[2]"><input type="number" value={stayCost} onChange={(e) => setStayCost(e.target.value)} className="w-full text-sm font-bold text-cocoa outline-none bg-transparent" placeholder="0"/></div>
                             <div className="w-24"><CurrencySelect value={stayCurrency} onChange={setStayCurrency}/></div>
                          </div>
                          <div className="flex items-center gap-4 mb-2">
                                <ToggleSwitch checked={stayHasServiceFee} onChange={setStayHasServiceFee} label="含稅/手續費" colorClass="bg-purple-400" />
                                {stayHasServiceFee && <div className="flex items-center bg-white px-2 py-1 rounded border border-beige-dark"><input type="number" value={stayServiceFeePercentage} onChange={e => setStayServiceFeePercentage(e.target.value)} className="w-8 bg-transparent text-xs font-bold outline-none text-right text-cocoa" placeholder="0"/><span className="text-xs font-bold text-gray-400 ml-1">%</span></div>}
                          </div>
                          <CostDisplay amount={Number(stayCost)} currency={stayCurrency} hasFee={stayHasServiceFee} feePct={Number(stayServiceFeePercentage)} currencies={currencies} />

                          <label className="text-[10px] font-bold text-gray-400 block mb-1 mt-2">參與分攤人員</label>
                          <ParticipantsSelector selected={stayParticipants} toggle={(id) => toggleParticipant(id, setStayParticipants)}/>
                          <div className="mt-2">
                                <ToggleSwitch checked={isStayPotential} onChange={setIsStayPotential} label="列入潛在花費 (預算參考)" colorClass="bg-yellow-400" />
                          </div>
                      </div>
                 </div>
               </div>
             )}

             {/* === TRANSPORT SECTION === */}
             {selectedType === 'transport' && (
                 <div className="border-t-2 border-dashed border-beige-dark pt-4 space-y-4">
                     {/* Mode Selector Tabs */}
                     <div className="flex bg-beige/60 p-1.5 rounded-2xl border-2 border-beige-dark gap-2 shadow-inner">
                         <button
                           type="button"
                           onClick={() => setTransportMode('transit')}
                           className={`flex-1 py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all ${
                             transportMode === 'transit'
                               ? 'bg-blue-500 text-white shadow-md'
                               : 'bg-transparent text-gray-500 hover:text-cocoa'
                           }`}
                         >
                           <Train size={16} strokeWidth={2.5} />
                           <span>大眾運輸 / 鐵道轉乘</span>
                         </button>
                         <button
                           type="button"
                           onClick={() => {
                             setTransportMode('rental');
                             setHasRental(true);
                           }}
                           className={`flex-1 py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all ${
                             transportMode === 'rental'
                               ? 'bg-blue-500 text-white shadow-md'
                               : 'bg-transparent text-gray-500 hover:text-cocoa'
                           }`}
                         >
                           <Car size={16} strokeWidth={2.5} />
                           <span>自駕租車</span>
                         </button>
                     </div>

                     {/* Transit Mode Form */}
                     {transportMode === 'transit' && (
                         <div className="space-y-4 animate-scale-in">
                             <TransitLegEditor
                               legs={transitLegs}
                               setLegs={setTransitLegs}
                               fare={transitFare}
                               setFare={setTransitFare}
                               currencies={currencies}
                             />

                             <div className="bg-white p-3.5 rounded-2xl border-2 border-beige-dark shadow-sm space-y-3">
                                 <div>
                                     <label className="text-[10px] font-black text-gray-400 block mb-1">參與分攤人員</label>
                                     <ParticipantsSelector
                                       selected={transitParticipants}
                                       toggle={(id) => toggleParticipant(id, setTransitParticipants)}
                                     />
                                 </div>
                                 <div className="pt-2 border-t border-dashed border-beige-dark">
                                     <ToggleSwitch
                                       checked={isTransitPotential}
                                       onChange={setIsTransitPotential}
                                       label="列入潛在花費 (預算參考)"
                                       colorClass="bg-yellow-400"
                                     />
                                 </div>
                             </div>
                         </div>
                     )}

                     {/* Car Rental Mode Form */}
                     {transportMode === 'rental' && (
                         <div className="space-y-3 bg-blue-50/50 p-3 rounded-2xl border-2 border-blue-100 animate-scale-in">
                             <div className="grid grid-cols-2 gap-2">
                                 <div className="bg-white p-3 rounded-2xl border border-beige-dark shadow-sm"><label className="text-[10px] font-bold text-gray-400 block mb-1">租車公司</label><input value={rentalCompany} onChange={e => setRentalCompany(e.target.value)} className="w-full text-sm font-bold text-cocoa outline-none bg-transparent" placeholder="Ex: Toyota"/></div>
                                 <div className="bg-white p-3 rounded-2xl border border-beige-dark shadow-sm"><label className="text-[10px] font-bold text-gray-400 block mb-1">車型</label><input value={carModel} onChange={e => setCarModel(e.target.value)} className="w-full text-sm font-bold text-cocoa outline-none bg-transparent" placeholder="Ex: Yaris"/></div>
                             </div>
                             <div className="space-y-3">
                                 <DateTimePickerField
                                     label="取車時間 (Pickup)"
                                     value={pickupDate && pickupTime ? `${pickupDate}T${pickupTime}` : pickupDate ? `${pickupDate}T09:00` : ''}
                                     onChange={val => {
                                         const [d, t] = val.split('T');
                                         if (d) {
                                             setPickupDate(d);
                                             setItemDate(d);
                                         }
                                         if (t) {
                                             setPickupTime(t);
                                             setTime(t);
                                         }
                                     }}
                                     themeColor="blue"
                                     icon={Car}
                                 />
                                 <DateTimePickerField
                                     label="還車時間 (Return)"
                                     value={returnDate && returnTime ? `${returnDate}T${returnTime}` : returnDate ? `${returnDate}T18:00` : ''}
                                     onChange={val => {
                                         const [d, t] = val.split('T');
                                         if (d) setReturnDate(d);
                                         if (t) setReturnTime(t);
                                     }}
                                     themeColor="blue"
                                     icon={Clock}
                                 />
                             </div>
                             
                             {/* Rental Cost */}
                             <div className="pt-2 border-t border-dashed border-blue-200 mt-2">
                                <div className="text-xs font-bold text-gray-500 mb-2 flex items-center gap-1"><DollarSign size={12}/> 租車費用 (加總)</div>
                                <div className="flex gap-2 mb-2">
                                   <div className="bg-white p-2 rounded-xl border border-beige-dark shadow-sm flex-[2]"><input type="number" value={rentalCost} onChange={(e) => setRentalCost(e.target.value)} className="w-full text-sm font-bold text-cocoa outline-none bg-transparent" placeholder="0"/></div>
                                   <div className="w-24"><CurrencySelect value={rentalCurrency} onChange={setRentalCurrency}/></div>
                                </div>
                                <div className="flex items-center gap-4 mb-2">
                                    <ToggleSwitch checked={rentalHasServiceFee} onChange={setRentalHasServiceFee} label="含稅/手續費" colorClass="bg-blue-400" />
                                    {rentalHasServiceFee && <div className="flex items-center bg-white px-2 py-1 rounded border border-beige-dark"><input type="number" value={rentalServiceFeePercentage} onChange={e => setRentalServiceFeePercentage(e.target.value)} className="w-8 bg-transparent text-xs font-bold outline-none text-right text-cocoa" placeholder="0"/><span className="text-xs font-bold text-gray-400 ml-1">%</span></div>}
                                </div>
                                {/* Use real-time total rental calculation */}
                                <CostDisplay amount={calculateTotalRental()} currency={rentalCurrency} hasFee={false} feePct={0} currencies={currencies} />
                             </div>

                             {/* Fuel Cost */}
                             <div className="pt-2 border-t border-dashed border-blue-200 mt-1">
                                <div className="text-xs font-bold text-gray-500 mb-2 flex items-center gap-1"><Fuel size={12}/> 預估油資</div>
                                <div className="flex gap-2 mb-2">
                                   <div className="bg-white p-2 rounded-xl border border-beige-dark shadow-sm flex-[2]"><input type="number" value={estimatedFuelCost} onChange={(e) => setEstimatedFuelCost(e.target.value)} className="w-full text-sm font-bold text-cocoa outline-none bg-transparent" placeholder="0"/></div>
                                   <div className="w-24"><CurrencySelect value={fuelCurrency} onChange={setFuelCurrency}/></div>
                                </div>
                             </div>

                             {/* Extra Expenses */}
                             <div className="pt-2 border-t border-dashed border-blue-200 mt-1">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="text-xs font-bold text-gray-500 flex items-center gap-1"><Plus size={12}/> 額外支出 (過路費等)</div>
                                    <button onClick={addRentalExpense} className="text-[10px] bg-white border border-blue-200 text-blue-500 px-2 py-1 rounded-lg font-bold shadow-sm">新增項目</button>
                                </div>
                                {rentalExpenses.map(exp => (
                                    <div key={exp.id} className="bg-white p-3 rounded-xl border border-beige-dark shadow-sm mb-2">
                                        <div className="flex gap-2 mb-2">
                                            <input value={exp.name} onChange={e => updateRentalExpense(exp.id, 'name', e.target.value)} placeholder="項目名稱" className="flex-1 bg-gray-50 p-2 rounded-lg border border-beige-dark text-xs font-bold text-cocoa outline-none focus:border-blue-300"/>
                                            <button onClick={() => setExpenseToDelete(exp.id)} className="text-red-400 p-1 hover:text-red-600 transition-colors"><X size={16}/></button>
                                        </div>
                                        <div className="flex gap-2 items-center">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex gap-1">
                                                    <input type="number" value={exp.amount} onChange={e => updateRentalExpense(exp.id, 'amount', e.target.value)} placeholder="金額" className="flex-1 bg-gray-50 p-2 rounded-lg border border-beige-dark text-xs font-bold text-cocoa outline-none focus:border-blue-300 min-w-0"/>
                                                    <div className="w-24 flex-shrink-0"><CurrencySelect value={exp.currency || 'TWD'} onChange={v => updateRentalExpense(exp.id, 'currency', v)}/></div>
                                                </div>
                                            </div>
                                        </div>
                                        {Number(exp.amount) > 0 && (
                                            <div className="mt-2 text-[10px] font-black text-blue-500 text-right">
                                                約 TWD ${Math.round(Number(exp.amount) * (currencies.find(c => c.code === exp.currency)?.rate || (exp.currency === 'TWD' ? 1 : 1))).toLocaleString()}
                                            </div>
                                        )}
                                    </div>
                                ))}
                             </div>

                             <label className="text-[10px] font-bold text-gray-400 block mb-1 mt-2">參與分攤人員</label>
                             <ParticipantsSelector selected={rentalParticipants} toggle={(id) => toggleParticipant(id, setRentalParticipants)}/>
                             <div className="mt-2">
                                <ToggleSwitch checked={isRentalPotential} onChange={setIsRentalPotential} label="列入潛在花費 (預算參考)" colorClass="bg-yellow-400" />
                             </div>
                         </div>
                     )}
                 </div>
             )}

             {/* === SPOT / FOOD SECTION === */}
             {(selectedType === 'spot' || selectedType === 'food') && (
               <div className="space-y-4 pt-2 border-t-2 border-dashed border-beige-dark animate-scale-in">
                 {/* ... spot inputs ... */}
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sage font-bold">
                        {selectedType === 'food' ? <Utensils size={18}/> : <Ticket size={18} />} 
                        <span>{selectedType === 'food' ? '餐飲費用' : '門票與費用'}</span>
                    </div>
                    {/* Only show top toggle for Spot/Ticket, keep Food inputs always visible but use same internal state structure */}
                    {selectedType === 'spot' && (
                        <button onClick={() => setHasTicket(!hasTicket)} className={`w-12 h-7 rounded-full p-1 transition-colors ${hasTicket ? 'bg-sage' : 'bg-gray-200'}`}><div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${hasTicket ? 'translate-x-5' : 'translate-x-0'}`} /></button>
                    )}
                 </div>

                 {(hasTicket || selectedType === 'food') && (
                   <div className="space-y-3 bg-white/50 p-3 rounded-2xl border-2 border-beige-dark/50">
                      <div className="flex gap-2">
                         <div className="bg-white p-3 rounded-2xl border-2 border-beige-dark shadow-sm flex-[2]">
                            <label className="text-[10px] font-bold text-gray-400 block mb-1">金額</label>
                            <input type="number" value={ticketCost} onChange={(e) => setTicketCost(e.target.value)} className="w-full text-sm font-bold text-cocoa outline-none bg-transparent" placeholder="0"/>
                         </div>
                         <div className="w-24 bg-white p-3 rounded-2xl border-2 border-beige-dark shadow-sm">
                             <label className="text-[10px] font-bold text-gray-400 block mb-1">幣別</label>
                             <div className="mt-1"><CurrencySelect value={selectedCurrency} onChange={setSelectedCurrency}/></div>
                         </div>
                      </div>
                      <div className="flex items-center gap-4 mb-1">
                            <ToggleSwitch checked={hasServiceFee} onChange={setHasServiceFee} label="含稅/手續費" />
                            {hasServiceFee && <div className="flex items-center bg-white px-2 py-1 rounded border border-beige-dark"><input type="number" value={serviceFeePercentage} onChange={e => setServiceFeePercentage(e.target.value)} className="w-8 bg-transparent text-xs font-bold outline-none text-right text-cocoa" placeholder="0"/><span className="text-xs font-bold text-gray-400 ml-1">%</span></div>}
                      </div>
                      <CostDisplay amount={Number(ticketCost)} currency={selectedCurrency} hasFee={hasServiceFee} feePct={Number(serviceFeePercentage)} currencies={currencies} />

                      <label className="text-[10px] font-bold text-gray-400 block mb-1 mt-2">參與分攤人員</label>
                      <ParticipantsSelector selected={participantIds} toggle={(id) => toggleParticipant(id, setParticipantIds)}/>
                      <div className="mt-2">
                        <ToggleSwitch checked={isPotential} onChange={setIsPotential} label="列入潛在花費 (預算參考)" colorClass="bg-yellow-400" />
                      </div>
                   </div>
                 )}
               </div>
             )}

             <div className="bg-white p-4 rounded-2xl border-2 border-beige-dark shadow-sm">
                <label className="text-xs font-bold text-gray-400 flex items-center gap-1 mb-1"><AlignLeft size={12}/> 備註</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full text-sm font-medium text-cocoa outline-none min-h-[80px] resize-none bg-transparent" placeholder="詳細資訊..." style={{ colorScheme: 'light' }}/>
             </div>
           </div>

           <div className="pt-3 border-t-2 border-beige-dark mt-auto flex-shrink-0">
             <button onClick={handleSubmit} className="w-full py-4 rounded-2xl bg-sage text-white text-lg font-bold shadow-hard-sage active:translate-y-1 active:shadow-none transition-all border-2 border-sage">{initialData ? '確認修改' : '確認新增'}</button>
           </div>
          </div>
        )}
      </div>
    </div>

      <DeleteItemConfirmModal 
        isOpen={!!expenseToDelete} 
        onClose={() => setExpenseToDelete(null)} 
        onConfirm={confirmRemoveExpense}
        title="此筆費用項目"
      />
    </>
  );
};
