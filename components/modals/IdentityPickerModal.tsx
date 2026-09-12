import React, { useState } from 'react';
import { X, UserCheck, Plus, Check, Sparkles, AlertCircle } from 'lucide-react';
import { Member } from '../../types';
import { getDefaultMemberAvatar } from '../../constants/avatars';
import { MemberAvatar } from '../MemberAvatar';

interface IdentityPickerModalProps {
  isOpen: boolean;
  onClose?: () => void;
  members: Member[];
  currentMemberId?: string;
  onSelectMember: (member: Member) => void;
  onAddNewMember?: (name: string, avatar: string | null) => void;
  title?: string;
  isRequired?: boolean;
}

export const IdentityPickerModal: React.FC<IdentityPickerModalProps> = ({
  isOpen,
  onClose,
  members,
  currentMemberId,
  onSelectMember,
  onAddNewMember,
  title = '這趟旅行，你是誰？',
  isRequired = false,
}) => {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');

  if (!isOpen) return null;

  // Filter out soft-deleted members
  const activeMembers = members.filter(m => !m.deletedAt);

  const handleCreateAndSelect = () => {
    const trimmed = newMemberName.trim();
    if (!trimmed) return;
    const defaultAvatar = getDefaultMemberAvatar(trimmed);
    if (onAddNewMember) {
      onAddNewMember(trimmed, defaultAvatar);
    }
    // Synthesize temporary member so state selects immediately
    const tempMember: Member = {
      id: `m_${Date.now()}`,
      name: trimmed,
      avatar: defaultAvatar,
      fruit: '✨',
    };
    onSelectMember(tempMember);
    setIsAddingNew(false);
    setNewMemberName('');
  };

  return (
    <div className="fixed inset-0 bg-cocoa/60 backdrop-blur-sm z-[90] flex flex-col items-center justify-end sm:justify-center sm:p-4 animate-fade-in">
      <div 
        className="bg-[#FAF8F2] w-full max-h-[85vh] sm:max-h-[90vh] sm:max-w-md sm:rounded-[2.5rem] rounded-t-[2rem] p-6 shadow-2xl border-0 sm:border-4 sm:border-beige-dark flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start pb-3 border-b-2 border-beige-dark flex-shrink-0">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-sage mb-0.5">
              <Sparkles size={14} />
              <span>本機操作者身分</span>
            </div>
            <h3 className="text-xl font-black text-cocoa">{title}</h3>
            <p className="text-xs text-gray-500 mt-1">
              歷史紀錄與異動將以此身分記錄。隨時可在「成員」頁面切換。
            </p>
          </div>
          {!isRequired && onClose && (
            <button 
              onClick={onClose} 
              className="p-2 bg-white rounded-full text-gray-400 hover:text-red-400 border border-beige-dark shadow-sm transition-colors flex-shrink-0 ml-2"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Info notice: Local Identity explanation */}
        <div className="bg-sage/10 border border-sage/20 rounded-2xl p-3 my-3 flex items-start gap-2.5">
          <AlertCircle size={16} className="text-sage flex-shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed text-cocoa/80">
            Trip Mochi 為免登入共編手帳，請點選您在此趟旅行中的角色，讓旅伴清楚知道是誰新增或修改了行程！
          </p>
        </div>

        {/* Content list */}
        <div className="overflow-y-auto custom-scroll flex-1 py-2 space-y-2.5">
          {activeMembers.length === 0 ? (
            <div className="text-center py-6 text-gray-400 text-xs">
              目前還沒有旅伴資料，請在下方輸入您的名字建立身分！
            </div>
          ) : (
            activeMembers.map((member) => {
              const isSelected = currentMemberId === member.id;
              return (
                <button
                  key={member.id}
                  onClick={() => onSelectMember(member)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-2xl border-2 transition-all active:scale-[0.98] text-left cursor-pointer ${
                    isSelected
                      ? 'bg-sage/15 border-sage shadow-hard-sm-sage'
                      : 'bg-white border-beige-dark hover:border-sage/50 shadow-xs'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex-shrink-0">
                      <MemberAvatar
                        avatar={member.avatar || member.fruit}
                        name={member.name}
                        id={member.id}
                        size="md"
                        showBorder={true}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-cocoa text-base truncate">{member.name}</span>
                        {isSelected && (
                          <span className="text-[10px] font-black text-sage bg-white px-2 py-0.5 rounded-full border border-sage/40 shadow-xs">
                            目前選擇
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-400 truncate">
                        旅伴 ID: {member.id.substring(0, 10)}
                      </p>
                    </div>
                  </div>

                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                    isSelected ? 'bg-sage text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-sage/20'
                  }`}>
                    {isSelected ? <Check size={16} strokeWidth={3} /> : <UserCheck size={16} />}
                  </div>
                </button>
              );
            })
          )}

          {/* Add new member form */}
          {isAddingNew ? (
            <div className="bg-white border-2 border-sage p-4 rounded-2xl shadow-sm space-y-3 mt-2 animate-fade-in">
              <label className="text-xs font-black text-cocoa block">我是新成員 / 新旅伴：</label>
              <input
                type="text"
                placeholder="請輸入您的暱稱 (例如: 王小明)"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCreateAndSelect();
                  }
                }}
                className="w-full bg-[#FAF8F2] border-2 border-beige-dark focus:border-sage rounded-xl px-3.5 py-2.5 text-sm font-bold text-cocoa outline-none transition-colors"
                autoFocus
              />
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => { setIsAddingNew(false); setNewMemberName(''); }}
                  className="px-3 py-1.5 text-xs font-bold text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleCreateAndSelect}
                  disabled={!newMemberName.trim()}
                  className="px-4 py-2 bg-sage hover:bg-sage-dark text-white text-xs font-black rounded-xl shadow-hard-sm-sage disabled:opacity-50 transition-all active:scale-95"
                >
                  建立並以此身分進入
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsAddingNew(true)}
              className="w-full py-3 px-4 border-2 border-dashed border-beige-dark hover:border-sage rounded-2xl text-xs font-bold text-gray-400 hover:text-sage flex items-center justify-center gap-2 bg-white/50 transition-all active:scale-98 mt-1"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>名單上沒有我？新增自己為新旅伴</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
