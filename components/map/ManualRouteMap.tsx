import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import L from 'leaflet';
import { 
  MapPin, Plus, Edit3, Check, Trash2, ArrowUp, ArrowDown, 
  Layers, Compass, AlertCircle, RefreshCw, Eye, Sparkles,
  ChevronDown, ChevronUp, Navigation, Calendar
} from 'lucide-react';
import { 
  ManualMapPoint, 
  ManualRouteSegment, 
  ManualTransportType, 
  MapPointType, 
  ScheduleItem, 
  TripDate, 
  TripDay,
  getCircledNumber 
} from '../../types';
import { 
  MANUAL_TRANSPORT_CONFIG, 
  POINT_TYPE_CONFIG 
} from '../../constants/manualTransportConfig';
import { AddMapPointModal } from './AddMapPointModal';
import { SegmentDetailModal } from './SegmentDetailModal';
import { MapPointDetailModal } from './MapPointDetailModal';

interface ManualRouteMapProps {
  tripId: string;
  tripDays: TripDay[];
  dates: TripDate[];
  scheduleItems: ScheduleItem[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  mapPoints: ManualMapPoint[];
  routeSegments: ManualRouteSegment[];
  onAddPoint: (
    pointData: {
      day: string;
      dayIndex?: number;
      title: string;
      latitude: number;
      longitude: number;
      scheduleItemId?: string;
      pointType: MapPointType;
      notes?: string;
    },
    transportFromPrev?: ManualTransportType
  ) => void;
  onUpdatePointLocation: (pointId: string, lat: number, lng: number) => void;
  onDeletePoint: (pointId: string, day: string) => void;
  onReorderPoints: (day: string, reorderedPoints: ManualMapPoint[]) => void;
  onUpdateSegmentTransport: (segmentId: string, transportType: ManualTransportType, extra?: Partial<ManualRouteSegment>) => void;
  onUpdatePointTitle?: (pointId: string, title: string, pointType: MapPointType) => void;
  onJumpToSchedule?: (date: string, itemId: string) => void;
}

export const ManualRouteMap: React.FC<ManualRouteMapProps> = ({
  tripId,
  tripDays,
  dates,
  scheduleItems,
  selectedDate,
  onSelectDate,
  mapPoints,
  routeSegments,
  onAddPoint,
  onUpdatePointLocation,
  onDeletePoint,
  onReorderPoints,
  onUpdateSegmentTransport,
  onUpdatePointTitle,
  onJumpToSchedule
}) => {
  // Mode: View mode vs Edit mode
  const [isEditMode, setIsEditMode] = useState<boolean>(false);

  // Day filter: 'ALL' or specific day date string
  const [filterDay, setFilterDay] = useState<string>(() => {
    return selectedDate || (dates.length > 0 ? dates[0].date : 'ALL');
  });

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [pendingClickCoords, setPendingClickCoords] = useState<{ lat: number; lng: number } | null>(null);

  const [selectedSegment, setSelectedSegment] = useState<ManualRouteSegment | null>(null);
  const [isSegmentModalOpen, setIsSegmentModalOpen] = useState<boolean>(false);

  const [selectedPoint, setSelectedPoint] = useState<ManualMapPoint | null>(null);
  const [isPointModalOpen, setIsPointModalOpen] = useState<boolean>(false);

  // Map DOM and instance refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersGroupRef = useRef<L.LayerGroup | null>(null);

  // Sync filterDay if selectedDate changes externally
  useEffect(() => {
    if (selectedDate && filterDay !== 'ALL' && filterDay !== selectedDate) {
      setFilterDay(selectedDate);
    }
  }, [selectedDate]);

  // Current day index (1-based)
  const currentDayIndex = useMemo(() => {
    if (filterDay === 'ALL') return undefined;
    const idx = tripDays.findIndex(d => d.date === filterDay);
    return idx >= 0 ? idx + 1 : undefined;
  }, [filterDay, tripDays]);

  // Filtered points based on filterDay
  const displayedPoints = useMemo(() => {
    if (filterDay === 'ALL') {
      return [...mapPoints].sort((a, b) => {
        if (a.day !== b.day) return (a.day || '').localeCompare(b.day || '');
        return a.sequence - b.sequence;
      });
    }
    return mapPoints
      .filter(p => p.day === filterDay)
      .sort((a, b) => a.sequence - b.sequence);
  }, [mapPoints, filterDay]);

  // Schedule items for current active day
  const currentDayScheduleItems = useMemo(() => {
    if (filterDay === 'ALL') return scheduleItems;
    return scheduleItems.filter(item => item.date === filterDay);
  }, [scheduleItems, filterDay]);

  // Determine initial center
  const defaultCenter = useMemo<[number, number]>(() => {
    if (displayedPoints.length > 0) {
      return [displayedPoints[0].latitude, displayedPoints[0].longitude];
    }
    if (mapPoints.length > 0) {
      return [mapPoints[0].latitude, mapPoints[0].longitude];
    }
    // Fallback: If trip name or schedule has hints
    return [46.8182, 8.2275]; // Switzerland default
  }, [displayedPoints, mapPoints]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: 12,
      zoomControl: false,
      attributionControl: false
    });

