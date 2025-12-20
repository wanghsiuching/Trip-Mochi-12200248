
import React from 'react';
import { Calendar, Ticket, Wallet, BookOpen, CheckSquare, Users, Plane } from 'lucide-react';
import { Tab, THEME } from '../types';

export const Card = ({ children, className = '', onClick }: { children?: React.ReactNode, className?: string, onClick?: () => void }) => (
  <div 
    onClick={onClick}
    className={`
      ${THEME.colors.card} rounded-[2rem] p-5 shadow-hard 
      border-2 border-beige-dark transition-all duration-200
      ${onClick ? `cursor-pointer ${THEME.colors.shadowActive}` : ''} ${className}
    `}
  >
    {children}
  </div>
);

export const BoardingPass = () => (
  <div className="relative overflow-hidden rounded-3xl bg-white shadow-hard mb-6 border-2 border-beige-dark">
    <div className="bg-[#5B7C99] p-4 flex justify-between items-center text-white">
      <span className="font-bold tracking-widest text-sm">AIRLINE</span>
      <Plane className="w-5 h-5 opacity-80" />
    </div>
    <div className="p-5">
      <div className="flex justify-between items-center mb-4">
        <div className="text-center">
          <div className="text-3xl font-black text-cocoa">TPE</div>
          <div className="text-xs text-gray-400 font-bold">台北</div>
        </div>
        <div className="flex-1 px-4 flex flex-col items-center">
          <div className="text-xs text-gray-400 mb-1 font-bold">2h 45m</div>
          <div className="w-full h-0.5 bg-gray-200 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-1 rounded-full border border-gray-200">
              <Plane className="w-4 h-4 text-gray-300 rotate-90" />
            </div>
          </div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-black text-cocoa">KIX</div>
          <div className="text-xs text-gray-400 font-bold">大阪</div>
        </div>
      </div>
      <div className="flex justify-between text-sm">
        <div><div className="text-gray-400 text-xs font-bold">DATE</div><div className="font-bold text-cocoa">10/24</div></div>
        <div><div className="text-gray-400 text-xs font-bold">TIME</div><div className="font-bold text-cocoa">08:30</div></div>
        <div><div className="text-gray-400 text-xs font-bold">GATE</div><div className="font-bold text-cocoa">B7</div></div>
        <div><div className="text-gray-400 text-xs font-bold">SEAT</div><div className="font-bold text-cocoa">12A</div></div>
      </div>
    </div>
    <div className="relative h-4 bg-white">
      <div className="absolute -left-2 top-0 w-4 h-4 bg-beige rounded-full border-r-2 border-beige-dark"></div>
      <div className="absolute -right-2 top-0 w-4 h-4 bg-beige rounded-full border-l-2 border-beige-dark"></div>
      <div className="absolute top-1/2 left-4 right-4 border-t-2 border-dashed border-gray-300"></div>
    </div>
  </div>
);

export const BottomNav = ({ activeTab, setTab }: { activeTab: Tab, setTab: (t: Tab) => void }) => {
  const tabs = [
    { id: 'schedule', icon: Calendar, label: '行程' },
    { id: 'bookings', icon: Ticket, label: '預訂' },
    { id: 'expense', icon: Wallet, label: '記帳' },
    { id: 'journal', icon: BookOpen, label: '日誌' },
    { id: 'planning', icon: CheckSquare, label: '清單' },
    { id: 'members', icon: Users, label: '成員' },
  ];

  return (
    <div className="fixed bottom-0 left-0 w-full bg-beige/95 backdrop-blur-md border-t-2 border-beige-dark pb-safe pt-2 z-40">
      <div className="flex overflow-x-auto no-scrollbar px-4 pb-2 gap-2 max-w-md mx-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setTab(tab.id as Tab)}
              className={`flex-shrink-0 flex flex-col items-center justify-center w-14 transition-all duration-300 ${isActive ? '-translate-y-2' : ''}`}
            >
              <div className={`p-3 rounded-2xl transition-all duration-300 mb-1 border-2 ${isActive ? 'bg-sage border-sage text-white shadow-hard-sage' : 'bg-white border-transparent text-gray-400'}`}>
                <tab.icon size={20} strokeWidth={isActive ? 3 : 2.5} />
              </div>
              <span className={`text-[10px] font-bold ${isActive ? 'text-sage' : 'text-gray-400'}`}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
