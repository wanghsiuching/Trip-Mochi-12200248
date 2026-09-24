import { useState, useEffect, useMemo, useCallback } from 'react';
import { ManualMapPoint, ManualRouteSegment, ManualTransportType } from '../types';
import { 
  subscribeMapData, 
  saveMapPoint, 
  saveRouteSegment, 
  updateMapPointLocation, 
  updateRouteSegmentTransport, 
  deleteMapPointAndRebalance, 
  reorderMapPointsAndRebalance,
  getCachedMapData 
} from '../services/mapRouteService';

export const useMapRouteData = (tripId: string) => {
  const [mapPoints, setMapPoints] = useState<ManualMapPoint[]>(() => {
    return getCachedMapData(tripId).points;
  });
  const [routeSegments, setRouteSegments] = useState<ManualRouteSegment[]>(() => {
    return getCachedMapData(tripId).segments;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tripId) {
      setMapPoints([]);
      setRouteSegments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeMapData(tripId, (points, segments) => {
      setMapPoints(points);
      setRouteSegments(segments);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [tripId]);

  // 新增標記點並自動建立前一個點到此點的路線段
  const handleAddPoint = useCallback(async (
    newPointData: {
      day: string;
      dayIndex?: number;
      title: string;
      latitude: number;
      longitude: number;
      scheduleItemId?: string;
      pointType: ManualMapPoint['pointType'];
      notes?: string;
    },
    transportFromPrev: ManualTransportType = 'WALK'
  ) => {
    if (!tripId) return;

    const dayPoints = mapPoints
      .filter(p => p.day === newPointData.day)
      .sort((a, b) => a.sequence - b.sequence);

    const nextSequence = dayPoints.length + 1;
    const pointId = `pt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const newPoint: ManualMapPoint = {
      id: pointId,
      tripId,
      day: newPointData.day,
      dayIndex: newPointData.dayIndex,
      sequence: nextSequence,
      title: newPointData.title.trim() || `地點 #${nextSequence}`,
      latitude: newPointData.latitude,
      longitude: newPointData.longitude,
      scheduleItemId: newPointData.scheduleItemId,
      pointType: newPointData.pointType || 'CUSTOM_POINT',
      locationSource: 'manual_map',
      notes: newPointData.notes,
      createdAt: now,
      updatedAt: now
    };

    // 樂觀更新 state
    setMapPoints(prev => [...prev, newPoint]);

    // 儲存點
    await saveMapPoint(tripId, newPoint);

    // 如果該天已有前一個點，自動連線
    if (dayPoints.length > 0) {
      const prevPoint = dayPoints[dayPoints.length - 1];
      const segmentId = `seg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newSegment: ManualRouteSegment = {
        id: segmentId,
        tripId,
        day: newPointData.day,
        fromPointId: prevPoint.id,
        toPointId: newPoint.id,
        transportType: transportFromPrev,
        sequence: dayPoints.length, // 1st segment connects point 1 and 2
        createdAt: now,
        updatedAt: now
      };

      setRouteSegments(prev => [...prev, newSegment]);
      await saveRouteSegment(tripId, newSegment);
    }
  }, [tripId, mapPoints]);

  // 拖曳 Marker 變更位置
  const handleUpdatePointLocation = useCallback(async (
    pointId: string, 
    latitude: number, 
    longitude: number
  ) => {
    if (!tripId || !pointId) return;

    // 樂觀更新
    setMapPoints(prev => prev.map(p => 
      p.id === pointId 
        ? { ...p, latitude, longitude, locationSource: 'manual_map', updatedAt: new Date().toISOString() } 
        : p
    ));

    await updateMapPointLocation(tripId, pointId, latitude, longitude);
  }, [tripId]);

  // 刪除點並自動重排序號與連線
  const handleDeletePoint = useCallback(async (pointId: string, day: string) => {
    if (!tripId || !pointId) return;

    // 樂觀更新
    const dayPoints = mapPoints.filter(p => p.day === day).sort((a, b) => a.sequence - b.sequence);
    const remainingDayPoints = dayPoints
      .filter(p => p.id !== pointId)
      .map((p, idx) => ({ ...p, sequence: idx + 1 }));

    setMapPoints(prev => [
      ...prev.filter(p => p.day !== day),
      ...remainingDayPoints
    ]);

    await deleteMapPointAndRebalance(tripId, day, pointId, mapPoints, routeSegments);
  }, [tripId, mapPoints, routeSegments]);

  // 重新排序當天點
  const handleReorderPoints = useCallback(async (day: string, reorderedPoints: ManualMapPoint[]) => {
    if (!tripId || reorderedPoints.length === 0) return;

    const normalized = reorderedPoints.map((p, idx) => ({
      ...p,
      sequence: idx + 1
    }));

    setMapPoints(prev => [
      ...prev.filter(p => p.day !== day),
      ...normalized
    ]);

    await reorderMapPointsAndRebalance(tripId, day, normalized, routeSegments);
  }, [tripId, routeSegments]);

  // 更新路段交通方式
  const handleUpdateSegmentTransport = useCallback(async (
    segmentId: string, 
    transportType: ManualTransportType,
    extra?: Partial<ManualRouteSegment>
  ) => {
    if (!tripId || !segmentId) return;

    setRouteSegments(prev => prev.map(s => 
      s.id === segmentId 
        ? { ...s, transportType, ...extra, updatedAt: new Date().toISOString() } 
        : s
    ));

    await updateRouteSegmentTransport(tripId, segmentId, transportType, extra);
  }, [tripId]);

  // 更新標記點標題與類別
  const handleUpdatePointTitle = useCallback(async (
    pointId: string,
    title: string,
    pointType: ManualMapPoint['pointType']
  ) => {
    if (!tripId || !pointId) return;

    setMapPoints(prev => prev.map(p => 
      p.id === pointId 
        ? { ...p, title, pointType, updatedAt: new Date().toISOString() } 
        : p
    ));

    const existingPoint = mapPoints.find(p => p.id === pointId);
    if (existingPoint) {
      await saveMapPoint(tripId, {
        ...existingPoint,
        title,
        pointType
      });
    }
  }, [tripId, mapPoints]);

  return {
    mapPoints,
    routeSegments,
    loading,
    handleAddPoint,
    handleUpdatePointLocation,
    handleUpdatePointTitle,
    handleDeletePoint,
    handleReorderPoints,
    handleUpdateSegmentTransport
  };
};
