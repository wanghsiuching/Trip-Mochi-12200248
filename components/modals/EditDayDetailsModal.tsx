import React, { useState, useEffect } from 'react';
import { X, Edit3, Shuffle } from 'lucide-react';
import { DatePickerField } from '../TimePickerComponents';

// Extensive fruit/food icon list
const FRUIT_ICONS = [
    '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈',
    '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🥑', '🍆', '🥔',
    '🥕', '🌽', '🌶️', '🫑', '🥒', '🥬', '🥦', '🍄', '🥜', '🌰',
    '🍞', '🥐', '🥖', '🥨', '🥯', '🥞', '🧇', '🧀', '🍔', '🍟',
    '🍕', '🌭', '🥪', '🌮', '🌯', '🥚', '🍳', '🥘', '🍲', '🥗',
    '🍿', '🍱', '🍘', '🍙', '🍚', '🍛', '🍜', '🍝', '🍠', '🍢',
    '🍣', '🍤', '🍥', '🥮', '🍡', '🥟', '🥠', '🍦', '🍧', '🍨',
    '🍩', '🍪', '🎂', '🍰', '🧁', '🥧', '🍫', '🍬', '🍭', '🍮',
    '🍯', '🍼', '🥛', '☕', '🍵', '🍶', '🍺', '🍻', '🥂', '🍷'
];

// Helper to get a random fruit
const getRandomFruit = () => FRUIT_ICONS[Math.floor(Math.random() * FRUIT_ICONS.length)];

export const EditDayDetailsModal = ({ isOpen, onClose, onConfirm, initialDate, initialLocation, initialFruit }: { isOpen: boolean, onClose: () => void, onConfirm: (date: string, loc: string, fruit: string) => void, initialDate: string, initialLocation: string, initialFruit: string }) => {
    const [loc, setLoc] = useState(initialLocation);
    const [date, setDate] = useState(initialDate);
    
    useEffect(() => { 
        setLoc(initialLocation); 
        setDate(initialDate);
    }, [initialLocation, initialDate, isOpen]);

    const handleConfirm = () => {
        // Randomly select a fruit from the pool upon confirmation
        const randomFruit = getRandomFruit();
        onConfirm(date, loc, randomFruit);
    };
    
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-cocoa/60 backdrop-blur-sm z-[70] flex flex-col items-center justify-end sm:justify-center sm:p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-[#FAF8F2] w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-md sm:rounded-[2.5rem] rounded-none p-6 shadow-2xl border-0 sm:border-4 sm:border-beige-dark flex flex-col justify-between overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center pb-3 border-b-2 border-beige-dark flex-shrink-0">
                    <h3 className="text-xl font-black text-cocoa">編輯行程資訊</h3>
                    <button onClick={onClose} className="p-2 bg-white rounded-full text-gray-400 hover:text-red-400 border border-beige-dark shadow-sm transition-colors">
                        <X size={18} />
                    </button>
                </div>
                
                <div className="overflow-y-auto custom-scroll flex-1 py-4 space-y-4">
                    <div className="w-14 h-14 bg-sage-light rounded-full flex items-center justify-center mx-auto text-sage border-2 border-white shadow-sm">
                        <Edit3 size={24} />
                    </div>
                    <p className="text-gray-400 font-bold text-center text-xs">修改日期與當日地點</p>
                    
                    <div className="space-y-4">
                        <DatePickerField
                            label="日期"
                            value={date}
                            onChange={setDate}
                            themeColor="sage"
                        />

                        <div className="bg-white p-3 rounded-2xl border-2 border-beige-dark flex items-center gap-3 shadow-sm">
                            <div className="w-10 h-10 bg-beige rounded-xl flex items-center justify-center text-xl shadow-sm border border-beige-dark flex-shrink-0 cursor-default select-none relative group">
                                {initialFruit || '🍎'}
                                <div className="absolute inset-0 bg-black/10 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Shuffle size={14} className="text-white"/>
                                </div>
                            </div>
                            <div className="flex-1">
                                <label className="text-[10px] font-bold text-gray-400 block mb-1">主要地點</label>
                                <input 
                                    value={loc}
                                    onChange={(e) => setLoc(e.target.value)}
                                    placeholder="例如: 札幌 Sapporo"
                                    className="w-full bg-transparent font-bold text-cocoa outline-none text-sm"
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && loc && date) {
                                            handleConfirm();
                                        }
                                    }}
                                />
                            </div>
                        </div>
                        <p className="text-[10px] text-gray-400 font-bold text-center italic">* 確認修改時將會隨機更換水果圖示</p>
                    </div>
                </div>

                <div className="flex gap-3 pt-3 border-t-2 border-beige-dark mt-auto flex-shrink-0">
                    <button onClick={onClose} className="flex-1 py-4 rounded-2xl font-bold text-gray-400 bg-white border-2 border-beige-dark hover:bg-gray-50 transition-colors">取消</button>
                    <button onClick={handleConfirm} disabled={!loc || !date} className="flex-1 py-4 rounded-2xl font-bold text-white bg-sage hover:bg-sage-dark shadow-hard-sage border-2 border-sage-dark active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 disabled:shadow-none">確認修改</button>
                </div>
            </div>
        </div>
    );
};
