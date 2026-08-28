import React from 'react';
import { X, Trash2 } from 'lucide-react';

export const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, tripName }: { isOpen: boolean, onClose: () => void, onConfirm: () => void, tripName: string }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-cocoa/60 backdrop-blur-sm z-[70] flex flex-col items-center justify-end sm:justify-center sm:p-4 animate-fade-in" onClick={onClose}>
             <div className="bg-[#FAF8F2] w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-md sm:rounded-[2.5rem] rounded-none p-6 shadow-2xl border-0 sm:border-4 sm:border-beige-dark flex flex-col justify-between overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center pb-3 border-b-2 border-beige-dark flex-shrink-0">
                    <h3 className="text-xl font-black text-cocoa">刪除行程</h3>
                    <button onClick={onClose} className="p-2 bg-white rounded-full text-gray-400 hover:text-red-400 border border-beige-dark shadow-sm transition-colors">
                        <X size={18} />
                    </button>
                </div>
                <div className="my-auto py-6 text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500 border-2 border-red-200 shadow-sm">
                        <Trash2 size={28} />
                    </div>
                    <h4 className="text-xl font-black text-cocoa mb-2">確定要刪除行程?</h4>
                    <p className="text-gray-400 font-bold text-sm leading-relaxed">確定要刪除 <span className="text-red-500 font-black">{tripName}</span> 嗎？<br/>此動作無法復原。</p>
                </div>
                <div className="flex gap-3 pt-3 border-t-2 border-beige-dark mt-auto flex-shrink-0">
                    <button onClick={onClose} className="flex-1 py-4 rounded-2xl font-bold text-gray-400 bg-white border-2 border-beige-dark hover:bg-gray-50 transition-colors">取消</button>
                    <button onClick={onConfirm} className="flex-1 py-4 rounded-2xl font-bold text-white bg-red-400 hover:bg-red-500 shadow-hard-sm border-2 border-red-500 active:translate-y-1 active:shadow-none transition-all">刪除</button>
                </div>
            </div>
        </div>
    );
};
