import React, { useState, useMemo } from 'react';
import * as d3 from 'd3';
import { 
  PieChart as PieIcon, Car, Bed, Utensils, Ticket, ShoppingBag, 
  Layers, ChevronDown, ChevronUp, Sparkles, TrendingUp 
} from 'lucide-react';
import { Expense, Currency } from '../types';

export type ExpenseCategoryKey = 'transport' | 'accommodation' | 'dining' | 'spot' | 'other';

export interface CategoryData {
  key: ExpenseCategoryKey;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  amountTWD: number;
  count: number;
  percentage: number;
  color: string;
  lightBg: string;
  textColor: string;
  borderColor: string;
}

const CATEGORY_CONFIGS: Record<ExpenseCategoryKey, {
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  lightBg: string;
  textColor: string;
  borderColor: string;
  keywords: string[];
}> = {
  transport: {
    label: '交通',
    icon: Car,
    color: '#0284c7', // Sky Blue
    lightBg: 'bg-sky-50',
    textColor: 'text-sky-700',
    borderColor: 'border-sky-200',
    keywords: ['機票', '車票', '捷運', '計程車', 'JR', '地鐵', '新幹線', '巴士', '公車', '高鐵', '租車', '加油', '過路費', '交通', 'Uber', 'Grab', 'Taxi', 'Flight', 'Train', 'Bus', 'Pass', '船票', '悠遊卡', 'Suica', 'ICOCA'],
  },
  accommodation: {
    label: '住宿',
    icon: Bed,
    color: '#7c3aed', // Purple
    lightBg: 'bg-purple-50',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-200',
    keywords: ['飯店', '旅館', '民宿', 'Airbnb', 'Hotel', 'Hostel', '訂房', '住宿', '房費', '度假村', 'Villa', '溫泉旅館', '青旅', '膠囊旅館'],
  },
  dining: {
    label: '餐飲',
    icon: Utensils,
    color: '#ea580c', // Orange
    lightBg: 'bg-orange-50',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-200',
    keywords: ['早餐', '午餐', '晚餐', '中餐', '宵夜', '拉麵', '燒肉', '咖啡', '吃', '飯', '茶', '餐廳', '飲', '甜點', '壽司', '居酒屋', 'Cafe', 'Restaurant', 'Food', 'Dinner', 'Lunch', 'Breakfast', 'Drinks', '下午茶', '小吃', '便當', '星巴克', '點心'],
  },
  spot: {
    label: '景點',
    icon: Ticket,
    color: '#e11d48', // Rose/Red
    lightBg: 'bg-rose-50',
    textColor: 'text-rose-700',
    borderColor: 'border-rose-200',
    keywords: ['門票', '票券', '景點', '博物館', '水族館', '遊樂園', '迪士尼', '環球影城', '寺', '宮', '神社', '纜車', '體驗', '門費', 'Ticket', 'Tour', 'Museum', 'Park', '入場券', '觀景台', '展覽', '一日遊'],
  },
  other: {
    label: '其他/購物',
    icon: ShoppingBag,
    color: '#57534e', // Stone/Cocoa
    lightBg: 'bg-stone-50',
    textColor: 'text-stone-700',
    borderColor: 'border-stone-200',
    keywords: ['買', '購物', '藥妝', '伴手禮', '紀念品', '衣服', '免稅', 'Shopping', 'Duty free', '超市', 'Bic Camera', 'Donki', '唐吉訶德', '網卡', 'SIM', '保險', '雜費'],
  },
};

/** Detects category from explicit field or keyword matching */
export function detectExpenseCategory(expense: Expense): ExpenseCategoryKey {
  if ((expense as any).expenseType && CATEGORY_CONFIGS[(expense as any).expenseType as ExpenseCategoryKey]) {
    return (expense as any).expenseType as ExpenseCategoryKey;
  }

  const textToScan = `${expense.title || ''} ${expense.location || ''}`.toLowerCase();

  // Try matching keywords
  for (const [catKey, conf] of Object.entries(CATEGORY_CONFIGS) as [ExpenseCategoryKey, typeof CATEGORY_CONFIGS[ExpenseCategoryKey]][]) {
    for (const kw of conf.keywords) {
      if (textToScan.includes(kw.toLowerCase())) {
        return catKey;
      }
    }
  }

  return 'other';
}

interface ExpenseDistributionChartProps {
  expenses: Expense[];
  currencies: Currency[];
  title?: string;
  filterMember?: string;
  defaultExpanded?: boolean;
}

