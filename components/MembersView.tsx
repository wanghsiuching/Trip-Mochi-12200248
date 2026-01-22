
import React, { useState } from 'react';
import { Member, ScheduleItem, Currency, Expense } from '../types';
import { User, PenTool, X, Lock, Plus, Info, DollarSign, Navigation, Calendar, ArrowRight, CheckCircle2, Clock } from 'lucide-react';

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
  
  // Detail Modal State
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [jumpTarget, setJumpTarget] = useState<{ id: string, date: string, title: string, type: 'schedule' | 'expense' } | null>(null);
  
  const [form, setForm] = useState<{ id: string; name: string; avatar: string | null }>({ id: '', name: '', avatar: null });

  // Helper for TWD conversion
  const toTWD = (amount: number, currency: string) => {
    if (currency === 'TWD') return amount;
    const rate = currencies.find(c => c.code === currency)?.rate || 1;
    return amount * rate;
  };

  // Calculate Member Costs
  const calculateMemberCosts = (memberId: string) => {
      const member = members.find(m => m.id === memberId);
      if (!member) return { totalShared: 0, totalPotential: 0, totalSettled: 0, totalPending: 0, breakdown: [] };
      
      let totalShared = 0; // Confirmed real expenses
      let totalSettled = 0; // Portions of real expenses paid/payer
      let totalPending = 0; // Portions of real expenses still owed
      let totalPotential = 0; // Estimated future costs from schedule
      
      const breakdown: { id: string, date: string, title: string, amount: number, type: string, isPotential: boolean, isSettled?: boolean, category: 'schedule' | 'expense' }[] = [];

      // 1. Process real expenses
      expenses.forEach(exp => {
        if (exp.involvedMembers?.includes(member.name)) {
          const expTWD = toTWD(exp.amount, exp.currency);
          const splitCount = exp.involvedMembers.length || 1;
          const myShare = expTWD / splitCount;
          const isSettled = exp.payer === member.name || (exp.settledMembers || []).includes(member.name);

          totalShared += myShare;
          if (isSettled) totalSettled += myShare;
          else totalPending += myShare;

          breakdown.push({
            id: exp.id.toString(),
            date: exp.date,
            title: exp.title,
            amount: myShare,
            type: '支出',
            isPotential: false,
            isSettled,
            category: 'expense'
          });
        }
      });

      // 2. Process schedule potential costs
      const processItemCost = (id: string, date: string, title: string, type: string, cost: number, currency: string, hasFee: boolean, feePct: number, participants: string[], isPotential: boolean) => {
          if (participants && participants.includes(memberId)) {
              const base = Number(cost) || 0;
              const fee = hasFee ? base * (Number(feePct) || 0) / 100 : 0;
              const total = base + fee;
              const perPerson = total / participants.length;
              const twdAmount = toTWD(perPerson, currency);

              if (isPotential) {
                  totalPotential += twdAmount;
                  if (twdAmount > 0) {
                      breakdown.push({
                          id,
                          date,
                          title,
                          amount: twdAmount,
                          type,
                          isPotential: true,
                          category: 'schedule'
                      });
                  }
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

      return { totalShared: Math.round(totalShared), totalPotential: Math.round(totalPotential), totalSettled: Math.round(totalSettled), totalPending: Math.round(totalPending), breakdown };
  };

  const initiateAction = (action: { type: 'add' | 'edit' | 'delete', payload?: any }) => {
      if (action.type === 'edit') {
          setForm({ ...action.payload });
          setShowMemberModal(true);
      } else {
          setPendingAction(action);
          setPasswordInput('');
          setShowPasswordModal(true);
      }
  };

  const checkPassword = () => {
      if (passwordInput === '0000') {
          setShowPasswordModal(false);
          if (pendingAction?.type === 'add') {
              setForm({ id: '', name: '', avatar: null });
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

  const handleSave = () => {
      if (!form.name) return;
      if (pendingAction?.type === 'add') {
          onAdd(form.name, null);
      } else {
          onUpdate({ ...form, fruit: members.find(m => m.id === form.id)?.fruit } as Member);
      }
      setShowMemberModal(false);
      setPendingAction(null);
  };

  const confirmJump = () => {
      if (jumpTarget) {
          if (jumpTarget.type === 'schedule') {
            onJumpToSchedule(jumpTarget.date, jumpTarget.id);
          } else {
            onJumpToExpense(jumpTarget.id);
          }
          setJumpTarget(null);
          setSelectedMemberId(null);
      }
  };

  const selectedMemberData = selectedMemberId ? members.find(m => m.id === selectedMemberId) : null;
  const financial = selectedMemberId ? calculateMemberCosts(selectedMemberId) : { totalShared: 0, totalPotential: 0, totalSettled: 0, totalPending: 0, breakdown: [] };

  return (
    <div className="space-y-6 p-4 lg:p-0 pb-24 lg:pb-0 h-full overflow-y-auto custom-scroll animate-scale-in">
        <div className="flex justify-between items-center px-1">
            <h2 className="text-xl font-black text-cocoa">成員管理</h2>
            <button onClick={() => initiateAction({ type: 'add' })} className="text-sm bg-sage text-white px-4 py-2 rounded-full shadow-hard-sage active:shadow-none active:translate-y-[4px] transition-all hover:bg-sage-dark font-black border-2 border-white flex items-center gap-1">
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
                                {member.avatar ? (
                                    <img src={member.avatar} className="w-full h-full object-cover" loading="lazy" />
                                ) : (
                                    <span className="text-2xl font-black text-gray-300">{member.name.charAt(0)}</span>
                                )}
                            </div>
                            <span className="font-black text-cocoa text-base truncate w-full text-center mb-1">{member.name}</span>
                            <div className="flex items-center gap-1 mb-2">
                                <span className="text-2xl drop-shadow-sm filter">{member.fruit || '🍎'}</span>
                            </div>
                            
                            <div className="w-full bg-white rounded-xl p-2 border border-beige-dark text-center">
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">未清帳款</p>
                                <p className={`text-sm font-black font-mono ${costs.totalPending > 0 ? 'text-orange-500' : 'text-sage'}`}>NT$ {costs.totalPending.toLocaleString()}</p>
                            </div>

                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={(e) => { e.stopPropagation(); initiateAction({ type: 'edit', payload: member }); }} className="text-gray-400 hover:text-sage p-1.5 bg-white rounded-full border border-gray-200 shadow-sm"><PenTool size={12}/></button>
                                {members.length > 1 && (
                                    <button onClick={(e) => { e.stopPropagation(); initiateAction({ type: 'delete', payload: member.id }); }} className="text-gray-400 hover:text-red-400 p-1.5 bg-white rounded-full border border-gray-200 shadow-sm"><X size={12}/></button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
            
            <div className="mt-8 p-4 bg-teal-50 rounded-2xl text-xs text-teal-600 leading-relaxed border-2 border-teal-100 font-bold">
                <p className="font-black mb-1 flex items-center gap-1 text-sm"><Info size={16}/> 修璟提示</p>
                <ul className="list-disc list-inside space-y-1 ml-1 opacity-90">
                    <li>記帳頁面可標記成員是否已補繳費。</li>
                    <li>點擊成員卡片可看個人收支明細，並可快速跳轉。</li>
                    <li>代墊金額為本人付款總額，應付份額為參與分攤後的總額。</li>
                </ul>
            </div>
        </div>

        {/* Member Detail & Cost Modal */}
        {selectedMemberId && selectedMemberData && (
            <div className="fixed inset-0 bg-cocoa/50 z-[150] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSelectedMemberId(null)}>
                <div className="bg-beige w-full max-w-md rounded-[2.5rem] p-6 shadow-2xl border-4 border-beige-dark animate-scale-in max-h-[85vh] overflow-y-auto custom-scroll relative" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setSelectedMemberId(null)} className="absolute top-4 right-4 p-2 bg-white rounded-full text-gray-400 hover:text-cocoa border border-beige-dark shadow-sm"><X size={16}/></button>
                    
                    <div className="flex flex-col items-center mb-6">
                        <div className="w-20 h-20 rounded-full bg-white border-4 border-beige-dark overflow-hidden shadow-sm mb-3">
                            {selectedMemberData.avatar ? <img src={selectedMemberData.avatar} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-2xl font-black text-gray-300">{selectedMemberData.name[0]}</div>}
                        </div>
                        <h3 className="text-2xl font-black text-cocoa flex items-center gap-2">
                            {selectedMemberData.name} <span className="text-2xl">{selectedMemberData.fruit}</span>
                        </h3>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">個人收支結報</p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-6">
                        <div className="bg-white p-3 rounded-2xl border-2 border-beige-dark text-center">
                            <span className="text-[9px] font-bold text-gray-400 block mb-1">應付份額</span>
                            <span className="text-sm font-black text-cocoa font-mono">{financial.totalShared.toLocaleString()}</span>
                        </div>
                        <div className="bg-sage-light/30 p-3 rounded-2xl border-2 border-sage/20 text-center">
                            <span className="text-[9px] font-bold text-sage block mb-1">已繳清</span>
                            <span className="text-sm font-black text-sage font-mono">{financial.totalSettled.toLocaleString()}</span>
                        </div>
                        <div className="bg-orange-50 p-3 rounded-2xl border-2 border-orange-100 text-center">
                            <span className="text-[9px] font-bold text-orange-400 block mb-1">待補繳</span>
                            <span className="text-sm font-black text-orange-500 font-mono">{financial.totalPending.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h4 className="text-sm font-black text-cocoa flex items-center gap-2 mb-3"><DollarSign size={16} className="text-sage"/> 分攤明細 (點擊跳轉明細)</h4>
                        {financial.breakdown.length === 0 ? (
                            <div className="text-center py-10 text-gray-400 text-xs font-bold bg-white rounded-2xl border border-dashed border-beige-dark">暫無分攤紀錄</div>
                        ) : (
                            financial.breakdown.map((item, idx) => (
                                <div 
                                    key={idx} 
                                    onClick={() => setJumpTarget({ id: item.id, date: item.date, title: item.title, type: item.category })}
                                    className={`p-3 rounded-2xl border flex justify-between items-center gap-3 cursor-pointer transition-all active:scale-[0.98] ${item.isPotential ? 'bg-yellow-50 border-yellow-100' : item.isSettled ? 'bg-white border-beige-dark' : 'bg-orange-50 border-orange-100 ring-1 ring-orange-100/50'}`}
                                >
                                    <div className="flex gap-3 items-center flex-1 min-w-0">
                                        <div className={`p-2 rounded-xl ${item.isPotential ? 'bg-yellow-200 text-yellow-700' : item.isSettled ? 'bg-sage-light text-sage' : 'bg-white text-orange-400 shadow-sm'}`}>
                                            {item.isPotential ? <Clock size={16}/> : item.isSettled ? <CheckCircle2 size={16}/> : <Clock size={16}/>}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-sm font-black text-cocoa truncate">{item.title}</span>
                                            <span className="text-[9px] font-bold text-gray-400">{item.date}</span>
                                        </div>
                                    </div>
                                    <div className="text-right flex items-center gap-2">
                                        <div className="flex flex-col">
                                            <span className={`text-sm font-black font-mono ${item.isSettled ? 'text-gray-400' : 'text-orange-500'}`}>NT$ {Math.round(item.amount).toLocaleString()}</span>
                                            <span className="text-[8px] font-bold text-gray-300 uppercase">{item.isPotential ? 'POTENTIAL' : item.isSettled ? 'SETTLED' : 'UNPAID'}</span>
                                        </div>
                                        <ArrowRight size={14} className="text-gray-300"/>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    
                    <div className="mt-6 flex justify-center">
                        <button onClick={() => { setSelectedMemberId(null); initiateAction({ type: 'edit', payload: selectedMemberData }); }} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cocoa text-white font-bold text-sm shadow-hard-sm active:translate-y-1 active:shadow-none transition-all">
                            <PenTool size={14}/> 編輯成員資料
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Jump Confirm Modal */}
        {jumpTarget && (
            <div className="fixed inset-0 bg-cocoa/50 z-[200] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setJumpTarget(null)}>
                <div className="bg-white w-full max-w-xs rounded-[2rem] p-6 shadow-2xl animate-scale-in border-4 border-beige-dark text-center" onClick={e => e.stopPropagation()}>
                    <div className="w-14 h-14 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-3 border-2 border-blue-100">
                        <Navigation size={24} />
                    </div>
                    <h3 className="font-black text-lg text-cocoa mb-2">跳轉至{jumpTarget.type === 'schedule' ? '行程' : '記帳'}?</h3>
                    <p className="text-xs text-gray-400 mb-6 font-bold leading-relaxed">
                        是否前往查看<br/><span className="text-cocoa text-sm">{jumpTarget.title}</span> 的詳細內容？
                    </p>
                    <div className="flex gap-2">
                        <button onClick={() => setJumpTarget(null)} className="flex-1 py-3 rounded-xl font-bold text-gray-400 bg-gray-100 hover:bg-gray-200 transition-colors">取消</button>
                        <button onClick={confirmJump} className="flex-1 py-3 rounded-xl font-bold text-white bg-blue-500 hover:bg-blue-600 shadow-hard-sm border-2 border-blue-600 active:translate-y-1 active:shadow-none transition-all">前往</button>
                    </div>
                </div>
            </div>
        )}

        {/* Password Modal */}
        {showPasswordModal && (
            <div className="fixed inset-0 bg-cocoa/50 z-[200] flex items-center justify-center px-4 backdrop-blur-sm">
                <div className={`bg-beige w-full max-w-xs rounded-[2rem] p-6 shadow-2xl animate-scale-in text-center border-4 border-beige-dark ${passwordShake ? 'animate-shake' : ''}`}>
                    <div className="w-14 h-14 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-3 border-2 border-teal-100"><Lock size={24}/></div>
                    <h3 className="font-black text-lg text-cocoa mb-1">身分確認</h3>
                    <p className="text-xs text-gray-400 mb-4 font-bold">此操作需要管理權限</p>
                    <input type="password" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} placeholder="請輸入密碼 (0000)" className="w-full text-center bg-white text-cocoa border-2 border-beige-dark p-3 rounded-xl outline-none focus:border-sage text-lg tracking-widest mb-4 font-bold placeholder-gray-300"/>
                    <div className="flex gap-2"><button onClick={() => setShowPasswordModal(false)} className="flex-1 py-2 text-gray-400 text-sm hover:text-cocoa font-bold">取消</button><button onClick={checkPassword} className="flex-1 py-2 bg-sage text-white rounded-xl font-black text-sm shadow-hard-sm-sage active:shadow-none active:translate-y-[3px] transition-all border border-sage-dark">確認</button></div>
                </div>
            </div>
        )}

        {/* Member Edit/Add Modal */}
        {showMemberModal && (
            <div className="fixed inset-0 bg-cocoa/50 z-[100] flex items-center justify-center px-4 backdrop-blur-sm">
                <div className="bg-beige w-full max-w-sm rounded-[2rem] p-6 shadow-2xl animate-scale-in border-4 border-beige-dark">
                    <h3 className="font-black text-lg mb-4 text-cocoa text-center bg-white px-4 py-1 rounded-full w-max mx-auto border border-beige-dark">{form.id ? '編輯成員' : '新增成員'}</h3>
                    <div className="flex flex-col items-center mb-6">
                        <div className="relative w-24 h-24 rounded-full bg-white mb-3 border-4 border-beige-dark overflow-hidden flex items-center justify-center text-gray-300 shadow-sm">
                            <User size={40}/>
                        </div>
                    </div>
                    <div className="space-y-3"><div><label className="text-xs text-gray-400 font-bold ml-1">名稱</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} type="text" placeholder="例如：小明" className="w-full bg-white text-cocoa p-3 rounded-xl outline-none focus:border-sage text-center font-black text-lg border-2 border-beige-dark placeholder-gray-300"/></div></div>
                    <div className="flex gap-3 mt-6"><button onClick={() => setShowMemberModal(false)} className="flex-1 py-3 rounded-2xl bg-white text-gray-400 font-black hover:bg-gray-50 border-2 border-beige-dark">取消</button><button onClick={handleSave} className="flex-1 py-3 rounded-2xl bg-sage text-white font-black shadow-hard-sage active:shadow-none active:translate-y-[4px] transition-all border-2 border-sage-dark">保存</button></div>
                </div>
            </div>
        )}
    </div>
  );
};
