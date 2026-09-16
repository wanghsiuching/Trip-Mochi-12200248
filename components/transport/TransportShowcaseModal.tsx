import React, { useState } from 'react';
import { X, Smartphone, Sparkles, Navigation, Clock, CheckCircle } from 'lucide-react';
import { TransportItemModel, TravelTimelineItem } from './types';
import { TransportCard } from './TransportCard';
import { TransportTimeline } from './TransportTimeline';

interface TransportShowcaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// 測試資料集 (TEST 1 ~ TEST 6 完整符合使用者規格需求)
export const SHOWCASE_DATA = {
  // TEST 2 (主要 Showcase): 阿提哈德航空 EY899 一次轉機
  ey899_transit: {
    id: 'test-ey899',
    type: 'flight',
    title: '阿提哈德航空 EY899',
    operator: '阿提哈德航空',
    operatorSub: 'Etihad Airways',
    serviceNumber: 'EY899',
    totalDuration: '17h 30m',
    directionType: 'outbound',
    cost: 35000,
    currency: 'TWD',
    seat: '24A',
    classType: '經濟艙',
    bookingReference: 'EY7X9Q',
    baggage: {
      checked: '25kg',
      carryOn: '7kg',
    },
    note: '行李直掛蘇黎世 ZRH。在阿布達比 (AUH) 停留 1 小時 20 分鐘換機，航廈轉機指示清楚。',
    participants: ['我', '小明'],
    segments: [
      {
        id: 'ey899-seg1',
        type: 'flight',
        operator: '阿提哈德航空',
        serviceNumber: 'EY899',
        duration: '8h 50m',
        departure: {
          name: '桃園',
          city: '台北',
          code: 'TPE',
          terminal: 'T2',
          time: '17:40',
          date: '2026-10-19',
          timeZoneLabel: '出發·台灣時間',
        },
        arrival: {
          name: '阿布達比',
          city: '阿布達比',
          code: 'AUH',
          terminal: 'T3',
          time: '22:30',
          timeZoneLabel: '抵達·當地時間',
        },
        transferAfter: {
          location: {
            name: '阿布達比',
            city: '阿布達比',
            code: 'AUH',
          },
          duration: '1h 20m',
          nextServiceNumber: 'EY143',
          nextOperator: '阿提哈德航空',
          transferType: 'flight',
          note: '行李直掛蘇黎世，無需重新託運',
        },
      },
      {
        id: 'ey899-seg2',
        type: 'flight',
        operator: '阿提哈德航空',
        serviceNumber: 'EY143',
        duration: '7h 20m',
        departure: {
          name: '阿布達比',
          city: '阿布達比',
          code: 'AUH',
          terminal: 'T3',
          time: '23:50',
          timeZoneLabel: '出發·當地時間',
        },
        arrival: {
          name: '蘇黎世',
          city: '蘇黎世',
          code: 'ZRH',
          terminal: 'T2',
          time: '12:00',
          date: '2026-10-20',
          timeZoneLabel: '抵達·當地時間',
        },
      },
    ],
  } as TransportItemModel,

  // TEST 1: 長榮航空 BR87 直飛 (TPE → CDG)
  br87_direct: {
    id: 'test-br87',
    type: 'flight',
    title: '長榮航空 BR87',
    operator: '長榮航空',
    operatorSub: 'EVA Air',
    serviceNumber: 'BR87',
    totalDuration: '13h 20m',
    directionType: 'outbound',
    cost: 38500,
    currency: 'TWD',
    seat: '32K',
    classType: '經濟艙',
    bookingReference: 'BR8P2K',
    baggage: {
      checked: '23kg',
      carryOn: '7kg',
    },
    note: '直飛長程航班，提供兩餐與機上娛樂系統。',
    segments: [
      {
        id: 'br87-seg-direct',
        type: 'flight',
        operator: '長榮航空',
        serviceNumber: 'BR87',
        duration: '13h 20m',
        departure: {
          name: '桃園',
          city: '台北',
          code: 'TPE',
          terminal: 'T2',
          time: '10:20',
          date: '2026-10-16',
          timeZoneLabel: '出發·台灣時間',
        },
        arrival: {
          name: '巴黎戴高樂',
          city: '巴黎',
          code: 'CDG',
          terminal: 'T1',
          time: '18:40',
          date: '2026-10-16',
          timeZoneLabel: '抵達·當地時間',
        },
      },
    ],
  } as TransportItemModel,

  // TEST 3: 兩次轉機 (TPE → AUH → ZRH → KAN)
  two_transfers: {
    id: 'test-two-transfers',
    type: 'flight',
    title: '阿提哈德與瑞士聯邦聯運',
    operator: '聯程交通',
    operatorSub: 'Etihad & SBB',
    serviceNumber: 'EY899 + EY143 + IC8',
    totalDuration: '21h 10m',
    directionType: 'outbound',
    cost: 37800,
    currency: 'TWD',
    baggage: {
      checked: '25kg',
      carryOn: '7kg',
    },
    note: '兩次轉乘：在阿布達比轉機，飛抵蘇黎世後轉乘瑞士鐵路 IC 8 列車前往 Kandersteg。',
    segments: [
      {
        id: '2tr-seg1',
        type: 'flight',
        operator: '阿提哈德航空',
        serviceNumber: 'EY899',
        departure: { name: '台北', code: 'TPE', time: '17:40', city: '台北' },
        arrival: { name: '阿布達比', code: 'AUH', time: '22:30', city: '阿布達比' },
        transferAfter: {
          location: { name: '阿布達比', code: 'AUH', city: '阿布達比' },
          duration: '1h 20m',
          nextServiceNumber: 'EY143',
          transferType: 'flight',
        },
      },
      {
        id: '2tr-seg2',
        type: 'flight',
        operator: '阿提哈德航空',
        serviceNumber: 'EY143',
        departure: { name: '阿布達比', code: 'AUH', time: '23:50', city: '阿布達比' },
        arrival: { name: '蘇黎世', code: 'ZRH', time: '12:00', city: '蘇黎世' },
        transferAfter: {
          location: { name: '蘇黎世機場火車站', code: 'ZRH Station', city: '蘇黎世' },
          duration: '35m',
          nextServiceNumber: 'IC 8',
          transferType: 'train',
          note: '步至地下火車站 3 號月台',
        },
      },
      {
        id: '2tr-seg3',
        type: 'train',
        operator: 'SBB 瑞士聯邦鐵路',
        serviceNumber: 'IC 8',
        departure: { name: '蘇黎世機場', code: 'ZRH Rail', time: '12:35', platform: '月台 3' },
        arrival: { name: '坎德施泰格', code: 'KAN', time: '14:50', platform: '月台 1' },
      },
    ],
  } as TransportItemModel,

  // TEST 4: 火車 (Kandersteg → Visp → Zermatt)
  train_zermatt: {
    id: 'test-train-zermatt',
    type: 'train',
    title: '瑞士 SBB 景觀特急列車',
    operator: 'SBB 瑞士聯邦鐵路',
    operatorSub: 'Matterhorn Gotthard Bahn',
    serviceNumber: 'RE 4117 → R 223',
    totalDuration: '1h 48m',
    directionType: 'oneway',
    cost: 1680,
    currency: 'TWD',
    seat: '2nd Class (自由座)',
    note: '在 Visp 菲斯普站 4 號月台轉乘策馬特登山小火車，銜接時間充裕。',
    segments: [
      {
        id: 'tr-seg1',
        type: 'train',
        operator: 'SBB BLS',
        serviceNumber: 'RE 4117',
        duration: '42m',
        departure: {
          name: '坎德施泰格',
          city: 'Kandersteg',
          code: 'KAN',
          time: '09:12',
          platform: '月台 2',
          timeZoneLabel: '發車時間',
        },
        arrival: {
          name: '菲斯普',
          city: 'Visp',
          code: 'VISP',
          time: '09:54',
          platform: '月台 3',
          timeZoneLabel: '抵達時間',
        },
        transferAfter: {
          location: {
            name: '菲斯普車站',
            city: 'Visp',
            platform: '轉至 4 號月台',
          },
          duration: '14m',
          nextServiceNumber: 'R 223',
          transferType: 'train',
          note: '同月台或搭乘電梯輕鬆轉乘 MGB 鐵道',
        },
      },
      {
        id: 'tr-seg2',
        type: 'train',
        operator: 'MGB 馬特洪峰鐵路',
        serviceNumber: 'R 223',
        duration: '52m',
        departure: {
          name: '菲斯普',
          city: 'Visp',
          code: 'VISP',
          time: '10:08',
          platform: '月台 4',
          timeZoneLabel: '發車時間',
        },
        arrival: {
          name: '策馬特',
          city: 'Zermatt',
          code: 'ZER',
          time: '11:00',
          platform: '月台 1',
          timeZoneLabel: '抵達時間',
        },
      },
    ],
  } as TransportItemModel,

  // TEST 5: 火車 + 步行 (SNCF TGV 9576 + 步行至飯店)
  train_walk: {
    id: 'test-tgv-walk',
    type: 'train',
    title: '法國高鐵 TGV 9576 & 步行',
    operator: 'SNCF 法國國鐵',
    operatorSub: 'TGV inOUI',
    serviceNumber: 'TGV 9576',
    totalDuration: '3h 20m',
    directionType: 'oneway',
    cost: 2480,
    currency: 'TWD',
    seat: 'Car 4, Seat 24 (2nd Class)',
    note: '抵達 Lyon Part-Dieu 後從西側出口步行約 8 分鐘抵達 Hotel Le Grand。',
    segments: [
      {
        id: 'tgv-seg',
        type: 'train',
        operator: 'SNCF',
        serviceNumber: 'TGV 9576',
        duration: '3h 12m',
        departure: {
          name: '里昂火車站',
          city: '巴黎',
          code: 'Paris Gare de Lyon',
          time: '08:14',
          platform: 'Hall 1, Voie A',
          timeZoneLabel: '發車時間',
        },
        arrival: {
          name: '里昂帕爾迪厄',
          city: '里昂',
          code: 'Lyon Part-Dieu',
          time: '11:26',
          platform: 'Voie E',
          timeZoneLabel: '抵達時間',
        },
        transferAfter: {
          location: {
            name: 'Lyon Part-Dieu 出站',
            city: '里昂',
          },
          duration: '8m',
          nextServiceNumber: '步行 450m',
          transferType: 'mixed',
          note: '沿 Boulevard Vivier Merle 步行',
        },
      },
      {
        id: 'walk-seg',
        type: 'walk',
        operator: '步行',
        serviceNumber: '步行前往飯店',
        duration: '8m',
        departure: {
          name: '車站西口',
          city: '里昂',
          time: '11:30',
        },
        arrival: {
          name: 'Hotel Le Grand',
          city: '里昂市中心',
          time: '11:38',
          address: '12 Rue de la République, 69002 Lyon',
        },
      },
    ],
  } as TransportItemModel,

  // TEST 6: Flight + Train (ZRH Airport → Bern → Kandersteg)
  flight_train_joint: {
    id: 'test-flight-train',
    type: 'train',
    title: '瑞士蘇黎世機場聯運鐵路',
    operator: 'SBB 瑞士國鐵',
    operatorSub: 'Swiss Federal Railways',
    serviceNumber: 'IC 8 → RE 4123',
    totalDuration: '2h 15m',
    directionType: 'oneway',
    cost: 1420,
    currency: 'TWD',
    seat: 'Swiss Travel Pass 全包',
    note: '出關後直接連通地下火車站，先搭乘 IC 8 列車前往首都伯恩，再同月台換乘 RE 前往 Kandersteg。',
    segments: [
      {
        id: 'ft-seg1',
        type: 'train',
        operator: 'SBB',
        serviceNumber: 'IC 8',
        duration: '1h 14m',
        departure: {
          name: '蘇黎世機場站',
          city: 'Zürich Flughafen',
          code: 'ZRH Rail',
          time: '13:18',
          platform: '月台 4',
          timeZoneLabel: '發車時間',
        },
        arrival: {
          name: '伯恩火車站',
          city: 'Bern',
          code: 'BERN',
          time: '14:32',
          platform: '月台 6',
          timeZoneLabel: '抵達時間',
        },
        transferAfter: {
          location: {
            name: '伯恩火車站',
            city: 'Bern',
            platform: '至月台 7',
          },
          duration: '12m',
          nextServiceNumber: 'RE 4123',
          transferType: 'train',
          note: '同車站換月台，無需出站',
        },
      },
      {
        id: 'ft-seg2',
        type: 'train',
        operator: 'BLS',
        serviceNumber: 'RE 4123',
        duration: '49m',
        departure: {
          name: '伯恩火車站',
          city: 'Bern',
          code: 'BERN',
          time: '14:44',
          platform: '月台 7',
          timeZoneLabel: '發車時間',
        },
        arrival: {
          name: '坎德施泰格',
          city: 'Kandersteg',
          code: 'KAN',
          time: '15:33',
          platform: '月台 1',
          timeZoneLabel: '抵達時間',
        },
      },
    ],
  } as TransportItemModel,
};

