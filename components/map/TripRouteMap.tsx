/**
 * TripRouteMap.tsx
 * 
 * 行程路線地圖 V3 (Manual Map Pin + Auto Route V3)
 * 
 * 核心哲學：
 * 「你負責指定哪裡，系統負責怎麼畫」
 * - 使用者手動點擊地圖／拖曳標記定位景點，Trip Mochi 永久儲存至 Schedule Item
 * - 系統嚴格依照 Schedule Item 時間與順序自動繪製：
 *   ① 景點 Marker 與序號徽章 (D1-01, D1-02...)
 *   ② 每日專屬手帳色調折線 (如 ① → ② → ③)
 *   ③ 全旅程模式下每日獨立成線，互不相連（非 18 天巨蛇）
 *   ④ 未定位景點自動中斷路線，絕不胡亂猜測座標至其他國家或假造直連
 *   ⑤ 支援點擊「在地圖上定位」，在全螢幕地圖上直接點選並確認，即時寫入資料庫
 */

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  ArrowLeft, 
  Compass, 
  MapPin, 
  Maximize2, 
  ExternalLink, 
  Calendar, 
  CheckCircle2,
  AlertCircle,
  Crosshair,
  Check,
  X,
  Sparkles,
  Move,
  Info,
  Trash2
} from 'lucide-react';

import { ScheduleItem, TripDate } from '../../types';
import { 
  NormalizedMapItem, 
  OpenStreetMapProvider, 
  getDayTheme, 
  inspectDailyRoute, 
  RouteInspectionReport,
  GeoCoordinate
} from './MapProvider';
import { 
  resolveLocationData, 
  getExternalGoogleMapsUrl, 
  buildMultiStopGoogleDirectionsUrl,
  isValidCoordinate
} from './locationUtils';
import { createLeafletMarkerIcon, MapMarkerBadge } from './MapMarker';
import { MapFilters, FilterCategory, DayOption } from './MapFilters';
import { createDayRouteLayers, RouteInspectionCard } from './RoutePolyline';
import { classifyScheduleItem, isEligibleMapStop, getClassificationLabel, calculateMapStatistics } from './mapClassifier';
import { MapStatistics } from './MapTypes';

interface TripRouteMapProps {
  schedules: ScheduleItem[];
  tripDates: TripDate[];
  currentTripId?: string;
  initialDayNum?: number;
  onBackToSchedule?: () => void;
  onViewScheduleItem?: (item: ScheduleItem) => void;
  onUpdateItemLocation?: (itemId: string, coords: { lat: number; lng: number }, confirmed?: boolean) => Promise<void>;
  className?: string;
}

