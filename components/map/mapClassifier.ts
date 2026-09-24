/**
 * mapClassifier.ts
 * 
 * 純前端 Schedule Item 分類器 (Classification Layer)
 * 絕不修改原始 Schedule Data。
 * 
 * 優先使用目前 Schedule Item 已有的 type / category / metadata。
 * 支援七大互斥分類：
 * 1. PLACE
 * 2. ACCOMMODATION
 * 3. TRANSPORT
 * 4. FLIGHT
 * 5. ACTIVITY
 * 6. FREE_ACTIVITY
 * 7. OTHER
 */

import { MapItemClassification, MapStatistics, NormalizedMapItem } from './MapTypes';

/**
 * 判定 Schedule Item 的地圖本質分類
 */
export function classifyScheduleItem(item: any): MapItemClassification {
  if (!item) return 'OTHER';

  const type = String(item.type || '').toLowerCase().trim();
  const category = String(item.category || '').toLowerCase().trim();
  const title = String(item.title || item.name || '').trim();
  const location = String(item.location || item.address || '').trim();
  const notes = String(item.notes || '').trim();

  // 1. 航班 FLIGHT
  if (
    type === 'flight' ||
    category === 'flight' ||
    title.includes('航班') ||
    title.includes('搭機') ||
    title.includes('搭乘飛機') ||
    title.includes('飛行') ||
    title.includes('返回台灣') ||
    title.includes('啟程回國') ||
    title.includes('Terminal') ||
    (type === 'transport' && (title.includes('機場') && (title.includes('飛') || title.includes('班機'))))
  ) {
    return 'FLIGHT';
  }

  // 2. 住宿 ACCOMMODATION
  if (
    type === 'stay' ||
    type === 'hotel' ||
    type === 'accommodation' ||
    category === 'stay' ||
    category === 'accommodation' ||
    title.includes('住宿') ||
    title.includes('飯店') ||
    title.includes('酒店') ||
    title.includes('AirB&B') ||
    title.includes('Airbnb') ||
    title.includes('Hostel') ||
    title.includes('Hotel') ||
    title.includes('民宿') ||
    title.includes('Check-in') ||
    title.includes('Check-out') ||
    title.includes('辦理入住') ||
    title.includes('退房')
  ) {
    return 'ACCOMMODATION';
  }

  // 3. 自由活動 / 漫遊 FREE_ACTIVITY
  // 特徵：沒有固定地點、在 location 填寫「未指定地點」或純標記漫步活動
  const isVagueLocation = !location || location === '未指定地點' || location === title;
  const hasFreeRoamKeywords = (
    title.includes('漫遊') ||
    title.includes('自由活動') ||
    title.includes('漫步') ||
    title.includes('市區散步') ||
    title.includes('自由逛逛') ||
    title.includes('伴手禮採買') ||
    title.includes('採買購物') ||
    title.includes('放空') ||
    title.includes('自由探索') ||
    title.endsWith('一日遊') ||
    title.endsWith('半日遊') ||
    title.endsWith('遊') // 例如「羅馬遊」
  );

  if (hasFreeRoamKeywords && isVagueLocation) {
    return 'FREE_ACTIVITY';
  }

  // 4. 交通移動 TRANSPORT
  if (
    type === 'transport' ||
    category === 'transport' ||
    title.includes('返回Airbnb') ||
    title.includes('返回民宿') ||
    title.includes('回飯店') ||
    title.includes('移動') ||
    title.includes('轉乘') ||
    title.includes('火車') ||
    title.includes('搭乘') ||
    title.includes('地鐵') ||
    title.includes('巴士') ||
    title.includes('接駁') ||
    title.includes('高鐵') ||
    title.includes('➔') ||
    title.includes('->') ||
    title.includes('到義大利') ||
    title.includes('到米蘭') ||
    title.includes('到威尼斯') ||
    title.includes('到羅馬')
  ) {
    return 'TRANSPORT';
  }

  // 5. 明確活動 ACTIVITY
  if (
    type === 'activity' ||
    category === 'activity' ||
    title.includes('滑雪') ||
    title.includes('導覽') ||
    title.includes('門票') ||
    title.includes('參觀') ||
    title.includes('體驗') ||
    title.includes('溜滑梯') ||
    title.includes('遊船') ||
    title.includes('纜車') ||
    title.includes('歌劇')
  ) {
    return 'ACTIVITY';
  }

  // 6. 固定地點 PLACE (景點、餐廳、商店、車站、觀景點等)
  if (
    type === 'spot' ||
    type === 'food' ||
    type === 'restaurant' ||
    category === 'spot' ||
    category === 'food' ||
    location.length > 0 ||
    title.length > 0
  ) {
    return 'PLACE';
  }

  return 'OTHER';
}

