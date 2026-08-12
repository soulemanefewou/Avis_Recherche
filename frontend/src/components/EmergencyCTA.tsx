'use client';

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import DeclarerDisparitionModal from './DeclarerDisparitionModal';

export default function EmergencyCTA() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-[#ef4444] text-white font-bold py-3 px-5 rounded-full shadow-lg shadow-[#ef4444]/30 hover:bg-[#dc2626] transition-all duration-300 transform hover:scale-105 active:scale-95 group focus:outline-none focus:ring-2 focus:ring-[#ef4444]/50"
        aria-label="Déclarer une disparition"
      >
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
        </span>
        <AlertTriangle className="h-4.5 w-4.5 shrink-0 transition-transform group-hover:rotate-12" />
        <span className="text-sm tracking-wide">Déclarer une Disparition</span>
      </button>

      <DeclarerDisparitionModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
