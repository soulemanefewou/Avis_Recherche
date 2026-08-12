import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddings = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export default function Card({ children, className = '', hover = false, padding = 'md' }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-border/80 bg-surface/75 backdrop-blur-md shadow-lg transition-all duration-300 ${
        hover
          ? 'hover:shadow-2xl hover:shadow-primary/5 hover:border-primary/30 hover:bg-surface/90 cursor-pointer'
          : ''
      } ${paddings[padding]} ${className}`}
    >
      {children}
    </div>
  );
}

