
import React, { useState, useEffect, useRef } from 'react';
import { 
  PenTool, List, Wallet, Coins, User, MapPin, Trash2, 
  Receipt, CreditCard, Clock, Check, ArrowLeft, Send, MessageCircle, X,
  ArrowUpRight, ArrowDownLeft, Scale, CheckCircle2, Circle, AlertCircle, HelpCircle,
  Percent
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
      paymentMethod: '現金', location: '', 
      isCreditCard: false, serviceFeePercentage: '1.5',
      date: new Date().toISOString().split('T')[0], time: new Date().toTimeString().slice(0, 5)
  });
  
  const [mobileTab, setMobileTab] = useState<'input' | 'list'>(highlightId ? 'list' : 'input');
  const [filter, setFilter] = useState('all');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
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

  const calculateTotalWithFee = (amount: number, isCard: boolean, feePct: number) => {
      if (!isCard) return amount;
      return amount + (amount * (feePct / 100));
  };

  const calculateTWD = (amount: number, currency: string, isCard: boolean = false, feePct: number = 0) => {
      const totalAmount = calculateTotalWithFee(amount, isCard, feePct);
      if (currency === 'TWD') return totalAmount;
      const rateObj = currencies.find(c => c.code === currency);
      const rate = rateObj ? rateObj.rate : 1;
      return Math.round(totalAmount * rate);
  };

  const filteredExpenses = filter === 'all' 
    ? expenses 
    : expenses.filter(e => e.payer === filter || e.involvedMembers?.includes(filter));

  const totalTWD = filteredExpenses.reduce((acc, curr) => 
    acc + calculateTWD(curr.amount, curr.currency, curr.isCreditCard, curr.serviceFeePercentage), 0);
  
  const getMemberStats = (memberName: string) => {
    let paidUpfrontTWD = 0;
    let myOwnShareTWD = 0;
    let waitingFromOthers = 0;
    let pendingToOthers = 0;

    expenses.forEach(exp => {
      const expTWD = calculateTWD(exp.amount, exp.currency, exp.isCreditCard, exp.serviceFeePercentage);
      const involved = exp.involvedMembers || [];
      const splitCount = involved.length || 1;
      const perPersonShare = expTWD / splitCount;

      if (exp.payer === memberName) {
        paidUpfrontTWD += expTWD;
        involved.forEach(m => {
          if (m === memberName) {
            myOwnShareTWD += perPersonShare;
          } else {
            const isSettled = exp.settledMembers?.includes(m);
            if (!isSettled) waitingFromOthers += perPersonShare;
          }
        });
      } else if (involved.includes(memberName)) {
        myOwnShareTWD += perPersonShare;
        const isSettled = exp.settledMembers?.includes(memberName);
        if (!isSettled) pendingToOthers += perPersonShare;
      }
    });

    return {
      paid: Math.round(paidUpfrontTWD),
      share: Math.round(myOwnShareTWD),
      toCollect: Math.round(waitingFromOthers),
      toPay: Math.round(pendingToOthers)
    };
  };

  const handleToggleSettlement = (exp: Expense, memberName: string, amount: number) => {
    const isSettled = exp.settledMembers?.includes(memberName);
    if (!isSettled) setSettleConfirm({ exp, memberName, amount });
    else performToggle(exp, memberName);
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

  const handleAdd = () => {
    if (!form.amount || !form.title) {
        onShowToast("請填寫金額與項目", "error");
        return;
    }
    onAdd({
        amount: Number(form.amount), title: form.title, currency: form.currency, payer: form.payer,
        involvedMembers: form.involvedMembers.length > 0 ? form.involvedMembers : members.map(m => m.name), 
        settledMembers: [form.payer], 
        paymentMethod: form.isCreditCard ? '信用卡' : '現金', 
        isCreditCard: form.isCreditCard,
        serviceFeePercentage: form.isCreditCard ? Number(form.serviceFeePercentage) : 0,
        location: form.location,
        image: null, images: [], date: form.date, time: form.time, comments: []
    });
    setForm({ ...form, amount: '', title: '' });
    onShowToast("已新增", "success");
    setMobileTab('list');
  };

  const currentMemberStats = filter !== 'all' ? getMemberStats(filter) : null;

  // Fix: Calculate groupedExpenses and sortedDates from filteredExpenses
  const groupedExpenses = filteredExpenses.reduce((acc, exp) => {
    const date = exp.date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(exp);
    return acc;
  }, {} as Record<string, Expense[]>);

  const sortedDates = Object.keys(groupedExpenses).sort((a, b) => b.localeCompare(a));

  return (
    <div className="w-full mx-auto lg:p-0 pb-48 lg:pb-0 animate-scale-in" ref={listContainerRef}>
       <div className="lg:hidden sticky top-0 z-30 bg-beige/95 backdrop-blur-md px-4 py-3 border-b border-beige-dark/50 mb-5">
            <div className="bg-white p-1 rounded-full flex text-sm font-bold text-gray-400 border-2 border-beige-dark shadow-sm w-full">
                <button onClick={() => setMobileTab('input')} className={`flex-1 py-2.5 rounded-full transition-all flex items-center justify-center gap-1.5 ${mobileTab === 'input' ? 'bg-sage text-white shadow-md' : 'text-gray-400'}`}><PenTool size={16} /> 記帳</button>
                <button onClick={() => setMobileTab('list')} className={`flex-1 py-2.5 rounded-full transition-all flex items-center justify-center gap-1.5 ${mobileTab === 'list' ? 'bg-sage text-white shadow-md' : 'text-gray-400'}`}><List size={16} /> 明細</button>
            </div>
       </div>

       <div className="px-4 lg:p-0 lg:grid lg:grid-cols-12 lg:gap-8">
         <div className="lg:col-span-5 lg:sticky lg:top-8 flex flex-col gap-6 lg:flex-col-reverse">
            {mobileTab === 'input' && (
                <div className="bg-white p-5 rounded-[2rem] shadow-hard-sm border-2 border-beige-dark mb-10 lg:mb-0">
                    <h3 className="font-black text-cocoa mb-4 flex items-center gap-2 text-lg"><Wallet className="text-sage" size={24}/> 記帳輸入</h3>
                    <div className="space-y-3">
                        <div className="bg-white p-3 rounded-xl border-2 border-beige-dark shadow-sm">
                            <label className="text-[10px] text-gray-400 block mb-1 font-bold">日期與時間</label>
                            <input type="datetime-local" value={`${form.date}T${form.time}`} onChange={e => { const [d, t] = e.target.value.split('T'); setForm({...form, date: d, time: t}); }} className="w-full bg-transparent text-cocoa outline-none font-bold text-sm" style={{ colorScheme: 'light' }} />
                        </div>
                        
                        <div className="flex bg-beige/30 p-1 rounded-2xl border-2 border-beige-dark mb-1">
                            <button onClick={() => setForm({...form, isCreditCard: false})} className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 ${!form.isCreditCard ? 'bg-white text-orange-400 shadow-sm border border-beige-dark' : 'text-gray-400'}`}><Coins size={14}/> 現金支付</button>
                            <button onClick={() => setForm({...form, isCreditCard: true})} className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 ${form.isCreditCard ? 'bg-white text-blue-500 shadow-sm border border-beige-dark' : 'text-gray-400'}`}><CreditCard size={14}/> 信用卡</button>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            <div className="col-span-2 bg-white p-3 rounded-xl border-2 border-beige-dark shadow-sm">
                                <label className="text-[10px] text-gray-400 block mb-1 font-bold">金額</label>
                                <input type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="w-full bg-transparent text-cocoa outline-none font-black text-xl" placeholder="0" />
                            </div>
                            <div className="bg-white p-3 rounded-xl border-2 border-beige-dark shadow-sm">
                                <label className="text-[10px] text-gray-400 block mb-1 font-bold">幣別</label>
                                <select value={form.currency} onChange={e => setForm({...form, currency: e.target.value})} className="w-full bg-transparent text-cocoa outline-none font-bold text-sm">
                                    <option value="TWD">TWD</option>
                                    {currencies.map(c => (<option key={c.code} value={c.code}>{c.code}</option>))}
                                </select>
                            </div>
                        </div>

                        {form.isCreditCard && (
                            <div className="bg-blue-50 p-3 rounded-xl border-2 border-blue-100 flex justify-between items-center animate-scale-in">
                                <div className="flex items-center gap-2">
                                    <Percent size={14} className="text-blue-500"/>
                                    <span className="text-xs font-bold text-blue-600">海外/刷卡手續費</span>
                                </div>
                                <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-blue-200">
                                    <input type="number" value={form.serviceFeePercentage} onChange={e => setForm({...form, serviceFeePercentage: e.target.value})} className="w-10 text-center text-sm font-black text-cocoa outline-none bg-transparent" />
                                    <span className="text-xs font-bold text-gray-400">%</span>
                                </div>
                            </div>
                        )}

                        <div className="bg-white p-3 rounded-xl border-2 border-beige-dark shadow-sm">
                            <label className="text-[10px] text-gray-400 block mb-1 font-bold">項目名稱</label>
                            <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full bg-transparent text-cocoa outline-none font-bold" placeholder="例如：藥妝店購物"/>
                        </div>

                        <div className="bg-gray-50 p-3 rounded-xl border border-dashed border-beige-dark flex justify-between items-center">
                            <span className="text-xs font-bold text-gray-400">概算總額 (含手續費)</span>
                            <span className="text-sm font-black text-sage">TWD {calculateTWD(Number(form.amount)||0, form.currency, form.isCreditCard, Number(form.serviceFeePercentage)||0).toLocaleString()}</span>
                        </div>

                        <div>
                            <label className="text-[10px] text-gray-400 block mb-2 font-bold ml-1">付款人</label>
                            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">{members.map(m => (<button key={m.id} onClick={() => setForm({...form, payer: m.name})} className={`px-4 py-2 rounded-full text-xs border-2 whitespace-nowrap font-bold transition-all ${form.payer === m.name ? 'bg-sage text-white border-sage shadow-md' : 'bg-white text-gray-400 border-beige-dark'}`}>{m.name}</button>))}</div>
                        </div>
                    </div>
                    <button onClick={handleAdd} className="w-full mt-6 bg-sage text-white py-4 rounded-2xl font-black shadow-hard-sage border-2 border-sage-dark flex items-center justify-center gap-2 text-lg active:translate-y-1 active:shadow-none transition-all"><Check size={24}/> 確認記帳</button>
                </div>
            )}
            
            {mobileTab === 'list' && (
                <div className="bg-sage text-white p-6 rounded-[2rem] shadow-hard-sm relative overflow-hidden border-2 border-sage-dark mb-6">
                    <div className="absolute -right-6 -top-6 w-32 h-32 bg-white rounded-full opacity-10 blur-2xl"></div>
                    <p className="opacity-80 text-xs mb-1 font-bold">{filter === 'all' ? '記帳總支出' : filter + ' 的記帳相關'} (TWD)</p>
                    <h2 className="text-4xl font-black tracking-tight truncate font-mono">NT$ {totalTWD.toLocaleString()}</h2>
                </div>
            )}
         </div>

         <div className={`${mobileTab === 'list' ? 'block' : 'hidden'} lg:block lg:col-span-7 lg:mt-0 pb-32`}>
            <div className="mb-4 overflow-x-auto no-scrollbar py-2 flex gap-2.5 items-center">
                <button onClick={() => setFilter('all')} className={`flex-shrink-0 px-5 py-2.5 rounded-full border-2 font-black text-sm transition-all ${filter === 'all' ? 'bg-cocoa text-white border-cocoa shadow-md' : 'bg-white text-gray-400 border-beige-dark'}`}>全部</button>
                {members.map(m => (
                    <button key={m.id} onClick={() => setFilter(m.name)} className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all ${filter === m.name ? 'bg-sage text-white border-sage shadow-md scale-105' : 'bg-white text-gray-400 border-beige-dark'}`}>
                        <div className="w-6 h-6 rounded-full overflow-hidden border border-white/50 flex items-center justify-center bg-beige text-[10px] font-black text-cocoa">{m.avatar ? <img src={m.avatar} className="w-full h-full object-cover" /> : m.name[0]}</div>
                        <span className="text-sm font-bold">{m.name}</span>
                    </button>
                ))}
            </div>

            {currentMemberStats && (
                <div className="mb-8 bg-white p-6 rounded-[2.5rem] border-2 border-sage shadow-hard-sm animate-scale-in relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5"><HelpCircle size={80}/></div>
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <span className="text-3xl bg-beige p-2 rounded-2xl">{members.find(m => m.name === filter)?.fruit}</span>
                            <div>
                                <h4 className="font-black text-cocoa text-xl">{filter} 的記帳結報</h4>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest italic">※ 此統計不包含行程預計花費</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className={`p-4 rounded-3xl border-2 transition-all ${currentMemberStats.toCollect > 0 ? 'bg-blue-50 border-blue-200 ring-4 ring-blue-50' : 'bg-gray-50 border-beige-dark opacity-50'}`}>
                            <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1 flex items-center gap-1.5"><Coins size={12}/> 尚須收回 (待收)</div>
                            <div className={`text-2xl font-black font-mono ${currentMemberStats.toCollect > 0 ? 'text-blue-600' : 'text-gray-400'}`}>NT$ {currentMemberStats.toCollect.toLocaleString()}</div>
                        </div>
                        <div className={`p-4 rounded-3xl border-2 transition-all ${currentMemberStats.toPay > 0 ? 'bg-red-50 border-red-200 ring-4 ring-red-50' : 'bg-gray-50 border-beige-dark opacity-50'}`}>
                            <div className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1 flex items-center gap-1.5"><Scale size={12}/> 尚須補繳 (欠款)</div>
                            <div className={`text-2xl font-black font-mono ${currentMemberStats.toPay > 0 ? 'text-red-600' : 'text-gray-400'}`}>NT$ {currentMemberStats.toPay.toLocaleString()}</div>
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-6">
                {sortedDates.map(date => (
                    <div key={date}>
                        <div className="sticky top-0 z-10 bg-beige/95 backdrop-blur-sm py-2 mb-3 border-b border-beige-dark border-dashed flex justify-between items-center">
                            <span className="bg-white text-cocoa px-4 py-1 rounded-full text-xs font-black shadow-sm border border-beige-dark">{date}</span>
                        </div>
                        <div className="space-y-4">
                            {groupedExpenses[date].map(exp => {
                                const isPayer = filter !== 'all' && exp.payer === filter;
                                const finalAmountTWD = calculateTWD(exp.amount, exp.currency, exp.isCreditCard, exp.serviceFeePercentage);
                                const splitAmountTWD = finalAmountTWD / (exp.involvedMembers?.length || 1);

                                return (
                                    <div key={exp.id} id={`expense-${exp.id}`} className={`bg-white p-5 rounded-[2rem] shadow-hard-sm border-2 transition-all border-beige-dark`}>
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="w-14 h-14 rounded-full bg-beige border-2 border-beige-dark flex-shrink-0 flex items-center justify-center text-2xl relative overflow-hidden shadow-inner">
                                                {members.find(m => m.name === exp.payer)?.avatar ? <img src={members.find(m => m.name === exp.payer)?.avatar || ''} className="w-full h-full object-cover" /> : <span>{exp.payer[0]}</span>}
                                                {isPayer && <div className="absolute bottom-0 w-full bg-sage/90 text-white text-[8px] font-black py-0.5 text-center">付款人</div>}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-black text-cocoa text-lg break-words leading-tight mb-1">{exp.title}</h4>
                                                <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                                                    <span className={`px-2 py-0.5 rounded border ${exp.isCreditCard ? 'bg-blue-50 text-blue-500 border-blue-100' : 'bg-orange-50 text-orange-500 border-orange-100'}`}>{exp.isCreditCard ? '信用卡' : '現金'}</span>
                                                    <span className="flex items-center gap-1"><Clock size={12}/>{exp.time}</span>
                                                </div>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <div className="font-black text-cocoa font-mono text-xl">{exp.currency} {exp.amount.toLocaleString()}</div>
                                                <div className="text-[10px] font-bold text-gray-400">≈ NT$ {finalAmountTWD.toLocaleString()}</div>
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t-2 border-dashed border-gray-100">
                                            <div className="flex justify-between items-center mb-3">
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">分攤成員及繳費狀態</span>
                                                <span className="text-[10px] font-bold text-sage bg-sage-light px-2 py-0.5 rounded">每人 NT$ {Math.round(splitAmountTWD).toLocaleString()}</span>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {exp.involvedMembers?.map(mName => {
                                                    const isSettled = exp.payer === mName || (exp.settledMembers || []).includes(mName);
                                                    return (
                                                        <button 
                                                            key={mName} 
                                                            onClick={(e) => { e.stopPropagation(); if(exp.payer !== mName) handleToggleSettlement(exp, mName, Math.round(splitAmountTWD)); }} 
                                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 transition-all active:scale-95 ${isSettled ? 'bg-sage-light/50 border-sage/30 text-sage' : 'bg-orange-50 border-orange-100 text-orange-400 shadow-sm'}`}
                                                        >
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
    </div>
  );
};
