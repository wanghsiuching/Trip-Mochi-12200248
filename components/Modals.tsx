
import React, { useState, useEffect } from 'react';
import { Camera, Utensils, Train, Bed, PenTool, Trash2, AlertCircle, Map, Coffee, Moon, AlignLeft, Ticket, Coins, Users, Plus, X, Settings, Car, Clock, DollarSign, Navigation, ExternalLink, Fuel, Calendar as CalendarIcon, Plane, Edit3, Luggage, Copy, Save, Shuffle, MapPin, ArrowRightLeft, Layers } from 'lucide-react';
import { ItemType, ScheduleItem, Currency, Member, THEME, ExpenseItem, TransitLeg, TransitFareDetails, UniversalTransportType, TransitPassType } from '../types';
import { TransitLegEditor, TransitLegChainView, TransitPassBadge } from './TransitComponents';

// Updated extensive fruit/food icon list (40+ items)
const FRUIT_ICONS = [
    '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈',
    '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🥑', '🍆', '🥔',
    '🥕', '🌽', '🌶️', '🫑', '🥒', '🥬', '🥦', '🍄', '🥜', '🌰',
    '🍞', '🥐', '🥖', '🥨', '🥯', '🥞', '🧇', '🧀', '🍔', '🍟',
    '🍕', '🌭', '🥪', '🌮', '🌯', '🥚', '🍳', '🥘', '🍲', '🥗',
    '🍿', '🍱', '🍘', '🍙', '🍚', '🍛', '🍜', '🍝', '🍠', '🍢',
    '🍣', '🍤', '🍥', '🥮', '🍡', '🥟', '🥠', '🍦', '🍧', '🍨',
    '🍩', '🍪', '🎂', '🍰', '🧁', '🥧', '🍫', '🍬', '🍭', '🍮',
    '🍯', '🍼', '🥛', '☕', '🍵', '🍶', '🍺', '🍻', '🥂', '🍷'
];

// Helper to get a random fruit
const getRandomFruit = () => FRUIT_ICONS[Math.floor(Math.random() * FRUIT_ICONS.length)];

// Helper for consistent fruit icon (Fallback for legacy data)
const getACFruit = (str: string) => {
    if (!str) return '🍎';
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return FRUIT_ICONS[Math.abs(hash) % FRUIT_ICONS.length];
};

// UI Components for Modal
export const ToggleSwitch = ({ checked, onChange, label, colorClass = 'bg-sage' }: { checked: boolean; onChange: (v: boolean) => void; label?: string; colorClass?: string }) => (
  <div className="flex items-center gap-2 cursor-pointer group" onClick={() => onChange(!checked)}>
    <div className={`w-10 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${checked ? colorClass : 'bg-gray-200'}`}>
      <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
    </div>
    {label && <span className="text-xs font-bold text-gray-500 select-none group-hover:text-cocoa transition-colors">{label}</span>}
  </div>
);

