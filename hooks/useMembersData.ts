import { useState } from 'react';
import { Member } from '../types';
import { getDefaultMemberAvatar } from '../constants/avatars';
import { addTripItem, updateTripField } from '../services/tripService';

export const useMembersData = (currentTripId: string) => {
  const [members, setMembers] = useState<Member[]>([]);

  const handleAddMember = (name: string, avatar: string | null) => {
    const fruits = [
      '🍎', '🍏', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', 
      '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🥑', '🍆',
      '🥕', '🌽', '🌶️', '🫑', '🥒', '🥬', '🥦', '🍄', '栗', '🌰'
    ];
    const randomFruit = fruits[Math.floor(Math.random() * fruits.length)];
    const finalAvatar = avatar || getDefaultMemberAvatar(name || `member-${Date.now()}`);
    addTripItem(currentTripId, 'members', { 
      id: Date.now().toString(), 
      name, 
      avatar: finalAvatar, 
      fruit: randomFruit 
    });
  };

  const handleUpdateMember = (updated: Member) => {
    updateTripField(currentTripId, 'members', members.map(m => m.id === updated.id ? updated : m));
  };

  const handleDeleteMember = (id: string) => {
    if (members.length > 1) {
      updateTripField(currentTripId, 'members', members.filter(m => m.id !== id));
    }
  };

  const getMemberNames = (ids?: string[]) => {
    if (!ids || ids.length === 0) return '';
    return ids.map(id => members.find(m => m.id === id)?.name).filter(Boolean).join(', ');
  };

  return {
    members,
    setMembers,
    handleAddMember,
    handleUpdateMember,
    handleDeleteMember,
    getMemberNames
  };
};
