
import React, { useState, useEffect } from 'react';
import { Camera, Utensils, Train, Bed, PenTool, Trash2, AlertCircle, Map, Coffee, Moon, AlignLeft, Ticket, Coins, Users, Plus, X, Settings, Car, Clock, DollarSign, Navigation, ExternalLink, Fuel, Calendar, Plane, Edit3, Luggage, Copy, Save } from 'lucide-react';
import { ItemType, ScheduleItem, Currency, Member, THEME, ExpenseItem } from '../types';

// Helper for consistent fruit icon
const getACFruit = (str: string) => {
    const fruits = ['🍎', '🍊', '🍐', '🍑', '🍒', '🥥'];
    if (!str) return '🍎';
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return fruits[Math.abs(hash) % fruits.length];
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

export const BackupConfirmModal = ({ isOpen, onClose, onConfirm, tripName }: { isOpen: boolean, onClose: () => void, onConfirm: () => void, tripName: string }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-cocoa/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={onClose}>
             <div className="bg-white p-6 rounded-3xl w-full max-w-sm shadow-2xl border-2 border-beige-dark animate-scale-in" onClick={e => e.stopPropagation()}>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-500 border-2 border-blue-200">
                    <Copy size={24} />
                </div>
                <h3 className="text-xl font-black text-cocoa mb-2 text-center">建立行程副本?</h3>
                <p className="text-gray-400 font-bold text-center text-sm mb-6">
                    確定要備份 <span className="text-cocoa">{tripName}</span> 嗎？<br/>
                    這將會產生一個全新的行程代碼。
                </p>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 rounded-xl font-bold text-gray-400 bg-gray-100 hover:bg-gray-200 transition-colors">取消</button>
                    <button onClick={onConfirm} className="flex-1 py-3 rounded-xl font-bold text-white bg-blue-500 hover:bg-blue-600 shadow-hard-sm border-2 border-blue-600 active:translate-y-1 active:shadow-none transition-all">確認備份</button>
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
    isOpen, onClose, currencies, onAddCurrency, onRemoveCurrency, onBackup
}: { 
    isOpen: boolean, onClose: () => void, 
    currencies: Currency[], onAddCurrency: (c: Currency) => void, onRemoveCurrency: (code: string) => void,
    onBackup: () => void
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
                     <div className="flex gap-2">
                         <input value={newCurrencyCode} onChange={e => setNewCurrencyCode(e.target.value)} placeholder="幣別 (JPY)" className="w-24 bg-gray-50 px-3 py-2 rounded-xl text-sm font-bold outline-none border border-transparent focus:border-sage text-cocoa"/>
                         <input type="number" value={newCurrencyRate} onChange={e => setNewCurrencyRate(e.target.value)} placeholder="匯率 (0.21)" className="flex-1 bg-gray-50 px-3 py-2 rounded-xl text-sm font-bold outline-none border border-transparent focus:border-sage text-cocoa"/>
                         <button onClick={handleAddCurrency} disabled={!newCurrencyCode || !newCurrencyRate} className="p-2 bg-sage text-white rounded-xl shadow-hard-sm-sage disabled:opacity-50"><Plus size={20}/></button>
                     </div>
                </div>

                {/* Backup Section */}
                <div className="border-t border-dashed border-gray-200 pt-6">
                    <h4 className="text-sm font-bold text-gray-400 mb-3 flex items-center gap-2"><Save size={16}/> 備份</h4>
                    <button 
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onBackup(); }} 
                        className="w-full py-3 bg-blue-50 text-blue-500 font-black rounded-xl border-2 border-blue-100 hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 shadow-sm"
                        type="button"
                    >
                        <Copy size={16}/> 建立行程副本
                    </button>
                    <p className="text-[10px] text-gray-400 mt-2 text-center">這將會建立一個內容完全相同但代碼不同的新行程 (副本)。</p>
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

    // Helper to calculate cost
    const calculateItemCost = (item: ScheduleItem) => {
        let total = 0;
        let currency = 'TWD';
        let details = '';

        if (item.type === 'flight' && item.flightDetails) {
            const cost = Number(item.flightDetails.cost) || 0;
            const fee = item.flightDetails.hasServiceFee ? cost * (Number(item.flightDetails.serviceFeePercentage) || 0) / 100 : 0;
            total = cost + fee;
            currency = item.flightDetails.currency || 'TWD';
            details = `機票: ${item.flightDetails.airline} ${item.flightDetails.flightCode}`;
        } else if (item.type === 'stay' && item.stayDetails) {
            const cost = Number(item.stayDetails.cost) || 0;
            const fee = item.stayDetails.hasServiceFee ? cost * (Number(item.stayDetails.serviceFeePercentage) || 0) / 100 : 0;
            total = cost + fee;
            currency = item.stayDetails.currency || 'TWD';
            details = '住宿費用';
        } else if (item.type === 'transport' && item.carRental) {
            const rentalCost = Number(item.carRental.rentalCost) || 0;
            const rentalFee = item.carRental.hasServiceFee ? rentalCost * (Number(item.carRental.serviceFeePercentage) || 0) / 100 : 0;
            
            let expensesCost = 0;
            if (item.carRental.expenses) {
                 item.carRental.expenses.forEach(exp => {
                     const amt = Number(exp.amount) || 0;
                     const fee = exp.hasServiceFee ? amt * (Number(exp.serviceFeePercentage) || 0) / 100 : 0;
                     expensesCost += amt + fee; 
                 });
            }
            
            const fuelCost = Number(item.carRental.estimatedFuelCost) || 0;
            
            total = rentalCost + rentalFee + expensesCost + fuelCost;
            currency = item.carRental.rentalCurrency || 'TWD';
            details = `租車: ${item.carRental.company}`;
        } else if ((item.type === 'spot' || item.type === 'food') && item.spotDetails) {
            const cost = Number(item.spotDetails.ticketCost) || 0;
            const fee = item.spotDetails.hasServiceFee ? cost * (Number(item.spotDetails.serviceFeePercentage) || 0) / 100 : 0;
            total = cost + fee;
            currency = item.spotDetails.currency || 'TWD';
            details = item.type === 'food' ? '餐飲預算' : '門票預算';
        }

        return { total, currency, details };
    };

    const costItems = items.map(item => {
        const { total, currency, details } = calculateItemCost(item);
        if (total <= 0) return null;
        
        const rate = currencies.find(c => c.code === currency)?.rate || 1;
        const twd = Math.round(total * rate);
        
        return {
            title: item.title,
            details,
            original: { amount: total, currency },
            twd
        };
    }).filter(Boolean);

    const totalTWD = costItems.reduce((acc, curr) => acc + (curr?.twd || 0), 0);

    return (
        <div className="fixed inset-0 bg-cocoa/40 backdrop-blur-sm z-[80] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white p-6 rounded-[2.5rem] w-full max-w-md shadow-2xl border-2 border-beige-dark animate-scale-in max-h-[85vh] overflow-y-auto custom-scroll" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-black text-cocoa flex items-center gap-2"><Coins size={20} className="text-yellow-500"/> 潛在花費預估</h3>
                    <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={16}/></button>
                </div>

                <div className="bg-sage text-white p-6 rounded-[2rem] mb-6 shadow-hard-sm border-2 border-sage-dark relative overflow-hidden">
                    <p className="text-xs font-bold opacity-80 mb-1">預估總金額 (TWD)</p>
                    <h2 className="text-4xl font-black font-mono tracking-tight">NT$ {totalTWD.toLocaleString()}</h2>
                </div>

                <div className="space-y-3">
                    {costItems.length === 0 ? (
                        <div className="text-center py-8 text-gray-400 font-bold">沒有潛在花費項目</div>
                    ) : (
                        costItems.map((item, idx) => (
                            <div key={idx} className="bg-white p-4 rounded-2xl border border-beige-dark shadow-sm flex justify-between items-center">
                                <div>
                                    <h4 className="font-bold text-cocoa text-sm">{item?.title}</h4>
                                    <p className="text-[10px] text-gray-400 font-bold">{item?.details}</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-black text-cocoa font-mono">
                                        {item?.original.currency} {Math.round(item?.original.amount || 0).toLocaleString()}
                                    </div>
                                    {item?.original.currency !== 'TWD' && (
                                        <div className="text-[10px] text-sage font-bold font-mono">≈ NT$ {item?.twd.toLocaleString()}</div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export const AddScheduleModal = ({ 
    isOpen, onClose, onSave, initialData, currencies, members, currentDate 
}: { 
    isOpen: boolean, onClose: () => void, 
    onSave: (item: any) => void, 
    initialData: ScheduleItem | null, 
    currencies: Currency[], 
    members: Member[],
    currentDate: string 
}) => {
    const [title, setTitle] = useState('');
    const [time, setTime] = useState('09:00');
    const [type, setType] = useState<ItemType>('spot');
    const [location, setLocation] = useState('');
    const [notes, setNotes] = useState('');
    
    useEffect(() => {
        if (initialData) {
            setTitle(initialData.title);
            setTime(initialData.time);
            setType(initialData.type);
            setLocation(initialData.location);
            setNotes(initialData.notes || '');
        } else {
            setTitle('');
            setTime('09:00');
            setType('spot');
            setLocation('');
            setNotes('');
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleSave = () => {
        if (!title) return;
        onSave({
            date: initialData?.date || currentDate,
            time,
            title,
            type,
            location,
            notes
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-cocoa/40 backdrop-blur-sm z-[80] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white p-6 rounded-[2rem] w-full max-w-sm shadow-2xl border-2 border-beige-dark animate-scale-in" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-black text-cocoa mb-6 text-center">{initialData ? '編輯行程' : '新增行程'}</h3>
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-400 block mb-1">時間</label>
                        <input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full bg-beige/50 p-3 rounded-xl border border-beige-dark font-bold text-cocoa outline-none" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-400 block mb-1">標題</label>
                        <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="行程名稱" className="w-full bg-beige/50 p-3 rounded-xl border border-beige-dark font-bold text-cocoa outline-none" />
                    </div>
                    <div className="flex gap-2">
                        <div className="flex-1">
                             <label className="text-xs font-bold text-gray-400 block mb-1">類別</label>
                             <select value={type} onChange={e => setType(e.target.value as ItemType)} className="w-full bg-beige/50 p-3 rounded-xl border border-beige-dark font-bold text-cocoa outline-none">
                                <option value="spot">景點</option>
                                <option value="food">美食</option>
                                <option value="transport">交通</option>
                                <option value="stay">住宿</option>
                                <option value="flight">航班</option>
                             </select>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-400 block mb-1">地點</label>
                        <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="地點" className="w-full bg-beige/50 p-3 rounded-xl border border-beige-dark font-bold text-cocoa outline-none" />
                    </div>
                     <div>
                        <label className="text-xs font-bold text-gray-400 block mb-1">備註</label>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="備註..." className="w-full bg-beige/50 p-3 rounded-xl border border-beige-dark font-bold text-cocoa outline-none h-20 resize-none" />
                    </div>
                </div>
                <div className="flex gap-3 mt-6">
                    <button onClick={onClose} className="flex-1 py-3 rounded-xl font-bold text-gray-400 bg-gray-100 hover:bg-gray-200 transition-colors">取消</button>
                    <button onClick={handleSave} className="flex-1 py-3 rounded-xl font-bold text-white bg-sage hover:bg-sage-dark shadow-hard-sage border-2 border-sage active:translate-y-1 active:shadow-none transition-all">保存</button>
                </div>
            </div>
        </div>
    );
};

export const DeleteItemConfirmModal = ({ isOpen, onClose, onConfirm, title }: { isOpen: boolean, onClose: () => void, onConfirm: () => void, title: string }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-cocoa/40 backdrop-blur-sm z-[80] flex items-center justify-center p-4" onClick={onClose}>
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

export const EditDayDetailsModal = ({ isOpen, onClose, onConfirm, initialDate, initialLocation }: { isOpen: boolean, onClose: () => void, onConfirm: (date: string, location: string) => void, initialDate: string, initialLocation: string }) => {
    const [date, setDate] = useState(initialDate);
    const [location, setLocation] = useState(initialLocation);

    useEffect(() => {
        setDate(initialDate);
        setLocation(initialLocation);
    }, [initialDate, initialLocation, isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-cocoa/40 backdrop-blur-sm z-[80] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white p-6 rounded-[2rem] w-full max-w-sm shadow-2xl border-2 border-beige-dark animate-scale-in" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-black text-cocoa mb-6 text-center">編輯日期詳情</h3>
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-400 block mb-1">日期</label>
                        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-beige/50 p-3 rounded-xl border border-beige-dark font-bold text-cocoa outline-none" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-400 block mb-1">地點</label>
                        <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="例如：東京" className="w-full bg-beige/50 p-3 rounded-xl border border-beige-dark font-bold text-cocoa outline-none" />
                    </div>
                </div>
                <div className="flex gap-3 mt-6">
                    <button onClick={onClose} className="flex-1 py-3 rounded-xl font-bold text-gray-400 bg-gray-100 hover:bg-gray-200 transition-colors">取消</button>
                    <button onClick={() => { onConfirm(date, location); onClose(); }} className="flex-1 py-3 rounded-xl font-bold text-white bg-sage hover:bg-sage-dark shadow-hard-sage border-2 border-sage active:translate-y-1 active:shadow-none transition-all">保存</button>
                </div>
            </div>
        </div>
    );
};
