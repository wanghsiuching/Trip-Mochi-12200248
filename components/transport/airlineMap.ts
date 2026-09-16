/**
 * 航空公司與機場中英名稱對照字典
 * 用於高質感手帳雙語顯示（純前端視覺輔助，無外部 API，無任何破壞性改動）
 */

export const AIRLINE_INFO_MAP: Record<string, { en: string; code?: string }> = {
  '阿提哈德航空': { en: 'Etihad Airways', code: 'EY' },
  'Etihad Airways': { en: 'Etihad Airways', code: 'EY' },
  'Etihad': { en: 'Etihad Airways', code: 'EY' },
  '長榮航空': { en: 'EVA Air', code: 'BR' },
  'EVA Air': { en: 'EVA Air', code: 'BR' },
  '中華航空': { en: 'China Airlines', code: 'CI' },
  '華航': { en: 'China Airlines', code: 'CI' },
  'China Airlines': { en: 'China Airlines', code: 'CI' },
  '星宇航空': { en: 'STARLUX Airlines', code: 'JX' },
  'STARLUX': { en: 'STARLUX Airlines', code: 'JX' },
  '國泰航空': { en: 'Cathay Pacific', code: 'CX' },
  'Cathay Pacific': { en: 'Cathay Pacific', code: 'CX' },
  '日本航空': { en: 'Japan Airlines', code: 'JL' },
  'Japan Airlines': { en: 'Japan Airlines', code: 'JL' },
  'JAL': { en: 'Japan Airlines', code: 'JL' },
  '全日空': { en: 'All Nippon Airways', code: 'NH' },
  'ANA': { en: 'All Nippon Airways', code: 'NH' },
  '大韓航空': { en: 'Korean Air', code: 'KE' },
  'Korean Air': { en: 'Korean Air', code: 'KE' },
  '韓亞航空': { en: 'Asiana Airlines', code: 'OZ' },
  '新加坡航空': { en: 'Singapore Airlines', code: 'SQ' },
  'Singapore Airlines': { en: 'Singapore Airlines', code: 'SQ' },
  '阿聯酋航空': { en: 'Emirates', code: 'EK' },
  'Emirates': { en: 'Emirates', code: 'EK' },
  '卡達航空': { en: 'Qatar Airways', code: 'QR' },
  'Qatar Airways': { en: 'Qatar Airways', code: 'QR' },
  '土耳其航空': { en: 'Turkish Airlines', code: 'TK' },
  '法國航空': { en: 'Air France', code: 'AF' },
  '荷蘭皇家航空': { en: 'KLM Royal Dutch Airlines', code: 'KL' },
  '德國漢莎航空': { en: 'Lufthansa', code: 'LH' },
  '瑞士國際航空': { en: 'Swiss International Air Lines', code: 'LX' },
  'SWISS': { en: 'Swiss International Air Lines', code: 'LX' },
  '聯合航空': { en: 'United Airlines', code: 'UA' },
  '達美航空': { en: 'Delta Air Lines', code: 'DL' },
  '美國航空': { en: 'American Airlines', code: 'AA' },
  '酷航': { en: 'Scoot', code: 'TR' },
  '樂桃航空': { en: 'Peach Aviation', code: 'MM' },
  '台灣虎航': { en: 'Tigerair Taiwan', code: 'IT' },
};

