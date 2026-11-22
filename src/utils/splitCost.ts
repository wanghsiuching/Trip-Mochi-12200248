import type { Currency, Member, StayDetails, TransitFareDetails, TransitLeg, TransitPassType } from '../../types';

export interface SplitInput {
  total: number;        // 訂單總價
  feeEnabled: boolean;  // 是否加計手續費
  feeRate: number;      // 0.015 代表 1.5%
  people: number;       // 分攤人數
  nights: number;       // 住宿晚數
}

export interface SplitResult {
  fee: number;                      // 手續費金額
  sum: number;                      // 合計（總價 + 手續費）
  perPerson: number | null;         // 每人應付，無條件進位到整數；人數為 0 時為 null
  perPersonPerNight: number | null; // 每人每晚，四捨五入到整數；晚數或人數為 0 時為 null
}

export const DEFAULT_STAY_FEE_RATE = 0.015;

/**
 * 住宿分攤金額純計算函式
 * - fee = feeEnabled ? total × feeRate : 0
 * - sum = total + fee
 * - perPerson = people > 0 ? Math.ceil(sum / people) : null
 * - perPersonPerNight = perPerson 與 nights 都 > 0 ? Math.round(perPerson / nights) : null
 */
export function splitCost(input: SplitInput): SplitResult {
  const total = Number.isFinite(input.total) && input.total > 0 ? input.total : 0;
  const feeRate = Number.isFinite(input.feeRate) && input.feeRate > 0 ? input.feeRate : 0;
  const people = Number.isFinite(input.people) && input.people > 0 ? Math.floor(input.people) : 0;
  const nights = Number.isFinite(input.nights) && input.nights > 0 ? Math.floor(input.nights) : 0;

  const fee = input.feeEnabled ? Number((total * feeRate).toFixed(6)) : 0;
  const sum = Number((total + fee).toFixed(6));

  const perPerson = people > 0 ? Math.ceil(Number((sum / people).toFixed(6))) : null;
  const perPersonPerNight =
    perPerson !== null && perPerson > 0 && nights > 0
      ? Math.round(Number((perPerson / nights).toFixed(6)))
      : null;

  return {
    fee,
    sum,
    perPerson,
    perPersonPerNight,
  };
}

/**
 * 依入住與退房日期 (YYYY-MM-DD) 自動計算住宿晚數（不低於 0）
 */
