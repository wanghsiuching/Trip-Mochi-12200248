import React, { useEffect, useId, useRef, useState } from 'react';
import { Clock, Calendar as CalendarIcon, LucideIcon } from 'lucide-react';

export interface DateTimePickerFieldProps {
  label: string;
  value: string; // ISO datetime string: YYYY-MM-DDTHH:mm
  onChange: (value: string) => void;
  themeColor?: string;
  icon?: LucideIcon;
  subLabel?: string;
  className?: string;
  required?: boolean;
}

export const DateTimePickerField: React.FC<DateTimePickerFieldProps> = ({
  label,
  value,
  onChange,
  icon: Icon = CalendarIcon,
  subLabel,
  className = '',
  required = false
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const [localValue, setLocalValue] = useState(value || '');
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setLocalValue(value || '');
    }
  }, [value, isFocused]);

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Let direct clicks on the native input or its <label> work naturally without reopening/resetting the picker
    if (e.target === inputRef.current || (e.target instanceof HTMLElement && e.target.closest('label'))) {
      return;
    }
    if (inputRef.current) {
      try {
        if ('showPicker' in HTMLInputElement.prototype) {
          inputRef.current.showPicker();
        } else {
          inputRef.current.focus();
        }
      } catch {
        inputRef.current.focus();
      }
    }
  };

  return (
    <div
      onClick={handleContainerClick}
      className={`bg-white p-3 rounded-xl border-2 border-beige-dark shadow-sm hover:border-[#D0D6C0] transition-colors cursor-pointer min-h-[44px] ${className}`}
    >
      <div className="flex items-center justify-between mb-1">
        <label htmlFor={inputId} className="text-[10px] font-bold text-gray-400 flex items-center gap-1 leading-none cursor-pointer">
          {Icon && <Icon size={12} className="text-gray-400" />}
          <span>{label}</span>
          {required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
        {subLabel && <span className="text-[9px] text-gray-300 font-bold">{subLabel}</span>}
      </div>
      <input
        id={inputId}
        ref={inputRef}
        type="datetime-local"
        value={localValue}
        onFocus={() => setIsFocused(true)}
        onChange={(e) => {
          const next = e.target.value;
          setLocalValue(next);
          if (next) {
            onChange(next);
          }
        }}
        onBlur={(e) => {
          setIsFocused(false);
          const committed = e.target.value;
          if (committed) {
            setLocalValue(committed);
            onChange(committed);
          } else {
            setLocalValue(value || '');
          }
        }}
        className="w-full min-h-[28px] bg-transparent font-bold text-cocoa outline-none text-sm cursor-pointer"
        style={{ colorScheme: 'light' }}
      />
    </div>
  );
};

export interface TimePickerFieldProps {
  label: string;
  value: string; // HH:mm
  onChange: (value: string) => void;
  themeColor?: string;
  icon?: LucideIcon;
  className?: string;
  subLabel?: string;
  required?: boolean;
}

export const TimePickerField: React.FC<TimePickerFieldProps> = ({
  label,
  value,
  onChange,
  icon: Icon = Clock,
  className = '',
  subLabel,
  required = false
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const [localValue, setLocalValue] = useState(value || '');
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setLocalValue(value || '');
    }
  }, [value, isFocused]);

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === inputRef.current || (e.target instanceof HTMLElement && e.target.closest('label'))) {
      return;
    }
    if (inputRef.current) {
      try {
        if ('showPicker' in HTMLInputElement.prototype) {
          inputRef.current.showPicker();
        } else {
          inputRef.current.focus();
        }
      } catch {
        inputRef.current.focus();
      }
    }
  };

  return (
    <div
      onClick={handleContainerClick}
      className={`bg-white p-3 rounded-xl border-2 border-beige-dark shadow-sm hover:border-[#D0D6C0] transition-colors cursor-pointer ${className}`}
    >
      <div className="flex items-center justify-between mb-1">
        <label htmlFor={inputId} className="text-[10px] font-bold text-gray-400 flex items-center gap-1 leading-none cursor-pointer">
          {Icon && <Icon size={12} className="text-gray-400" />}
          <span>{label}</span>
          {required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
        {subLabel && <span className="text-[9px] text-gray-300 font-bold">{subLabel}</span>}
      </div>
      <input
        id={inputId}
        ref={inputRef}
        type="time"
        value={localValue}
        onFocus={() => setIsFocused(true)}
        onChange={(e) => {
          const next = e.target.value;
          setLocalValue(next);
          onChange(next);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          const committed = e.target.value;
          setLocalValue(committed);
          if (committed !== value) {
            onChange(committed);
          }
        }}
        className="w-full bg-transparent font-bold text-cocoa outline-none text-sm cursor-pointer"
        style={{ colorScheme: 'light' }}
      />
    </div>
  );
};

export interface DatePickerFieldProps {
  label: string;
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  themeColor?: string;
  icon?: LucideIcon;
  className?: string;
  subLabel?: string;
  required?: boolean;
}

export const DatePickerField: React.FC<DatePickerFieldProps> = ({
  label,
  value,
  onChange,
  icon: Icon = CalendarIcon,
  className = '',
  subLabel,
  required = false
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const [localValue, setLocalValue] = useState(value || '');
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setLocalValue(value || '');
    }
  }, [value, isFocused]);

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === inputRef.current || (e.target instanceof HTMLElement && e.target.closest('label'))) {
      return;
    }
    if (inputRef.current) {
      try {
        if ('showPicker' in HTMLInputElement.prototype) {
          inputRef.current.showPicker();
        } else {
          inputRef.current.focus();
        }
      } catch {
        inputRef.current.focus();
      }
    }
  };

  return (
    <div
      onClick={handleContainerClick}
      className={`bg-white p-3 rounded-xl border-2 border-beige-dark shadow-sm hover:border-[#D0D6C0] transition-colors cursor-pointer ${className}`}
    >
      <div className="flex items-center justify-between mb-1">
        <label htmlFor={inputId} className="text-[10px] font-bold text-gray-400 flex items-center gap-1 leading-none cursor-pointer">
          {Icon && <Icon size={12} className="text-gray-400" />}
          <span>{label}</span>
          {required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
        {subLabel && <span className="text-[9px] text-gray-300 font-bold">{subLabel}</span>}
      </div>
      <input
        id={inputId}
        ref={inputRef}
        type="date"
        value={localValue}
        onFocus={() => setIsFocused(true)}
        onChange={(e) => {
          const next = e.target.value;
          setLocalValue(next);
          if (next) {
            onChange(next);
          }
        }}
        onBlur={(e) => {
          setIsFocused(false);
          const committed = e.target.value;
          if (committed) {
            setLocalValue(committed);
            onChange(committed);
          } else {
            setLocalValue(value || '');
          }
        }}
        className="w-full bg-transparent font-bold text-cocoa outline-none text-sm cursor-pointer"
        style={{ colorScheme: 'light' }}
      />
    </div>
  );
};
