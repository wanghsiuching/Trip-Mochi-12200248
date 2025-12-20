
import React, { useState, useEffect, useRef } from 'react';
import { ScheduleItem, TripDate } from '../types';

interface ScheduleViewProps {
  dates: TripDate[];
  selectedDate: TripDate;
  onSelectDate: (date: TripDate) => void;
  itinerary: ScheduleItem[];
  onSave: (item: ScheduleItem) => void;
  onDelete: (id: string) => void;
  tripStatus: 'before' | 'during' | 'after';
  countdownDays: number;
  countdownHours: number;
  countdownProgress: number;
  currentDayNum: number;
  tripProgress: number;
}

// 2026 Mock Weather Data
const WEATHER_DATA: Record<string, {
    condition: string;
    tempHigh: number;
    tempLow: number;
    rainChance: number;
    wind: number;
    sunrise: string;
    sunset: string;
    advice: string;
    type: 'sunny' | 'cloudy' | 'rainy' | 'windy';
}> = {
    '2026-03-10': { condition: '晴朗無雲', tempHigh: 13, tempLow: 5, rainChance: 0, wind: 2, sunrise: '06:45', sunset: '18:25', advice: '抵達首日天氣晴朗，早晚溫差大，建議洋蔥式穿搭。', type: 'sunny' },
    // ... (rest of weather data can remain or be shortened)
};

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  dates, selectedDate, onSelectDate, itinerary, onSave, onDelete
}) => {
  // Modal States
  const [showModal, setShowModal] = useState(false); // Edit/Add Modal
  const [isEditing, setIsEditing] = useState(false);
  const [modalEvent, setModalEvent] = useState<ScheduleItem>({
    id: '', title: '', time: '09:00', type: 'spot', location: '', address: '', googleMapUrl: '', naverMapUrl: '', note: '', images: [], date: selectedDate.date
  });

  const [viewingItem, setViewingItem] = useState<ScheduleItem | null>(null); // Detail View Modal

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to selected date on mount or change
  useEffect(() => {
    if (scrollRef.current) {
        const selectedEl = scrollRef.current.querySelector('[data-selected="true"]');
        if (selectedEl) {
            selectedEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    }
  }, [selectedDate]);

  const getCategoryColor = (type: string) => ({
    spot: 'bg-blue-400', food: 'bg-orange-400', transport: 'bg-stone-500', stay: 'bg-indigo-400', flight: 'bg-cyan-400'
  }[type] || 'bg-gray-400');

  const getCategoryLabel = (type: string) => ({
      spot: '景點', food: '美食', transport: '交通', stay: '住宿', flight: '航班'
  }[type] || '其他');

  // Get current day's weather or fallback
  const dateKey = selectedDate.full || selectedDate.date;
  const currentWeather = WEATHER_DATA[dateKey] || { 
      condition: '氣候預測中', tempHigh: 15, tempLow: 8, rainChance: 0, wind: 2, sunrise: '06:30', sunset: '18:30', advice: '請依照一般春季氣候準備衣物。', type: 'sunny' 
  };

  const isJejuDate = (dateFull?: string) => dateFull ? dateFull >= '2026-03-16' : false;

  const openAddModal = () => {
    setIsEditing(false);
    setModalEvent({ id: Date.now().toString(), title: '', time: '09:00', type: 'spot', location: '', address: '', googleMapUrl: '', naverMapUrl: '', note: '', images: [], date: selectedDate.date });
    setShowModal(true);
  };

  const openEditModal = (item: ScheduleItem) => {
    setViewingItem(null); // Close detail view if open
    setIsEditing(true);
    setModalEvent({ ...item, images: item.images || [] });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!modalEvent.title) return;
    onSave(modalEvent);
    setShowModal(false);
  };

  const handleDeleteItem = (id: string) => {
      onDelete(id);
      setViewingItem(null); // Close detail view if open
  }

  const openMap = (e: React.MouseEvent, url?: string, query?: string) => {
      e.stopPropagation();
      if (url) {
          window.open(url, '_blank');
      } else if (query) {
          window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, '_blank');
      }
  };

  // Dynamic Weather Card Styles
  const weatherStyles = {
      sunny: { bg: 'bg-gradient-to-br from-[#4FC3F7] to-[#29B6F6]', icon: 'fa-sun', iconColor: 'text-[#FFF176]', text: 'text-white' },
      cloudy: { bg: 'bg-gradient-to-br from-[#90A4AE] to-[#78909C]', icon: 'fa-cloud-sun', iconColor: 'text-[#E0E0E0]', text: 'text-white' },
      rainy: { bg: 'bg-gradient-to-br from-[#5C6BC0] to-[#3949AB]', icon: 'fa-cloud-showers-heavy', iconColor: 'text-[#BBDEFB]', text: 'text-white' },
      windy: { bg: 'bg-gradient-to-br from-[#4DB6AC] to-[#009688]', icon: 'fa-wind', iconColor: 'text-[#E0F2F1]', text: 'text-white' },
  }[currentWeather.type];

  return (
    <div className="max-w-3xl mx-auto lg:p-0">
       
       {/* === Mobile Date Scroller === */}
       <div className="lg:hidden sticky top-0 z-30 bg-beige/85 backdrop-blur-md border-b border-[#E0E5D5]/50 shadow-sm transition-all px-4 pb-2 pt-1">
         <div className="flex items-center justify-between mb-2 px-1">
            <h2 className="text-sm font-black text-cocoa flex items-center gap-1.5">
                <i className="fa-regular fa-calendar-check text-sage"></i> 行程日期
            </h2>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${isJejuDate(selectedDate.full) ? 'bg-[#FFF3E0] text-[#F39C12] border-[#FFE0B2]' : 'bg-[#E3F2FD] text-[#3498DB] border-[#BBDEFB]'}`}>
                {isJejuDate(selectedDate.full) ? '🍊 濟州島 Jeju' : '🌊 釜山 Busan'}
            </span>
         </div>
         <div ref={scrollRef} className="flex space-x-2 overflow-x-auto hide-scrollbar pb-1 snap-x">
           {dates.map((date) => {
             const isJeju = isJejuDate(date.full);
             const isSelected = (selectedDate.full || selectedDate.date) === (date.full || date.date);
             const activeColor = isJeju ? 'bg-[#F39C12] shadow-[#F39C12]/30' : 'bg-[#3498DB] shadow-[#3498DB]/30';
             
             return (
               <div
                 key={date.date}
                 data-selected={isSelected}
                 onClick={() => onSelectDate(date)}
                 className={`flex-shrink-0 flex flex-col items-center justify-center w-[3.5rem] h-16 rounded-2xl transition-all duration-300 snap-center cursor-pointer relative overflow-hidden
                   ${isSelected 
                     ? `${activeColor} text-white shadow-lg scale-105 border-2 border-transparent` 
                     : 'bg-white border-2 border-[#E0E5D5] text-gray-400 hover:border-sage'}`}
               >
                 <span className={`text-[9px] font-black uppercase tracking-wider mb-0.5 ${isSelected ? 'opacity-90' : 'text-[#B0A590]'}`}>
                    Day {date.dayNum}
                 </span>
                 <span className="text-lg font-black leading-none tracking-tight">
                    {date.day}
                 </span>
                 <span className={`text-[10px] font-bold mt-0.5 ${isSelected ? 'opacity-80' : 'opacity-60'}`}>
                    {date.weekday}
                 </span>
               </div>
             );
           })}
         </div>
       </div>

       {/* === Content Area with Padding === */}
       <div className="p-4 lg:p-0">
            {/* === Weather Card === */}
            <div className={`w-full rounded-[2rem] p-5 mb-6 relative overflow-hidden shadow-lg transition-all duration-500 ${weatherStyles.bg}`}>
                    <div className="relative z-10 text-white">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <div className="flex items-center gap-2 mb-1 opacity-90">
                                    <i className="fa-solid fa-location-dot text-sm"></i>
                                    <span className="text-xs font-black tracking-widest uppercase">{isJejuDate(selectedDate.full) ? 'JEJU ISLAND' : 'BUSAN CITY'}</span>
                                </div>
                                <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
                                    {currentWeather.condition}
                                    <i className={`fa-solid ${weatherStyles.icon} ${weatherStyles.iconColor} text-2xl drop-shadow-md`}></i>
                                </h2>
                            </div>
                            <div className="text-right">
                                <div className="text-4xl font-black tracking-tighter drop-shadow-sm">{currentWeather.tempHigh}°</div>
                                <div className="text-sm font-bold opacity-80 flex items-center justify-end gap-1">
                                    <span className="text-blue-100">{currentWeather.tempLow}°</span> / <span>{currentWeather.tempHigh}°</span>
                                </div>
                            </div>
                        </div>
                    </div>
            </div>

            <div className="space-y-5">
                <div className="flex justify-between items-end px-1">
                <h2 className="text-xl font-black text-cocoa flex items-center gap-2">
                    <span className="w-2 h-6 bg-orange-400 rounded-full"></span>當日行程
                </h2>
                <button onClick={openAddModal} className="text-sm bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full shadow-md active:scale-95 transition-transform hover:bg-[#F2C94C] font-black border-2 border-white flex items-center gap-1">
                    <i className="fa-solid fa-plus"></i> 新增
                </button>
                </div>

                {!itinerary.length && (
                <div className="text-center py-12 text-gray-300 bg-white rounded-[2rem] border-2 border-dashed border-[#D6CDB6]">
                    <p className="font-bold">這天還沒有安排行程喔</p>
                    <p className="text-xs mt-1 opacity-70">點擊右上角新增開始規劃吧！</p>
                </div>
                )}

                <div className="space-y-4 pl-2 relative">
                <div className="absolute left-[19px] top-4 bottom-4 w-1 bg-[#E0E5D5] -z-10 rounded-full"></div>
                {itinerary.map((item) => (
                    <div key={item.id} className="flex gap-4 relative group" onClick={() => setViewingItem(item)}>
                        <div className="w-10 pt-1 flex flex-col items-center flex-shrink-0 bg-transparent z-10">
                        <span className="text-[10px] font-black text-gray-400 bg-beige px-1 rounded">{item.time}</span>
                        <div className={`w-4 h-4 rounded-full border-4 border-beige shadow-sm mt-1 ${getCategoryColor(item.type)}`}></div>
                        </div>
                        {/* Redesigned Card */}
                        <div className="flex-1 bg-white rounded-3xl shadow-sm relative overflow-hidden border-2 border-transparent hover:border-yellow-200 transition-colors cursor-pointer active:scale-[0.99] transition-transform">
                            {/* Top Section: Title & Location */}
                            <div className="p-4 pb-3">
                                <h3 className="font-black text-cocoa text-lg">{item.title}</h3>
                                {(item.location || item.address) && (
                                    <div className="mt-2 flex justify-between items-start gap-2">
                                        <div className="flex flex-col gap-0.5 min-w-0">
                                            {item.location && <span className="text-xs text-gray-400 font-bold truncate"><i className="fa-solid fa-location-dot text-orange-400 mr-1"></i> {item.location}</span>}
                                            {item.address && <span className="text-[11px] text-[#B0A590] font-medium truncate"><i className="fa-solid fa-map-pin mr-1"></i> {item.address}</span>}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Bottom Section: Details */}
                            <div className="p-4 pt-3">
                                {/* Note */}
                                {item.notes || item.note ? (
                                    <p className="text-sm text-cocoa bg-[#FDFDF5] p-3 rounded-xl border border-[#E0E5D5] border-dashed leading-relaxed font-medium line-clamp-2">
                                        {item.notes || item.note}
                                    </p>
                                ) : (
                                    <p className="text-[10px] text-[#D6CDB6] font-bold italic">沒有更多細節</p>
                                )}
                            </div>

                            {/* Edit/Delete Buttons */}
                            <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={(e) => { e.stopPropagation(); openEditModal(item); }} className="text-[#D6CDB6] hover:text-sage p-1.5 bg-[#F9FAFB] rounded-full transition-colors hover:bg-[#E8F5E9] shadow-sm border border-[#E0E5D5]"><i className="fa-solid fa-pen"></i></button>
                                <button onClick={(e) => { e.stopPropagation(); handleDeleteItem(item.id); }} className="text-[#D6CDB6] hover:text-red-400 p-1.5 bg-[#F9FAFB] rounded-full transition-colors hover:bg-[#FFEBEE] shadow-sm border border-[#E0E5D5]"><i className="fa-solid fa-trash-can"></i></button>
                            </div>
                        </div>
                    </div>
                ))}
                </div>
            </div>
       </div>

      {/* Edit/Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-cocoa/50 z-[2000] flex items-center justify-center px-4 backdrop-blur-sm">
            <div className="bg-[#FDFDF5] w-full max-w-sm rounded-[2rem] p-6 shadow-2xl animate-fade-in-up border-4 border-[#E0E5D5] relative max-h-[85vh] overflow-y-auto custom-scroll">
                <div className="absolute top-0 left-0 w-full h-3 bg-yellow-200"></div>
                <h3 className="font-black text-xl mb-5 text-cocoa text-center bg-[#F0EAD6] mx-auto w-max px-6 py-1 rounded-full border border-[#E0E5D5] shadow-sm mt-2">{isEditing ? '編輯行程' : '新增行程'}</h3>
                
                <div className="space-y-4">
                    {/* Title */}
                    <div>
                        <label className="text-[10px] text-gray-400 block mb-1 font-bold ml-1"><span className="text-red-400 font-black mr-0.5">*</span>活動名稱</label>
                        <input value={modalEvent.title} onChange={e => setModalEvent({...modalEvent, title: e.target.value})} type="text" placeholder="地點 / 活動名稱" className="w-full bg-white text-cocoa p-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-sage border-2 border-[#E0E5D5] font-bold placeholder-[#D6CDB6]" />
                    </div>
                    
                    {/* Time & Type */}
                    <div className="flex gap-2">
                        <div className="flex-[2]">
                            <label className="text-[10px] text-gray-400 block mb-1 font-bold ml-1"><span className="text-red-400 font-black mr-0.5">*</span>時間</label>
                            <input value={modalEvent.time} onChange={e => setModalEvent({...modalEvent, time: e.target.value})} type="time" className="w-full bg-white text-cocoa p-3.5 rounded-2xl outline-none border-2 border-[#E0E5D5] font-bold" />
                        </div>
                        <div className="flex-[3]">
                            <label className="text-[10px] text-gray-400 block mb-1 font-bold ml-1">類別</label>
                            <select value={modalEvent.type} onChange={e => setModalEvent({...modalEvent, type: e.target.value as any})} className="w-full bg-white text-cocoa p-3.5 rounded-2xl outline-none border-2 border-[#E0E5D5] font-bold"><option value="spot">景點</option><option value="food">美食</option><option value="transport">交通</option><option value="stay">住宿</option></select>
                        </div>
                    </div>

                    {/* Location & GPS */}
                    <div className="bg-white p-3 rounded-2xl border-2 border-[#E0E5D5] space-y-3">
                        <div>
                            <label className="text-[10px] text-gray-400 block mb-1 font-bold ml-1">地點名稱 (GPS/導航用)</label>
                            <div className="relative">
                                <i className="fa-solid fa-location-dot absolute left-3.5 top-3.5 text-orange-400"></i>
                                <input value={modalEvent.location} onChange={e => setModalEvent({...modalEvent, location: e.target.value})} type="text" placeholder="例如：樂天百貨" className="w-full bg-[#F9FAFB] text-cocoa p-3 rounded-xl pl-9 outline-none text-sm font-bold placeholder-[#D6CDB6]" />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] text-gray-400 block mb-1 font-bold ml-1">詳細地址</label>
                            <div className="relative">
                                <i className="fa-solid fa-map-pin absolute left-3.5 top-3.5 text-[#B0A590]"></i>
                                <input value={modalEvent.address} onChange={e => setModalEvent({...modalEvent, address: e.target.value})} type="text" placeholder="地址 / 交通方式" className="w-full bg-[#F9FAFB] text-cocoa p-3 rounded-xl pl-9 outline-none text-sm font-bold placeholder-[#D6CDB6]" />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] text-gray-400 block mb-1 font-bold ml-1">備註</label>
                        <textarea value={modalEvent.note || modalEvent.notes} onChange={e => setModalEvent({...modalEvent, note: e.target.value, notes: e.target.value})} placeholder="備註事項" className="w-full bg-white text-cocoa p-3.5 rounded-2xl outline-none text-sm border-2 border-[#E0E5D5] font-bold placeholder-[#D6CDB6] h-20 resize-none" />
                    </div>
                </div>
                <div className="flex gap-3 mt-6">
                    <button onClick={() => setShowModal(false)} className="flex-1 py-3.5 rounded-2xl bg-[#F0EAD6] text-gray-400 font-black hover:bg-[#E0DCCF] border-2 border-[#D6CDB6]">取消</button>
                    <button onClick={handleSave} className="flex-1 py-3.5 rounded-2xl bg-sage text-white font-black shadow-[0_4px_0_rgb(89,136,64)] active:shadow-none active:translate-y-[4px] transition-all hover:bg-[#68A04B] border-2 border-[#68A04B]">
                        保存
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Detail View Modal */}
      {viewingItem && (
        <div className="fixed inset-0 bg-cocoa/70 z-[200] flex items-center justify-center px-4 backdrop-blur-sm" onClick={() => setViewingItem(null)}>
            <div className="bg-[#FDFDF5] w-full max-w-lg rounded-[2rem] shadow-2xl animate-fade-in-up border-4 border-[#E0E5D5] relative overflow-hidden flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
                
                {/* Clean Header Section */}
                <div className="p-6 pb-4 border-b border-[#E0E5D5] bg-white relative z-10">
                    <button onClick={() => setViewingItem(null)} className="absolute top-4 right-4 w-9 h-9 bg-[#F9FAFB] rounded-full text-[#B0A590] border border-[#E0E5D5] flex items-center justify-center hover:bg-cocoa hover:text-white transition-colors">
                        <i className="fa-solid fa-xmark"></i>
                    </button>

                    <div className="flex flex-col gap-3 pr-10">
                         <div className="flex items-center gap-2">
                             <span className={`px-3 py-1 rounded-full text-[10px] font-black text-white shadow-sm ${getCategoryColor(viewingItem.type)}`}>
                                 {getCategoryLabel(viewingItem.type)}
                             </span>
                             <span className="bg-[#F0EAD6] text-cocoa border border-[#E0E5D5] px-3 py-1 rounded-full text-[10px] font-black">
                                 <i className="fa-regular fa-clock mr-1"></i> {viewingItem.time}
                             </span>
                         </div>
                         <h2 className="text-2xl font-black text-cocoa leading-tight tracking-tight">{viewingItem.title}</h2>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="p-6 overflow-y-auto custom-scroll flex-1 space-y-6 bg-[#FDFDF5]">
                    
                    {/* Location Info */}
                    {(viewingItem.location || viewingItem.address) && (
                        <div className="bg-white p-4 rounded-2xl border border-[#E0E5D5] shadow-sm space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-[#FFF8E1] border-2 border-[#FFE082] flex items-center justify-center text-[#F57F17] flex-shrink-0">
                                    <i className="fa-solid fa-map-location-dot text-lg"></i>
                                </div>
                                <div>
                                    <h4 className="text-base font-black text-cocoa">{viewingItem.location || '地點'}</h4>
                                    <p className="text-sm text-gray-400 font-bold mt-1 leading-snug">{viewingItem.address || '尚未填寫地址'}</p>
                                </div>
                            </div>
                            
                            {/* Map Buttons */}
                            {(viewingItem.googleMapUrl || viewingItem.naverMapUrl) ? (
                                <div className="flex gap-2 pt-1">
                                    {viewingItem.googleMapUrl && (
                                        <a href={viewingItem.googleMapUrl} target="_blank" className="flex-1 py-2.5 rounded-xl bg-white border-2 border-[#E0E5D5] text-[#4285F4] font-black text-xs flex items-center justify-center gap-1.5 hover:border-[#4285F4] hover:bg-[#4285F4]/5 transition-all shadow-sm">
                                            <i className="fa-brands fa-google text-sm"></i> Google
                                        </a>
                                    )}
                                    {viewingItem.naverMapUrl && (
                                        <a href={viewingItem.naverMapUrl} target="_blank" className="flex-1 py-2.5 rounded-xl bg-white border-2 border-[#E0E5D5] text-[#2DB400] font-black text-xs flex items-center justify-center gap-1.5 hover:border-[#2DB400] hover:bg-[#2DB400]/5 transition-all shadow-sm">
                                            <i className="fa-solid fa-n text-sm"></i> Naver
                                        </a>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center text-[10px] text-[#D6CDB6] font-bold bg-[#F9FAFB] py-2 rounded-xl border border-dashed border-[#E0E5D5]">
                                    未提供地圖連結
                                </div>
                            )}
                        </div>
                    )}

                    {/* Note Card */}
                    {(viewingItem.notes || viewingItem.note) && (
                        <div className="space-y-2">
                             <h4 className="text-[10px] font-black text-[#B0A590] uppercase tracking-wider flex items-center gap-1 ml-1">
                                <i className="fa-solid fa-note-sticky"></i> 備註
                             </h4>
                             <div className="bg-white p-4 rounded-2xl border-2 border-[#E0E5D5] border-dashed relative">
                                <p className="text-sm font-medium text-cocoa whitespace-pre-line leading-relaxed">
                                    {viewingItem.notes || viewingItem.note}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-white border-t border-[#E0E5D5] flex gap-3">
                     <button onClick={() => { if(window.confirm('確定刪除此行程？')) handleDeleteItem(viewingItem.id); }} className="px-5 py-3 rounded-2xl bg-[#FFF5F5] text-red-400 font-black border-2 border-red-50 hover:bg-red-50 hover:border-red-100 transition-colors">
                         <i className="fa-solid fa-trash-can"></i>
                     </button>
                     <button onClick={() => openEditModal(viewingItem)} className="flex-1 py-3 rounded-2xl bg-sage text-white font-black shadow-[0_4px_0_rgb(89,136,64)] active:shadow-none active:translate-y-[4px] transition-all border-2 border-[#68A04B] flex items-center justify-center gap-2">
                         <i className="fa-solid fa-pen"></i> 編輯行程
                     </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
