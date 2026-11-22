import { describe, it, expect } from 'vitest';
import { formatTripAsText } from '../../utils/shareTrip';
import type { ScheduleItem, TripDate } from '../../types';

describe('formatTripAsText - 今日路線依行程卡上下順序', () => {
  const dates: TripDate[] = [
    {
      date: '2026-10-15',
      dayNum: 1,
      monthDay: '10/15',
      weekday: '週四',
      location: '法國科爾馬',
      fruit: '🇨🇭',
    },
  ];

  it('依行程卡 order 上下順序產出今日路線與行程明細，不依時間重新排序', () => {
    const scheduleItems: ScheduleItem[] = [
      {
        id: '3',
        date: '2026-10-15',
        time: '08:00',
        title: '人頭屋 (Maison des Têtes)',
        type: 'spot',
        location: 'Colmar',
        order: 2,
      },
      {
        id: '1',
        date: '2026-10-15',
        time: '14:30',
        title: 'Zürich Flughafen',
        type: 'flight',
        location: 'Zürich',
        order: 0,
        flightDetails: {
          airline: 'LX',
          flightCode: 'LX280',
          departureAirport: 'TPE',
          arrivalAirport: 'Zürich Flughafen',
        },
      },
      {
        id: '2',
        date: '2026-10-15',
        time: '09:00',
        title: 'Basel SBB → Colmar',
        type: 'transport',
        location: 'Basel SBB',
        order: 1,
        transitDetails: {
          legs: [
            {
              id: 'leg-1',
              fromStation: 'Basel SBB',
              toStation: 'Colmar',
              departureTime: '09:00',
              arrivalTime: '09:45',
              transportType: 'train',
            },
          ],
        },
      },
    ];

    const output = formatTripAsText({
      tripName: '瑞法之旅',
      dates,
      scheduleItems,
      scope: 'day',
      selectedDate: '2026-10-15',
    });

    const routeSection = output.split('今日路線')[1] || '';
    const zrhIdx = routeSection.indexOf('Zürich Flughafen');
    const baselIdx = routeSection.indexOf('Basel SBB');
    const colmarIdx = routeSection.indexOf('Colmar');
    const maisonIdx = routeSection.indexOf('人頭屋');

    expect(zrhIdx).toBeGreaterThan(-1);
    expect(baselIdx).toBeGreaterThan(zrhIdx);
    expect(colmarIdx).toBeGreaterThan(baselIdx);
    expect(maisonIdx).toBeGreaterThan(colmarIdx);
  });

  it('未設定 order 時保留傳入陣列的卡片上下順序，不依 time 排序', () => {
    const scheduleItems: ScheduleItem[] = [
      {
        id: 'a',
        date: '2026-10-15',
        time: '18:00',
        title: '蘇黎世機場',
        type: 'spot',
        location: '蘇黎世機場',
      },
      {
        id: 'b',
        date: '2026-10-15',
        time: '09:00',
        title: '人頭屋',
        type: 'spot',
        location: '人頭屋',
      },
    ];

    const output = formatTripAsText({
      tripName: '測試之旅',
      dates,
      scheduleItems,
      scope: 'day',
      selectedDate: '2026-10-15',
    });

    const routeSection = output.split('今日路線')[1] || '';
    expect(routeSection.indexOf('蘇黎世機場')).toBeLessThan(routeSection.indexOf('人頭屋'));
  });
});
