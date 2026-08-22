import React, { useState } from 'react';
import { X, Shuffle, Check, Sparkles } from 'lucide-react';
import { AVATAR_CATEGORIES, CUTE_AVATARS, getDefaultMemberAvatar } from '../constants/avatars';

interface AvatarPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatar: string | null;
  memberName?: string;
  onSelectAvatar: (avatarUrl: string) => void;
}

export const AvatarPickerModal: React.FC<AvatarPickerModalProps> = ({
  isOpen,
  onClose,
  currentAvatar,
  memberName = '成員',
  onSelectAvatar,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'girls' | 'boys'>('all');
  const [tempSelected, setTempSelected] = useState<string>(
    currentAvatar || getDefaultMemberAvatar(memberName)
  );

  if (!isOpen) return null;

  const filteredAvatars = selectedCategory === 'all' 
    ? CUTE_AVATARS 
    : CUTE_AVATARS.filter((a) => a.category === selectedCategory);

  const handleRandomize = () => {
    const randomItem = CUTE_AVATARS[Math.floor(Math.random() * CUTE_AVATARS.length)];
    setTempSelected(randomItem.url);
  };

  const handleConfirm = () => {
    onSelectAvatar(tempSelected);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-cocoa/60 z-[500] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-[#FBF9F2] w-full max-w-md rounded-[2.5rem] p-6 shadow-2xl border-4 border-beige-dark max-h-[90vh] flex flex-col relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b-2 border-beige-dark mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-sage-light text-sage flex items-center justify-center border border-sage/30">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="font-black text-lg text-cocoa leading-tight">選擇可愛人像</h3>
              <p className="text-[11px] font-bold text-gray-400">為 {memberName} 挑選簡約可愛人物頭像</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 bg-white rounded-full text-gray-400 hover:text-red-400 border border-beige-dark shadow-sm transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Current Preview Banner */}
        <div className="bg-white p-3.5 rounded-2xl border-2 border-beige-dark flex items-center justify-between gap-3 mb-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-beige border-2 border-sage/40 overflow-hidden shadow-inner p-0.5 relative flex-shrink-0">
              <img 
                src={tempSelected} 
                alt="preview"
                className="w-full h-full object-cover rounded-full"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = getDefaultMemberAvatar(memberName);
                }}
              />
            </div>
            <div>
              <span className="text-[10px] font-black text-sage bg-sage-light/60 px-2 py-0.5 rounded-full">目前選擇</span>
              <h4 className="font-black text-cocoa text-base leading-tight mt-0.5">{memberName}</h4>
            </div>
          </div>

          <button
            onClick={handleRandomize}
            className="px-3 py-2 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-xl font-black text-xs border border-amber-200 shadow-sm flex items-center gap-1.5 active:scale-95 transition-all"
            title="隨機挑選可愛人像"
          >
            <Shuffle size={14} />
            <span>隨機挑選</span>
          </button>
        </div>

        {/* Category Pill Tabs */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-2 mb-2">
          {AVATAR_CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 border-2 ${
                  isActive
                    ? 'bg-sage text-white border-sage shadow-hard-sm-sage'
                    : 'bg-white text-cocoa border-beige-dark hover:border-sage/40'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Avatar Grid View */}
        <div className="flex-1 overflow-y-auto custom-scroll pr-1 pb-2 min-h-[240px]">
          <div className="grid grid-cols-4 gap-2.5">
            {filteredAvatars.map((item) => {
              const isSelected = tempSelected === item.url;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setTempSelected(item.url);
                  }}
                  className={`flex flex-col items-center p-2 rounded-2xl border-2 transition-all relative group ${
                    isSelected
                      ? 'bg-sage-light/50 border-sage shadow-hard-sm-sage scale-105 ring-2 ring-sage/30'
                      : 'bg-white border-beige-dark hover:border-sage/50 hover:bg-beige'
                  }`}
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden mb-1 relative shadow-sm">
                    <img 
                      src={item.url} 
                      alt={item.name} 
                      className="w-full h-full object-cover"
                      loading="lazy" 
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-sage/30 flex items-center justify-center rounded-full">
                        <Check size={16} className="text-white drop-shadow-md stroke-[3]" />
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-cocoa truncate w-full text-center">
                    {item.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 pt-3 border-t-2 border-beige-dark mt-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl bg-white text-gray-400 font-black border-2 border-beige-dark hover:bg-gray-50 transition-all text-sm"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-3 rounded-2xl bg-sage hover:bg-sage-dark text-white font-black shadow-hard-sage border-2 border-sage-dark transition-all text-sm flex items-center justify-center gap-1.5"
          >
            <Check size={16} strokeWidth={3} />
            <span>確認套用</span>
          </button>
        </div>
      </div>
    </div>
  );
};
