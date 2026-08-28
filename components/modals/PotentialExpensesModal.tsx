import React from 'react';
import { X, Coins } from 'lucide-react';
import { ScheduleItem, Currency, Member } from '../../types';
import { getTransitEffectiveFare } from '../TransitComponents';
import { MemberAvatar } from '../MemberAvatar';

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

    const potentialItems: { 
        title: string; 
        cost: number; 
        fee: number; 
        hasFee: boolean; 
        feePct: number; 
        amount: number; 
        originalCurrency: string; 
        type: string; 
        participants: string[]; 
    }[] = [];

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
                cost,
                fee,
                hasFee,
                feePct,
                amount: total, 
                originalCurrency: currency, 
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
                const { mainAmount, mainCurrency, extraAmount, extraCurrency, extraName } = getTransitEffectiveFare(item.transitDetails.fare);
                const participants = (item.transitDetails.participants && item.transitDetails.participants.length > 0)
                    ? item.transitDetails.participants
                    : members.map(m => m.id);

                if (mainAmount > 0) {
                    processCost(
                        `${item.title} (大眾交通票價)`, '交通',
                        mainAmount,
                        mainCurrency,
                        item.transitDetails.fare?.hasServiceFee || false,
                        Number(item.transitDetails.fare?.serviceFeePercentage) || 0,
                        participants
                    );
                }
                if (extraAmount > 0) {
                    processCost(
                        `${item.title} (${extraName})`, '交通',
                        extraAmount,
                        extraCurrency,
                        item.transitDetails.fare?.extraFeeHasServiceFee || false,
                        Number(item.transitDetails.fare?.extraFeeServiceFeePercentage) || 0,
                        participants
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
        <div className="fixed inset-0 bg-cocoa/60 backdrop-blur-sm z-[70] flex flex-col items-center justify-end sm:justify-center sm:p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-[#FAF8F2] w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-lg sm:rounded-[2.5rem] rounded-none p-5 sm:p-6 shadow-2xl border-0 sm:border-4 sm:border-beige-dark flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center pb-3 border-b-2 border-beige-dark flex-shrink-0">
                    <h3 className="text-xl font-black text-cocoa flex items-center gap-2"><Coins size={20} className="text-yellow-500"/> 潛在花費清單</h3>
                    <button onClick={onClose} className="p-2 bg-white rounded-full text-gray-400 hover:text-red-400 border border-beige-dark shadow-sm transition-colors"><X size={18}/></button>
                </div>
                
                <div className="overflow-y-auto custom-scroll flex-1 py-4 pr-1 space-y-6">
                    <div className="bg-yellow-50 p-4 rounded-2xl border-2 border-yellow-200 flex justify-between items-center shadow-sm">
                        <span className="font-bold text-yellow-800 text-sm">預估總額 (約略 TWD)</span>
                        <span className="font-black text-2xl text-yellow-600">${Math.round(totalPotentialTWD).toLocaleString()}</span>
                    </div>

                    {totalPotentialTWD > 0 && (
                        <div className="space-y-2">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">每人分攤預估</h4>
                            <div className="grid grid-cols-2 gap-2">
                                {members.map(m => (
                                    <div key={m.id} className="bg-white border border-beige-dark p-2.5 rounded-xl flex justify-between items-center shadow-sm">
                                        <div className="flex items-center gap-1.5">
                                            <MemberAvatar 
                                              avatar={m.avatar} 
                                              name={m.name} 
                                              id={m.id} 
                                              size="xs" 
                                              showBorder={false}
                                              className="w-5 h-5 border border-gray-200"
                                            />
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
                                <div key={i} className="bg-white p-3.5 rounded-2xl border border-beige-dark shadow-sm space-y-1.5">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-bold">{p.type}</span>
                                            <span className="font-bold text-cocoa text-sm">{p.title}</span>
                                        </div>
                                        <div className="text-sm font-black text-cocoa">
                                            ≈ NT$ {Math.round(toTWD(p.amount, p.originalCurrency)).toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center pt-1 border-t border-dashed border-gray-100">
                                        <div className="text-[10px] font-bold text-gray-400">
                                            {p.hasFee ? (
                                                <span>原幣: {p.originalCurrency} {p.cost.toLocaleString()} + {p.feePct}%手續費 = <strong className="text-amber-800 font-mono">{p.originalCurrency} {Math.round(p.amount * 100) / 100}</strong></span>
                                            ) : (
                                                <span>原幣: {p.originalCurrency} {p.cost.toLocaleString()}</span>
                                            )}
                                        </div>
                                        <div className="flex -space-x-1.5">
                                            {p.participants.map(pid => {
                                                const mem = members.find(m => m.id === pid);
                                                if (!mem) return null;
                                                return (
                                                    <div key={pid} className="w-4 h-4 rounded-full overflow-hidden flex items-center justify-center border border-white" title={mem.name}>
                                                        <MemberAvatar 
                                                          avatar={mem.avatar} 
                                                          name={mem.name} 
                                                          id={mem.id} 
                                                          size="xs" 
                                                          showBorder={false}
                                                          className="w-full h-full"
                                                        />
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

                <div className="pt-3 border-t-2 border-beige-dark mt-auto flex-shrink-0">
                    <button onClick={onClose} className="w-full py-3.5 rounded-2xl font-bold text-cocoa bg-white border-2 border-beige-dark hover:bg-gray-50 transition-colors">關閉</button>
                </div>
            </div>
        </div>
    );
};
