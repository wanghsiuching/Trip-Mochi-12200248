import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Layers, 
  ListFilter, 
  Maximize2, 
  RotateCcw, 
  Navigation, 
  MapPin, 
  AlertCircle, 
  ArrowRight,
  ExternalLink,
  Clock,
  Sparkles,
  Compass
} from 'lucide-react';
import { 
  ScheduleItem, 
  TripDate, 
  BookingAccommodation, 
  BookingFlight, 
  BookingCarRental, 
  PocketItem 
} from '../../types';
import { 
  NormalizedMapItem, 
  GeoCoordinate, 
  MapItemCategory, 
  extractCoordinates, 
  OpenStreetMapProvider, 
  SequenceRoutingProvider, 
  RouteSegment,
  GoogleMapsUrlBuilder
} from './MapProvider';
import { createLeafletMarkerIcon, MapMarkerBadge, getCategoryColor } from './MapMarker';
import { MapFilters, FilterCategory } from './MapFilters';
import { createSequencePolylineLayer, MapRouteBadge } from './MapRoute';
import { ExternalMapButton } from './ExternalMapButton';

interface TripMapViewProps {
  scheduleItems: ScheduleItem[];
  dates: TripDate[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  accommodations?: BookingAccommodation[];
  flights?: BookingFlight[];
  carRentals?: BookingCarRental[];
  pocketItems?: PocketItem[];
  onSwitchToListView: () => void;
  onViewInSchedule?: (itemId: string) => void;
  onEditItem?: (item: ScheduleItem) => void;
  className?: string;
}

export const TripMapView: React.FC<TripMapViewProps> = ({
  scheduleItems = [],
  dates = [],
  selectedDate,
  onSelectDate,
  accommodations = [],
  flights = [],
  carRentals = [],
  pocketItems = [],
  onSwitchToListView,
  onViewInSchedule,
  onEditItem,
  className = ''
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const bottomScrollRef = useRef<HTMLDivElement>(null);

  // 狀態管理
  const [isAllDatesMode, setIsAllDatesMode] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('all');
  const [selectedItemId, setSelectedItemId] = useState<string | number | null>(null);
  const [routeSegment, setRouteSegment] = useState<RouteSegment | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  // 目前選擇日期的索引 (方便 上一天 / 下一天 切換)
  const currentDayIndex = useMemo(() => {
    return dates.findIndex(d => d.date === selectedDate);
  }, [dates, selectedDate]);

  const currentTripDate = useMemo(() => {
    return dates.find(d => d.date === selectedDate) || dates[0] || null;
  }, [dates, selectedDate]);

  // 1. 將各種來源的行程資料正規化為 MapItem
  const allNormalizedItems = useMemo<NormalizedMapItem[]>(() => {
    const list: NormalizedMapItem[] = [];

    // (A) ScheduleItems
    scheduleItems.forEach((item) => {
      const coords = extractCoordinates(item);
      if (!coords) return;

      let cat: MapItemCategory = 'spot';
      let catLabel = '景點';
      if (item.type === 'food') {
        cat = 'food';
        catLabel = '美食';
      } else if (item.type === 'stay') {
        cat = 'stay';
        catLabel = '住宿';
      } else if (item.type === 'transport' || item.type === 'flight') {
        cat = 'transport';
        catLabel = '交通';
      }

      list.push({
        id: item.id,
        sequenceNumber: 0, // 後續依日期動態排序後指定
        time: item.time || '',
        title: item.title || item.location || '未命名行程',
        category: cat,
        categoryLabel: catLabel,
        address: item.address || item.location || '',
        notes: item.notes || item.note || '',
        coordinates: coords,
        originalItem: item,
        itemSource: 'schedule',
        date: item.date,
      });
    });

    // (B) 住宿 Accommodations
    accommodations.forEach((acc) => {
      const coords = extractCoordinates(acc);
      if (!coords) return;

      list.push({
        id: `acc-${acc.id}`,
        sequenceNumber: 0,
        time: acc.checkInTime || '入住',
        title: acc.name || '飯店/住宿',
        category: 'stay',
        categoryLabel: '住宿',
        address: acc.address || acc.city || '',
        notes: acc.note || (acc.nights ? `住宿 ${acc.nights} 晚` : ''),
        coordinates: coords,
        originalItem: acc,
        itemSource: 'booking',
        date: acc.checkInDate,
      });
    });

    // (C) 租車取車點 CarRentals
    carRentals.forEach((car) => {
      const coords = extractCoordinates(car);
      if (!coords) return;

      list.push({
        id: `car-${car.id}`,
        sequenceNumber: 0,
        time: car.pickupTime || '取車',
        title: `${car.company || ''} ${car.carModel || '租車'}`,
        category: 'transport',
        categoryLabel: '租車',
        address: car.pickupLocation || '',
        notes: car.note || '',
        coordinates: coords,
        originalItem: car,
        itemSource: 'booking',
        date: car.pickupDate,
      });
    });

    // (D) 口袋地點 PocketItems (若有指定日期)
    pocketItems.forEach((pocket) => {
      const coords = extractCoordinates(pocket);
      if (!coords) return;

      let cat: MapItemCategory = 'spot';
      let catLabel = '口袋景點';
      if (pocket.category === 'food') {
        cat = 'food';
        catLabel = '口袋美食';
      } else if (pocket.category === 'shopping') {
        cat = 'other';
        catLabel = '購物清單';
      }

      list.push({
        id: `pocket-${pocket.id}`,
        sequenceNumber: 0,
        time: '',
        title: pocket.title || '口袋清單地點',
        category: cat,
        categoryLabel: catLabel,
        address: pocket.location || '',
        notes: pocket.notes || '',
        coordinates: coords,
        originalItem: pocket,
        itemSource: 'pocket',
        date: pocket.assignedDate || '',
      });
    });

    return list;
  }, [scheduleItems, accommodations, carRentals, pocketItems]);

  // 2. 依照所選日期過濾 (或全部日期模式)
  const dateFilteredItems = useMemo<NormalizedMapItem[]>(() => {
    let filtered = allNormalizedItems;

    if (!isAllDatesMode && selectedDate) {
      filtered = allNormalizedItems.filter((item) => {
        if (!item.date) return true; // 若無特定日期則保留
        return item.date === selectedDate;
      });
    }

    // 依時間先後順序或自訂順序排序
    filtered.sort((a, b) => {
      // 若是 schedule item 且有 order，優先依 order
      const orderA = a.originalItem?.order ?? 999;
      const orderB = b.originalItem?.order ?? 999;
      if (orderA !== orderB) return orderA - orderB;

      // 否則依時間
      const timeA = a.time || '99:99';
      const timeB = b.time || '99:99';
      return timeA.localeCompare(timeB);
    });

    // 重新賦予順序編號 ①②③④...
    return filtered.map((item, idx) => ({
      ...item,
      sequenceNumber: idx + 1,
    }));
  }, [allNormalizedItems, isAllDatesMode, selectedDate]);

  // 3. 各類別數量統計
  const categoryCounts = useMemo(() => {
    const counts: Record<FilterCategory, number> = {
      all: dateFilteredItems.length,
      spot: 0,
      food: 0,
      stay: 0,
      transport: 0,
      other: 0,
    };

    dateFilteredItems.forEach((item) => {
      counts[item.category] = (counts[item.category] || 0) + 1;
    });

    return counts;
  }, [dateFilteredItems]);

  // 4. 依照類別標籤過濾
  const displayedItems = useMemo<NormalizedMapItem[]>(() => {
    if (selectedCategory === 'all') return dateFilteredItems;
    return dateFilteredItems.filter(item => item.category === selectedCategory);
  }, [dateFilteredItems, selectedCategory]);

  // 5. 當日所有點的座標序列 (用於畫順序 Polyline 與整日 Google Maps 導航)
  const currentSequenceCoords = useMemo<GeoCoordinate[]>(() => {
    return dateFilteredItems.map(item => item.coordinates);
  }, [dateFilteredItems]);

  // 初始化 Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    try {
      // 預設中心 (東京/台北折衷預設，若有點會立即 fitBounds)
      const map = L.map(mapContainerRef.current, {
        center: [35.6812, 139.7671],
        zoom: 12,
        zoomControl: false, // 自訂定位控制項以符合手機版
        attributionControl: false,
      });

      // 載入 OpenStreetMap 合規圖資
      L.tileLayer(OpenStreetMapProvider.tileUrl, {
        maxZoom: OpenStreetMapProvider.options.maxZoom,
        minZoom: OpenStreetMapProvider.options.minZoom,
      }).addTo(map);

      // 加入自訂小型合規 attribution
      L.control.attribution({
        position: 'bottomright',
        prefix: '<span class="text-[9px] text-gray-400 opacity-80">&copy; OSM</span>'
      }).addTo(map);

      // 圖層群組
      const markersLayer = L.layerGroup().addTo(map);
      markersLayerRef.current = markersLayer;

      mapInstanceRef.current = map;
      setMapError(null);

      // 延遲重整尺寸避免手機隱藏切換後的灰塊
      setTimeout(() => {
        map.invalidateSize();
      }, 200);
    } catch (err: any) {
      console.error('Leaflet 地圖初始化失敗:', err);
      setMapError('地圖載入遇到問題，請確認網路連線或稍後再試。');
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 更新地圖標記與順序 Polyline
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    // 清除舊 Marker
    markersLayer.clearLayers();

    // 清除舊 Polyline
    if (routePolylineRef.current) {
      map.removeLayer(routePolylineRef.current);
      routePolylineRef.current = null;
    }

    // 建立新 Marker
    const bounds = L.latLngBounds([]);

    displayedItems.forEach((item) => {
      const isSelected = selectedItemId === item.id;
      const icon = createLeafletMarkerIcon(item, isSelected);

      const marker = L.marker([item.coordinates.lat, item.coordinates.lng], {
        icon,
        zIndexOffset: isSelected ? 1000 : 100,
      });

      // 綁定點擊事件
      marker.on('click', () => {
        setSelectedItemId(item.id);

        // 滾動下方行程卡片到對應位置
        if (bottomScrollRef.current) {
          const cardEl = bottomScrollRef.current.querySelector(`[data-map-item-id="${item.id}"]`);
          if (cardEl) {
            cardEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
          }
        }
      });

      // 綁定 Popup
      const mapsUrl = GoogleMapsUrlBuilder.searchUrl(item.coordinates, item.title);
      const popupHtml = `
        <div class="p-3 font-['Zen_Maru_Gothic']">
          <div class="flex items-center gap-1.5 mb-1.5">
            <span class="w-5 h-5 rounded-full bg-[#5B8266] text-white text-[11px] font-black flex items-center justify-center">${item.sequenceNumber}</span>
            <span class="text-[10px] font-bold text-[#5B8266] bg-[#88C9A1]/15 px-2 py-0.5 rounded-full">${item.categoryLabel}</span>
            ${item.time ? `<span class="text-[10px] font-bold text-gray-500 ml-auto">${item.time}</span>` : ''}
          </div>
          <h4 class="text-xs font-black text-[#4A3E3D] leading-snug mb-1">${escapeHtml(item.title)}</h4>
          ${item.address ? `<p class="text-[10px] text-gray-500 line-clamp-1 mb-2">${escapeHtml(item.address)}</p>` : ''}
          <div class="flex items-center gap-1.5 pt-1.5 border-t border-[#E0E5D5]">
            <a 
              href="${mapsUrl}" 
              target="_blank" 
              rel="noopener noreferrer" 
              class="flex-1 text-center py-1 px-2 bg-[#5B8266] text-white rounded-lg text-[10px] font-bold"
            >
              Google Maps
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        closeButton: false,
        offset: [0, -10],
        maxWidth: 240,
        className: 'trip-mochi-popup',
      });

      markersLayer.addLayer(marker);
      bounds.extend([item.coordinates.lat, item.coordinates.lng]);
    });

    // 繪製行程順序 Polyline
    if (currentSequenceCoords.length >= 2) {
      const routingProvider = new SequenceRoutingProvider();
      routingProvider.calculateRoute(currentSequenceCoords).then((segment) => {
        setRouteSegment(segment);
        if (mapInstanceRef.current) {
          const polyline = createSequencePolylineLayer(segment.coordinates);
          polyline.addTo(mapInstanceRef.current);
          routePolylineRef.current = polyline;
        }
      });
    } else {
      setRouteSegment(null);
    }

    // 自動縮放至涵蓋所有標記點
    if (bounds.isValid()) {
      map.fitBounds(bounds, {
        paddingTopLeft: [30, 90],
        paddingBottomRight: [30, 160],
        maxZoom: 15,
        animate: true,
      });
    }
  }, [displayedItems, selectedItemId, currentSequenceCoords]);

  // 當使用者點選下方卡片時，地圖滑行到該 Marker
  const handleCardClick = (item: NormalizedMapItem) => {
    setSelectedItemId(item.id);
    const map = mapInstanceRef.current;
    if (map) {
      map.flyTo([item.coordinates.lat, item.coordinates.lng], 15, {
        duration: 0.6,
      });
    }
  };

  // 重新置中
  const handleResetBounds = () => {
    const map = mapInstanceRef.current;
    if (!map || displayedItems.length === 0) return;
    const bounds = L.latLngBounds(displayedItems.map(i => [i.coordinates.lat, i.coordinates.lng]));
    if (bounds.isValid()) {
      map.fitBounds(bounds, {
        paddingTopLeft: [30, 90],
        paddingBottomRight: [30, 160],
        maxZoom: 15,
        animate: true,
      });
    }
  };

  // 日期切換：上一天
  const handlePrevDay = () => {
    if (dates.length === 0) return;
    setIsAllDatesMode(false);
    if (currentDayIndex > 0) {
      onSelectDate(dates[currentDayIndex - 1].date);
    } else {
      onSelectDate(dates[dates.length - 1].date);
    }
  };

  // 日期切換：下一天
  const handleNextDay = () => {
    if (dates.length === 0) return;
    setIsAllDatesMode(false);
    if (currentDayIndex < dates.length - 1) {
      onSelectDate(dates[currentDayIndex + 1].date);
    } else {
      onSelectDate(dates[0].date);
    }
  };

  return (
    <div className={`relative w-full h-[calc(100vh-140px)] min-h-[500px] flex flex-col bg-[#F7F4EB] overflow-hidden rounded-2xl border border-[#E0E5D5] shadow-sm ${className}`}>
      
      {/* 頂部操作控制列 (日期切換、全部日期切換、模式切換) */}
      <div className="z-20 bg-white/95 backdrop-blur-md border-b border-[#E0E5D5] px-3 pt-2.5 pb-2 flex flex-col gap-2 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          {/* 左側：日期切換元件 [上一天] [日期] [下一天] */}
          <div className="flex items-center gap-1 bg-[#F7F4EB] p-1 rounded-2xl border border-[#E0E5D5]">
            <button
              type="button"
              onClick={handlePrevDay}
              disabled={isAllDatesMode || dates.length <= 1}
              title="上一天"
              className="p-1 rounded-xl hover:bg-white text-[#4A3E3D] disabled:opacity-30 active:scale-95 transition-all"
            >
              <ChevronLeft size={16} strokeWidth={2.5} />
            </button>

            <button
              type="button"
              onClick={() => setIsAllDatesMode(false)}
              className={`px-2.5 py-1 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                !isAllDatesMode
                  ? 'bg-white text-[#4A3E3D] shadow-sm border border-[#E0E5D5]/70'
                  : 'text-gray-400 hover:text-[#4A3E3D]'
              }`}
            >
              <Calendar size={13} className="text-[#88C9A1]" />
              <span>
                {currentTripDate 
                  ? `Day ${currentTripDate.dayNum} · ${currentTripDate.monthDay || currentTripDate.date}` 
                  : '選擇日期'}
              </span>
            </button>

            <button
              type="button"
              onClick={handleNextDay}
              disabled={isAllDatesMode || dates.length <= 1}
              title="下一天"
              className="p-1 rounded-xl hover:bg-white text-[#4A3E3D] disabled:opacity-30 active:scale-95 transition-all"
            >
              <ChevronRight size={16} strokeWidth={2.5} />
            </button>
          </div>

          {/* 中右側：全部日期切換模式 */}
          <button
            type="button"
            onClick={() => setIsAllDatesMode(!isAllDatesMode)}
            className={`px-3 py-1.5 rounded-2xl text-xs font-bold transition-all border flex items-center gap-1.5 shadow-sm active:scale-95 ${
              isAllDatesMode
                ? 'bg-[#88C9A1] border-[#88C9A1] text-white shadow-hard-sm-sage'
                : 'bg-white border-[#E0E5D5] text-[#4A3E3D] hover:border-[#88C9A1]'
            }`}
          >
            <Layers size={13} />
            <span>全部日期</span>
          </button>

          {/* 右側：返回列表模式按鈕 */}
          <button
            type="button"
            onClick={onSwitchToListView}
            className="px-3 py-1.5 rounded-2xl bg-[#4A3E3D] text-white text-xs font-bold hover:bg-[#3D312A] active:scale-95 transition-all flex items-center gap-1.5 shadow-sm ml-auto"
            title="返回行程詳細清單"
          >
            <ListFilter size={13} />
            <span>列表模式</span>
          </button>
        </div>

        {/* 篩選標籤列：[全部] [景點] [餐廳] [住宿] [交通] [其他] */}
        <MapFilters
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          counts={categoryCounts}
        />
      </div>

      {/* 地圖主要容器 */}
      <div className="relative flex-1 w-full h-full bg-[#FAF8F2]">
        {/* Leaflet DOM 節點 */}
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* 錯誤回退提示 */}
        {mapError && (
          <div className="absolute inset-0 z-30 bg-[#F7F4EB]/95 flex flex-col items-center justify-center p-6 text-center">
            <AlertCircle size={36} className="text-orange-500 mb-2" />
            <h4 className="text-base font-black text-[#4A3E3D] mb-1">地圖載入提示</h4>
            <p className="text-xs text-gray-500 max-w-xs mb-4">{mapError}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-[#88C9A1] text-white rounded-xl text-xs font-bold shadow-sm"
            >
              重新整理
            </button>
          </div>
        )}

        {/* 浮動控制鈕群：置中復位、整日導航 */}
        <div className="absolute top-3 right-3 z-20 flex flex-col gap-2 pointer-events-auto">
          {displayedItems.length > 0 && (
            <button
              type="button"
              onClick={handleResetBounds}
              title="適應全景"
              className="p-2.5 rounded-2xl bg-white/95 backdrop-blur-sm border border-[#E0E5D5] text-[#4A3E3D] hover:text-[#5B8266] hover:border-[#88C9A1] shadow-sm active:scale-95 transition-all flex items-center justify-center"
            >
              <RotateCcw size={16} strokeWidth={2.4} />
            </button>
          )}
        </div>

        {/* 浮動行程順序線說明徽章 */}
        <div className="absolute top-3 left-3 z-20 pointer-events-none">
          <MapRouteBadge points={currentSequenceCoords} routeSegment={routeSegment} />
        </div>

        {/* 無座標行程之友善提示 (Fallback) */}
        {displayedItems.length === 0 && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 w-[90%] max-w-sm bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-[#E0E5D5] shadow-lg text-center">
            <div className="w-8 h-8 rounded-full bg-[#88C9A1]/15 text-[#5B8266] flex items-center justify-center mx-auto mb-1.5">
              <MapPin size={18} />
            </div>
            <p className="text-xs font-black text-[#4A3E3D] mb-1">
              {isAllDatesMode ? '行程中尚無包含座標的地點' : '本日尚無包含經緯度座標的行程'}
            </p>
            <p className="text-[11px] text-gray-400 leading-relaxed mb-2.5">
              在列表模式編輯行程時填入地址或 GPS 座標，即可自動在此地圖上顯示編號標記與順序線！
            </p>
            <button
              type="button"
              onClick={onSwitchToListView}
              className="px-3 py-1.5 bg-[#88C9A1] text-white rounded-xl text-xs font-bold shadow-sm inline-flex items-center gap-1 active:scale-95"
            >
              <span>切換回列表編輯行程</span>
              <ArrowRight size={12} />
            </button>
          </div>
        )}
      </div>

      {/* 底部可橫向滑動的當日行程卡片 (Bottom Slider) */}
      <div className="z-20 bg-white/90 backdrop-blur-md border-t border-[#E0E5D5] p-2">
        <div className="flex items-center justify-between px-2 mb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-[#4A3E3D]">
            <Compass size={14} className="text-[#88C9A1]" />
            <span>
              {isAllDatesMode ? '全部日期地點清單' : `${currentTripDate?.monthDay || '本日'} 站點序列`}
            </span>
            <span className="text-[10px] text-gray-400 font-mono">({displayedItems.length})</span>
          </div>

          {/* 整日 Google Maps 多點導航按鈕 */}
          {currentSequenceCoords.length > 0 && (
            <ExternalMapButton
              multiStops={currentSequenceCoords}
              label="整日路線導航"
              variant="compact"
              className="py-1 text-[11px]"
            />
          )}
        </div>

        {/* 橫向滑動卡片容器 */}
        <div
          ref={bottomScrollRef}
          className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1 pt-0.5 px-1 snap-x touch-pan-x"
        >
          {displayedItems.map((item) => {
            const isSelected = selectedItemId === item.id;
            const categoryTheme = getCategoryColor(item.category);

            return (
              <div
                key={item.id}
                data-map-item-id={item.id}
                onClick={() => handleCardClick(item)}
                className={`flex-shrink-0 w-64 p-3 rounded-2xl border-2 transition-all cursor-pointer snap-center select-none ${
                  isSelected
                    ? 'bg-[#FFFDF9] border-[#88C9A1] shadow-hard-sm-sage scale-[1.02]'
                    : 'bg-white/95 border-[#E0E5D5] hover:border-[#88C9A1]/60'
                }`}
              >
                {/* 卡片頭部：順序編號、類別標籤、時間 */}
                <div className="flex items-center justify-between gap-1.5 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <MapMarkerBadge
                      sequenceNumber={item.sequenceNumber}
                      category={item.category}
                      size="sm"
                    />
                    <span
                      style={{
                        backgroundColor: categoryTheme.light,
                        color: categoryTheme.dark,
                        borderColor: categoryTheme.border,
                      }}
                      className="px-2 py-0.5 rounded-full text-[10px] font-black border"
                    >
                      {item.categoryLabel}
                    </span>
                  </div>

                  {item.time && (
                    <div className="flex items-center gap-1 text-[11px] font-bold text-gray-400">
                      <Clock size={11} className="text-[#88C9A1]" />
                      <span>{item.time}</span>
                    </div>
                  )}
                </div>

                {/* 地點名稱 */}
                <h4 className="text-xs font-black text-[#4A3E3D] line-clamp-1 mb-1">
                  {item.title}
                </h4>

                {/* 地址簡述 */}
                {item.address && (
                  <p className="text-[10px] text-gray-500 line-clamp-1 mb-2 flex items-center gap-1">
                    <MapPin size={10} className="text-[#88C9A1] flex-shrink-0" />
                    <span>{item.address}</span>
                  </p>
                )}

                {/* 底部功能鍵：[查看行程] 與 [導航] */}
                <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-[#E0E5D5]/60">
                  {item.itemSource === 'schedule' && onViewInSchedule && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewInSchedule(String(item.id));
                      }}
                      className="text-[10px] font-bold text-[#5B8266] hover:underline flex items-center gap-0.5"
                    >
                      <span>在清單檢視</span>
                      <ArrowRight size={10} />
                    </button>
                  )}

                  <div className="ml-auto">
                    <ExternalMapButton
                      coordinates={item.coordinates}
                      title={item.title}
                      label="導航"
                      variant="compact"
                      className="py-0.5 px-2 text-[10px]"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
