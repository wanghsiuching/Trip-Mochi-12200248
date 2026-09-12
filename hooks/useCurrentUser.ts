import { useState, useEffect, useCallback } from 'react';
import { Member, LocalUserIdentity } from '../types';

/**
 * Local identity !== authenticated identity
 *
 * NOTE: Trip Mochi operates as a free, friction-free PWA where multiple companions
 * collaborate using a shared Trip Code without requiring OAuth logins.
 * 
 * LocalUserIdentity represents the device-level operator identity on this physical device.
 * It specifies which Member the person holding the phone is acting as.
 * Stored locally in localStorage per trip: `trip_mochi_current_user_${tripId}`.
 */

const getOrCreateDeviceId = (): string => {
  const DEVICE_KEY = 'trip_mochi_device_user_id';
  let deviceId = localStorage.getItem(DEVICE_KEY);
  if (!deviceId) {
    deviceId = `local_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    localStorage.setItem(DEVICE_KEY, deviceId);
  }
  return deviceId;
};

export const getStoredUserIdentity = (tripId: string): LocalUserIdentity | null => {
  if (!tripId) return null;
  try {
    const raw = localStorage.getItem(`trip_mochi_current_user_${tripId}`);
    if (raw) {
      return JSON.parse(raw) as LocalUserIdentity;
    }
  } catch (err) {
    console.warn('Failed to parse stored user identity:', err);
  }
  return null;
};

export const setStoredUserIdentity = (tripId: string, identity: LocalUserIdentity): void => {
  if (!tripId) return;
  try {
    localStorage.setItem(`trip_mochi_current_user_${tripId}`, JSON.stringify(identity));
  } catch (err) {
    console.warn('Failed to save user identity:', err);
  }
};

export const useCurrentUser = (tripId: string, members: Member[] = []) => {
  const [currentUser, setCurrentUserState] = useState<LocalUserIdentity | null>(() => {
    return getStoredUserIdentity(tripId);
  });
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);

  // Sync state when tripId changes
  useEffect(() => {
    if (!tripId) {
      setCurrentUserState(null);
      return;
    }
    const stored = getStoredUserIdentity(tripId);
    if (stored) {
      // Check if the member's name or avatar updated in the trip
      const matchingMember = members.find(m => m.id === stored.memberId);
      if (matchingMember && (matchingMember.name !== stored.displayName || matchingMember.avatar !== stored.avatar)) {
        const updated: LocalUserIdentity = {
          ...stored,
          displayName: matchingMember.name,
          avatar: matchingMember.avatar,
        };
        setStoredUserIdentity(tripId, updated);
        setCurrentUserState(updated);
      } else {
        setCurrentUserState(stored);
      }
    } else {
      setCurrentUserState(null);
    }
  }, [tripId, members]);

  const selectMemberAsIdentity = useCallback((member: Member) => {
    if (!tripId) return;
    const deviceId = getOrCreateDeviceId();
    const identity: LocalUserIdentity = {
      userId: deviceId,
      memberId: member.id,
      displayName: member.name,
      avatar: member.avatar,
      createdAt: Date.now(),
    };
    setStoredUserIdentity(tripId, identity);
    setCurrentUserState(identity);
    setIsPromptModalOpen(false);
  }, [tripId]);

  const clearIdentity = useCallback(() => {
    if (!tripId) return;
    localStorage.removeItem(`trip_mochi_current_user_${tripId}`);
    setCurrentUserState(null);
  }, [tripId]);

  return {
    currentUser,
    isIdentityConfirmed: !!currentUser,
    selectMemberAsIdentity,
    clearIdentity,
    isPromptModalOpen,
    setIsPromptModalOpen,
  };
};
