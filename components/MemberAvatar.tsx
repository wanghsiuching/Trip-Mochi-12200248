import React from 'react';
import { getMemberAvatarSrc, getDefaultMemberAvatar } from '../constants/avatars';

interface MemberAvatarProps {
  avatar?: string | null;
  name?: string;
  id?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showBorder?: boolean;
}

/**
 * Universal safe avatar rendering for an actor/user.
 * Ensures data URIs and URLs render as <img> rather than raw text,
 * preventing layout blowups when avatar contains large SVG strings.
 */
export const ActorAvatar: React.FC<{
  avatar?: string | null;
  className?: string;
  fallback?: string;
}> = ({ avatar, className = '', fallback = '👤' }) => {
  if (!avatar || !avatar.trim()) {
    return <span className={`select-none leading-none ${className}`}>{fallback}</span>;
  }

  const trimmed = avatar.trim();
  const isImageOrDataUri =
    trimmed.startsWith('data:image') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('/');

  if (isImageOrDataUri) {
    return (
      <img
        src={trimmed}
        alt=""
        className={`w-full h-full object-cover rounded-full select-none ${className}`}
        loading="lazy"
      />
    );
  }

  // Pure emoji or single character
  return <span className={`select-none leading-none ${className}`}>{trimmed}</span>;
};

export const MemberAvatar: React.FC<MemberAvatarProps> = ({
  avatar,
  name = '',
  id = '',
  size = 'md',
  className = '',
  showBorder = true,
}) => {
  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-20 h-20 text-2xl',
  };

  const isImageOrDataUri =
    avatar &&
    (avatar.startsWith('data:image') ||
      avatar.startsWith('http://') ||
      avatar.startsWith('https://') ||
      avatar.startsWith('blob:') ||
      avatar.startsWith('/'));

  const isEmoji = avatar && !isImageOrDataUri && avatar.trim().length <= 4;

  if (isEmoji) {
    return (
      <div
        className={`rounded-full bg-[#FAF7EE] flex items-center justify-center overflow-hidden relative flex-shrink-0 select-none ${
          sizeClasses[size]
        } ${showBorder ? 'border-2 border-beige-dark shadow-sm' : ''} ${className}`}
      >
        <span className="leading-none">{avatar}</span>
      </div>
    );
  }

  const avatarSrc = getMemberAvatarSrc(avatar, name, id);

  return (
    <div
      className={`rounded-full bg-[#FAF7EE] flex items-center justify-center overflow-hidden relative flex-shrink-0 select-none ${
        sizeClasses[size]
      } ${showBorder ? 'border-2 border-beige-dark shadow-sm' : ''} ${className}`}
    >
      <img
        src={avatarSrc}
        alt={name || 'Avatar'}
        className="w-full h-full object-cover rounded-full"
        loading="lazy"
        onError={(e) => {
          (e.target as HTMLImageElement).src = getDefaultMemberAvatar(name || id || 'default');
        }}
      />
    </div>
  );
};

