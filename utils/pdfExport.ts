import { 
  TripDay, 
  ScheduleItem, 
  BookingFlight, 
  BookingAccommodation, 
  BookingCarRental, 
  BookingTicket, 
  Expense, 
  Currency, 
  Member 
} from '../types';
import { getExchangeRate } from './currency';
import { getMemberAvatarSrc } from '../constants/avatars';
import { getTransitEffectiveFare } from '../components/TransitComponents';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface TripExportData {
  tripId: string;
  tripName: string;
  tripDays: TripDay[];
  scheduleItems: ScheduleItem[];
  bookingFlights?: BookingFlight[];
  bookingAccommodations?: BookingAccommodation[];
  bookingCarRentals?: BookingCarRental[];
  bookingTickets?: BookingTicket[];
  expenses?: Expense[];
  members?: Member[];
  currencies?: Currency[];
}

/**
 * 將特殊字元轉為 HTML 安全字串，防止 XSS 與格式跑版
 */
const escapeHtml = (str?: string | number | null): string => {
  if (str === undefined || str === null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * 格式化數字為千分位
 */
const formatNumber = (num: number): string => {
  return Math.round(num).toLocaleString('zh-TW');
};

/**
 * 生成符合 A4 印刷規格、日系手帳 Aesthetic 風格的完整 HTML 字串
 */
export const generateTripPdfHtml = (data: TripExportData): string => {
  const {
    tripId,
    tripName,
    tripDays,
    scheduleItems,
    bookingFlights = [],
    bookingAccommodations = [],
    bookingCarRentals = [],
    bookingTickets = [],
    expenses = [],
    members = [],
    currencies = []
  } = data;

  // 1. 計算日期起訖與總天數
  const sortedDays = [...tripDays].sort((a, b) => a.date.localeCompare(b.date));
  const startDate = sortedDays.length > 0 ? sortedDays[0].date : '';
  const endDate = sortedDays.length > 0 ? sortedDays[sortedDays.length - 1].date : '';
  const totalDays = sortedDays.length;

  // 2. 統整記帳與花費概覽
  let totalTWD = 0;
  const currencyTotals: Record<string, number> = {};
  const categoryTotals: Record<string, { label: string; twd: number; count: number; color: string }> = {
    transport: { label: '交通', twd: 0, count: 0, color: '#0284c7' },
    accommodation: { label: '住宿', twd: 0, count: 0, color: '#7c3aed' },
    dining: { label: '餐飲', twd: 0, count: 0, color: '#ea580c' },
    spot: { label: '景點門票', twd: 0, count: 0, color: '#059669' },
    other: { label: '購物與其他', twd: 0, count: 0, color: '#db2777' },
  };

  expenses.forEach(exp => {
    const amt = Number(exp.amount) || 0;
    const curr = (exp.currency || 'TWD').toUpperCase();
    currencyTotals[curr] = (currencyTotals[curr] || 0) + amt;

    const rate = getExchangeRate(curr, currencies);
    const twdAmt = amt * rate;
    totalTWD += twdAmt;

    // 自動分類判斷
    let cat = exp.expenseType || 'other';
    const title = exp.title || '';
    if (!exp.expenseType) {
      if (/機票|車票|捷運|地鐵|新幹線|火車|巴士|公車|計程車|Uber|Taxi|Flight|Train|Bus|Pass|船票/i.test(title)) {
        cat = 'transport';
      } else if (/飯店|旅館|民宿|Airbnb|Hotel|Hostel|住宿|房費/i.test(title)) {
        cat = 'accommodation';
      } else if (/餐|早餐|午餐|晚餐|吃|飯|拉麵|居酒屋|咖啡|Cafe|Food|Dinner|Lunch|Drinks/i.test(title)) {
        cat = 'dining';
      } else if (/門票|門券|入場|票|觀景台|博物館|美術館|纜車|Pass|Ticket|Tour/i.test(title)) {
        cat = 'spot';
      } else {
        cat = 'other';
      }
    }
    if (!categoryTotals[cat]) cat = 'other';
    categoryTotals[cat].twd += twdAmt;
    categoryTotals[cat].count += 1;
  });

  // 3. 成員名稱字串
  const memberNames = members.map(m => escapeHtml(m.name)).join('、') || '全體旅伴';

  // 4. 生成機票區塊 HTML
  let flightsHtml = '';
  if (bookingFlights.length > 0) {
    flightsHtml = `
      <div class="section-card">
        <div class="section-header">
          <span class="section-icon">✈️</span>
          <h3 class="section-title">航班交通預訂 (Flight Bookings)</h3>
          <span class="badge-count">${bookingFlights.length} 筆</span>
        </div>
        <div class="booking-grid">
          ${bookingFlights.map(f => {
            const hasTransit = f.hasTransit && f.transitCity;
            return `
              <div class="booking-item flight-item">
                <div class="booking-item-header">
                  <span class="flight-airline">${escapeHtml(f.airline || '航班')}</span>
                  <span class="flight-code">${escapeHtml(f.code || '')}</span>
                  <span class="flight-trip-type">${f.tripType === 'roundtrip' ? '來回' : '單程'}</span>
                </div>
                <div class="flight-route-row">
                  <div class="airport-box origin">
                    <span class="airport-code">${escapeHtml(f.origin || 'DEP')}</span>
                    <span class="airport-city">${escapeHtml(f.originCity || f.departureAirport || '')}</span>
                    <span class="airport-time">${escapeHtml(f.depTime || '')}</span>
                  </div>
                  <div class="flight-arrow-box">
                    <span class="flight-duration">${escapeHtml(f.duration || '')}</span>
                    <div class="flight-line"></div>
                    ${hasTransit ? `<span class="transit-tag">轉機: ${escapeHtml(f.transitCity)} ${escapeHtml(f.transitDuration || '')}</span>` : '<span class="direct-tag">直飛</span>'}
                  </div>
                  <div class="airport-box dest">
                    <span class="airport-code">${escapeHtml(f.dest || 'ARR')}</span>
                    <span class="airport-city">${escapeHtml(f.destCity || f.arrivalAirport || '')}</span>
                    <span class="airport-time">${escapeHtml(f.arrTime || '')}</span>
                  </div>
                </div>
                <div class="booking-details-row">
                  <span>📅 日期: ${escapeHtml(f.date)}${f.returnDate ? ` ~ ${escapeHtml(f.returnDate)} (回程)` : ''}</span>
                  ${f.checkedBag ? `<span>🧳 托運行李: ${escapeHtml(f.checkedBag)}</span>` : ''}
                  ${f.cost ? `<span>💰 費用: ${escapeHtml(f.currency || 'TWD')} ${formatNumber(f.cost)}</span>` : ''}
                </div>
                ${f.note ? `<div class="booking-note">📝 備註: ${escapeHtml(f.note)}</div>` : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  // 5. 生成住宿區塊 HTML
  let accommodationsHtml = '';
  if (bookingAccommodations.length > 0) {
    accommodationsHtml = `
      <div class="section-card">
        <div class="section-header">
          <span class="section-icon">🏨</span>
          <h3 class="section-title">住宿飯店預訂 (Accommodations)</h3>
          <span class="badge-count">${bookingAccommodations.length} 筆</span>
        </div>
        <div class="booking-grid">
          ${bookingAccommodations.map(a => `
            <div class="booking-item">
              <div class="booking-item-header">
                <span class="item-title">${escapeHtml(a.name)}</span>
                <span class="city-tag">${escapeHtml(a.city || '市區')}</span>
              </div>
              <div class="booking-details-row">
                <span>📅 入住: <strong>${escapeHtml(a.checkInDate)}</strong> (${escapeHtml(a.checkInTime || '15:00')}起)</span>
                <span>📅 退房: <strong>${escapeHtml(a.checkOutDate)}</strong> (${escapeHtml(a.checkOutTime || '11:00')}前)</span>
                <span>🌙 共 <strong>${escapeHtml(a.nights || 1)}</strong> 晚</span>
              </div>
              ${a.address ? `<div class="address-text">📍 地址: ${escapeHtml(a.address)}</div>` : ''}
              <div class="booking-meta-row">
                ${a.ref ? `<span>🔖 預訂代碼: <code>${escapeHtml(a.ref)}</code></span>` : ''}
                ${a.platform ? `<span>🌐 平台: ${escapeHtml(a.platform)}</span>` : ''}
                ${a.cost ? `<span>💰 費用: ${escapeHtml(a.currency || 'TWD')} ${formatNumber(a.cost)}</span>` : ''}
              </div>
              ${a.note ? `<div class="booking-note">📝 備註: ${escapeHtml(a.note)}</div>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // 6. 生成租車與票券 HTML
  let otherBookingsHtml = '';
  const hasCars = bookingCarRentals.length > 0;
  const hasTickets = bookingTickets.length > 0;
  if (hasCars || hasTickets) {
    otherBookingsHtml = `
      <div class="section-card">
        <div class="section-header">
          <span class="section-icon">🚗🎟️</span>
          <h3 class="section-title">交通租車與體驗票券 (Car Rentals & Tickets)</h3>
        </div>
        <div class="booking-grid">
          ${bookingCarRentals.map(c => `
            <div class="booking-item">
              <div class="booking-item-header">
                <span class="item-title">🚗 租車 · ${escapeHtml(c.company)} - ${escapeHtml(c.carModel)}</span>
                ${c.ref ? `<span class="city-tag">預約號: ${escapeHtml(c.ref)}</span>` : ''}
              </div>
              <div class="booking-details-row">
                <span>📍 取車: ${escapeHtml(c.pickupLocation)} (${escapeHtml(c.pickupDate)} ${escapeHtml(c.pickupTime || '')})</span>
                <span>📍 還車: ${escapeHtml(c.returnLocation)} (${escapeHtml(c.returnDate)} ${escapeHtml(c.returnTime || '')})</span>
              </div>
              ${c.note ? `<div class="booking-note">📝 備註: ${escapeHtml(c.note)}</div>` : ''}
            </div>
          `).join('')}
          ${bookingTickets.map(t => `
            <div class="booking-item">
              <div class="booking-item-header">
                <span class="item-title">🎟️ 門票活動 · ${escapeHtml(t.name)}</span>
                ${t.date ? `<span class="city-tag">${escapeHtml(t.date)}</span>` : ''}
              </div>
              ${t.cost ? `<div class="booking-meta-row"><span>💰 費用: ${escapeHtml(t.currency || 'TWD')} ${formatNumber(t.cost)}</span></div>` : ''}
              ${t.note ? `<div class="booking-note">📝 備註: ${escapeHtml(t.note)}</div>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // 7. 生成每日排程詳細清單 (Day-by-Day Itinerary)
  let daysScheduleHtml = '';
  sortedDays.forEach((day, idx) => {
    const dayNum = idx + 1;
    const dayItems = scheduleItems.filter(i => i.date === day.date);

    // 解析星期幾
    let weekdayStr = '';
    try {
      const d = new Date(day.date + 'T00:00:00');
      const weekdays = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
      weekdayStr = weekdays[d.getDay()] || '';
    } catch (e) {}

    let itemsHtml = '';
    if (dayItems.length === 0) {
      itemsHtml = `<div class="empty-day-notice">🌿 今日無特定排程，自在漫遊放鬆～</div>`;
    } else {
      itemsHtml = dayItems.map(item => {
        // 類型標籤與顏色
        let typeBadge = '景點';
        let typeIcon = '📍';
        let typeClass = 'type-spot';
        if (item.type === 'food') {
          typeBadge = '美食';
          typeIcon = '🍽️';
          typeClass = 'type-food';
        } else if (item.type === 'transport') {
          typeBadge = '交通';
          typeIcon = '🚆';
          typeClass = 'type-transport';
        } else if (item.type === 'stay') {
          typeBadge = '住宿';
          typeIcon = '🏨';
          typeClass = 'type-stay';
        } else if (item.type === 'flight') {
          typeBadge = '航班';
          typeIcon = '✈️';
          typeClass = 'type-flight';
        }

        // 轉乘資訊
        let transitLegsHtml = '';
        if (item.transitDetails && item.transitDetails.legs && item.transitDetails.legs.length > 0) {
          transitLegsHtml = `
            <div class="transit-legs-box">
              ${item.transitDetails.legs.map((leg, lIdx) => `
                <div class="transit-leg-row">
                  <span class="leg-step">${lIdx + 1}</span>
                  <span class="leg-time">${escapeHtml(leg.departureTime)} ➔ ${escapeHtml(leg.arrivalTime)}</span>
                  <span class="leg-stations"><strong>${escapeHtml(leg.fromStation)}</strong> ➔ <strong>${escapeHtml(leg.toStation)}</strong></span>
                  ${leg.serviceNumber ? `<span class="leg-service">班次: ${escapeHtml(leg.serviceNumber)}</span>` : ''}
                  ${leg.platform ? `<span class="leg-platform">月台: ${escapeHtml(leg.platform)}</span>` : ''}
                </div>
              `).join('')}
            </div>
          `;
        }

        return `
          <div class="schedule-timeline-item">
            <div class="item-time-col">
              <span class="item-time">${escapeHtml(item.time || '整日')}</span>
              <span class="item-type-badge ${typeClass}">${typeIcon} ${typeBadge}</span>
            </div>
            <div class="item-content-col">
              <div class="item-header-row">
                <span class="item-title">${escapeHtml(item.title)}</span>
                ${item.location && item.location !== item.title ? `<span class="item-location">📍 ${escapeHtml(item.location)}</span>` : ''}
              </div>
              ${item.address ? `<div class="item-address">地址: ${escapeHtml(item.address)}</div>` : ''}
              ${transitLegsHtml}
              ${(item.notes || item.note) ? `<div class="item-note">💡 ${escapeHtml(item.notes || item.note)}</div>` : ''}
              ${item.spotDetails && item.spotDetails.hasTicket && item.spotDetails.ticketCost ? `
                <div class="item-meta-cost">🎟️ 門票: ${escapeHtml(item.spotDetails.currency || 'TWD')} ${formatNumber(item.spotDetails.ticketCost)}</div>
              ` : ''}
            </div>
          </div>
        `;
      }).join('');
    }

    daysScheduleHtml += `
      <div class="day-container">
        <div class="day-header-banner">
          <div class="day-badge">Day ${dayNum}</div>
          <div class="day-title-info">
            <span class="day-date-str">${escapeHtml(day.date)} ${weekdayStr}</span>
            <span class="day-location-str">${escapeHtml(day.location || '當日行程')}</span>
          </div>
          <span class="day-count-tag">${dayItems.length} 項活動</span>
        </div>
        <div class="day-items-list">
          ${itemsHtml}
        </div>
      </div>
    `;
  });

  // 8. 生成花費概覽 (Expense Summary)
  let expenseSummaryHtml = '';
  const currencyKeys = Object.keys(currencyTotals);
  const currencyBadgesHtml = currencyKeys.map(k => `
    <div class="stat-badge">
      <span class="stat-label">${k}</span>
      <span class="stat-value">${formatNumber(currencyTotals[k])}</span>
    </div>
  `).join('');

  const categoryBarsHtml = Object.values(categoryTotals).map(cat => {
    const pct = totalTWD > 0 ? Math.round((cat.twd / totalTWD) * 100) : 0;
    return `
      <div class="category-row">
        <div class="category-info">
          <span class="category-label" style="border-left: 4px solid ${cat.color}">${cat.label}</span>
          <span class="category-count">(${cat.count} 筆)</span>
          <span class="category-amount">NT$ ${formatNumber(cat.twd)} (${pct}%)</span>
        </div>
        <div class="category-bar-bg">
          <div class="category-bar-fill" style="width: ${pct}%; background-color: ${cat.color};"></div>
        </div>
      </div>
    `;
  }).join('');

  expenseSummaryHtml = `
    <div class="section-card page-break-before">
      <div class="section-header">
        <span class="section-icon">💰</span>
        <h3 class="section-title">旅行開銷與預算概覽 (Expense Overview)</h3>
      </div>
      <div class="expense-summary-grid">
        <div class="total-box">
          <span class="total-label">總記帳開銷 (折合新台幣)</span>
          <span class="total-amount">NT$ ${formatNumber(totalTWD)}</span>
          <p class="total-sub">共累計 ${expenses.length} 筆支出紀錄</p>
        </div>
        <div class="currencies-box">
          <span class="box-subtitle">各幣別消費加總</span>
          <div class="currencies-grid">
            ${currencyBadgesHtml || '<span class="text-muted">尚無支出紀錄</span>'}
          </div>
        </div>
      </div>
      <div class="categories-breakdown">
        <span class="box-subtitle">支出類別分佈</span>
        <div class="categories-list">
          ${categoryBarsHtml}
        </div>
      </div>
    </div>
  `;

  // 8.5. 生成成員詳細資料之行程分攤明細 (對齊 MembersView 的 calculateMemberCosts)
  const toTWD = (amount: number, currency: string) => {
    if (currency === 'TWD') return amount;
    const rate = (currencies || []).find(c => c.code === currency)?.rate || 1;
    return amount * rate;
  };

  const effectiveMembers = (members && members.length > 0)
    ? members
    : [{ id: 'default', name: '我', avatar: null, fruit: '👤' }];

  interface MemberScheduleCostItem {
    id: string;
    date: string;
    title: string;
    amount: number;
    type: string;
    typeBadgeColor: string;
    typeEmoji: string;
  }

  interface MemberScheduleData {
    member: Member;
    totalPotential: number;
    breakdown: MemberScheduleCostItem[];
  }

  const memberCostMap = new Map<string, MemberScheduleData>();

  effectiveMembers.forEach(member => {
    let totalPotential = 0;
    const breakdown: MemberScheduleCostItem[] = [];

    const processItemCost = (
      id: string,
      date: string,
      title: string,
      type: string,
      cost: number,
      currency: string,
      hasFee: boolean,
      feePct: number,
      participants: string[] = []
    ) => {
      const base = Number(cost) || 0;
      if (base <= 0) return;

      const effectiveParticipants = (participants && participants.length > 0)
        ? participants
        : effectiveMembers.map(m => m.id);

      const isParticipant = effectiveParticipants.includes(member.id) ||
        (member.name && effectiveParticipants.includes(member.name));

      if (isParticipant) {
        const fee = hasFee ? base * (Number(feePct) || 0) / 100 : 0;
        const total = base + fee;
        if (total <= 0) return;
        const perPerson = total;
        const twdAmount = toTWD(perPerson, currency);

        totalPotential += twdAmount;
        if (twdAmount > 0 && Math.round(twdAmount) > 0) {
          let typeEmoji = '📌';
          let typeBadgeColor = '#6B7280';
          if (type === '機票') {
            typeEmoji = '✈️';
            typeBadgeColor = '#2563EB';
          } else if (type === '住宿') {
            typeEmoji = '🏨';
            typeBadgeColor = '#7C3AED';
          } else if (type === '交通') {
            typeEmoji = '🚆';
            typeBadgeColor = '#0D9488';
          } else if (type === '門票') {
            typeEmoji = '🎫';
            typeBadgeColor = '#E11D48';
          } else if (type === '餐飲') {
            typeEmoji = '🍽️';
            typeBadgeColor = '#D97706';
          }

          breakdown.push({
            id,
            date: date || '未排期',
            title,
            amount: Math.round(twdAmount),
            type,
            typeBadgeColor,
            typeEmoji
          });
        }
      }
    };

    scheduleItems.forEach(item => {
      if (item.type === 'flight' && item.flightDetails) {
        processItemCost(
          item.id,
          item.date,
          item.title || '航班',
          '機票',
          Number(item.flightDetails.cost) || 0,
          item.flightDetails.currency || 'TWD',
          item.flightDetails.hasServiceFee || false,
          Number(item.flightDetails.serviceFeePercentage) || 0,
          item.flightDetails.participants || []
        );
      }
      if (item.type === 'stay' && item.stayDetails) {
        processItemCost(
          item.id,
          item.date,
          item.title || '住宿',
          '住宿',
          Number(item.stayDetails.cost) || 0,
          item.stayDetails.currency || 'TWD',
          item.stayDetails.hasServiceFee || false,
          Number(item.stayDetails.serviceFeePercentage) || 0,
          item.stayDetails.participants || []
        );
      }
      if (item.type === 'transport') {
        if (item.transitDetails) {
          const { mainAmount, mainCurrency, extraItems } = getTransitEffectiveFare(item.transitDetails.fare);
          const participants = (item.transitDetails.participants && item.transitDetails.participants.length > 0)
            ? item.transitDetails.participants
            : effectiveMembers.map(m => m.id);

          if (mainAmount > 0) {
            processItemCost(
              item.id,
              item.date,
              `${item.title} (大眾交通)`,
              '交通',
              mainAmount,
              mainCurrency,
              item.transitDetails.fare?.hasServiceFee || false,
              Number(item.transitDetails.fare?.serviceFeePercentage) || 0,
              participants
            );
          }
          if (Array.isArray(extraItems) && extraItems.length > 0) {
            extraItems.forEach(extraItem => {
              if (extraItem.amount > 0) {
                processItemCost(
                  item.id,
                  item.date,
                  `${item.title} (${extraItem.name})`,
                  '交通',
                  extraItem.amount,
                  extraItem.currency,
                  extraItem.hasServiceFee || false,
                  Number(extraItem.serviceFeePercentage) || 0,
                  participants
                );
              }
            });
          }
        } else if (item.carRental && item.carRental.hasRental) {
          processItemCost(
            item.id,
            item.date,
            `${item.title} (租車)`,
            '交通',
            Number(item.carRental.rentalCost) || 0,
            item.carRental.rentalCurrency || 'TWD',
            item.carRental.hasServiceFee || false,
            Number(item.carRental.serviceFeePercentage) || 0,
            item.carRental.participants || []
          );
        }
      }
      if ((item.type === 'spot' || item.type === 'food') && item.spotDetails?.hasTicket) {
        processItemCost(
          item.id,
          item.date,
          item.title || (item.type === 'food' ? '餐飲' : '景點'),
          item.type === 'food' ? '餐飲' : '門票',
          Number(item.spotDetails.ticketCost) || 0,
          item.spotDetails.currency || 'TWD',
          item.spotDetails.hasServiceFee || false,
          Number(item.spotDetails.serviceFeePercentage) || 0,
          item.spotDetails.participants || []
        );
      }
    });

    memberCostMap.set(member.id, {
      member,
      totalPotential: Math.round(totalPotential),
      breakdown
    });
  });

  const totalTripPotential = effectiveMembers.reduce((sum, m) => sum + (memberCostMap.get(m.id)?.totalPotential || 0), 0);

  // 1. 生成全員預計分攤總覽卡片
  const memberOverviewCardsHtml = effectiveMembers.map(member => {
    const data = memberCostMap.get(member.id)!;
    const avatarSrc = getMemberAvatarSrc(member.avatar, member.name, member.id);
    return `
      <div class="member-overview-card">
        <img src="${avatarSrc}" class="member-overview-avatar" alt="${escapeHtml(member.name)}" />
        <span class="member-overview-name">${escapeHtml(member.name)}</span>
        <span class="member-overview-total">NT$ ${formatNumber(data.totalPotential)}</span>
        <span class="member-overview-count">${data.breakdown.length} 項行程分攤</span>
      </div>
    `;
  }).join('');

  // 2. 生成各成員詳細行程分攤明細清冊
  const memberBreakdownSectionsHtml = effectiveMembers.map(member => {
    const data = memberCostMap.get(member.id)!;
    const avatarSrc = getMemberAvatarSrc(member.avatar, member.name, member.id);

    let contentHtml = '';
    if (data.breakdown.length === 0) {
      contentHtml = `
        <div class="empty-breakdown-box">
          <span>☕ 尚未加入任何分攤行程</span>
        </div>
      `;
    } else {
      const rowsHtml = data.breakdown.map(item => `
        <tr>
          <td class="td-date">${escapeHtml(item.date)}</td>
          <td>
            <span class="type-badge" style="background-color: ${item.typeBadgeColor}15; color: ${item.typeBadgeColor}; border: 1px solid ${item.typeBadgeColor}40;">
              ${item.typeEmoji} ${escapeHtml(item.type)}
            </span>
          </td>
          <td class="item-title-bold">${escapeHtml(item.title)}</td>
          <td class="amount-col font-mono font-bold text-cocoa">NT$ ${formatNumber(item.amount)}</td>
        </tr>
      `).join('');

      contentHtml = `
        <table class="member-items-table">
          <thead>
            <tr>
              <th style="width: 16%;">日期</th>
              <th style="width: 16%;">類別</th>
              <th>行程項目名稱</th>
              <th style="width: 25%; text-align: right;">個人分攤金額</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" class="footer-total-label">預計分攤總計 (TWD)</td>
              <td class="footer-total-amount">NT$ ${formatNumber(data.totalPotential)}</td>
            </tr>
          </tfoot>
        </table>
      `;
    }

    return `
      <div class="member-breakdown-card">
        <div class="member-breakdown-header">
          <div class="member-detail-profile">
            <img src="${avatarSrc}" class="member-detail-avatar" alt="${escapeHtml(member.name)}" />
            <div>
              <div class="member-name-row">
                <span class="member-detail-name">${escapeHtml(member.name)}</span>
                <span class="member-detail-tag">行程分攤明細</span>
              </div>
              <span class="member-detail-sub">${data.breakdown.length} 項分攤行程</span>
            </div>
          </div>
          <div class="member-total-box">
            <span class="total-label">預計支出總計 (TWD)</span>
            <span class="total-amount">NT$ ${formatNumber(data.totalPotential)}</span>
          </div>
        </div>
        ${contentHtml}
      </div>
    `;
  }).join('');

  const splitSettlementHtml = `
    <div class="section-card page-break-before">
      <div class="section-header">
        <span class="section-icon">👥</span>
        <h3 class="section-title">行程分攤明細 (成員詳細資料)</h3>
        <span class="badge-count">${effectiveMembers.length} 位成員</span>
      </div>
      <p class="section-intro">
        對齊「成員詳細資料」之行程分攤明細，彙整每位成員於機票、住宿、大眾交通、租車與門票等行程之預計分攤支出與明細清冊。
      </p>

      <!-- 1. 成員預計分攤總覽 -->
      <div class="split-section-subtitle">
        <span>成員預計分攤總覽</span>
        <span class="total-badge-pill">全員分攤總額：NT$ ${formatNumber(totalTripPotential)}</span>
      </div>
      <div class="member-overview-grid">
        ${memberOverviewCardsHtml}
      </div>

      <!-- 2. 各成員詳細行程分攤明細清冊 -->
      <div class="split-section-subtitle" style="margin-top: 18px;">各成員詳細行程分攤明細</div>
      <div class="member-breakdowns-container">
        ${memberBreakdownSectionsHtml}
      </div>
    </div>
  `;

  // 9. 組合完整手帳樣式 HTML
  return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(tripName)} - 旅行手帳行程表</title>
  <style>
    /* ================= AESTHETIC TRAVEL JOURNAL PRINT STYLES ================= */
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700;900&display=swap');

    :root {
      --bg-page: #FAF8F2;
      --bg-card: #FFFFFF;
      --color-cocoa: #3D322C;
      --color-cocoa-light: #5A4E47;
      --color-muted: #847971;
      --color-border: #E8E2D5;
      --color-sage: #5F7A6E;
      --color-sage-light: #EBF1EE;
      --color-cream: #F3EFE6;
      --color-gold: #C08C5D;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      font-family: 'Noto Sans TC', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: var(--bg-page);
      color: var(--color-cocoa);
      line-height: 1.5;
      font-size: 13px;
      padding: 24px;
    }

    .page-container {
      max-width: 860px;
      margin: 0 auto;
      background: var(--bg-page);
    }

    /* Print Specific Page Setup */
    @page {
      size: A4 portrait;
      margin: 12mm 10mm 12mm 10mm;
    }

    @media print {
      body {
        padding: 0;
        background: #FFFFFF;
      }
      .page-container {
        max-width: 100%;
      }
      .no-print {
        display: none !important;
      }
      .page-break-before {
        page-break-before: always;
        break-before: page;
      }
      .section-card, .day-container, .booking-item {
        page-break-inside: avoid;
        break-inside: avoid;
      }
    }

    /* Top Floating Action Bar for Offline HTML View */
    .floating-print-bar {
      position: sticky;
      top: 12px;
      z-index: 999;
      background: #FFFFFF;
      border: 2px solid var(--color-sage);
      border-radius: 16px;
      padding: 12px 20px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 4px 16px rgba(95, 122, 110, 0.15);
    }
    .floating-info {
      font-size: 13px;
      font-weight: bold;
      color: var(--color-cocoa);
    }
    .print-btn {
      background: var(--color-sage);
      color: #FFFFFF;
      border: none;
      border-radius: 12px;
      padding: 8px 18px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: background 0.2s;
    }
    .print-btn:hover {
      background: #4B6258;
    }

    /* Cover / Header Card */
    .journal-cover {
      background: var(--bg-card);
      border: 2px solid var(--color-border);
      border-radius: 20px;
      padding: 24px 28px;
      margin-bottom: 20px;
      position: relative;
      box-shadow: 0 2px 8px rgba(61, 50, 44, 0.04);
    }
    .journal-cover::after {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 6px;
      background: repeating-linear-gradient(90deg, var(--color-sage), var(--color-sage) 12px, var(--color-gold) 12px, var(--color-gold) 24px);
      border-radius: 20px 20px 0 0;
    }
    .cover-top-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .brand-stamp {
      font-size: 11px;
      font-weight: 900;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: var(--color-sage);
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .trip-code-pill {
      font-family: monospace;
      background: var(--color-sage-light);
      color: var(--color-sage);
      font-size: 11px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 8px;
      border: 1px solid rgba(95, 122, 110, 0.2);
    }
    .trip-main-title {
      font-size: 24px;
      font-weight: 900;
      color: var(--color-cocoa);
      margin-bottom: 12px;
      line-height: 1.3;
    }
    .cover-meta-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 12px;
      border-top: 1px dashed var(--color-border);
      padding-top: 14px;
    }
    .meta-box-label {
      font-size: 11px;
      color: var(--color-muted);
      font-weight: 700;
      text-transform: uppercase;
      margin-bottom: 2px;
    }
    .meta-box-val {
      font-size: 13px;
      font-weight: 700;
      color: var(--color-cocoa);
    }

    /* Section Styles */
    .section-card {
      background: var(--bg-card);
      border: 2px solid var(--color-border);
      border-radius: 18px;
      padding: 18px 22px;
      margin-bottom: 20px;
      box-shadow: 0 2px 6px rgba(61, 50, 44, 0.03);
    }
    .section-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 14px;
      border-bottom: 1.5px solid var(--color-cream);
      padding-bottom: 10px;
    }
    .section-icon {
      font-size: 18px;
    }
    .section-title {
      font-size: 16px;
      font-weight: 800;
      color: var(--color-cocoa);
    }
    .badge-count {
      margin-left: auto;
      font-size: 11px;
      background: var(--color-cream);
      color: var(--color-cocoa-light);
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 12px;
    }

    /* Bookings Grid */
    .booking-grid {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .booking-item {
      background: #FDFBF7;
      border: 1px solid var(--color-border);
      border-radius: 12px;
      padding: 12px 16px;
    }
    .booking-item-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }
    .flight-airline {
      font-size: 14px;
      font-weight: 800;
      color: var(--color-cocoa);
    }
    .flight-code {
      font-family: monospace;
      font-size: 13px;
      font-weight: 800;
      background: #EBF3FA;
      color: #0369A1;
      padding: 2px 6px;
      border-radius: 6px;
    }
    .flight-trip-type, .city-tag {
      font-size: 11px;
      background: var(--color-cream);
      color: var(--color-cocoa-light);
      padding: 2px 6px;
      border-radius: 6px;
      font-weight: 700;
    }
    .flight-route-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #FFFFFF;
      border: 1px solid var(--color-border);
      border-radius: 10px;
      padding: 10px 14px;
      margin: 8px 0;
    }
    .airport-box {
      display: flex;
      flex-direction: column;
    }
    .airport-box.dest {
      text-align: right;
    }
    .airport-code {
      font-size: 18px;
      font-weight: 900;
      color: var(--color-cocoa);
      font-family: monospace;
    }
    .airport-city {
      font-size: 12px;
      color: var(--color-muted);
      font-weight: 500;
    }
    .airport-time {
      font-size: 12px;
      font-weight: 700;
      color: var(--color-sage);
      margin-top: 2px;
    }
    .flight-arrow-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex: 1;
      padding: 0 16px;
    }
    .flight-duration {
      font-size: 11px;
      color: var(--color-muted);
      margin-bottom: 2px;
    }
    .flight-line {
      width: 100%;
      height: 2px;
      background: #CBD5E1;
      position: relative;
    }
    .transit-tag {
      font-size: 10px;
      color: #D97706;
      font-weight: 700;
      margin-top: 3px;
    }
    .direct-tag {
      font-size: 10px;
      color: var(--color-sage);
      font-weight: 700;
      margin-top: 3px;
    }
    .booking-details-row {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      font-size: 12px;
      color: var(--color-cocoa-light);
      margin-top: 4px;
    }
    .booking-meta-row {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      font-size: 11px;
      color: var(--color-muted);
      margin-top: 6px;
    }
    .address-text {
      font-size: 12px;
      color: var(--color-cocoa-light);
      margin-top: 4px;
    }
    .booking-note {
      font-size: 11px;
      color: var(--color-muted);
      background: #FAF7EE;
      border-left: 3px solid var(--color-gold);
      padding: 4px 8px;
      border-radius: 0 6px 6px 0;
      margin-top: 6px;
    }
    .item-title {
      font-size: 14px;
      font-weight: 800;
      color: var(--color-cocoa);
    }

    /* Day by Day Schedule */
    .day-container {
      background: var(--bg-card);
      border: 2px solid var(--color-border);
      border-radius: 18px;
      margin-bottom: 18px;
      overflow: hidden;
      box-shadow: 0 2px 6px rgba(61, 50, 44, 0.03);
    }
    .day-header-banner {
      background: var(--color-cream);
      border-bottom: 1.5px solid var(--color-border);
      padding: 10px 18px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .day-badge {
      background: var(--color-sage);
      color: #FFFFFF;
      font-size: 12px;
      font-weight: 900;
      padding: 4px 10px;
      border-radius: 8px;
      text-transform: uppercase;
    }
    .day-title-info {
      display: flex;
      flex-direction: column;
    }
    .day-date-str {
      font-size: 14px;
      font-weight: 800;
      color: var(--color-cocoa);
    }
    .day-location-str {
      font-size: 11px;
      font-weight: 700;
      color: var(--color-muted);
    }
    .day-count-tag {
      margin-left: auto;
      font-size: 11px;
      color: var(--color-muted);
      font-weight: 700;
    }
    .day-items-list {
      padding: 12px 18px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .empty-day-notice {
      padding: 16px;
      text-align: center;
      color: var(--color-muted);
      font-style: italic;
      font-size: 12px;
    }

    /* Timeline Item */
    .schedule-timeline-item {
      display: flex;
      gap: 14px;
      padding-bottom: 12px;
      border-bottom: 1px dashed var(--color-border);
    }
    .schedule-timeline-item:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
    .item-time-col {
      width: 78px;
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
    }
    .item-time {
      font-family: monospace;
      font-size: 13px;
      font-weight: 800;
      color: var(--color-cocoa);
    }
    .item-type-badge {
      font-size: 10px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 6px;
      white-space: nowrap;
    }
    .type-spot { background: #ECFDF5; color: #047857; }
    .type-food { background: #FFF7ED; color: #C2410C; }
    .type-transport { background: #F0F9FF; color: #0369A1; }
    .type-stay { background: #F5F3FF; color: #6D28D9; }
    .type-flight { background: #EFF6FF; color: #1D4ED8; }

    .item-content-col {
      flex: 1;
    }
    .item-header-row {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      gap: 8px;
      margin-bottom: 2px;
    }
    .item-header-row .item-title {
      font-size: 14px;
      font-weight: 800;
      color: var(--color-cocoa);
    }
    .item-location {
      font-size: 11px;
      color: var(--color-muted);
      font-weight: 500;
    }
    .item-address {
      font-size: 11px;
      color: var(--color-muted);
      margin-bottom: 4px;
    }
    .item-note {
      font-size: 12px;
      color: var(--color-cocoa-light);
      background: #FAF8F2;
      border-left: 3px solid var(--color-border);
      padding: 4px 8px;
      border-radius: 0 6px 6px 0;
      margin-top: 4px;
    }
    .item-meta-cost {
      font-size: 11px;
      font-weight: 700;
      color: #059669;
      margin-top: 4px;
    }

    /* Transit Legs */
    .transit-legs-box {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      padding: 8px 12px;
      margin-top: 6px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .transit-leg-row {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
      font-size: 11px;
    }
    .leg-step {
      background: #64748B;
      color: #FFFFFF;
      font-size: 10px;
      font-weight: 700;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .leg-time {
      font-family: monospace;
      font-weight: 700;
      color: #334155;
    }
    .leg-service, .leg-platform {
      background: #E2E8F0;
      color: #475569;
      padding: 1px 5px;
      border-radius: 4px;
      font-size: 10px;
    }

    /* Expense Section */
    .expense-summary-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      margin-bottom: 16px;
    }
    .total-box {
      background: #FDFBF7;
      border: 2px solid var(--color-gold);
      border-radius: 12px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .total-label {
      font-size: 11px;
      font-weight: 700;
      color: var(--color-muted);
      text-transform: uppercase;
    }
    .total-amount {
      font-size: 22px;
      font-weight: 900;
      color: var(--color-cocoa);
      margin: 4px 0;
    }
    .total-sub {
      font-size: 11px;
      color: var(--color-muted);
    }
    .currencies-box {
      background: #FDFBF7;
      border: 1px solid var(--color-border);
      border-radius: 12px;
      padding: 14px;
    }
    .box-subtitle {
      font-size: 12px;
      font-weight: 800;
      color: var(--color-cocoa);
      display: block;
      margin-bottom: 8px;
    }
    .currencies-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .stat-badge {
      background: #FFFFFF;
      border: 1px solid var(--color-border);
      border-radius: 8px;
      padding: 4px 8px;
      display: flex;
      align-items: baseline;
      gap: 4px;
    }
    .stat-label {
      font-size: 10px;
      font-weight: 800;
      color: var(--color-muted);
    }
    .stat-value {
      font-size: 13px;
      font-weight: 800;
      color: var(--color-cocoa);
      font-family: monospace;
    }

    /* Categories Breakdown */
    .categories-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .category-row {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .category-info {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
    }
    .category-label {
      font-weight: 700;
      padding-left: 6px;
      color: var(--color-cocoa);
    }
    .category-count {
      color: var(--color-muted);
      font-size: 11px;
      margin-right: auto;
      margin-left: 6px;
    }
    .category-amount {
      font-weight: 700;
      font-family: monospace;
      color: var(--color-cocoa);
    }
    .category-bar-bg {
      width: 100%;
      height: 6px;
      background: var(--color-cream);
      border-radius: 3px;
      overflow: hidden;
    }
    .category-bar-fill {
      height: 100%;
      border-radius: 3px;
    }

    /* ================= Member Schedule Split Styles ================= */
    .split-section-subtitle {
      font-size: 13px;
      font-weight: 800;
      color: var(--color-cocoa);
      margin: 14px 0 10px 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .total-badge-pill {
      font-size: 11px;
      font-weight: 800;
      color: var(--color-sage);
      background: #EBF1EE;
      border: 1px solid rgba(86, 122, 107, 0.25);
      padding: 3px 9px;
      border-radius: 8px;
      font-family: monospace;
    }
    .member-overview-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
      gap: 12px;
      margin-bottom: 18px;
    }
    .member-overview-card {
      background: #FFFFFF;
      border: 1.5px solid var(--color-border);
      border-radius: 14px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      box-shadow: 0 1px 3px rgba(61, 50, 44, 0.03);
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .member-overview-avatar {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid var(--color-border);
      margin-bottom: 6px;
      background: #FAF7EE;
    }
    .member-overview-name {
      font-size: 13px;
      font-weight: 800;
      color: var(--color-cocoa);
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      margin-bottom: 3px;
    }
    .member-overview-total {
      font-size: 13.5px;
      font-weight: 900;
      color: var(--color-sage);
      font-family: monospace;
    }
    .member-overview-count {
      font-size: 10.5px;
      color: var(--color-muted);
      font-weight: 600;
      margin-top: 2px;
    }

    /* 各成員行程分攤清冊卡片 */
    .member-breakdowns-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .member-breakdown-card {
      background: #FFFFFF;
      border: 1.5px solid var(--color-border);
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 1px 4px rgba(61, 50, 44, 0.03);
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .member-breakdown-header {
      background: #FAF8F5;
      border-bottom: 1.5px solid var(--color-border);
      padding: 10px 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .member-detail-profile {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .member-detail-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      object-fit: cover;
      border: 1.5px solid var(--color-border);
      background: #FAF7EE;
    }
    .member-name-row {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .member-detail-name {
      font-size: 13.5px;
      font-weight: 800;
      color: var(--color-cocoa);
    }
    .member-detail-tag {
      font-size: 10px;
      background: #EBF1EE;
      color: var(--color-sage);
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 6px;
    }
    .member-detail-sub {
      font-size: 11px;
      color: var(--color-muted);
      display: block;
      margin-top: 1px;
    }
    .member-total-box {
      text-align: right;
    }
    .member-total-box .total-label {
      font-size: 9.5px;
      color: var(--color-muted);
      font-weight: 700;
      text-transform: uppercase;
      display: block;
    }
    .member-total-box .total-amount {
      font-size: 14.5px;
      font-weight: 900;
      color: var(--color-sage);
      font-family: monospace;
    }

    .member-items-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11.5px;
      text-align: left;
    }
    .member-items-table th {
      background: #FCFBF8;
      color: var(--color-muted);
      font-weight: 700;
      padding: 7px 12px;
      border-bottom: 1px solid var(--color-border);
      font-size: 11px;
    }
    .member-items-table td {
      padding: 8px 12px;
      border-bottom: 1px solid #F3EFE6;
      vertical-align: middle;
      color: var(--color-cocoa);
    }
    .member-items-table tr:last-child td {
      border-bottom: none;
    }
    .member-items-table tr:nth-child(even) td {
      background-color: #FCFBF8;
    }
    .member-items-table tfoot td {
      background: #FAF8F5;
      border-top: 1.5px solid var(--color-border);
      padding: 8px 12px;
    }
    .footer-total-label {
      font-weight: 800;
      color: var(--color-cocoa);
      font-size: 11.5px;
    }
    .footer-total-amount {
      text-align: right;
      font-family: monospace;
      font-weight: 900;
      font-size: 13px;
      color: var(--color-sage);
    }
    .type-badge {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      font-size: 10px;
      font-weight: 800;
      padding: 2px 7px;
      border-radius: 8px;
      white-space: nowrap;
    }
    .empty-breakdown-box {
      text-align: center;
      padding: 20px 12px;
      color: var(--color-muted);
      font-size: 12px;
      font-weight: 700;
      background: #FCFBF8;
    }

    /* Footer Stamp */
    .journal-footer {
      text-align: center;
      padding: 16px 0;
      border-top: 1px dashed var(--color-border);
      color: var(--color-muted);
      font-size: 11px;
      margin-top: 24px;
    }
    .footer-stamp {
      display: inline-block;
      border: 1px solid var(--color-border);
      padding: 4px 12px;
      border-radius: 12px;
      background: #FFFFFF;
      font-weight: 700;
    }
  </style>
</head>
<body>
  <div class="page-container">
    <!-- Floating Quick Bar when opened directly as HTML -->
    <div class="floating-print-bar no-print">
      <div class="floating-info">
        <span>📖 ${escapeHtml(tripName)} · 離線手帳檔案 (含分攤明細)</span>
      </div>
      <button class="print-btn" onclick="window.print()">
        📄 轉為 PDF 檔案
      </button>
    </div>

    <!-- Cover Header -->
    <div class="journal-cover">
      <div class="cover-top-row">
        <span class="brand-stamp">🌿 Trip Mochi · 旅行手帳行程表</span>
        ${tripId ? `<span class="trip-code-pill">代碼: ${escapeHtml(tripId)}</span>` : ''}
      </div>
      <h1 class="trip-main-title">${escapeHtml(tripName)}</h1>
      <div class="cover-meta-grid">
        <div>
          <div class="meta-box-label">📅 旅行期間</div>
          <div class="meta-box-val">${startDate ? `${escapeHtml(startDate)} ~ ${escapeHtml(endDate)}` : '未定日期'} (${totalDays} 天)</div>
        </div>
        <div>
          <div class="meta-box-label">👥 旅伴成員</div>
          <div class="meta-box-val">${memberNames}</div>
        </div>
        <div>
          <div class="meta-box-label">📊 總計活動</div>
          <div class="meta-box-val">${scheduleItems.length} 個景點/行程</div>
        </div>
      </div>
    </div>

    <!-- Section: Bookings Quick Reference -->
    ${flightsHtml}
    ${accommodationsHtml}
    ${otherBookingsHtml}

    <!-- Section: Day-by-Day Schedule -->
    <div class="section-card">
      <div class="section-header">
        <span class="section-icon">🗓️</span>
        <h3 class="section-title">每日排程手帳 (Day-by-Day Itinerary)</h3>
        <span class="badge-count">共 ${totalDays} 天</span>
      </div>
    </div>
    ${daysScheduleHtml}

    <!-- Section: Expense Summary -->
    ${expenseSummaryHtml}

    <!-- Section: Member Schedule Cost Breakdown (行程分攤明細) -->
    ${splitSettlementHtml}

    <!-- Footer Stamp -->
    <div class="journal-footer">
      <div class="footer-stamp">
        Trip Mochi 手帳 · 祝您旅途平安愉悅 Have a wonderful trip! ✨
      </div>
    </div>
  </div>
</body>
</html>`;
};

/**
 * 透過隱藏的 iframe 呼叫瀏覽器原生列印窗口（另存為 PDF）
 * 保證中文文字完全向量銳利、A4 完美排版、支援任何裝置
 */
export const printTripToPdf = (data: TripExportData): Promise<boolean> => {
  return new Promise((resolve) => {
    try {
      const html = generateTripPdfHtml(data);
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document;
      if (!doc) {
        // Fallback to open in new tab
        const win = window.open('', '_blank');
        if (win) {
          win.document.write(html);
          win.document.close();
          win.focus();
          win.print();
        }
        resolve(true);
        return;
      }

      doc.open();
      doc.write(html);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          resolve(true);
        } catch (e) {
          console.error("Print execution failed:", e);
          resolve(false);
        } finally {
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 3000);
        }
      }, 500);
    } catch (err) {
      console.error("Failed to generate printable PDF:", err);
      resolve(false);
    }
  });
};

/**
 * 下載單一離線手帳檔案 (.html)，支援在任何無網路環境下直接開啟瀏覽與列印
 */
export const downloadOfflineTripHtml = (data: TripExportData) => {
  const html = generateTripPdfHtml(data);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeName = (data.tripName || '旅行手帳').replace(/[/\\?%*:|"<>]/g, '_');
  a.href = url;
  a.download = `${safeName}_行程手帳_含分攤明細.html`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
};

/**
 * 直接將行程轉換並下載為 PDF 檔案 (.pdf)
 * 真正轉為 PDF，無須開啟列印視窗
 */
export const exportTripToPdfFile = async (
  data: TripExportData,
  onProgress?: (message: string, percent: number) => void
): Promise<boolean> => {
  let container: HTMLElement | null = null;
  try {
    onProgress?.('正在準備行程手帳與分攤明細資料...', 15);

    // 建立臨時隱藏容器以精確模擬 A4 寬度 (800px)
    container = document.createElement('div');
    container.id = 'trip-pdf-render-container';
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '-9999px';
    container.style.width = '800px';
    container.style.backgroundColor = '#FAF8F2';
    container.style.zIndex = '-9999';
    container.style.boxSizing = 'border-box';
    container.style.padding = '0';
    container.style.margin = '0';

    const fullHtml = generateTripPdfHtml(data);
    
    // 擷取 body 內的所有內容
    const bodyContent = fullHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] || fullHtml;
    // 擷取 style 標籤
    const styleMatches = fullHtml.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || [];
    const styles = styleMatches.join('\n');

    container.innerHTML = `
      ${styles}
      <style>
        .no-print { display: none !important; }
        .page-container { width: 800px !important; margin: 0 auto !important; padding: 24px !important; }
      </style>
      ${bodyContent}
    `;

    document.body.appendChild(container);

    onProgress?.('正在載入排版與文字向量...', 35);
    if (document.fonts) {
      await document.fonts.ready;
    }
    // 稍等以確保所有渲染準備就緒
    await new Promise(resolve => setTimeout(resolve, 350));

    onProgress?.('正在轉繪為高解析度手帳圖文...', 65);
    const canvas = await html2canvas(container, {
      scale: 2, // 2x 高解析度
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#FAF8F2',
      windowWidth: 800,
    });

    onProgress?.('正在封裝生成 A4 PDF 檔案...', 88);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = 210;
    const pdfHeight = 297;

    // 計算每頁對應的 canvas 高度 (依照 A4 寬高比 297 / 210)
    const pageCanvasHeight = (canvas.width * pdfHeight) / pdfWidth;
    const totalPages = Math.ceil(canvas.height / pageCanvasHeight);

    for (let page = 0; page < totalPages; page++) {
      if (page > 0) {
        pdf.addPage();
      }

      // 切割每一頁 canvas
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = canvas.width;
      pageCanvas.height = pageCanvasHeight;
      const pageCtx = pageCanvas.getContext('2d');

      if (pageCtx) {
        pageCtx.fillStyle = '#FAF8F2';
        pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvasHeight);

        const sourceY = page * pageCanvasHeight;
        const sourceHeight = Math.min(pageCanvasHeight, canvas.height - sourceY);

        pageCtx.drawImage(
          canvas,
          0, sourceY, canvas.width, sourceHeight,
          0, 0, canvas.width, sourceHeight
        );

        const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.95);
        pdf.addImage(pageImgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      }
    }

    onProgress?.('正在儲存 PDF 檔案...', 98);
    const safeName = (data.tripName || '旅行手帳').replace(/[/\\?%*:|"<>]/g, '_');
    pdf.save(`${safeName}_行程手帳_含分攤明細.pdf`);

    onProgress?.('轉換完成！', 100);
    return true;
  } catch (err) {
    console.error('Failed to export PDF file:', err);
    return false;
  } finally {
    if (container && document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
};

