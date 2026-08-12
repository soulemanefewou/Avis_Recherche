"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { Conversation } from "@/lib/types";
import { ChevronLeft, MessageCircle, Clock } from "lucide-react";

function timeSince(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`;
  return `il y a ${Math.floor(diff / 86400)}j`;
}

const statusConfig: Record<string, { label: string; class: string }> = {
  ACTIVE: { label: "Active", class: "bg-green-500/10 text-green-400 border-green-500/20" },
  LECTURE_SEULE: { label: "Lecture seule", class: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  ARCHIVEE: { label: "Archivée", class: "bg-gray-500/10 text-gray-400 border-gray-500/20" },
};

export default function ConversationsPage() {
  const { user, loading: authLoading } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) return;
    api
      .get("/api/conversations")
      .then((res) => setConversations(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
    <div className="px-10 py-8 space-y-8">
        <div className="h-8 bg-[#1f2937] rounded w-48 animate-pulse" />
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl border border-[#1f2937]/50 bg-[#0e1420]/40 p-6 flex items-center gap-6 animate-pulse">
              <div className="w-14 h-14 rounded-full bg-[#1f2937] shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-[#1f2937] rounded w-40" />
                <div className="h-3 bg-[#1f2937] rounded w-64" />
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-[#1f2937] rounded w-16" />
                <div className="h-5 bg-[#1f2937] rounded w-14" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-10 py-8 space-y-8">
      <div className="flex items-center gap-3 animate-fade-in">
        <Link href="/" className="w-8 h-8 rounded-lg border border-[#1f2937]/80 bg-[#0e1420]/60 flex items-center justify-center hover:border-[#ef4444]/30 hover:bg-[#ef4444]/5 transition-all">
          <ChevronLeft className="h-4 w-4 text-gray-400" />
        </Link>
        <h1 className="text-xl font-bold text-white tracking-tight">Mes conversations</h1>
      </div>

      {conversations.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-[#1f2937]/50 bg-[#0e1420]/40">
          <MessageCircle className="h-12 w-12 text-gray-700 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Aucune conversation</p>
          <p className="text-xs text-gray-600 mt-1">Les conversations sont créées automatiquement lorsque vous signalez une observation sur un avis de recherche.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {conversations.map((conv, idx) => {
            const other =
              user?.id === conv.createurSignalement?.id
                ? conv.proprietaireAvis
                : conv.createurSignalement;

            const otherName = other ? `${other.prenom} ${other.nom}` : "Utilisateur";
            const avisTitle = conv.avisRecherche
              ? `${conv.avisRecherche.prenom} ${conv.avisRecherche.nom}`
              : "";
            const lastMsg = conv.lastMessage?.contenu;
            const lastTime = conv.lastMessage?.createdAt || conv.updatedAt;
            const status = statusConfig[conv.statut] || statusConfig.ACTIVE;

            return (
              <Link key={conv.id} href={`/conversations/${conv.id}`} className="block rounded-xl border border-[#1f2937]/80 bg-[#0e1420]/60 backdrop-blur-sm p-6 hover:border-[#ef4444]/30 hover:bg-[#ef4444]/5 transition-all duration-200 animate-fade-in group" style={{ animationDelay: `${idx * 60}ms`, animationFillMode: "both" }}>
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-full border border-[#1f2937]/80 bg-[#0b0f17] flex items-center justify-center text-lg font-bold text-white shrink-0">
                    {other?.prenom?.charAt(0)}{other?.nom?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-white truncate text-base">{otherName}</p>
                      {avisTitle && (
                        <span className="text-sm text-gray-600 truncate hidden sm:inline">
                          &middot; {avisTitle}
                        </span>
                      )}
                    </div>
                    {lastMsg && (
                      <p className="text-sm text-gray-500 truncate mt-0.5">{lastMsg}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="text-[10px] text-gray-600 whitespace-nowrap flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {timeSince(lastTime)}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide border ${status.class}`}>
                        {status.label}
                      </span>
                      {(conv.unreadCount ?? 0) > 0 && (
                        <span className="bg-[#ef4444] text-white text-[10px] font-bold rounded-full h-5 min-w-[20px] flex items-center justify-center px-1.5">
                          {conv.unreadCount! > 99 ? "99+" : conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}