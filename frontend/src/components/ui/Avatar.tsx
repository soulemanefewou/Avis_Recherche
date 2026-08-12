'use client';

import { User } from 'lucide-react';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  initials?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizes = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-lg',
  xl: 'h-20 w-20 text-xl',
};

const iconSizes = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-7 w-7',
  xl: 'h-10 w-10',
};

function getInitials(name?: string, initials?: string): string {
  if (initials) return initials;
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '';
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Avatar({ src, alt, name, initials, size = 'md', className = '' }: AvatarProps) {
  const sizeClass = sizes[size];
  const iconSizeClass = iconSizes[size];

  if (src) {
    return (
      <img
        src={src}
        alt={alt || name || 'Avatar'}
        className={`rounded-full object-cover ring-2 ring-white shadow-sm ${sizeClass} ${className}`}
      />
    );
  }

  const displayInitials = getInitials(name, initials);

  if (displayInitials) {
    return (
      <div
        className={`rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold flex items-center justify-center ring-2 ring-white shadow-sm ${sizeClass} ${className}`}
        title={name}
      >
        {displayInitials}
      </div>
    );
  }

  return (
    <div
      className={`rounded-full bg-gray-200 text-gray-400 flex items-center justify-center ring-2 ring-white shadow-sm ${sizeClass} ${className}`}
    >
      <User className={iconSizeClass} />
    </div>
  );
}
