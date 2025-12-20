
import React from 'react';
import { Member, Tab } from '../types';

interface LayoutProps {
  currentTab: Tab;
  setCurrentTab: (tab: Tab) => void;
  members: Member[];
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ currentTab, setCurrentTab, members, children }) => {
  const navItems: { id: Tab; label: string; icon: string }[] = [
    { id: 'schedule', label: '行程', icon: 'fa-calendar-day' },
    { id: 'bookings', label: '預訂', icon: 'fa-book-bookmark' },
    { id: 'expense', label: '記帳', icon: 'fa-wallet' },
    { id: 'journal', label: '日誌', icon: 'fa-pen-nib' },
    { id: 'planning', label: '準備', icon: 'fa-suitcase' },
    { id: 'members', label: '成員', icon: 'fa-users' },
  ];

  return (
    <div className="h-full w-full flex flex-col lg:flex-row lg:p-8 lg:gap-8 lg:max-w-7xl lg:mx-auto relative">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white rounded-[2rem] soft-shadow p-6 h-full flex-shrink-0 overflow-y-auto custom-scroll border-4 border-[#F2F0E6]">
        <div className="mb-8 flex items-center gap-3 flex-shrink-0">
          <div className="flex -space-x-3 overflow-hidden py-1 pl-1">
            {members.slice(0, 4).map((member, idx) => (
              <div key={idx} className="w-10 h-10 rounded-full bg-ac-bg border-2 border-white flex items-center justify-center text-ac-brown shadow-sm overflow-hidden relative z-0" style={{ zIndex: members.length - idx }}>
                {member.avatar ? (
                  <img src={member.avatar} className="w-full h-full object-cover" alt={member.name} loading="lazy" />
                ) : (
                  <span className="text-xs font-bold">{member.name.charAt(0)}</span>
                )}
              </div>
            ))}
          </div>
          <div>
            <h1 className="text-xl font-black text-ac-teal tracking-wide">Travel Planner</h1>
            <p className="text-xs text-ac-subtext font-bold">2026 Trip</p>
          </div>
        </div>
        <nav className="space-y-2 flex-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full text-left px-4 py-3 rounded-2xl flex items-center gap-3 transition-all font-bold 
                ${currentTab === item.id 
                  ? 'bg-[#E8F3E0] text-ac-green border-r-4 border-ac-green' 
                  : 'text-ac-subtext hover:bg-ac-bg hover:text-ac-brown'}`}
            >
              <i className={`fa-solid ${item.icon} w-6 text-center`}></i> {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full min-h-0 relative w-full min-w-0">
        {/* Mobile Header (Fixed at top) */}
        <header className="flex-shrink-0 lg:hidden px-4 py-3 bg-ac-bg border-b-2 border-dashed border-[#E0E5D5] z-30 flex justify-between items-center shadow-sm">
            <div className="flex-1 min-w-0 pr-2">
                <h1 className="text-xl font-black text-ac-teal tracking-wide leading-tight truncate">Travel Planner</h1>
                <p className="text-xs font-bold text-ac-subtext leading-none mt-1 flex items-center gap-1">
                    <i className="fa-solid fa-plane-up text-ac-green text-[10px]"></i> 2026 Trip
                </p>
            </div>
            <div className="flex -space-x-2 overflow-hidden pl-1 flex-shrink-0">
                {members.slice(0, 4).map((member, idx) => (
                    <div key={idx} className="w-9 h-9 rounded-full bg-white border-2 border-[#F7F4EB] flex items-center justify-center text-[#D6CDB6] shadow-sm overflow-hidden relative z-0" style={{ zIndex: members.length - idx }}>
                        {member.avatar ? (
                            <img src={member.avatar} className="w-full h-full object-cover" alt={member.name} loading="lazy" />
                        ) : (
                            <span className="text-xs font-black text-ac-brown">{member.name.charAt(0)}</span>
                        )}
                    </div>
                ))}
            </div>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 relative w-full">
            <div className="absolute inset-0 overflow-y-auto custom-scroll pb-24 lg:pb-0">
                {children}
            </div>
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#FDFDF5] border-t-2 border-[#E0E5D5] grid grid-cols-6 gap-0 items-center z-[50] h-20 pb-6 shadow-[0_-4px_10px_-1px_rgba(112,90,69,0.05)] rounded-t-2xl">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentTab(item.id)}
            className={`flex flex-col items-center justify-center h-full gap-0.5 transition-all nav-item
              ${currentTab === item.id ? 'text-ac-green font-black transform scale-110' : 'text-[#B0A590] hover:text-ac-green'}`}
          >
            <i className={`fa-solid ${item.icon} text-xl mb-0.5`}></i>
            <span className="text-xs font-black tracking-wide">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};
