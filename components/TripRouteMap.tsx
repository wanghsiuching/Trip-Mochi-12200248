import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Navigation, MapPin, Plus, Trash2, ChevronUp, ChevronDown, RotateCcw, 
  ExternalLink, AlertTriangle, CheckCircle2, Info, Compass, ArrowRight,
  Split, Footprints, Layers, Sparkles
} from 'lucide-react';
import { 
  RoutePoint, RouteSegment, RouteTransportType, ROUTE_TRANSPORT_CONFIG, 
  TripDate, ScheduleItem 
} from '../types';
import { 
  getCircledNumber, isValidCoordinate, isConfirmedPointWithCoords, 
  formatLatLng 
} from '../utils/locationUtils';
import { 
  buildDayRouteWithLimits, buildGoogleMapsSegmentUrl, 
  checkIsMixedTransport, mapTransportTypeToGoogleTravelMode 
} from '../services/routingProvider';

interface TripRouteMapProps {
  dates: TripDate[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  dayScheduleItems: ScheduleItem[];
  routePoints: RoutePoint[];
  routeSegments: RouteSegment[];
  canUndo: boolean;
  onUndo: () => void;
  onAddPoint: (dayId: string, data: {
    title: string;
    latitude: number;
    longitude: number;
    source?: 'manual_map' | 'existing_manual_gps' | 'google_url_coordinate' | 'other';
    linkedScheduleItemId?: string;
  }) => void;
  onUpdatePointCoord: (pointId: string, lat: number, lng: number) => void;
  onUpdatePointDetails: (pointId: string, details: Partial<RoutePoint>) => void;
  onMovePoint: (dayId: string, pointId: string, direction: 'up' | 'down') => void;
  onDeletePoint: (pointId: string) => void;
  onUpdateSegmentTransport: (segmentId: string, transportType: RouteTransportType) => void;
  onImportItem: (dayId: string, item: ScheduleItem) => void;
}

export const TripRouteMap: React.FC<TripRouteMapProps> = ({
  dates,
  selectedDate,
  onSelectDate,
  dayScheduleItems,
  routePoints,
  routeSegments,
  canUndo,
  onUndo,
  onAddPoint,
  onUpdatePointCoord,
  onUpdatePointDetails,
  onMovePoint,
  onDeletePoint,
  onUpdateSegmentTransport,
  onImportItem,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const polylineRef = useRef<L.Polyline | null>(null);

  // UI 狀態
  const [isAddMode, setIsAddMode] = useState(false);
  const [pendingClickCoord, setPendingClickCoord] = useState<{ lat: number; lng: number } | null>(null);
  const [newPointTitle, setNewPointTitle] = useState('');
  const [selectedScheduleItemId, setSelectedScheduleItemId] = useState<string>('');
  const [editingTransportSegId, setEditingTransportSegId] = useState<string | null>(null);
  const [showSegmentDetails, setShowSegmentDetails] = useState(false);

  // 當前日期的點位與路段 (依 sequence 由小到大排序)
  const currentDayPoints = useMemo(() => {
    return routePoints
      .filter(p => p.dayId === selectedDate)
      .sort((a, b) => a.sequence - b.sequence);
  }, [routePoints, selectedDate]);

  const currentDaySegments = useMemo(() => {
    return routeSegments.filter(s => s.dayId === selectedDate);
  }, [routeSegments, selectedDate]);

  // 當天尚未加入路線的 ScheduleItems (方便一鍵放置)
  const unlinkedScheduleItems = useMemo(() => {
    const linkedIds = new Set(currentDayPoints.map(p => p.linkedScheduleItemId).filter(Boolean));
    return dayScheduleItems.filter(item => !linkedIds.has(item.id));
  }, [dayScheduleItems, currentDayPoints]);

  // 檢查所有點位是否均有確認座標
  const unconfirmedPoints = useMemo(() => {
    return currentDayPoints.filter(p => !isConfirmedPointWithCoords(p));
  }, [currentDayPoints]);

  const hasAllCoordsConfirmed = currentDayPoints.length >= 2 && unconfirmedPoints.length === 0;

  // 檢查是否為混合交通
  const isMixedTransport = useMemo(() => {
    return checkIsMixedTransport(currentDaySegments);
  }, [currentDaySegments]);

  // 主要交通工具 (若整天相同)
  const dominantTransportType = useMemo<RouteTransportType>(() => {
    if (currentDaySegments.length === 0) return 'WALK';
    return currentDaySegments[0].transportType;
  }, [currentDaySegments]);

  // 路線分段 (因應 Google Maps Waypoints 限制)
  const routeLegGroups = useMemo(() => {
    if (!hasAllCoordsConfirmed) return [];
    const travelMode = isMixedTransport ? undefined : mapTransportTypeToGoogleTravelMode(dominantTransportType);
    return buildDayRouteWithLimits(currentDayPoints, travelMode);
  }, [currentDayPoints, hasAllCoordsConfirmed, isMixedTransport, dominantTransportType]);

  // 當前日期的標籤 (例如 Day 1, 2026-10-24)
  const currentDateInfo = useMemo(() => {
    const idx = dates.findIndex(d => d.date === selectedDate);
    if (idx !== -1) {
      return {
        dayNum: dates[idx].dayNum || idx + 1,
        monthDay: dates[idx].monthDay || dates[idx].date,
        weekday: dates[idx].weekday,
      };
    }
    return { dayNum: 1, monthDay: selectedDate, weekday: '' };
  }, [dates, selectedDate]);

  // ----------------------------------------------------
  // 1. 初始化 Leaflet 地圖
  // ----------------------------------------------------
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // 預設中心 (若有現有點位則以其為中心，否則預設羅馬/台北)
    const initialLat = currentDayPoints[0]?.latitude || 41.8902;
    const initialLng = currentDayPoints[0]?.longitude || 12.4922;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 14,
      zoomControl: false,
    });