export const ExpenseDistributionChart: React.FC<ExpenseDistributionChartProps> = ({
  expenses,
  currencies,
  title = '費用類別分佈',
  filterMember = 'all',
  defaultExpanded = true,
}) => {
  const [hoveredCategory, setHoveredCategory] = useState<ExpenseCategoryKey | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategoryKey | null>(null);
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Helper: exchange rate
  const getExchangeRate = (code: string): number => currencies.find(c => c.code === code)?.rate || 1;

  const calculateTWD = (amount: number, currency: string, hasFee: boolean = false, feePct: number = 0): number => {
    let totalAmount = amount;
    if (hasFee) {
      totalAmount = amount + (amount * (feePct / 100));
    }
    if (currency === 'TWD') return totalAmount;
    const rate = getExchangeRate(currency);
    return Math.round(totalAmount * rate);
  };

  // Filter expenses according to selected filter
  const relevantExpenses = useMemo(() => {
    return expenses.filter(e => {
      // Exclude public fund deposit records (only count actual expenditures)
      if (e.category === 'public_fund' && e.fundType === 'deposit') return false;

      if (filterMember === 'all') return true;
      return e.payer === filterMember || e.involvedMembers?.includes(filterMember);
    });
  }, [expenses, filterMember]);

  // Aggregate category stats
  const { categoryData, totalSpentTWD, activeCategoryDetails } = useMemo(() => {
    const totals: Record<ExpenseCategoryKey, { amount: number; count: number }> = {
      transport: { amount: 0, count: 0 },
      accommodation: { amount: 0, count: 0 },
      dining: { amount: 0, count: 0 },
      spot: { amount: 0, count: 0 },
      other: { amount: 0, count: 0 },
    };

    let total = 0;

    relevantExpenses.forEach(exp => {
      const cat = detectExpenseCategory(exp);
      const twd = calculateTWD(Number(exp.amount) || 0, exp.currency, exp.hasServiceFee || false, exp.serviceFeePercentage || 0);

      // If filtering for a specific member, compute their share
      let shareTWD = twd;
      if (filterMember !== 'all' && exp.involvedMembers && exp.involvedMembers.length > 0) {
        if (exp.involvedMembers.includes(filterMember)) {
          shareTWD = twd / exp.involvedMembers.length;
        } else if (exp.payer === filterMember) {
          shareTWD = twd;
        }
      }

      totals[cat].amount += shareTWD;
      totals[cat].count += 1;
      total += shareTWD;
    });

    const data: CategoryData[] = (Object.keys(CATEGORY_CONFIGS) as ExpenseCategoryKey[]).map(key => {
      const config = CATEGORY_CONFIGS[key];
      const amount = Math.round(totals[key].amount);
      const count = totals[key].count;
      const percentage = total > 0 ? (amount / total) * 100 : 0;

      return {
        key,
        label: config.label,
        icon: config.icon,
        amountTWD: amount,
        count,
        percentage,
        color: config.color,
        lightBg: config.lightBg,
        textColor: config.textColor,
        borderColor: config.borderColor,
      };
    }).sort((a, b) => b.amountTWD - a.amountTWD); // Sort by highest spending

    return {
      categoryData: data,
      totalSpentTWD: Math.round(total),
      activeCategoryDetails: hoveredCategory || selectedCategory,
    };
  }, [relevantExpenses, filterMember, currencies, hoveredCategory, selectedCategory]);

  // Generate D3 Pie Layout
  const pieSlices = useMemo(() => {
    if (totalSpentTWD === 0) return [];

    const pieGenerator = d3.pie<CategoryData>()
      .value(d => d.amountTWD)
      .sort(null)
      .padAngle(0.02);

    const arcGenerator = d3.arc<d3.PieArcDatum<CategoryData>>()
      .innerRadius(54)
      .outerRadius(78)
      .cornerRadius(4);

    const hoveredArcGenerator = d3.arc<d3.PieArcDatum<CategoryData>>()
      .innerRadius(50)
      .outerRadius(84)
      .cornerRadius(6);

    const arcs = pieGenerator(categoryData.filter(d => d.amountTWD > 0));

    return arcs.map(arc => {
      const isHighlighted = activeCategoryDetails === arc.data.key;
      const path = isHighlighted ? hoveredArcGenerator(arc) : arcGenerator(arc);
      const [centroidX, centroidY] = arcGenerator.centroid(arc);

      return {
        ...arc,
        path: path || '',
        centroidX,
        centroidY,
        isHighlighted,
      };
    });
  }, [categoryData, totalSpentTWD, activeCategoryDetails]);

  const activeCategory = categoryData.find(c => c.key === activeCategoryDetails);

  if (totalSpentTWD === 0 && relevantExpenses.length === 0) {
    return null;
  }

  return (
    <div className="bg-white p-5 sm:p-6 rounded-[2rem] shadow-hard-sm border-2 border-beige-dark mb-6 transition-all">
      {/* Header */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-sage/15 text-sage flex items-center justify-center border border-sage/30">
            <PieIcon size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="font-black text-cocoa text-base sm:text-lg flex items-center gap-1.5">
              {title}
              {filterMember !== 'all' && (
                <span className="text-xs bg-beige text-cocoa px-2 py-0.5 rounded-full font-bold">
                  {filterMember}
                </span>
              )}
            </h3>
            <p className="text-xs font-bold text-gray-400">
              總支出 NT$ {totalSpentTWD.toLocaleString()} · 共 {relevantExpenses.length} 筆
            </p>
          </div>
        </div>

        <button 
          className="text-gray-400 hover:text-cocoa p-1.5 rounded-full hover:bg-beige transition-colors"
          title={isExpanded ? "收合" : "展開"}
        >
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-5 pt-4 border-t-2 border-dashed border-beige-dark animate-scale-in">
          {/* Main layout: Chart on Left / Legend on Right */}
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* D3 Donut Chart Centerpiece */}
            <div className="relative w-48 h-48 flex-shrink-0 flex items-center justify-center">
              <svg 
                viewBox="-90 -90 180 180" 
                className="w-full h-full transform transition-transform duration-300"
              >
                {/* Background Ring when empty */}
                {totalSpentTWD === 0 && (
                  <circle r="72" fill="none" stroke="#e5e7eb" strokeWidth="24" strokeDasharray="4 4" />
                )}

                {/* Slices */}
                {pieSlices.map(slice => (
                  <path
                    key={slice.data.key}
                    d={slice.path}
                    fill={slice.data.color}
                    className="transition-all duration-300 cursor-pointer"
                    opacity={activeCategoryDetails && !slice.isHighlighted ? 0.45 : 1}
                    stroke="#ffffff"
                    strokeWidth={slice.isHighlighted ? 3 : 1.5}
                    onMouseEnter={() => setHoveredCategory(slice.data.key)}
                    onMouseLeave={() => setHoveredCategory(null)}
                    onClick={() => setSelectedCategory(selectedCategory === slice.data.key ? null : slice.data.key)}
                  />
                ))}
              </svg>

              {/* Center Interactive Info */}
              <div 
                className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-4"
              >
                {activeCategory ? (
                  <div className="animate-scale-in">
                    <span className="text-[10px] font-black text-gray-400 block tracking-wider uppercase">
                      {activeCategory.label}
                    </span>
                    <span className="text-sm sm:text-base font-black text-cocoa font-mono block leading-tight">
                      {activeCategory.percentage.toFixed(1)}%
                    </span>
                    <span className="text-[10px] font-bold text-gray-400 block truncate max-w-[80px]">
                      NT${activeCategory.amountTWD.toLocaleString()}
                    </span>
                  </div>
                ) : (
                  <div>
                    <span className="text-[10px] font-black text-gray-400 block tracking-wider uppercase">
                      總計
                    </span>
                    <span className="text-xs sm:text-sm font-black text-cocoa font-mono block leading-tight truncate max-w-[90px]">
                      NT$ {totalSpentTWD >= 1000000 ? `${(totalSpentTWD / 10000).toFixed(1)}萬` : totalSpentTWD.toLocaleString()}
                    </span>
                    <span className="text-[9px] font-bold text-sage block mt-0.5">
                      {categoryData.filter(c => c.amountTWD > 0).length} 個類別
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Category Legend & Breakdown Cards */}
            <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {categoryData.map(cat => {
                const Icon = cat.icon;
                const isSelected = (hoveredCategory || selectedCategory) === cat.key;
                const hasAmount = cat.amountTWD > 0;

                return (
                  <div
                    key={cat.key}
                    onMouseEnter={() => setHoveredCategory(cat.key)}
                    onMouseLeave={() => setHoveredCategory(null)}
                    onClick={() => setSelectedCategory(selectedCategory === cat.key ? null : cat.key)}
                    className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected 
                        ? `${cat.lightBg} ${cat.borderColor} shadow-md scale-[1.02]` 
                        : hasAmount 
                          ? 'bg-beige/30 border-beige-dark hover:border-gray-300' 
                          : 'bg-gray-50 border-beige-dark/50 opacity-40'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div 
                        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-white shadow-sm"
                        style={{ backgroundColor: cat.color }}
                      >
                        <Icon size={16} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-cocoa truncate">
                            {cat.label}
                          </span>
                          {hasAmount && (
                            <span className="text-[10px] font-bold text-gray-400">
                              ({cat.count}筆)
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="w-16 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}
                            />
                          </div>
                          <span className="text-[10px] font-black font-mono text-gray-500">
                            {cat.percentage.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="text-xs font-black text-cocoa font-mono block">
                        NT$ {cat.amountTWD.toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Category Tag Chips for easy understanding */}
          <div className="mt-4 pt-3 border-t border-beige-dark/50 flex flex-wrap items-center justify-between text-[11px] text-gray-400 gap-2">
            <span className="font-bold flex items-center gap-1">
              <Sparkles size={12} className="text-amber-500" />
              支援交通、住宿、餐飲、景點及購物自動分類與佔比分析
            </span>
            {selectedCategory && (
              <button 
                onClick={() => setSelectedCategory(null)}
                className="text-sage font-bold hover:underline"
              >
                重設篩選
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
