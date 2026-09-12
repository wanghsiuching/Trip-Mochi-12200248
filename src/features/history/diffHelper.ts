import { ChangedField, HistoryEntityType } from './types';

// Friendly Chinese labels for fields
const FIELD_LABELS: Record<string, string> = {
  title: '名稱',
  name: '名稱',
  airline: '航空公司',
  carModel: '車型',
  company: '租車公司',
  time: '時間',
  date: '日期',
  arrivalDate: '抵達日期',
  returnDate: '回程日期',
  checkInDate: '入住日期',
  checkOutDate: '退房日期',
  pickupDate: '取車日期',
  returnDate_car: '還車日期',
  location: '地點',
  address: '地址',
  origin: '出發地',
  dest: '目的地',
  destCity: '目的城市',
  originCity: '出發城市',
  amount: '金額',
  cost: '費用',
  price: '費用',
  currency: '幣別',
  payer: '付款人',
  paymentMethod: '支付方式',
  notes: '筆記備註',
  note: '備註',
  category: '分類',
  assignedDate: '排入日期',
  isVisited: '踩點狀態',
  done: '完成狀態',
  isPotential: '狀態 (備案/確定)',
};

/**
 * Compare two simple or nested values
 */
function isDifferent(val1: any, val2: any): boolean {
  if (val1 === val2) return false;
  if ((val1 === undefined || val1 === null || val1 === '') && 
      (val2 === undefined || val2 === null || val2 === '')) {
    return false;
  }
  if (typeof val1 === 'object' && typeof val2 === 'object') {
    return JSON.stringify(val1) !== JSON.stringify(val2);
  }
  return true;
}

/**
 * Format value into clean, readable text
 */
export function formatValueForDisplay(field: string, val: any): string {
  if (val === undefined || val === null || val === '') return '(空)';
  if (typeof val === 'boolean') {
    if (field === 'isVisited') return val ? '已踩點' : '未踩點';
    if (field === 'done') return val ? '已完成' : '未完成';
    if (field === 'isPotential') return val ? '備案' : '確定';
    return val ? '是' : '否';
  }
  if (typeof val === 'number') {
    return String(val);
  }
  if (typeof val === 'object') {
    if (Array.isArray(val)) return val.length ? val.join(', ') : '(無)';
    return JSON.stringify(val);
  }
  return String(val);
}

/**
 * Calculate changed fields between before and after versions of an entity
 */
export function computeEntityDiff(
  before: Record<string, any>,
  after: Record<string, any>,
  _entityType: HistoryEntityType
): ChangedField[] {
  const changed: ChangedField[] = [];
  const ignoredKeys = new Set([
    'id',
    'createdAt',
    'updatedAt',
    'schemaVersion',
    'imageReferences',
    'images',
    'photos',
    'image',
    'comments',
    'order',
    'deletedAt',
    'deletedBy',
  ]);

  const allKeys = Array.from(new Set([...Object.keys(before || {}), ...Object.keys(after || {})]));

  for (const key of allKeys) {
    if (ignoredKeys.has(key)) continue;

    const valBefore = before ? before[key] : undefined;
    const valAfter = after ? after[key] : undefined;

    if (isDifferent(valBefore, valAfter)) {
      changed.push({
        field: key,
        label: FIELD_LABELS[key] || key,
        before: valBefore ?? null,
        after: valAfter ?? null,
      });
    }
  }

  return changed;
}
