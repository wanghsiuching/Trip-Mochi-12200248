
import React, { useState } from 'react';
import { Member, ScheduleItem, Currency, Expense } from '../types';
import { User, PenTool, X, Lock, Plus, Info, DollarSign, Navigation, Calendar, ArrowRight, CheckCircle2, Clock, Edit2, Trash2, Sparkles, Smile } from 'lucide-react';
import { AvatarPickerModal } from './AvatarPickerModal';
import { MemberAvatar } from './MemberAvatar';
import { getMemberAvatarSrc, getDefaultMemberAvatar } from '../constants/avatars';
import { getTransitEffectiveFare } from './TransitComponents';

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
          const base = Number(cost) || 0;
          if (base <= 0) return; // 實付費用為 0 時不計入分攤總計與明細

          const effectiveParticipants = (participants && participants.length > 0) ? participants : members.map(m => m.id);
          if (effectiveParticipants.includes(memberId)) {
              const fee = hasFee ? base * (Number(feePct) || 0) / 100 : 0;
              const total = base + fee;
              if (total <= 0) return;
              const perPerson = total / (effectiveParticipants.length || 1);
              const twdAmount = toTWD(perPerson, currency);

              totalPotential += twdAmount;
              if (twdAmount > 0 && Math.round(twdAmount) > 0) {
                  breakdown.push({ id, date, title, amount: Math.round(twdAmount), type, isPotential: true, category: 'schedule' });
              }
          }
      };

      scheduleItems.forEach(item => {
          if (item.type === 'flight' && item.flightDetails) {
              processItemCost(item.id, item.date, item.title, '機票', Number(item.flightDetails.cost) || 0, item.flightDetails.currency || 'TWD', item.flightDetails.hasServiceFee || false, Number(item.flightDetails.serviceFeePercentage) || 0, item.flightDetails.participants || [], item.flightDetails.isPotential || false);
          }
          if (item.type === 'stay' && item.stayDetails) {
              processItemCost(item.id, item.date, item.title, '住宿', Number(item.stayDetails.cost) || 0, item.stayDetails.currency || 'TWD', item.stayDetails.hasServiceFee || false, Number(item.stayDetails.serviceFeePercentage) || 0, item.stayDetails.participants || [], item.stayDetails.isPotential || false);
          }
          if (item.type === 'transport') {
              if (item.transitDetails) {
                  const { mainAmount, mainCurrency, extraItems } = getTransitEffectiveFare(item.transitDetails.fare);
                  const participants = (item.transitDetails.participants && item.transitDetails.participants.length > 0)
                    ? item.transitDetails.participants
                    : members.map(m => m.id);

                  if (mainAmount > 0) {
                    processItemCost(
                      item.id, 
                      item.date, 
                      `${item.title} (大眾交通)`, 
                      '交通', 
                      mainAmount, 
                      mainCurrency, 
                      item.transitDetails.fare?.hasServiceFee || false, 
                      Number(item.transitDetails.fare?.serviceFeePercentage) || 0, 
                      participants, 
                      item.transitDetails.isPotential || false
                    );
                  }
                  if (Array.isArray(extraItems) && extraItems.length > 0) {
                    extraItems.forEach((extraItem) => {
                      if (extraItem.amount > 0) {
                        processItemCost(
                          item.id, 
                          item.date, 
                          `${item.title} (${extraItem.name})`, 
                          '交通', 
                          extraItem.amount, 
                          extraItem.currency, 
                          extraItem.hasServiceFee || false, 
                          Number(extraItem.serviceFeePercentage) || 0, 
                          participants, 
                          item.transitDetails?.isPotential || false
                        );
                      }
                    });
                  }
              } else if (item.carRental && item.carRental.hasRental) {
                  processItemCost(item.id, item.date, `${item.title} (租車)`, '交通', Number(item.carRental.rentalCost) || 0, item.carRental.rentalCurrency || 'TWD', item.carRental.hasServiceFee || false, Number(item.carRental.serviceFeePercentage) || 0, item.carRental.participants || [], item.carRental.isPotential || false);
              }
          }
          if ((item.type === 'spot' || item.type === 'food') && item.spotDetails?.hasTicket) {
               processItemCost(item.id, item.date, item.title, item.type === 'food' ? '餐飲' : '門票', Number(item.spotDetails.ticketCost) || 0, item.spotDetails.currency || 'TWD', item.spotDetails.hasServiceFee || false, Number(item.spotDetails.serviceFeePercentage) || 0, item.spotDetails.participants || [], item.spotDetails.isPotential || false);
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
        </div>

        {/* Member Details Modal */}
        {selectedMemberId && selectedMemberData && (
            <div className="fixed inset-0 bg-cocoa/60 z-[150] flex flex-col items-center justify-end sm:justify-center sm:p-4 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedMemberId(null)}>
                <div className="bg-[#FAF8F2] w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-lg sm:rounded-[2.5rem] rounded-none p-5 sm:p-6 shadow-2xl border-0 sm:border-4 sm:border-beige-dark flex flex-col overflow-hidden relative" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center pb-3 border-b-2 border-beige-dark flex-shrink-0">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-sage bg-sage-light/60 px-2.5 py-1 rounded-full">成員詳細資料</span>
                        </div>
                        <button onClick={() => setSelectedMemberId(null)} className="p-2.5 bg-white rounded-full text-gray-400 border border-beige-dark shadow-sm hover:text-red-400 transition-colors active:scale-95"><X size={18}/></button>
                    </div>
                    
                    <div className="overflow-y-auto custom-scroll flex-1 py-4 pr-1 space-y-5">
                        <div className="flex flex-col items-center">
                            <div className="relative group/avatar cursor-pointer" onClick={handleOpenAvatarPickerForSelected}>
                                <div className="w-24 h-24 rounded-full bg-white border-4 border-beige-dark overflow-hidden shadow-sm p-1">
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
                                  className="absolute -bottom-1 -right-1 bg-sage text-white p-2.5 rounded-full border-2 border-white shadow-md hover:bg-sage-dark transition-all text-xs flex items-center gap-1"
                                  title="更換可愛頭像"
                                >
                                  <Smile size={16} strokeWidth={2.5} />
                                </button>
                            </div>
                            
                            <div className="flex items-center gap-2 mt-3">
                               <h3 className="text-2xl font-black text-cocoa flex items-center gap-2">{selectedMemberData.name}</h3>
                               <button onClick={() => handleEditInit(selectedMemberData)} className="p-2 bg-white rounded-xl border border-beige-dark text-gray-400 hover:text-sage transition-colors shadow-sm" title="編輯名稱">
                                 <Edit2 size={15} />
                               </button>
                            </div>

                            <button 
                              onClick={handleOpenAvatarPickerForSelected}
                              className="mt-2.5 text-xs font-black text-sage bg-white hover:bg-sage-light/40 px-3.5 py-1.5 rounded-full border border-sage/40 shadow-xs flex items-center gap-1.5 transition-all active:scale-95"
                            >
                              <Sparkles size={14} />
                              <span>更換可愛人臉頭像</span>
                            </button>
                        </div>

                        <div className="bg-white p-4 rounded-2xl border-2 border-beige-dark text-center shadow-xs">
                            <span className="text-[11px] font-black text-gray-400 block mb-1 uppercase tracking-wider">預計支出總計 (TWD)</span>
                            <span className="text-3xl font-black text-sage font-mono">NT$ {financial.totalPotential.toLocaleString()}</span>
                        </div>

                        <div className="space-y-3">
                            <h4 className="text-sm font-black text-cocoa flex items-center gap-2 mb-2"><DollarSign size={16} className="text-sage"/> 行程分攤明細</h4>
                            {financial.breakdown.length === 0 ? (
                                <div className="text-center py-10 text-gray-400 text-xs font-bold bg-white rounded-2xl border border-dashed border-beige-dark">尚未加入任何分攤行程</div>
                            ) : (
                                financial.breakdown.map((item, idx) => (
                                    <div key={idx} onClick={() => { setSelectedMemberId(null); onJumpToSchedule(item.date, item.id); }} className="p-3.5 rounded-2xl border border-beige-dark bg-white flex justify-between items-center gap-3 cursor-pointer transition-all active:scale-[0.98] hover:border-sage/40 shadow-xs">
                                        <div className="flex gap-3 items-center flex-1 min-w-0">
                                            <div className="p-2.5 rounded-xl bg-gray-50 text-gray-400 border border-beige-dark flex-shrink-0"><Clock size={16}/></div>
                                            <div className="flex flex-col min-w-0 flex-1">
                                                <span className="text-sm font-black text-cocoa break-words leading-tight">{item.title}</span>
                                                <span className="text-[10px] font-bold text-gray-400">{item.type} • {item.date}</span>
                                            </div>
                                        </div>
                                        <div className="text-right flex items-center gap-2 flex-shrink-0">
                                            <span className="text-sm font-black text-cocoa font-mono">NT$ {Math.round(item.amount).toLocaleString()}</span>
                                            <ArrowRight size={14} className="text-gray-300"/>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                    
                    <div className="pt-3 border-t-2 border-beige-dark flex justify-between items-center mt-auto flex-shrink-0 bg-[#FAF8F2]">
                        <button 
                            onClick={() => {
                                setPendingAction({ type: 'delete', payload: selectedMemberData.id });
                                setPasswordInput('');
                                setShowPasswordModal(true);
                            }}
                            className="text-xs font-bold text-red-400 hover:text-red-600 transition-colors flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 border border-red-200"
                        >
                            <Trash2 size={13} /> 刪除成員
                        </button>
                        <button
                            onClick={() => setSelectedMemberId(null)}
                            className="px-6 py-2.5 bg-sage text-white font-black rounded-xl text-xs shadow-sm hover:bg-sage-dark transition-all"
                        >
                            關閉
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Password Modal */}
        {showPasswordModal && (
            <div className="fixed inset-0 bg-cocoa/60 z-[400] flex flex-col items-center justify-end sm:justify-center sm:p-4 backdrop-blur-sm animate-fade-in" onClick={() => setShowPasswordModal(false)}>
                <div className={`bg-[#FAF8F2] w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-sm sm:rounded-[2.5rem] rounded-none p-5 sm:p-6 shadow-2xl border-0 sm:border-4 sm:border-beige-dark flex flex-col justify-between overflow-hidden ${passwordShake ? 'animate-shake' : ''}`} onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center pb-3 border-b-2 border-beige-dark flex-shrink-0 sm:hidden">
                        <h3 className="font-black text-lg text-cocoa">權限確認</h3>
                        <button onClick={() => setShowPasswordModal(false)} className="p-2 bg-white rounded-full text-gray-400 hover:text-red-400 border border-beige-dark shadow-sm transition-colors">
                            <X size={18}/>
                        </button>
                    </div>
                    <div className="my-auto py-6 text-center">
                        <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-teal-100 shadow-sm"><Lock size={28}/></div>
                        <h3 className="font-black text-xl text-cocoa mb-2">管理員權限確認</h3>
                        <p className="text-gray-400 text-xs font-bold mb-4">請輸入通行密碼進行管理操作</p>
                        <input type="password" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} placeholder="0000" className="w-full max-w-xs mx-auto text-center bg-white border-2 border-beige-dark p-3.5 rounded-2xl outline-none text-xl font-bold shadow-sm" autoFocus />
                    </div>
                    <div className="flex gap-3 pt-3 border-t-2 border-beige-dark mt-auto flex-shrink-0">
                        <button onClick={() => setShowPasswordModal(false)} className="flex-1 py-4 rounded-2xl bg-white text-gray-400 font-bold border-2 border-beige-dark hover:bg-gray-50 transition-colors">取消</button>
                        <button onClick={handlePasswordConfirm} className="flex-1 py-4 rounded-2xl bg-sage text-white font-bold shadow-hard-sage border-2 border-sage-dark active:translate-y-1 active:shadow-none transition-all">確認</button>
                    </div>
                </div>
            </div>
        )}

        {/* Add / Edit Member Modal */}
        {showMemberModal && (
            <div className="fixed inset-0 bg-cocoa/60 z-[300] flex flex-col items-center justify-end sm:justify-center sm:p-4 backdrop-blur-sm animate-fade-in" onClick={() => setShowMemberModal(false)}>
                <div className="bg-[#FAF8F2] w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-md sm:rounded-[2.5rem] rounded-none p-5 sm:p-6 shadow-2xl border-0 sm:border-4 sm:border-beige-dark flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center pb-3 border-b-2 border-beige-dark flex-shrink-0">
                        <h3 className="font-black text-lg text-cocoa">
                          {pendingAction?.type === 'edit' ? '編輯成員資料' : '新增行程成員'}
                        </h3>
                        <button onClick={() => setShowMemberModal(false)} className="p-2 bg-white rounded-full text-gray-400 hover:text-red-400 border border-beige-dark shadow-sm transition-colors">
                          <X size={16} />
                        </button>
                    </div>

                    <div className="overflow-y-auto custom-scroll flex-1 py-6 flex flex-col items-center justify-center space-y-6">
                        {/* Interactive Cute Avatar Selection preview */}
                        <div className="flex flex-col items-center">
                          <div 
                            onClick={handleOpenAvatarPickerForForm}
                            className="w-24 h-24 rounded-full bg-white border-3 border-sage p-1.5 shadow-md cursor-pointer hover:scale-105 transition-all relative group"
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
                              <Smile size={24} className="text-white" />
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={handleOpenAvatarPickerForForm}
                            className="mt-3 text-xs font-black text-sage bg-sage-light/70 hover:bg-sage-light px-4 py-1.5 rounded-full border border-sage/40 flex items-center gap-1.5 transition-all shadow-xs"
                          >
                            <Sparkles size={14} />
                            <span>挑選可愛頭像</span>
                          </button>
                        </div>

                        <div className="w-full space-y-2 max-w-xs">
                           <label className="text-xs text-gray-400 font-bold ml-1 block">成員姓名</label>
                           <input 
                               value={form.name} 
                               onChange={e => setForm({...form, name: e.target.value})} 
                               type="text" 
                               className="w-full bg-white text-cocoa p-3.5 rounded-2xl outline-none border-2 border-beige-dark font-black text-center text-lg placeholder-gray-300 focus:border-sage shadow-xs"
                               placeholder="請輸入成員名稱"
                               autoFocus
                           />
                        </div>
                    </div>
                    
                    <div className="flex gap-3 pt-3 border-t-2 border-beige-dark mt-auto flex-shrink-0 bg-[#FAF8F2]">
                      <button onClick={() => setShowMemberModal(false)} className="flex-1 py-3.5 rounded-2xl bg-white text-gray-400 font-black border-2 border-beige-dark hover:bg-gray-50 transition-all text-sm">
                        取消
                      </button>
                      <button onClick={handleSaveMember} className="flex-1 py-3.5 rounded-2xl bg-sage hover:bg-sage-dark text-white font-black shadow-hard-sage border-2 border-sage-dark transition-all text-sm">
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

