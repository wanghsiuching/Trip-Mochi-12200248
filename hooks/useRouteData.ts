import { useState, useEffect, useCallback, useRef } from 'react';
import { RoutePoint, RouteSegment, RouteTransportType, ScheduleItem, RoutePointSource } from '../types';
import { isValidCoordinate, extractValidCoordinateFromGoogleUrl } from '../utils/locationUtils';
import { updateTripField } from '../services/tripService';

interface UndoSnapshot {
  points: RoutePoint[];
  segments: RouteSegment[];
}

/**
 * 每日路段重建函式
 * 根據點位當前排序重新串接 ① → ②, ② → ③...
 * 優先保留使用者先前設定的 transportType
 */
export function rebuildDaySegments(
  dayId: string,
  dayPoints: RoutePoint[],
  existingSegments: RouteSegment[]
): RouteSegment[] {
  if (dayPoints.length < 2) return [];

  const existingMap = new Map<string, RouteTransportType>();
  existingSegments.forEach(s => {
    existingMap.set(`${s.fromPointId}->${s.toPointId}`, s.transportType);
  });

  const newSegments: RouteSegment[] = [];
  for (let i = 0; i < dayPoints.length - 1; i++) {
    const from = dayPoints[i];
    const to = dayPoints[i + 1];
    const key = `${from.id}->${to.id}`;
    // 預設步行，若先前已有設定則保留
    const transportType = existingMap.get(key) || 'WALK';
    newSegments.push({
      id: `seg_${dayId}_${from.id}_${to.id}`,
      dayId,
      fromPointId: from.id,
      toPointId: to.id,
      transportType,
    });
  }

  return newSegments;
}

/**
 * 每日點位重新編號函式 (1-based: 1, 2, 3...)
 */
export function resequenceDayPoints(dayPoints: RoutePoint[]): RoutePoint[] {
  return dayPoints.map((pt, idx) => ({
    ...pt,
    sequence: idx + 1,
  }));
}

