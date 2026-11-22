import React, { useState } from 'react';
import { 
    MapPin, Utensils, Train, Bed, Camera, Plane, X, Navigation, 
    Clock, Luggage, Briefcase, Coffee, Ticket, AlignLeft, Users, Edit3, Car, Trash2, Fuel
} from 'lucide-react';
import { ScheduleItem, Currency, Member } from '../../types';
import { TransitLegChainView } from '../TransitComponents';
import { MemberAvatar } from '../MemberAvatar';
import { Lightbox } from '../Lightbox';
import { TransportCard } from '../transport/TransportCard';
import { scheduleItemToTransport } from '../transport/adapters';
import { getExchangeRate } from '../../utils/currency';
import { resolveStayDetails, resolveTransitDetails } from '../../src/utils/splitCost';

export const ScheduleDetailModal = ({
    isOpen, onClose, item, onEdit, onDelete, currencies, members
}: {
    isOpen: boolean, 
    onClose: () => void, 
    item: ScheduleItem | null, 
    onEdit: () => void, 
    onDelete?: (item: ScheduleItem) => void,
    currencies: Currency[], 
    members: Member[]
}) => {
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    if (!isOpen || !item) return null;

    let Icon = MapPin;
    let colorClass = 'bg-gray-100 text-gray-500';
    if (item.type === 'food') { Icon = Utensils; colorClass = 'bg-orange-100 text-orange-500'; }
    if (item.type === 'transport') { Icon = Train; colorClass = 'bg-blue-100 text-blue-500'; }
    if (item.type === 'stay') { Icon = Bed; colorClass = 'bg-purple-100 text-purple-500'; }
    if (item.type === 'spot') { Icon = Camera; colorClass = 'bg-green-100 text-green-600'; }
    if (item.type === 'flight') { Icon = Plane; colorClass = 'bg-cyan-100 text-cyan-600'; }

    const openMap = (location: string) => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`, '_blank');

    return (
        <div 
          className="fixed inset-0 bg-cocoa/60 z-[100] flex flex-col items-center justify-center p-3 sm:p-4 backdrop-blur-sm animate-fade-in" 
          onClick={onClose}
          style={{
            paddingTop: 'max(0.75rem, env(safe-area-inset-top, 0px))',
            paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))',
          }}
        >
            <div className="bg-[#FAF8F2] w-full max-w-lg max-h-[92vh] max-h-[92dvh] rounded-3xl sm:rounded-[2.5rem] p-5 sm:p-6 shadow-2xl border-2 sm:border-4 border-beige-dark relative overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex justify-between items-start pb-3 border-b-2 border-beige-dark flex-shrink-0 gap-2">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`p-3 rounded-2xl ${colorClass} border-2 border-white shadow-sm flex-shrink-0`}>
                            <Icon size={24} strokeWidth={2.5} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="font-sans tabular-nums text-xs font-black text-white bg-sage px-2 py-0.5 rounded-lg shadow-sm">{item.time}</span>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.type}</span>
                            </div>
                            <h3 className="text-lg sm:text-xl font-black text-cocoa leading-snug break-words">{item.title}</h3>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                        {onDelete && (
                            <button 
                                type="button" 
                                onClick={() => onDelete(item)} 
                                className="p-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-full border border-red-200 shadow-xs transition-colors"
                                title="刪除此項目"
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                        <button onClick={onClose} className="p-2 bg-white rounded-full text-gray-400 hover:text-red-400 border border-beige-dark shadow-sm transition-colors"><X size={18}/></button>
                    </div>
                </div>

                <div className="overflow-y-auto custom-scroll flex-1 min-h-0 space-y-4 pr-1">
                    {/* Location */}
                    <div className="bg-white p-3 rounded-2xl border-2 border-beige-dark shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-bold text-gray-500 flex-1 min-w-0">
                            <MapPin size={16} className="text-sage flex-shrink-0" />
                            <span className="break-words flex-1 leading-snug">{item.location}</span>
                        </div>
                        <button onClick={() => openMap(item.location)} className="p-1.5 bg-gray-50 rounded-lg text-cocoa hover:text-white hover:bg-sage shadow-sm border border-gray-200 transition-colors flex-shrink-0 ml-2">
                            <Navigation size={14} strokeWidth={2.5} />
                        </button>
                    </div>

                    {/* Photos */}
                    {item.images && item.images.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center justify-between">
                                <span className="flex items-center gap-1"><Camera size={10} /> 景點相片 ({item.images.length})</span>
                                <span className="text-[9px] text-gray-400 font-bold">點擊可放大查看</span>
                            </h4>
                            <div className="grid grid-cols-2 gap-2">
                                {item.images.map((img, idx) => (
                                    <div 
                                        key={idx} 
                                        onClick={() => setLightboxIndex(idx)}
                                        className="relative aspect-video rounded-xl overflow-hidden border-2 border-beige-dark shadow-sm group cursor-pointer"
                                    >
                                        <img 
                                            src={img} 
                                            alt={`${item.title} 相片 ${idx + 1}`} 
                                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                                            style={{ objectPosition: idx === 0 ? `center ${item.photoOffsetY ?? 50}%` : 'center center' }}
                                            referrerPolicy="no-referrer" 
                                        />
                                        {idx === 0 && (
                                            <span className="absolute bottom-1 left-1 bg-black/60 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                                                卡片主圖
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Flight Details - Unified Transport System */}
                    {item.type === 'flight' && item.flightDetails && (() => {
                        const transportModel = scheduleItemToTransport(item);
                        return transportModel ? (
                            <div className="space-y-2">
                                <TransportCard item={transportModel} defaultExpanded={true} />
                            </div>
                        ) : null;
                    })()}

                    {/* Stay Details */}
                    {item.type === 'stay' && item.stayDetails && (() => {
                        const stayResolved = resolveStayDetails(item.stayDetails, members);
                        return (
                            <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-100 space-y-3">
                                <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm font-bold text-gray-500">
                                    <div className="flex flex-wrap gap-4">
                                        <div className="flex items-center gap-1"><Clock size={13} className="text-purple-400"/> 入住時間: <span className="font-sans tabular-nums font-black text-cocoa">{item.checkIn}</span></div>
                                        <div className="flex items-center gap-1"><Clock size={13} className="text-purple-400"/> 退房時間: <span className="font-sans tabular-nums font-black text-cocoa">{item.checkOut}</span></div>
                                    </div>
                                    {stayResolved.nights > 0 && (
                                        <span className="text-xs font-black text-purple-600 bg-white px-2.5 py-0.5 rounded-full border border-purple-200 font-sans tabular-nums">共 {stayResolved.nights} 晚</span>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    {item.meals?.breakfast && <span className="text-[10px] bg-white px-2 py-1 rounded-lg border border-purple-200 text-purple-500 font-bold flex items-center gap-1"><Coffee size={10}/> 早餐</span>}
                                    {item.meals?.dinner && <span className="text-[10px] bg-white px-2 py-1 rounded-lg border border-purple-200 text-purple-500 font-bold flex items-center gap-1"><Utensils size={10}/> 晚餐</span>}
                                </div>
                                {!stayResolved.isLegacy && stayResolved.totalAmount !== undefined ? (
                                    <div className="pt-2 border-t border-purple-200 space-y-1.5">
                                        <div className="flex justify-between items-center text-xs font-bold text-gray-500">
                                            <span>住宿總價（整筆訂單）</span>
                                            <span className="font-sans tabular-nums font-black text-cocoa">{stayResolved.currency} {stayResolved.totalAmount.toLocaleString()}</span>
                                        </div>
                                        {stayResolved.feeEnabled && stayResolved.split && (
                                            <div className="flex justify-between items-center text-xs font-bold text-gray-500">
                                                <span>＋ 手續費 1.5%</span>
                                                <span className="font-sans tabular-nums font-black text-cocoa">{stayResolved.currency} {stayResolved.split.fee.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center pt-1 border-t border-purple-100">
                                            <span className="text-xs font-bold text-gray-500">每人應付</span>
                                            <span className="text-sm sm:text-base font-black text-sage font-sans tabular-nums tracking-tight">
                                                {stayResolved.perPerson !== null ? `${stayResolved.currency} ${stayResolved.perPerson.toLocaleString()}` : '—'}
                                            </span>
                                        </div>
                                    </div>
                                ) : Number(item.stayDetails.cost) > 0 ? (
                                    <div className="pt-2 border-t border-purple-200 space-y-1">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold text-gray-400">每人費用</span>
                                            <span className="text-sm sm:text-base font-black text-sage font-sans tabular-nums tracking-tight">{item.stayDetails.currency} {Number(item.stayDetails.cost).toLocaleString()}</span>
                                        </div>
                                        <p className="text-[11px] font-bold text-amber-700">這筆是舊格式，重新填寫總價可啟用自動計算</p>
                                    </div>
                                ) : null}
                            </div>
                        );
                    })()}

                    {/* Transport Details - Unified Transport System */}
                    {item.type === 'transport' && item.transitDetails && (() => {
                        const transportModel = scheduleItemToTransport(item, members, currencies);
                        return (
                            <div className="space-y-3">
                                {transportModel ? (
                                    <TransportCard item={transportModel} defaultExpanded={true} />
                                ) : (
                                    <TransitLegChainView legs={item.transitDetails.legs} fare={item.transitDetails.fare} isDetailed={true} currencies={currencies} />
                                )}
                            </div>
                        );
                    })()}
                    {item.type === 'transport' && !item.transitDetails && item.carRental?.hasRental && (() => {
                        const rentalCurrency = item.carRental.rentalCurrency || 'TWD';
                        const rentalRate = getExchangeRate(rentalCurrency, currencies);
                        const baseRental = Number(item.carRental.rentalCost) || 0;
                        const baseFeePct = Number(item.carRental.serviceFeePercentage) || 0;
                        const baseWithFee = baseRental + (item.carRental.hasServiceFee ? (baseRental * baseFeePct / 100) : 0);
                        let extrasTotal = 0;
                        item.carRental.expenses?.forEach(exp => {
                            const amt = Number(exp.amount) || 0;
                            const feePct = Number(exp.serviceFeePercentage) || 0;
                            const expWithFee = amt + (exp.hasServiceFee ? (amt * feePct / 100) : 0);
                            const expCurrency = exp.currency || rentalCurrency;
                            if (expCurrency === rentalCurrency) {
                                extrasTotal += expWithFee;
                            } else {
                                const expRate = getExchangeRate(expCurrency, currencies);
                                extrasTotal += (expWithFee * expRate) / (rentalRate || 1);
                            }
                        });
                        const perPersonTotal = baseWithFee + extrasTotal;
                        const participantCount = (item.carRental.participants && item.carRental.participants.length > 0)
                            ? item.carRental.participants.length
                            : (members.length > 0 ? members.length : 1);
                        const grandTotal = perPersonTotal * participantCount;
                        const hasAnyFee = Boolean(item.carRental.hasServiceFee && baseFeePct > 0) || Boolean(item.carRental.expenses?.some(e => e.hasServiceFee && Number(e.serviceFeePercentage) > 0));
                        return (
                            <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 space-y-3">
                                <div className="flex justify-between items-center border-b border-blue-200 pb-2">
                                    <div className="flex items-center gap-2"><Car size={14} className="text-blue-500"/><span className="text-sm font-black text-cocoa">{item.carRental.company}</span></div>
                                    <span className="text-xs font-bold text-gray-400">{item.carRental.carModel}</span>
                                </div>
                                <div className="space-y-1.5 text-sm font-bold text-gray-500">
                                    <div>取車時間: <span className="font-sans tabular-nums font-black text-cocoa">{item.carRental.pickupDate} {item.carRental.pickupTime}</span></div>
                                    <div>還車時間: <span className="font-sans tabular-nums font-black text-cocoa">{item.carRental.returnDate} {item.carRental.returnTime}</span></div>
                                </div>
                                {Number(item.carRental.estimatedFuelCost) > 0 && (
                                    <div className="bg-orange-50/80 px-3 py-2 rounded-xl border border-orange-100 flex items-center justify-between text-xs sm:text-sm">
                                        <span className="flex items-center gap-1.5 font-bold text-orange-700"><Fuel size={14} className="text-orange-500"/> 每人預估油資</span>
                                        <span className="font-sans tabular-nums font-black text-orange-700 tracking-tight">{item.carRental.fuelCurrency} {Number(item.carRental.estimatedFuelCost).toLocaleString()}</span>
                                    </div>
                                )}
                                <div className="bg-white p-3 rounded-xl border border-blue-100 text-xs space-y-1.5">
                                    <div className="flex justify-between font-bold text-gray-500">
                                        <span>基本租金 (每人)</span>
                                        <span className="font-sans tabular-nums font-black text-cocoa tracking-tight">{rentalCurrency} {Math.round(baseWithFee).toLocaleString()}</span>
                                    </div>
                                    {item.carRental.expenses?.map((exp, idx) => {
                                        const expAmt = Number(exp.amount) || 0;
                                        const expFeePct = Number(exp.serviceFeePercentage) || 0;
                                        const expTotal = expAmt + (exp.hasServiceFee ? (expAmt * expFeePct / 100) : 0);
                                        return (
                                            <div key={idx} className="flex justify-between font-bold text-gray-500">
                                                <span>• {exp.name} (每人)</span>
                                                <span className="font-sans tabular-nums font-black text-cocoa tracking-tight">{exp.currency || rentalCurrency} {Math.round(expTotal).toLocaleString()}</span>
                                            </div>
                                        );
                                    })}
                                    {grandTotal > 0 && (
                                        <div className="flex justify-between items-center pt-1.5 border-t border-blue-100 text-sm font-black text-blue-600 gap-2">
                                            <div className="flex flex-col">
                                                <span className="flex items-center gap-1 flex-wrap">
                                                    <span>租車總計金額</span>
                                                    {hasAnyFee && <span className="text-[10px] font-bold text-blue-500/80">(含手續費)</span>}
                                                </span>
                                                {participantCount > 1 && (
                                                    <span className="text-[11px] font-bold text-blue-500/85 font-sans tabular-nums tracking-tight">
                                                        每人 {rentalCurrency} {Math.round(perPersonTotal).toLocaleString()} × {participantCount} 人
                                                    </span>
                                                )}
                                            </div>
                                            <span className="font-sans tabular-nums font-black tracking-tight whitespace-nowrap">{rentalCurrency} {Math.round(grandTotal).toLocaleString()}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })()}

                    {/* Ticket/Cost Info for Spot/Food */}
                    {(item.type === 'spot' || item.type === 'food') && item.spotDetails?.hasTicket && (
                        <div className="bg-white p-3 rounded-2xl border border-beige-dark flex justify-between items-center shadow-sm">
                            <div className="flex items-center gap-2">
                                <Ticket size={16} className="text-sage"/>
                                <span className="text-xs font-bold text-cocoa">{item.type === 'food' ? '預計餐費' : '門票費用'}</span>
                            </div>
                            <span className="text-sm font-black text-sage font-sans tabular-nums tracking-tight">{item.spotDetails.currency} {Number(item.spotDetails.ticketCost).toLocaleString()}</span>
                        </div>
                    )}

                    {/* Notes */}
                    {item.notes && (
                        <div className="bg-yellow-50/50 p-3 rounded-2xl border border-yellow-100">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1"><AlignLeft size={10}/> 備註</h4>
                            <p className="text-[11pt] font-medium text-cocoa whitespace-pre-wrap leading-relaxed">{item.notes}</p>
                        </div>
                    )}

                    {/* Participants */}
                    <div className="pt-2 border-t border-dashed border-gray-200">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1"><Users size={10}/> 參與成員</h4>
                        <div className="flex flex-wrap gap-2">
                            {members.map(m => {
                                const stayPartIds = item.type === 'stay' ? resolveStayDetails(item.stayDetails, members).participantIds : [];
                                const transitPartIds = item.type === 'transport' && item.transitDetails
                                    ? resolveTransitDetails(item.transitDetails, members).participantIds
                                    : [];
                                const isParticipant = 
                                    item.type === 'flight' ? (item.flightDetails?.participants ? item.flightDetails.participants.includes(m.id) : true) :
                                    item.type === 'stay' ? (item.stayDetails?.payers || item.stayDetails?.participants ? stayPartIds.includes(m.id) : true) :
                                    item.type === 'transport' ? (
                                        (item.transitDetails ? transitPartIds.includes(m.id) : false) ||
                                        (item.carRental?.participants ? item.carRental.participants.includes(m.id) : (item.carRental?.hasRental ? true : false))
                                    ) :
                                    (item.type === 'spot' || item.type === 'food') ? (item.spotDetails?.participants ? item.spotDetails.participants.includes(m.id) : true) : true;
                                
                                if (!isParticipant) return null;

                                return (
                                    <div key={m.id} className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-beige-dark shadow-sm">
                                        <div className="w-4 h-4 rounded-full overflow-hidden flex items-center justify-center">
                                            <MemberAvatar 
                                              avatar={m.avatar} 
                                              name={m.name} 
                                              id={m.id} 
                                              size="xs" 
                                              showBorder={false}
                                              className="w-full h-full"
                                            />
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-500">{m.name}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Footer Action */}
                <div className="mt-4 pt-4 border-t-2 border-beige-dark border-dashed flex-shrink-0 flex gap-2.5">
                    {onDelete && (
                        <button 
                            type="button"
                            onClick={() => onDelete(item)} 
                            className="px-4 py-3 rounded-2xl font-black bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 border-2 border-red-200 transition-all active:translate-y-1 shadow-sm flex items-center justify-center gap-1.5 text-sm flex-shrink-0"
                            title="刪除此行程項目"
                        >
                            <Trash2 size={16} strokeWidth={2.5} /> 刪除
                        </button>
                    )}
                    <button onClick={onEdit} className="flex-1 bg-sage text-white py-3 rounded-2xl font-black shadow-hard-sage active:translate-y-1 active:shadow-none transition-all border-2 border-sage-dark flex items-center justify-center gap-2 text-sm">
                        <Edit3 size={16} strokeWidth={2.5}/> 編輯項目
                    </button>
                </div>
            </div>

            {lightboxIndex !== null && item.images && (
                <Lightbox 
                    images={item.images}
                    initialIndex={lightboxIndex}
                    onClose={() => setLightboxIndex(null)}
                />
            )}
        </div>
    );
};
