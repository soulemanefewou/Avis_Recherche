'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  description?: string;
  backHref?: string;
  action?: ReactNode;
  actions?: ReactNode;
  showBack?: boolean;
  className?: string;
}

export default function PageHeader({ title, subtitle, description, backHref, action, actions, showBack = false, className = '' }: PageHeaderProps) {
  const router = useRouter();
  const displaySubtitle = subtitle || description;
  const displayAction = action || actions;

  return (
    <div className={`mb-8 ${className}`}>
      {(showBack || backHref) && (
        <button
          onClick={() => backHref ? router.push(backHref) : router.back()}
          className="flex items-center gap-1 text-gray-500 hover:text-gray-800 mb-4 text-sm font-medium transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </button>
      )}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {displaySubtitle && <p className="text-sm text-gray-500 mt-1">{displaySubtitle}</p>}
        </div>
        {displayAction && <div>{displayAction}</div>}
      </div>
    </div>
  );
}
