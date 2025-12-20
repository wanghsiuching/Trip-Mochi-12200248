
import React, { useState } from 'react';
import { 
  PenTool, List, Wallet, Coins, User, MapPin, Trash2, 
  Receipt, CreditCard, Clock, Check, ArrowLeft
} from 'lucide-react';
import { Expense, Member, Currency } from '../types';

interface ExpensesViewProps {
  expenses: Expense[];
  members: Member[];
  currencies: Currency[];
  onAdd: (expense: Omit<Expense, 'id'>) => void;
  onUpdate: (expense: Expense) => void;
  onDelete: (id: number) => void;
  onShowToast: (message: string, type: 'success' | 'error') => void;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({ expenses, members, currencies, onAdd, onUpdate, onDelete, onShowToast }) => {
  const [form, setForm] = useState({ 
      amount: '', 
      title: '', 
      currency: 'TWD', 
      payer: members[0]?.name || '我', 
      involvedMembers: [] as string[],
      paymentMethod: '現金', 
      location: '', 
      image: null as string | null,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      images: [] as string[]
  });
  
  const [mobileTab, setMobileTab] = useState<'input' | 'list'>('input');
  const [filter, setFilter] = useState('all');
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  
  const paymentMethods = ['現金', '信用卡'];

  const filteredExpenses = filter === 'all' ? expenses : expenses.filter(e => e.payer === filter || e.involvedMembers?.includes(filter));

  const calculateTWD = (amount: number, currency: string) => {
      if (currency === 'TWD') return amount;
      const rateObj = currencies.find(c => c.code === currency);
      const rate = rateObj ? rateObj.rate : 1;
      return Math.round(amount * rate);
  };

  const totalTWD = filteredExpenses.reduce((acc, curr) => acc + calculateTWD(curr.amount, curr.currency), 0);
  
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

  const toggleInvolvedMember = (name: string) => {
      setForm(prev => {
          const current = prev.involvedMembers;
          return {
              ...prev,
              involvedMembers: current.includes(name) 
                  ? current.filter(n => n !== name) 
                  : [...current, name]
          };
      });
  };

  const handleAdd = () => {
    if (!form.amount || !form.title) {
        onShowToast("請填寫金額與項目", "error");
        return;
    }
    
    onAdd({
        amount: Number(form.amount),
        title: form.title,
        currency: form.currency,
        payer: form.payer,
        involvedMembers: form.involvedMembers.length > 0 ? form.involvedMembers : members.map(m => m.name), 
        paymentMethod: form.paymentMethod,
        location: form.location,
        image: null,
        images: [],
        date: form.date,
        time: form.time
    });

    handleClear();
    onShowToast("已新增", "success");
  };

  const handleClear = () => {
      setForm({ 
        amount: '', 
        title: '', 
        currency: 'TWD', 
        payer: members[0]?.name || '我', 
        involvedMembers: [],
        paymentMethod: '現金',
        location: '', 
        image: null, 
        images: [],
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5)
    });
  };

  const handleBack = () => {
      handleClear();
      setMobileTab('list');
  };

  const openDetail = (exp: Expense) => {
      setSelectedExpense({ ...exp });
      setShowDetailModal(true);
  };

