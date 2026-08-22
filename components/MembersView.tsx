
import React, { useState } from 'react';
import { Member, ScheduleItem, Currency, Expense } from '../types';
import { User, PenTool, X, Lock, Plus, Info, DollarSign, Navigation, Calendar, ArrowRight, CheckCircle2, Clock, Edit2, Trash2, Sparkles, Smile } from 'lucide-react';
import { AvatarPickerModal } from './AvatarPickerModal';
import { MemberAvatar } from './MemberAvatar';
import { getMemberAvatarSrc, getDefaultMemberAvatar } from '../constants/avatars';

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
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [avatarPickerContext, setAvatarPickerContext] = useState<'form' | 'direct'>('form');
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
          if (item.type === 'transport') {
              if (item.transitDetails) {
                  const transitCost = (Number(item.transitDetails.fare.discountedPrice) || 0) + (Number(item.transitDetails.fare.seatReservationFee) || 0);
                  processItemCost(item.id, item.date, item.title, '交通', transitCost, item.transitDetails.fare.currency || 'TWD', false, 0, item.transitDetails.participants || [], item.transitDetails.isPotential || false);
              } else if (item.carRental && item.carRental.hasRental) {
                  processItemCost(item.id, item.date, `${item.title} (租車)`, '交通', Number(item.carRental.rentalCost), item.carRental.rentalCurrency || 'TWD', item.carRental.hasServiceFee || false, Number(item.carRental.serviceFeePercentage), item.carRental.participants || [], item.carRental.isPotential || false);
              }
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
        setForm({ 
          id: pendingAction.payload.id, 
          name: pendingAction.payload.name, 
          avatar: pendingAction.payload.avatar || getDefaultMemberAvatar(pendingAction.payload.name || pendingAction.payload.id) 
        });
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
    if (!form.name.trim()) return;
    const finalAvatar = form.avatar || getDefaultMemberAvatar(form.name);
    if (pendingAction?.type === 'edit') {
      onUpdate({ ...pendingAction.payload, name: form.name.trim(), avatar: finalAvatar });
    } else {
      onAdd(form.name.trim(), finalAvatar);
    }
    setShowMemberModal(false);
    setPendingAction(null);
  };

  const handleOpenAvatarPickerForForm = () => {
    setAvatarPickerContext('form');
    setShowAvatarPicker(true);
  };

  const handleOpenAvatarPickerForSelected = () => {
    setAvatarPickerContext('direct');
    setShowAvatarPicker(true);
  };

  const handleSelectAvatar = (avatarUrl: string) => {
    if (avatarPickerContext === 'form') {
      setForm(prev => ({ ...prev, avatar: avatarUrl }));
    } else if (avatarPickerContext === 'direct' && selectedMemberData) {
      onUpdate({ ...selectedMemberData, avatar: avatarUrl });
    }
  };

  const selectedMemberData = selectedMemberId ? members.find(m => m.id === selectedMemberId) : null;
  const financial = selectedMemberId ? calculateMemberCosts(selectedMemberId) : { totalPotential: 0, breakdown: [] };

  return (
    <div className="space-y-6 p-4 lg:p-0 pb-24 lg:pb-0 h-full overflow-y-auto custom-scroll animate-scale-in">
        <div className="flex justify-between items-center px-1">
            <div>
              <h2 className="text-xl font-black text-cocoa flex items-center gap-2">
                <span>成員管理</span>
                <span className="text-xs bg-sage-light text-sage px-2.5 py-0.5 rounded-full font-bold border border-sage/30">
                  {members.length} 位夥伴
                </span>
              </h2>
            </div>
            <button 
              onClick={() => { 
                setPendingAction({type: 'add'}); 
                setForm({ id: '', name: '', avatar: getDefaultMemberAvatar(`member-${Date.now()}`) }); 
                setShowMemberModal(true); 
              }} 
              className="text-sm bg-sage text-white px-4 py-2 rounded-full shadow-hard-sage active:shadow-none active:translate-y-[4px] transition-all hover:bg-sage-dark font-black border-2 border-white flex items-center gap-1.5"
            >
                <Plus size={16} strokeWidth={3}/> 新增成員
            </button>
        </div>

        <div className="bg-white p-6 rounded-[2rem] shadow-hard-sm min-h-[50vh] border-2 border-beige-dark">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {members.map((member, idx) => {
                    const costs = calculateMemberCosts(member.id);
                    return (
                        <div 
                          key={member.id} 
                          onClick={() => setSelectedMemberId(member.id)} 
                          className="bg-gray-50/70 p-4 rounded-[1.8rem] flex flex-col items-center justify-center relative group hover:bg-beige transition-all border-2 border-beige-dark cursor-pointer hover:-translate-y-1 hover:border-sage shadow-sm"
                        >
                            {/* Cute Face Avatar Display */}
                            <div className="w-18 h-18 rounded-full bg-white mb-2 p-1 border-2 border-beige-dark group-hover:border-sage shadow-inner transition-colors flex items-center justify-center relative">
                                <MemberAvatar 
                                  avatar={member.avatar} 
                                  name={member.name} 
                                  id={member.id} 
                                  size="lg" 
                                  showBorder={false}
                                  className="w-16 h-16 transition-transform group-hover:scale-105"
                                />
                                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 border border-beige-dark shadow-sm text-xs leading-none">
                                  <Sparkles size={11} className="text-sage" />
                                </div>
                            </div>
                            
                            <span className="font-black text-cocoa text-base truncate w-full text-center mt-1 mb-2 px-1">
                              {member.name}
                            </span>

                            <div className="w-full bg-white rounded-xl p-2 border border-beige-dark text-center shadow-xs">
                                <p className="text-[9px] font-black text-gray-400 uppercase mb-0.5 tracking-wider">預計分攤總額</p>
                                <p className="text-sm font-black font-mono text-sage">NT$ {costs.totalPotential.toLocaleString()}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            <div className="mt-8 p-4 bg-emerald-50/70 rounded-2xl text-xs text-emerald-800 leading-relaxed border-2 border-emerald-100 font-bold flex gap-3 items-start">
                <div className="p-2 rounded-xl bg-white border border-emerald-200 text-emerald-600 flex-shrink-0 mt-0.5">
                  <Smile size={18} />
                </div>
                <div className="space-y-1">
                  <p className="font-black text-sm text-emerald-900">簡約可愛人物頭像與費用統計</p>
                  <ul className="list-disc list-inside space-y-0.5 text-emerald-700/90 text-[11px]">
                      <li>點擊成員卡片可查看個人花費明細，並可隨時更換簡約可愛的人物頭像。</li>
                      <li>精選可愛女孩與陽光男孩等多種清新髮型與表情造型，載入迅速不破圖。</li>
                  </ul>
                </div>
            </div>
        </div>

        {/* Member Details Modal */}
        {selectedMemberId && selectedMemberData && (
            <div className="fixed inset-0 bg-cocoa/50 z-[150] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSelectedMemberId(null)}>
                <div className="bg-[#FAF8F2] w-full max-w-md rounded-[2.5rem] p-6 shadow-2xl border-4 border-beige-dark animate-scale-in max-h-[85vh] overflow-y-auto custom-scroll relative" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setSelectedMemberId(null)} className="absolute top-4 right-4 p-2 bg-white rounded-full text-gray-400 border border-beige-dark shadow-sm hover:text-red-400 transition-colors"><X size={16}/></button>
                    
                    <div className="flex flex-col items-center mb-6">
                        <div className="relative group/avatar cursor-pointer" onClick={handleOpenAvatarPickerForSelected}>
                            <div className="w-22 h-22 rounded-full bg-white border-4 border-beige-dark overflow-hidden shadow-sm p-1">
                                <MemberAvatar 
                                  avatar={selectedMemberData.avatar} 
                                  name={selectedMemberData.name} 
                                  id={selectedMemberData.id} 
                                  size="xl" 
                                  showBorder={false}
                                  className="w-full h-full"
                                />
                            </div>
                            <button 
                              className="absolute -bottom-1 -right-1 bg-sage text-white p-2 rounded-full border-2 border-white shadow-md hover:bg-sage-dark transition-all text-xs flex items-center gap-1"
                              title="更換頭像"
                            >
                              <Smile size={14} strokeWidth={2.5} />
                            </button>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-3">
                           <h3 className="text-2xl font-black text-cocoa flex items-center gap-2">{selectedMemberData.name}</h3>
                           <button onClick={() => handleEditInit(selectedMemberData)} className="p-1.5 bg-white rounded-lg border border-beige-dark text-gray-300 hover:text-sage transition-colors shadow-sm" title="編輯名稱">
                             <Edit2 size={14} />
                           </button>
                        </div>

                        <button 
                          onClick={handleOpenAvatarPickerForSelected}
                          className="mt-2 text-xs font-black text-sage bg-white hover:bg-sage-light/40 px-3 py-1 rounded-full border border-sage/40 shadow-xs flex items-center gap-1.5 transition-all"
                        >
                          <Sparkles size={12} />
                          <span>更換可愛人臉頭像</span>
                        </button>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border-2 border-beige-dark text-center mb-6 shadow-xs">
                        <span className="text-[10px] font-black text-gray-400 block mb-1 uppercase tracking-wider">預計支出總計 (TWD)</span>
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

        {/* Password Modal */}
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

        {/* Add / Edit Member Modal */}
        {showMemberModal && (
            <div className="fixed inset-0 bg-cocoa/50 z-[300] flex items-center justify-center px-4 backdrop-blur-sm" onClick={() => setShowMemberModal(false)}>
                <div className="bg-[#FAF8F2] w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl border-4 border-beige-dark" onClick={e => e.stopPropagation()}>
                    <h3 className="font-black text-lg mb-4 text-center text-cocoa">
                      {pendingAction?.type === 'edit' ? '編輯成員資料' : '新增行程成員'}
                    </h3>

                    {/* Interactive Cute Avatar Selection preview */}
                    <div className="flex flex-col items-center mb-5">
                      <div 
                        onClick={handleOpenAvatarPickerForForm}
                        className="w-20 h-20 rounded-full bg-white border-3 border-sage p-1 shadow-md cursor-pointer hover:scale-105 transition-all relative group"
                        title="點擊挑選可愛人臉頭像"
                      >
                        <MemberAvatar 
                          avatar={form.avatar} 
                          name={form.name || '新成員'} 
                          size="xl" 
                          showBorder={false}
                          className="w-full h-full"
                        />
                        <div className="absolute inset-0 bg-black/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Smile size={20} className="text-white" />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleOpenAvatarPickerForForm}
                        className="mt-2 text-xs font-black text-sage bg-sage-light/60 hover:bg-sage-light px-3 py-1 rounded-full border border-sage/40 flex items-center gap-1 transition-all"
                      >
                        <Sparkles size={12} />
                        <span>挑選可愛頭像</span>
                      </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                           <label className="text-xs text-gray-400 font-bold ml-1 block mb-1">成員姓名</label>
                           <input 
                               value={form.name} 
                               onChange={e => setForm({...form, name: e.target.value})} 
                               type="text" 
                               className="w-full bg-white text-cocoa p-3 rounded-xl outline-none border-2 border-beige-dark font-black text-center text-lg placeholder-gray-300 focus:border-sage"
                               placeholder="請輸入成員名稱"
                               autoFocus
                           />
                        </div>
                    </div>
                    
                    <div className="flex gap-3 mt-8">
                      <button onClick={() => setShowMemberModal(false)} className="flex-1 py-3 rounded-2xl bg-white text-gray-400 font-black border-2 border-beige-dark hover:bg-gray-50 transition-all">
                        取消
                      </button>
                      <button onClick={handleSaveMember} className="flex-1 py-3 rounded-2xl bg-sage hover:bg-sage-dark text-white font-black shadow-hard-sage border-2 border-sage-dark transition-all">
                        儲存
                      </button>
                    </div>
                </div>
            </div>
        )}

        {/* Cute Avatar Picker Modal */}
        <AvatarPickerModal 
          isOpen={showAvatarPicker}
          onClose={() => setShowAvatarPicker(false)}
          currentAvatar={avatarPickerContext === 'form' ? form.avatar : (selectedMemberData?.avatar || null)}
          memberName={avatarPickerContext === 'form' ? (form.name || '新成員') : (selectedMemberData?.name || '成員')}
          onSelectAvatar={handleSelectAvatar}
        />
    </div>
  );
};