    // CartoDB Voyager tiles - warm, clean, aesthetic
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    // Zoom control on top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    layersGroupRef.current = layerGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle map click for adding points in edit mode
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (!isEditMode) return;
      // Do not trigger if clicked on a marker or control
      const target = e.originalEvent.target as HTMLElement;
      if (target && target.closest('.leaflet-marker-icon, .leaflet-control')) {
        return;
      }

      setPendingClickCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
      setIsAddModalOpen(true);
    };

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [isEditMode, filterDay]);

  // Render Markers and Polylines
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layers = layersGroupRef.current;
    if (!map || !layers) return;

    layers.clearLayers();

    // Group points by day to ensure absolute separation (No cross-day lines)
    const pointsByDay = new Map<string, ManualMapPoint[]>();

    displayedPoints.forEach(pt => {
      const dayKey = pt.day || 'default';
      const arr = pointsByDay.get(dayKey) || [];
      arr.push(pt);
      pointsByDay.set(dayKey, arr);
    });

    // 1. Draw Polylines & Transit Badges per day independently
    pointsByDay.forEach((dayPts, dayKey) => {
      const sortedPts = [...dayPts].sort((a, b) => a.sequence - b.sequence);

      for (let i = 0; i < sortedPts.length - 1; i++) {
        const p1 = sortedPts[i];
        const p2 = sortedPts[i + 1];

        // Find route segment connecting p1 and p2
        const segment = routeSegments.find(s => 
          s.day === dayKey && s.fromPointId === p1.id && s.toPointId === p2.id
        ) || routeSegments.find(s => 
          (s.fromPointId === p1.id && s.toPointId === p2.id) ||
          (s.fromPointId === p2.id && s.toPointId === p1.id)
        );

        const transportType: ManualTransportType = segment?.transportType || 'WALK';
        const styleConf = MANUAL_TRANSPORT_CONFIG[transportType] || MANUAL_TRANSPORT_CONFIG.WALK;

        const latlngs: [number, number][] = [
          [p1.latitude, p1.longitude],
          [p2.latitude, p2.longitude]
        ];

        // Draw train double-line effect or outline if train
        if (transportType === 'TRAIN') {
          // Bottom broader track line
          const railBase = L.polyline(latlngs, {
            color: '#1E3A8A',
            weight: 7,
            opacity: 0.85
          });
          layers.addLayer(railBase);

          // Top dashed track line
          const railDash = L.polyline(latlngs, {
            color: '#FFFFFF',
            weight: 3,
            dashArray: '8, 8',
            opacity: 0.95
          });
          layers.addLayer(railDash);
        } else {
          // Standard polyline with configured styling
          const polyline = L.polyline(latlngs, {
            color: styleConf.color,
            weight: styleConf.weight,
            dashArray: styleConf.dashArray,
            opacity: 0.9
          });

          // Polyline click handler
          polyline.on('click', (e) => {
            L.DomEvent.stopPropagation(e);
            if (segment) {
              setSelectedSegment(segment);
              setIsSegmentModalOpen(true);
            }
          });

          layers.addLayer(polyline);
        }

        // Midpoint transit badge
        const midLat = (p1.latitude + p2.latitude) / 2;
        const midLng = (p1.longitude + p2.longitude) / 2;

        const badgeIcon = L.divIcon({
          className: 'custom-transit-badge',
          html: `
            <div class="cursor-pointer transform hover:scale-115 transition-transform flex items-center justify-center">
              <div class="px-2 py-0.5 rounded-full shadow-md border-2 border-white flex items-center gap-1 text-[11px] font-black text-white" style="background-color: ${styleConf.color};">
                <span>${styleConf.emoji}</span>
                <span class="text-[10px] hidden sm:inline">${styleConf.shortLabel}</span>
              </div>
            </div>
          `,
          iconSize: [60, 24],
          iconAnchor: [30, 12]
        });

        const badgeMarker = L.marker([midLat, midLng], {
          icon: badgeIcon,
          zIndexOffset: 300
        });

        badgeMarker.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          if (segment) {
            setSelectedSegment(segment);
            setIsSegmentModalOpen(true);
          }
        });

        layers.addLayer(badgeMarker);
      }
    });

    // 2. Draw Points Markers
    displayedPoints.forEach((pt) => {
      const typeConf = POINT_TYPE_CONFIG[pt.pointType] || POINT_TYPE_CONFIG.CUSTOM_POINT;
      const isSelected = selectedPoint?.id === pt.id;

      const markerHtml = `
        <div class="group flex flex-col items-center select-none ${isEditMode ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}">
          <div class="relative flex items-center justify-center">
            <!-- Pin Body -->
            <div class="w-8 h-8 rounded-full border-2 ${
              isSelected ? 'bg-cocoa border-white ring-4 ring-sage scale-110' : 'bg-sage border-white'
            } shadow-md flex items-center justify-center transition-transform group-hover:scale-110">
              <span class="text-white font-mono font-black text-xs leading-none">
                ${getCircledNumber(pt.sequence)}
              </span>
            </div>
            <!-- Type Mini-Badge -->
            <div class="absolute -top-1 -right-1.5 w-4 h-4 rounded-full bg-white border border-gray-200 flex items-center justify-center text-[9px] shadow-xs">
              ${typeConf.iconText}
            </div>
          </div>
          <!-- Label Pill -->
          <div class="mt-1 px-2 py-0.5 rounded-md bg-white/95 backdrop-blur-xs border border-beige-dark shadow-xs max-w-[120px] truncate text-[10px] font-black text-cocoa leading-tight text-center">
            ${pt.title}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-map-point-icon',
        html: markerHtml,
        iconSize: [80, 56],
        iconAnchor: [40, 20]
      });

      const marker = L.marker([pt.latitude, pt.longitude], {
        icon: customIcon,
        draggable: isEditMode,
        zIndexOffset: isSelected ? 500 : 200
      });

      // Drag event in edit mode
      marker.on('dragend', (e) => {
        const target = e.target as L.Marker;
        const newPos = target.getLatLng();
        onUpdatePointLocation(pt.id, newPos.lat, newPos.lng);
      });

      // Click handler
      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        setSelectedPoint(pt);
        setIsPointModalOpen(true);
      });

      layers.addLayer(marker);
    });

  }, [displayedPoints, routeSegments, isEditMode, selectedPoint]);

  // Fit bounds when points change or day changes
  const fitMapToBounds = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (displayedPoints.length === 1) {
      map.setView([displayedPoints[0].latitude, displayedPoints[0].longitude], 14, { animate: true });
    } else if (displayedPoints.length > 1) {
      const bounds = L.latLngBounds(displayedPoints.map(p => [p.latitude, p.longitude]));
      map.fitBounds(bounds, { padding: [50, 50], animate: true });
    }
  }, [displayedPoints]);

  useEffect(() => {
    if (displayedPoints.length > 0) {
      fitMapToBounds();
    }
  }, [filterDay]);

  // Handle reordering points Up / Down in current day
  const handleMovePoint = (idx: number, direction: 'up' | 'down') => {
    const activeDayKey = filterDay === 'ALL' ? (displayedPoints[0]?.day || selectedDate) : filterDay;
    const dayPts = [...mapPoints.filter(p => p.day === activeDayKey)].sort((a, b) => a.sequence - b.sequence);

    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= dayPts.length) return;

    const temp = dayPts[idx];
    dayPts[idx] = dayPts[targetIdx];
    dayPts[targetIdx] = temp;

    onReorderPoints(activeDayKey, dayPts);
  };

  // Day filter change handler
  const handleSelectDayFilter = (dayKey: string) => {
    setFilterDay(dayKey);
    if (dayKey !== 'ALL') {
      onSelectDate(dayKey);
    }
  };

  // Add point modal confirmation
  const handleConfirmAddPoint = (
    pointData: {
      day: string;
      dayIndex?: number;
      title: string;
      latitude: number;
      longitude: number;
      scheduleItemId?: string;
      pointType: MapPointType;
      notes?: string;
    },
    transportFromPrev?: ManualTransportType
  ) => {
    onAddPoint(pointData, transportFromPrev);
    setIsAddModalOpen(false);
    setPendingClickCoords(null);
  };

  // Active target day for adding points
  const targetDayForAdd = filterDay === 'ALL' ? (selectedDate || dates[0]?.date || '') : filterDay;
  const targetDayPts = mapPoints.filter(p => p.day === targetDayForAdd).sort((a, b) => a.sequence - b.sequence);
  const prevPointForAdd = targetDayPts.length > 0 ? targetDayPts[targetDayPts.length - 1] : null;

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-32">
      {/* Top Bar: Title & Day Filter Scroller */}
      <div className="bg-beige/95 backdrop-blur-md rounded-[2rem] p-3 sm:p-4 border-2 border-beige-dark shadow-hard-sm space-y-3">
        {/* Header row */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-sage text-white shadow-xs">
              <Compass size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-cocoa leading-tight flex items-center gap-1.5">
                手動路線地圖
                {isEditMode && (
                  <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 border border-orange-200 animate-pulse">
                    編輯模式
                  </span>
                )}
              </h2>
              <p className="text-[11px] font-bold text-gray-400">
                點擊地圖自動建立 ①②③ 節點與交通連線
              </p>
            </div>
          </div>

          {/* Mode switch button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fitMapToBounds}
              className="p-2 rounded-xl bg-white hover:bg-beige text-cocoa border-2 border-beige-dark transition-all text-xs font-bold shadow-xs active:scale-95"
              title="適應地圖視野"
            >
              <RefreshCw size={15} />
            </button>

            <button
              type="button"
              onClick={() => setIsEditMode(!isEditMode)}
              className={`px-3.5 py-2 rounded-xl border-2 font-black text-xs flex items-center gap-1.5 transition-all shadow-xs active:scale-95 ${
                isEditMode
                  ? 'bg-sage border-sage text-white shadow-hard-sm-sage'
                  : 'bg-white border-beige-dark text-cocoa hover:border-sage'
              }`}
            >
              {isEditMode ? (
                <>
                  <Check size={14} strokeWidth={3} />
                  完成編輯
                </>
              ) : (
                <>
                  <Edit3 size={14} strokeWidth={2.5} />
                  手動編輯路線
                </>
              )}
            </button>
          </div>
        </div>

        {/* Day Filter Pills */}
        <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-1 pt-1">
          {/* ALL Days */}
          <button
            type="button"
            onClick={() => handleSelectDayFilter('ALL')}
            className={`flex-shrink-0 px-3.5 py-1.5 rounded-xl border-2 text-xs font-black transition-all ${
              filterDay === 'ALL'
                ? 'bg-cocoa text-white border-cocoa shadow-hard-sm'
                : 'bg-white text-gray-500 border-beige-dark hover:border-gray-300'
            }`}
          >
            全部天數 (各天獨立路線)
          </button>

          {/* Individual Days */}
          {dates.map((date) => {
            const isSelected = filterDay === date.date;
            const dayPtsCount = mapPoints.filter(p => p.day === date.date).length;

            return (
              <button
                key={date.date}
                type="button"
                onClick={() => handleSelectDayFilter(date.date)}
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-xl border-2 text-xs font-black transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-sage text-white border-sage shadow-hard-sm-sage'
                    : 'bg-white text-gray-500 border-beige-dark hover:border-sage'
                }`}
              >
                <span>Day {date.dayNum}</span>
                <span className="text-[10px] opacity-75">({date.monthDay})</span>
                {dayPtsCount > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected ? 'bg-white/30 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {dayPtsCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Edit Mode Instruction Banner */}
      {isEditMode && (
        <div className="bg-orange-50/90 border-2 border-orange-200/80 rounded-2xl p-3 text-xs text-orange-800 flex items-center justify-between gap-2 shadow-xs animate-scale-in">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-orange-400 text-white font-mono font-black flex items-center justify-center text-xs flex-shrink-0">
              ①
            </span>
            <span className="font-bold">
              {filterDay === 'ALL'
                ? '目前顯示全部天數。點選上方特定日期，再於地圖上點擊以新增該天的路線點。'
                : `編輯模式中：點擊地圖任意位置，自動新增 ${currentDayIndex ? `Day ${currentDayIndex}` : ''} 的下一個節點，亦可拖曳標記調整位置。`}
            </span>
          </div>
          {filterDay !== 'ALL' && (
            <button
              type="button"
              onClick={() => {
                const map = mapInstanceRef.current;
                const center = map ? map.getCenter() : { lat: defaultCenter[0], lng: defaultCenter[1] };
                setPendingClickCoords({ lat: center.lat, lng: center.lng });
                setIsAddModalOpen(true);
              }}
              className="px-2.5 py-1 bg-white hover:bg-orange-100 text-orange-700 font-black rounded-lg border border-orange-300 shadow-xs flex-shrink-0 flex items-center gap-1 transition-all active:scale-95"
            >
              <Plus size={12} strokeWidth={3} />
              手動加點
            </button>
          )}
        </div>
      )}

      {/* Main Map Box */}
      <div className="relative w-full h-[52vh] min-h-[380px] max-h-[560px] rounded-[2rem] border-2 border-beige-dark shadow-hard overflow-hidden bg-[#FAF9F6]">
        {/* Map Container */}
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Floating Day Indicator */}
        <div className="absolute top-3 left-3 z-10 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-beige-dark shadow-sm flex items-center gap-2 text-xs font-black text-cocoa">
          <span className="w-2.5 h-2.5 rounded-full bg-sage animate-pulse"></span>
          <span>
            {filterDay === 'ALL' ? '全部天數路線圖' : `Day ${currentDayIndex || ''} (${filterDay})`}
          </span>
          <span className="text-[10px] text-gray-400 font-bold">
            {displayedPoints.length} 個標記點
          </span>
        </div>

        {/* Empty state hint */}
        {displayedPoints.length === 0 && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center pointer-events-none">
            <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border-2 border-beige-dark shadow-hard max-w-sm pointer-events-auto space-y-2.5">
              <div className="w-12 h-12 rounded-full bg-sage/20 text-sage mx-auto flex items-center justify-center">
                <MapPin size={24} />
              </div>
              <h3 className="text-sm font-black text-cocoa">
                {filterDay === 'ALL' ? '尚無手動路線資料' : `Day ${currentDayIndex || ''} 尚無路線點`}
              </h3>
              <p className="text-xs text-gray-500 font-bold leading-relaxed">
                點擊上方「手動編輯路線」，再點擊地圖任意位置，即可依序建立 ① ② ③ 景點與交通連線！
              </p>
              {!isEditMode && (
                <button
                  type="button"
                  onClick={() => setIsEditMode(true)}
                  className="px-4 py-2 bg-sage hover:bg-sage-dark text-white font-black text-xs rounded-xl shadow-hard-sm-sage transition-all active:scale-95"
                >
                  進入編輯模式
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Route Summary Section (Requirement 19 & 23) */}
      <div className="bg-white rounded-[2rem] p-4 sm:p-5 border-2 border-beige-dark shadow-hard space-y-4">
        <div className="flex items-center justify-between border-b border-beige-dark/60 pb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-black text-cocoa flex items-center gap-1.5">
              <span>🗺️</span>
              {filterDay === 'ALL' ? '所有天數路線摘要' : `Day ${currentDayIndex || ''} 路線摘要`}
            </h3>
            <span className="text-xs font-bold text-gray-400">
              ({displayedPoints.length} 站)
            </span>
          </div>

          {isEditMode && (
            <span className="text-[11px] font-bold text-gray-400 flex items-center gap-1">
              可點擊上下箭頭重新排序或刪除
            </span>
          )}
        </div>

        {displayedPoints.length === 0 ? (
          <div className="text-center py-8 text-xs font-bold text-gray-400">
            目前無路線點。進入編輯模式點擊地圖即可新增！
          </div>
        ) : (
          <div className="space-y-1">
            {displayedPoints.map((pt, idx) => {
              const typeConf = POINT_TYPE_CONFIG[pt.pointType] || POINT_TYPE_CONFIG.CUSTOM_POINT;
              const nextPt = idx < displayedPoints.length - 1 ? displayedPoints[idx + 1] : null;

              // Find segment connecting pt -> nextPt (if on same day)
              const connectingSegment = (nextPt && nextPt.day === pt.day)
                ? routeSegments.find(s => s.day === pt.day && s.fromPointId === pt.id && s.toPointId === nextPt.id)
                : null;

              const transportConf = connectingSegment 
                ? (MANUAL_TRANSPORT_CONFIG[connectingSegment.transportType] || MANUAL_TRANSPORT_CONFIG.WALK)
                : MANUAL_TRANSPORT_CONFIG.WALK;

              return (
                <div key={pt.id} className="relative">
                  {/* Point Card */}
                  <div 
                    onClick={() => {
                      setSelectedPoint(pt);
                      setIsPointModalOpen(true);
                    }}
                    className={`p-3 rounded-2xl border-2 transition-all flex items-center justify-between gap-3 cursor-pointer ${
                      selectedPoint?.id === pt.id 
                        ? 'bg-sage/10 border-sage shadow-xs' 
                        : 'bg-[#FAF9F6] border-beige-dark hover:border-sage'
                    }`}
                  >
                    {/* Left: Sequence circle & Title */}
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span className="w-7 h-7 rounded-full bg-sage text-white font-mono font-black text-xs flex items-center justify-center shadow-xs flex-shrink-0">
                        {getCircledNumber(pt.sequence)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-black text-cocoa truncate">
                            {pt.title}
                          </span>
                          <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-md border ${typeConf.badgeBg} ${typeConf.badgeText} ${typeConf.badgeBorder}`}>
                            {typeConf.iconText} {typeConf.label}
                          </span>
                          {filterDay === 'ALL' && (
                            <span className="text-[9px] font-mono font-bold text-gray-400 bg-white px-1.5 py-0.2 rounded border border-beige-dark">
                              {pt.day}
                            </span>
                          )}
                        </div>
                        {pt.notes && (
                          <p className="text-[11px] text-gray-400 truncate mt-0.5">
                            {pt.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: Reorder or Delete Controls in Edit Mode */}
                    {isEditMode ? (
                      <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                        {idx > 0 && (
                          <button
                            type="button"
                            onClick={() => handleMovePoint(idx, 'up')}
                            className="p-1.5 rounded-lg border border-beige-dark text-gray-400 hover:text-cocoa hover:bg-beige active:scale-90 transition-all"
                            title="上移此點"
                          >
                            <ArrowUp size={13} strokeWidth={2.5} />
                          </button>
                        )}
                        {idx < displayedPoints.length - 1 && (
                          <button
                            type="button"
                            onClick={() => handleMovePoint(idx, 'down')}
                            className="p-1.5 rounded-lg border border-beige-dark text-gray-400 hover:text-cocoa hover:bg-beige active:scale-90 transition-all"
                            title="下移此點"
                          >
                            <ArrowDown size={13} strokeWidth={2.5} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onDeletePoint(pt.id, pt.day)}
                          className="p-1.5 rounded-lg border border-red-200 text-red-400 hover:text-red-600 hover:bg-red-50 active:scale-90 transition-all ml-1"
                          title="刪除此點"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center text-xs font-mono font-bold text-gray-400">
                        <span>{pt.latitude.toFixed(4)}, {pt.longitude.toFixed(4)}</span>
                      </div>
                    )}
                  </div>

                  {/* Connecting Transit Line to next point (Only within same day) */}
                  {nextPt && nextPt.day === pt.day && (
                    <div className="py-1 px-4 ml-6 flex items-center gap-2">
                      <div className="w-0.5 h-6 bg-beige-dark"></div>
                      <button
                        type="button"
                        onClick={() => {
                          if (connectingSegment) {
                            setSelectedSegment(connectingSegment);
                            setIsSegmentModalOpen(true);
                          }
                        }}
                        className={`px-2.5 py-1 rounded-full border text-[11px] font-black flex items-center gap-1.5 transition-all shadow-2xs hover:scale-105 ${
                          transportConf.badgeBg
                        } ${transportConf.badgeText} ${transportConf.badgeBorder}`}
                        title="點擊編輯此段交通方式"
                      >
                        <span>{transportConf.emoji}</span>
                        <span>{transportConf.label}</span>
                        {connectingSegment?.departureTime && (
                          <span className="font-mono text-[10px] opacity-80">
                            ({connectingSegment.departureTime} 發車)
                          </span>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Day separator if viewing ALL days */}
                  {nextPt && nextPt.day !== pt.day && (
                    <div className="py-2.5 flex items-center justify-center">
                      <div className="w-full border-t border-dashed border-beige-dark"></div>
                      <span className="px-3 text-[10px] font-black text-gray-300 uppercase tracking-widest whitespace-nowrap">
                        天數分割 · 路線獨立不連線
                      </span>
                      <div className="w-full border-t border-dashed border-beige-dark"></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Map Point Modal */}
      {pendingClickCoords && (
        <AddMapPointModal
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            setPendingClickCoords(null);
          }}
          day={targetDayForAdd}
          dayIndex={currentDayIndex}
          latitude={pendingClickCoords.lat}
          longitude={pendingClickCoords.lng}
          sequence={targetDayPts.length + 1}
          prevPoint={prevPointForAdd}
          dayScheduleItems={currentDayScheduleItems}
          onConfirm={handleConfirmAddPoint}
        />
      )}

      {/* Segment Detail / Transport Change Modal */}
      {selectedSegment && (
        <SegmentDetailModal
          isOpen={isSegmentModalOpen}
          onClose={() => {
            setIsSegmentModalOpen(false);
            setSelectedSegment(null);
          }}
          segment={selectedSegment}
          fromPoint={mapPoints.find(p => p.id === selectedSegment.fromPointId)}
          toPoint={mapPoints.find(p => p.id === selectedSegment.toPointId)}
          linkedScheduleItem={scheduleItems.find(i => i.id === selectedSegment.scheduleItemId)}
          onSaveTransport={onUpdateSegmentTransport}
        />
      )}

      {/* Point Detail Modal */}
      {selectedPoint && (
        <MapPointDetailModal
          isOpen={isPointModalOpen}
          onClose={() => {
            setIsPointModalOpen(false);
            setSelectedPoint(null);
          }}
          point={selectedPoint}
          linkedScheduleItem={scheduleItems.find(i => i.id === selectedPoint.scheduleItemId)}
          isEditMode={isEditMode}
          onJumpToSchedule={onJumpToSchedule}
          onDeletePoint={onDeletePoint}
          onUpdatePointTitle={(pointId, newTitle, newType) => {
            if (onUpdatePointTitle) {
              onUpdatePointTitle(pointId, newTitle, newType);
            } else {
              const pt = mapPoints.find(p => p.id === pointId);
              if (pt) {
                onAddPoint({
                  ...pt,
                  title: newTitle,
                  pointType: newType
                });
              }
            }
          }}
        />
      )}
    </div>
  );
};
