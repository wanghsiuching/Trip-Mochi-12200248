
import React, { useState, useEffect, useRef } from 'react';
import { 
  PenTool, List, Wallet, Coins, User, MapPin, Trash2, 
  Receipt, CreditCard, Clock, Check, ArrowLeft, Send, MessageCircle, X,
  ArrowUpRight, ArrowDownLeft, Scale, CheckCircle2, Circle, AlertCircle, HelpCircle
} from 'lucide-react';
import { Expense, Member, Currency, Comment } from '../types';

interface ExpensesViewProps {
  expenses: Expense[];
  members: Member[];
  currencies: Currency[];
  onAdd: (expense: Omit<Expense, 'id'>) => void;
  onUpdate: (expense: Expense) => void;
  onDelete: (id: number) => void;
  onShowToast: (message: string, type: 'success' | 'error') => void;
  highlightId?: string | null;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({ 
  expenses, members, currencies, onAdd, onUpdate, onDelete, onShowToast, highlightId 
}) => {
  const [form, setForm] = useState({ 
      amount: '', title: '', currency: 'TWD', payer: members[0]?.name || '我', involvedMembers: [] as string[],
      paymentMethod: '現金', location: '', image: null as string | null,
      date: new Date().toISOString().split('T')[0], time: new Date().toTimeString().slice(0, 5), images: [] as string[]
  });
  
  const [mobileTab, setMobileTab] = useState<'input' | 'list'>(highlightId ? 'list' : 'input');
  const [filter, setFilter] = useState('all');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  
  // Settlement Confirmation State
  const [settleConfirm, setSettleConfirm] = useState<{ exp: Expense, memberName: string, amount: number } | null>(null);

  const listContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (highlightId && mobileTab === 'list') {
      setTimeout(() => {
        const element = document.getElementById(`expense-${highlightId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('ring-4', 'ring-sage', 'ring-offset-2', 'animate-pulse');
          setTimeout(() => element.classList.remove('ring-4', 'ring-sage', 'ring-offset-2', 'animate-pulse'), 3000);
        }
      }, 100);
    }
  }, [highlightId, mobileTab]);

  const calculateTWD = (amount: number, currency: string) => {
      if (currency === 'TWD') return amount;
      const rateObj = currencies.find(c => c.code === currency);
      const rate = rateObj ? rateObj.rate : 1;
      return Math.round(amount * rate);
  };

  const filteredExpenses = filter === 'all' 
    ? expenses 
    : expenses.filter(e => e.payer === filter || e.involvedMembers?.includes(filter));

  const totalTWD = filteredExpenses.reduce((acc, curr) => acc + calculateTWD(curr.amount, curr.currency), 0);
  
  // --- Enhanced Financial Logic ---
  const getMemberStats = (memberName: string) => {
    let paidUpfrontTWD = 0;      // 我從口袋掏出的總額 (代墊)
    let myOwnShareTWD = 0;       // 我本來就該付的總額 (個人負擔)
    let collectedFromOthers = 0;  // 我代墊的錢裡，別人「已經還我」的
    let waitingFromOthers = 0;    // 我代墊的錢裡，別人「還沒還我」的 (待收款)
    let pendingToOthers = 0;      // 別人代墊的錢裡，我「還沒還人」的 (待補繳)

    expenses.forEach(exp => {
      const expTWD = calculateTWD(exp.amount, exp.currency);
      const involved = exp.involvedMembers || [];
      const splitCount = involved.length || 1;
      const perPersonShare = expTWD / splitCount;

      // 如果我是付款人
      if (exp.payer === memberName) {
        paidUpfrontTWD += expTWD;
        
        // 計算其他人欠我的部分
        involved.forEach(m => {
          if (m === memberName) {
            myOwnShareTWD += perPersonShare;
          } else {
            const isSettled = exp.settledMembers?.includes(m);
            if (isSettled) collectedFromOthers += perPersonShare;
            else waitingFromOthers += perPersonShare;
          }
        });
      } 
      // 如果我不是付款人，但我有參與分攤
      else if (involved.includes(memberName)) {
        myOwnShareTWD += perPersonShare;
        const isSettled = exp.settledMembers?.includes(memberName);
        if (!isSettled) {
          pendingToOthers += perPersonShare;
        }
      }
    });

    return {
      paid: Math.round(paidUpfrontTWD),
      share: Math.round(myOwnShareTWD),
      toCollect: Math.round(waitingFromOthers), // 尚須收回
      toPay: Math.round(pendingToOthers),       // 尚須補繳
      netBalance: Math.round(paidUpfrontTWD - myOwnShareTWD) // 雖然是淨額，但 UI 會強調上面的待收/待補
    };
  };

  const handleToggleSettlement = (exp: Expense, memberName: string, amount: number) => {
    const isSettled = exp.settledMembers?.includes(memberName);
    if (!isSettled) {
        // If marking as paid, ask for confirmation
        setSettleConfirm({ exp, memberName, amount });
    } else {
        // If unmarking, just do it (usually a mistake fix)
        performToggle(exp, memberName);
    }
  };

  const performToggle = (exp: Expense, memberName: string) => {
    const currentSettled = exp.settledMembers || [];
    const updatedSettled = currentSettled.includes(memberName)
        ? currentSettled.filter(m => m !== memberName)
        : [...currentSettled, memberName];
    
    onUpdate({ ...exp, settledMembers: updatedSettled });
    setSettleConfirm(null);
    if (window.navigator.vibrate) window.navigator.vibrate(30);
  };

  const totalsByCurrency = filteredExpenses.reduce((acc, curr) => {
      acc[curr.currency] = (acc[curr.currency] || 0) + curr.amount;
      return acc;
  }, {} as Record<string, number>);

  const groupedExpenses = filteredExpenses.reduce((groups, expense) => {
      const dateKey = expense.date;
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(expense);
      return groups;
  }, {} as Record<string, Expense[]>);

  const sortedDates = Object.keys(groupedExpenses).sort((a, b) => b.localeCompare(a));

  const handleAdd = () => {
    if (!form.amount || !form.title) {
        onShowToast("請填寫金額與項目", "error");
        return;
    }
    onAdd({
        amount: Number(form.amount), title: form.title, currency: form.currency, payer: form.payer,
        involvedMembers: form.involvedMembers.length > 0 ? form.involvedMembers : members.map(m => m.name), 
        settledMembers: [form.payer], paymentMethod: form.paymentMethod, location: form.location,
        image: null, images: [], date: form.date, time: form.time, comments: []
    });
    setForm({ ...form, amount: '', title: '' });
    onShowToast("已新增", "success");
    setMobileTab('list');
  };

  const openEdit = (exp: Expense) => {
      const formattedDate = exp.date.includes('/') ? exp.date.replace(/\//g, '-') : exp.date;
      setEditingExpense({ ...exp, date: formattedDate, settledMembers: exp.settledMembers || [exp.payer] });
      setShowEditModal(true);
      setShowDetailModal(false);
  };

  const currentMemberStats = filter !== 'all' ? getMemberStats(filter) : null;

  return (
    <div className="w-full mx-auto lg:p-0 pb-48 lg:pb-0 animate-scale-in" ref={listContainerRef}>
       {/* Tab Switcher (Mobile) */}
       <div className="lg:hidden sticky top-0 z-30 bg-beige/95 backdrop-blur-md px-4 py-3 border-b border-beige-dark/50 mb-5">
            <div className="bg-white p-1 rounded-full flex text-sm font-bold text-gray-400 border-2 border-beige-dark shadow-sm w-full">
                <button onClick={() => setMobileTab('input')} className={`flex-1 py-2.5 rounded-full transition-all flex items-center justify-center gap-1.5 ${mobileTab === 'input' ? 'bg-sage text-white shadow-md' : 'text-gray-400'}`}><PenTool size={16} /> 記帳</button>
                <button onClick={() => setMobileTab('list')} className={`flex-1 py-2.5 rounded-full transition-all flex items-center justify-center gap-1.5 ${mobileTab === 'list' ? 'bg-sage text-white shadow-md' : 'text-gray-400'}`}><List size={16} /> 明細</button>
            </div>
       </div>

       <div className="px-4 lg:p-0 lg:grid lg:grid-cols-12 lg:gap-8">
         {/* Input Column */}
         <div className="lg:col-span-5 lg:sticky lg:top-8 flex flex-col gap-6 lg:flex-col-reverse">
            {mobileTab === 'input' && (
                <div className="bg-white p-5 rounded-[2rem] shadow-hard-sm border-2 border-beige-dark mb-10 lg:mb-0">
                    <h3 className="font-black text-cocoa mb-4 flex items-center gap-2 text-lg"><Wallet className="text-sage" size={24}/> 記帳輸入</h3>
                    <div className="space-y-3">
                        <div className="bg-white p-3 rounded-xl border-2 border-beige-dark shadow-sm">
                            <label className="text-[10px] text-gray-400 block mb-1 font-bold">日期與時間</label>
                            <input type="datetime-local" value={`${form.date}T${form.time}`} onChange={e => { const [d, t] = e.target.value.split('T'); setForm({...form, date: d, time: t}); }} className="w-full bg-transparent text-cocoa outline-none font-bold text-sm" style={{ colorScheme: 'light' }} />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="bg-white p-3 rounded-xl border-2 border-beige-dark shadow-sm"><label className="text-[10px] text-gray-400 block mb-1 font-bold">金額</label><input type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="w-full bg-transparent text-cocoa outline-none font-black text-xl" placeholder="0" /></div>
                            <div className="bg-white p-3 rounded-xl border-2 border-beige-dark shadow-sm"><label className="text-[10px] text-gray-400 block mb-1 font-bold">幣別</label><select value={form.currency} onChange={e => setForm({...form, currency: e.target.value})} className="w-full bg-transparent text-cocoa outline-none font-bold text-sm">{currencies.map(c => (<option key={c.code} value={c.code}>{c.code}</option>))}<option value="TWD">TWD</option></select></div>
                        </div>
                        <div className="bg-white p-3 rounded-xl border-2 border-beige-dark shadow-sm">
                            <label className="text-[10px] text-gray-400 block mb-1 font-bold">項目名稱</label>
                            <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full bg-transparent text-cocoa outline-none font-bold" placeholder="例如：午餐"/>
                        </div>
                        <div>
                            <label className="text-[10px] text-gray-400 block mb-2 font-bold ml-1">付款人</label>
                            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">{members.map(m => (<button key={m.id} onClick={() => setForm({...form, payer: m.name})} className={`px-4 py-2 rounded-full text-xs border-2 whitespace-nowrap font-bold transition-all ${form.payer === m.name ? 'bg-sage text-white border-sage shadow-md' : 'bg-white text-gray-400 border-beige-dark'}`}>{m.name}</button>))}</div>
                        </div>
                    </div>
                    <button onClick={handleAdd} className="w-full mt-6 bg-sage text-white py-4 rounded-2xl font-black shadow-hard-sage border-2 border-sage-dark flex items-center justify-center gap-2 text-lg active:translate-y-1 active:shadow-none transition-all"><Check size={24}/> 確認記帳</button>
                </div>
            )}
            
            {/* Summary Card */}
            {mobileTab === 'list' && (
                <div className="bg-sage text-white p-6 rounded-[2rem] shadow-hard-sm relative overflow-hidden border-2 border-sage-dark mb-6">
                    <div className="absolute -right-6 -top-6 w-32 h-32 bg-white rounded-full opacity-10 blur-2xl"></div>
                    <p className="opacity-80 text-xs mb-1 font-bold">{filter === 'all' ? '行程總支出' : filter + ' 的相關支出'} (TWD)</p>
                    <h2 className="text-4xl font-black tracking-tight truncate font-mono">NT$ {totalTWD.toLocaleString()}</h2>
                    <div className="mt-4 flex gap-4 text-xs font-bold bg-white/20 p-2 rounded-xl inline-flex backdrop-blur-sm">
                        {Object.entries(totalsByCurrency).map(([curr, amount]) => amount > 0 && curr !== 'TWD' && (
                            <div key={curr}><p className="opacity-70 text-[10px]">{curr}</p><p className="font-mono">{amount.toLocaleString()}</p></div>
                        ))}
                    </div>
                </div>
            )}
         </div>

         {/* List Column */}
         <div className={`${mobileTab === 'list' ? 'block' : 'hidden'} lg:block lg:col-span-7 lg:mt-0 pb-32`}>
            {/* Member Filter */}
            <div className="mb-4 overflow-x-auto no-scrollbar py-2 flex gap-2.5 items-center">
                <button onClick={() => setFilter('all')} className={`flex-shrink-0 px-5 py-2.5 rounded-full border-2 font-black text-sm transition-all ${filter === 'all' ? 'bg-cocoa text-white border-cocoa shadow-md' : 'bg-white text-gray-400 border-beige-dark'}`}>全部</button>
                {members.map(m => (
                    <button key={m.id} onClick={() => setFilter(m.name)} className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all ${filter === m.name ? 'bg-sage text-white border-sage shadow-md scale-105' : 'bg-white text-gray-400 border-beige-dark'}`}>
                        <div className="w-6 h-6 rounded-full overflow-hidden border border-white/50 flex items-center justify-center bg-beige text-[10px] font-black text-cocoa">{m.avatar ? <img src={m.avatar} className="w-full h-full object-cover" /> : m.name[0]}</div>
                        <span className="text-sm font-bold">{m.name}</span>
                    </button>
                ))}
            </div>

            {/* Intuitive Member Stats Card */}
            {currentMemberStats && (
                <div className="mb-8 bg-white p-6 rounded-[2.5rem] border-2 border-sage shadow-hard-sm animate-scale-in relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5"><HelpCircle size={80}/></div>
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <span className="text-3xl bg-beige p-2 rounded-2xl">{members.find(m => m.name === filter)?.fruit}</span>
                            <div>
                                <h4 className="font-black text-cocoa text-xl">{filter} 的收支統計</h4>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Personal Balance Report</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-gray-50 p-4 rounded-3xl border border-beige-dark">
                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><ArrowUpRight size={12} className="text-blue-500"/> 代墊總額</div>
                            <div className="text-xl font-black text-cocoa font-mono">NT$ {currentMemberStats.paid.toLocaleString()}</div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-3xl border border-beige-dark">
                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><ArrowDownLeft size={12} className="text-orange-400"/> 個人應付</div>
                            <div className="text-xl font-black text-cocoa font-mono">NT$ {currentMemberStats.share.toLocaleString()}</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className={`p-4 rounded-3xl border-2 transition-all ${currentMemberStats.toCollect > 0 ? 'bg-blue-50 border-blue-200 ring-4 ring-blue-50' : 'bg-gray-50 border-beige-dark opacity-50'}`}>
                            <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1 flex items-center gap-1.5"><Coins size={12}/> 尚須收回 (待收款)</div>
                            <div className={`text-2xl font-black font-mono ${currentMemberStats.toCollect > 0 ? 'text-blue-600' : 'text-gray-400'}`}>NT$ {currentMemberStats.toCollect.toLocaleString()}</div>
                            <p className="text-[9px] font-bold text-blue-400 mt-1">他人尚未繳費給您的總額</p>
                        </div>
                        <div className={`p-4 rounded-3xl border-2 transition-all ${currentMemberStats.toPay > 0 ? 'bg-red-50 border-red-200 ring-4 ring-red-50' : 'bg-gray-50 border-beige-dark opacity-50'}`}>
                            <div className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1 flex items-center gap-1.5"><Scale size={12}/> 尚須補繳 (欠款)</div>
                            <div className={`text-2xl font-black font-mono ${currentMemberStats.toPay > 0 ? 'text-red-600' : 'text-gray-400'}`}>NT$ {currentMemberStats.toPay.toLocaleString()}</div>
                            <p className="text-[9px] font-bold text-red-400 mt-1">您尚未繳費給他人的總額</p>
                        </div>
                    </div>
                </div>
            )}

            {/* List */}
            <div className="space-y-6">
                {sortedDates.map(date => (
                    <div key={date}>
                        <div className="sticky top-0 z-10 bg-beige/95 backdrop-blur-sm py-2 mb-3 flex items-center justify-between border-b border-beige-dark border-dashed">
                            <span className="bg-white text-cocoa px-4 py-1 rounded-full text-xs font-black shadow-sm border border-beige-dark">{date}</span>
                            <span className="text-xs font-bold text-gray-400">當日小計: <span className="text-cocoa font-mono">NT$ {groupedExpenses[date].reduce((a,c) => a+calculateTWD(c.amount, c.currency),0).toLocaleString()}</span></span>
                        </div>
                        <div className="space-y-4">
                            {groupedExpenses[date].map(exp => {
                                const isPayer = filter !== 'all' && exp.payer === filter;
                                const splitAmountTWD = calculateTWD(exp.amount, exp.currency) / (exp.involvedMembers?.length || 1);

                                return (
                                    <div key={exp.id} id={`expense-${exp.id}`} onClick={() => openEdit(exp)} className={`bg-white p-5 rounded-[2rem] shadow-hard-sm border-2 transition-all cursor-pointer hover:border-sage ${exp.id.toString() === highlightId ? 'ring-4 ring-sage border-sage' : 'border-beige-dark'}`}>
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="w-14 h-14 rounded-full bg-beige border-2 border-beige-dark flex-shrink-0 flex items-center justify-center text-2xl relative overflow-hidden shadow-inner">
                                                {members.find(m => m.name === exp.payer)?.avatar ? <img src={members.find(m => m.name === exp.payer)?.avatar || ''} className="w-full h-full object-cover" /> : <span>{exp.payer[0]}</span>}
                                                {isPayer && <div className="absolute bottom-0 w-full bg-sage/90 text-white text-[8px] font-black py-0.5 text-center">付款人</div>}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-black text-cocoa text-lg break-words leading-tight mb-1">{exp.title}</h4>
                                                <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                                                    <span className={`px-2 py-0.5 rounded border ${isPayer ? 'bg-sage text-white border-sage' : 'bg-beige border-beige-dark text-cocoa'}`}>{exp.payer}</span>
                                                    <span className="flex items-center gap-1"><Clock size={12}/>{exp.time}</span>
                                                </div>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <div className="font-black text-cocoa font-mono text-xl">{exp.currency} {exp.amount.toLocaleString()}</div>
                                                <div className="text-[10px] font-bold text-gray-400">≈ NT$ {calculateTWD(exp.amount, exp.currency).toLocaleString()}</div>
                                            </div>
                                        </div>

                                        {/* Settlement UI */}
                                        <div className="pt-4 border-t-2 border-dashed border-gray-100">
                                            <div className="flex justify-between items-center mb-3">
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">分攤成員及繳費狀態</span>
                                                <span className="text-[10px] font-bold text-sage bg-sage-light px-2 py-0.5 rounded">每人 NT$ {Math.round(splitAmountTWD).toLocaleString()}</span>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {exp.involvedMembers?.map(mName => {
                                                    const mData = members.find(m => m.name === mName);
                                                    const isSettled = exp.payer === mName || (exp.settledMembers || []).includes(mName);
                                                    const canToggle = exp.payer !== mName;

                                                    return (
                                                        <button 
                                                            key={mName} 
                                                            onClick={(e) => { e.stopPropagation(); if(canToggle) handleToggleSettlement(exp, mName, Math.round(splitAmountTWD)); }} 
                                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 transition-all active:scale-95 ${isSettled ? 'bg-sage-light/50 border-sage/30 text-sage' : 'bg-orange-50 border-orange-100 text-orange-400 shadow-sm'}`}
                                                        >
                                                            <div className="w-5 h-5 rounded-full overflow-hidden border border-white flex items-center justify-center bg-white shadow-sm">
                                                                {mData?.avatar ? <img src={mData.avatar} className="w-full h-full object-cover"/> : <span className="text-[8px] font-black">{mName[0]}</span>}
                                                            </div>
                                                            <span className="text-xs font-black">{mName}</span>
                                                            {isSettled ? <CheckCircle2 size={14} strokeWidth={3}/> : <Circle size={14} strokeWidth={2} className="opacity-30"/>}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
         </div>
       </div>

       {/* Settle Confirmation Dialog */}
       {settleConfirm && (
           <div className="fixed inset-0 bg-cocoa/60 z-[1000] flex items-center justify-center px-6 backdrop-blur-md">
               <div className="bg-white w-full max-w-xs rounded-[2.5rem] p-8 shadow-2xl border-4 border-sage-dark text-center animate-scale-in">
                   <div className="w-20 h-20 bg-sage-light rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-white shadow-md text-sage animate-bounce">
                       <CheckCircle2 size={40} />
                   </div>
                   <h3 className="text-xl font-black text-cocoa mb-2">確認收款？</h3>
                   <p className="text-sm font-bold text-gray-400 mb-6 leading-relaxed">
                       您確定 <span className="text-sage-dark font-black">[{settleConfirm.memberName}]</span><br/>已經將 <span className="text-cocoa font-black">NT$ {settleConfirm.amount.toLocaleString()}</span><br/>繳清給代墊人嗎？
                   </p>
                   <div className="flex gap-3">
                       <button onClick={() => setSettleConfirm(null)} className="flex-1 py-3.5 rounded-2xl bg-gray-100 text-gray-400 font-black border-2 border-gray-200">取消</button>
                       <button onClick={() => performToggle(settleConfirm.exp, settleConfirm.memberName)} className="flex-1 py-3.5 rounded-2xl bg-sage text-white font-black shadow-hard-sage border-2 border-sage-dark">確定繳清</button>
                   </div>
               </div>
           </div>
       )}

       {/* Simple Edit Modal Fallback */}
       {showEditModal && editingExpense && (
           <div className="fixed inset-0 bg-cocoa/50 z-[150] flex items-center justify-center px-4 backdrop-blur-sm" onClick={() => setShowEditModal(false)}>
               <div className="bg-beige w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl border-4 border-beige-dark relative animate-scale-in" onClick={e => e.stopPropagation()}>
                   <div className="flex justify-between items-center mb-6">
                       <h3 className="text-xl font-black text-cocoa">編輯明細</h3>
                       <button onClick={() => setShowEditModal(false)} className="p-2 bg-white rounded-full border border-beige-dark text-gray-400"><X size={16}/></button>
                   </div>
                   <div className="space-y-4">
                       <div className="bg-white p-3 rounded-2xl border-2 border-beige-dark"><label className="text-[10px] text-gray-400 block mb-1 font-bold">項目名稱</label><input value={editingExpense.title} onChange={e => setEditingExpense({...editingExpense, title: e.target.value})} className="w-full bg-transparent font-black text-cocoa outline-none" /></div>
                       <div className="grid grid-cols-2 gap-2">
                           <div className="bg-white p-3 rounded-2xl border-2 border-beige-dark"><label className="text-[10px] text-gray-400 block mb-1 font-bold">金額</label><input type="number" value={editingExpense.amount} onChange={e => setEditingExpense({...editingExpense, amount: Number(e.target.value)})} className="w-full bg-transparent font-black text-cocoa outline-none" /></div>
                           <div className="bg-white p-3 rounded-2xl border-2 border-beige-dark"><label className="text-[10px] text-gray-400 block mb-1 font-bold">付款人</label><select value={editingExpense.payer} onChange={e => setEditingExpense({...editingExpense, payer: e.target.value})} className="w-full bg-transparent font-black text-cocoa outline-none">{members.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}</select></div>
                       </div>
                   </div>
                   <div className="flex gap-3 mt-8">
                       <button onClick={() => { if(window.confirm('確定刪除？')){onDelete(editingExpense.id); setShowEditModal(false); onShowToast('已刪除','success');}}} className="p-4 rounded-2xl bg-red-50 text-red-400 font-black border-2 border-red-100"><Trash2 size={20}/></button>
                       <button onClick={() => {onUpdate(editingExpense); setShowEditModal(false); onShowToast('更新成功','success');}} className="flex-1 py-4 rounded-2xl bg-sage text-white font-black shadow-hard-sage border-2 border-sage-dark">儲存變更</button>
                   </div>
               </div>
           </div>
       )}
    </div>
  );
};
