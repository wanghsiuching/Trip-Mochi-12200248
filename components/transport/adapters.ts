import { BookingFlight, BookingCarRental, TransitLeg, TransitFareDetails, ScheduleItem, BookingTrain, BookingTicket, Member, Currency } from '../../types';
import { TransportItemModel, TransportSegmentModel, LocationNode, TransferInfo, TransportType, TransportTicketSummary } from './types';
import { getTransportMeta } from './TransportIcon';
import { resolveTransitDetails, getRateForCurrency } from '../../src/utils/splitCost';

/**
 * 輔助解析時間 (HH:mm) 差距為可讀字串 (例如 "1h 20m")
 */
export const calculateDurationBetweenTimes = (start?: string, end?: string): string => {
  if (!start || !end) return '';
  try {
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) return '';

    let diffMinutes = (endH * 60 + endM) - (startH * 60 + startM);
    if (diffMinutes < 0) diffMinutes += 24 * 60; // 跨夜

    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;

    if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h`;
    return `${minutes}m`;
  } catch {
    return '';
  }
};

/**
 * 將既有的 BookingFlight 轉換為統一的 TransportItemModel
 * 支援直飛與多段中轉（如 EY899 + EY143 在 AUH 轉機）
 * 回程若為來回機票，會產生兩張 TransportItemModel (去程與回程)
 */
export const bookingFlightToTransport = (flight: BookingFlight): TransportItemModel[] => {
  const result: TransportItemModel[] = [];
  if (!flight) return result;

  // 1. 去程 (Outbound)
  const outboundSegments: TransportSegmentModel[] = [];
  const parsedDepFromDate = flight.date && flight.date.includes('T') ? flight.date.slice(11, 16) : '';
  const parsedArrFromDate = flight.arrivalDate && flight.arrivalDate.includes('T') ? flight.arrivalDate.slice(11, 16) : '';
  const depTime = (parsedDepFromDate && parsedDepFromDate !== '00:00')
    ? parsedDepFromDate
    : ((flight.depTime && flight.depTime !== '00:00') ? flight.depTime : (parsedDepFromDate || flight.depTime || ''));
  const arrTime = (parsedArrFromDate && parsedArrFromDate !== '00:00')
    ? parsedArrFromDate
    : ((flight.arrTime && flight.arrTime !== '00:00') ? flight.arrTime : (parsedArrFromDate || flight.arrTime || ''));
  const depDate = flight.date ? flight.date.slice(0, 10) : '';
  const arrDate = flight.arrivalDate ? flight.arrivalDate.slice(0, 10) : '';

  const originNode: LocationNode = {
    name: flight.originCity || flight.origin || '出發地',
    code: (flight.origin || flight.departureAirport || 'DEP').toUpperCase(),
    city: flight.originCity || '',
    time: depTime,
    date: depDate,
    timeZoneLabel: '出發時間',
  };

  const destNode: LocationNode = {
    name: flight.destCity || flight.dest || '目的地',
    code: (flight.dest || flight.arrivalAirport || 'ARR').toUpperCase(),
    city: flight.destCity || '',
    time: arrTime,
    date: arrDate,
    timeZoneLabel: '抵達時間',
  };

  const hasTransit = Boolean(flight.hasTransit || flight.transitAirport || flight.transitCity);

  if (hasTransit && (flight.transitAirport || flight.transitCity)) {
    // 兩段式航班 (例如 EY899 經由 AUH 轉至 ZRH)
    const transitArrTime = flight.transitArrivalTime || '';
    const transitDepTime = flight.transitDepartureTime || '';
    const autoTransitDuration = calculateDurationBetweenTimes(transitArrTime, transitDepTime);
    const transitNode: LocationNode = {
      name: flight.transitCity || flight.transitAirport || '轉機地',
      code: (flight.transitAirport || 'TRN').toUpperCase(),
      city: flight.transitCity || '',
      time: transitArrTime,
      timeZoneLabel: '轉機節點',
    };

    const transferInfo: TransferInfo = {
      location: transitNode,
      arrivalTime: transitArrTime,
      departureTime: transitDepTime,
      duration: flight.transitDuration || autoTransitDuration || '',
      nextServiceNumber: flight.transitFlightCode?.toUpperCase() || '',
      nextOperator: flight.airline || '',
      nextTransportType: 'flight',
      transferType: 'flight',
      note: '轉機銜接',
    };

    // 第一段航程
    outboundSegments.push({
      id: `${flight.id}-leg-1`,
      type: 'flight',
      operator: flight.airline || '航空公司',
      serviceNumber: flight.code?.toUpperCase() || 'FLIGHT',
      departure: originNode,
      arrival: { ...transitNode, time: transitArrTime },
      transferAfter: transferInfo,
      duration: flight.firstLegDuration || '',
      details: {
        baggage: {
          checked: flight.checkedBag || flight.baggage,
          carryOn: flight.carryOnBag,
        },
        cost: flight.cost,
        currency: flight.currency || 'TWD',
        notes: flight.note,
      }
    });

    // 第二段航程
    outboundSegments.push({
      id: `${flight.id}-leg-2`,
      type: 'flight',
      operator: flight.airline || '航空公司',
      serviceNumber: (flight.transitFlightCode || flight.code || 'FLIGHT').toUpperCase(),
      departure: { ...transitNode, time: transitDepTime },
      arrival: destNode,
      duration: flight.secondLegDuration || '',
      details: {
        baggage: {
          checked: flight.checkedBag || flight.baggage,
          carryOn: flight.carryOnBag,
        },
        cost: flight.cost,
        currency: flight.currency || 'TWD',
        notes: flight.note,
      }
    });
  } else {
    // 直飛航段 (例如 BR87 TPE 直飛 CDG)
    outboundSegments.push({
      id: `${flight.id}-leg-direct`,
      type: 'flight',
      operator: flight.airline || '航空公司',
      serviceNumber: flight.code?.toUpperCase() || 'FLIGHT',
      departure: originNode,
      arrival: destNode,
      duration: flight.duration || '直飛',
      details: {
        baggage: {
          checked: flight.checkedBag || flight.baggage,
          carryOn: flight.carryOnBag,
        },
        cost: flight.cost,
        currency: flight.currency || 'TWD',
        notes: flight.note,
      }
    });
  }

  const outboundItem: TransportItemModel = {
    id: `flight-${flight.id}-outbound`,
    type: 'flight',
    title: `${flight.airline} ${flight.code}`.trim(),
    operator: flight.airline || '航空公司',
    serviceNumber: flight.code?.toUpperCase() || 'FLIGHT',
    totalDuration: flight.duration || '',
    directionType: flight.tripType === 'roundtrip' ? 'outbound' : 'oneway',
    segments: outboundSegments,
    cost: flight.cost,
    currency: flight.currency || 'TWD',
    hasServiceFee: flight.hasServiceFee,
    serviceFeePercentage: flight.serviceFeePercentage,
    baggage: {
      checked: flight.checkedBag || flight.baggage,
      carryOn: flight.carryOnBag,
    },
    note: flight.note,
    participants: flight.participants,
    images: flight.images,
    photoPlacement: flight.photoPlacement,
    photoOffsetY: flight.photoOffsetY,
    rawBookingFlight: flight,
  };

  result.push(outboundItem);

  // 2. 回程 (Inbound) - 若為來回機票
  if (flight.tripType === 'roundtrip' && flight.returnDate) {
    const inboundSegments: TransportSegmentModel[] = [];
    const retDepDate = flight.returnDate ? flight.returnDate.slice(0, 10) : '';
    const retArrDate = flight.returnArrivalDate ? flight.returnArrivalDate.slice(0, 10) : '';
    const retDepTime = flight.returnDate ? flight.returnDate.slice(11, 16) : '';
    const retArrTime = flight.returnArrivalDate ? flight.returnArrivalDate.slice(11, 16) : '';

    const retOriginNode: LocationNode = {
      name: flight.destCity || flight.dest || '出發地',
      code: (flight.dest || flight.arrivalAirport || 'DEP').toUpperCase(),
      city: flight.destCity || '',
      time: retDepTime || '',
      date: retDepDate,
      timeZoneLabel: '出發時間',
    };

    const retDestNode: LocationNode = {
      name: flight.originCity || flight.origin || '目的地',
      code: (flight.origin || flight.departureAirport || 'ARR').toUpperCase(),
      city: flight.originCity || '',
      time: retArrTime || '',
      date: retArrDate,
      timeZoneLabel: '抵達時間',
    };

    const hasReturnTransit = Boolean(flight.hasReturnTransit || flight.returnTransitAirport || flight.returnTransitCity);

    if (hasReturnTransit && (flight.returnTransitAirport || flight.returnTransitCity)) {
      const retTransitArrTime = flight.returnTransitArrivalTime || '';
      const retTransitDepTime = flight.returnTransitDepartureTime || '';
      const autoRetDuration = calculateDurationBetweenTimes(retTransitArrTime, retTransitDepTime);
      const retTransitNode: LocationNode = {
        name: flight.returnTransitCity || flight.returnTransitAirport || '回程轉機地',
        code: (flight.returnTransitAirport || 'TRN').toUpperCase(),
        city: flight.returnTransitCity || '',
        time: retTransitArrTime,
        timeZoneLabel: '轉機節點',
      };

      const retTransferInfo: TransferInfo = {
        location: retTransitNode,
        arrivalTime: retTransitArrTime,
        departureTime: retTransitDepTime,
        duration: flight.returnTransitDuration || autoRetDuration || '',
        nextServiceNumber: flight.returnTransitFlightCode?.toUpperCase() || '',
        nextOperator: flight.airline || '',
        nextTransportType: 'flight',
        transferType: 'flight',
        note: '回程轉機銜接',
      };

      inboundSegments.push({
        id: `${flight.id}-return-leg-1`,
        type: 'flight',
        operator: flight.airline || '航空公司',
        serviceNumber: flight.code?.toUpperCase() || 'FLIGHT',
        departure: retOriginNode,
        arrival: { ...retTransitNode, time: retTransitArrTime },
        transferAfter: retTransferInfo,
        duration: flight.returnFirstLegDuration || '',
        details: {
          baggage: {
            checked: flight.checkedBag || flight.baggage,
            carryOn: flight.carryOnBag,
          },
          notes: flight.note,
        }
      });

      inboundSegments.push({
        id: `${flight.id}-return-leg-2`,
        type: 'flight',
        operator: flight.airline || '航空公司',
        serviceNumber: (flight.returnTransitFlightCode || flight.code || 'FLIGHT').toUpperCase(),
        departure: { ...retTransitNode, time: retTransitDepTime },
        arrival: retDestNode,
        duration: flight.returnSecondLegDuration || '',
        details: {
          baggage: {
            checked: flight.checkedBag || flight.baggage,
            carryOn: flight.carryOnBag,
          },
          notes: flight.note,
        }
      });
    } else {
      inboundSegments.push({
        id: `${flight.id}-return-direct`,
        type: 'flight',
        operator: flight.airline || '航空公司',
        serviceNumber: flight.code?.toUpperCase() || 'FLIGHT',
        departure: retOriginNode,
        arrival: retDestNode,
        duration: flight.returnDuration || '直飛',
        details: {
          baggage: {
            checked: flight.checkedBag || flight.baggage,
            carryOn: flight.carryOnBag,
          },
          notes: flight.note,
        }
      });
    }

    const inboundItem: TransportItemModel = {
      id: `flight-${flight.id}-inbound`,
      type: 'flight',
      title: `${flight.airline} ${flight.code} (回程)`.trim(),
      operator: flight.airline || '航空公司',
      serviceNumber: flight.code?.toUpperCase() || 'FLIGHT',
      totalDuration: flight.returnDuration || '',
      directionType: 'inbound',
      segments: inboundSegments,
      cost: 0, // 總費用已包含在去程
      currency: flight.currency || 'TWD',
      baggage: {
        checked: flight.checkedBag || flight.baggage,
        carryOn: flight.carryOnBag,
      },
      note: flight.note,
      participants: flight.participants,
      rawBookingFlight: flight,
    };

    result.push(inboundItem);
  }

  return result;
};

/**
 * 映射 UniversalTransportType 至 TransportType
 */
const mapUniversalTypeToTransportType = (type: string): TransportType => {
  switch (type) {
    case 'train':
    case 'high_speed':
    case 'subway':
      return 'train';
    case 'bus':
      return 'bus';
    case 'boat':
    case 'ferry':
      return 'ferry';
    case 'cable_car':
      return 'cable_car';
    case 'car':
    case 'taxi':
      return 'car';
    case 'shuttle':
      return 'shuttle';
    case 'walk':
      return 'walk';
    case 'flight':
      return 'flight';
    default:
      return 'train';
  }
};

/**
 * 將多段 TransitLeg 轉換為統一的 TransportItemModel (如瑞士 SBB 火車、新幹線轉乘、巴士等)
 */
export const transitLegsToTransport = (
  legs: TransitLeg[],
  fare?: TransitFareDetails,
  title?: string,
  itemId?: string,
  extraContext?: {
    members?: Member[];
    currencies?: Currency[];
    participants?: string[];
    isPotential?: boolean;
    includeInBudget?: boolean;
  }
): TransportItemModel => {
  const safeLegs = Array.isArray(legs) ? legs : [];
  const segments: TransportSegmentModel[] = [];

  for (let i = 0; i < safeLegs.length; i++) {
    const leg = safeLegs[i];
    const nextLeg = safeLegs[i + 1];
    const transportType = mapUniversalTypeToTransportType(leg.transportType);

    const depNode: LocationNode = {
      name: leg.fromStation || '出發站',
      city: '',
      time: leg.departureTime || '',
      platform: leg.platform ? `月台 ${leg.platform}` : undefined,
    };

    const arrNode: LocationNode = {
      name: leg.toStation || '到達站',
      city: '',
      time: leg.arrivalTime || '',
    };

    let transferAfter: TransferInfo | undefined = undefined;
    if (nextLeg) {
      const waitDuration = calculateDurationBetweenTimes(leg.arrivalTime, nextLeg.departureTime);
      transferAfter = {
        location: {
          name: leg.toStation,
          city: '',
          platform: nextLeg.platform ? `轉至 ${nextLeg.platform}` : undefined,
        },
        duration: waitDuration || '轉乘',
        nextServiceNumber: nextLeg.serviceNumber,
        nextTransportType: mapUniversalTypeToTransportType(nextLeg.transportType),
        transferType: transportType === 'train' ? 'train' : 'mixed',
        note: nextLeg.platform ? `至 ${nextLeg.platform} 月台轉車` : '站內轉乘',
      };
    }

    const duration = calculateDurationBetweenTimes(leg.departureTime, leg.arrivalTime);

    const meta = getTransportMeta(transportType);
    const categoryName = meta.categoryName || meta.label || '交通';
    const defaultOperator = meta.defaultOperator || '大眾運輸';

    segments.push({
      id: leg.id || `leg-${i}`,
      type: transportType,
      operator: leg.operator || defaultOperator,
      serviceNumber: leg.serviceNumber || categoryName,
      duration,
      departure: depNode,
      arrival: arrNode,
      transferAfter,
      details: {
        carriage: leg.platform,
      }
    });
  }

  const primaryType: TransportType = segments.length > 0 ? segments[0].type : 'train';
  const primaryMeta = getTransportMeta(primaryType);
  const firstLeg = safeLegs[0];
  const primaryService = segments.map(s => s.serviceNumber).filter(Boolean).join(' → ') || primaryMeta.categoryName;
  
  // 計算總耗時
  let totalDuration = '';
  if (safeLegs.length > 0) {
    const startTime = safeLegs[0].departureTime;
    const endTime = safeLegs[safeLegs.length - 1].arrivalTime;
    totalDuration = calculateDurationBetweenTimes(startTime, endTime);
  }

  const resolvedTransit = resolveTransitDetails(
    {
      legs: safeLegs,
      fare,
      participants: extraContext?.participants,
      isPotential: extraContext?.isPotential,
      includeInBudget: extraContext?.includeInBudget,
    },
    extraContext?.members || []
  );

  const rate = getRateForCurrency(resolvedTransit.currency, extraContext?.currencies || []);
  const totalTWD =
    resolvedTransit.currency !== 'TWD' && resolvedTransit.split.sum > 0
      ? Math.round(resolvedTransit.split.sum * rate)
      : undefined;
  const perPersonTWD =
    resolvedTransit.currency !== 'TWD' &&
    resolvedTransit.split.exactPerPerson !== null &&
    resolvedTransit.split.exactPerPerson > 0
      ? Math.round(resolvedTransit.split.exactPerPerson * rate)
      : undefined;

  const ticketSummary: TransportTicketSummary = {
    unitPrice: resolvedTransit.unitPrice,
    originalUnitPrice:
      resolvedTransit.originalUnitPrice > resolvedTransit.unitPrice
        ? resolvedTransit.originalUnitPrice
        : undefined,
    ticketCount: resolvedTransit.ticketCount,
    currency: resolvedTransit.currency,
    hasServiceFee: resolvedTransit.feeEnabled,
    serviceFeePercentage: resolvedTransit.feePercentage,
    feeAmount: resolvedTransit.split.fee,
    ticketSubtotal: resolvedTransit.split.subtotal,
    ticketTotalWithFee: resolvedTransit.split.sum,
    perPerson: resolvedTransit.split.perPerson,
    peopleCount: resolvedTransit.participantIds.length,
    isPotential: resolvedTransit.isPotential,
    passUsed: resolvedTransit.passUsed,
    extraItems: resolvedTransit.extraItems.length > 0 ? resolvedTransit.extraItems : undefined,
    totalTWD,
    perPersonTWD,
  };

  // 組合座位字串
  const seatParts: string[] = [];
  if (firstLeg?.carriage) seatParts.push(`${firstLeg.carriage.includes('車') ? firstLeg.carriage : `${firstLeg.carriage} 車`}`);
  if (firstLeg?.seat) seatParts.push(firstLeg.seat);
  const derivedSeat = seatParts.length > 0 ? seatParts.join(' · ') : (fare?.passUsed === 'pass_free' ? 'Pass 全包' : (fare?.passUsed === 'pass_discount' ? '半價優惠' : undefined));

  return {
    id: itemId || `transit-${Date.now()}`,
    type: primaryType,
    title: title || (safeLegs.length > 0 ? `${safeLegs[0].fromStation} → ${safeLegs[safeLegs.length - 1].toStation}` : '交通移動'),
    operator: firstLeg?.operator || primaryMeta.defaultOperator,
    operatorSub: firstLeg?.operatorSub,
    serviceNumber: primaryService,
    totalDuration,
    segments,
    cost: resolvedTransit.split.sum,
    currency: resolvedTransit.currency,
    hasServiceFee: resolvedTransit.feeEnabled,
    serviceFeePercentage: resolvedTransit.feePercentage,
    ticketSummary,
    seat: derivedSeat,
    classType: firstLeg?.class || firstLeg?.classType,
    platform: firstLeg?.platform || firstLeg?.departurePlatform,
    carriage: firstLeg?.carriage,
    departurePlatform: firstLeg?.departurePlatform || firstLeg?.platform,
    arrivalPlatform: safeLegs[safeLegs.length - 1]?.arrivalPlatform,
    bookingReference: firstLeg?.bookingReference,
    note: fare?.notes || firstLeg?.note,
    participants: resolvedTransit.participantNames.length > 0 ? resolvedTransit.participantNames : undefined,
    rawTransitLegs: safeLegs,
    rawTransitFare: fare,
  };
};

/**
 * 將 BookingCarRental 轉換為統一 TransportItemModel
 */
export const carRentalToTransport = (car: BookingCarRental): TransportItemModel => {
  const pickupNode: LocationNode = {
    name: car.pickupLocation || '取車地點',
    time: car.pickupTime || '',
    date: car.pickupDate ? car.pickupDate.slice(0, 10) : '',
    address: car.pickupLocation,
    timeZoneLabel: '取車時間',
  };

  const returnNode: LocationNode = {
    name: car.returnLocation || car.pickupLocation || '還車地點',
    time: car.returnTime || '',
    date: car.returnDate ? car.returnDate.slice(0, 10) : '',
    address: car.returnLocation,
    timeZoneLabel: '還車時間',
  };

  const segment: TransportSegmentModel = {
    id: `car-${car.id}-seg`,
    type: 'car',
    operator: car.company || '租車公司',
    serviceNumber: car.carModel || '車型',
    departure: pickupNode,
    arrival: returnNode,
    details: {
      carInfo: {
        carModel: car.carModel,
        company: car.company,
        pickupDate: car.pickupDate,
        pickupTime: car.pickupTime,
        returnDate: car.returnDate,
        returnTime: car.returnTime,
      },
      cost: car.price,
      currency: car.currency || 'TWD',
      notes: car.note,
    }
  };

  return {
    id: `car-${car.id}`,
    type: 'car',
    title: `${car.company} ${car.carModel}`.trim(),
    operator: car.company || '租車公司',
    serviceNumber: car.carModel || '自駕車輛',
    segments: [segment],
    cost: car.price,
    currency: car.currency || 'TWD',
    note: car.note,
    participants: car.participants,
    rawCarRental: car,
  };
};

/**
 * 將 ScheduleItem 轉換為 TransportItemModel (若有相關交通資料)
 */
export const scheduleItemToTransport = (
  item: ScheduleItem,
  members?: Member[],
  currencies?: Currency[]
): TransportItemModel | null => {
  if (!item) return null;

  if (item.type === 'flight' && item.flightDetails) {
    const f = item.flightDetails;
    const originNode: LocationNode = {
      name: f.departureAirport || '出發地',
      code: f.departureAirport?.toUpperCase() || 'DEP',
      time: f.departureTime || item.time || '',
      date: f.departureDate || item.date || '',
    };
    const destNode: LocationNode = {
      name: f.arrivalAirport || '目的地',
      code: f.arrivalAirport?.toUpperCase() || 'ARR',
      time: f.arrivalTime || '',
      date: f.arrivalDate || '',
    };

    const segments: TransportSegmentModel[] = [];
    if (f.hasTransit && (f.transitAirport || f.transitCity)) {
      const transitArrTime = f.transitArrivalTime || '';
      const transitDepTime = f.transitDepartureTime || '';
      const autoTransitDuration = calculateDurationBetweenTimes(transitArrTime, transitDepTime);
      const transitNode: LocationNode = {
        name: f.transitCity || f.transitAirport || '轉機地',
        code: f.transitAirport?.toUpperCase() || 'TRN',
        city: f.transitCity || '',
        time: transitArrTime,
      };
      segments.push({
        id: `${item.id}-seg-1`,
        type: 'flight',
        operator: f.airline || '航空公司',
        serviceNumber: f.flightCode || 'FLIGHT',
        departure: originNode,
        arrival: { ...transitNode, time: transitArrTime },
        duration: f.firstLegDuration || '',
        transferAfter: {
          location: transitNode,
          arrivalTime: transitArrTime,
          departureTime: transitDepTime,
          duration: f.transitDuration || autoTransitDuration || '',
          nextServiceNumber: f.transitFlightCode,
          transferType: 'flight',
        },
      });
      segments.push({
        id: `${item.id}-seg-2`,
        type: 'flight',
        operator: f.airline || '航空公司',
        serviceNumber: f.transitFlightCode || f.flightCode || 'FLIGHT',
        departure: { ...transitNode, time: transitDepTime },
        arrival: destNode,
        duration: f.secondLegDuration || '',
      });
    } else {
      segments.push({
        id: `${item.id}-seg-direct`,
        type: 'flight',
        operator: f.airline || '航空公司',
        serviceNumber: f.flightCode || 'FLIGHT',
        departure: originNode,
        arrival: destNode,
        duration: f.flightDuration,
      });
    }

    return {
      id: `schedule-flight-${item.id}`,
      type: 'flight',
      title: item.title,
      operator: f.airline || '航空公司',
      serviceNumber: f.flightCode || 'FLIGHT',
      totalDuration: f.flightDuration,
      segments,
      cost: f.cost,
      currency: f.currency,
      baggage: {
        checked: f.checkedBag,
        carryOn: f.carryOnBag,
      },
      note: item.notes || item.note,
      participants: f.participants,
    };
  }

  if (item.type === 'transport' && item.transitDetails) {
    return transitLegsToTransport(
      item.transitDetails.legs,
      item.transitDetails.fare,
      item.title,
      `schedule-transit-${item.id}`,
      {
        members,
        currencies,
        participants: item.transitDetails.participants,
        isPotential: item.transitDetails.isPotential,
        includeInBudget: item.transitDetails.includeInBudget,
      }
    );
  }

  if (item.type === 'transport' && (item as any).trainDetails) {
    return trainBookingToTransport({ ...(item as any).trainDetails, id: item.id, title: item.title, note: item.notes || item.note });
  }

  if (item.type === 'transport' && item.carRental) {
    return carRentalToTransport(item.carRental as any);
  }

  return null;
};

/**
 * 將既有的 Booking 結構（如 BookingTrain, BookingTicket 或自訂鐵道預訂）
 * 轉換為統一的 TransportItemModel，確保能與現有的 TransportCard 無縫接軌。
 */
export const trainBookingToTransport = (
  booking: BookingTrain | (BookingTicket & Record<string, any>) | Record<string, any>
): TransportItemModel => {
  if (!booking) {
    return {
      id: `train-${Date.now()}`,
      type: 'train',
      segments: [],
    };
  }

  const b = booking as any;
  const rawType = b.transportType || b.type;
  const detectedType: TransportType = rawType ? mapUniversalTypeToTransportType(rawType) : 'train';
  const meta = getTransportMeta(detectedType);

  const depStation = b.fromStation || b.origin || b.departureStation || b.departure || '出發站';
  const arrStation = b.toStation || b.dest || b.arrivalStation || b.arrival || '抵達站';
  const depTime = b.departureTime || b.depTime || (b.date && b.date.length >= 16 ? b.date.slice(11, 16) : '') || '09:00';
  const arrTime = b.arrivalTime || b.arrTime || (b.arrivalDate && b.arrivalDate.length >= 16 ? b.arrivalDate.slice(11, 16) : '') || '11:00';
  const depDate = b.departureDate || (b.date ? b.date.slice(0, 10) : '');
  const arrDate = b.arrivalDate || b.departureDate || depDate;

  const duration = b.duration || calculateDurationBetweenTimes(depTime, arrTime) || '';
  const operatorName = b.operator || b.company || meta.defaultOperator;
  const operatorSub = b.operatorSub || b.trainName || '';
  const serviceNumber = b.serviceNumber || b.code || b.trainCode || b.name || meta.categoryName;

  const segments: TransportSegmentModel[] = [];

  const depNode: LocationNode = {
    name: depStation,
    code: depStation.length <= 4 ? depStation.toUpperCase() : undefined,
    city: b.fromCity || b.originCity || '',
    time: depTime,
    date: depDate,
    platform: b.platform ? (b.platform.includes('月台') || b.platform.includes('Track') ? b.platform : `月台 ${b.platform}`) : undefined,
    timeZoneLabel: '發車時間',
  };

  const arrNode: LocationNode = {
    name: arrStation,
    code: arrStation.length <= 4 ? arrStation.toUpperCase() : undefined,
    city: b.toCity || b.destCity || '',
    time: arrTime,
    date: arrDate,
    platform: b.arrivalPlatform ? (b.arrivalPlatform.includes('月台') || b.arrivalPlatform.includes('Track') ? b.arrivalPlatform : `月台 ${b.arrivalPlatform}`) : undefined,
    timeZoneLabel: '抵達時間',
  };

  // 判斷是否為中途轉乘路線
  if (b.hasTransfer && (b.transferStation || b.transferCity)) {
    const transferNode: LocationNode = {
      name: b.transferStation || b.transferCity || '轉乘車站',
      city: b.transferCity || '',
      time: b.transferArrivalTime || '',
      platform: b.transferPlatform ? `月台 ${b.transferPlatform}` : undefined,
    };

    segments.push({
      id: `${b.id || 'train'}-seg-1`,
      type: 'train',
      operator: operatorName,
      serviceNumber: serviceNumber,
      departure: depNode,
      arrival: transferNode,
      duration: b.firstLegDuration,
      transferAfter: {
        location: transferNode,
        duration: b.transferDuration || '轉乘 15m',
        nextServiceNumber: b.transferTrainCode || '銜接列車',
        nextTransportType: 'train',
        transferType: 'train',
        note: b.transferPlatform ? `至 ${b.transferPlatform} 月台換乘` : '站內轉乘',
      },
      details: {
        carriage: b.carriage,
        seat: b.seat,
        classType: b.class || b.classType,
        platform: b.platform,
      }
    });

    segments.push({
      id: `${b.id || 'train'}-seg-2`,
      type: 'train',
      operator: b.transferOperator || operatorName,
      serviceNumber: b.transferTrainCode || '銜接班次',
      departure: transferNode,
      arrival: arrNode,
      duration: b.secondLegDuration,
      details: {
        carriage: b.secondCarriage,
        seat: b.secondSeat,
        classType: b.secondClass || b.class || b.classType,
        platform: b.transferPlatform,
      }
    });
  } else {
    // 直達列車 / 運具
    segments.push({
      id: `${b.id || 'transport'}-seg-direct`,
      type: detectedType,
      operator: operatorName,
      serviceNumber: serviceNumber,
      duration: duration,
      departure: depNode,
      arrival: arrNode,
      details: {
        carriage: b.carriage,
        seat: b.seat,
        classType: b.class || b.classType,
        platform: b.platform,
        bookingReference: b.bookingReference,
      }
    });
  }

  // 組合座位與席別字串
  const seatParts: string[] = [];
  if (b.carriage) seatParts.push(`${b.carriage.includes('車') || b.carriage.includes('Car') ? b.carriage : `${b.carriage} 車`}`);
  if (b.seat) seatParts.push(`${b.seat.includes('席') || b.seat.includes('號') || b.seat.includes('Seat') ? b.seat : `${b.seat} 號`}`);
  const combinedSeat = seatParts.length > 0 ? seatParts.join(' · ') : (b.seat || undefined);

  return {
    id: `${detectedType}-${b.id || Date.now()}`,
    type: detectedType,
    title: b.trainName || `${depStation} ➔ ${arrStation}`,
    operator: operatorName,
    operatorSub: operatorSub,
    serviceNumber: serviceNumber,
    totalDuration: duration,
    segments,
    cost: typeof b.cost === 'number' ? b.cost : (typeof b.price === 'number' ? b.price : (b.cost ? Number(b.cost) : undefined)),
    currency: b.currency || 'TWD',
    hasServiceFee: b.hasServiceFee,
    serviceFeePercentage: b.serviceFeePercentage,
    seat: combinedSeat,
    classType: b.class || b.classType || b.ticketType,
    platform: b.platform,
    carriage: b.carriage,
    departurePlatform: b.platform,
    arrivalPlatform: b.arrivalPlatform,
    bookingReference: b.bookingReference || b.pnr || b.ref,
    note: b.note || b.notes,
    participants: b.participants,
    rawBookingTrain: b,
  };
};
