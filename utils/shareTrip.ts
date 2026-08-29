import { ScheduleItem, TripDate, TransitLeg } from '../types';

const DIVIDER = '━━━━━━━━━━━━━━';

// 格式化數字（包含千分位與小數點）
const formatMoney = (val: number | string): string => {
  const num = typeof val === 'number' ? val : parseFloat(val);
  if (isNaN(num)) return String(val);
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};

// 依景點/地點關鍵字推導合適的 Emoji
const getSmartEmoji = (text: string, defaultEmoji: string): string => {
  if (!text) return defaultEmoji;
  if (/山|峰|Kulm|Berg|Matterhorn|Rigi|Titlis|First|Schilthorn|Jungfrau|Gornergrat/i.test(text)) return '🏔️';
  if (/鎮|街|城|市區|Rhein|Stein|Village|Town/i.test(text)) return '🏘️';
  if (/教堂|宮|館|院|古蹟|塔|Bern|鐘樓|大教堂|Castle|Museum|Cathedral|Palace/i.test(text)) return '🏛️';
  if (/湖|海|河|瀑布|Lake|See|Falls|River/i.test(text)) return '🌊';
  if (/機場|Flight|Airport|Flug/i.test(text)) return '✈️';
  if (/火車站|車站|Station|Bahnhof|Hbf/i.test(text)) return '🚆';
  if (/纜車|Cable/i.test(text)) return '🚡';
  if (/遊船|渡輪|Boat|Ferry/i.test(text)) return '🚢';
  return defaultEmoji;
};

// 提取轉乘車站清單
const extractTransitStations = (legs?: TransitLeg[]): string[] => {
  if (!legs || legs.length === 0) return [];
  const stations: string[] = [];
  legs.forEach((leg, idx) => {
    if (idx === 0 && leg.fromStation) {
      stations.push(leg.fromStation.trim());
    }
    if (leg.toStation) {
      stations.push(leg.toStation.trim());
    }
  });
  return stations.filter(Boolean);
};

/**
 * 將行程資料格式化為優雅排版的純文字（適合 LINE、訊息、社群分享）
 */
