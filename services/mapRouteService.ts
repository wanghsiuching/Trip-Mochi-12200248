import { db } from '../firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { ManualMapPoint, ManualRouteSegment, ManualTransportType } from '../types';
import { queueWrite } from './tripService';

/**
 * Utility to recursively remove undefined properties from an object.
 * Firestore throws errors when passed undefined field values.
 */
const cleanData = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(cleanData);
  } else if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([_, v]) => v !== undefined)
        .map(([k, v]) => [k, cleanData(v)])
    );
  }
  return obj;
};

// 本地緩存鍵值
const getCacheKey = (tripId: string) => `trip_mochi_map_${tripId}`;

/**
 * 從 localStorage 載入緩存地圖資料
 */
export const getCachedMapData = (tripId: string): { points: ManualMapPoint[]; segments: ManualRouteSegment[] } => {
  if (typeof window === 'undefined' || !tripId) return { points: [], segments: [] };
  try {
    const raw = localStorage.getItem(getCacheKey(tripId));
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        points: Array.isArray(parsed.points) ? parsed.points : [],
        segments: Array.isArray(parsed.segments) ? parsed.segments : []
      };
    }
  } catch (e) {
    console.warn('Failed to parse cached map data:', e);
  }
  return { points: [], segments: [] };
};

/**
 * 寫入地圖資料至 localStorage 緩存
 */
export const setCachedMapData = (tripId: string, points: ManualMapPoint[], segments: ManualRouteSegment[]) => {
  if (typeof window === 'undefined' || !tripId) return;
  try {
    localStorage.setItem(getCacheKey(tripId), JSON.stringify({ points, segments, savedAt: Date.now() }));
  } catch (e) {
    console.warn('Failed to cache map data:', e);
  }
};

/**
 * 監聽特定旅程的地圖標記點與路線段
 */
export const subscribeMapData = (
  tripId: string,
  onUpdate: (points: ManualMapPoint[], segments: ManualRouteSegment[]) => void
): (() => void) => {
  if (!tripId) {
    onUpdate([], []);
    return () => {};
  }

  // 先讀取本機快取以利瞬間渲染
  const cached = getCachedMapData(tripId);
  if (cached.points.length > 0 || cached.segments.length > 0) {
    onUpdate(cached.points, cached.segments);
  }

  const pointsCol = collection(db, 'trips', tripId, 'mapPoints');
  const segmentsCol = collection(db, 'trips', tripId, 'mapSegments');

  let currentPoints: ManualMapPoint[] = cached.points;
  let currentSegments: ManualRouteSegment[] = cached.segments;

  const notify = () => {
    // 依天數與序號嚴格排序 points
    const sortedPoints = [...currentPoints].sort((a, b) => {
      if (a.day !== b.day) return (a.day || '').localeCompare(b.day || '');
      return (a.sequence || 0) - (b.sequence || 0);
    });

    const sortedSegments = [...currentSegments].sort((a, b) => {
      if (a.day !== b.day) return (a.day || '').localeCompare(b.day || '');
      return (a.sequence || 0) - (b.sequence || 0);
    });

    setCachedMapData(tripId, sortedPoints, sortedSegments);
    onUpdate(sortedPoints, sortedSegments);
  };

  const unsubPoints = onSnapshot(pointsCol, (snap) => {
    const list: ManualMapPoint[] = [];
    snap.forEach((d) => {
      const data = d.data() as ManualMapPoint;
      if (data && data.id) {
        list.push(data);
      }
    });
    currentPoints = list;
    notify();
  }, (err) => {
    console.warn('Failed to listen to mapPoints subcollection:', err);
  });

  const unsubSegments = onSnapshot(segmentsCol, (snap) => {
    const list: ManualRouteSegment[] = [];
    snap.forEach((d) => {
      const data = d.data() as ManualRouteSegment;
      if (data && data.id) {
        list.push(data);
      }
    });
    currentSegments = list;
    notify();
  }, (err) => {
    console.warn('Failed to listen to mapSegments subcollection:', err);
  });

  return () => {
    unsubPoints();
    unsubSegments();
  };
};

