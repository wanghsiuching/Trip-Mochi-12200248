import React from 'react';

export const ToggleSwitch = ({ checked, onChange, label, colorClass = 'bg-sage' }: { checked: boolean; onChange: (v: boolean) => void; label?: string; colorClass?: string }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className="flex items-center gap-2.5 cursor-pointer group min-h-[44px] py-1 text-left"
  >
    <span className={`w-11 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out flex-shrink-0 flex items-center ${checked ? colorClass : 'bg-gray-200'}`}>
      <span className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </span>
    {label && <span className="text-xs font-bold text-gray-600 select-none group-hover:text-cocoa transition-colors">{label}</span>}
  </button>
);
