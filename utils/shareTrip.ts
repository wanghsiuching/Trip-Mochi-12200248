import { ScheduleItem, TripDate } from '../types';

/**
 * 將行程資料格式化為純文字（適合貼到 LINE、訊息或筆記軟體）
 * 規則：
 * 1. 每日以 📅 10/15（三）Day 3 分隔
 * 2. 項目格式：時間 + Emoji + 標題（路線/地點）+ 票價
 * 3. 不使用 Markdown 標籤或 HTML 標籤
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
    return `${tripName}\n（無行程日期）`;
  }

  const lines: string[] = [];

  // 行程主標題
  lines.push(`🧳【${tripName}】`);
  if (scope === 'all') {
    lines.push(`共 ${dates.length} 天行程規劃`);
  }
  lines.push(''); // 空行

  targetDates.forEach((day, index) => {
    // 星期簡稱（如「週五」->「五」）
    const weekdayShort = (day.weekday || '').replace('週', '').replace('星期', '');
    const locationSuffix = day.location && day.location !== '旅行地點' ? ` · ${day.location}` : '';
    
    // 日期標題：📅 10/15（五）Day 1 · 桃園國際機場
    lines.push(`📅 ${day.monthDay}（${weekdayShort}）Day ${day.dayNum}${locationSuffix}`);

    const dayItems = scheduleItems
      .filter(item => item.date === day.date)
      .sort((a, b) => (a.time || '').localeCompare(b.time || ''));

    if (dayItems.length === 0) {
      lines.push('  （尚無排定行程）');
    } else {
      dayItems.forEach(item => {
        const time = item.time || '00:00';
        let emoji = '📍';
        let detailText = item.title || '';
        let fareStr = '';

        if (item.type === 'transport') {
          emoji = '🚆';
          if (item.transitDetails && item.transitDetails.legs && item.transitDetails.legs.length > 0) {
            const legs = item.transitDetails.legs;
            let routeStr = '';
            if (legs.length === 1) {
              routeStr = `${legs[0].fromStation || ''} → ${legs[0].toStation || ''}`;
            } else {
              routeStr = legs.map((l, i) => i === 0 ? `${l.fromStation || ''} → ${l.toStation || ''}` : `${l.toStation || ''}`).join(' → ');
            }

            if (item.title && routeStr && !item.title.includes(routeStr)) {
              detailText = `${item.title}（${routeStr}）`;
            } else {
              detailText = item.title || routeStr || '大眾交通';
            }

            // 票價資訊
            const fare = item.transitDetails.fare;
            if (fare) {
              const numDisc = Number(fare.discountedPrice);
              const numOrig = Number(fare.originalPrice);
              const price = !isNaN(numDisc) && numDisc > 0 ? numDisc : (!isNaN(numOrig) && numOrig > 0 ? numOrig : null);
              if (price !== null) {
                fareStr = ` 💰 ${fare.currency || 'TWD'} ${price}/人`;
              }
            }
          } else if (item.carRental && item.carRental.hasRental) {
            emoji = '🚗';
            const company = item.carRental.company || '';
            const model = item.carRental.carModel || '';
            detailText = `${item.title || '租車自駕'}${company || model ? `（${[company, model].filter(Boolean).join(' ')}）` : ''}`;
            if (Number(item.carRental.rentalCost) > 0) {
              fareStr = ` 💰 ${item.carRental.rentalCurrency || 'TWD'} ${item.carRental.rentalCost}/人`;
            }
          } else {
            if (item.location && item.location !== item.title) {
              detailText = `${item.title || '交通'}（${item.location}）`;
            }
          }
        } else if (item.type === 'flight') {
          emoji = '✈️';
          if (item.flightDetails) {
            const f = item.flightDetails;
            const flightCode = [f.airline, f.flightCode].filter(Boolean).join(' ');
            const route = f.departureAirport && f.arrivalAirport ? `${f.departureAirport} → ${f.arrivalAirport}` : '';
            const descParts = [flightCode, route].filter(Boolean).join('，');
            
            if (item.title && descParts) {
              detailText = `${item.title}（${descParts}）`;
            } else {
              detailText = item.title || descParts || '航班';
            }

            if (Number(f.cost) > 0) {
              fareStr = ` 💰 ${f.currency || 'TWD'} ${f.cost}/人`;
            }
          }
        } else if (item.type === 'food') {
          emoji = '🍽️';
          if (item.location && item.location !== item.title) {
            detailText = `${item.title}（${item.location}）`;
          }
          if (item.spotDetails && item.spotDetails.hasTicket && Number(item.spotDetails.ticketCost) > 0) {
            fareStr = ` 💰 ${item.spotDetails.currency || 'TWD'} ${item.spotDetails.ticketCost}/人`;
          }
        } else if (item.type === 'stay') {
          emoji = '🏨';
          if (item.location && item.location !== item.title) {
            detailText = `${item.title}（${item.location}）`;
          }
          if (item.stayDetails && Number(item.stayDetails.cost) > 0) {
            fareStr = ` 💰 ${item.stayDetails.currency || 'TWD'} ${item.stayDetails.cost}/人`;
          }
        } else {
          // spot
          emoji = '📍';
          if (item.location && item.location !== item.title) {
            detailText = `${item.title}（${item.location}）`;
          }
          if (item.spotDetails && item.spotDetails.hasTicket && Number(item.spotDetails.ticketCost) > 0) {
            fareStr = ` 💰 ${item.spotDetails.currency || 'TWD'} ${item.spotDetails.ticketCost}/人`;
          }
        }

        // 單一行程項目輸出
        lines.push(`${time} ${emoji} ${detailText}${fareStr}`);
      });
    }

    // 天與天之間加空行（非最後一天）
    if (index < targetDates.length - 1) {
      lines.push('');
    }
  });

  return lines.join('\n');
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