/**
 * 儲存或更新單一地圖標記點
 */
export const saveMapPoint = async (tripId: string, point: ManualMapPoint): Promise<void> => {
  if (!tripId || !point || !point.id) return;
  const docRef = doc(db, 'trips', tripId, 'mapPoints', point.id);
  const now = new Date().toISOString();
  const cleaned = cleanData({
    ...point,
    locationSource: 'manual_map',
    updatedAt: now,
    createdAt: point.createdAt || now
  });

  await queueWrite(async () => {
    await setDoc(docRef, cleaned, { merge: true });
  });
};

/**
 * 拖曳 Marker 後更新座標（永久標記為 manual_map，杜絕 Geocoding 覆蓋）
 */
export const updateMapPointLocation = async (
  tripId: string, 
  pointId: string, 
  lat: number, 
  lng: number
): Promise<void> => {
  if (!tripId || !pointId) return;
  const docRef = doc(db, 'trips', tripId, 'mapPoints', pointId);
  const now = new Date().toISOString();

  await queueWrite(async () => {
    await setDoc(docRef, cleanData({
      latitude: lat,
      longitude: lng,
      locationSource: 'manual_map',
      updatedAt: now
    }), { merge: true });
  });
};

/**
 * 儲存或更新路線交通段
 */
export const saveRouteSegment = async (tripId: string, segment: ManualRouteSegment): Promise<void> => {
  if (!tripId || !segment || !segment.id) return;
  const docRef = doc(db, 'trips', tripId, 'mapSegments', segment.id);
  const now = new Date().toISOString();
  const cleaned = cleanData({
    ...segment,
    updatedAt: now,
    createdAt: segment.createdAt || now
  });

  await queueWrite(async () => {
    await setDoc(docRef, cleaned, { merge: true });
  });
};

/**
 * 更新路線交通段之交通方式
 */
export const updateRouteSegmentTransport = async (
  tripId: string,
  segmentId: string,
  transportType: ManualTransportType,
  extraData?: Partial<ManualRouteSegment>
): Promise<void> => {
  if (!tripId || !segmentId) return;
  const docRef = doc(db, 'trips', tripId, 'mapSegments', segmentId);
  const now = new Date().toISOString();

  await queueWrite(async () => {
    await setDoc(docRef, cleanData({
      transportType,
      ...extraData,
      updatedAt: now
    }), { merge: true });
  });
};

/**
 * 刪除地圖標記點並自動重新平衡當天序號與路線段
 * 注意：絕不修改或刪除原始 ScheduleItem！
 */