const CuteButton = ({ checked, onChange, icon: Icon, label, activeColor = 'bg-orange-100 text-orange-500 border-orange-200' }: any) => (
    <button
        onClick={() => onChange(!checked)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black transition-all shadow-sm border-2 ${
            checked 
            ? activeColor
            : 'bg-white text-gray-400 border-beige-dark hover:bg-gray-50'
        }`}
    >
        {Icon && <Icon size={12} />}
        {label}
    </button>
);

const CostDisplay = ({ amount, currency, hasFee, feePct, currencies }: { amount: number, currency: string, hasFee: boolean, feePct: number, currencies: Currency[] }) => {
    const total = amount + (hasFee ? amount * (Number(feePct) / 100) : 0);
    const rate = currencies.find(c => c.code === currency)?.rate || (currency === 'TWD' ? 1 : 1);
    const twdTotal = Math.round(total * rate);

    if (total <= 0) return null;
    return (
        <div className="mt-2 bg-gray-50 p-3 rounded-xl border border-dashed border-gray-200 space-y-1">
            <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">總計 ({currency})</span>
                <span className="text-sm font-black text-cocoa font-mono">{currency} {Math.round(total).toLocaleString()}</span>
            </div>
            {currency !== 'TWD' && (
                <div className="flex justify-between items-center border-t border-gray-100 pt-1">
                    <span className="text-[10px] font-bold text-sage uppercase tracking-wider">約台幣 (TWD)</span>
                    <span className="text-sm font-black text-sage font-mono">${twdTotal.toLocaleString()}</span>
                </div>
            )}
        </div>
    );
};

export const CreateTripModal = ({ isOpen, onClose, onConfirm }: { isOpen: boolean, onClose: () => void, onConfirm: (name: string) => void }) => {
    const [name, setName] = useState('');
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-cocoa/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white p-6 rounded-[2rem] w-full max-w-sm shadow-2xl border-2 border-beige-dark animate-scale-in" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-black text-cocoa mb-6 text-center">建立新行程</h3>
                <div className="bg-beige/50 p-4 rounded-2xl border-2 border-beige-dark mb-6">
                    <label className="text-xs font-bold text-gray-400 block mb-2">行程名稱</label>
                    <input 
                        autoFocus
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full text-lg font-bold text-cocoa outline-none bg-transparent placeholder:text-gray-300"
                        placeholder="例如: 東京五日遊"
                        onKeyDown={(e) => e.key === 'Enter' && name && onConfirm(name)}
                    />
                </div>
                <button onClick={() => name && onConfirm(name)} disabled={!name} className="w-full py-4 rounded-xl font-bold text-white bg-sage hover:bg-sage-dark shadow-hard-sage border-2 border-sage active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 disabled:shadow-none">建立行程</button>
            </div>
        </div>
    );
};

export const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, tripName }: { isOpen: boolean, onClose: () => void, onConfirm: () => void, tripName: string }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-cocoa/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4" onClick={onClose}>
             <div className="bg-white p-6 rounded-3xl w-full max-w-sm shadow-2xl border-2 border-beige-dark animate-scale-in" onClick={e => e.stopPropagation()}>
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500 border-2 border-red-200">
                    <Trash2 size={24} />
                </div>
                <h3 className="text-xl font-black text-cocoa mb-2 text-center">刪除行程?</h3>
                <p className="text-gray-400 font-bold text-center text-sm mb-6">確定要刪除 <span className="text-cocoa">{tripName}</span> 嗎？此動作無法復原。</p>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 rounded-xl font-bold text-gray-400 bg-gray-100 hover:bg-gray-200 transition-colors">取消</button>
                    <button onClick={onConfirm} className="flex-1 py-3 rounded-xl font-bold text-white bg-red-400 hover:bg-red-50 shadow-hard-sm border-2 border-red-500 active:translate-y-1 active:shadow-none transition-all">刪除</button>
                </div>
            </div>
        </div>
    );
};

export const SearchErrorModal = ({ isOpen, onClose, message }: { isOpen: boolean, onClose: () => void, message: string }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-cocoa/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4" onClick={onClose}>
             <div className="bg-white p-6 rounded-3xl w-full max-w-sm shadow-2xl border-2 border-beige-dark animate-scale-in" onClick={e => e.stopPropagation()}>
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4 text-yellow-500 border-2 border-yellow-200">
                    <AlertCircle size={24} />
                </div>
                <h3 className="text-xl font-black text-cocoa mb-2 text-center">搜尋結果</h3>
                <p className="text-gray-400 font-bold text-center text-sm mb-6">{message}</p>
                <button onClick={onClose} className="w-full py-3 rounded-xl font-bold text-cocoa bg-gray-100 hover:bg-gray-200 transition-colors">關閉</button>
            </div>
        </div>
    );
};

export const DeleteDayConfirmModal = ({ isOpen, onClose, onConfirm, date }: { isOpen: boolean, onClose: () => void, onConfirm: () => void, date: string }) => {
     if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-cocoa/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white p-6 rounded-3xl w-full max-w-sm shadow-2xl border-2 border-beige-dark animate-scale-in" onClick={e => e.stopPropagation()}>
                 <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500 border-2 border-red-200">
                    <Trash2 size={24} />
                </div>
                <h3 className="text-xl font-black text-cocoa mb-2 text-center">刪除這一天?</h3>
                <p className="text-gray-400 font-bold text-center text-sm mb-6">確定要刪除 <span className="text-cocoa">{date}</span> 及其所有行程嗎？</p>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 rounded-xl font-bold text-gray-400 bg-gray-100 hover:bg-gray-200 transition-colors">取消</button>
                    <button onClick={onConfirm} className="flex-1 py-3 rounded-xl font-bold text-white bg-red-400 hover:bg-red-50 shadow-hard-sm border-2 border-red-500 active:translate-y-1 active:shadow-none transition-all">刪除</button>
                </div>
            </div>
        </div>
    );
};

export const TripSettingsModal = ({ 
    isOpen, onClose, currencies, onAddCurrency, onRemoveCurrency, onDuplicate
}: { 
    isOpen: boolean, onClose: () => void, 
    currencies: Currency[], onAddCurrency: (c: Currency) => void, onRemoveCurrency: (code: string) => void,
    onDuplicate?: () => void
}) => {
    const [newCurrencyCode, setNewCurrencyCode] = useState('');
    const [newCurrencyRate, setNewCurrencyRate] = useState('');

    if (!isOpen) return null;

    const handleAddCurrency = () => {
        if (newCurrencyCode && newCurrencyRate) {
            onAddCurrency({ code: newCurrencyCode.toUpperCase(), rate: Number(newCurrencyRate) });
            setNewCurrencyCode('');
            setNewCurrencyRate('');
        }
    };

    return (
        <div className="fixed inset-0 bg-cocoa/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white p-6 rounded-[2.5rem] w-full max-w-md shadow-2xl border-2 border-beige-dark animate-scale-in max-h-[85vh] overflow-y-auto no-scrollbar" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-black text-cocoa flex items-center gap-2"><Settings size={20} className="text-sage"/> 行程設定</h3>
                    <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={16}/></button>
                </div>

                {/* Currency Section */}
                <div className="mb-8">
                     <h4 className="text-sm font-bold text-gray-400 mb-3 flex items-center gap-2"><Coins size={16}/> 匯率設定 (相對於 TWD)</h4>
                     <div className="space-y-2 mb-3">
                         {currencies.map(c => (
                             <div key={c.code} className="flex justify-between items-center bg-white border border-beige-dark p-3 rounded-xl shadow-sm">
                                 <span className="font-bold text-cocoa">{c.code}</span>
                                 <div className="flex items-center gap-3">
                                     <span className="font-mono text-gray-500 font-bold">{c.rate}</span>
                                     <button onClick={() => onRemoveCurrency(c.code)} className="text-red-300 hover:text-red-500"><X size={14}/></button>
                                 </div>
                             </div>
                         ))}
                     </div>
                     <div className="flex gap-2 items-center">
                         <input value={newCurrencyCode} onChange={e => setNewCurrencyCode(e.target.value)} placeholder="幣別" className="w-24 h-11 bg-gray-50 px-3 rounded-xl text-sm font-bold outline-none border border-transparent focus:border-sage text-cocoa text-center"/>
                         <input type="number" value={newCurrencyRate} onChange={e => setNewCurrencyRate(e.target.value)} placeholder="匯率" className="w-32 h-11 bg-gray-50 px-3 rounded-xl text-sm font-bold outline-none border border-transparent focus:border-sage text-cocoa text-center"/>
                         <button onClick={handleAddCurrency} disabled={!newCurrencyCode || !newCurrencyRate} className="h-11 w-11 flex-shrink-0 flex items-center justify-center bg-sage text-white rounded-xl shadow-hard-sm-sage disabled:opacity-50 hover:bg-sage-dark transition-colors"><Plus size={20}/></button>
                     </div>
                </div>

                {/* Backup Section */}
                <div className="border-t border-dashed border-gray-200 pt-6">
                    <h4 className="text-sm font-bold text-gray-400 mb-3 flex items-center gap-2"><Save size={16}/> 備份</h4>
                    {onDuplicate && (
                        <>
                        <button 
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDuplicate(); }} 
                            className="w-full py-3 bg-blue-50 text-blue-500 font-black rounded-xl border-2 border-blue-100 hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 shadow-sm"
                            type="button"
                        >
                            <Copy size={16}/> 建立行程副本
                        </button>
                        <p className="text-[10px] text-gray-400 mt-2 text-center">這將會建立一個內容完全相同但代碼不同的新行程 (副本)，不會影響目前裝置上的資料。</p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export const BackupConfirmModal = ({ isOpen, onClose, onConfirm, tripName }: { isOpen: boolean, onClose: () => void, onConfirm: () => void, tripName: string }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-cocoa/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4" onClick={onClose}>
             <div className="bg-white p-6 rounded-3xl w-full max-sm shadow-2xl border-2 border-beige-dark animate-scale-in" onClick={e => e.stopPropagation()}>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-500 border-2 border-blue-200">
                    <Copy size={24} />
                </div>
                <h3 className="text-xl font-black text-cocoa mb-2 text-center">建立行程副本</h3>
                <p className="text-gray-400 font-bold text-center text-sm mb-6">確定要複製 <span className="text-cocoa">{tripName}</span> 嗎？<br/>這將會產生一個全新的行程代碼。</p>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 rounded-xl font-bold text-gray-400 bg-gray-100 hover:bg-gray-200 transition-colors">取消</button>
                    <button onClick={onConfirm} className="flex-1 py-3 rounded-xl font-bold text-white bg-blue-500 hover:bg-blue-600 shadow-hard-sm border-2 border-blue-600 active:translate-y-1 active:shadow-none transition-all">建立副本</button>
                </div>
            </div>
        </div>
    );
};

export const PotentialExpensesModal = ({ 
    isOpen, onClose, items, currencies, members 
}: { 
    isOpen: boolean, onClose: () => void, 
    items: ScheduleItem[], currencies: Currency[], members: Member[] 
}) => {
    if (!isOpen) return null;

    const toTWD = (amount: number, currency: string) => {
        if (currency === 'TWD') return amount;
        const rate = currencies.find(c => c.code === currency)?.rate || 1;
        return amount * rate;
    };

    let totalPotentialTWD = 0;
    const memberTotals: Record<string, number> = {};
    members.forEach(m => memberTotals[m.id] = 0);

    const potentialItems: { title: string, amount: number, originalCurrency: string, originalAmount: number, type: string, participants: string[] }[] = [];

    const processCost = (title: string, type: string, cost: number, currency: string, hasFee: boolean, feePct: number, participants: string[] = []) => {
        const fee = hasFee ? cost * (feePct / 100) : 0;
        const total = cost + fee;
        if (total > 0) {
            const twd = toTWD(total, currency);
            totalPotentialTWD += twd;
            
            const splitCount = participants.length > 0 ? participants.length : 1; 
            const perMember = twd / splitCount;
            
            participants.forEach(pid => {
                if (memberTotals[pid] !== undefined) {
                    memberTotals[pid] += perMember;
                }
            });

            potentialItems.push({ 
                title, 
                amount: total, 
                originalCurrency: currency, 
                originalAmount: total, 
                type,
                participants 
            });
        }
    };

    items.forEach(item => {
        if (item.type === 'flight' && item.flightDetails?.isPotential) {
             processCost(
                 item.title, '機票', 
                 Number(item.flightDetails.cost) || 0, 
                 item.flightDetails.currency || 'TWD', 
                 item.flightDetails.hasServiceFee || false, 
                 Number(item.flightDetails.serviceFeePercentage) || 0,
                 item.flightDetails.participants || []
             );
        }
        if (item.type === 'stay' && item.stayDetails?.isPotential) {
             processCost(
                 item.title, '住宿', 
                 Number(item.stayDetails.cost) || 0, 
                 item.stayDetails.currency || 'TWD', 
                 item.stayDetails.hasServiceFee || false, 
                 Number(item.stayDetails.serviceFeePercentage) || 0,
                 item.stayDetails.participants || []
             );
        }
        if ((item.type === 'spot' || item.type === 'food') && item.spotDetails?.isPotential) {
             processCost(
                 item.title, item.type === 'food' ? '餐飲' : '門票', 
                 Number(item.spotDetails.ticketCost) || 0, 
                 item.spotDetails.currency || 'TWD', 
                 item.spotDetails.hasServiceFee || false, 
                 Number(item.spotDetails.serviceFeePercentage) || 0,
                 item.spotDetails.participants || []
             );
        }
        if (item.type === 'transport') {
            if (item.transitDetails?.isPotential) {
                const transitTotal = (Number(item.transitDetails.fare.discountedPrice) || 0) + (Number(item.transitDetails.fare.seatReservationFee) || 0);
                if (transitTotal > 0) {
                    processCost(
                        `${item.title} (大眾交通)`, '交通',
                        transitTotal,
                        item.transitDetails.fare.currency || 'TWD',
                        false, 0,
                        item.transitDetails.participants || []
                    );
                }
            }
            if (item.carRental) {
                if (item.carRental.isPotential && item.carRental.hasRental) {
                    const rentalBase = Number(item.carRental.rentalCost) || 0;
                    processCost(
                        `${item.title} (租車)`, '交通',
                        rentalBase,
                        item.carRental.rentalCurrency || 'TWD',
                        item.carRental.hasServiceFee || false,
                        Number(item.carRental.serviceFeePercentage) || 0,
                        item.carRental.participants || []
                    );

                    item.carRental.expenses?.forEach(exp => {
                        processCost(
                            `${item.title} (${exp.name})`, '交通',
                            Number(exp.amount) || 0,
                            exp.currency || 'TWD',
                            exp.hasServiceFee || false,
                            Number(exp.serviceFeePercentage) || 0,
                            item.carRental?.participants || []
                        );
                    });
                } else if (item.carRental.hasRental) {
                    if (item.carRental.estimatedFuelCost) {
                        processCost(
                            `${item.title} (油資)`, '油資',
                            Number(item.carRental.estimatedFuelCost) || 0,
                            item.carRental.fuelCurrency || 'TWD',
                            false, 0,
                            item.carRental.participants || []
                        );
                    }
                }
            }
        }
    });

    return (
        <div className="fixed inset-0 bg-cocoa/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white p-6 rounded-[2.5rem] w-full max-w-md shadow-2xl border-2 border-beige-dark animate-scale-in max-h-[85vh] overflow-y-auto no-scrollbar" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-black text-cocoa flex items-center gap-2"><Coins size={20} className="text-yellow-500"/> 潛在花費清單</h3>
                    <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={16}/></button>
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-2xl border-2 border-yellow-200 mb-6 flex justify-between items-center">
                    <span className="font-bold text-yellow-800 text-sm">預估總額 (約略 TWD)</span>
                    <span className="font-black text-2xl text-yellow-600">${Math.round(totalPotentialTWD).toLocaleString()}</span>
                </div>

                {totalPotentialTWD > 0 && (
                    <div className="mb-6 space-y-2">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">每人分攤預估</h4>
                        <div className="grid grid-cols-2 gap-2">
                            {members.map(m => (
                                <div key={m.id} className="bg-gray-50 border border-gray-100 p-2 rounded-xl flex justify-between items-center">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-5 h-5 rounded-full bg-white border border-gray-200 flex items-center justify-center text-[10px] font-black text-gray-400 overflow-hidden">
                                            {m.avatar ? <img src={m.avatar} className="w-full h-full object-cover"/> : m.name[0]}
                                        </div>
                                        <span className="text-xs font-bold text-cocoa">{m.name}</span>
                                    </div>
                                    <span className="text-xs font-black text-sage font-mono">${Math.round(memberTotals[m.id]).toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="space-y-3">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">項目明細</h4>
                    {potentialItems.length === 0 ? (
                        <div className="text-center text-gray-400 font-bold py-8">沒有列入潛在花費的項目</div>
                    ) : (
                        potentialItems.map((p, i) => (
                            <div key={i} className="bg-white p-3 rounded-2xl border border-beige-dark shadow-sm">
                                <div className="flex justify-between items-center mb-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-bold">{p.type}</span>
                                        <span className="font-bold text-cocoa text-sm">{p.title}</span>
                                    </div>
                                    <div className="text-sm font-black text-cocoa">
                                        ≈ ${Math.round(toTWD(p.originalAmount, p.originalCurrency)).toLocaleString()}
                                    </div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <div className="text-[10px] font-bold text-gray-400">
                                        原幣: {p.originalCurrency} {p.originalAmount.toLocaleString()}
                                    </div>
                                    <div className="flex -space-x-1.5">
                                        {p.participants.map(pid => {
                                            const mem = members.find(m => m.id === pid);
                                            if (!mem) return null;
                                            return (
                                                <div key={pid} className="w-4 h-4 rounded-full bg-white border border-gray-200 overflow-hidden flex items-center justify-center text-[8px] font-bold text-gray-400" title={mem.name}>
                                                    {mem.avatar ? <img src={mem.avatar} className="w-full h-full object-cover"/> : mem.name[0]}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export const DeleteItemConfirmModal = ({ isOpen, onClose, onConfirm, title }: { isOpen: boolean, onClose: () => void, onConfirm: () => void, title: string }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-cocoa/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white p-6 rounded-3xl w-full max-w-sm shadow-2xl border-2 border-beige-dark animate-scale-in" onClick={e => e.stopPropagation()}>
                 <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500 border-2 border-red-200">
                    <Trash2 size={24} />
                </div>
                <h3 className="text-xl font-black text-cocoa mb-2 text-center">刪除項目?</h3>
                <p className="text-gray-400 font-bold text-center text-sm mb-6">確定要刪除 <span className="text-cocoa">{title}</span> 嗎？</p>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 rounded-xl font-bold text-gray-400 bg-gray-100 hover:bg-gray-200 transition-colors">取消</button>
                    <button onClick={onConfirm} className="flex-1 py-3 rounded-xl font-bold text-white bg-red-400 hover:bg-red-50 shadow-hard-sm border-2 border-red-500 active:translate-y-1 active:shadow-none transition-all">刪除</button>
                </div>
            </div>
        </div>
    );
};

export const EditDayDetailsModal = ({ isOpen, onClose, onConfirm, initialDate, initialLocation, initialFruit }: { isOpen: boolean, onClose: () => void, onConfirm: (date: string, loc: string, fruit: string) => void, initialDate: string, initialLocation: string, initialFruit: string }) => {
    const [loc, setLoc] = useState(initialLocation);
    const [date, setDate] = useState(initialDate);
    
    useEffect(() => { 
        setLoc(initialLocation); 
        setDate(initialDate);
    }, [initialLocation, initialDate, isOpen]);

    const handleConfirm = () => {
        // Randomly select a fruit from the pool upon confirmation
        const randomFruit = getRandomFruit();
        onConfirm(date, loc, randomFruit);
    };
    
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-cocoa/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white p-6 rounded-[2rem] w-full max-w-sm shadow-2xl border-2 border-beige-dark animate-scale-in" onClick={e => e.stopPropagation()}>
                <div className="w-12 h-12 bg-sage-light rounded-full flex items-center justify-center mx-auto mb-4 text-sage border-2 border-white shadow-sm">
                    <Edit3 size={24} />
                </div>
                <h3 className="text-xl font-black text-cocoa mb-2 text-center">編輯行程資訊</h3>
                <p className="text-gray-400 font-bold text-center text-xs mb-6">修改日期與當日地點</p>
                
                <div className="space-y-4 mb-6">
                    <div className="bg-beige/50 p-3 rounded-2xl border-2 border-beige-dark flex items-center gap-3">
                        <div className="p-2 bg-white rounded-xl text-sage shadow-sm">
                            <CalendarIcon size={20}/>
                        </div>
                        <div className="flex-1">
                            <label className="text-[10px] font-bold text-gray-400 block mb-1">日期</label>
                            <input 
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full bg-transparent font-bold text-cocoa outline-none text-sm"
                            />
                        </div>
                    </div>

                    <div className="bg-beige/50 p-3 rounded-2xl border-2 border-beige-dark flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-xl shadow-sm border border-beige-dark flex-shrink-0 cursor-default select-none relative group">
                            {initialFruit || '🍎'}
                            <div className="absolute inset-0 bg-black/10 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Shuffle size={14} className="text-white"/>
                            </div>
                        </div>
                        <div className="flex-1">
                            <label className="text-[10px] font-bold text-gray-400 block mb-1">主要地點</label>
                            <input 
                                value={loc}
                                onChange={(e) => setLoc(e.target.value)}
                                placeholder="例如: 札幌 Sapporo"
                                className="w-full bg-transparent font-bold text-cocoa outline-none text-sm"
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && loc && date) {
                                        handleConfirm();
                                    }
                                }}
                            />
                        </div>
                    </div>
                    <p className="text-[10px] text-gray-400 font-bold text-center mt-2 italic">* 確認修改時將會隨機更換水果圖示</p>
                </div>

                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 rounded-xl font-bold text-gray-400 bg-gray-100 hover:bg-gray-200 transition-colors">取消</button>
                    <button onClick={handleConfirm} disabled={!loc || !date} className="flex-1 py-3 rounded-xl font-bold text-white bg-sage hover:bg-sage-dark shadow-hard-sage border-2 border-sage active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 disabled:shadow-none">確認修改</button>
                </div>
            </div>
        </div>
    );
};

export const ScheduleDetailModal = ({
    isOpen, onClose, item, onEdit, currencies, members
}: {
    isOpen: boolean, onClose: () => void, item: ScheduleItem | null, onEdit: () => void, currencies: Currency[], members: Member[]
}) => {
    if (!isOpen || !item) return null;

    let Icon = MapPin;
    let colorClass = 'bg-gray-100 text-gray-500';
    if (item.type === 'food') { Icon = Utensils; colorClass = 'bg-orange-100 text-orange-500'; }
    if (item.type === 'transport') { Icon = Train; colorClass = 'bg-blue-100 text-blue-500'; }
    if (item.type === 'stay') { Icon = Bed; colorClass = 'bg-purple-100 text-purple-500'; }
    if (item.type === 'spot') { Icon = Camera; colorClass = 'bg-green-100 text-green-600'; }
    if (item.type === 'flight') { Icon = Plane; colorClass = 'bg-cyan-100 text-cyan-600'; }

    const openMap = (location: string) => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`, '_blank');

    return (
        <div className="fixed inset-0 bg-cocoa/50 z-[100] flex items-center justify-center px-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-beige w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl border-4 border-beige-dark relative overflow-hidden animate-scale-in flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex justify-between items-start mb-4 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-2xl ${colorClass} border-2 border-white shadow-sm flex-shrink-0`}>
                            <Icon size={24} strokeWidth={2.5} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-mono text-xs font-black text-white bg-sage px-2 py-0.5 rounded-lg shadow-sm">{item.time}</span>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.type}</span>
                            </div>
                            <h3 className="text-xl font-black text-cocoa leading-tight">{item.title}</h3>
                        </div>
                    </div>
                    {/* Updated Close Button Style to Match Delete Button (Light Red) */}
                    <button onClick={onClose} className="p-2 bg-red-100 text-red-400 rounded-full hover:bg-red-200 border border-red-200 flex-shrink-0 transition-colors shadow-sm"><X size={16}/></button>
                </div>

                <div className="overflow-y-auto custom-scroll flex-1 space-y-4 pr-1">
                    {/* Location */}
                    <div className="bg-white p-3 rounded-2xl border-2 border-beige-dark shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-bold text-gray-500 overflow-hidden">
                            <MapPin size={16} className="text-sage flex-shrink-0" />
                            <span className="truncate">{item.location}</span>
                        </div>
                        <button onClick={() => openMap(item.location)} className="p-1.5 bg-gray-50 rounded-lg text-cocoa hover:text-white hover:bg-sage shadow-sm border border-gray-200 transition-colors flex-shrink-0 ml-2">
                            <Navigation size={14} strokeWidth={2.5} />
                        </button>
                    </div>

                    {/* Flight Details */}
                    {item.type === 'flight' && item.flightDetails && (
                        <div className="bg-cyan-50/50 p-4 rounded-2xl border border-cyan-100 space-y-3">
                            <div className="flex justify-between items-center border-b border-cyan-200 pb-2">
                                <span className="text-sm font-black text-cocoa">{item.flightDetails.airline} {item.flightDetails.flightCode}</span>
                                <span className="text-xs font-bold text-cyan-600">{item.flightDetails.departureAirport} → {item.flightDetails.arrivalAirport}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs font-bold text-gray-500">
                                <div className="flex items-center gap-1"><Clock size={12}/> DEP: {item.flightDetails.departureTime}</div>
                                <div className="flex items-center gap-1"><Clock size={12}/> ARR: {item.flightDetails.arrivalTime}</div>
                                <div className="flex items-center gap-1"><Luggage size={12}/> {item.flightDetails.checkedBag || '--'}</div>
                                <div className="flex items-center gap-1"><Luggage size={12}/> {item.flightDetails.carryOnBag || '--'}</div>
                            </div>
                            {Number(item.flightDetails.cost) > 0 && (
                                <div className="pt-2 border-t border-cyan-200 flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-gray-400">總費用</span>
                                    <span className="text-sm font-black text-sage font-mono">{item.flightDetails.currency} {Number(item.flightDetails.cost).toLocaleString()}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Stay Details */}
                    {item.type === 'stay' && item.stayDetails && (
                        <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-100 space-y-3">
                            <div className="flex gap-4 text-xs font-bold text-gray-500">
                                <div className="flex items-center gap-1"><Clock size={12}/> In: {item.checkIn}</div>
                                <div className="flex items-center gap-1"><Clock size={12}/> Out: {item.checkOut}</div>
                            </div>
                            <div className="flex gap-2">
                                {item.meals?.breakfast && <span className="text-[10px] bg-white px-2 py-1 rounded-lg border border-purple-200 text-purple-500 font-bold flex items-center gap-1"><Coffee size={10}/> 早餐</span>}
                                {item.meals?.dinner && <span className="text-[10px] bg-white px-2 py-1 rounded-lg border border-purple-200 text-purple-500 font-bold flex items-center gap-1"><Utensils size={10}/> 晚餐</span>}
                            </div>
                            {Number(item.stayDetails.cost) > 0 && (
                                <div className="pt-2 border-t border-purple-200 flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-gray-400">總費用</span>
                                    <span className="text-sm font-black text-sage font-mono">{item.stayDetails.currency} {Number(item.stayDetails.cost).toLocaleString()}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Transport Details */}
                    {item.type === 'transport' && item.transitDetails && (
                        <div className="space-y-3">
                            <TransitLegChainView legs={item.transitDetails.legs} fare={item.transitDetails.fare} isDetailed={true} />
                        </div>
                    )}
                    {item.type === 'transport' && !item.transitDetails && item.carRental?.hasRental && (
                        <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 space-y-3">
                            <div className="flex justify-between items-center border-b border-blue-200 pb-2">
                                <div className="flex items-center gap-2"><Car size={14} className="text-blue-500"/><span className="text-sm font-black text-cocoa">{item.carRental.company}</span></div>
                                <span className="text-xs font-bold text-gray-400">{item.carRental.carModel}</span>
                            </div>
                            <div className="space-y-1 text-xs font-bold text-gray-500">
                                <div>取車: {item.carRental.pickupDate} {item.carRental.pickupTime}</div>
                                <div>還車: {item.carRental.returnDate} {item.carRental.returnTime}</div>
                            </div>
                            {item.carRental.expenses && item.carRental.expenses.length > 0 && (
                                <div className="bg-white p-2 rounded-xl border border-blue-100 text-[10px] space-y-1">
                                    {item.carRental.expenses.map((exp, idx) => (
                                        <div key={idx} className="flex justify-between font-bold text-gray-400">
                                            <span>{exp.name}</span>
                                            <span>{exp.currency} {Number(exp.amount).toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Ticket/Cost Info for Spot/Food */}
                    {(item.type === 'spot' || item.type === 'food') && item.spotDetails?.hasTicket && (
                        <div className="bg-white p-3 rounded-2xl border border-beige-dark flex justify-between items-center shadow-sm">
                            <div className="flex items-center gap-2">
                                <Ticket size={16} className="text-sage"/>
                                <span className="text-xs font-bold text-cocoa">{item.type === 'food' ? '預計餐費' : '門票費用'}</span>
                            </div>
                            <span className="text-sm font-black text-sage font-mono">{item.spotDetails.currency} {Number(item.spotDetails.ticketCost).toLocaleString()}</span>
                        </div>
                    )}

                    {/* Notes */}
                    {item.notes && (
                        <div className="bg-yellow-50/50 p-3 rounded-2xl border border-yellow-100">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1"><AlignLeft size={10}/> 備註</h4>
                            <p className="text-xs font-bold text-cocoa whitespace-pre-wrap leading-relaxed">{item.notes}</p>
                        </div>
                    )}

                    {/* Participants */}
                    <div className="pt-2 border-t border-dashed border-gray-200">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1"><Users size={10}/> 參與成員</h4>
                        <div className="flex flex-wrap gap-2">
                            {members.map(m => {
                                const isParticipant = 
                                    item.type === 'flight' ? item.flightDetails?.participants?.includes(m.id) :
                                    item.type === 'stay' ? item.stayDetails?.participants?.includes(m.id) :
                                    item.type === 'transport' ? item.carRental?.participants?.includes(m.id) :
                                    (item.type === 'spot' || item.type === 'food') ? item.spotDetails?.participants?.includes(m.id) : false;
                                
                                if (!isParticipant && (item.type !== 'spot' && item.type !== 'food')) return null; // Only show relevant participants unless it's basic spot/food where logic might differ (currently defaulting all unless specified)
                                if (!isParticipant) return null;

                                return (
                                    <div key={m.id} className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-beige-dark shadow-sm">
                                        <div className="w-4 h-4 rounded-full overflow-hidden border border-gray-100 flex items-center justify-center bg-beige text-[8px] font-black text-cocoa">
                                            {/* Updated to use fruit icon as fallback instead of name initial */}
                                            {m.avatar ? <img src={m.avatar} className="w-full h-full object-cover"/> : <span className="text-[10px]">{m.fruit || '🍎'}</span>}
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-500">{m.name}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Footer Action */}
                <div className="mt-4 pt-4 border-t-2 border-beige-dark border-dashed flex-shrink-0">
                    <button onClick={onEdit} className="w-full bg-sage text-white py-3 rounded-2xl font-black shadow-hard-sage active:translate-y-1 active:shadow-none transition-all border-2 border-sage-dark flex items-center justify-center gap-2 text-sm">
                        <Edit3 size={16} strokeWidth={2.5}/> 編輯項目
                    </button>
                </div>
            </div>
        </div>
    );
};

export const AddScheduleModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  initialData,
  currencies = [],
  members = [],
  currentDate
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onSave: (item: Omit<ScheduleItem, 'id'>) => void,
  initialData?: ScheduleItem | null,
  currencies?: Currency[],
  members?: Member[],
  currentDate: string
}) => {
  const [step, setStep] = useState<'category' | 'details'>('category');
  const [selectedType, setSelectedType] = useState<ItemType>('spot');
  
  // Basic Fields
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('09:00');
  const [location, setLocation] = useState('');
  const [gpsInput, setGpsInput] = useState('');
  const [notes, setNotes] = useState('');

  // Flight Fields
  const [flightAirline, setFlightAirline] = useState('');
  const [flightCode, setFlightCode] = useState('');
  const [flightDepTime, setFlightDepTime] = useState('');
  const [flightArrTime, setFlightArrTime] = useState('');
  const [flightArrDate, setFlightArrDate] = useState('');
  const [flightDepAirport, setFlightDepAirport] = useState('');
  const [flightArrAirport, setFlightArrAirport] = useState('');
  const [flightCheckedBag, setFlightCheckedBag] = useState('');
  const [flightCarryOnBag, setFlightCarryOnBag] = useState('');
  const [flightCost, setFlightCost] = useState('');
  const [flightCurrency, setFlightCurrency] = useState('TWD');
  const [flightHasServiceFee, setFlightHasServiceFee] = useState(false);
  const [flightServiceFeePercentage, setFlightServiceFeePercentage] = useState('');
  const [flightParticipants, setFlightParticipants] = useState<string[]>([]);
  const [isFlightPotential, setIsFlightPotential] = useState(false);

  // Stay Fields
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [hasBreakfast, setHasBreakfast] = useState(false);
  const [hasDinner, setHasDinner] = useState(false);
  const [stayCost, setStayCost] = useState('');
  const [stayCurrency, setStayCurrency] = useState('TWD');
  const [stayHasServiceFee, setStayHasServiceFee] = useState(false);
  const [stayServiceFeePercentage, setStayServiceFeePercentage] = useState('');
  const [stayParticipants, setStayParticipants] = useState<string[]>([]);
  const [isStayPotential, setIsStayPotential] = useState(false);

  // Car Rental Fields
  const [transportMode, setTransportMode] = useState<'transit' | 'rental'>('transit');
  const [transitLegs, setTransitLegs] = useState<TransitLeg[]>([
    { id: '1', fromStation: '', toStation: '', departureTime: '09:00', arrivalTime: '', transportType: 'train', serviceNumber: '', platform: '' }
  ]);
  const [transitFare, setTransitFare] = useState<TransitFareDetails>({
    passUsed: 'pass_free',
    originalPrice: 0,
    discountedPrice: 0,
    currency: 'JPY',
    seatReservationFee: 0,
    notes: ''
  });
  const [transitParticipants, setTransitParticipants] = useState<string[]>([]);
  const [isTransitPotential, setIsTransitPotential] = useState(false);

  const [hasRental, setHasRental] = useState(false);
  const [rentalCompany, setRentalCompany] = useState('');
  const [carModel, setCarModel] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [returnTime, setReturnTime] = useState('');
  const [rentalCost, setRentalCost] = useState('');
  const [rentalCurrency, setRentalCurrency] = useState('TWD');
  const [rentalHasServiceFee, setRentalHasServiceFee] = useState(false);
  const [rentalServiceFeePercentage, setRentalServiceFeePercentage] = useState('');
  const [estimatedFuelCost, setEstimatedFuelCost] = useState('');
  const [fuelCurrency, setFuelCurrency] = useState('TWD');
  const [rentalExpenses, setRentalExpenses] = useState<ExpenseItem[]>([]);
  const [rentalParticipants, setRentalParticipants] = useState<string[]>([]);
  const [isRentalPotential, setIsRentalPotential] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);

  // Spot/Food Fields
  const [hasTicket, setHasTicket] = useState(false);
  const [ticketCost, setTicketCost] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('TWD');
  const [hasServiceFee, setHasServiceFee] = useState(false);
  const [serviceFeePercentage, setServiceFeePercentage] = useState('');
  const [participantIds, setParticipantIds] = useState<string[]>([]);
  const [isPotential, setIsPotential] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setStep('details');
        setSelectedType(initialData.type);
        setTitle(initialData.title);
        setTime(initialData.time);
        setLocation(initialData.location);
        setNotes(initialData.notes || '');
        if (initialData.gps) setGpsInput(`${initialData.gps.lat}, ${initialData.gps.lng}`);
        else setGpsInput('');

        // Flight
        if (initialData.flightDetails) {
            setFlightAirline(initialData.flightDetails.airline || '');
            setFlightCode(initialData.flightDetails.flightCode || '');
            setFlightDepTime(initialData.flightDetails.departureTime || '');
            setFlightArrTime(initialData.flightDetails.arrivalTime || '');
            setFlightArrDate(initialData.flightDetails.arrivalDate || '');
            setFlightDepAirport(initialData.flightDetails.departureAirport || '');
            setFlightArrAirport(initialData.flightDetails.arrivalAirport || '');
            setFlightCheckedBag(initialData.flightDetails.checkedBag || '');
            setFlightCarryOnBag(initialData.flightDetails.carryOnBag || '');
            setFlightCost(initialData.flightDetails.cost?.toString() || '');
            setFlightCurrency(initialData.flightDetails.currency || 'TWD');
            setFlightHasServiceFee(initialData.flightDetails.hasServiceFee || false);
            setFlightServiceFeePercentage(initialData.flightDetails.serviceFeePercentage?.toString() || '');
            setFlightParticipants(initialData.flightDetails.participants || members.map(m => m.id));
            setIsFlightPotential(initialData.flightDetails.isPotential || false);
        } else {
            setFlightParticipants(members.map(m => m.id));
        }

        // Stay
        setCheckIn(initialData.checkIn || '');
        setCheckOut(initialData.checkOut || '');
        setHasBreakfast(initialData.meals?.breakfast || false);
        setHasDinner(initialData.meals?.dinner || false);
        if (initialData.stayDetails) {
            setStayCost(initialData.stayDetails.cost?.toString() || '');
            setStayCurrency(initialData.stayDetails.currency || 'TWD');
            setStayHasServiceFee(initialData.stayDetails.hasServiceFee || false);
            setStayServiceFeePercentage(initialData.stayDetails.serviceFeePercentage?.toString() || '');
            setStayParticipants(initialData.stayDetails.participants || members.map(m => m.id));
            setIsStayPotential(initialData.stayDetails.isPotential || false);
        } else {
            setStayParticipants(members.map(m => m.id));
        }

        // Transport: Universal Transit or Car Rental
        if (initialData.transitDetails) {
            setTransportMode('transit');
            setTransitLegs(initialData.transitDetails.legs && initialData.transitDetails.legs.length > 0 ? initialData.transitDetails.legs : [
              { id: '1', fromStation: initialData.location || '', toStation: '', departureTime: initialData.time || '09:00', arrivalTime: '', transportType: 'train', serviceNumber: '', platform: '' }
            ]);
            setTransitFare(initialData.transitDetails.fare || {
              passUsed: 'pass_free',
              originalPrice: 0,
              discountedPrice: 0,
              currency: 'JPY',
              seatReservationFee: 0,
              notes: ''
            });
            setTransitParticipants(initialData.transitDetails.participants || members.map(m => m.id));
            setIsTransitPotential(initialData.transitDetails.isPotential || false);
        } else if (initialData.carRental?.hasRental) {
            setTransportMode('rental');
            setTransitParticipants(members.map(m => m.id));
        } else {
            setTransportMode('transit');
            setTransitLegs([
              { id: '1', fromStation: initialData.location || '', toStation: '', departureTime: initialData.time || '09:00', arrivalTime: '', transportType: 'train', serviceNumber: '', platform: '' }
            ]);
            setTransitFare({
              passUsed: 'pass_free',
              originalPrice: 0,
              discountedPrice: 0,
              currency: 'JPY',
              seatReservationFee: 0,
              notes: ''
            });
            setTransitParticipants(members.map(m => m.id));
            setIsTransitPotential(false);
        }

        // Car Rental
        if (initialData.carRental) {
           setHasRental(initialData.carRental.hasRental);
           setRentalCompany(initialData.carRental.company || '');
           setCarModel(initialData.carRental.carModel || '');
           setPickupTime(initialData.carRental.pickupTime || '');
           setReturnTime(initialData.carRental.returnTime || '');
           setRentalCost(initialData.carRental.rentalCost?.toString() || '');
           setRentalCurrency(initialData.carRental.rentalCurrency || 'TWD');
           setRentalHasServiceFee(initialData.carRental.hasServiceFee || false);
           setRentalServiceFeePercentage(initialData.carRental.serviceFeePercentage?.toString() || '');
           setEstimatedFuelCost(initialData.carRental.estimatedFuelCost?.toString() || '');
           setFuelCurrency(initialData.carRental.fuelCurrency || 'TWD');
           setRentalExpenses(initialData.carRental.expenses || []);
           setRentalParticipants(initialData.carRental.participants || members.map(m => m.id));
           setIsRentalPotential(initialData.carRental.isPotential || false);
        } else {
           setRentalParticipants(members.map(m => m.id));
        }

        // Spot
        if (initialData.spotDetails) {
          setHasTicket(initialData.spotDetails.hasTicket);
          setTicketCost(initialData.spotDetails.ticketCost?.toString() || '');
          setSelectedCurrency(initialData.spotDetails.currency || 'TWD');
          setHasServiceFee(initialData.spotDetails.hasServiceFee || false);
          setServiceFeePercentage(initialData.spotDetails.serviceFeePercentage?.toString() || '');
          setParticipantIds(initialData.spotDetails.participants || []);
          setIsPotential(initialData.spotDetails.isPotential || false);
        } else {
            setParticipantIds(members.map(m => m.id));
        }
      } else {
        // Reset Logic
        setStep('category'); setTitle(''); setTime('09:00'); setLocation(''); setNotes(''); setGpsInput('');
        // Reset Category Specifics
        setFlightAirline(''); setFlightCode(''); setFlightDepTime(''); setFlightArrTime(''); setFlightArrDate(''); setFlightDepAirport(''); setFlightArrAirport(''); setFlightCheckedBag(''); setFlightCarryOnBag(''); setFlightCost(''); setFlightCurrency('TWD'); setFlightHasServiceFee(false); setFlightServiceFeePercentage(''); setFlightParticipants(members.map(m => m.id)); setIsFlightPotential(false);
        setCheckIn(''); setCheckOut(''); setHasBreakfast(false); setHasDinner(false); setStayCost(''); setStayCurrency('TWD'); setStayHasServiceFee(false); setStayServiceFeePercentage(''); setStayParticipants(members.map(m => m.id)); setIsStayPotential(false);
        setTransportMode('transit');
        setTransitLegs([
          { id: '1', fromStation: '', toStation: '', departureTime: '09:00', arrivalTime: '', transportType: 'train', serviceNumber: '', platform: '' }
        ]);
        setTransitFare({
          passUsed: 'pass_free',
          originalPrice: 0,
          discountedPrice: 0,
          currency: 'JPY',
          seatReservationFee: 0,
          notes: ''
        });
        setTransitParticipants(members.map(m => m.id));
        setIsTransitPotential(false);
        setHasRental(false); setRentalCompany(''); setCarModel(''); setPickupTime(''); setReturnTime(''); setRentalCost(''); setRentalCurrency('TWD'); setRentalHasServiceFee(false); setRentalServiceFeePercentage(''); setEstimatedFuelCost(''); setFuelCurrency('TWD'); setRentalExpenses([]); setRentalParticipants(members.map(m => m.id)); setIsRentalPotential(false); setExpenseToDelete(null);
        setHasTicket(false); setTicketCost(''); setSelectedCurrency('TWD'); setHasServiceFee(false); setServiceFeePercentage(''); setParticipantIds(members.map(m => m.id)); setIsPotential(false);
      }
    }
  }, [isOpen, initialData, members]);

  // Toggle Helpers
  const toggleParticipant = (id: string, setFunc: React.Dispatch<React.SetStateAction<string[]>>) => {
    setFunc(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  // Helper for opening maps
  const openExternalMap = (query: string) => {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, '_blank');
  };

  // Rental Expense Helpers
  const addRentalExpense = () => setRentalExpenses([...rentalExpenses, { id: Date.now().toString(), name: '', amount: '', currency: 'TWD', hasServiceFee: false, serviceFeePercentage: '' }]);
  const updateRentalExpense = (id: string, field: keyof ExpenseItem, value: any) => setRentalExpenses(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  const removeRentalExpense = (id: string) => setRentalExpenses(prev => prev.filter(item => item.id !== id));
  const confirmRemoveExpense = () => { if (expenseToDelete) { removeRentalExpense(expenseToDelete); setExpenseToDelete(null); } };

  const handleSubmit = () => {
    let finalTitle = title;
    let finalLocation = location || '未指定地點';

    if (selectedType === 'transport' && transportMode === 'transit') {
      if (!finalTitle) {
        if (transitLegs.length > 0 && (transitLegs[0].fromStation || transitLegs[transitLegs.length - 1].toStation)) {
          finalTitle = `${transitLegs[0].fromStation || '出發'} ➔ ${transitLegs[transitLegs.length - 1].toStation || '目的地'}`;
        } else {
          finalTitle = '交通轉乘路線';
        }
      }
      if ((!location || location === '未指定地點') && transitLegs.length > 0 && transitLegs[0].fromStation) {
        finalLocation = transitLegs[0].fromStation;
      }
    }

    if (!finalTitle) return;

    const itemData: Omit<ScheduleItem, 'id'> = { date: initialData ? initialData.date : currentDate, time, title: finalTitle, type: selectedType, location: finalLocation, notes };
    const gpsParts = gpsInput.split(/[,，\s]+/).filter(Boolean);
    if (gpsParts.length >= 2) itemData.gps = { lat: gpsParts[0], lng: gpsParts[1] };

    if (selectedType === 'flight') {
        itemData.flightDetails = {
            airline: flightAirline, flightCode, departureTime: flightDepTime, arrivalTime: flightArrTime, arrivalDate: flightArrDate, departureAirport: flightDepAirport, arrivalAirport: flightArrAirport, checkedBag: flightCheckedBag, carryOnBag: flightCarryOnBag,
            cost: Number(flightCost) || 0, currency: flightCurrency, hasServiceFee: flightHasServiceFee, serviceFeePercentage: flightHasServiceFee ? (Number(flightServiceFeePercentage) || 0) : undefined, participants: flightParticipants, isPotential: isFlightPotential
        };
    }
    if (selectedType === 'stay') {
      itemData.checkIn = checkIn; itemData.checkOut = checkOut; itemData.meals = { breakfast: hasBreakfast, dinner: hasDinner };
      if (stayCost !== '') itemData.stayDetails = { cost: Number(stayCost) || 0, currency: stayCurrency, hasServiceFee: stayHasServiceFee, serviceFeePercentage: stayHasServiceFee ? (Number(stayServiceFeePercentage) || 0) : undefined, participants: stayParticipants, isPotential: isStayPotential };
    }
    if (selectedType === 'transport') {
      if (transportMode === 'transit') {
        itemData.transitDetails = {
          legs: transitLegs,
          fare: transitFare,
          participants: transitParticipants,
          isPotential: isTransitPotential
        };
      } else {
        itemData.carRental = {
          hasRental, company: hasRental ? rentalCompany : undefined, carModel: hasRental ? carModel : undefined, pickupTime: hasRental ? pickupTime : undefined, returnTime: hasRental ? returnTime : undefined,
          rentalCost: hasRental ? (Number(rentalCost) || 0) : undefined, rentalCurrency: hasRental ? rentalCurrency : undefined, hasServiceFee: hasRental ? rentalHasServiceFee : false, serviceFeePercentage: hasRental ? (Number(rentalServiceFeePercentage) || 0) : undefined,
          estimatedFuelCost: hasRental ? (Number(estimatedFuelCost) || 0) : undefined, fuelCurrency: hasRental ? fuelCurrency : undefined, expenses: hasRental ? rentalExpenses.map(e => ({...e, amount: Number(e.amount)||0, serviceFeePercentage: Number(e.serviceFeePercentage)||0})) : [], participants: hasRental ? rentalParticipants : [], isPotential: hasRental ? isRentalPotential : false
        };
      }
    }
    if (selectedType === 'spot' || selectedType === 'food') {
      itemData.spotDetails = {
        hasTicket, ticketCost: hasTicket ? (Number(ticketCost) || 0) : undefined, currency: hasTicket ? selectedCurrency : undefined, hasServiceFee, serviceFee: (hasTicket && hasServiceFee) ? (Number(ticketCost) || 0) * (Number(serviceFeePercentage) || 0) / 100 : undefined, serviceFeePercentage: (hasTicket && hasServiceFee) ? (Number(serviceFeePercentage) || 0) : undefined, participants: hasTicket ? participantIds : undefined, isPotential: hasTicket ? isPotential : false
      };
    }
    onSave(itemData); onClose();
  };

  // Reusable Components
  const CurrencySelect = ({ value, onChange }: { value: string, onChange: (v: string) => void }) => (
      <select value={value} onChange={e => onChange(e.target.value)} className="bg-white p-2 rounded-lg border border-beige-dark outline-none text-xs font-bold text-cocoa max-w-full">
          <option value="TWD">TWD</option>{currencies.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
      </select>
  );

  const ParticipantsSelector = ({ selected, toggle }: { selected: string[], toggle: (id: string) => void }) => (
      <div className="flex flex-wrap gap-2 mt-2">
          {members.map(m => (
              <button key={m.id} onClick={() => toggle(m.id)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all ${selected.includes(m.id) ? 'bg-sage text-white border-sage shadow-sm' : 'bg-white text-gray-400 border-beige-dark'}`}>{m.name}</button>
          ))}
      </div>
  );

  // Helper to calculate total rental cost including extras and fees
  const calculateTotalRental = () => {
    let totalInRentalCurrency = 0;
    const baseAmount = Number(rentalCost) || 0;
    const baseWithFee = baseAmount + (rentalHasServiceFee ? baseAmount * (Number(rentalServiceFeePercentage) || 0) / 100 : 0);
    
    totalInRentalCurrency += baseWithFee;

    // Convert each extra expense to rentalCurrency if possible
    const rentalRate = currencies.find(c => c.code === rentalCurrency)?.rate || (rentalCurrency === 'TWD' ? 1 : 1);
    
    rentalExpenses.forEach(exp => {
      const expAmount = Number(exp.amount) || 0;
      const expWithFee = expAmount + (exp.hasServiceFee ? expAmount * (Number(exp.serviceFeePercentage) || 0) / 100 : 0);
      const expRate = currencies.find(c => c.code === exp.currency)?.rate || (exp.currency === 'TWD' ? 1 : 1);
      
      // Convert extra to TWD then to rentalCurrency
      const amountInTWD = expWithFee * expRate;
      totalInRentalCurrency += amountInTWD / (rentalRate || 1);
    });

    return totalInRentalCurrency;
  };

  return (
    <>
      <div className={`fixed inset-0 bg-cocoa/40 backdrop-blur-sm z-50 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />
      <div className={`fixed bottom-0 left-0 w-full bg-beige rounded-t-[2.5rem] z-50 p-6 pb-12 border-t-2 border-beige-dark shadow-[0_-8px_30px_rgba(0,0,0,0.1)] transform ${isOpen ? 'translate-y-0' : 'translate-y-full'} ${THEME.animation.overshoot} max-h-[90vh] overflow-y-auto`}>
        <div className="w-12 h-1.5 bg-beige-dark rounded-full mx-auto mb-8 sticky top-0" />
        
        {step === 'category' ? (
          <>
            <h3 className="text-xl font-black text-cocoa mb-6 text-center tracking-widest">選擇項目類型</h3>
            <div className="grid grid-cols-2 gap-4">
              {[ { type: 'spot', label: '景點', icon: Camera, color: 'bg-green-100 text-green-600' }, { type: 'food', label: '美食', icon: Utensils, color: 'bg-orange-100 text-orange-500' }, { type: 'transport', label: '交通', icon: Train, color: 'bg-blue-100 text-blue-500' }, { type: 'stay', label: '住宿', icon: Bed, color: 'bg-purple-100 text-purple-500' }, { type: 'flight', label: '航班', icon: Plane, color: 'bg-cyan-100 text-cyan-600' } ].map((item, i) => (
                <button key={i} onClick={() => { setSelectedType(item.type as ItemType); setStep('details'); }} className="flex flex-col items-center justify-center p-4 bg-white rounded-3xl shadow-hard active:translate-y-1 active:shadow-none transition-all border-2 border-beige-dark">
                  <div className={`w-12 h-12 rounded-2xl ${item.color} flex items-center justify-center mb-3 border-2 border-white shadow-sm`}><item.icon size={24} strokeWidth={2.5} /></div>
                  <span className="font-bold text-cocoa text-lg">{item.label}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="space-y-4">
             {/* ... details form content ... */}
             <div className="flex items-center justify-between mb-4">
                <button onClick={() => !initialData && setStep('category')} className={`text-gray-400 font-bold text-sm ${initialData ? 'opacity-0 cursor-default' : 'hover:text-sage'}`}>← 返回種類</button>
                <h3 className="text-xl font-black text-cocoa tracking-widest">{initialData ? '編輯項目' : '輸入細節'}</h3>
                <div className="w-10"></div>
             </div>
             
             {/* Basic Info */}
             <div className="bg-white p-4 rounded-2xl border-2 border-beige-dark shadow-sm">
                <label className="text-xs font-bold text-gray-400 block mb-1">標題</label>
                <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} className="w-full text-lg font-bold text-cocoa outline-none placeholder:text-gray-300 bg-transparent" placeholder={selectedType === 'flight' ? "例如: 台北 -> 東京" : "例如：清水寺..."} />
             </div>
             {/* ... rest of the form ... */}
             <div className="flex gap-4">
                <div className="bg-beige/50 p-3 rounded-2xl border-2 border-beige-dark flex items-center gap-3 shadow-sm flex-1">
                   <div className="p-2 bg-white rounded-xl text-sage shadow-sm flex-shrink-0">
                       <Clock size={20} />
                   </div>
                   <div className="flex-1 min-w-0">
                       <label className="text-[10px] font-bold text-gray-400 block mb-0.5">時間</label>
                       <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full text-base font-bold text-cocoa outline-none bg-transparent" style={{ colorScheme: 'light' }} />
                   </div>
                </div>
             </div>
             <div className="bg-white p-4 rounded-2xl border-2 border-beige-dark shadow-sm">
                <label className="text-xs font-bold text-gray-400 block mb-1">地點 / 地址</label>
                <div className="flex gap-2"><input value={location} onChange={(e) => setLocation(e.target.value)} className="flex-1 text-lg font-bold text-cocoa outline-none placeholder:text-gray-300 bg-transparent" placeholder="輸入地址..." />{location && <button onClick={() => openExternalMap(location)} className="text-gray-400 hover:text-blue-500"><Navigation size={20} /></button>}</div>
             </div>
             {(selectedType === 'stay' || selectedType === 'spot' || selectedType === 'food' || selectedType === 'transport' || selectedType === 'flight') && (
                 <div className="bg-white p-3 rounded-2xl border-2 border-beige-dark shadow-sm">
                    <label className="text-[10px] font-bold text-gray-400 block mb-1">GPS (Lat, Lng)</label>
                    <div className="flex gap-2"><input value={gpsInput} onChange={(e) => setGpsInput(e.target.value)} className="flex-1 text-sm font-bold text-cocoa outline-none placeholder:text-gray-300 bg-transparent" placeholder="例如: 35.689, 139.691" />{gpsInput && <button onClick={() => openExternalMap(gpsInput)} className="text-gray-400 hover:text-blue-500"><ExternalLink size={20} /></button>}</div>
                 </div>
             )}

             {/* === FLIGHT SECTION === */}
             {selectedType === 'flight' && (
                 <div className="space-y-4 pt-2 border-t-2 border-dashed border-beige-dark animate-scale-in">
                     <div className="bg-cyan-50/50 p-3 rounded-2xl border-2 border-cyan-100 space-y-3">
                         {/* ... flight inputs ... */}
                         <div className="grid grid-cols-2 gap-2">
                             <div className="bg-white p-3 rounded-2xl border border-beige-dark shadow-sm"><label className="text-[10px] font-bold text-gray-400 block mb-1">航空公司</label><input value={flightAirline} onChange={e => setFlightAirline(e.target.value)} className="w-full text-sm font-bold text-cocoa outline-none bg-transparent" placeholder="Ex: EVA"/></div>
                             <div className="bg-white p-3 rounded-2xl border border-beige-dark shadow-sm"><label className="text-[10px] font-bold text-gray-400 block mb-1">航班代碼</label><input value={flightCode} onChange={e => setFlightCode(e.target.value)} className="w-full text-sm font-bold text-cocoa outline-none bg-transparent" placeholder="Ex: BR123"/></div>
                         </div>
                         {/* ... more flight inputs ... */}
                         {/* Route/Times */}
                         <div className="grid grid-cols-2 gap-2">
                             <div className="bg-beige/50 p-3 rounded-2xl border-2 border-beige-dark flex items-center gap-2.5 shadow-sm">
                                 <div className="p-2 bg-white rounded-xl text-cyan-600 shadow-sm flex-shrink-0">
                                     <Clock size={18} />
                                 </div>
                                 <div className="flex-1 min-w-0">
                                     <label className="text-[10px] font-bold text-gray-400 block mb-0.5">去程起飛</label>
                                     <input type="time" value={flightDepTime} onChange={e => setFlightDepTime(e.target.value)} className="w-full text-xs font-bold text-cocoa outline-none bg-transparent" style={{ colorScheme: 'light' }}/>
                                 </div>
                             </div>
                             <div className="bg-beige/50 p-3 rounded-2xl border-2 border-beige-dark flex items-center gap-2.5 shadow-sm">
                                 <div className="p-2 bg-white rounded-xl text-cyan-600 shadow-sm flex-shrink-0">
                                     <Clock size={18} />
                                 </div>
                                 <div className="flex-1 min-w-0">
                                     <label className="text-[10px] font-bold text-gray-400 block mb-0.5">去程抵達</label>
                                     <input type="time" value={flightArrTime} onChange={e => setFlightArrTime(e.target.value)} className="w-full text-xs font-bold text-cocoa outline-none bg-transparent" style={{ colorScheme: 'light' }}/>
                                 </div>
                             </div>
                         </div>
                         <div className="bg-beige/50 p-3 rounded-2xl border-2 border-beige-dark flex items-center gap-3 shadow-sm">
                             <div className="p-2 bg-white rounded-xl text-cyan-600 shadow-sm flex-shrink-0">
                                 <CalendarIcon size={18} />
                             </div>
                             <div className="flex-1 min-w-0">
                                 <label className="text-[10px] font-bold text-gray-400 block mb-0.5">抵達日期 (若隔日)</label>
                                 <input type="date" value={flightArrDate} onChange={e => setFlightArrDate(e.target.value)} className="w-full text-xs font-bold text-cocoa outline-none bg-transparent" style={{ colorScheme: 'light' }}/>
                             </div>
                         </div>
                         <div className="grid grid-cols-2 gap-2">
                             <div className="bg-white p-3 rounded-2xl border border-beige-dark shadow-sm"><label className="text-[10px] font-bold text-gray-400 block mb-1">起飛機場</label><input value={flightDepAirport} onChange={e => setFlightDepAirport(e.target.value)} className="w-full text-sm font-bold text-cocoa outline-none bg-transparent" placeholder="TPE T2"/></div>
                             <div className="bg-white p-3 rounded-2xl border border-beige-dark shadow-sm"><label className="text-[10px] font-bold text-gray-400 block mb-1">抵達機場</label><input value={flightArrAirport} onChange={e => setFlightArrAirport(e.target.value)} className="w-full text-sm font-bold text-cocoa outline-none bg-transparent" placeholder="KIX T1"/></div>
                         </div>
                         <div className="grid grid-cols-2 gap-2">
                             <div className="bg-white p-3 rounded-2xl border border-beige-dark shadow-sm"><label className="text-[10px] font-bold text-gray-400 block mb-1">託運行李</label><input value={flightCheckedBag} onChange={e => setFlightCheckedBag(e.target.value)} className="w-full text-sm font-bold text-cocoa outline-none bg-transparent" placeholder="23kg"/></div>
                             <div className="bg-white p-3 rounded-2xl border border-beige-dark shadow-sm"><label className="text-[10px] font-bold text-gray-400 block mb-1">手提行李</label><input value={flightCarryOnBag} onChange={e => setFlightCarryOnBag(e.target.value)} className="w-full text-sm font-bold text-cocoa outline-none bg-transparent" placeholder="7kg"/></div>
                         </div>
                         {/* Cost */}
                         <div className="pt-2 border-t border-dashed border-cyan-200 mt-2">
                            <div className="text-xs font-bold text-cyan-600 mb-2 flex items-center gap-1"><DollarSign size={12}/> 機票費用 (總計)</div>
                            <div className="flex gap-2 mb-2">
                               <div className="bg-white p-2 rounded-xl border border-beige-dark shadow-sm flex-[2]"><input type="number" value={flightCost} onChange={(e) => setFlightCost(e.target.value)} className="w-full text-sm font-bold text-cocoa outline-none bg-transparent" placeholder="0"/></div>
                               <div className="w-24"><CurrencySelect value={flightCurrency} onChange={setFlightCurrency}/></div>
                            </div>
                            <div className="flex items-center gap-4 mb-2">
                                <ToggleSwitch checked={flightHasServiceFee} onChange={setFlightHasServiceFee} label="含稅/手續費" colorClass="bg-cyan-400" />
                                {flightHasServiceFee && <div className="flex items-center bg-white px-2 py-1 rounded border border-beige-dark"><input type="number" value={flightServiceFeePercentage} onChange={e => setFlightServiceFeePercentage(e.target.value)} className="w-8 bg-transparent text-xs font-bold outline-none text-right text-cocoa" placeholder="0"/><span className="text-xs font-bold text-gray-400 ml-1">%</span></div>}
                            </div>
                            <CostDisplay amount={Number(flightCost)} currency={flightCurrency} hasFee={flightHasServiceFee} feePct={Number(flightServiceFeePercentage)} currencies={currencies} />
                            
                            <label className="text-[10px] font-bold text-gray-400 block mb-1 mt-2">參與分攤人員</label>
                            <ParticipantsSelector selected={flightParticipants} toggle={(id) => toggleParticipant(id, setFlightParticipants)}/>
                            <div className="mt-2">
                                <ToggleSwitch checked={isFlightPotential} onChange={setIsFlightPotential} label="列入潛在花費 (預算參考)" colorClass="bg-yellow-400" />
                            </div>
                         </div>
                     </div>
                 </div>
             )}

             {/* === STAY SECTION === */}
             {selectedType === 'stay' && (
               <div className="space-y-4 pt-2 border-t-2 border-dashed border-beige-dark animate-scale-in">
                 <div className="space-y-3 bg-purple-50/50 p-3 rounded-2xl border-2 border-purple-100 mt-2">
                      {/* ... stay inputs ... */}
                      <div className="grid grid-cols-2 gap-2">
                          <div className="bg-beige/50 p-3 rounded-2xl border-2 border-beige-dark flex items-center gap-2.5 shadow-sm">
                              <div className="p-2 bg-white rounded-xl text-purple-600 shadow-sm flex-shrink-0">
                                  <Clock size={18} />
                              </div>
                              <div className="flex-1 min-w-0">
                                  <label className="text-[10px] font-bold text-gray-400 block mb-0.5">入住時間</label>
                                  <input type="time" value={checkIn} onChange={e => setCheckIn(e.target.value)} className="w-full text-xs font-bold text-cocoa outline-none bg-transparent" style={{ colorScheme: 'light' }}/>
                              </div>
                          </div>
                          <div className="bg-beige/50 p-3 rounded-2xl border-2 border-beige-dark flex items-center gap-2.5 shadow-sm">
                              <div className="p-2 bg-white rounded-xl text-purple-600 shadow-sm flex-shrink-0">
                                  <Clock size={18} />
                              </div>
                              <div className="flex-1 min-w-0">
                                  <label className="text-[10px] font-bold text-gray-400 block mb-0.5">退房時間</label>
                                  <input type="time" value={checkOut} onChange={e => setCheckOut(e.target.value)} className="w-full text-xs font-bold text-cocoa outline-none bg-transparent" style={{ colorScheme: 'light' }}/>
                              </div>
                          </div>
                      </div>
                      <div className="flex gap-2 px-1">
                          <CuteButton checked={hasBreakfast} onChange={setHasBreakfast} icon={Coffee} label="供應早餐" activeColor="bg-purple-100 text-purple-600 border-purple-200" />
                          <CuteButton checked={hasDinner} onChange={setHasDinner} icon={Utensils} label="供應晚餐" activeColor="bg-purple-100 text-purple-600 border-purple-200" />
                      </div>
                      <div className="pt-2 border-t border-dashed border-purple-200 mt-2">
                          <div className="text-xs font-bold text-purple-600 mb-2 flex items-center gap-1"><DollarSign size={12}/> 住宿費用</div>
                          <div className="flex gap-2 mb-2">
                             <div className="bg-white p-2 rounded-xl border border-beige-dark shadow-sm flex-[2]"><input type="number" value={stayCost} onChange={(e) => setStayCost(e.target.value)} className="w-full text-sm font-bold text-cocoa outline-none bg-transparent" placeholder="0"/></div>
                             <div className="w-24"><CurrencySelect value={stayCurrency} onChange={setStayCurrency}/></div>
                          </div>
                          <div className="flex items-center gap-4 mb-2">
                                <ToggleSwitch checked={stayHasServiceFee} onChange={setStayHasServiceFee} label="含稅/手續費" colorClass="bg-purple-400" />
                                {stayHasServiceFee && <div className="flex items-center bg-white px-2 py-1 rounded border border-beige-dark"><input type="number" value={stayServiceFeePercentage} onChange={e => setStayServiceFeePercentage(e.target.value)} className="w-8 bg-transparent text-xs font-bold outline-none text-right text-cocoa" placeholder="0"/><span className="text-xs font-bold text-gray-400 ml-1">%</span></div>}
                          </div>
                          <CostDisplay amount={Number(stayCost)} currency={stayCurrency} hasFee={stayHasServiceFee} feePct={Number(stayServiceFeePercentage)} currencies={currencies} />

                          <label className="text-[10px] font-bold text-gray-400 block mb-1 mt-2">參與分攤人員</label>
                          <ParticipantsSelector selected={stayParticipants} toggle={(id) => toggleParticipant(id, setStayParticipants)}/>
                          <div className="mt-2">
                                <ToggleSwitch checked={isStayPotential} onChange={setIsStayPotential} label="列入潛在花費 (預算參考)" colorClass="bg-yellow-400" />
                          </div>
                      </div>
                 </div>
               </div>
             )}

             {/* === TRANSPORT SECTION === */}
             {selectedType === 'transport' && (
                 <div className="border-t-2 border-dashed border-beige-dark pt-4 space-y-4">
                     {/* Mode Selector Tabs */}
                     <div className="flex bg-beige/60 p-1.5 rounded-2xl border-2 border-beige-dark gap-2 shadow-inner">
                         <button
                           type="button"
                           onClick={() => setTransportMode('transit')}
                           className={`flex-1 py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all ${
                             transportMode === 'transit'
                               ? 'bg-blue-500 text-white shadow-md'
                               : 'bg-transparent text-gray-500 hover:text-cocoa'
                           }`}
                         >
                           <Train size={16} strokeWidth={2.5} />
                           <span>大眾運輸 / 鐵道轉乘</span>
                         </button>
                         <button
                           type="button"
                           onClick={() => {
                             setTransportMode('rental');
                             setHasRental(true);
                           }}
                           className={`flex-1 py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all ${
                             transportMode === 'rental'
                               ? 'bg-blue-500 text-white shadow-md'
                               : 'bg-transparent text-gray-500 hover:text-cocoa'
                           }`}
                         >
                           <Car size={16} strokeWidth={2.5} />
                           <span>自駕租車</span>
                         </button>
                     </div>

                     {/* Transit Mode Form */}
                     {transportMode === 'transit' && (
                         <div className="space-y-4 animate-scale-in">
                             <TransitLegEditor
                               legs={transitLegs}
                               setLegs={setTransitLegs}
                               fare={transitFare}
                               setFare={setTransitFare}
                               currencies={currencies}
                             />

                             <div className="bg-white p-3.5 rounded-2xl border-2 border-beige-dark shadow-sm space-y-3">
                                 <div>
                                     <label className="text-[10px] font-black text-gray-400 block mb-1">參與分攤人員</label>
                                     <ParticipantsSelector
                                       selected={transitParticipants}
                                       toggle={(id) => toggleParticipant(id, setTransitParticipants)}
                                     />
                                 </div>
                                 <div className="pt-2 border-t border-dashed border-beige-dark">
                                     <ToggleSwitch
                                       checked={isTransitPotential}
                                       onChange={setIsTransitPotential}
                                       label="列入潛在花費 (預算參考)"
                                       colorClass="bg-yellow-400"
                                     />
                                 </div>
                             </div>
                         </div>
                     )}

                     {/* Car Rental Mode Form */}
                     {transportMode === 'rental' && (
                         <div className="space-y-3 bg-blue-50/50 p-3 rounded-2xl border-2 border-blue-100 animate-scale-in">
                             <div className="grid grid-cols-2 gap-2">
                                 <div className="bg-white p-3 rounded-2xl border border-beige-dark shadow-sm"><label className="text-[10px] font-bold text-gray-400 block mb-1">租車公司</label><input value={rentalCompany} onChange={e => setRentalCompany(e.target.value)} className="w-full text-sm font-bold text-cocoa outline-none bg-transparent" placeholder="Ex: Toyota"/></div>
                                 <div className="bg-white p-3 rounded-2xl border border-beige-dark shadow-sm"><label className="text-[10px] font-bold text-gray-400 block mb-1">車型</label><input value={carModel} onChange={e => setCarModel(e.target.value)} className="w-full text-sm font-bold text-cocoa outline-none bg-transparent" placeholder="Ex: Yaris"/></div>
                             </div>
                             <div className="grid grid-cols-2 gap-2">
                                 <div className="bg-beige/50 p-3 rounded-2xl border-2 border-beige-dark flex items-center gap-2.5 shadow-sm">
                                     <div className="p-2 bg-white rounded-xl text-blue-500 shadow-sm flex-shrink-0">
                                         <Clock size={18} />
                                     </div>
                                     <div className="flex-1 min-w-0">
                                         <label className="text-[10px] font-bold text-gray-400 block mb-0.5">取車時間</label>
                                         <input type="time" value={pickupTime} onChange={e => setPickupTime(e.target.value)} className="w-full text-xs font-bold text-cocoa outline-none bg-transparent" style={{ colorScheme: 'light' }}/>
                                     </div>
                                 </div>
                                 <div className="bg-beige/50 p-3 rounded-2xl border-2 border-beige-dark flex items-center gap-2.5 shadow-sm">
                                     <div className="p-2 bg-white rounded-xl text-blue-500 shadow-sm flex-shrink-0">
                                         <Clock size={18} />
                                     </div>
                                     <div className="flex-1 min-w-0">
                                         <label className="text-[10px] font-bold text-gray-400 block mb-0.5">還車時間</label>
                                         <input type="time" value={returnTime} onChange={e => setReturnTime(e.target.value)} className="w-full text-xs font-bold text-cocoa outline-none bg-transparent" style={{ colorScheme: 'light' }}/>
                                     </div>
                                 </div>
                             </div>
                             
                             {/* Rental Cost */}
                             <div className="pt-2 border-t border-dashed border-blue-200 mt-2">
                                <div className="text-xs font-bold text-gray-500 mb-2 flex items-center gap-1"><DollarSign size={12}/> 租車費用 (加總)</div>
                                <div className="flex gap-2 mb-2">
                                   <div className="bg-white p-2 rounded-xl border border-beige-dark shadow-sm flex-[2]"><input type="number" value={rentalCost} onChange={(e) => setRentalCost(e.target.value)} className="w-full text-sm font-bold text-cocoa outline-none bg-transparent" placeholder="0"/></div>
                                   <div className="w-24"><CurrencySelect value={rentalCurrency} onChange={setRentalCurrency}/></div>
                                </div>
                                <div className="flex items-center gap-4 mb-2">
                                    <ToggleSwitch checked={rentalHasServiceFee} onChange={setRentalHasServiceFee} label="含稅/手續費" colorClass="bg-blue-400" />
                                    {rentalHasServiceFee && <div className="flex items-center bg-white px-2 py-1 rounded border border-beige-dark"><input type="number" value={rentalServiceFeePercentage} onChange={e => setRentalServiceFeePercentage(e.target.value)} className="w-8 bg-transparent text-xs font-bold outline-none text-right text-cocoa" placeholder="0"/><span className="text-xs font-bold text-gray-400 ml-1">%</span></div>}
                                </div>
                                {/* Use real-time total rental calculation */}
                                <CostDisplay amount={calculateTotalRental()} currency={rentalCurrency} hasFee={false} feePct={0} currencies={currencies} />
                             </div>

                             {/* Fuel Cost */}
                             <div className="pt-2 border-t border-dashed border-blue-200 mt-1">
                                <div className="text-xs font-bold text-gray-500 mb-2 flex items-center gap-1"><Fuel size={12}/> 預估油資</div>
                                <div className="flex gap-2 mb-2">
                                   <div className="bg-white p-2 rounded-xl border border-beige-dark shadow-sm flex-[2]"><input type="number" value={estimatedFuelCost} onChange={(e) => setEstimatedFuelCost(e.target.value)} className="w-full text-sm font-bold text-cocoa outline-none bg-transparent" placeholder="0"/></div>
                                   <div className="w-24"><CurrencySelect value={fuelCurrency} onChange={setFuelCurrency}/></div>
                                </div>
                             </div>

                             {/* Extra Expenses */}
                             <div className="pt-2 border-t border-dashed border-blue-200 mt-1">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="text-xs font-bold text-gray-500 flex items-center gap-1"><Plus size={12}/> 額外支出 (過路費等)</div>
                                    <button onClick={addRentalExpense} className="text-[10px] bg-white border border-blue-200 text-blue-500 px-2 py-1 rounded-lg font-bold shadow-sm">新增項目</button>
                                </div>
                                {rentalExpenses.map(exp => (
                                    <div key={exp.id} className="bg-white p-3 rounded-xl border border-beige-dark shadow-sm mb-2">
                                        <div className="flex gap-2 mb-2">
                                            <input value={exp.name} onChange={e => updateRentalExpense(exp.id, 'name', e.target.value)} placeholder="項目名稱" className="flex-1 bg-gray-50 p-2 rounded-lg border border-beige-dark text-xs font-bold text-cocoa outline-none focus:border-blue-300"/>
                                            <button onClick={() => setExpenseToDelete(exp.id)} className="text-red-400 p-1 hover:text-red-600 transition-colors"><X size={16}/></button>
                                        </div>
                                        <div className="flex gap-2 items-center">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex gap-1">
                                                    <input type="number" value={exp.amount} onChange={e => updateRentalExpense(exp.id, 'amount', e.target.value)} placeholder="金額" className="flex-1 bg-gray-50 p-2 rounded-lg border border-beige-dark text-xs font-bold text-cocoa outline-none focus:border-blue-300 min-w-0"/>
                                                    <div className="w-24 flex-shrink-0"><CurrencySelect value={exp.currency || 'TWD'} onChange={v => updateRentalExpense(exp.id, 'currency', v)}/></div>
                                                </div>
                                            </div>
                                        </div>
                                        {Number(exp.amount) > 0 && (
                                            <div className="mt-2 text-[10px] font-black text-blue-500 text-right">
                                                約 TWD ${Math.round(Number(exp.amount) * (currencies.find(c => c.code === exp.currency)?.rate || (exp.currency === 'TWD' ? 1 : 1))).toLocaleString()}
                                            </div>
                                        )}
                                    </div>
                                ))}
                             </div>

                             <label className="text-[10px] font-bold text-gray-400 block mb-1 mt-2">參與分攤人員</label>
                             <ParticipantsSelector selected={rentalParticipants} toggle={(id) => toggleParticipant(id, setRentalParticipants)}/>
                             <div className="mt-2">
                                <ToggleSwitch checked={isRentalPotential} onChange={setIsRentalPotential} label="列入潛在花費 (預算參考)" colorClass="bg-yellow-400" />
                             </div>
                         </div>
                     )}
                 </div>
             )}

             {/* === SPOT / FOOD SECTION === */}
             {(selectedType === 'spot' || selectedType === 'food') && (
               <div className="space-y-4 pt-2 border-t-2 border-dashed border-beige-dark animate-scale-in">
                 {/* ... spot inputs ... */}
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sage font-bold">
                        {selectedType === 'food' ? <Utensils size={18}/> : <Ticket size={18} />} 
                        <span>{selectedType === 'food' ? '餐飲費用' : '門票與費用'}</span>
                    </div>
                    {/* Only show top toggle for Spot/Ticket, keep Food inputs always visible but use same internal state structure */}
                    {selectedType === 'spot' && (
                        <button onClick={() => setHasTicket(!hasTicket)} className={`w-12 h-7 rounded-full p-1 transition-colors ${hasTicket ? 'bg-sage' : 'bg-gray-200'}`}><div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${hasTicket ? 'translate-x-5' : 'translate-x-0'}`} /></button>
                    )}
                 </div>

                 {(hasTicket || selectedType === 'food') && (
                   <div className="space-y-3 bg-white/50 p-3 rounded-2xl border-2 border-beige-dark/50">
                      <div className="flex gap-2">
                         <div className="bg-white p-3 rounded-2xl border-2 border-beige-dark shadow-sm flex-[2]">
                            <label className="text-[10px] font-bold text-gray-400 block mb-1">金額</label>
                            <input type="number" value={ticketCost} onChange={(e) => setTicketCost(e.target.value)} className="w-full text-sm font-bold text-cocoa outline-none bg-transparent" placeholder="0"/>
                         </div>
                         <div className="w-24 bg-white p-3 rounded-2xl border-2 border-beige-dark shadow-sm">
                             <label className="text-[10px] font-bold text-gray-400 block mb-1">幣別</label>
                             <div className="mt-1"><CurrencySelect value={selectedCurrency} onChange={setSelectedCurrency}/></div>
                         </div>
                      </div>
                      <div className="flex items-center gap-4 mb-1">
                            <ToggleSwitch checked={hasServiceFee} onChange={setHasServiceFee} label="含稅/手續費" />
                            {hasServiceFee && <div className="flex items-center bg-white px-2 py-1 rounded border border-beige-dark"><input type="number" value={serviceFeePercentage} onChange={e => setServiceFeePercentage(e.target.value)} className="w-8 bg-transparent text-xs font-bold outline-none text-right text-cocoa" placeholder="0"/><span className="text-xs font-bold text-gray-400 ml-1">%</span></div>}
                      </div>
                      <CostDisplay amount={Number(ticketCost)} currency={selectedCurrency} hasFee={hasServiceFee} feePct={Number(serviceFeePercentage)} currencies={currencies} />

                      <label className="text-[10px] font-bold text-gray-400 block mb-1 mt-2">參與分攤人員</label>
                      <ParticipantsSelector selected={participantIds} toggle={(id) => toggleParticipant(id, setParticipantIds)}/>
                      <div className="mt-2">
                        <ToggleSwitch checked={isPotential} onChange={setIsPotential} label="列入潛在花費 (預算參考)" colorClass="bg-yellow-400" />
                      </div>
                   </div>
                 )}
               </div>
             )}

             <div className="bg-white p-4 rounded-2xl border-2 border-beige-dark shadow-sm">
                <label className="text-xs font-bold text-gray-400 flex items-center gap-1 mb-1"><AlignLeft size={12}/> 備註</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full text-sm font-medium text-cocoa outline-none min-h-[80px] resize-none bg-transparent" placeholder="詳細資訊..." style={{ colorScheme: 'light' }}/>
             </div>

             <button onClick={handleSubmit} className="w-full mt-4 py-4 rounded-2xl bg-sage text-white text-lg font-bold shadow-hard-sage active:translate-y-1 active:shadow-none transition-all border-2 border-sage">{initialData ? '確認修改' : '確認新增'}</button>
          </div>
        )}
      </div>

      <DeleteItemConfirmModal 
        isOpen={!!expenseToDelete} 
        onClose={() => setExpenseToDelete(null)} 
        onConfirm={confirmRemoveExpense}
        title="此筆費用項目"
      />
    </>
  );
};
