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
