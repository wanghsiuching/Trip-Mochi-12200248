import React from 'react';
import { createPortal } from 'react-dom';
import { X, Trash2 } from 'lucide-react';

interface DeleteTipConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  subtitle?: string;
  zIndex?: string;
}

export const DeleteTipConfirmModal: React.FC<DeleteTipConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  subtitle = '包含其重點筆記與所有附帶相片。',
  zIndex = 'z-[90]'
}) => {
  if (!isOpen) return null;
  const modalContent = (
    <div 
      className={`fixed inset-0 bg-cocoa/60 backdrop-blur-sm ${zIndex} flex items-center justify-center p-4 animate-fade-in`} 
      onClick={onClose}
    >
      <div 
        className="bg-[#FAF8F2] w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl border-4 border-beige-dark flex flex-col justify-between overflow-hidden animate-scale-in my-auto" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center pb-3 border-b-2 border-beige-dark flex-shrink-0">
          <h3 className="text-xl font-black text-cocoa">刪除旅遊 TIP</h3>
          <button 
            type="button"
            onClick={onClose} 
            className="p-2 bg-white rounded-full text-gray-400 hover:text-red-400 border border-beige-dark shadow-sm transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>
        <div className="my-auto py-6 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500 border-2 border-red-200 shadow-sm">
            <Trash2 size={28} />
          </div>
          <h4 className="text-xl font-black text-cocoa mb-2">確定要刪除?</h4>
          <p className="text-gray-400 font-bold text-sm leading-relaxed">
            確定要刪除 <span className="text-red-500 font-black">{title}</span> 嗎？<br/>
            {subtitle}
          </p>
        </div>
        <div className="flex gap-3 pt-3 border-t-2 border-beige-dark mt-auto flex-shrink-0">
          <button 
            type="button"
            onClick={onClose} 
            className="flex-1 py-4 rounded-2xl font-bold text-gray-400 bg-white border-2 border-beige-dark hover:bg-gray-50 transition-colors cursor-pointer"
          >
            取消
          </button>
          <button 
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }} 
            className="flex-1 py-4 rounded-2xl font-bold text-white bg-red-400 hover:bg-red-500 shadow-hard-sm border-2 border-red-500 active:translate-y-1 active:shadow-none transition-all cursor-pointer"
          >
            刪除
          </button>
        </div>
      </div>
    </div>
  );
  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