export const useRouteData = (tripId: string) => {
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
  const [routeSegments, setRouteSegments] = useState<RouteSegment[]>([]);
  const [undoStack, setUndoStack] = useState<UndoSnapshot[]>([]);

  const storageKeyPoints = `trip_mochi_route_points_${tripId || 'local'}`;
  const storageKeySegments = `trip_mochi_route_segments_${tripId || 'local'}`;

  // 1. 初始化讀取快取
  useEffect(() => {
    if (!tripId) return;
    try {
      const savedPoints = localStorage.getItem(storageKeyPoints);
      const savedSegments = localStorage.getItem(storageKeySegments);
      if (savedPoints) {
        setRoutePoints(JSON.parse(savedPoints));
      }
      if (savedSegments) {
        setRouteSegments(JSON.parse(savedSegments));
      }
    } catch (e) {
      console.warn("Failed to load cached route data:", e);
    }
  }, [tripId, storageKeyPoints, storageKeySegments]);

  // 2. 持久化存儲
  const persistState = useCallback((newPoints: RoutePoint[], newSegments: RouteSegment[]) => {
    try {
      localStorage.setItem(storageKeyPoints, JSON.stringify(newPoints));
      localStorage.setItem(storageKeySegments, JSON.stringify(newSegments));
      if (tripId) {
        updateTripField(tripId, 'routePoints' as any, newPoints).catch(() => {});
        updateTripField(tripId, 'routeSegments' as any, newSegments).catch(() => {});
      }
    } catch (e) {
      console.warn("Failed to persist route data:", e);
    }
  }, [tripId, storageKeyPoints, storageKeySegments]);

  // 保存 Undo 快照
  const pushUndo = useCallback(() => {
    setUndoStack(prev => [...prev.slice(-10), { points: routePoints, segments: routeSegments }]);
  }, [routePoints, routeSegments]);

  // 執行 Undo
  const undo = useCallback(() => {
    if (undoStack.length === 0) return;
    const last = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));
    setRoutePoints(last.points);
    setRouteSegments(last.segments);
    persistState(last.points, last.segments);
  }, [undoStack, persistState]);

  /**
   * 手動新增路線點 (來自地圖點擊 manual_map)
   * 每日重新從 ① 開始編號
   */
  const addRoutePoint = useCallback((dayId: string, data: {
    title: string;
    latitude: number;
    longitude: number;
    source?: RoutePointSource;
    linkedScheduleItemId?: string;
    address?: string;
  }) => {
    pushUndo();

    setRoutePoints(prevPoints => {
      const dayPoints = prevPoints.filter(p => p.dayId === dayId);
      const nextSequence = dayPoints.length + 1;

      const newPoint: RoutePoint = {
        id: `pt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        dayId,
        sequence: nextSequence,
        title: data.title.trim() || `第 ${nextSequence} 站`,
        latitude: data.latitude,
        longitude: data.longitude,
        linkedScheduleItemId: data.linkedScheduleItemId,
        isConfirmed: isValidCoordinate(data.latitude, data.longitude),
        source: data.source || 'manual_map',
        address: data.address,
      };

      const updatedDayPoints = [...dayPoints, newPoint];
      const otherDayPoints = prevPoints.filter(p => p.dayId !== dayId);
      const allUpdatedPoints = [...otherDayPoints, ...updatedDayPoints];

      setRouteSegments(prevSegments => {
        const otherSegments = prevSegments.filter(s => s.dayId !== dayId);
        const daySegments = prevSegments.filter(s => s.dayId === dayId);
        const updatedDaySegments = rebuildDaySegments(dayId, updatedDayPoints, daySegments);
        const allUpdatedSegments = [...otherSegments, ...updatedDaySegments];

        persistState(allUpdatedPoints, allUpdatedSegments);
        return allUpdatedSegments;
      });

      return allUpdatedPoints;
    });
  }, [pushUndo, persistState]);

  /**
   * 更新點位座標 (例如地圖拖曳 Marker)
   * 依原則：地圖手動拖曳屬最高優先級 manual_map
   */
  const updatePointCoordinate = useCallback((pointId: string, lat: number, lng: number) => {
    if (!isValidCoordinate(lat, lng)) return;

    setRoutePoints(prev => {
      const updated = prev.map(p => {
        if (p.id === pointId) {
          return {
            ...p,
            latitude: lat,
            longitude: lng,
            isConfirmed: true,
            source: 'manual_map' as RoutePointSource,
          };
        }
        return p;
      });
      persistState(updated, routeSegments);
      return updated;
    });
  }, [routeSegments, persistState]);

  /**
   * 更新點位標題或關聯
   */
  const updatePointDetails = useCallback((pointId: string, details: Partial<RoutePoint>) => {
    setRoutePoints(prev => {
      const updated = prev.map(p => {
        if (p.id === pointId) {
          return { ...p, ...details };
        }
        return p;
      });
      persistState(updated, routeSegments);
      return updated;
    });
  }, [routeSegments, persistState]);

  /**
   * 重新排序當天點位
   * 立即重新編號 ①, ②, ③, ④... 並重建路段
   */
  const reorderDayPoints = useCallback((dayId: string, orderedIds: string[]) => {
    pushUndo();

    setRoutePoints(prevPoints => {
      const otherDayPoints = prevPoints.filter(p => p.dayId !== dayId);
      const currentDayPoints = prevPoints.filter(p => p.dayId === dayId);

      const idMap = new Map<string, RoutePoint>();
      currentDayPoints.forEach(p => idMap.set(p.id, p));

      const reordered: RoutePoint[] = [];
      orderedIds.forEach(id => {
        const item = idMap.get(id);
        if (item) reordered.push(item);
      });
      // 補上未在 orderedIds 中的 (防禦性)
      currentDayPoints.forEach(p => {
        if (!orderedIds.includes(p.id)) reordered.push(p);
      });

      const sequencedDayPoints = resequenceDayPoints(reordered);
      const allUpdatedPoints = [...otherDayPoints, ...sequencedDayPoints];

      setRouteSegments(prevSegments => {
        const otherSegments = prevSegments.filter(s => s.dayId !== dayId);
        const daySegments = prevSegments.filter(s => s.dayId === dayId);
        const updatedDaySegments = rebuildDaySegments(dayId, sequencedDayPoints, daySegments);
        const allUpdatedSegments = [...otherSegments, ...updatedDaySegments];

        persistState(allUpdatedPoints, allUpdatedSegments);
        return allUpdatedSegments;
      });

      return allUpdatedPoints;
    });
  }, [pushUndo, persistState]);

  /**
   * 向上或向下移動點位
   */
  const movePoint = useCallback((dayId: string, pointId: string, direction: 'up' | 'down') => {
    const dayPoints = routePoints.filter(p => p.dayId === dayId).sort((a, b) => a.sequence - b.sequence);
    const index = dayPoints.findIndex(p => p.id === pointId);
    if (index === -1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= dayPoints.length) return;

    const newOrder = [...dayPoints];
    [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];

    reorderDayPoints(dayId, newOrder.map(p => p.id));
  }, [routePoints, reorderDayPoints]);

  /**
   * 刪除路線點
   * 原則：刪除 ② 後，原本的 ③→④ 自動接合為 ②→③，並立即重新編號
   */
  const deletePoint = useCallback((pointId: string) => {
    pushUndo();

    setRoutePoints(prevPoints => {
      const targetPoint = prevPoints.find(p => p.id === pointId);
      if (!targetPoint) return prevPoints;

      const dayId = targetPoint.dayId;
      const otherDayPoints = prevPoints.filter(p => p.dayId !== dayId);
      const remainingDayPoints = prevPoints
        .filter(p => p.dayId === dayId && p.id !== pointId)
        .sort((a, b) => a.sequence - b.sequence);

      const sequencedDayPoints = resequenceDayPoints(remainingDayPoints);
      const allUpdatedPoints = [...otherDayPoints, ...sequencedDayPoints];

      setRouteSegments(prevSegments => {
        const otherSegments = prevSegments.filter(s => s.dayId !== dayId);
        const daySegments = prevSegments.filter(s => s.dayId === dayId);
        const updatedDaySegments = rebuildDaySegments(dayId, sequencedDayPoints, daySegments);
        const allUpdatedSegments = [...otherSegments, ...updatedDaySegments];

        persistState(allUpdatedPoints, allUpdatedSegments);
        return allUpdatedSegments;
      });

      return allUpdatedPoints;
    });
  }, [pushUndo, persistState]);

  /**
   * 更新路段交通工具 (WALK, SUBWAY, TRAIN, BUS, etc.)
   */
  const updateSegmentTransport = useCallback((segmentId: string, transportType: RouteTransportType) => {
    setRouteSegments(prev => {
      const updated = prev.map(s => {
        if (s.id === segmentId) {
          return { ...s, transportType };
        }
        return s;
      });
      persistState(routePoints, updated);
      return updated;
    });
  }, [routePoints, persistState]);

  /**
   * 從當日行程項目匯入至路線 (嚴格遵守「絕不依名稱猜測 GPS」原則)
   * 1. 若該項目手動含有 gps (item.gps.lat/lng)，則以 existing_manual_gps 匯入
   * 2. 若 googleMapUrl 含有明確數字座標，則以 google_url_coordinate 匯入
   * 3. 若無上述座標，建立為 isConfirmed = false (待設定位置)，絕不模糊推測！
   */
  const importItemToDayRoute = useCallback((dayId: string, item: ScheduleItem) => {
    // 檢查是否已關聯
    const alreadyLinked = routePoints.find(p => p.linkedScheduleItemId === item.id);
    if (alreadyLinked) return;

    let lat = 0;
    let lng = 0;
    let isConfirmed = false;
    let source: RoutePointSource = 'other';

    if (item.gps && isValidCoordinate(parseFloat(item.gps.lat), parseFloat(item.gps.lng))) {
      lat = parseFloat(item.gps.lat);
      lng = parseFloat(item.gps.lng);
      isConfirmed = true;
      source = 'existing_manual_gps';
    } else if (item.googleMapUrl) {
      const extracted = extractValidCoordinateFromGoogleUrl(item.googleMapUrl);
      if (extracted) {
        lat = extracted.lat;
        lng = extracted.lng;
        isConfirmed = true;
        source = 'google_url_coordinate';
      }
    }

    pushUndo();

    setRoutePoints(prevPoints => {
      const dayPoints = prevPoints.filter(p => p.dayId === dayId);
      const nextSequence = dayPoints.length + 1;

      const newPoint: RoutePoint = {
        id: `pt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        dayId,
        sequence: nextSequence,
        title: item.title || item.location || `第 ${nextSequence} 站`,
        latitude: lat,
        longitude: lng,
        linkedScheduleItemId: item.id,
        isConfirmed,
        source,
        address: item.address || item.location,
      };

      const updatedDayPoints = [...dayPoints, newPoint];
      const otherDayPoints = prevPoints.filter(p => p.dayId !== dayId);
      const allUpdatedPoints = [...otherDayPoints, ...updatedDayPoints];

      setRouteSegments(prevSegments => {
        const otherSegments = prevSegments.filter(s => s.dayId !== dayId);
        const daySegments = prevSegments.filter(s => s.dayId === dayId);
        const updatedDaySegments = rebuildDaySegments(dayId, updatedDayPoints, daySegments);
        const allUpdatedSegments = [...otherSegments, ...updatedDaySegments];

        persistState(allUpdatedPoints, allUpdatedSegments);
        return allUpdatedSegments;
      });

      return allUpdatedPoints;
    });
  }, [routePoints, pushUndo, persistState]);

  return {
    routePoints,
    routeSegments,
    undoStack,
    canUndo: undoStack.length > 0,
    undo,
    addRoutePoint,
    updatePointCoordinate,
    updatePointDetails,
    reorderDayPoints,
    movePoint,
    deletePoint,
    updateSegmentTransport,
    importItemToDayRoute,
  };
};