// Travel Timeline 模擬項目 (Travel Mode 範例)
export const SHOWCASE_TIMELINE: TravelTimelineItem[] = [
  {
    id: 'tl-1',
    time: '17:40',
    endTime: '22:30',
    title: '✈ 阿提哈德航空 EY899 (台北 → 阿布達比)',
    type: 'flight',
    status: 'completed',
    note: '已抵達阿布達比 AUH，飛行 8h 50m，航程順利。',
  },
  {
    id: 'tl-2',
    time: '23:50',
    endTime: '12:00',
    title: '✈ 阿提哈德航空 EY143 (阿布達比 → 蘇黎世)',
    type: 'flight',
    status: 'now',
    remainingMinutes: 42,
    note: '航程進行中，正在穿越阿爾卑斯山空域，預計 42 分鐘後降落 ZRH 蘇黎世。',
  },
  {
    id: 'tl-3',
    time: '13:18',
    endTime: '14:32',
    title: '🚆 瑞士聯邦鐵路 IC 8 (蘇黎世機場 → 伯恩)',
    type: 'train',
    status: 'next',
    startsInMinutes: 78,
    note: '蘇黎世機場火車站 4 號月台發車，請於 13:10 前抵達月台候車。',
  },
  {
    id: 'tl-4',
    time: '14:44',
    endTime: '15:33',
    title: '🚆 瑞士 BLS RE 4123 (伯恩 → 坎德施泰格)',
    type: 'train',
    status: 'later',
    note: '抵達伯恩後有 12 分鐘轉車時間至 7 號月台。',
  },
  {
    id: 'tl-5',
    time: '15:45',
    endTime: '16:00',
    title: '🏨 Check-in: Kandersteg Alpine Hotel',
    type: 'stay',
    status: 'later',
    note: '出站步行 5 分鐘抵達飯店辦理入住。',
  },
];

