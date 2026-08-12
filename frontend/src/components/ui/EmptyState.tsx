import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title?: string;
  message?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export default function EmptyState({ icon, title, message, description, action, className = '' }: EmptyStateProps) {
  const displayTitle = title || message;
  return (
    <div className={`text-center py-16 px-4 ${className}`}>
      {icon && <div className="text-gray-300 mb-4 flex justify-center">{icon}</div>}
      {displayTitle && <h3 className="text-lg font-medium text-gray-900 mb-1">{displayTitle}</h3>}
      {description && <p className="text-sm text-gray-500 max-w-sm mx-auto">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
