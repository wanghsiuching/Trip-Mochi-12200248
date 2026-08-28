import React from 'react';
import { X, AlertCircle } from 'lucide-react';

export const SearchErrorModal = ({ isOpen, onClose, message }: { isOpen: boolean, onClose: () => void, message: string }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-cocoa/60 backdrop-blur-sm z-[70] flex flex-col items-center justify-end sm:justify-center sm:p-4 animate-fade-in" onClick={onClose}>
             <div className="bg-[#FAF8F2] w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-md sm:rounded-[2.5rem] rounded-none p-6 shadow-2xl border-0 sm:border-4 sm:border-beige-dark flex flex-col justify-between overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center pb-3 border-b-2 border-beige-dark flex-shrink-0">
                    <h3 className="text-xl font-black text-cocoa">搜尋結果</h3>
                    <button onClick={onClose} className="p-2 bg-white rounded-full text-gray-400 hover:text-red-400 border border-beige-dark shadow-sm transition-colors">
                        <X size={18} />
                    </button>
                </div>
                <div className="my-auto py-6 text-center">
                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4 text-yellow-500 border-2 border-yellow-200 shadow-sm">
                        <AlertCircle size={28} />
                    </div>
                    <h4 className="text-xl font-black text-cocoa mb-2">提示訊息</h4>
                    <p className="text-gray-400 font-bold text-sm leading-relaxed">{message}</p>
                </div>
                <div className="pt-3 border-t-2 border-beige-dark mt-auto flex-shrink-0">
                    <button onClick={onClose} className="w-full py-4 rounded-2xl font-bold text-cocoa bg-white border-2 border-beige-dark hover:bg-gray-50 transition-colors">關閉</button>
                </div>
            </div>
        </div>
    );
};