export const TransportShowcaseModal: React.FC<TransportShowcaseModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'card' | 'timeline'>('card');
  const [selectedCaseKey, setSelectedCaseKey] = useState<keyof typeof SHOWCASE_DATA>('ey899_transit');
  const [viewportWidth, setViewportWidth] = useState<'375' | '390' | '412' | 'full'>('full');

  if (!isOpen) return null;

  const currentItem = SHOWCASE_DATA[selectedCaseKey];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-[#FAF8F5] w-full max-w-4xl max-h-[92vh] rounded-[2rem] border-2 border-[#E5DFD4] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* 頂部標題區 */}
        <div className="p-4 sm:p-5 bg-white border-b border-[#E8E2D5] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#2E5A44] text-white flex items-center justify-center shadow-xs">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="text-lg font-black text-[#2D2A26] flex items-center gap-2">
                Transport Component System 驗證展示台
              </h3>
              <p className="text-xs text-[#7A7162] font-medium">
                Trip Mochi 統一交通資訊元件系統 · 支援 Flight / Train / Walk / 轉機 / Travel Mode
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#F3EFE8] text-[#7A7162] hover:text-[#2D2A26] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* 控制工具列：測試情境選擇 + 螢幕寬度模擬切換 */}
        <div className="px-4 sm:px-5 py-3 bg-[#F5F1E8] border-b border-[#E8E2D5] flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* 模式切換 */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#E0D9CB]">
            <button
              type="button"
              onClick={() => setActiveTab('card')}
              className={`px-3 py-1.5 rounded-lg font-black transition-all ${
                activeTab === 'card'
                  ? 'bg-[#2E5A44] text-white shadow-xs'
                  : 'text-[#6B6150] hover:bg-[#F9F7F2]'
              }`}
            >
              單一交通卡片 (TransportCard)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('timeline')}
              className={`px-3 py-1.5 rounded-lg font-black transition-all ${
                activeTab === 'timeline'
                  ? 'bg-[#2E5A44] text-white shadow-xs'
                  : 'text-[#6B6150] hover:bg-[#F9F7F2]'
              }`}
            >
              旅行時間軸 (Travel Mode)
            </button>
          </div>

          {/* 螢幕寬度模擬 (TEST 7: 375px, TEST 8: 390px, TEST 9: 412px) */}
          <div className="flex items-center gap-1.5">
            <span className="text-[#7A7162] font-bold flex items-center gap-1">
              <Smartphone size={13} /> 寬度模擬:
            </span>
            <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-[#E0D9CB]">
              <button
                type="button"
                onClick={() => setViewportWidth('375')}
                className={`px-2 py-1 rounded text-[11px] font-mono font-bold ${
                  viewportWidth === '375'
                    ? 'bg-[#3E5C49] text-white'
                    : 'text-[#6B6150] hover:bg-[#F9F7F2]'
                }`}
                title="iPhone SE (375px)"
              >
                375px
              </button>
              <button
                type="button"
                onClick={() => setViewportWidth('390')}
                className={`px-2 py-1 rounded text-[11px] font-mono font-bold ${
                  viewportWidth === '390'
                    ? 'bg-[#3E5C49] text-white'
                    : 'text-[#6B6150] hover:bg-[#F9F7F2]'
                }`}
                title="iPhone 14/15 (390px)"
              >
                390px
              </button>
              <button
                type="button"
                onClick={() => setViewportWidth('412')}
                className={`px-2 py-1 rounded text-[11px] font-mono font-bold ${
                  viewportWidth === '412'
                    ? 'bg-[#3E5C49] text-white'
                    : 'text-[#6B6150] hover:bg-[#F9F7F2]'
                }`}
                title="Pixel / Android (412px)"
              >
                412px
              </button>
              <button
                type="button"
                onClick={() => setViewportWidth('full')}
                className={`px-2 py-1 rounded text-[11px] font-bold ${
                  viewportWidth === 'full'
                    ? 'bg-[#3E5C49] text-white'
                    : 'text-[#6B6150] hover:bg-[#F9F7F2]'
                }`}
              >
                100%
              </button>
            </div>
          </div>
        </div>

        {/* 測試案例快捷選擇標籤 */}
        {activeTab === 'card' && (
          <div className="px-4 sm:px-5 py-2.5 bg-white border-b border-[#EBE5DA] overflow-x-auto flex items-center gap-2 scrollbar-none">
            <span className="text-[11px] font-black text-[#968A78] flex-shrink-0">
              案例切換：
            </span>
            <button
              type="button"
              onClick={() => setSelectedCaseKey('ey899_transit')}
              className={`px-3 py-1.5 rounded-full text-xs font-black whitespace-nowrap transition-all border ${
                selectedCaseKey === 'ey899_transit'
                  ? 'bg-[#EBF3EE] text-[#2E5A44] border-[#2E5A44]'
                  : 'bg-[#F9F7F2] text-[#6B6150] border-[#E8E2D5] hover:bg-[#F2ECE1]'
              }`}
            >
              ★ EY899 (一次轉機 · 17h30m)
            </button>
            <button
              type="button"
              onClick={() => setSelectedCaseKey('br87_direct')}
              className={`px-3 py-1.5 rounded-full text-xs font-black whitespace-nowrap transition-all border ${
                selectedCaseKey === 'br87_direct'
                  ? 'bg-[#EBF3EE] text-[#2E5A44] border-[#2E5A44]'
                  : 'bg-[#F9F7F2] text-[#6B6150] border-[#E8E2D5] hover:bg-[#F2ECE1]'
              }`}
            >
              TEST 1 直飛 (BR87 台北→巴黎)
            </button>
            <button
              type="button"
              onClick={() => setSelectedCaseKey('two_transfers')}
              className={`px-3 py-1.5 rounded-full text-xs font-black whitespace-nowrap transition-all border ${
                selectedCaseKey === 'two_transfers'
                  ? 'bg-[#EBF3EE] text-[#2E5A44] border-[#2E5A44]'
                  : 'bg-[#F9F7F2] text-[#6B6150] border-[#E8E2D5] hover:bg-[#F2ECE1]'
              }`}
            >
              TEST 3 兩次轉機 (TPE→AUH→ZRH→KAN)
            </button>
            <button
              type="button"
              onClick={() => setSelectedCaseKey('train_zermatt')}
              className={`px-3 py-1.5 rounded-full text-xs font-black whitespace-nowrap transition-all border ${
                selectedCaseKey === 'train_zermatt'
                  ? 'bg-[#EBF3EE] text-[#2E5A44] border-[#2E5A44]'
                  : 'bg-[#F9F7F2] text-[#6B6150] border-[#E8E2D5] hover:bg-[#F2ECE1]'
              }`}
            >
              TEST 4 瑞士火車 (Kandersteg→Visp→策馬特)
            </button>
            <button
              type="button"
              onClick={() => setSelectedCaseKey('train_walk')}
              className={`px-3 py-1.5 rounded-full text-xs font-black whitespace-nowrap transition-all border ${
                selectedCaseKey === 'train_walk'
                  ? 'bg-[#EBF3EE] text-[#2E5A44] border-[#2E5A44]'
                  : 'bg-[#F9F7F2] text-[#6B6150] border-[#E8E2D5] hover:bg-[#F2ECE1]'
              }`}
            >
              TEST 5 法國高鐵 + 步行 (TGV + Walk)
            </button>
            <button
              type="button"
              onClick={() => setSelectedCaseKey('flight_train_joint')}
              className={`px-3 py-1.5 rounded-full text-xs font-black whitespace-nowrap transition-all border ${
                selectedCaseKey === 'flight_train_joint'
                  ? 'bg-[#EBF3EE] text-[#2E5A44] border-[#2E5A44]'
                  : 'bg-[#F9F7F2] text-[#6B6150] border-[#E8E2D5] hover:bg-[#F2ECE1]'
              }`}
            >
              TEST 6 Flight + Train 聯運 (ZRH 機場→伯恩)
            </button>
          </div>
        )}

        {/* 內容展示主體 */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col items-center justify-start bg-[#F7F4EE]/60">
          <div
            className={`w-full transition-all duration-300 ${
              viewportWidth === '375'
                ? 'max-w-[375px] border-x-2 border-dashed border-[#CFC5B4] px-1 py-3 bg-[#FAF8F5]'
                : viewportWidth === '390'
                ? 'max-w-[390px] border-x-2 border-dashed border-[#CFC5B4] px-1.5 py-3 bg-[#FAF8F5]'
                : viewportWidth === '412'
                ? 'max-w-[412px] border-x-2 border-dashed border-[#CFC5B4] px-2 py-3 bg-[#FAF8F5]'
                : 'max-w-2xl'
            }`}
          >
            {activeTab === 'card' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-[#7A7162] px-1">
                  <span className="font-bold">當前驗證規格：{currentItem.title}</span>
                  <span className="font-mono text-[11px] bg-white px-2 py-0.5 rounded border border-[#E5DFD4]">
                    模擬寬度: {viewportWidth === 'full' ? '100% 彈性' : `${viewportWidth}px`}
                  </span>
                </div>

                {/* 核心 TransportCard 元件實例 */}
                <TransportCard
                  item={currentItem}
                  defaultExpanded={true}
                />

                {/* 測試要點檢查清單 */}
                <div className="p-3.5 bg-white rounded-2xl border border-[#E5DFD4] text-xs text-[#6B6150] space-y-1.5">
                  <div className="font-black text-[#2D2A26] flex items-center gap-1.5">
                    <CheckCircle size={14} className="text-[#2E5A44]" />
                    元件層次驗證標準 (Hierarchy Specs):
                  </div>
                  <ul className="list-disc pl-5 space-y-1 text-[11px] text-[#7A7162]">
                    <li><strong>Level 1 (交通代號):</strong> 班次識別碼 EY899 / BR87 / TGV 9576 醒目清楚</li>
                    <li><strong>Level 2 (時間):</strong> 出發與抵達時間採用 24~28px 數字，容易掃視</li>
                    <li><strong>Level 3 (地點與城市):</strong> 城市名稱與機場代碼對齊，不發生溢位</li>
                    <li><strong>Level 4 (轉乘節點 TransferNode):</strong> 膠囊式轉機資訊 (AUH 轉機 1h 20m) 虛線貫穿連接</li>
                    <li><strong>Level 5 (細節展開):</strong> 託運行李、手提行李、費用、航程分段展開皆具備</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3.5 bg-white rounded-2xl border border-[#E5DFD4] text-xs text-[#6B6150]">
                  <h4 className="font-black text-[#2D2A26] mb-1 flex items-center gap-1.5">
                    <Clock size={14} className="text-[#2E5A44]" />
                    Travel Mode 智慧狀態提示 (NOW / NEXT / LATER)
                  </h4>
                  <p className="text-[11px] text-[#7A7162]">
                    無需 GPS、不調用付費 API，由系統與本機時間比對，動態標識當前航段剩餘時間、下一班交通倒數。
                  </p>
                </div>

                <TransportTimeline
                  items={SHOWCASE_TIMELINE}
                  currentDate="2026-10-19"
                />
              </div>
            )}
          </div>
        </div>

        {/* 底部關閉列 */}
        <div className="p-3.5 sm:p-4 bg-white border-t border-[#E8E2D5] flex items-center justify-between text-xs">
          <span className="text-[#8C806F]">
            Trip Mochi · 交通資訊元件系統 (Phase 4)
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#2E5A44] hover:bg-[#244736] text-white rounded-xl font-black shadow-xs active:scale-95 transition-all"
          >
            完成檢驗並返回
          </button>
        </div>
      </div>
    </div>
  );
};