/**
 * 分類中文名稱對應
 */
export function getClassificationLabel(c: MapItemClassification): string {
  switch (c) {
    case 'PLACE': return '景點/地標';
    case 'ACCOMMODATION': return '住宿/飯店';
    case 'TRANSPORT': return '交通移動';
    case 'FLIGHT': return '航班';
    case 'ACTIVITY': return '固定活動';
    case 'FREE_ACTIVITY': return '自由漫遊';
    case 'OTHER': return '其他項目';
  }
}

/**
 * 判斷是否為實體 Map Stop
 * 規範三：真正可以成為 Map Stop 的主要類型：
 * - PLACE
 * - ACCOMMODATION
 * - 有固定地點的 ACTIVITY
 * (TRANSPORT 與 FLIGHT 不當作普通 Marker；FREE_ACTIVITY 若無固定位置不建立 Marker)
 */
export function isEligibleMapStop(
  classification: MapItemClassification,
  item: any
): boolean {
  if (classification === 'PLACE' || classification === 'ACCOMMODATION') {
    return true;
  }
  if (classification === 'ACTIVITY') {
    // 檢查是否有具體地點資訊
    const loc = String(item?.location || item?.address || '').trim();
    return loc !== '' && loc !== '未指定地點';
  }
  if (classification === 'FREE_ACTIVITY') {
    // 若自由活動被使用者填寫了精確地址或座標，亦可轉為 Map Stop
    const loc = String(item?.location || item?.address || '').trim();
    return loc !== '' && loc !== '未指定地點' && loc !== item?.title;
  }
  return false;
}

/**
 * 嚴格計算 Map Statistics
 * 規範二：
 * 所有分類必須互斥：
 * PLACE + ACCOMMODATION + TRANSPORT + FLIGHT + ACTIVITY + FREE_ACTIVITY + OTHER = totalScheduleItems
 */
export function calculateMapStatistics(items: NormalizedMapItem[]): MapStatistics {
  const stats: MapStatistics = {
    totalScheduleItems: items.length,
    placeCount: 0,
    accommodationCount: 0,
    transportCount: 0,
    flightCount: 0,
    activityCount: 0,
    freeActivityCount: 0,
    otherCount: 0,
    totalMapStops: 0,
    locatedCount: 0,
    gpsCount: 0,
    googleUrlCoordCount: 0,
    geocodedCount: 0,
    addressOnlyCount: 0,
    nameOnlyCount: 0,
    unlocatedCount: 0,
    noFixedLocationCount: 0,
  };

  items.forEach(item => {
    // 1. 七大互斥分類累加
    switch (item.classification) {
      case 'PLACE':
        stats.placeCount++;
        break;
      case 'ACCOMMODATION':
        stats.accommodationCount++;
        break;
      case 'TRANSPORT':
        stats.transportCount++;
        break;
      case 'FLIGHT':
        stats.flightCount++;
        break;
      case 'ACTIVITY':
        stats.activityCount++;
        break;
      case 'FREE_ACTIVITY':
        stats.freeActivityCount++;
        break;
      case 'OTHER':
        stats.otherCount++;
        break;
    }

    // 2. 是否為 Map Stop
    if (item.isMapStop) {
      stats.totalMapStops++;
    }

    // 3. 定位狀態累加
    if (item.hasCoordinates) {
      stats.locatedCount++;
    }

    switch (item.locationStatus) {
      case 'GPS':
        stats.gpsCount++;
        break;
      case 'GOOGLE_URL_COORDINATE':
        stats.googleUrlCoordCount++;
        break;
      case 'GEOCODED':
        stats.geocodedCount++;
        break;
      case 'ADDRESS_ONLY':
        stats.addressOnlyCount++;
        break;
      case 'NAME_ONLY':
        stats.nameOnlyCount++;
        break;
      case 'UNLOCATED':
        stats.unlocatedCount++;
        break;
    }

    if (item.classification === 'FREE_ACTIVITY' || (!item.address && item.locationStatus === 'UNLOCATED')) {
      stats.noFixedLocationCount++;
    }
  });

  return stats;
}