    // 加入免收費 OpenStreetMap 圖磚 (零 API Key、零 Billing)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    // 加入縮放控制項於右下角
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    mapInstanceRef.current = map;

    // 延遲重整避免尺寸異常
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      clearTimeout(timer);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // ----------------------------------------------------
  // 2. 地圖點擊監聽 (使用者點擊地圖手動標記座標)
  // ----------------------------------------------------
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      setPendingClickCoord({ lat, lng });
      setNewPointTitle(`第 ${currentDayPoints.length + 1} 站`);
      setSelectedScheduleItemId('');
    };

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [currentDayPoints.length]);

  // ----------------------------------------------------
  // 3. 繪製 Markers 與 行程順序線 (Polyline)
  // ----------------------------------------------------
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // 清除舊 Markers
    Object.values(markersRef.current).forEach(m => m.remove());
    markersRef.current = {};

    // 清除舊 Polyline
    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }

    const latLngs: [number, number][] = [];

    // 繪製每一個 Marker (標記 ①, ②, ③, ④)
    currentDayPoints.forEach(pt => {
      if (!isValidCoordinate(pt.latitude, pt.longitude)) return;

      latLngs.push([pt.latitude, pt.longitude]);
      const circledNum = getCircledNumber(pt.sequence);

      // 建立 Trip Mochi 招牌風格的圓圈編號 Marker
      const customIcon = L.divIcon({
        className: 'custom-trip-marker',
        html: `
          <div class="relative group cursor-pointer">
            <div class="w-8 h-8 rounded-full bg-sage border-2 border-white shadow-md flex items-center justify-center text-white font-black text-sm tracking-tight transition-transform transform hover:scale-115 active:scale-95">
              ${circledNum}
            </div>
            <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-cocoa rotate-45 border border-white"></div>
          </div>
        `,
        iconSize: [32, 36],
        iconAnchor: [16, 36],
        popupAnchor: [0, -32],
      });

      // 支援 Marker 拖曳調整位置 (直接更新 manual_map 座標)
      const marker = L.marker([pt.latitude, pt.longitude], {
        icon: customIcon,
        draggable: true,
        title: `${circledNum} ${pt.title}`,
      }).addTo(map);

      // 拖曳結束更新座標
      marker.on('dragend', (event) => {
        const newLatLng = event.target.getLatLng();
        onUpdatePointCoord(pt.id, newLatLng.lat, newLatLng.lng);
      });

      // Popup 內容
      const popupHtml = `
        <div style="font-family: 'Zen Maru Gothic', sans-serif; min-width: 170px;">
          <div style="font-weight: 900; font-size: 14px; color: #5A4D41; margin-bottom: 2px;">
            ${circledNum} ${pt.title}
          </div>
          <div style="font-size: 10px; color: #888; margin-bottom: 6px;">
            📍 ${formatLatLng(pt.latitude, pt.longitude)}
          </div>
          <div style="font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 6px; background-color: #F0F7F4; color: #6BA881; display: inline-block; margin-bottom: 6px;">
            ${pt.source === 'manual_map' ? '手動地圖點擊' : pt.source === 'existing_manual_gps' ? '手動輸入 GPS' : 'Google Maps 座標'}
          </div>
          <div style="font-size: 10px; color: #aaa;">
            💡 可直接按住圖釘拖曳微調位置
          </div>
        </div>
      `;
      marker.bindPopup(popupHtml);

      markersRef.current[pt.id] = marker;
    });

    // 繪製行程順序線 (視覺確認順序合理性，非實際道路線)
    if (latLngs.length >= 2) {
      polylineRef.current = L.polyline(latLngs, {
        color: '#88C9A1',
        weight: 4,
        opacity: 0.85,
        dashArray: '6, 8', // 虛線表示行程順序線
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      // 自動縮放讓整天路線完整入鏡
      map.fitBounds(polylineRef.current.getBounds(), {
        padding: [45, 45],
        maxZoom: 16,
      });
    } else if (latLngs.length === 1) {
      map.setView(latLngs[0], 15);
    }
  }, [currentDayPoints, onUpdatePointCoord]);

  // 確認新增點位
  const handleConfirmAddPoint = () => {
    if (!pendingClickCoord) return;
    const title = newPointTitle.trim() || `第 ${currentDayPoints.length + 1} 站`;

    onAddPoint(selectedDate, {
      title,
      latitude: pendingClickCoord.lat,
      longitude: pendingClickCoord.lng,
      source: 'manual_map',
      linkedScheduleItemId: selectedScheduleItemId || undefined,
    });

    setPendingClickCoord(null);
    setNewPointTitle('');
    setSelectedScheduleItemId('');
    setIsAddMode(false);
  };

  // 開啟 Google Maps 完整路線導航
  const handleOpenGoogleMapsFullRoute = (url: string) => {
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // 開啟單段 Google Maps 導航
  const handleOpenSegmentNav = (from: RoutePoint, to: RoutePoint, transportType: RouteTransportType) => {
    const url = buildGoogleMapsSegmentUrl({ from, to, transportType });
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="flex flex-col space-y-4 pb-28">
      {/* 1. 每日選擇器橫幅 (Day 1, Day 2...) */}
      <div className="bg-white rounded-[2rem] border-2 border-beige-dark p-3.5 shadow-hard-sm">
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sage"></span>
            <span className="text-xs font-black text-cocoa">
              Day {currentDateInfo.dayNum} 路線規劃
            </span>
            <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              共 {currentDayPoints.length} 個點位
            </span>
          </div>

          {canUndo && (
            <button
              onClick={onUndo}
              className="text-xs font-black text-sage bg-sage/10 hover:bg-sage hover:text-white px-2.5 py-1 rounded-xl border border-sage/30 flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
              title="復原上一步操作"
            >
              <RotateCcw size={12} strokeWidth={2.5} /> 復原
            </button>
          )}
        </div>

        {/* 日期切換滾動列 */}
        <div className="flex space-x-2 overflow-x-auto no-scrollbar py-1 snap-x">
          {dates.map((d, idx) => {
            const isSelected = selectedDate === d.date;
            const pointsCount = routePoints.filter(p => p.dayId === d.date).length;
            return (
              <button
                key={d.date}
                onClick={() => onSelectDate(d.date)}
                className={`flex-shrink-0 flex flex-col items-center justify-center w-16 h-15 rounded-2xl transition-all snap-center cursor-pointer border-2 ${
                  isSelected
                    ? 'bg-sage border-sage text-white shadow-hard-sm-sage scale-105 font-black'
                    : 'bg-beige/40 border-beige-dark text-gray-400 hover:border-sage font-bold'
                }`}
              >
                <span className="text-[9px] uppercase tracking-tight opacity-90">
                  Day {d.dayNum || idx + 1}
                </span>
                <span className="text-xs font-black my-0.5">
                  {d.monthDay || d.date.split('-').slice(1).join('/')}
                </span>
                <span className="text-[8px] opacity-75">
                  {pointsCount > 0 ? `${pointsCount} 點` : '未標記'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. 手動互動地圖畫布 (Leaflet Map) */}
      <div className="relative rounded-[2rem] overflow-hidden border-2 border-beige-dark shadow-hard bg-white">
        {/* 地圖容器 */}
        <div
          ref={mapContainerRef}
          className="w-full h-72 sm:h-96 z-0"
          style={{ minHeight: '280px' }}
        />

        {/* 地圖浮水印模式提示 */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 pointer-events-none">
          <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-beige-dark shadow-sm text-[11px] font-black text-cocoa flex items-center gap-1.5">
            <Compass size={13} className="text-sage animate-spin" style={{ animationDuration: '10s' }} />
            <span>Trip Mochi 行程順序線</span>
          </div>
          {isAddMode && (
            <div className="bg-orange-500 text-white px-3 py-1 rounded-xl shadow-md text-[10px] font-black animate-pulse flex items-center gap-1">
              <MapPin size={11} /> 點擊地圖任意處即可標記新位置
            </div>
          )}
        </div>

        {/* 右上角操作按鈕 (＋新增位置切換) */}
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
          <button
            onClick={() => setIsAddMode(prev => !prev)}
            className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm border transition-all active:scale-95 cursor-pointer ${
              isAddMode
                ? 'bg-orange-500 border-orange-600 text-white shadow-md'
                : 'bg-white/95 backdrop-blur-md border-beige-dark text-cocoa hover:text-sage hover:border-sage'
            }`}
          >
            <Plus size={14} strokeWidth={3} className={isAddMode ? 'rotate-45 transition-transform' : ''} />
            {isAddMode ? '取消標記' : '＋新增位置'}
          </button>
        </div>

        {/* 底部說明條：區分行程順序 vs 實際導航 */}
        <div className="absolute bottom-2 left-2 right-12 z-10 pointer-events-none">
          <div className="bg-cocoa/85 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1.5 rounded-xl shadow-sm flex items-center gap-1.5">
            <Info size={12} className="text-sage flex-shrink-0" />
            <span className="truncate">
              Trip Mochi 負責「行程順序檢查」；Google Maps 負責「實際道路與導航」
            </span>
          </div>
        </div>
      </div>

      {/* 3. 點擊地圖後的確認彈窗 (非阻擋式內嵌卡片) */}
      {pendingClickCoord && (
        <div className="bg-orange-50 border-2 border-orange-300 rounded-[2rem] p-4 shadow-hard-sm animate-scale-in">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-black text-orange-900">
              <MapPin size={14} className="text-orange-500" />
              <span>確認在地圖新增標記點</span>
            </div>
            <span className="text-[10px] font-bold text-orange-600">
              {formatLatLng(pendingClickCoord.lat, pendingClickCoord.lng)}
            </span>
          </div>

          <div className="space-y-2">
            <div>
              <label className="text-[10px] font-black text-orange-800 mb-1 block">
                標記名稱
              </label>
              <input
                type="text"
                value={newPointTitle}
                onChange={e => setNewPointTitle(e.target.value)}
                placeholder="例如: 羅馬競技場 / 特雷維噴泉"
                className="w-full bg-white border border-orange-200 rounded-xl px-3 py-2 text-xs font-bold text-cocoa outline-none focus:border-orange-500"
              />
            </div>

            {/* 可選：關聯當日既有行程項目 */}
            {unlinkedScheduleItems.length > 0 && (
              <div>
                <label className="text-[10px] font-black text-orange-800 mb-1 block">
                  或關聯今日既有行程項目：
                </label>
                <select
                  value={selectedScheduleItemId}
                  onChange={e => {
                    const itemId = e.target.value;
                    setSelectedScheduleItemId(itemId);
                    const target = unlinkedScheduleItems.find(it => it.id === itemId);
                    if (target) {
                      setNewPointTitle(target.title || target.location || '');
                    }
                  }}
                  className="w-full bg-white border border-orange-200 rounded-xl px-3 py-2 text-xs font-bold text-cocoa outline-none cursor-pointer"
                >
                  <option value="">-- 自訂新標記點 --</option>
                  {unlinkedScheduleItems.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.title || item.location} ({item.time || '未指定時間'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setPendingClickCoord(null)}
                className="flex-1 py-2 bg-white hover:bg-gray-100 text-gray-500 rounded-xl text-xs font-bold border border-orange-200 cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleConfirmAddPoint}
                className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-black shadow-sm cursor-pointer"
              >
                確認新增至 Day {currentDateInfo.dayNum}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. 未放置行程項目的快捷匯入區 (嚴格遵守：無 GPS 不猜測) */}
      {unlinkedScheduleItems.length > 0 && (
        <div className="bg-white rounded-2xl border-2 border-beige-dark p-3 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black text-cocoa flex items-center gap-1.5">
              <Footprints size={13} className="text-sage" />
              尚未加入路線的今日行程 ({unlinkedScheduleItems.length})
            </span>
            <span className="text-[10px] text-gray-400 font-bold">
              無手動 GPS 之項目需在地圖上點擊定位
            </span>
          </div>

          <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1">
            {unlinkedScheduleItems.map(item => {
              const hasGps = !!(item.gps?.lat && item.gps?.lng);
              return (
                <button
                  key={item.id}
                  onClick={() => onImportItem(selectedDate, item)}
                  className={`flex-shrink-0 text-xs font-bold px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                    hasGps
                      ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                  title={hasGps ? '含原手動 GPS，點擊立即加入' : '點擊加入（待於地圖設定座標）'}
                >
                  <span>{item.title || item.location}</span>
                  <span className={`text-[9px] px-1 py-0.2 rounded font-black ${
                    hasGps ? 'bg-blue-200 text-blue-800' : 'bg-stone-200 text-stone-600'
                  }`}>
                    {hasGps ? '手動GPS' : '待定座標'}
                  </span>
                  <Plus size={11} strokeWidth={3} />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. 每日路線時間軸 (① → ② → ③ → ④) */}
      <div className="bg-white rounded-[2rem] border-2 border-beige-dark p-4 shadow-hard-sm">
        <div className="flex items-center justify-between mb-3 pb-2 border-b-2 border-beige-dark">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-sage/20 text-sage flex items-center justify-center font-black text-xs">
              {currentDateInfo.dayNum}
            </div>
            <h3 className="text-sm font-black text-cocoa">
              Day {currentDateInfo.dayNum} 路線順序清單
            </h3>
          </div>
          <span className="text-[10px] font-bold text-gray-400">
            拖曳 Marker 或點擊箭頭可調換順序
          </span>
        </div>

        {currentDayPoints.length === 0 ? (
          <div className="text-center py-8 px-4 text-gray-400 space-y-2">
            <Compass size={28} className="mx-auto text-gray-300 animate-pulse" />
            <div className="text-xs font-bold">
              Day {currentDateInfo.dayNum} 尚未建立任何路線點
            </div>
            <div className="text-[11px] text-gray-400">
              點擊上方地圖任意處，或點擊「＋新增位置」開始手動建立路線。
            </div>
          </div>
        ) : (
          <div className="space-y-0 relative">
            {currentDayPoints.map((pt, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === currentDayPoints.length - 1;
              const circledNum = getCircledNumber(pt.sequence);
              const isConfirmed = isConfirmedPointWithCoords(pt);

              // 找尋出發至下一個點的路段
              const nextPoint = currentDayPoints[idx + 1];
              const segment = nextPoint
                ? currentDaySegments.find(s => s.fromPointId === pt.id && s.toPointId === nextPoint.id)
                : null;

              return (
                <div key={pt.id} className="relative">
                  {/* 路線點項目 */}
                  <div className={`p-3 rounded-2xl border-2 transition-all flex items-start justify-between gap-2.5 ${
                    isConfirmed 
                      ? 'bg-beige/20 border-beige-dark hover:border-sage' 
                      : 'bg-amber-50/70 border-amber-200'
                  }`}>
                    {/* 左側：編號與標題 */}
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0 shadow-sm border-2 ${
                        isConfirmed 
                          ? 'bg-sage border-white text-white' 
                          : 'bg-amber-400 border-white text-white animate-pulse'
                      }`}>
                        {circledNum}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-black text-cocoa flex items-center gap-1.5 flex-wrap">
                          <span className="truncate">{pt.title}</span>
                          {/* 座標來源標籤 */}
                          {isConfirmed ? (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-sage/15 text-sage border border-sage/30">
                              {pt.source === 'manual_map' ? '手動地圖' : pt.source === 'existing_manual_gps' ? '手動GPS' : 'Google座標'}
                            </span>
                          ) : (
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-700 border border-amber-300">
                              此位置尚未設定座標
                            </span>
                          )}
                        </div>

                        {/* 座標資訊 */}
                        <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                          {isConfirmed ? (
                            <span>📍 {formatLatLng(pt.latitude, pt.longitude)}</span>
                          ) : (
                            <span className="text-amber-600 font-bold">⚠️ 點擊地圖任意處即可標記位置</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 右側：調換順序與刪除 */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => onMovePoint(selectedDate, pt.id, 'up')}
                        disabled={isFirst}
                        className={`p-1 rounded-lg border transition-colors ${
                          isFirst 
                            ? 'text-gray-200 border-gray-100 cursor-not-allowed' 
                            : 'text-gray-500 border-beige-dark hover:bg-white cursor-pointer'
                        }`}
                        title="上移"
                      >
                        <ChevronUp size={13} strokeWidth={2.5} />
                      </button>
                      <button
                        onClick={() => onMovePoint(selectedDate, pt.id, 'down')}
                        disabled={isLast}
                        className={`p-1 rounded-lg border transition-colors ${
                          isLast 
                            ? 'text-gray-200 border-gray-100 cursor-not-allowed' 
                            : 'text-gray-500 border-beige-dark hover:bg-white cursor-pointer'
                        }`}
                        title="下移"
                      >
                        <ChevronDown size={13} strokeWidth={2.5} />
                      </button>
                      <button
                        onClick={() => onDeletePoint(pt.id)}
                        className="p-1 rounded-lg text-gray-400 hover:text-red-500 border border-beige-dark hover:border-red-200 transition-colors cursor-pointer"
                        title="刪除此點"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* 節點之間的路段 (Route Segment) */}
                  {nextPoint && (
                    <div className="my-1.5 pl-6 flex items-center gap-2">
                      <div className="w-0.5 h-6 bg-sage/60 rounded"></div>

                      {/* 交通方式選擇徽章 */}
                      {segment && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => setEditingTransportSegId(editingTransportSegId === segment.id ? null : segment.id)}
                            className="bg-white hover:bg-beige/40 px-2 py-1 rounded-xl border border-beige-dark text-[11px] font-black text-cocoa flex items-center gap-1 shadow-xs transition-all active:scale-95 cursor-pointer"
                            title="點擊切換此路段之交通方式"
                          >
                            <span>{ROUTE_TRANSPORT_CONFIG[segment.transportType]?.emoji || '🚶'}</span>
                            <span>{ROUTE_TRANSPORT_CONFIG[segment.transportType]?.label || '步行'}</span>
                            <ChevronDown size={10} className="text-gray-400" />
                          </button>

                          {/* 單段 Google Maps 導航按鈕 */}
                          {isConfirmed && isConfirmedPointWithCoords(nextPoint) && (
                            <button
                              onClick={() => handleOpenSegmentNav(pt, nextPoint, segment.transportType)}
                              className="px-2 py-1 bg-white hover:bg-sage/10 rounded-xl border border-sage/40 text-[10px] font-black text-sage flex items-center gap-1 shadow-xs transition-all active:scale-95 cursor-pointer"
                              title={`在 Google Maps 開啟此路段導航 (${ROUTE_TRANSPORT_CONFIG[segment.transportType]?.label})`}
                            >
                              <Navigation size={10} strokeWidth={2.5} />
                              <span>導航</span>
                            </button>
                          )}
                        </div>
                      )}

                      {/* 交通方式下拉選單 (若是當前正在編輯的 segment) */}
                      {segment && editingTransportSegId === segment.id && (
                        <div className="w-full my-1 p-2 bg-white rounded-2xl border-2 border-sage shadow-md flex flex-wrap gap-1 z-10 animate-scale-in">
                          {(Object.keys(ROUTE_TRANSPORT_CONFIG) as RouteTransportType[]).map(typeKey => {
                            const config = ROUTE_TRANSPORT_CONFIG[typeKey];
                            const isCurrent = segment.transportType === typeKey;
                            return (
                              <button
                                key={typeKey}
                                onClick={() => {
                                  onUpdateSegmentTransport(segment.id, typeKey);
                                  setEditingTransportSegId(null);
                                }}
                                className={`text-[10px] font-bold px-2 py-1 rounded-xl border flex items-center gap-1 transition-all cursor-pointer ${
                                  isCurrent
                                    ? 'bg-sage border-sage text-white shadow-xs font-black'
                                    : 'bg-beige/30 border-beige-dark text-cocoa hover:border-sage'
                                }`}
                              >
                                <span>{config.emoji}</span>
                                <span>{config.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 6. Google Maps 匯出與導航操作區 (全天路線 / 分段導航) */}
      <div className="bg-white rounded-[2rem] border-2 border-beige-dark p-4 shadow-hard">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sage text-white flex items-center justify-center font-black shadow-hard-sm-sage">
              <Navigation size={16} strokeWidth={2.8} />
            </div>
            <div>
              <h3 className="text-sm font-black text-cocoa">
                Google Maps 路線導航
              </h3>
              <p className="text-[10px] text-gray-400 font-bold">
                單向匯出 Trip Mochi 座標至 Google Maps 官方導航
              </p>
            </div>
          </div>

          <span className="text-[9px] font-black text-sage bg-sage/15 border border-sage/30 px-2 py-0.5 rounded-full">
            零 API Key · 免費
          </span>
        </div>

        {/* 驗證提示：若有點位尚未設定座標 */}
        {unconfirmedPoints.length > 0 && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-3 mb-3 text-amber-900 text-xs">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-black text-amber-950">
                  ⚠️ {unconfirmedPoints.map(p => `第${p.sequence}站「${p.title}」`).join('、')} 尚未設定位置
                </div>
                <div className="text-[11px] text-amber-700 mt-0.5">
                  依原則：Trip Mochi 絕不自動猜測座標。請點擊上方地圖手動設定位置後，方可建立完整 Google Maps 路線。
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 混合交通警示 (明確遵守原則八) */}
        {hasAllCoordsConfirmed && isMixedTransport && (
          <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-3 mb-3 text-orange-900 text-xs">
            <div className="flex items-start gap-2">
              <Info size={16} className="text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-black text-orange-950">
                  混合交通提示 (不同交通段)
                </div>
                <div className="text-[11px] text-orange-800 leading-relaxed mt-0.5">
                  Google Maps 單一路線 URL 不支援在同一連結中混合指定步行與地鐵。
                  若點擊「完整路線」，Google Maps 將自行重新計算交通方式；若需要精準工具模式，建議使用「分段開啟 Google Maps」。
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 路線已分段提示 (若點位超過 Google Maps Waypoints 限制) */}
        {routeLegGroups.some(g => g.isMultiPart) && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-3 mb-3 text-blue-900 text-xs flex items-center gap-2">
            <Split size={16} className="text-blue-500 flex-shrink-0" />
            <div className="text-[11px] text-blue-800 leading-normal">
              💡 路線點較多（共 {currentDayPoints.length} 站），為避免 Google Maps 限制，已自動為您切成 {routeLegGroups.length} 段導航。
            </div>
          </div>
        )}

        {/* 導航按鈕操作區 */}
        <div className="space-y-2">
          {hasAllCoordsConfirmed ? (
            <>
              {/* 若有多段 (Multi-part) */}
              {routeLegGroups.length > 1 ? (
                <div className="space-y-2">
                  <div className="text-xs font-black text-cocoa">
                    已自動切成 {routeLegGroups.length} 段 Google Maps 路線：
                  </div>
                  {routeLegGroups.map(leg => (
                    <button
                      key={leg.partIndex}
                      onClick={() => handleOpenGoogleMapsFullRoute(leg.url)}
                      className="w-full py-3 px-4 rounded-2xl font-black text-white bg-sage hover:bg-sage-dark shadow-hard-sm border-2 border-sage active:translate-y-0.5 transition-all flex items-center justify-between text-xs cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <Navigation size={14} strokeWidth={2.5} />
                        <span>開啟 {leg.label}</span>
                      </span>
                      <ExternalLink size={14} />
                    </button>
                  ))}
                </div>
              ) : (
                /* 單段完整路線按鈕 */
                <button
                  onClick={() => handleOpenGoogleMapsFullRoute(routeLegGroups[0]?.url || '')}
                  className="w-full py-3.5 px-4 rounded-2xl font-black text-white bg-sage hover:bg-sage-dark shadow-hard-sm border-2 border-sage active:translate-y-0.5 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
                >
                  <Navigation size={16} strokeWidth={2.8} />
                  <span>
                    在 Google Maps 開啟 Day {currentDateInfo.dayNum} 完整路線
                    {!isMixedTransport && ` (${ROUTE_TRANSPORT_CONFIG[dominantTransportType]?.label || '步行'})`}
                  </span>
                  <ExternalLink size={14} />
                </button>
              )}

              {/* 分段導航收合切換 */}
              {currentDaySegments.length > 0 && (
                <div className="pt-2">
                  <button
                    onClick={() => setShowSegmentDetails(prev => !prev)}
                    className="w-full py-2.5 rounded-xl border-2 border-beige-dark text-xs font-bold text-cocoa hover:bg-beige/30 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>{showSegmentDetails ? '收合分段導航清單' : '分段開啟 Google Maps 導航'}</span>
                    <ChevronDown size={13} className={`transform transition-transform ${showSegmentDetails ? 'rotate-180' : ''}`} />
                  </button>

                  {showSegmentDetails && (
                    <div className="mt-2 space-y-1.5 pl-1 animate-scale-in">
                      {currentDaySegments.map((seg, sIdx) => {
                        const fromPt = currentDayPoints.find(p => p.id === seg.fromPointId);
                        const toPt = currentDayPoints.find(p => p.id === seg.toPointId);
                        if (!fromPt || !toPt) return null;
                        const config = ROUTE_TRANSPORT_CONFIG[seg.transportType];

                        return (
                          <div
                            key={seg.id}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-beige/20 border border-beige-dark text-xs"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className="font-bold text-cocoa">
                                {getCircledNumber(fromPt.sequence)} → {getCircledNumber(toPt.sequence)}
                              </span>
                              <span className="text-[11px] text-gray-500 truncate">
                                {fromPt.title} 到 {toPt.title}
                              </span>
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white text-cocoa border border-beige-dark">
                                {config.emoji} {config.label}
                              </span>
                            </div>

                            <button
                              onClick={() => handleOpenSegmentNav(fromPt, toPt, seg.transportType)}
                              className="px-2.5 py-1 bg-white hover:bg-sage text-sage hover:text-white rounded-lg border border-sage font-black text-xs flex items-center gap-1 transition-colors cursor-pointer flex-shrink-0"
                            >
                              <Navigation size={11} strokeWidth={2.5} />
                              <span>導航</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <button
              disabled
              className="w-full py-3.5 px-4 rounded-2xl font-black text-gray-300 bg-gray-100 border-2 border-gray-200 cursor-not-allowed flex items-center justify-center gap-2 text-sm"
            >
              <Navigation size={16} />
              <span>
                {currentDayPoints.length < 2
                  ? '請至少標記 2 個點位以建立路線'
                  : '尚有未設定座標之點位，無法匯出路線'}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