export function calculateNights(checkIn?: string, checkOut?: string): number {
  if (!checkIn || !checkOut) return 0;
  const inMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(checkIn.trim());
  const outMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(checkOut.trim());
  if (!inMatch || !outMatch) return 0;

  const inUtc = Date.UTC(Number(inMatch[1]), Number(inMatch[2]) - 1, Number(inMatch[3]));
  const outUtc = Date.UTC(Number(outMatch[1]), Number(outMatch[2]) - 1, Number(outMatch[3]));
  const diffDays = Math.round((outUtc - inUtc) / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
}

export interface ResolvedStayDetails {
  isLegacy: boolean;
  currency: string;
  nights: number;
  includeInBudget: boolean;
  isPotential: boolean;
  participantIds: string[];
  payerNames: string[];
  // 新格式計算結果
  totalAmount?: number;
  feeEnabled: boolean;
  feeRate: number;
  split?: SplitResult;
  perPerson: number | null;
  // 舊格式保留欄位
  legacyCost?: number;
  legacyHasServiceFee?: boolean;
  legacyServiceFeePercentage?: number;
}

/**
 * 解析住宿資料（同時相容新版 totalAmount 原始輸入與舊版每人金額 cost 格式）
 */
export function resolveStayDetails(
  stayDetails: StayDetails | undefined,
  members: Member[] = []
): ResolvedStayDetails {
  const currency = stayDetails?.currency || 'TWD';
  const checkIn = stayDetails?.checkIn || stayDetails?.checkInDate;
  const checkOut = stayDetails?.checkOut || stayDetails?.checkOutDate;
  const nights = calculateNights(checkIn, checkOut);
  const includeInBudget =
    typeof stayDetails?.includeInBudget === 'boolean'
      ? stayDetails.includeInBudget
      : !(stayDetails?.isPotential ?? false);
  const isPotential = !includeInBudget;

  const hasNewFormat =
    typeof stayDetails?.totalAmount === 'number' && !Number.isNaN(stayDetails.totalAmount);

  if (hasNewFormat && stayDetails) {
    const rawPayers = Array.isArray(stayDetails.payers)
      ? stayDetails.payers
      : Array.isArray(stayDetails.participants)
      ? stayDetails.participants
      : [];

    const participantIds = members
      .filter((m) => rawPayers.includes(m.name) || rawPayers.includes(m.id))
      .map((m) => m.id);

    const payerNames = rawPayers.map(
      (p) => members.find((m) => m.id === p || m.name === p)?.name || p
    );

    const feeEnabled =
      typeof stayDetails.feeEnabled === 'boolean'
        ? stayDetails.feeEnabled
        : Boolean(stayDetails.hasServiceFee);
    const feeRate =
      typeof stayDetails.feeRate === 'number' ? stayDetails.feeRate : DEFAULT_STAY_FEE_RATE;

    const split = splitCost({
      total: stayDetails.totalAmount!,
      feeEnabled,
      feeRate,
      people: rawPayers.length,
      nights,
    });

    return {
      isLegacy: false,
      currency,
      nights,
      includeInBudget,
      isPotential,
      participantIds: participantIds.length > 0 ? participantIds : rawPayers,
      payerNames,
      totalAmount: stayDetails.totalAmount,
      feeEnabled,
      feeRate,
      split,
      perPerson: split.perPerson,
    };
  }

  // 舊格式相容（只有 cost，沒有 totalAmount）
  const legacyCost = Number(stayDetails?.cost) || 0;
  const legacyHasServiceFee = Boolean(stayDetails?.hasServiceFee);
  const legacyServiceFeePercentage = Number(stayDetails?.serviceFeePercentage) || 0;
  const legacyPerPerson =
    legacyCost + (legacyHasServiceFee ? (legacyCost * legacyServiceFeePercentage) / 100 : 0);

  const legacyParticipantIds = Array.isArray(stayDetails?.participants)
    ? stayDetails!.participants!
    : [];
  const legacyPayerNames = legacyParticipantIds.map(
    (id) => members.find((m) => m.id === id || m.name === id)?.name || id
  );

  return {
    isLegacy: Boolean(stayDetails && legacyCost > 0 && stayDetails.totalAmount === undefined),
    currency,
    nights,
    includeInBudget,
    isPotential,
    participantIds: legacyParticipantIds,
    payerNames: legacyPayerNames,
    feeEnabled: legacyHasServiceFee,
    feeRate: legacyServiceFeePercentage / 100,
    perPerson: legacyCost > 0 ? legacyPerPerson : null,
    legacyCost,
    legacyHasServiceFee,
    legacyServiceFeePercentage,
  };
}

// ============================================================================
// 車票 / 大眾運輸分攤計算（與住宿對齊的純計算邏輯）
// ============================================================================

export interface SplitTicketInput {
  unitPrice: number;     // 每張票實付單價
  ticketCount: number;   // 車票張數 (例如 4 張)
  feeEnabled: boolean;   // 是否加計手續費
  feeRate: number;       // 0.015 代表 1.5%
  people: number;        // 分攤人數
}

export interface SplitTicketResult {
  subtotal: number;              // 車票小計（單價 × 張數）
  fee: number;                   // 手續費金額
  sum: number;                   // 合計（小計 + 手續費）
  perPerson: number | null;      // 每人應付顯示用數值（最多 2 位小數；人數為 0 時為 null）
  exactPerPerson: number | null; // 未四捨五入精確每人金額（供台幣換算與分攤加總）
}

export interface ResolvedTransitExtraItem {
  id: string;
  name: string;
  amount: number;
  currency: string;
  hasServiceFee: boolean;
  serviceFeePercentage: number;
  feeAmount: number;
  totalWithFee: number;
}

export interface ResolvedTransitDetails {
  currency: string;
  passUsed?: TransitPassType;
  originalUnitPrice: number;
  unitPrice: number;
  ticketCount: number;
  isCustomTicketCount: boolean;
  feeEnabled: boolean;
  feePercentage: number;
  feeRate: number;
  split: SplitTicketResult;
  extraItems: ResolvedTransitExtraItem[];
  participantIds: string[];
  participantNames: string[];
  includeInBudget: boolean;
  isPotential: boolean;
}

export function formatTicketAmount(amount: number): string {
  if (!Number.isFinite(amount)) return '0';
  const rounded = Math.round(amount * 100) / 100;
  return rounded.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

/**
 * 車票分攤金額純計算函式
 * - subtotal = unitPrice × ticketCount
 * - fee = feeEnabled ? subtotal × feeRate : 0
 * - sum = subtotal + fee
 * - exactPerPerson = people > 0 ? sum / people : null
 * - perPerson = people > 0 ? round(sum / people, 2 decimals) : null
 */
export function splitTicketCost(input: SplitTicketInput): SplitTicketResult {
  const unitPrice = Number.isFinite(input.unitPrice) && input.unitPrice > 0 ? input.unitPrice : 0;
  const ticketCount =
    Number.isFinite(input.ticketCount) && input.ticketCount > 0 ? Math.floor(input.ticketCount) : 0;
  const feeRate = Number.isFinite(input.feeRate) && input.feeRate > 0 ? input.feeRate : 0;
  const people = Number.isFinite(input.people) && input.people > 0 ? Math.floor(input.people) : 0;

  const subtotal = Number((unitPrice * ticketCount).toFixed(6));
  const fee = input.feeEnabled ? Number((subtotal * feeRate).toFixed(6)) : 0;
  const sum = Number((subtotal + fee).toFixed(6));

  const exactPerPerson = people > 0 ? Number((sum / people).toFixed(6)) : null;
  const perPerson =
    exactPerPerson !== null ? Number((Math.round(exactPerPerson * 100) / 100).toFixed(2)) : null;

  return {
    subtotal,
    fee,
    sum,
    perPerson,
    exactPerPerson,
  };
}

/**
 * 取得標準化的大眾交通額外加價項目列表（每人金額）
 */
export function resolveTransitExtraFeeItems(fare?: TransitFareDetails): ResolvedTransitExtraItem[] {
  if (!fare) return [];
  const list: ResolvedTransitExtraItem[] = [];

  if (Array.isArray(fare.extraFees) && fare.extraFees.length > 0) {
    fare.extraFees.forEach((item, idx) => {
      const amt = Number(item.amount) || 0;
      const curr = item.currency || fare.currency || 'TWD';
      const name = item.name?.trim() || `加價項目 #${idx + 1}`;
      const hasFee = Boolean(item.hasServiceFee);
      const feePct = Number(item.serviceFeePercentage) || 0;
      const feeAmt = hasFee && amt > 0 ? (amt * feePct) / 100 : 0;
      const totalWithFee = amt + feeAmt;
      if (amt > 0 || (item.name && item.name.trim().length > 0)) {
        list.push({
          id: item.id || `extra-${idx}`,
          name,
          amount: amt,
          currency: curr,
          hasServiceFee: hasFee,
          serviceFeePercentage: feePct,
          feeAmount: feeAmt,
          totalWithFee,
        });
      }
    });
  } else {
    const amt = Number(fare.seatReservationFee) || 0;
    const curr = fare.seatReservationFeeCurrency || fare.currency || 'TWD';
    const name = fare.extraFeeName?.trim() || '交通加價';
    const hasFee = Boolean(fare.extraFeeHasServiceFee);
    const feePct = Number(fare.extraFeeServiceFeePercentage) || 0;
    const feeAmt = hasFee && amt > 0 ? (amt * feePct) / 100 : 0;
    const totalWithFee = amt + feeAmt;
    if (amt > 0 || (fare.extraFeeName && fare.extraFeeName.trim().length > 0)) {
      list.push({
        id: 'legacy-extra-1',
        name,
        amount: amt,
        currency: curr,
        hasServiceFee: hasFee,
        serviceFeePercentage: feePct,
        feeAmount: feeAmt,
        totalWithFee,
      });
    }
  }

  return list;
}

/**
 * 解析單張車票實付金額與原價
 */
export function resolveTransitUnitFare(fare?: TransitFareDetails): {
  originalUnitPrice: number;
  unitPrice: number;
} {
  if (!fare) return { originalUnitPrice: 0, unitPrice: 0 };

  const originalUnitPrice =
    fare.originalPrice !== undefined &&
    fare.originalPrice !== null &&
    String(fare.originalPrice).trim() !== ''
      ? Math.max(0, Number(fare.originalPrice) || 0)
      : 0;

  const hasExplicitDiscounted =
    fare.discountedPrice !== undefined &&
    fare.discountedPrice !== null &&
    String(fare.discountedPrice).trim() !== '';

  let unitPrice = 0;
  if (hasExplicitDiscounted) {
    unitPrice = Math.max(0, Number(fare.discountedPrice) || 0);
  } else if (fare.passUsed === 'pass_free') {
    unitPrice = 0;
  } else if (fare.passUsed === 'pass_discount') {
    unitPrice = originalUnitPrice > 0 ? Math.round(originalUnitPrice * 0.5 * 100) / 100 : 0;
  } else if (originalUnitPrice > 0) {
    unitPrice = originalUnitPrice;
  }

  return { originalUnitPrice, unitPrice };
}

/**
 * 解析大眾交通 / 車票資料（支援舊紀錄無 ticketCount 時自動依分攤人數計算）
 */
export function resolveTransitDetails(
  transitDetails:
    | {
        legs?: TransitLeg[];
        fare?: TransitFareDetails;
        isPotential?: boolean;
        includeInBudget?: boolean;
        participants?: string[];
      }
    | undefined,
  members: Member[] = []
): ResolvedTransitDetails {
  const fare = transitDetails?.fare;
  const currency = fare?.currency || 'TWD';
  const { originalUnitPrice, unitPrice } = resolveTransitUnitFare(fare);

  const includeInBudget =
    typeof transitDetails?.includeInBudget === 'boolean'
      ? transitDetails.includeInBudget
      : !(transitDetails?.isPotential ?? false);
  const isPotential = !includeInBudget;

  const rawParticipants = Array.isArray(transitDetails?.participants)
    ? transitDetails!.participants!
    : [];

  let participantIds: string[];
  if (rawParticipants.length > 0) {
    if (members.length > 0) {
      const matched = members
        .filter((m) => rawParticipants.includes(m.id) || rawParticipants.includes(m.name))
        .map((m) => m.id);
      participantIds = matched.length > 0 ? matched : rawParticipants;
    } else {
      participantIds = rawParticipants;
    }
  } else {
    participantIds = members.map((m) => m.id);
  }

  const participantNames = participantIds.map(
    (id) => members.find((m) => m.id === id || m.name === id)?.name || id
  );

  const hasCustomTicketCount =
    fare?.ticketCount !== undefined &&
    fare?.ticketCount !== null &&
    String(fare.ticketCount).trim() !== '' &&
    !Number.isNaN(Number(fare.ticketCount));

  const peopleCount = participantIds.length;
  const ticketCount = hasCustomTicketCount
    ? Math.max(0, Math.floor(Number(fare!.ticketCount)))
    : peopleCount > 0
    ? peopleCount
    : 1;

  const feeEnabled = Boolean(fare?.hasServiceFee);
  const feePercentage = feeEnabled ? Math.max(0, Number(fare?.serviceFeePercentage) || 0) : 0;
  const feeRate = feePercentage / 100;

  const split = splitTicketCost({
    unitPrice,
    ticketCount,
    feeEnabled,
    feeRate,
    people: peopleCount,
  });

  const extraItems = resolveTransitExtraFeeItems(fare);

  return {
    currency,
    passUsed: fare?.passUsed,
    originalUnitPrice,
    unitPrice,
    ticketCount,
    isCustomTicketCount: hasCustomTicketCount,
    feeEnabled,
    feePercentage,
    feeRate,
    split,
    extraItems,
    participantIds,
    participantNames,
    includeInBudget,
    isPotential,
  };
}

export function getRateForCurrency(code: string, currencies: Currency[] = []): number {
  if (!code || code === 'TWD') return 1;
  return currencies.find((c) => c.code === code)?.rate || 1;
}

