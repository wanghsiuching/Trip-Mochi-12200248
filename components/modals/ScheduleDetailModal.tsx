import React from 'react';
import { 
    MapPin, Utensils, Train, Bed, Camera, Plane, X, Navigation, 
    Clock, Luggage, Briefcase, Coffee, Ticket, AlignLeft, Users, Edit3, Car
} from 'lucide-react';
import { ScheduleItem, Currency, Member } from '../../types';
import { TransitLegChainView } from '../TransitComponents';
import { MemberAvatar } from '../MemberAvatar';

export const ScheduleDetailModal = ({
    isOpen, onClose, item, onEdit, currencies, members
}: {
    isOpen: boolean, onClose: () => void, item: ScheduleItem | null, onEdit: () => void, currencies: Currency[], members: Member[]
}) => {
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
        <div className="fixed inset-0 bg-cocoa/60 z-[100] flex flex-col items-center justify-end sm:justify-center sm:p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className="bg-[#FAF8F2] w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-lg sm:rounded-[2.5rem] rounded-none p-5 sm:p-6 shadow-2xl border-0 sm:border-4 sm:border-beige-dark relative overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex justify-between items-start pb-3 border-b-2 border-beige-dark flex-shrink-0 gap-2">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`p-3 rounded-2xl ${colorClass} border-2 border-white shadow-sm flex-shrink-0`}>
                            <Icon size={24} strokeWidth={2.5} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="font-mono text-xs font-black text-white bg-sage px-2 py-0.5 rounded-lg shadow-sm">{item.time}</span>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.type}</span>
                            </div>
                            <h3 className="text-lg sm:text-xl font-black text-cocoa leading-snug break-words">{item.title}</h3>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white rounded-full text-gray-400 hover:text-red-400 border border-beige-dark shadow-sm transition-colors flex-shrink-0"><X size={18}/></button>
                </div>

                <div className="overflow-y-auto custom-scroll flex-1 space-y-4 pr-1">
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

                    {/* Flight Details */}
                    {item.type === 'flight' && item.flightDetails && (
                        <div className="bg-gradient-to-br from-cyan-50/80 via-sky-50/40 to-blue-50/50 p-4 rounded-2xl border border-cyan-200/80 space-y-3">
                            <div className="flex items-center justify-between gap-2 border-b border-cyan-200/70 pb-2.5">
                                <div className="flex items-center gap-2 min-w-0 flex-wrap">
                                    <div className="w-6 h-6 rounded-lg bg-cyan-500 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                                        <Plane size={14} />
                                    </div>
                                    <span className="text-sm font-black text-cocoa break-words">
                                        {item.flightDetails.airline || '航班'}
                                    </span>
                                    {item.flightDetails.flightCode && (
                                        <span className="font-mono text-xs font-black bg-cyan-100/90 text-cyan-800 px-2 py-0.5 rounded-md border border-cyan-200 flex-shrink-0">
                                            {item.flightDetails.flightCode.toUpperCase()}
                                        </span>
                                    )}
                                </div>
                                {item.flightDetails.flightDuration && (
                                    <div className="flex items-center gap-1 text-[11px] font-bold text-cyan-800 bg-white/90 px-2 py-0.5 rounded-md border border-cyan-200 flex-shrink-0 font-mono">
                                        <Clock size={11} className="text-cyan-600"/>
                                        <span>{item.flightDetails.flightDuration}</span>
                                    </div>
                                )}
                            </div>

                            {/* Flight Route Boarding-Pass Box */}
                            <div className="bg-white/95 rounded-xl p-3 border border-cyan-100 space-y-2">
                                <div className="flex items-center justify-between gap-2 text-xs">
                                    {/* Departure */}
                                    <div className="flex-1 min-w-0 text-left">
                                        <div className="font-mono text-sm sm:text-base font-black text-cyan-950 break-words">
                                            {item.flightDetails.departureAirport?.toUpperCase() || 'DEP'}
                                        </div>
                                        {item.flightDetails.departureTime && (
                                            <div className="text-[11px] font-bold text-gray-500 flex items-center gap-1 mt-0.5">
                                                <span className="text-[9px] px-1.5 py-0.2 bg-gray-100 text-gray-600 rounded">起飛</span>
                                                <span className="font-mono">{item.flightDetails.departureTime}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Arrow / Transit Center Indicator */}
                                    {item.flightDetails.transitAirport || item.flightDetails.transitCity ? (
                                        <div className="flex flex-col items-center px-1.5 flex-shrink-0">
                                            <div className="flex items-center gap-1">
                                                <span className="w-3 h-0.5 bg-amber-200"></span>
                                                <span className="text-[9px] font-black bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded">
                                                    轉機
                                                </span>
                                                <span className="w-3 h-0.5 bg-amber-200"></span>
                                            </div>
                                            <span className="font-mono text-xs font-black text-amber-900 mt-0.5">
                                                {item.flightDetails.transitAirport?.toUpperCase()}
                                            </span>
                                            {item.flightDetails.transitDuration && (
                                                <span className="text-[9px] font-bold text-amber-700">
                                                    停留 {item.flightDetails.transitDuration}
                                                </span>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center px-2 flex-shrink-0">
                                            <div className="flex items-center text-cyan-300">
                                                <span className="w-4 h-0.5 bg-cyan-200"></span>
                                                <Plane size={12} className="text-cyan-500 mx-0.5" />
                                                <span className="w-4 h-0.5 bg-cyan-200"></span>
                                            </div>
                                            <span className="text-[9px] font-bold text-cyan-600 mt-0.5">直飛</span>
                                        </div>
                                    )}

                                    {/* Arrival */}
                                    <div className="flex-1 min-w-0 text-right">
                                        <div className="font-mono text-sm sm:text-base font-black text-cyan-950 break-words">
                                            {item.flightDetails.arrivalAirport?.toUpperCase() || 'ARR'}
                                        </div>
                                        {item.flightDetails.arrivalTime && (
                                            <div className="text-[11px] font-bold text-gray-500 flex items-center justify-end gap-1 mt-0.5">
                                                <span className="font-mono">{item.flightDetails.arrivalTime}</span>
                                                <span className="text-[9px] px-1.5 py-0.2 bg-gray-100 text-gray-600 rounded">抵達</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Transit Detail Line if city or transit flight code exists */}
                                {(item.flightDetails.transitCity || item.flightDetails.transitFlightCode) && (
                                    <div className="pt-2 border-t border-dashed border-amber-100 flex items-center justify-between text-xs text-amber-900 flex-wrap gap-1">
                                        <span className="flex items-center gap-1 break-words flex-1 min-w-0">
                                            <span className="text-gray-400">轉機城市:</span>
                                            <span className="font-bold">{item.flightDetails.transitCity || item.flightDetails.transitAirport}</span>
                                        </span>
                                        {item.flightDetails.transitFlightCode && (
                                            <span className="font-mono font-bold text-amber-800 flex-shrink-0 ml-1">
                                                銜接航班: {item.flightDetails.transitFlightCode.toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Baggage Row */}
                            <div className="grid grid-cols-2 gap-2 text-xs font-bold text-gray-500 bg-white/70 p-2.5 rounded-xl border border-cyan-100">
                                <div className="flex items-center gap-1.5"><Luggage size={14} className="text-teal-600"/> 託運行李: {item.flightDetails.checkedBag || '--'}</div>
                                <div className="flex items-center gap-1.5"><Briefcase size={14} className="text-orange-500"/> 手提行李: {item.flightDetails.carryOnBag || '--'}</div>
                            </div>

                            {Number(item.flightDetails.cost) > 0 && (
                                <div className="pt-2 border-t border-cyan-200 flex justify-between items-center">
                                    <span className="text-xs font-bold text-gray-400">總機票費用</span>
                                    <span className="text-sm font-black text-sage font-mono">{item.flightDetails.currency} {Number(item.flightDetails.cost).toLocaleString()}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Stay Details */}
                    {item.type === 'stay' && item.stayDetails && (
                        <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-100 space-y-3">
                            <div className="flex gap-4 text-xs font-bold text-gray-500">
                                <div className="flex items-center gap-1"><Clock size={12}/> In: {item.checkIn}</div>
                                <div className="flex items-center gap-1"><Clock size={12}/> Out: {item.checkOut}</div>
                            </div>
                            <div className="flex gap-2">
                                {item.meals?.breakfast && <span className="text-[10px] bg-white px-2 py-1 rounded-lg border border-purple-200 text-purple-500 font-bold flex items-center gap-1"><Coffee size={10}/> 早餐</span>}
                                {item.meals?.dinner && <span className="text-[10px] bg-white px-2 py-1 rounded-lg border border-purple-200 text-purple-500 font-bold flex items-center gap-1"><Utensils size={10}/> 晚餐</span>}
                            </div>
                            {Number(item.stayDetails.cost) > 0 && (
                                <div className="pt-2 border-t border-purple-200 flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-gray-400">總費用</span>
                                    <span className="text-sm font-black text-sage font-mono">{item.stayDetails.currency} {Number(item.stayDetails.cost).toLocaleString()}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Transport Details */}
                    {item.type === 'transport' && item.transitDetails && (
                        <div className="space-y-3">
                            <TransitLegChainView legs={item.transitDetails.legs} fare={item.transitDetails.fare} isDetailed={true} currencies={currencies} />
                        </div>
                    )}
                    {item.type === 'transport' && !item.transitDetails && item.carRental?.hasRental && (
                        <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 space-y-3">
                            <div className="flex justify-between items-center border-b border-blue-200 pb-2">
                                <div className="flex items-center gap-2"><Car size={14} className="text-blue-500"/><span className="text-sm font-black text-cocoa">{item.carRental.company}</span></div>
                                <span className="text-xs font-bold text-gray-400">{item.carRental.carModel}</span>
                            </div>
                            <div className="space-y-1 text-xs font-bold text-gray-500">
                                <div>取車: {item.carRental.pickupDate} {item.carRental.pickupTime}</div>
                                <div>還車: {item.carRental.returnDate} {item.carRental.returnTime}</div>
                            </div>
                            {item.carRental.expenses && item.carRental.expenses.length > 0 && (
                                <div className="bg-white p-2 rounded-xl border border-blue-100 text-[10px] space-y-1">
                                    {item.carRental.expenses.map((exp, idx) => (
                                        <div key={idx} className="flex justify-between font-bold text-gray-400">
                                            <span>{exp.name}</span>
                                            <span>{exp.currency} {Number(exp.amount).toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Ticket/Cost Info for Spot/Food */}
                    {(item.type === 'spot' || item.type === 'food') && item.spotDetails?.hasTicket && (
                        <div className="bg-white p-3 rounded-2xl border border-beige-dark flex justify-between items-center shadow-sm">
                            <div className="flex items-center gap-2">
                                <Ticket size={16} className="text-sage"/>
                                <span className="text-xs font-bold text-cocoa">{item.type === 'food' ? '預計餐費' : '門票費用'}</span>
                            </div>
                            <span className="text-sm font-black text-sage font-mono">{item.spotDetails.currency} {Number(item.spotDetails.ticketCost).toLocaleString()}</span>
                        </div>
                    )}

                    {/* Notes */}
                    {item.notes && (
                        <div className="bg-yellow-50/50 p-3 rounded-2xl border border-yellow-100">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1"><AlignLeft size={10}/> 備註</h4>
                            <p className="text-xs font-bold text-cocoa whitespace-pre-wrap leading-relaxed">{item.notes}</p>
                        </div>
                    )}

                    {/* Participants */}
                    <div className="pt-2 border-t border-dashed border-gray-200">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1"><Users size={10}/> 參與成員</h4>
                        <div className="flex flex-wrap gap-2">
                            {members.map(m => {
                                const isParticipant = 
                                    item.type === 'flight' ? (item.flightDetails?.participants ? item.flightDetails.participants.includes(m.id) : true) :
                                    item.type === 'stay' ? (item.stayDetails?.participants ? item.stayDetails.participants.includes(m.id) : true) :
                                    item.type === 'transport' ? (
                                        (item.transitDetails?.participants ? item.transitDetails.participants.includes(m.id) : (item.transitDetails ? true : false)) ||
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
                <div className="mt-4 pt-4 border-t-2 border-beige-dark border-dashed flex-shrink-0">
                    <button onClick={onEdit} className="w-full bg-sage text-white py-3 rounded-2xl font-black shadow-hard-sage active:translate-y-1 active:shadow-none transition-all border-2 border-sage-dark flex items-center justify-center gap-2 text-sm">
                        <Edit3 size={16} strokeWidth={2.5}/> 編輯項目
                    </button>
                </div>
            </div>
        </div>
    );
};