export const TripRouteMap: React.FC<TripRouteMapProps> = ({
  schedules,
  tripDates,
  currentTripId,
  initialDayNum = 1,
  onBackToSchedule,
  onViewScheduleItem,
  onUpdateItemLocation,
  className = '',
}) => {
  // 地圖容器 Ref 與 Leaflet Map 實例 Ref
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const routesLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const pinDraftMarkerRef = useRef<L.Marker | null>(null);

  // 選取狀態
  const [selectedDay, setSelectedDay] = useState<number | 'all'>(initialDayNum || 1);
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('all');
  const [selectedItemId, setSelectedItemId] = useState<string | number | null>(null);

  // -------------------------------------------------------------
  // 手動定位互動模式狀態 (Manual Pinning State)
  // -------------------------------------------------------------
  const [pinningItem, setPinningItem] = useState<NormalizedMapItem | null>(null);
  const [draftCoords, setDraftCoords] = useState<GeoCoordinate | null>(null);
  const [isSavingLocation, setIsSavingLocation] = useState(false);

  // 映射 tripDates 與 日期清單
  const effectiveDates: string[] = useMemo(() => {
    if (tripDates && tripDates.length > 0) {
      return tripDates.map(d => d.date);
    }
    const datesFromSchedule = Array.from(new Set(schedules.map(s => s.date).filter(Boolean)));
    datesFromSchedule.sort();
    return datesFromSchedule.length > 0 ? datesFromSchedule : [new Date().toISOString().split('T')[0]];
  }, [tripDates, schedules]);

  /**
   * 1. 建立具有 Classification Layer 與 Map Stop 分離之正規化項目
   */
  const normalizedItems: NormalizedMapItem[] = useMemo(() => {
    const result: NormalizedMapItem[] = [];

    effectiveDates.forEach((dateStr, dayIndex) => {
      const dayNum = dayIndex + 1;
      const dayCode = `D${dayNum}`;

      // 取得當天的所有行程
      const daySchedules = schedules.filter(item => item.date === dateStr);

      // 嚴格依行程順序排序 (order 優先，其次依時間 time)
      const sortedDayItems = [...daySchedules].sort((a, b) => {
        if (a.order !== undefined && b.order !== undefined) {
          return a.order - b.order;
        }
        if (a.order !== undefined) return -1;
        if (b.order !== undefined) return 1;
        return (a.time || '00:00').localeCompare(b.time || '00:00');
      });

      // 追蹤當日真正 Map Stop 的順序編號 (例如 D1-01, D1-02)
      let mapStopSeq = 1;

      sortedDayItems.forEach((item, itemIndex) => {
        const classification = classifyScheduleItem(item);
        const classificationLabel = getClassificationLabel(classification);
        const isMapStop = isEligibleMapStop(classification, item);

        let markerCode = '';
        let sequenceNumber = itemIndex + 1;

        if (isMapStop) {
          markerCode = `${dayCode}-${String(mapStopSeq).padStart(2, '0')}`;
          sequenceNumber = mapStopSeq;
          mapStopSeq++;
        } else {
          // 非 Map Stop (交通、航班、純漫遊)
          markerCode = `${dayCode}-${classification === 'TRANSPORT' ? 'TR' : classification === 'FLIGHT' ? 'FL' : 'ROAM'}`;
        }

        // 進行層級化位置解析 (優先判定使用者手動 GPS 與 manual_map)
        const resolved = resolveLocationData(item, item.title);

        result.push({
          id: item.id,
          dayNum,
          dayCode,
          sequenceNumber,
          markerCode,
          time: item.time,
          title: resolved.title,
          rawTitle: item.title || item.name || '',
          classification,
          classificationLabel,
          isMapStop,
          address: resolved.address,
          notes: item.notes || item.note,
          hasCoordinates: resolved.hasCoordinates,
          coordinates: resolved.coordinates,
          googleMapUrl: resolved.googleMapUrl,
          locationStatus: resolved.locationStatus,
          locationSource: resolved.locationSource,
          statusMessage: resolved.statusMessage,
          originalItem: item,
          itemSource: 'schedule',
          date: dateStr,
        });
      });
    });

    return result;
  }, [effectiveDates, schedules]);

  /**
   * 2. 計算全旅程或當日之精準地圖統計模型 (MapStatistics)
   */
  const overallStatistics: MapStatistics = useMemo(() => {
    return calculateMapStatistics(normalizedItems);
  }, [normalizedItems]);

  const currentDayStatistics: MapStatistics = useMemo(() => {
    if (selectedDay === 'all') {
      return overallStatistics;
    }
    const dayItems = normalizedItems.filter(i => i.dayNum === selectedDay);
    return calculateMapStatistics(dayItems);
  }, [normalizedItems, selectedDay, overallStatistics]);

  // 動態建立日期切換選項
  const dayOptions: DayOption[] = useMemo(() => {
    return effectiveDates.map((dateStr, idx) => {
      const dayNum = idx + 1;
      const dayCode = `D${dayNum}`;
      const dayItems = normalizedItems.filter(i => i.dayNum === dayNum);
      const dayStops = dayItems.filter(i => i.isMapStop);
      const locatedStopsCount = dayStops.filter(i => i.hasCoordinates).length;

      return {
        dayNum,
        dayCode,
        dateStr,
        totalScheduleCount: dayItems.length,
        totalMapStops: dayStops.length,
        locatedStopsCount,
      };
    });
  }, [effectiveDates, normalizedItems]);

  // 依當前選取的日期與分類進行篩選
  const visibleItems = useMemo(() => {
    return normalizedItems.filter(item => {
      // 1. 日期過濾
      if (selectedDay !== 'all' && item.dayNum !== selectedDay) {
        return false;
      }
      // 2. 分類過濾
      if (selectedCategory !== 'all' && item.classification !== selectedCategory) {
        return false;
      }
      return true;
    });
  }, [normalizedItems, selectedDay, selectedCategory]);

  // 當前日期的路線檢查報告
  const currentRouteReport = useMemo(() => {
    if (selectedDay === 'all') {
      return inspectDailyRoute(0, normalizedItems);
    } else {
      const dayItems = normalizedItems.filter(i => i.dayNum === selectedDay);
      return inspectDailyRoute(selectedDay, dayItems);
    }
  }, [selectedDay, normalizedItems]);

  // 各分類計數
  const categoryCounts = useMemo(() => {
    const targetItems = selectedDay === 'all' 
      ? normalizedItems 
      : normalizedItems.filter(i => i.dayNum === selectedDay);

    const counts: Partial<Record<FilterCategory, number>> = {
      all: targetItems.length,
      PLACE: targetItems.filter(i => i.classification === 'PLACE').length,
      ACCOMMODATION: targetItems.filter(i => i.classification === 'ACCOMMODATION').length,
      TRANSPORT: targetItems.filter(i => i.classification === 'TRANSPORT').length,
      FLIGHT: targetItems.filter(i => i.classification === 'FLIGHT').length,
      ACTIVITY: targetItems.filter(i => i.classification === 'ACTIVITY').length,
      FREE_ACTIVITY: targetItems.filter(i => i.classification === 'FREE_ACTIVITY').length,
      OTHER: targetItems.filter(i => i.classification === 'OTHER').length,
    };
    return counts;
  }, [normalizedItems, selectedDay]);

  /**
   * 初始化 Leaflet 地圖實例
   */
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // 預設中心：以瑞士或義大利中心 (或第一個已定位項目)
    const firstLocated = normalizedItems.find(i => i.hasCoordinates && i.coordinates);
    const initialCenter: [number, number] = firstLocated?.coordinates 
      ? [firstLocated.coordinates.lat, firstLocated.coordinates.lng] 
      : [46.8182, 8.2275]; // 瑞士阿爾卑斯中心預設

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 11,
      zoomControl: false,
      attributionControl: false,
    });

    // 加入 OpenStreetMap TileLayer
    L.tileLayer(OpenStreetMapProvider.tileUrl, {
      maxZoom: OpenStreetMapProvider.options.maxZoom,
      minZoom: OpenStreetMapProvider.options.minZoom,
      attribution: OpenStreetMapProvider.options.attribution,
    }).addTo(map);

    L.control.attribution({ position: 'bottomright', prefix: false })
      .addAttribution(OpenStreetMapProvider.options.attribution)
      .addTo(map);

    const routesGroup = L.layerGroup().addTo(map);
    const markersGroup = L.layerGroup().addTo(map);

    routesLayerGroupRef.current = routesGroup;
    markersLayerGroupRef.current = markersGroup;
    mapInstanceRef.current = map;

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  /**
   * 監聽地圖點擊事件：若處於手動定位模式 (pinningItem)，點擊即更新草稿位置
   */
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (!pinningItem) return;
      const { lat, lng } = e.latlng;
      setDraftCoords({
        lat: Number(lat.toFixed(6)),
        lng: Number(lng.toFixed(6)),
      });
    };

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [pinningItem]);

  /**
   * 管理手動定位草稿 Marker (可拖曳微調)
   */
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (!pinningItem || !draftCoords) {
      if (pinDraftMarkerRef.current) {
        map.removeLayer(pinDraftMarkerRef.current);
        pinDraftMarkerRef.current = null;
      }
      return;
    }

    const theme = getDayTheme(pinningItem.dayNum);

    // 建立可拖曳之鮮明定位草稿 Pin
    const draftIconHtml = `
      <div class="relative group cursor-grab active:cursor-grabbing select-none" style="width: 80px; height: 52px;">
        <div class="absolute -inset-2 rounded-full animate-ping opacity-60" style="background-color: #EF4444;"></div>
        <div class="relative flex flex-col items-center justify-center scale-110">
          <div style="background-color: #EF4444; border: 2px solid #FFFFFF; box-shadow: 0 4px 14px rgba(239,68,68,0.45); color: #FFF;" class="px-2 py-0.5 rounded-full flex items-center gap-1 font-black text-[11px]">
            <span>📍 定位中</span>
          </div>
          <div style="background-color: #FFFDF9; border: 1px solid #EF4444; color: #4A3E3D; box-shadow: 0 2px 6px rgba(0,0,0,0.15);" class="mt-0.5 px-1.5 py-0.2 rounded-md text-[9px] font-black truncate max-w-[90px] text-center">
            可隨意拖曳
          </div>
          <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 7px solid #EF4444; margin-top: 1px;"></div>
        </div>
      </div>
    `;

    const draftIcon = L.divIcon({
      html: draftIconHtml,
      className: 'trip-mochi-draft-marker',
      iconSize: [80, 52],
      iconAnchor: [40, 50],
    });

    if (pinDraftMarkerRef.current) {
      pinDraftMarkerRef.current.setLatLng([draftCoords.lat, draftCoords.lng]);
    } else {
      const marker = L.marker([draftCoords.lat, draftCoords.lng], {
        icon: draftIcon,
        draggable: true,
        zIndexOffset: 1000,
      });

      marker.on('dragend', (event) => {
        const marker = event.target;
        const position = marker.getLatLng();
        setDraftCoords({
          lat: Number(position.lat.toFixed(6)),
          lng: Number(position.lng.toFixed(6)),
        });
      });

      marker.addTo(map);
      pinDraftMarkerRef.current = marker;
    }
  }, [pinningItem, draftCoords]);

  /**
   * 繪製固定 Marker 與 Route Polyline (依據已確認座標與排程順序)
   */
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerGroupRef.current;
    const routesGroup = routesLayerGroupRef.current;

    if (!map || !markersGroup || !routesGroup) return;

    markersGroup.clearLayers();
    routesGroup.clearLayers();

    const boundsPoints: [number, number][] = [];

    // 1. 繪製行程順序線 (Route Polylines)
    // 嚴格規範：
    // - 依照排程順序 (① → ② → ③)
    // - 遇到未定位之 Stop，中斷形成獨立區段，絕不直連假造連線
    // - 全旅程模式下每日各成獨立線段，天與天之間互不相連
    if (selectedDay === 'all') {
      dayOptions.forEach((opt) => {
        const dayItems = normalizedItems.filter(i => i.dayNum === opt.dayNum);
        const dayRouteLayer = createDayRouteLayers(dayItems, opt.dayNum, true);
        routesGroup.addLayer(dayRouteLayer);
      });
    } else {
      const dayItems = normalizedItems.filter(i => i.dayNum === selectedDay);
      const dayRouteLayer = createDayRouteLayers(dayItems, selectedDay, false);
      routesGroup.addLayer(dayRouteLayer);
    }

    // 2. 繪製標記點 (Markers)
    // 僅為真正有定位的 Map Stop 建立標記
    visibleItems.forEach((item) => {
      if (item.isMapStop && item.hasCoordinates && item.coordinates) {
        // 如果此項目正在手動定位中，由草稿 Marker 顯示
        if (pinningItem && pinningItem.id === item.id) return;

        const coord: [number, number] = [item.coordinates.lat, item.coordinates.lng];
        boundsPoints.push(coord);

        const isSelected = item.id === selectedItemId;
        const icon = createLeafletMarkerIcon(item, isSelected);
        const marker = L.marker(coord, { icon });

        marker.on('click', () => {
          setSelectedItemId(item.id);
        });

        // 建立 Popup 內容 (包含「重新微調位置」動作)
        const theme = getDayTheme(item.dayNum);
        const externalUrl = getExternalGoogleMapsUrl(resolveLocationData(item.originalItem, item.title));

        const popupHtml = `
          <div style="font-family: 'Zen Maru Gothic', sans-serif; padding: 4px 2px; color: #4A3E3D; min-width: 220px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
              <span style="background-color: ${item.classification === 'ACCOMMODATION' ? '#7C3AED' : theme.primary}; color: #FFF; font-weight: 900; font-size: 11px; padding: 2px 8px; border-radius: 999px; font-family: monospace;">
                ${item.markerCode}
              </span>
              <span style="font-size: 11px; font-weight: bold; color: #888;">
                Day ${item.dayNum} · ${item.classificationLabel}
              </span>
            </div>
            <div style="font-size: 13px; font-weight: 900; line-height: 1.3; margin-bottom: 4px; color: #2D2424;">
              ${item.title}
            </div>
            ${item.address ? `
              <div style="font-size: 11px; color: #666; margin-bottom: 6px; line-height: 1.4;">
                📍 ${item.address}
              </div>
            ` : ''}
            <div style="font-size: 10px; color: #888; margin-bottom: 8px; font-family: monospace;">
              座標：${item.coordinates.lat.toFixed(5)}, ${item.coordinates.lng.toFixed(5)}
            </div>
            <div style="display: flex; gap: 6px; margin-top: 8px; border-top: 1px solid #EEE; padding-top: 8px;">
              <a 
                href="${externalUrl}" 
                target="_blank" 
                rel="noopener noreferrer"
                style="flex: 1; display: inline-flex; align-items: center; justify-content: center; background-color: #5B8266; color: white; font-size: 11px; font-weight: bold; padding: 6px 10px; border-radius: 10px; text-decoration: none;"
              >
                Google Maps 導航 ↗
              </a>
            </div>
          </div>
        `;

        marker.bindPopup(popupHtml, {
          closeButton: false,
          className: 'trip-mochi-custom-popup',
        });

        markersGroup.addLayer(marker);
      }
    });

    // 3. 自動 fitBounds 視野定位 (僅在非定位模式下執行)
    if (!pinningItem) {
      if (boundsPoints.length > 1) {
        map.fitBounds(boundsPoints, {
          padding: [50, 50],
          maxZoom: 15,
          animate: true,
        });
      } else if (boundsPoints.length === 1) {
        map.setView(boundsPoints[0], 14, { animate: true });
      }
    }
  }, [visibleItems, selectedDay, selectedItemId, normalizedItems, dayOptions, pinningItem]);

  /**
   * 開始對某個行程進行手動定位／微調定位
   */
  const handleStartPinning = (item: NormalizedMapItem) => {
    setPinningItem(item);

    // 如果該項目原本就有座標，直接帶入；否則取當前地圖中心
    if (item.hasCoordinates && item.coordinates) {
      setDraftCoords({ ...item.coordinates });
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([item.coordinates.lat, item.coordinates.lng], 15, { duration: 0.8 });
      }
    } else {
      // 若已有其他同日定位點，以同日最後一點附近為起點，免於大幅位移
      const sameDayLocated = normalizedItems.filter(i => i.dayNum === item.dayNum && i.hasCoordinates && i.coordinates);
      if (sameDayLocated.length > 0 && sameDayLocated[sameDayLocated.length - 1].coordinates) {
        const lastCoord = sameDayLocated[sameDayLocated.length - 1].coordinates!;
        setDraftCoords({ lat: lastCoord.lat, lng: lastCoord.lng });
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([lastCoord.lat, lastCoord.lng], 14, { duration: 0.8 });
        }
      } else if (mapInstanceRef.current) {
        const center = mapInstanceRef.current.getCenter();
        setDraftCoords({
          lat: Number(center.lat.toFixed(6)),
          lng: Number(center.lng.toFixed(6)),
        });
      }
    }
  };

  /**
   * 取消手動定位
   */
  const handleCancelPinning = () => {
    setPinningItem(null);
    setDraftCoords(null);
  };

  /**
   * 確認並儲存位置至 Schedule Item
   */
  const handleConfirmLocation = async () => {
    if (!pinningItem || !draftCoords) return;

    setIsSavingLocation(true);
    try {
      if (onUpdateItemLocation) {
        await onUpdateItemLocation(String(pinningItem.id), draftCoords, true);
      }
      setPinningItem(null);
      setDraftCoords(null);
    } catch (err) {
      console.error('Failed to confirm location:', err);
      alert('儲存位置失敗，請檢查網路連線');
    } finally {
      setIsSavingLocation(false);
    }
  };

  /**
   * 移除特定項目的定位座標 (回歸未定位狀態)
   */
  const handleClearLocation = async (item: NormalizedMapItem) => {
    if (!onUpdateItemLocation) return;
    if (!confirm(`確定要清除「${item.title}」的座標嗎？`)) return;

    try {
      await onUpdateItemLocation(String(item.id), { lat: 0, lng: 0 }, false);
    } catch (err) {
      console.error('Failed to clear location:', err);
    }
  };

  /**
   * 點選列表項目 -> 地圖平滑聚焦 (List -> Map)
   */
  const handleSelectItemFromList = (item: NormalizedMapItem) => {
    setSelectedItemId(item.id);

    if (item.hasCoordinates && item.coordinates && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([item.coordinates.lat, item.coordinates.lng], 15, {
        duration: 0.8,
      });
    }
  };

  /**
   * 重新置中所有標記
   */
  const handleResetBounds = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const points: [number, number][] = visibleItems
      .filter(i => i.isMapStop && i.hasCoordinates && i.coordinates)
      .map(i => [i.coordinates!.lat, i.coordinates!.lng]);

    if (points.length > 1) {
      map.fitBounds(points, { padding: [50, 50], animate: true });
    } else if (points.length === 1) {
      map.setView(points[0], 14, { animate: true });
    }
  };

  /**
   * 開啟外部 Google Maps 多站連續導航
   */
  const handleOpenMultiStopDirections = () => {
    const locatedItems = visibleItems
      .filter(i => i.isMapStop && i.hasCoordinates && i.coordinates)
      .map(i => ({ coordinates: i.coordinates!, title: i.title }));

    if (locatedItems.length === 0) return;
    const url = buildMultiStopGoogleDirectionsUrl(locatedItems);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={`relative w-full h-[calc(100vh-4.5rem)] flex flex-col md:flex-row bg-[#FBF9F5] overflow-hidden select-none font-['Zen_Maru_Gothic'] rounded-2xl border-2 border-[#E0E5D5] shadow-sm ${className}`}>
      {/* ============================================================ */}
      {/* 左側面板 (Desktop) / 行程手動定位與巡檢清單 */}
      {/* ============================================================ */}
      <div className="w-full md:w-[420px] lg:w-[460px] flex-shrink-0 flex flex-col bg-white border-r border-[#E0E5D5] z-20 shadow-md md:shadow-none h-auto md:h-full max-h-[48vh] md:max-h-full">
        {/* 頂部導航與標題列 */}
        <div className="p-3 border-b border-[#E0E5D5] bg-[#FFFDF9]">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              {onBackToSchedule && (
                <button
                  type="button"
                  onClick={onBackToSchedule}
                  className="p-1.5 rounded-full hover:bg-[#F7F4EB] text-[#4A3E3D] transition-colors cursor-pointer border border-[#E0E5D5]"
                  title="返回行程手帳"
                >
                  <ArrowLeft size={16} />
                </button>
              )}
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#5B8266]" />
                  <h2 className="text-sm font-black text-[#4A3E3D]">
                    手動定位與行程繪圖 V3
                  </h2>
                </div>
                <p className="text-[10px] text-gray-500 font-medium">
                  你決定位置 · 系統依排程順序自動連線與標記
                </p>
              </div>
            </div>

            {/* 定位模式標籤 */}
            {pinningItem && (
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-600 text-[10px] font-black animate-pulse">
                <Crosshair size={12} />
                <span>定位模式中</span>
              </span>
            )}
          </div>

          {/* 日期切換與分類過濾列 */}
          <MapFilters
            dayOptions={dayOptions}
            selectedDay={selectedDay}
            onSelectDay={(day) => {
              setSelectedDay(day);
              setSelectedItemId(null);
            }}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            categoryCounts={categoryCounts}
          />
        </div>

        {/* 統計與未定位提示條 */}
        <div className="px-3 py-2 bg-[#F7F4EB] border-b border-[#E0E5D5] text-[11px] text-[#4A3E3D]">
          <div className="flex items-center justify-between font-bold mb-1">
            <span>
              {selectedDay === 'all' ? '全旅程項目狀態' : `Day ${selectedDay} 定位進度`}
            </span>
            <span className="text-stone-500 font-mono text-[10px]">
              實體景點 {currentDayStatistics.totalMapStops} 處 · 已定位 {currentDayStatistics.locatedCount} 處
            </span>
          </div>

          {/* 視覺進度條 */}
          <div className="w-full bg-stone-200 rounded-full h-1.5 overflow-hidden flex mb-1.5">
            <div 
              style={{ 
                width: `${currentDayStatistics.totalMapStops > 0 
                  ? (currentDayStatistics.locatedCount / currentDayStatistics.totalMapStops) * 100 
                  : 0}%` 
              }} 
              className="bg-[#5B8266] h-full transition-all duration-300"
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-stone-500">
            {currentDayStatistics.totalMapStops - currentDayStatistics.locatedCount > 0 ? (
              <span className="flex items-center gap-1 text-orange-600 font-bold">
                <AlertCircle size={11} />
                <span>尚有 {currentDayStatistics.totalMapStops - currentDayStatistics.locatedCount} 個景點未指定座標</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[#5B8266] font-bold">
                <CheckCircle2 size={11} />
                <span>所有景點皆已定位完成！動線已繪出</span>
              </span>
            )}
            <span className="text-stone-400">
              (點擊「在地圖上定位」可直接選點)
            </span>
          </div>
        </div>

        {/* 路線檢查卡片 */}
        <div className="p-3 bg-[#FBF9F5] border-b border-[#E0E5D5]">
          <RouteInspectionCard
            report={currentRouteReport}
            isAllDaysMode={selectedDay === 'all'}
            onOpenGoogleMapsNav={handleOpenMultiStopDirections}
          />
        </div>

        {/* 行程順序清單 (點選即可聚焦地圖或開始手動定位) */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#E0E5D5]/60 p-2 space-y-1.5 no-scrollbar">
          {visibleItems.length === 0 ? (
            <div className="py-12 text-center text-gray-400 space-y-2">
              <Calendar size={28} className="mx-auto text-stone-300" />
              <p className="text-xs font-bold">此篩選條件下無行程項目</p>
            </div>
          ) : (
            visibleItems.map((item) => {
              const isSelected = item.id === selectedItemId;
              const isCurrentPinning = pinningItem?.id === item.id;
              const theme = getDayTheme(item.dayNum);
              const itemExternalUrl = getExternalGoogleMapsUrl(resolveLocationData(item.originalItem, item.title));

              return (
                <div
                  key={item.id}
                  onClick={() => handleSelectItemFromList(item)}
                  style={
                    isCurrentPinning
                      ? {
                          borderColor: '#EF4444',
                          backgroundColor: '#FEF2F2',
                          boxShadow: '0 2px 10px rgba(239, 68, 68, 0.15)',
                        }
                      : isSelected
                      ? {
                          borderColor: item.classification === 'ACCOMMODATION' ? '#7C3AED' : theme.primary,
                          backgroundColor: '#FFFDF9',
                          boxShadow: '0 2px 8px rgba(74, 62, 61, 0.08)',
                        }
                      : undefined
                  }
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isCurrentPinning
                      ? 'border-2'
                      : isSelected
                      ? 'border-2'
                      : 'border-[#E0E5D5] bg-white hover:border-[#88C9A1] hover:bg-[#FAF9F5]'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {/* 標記號碼徽章 */}
                    <div className="pt-0.5">
                      <MapMarkerBadge
                        markerCode={item.markerCode}
                        dayNum={item.dayNum}
                        size="md"
                        isUnlocated={!item.hasCoordinates}
                        classification={item.classification}
                      />
                    </div>

                    {/* 內容主體 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <div className="flex items-center gap-1.5">
                          <span
                            style={{
                              backgroundColor: theme.light,
                              color: theme.dark,
                              borderColor: theme.border,
                            }}
                            className="text-[9px] font-black px-1.5 py-0.2 rounded-md border"
                          >
                            {item.dayCode}
                          </span>
                          <span className="text-[10px] font-bold text-gray-500">
                            {item.time || '時間未定'}
                          </span>
                        </div>

                        {/* 分類標籤 */}
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                          item.classification === 'ACCOMMODATION' ? 'bg-purple-50 text-purple-700' :
                          item.classification === 'TRANSPORT' ? 'bg-blue-50 text-blue-700' :
                          item.classification === 'FLIGHT' ? 'bg-sky-50 text-sky-700' :
                          item.classification === 'FREE_ACTIVITY' ? 'bg-amber-50 text-amber-700' :
                          'bg-stone-100 text-stone-600'
                        }`}>
                          {item.classificationLabel}
                        </span>
                      </div>

                      {/* 地點名稱 */}
                      <h4 className="text-xs font-black text-[#4A3E3D] truncate mb-1">
                        {item.title}
                      </h4>

                      {/* 定位狀態與提示 */}
                      {item.hasCoordinates && item.coordinates ? (
                        <div className="flex items-center gap-1.5 text-[10px] text-[#5B8266]">
                          <CheckCircle2 size={11} className="flex-shrink-0" />
                          <span className="font-mono">{item.coordinates.lat.toFixed(4)}, {item.coordinates.lng.toFixed(4)}</span>
                          <span className="text-stone-400">· 已定在圖上</span>
                        </div>
                      ) : (
                        <div className="text-[10px]">
                          {item.classification === 'TRANSPORT' || item.classification === 'FLIGHT' ? (
                            <span className="text-blue-600">移動過程（免標記點）</span>
                          ) : item.classification === 'FREE_ACTIVITY' ? (
                            <span className="text-amber-700">自由漫步無固定點</span>
                          ) : (
                            <span className="text-orange-600 font-bold flex items-center gap-1">
                              <AlertCircle size={10} />
                              尚未指定地圖位置
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 動作操作列：手動定位關鍵按鈕 */}
                  <div className="mt-2 pt-2 border-t border-[#E0E5D5]/50 flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-2">
                      {item.isMapStop && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartPinning(item);
                          }}
                          className={`px-2 py-1 rounded-lg font-bold flex items-center gap-1 transition-all cursor-pointer ${
                            item.hasCoordinates
                              ? 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                              : 'bg-orange-500 hover:bg-orange-600 text-white shadow-xs'
                          }`}
                          title={item.hasCoordinates ? '在地圖上重新微調位置' : '在地圖上點選指定位置'}
                        >
                          <Crosshair size={11} />
                          <span>{item.hasCoordinates ? '微調位置' : '在地圖上定位'}</span>
                        </button>
                      )}

                      {onViewScheduleItem && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewScheduleItem(item.originalItem);
                          }}
                          className="text-stone-500 hover:text-[#5B8266] font-bold cursor-pointer"
                        >
                          行程詳情
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {item.hasCoordinates && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClearLocation(item);
                          }}
                          className="text-gray-300 hover:text-red-500 p-1 cursor-pointer"
                          title="清除此座標"
                        >
                          <Trash2 size={11} />
                        </button>
                      )}

                      <a
                        href={itemExternalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-stone-400 hover:text-[#5B8266] flex items-center gap-0.5 font-bold ml-1"
                        title="外部 Google Maps 開啟"
                      >
                        <ExternalLink size={10} />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 右側 / 主畫面：Leaflet 行程地圖與手動定位畫布 */}
      {/* ============================================================ */}
      <div className="flex-1 relative h-full w-full bg-[#E5E3DF]">
        {/* 地圖實體 DOM */}
        <div 
          ref={mapContainerRef} 
          className={`w-full h-full z-10 ${pinningItem ? 'cursor-crosshair' : ''}`} 
        />

        {/* -------------------------------------------------------- */}
        {/* 手動定位互動控制浮島 (正在定位時置頂提示與確認按鈕) */}
        {/* -------------------------------------------------------- */}
        {pinningItem && (
          <div className="absolute top-4 left-4 right-4 md:left-6 md:right-auto z-30 pointer-events-auto">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl border-2 border-red-400 p-3 shadow-xl max-w-md">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-full bg-red-100 text-red-600">
                    <Crosshair size={16} className="animate-spin" />
                  </span>
                  <div>
                    <span className="text-[10px] font-black text-red-600 uppercase tracking-wider">
                      正在定位 Day {pinningItem.dayNum} · {pinningItem.markerCode}
                    </span>
                    <h3 className="text-sm font-black text-[#4A3E3D] leading-tight">
                      {pinningItem.title}
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCancelPinning}
                  className="p-1 rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-100 cursor-pointer"
                  title="取消定位"
                >
                  <X size={16} />
                </button>
              </div>

              <p className="text-[11px] text-stone-600 mb-2.5">
                👉 <strong>點擊地圖任意處</strong>放置標記，或<strong>直接拖曳標記</strong>至精確入口。
              </p>

              {draftCoords ? (
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-200">
                  <div className="text-[10px] font-mono text-stone-500">
                    Lat: {draftCoords.lat.toFixed(5)}<br />
                    Lng: {draftCoords.lng.toFixed(5)}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCancelPinning}
                      className="px-3 py-1.5 rounded-xl border border-stone-300 text-stone-600 text-xs font-bold hover:bg-stone-50 cursor-pointer"
                    >
                      取消
                    </button>
                    <button
                      type="button"
                      disabled={isSavingLocation}
                      onClick={handleConfirmLocation}
                      className="px-4 py-1.5 rounded-xl bg-[#5B8266] hover:bg-[#4E7257] text-white text-xs font-black shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Check size={14} />
                      <span>{isSavingLocation ? '儲存中...' : '確認位置'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-1 text-[11px] text-stone-400 font-bold">
                  請在地圖上點選此景點的位置
                </div>
              )}
            </div>
          </div>
        )}

        {/* 浮動控制工具列 (右上方) */}
        <div className="absolute top-3 right-3 z-20 flex flex-col gap-2 pointer-events-auto">
          {/* 重新置中所有標記 (Fit Bounds) */}
          <button
            type="button"
            onClick={handleResetBounds}
            className="p-2.5 rounded-full bg-white/95 backdrop-blur-sm border border-[#E0E5D5] text-[#4A3E3D] hover:text-[#5B8266] hover:bg-white shadow-sm transition-all active:scale-95 cursor-pointer"
            title="縮放並置中至所有景點"
          >
            <Maximize2 size={16} />
          </button>

          {/* Google Maps 多站外部導航按鈕 */}
          {visibleItems.some(i => i.isMapStop && i.hasCoordinates) && (
            <button
              type="button"
              onClick={handleOpenMultiStopDirections}
              className="px-3 py-2 rounded-full bg-[#5B8266] text-white text-xs font-bold shadow-md hover:bg-[#4E7257] transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
              title="將今日所有排定順序地點輸出至 Google Maps 進行真實路況導航"
            >
              <Compass size={14} />
              <span className="hidden sm:inline">Google Maps 多站導航</span>
            </button>
          )}
        </div>

        {/* 浮動提示：行程順序線說明 (左下方) */}
        <div className="absolute bottom-3 left-3 z-20 pointer-events-auto hidden sm:block">
          <div className="bg-white/95 backdrop-blur-sm border border-[#E0E5D5] rounded-xl px-3 py-1.5 shadow-sm text-[10px] text-gray-500 font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#5B8266] animate-pulse" />
            <span>線條依行程時間與順序自動串接 · 遇到未定位站點自動中斷不假造</span>
          </div>
        </div>
      </div>
    </div>
  );
};
