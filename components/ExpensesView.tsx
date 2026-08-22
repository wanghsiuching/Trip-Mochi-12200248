
import React, { useState, useEffect, useRef } from 'react';
import { 
  PenTool, List, Wallet, Coins, User, MapPin, Trash2, 
  Receipt, CreditCard, Clock, Check, ArrowLeft, Send, MessageCircle, X,
  ArrowUpRight, ArrowDownLeft, Scale, CheckCircle2, Circle, AlertCircle, HelpCircle,
  Percent, Landmark, PiggyBank, Edit3, Calendar as CalendarIcon, Tag, Users,
  PlusCircle, MinusCircle, ReceiptText, Heart, ShoppingBag, Sparkles, HandCoins
} from 'lucide-react';
import { Expense, Member, Currency, Comment } from '../types';
import { ToggleSwitch, DeleteItemConfirmModal } from './Modals';
import { DatePickerField, TimePickerField, DateTimePickerField } from './TimePickerComponents';

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
  // Helper: Defined getExchangeRate helper inside the component
  const getExchangeRate = (code: string): number => currencies.find(c => c.code === code)?.rate || 1;

  const [viewMode, setViewMode] = useState<'general' | 'fund'>('general');
  const [mobileTab, setMobileTab] = useState<'input' | 'list'>(highlightId ? 'list' : 'input');
  
  // General Form State
  const [form, setForm] = useState({ 
      amount: '', title: '', currency: 'TWD', payer: members[0]?.name || '我', involvedMembers: [] as string[],
      paymentMethod: '現金', location: '', 
      isCreditCard: false, hasServiceFee: false, serviceFeePercentage: '1.5',
      date: new Date().toISOString().split('T')[0], time: new Date().toTimeString().slice(0, 5)
  });

  // Public Fund Form State
  const [fundForm, setFundForm] = useState({
      type: 'expense' as 'deposit' | 'expense',
      amount: '', 
      title: '', 
      currency: 'TWD', 
      payers: [] as string[], // For Batch Deposit
      involvedMembers: [] as string[], // For Expense participants
      date: new Date().toISOString().split('T')[0], 
      time: new Date().toTimeString().slice(0, 5)
  });
  
  const [filter, setFilter] = useState('all');
  
  // Edit State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editForm, setEditForm] = useState<any>(null);

  const [settleConfirm, setSettleConfirm] = useState<{ exp: Expense, memberName: string, amount: number } | null>(null);
  const [showFundInputModal, setShowFundInputModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);

  const listContainerRef = useRef<HTMLDivElement>(null);

  const FUND_SHORTCUTS = ['早餐', '中餐', '晚餐', '加油', '門票', '交通'];

  useEffect(() => {
    // Default involved members to all for general expenses initially
    if (form.involvedMembers.length === 0 && members.length > 0) {
        setForm(prev => ({ ...prev, involvedMembers: members.map(m => m.name) }));
    }
  }, [members.length]);

  useEffect(() => {
    if (highlightId) {
      const targetExp = expenses.find(e => e.id.toString() === highlightId);
      if (targetExp) {
          if (targetExp.category === 'public_fund') setViewMode('fund');
          else setViewMode('general');
          setMobileTab('list');
      }

      setTimeout(() => {
        const element = document.getElementById(`expense-${highlightId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('ring-4', 'ring-sage', 'ring-offset-2', 'animate-pulse');
          setTimeout(() => element.classList.remove('ring-4', 'ring-sage', 'ring-offset-2', 'animate-pulse'), 3000);
        }
      }, 300);
    }
  }, [highlightId, expenses]);

  // Helpers
  /* Explicitly cast result to number to avoid TS errors in arithmetic operations */
  const calculateTotalWithFee = (amount: number, hasFee: boolean, feePct: number): number => {
      if (!hasFee) return amount;
      return amount + (amount * (feePct / 100));
  };

  /* Ensure return type is strictly number */
  const calculateTWD = (amount: number, currency: string, hasFee: boolean = false, feePct: number = 0): number => {
      const totalAmount = calculateTotalWithFee(amount, hasFee, feePct);
      if (currency === 'TWD') return totalAmount;
      const rate = getExchangeRate(currency);
      return Math.round(totalAmount * rate);
  };

  // Filter Expenses by Category
  const generalExpenses = expenses.filter(e => !e.category || e.category === 'general');
  const fundExpenses = expenses.filter(e => e.category === 'public_fund');

  // General Filter
  const filteredGeneralExpenses = filter === 'all' 
    ? generalExpenses 
    : generalExpenses.filter(e => e.payer === filter || e.involvedMembers?.includes(filter));

  const totalGeneralTWD = filteredGeneralExpenses.reduce((acc, curr) => 
    acc + calculateTWD(curr.amount, curr.currency, curr.hasServiceFee || false, curr.serviceFeePercentage || 0), 0);

  // Fund Calculations (TWD Total Balance)
  const totalDepositTWD = fundExpenses.filter(e => e.fundType === 'deposit').reduce((acc, curr) => acc + calculateTWD(curr.amount, curr.currency), 0);
  const totalFundExpenseTWD = fundExpenses.filter(e => e.fundType === 'expense').reduce((acc, curr) => acc + calculateTWD(curr.amount, curr.currency), 0);
  const fundBalanceTWD = totalDepositTWD - totalFundExpenseTWD;

  // Currency-wise Balance for Fund
  const fundBalancesByCurrency = fundExpenses.reduce((acc, exp) => {
      const curr = exp.currency || 'TWD';
      if (!acc[curr]) acc[curr] = 0;
      const amount = Number(exp.amount) || 0;
      if (exp.fundType === 'deposit') acc[curr] += amount;
      else acc[curr] -= amount;
      return acc;
  }, {} as Record<string, number>);

  // Handlers
  const handleAddGeneral = () => {
    if (!form.amount || !form.title) {
        onShowToast("請填寫金額與項目", "error");
        return;
    }
    onAdd({
        category: 'general',
        amount: Number(form.amount), title: form.title, currency: form.currency, payer: form.payer,
        involvedMembers: form.involvedMembers.length > 0 ? form.involvedMembers : [form.payer], 
        settledMembers: [form.payer], 
        paymentMethod: form.isCreditCard ? '信用卡' : '現金', 
        isCreditCard: form.isCreditCard,
        hasServiceFee: form.hasServiceFee,
        serviceFeePercentage: form.hasServiceFee ? Number(form.serviceFeePercentage) : 0,
        location: form.location,
        image: null, images: [], date: form.date, time: form.time, comments: []
    });
    setForm({ ...form, amount: '', title: '' });
    onShowToast("已新增", "success");
    setMobileTab('list');
  };

  const handleAddFund = () => {
      if (!fundForm.amount || !fundForm.title) {
          onShowToast("請填寫金額與項目", "error");
          return;
      }

      if (fundForm.type === 'deposit') {
          const payers = fundForm.payers.length > 0 ? fundForm.payers : [members[0].name];
          payers.forEach(payer => {
              onAdd({
                  category: 'public_fund',
                  fundType: 'deposit',
                  amount: Number(fundForm.amount),
                  title: fundForm.title,
                  currency: fundForm.currency,
                  payer: payer,
                  involvedMembers: [], 
                  paymentMethod: '現金',
                  location: '',
                  image: null, images: [], date: fundForm.date, time: fundForm.time, comments: []
              });
          });
          onShowToast(`已新增 ${payers.length} 筆入金紀錄`, "success");
      } else {
          onAdd({
              category: 'public_fund',
              fundType: 'expense',
              amount: Number(fundForm.amount),
              title: fundForm.title,
              currency: fundForm.currency,
              payer: '公費',
              involvedMembers: fundForm.involvedMembers.length > 0 ? fundForm.involvedMembers : members.map(m => m.name),
              paymentMethod: '現金',
              location: '',
              image: null, images: [], date: fundForm.date, time: fundForm.time, comments: []
          });
          onShowToast("已記錄支出", "success");
      }
      
      setFundForm({ ...fundForm, amount: '', title: '' });
      setShowFundInputModal(false);
  };

  const handleEditClick = (exp: Expense) => {
      setEditingExpense(exp);
      setEditForm({
          amount: exp.amount, title: exp.title, currency: exp.currency, payer: exp.payer,
          involvedMembers: exp.involvedMembers || [],
          paymentMethod: exp.paymentMethod,
          isCreditCard: exp.isCreditCard,
          hasServiceFee: exp.hasServiceFee,
          serviceFeePercentage: exp.serviceFeePercentage,
          date: exp.date, time: exp.time,
          fundType: exp.fundType,
          category: exp.category
      });
      setShowEditModal(true);
  };

  const handleSaveEdit = () => {
      if (!editingExpense || !editForm) return;
      onUpdate({
          ...editingExpense,
          amount: Number(editForm.amount),
          title: editForm.title,
          currency: editForm.currency,
          payer: editForm.payer,
          involvedMembers: editForm.involvedMembers,
          paymentMethod: editForm.isCreditCard ? '信用卡' : '現金',
          isCreditCard: editForm.isCreditCard,
          hasServiceFee: editForm.hasServiceFee,
          serviceFeePercentage: editForm.hasServiceFee ? Number(editForm.serviceFeePercentage) : 0,
          date: editForm.date,
          time: editForm.time
      });
      setShowEditModal(false);
      setEditingExpense(null);
      onShowToast("修改成功", "success");
  };

  const handleDeleteClick = (id: number) => {
      setItemToDelete(id);
  };

  const confirmDelete = () => {
    if (itemToDelete !== null) {
        onDelete(itemToDelete);
        setItemToDelete(null);
        setShowEditModal(false);
        onShowToast("已刪除", "success");
    }
  };

  const performToggle = (exp: Expense, memberName: string) => {
      if (settleConfirm) {
          const updatedSettled = [...(exp.settledMembers || []), memberName];
          onUpdate({ ...exp, settledMembers: updatedSettled });
          setSettleConfirm(null);
          onShowToast("已標記為已繳款", "success");
      } else {
          const isSettled = exp.settledMembers?.includes(memberName);
          if (isSettled) {
              if (exp.payer === memberName) return;
              if (window.confirm(`確定要將 ${memberName} 標記為未繳款嗎？`)) {
                  const updatedSettled = exp.settledMembers?.filter(m => m !== memberName);
                  onUpdate({ ...exp, settledMembers: updatedSettled });
              }
          } else {
              const totalAmount = calculateTWD(exp.amount, exp.currency, exp.hasServiceFee || false, exp.serviceFeePercentage || 0);
              const perPerson = totalAmount / (exp.involvedMembers?.length || 1);
              setSettleConfirm({ exp, memberName, amount: Math.round(perPerson) });
          }
      }
  };

  const toggleGeneralInvolved = (name: string) => {
      setForm(prev => {
          const current = prev.involvedMembers;
          if (current.includes(name)) return { ...prev, involvedMembers: current.filter(m => m !== name) };
          return { ...prev, involvedMembers: [...current, name] };
      });
  };

  const toggleFundPayer = (name: string) => {
      setFundForm(prev => {
          const current = prev.payers;
          if (current.includes(name)) return { ...prev, payers: current.filter(m => m !== name) };
          return { ...prev, payers: [...current, name] };
      });
  };

  const toggleFundInvolved = (name: string) => {
      setFundForm(prev => {
          const current = prev.involvedMembers;
          if (current.includes(name)) return { ...prev, involvedMembers: current.filter(m => m !== name) };
          return { ...prev, involvedMembers: [...current, name] };
      });
  };

  // Grouping & Sorting Logic
  const groupedGeneralExpenses = filteredGeneralExpenses.reduce((acc, exp) => {
    const date = exp.date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(exp);
    return acc;
  }, {} as Record<string, Expense[]>);
  const sortedGeneralDates = Object.keys(groupedGeneralExpenses).sort((a, b) => b.localeCompare(a));

  const groupedFundExpenses = fundExpenses.reduce((acc, exp) => {
    const date = exp.date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(exp);
    return acc;
  }, {} as Record<string, Expense[]>);
  const sortedFundDates = Object.keys(groupedFundExpenses).sort((a, b) => b.localeCompare(a));

  // --- Sub-Components ---

  const MemberStats = () => {
      if (filter === 'all') return null;
      
      let paidUpfrontTWD = 0;
      let myOwnShareTWD = 0;
      let waitingFromOthers = 0;
      let pendingToOthers = 0;

      generalExpenses.forEach(exp => {
        const expTWD = calculateTWD(exp.amount, exp.currency, exp.hasServiceFee || false, exp.serviceFeePercentage || 0);
        const involved = exp.involvedMembers || [];
        const splitCount = involved.length || 1;
        const perPersonShare = expTWD / splitCount;

        if (exp.payer === filter) {
            paidUpfrontTWD += expTWD;
            involved.forEach(m => {
                if (m === filter) myOwnShareTWD += perPersonShare;
                else {
                    const isSettled = exp.settledMembers?.includes(m);
                    if (!isSettled) waitingFromOthers += perPersonShare;
                }
            });
        } else if (involved.includes(filter)) {
            myOwnShareTWD += perPersonShare;
            const isSettled = exp.settledMembers?.includes(filter);
            if (!isSettled) pendingToOthers += perPersonShare;
        }
      });

      return (
        <div className="mb-8 bg-white p-6 rounded-[2.5rem] border-2 border-sage shadow-hard-sm animate-scale-in relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5"><HelpCircle size={80}/></div>
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <span className="text-3xl bg-beige p-2 rounded-2xl">{members.find(m => m.name === filter)?.fruit}</span>
                    <div>
                        <h4 className="font-black text-cocoa text-xl">{filter} 的分帳結報</h4>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className={`p-4 rounded-3xl border-2 transition-all ${waitingFromOthers > 0 ? 'bg-blue-50 border-blue-200 ring-4 ring-blue-50' : 'bg-gray-50 border-beige-dark opacity-50'}`}>
                    <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1 flex items-center gap-1.5"><Coins size={12}/> 尚須收回 (待收)</div>
                    <div className={`text-2xl font-black font-mono ${waitingFromOthers > 0 ? 'text-blue-600' : 'text-gray-400'}`}>NT$ {Math.round(waitingFromOthers).toLocaleString()}</div>
                </div>
                <div className={`p-4 rounded-3xl border-2 transition-all ${pendingToOthers > 0 ? 'bg-red-50 border-red-200 ring-4 ring-red-50' : 'bg-gray-50 border-beige-dark opacity-50'}`}>
                    <div className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1 flex items-center gap-1.5"><Scale size={12}/> 尚須補繳 (欠款)</div>
                    <div className={`text-2xl font-black font-mono ${pendingToOthers > 0 ? 'text-red-600' : 'text-gray-400'}`}>NT$ {Math.round(pendingToOthers).toLocaleString()}</div>
                </div>
            </div>
        </div>
      );
  };

  return (
    <div className="w-full mx-auto lg:p-0 pb-48 lg:pb-0 animate-scale-in" ref={listContainerRef}>
       {/* Mode Switcher */}
       <div className="sticky top-0 z-40 bg-beige/95 backdrop-blur-md px-4 pt-3 pb-2 border-b border-beige-dark/50 mb-4">
            <div className="bg-white p-1.5 rounded-full flex text-sm font-bold text-gray-400 border-2 border-beige-dark shadow-sm w-full mb-3">
                <button onClick={() => setViewMode('general')} className={`flex-1 py-2.5 rounded-full transition-all flex items-center justify-center gap-1.5 ${viewMode === 'general' ? 'bg-cocoa text-white shadow-md' : 'text-gray-400'}`}><Receipt size={16} /> 分帳記帳</button>
                <button onClick={() => setViewMode('fund')} className={`flex-1 py-2.5 rounded-full transition-all flex items-center justify-center gap-1.5 ${viewMode === 'fund' ? 'bg-teal-600 text-white shadow-md' : 'text-gray-400'}`}><PiggyBank size={16} /> 公費管理</button>
            </div>
            
            {/* Mobile Tab Switcher */}
            {viewMode === 'general' && (
                <div className="lg:hidden flex gap-2">
                    <button onClick={() => setMobileTab('input')} className={`flex-1 py-2 rounded-xl text-xs font-black transition-all border-2 ${mobileTab === 'input' ? 'bg-sage border-sage text-white' : 'bg-white border-beige-dark text-gray-400'}`}>新增支出</button>
                    <button onClick={() => setMobileTab('list')} className={`flex-1 py-2 rounded-xl text-xs font-black transition-all border-2 ${mobileTab === 'list' ? 'bg-sage border-sage text-white' : 'bg-white border-beige-dark text-gray-400'}`}>查看明細</button>
                </div>
            )}
       </div>

       {/* === GENERAL (SPLIT) MODE === */}
       {viewMode === 'general' && (
         <div className="px-4 lg:p-0 lg:grid lg:grid-cols-12 lg:gap-8">
            <div className={`lg:col-span-5 lg:sticky lg:top-8 flex flex-col gap-6 lg:flex-col-reverse ${mobileTab === 'list' ? 'hidden lg:flex' : ''}`}>
                <div className="bg-white p-5 rounded-[2rem] shadow-hard-sm border-2 border-beige-dark mb-10 lg:mb-0">
                    <h3 className="font-black text-cocoa mb-4 flex items-center gap-2 text-lg"><Wallet className="text-sage" size={24}/> 新增分帳支出</h3>
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                            <DatePickerField
                                label="日期"
                                value={form.date}
                                onChange={val => setForm({...form, date: val})}
                                themeColor="sage"
                            />
                            <TimePickerField
                                label="時間"
                                value={form.time}
                                onChange={val => setForm({...form, time: val})}
                                themeColor="sage"
                            />
                        </div>
                        
                        <div className="flex bg-beige/30 p-1 rounded-2xl border-2 border-beige-dark mb-1">
                            <button onClick={() => setForm({...form, isCreditCard: false})} className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 ${!form.isCreditCard ? 'bg-white text-orange-400 shadow-sm border border-beige-dark' : 'text-gray-400'}`}><Coins size={14}/> 現金支付</button>
                            <button onClick={() => setForm({...form, isCreditCard: true})} className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 ${form.isCreditCard ? 'bg-white text-blue-500 shadow-sm border border-beige-dark' : 'text-gray-400'}`}><CreditCard size={14}/> 信用卡</button>
                        </div>

                        <div className="grid grid-cols-4 gap-2">
                            <div className="col-span-3 bg-white p-3 rounded-xl border-2 border-beige-dark shadow-sm">
                                <label className="text-[10px] text-gray-400 block mb-1 font-bold">金額</label>
                                <input type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="w-full bg-transparent text-cocoa outline-none font-black text-xl" placeholder="0" />
                            </div>
                            <div className="bg-white p-3 rounded-xl border-2 border-beige-dark shadow-sm overflow-hidden">
                                <label className="text-[10px] text-gray-400 block mb-1 font-bold">幣別</label>
                                <select value={form.currency} onChange={e => setForm({...form, currency: e.target.value})} className="w-full bg-transparent text-cocoa outline-none font-bold text-xs">
                                    <option value="TWD">TWD</option>
                                    {currencies.map(c => (<option key={c.code} value={c.code}>{c.code}</option>))}
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center justify-between mt-2 mb-1 px-1">
                            <ToggleSwitch checked={form.hasServiceFee} onChange={(checked) => setForm({...form, hasServiceFee: checked})} label="額外手續費/稅金" colorClass="bg-blue-400" />
                            {form.hasServiceFee && (
                                <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-beige-dark shadow-sm">
                                    <input type="number" value={form.serviceFeePercentage} onChange={e => setForm({...form, serviceFeePercentage: e.target.value})} className="w-10 bg-transparent text-xs font-bold text-center outline-none text-cocoa border-b border-gray-200" placeholder="1.5"/>
                                    <span className="text-xs font-bold text-gray-400">%</span>
                                </div>
                            )}
                        </div>

                        <div className="bg-white p-3 rounded-xl border-2 border-beige-dark shadow-sm">
                            <label className="text-[10px] text-gray-400 block mb-1 font-bold">項目名稱</label>
                            <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full bg-transparent text-cocoa outline-none font-bold" placeholder="例如：藥妝店購物"/>
                        </div>

                        <div className="bg-gray-50 p-3 rounded-xl border border-dashed border-beige-dark flex justify-between items-center">
                            <span className="text-xs font-bold text-gray-400">概算總額 (含手續費)</span>
                            <span className="text-sm font-black text-sage">TWD {calculateTWD(Number(form.amount)||0, form.currency, form.hasServiceFee, Number(form.serviceFeePercentage)||0).toLocaleString()}</span>
                        </div>

                        <div>
                            <label className="text-[10px] text-gray-400 block mb-2 font-bold ml-1 flex items-center gap-1"><User size={12}/> 付款人 (誰墊付?)</label>
                            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">{members.map(m => (<button key={m.id} onClick={() => setForm({...form, payer: m.name})} className={`px-4 py-2 rounded-full text-xs border-2 whitespace-nowrap font-bold transition-all ${form.payer === m.name ? 'bg-sage text-white border-sage shadow-md' : 'bg-white text-gray-400 border-beige-dark'}`}>{m.name}</button>))}</div>
                        </div>

                        <div className="bg-white p-3 rounded-xl border-2 border-beige-dark shadow-sm">
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-[10px] text-gray-400 font-bold block flex items-center gap-1"><Users size={12}/> 參與分攤成員</label>
                                <div className="flex gap-2">
                                    <button onClick={() => setForm({...form, involvedMembers: members.map(m => m.name)})} className="text-[10px] bg-white border-2 border-beige-dark text-cocoa font-bold px-3 py-1.5 rounded-lg shadow-sm hover:bg-beige active:scale-95 transition-all">全選</button>
                                    <button onClick={() => setForm({...form, involvedMembers: []})} className="text-[10px] bg-white border-2 border-beige-dark text-gray-400 font-bold px-3 py-1.5 rounded-lg shadow-sm hover:bg-gray-50 active:scale-95 transition-all">清除</button>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {members.map(m => (
                                    <button key={m.id} onClick={() => toggleGeneralInvolved(m.name)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all ${form.involvedMembers.includes(m.name) ? 'bg-orange-50 text-orange-500 border-orange-200' : 'bg-white text-gray-300 border-beige-dark'}`}>
                                        {m.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <button onClick={handleAddGeneral} className="w-full mt-6 bg-sage text-white py-4 rounded-2xl font-black shadow-hard-sage border-2 border-sage-dark flex items-center justify-center gap-2 text-lg active:translate-y-1 active:shadow-none transition-all"><Check size={24}/> 確認記帳</button>
                </div>
            </div>

            <div className={`lg:col-span-7 lg:mt-0 pb-32 ${mobileTab === 'input' ? 'hidden lg:block' : 'block'}`}>
                <div className="mb-4 overflow-x-auto no-scrollbar py-2 flex gap-2.5 items-center">
                    <button onClick={() => setFilter('all')} className={`flex-shrink-0 px-5 py-2.5 rounded-full border-2 font-black text-sm transition-all ${filter === 'all' ? 'bg-cocoa text-white border-cocoa shadow-md' : 'bg-white text-gray-400 border-beige-dark'}`}>全部</button>
                    {members.map(m => (
                        <button key={m.id} onClick={() => setFilter(m.name)} className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all ${filter === m.name ? 'bg-sage text-white border-sage shadow-md scale-105' : 'bg-white text-gray-400 border-beige-dark'}`}>
                            <div className="w-6 h-6 rounded-full overflow-hidden border border-white/50 flex items-center justify-center bg-beige text-[10px] font-black text-cocoa">{m.avatar ? <img src={m.avatar} className="w-full h-full object-cover" /> : m.name[0]}</div>
                            <span className="text-sm font-bold">{m.name}</span>
                        </button>
                    ))}
                </div>

                <MemberStats />

                <div className="bg-sage text-white p-6 rounded-[2rem] shadow-hard-sm relative overflow-hidden border-2 border-sage-dark mb-6">
                    <div className="absolute -right-6 -top-6 w-32 h-32 bg-white rounded-full opacity-10 blur-2xl"></div>
                    <p className="opacity-80 text-xs mb-1 font-bold">{filter === 'all' ? '分帳總支出' : filter + ' 的分帳相關'} (TWD)</p>
                    <h2 className="text-4xl font-black tracking-tight truncate font-mono">NT$ {totalGeneralTWD.toLocaleString()}</h2>
                </div>

                <div className="space-y-6">
                    {sortedGeneralDates.map(date => (
                        <div key={date}>
                            <div className="sticky top-0 z-10 bg-beige/95 backdrop-blur-md py-2 mb-3 border-b border-beige-dark border-dashed flex justify-between items-center">
                                <span className="bg-white text-cocoa px-4 py-1 rounded-full text-xs font-black shadow-sm border border-beige-dark">{date}</span>
                            </div>
                            <div className="space-y-4">
                                {groupedGeneralExpenses[date].map(exp => {
                                    const isPayer = filter !== 'all' && exp.payer === filter;
                                    const finalAmountTWD = calculateTWD(exp.amount, exp.currency, exp.hasServiceFee || false, exp.serviceFeePercentage || 0);
                                    const splitAmountTWD = finalAmountTWD / (exp.involvedMembers?.length || 1);

                                    return (
                                        <div key={exp.id} id={`expense-${exp.id}`} className={`bg-white p-5 rounded-[2rem] shadow-hard-sm border-2 transition-all border-beige-dark relative group`}>
                                            <button 
                                                onClick={() => handleEditClick(exp)}
                                                className="absolute top-4 right-4 p-2 bg-gray-50 text-gray-400 rounded-full border border-beige-dark opacity-0 group-hover:opacity-100 transition-opacity hover:bg-sage hover:text-white z-20"
                                            >
                                                <Edit3 size={16} />
                                            </button>

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
                                                <div className="text-right flex-shrink-0 pr-8 lg:pr-0">
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
                                                                onClick={(e) => { e.stopPropagation(); performToggle(exp, mName); }} 
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
       )}

       {/* === PUBLIC FUND MODE === */}
       {viewMode === 'fund' && (
           <div className="px-4 pb-32 animate-scale-in">
               <div className="max-w-2xl mx-auto">
                   {/* Fund Balance Card */}
                   <div className="bg-teal-600 text-white p-8 rounded-[2.5rem] shadow-hard-sm relative overflow-hidden border-4 border-teal-700 mb-8">
                        <div className="absolute -right-10 -top-10 w-48 h-48 bg-teal-500 rounded-full opacity-30 blur-3xl"></div>
                        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-teal-400 rounded-full opacity-20 blur-3xl"></div>
                        <div className="relative z-10 text-center">
                            <p className="font-bold text-teal-200 uppercase tracking-widest text-sm mb-2 flex items-center justify-center gap-2"><PiggyBank size={18}/> 公費總額概算 (TWD)</p>
                            <h2 className="text-5xl font-black font-mono tracking-tight mb-6">NT$ {fundBalanceTWD.toLocaleString()}</h2>
                            
                            <div className="flex flex-wrap gap-4 justify-center bg-teal-700/30 p-4 rounded-3xl border border-teal-500/50">
                                {Object.entries(fundBalancesByCurrency).map(([curr, balance]) => {
                                    if (balance === 0 && curr === 'TWD') return null;
                                    /* Explicitly cast balance to number to ensure arithmetic safety */
                                    const twdVal = curr === 'TWD' ? 0 : Math.round(Number(balance) * getExchangeRate(curr));
                                    return (
                                        <div key={curr} className="text-center px-4 border-r last:border-none border-teal-500/50">
                                            <div className="text-xs font-bold text-teal-200 uppercase mb-1">{curr} 剩餘</div>
                                            <div className="text-3xl font-black font-mono">{balance.toLocaleString()}</div>
                                            {curr !== 'TWD' && <div className="text-xs font-bold text-teal-300/80 mt-1">≈ NT$ {twdVal.toLocaleString()}</div>}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                   </div>

                   {/* Action Buttons - Spend is now larger */}
                   <div className="flex gap-4 mb-8 items-stretch">
                       <button onClick={() => { setFundForm({...fundForm, type: 'deposit', payers: [], title: '', amount: ''}); setShowFundInputModal(true); }} className="flex-1 bg-white border-2 border-beige-dark p-4 rounded-2xl shadow-hard-sm active:translate-y-1 active:shadow-none transition-all flex flex-col items-center justify-center gap-1 group hover:border-teal-300">
                           <div className="w-10 h-10 bg-green-50 text-green-500 rounded-full flex items-center justify-center border-2 border-green-100 group-hover:scale-110 transition-transform"><PiggyBank size={20} className="opacity-80"/><PlusCircle size={14} className="absolute -top-1 -right-1"/></div>
                           <span className="font-bold text-cocoa text-xs">入金</span>
                       </button>
                       <button onClick={() => { setFundForm({...fundForm, type: 'expense', involvedMembers: members.map(m=>m.name), title: '', amount: ''}); setShowFundInputModal(true); }} className="flex-[2.5] bg-white border-2 border-beige-dark p-5 rounded-2xl shadow-hard-sm active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-4 group hover:border-red-300">
                           <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center border-2 border-red-200 group-hover:scale-110 transition-transform shadow-inner"><HandCoins size={28} strokeWidth={2.5}/></div>
                           <div className="text-left">
                               <span className="font-black text-cocoa text-xl block">公費支出</span>
                               <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Record Spend</span>
                           </div>
                       </button>
                   </div>

                   {/* Fund History List */}
                   <div className="space-y-6">
                       <h3 className="font-black text-cocoa text-lg ml-2 flex items-center gap-2"><List size={20}/> 公費明細</h3>
                       {sortedFundDates.map(date => (
                           <div key={date}>
                               <div className="sticky top-20 z-10 bg-beige/95 backdrop-blur-md py-2 mb-3 border-b border-beige-dark border-dashed flex justify-between items-center">
                                   <span className="bg-white text-cocoa px-4 py-1 rounded-full text-xs font-black shadow-sm border border-beige-dark">{date}</span>
                               </div>
                               <div className="space-y-3">
                                   {/* Sort items within the date descending (newest on top) */}
                                   {groupedFundExpenses[date].slice().reverse().map(exp => {
                                       const isDeposit = exp.fundType === 'deposit';
                                       return (
                                           <div key={exp.id} className="bg-white p-4 rounded-2xl border-2 border-beige-dark flex items-center justify-between shadow-sm relative group">
                                               <div className="flex items-center gap-4 flex-1 min-w-0">
                                                   <div className={`w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center border-2 ${isDeposit ? 'bg-green-50 border-green-100 text-green-500' : 'bg-red-50 border-red-100 text-red-500'}`}>
                                                       {isDeposit ? <PiggyBank size={24} className="opacity-80"/> : <HandCoins size={24}/>}
                                                   </div>
                                                   <div className="min-w-0 flex-1">
                                                       <div className="flex items-center gap-2 flex-wrap">
                                                           <h4 className="font-black text-cocoa text-lg leading-tight whitespace-pre-wrap">{exp.title || (isDeposit ? '公費入金' : '公費支出')}</h4>
                                                           {isDeposit && <span className="text-[10px] bg-beige px-2 py-0.5 rounded-full font-bold text-gray-500 whitespace-nowrap">From: {exp.payer}</span>}
                                                       </div>
                                                       <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-xs font-bold text-gray-400">{exp.time}</span>
                                                            {!isDeposit && exp.involvedMembers && (
                                                                <div className="flex flex-wrap gap-1">
                                                                    {exp.involvedMembers.map((mName, i) => (
                                                                        <span key={i} className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded border border-gray-200 font-bold">{mName}</span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                       </div>
                                                   </div>
                                               </div>
                                               <div className="text-right flex-shrink-0 ml-2">
                                                   <div className={`text-lg font-black font-mono ${isDeposit ? 'text-green-600' : 'text-red-500'}`}>
                                                       {isDeposit ? '+' : '-'} {exp.currency} {exp.amount.toLocaleString()}
                                                   </div>
                                                   {exp.currency !== 'TWD' && <div className="text-[10px] font-bold text-gray-300">≈ NT$ {calculateTWD(exp.amount, exp.currency).toLocaleString()}</div>}
                                               </div>
                                               
                                               <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                   <button onClick={() => handleEditClick(exp)} className="bg-white text-gray-400 p-1.5 rounded-full border border-beige-dark shadow-sm hover:text-sage"><Edit3 size={12}/></button>
                                                   <button onClick={() => handleDeleteClick(exp.id)} className="bg-red-100 text-red-400 p-1.5 rounded-full border border-red-200 shadow-sm hover:bg-red-200"><Trash2 size={12}/></button>
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
       )}

       {/* Edit Public/Split Modal */}
       {showEditModal && editForm && (
           <div className="fixed inset-0 bg-cocoa/50 z-[150] flex items-center justify-center px-4 backdrop-blur-sm">
               <div className="bg-beige w-full max-w-sm rounded-[2rem] p-6 shadow-2xl border-4 border-beige-dark max-h-[90vh] overflow-y-auto custom-scroll">
                   <h3 className="font-black text-lg mb-4 text-center text-cocoa">編輯{editForm.fundType ? '公費項目' : '項目'}</h3>
                   <div className="space-y-3">
                        <div className="bg-gray-50 p-3 rounded-xl border border-beige-dark space-y-2">
                            <textarea 
                                value={editForm.title} 
                                onChange={e => setEditForm({...editForm, title: e.target.value})} 
                                className="w-full bg-white p-2 rounded-lg border border-beige-dark outline-none font-bold text-cocoa resize-none h-20 leading-tight" 
                                placeholder="項目名稱"
                            />
                            <div className="grid grid-cols-4 gap-2">
                                <div className="col-span-3">
                                    <input type="number" value={editForm.amount} onChange={e => setEditForm({...editForm, amount: e.target.value})} className="w-full bg-white p-2 rounded-lg border border-beige-dark outline-none font-black text-cocoa" placeholder="金額"/>
                                </div>
                                <div className="col-span-1">
                                    <select value={editForm.currency} onChange={e => setEditForm({...editForm, currency: e.target.value})} className="w-full bg-white p-2 rounded-lg border border-beige-dark outline-none font-bold text-xs h-full">
                                        <option value="TWD">TWD</option>{currencies.map(c => (<option key={c.code} value={c.code}>{c.code}</option>))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <DatePickerField
                                label="日期"
                                value={editForm.date}
                                onChange={val => setEditForm({...editForm, date: val})}
                                themeColor="sage"
                            />
                            <TimePickerField
                                label="時間"
                                value={editForm.time}
                                onChange={val => setEditForm({...editForm, time: val})}
                                themeColor="sage"
                            />
                        </div>

                        {!editForm.fundType && (
                            <div className="bg-gray-50 p-3 rounded-xl border border-beige-dark">
                                <label className="text-[10px] text-gray-400 block mb-2 font-bold">付款人</label>
                                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                                    {members.map(m => (
                                        <button key={m.id} onClick={() => setEditForm({...editForm, payer: m.name})} className={`px-3 py-1.5 rounded-lg text-xs border-2 whitespace-nowrap font-bold transition-all ${editForm.payer === m.name ? 'bg-sage text-white border-sage' : 'bg-white text-gray-400 border-beige-dark'}`}>{m.name}</button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {editForm.fundType === 'deposit' && (
                             <div className="bg-gray-50 p-3 rounded-xl border border-beige-dark">
                                <label className="text-[10px] text-gray-400 block mb-2 font-bold">繳款人 (修正)</label>
                                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                                    {members.map(m => (
                                        <button key={m.id} onClick={() => setEditForm({...editForm, payer: m.name})} className={`px-3 py-1.5 rounded-lg text-xs border-2 whitespace-nowrap font-bold transition-all ${editForm.payer === m.name ? 'bg-teal-50 text-white border-teal-600' : 'bg-white text-gray-400 border-beige-dark'}`}>{m.name}</button>
                                    ))}
                                </div>
                             </div>
                        )}

                        {editForm.fundType === 'expense' && (
                            <div className="bg-gray-50 p-3 rounded-xl border border-beige-dark">
                                <label className="text-[10px] text-gray-400 block mb-2 font-bold">參與分攤成員</label>
                                <div className="flex flex-wrap gap-2">
                                    {members.map(m => (
                                        <button key={m.id} onClick={() => {
                                            const current = editForm.involvedMembers || [];
                                            const updated = current.includes(m.name) ? current.filter((n: string) => n !== m.name) : [...current, m.name];
                                            setEditForm({...editForm, involvedMembers: updated});
                                        }} className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 whitespace-nowrap font-bold transition-all ${editForm.involvedMembers?.includes(m.name) ? 'bg-red-400 text-white border-red-500' : 'bg-white text-gray-400 border-beige-dark'}`}>{m.name}</button>
                                    ))}
                                </div>
                            </div>
                        )}
                   </div>
                   
                   <div className="flex gap-3 mt-6">
                       <button onClick={() => handleDeleteClick(editingExpense!.id)} className="px-4 py-3 rounded-xl bg-red-50 text-red-400 border border-red-100"><Trash2 size={20}/></button>
                       <button onClick={() => setShowEditModal(false)} className="flex-1 py-3 rounded-xl bg-white text-gray-400 font-black border-2 border-beige-dark">取消</button>
                       <button onClick={handleSaveEdit} className="flex-1 py-3 rounded-xl bg-sage text-white font-black shadow-hard-sage border-2 border-sage-dark">保存修改</button>
                   </div>
               </div>
           </div>
       )}

       {/* Fund Input Modal - Bottom Sheet on Mobile */}
       {showFundInputModal && (
           <div className="fixed inset-0 bg-cocoa/50 z-[150] flex items-end sm:items-center justify-center sm:px-4 backdrop-blur-sm">
               <div className="bg-white w-full max-w-sm rounded-t-[2.5rem] sm:rounded-[2rem] p-6 shadow-2xl border-t-4 sm:border-4 border-teal-600 animate-scale-in max-h-[80vh] overflow-y-auto custom-scroll pb-32">
                   <h3 className="font-black text-xl mb-6 text-center text-teal-700 flex items-center justify-center gap-2">
                       {fundForm.type === 'deposit' ? <PiggyBank /> : <HandCoins />}
                       {fundForm.type === 'deposit' ? '公費入金' : '公費支出'}
                   </h3>
                   <div className="space-y-4">
                       <div>
                           <label className="text-[10px] font-bold text-gray-400 ml-1">金額 {fundForm.type === 'deposit' ? '(每人)' : ''}</label>
                           <div className="grid grid-cols-4 gap-2">
                               <div className="col-span-3">
                                   <input type="number" autoFocus value={fundForm.amount} onChange={e => setFundForm({...fundForm, amount: e.target.value})} className="w-full bg-teal-50 p-3 rounded-xl border-2 border-teal-100 outline-none font-black text-xl text-teal-800 placeholder-teal-200" placeholder="0"/>
                               </div>
                               <div className="col-span-1">
                                   <select value={fundForm.currency} onChange={e => setFundForm({...fundForm, currency: e.target.value})} className="w-full h-full bg-teal-50 p-2 rounded-xl border-2 border-teal-100 outline-none font-bold text-teal-800 text-xs">
                                        <option value="TWD">TWD</option>{currencies.map(c => (<option key={c.code} value={c.code}>{c.code}</option>))}
                                   </select>
                               </div>
                           </div>
                       </div>

                       {fundForm.type === 'expense' && (
                           <div className="flex flex-wrap gap-2 mb-1">
                               {FUND_SHORTCUTS.map(s => (
                                   <button key={s} onClick={() => setFundForm({...fundForm, title: s})} className="text-xs bg-gray-50 text-gray-500 border border-gray-200 px-2 py-1 rounded-lg font-bold hover:bg-teal-50 hover:text-teal-600 transition-colors">{s}</button>
                               ))}
                           </div>
                       )}

                       <div>
                           <label className="text-[10px] font-bold text-gray-400 ml-1">項目說明</label>
                           <textarea 
                               value={fundForm.title} 
                               onChange={e => setFundForm({...fundForm, title: e.target.value})} 
                               className="w-full bg-gray-50 p-3 rounded-xl border-2 border-beige-dark outline-none font-bold text-cocoa resize-none h-24 leading-tight" 
                               placeholder={fundForm.type === 'deposit' ? "例如: 公費" : "例如: 晚餐\n(詳細內容...)"}
                           />
                       </div>
                       
                       {fundForm.type === 'deposit' && (
                           <div>
                               <label className="text-[10px] font-bold text-gray-400 ml-1 mb-2 block">繳款人 (可多選，每人金額皆為上方輸入金額)</label>
                               <div className="flex flex-wrap gap-2">
                                   {members.map(m => (
                                       <button key={m.id} onClick={() => toggleFundPayer(m.name)} className={`px-4 py-2 rounded-xl text-xs border-2 whitespace-nowrap font-bold transition-all ${fundForm.payers.includes(m.name) ? 'bg-teal-500 text-white border-teal-600 shadow-md' : 'bg-white text-gray-400 border-beige-dark'}`}>{m.name}</button>
                                   ))}
                               </div>
                           </div>
                       )}

                       {fundForm.type === 'expense' && (
                           <div>
                               <label className="text-[10px] font-bold text-gray-400 ml-1 mb-2 block">參與分攤 (誰使用了公費?)</label>
                               <div className="flex flex-wrap gap-2">
                                   {members.map(m => (
                                       <button key={m.id} onClick={() => toggleFundInvolved(m.name)} className={`px-4 py-2 rounded-xl text-xs border-2 whitespace-nowrap font-bold transition-all ${fundForm.involvedMembers.includes(m.name) ? 'bg-red-400 text-white border-red-500 shadow-md' : 'bg-white text-gray-400 border-beige-dark'}`}>{m.name}</button>
                                   ))}
                               </div>
                           </div>
                       )}

                       <div className="grid grid-cols-2 gap-2">
                           <DatePickerField
                               label="日期"
                               value={fundForm.date}
                               onChange={val => setFundForm({...fundForm, date: val})}
                               themeColor={fundForm.type === 'deposit' ? 'sage' : 'orange'}
                           />
                           <TimePickerField
                               label="時間"
                               value={fundForm.time}
                               onChange={val => setFundForm({...fundForm, time: val})}
                               themeColor={fundForm.type === 'deposit' ? 'sage' : 'orange'}
                           />
                       </div>
                   </div>
                   <div className="flex gap-3 mt-8">
                       <button onClick={() => setShowFundInputModal(false)} className="flex-1 py-3.5 rounded-2xl bg-gray-100 text-gray-400 font-black border-2 border-gray-200">取消</button>
                       <button onClick={handleAddFund} className={`flex-1 py-3.5 rounded-2xl text-white font-black shadow-md border-2 ${fundForm.type === 'deposit' ? 'bg-teal-500 border-teal-600' : 'bg-red-400 border-red-500'}`}>確認</button>
                   </div>
               </div>
           </div>
       )}

       {/* Delete Confirm Modal (Replacing window.confirm) */}
       <DeleteItemConfirmModal 
            isOpen={itemToDelete !== null} 
            onClose={() => setItemToDelete(null)} 
            onConfirm={confirmDelete}
            title="此筆支出項目"
       />

       {/* Settle Confirm Modal (Only for General) */}
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
