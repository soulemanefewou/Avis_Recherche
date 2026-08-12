"use client";

import Link from "next/link";
import { Search, Shield, Mail, Phone } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative mt-auto border-t border-[#1f2937]/50">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#ef4444]/30 to-transparent" />
      <div className="bg-[#080b11]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-gradient-to-br from-[#ef4444] to-[#dc2626] shadow-lg shadow-[#ef4444]/20">
                  <Search className="h-4 w-4 text-white" />
                </div>
                <span className="font-extrabold text-sm tracking-tight text-white/80">Avis de Recherche</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed max-w-xs">
                Application citoyenne d&apos;aide à la recherche de personnes disparues en collaboration avec les autorités compétentes.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Liens utiles</h4>
              <div className="flex flex-col gap-2">
                <Link href="/mentions-legales" className="text-xs text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-2 w-fit">
                  <Shield className="h-3 w-3" />
                  Mentions légales
                </Link>
                <Link href="/protection-donnees" className="text-xs text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-2 w-fit">
                  <Shield className="h-3 w-3" />
                  Données personnelles
                </Link>
                <Link href="/contact" className="text-xs text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-2 w-fit">
                  <Mail className="h-3 w-3" />
                  Contact urgence
                </Link>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Urgence</h4>
              <div className="flex flex-col gap-2">
                <a href="tel:17" className="text-xs text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-2 w-fit">
                  <Phone className="h-3 w-3 text-[#ef4444]" />
                  Police Secours — <span className="font-bold text-gray-400">17</span>
                </a>
                <a href="tel:112" className="text-xs text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-2 w-fit">
                  <Phone className="h-3 w-3 text-[#ef4444]" />
                  Urgences — <span className="font-bold text-gray-400">119</span>
                </a>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-[#1f2937]/50 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-gray-600">
              &copy; {new Date().getFullYear()} Secours National — Plateforme Avis de Recherche. Tous droits réservés.
            </p>
            <p className="text-xs text-gray-700">
              Fait avec rigueur pour la protection des citoyens.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

