import React from 'react';

export const ToggleSwitch = ({ checked, onChange, label, colorClass = 'bg-sage' }: { checked: boolean; onChange: (v: boolean) => void; label?: string; colorClass?: string }) => (
  <div className="flex items-center gap-2 cursor-pointer group" onClick={() => onChange(!checked)}>
    <div className={`w-10 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${checked ? colorClass : 'bg-gray-200'}`}>
      <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
    </div>
    {label && <span className="text-xs font-bold text-gray-500 select-none group-hover:text-cocoa transition-colors">{label}</span>}
  </div>
);