  const openEdit = (exp: Expense) => {
      const formattedDate = exp.date.includes('/') ? exp.date.replace(/\//g, '-') : exp.date;
      
      setEditingExpense({
          ...exp, 
          date: formattedDate, 
          involvedMembers: exp.involvedMembers || [],
          time: exp.time || '00:00'
      });
      setShowEditModal(true);
      setShowDetailModal(false);
  };

  const handleUpdate = () => {
      if(editingExpense) {
          onUpdate({ ...editingExpense });
          setShowEditModal(false);
          onShowToast("更新成功", "success");
      }
  };

  const handleDelete = () => {
      if(editingExpense && window.confirm("確定刪除？")) {
          onDelete(editingExpense.id);
          setShowEditModal(false);
          onShowToast("已刪除", "success");
      }
  };

  const toggleEditInvolvedMember = (name: string) => {
      if (!editingExpense) return;
      const current = editingExpense.involvedMembers || [];
      const updated = current.includes(name) ? current.filter(n => n !== name) : [...current, name];
      setEditingExpense({ ...editingExpense, involvedMembers: updated });
  };

  return (
    <div className="w-full mx-auto lg:p-0 pb-48 lg:pb-0 animate-scale-in">
       <div className="lg:hidden sticky top-0 z-30 bg-beige/95 backdrop-blur-md px-4 py-3 border-b border-beige-dark/50 mb-5">
            <div className="bg-white p-1 rounded-full flex text-sm font-bold text-gray-400 border-2 border-beige-dark shadow-sm w-full">
                <button 
                    onClick={() => setMobileTab('input')}
                    className={`flex-1 py-2.5 rounded-full transition-all flex items-center justify-center gap-1.5 ${mobileTab === 'input' ? 'bg-sage text-white shadow-md' : 'hover:bg-sage-light text-gray-400'}`}
                >
                    <PenTool size={16} /> 記帳
                </button>
                <button 
                    onClick={() => setMobileTab('list')}
                    className={`flex-1 py-2.5 rounded-full transition-all flex items-center justify-center gap-1.5 ${mobileTab === 'list' ? 'bg-sage text-white shadow-md' : 'hover:bg-sage-light text-gray-400'}`}
                >
                    <List size={16} /> 明細
                </button>
            </div>
       </div>

       <div className="px-4 lg:p-0 lg:grid lg:grid-cols-12 lg:gap-8">
         <div className="lg:col-span-5 lg:sticky lg:top-8 flex flex-col gap-6 lg:flex-col-reverse">
            <div className={`${mobileTab === 'input' ? 'block' : 'hidden'} lg:block bg-white p-5 rounded-[2rem] shadow-hard-sm border-2 border-beige-dark mb-10 lg:mb-0`}>
               <h3 className="font-black text-cocoa mb-4 flex items-center gap-2 text-lg"><Wallet className="text-sage" size={24}/> 記帳輸入</h3>
               <div className="mb-3 bg-white p-3 rounded-xl border-2 border-beige-dark shadow-sm">
                   <label className="text-[10px] text-gray-400 block mb-1 font-bold">日期與時間</label>
                   <input type="datetime-local" value={`${form.date}T${form.time}`} onChange={e => { const val = e.target.value; if(val) { const [d, t] = val.split('T'); setForm({...form, date: d, time: t}); } }} className="w-full bg-transparent text-cocoa outline-none font-bold text-sm" style={{ colorScheme: 'light' }} />
               </div>
               <div className="grid grid-cols-3 gap-2 mb-3">
                   <div className="col-span-3 mb-1">
                       <label className="text-[10px] text-gray-400 block mb-1 font-bold">幣別</label>
                       <select value={form.currency} onChange={(e) => setForm({...form, currency: e.target.value})} className="w-full bg-beige/50 text-cocoa rounded-xl px-3 py-2 font-bold outline-none border-2 border-beige-dark">
                           <option value="TWD">TWD (台幣)</option>
                           {currencies.map(c => (<option key={c.code} value={c.code}>{c.code} (匯率 {c.rate})</option>))}
                       </select>
                   </div>
                   <div className="col-span-2">
                       <label className="text-[10px] text-gray-400 block mb-1 font-bold">金額</label>
                       <input type="number" inputMode="decimal" min="0" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="w-full bg-beige/50 text-cocoa rounded-xl px-3 py-2 text-xl font-black outline-none focus:border-sage border-2 border-beige-dark" placeholder="0" />
                   </div>
                   <div className="col-span-1">
                       <label className="text-[10px] text-gray-400 block mb-1 font-bold">約 TWD</label>
                       <div className="w-full bg-gray-50 text-gray-400 rounded-xl px-3 py-2 text-lg font-bold border-2 border-beige-dark flex items-center justify-center h-[48px] font-mono">{Math.round(calculateTWD(Number(form.amount), form.currency))}</div>
                   </div>
               </div>
               <div className="mb-3">
                    <label className="text-[10px] text-gray-400 block mb-1 font-bold">支付方式</label>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                        {paymentMethods.map(method => (<button key={method} onClick={() => setForm({...form, paymentMethod: method})} className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-colors whitespace-nowrap ${form.paymentMethod === method ? 'bg-yellow-50 text-yellow-600 border-yellow-200' : 'bg-white text-gray-400 border-beige-dark'}`}>{method}</button>))}
                    </div>
               </div>
               <div className="mb-3">
                   <label className="text-[10px] text-gray-400 block mb-1 font-bold">項目</label>
                   <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full bg-beige/50 text-cocoa rounded-xl px-3 py-2 outline-none focus:border-sage border-2 border-beige-dark font-bold" placeholder="例如：午餐"/>
               </div>
               <div className="mb-3">
                   <label className="text-[10px] text-gray-400 block mb-1 font-bold">地點 (選填)</label>
                   <div className="relative">
                       <input type="text" value={form.location} onChange={e => setForm({...form, location: e.target.value})} className="w-full bg-beige/50 text-cocoa rounded-xl px-3 py-2 outline-none focus:border-sage border-2 border-beige-dark font-bold pl-9" placeholder="地點"/>
                       <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                   </div>
               </div>
               <div className="mb-4">
                   <label className="text-[10px] text-gray-400 block mb-2 font-bold">付款人 (Payer)</label>
                   <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar pb-1">
                       {members.map(m => (<button key={m.id} onClick={() => setForm({...form, payer: m.name})} className={`px-3 py-1.5 rounded-full text-xs border-2 whitespace-nowrap transition-all flex items-center gap-1.5 active:scale-95 ${form.payer === m.name ? 'bg-sage text-white border-sage font-black shadow-sm' : 'border-beige-dark text-gray-400 bg-white font-bold'}`}>{m.name}</button>))}
                   </div>
                   <label className="text-[10px] text-gray-400 block mb-2 font-bold">分攤成員 (Split)</label>
                   <div className="flex gap-2 flex-wrap">
                       {members.map(m => {
                           const isSelected = form.involvedMembers.includes(m.name);
                           return (<button key={m.id} onClick={() => toggleInvolvedMember(m.name)} className={`px-3 py-1.5 rounded-lg text-xs border-2 transition-all flex items-center gap-1.5 active:scale-95 ${isSelected ? 'bg-blue-500 text-white border-blue-500 font-bold' : 'bg-white text-gray-400 border-beige-dark font-bold'}`}>{isSelected && <Check size={12} strokeWidth={3}/>} {m.name}</button>);
                       })}
                   </div>
               </div>
               <div className="flex gap-3">
                   <button onClick={handleBack} className="px-4 py-3.5 rounded-2xl bg-white text-gray-400 font-black border-2 border-beige-dark hover:bg-gray-50 flex items-center justify-center gap-2"><ArrowLeft size={20}/> 返回</button>
                   <button onClick={handleAdd} className="flex-1 bg-sage text-white py-3.5 rounded-2xl font-black shadow-hard-sage active:translate-y-1 active:shadow-none transition-all hover:bg-sage-dark text-lg tracking-wide border-2 border-sage-dark flex items-center justify-center gap-2"><Check size={20}/> 確認記帳</button>
               </div>
            </div>
            <div className={`${mobileTab === 'list' ? 'block' : 'hidden'} lg:block bg-sage text-white p-6 rounded-[2rem] shadow-hard-sm relative overflow-hidden border-2 border-sage-dark`}>
               <div className="absolute -right-6 -top-6 w-32 h-32 bg-white rounded-full opacity-10 blur-2xl"></div>
               <p className="opacity-80 text-xs mb-1 font-bold">{filter === 'all' ? '總支出' : filter + ' 的支出'} (TWD)</p>
               <h2 className="text-4xl font-black tracking-tight truncate font-mono">NT$ {totalTWD.toLocaleString()}</h2>
               <div className="mt-4 flex gap-4 text-xs font-bold bg-white/20 p-2 rounded-xl inline-flex backdrop-blur-sm">
                   {Object.entries(totalsByCurrency).map(([curr, amount]) => { if (curr === 'TWD' || amount === 0) return null; return (<div key={curr}><p className="opacity-70 text-[10px]">{curr} 支出</p><p className="font-mono">{amount.toLocaleString()}</p></div>); })}
               </div>
            </div>
         </div>
         <div className={`${mobileTab === 'list' ? 'block' : 'hidden'} lg:block lg:col-span-7 lg:mt-0 pb-32`}>
            <div className="mb-4 flex flex-col">
                <div className="bg-white p-1 rounded-full flex text-xs sm:text-sm font-bold text-gray-400 border-2 border-beige-dark shadow-sm w-full mb-1">
                    <button onClick={() => setFilter('all')} className={`flex-1 py-2 rounded-full transition-all flex items-center justify-center gap-1 ${filter === 'all' ? 'bg-sage text-white shadow-md' : 'hover:bg-beige'}`}>全體</button>
                    {members.map(m => (<button key={m.id} onClick={() => setFilter(m.name)} className={`flex-1 py-2 rounded-full transition-all flex items-center justify-center gap-1 ${filter === m.name ? 'bg-sage text-white shadow-md' : 'hover:bg-beige'}`}>{m.name}</button>))}
                </div>
            </div>
            <div className="space-y-6 pb-20">
                {sortedDates.map(date => {
                    const dailyExpenses = groupedExpenses[date];
                    const dailyTotalTWD = dailyExpenses.reduce((acc, curr) => acc + calculateTWD(curr.amount, curr.currency), 0);
                    return (<div key={date}><div className="sticky top-0 z-10 bg-beige/95 backdrop-blur-sm py-2 mb-2 flex items-center justify-between border-b border-beige-dark border-dashed"><span className="bg-white text-cocoa px-3 py-1 rounded-full text-xs font-black shadow-sm border border-beige-dark">{date}</span><span className="text-xs font-bold text-gray-400">小計: <span className="text-cocoa font-mono">NT$ {dailyTotalTWD.toLocaleString()}</span></span></div><div className="space-y-3">{dailyExpenses.map(exp => (<div key={exp.id} onClick={() => openDetail(exp)} className="bg-white p-4 rounded-[1.5rem] shadow-hard-sm flex items-center gap-4 active:scale-[0.99] transition-transform cursor-pointer border-2 border-beige-dark hover:border-sage"><div className="w-12 h-12 rounded-full bg-beige flex-shrink-0 flex items-center justify-center text-xl text-gray-300 overflow-hidden border-2 border-beige-dark"><span className="text-sm font-black text-cocoa">{exp.payer[0]}</span></div><div className="flex-1 min-w-0"><div className="flex justify-between items-start mb-0.5"><h4 className="font-black text-cocoa truncate text-base">{exp.title}</h4><span className="font-black text-cocoa font-mono text-lg ml-2 whitespace-nowrap">{exp.currency} {exp.amount.toLocaleString()}</span></div><div className="flex justify-between items-center text-xs text-gray-400 font-bold"><div className="flex items-center gap-2"><span className="bg-beige px-1.5 py-0.5 rounded border border-beige-dark">{exp.payer}</span><span>{exp.paymentMethod}</span>{exp.time && <span><Clock size={10} className="inline mr-0.5"/>{exp.time}</span>}</div><span className="font-mono text-[10px] opacity-70">≈ NT$ {calculateTWD(exp.amount, exp.currency).toLocaleString()}</span></div></div></div>))}</div></div>);
                })}
                {filteredExpenses.length === 0 && (<div className="text-center py-12 bg-white rounded-[2rem] border-2 border-dashed border-beige-dark text-gray-300"><Receipt size={40} className="mx-auto mb-2" /><p className="font-bold">沒有支出紀錄</p></div>)}
            </div>
         </div>
       </div>

      {showEditModal && editingExpense && (
        <div className="fixed inset-0 bg-cocoa/50 z-[100] flex items-center justify-center px-4 backdrop-blur-sm">
            <div className="bg-beige w-full max-w-sm rounded-[2rem] p-6 shadow-2xl border-4 border-beige-dark max-h-[90vh] overflow-y-auto custom-scroll">
                <h3 className="font-black text-lg mb-4 text-center text-cocoa">編輯支出</h3>
                <div className="space-y-3">
                    <div className="bg-white p-3 rounded-xl border-2 border-beige-dark shadow-sm">
                        <label className="text-[10px] text-gray-400 block mb-1 font-bold">日期與時間</label>
                        <input type="datetime-local" value={`${editingExpense.date}T${editingExpense.time}`} onChange={e => { const val = e.target.value; if(val) { const [d, t] = val.split('T'); setEditingExpense({...editingExpense, date: d, time: t}); } }} className="w-full bg-transparent text-cocoa outline-none font-bold text-sm" style={{ colorScheme: 'light' }} />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-3 mb-1">
                             <label className="text-[10px] text-gray-400 block mb-1 font-bold">幣別</label>
                             <div className="flex gap-2 overflow-x-auto pb-1">
                                {currencies.map(curr => (<button key={curr.code} onClick={() => setEditingExpense({...editingExpense, currency: curr.code})} className={`flex-1 py-2 px-3 rounded-xl text-xs font-black border-2 whitespace-nowrap ${editingExpense.currency === curr.code ? 'bg-sage text-white border-sage' : 'bg-white text-gray-400 border-beige-dark'}`}>{curr.code}</button>))}
                            </div>
                        </div>
                        <div className="col-span-2">
                            <label className="text-[10px] text-gray-400 block mb-1 font-bold">金額</label>
                            <input type="number" inputMode="decimal" min="0" value={editingExpense.amount} onChange={e => setEditingExpense({...editingExpense, amount: Number(e.target.value)})} className="w-full bg-white text-cocoa rounded-xl px-3 py-2 font-black text-lg outline-none border-2 border-beige-dark" />
                        </div>
                        <div className="col-span-1">
                            <label className="text-[10px] text-gray-400 block mb-1 font-bold">約 TWD</label>
                            <div className="w-full bg-gray-50 text-gray-400 rounded-xl px-3 py-2 text-lg font-bold border-2 border-beige-dark flex items-center justify-center h-[48px] font-mono">{Math.round(calculateTWD(editingExpense.amount, editingExpense.currency))}</div>
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-400 block mb-1 font-bold">支付方式</label>
                        <div className="flex gap-2">
                            {paymentMethods.map(method => (<button key={method} onClick={() => setEditingExpense({...editingExpense, paymentMethod: method})} className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-colors whitespace-nowrap ${editingExpense.paymentMethod === method ? 'bg-yellow-50 text-yellow-600 border-yellow-200' : 'bg-white text-gray-400 border-beige-dark'}`}>{method}</button>))}
                        </div>
                    </div>
                    <div><label className="text-[10px] text-gray-400 block mb-1 font-bold">項目名稱</label><input type="text" value={editingExpense.title} onChange={e => setEditingExpense({...editingExpense, title: e.target.value})} className="w-full bg-white text-cocoa rounded-xl px-3 py-2 font-bold outline-none border-2 border-beige-dark" /></div>
                    <div><label className="text-[10px] text-gray-400 block mb-1 font-bold">地點</label><input type="text" value={editingExpense.location} onChange={e => setEditingExpense({...editingExpense, location: e.target.value})} className="w-full bg-white text-cocoa rounded-xl px-3 py-2 font-bold outline-none border-2 border-beige-dark" /></div>
                    <div><label className="text-[10px] text-gray-400 block mb-1 font-bold">付款人</label><div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">{members.map(m => (<button key={m.id} onClick={() => setEditingExpense({...editingExpense, payer: m.name})} className={`px-3 py-1.5 rounded-full text-xs border-2 whitespace-nowrap font-bold ${editingExpense.payer === m.name ? 'bg-sage text-white border-sage' : 'bg-white text-gray-400 border-beige-dark'}`}>{m.name}</button>))}</div></div>
                    <div><label className="text-[10px] text-gray-400 block mb-1 font-bold">分攤成員</label><div className="flex gap-2 flex-wrap">{members.map(m => { const isSelected = editingExpense.involvedMembers?.includes(m.name); return (<button key={m.id} onClick={() => toggleEditInvolvedMember(m.name)} className={`px-3 py-1.5 rounded-lg text-xs border-2 transition-all flex items-center gap-1.5 ${isSelected ? 'bg-blue-500 text-white border-blue-500 font-bold' : 'bg-white text-gray-400 border-beige-dark font-bold'}`}>{isSelected && <Check size={12} strokeWidth={3}/>} {m.name}</button>); })}</div></div>
                </div>
                <div className="flex gap-3 mt-6"><button onClick={handleDelete} className="px-4 py-3 rounded-2xl bg-red-50 text-red-400 font-black border-2 border-red-100"><Trash2 size={20}/></button><button onClick={() => setShowEditModal(false)} className="flex-1 py-3 rounded-2xl bg-white text-gray-400 font-black border-2 border-beige-dark">取消</button><button onClick={handleUpdate} className="flex-1 py-3 rounded-2xl bg-sage text-white font-black shadow-hard-sage border-2 border-sage-dark">保存</button></div>
            </div>
        </div>
      )}

      {showDetailModal && selectedExpense && (
          <div className="fixed inset-0 bg-cocoa/50 z-[100] flex items-center justify-center px-4 backdrop-blur-sm" onClick={() => setShowDetailModal(false)}>
              <div className="bg-beige w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl border-4 border-beige-dark relative overflow-hidden" onClick={e => e.stopPropagation()}>
                  <div className="text-center mb-6">
                      <div className="inline-block bg-white p-3 rounded-2xl shadow-sm border-2 border-beige-dark mb-3">{selectedExpense.paymentMethod === '現金' ? <Coins size={32} className="text-orange-400"/> : <CreditCard size={32} className="text-blue-400"/>}</div>
                      <h3 className="text-2xl font-black text-cocoa mb-1">{selectedExpense.title}</h3>
                      <p className="text-xs font-bold text-gray-400 bg-white px-3 py-1 rounded-full inline-block border border-beige-dark">{selectedExpense.date} {selectedExpense.time}</p>
                  </div>
                  <div className="space-y-4">
                      <div className="bg-white p-4 rounded-2xl border-2 border-beige-dark flex justify-between items-center shadow-sm"><span className="text-xs font-bold text-gray-400 uppercase">Amount</span><div className="text-right"><div className="text-2xl font-black text-cocoa font-mono">{selectedExpense.currency} {selectedExpense.amount.toLocaleString()}</div><div className="text-[10px] font-bold text-gray-400 font-mono">≈ NT$ {calculateTWD(selectedExpense.amount, selectedExpense.currency).toLocaleString()}</div></div></div>
                      <div className="grid grid-cols-2 gap-3"><div className="bg-white p-3 rounded-2xl border-2 border-beige-dark"><span className="text-[10px] font-bold text-gray-400 block uppercase mb-1">Payer</span><div className="font-black text-cocoa flex items-center gap-2"><User size={14} className="text-sage"/> {selectedExpense.payer}</div></div><div className="bg-white p-3 rounded-2xl border-2 border-beige-dark"><span className="text-[10px] font-bold text-gray-400 block uppercase mb-1">Method</span><div className="font-black text-cocoa flex items-center gap-2"><Wallet size={14} className="text-orange-400"/> {selectedExpense.paymentMethod}</div></div></div>
                      {(selectedExpense.involvedMembers && selectedExpense.involvedMembers.length > 0) && (<div className="bg-white p-3 rounded-2xl border-2 border-beige-dark"><span className="text-[10px] font-bold text-gray-400 block uppercase mb-1">Shared By</span><div className="flex flex-wrap gap-1">{selectedExpense.involvedMembers.map((m, i) => (<span key={i} className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-xs font-black">{m}</span>))}</div></div>)}
                      {selectedExpense.location && (<div className="bg-white p-3 rounded-2xl border-2 border-beige-dark flex items-center gap-3"><MapPin size={16} className="text-sage"/><span className="text-sm font-bold text-cocoa">{selectedExpense.location}</span></div>)}
                  </div>
                  <div className="mt-6 pt-4 border-t-2 border-beige-dark border-dashed flex justify-between">
                      <button onClick={() => openEdit(selectedExpense)} className="text-gray-400 font-bold text-sm flex items-center gap-2 hover:text-cocoa transition-colors"><PenTool size={14}/> 編輯</button>
                      <button onClick={() => setShowDetailModal(false)} className="bg-cocoa text-white px-6 py-2 rounded-xl font-black text-sm shadow-hard-sm active:translate-y-1 active:shadow-none transition-all">關閉</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