export const deleteMapPointAndRebalance = async (
  tripId: string,
  day: string,
  pointIdToDelete: string,
  allPoints: ManualMapPoint[],
  allSegments: ManualRouteSegment[]
): Promise<void> => {
  if (!tripId || !pointIdToDelete) return;

  const dayPoints = allPoints
    .filter(p => p.day === day)
    .sort((a, b) => a.sequence - b.sequence);

  const targetIndex = dayPoints.findIndex(p => p.id === pointIdToDelete);
  if (targetIndex === -1) return;

  const prevPoint = targetIndex > 0 ? dayPoints[targetIndex - 1] : null;
  const nextPoint = targetIndex < dayPoints.length - 1 ? dayPoints[targetIndex + 1] : null;

  // 1. 刪除該點
  const pointDocRef = doc(db, 'trips', tripId, 'mapPoints', pointIdToDelete);
  await queueWrite(async () => {
    await deleteDoc(pointDocRef);
  });

  // 2. 重新編號剩餘的當天點
  const remainingPoints = dayPoints.filter(p => p.id !== pointIdToDelete);
  const renumberedPoints = remainingPoints.map((pt, idx) => ({
    ...pt,
    sequence: idx + 1,
    updatedAt: new Date().toISOString()
  }));

  // 批量更新剩餘點的序號
  for (const pt of renumberedPoints) {
    if (pt.sequence !== dayPoints.find(dp => dp.id === pt.id)?.sequence) {
      await saveMapPoint(tripId, pt);
    }
  }

  // 3. 處理相關的交通線段
  const daySegments = allSegments.filter(s => s.day === day);
  const inSegment = daySegments.find(s => s.toPointId === pointIdToDelete);
  const outSegment = daySegments.find(s => s.fromPointId === pointIdToDelete);

  // 刪除進入與出去的舊線段
  if (inSegment) {
    await queueWrite(async () => {
      await deleteDoc(doc(db, 'trips', tripId, 'mapSegments', inSegment.id));
    });
  }
  if (outSegment) {
    await queueWrite(async () => {
      await deleteDoc(doc(db, 'trips', tripId, 'mapSegments', outSegment.id));
    });
  }

  // 如果原本前後都有點 (prevPoint 與 nextPoint)，則建立新連線 prevPoint -> nextPoint
  if (prevPoint && nextPoint) {
    // 繼承原本 inSegment 的交通方式，若無則預設 WALK
    const inheritedTransport = inSegment?.transportType || outSegment?.transportType || 'WALK';
    const newSegmentId = `seg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newSegment: ManualRouteSegment = {
      id: newSegmentId,
      tripId,
      day,
      fromPointId: prevPoint.id,
      toPointId: nextPoint.id,
      transportType: inheritedTransport,
      sequence: prevPoint.sequence,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await saveRouteSegment(tripId, newSegment);
  }
};

/**
 * 當天點重新排序並重新建立相鄰路線段
 */
export const reorderMapPointsAndRebalance = async (
  tripId: string,
  day: string,
  reorderedPoints: ManualMapPoint[],
  existingSegments: ManualRouteSegment[]
): Promise<void> => {
  if (!tripId || reorderedPoints.length === 0) return;

  const now = new Date().toISOString();

  // 1. 更新所有點的 sequence
  const updatedPoints: ManualMapPoint[] = reorderedPoints.map((p, idx) => ({
    ...p,
    sequence: idx + 1,
    updatedAt: now
  }));

  for (const pt of updatedPoints) {
    await saveMapPoint(tripId, pt);
  }

  // 2. 獲取現有當天的線段映射表：fromPointId -> toPointId => segment
  const daySegments = existingSegments.filter(s => s.day === day);
  const segMap = new Map<string, ManualRouteSegment>();
  daySegments.forEach(s => {
    segMap.set(`${s.fromPointId}_${s.toPointId}`, s);
  });

  // 3. 建立新的相鄰線段
  const neededSegmentKeys = new Set<string>();

  for (let i = 0; i < updatedPoints.length - 1; i++) {
    const from = updatedPoints[i];
    const to = updatedPoints[i + 1];
    const key = `${from.id}_${to.id}`;
    neededSegmentKeys.add(key);

    const existing = segMap.get(key);
    if (existing) {
      // 保持原本的交通方式，更新 sequence
      if (existing.sequence !== i + 1) {
        await saveRouteSegment(tripId, {
          ...existing,
          sequence: i + 1,
          updatedAt: now
        });
      }
    } else {
      // 檢查是否有反向的交通方式可參考，若無則預設 WALK
      const reverse = segMap.get(`${to.id}_${from.id}`);
      const transportType = reverse?.transportType || 'WALK';
      const newSegId = `seg_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`;
      await saveRouteSegment(tripId, {
        id: newSegId,
        tripId,
        day,
        fromPointId: from.id,
        toPointId: to.id,
        transportType,
        sequence: i + 1,
        createdAt: now,
        updatedAt: now
      });
    }
  }

  // 4. 清理不再相鄰的舊線段
  for (const seg of daySegments) {
    const key = `${seg.fromPointId}_${seg.toPointId}`;
    if (!neededSegmentKeys.has(key)) {
      await queueWrite(async () => {
        await deleteDoc(doc(db, 'trips', tripId, 'mapSegments', seg.id));
      });
    }
  }
};
