import type { Member, StayDetails } from '../../types';

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
