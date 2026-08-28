import React, { useState } from 'react';
import { X } from 'lucide-react';

export const CreateTripModal = ({ isOpen, onClose, onConfirm }: { isOpen: boolean, onClose: () => void, onConfirm: (name: string) => void }) => {
    const [name, setName] = useState('');
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-cocoa/60 backdrop-blur-sm z-[70] flex flex-col items-center justify-end sm:justify-center sm:p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-[#FAF8F2] w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-md sm:rounded-[2.5rem] rounded-none p-6 shadow-2xl border-0 sm:border-4 sm:border-beige-dark flex flex-col justify-between overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center pb-3 border-b-2 border-beige-dark flex-shrink-0">
                    <h3 className="text-xl font-black text-cocoa">建立新行程</h3>
                    <button onClick={onClose} className="p-2 bg-white rounded-full text-gray-400 hover:text-red-400 border border-beige-dark shadow-sm transition-colors">
                        <X size={18} />
                    </button>
                </div>
                <div className="my-auto py-6 space-y-4">
                    <div className="bg-white p-4 rounded-2xl border-2 border-beige-dark shadow-sm">
                        <label className="text-xs font-bold text-gray-400 block mb-2">行程名稱</label>
                        <input 
                            autoFocus
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full text-lg font-bold text-cocoa outline-none bg-transparent placeholder:text-gray-300"
                            placeholder="例如: 東京五日遊"
                            onKeyDown={(e) => e.key === 'Enter' && name && onConfirm(name)}
                        />
                    </div>
                </div>
                <div className="flex gap-3 pt-3 border-t-2 border-beige-dark mt-auto flex-shrink-0">
                    <button onClick={onClose} className="flex-1 py-4 rounded-2xl font-bold text-gray-400 bg-white border-2 border-beige-dark hover:bg-gray-50 transition-colors">取消</button>
                    <button onClick={() => name && onConfirm(name)} disabled={!name} className="flex-1 py-4 rounded-2xl font-bold text-white bg-sage hover:bg-sage-dark shadow-hard-sage border-2 border-sage-dark active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 disabled:shadow-none">建立行程</button>
                </div>
            </div>
        </div>
    );
};
