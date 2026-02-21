
import React, { useState } from 'react';
import { Member, ScheduleItem, Currency, Expense } from '../types';
// Add missing Trash2 to the imports
import { User, PenTool, X, Lock, Plus, Info, DollarSign, Navigation, Calendar, ArrowRight, CheckCircle2, Clock, Edit2, Trash2 } from 'lucide-react';

interface MembersViewProps {
  members: Member[];
  scheduleItems: ScheduleItem[];
  expenses: Expense[];
  currencies: Currency[];
  onAdd: (name: string, avatar: string | null) => void;
  onUpdate: (member: Member) => void;
  onDelete: (id: string) => void;
  onJumpToSchedule: (date: string, itemId: string) => void;
  onJumpToExpense: (expenseId: string) => void;
}

export const MembersView: React.FC<MembersViewProps> = ({ 
  members, scheduleItems, expenses, currencies, onAdd, onUpdate, onDelete, onJumpToSchedule, onJumpToExpense 
}) => {
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordShake, setPasswordShake] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ type: 'add' | 'edit' | 'delete', payload?: any } | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [form, setForm] = useState<{ id: string; name: string; avatar: string | null }>({ id: '', name: '', avatar: null });

  const toTWD = (amount: number, currency: string) => {
    if (currency === 'TWD') return amount;
    const rate = currencies.find(c => c.code === currency)?.rate || 1;
    return amount * rate;
  };

  const calculateMemberCosts = (memberId: string) => {
      const member = members.find(m => m.id === memberId);
      if (!member) return { totalPotential: 0, breakdown: [] };
      
      let totalPotential = 0; 
      const breakdown: { id: string, date: string, title: string, amount: number, type: string, isPotential: boolean, category: 'schedule' | 'expense' }[] = [];

      const processItemCost = (id: string, date: string, title: string, type: string, cost: number, currency: string, hasFee: boolean, feePct: number, participants: string[], isPotential: boolean) => {
          if (participants && participants.includes(memberId)) {
              const base = Number(cost) || 0;
              const fee = hasFee ? base * (Number(feePct) || 0) / 100 : 0;
              const total = base + fee;
              const perPerson = total / participants.length;
              const twdAmount = toTWD(perPerson, currency);

              totalPotential += twdAmount;
              if (twdAmount > 0) {
                  breakdown.push({ id, date, title, amount: twdAmount, type, isPotential: true, category: 'schedule' });
              }
          }
      };

      scheduleItems.forEach(item => {
          if (item.type === 'flight' && item.flightDetails) {
              processItemCost(item.id, item.date, item.title, '機票', Number(item.flightDetails.cost), item.flightDetails.currency || 'TWD', item.flightDetails.hasServiceFee || false, Number(item.flightDetails.serviceFeePercentage), item.flightDetails.participants || [], item.flightDetails.isPotential || false);
          }
          if (item.type === 'stay' && item.stayDetails) {
              processItemCost(item.id, item.date, item.title, '住宿', Number(item.stayDetails.cost), item.stayDetails.currency || 'TWD', item.stayDetails.hasServiceFee || false, Number(item.stayDetails.serviceFeePercentage), item.stayDetails.participants || [], item.stayDetails.isPotential || false);
          }
          if (item.type === 'transport' && item.carRental && item.carRental.hasRental) {
              processItemCost(item.id, item.date, `${item.title} (租車)`, '交通', Number(item.carRental.rentalCost), item.carRental.rentalCurrency || 'TWD', item.carRental.hasServiceFee || false, Number(item.carRental.serviceFeePercentage), item.carRental.participants || [], item.carRental.isPotential || false);
          }
          if ((item.type === 'spot' || item.type === 'food') && item.spotDetails?.hasTicket) {
               processItemCost(item.id, item.date, item.title, item.type === 'food' ? '餐飲' : '門票', Number(item.spotDetails.ticketCost), item.spotDetails.currency || 'TWD', item.spotDetails.hasServiceFee || false, Number(item.spotDetails.serviceFeePercentage), item.spotDetails.participants || [], item.spotDetails.isPotential || false);
          }
      });

      return { totalPotential: Math.round(totalPotential), breakdown };
  };

    const handleEditInit = (member: Member) => {
    setPendingAction({ type: 'edit', payload: member });
    setPasswordInput('');
    setShowPasswordModal(true);
    setSelectedMemberId(null);
  };

  const handlePasswordConfirm = () => {
    if (passwordInput === '0000') {
      setShowPasswordModal(false);
      if (pendingAction?.type === 'edit') {
        setForm({ id: pendingAction.payload.id, name: pendingAction.payload.name, avatar: pendingAction.payload.avatar || null });
        setShowMemberModal(true);
      } else if (pendingAction?.type === 'delete') {
        onDelete(pendingAction.payload);
      }
    } else {
      setPasswordShake(true);
      setTimeout(() => setPasswordShake(false), 500);
      setPasswordInput('');
    }
  };

  const handleSaveMember = () => {
    if (!form.name) return;
    if (pendingAction?.type === 'edit') {
      onUpdate({ ...pendingAction.payload, name: form.name });
    } else {
      onAdd(form.name, null);
    }
    setShowMemberModal(false);
    setPendingAction(null);
  };

  const selectedMemberData = selectedMemberId ? members.find(m => m.id === selectedMemberId) : null;
  const financial = selectedMemberId ? calculateMemberCosts(selectedMemberId) : { totalPotential: 0, breakdown: [] };

  return (
    <div className="space-y-6 p-4 lg:p-0 pb-24 lg:pb-0 h-full overflow-y-auto custom-scroll animate-scale-in">
        <div className="flex justify-between items-center px-1">
            <h2 className="text-xl font-black text-cocoa">成員管理</h2>
            <button onClick={() => { setPendingAction({type: 'add'}); setForm({ id: '', name: '', avatar: null }); setShowMemberModal(true); }} className="text-sm bg-sage text-white px-4 py-2 rounded-full shadow-hard-sage active:shadow-none active:translate-y-[4px] transition-all hover:bg-sage-dark font-black border-2 border-white flex items-center gap-1">
                <Plus size={16} strokeWidth={3}/> 新增
            </button>
        </div>

        <div className="bg-white p-6 rounded-[2rem] shadow-hard-sm min-h-[50vh] border-2 border-beige-dark">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {members.map((member) => {
                    const costs = calculateMemberCosts(member.id);
                    return (
                        <div key={member.id} onClick={() => setSelectedMemberId(member.id)} className="bg-gray-50 p-4 rounded-[1.5rem] flex flex-col items-center justify-center relative group hover:bg-beige transition-all border-2 border-beige-dark cursor-pointer hover:-translate-y-1">
                            <div className="w-16 h-16 rounded-full bg-white mb-2 flex items-center justify-center text-gray-300 shadow-inner border-2 border-beige-dark overflow-hidden relative">
                                {member.avatar ? <img src={member.avatar} className="w-full h-full object-cover" loading="lazy" /> : <span className="text-2xl font-black text-gray-300">{member.name.charAt(0)}</span>}
                            </div>
                            <span className="font-black text-cocoa text-base truncate w-full text-center mb-1">{member.name}</span>
                            <span className="text-2xl drop-shadow-sm filter mb-2">{member.fruit || '🍎'}</span>
                            <div className="w-full bg-white rounded-xl p-2 border border-beige-dark text-center">
                                <p className="text-[9px] font-bold text-gray-400 uppercase mb-0.5">預計分攤總額</p>
                                <p className="text-sm font-black font-mono text-sage">NT$ {costs.totalPotential.toLocaleString()}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            <div className="mt-8 p-4 bg-blue-50 rounded-2xl text-xs text-blue-600 leading-relaxed border-2 border-blue-100 font-bold">
                <p className="font-black mb-1 flex items-center gap-1 text-sm"><Info size={16}/> 成員統計提示</p>
                <ul className="list-disc list-inside space-y-1 ml-1 opacity-90">
                    <li>此頁面統計「行程」中的預算花費 (門票、住宿等)。</li>
                    <li>實際開支 (如吃飯、購物) 請至「記帳」頁面查看。</li>
                    <li>點擊成員卡片可看詳細分攤清單並跳轉行程。</li>
                </ul>
            </div>
        </div>

        {selectedMemberId && selectedMemberData && (
            <div className="fixed inset-0 bg-cocoa/50 z-[150] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSelectedMemberId(null)}>
                <div className="bg-beige w-full max-w-md rounded-[2.5rem] p-6 shadow-2xl border-4 border-beige-dark animate-scale-in max-h-[85vh] overflow-y-auto custom-scroll relative" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setSelectedMemberId(null)} className="absolute top-4 right-4 p-2 bg-white rounded-full text-gray-400 border border-beige-dark shadow-sm hover:text-red-400 transition-colors"><X size={16}/></button>
                    
                    <div className="flex flex-col items-center mb-6">
                        <div className="w-20 h-20 rounded-full bg-white border-4 border-beige-dark overflow-hidden shadow-sm mb-3">
                            {selectedMemberData.avatar ? <img src={selectedMemberData.avatar} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-2xl font-black text-gray-300">{selectedMemberData.name[0]}</div>}
                        </div>
                        <div className="flex items-center gap-2">
                           <h3 className="text-2xl font-black text-cocoa flex items-center gap-2">{selectedMemberData.name} <span className="text-2xl">{selectedMemberData.fruit}</span></h3>
                           <button onClick={() => handleEditInit(selectedMemberData)} className="p-1.5 bg-white rounded-lg border border-beige-dark text-gray-300 hover:text-sage transition-colors shadow-sm">
                             <Edit2 size={14} />
                           </button>
                        </div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">個人預計花費結報</p>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border-2 border-beige-dark text-center mb-6">
                        <span className="text-[10px] font-bold text-gray-400 block mb-1">預計支出總計 (TWD)</span>
                        <span className="text-2xl font-black text-sage font-mono">NT$ {financial.totalPotential.toLocaleString()}</span>
                    </div>

                    <div className="space-y-3">
                        <h4 className="text-sm font-black text-cocoa flex items-center gap-2 mb-3"><DollarSign size={16} className="text-sage"/> 行程分攤明細</h4>
                        {financial.breakdown.length === 0 ? (
                            <div className="text-center py-10 text-gray-400 text-xs font-bold bg-white rounded-2xl border border-dashed border-beige-dark">尚未加入任何分攤行程</div>
                        ) : (
                            financial.breakdown.map((item, idx) => (
                                <div key={idx} onClick={() => { setSelectedMemberId(null); onJumpToSchedule(item.date, item.id); }} className="p-3 rounded-2xl border border-beige-dark bg-white flex justify-between items-center gap-3 cursor-pointer transition-all active:scale-[0.98]">
                                    <div className="flex gap-3 items-center flex-1 min-w-0">
                                        <div className="p-2 rounded-xl bg-gray-50 text-gray-400 border border-beige-dark"><Clock size={16}/></div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-sm font-black text-cocoa truncate">{item.title}</span>
                                            <span className="text-[9px] font-bold text-gray-400">{item.type} • {item.date}</span>
                                        </div>
                                    </div>
                                    <div className="text-right flex items-center gap-2">
                                        <span className="text-sm font-black text-cocoa font-mono">NT$ {Math.round(item.amount).toLocaleString()}</span>
                                        <ArrowRight size={14} className="text-gray-300"/>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    
                    <div className="mt-8 flex justify-center">
                        <button 
                            onClick={() => {
                                setPendingAction({ type: 'delete', payload: selectedMemberData.id });
                                setPasswordInput('');
                                setShowPasswordModal(true);
                            }}
                            className="text-xs font-bold text-red-300 hover:text-red-500 transition-colors flex items-center gap-1"
                        >
                            <Trash2 size={12} /> 刪除成員
                        </button>
                    </div>
                </div>
            </div>
        )}

        {showPasswordModal && (
            <div className="fixed inset-0 bg-cocoa/50 z-[400] flex items-center justify-center px-4 backdrop-blur-sm">
                <div className={`bg-beige w-full max-w-xs rounded-[2rem] p-6 shadow-2xl text-center border-4 border-beige-dark ${passwordShake ? 'animate-shake' : ''}`}>
                    <div className="w-14 h-14 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-3 border-2 border-teal-100"><Lock size={24}/></div>
                    <h3 className="font-black text-lg text-cocoa mb-4">管理員權限確認</h3>
                    <input type="password" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} placeholder="0000" className="w-full text-center bg-white border-2 border-beige-dark p-3 rounded-xl outline-none text-lg font-bold mb-4" autoFocus />
                    <div className="flex gap-2"><button onClick={() => setShowPasswordModal(false)} className="flex-1 py-2 text-gray-400 font-bold">取消</button><button onClick={handlePasswordConfirm} className="flex-1 py-2 bg-sage text-white rounded-xl font-black">確認</button></div>
                </div>
            </div>
        )}

        {showMemberModal && (
            <div className="fixed inset-0 bg-cocoa/50 z-[300] flex items-center justify-center px-4 backdrop-blur-sm">
                <div className="bg-beige w-full max-w-sm rounded-[2rem] p-6 shadow-2xl border-4 border-beige-dark">
                    <h3 className="font-black text-lg mb-6 text-center text-cocoa">{pendingAction?.type === 'edit' ? '重新命名成員' : '新增行程成員'}</h3>
                    <div className="space-y-4">
                        <div>
                           <label className="text-xs text-gray-400 font-bold ml-1">名稱</label>
                           <input 
                               value={form.name} 
                               onChange={e => setForm({...form, name: e.target.value})} 
                               type="text" 
                               className="w-full bg-white text-cocoa p-3 rounded-xl outline-none border-2 border-beige-dark font-black text-center text-lg placeholder-gray-300"
                               placeholder="成員名稱"
                               autoFocus
                           />
                        </div>
                    </div>
                    <div className="flex gap-3 mt-8"><button onClick={() => setShowMemberModal(false)} className="flex-1 py-3 rounded-2xl bg-white text-gray-400 font-black border-2 border-beige-dark">取消</button><button onClick={handleSaveMember} className="flex-1 py-3 rounded-2xl bg-sage text-white font-black shadow-hard-sage border-2 border-sage-dark">儲存</button></div>
                </div>
            </div>
        )}
    </div>
  );
};