export const formatTripAsText = ({
  tripName,
  dates,
  scheduleItems,
  scope = 'day',
  selectedDate,
}: {
  tripName: string;
  dates: TripDate[];
  scheduleItems: ScheduleItem[];
  scope: 'day' | 'all';
  selectedDate?: string;
}): string => {
  const targetDates = scope === 'day'
    ? dates.filter(d => d.date === selectedDate)
    : dates;

  if (targetDates.length === 0) {
    return `${DIVIDER}\n🧳 ${tripName}\n（無行程日期）\n${DIVIDER}`;
  }

  const outputSections: string[] = [];

  targetDates.forEach((day) => {
    const dayLines: string[] = [];

    // 1. 每日標題 Header 區塊
    dayLines.push(DIVIDER);
    const weekdayShort = (day.weekday || '').replace('週', '').replace('星期', '');
    dayLines.push(`📅 ${day.monthDay}（${weekdayShort}）Day ${day.dayNum}`);
    
    const dayIcon = day.fruit || '🇨🇭';
    const dayLocation = day.location && day.location !== '旅行地點' ? day.location : '';
    if (dayLocation) {
      dayLines.push(`${dayIcon} ${dayLocation}`);
    }
    dayLines.push(DIVIDER);

    // 2. 當日行程項目
    const dayItems = scheduleItems
      .filter(item => item.date === day.date)
      .sort((a, b) => (a.time || '').localeCompare(b.time || ''));

    if (dayItems.length === 0) {
      dayLines.push('');
      dayLines.push('（今日尚無排定行程）');
      dayLines.push('');
    } else {
      dayItems.forEach((item, itemIdx) => {
        const itemBlock: string[] = [];
        const time = item.time ? item.time.trim() : '';

        // 判斷類型
        if (item.type === 'flight') {
          // 航班
          const headerText = time ? `✈️ ${time}｜${item.title || '航班'}` : `✈️ ${item.title || '航班'}`;
          itemBlock.push(headerText);

          if (item.location && item.location !== item.title) {
            itemBlock.push(item.location);
          }

          if (item.flightDetails) {
            const f = item.flightDetails;
            const flightCode = [f.airline, f.flightCode].filter(Boolean).join(' ');
            const route = f.departureAirport && f.arrivalAirport ? `${f.departureAirport} → ${f.arrivalAirport}` : '';
            const flightInfo = [flightCode, route].filter(Boolean).join('，');
            if (flightInfo) {
              itemBlock.push(flightInfo);
            }
          }

          if (item.note || item.notes) {
            itemBlock.push((item.note || item.notes || '').trim());
          }

          if (item.flightDetails?.cost && Number(item.flightDetails.cost) > 0) {
            const curr = item.flightDetails.currency || 'TWD';
            itemBlock.push(`\n💰 機票：${curr} ${formatMoney(item.flightDetails.cost)}／人`);
          }
        } else if (item.type === 'transport') {
          // 交通 / 鐵道 / 租車
          const isCar = !!(item.carRental && item.carRental.hasRental);
          const icon = isCar ? '🚗' : '🚆';
          const headerText = time ? `${icon} ${time}｜${item.title || '大眾交通'}` : `${icon} ${item.title || '大眾交通'}`;
          itemBlock.push(headerText);

          if (item.location && item.location !== item.title) {
            itemBlock.push(item.location);
          }

          // 轉乘區間路線
          const stations = extractTransitStations(item.transitDetails?.legs);
          if (stations.length > 0) {
            itemBlock.push('');
            stations.forEach((st, sIdx) => {
              if (sIdx === 0) {
                itemBlock.push(`➡️ ${st}`);
              } else {
                itemBlock.push(`→ ${st}`);
              }
            });
          } else if (isCar && (item.carRental.pickupLocation || item.carRental.returnLocation)) {
            itemBlock.push('');
            if (item.carRental.pickupLocation) itemBlock.push(`➡️ ${item.carRental.pickupLocation}`);
            if (item.carRental.returnLocation) itemBlock.push(`→ ${item.carRental.returnLocation}`);
          }

          if (item.note || item.notes) {
            itemBlock.push(`\n${(item.note || item.notes || '').trim()}`);
          }

          // 費用
          const fare = item.transitDetails?.fare;
          if (fare) {
            const numDisc = Number(fare.discountedPrice);
            const numOrig = Number(fare.originalPrice);
            const price = !isNaN(numDisc) && numDisc > 0 ? numDisc : (!isNaN(numOrig) && numOrig > 0 ? numOrig : null);
            if (price !== null) {
              const curr = fare.currency || 'TWD';
              itemBlock.push(`\n💰 車資：${curr} ${formatMoney(price)}／人`);
            }
          } else if (isCar && Number(item.carRental?.rentalCost) > 0) {
            const curr = item.carRental.rentalCurrency || 'TWD';
            itemBlock.push(`\n💰 租車：${curr} ${formatMoney(item.carRental.rentalCost)}／人`);
          }
        } else if (item.type === 'stay') {
          // 住宿
          const stayTitle = item.title.startsWith('入住') ? item.title : `入住 ${item.title}`;
          const headerText = time ? `🏨 ${time}｜${stayTitle}` : `🏨 ${stayTitle}`;
          itemBlock.push(headerText);

          if (item.location && item.location !== item.title) {
            itemBlock.push(item.location);
          }

          if (item.address) {
            itemBlock.push(`\n📍 ${item.address.trim()}`);
          }

          if (item.note || item.notes) {
            itemBlock.push(`\n${(item.note || item.notes || '').trim()}`);
          }

          if (item.stayDetails?.cost && Number(item.stayDetails.cost) > 0) {
            const curr = item.stayDetails.currency || 'TWD';
            itemBlock.push(`\n💰 住宿：${curr} ${formatMoney(item.stayDetails.cost)}／人`);
          }
        } else if (item.type === 'food') {
          // 美食
          const headerText = time ? `🍽️ ${time}｜${item.title}` : `🍽️ ${item.title}`;
          itemBlock.push(headerText);

          if (item.location && item.location !== item.title) {
            itemBlock.push(item.location);
          }

          if (item.address) {
            itemBlock.push(`📍 ${item.address.trim()}`);
          }

          if (item.note || item.notes) {
            itemBlock.push(`\n${(item.note || item.notes || '').trim()}`);
          }

          if (item.spotDetails?.hasTicket && Number(item.spotDetails.ticketCost) > 0) {
            const curr = item.spotDetails.currency || 'TWD';
            itemBlock.push(`\n💰 餐費：${curr} ${formatMoney(item.spotDetails.ticketCost)}／人`);
          }
        } else {
          // 景點 (spot)
          const headerText = time ? `📍 ${time}｜${item.title}` : `📍 ${item.title}`;
          itemBlock.push(headerText);

          if (item.location && item.location !== item.title) {
            itemBlock.push(item.location);
          }

          if (item.address) {
            itemBlock.push(`📍 ${item.address.trim()}`);
          }

          if (item.note || item.notes) {
            itemBlock.push(`\n${(item.note || item.notes || '').trim()}`);
          }

          if (item.spotDetails?.hasTicket && Number(item.spotDetails.ticketCost) > 0) {
            const curr = item.spotDetails.currency || 'TWD';
            itemBlock.push(`\n💰 門票：${curr} ${formatMoney(item.spotDetails.ticketCost)}／人`);
          }
        }

        dayLines.push('');
        dayLines.push(itemBlock.join('\n'));
        dayLines.push('');
        dayLines.push(DIVIDER);
      });
    }

    // 3. 今日路線 (Route Summary) 區塊
    const routeNodes: { emoji: string; name: string }[] = [];

    dayItems.forEach(item => {
      if (item.type === 'flight') {
        const dest = item.flightDetails?.arrivalAirport || item.title || '機場';
        // 簡化站名
        const cleanName = dest.replace(/機場|Airport|Flug/gi, '').trim() || dest;
        routeNodes.push({ emoji: '✈️', name: cleanName });
      } else if (item.type === 'transport') {
        const stations = extractTransitStations(item.transitDetails?.legs);
        if (stations.length > 0) {
          stations.forEach(st => {
            const cleanSt = st.replace(/火車站|車站|Station|Bahnhof/gi, '').trim() || st;
            routeNodes.push({ emoji: '🚆', name: cleanSt });
          });
        } else {
          const name = item.title || item.location || '交通';
          routeNodes.push({ emoji: '🚆', name });
        }
      } else if (item.type === 'stay') {
        const stayName = item.title.replace(/^入住\s*/, '').trim();
        const emoji = getSmartEmoji(stayName || item.location, '🏨');
        routeNodes.push({ emoji, name: stayName });
      } else if (item.type === 'food') {
        routeNodes.push({ emoji: '🍽️', name: item.title });
      } else {
        // spot
        const emoji = getSmartEmoji(item.title, '📍');
        routeNodes.push({ emoji, name: item.title });
      }
    });

    if (routeNodes.length >= 2) {
      // 移除相鄰重複的路線點名稱
      const condensedRoute: string[] = [];
      routeNodes.forEach((node, idx) => {
        const prev = condensedRoute[condensedRoute.length - 1];
        const currentStr = `${node.emoji} ${node.name}`;
        if (!prev || !prev.includes(node.name)) {
          condensedRoute.push(currentStr);
        }
      });

      if (condensedRoute.length >= 2) {
        dayLines.push(`${dayIcon} 今日路線\n`);
        dayLines.push(condensedRoute.join('\n↓\n'));
        dayLines.push(DIVIDER);
      }
    }

    outputSections.push(dayLines.join('\n'));
  });

  return outputSections.join('\n\n');
};

/**
 * 呼叫瀏覽器原生分享或退回複製到剪貼簿
 */
export const executeShareOrCopy = async (
  formattedText: string, 
  title = '行程分享'
): Promise<'shared' | 'copied'> => {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title,
        text: formattedText,
      });
      return 'shared';
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        return 'shared'; // 使用者主動取消分享，視為已處理
      }
      // 原生分享失敗，退回剪貼簿
    }
  }

  // 退回剪貼簿
  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(formattedText);
    return 'copied';
  } else if (typeof document !== 'undefined') {
    const textarea = document.createElement('textarea');
    textarea.value = formattedText;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    return 'copied';
  }

  return 'copied';
};
