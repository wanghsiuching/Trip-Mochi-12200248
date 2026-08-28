import { Currency } from '../types';

/**
 * 預設參考匯率表 (以新台幣 TWD 為基準)
 * 1 單位外幣 ≈ 多少新台幣 (TWD)
 */
export const DEFAULT_RATES: Record<string, number> = {
  TWD: 1,
  NTD: 1,
  NT: 1,
  CHF: 37.5, // 瑞士法郎 ≈ 37.5 TWD
  EUR: 35.5, // 歐元 ≈ 35.5 TWD
  USD: 32.5, // 美元 ≈ 32.5 TWD
  JPY: 0.21, // 日圓 ≈ 0.21 TWD
  GBP: 42.0, // 英鎊 ≈ 42.0 TWD
  KRW: 0.024, // 韓元 ≈ 0.024 TWD
  CNY: 4.5,  // 人民幣 ≈ 4.5 TWD
  HKD: 4.15, // 港幣 ≈ 4.15 TWD
  SGD: 24.5, // 新加坡幣 ≈ 24.5 TWD
  THB: 0.95, // 泰銖 ≈ 0.95 TWD
  AUD: 21.0, // 澳幣 ≈ 21.0 TWD
  NZD: 19.5, // 紐幣 ≈ 19.5 TWD
  CAD: 23.5, // 加幣 ≈ 23.5 TWD
  MYR: 7.3,  // 馬幣 ≈ 7.3 TWD
  VND: 0.0013, // 越南盾 ≈ 0.0013 TWD
  PHP: 0.56, // 菲律賓披索 ≈ 0.56 TWD
  IDR: 0.002, // 印尼盾 ≈ 0.002 TWD
  SEK: 3.1,  // 瑞典克朗 ≈ 3.1 TWD
  NOK: 3.0,  // 挪威克朗 ≈ 3.0 TWD
  DKK: 4.75, // 丹麥克朗 ≈ 4.75 TWD
  CZK: 1.4,  // 捷克克朗 ≈ 1.4 TWD
  HUF: 0.09, // 匈牙利福林 ≈ 0.09 TWD
  PLN: 8.3,  // 波蘭茲羅提 ≈ 8.3 TWD
  ISK: 0.24, // 冰島克朗 ≈ 0.24 TWD
};

export const POPULAR_CURRENCIES: { code: string; name: string; defaultRate: number }[] = [
  { code: 'CHF', name: '瑞士法郎', defaultRate: 37.5 },
  { code: 'EUR', name: '歐元', defaultRate: 35.5 },
  { code: 'JPY', name: '日圓', defaultRate: 0.21 },
  { code: 'USD', name: '美元', defaultRate: 32.5 },
  { code: 'GBP', name: '英鎊', defaultRate: 42.0 },
  { code: 'KRW', name: '韓元', defaultRate: 0.024 },
  { code: 'HKD', name: '港幣', defaultRate: 4.15 },
  { code: 'SGD', name: '新加坡幣', defaultRate: 24.5 },
  { code: 'THB', name: '泰銖', defaultRate: 0.95 },
  { code: 'AUD', name: '澳幣', defaultRate: 21.0 },
  { code: 'CAD', name: '加幣', defaultRate: 23.5 },
  { code: 'CNY', name: '人民幣', defaultRate: 4.5 },
];

/**
 * 取得指定幣別對台幣的匯率。
 * 1. 優先使用該行程設定中的自訂匯率 (customCurrencies)
 * 2. 若行程中未設定，則使用 DEFAULT_RATES 內建的參考匯率
 * 3. 若皆無對應，預設為 1 (TWD)
 */
export const getExchangeRate = (currencyCode?: string, customCurrencies: Currency[] = []): number => {
  if (!currencyCode) return 1;
  const code = currencyCode.trim().toUpperCase();
  if (code === 'TWD' || code === 'NT' || code === 'NTD' || code === 'NT$') return 1;

  if (Array.isArray(customCurrencies)) {
    const found = customCurrencies.find(c => c && c.code && c.code.trim().toUpperCase() === code);
    if (found && typeof found.rate === 'number' && !isNaN(found.rate) && found.rate > 0) {
      return found.rate;
    }
  }

  if (DEFAULT_RATES[code] !== undefined) {
    return DEFAULT_RATES[code];
  }

  return 1;
};

/**
 * 將外幣金額換算為新台幣 (TWD)
 */
export const convertToTWD = (amount: number, currencyCode?: string, customCurrencies: Currency[] = []): number => {
  const num = Number(amount) || 0;
  const rate = getExchangeRate(currencyCode, customCurrencies);
  return num * rate;
};