export const AIRPORT_INFO_MAP: Record<string, { city: string; subName: string }> = {
  'TPE': { city: '桃園', subName: '台北・桃園國際機場' },
  'TSA': { city: '松山', subName: '台北松山機場' },
  'KHH': { city: '高雄', subName: '高雄國際機場' },
  'AUH': { city: '阿布達比', subName: '阿布達比國際機場' },
  'DXB': { city: '杜拜', subName: '杜拜國際機場' },
  'ZRH': { city: '蘇黎世', subName: '蘇黎世國際機場' },
  'GVA': { city: '日內瓦', subName: '日內瓦國際機場' },
  'CDG': { city: '巴黎', subName: '巴黎戴高樂機場' },
  'ORY': { city: '巴黎', subName: '巴黎奧利機場' },
  'LHR': { city: '倫敦', subName: '倫敦希斯洛機場' },
  'FRA': { city: '法蘭克福', subName: '法蘭克福機場' },
  'MUC': { city: '慕尼黑', subName: '慕尼黑機場' },
  'AMS': { city: '阿姆斯特丹', subName: '阿姆斯特丹史基浦機場' },
  'VIE': { city: '維也納', subName: '維也納國際機場' },
  'NRT': { city: '東京', subName: '成田國際機場' },
  'HND': { city: '東京', subName: '羽田國際機場' },
  'KIX': { city: '大阪', subName: '關西國際機場' },
  'FUK': { city: '福岡', subName: '福岡機場' },
  'CTS': { city: '札幌', subName: '新千歲機場' },
  'OKA': { city: '沖繩', subName: '那霸機場' },
  'ICN': { city: '首爾', subName: '仁川國際機場' },
  'GMP': { city: '首爾', subName: '金浦國際機場' },
  'HKG': { city: '香港', subName: '香港國際機場' },
  'MFM': { city: '澳門', subName: '澳門國際機場' },
  'BKK': { city: '曼谷', subName: '曼谷蘇凡納布機場' },
  'DMK': { city: '曼谷', subName: '廊曼國際機場' },
  'SIN': { city: '新加坡', subName: '新加坡樟宜機場' },
  'KUL': { city: '吉隆坡', subName: '吉隆坡國際機場' },
  'SFO': { city: '舊金山', subName: '舊金山國際機場' },
  'LAX': { city: '洛杉磯', subName: '洛杉磯國際機場' },
  'JFK': { city: '紐約', subName: '甘迺迪國際機場' },
};

/**
 * 取得航空公司的英文名
 */
export function getAirlineEnName(airlineName?: string): string {
  if (!airlineName) return 'Airlines';
  const trimmed = airlineName.trim();
  if (AIRLINE_INFO_MAP[trimmed]) {
    return AIRLINE_INFO_MAP[trimmed].en;
  }
  // 檢查部分匹配
  for (const [key, val] of Object.entries(AIRLINE_INFO_MAP)) {
    if (trimmed.includes(key) || key.includes(trimmed)) {
      return val.en;
    }
  }
  return airlineName;
}

/**
 * 解析機場名稱與城市展示
 */
export function resolveAirportDisplay(nameOrCode?: string, fallbackCity?: string): {
  code: string;
  city: string;
  subName: string;
} {
  if (!nameOrCode) {
    return { code: '---', city: fallbackCity || '機場', subName: '國際機場' };
  }

  const upper = nameOrCode.trim().toUpperCase();
  // 是否為 3 字碼
  if (upper.length === 3 && AIRPORT_INFO_MAP[upper]) {
    const info = AIRPORT_INFO_MAP[upper];
    return {
      code: upper,
      city: fallbackCity || info.city,
      subName: info.subName,
    };
  }

  // 嘗試在字典中尋找包含關鍵字
  for (const [code, info] of Object.entries(AIRPORT_INFO_MAP)) {
    if (nameOrCode.includes(code) || nameOrCode.includes(info.city) || nameOrCode.includes(info.subName)) {
      return {
        code,
        city: fallbackCity || info.city,
        subName: info.subName,
      };
    }
  }

  // 自動擷取帶有代碼的情況（例如 "桃園國際機場 (TPE)" 或 "桃園機場TPE"）
  const matchCode = nameOrCode.match(/([A-Z]{3})/);
  const foundCode = matchCode ? matchCode[1] : '';
  const cleanName = nameOrCode.replace(/\([A-Z]{3}\)/, '').replace(/[A-Z]{3}/, '').trim();

  return {
    code: foundCode || (upper.length <= 4 ? upper : 'DEP'),
    city: fallbackCity || cleanName || nameOrCode,
    subName: cleanName.includes('機場') ? cleanName : `${cleanName}機場`,
  };
}
