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
  if (/山|峰|Kulm|Berg|Matterhorn|Rigi|Titlis|First|Schilthorn|Jungfrau|Gornergrat|Zermatt/i.test(text)) return '🏔️';
  if (/小鎮|老街|中世紀|街|城|市區|Rhein|Stein|Village|Town|Old Town/i.test(text)) return '🏘️';
  if (/教堂|宮|館|院|古蹟|塔|Bern|伯恩|鐘樓|大教堂|Castle|Museum|Cathedral|Palace/i.test(text)) return '🏛️';
  if (/湖|海|河|瀑布|Lake|See|Falls|River/i.test(text)) return '🌊';
  if (/機場|Flight|Airport|Flug/i.test(text)) return '✈️';
  if (/火車站|車站|Station|Bahnhof|Hbf|Train|SBB/i.test(text)) return '🚆';
  if (/纜車|Cable|Gondola|Funicular/i.test(text)) return '🚡';
  if (/遊船|渡輪|Boat|Ferry|Cruise/i.test(text)) return '🚢';
  if (/公車|巴士|Bus/i.test(text)) return '🚌';
  if (/咖啡|Cafe|Coffee/i.test(text)) return '☕';
  if (/餐廳|美食|餐|飯|麵|館|Bar|Restaurant|Food|Grill|Fondue/i.test(text)) return '🍽️';
  if (/飯店|酒店|民宿|Hotel|Resort|Lodge|Hostel|Airbnb|Check-in|入住/i.test(text)) return '🏨';
  return defaultEmoji;
};

// 清理與簡化路線節點名稱（去除冗贅詞彙，使路線圖一目了然）
const cleanRouteNodeName = (raw: string): string => {
  if (!raw) return '';
  let name = raw.trim();
  // 移除常見前綴
  name = name.replace(/^(入住|前往|抵達|搭乘|返回|參觀|遊覽|漫步)\s*/g, '');
  // 去除 "火車站"、"車站"、"Station"、"Bahnhof" 等冗贅字眼，保留地名
  name = name.replace(/(火車站|車站|Station|Bahnhof|Hbf)$/gi, '').trim();
  // 如果括號內有中文/德文，例如 "蘇黎世機場 (Zürich Flughafen)"，精簡取代表性地名
  if (name.includes('(') && name.includes(')')) {
    const match = name.match(/^(.*?)\s*\((.*?)\)$/);
    if (match) {
      const p1 = match[1].trim();
      const p2 = match[2].trim();
      // 如果前面是中文如「蘇黎世機場火車站」，經過去除「火車站」後剩「蘇黎世機場」
      if (p1 && p1.length <= 12) return p1;
      if (p2 && p2.length <= 16) return p2;
    }
  }
  return name.trim();
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

interface RouteNode {
  emoji: string;
  name: string;
}

/**
 * 智慧建立「今日路線」摘要
 * 涵蓋起點、轉乘點、途經景點與終點，並避免相鄰重複
 */
const generateTodayRouteSummary = (
  dayItems: ScheduleItem[],
  dayIcon: string
): string | null => {
  const rawNodes: RouteNode[] = [];

  dayItems.forEach((item) => {
    if (item.type === 'flight') {
      const f = item.flightDetails;
      if (f?.departureAirport && f?.arrivalAirport) {
        const dep = cleanRouteNodeName(f.departureAirport);
        const arr = cleanRouteNodeName(f.arrivalAirport);
        if (rawNodes.length === 0 && dep) {
          rawNodes.push({ emoji: '✈️', name: dep });
        }
        if (arr) {
          rawNodes.push({ emoji: '✈️', name: arr });
        }
      } else {
        const name = cleanRouteNodeName(item.location || item.title || '機場');
        rawNodes.push({ emoji: '✈️', name: name || '機場' });
      }
    } else if (item.type === 'transport') {
      const isCar = !!(item.carRental && item.carRental.hasRental);
      const defaultIcon = isCar ? '🚗' : '🚆';
      const stations = extractTransitStations(item.transitDetails?.legs);

      if (stations.length > 0) {
        stations.forEach((st) => {
          const cleanSt = cleanRouteNodeName(st);
          if (cleanSt) {
            const emoji = getSmartEmoji(st, defaultIcon);
            rawNodes.push({ emoji, name: cleanSt });
          }
        });
      } else if (isCar && (item.carRental.pickupLocation || item.carRental.returnLocation)) {
        if (item.carRental.pickupLocation) {
          const p = cleanRouteNodeName(item.carRental.pickupLocation);
          if (p) rawNodes.push({ emoji: '🚗', name: p });
        }
        if (item.carRental.returnLocation) {
          const r = cleanRouteNodeName(item.carRental.returnLocation);
          if (r) rawNodes.push({ emoji: '🚗', name: r });
        }
      } else {
        const rawName = item.location || item.title;
        const name = cleanRouteNodeName(rawName);
        if (name) {
          const emoji = getSmartEmoji(rawName, defaultIcon);
          rawNodes.push({ emoji, name });
        }
      }
    } else if (item.type === 'stay') {
      const rawName = item.title.replace(/^入住\s*/, '').trim() || item.location;
      const name = cleanRouteNodeName(rawName);
      if (name) {
        const emoji = getSmartEmoji(rawName, '🏨');
        rawNodes.push({ emoji, name });
      }
    } else if (item.type === 'food') {
      const name = cleanRouteNodeName(item.title || item.location);
      if (name) {
        const emoji = getSmartEmoji(item.title, '🍽️');
        rawNodes.push({ emoji, name });
      }
    } else {
      // spot
      const name = cleanRouteNodeName(item.title || item.location);
      if (name) {
        const emoji = getSmartEmoji(item.title, '📍');
        rawNodes.push({ emoji, name });
      }
    }
  });

  if (rawNodes.length === 0) return null;

  // 相鄰節點去重與精簡（保留具有行進脈絡的重複點，例如 A -> B -> C -> B -> D）
  const condensedNodes: RouteNode[] = [];
  rawNodes.forEach((node) => {
    if (!node.name) return;
    const last = condensedNodes[condensedNodes.length - 1];
    if (!last) {
      condensedNodes.push(node);
      return;
    }

    const lastNorm = last.name.toLowerCase().trim();
    const currNorm = node.name.toLowerCase().trim();

    // 如果相鄰兩點完全相同，或彼此包含，則合併並保留較生動的 emoji
    if (lastNorm === currNorm) {
      if (last.emoji === '🚆' && node.emoji !== '🚆') {
        last.emoji = node.emoji;
      }
      return;
    }
    if ((lastNorm.includes(currNorm) || currNorm.includes(lastNorm)) && (lastNorm.length < 8 || currNorm.length < 8)) {
      if (last.emoji === '🚆' && node.emoji !== '🚆') {
        last.emoji = node.emoji;
      }
      return;
    }

    condensedNodes.push(node);
  });

  if (condensedNodes.length < 2) {
    // 只有一個節點時，若有可顯示的行程點依然呈現路線點
    if (condensedNodes.length === 1) {
      return `${dayIcon} 今日路線\n\n${condensedNodes[0].emoji} ${condensedNodes[0].name}`;
    }
    return null;
  }

  const routeLines = condensedNodes.map(n => `${n.emoji} ${n.name}`).join('\n↓\n');
  return `${dayIcon} 今日路線\n\n${routeLines}`;
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
      dayItems.forEach((item) => {
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
    const routeSummary = generateTodayRouteSummary(dayItems, dayIcon);
    if (routeSummary) {
      dayLines.push(routeSummary);
      dayLines.push(DIVIDER);
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
