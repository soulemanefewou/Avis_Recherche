"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { ChevronLeft, MessageCircle, User, Mail, Clock, ArrowRight, Send } from "lucide-react";

interface ConversationData {
  id: number;
  statut: string;
  type: string;
  createdAt: string;
  lastMessageAt: string;
  messageCount: number;
  avisRecherche?: { id: number; nom: string; prenom: string };
  createurSignalement?: { id: number; nom: string; prenom: string };
  proprietaireAvis?: { id: number; nom: string; prenom: string };
}

const statusConfig: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: "Active", className: "bg-green-500/10 text-green-400 border-green-500/20" },
  LECTURE_SEULE: { label: "Lecture seule", className: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  ARCHIVEE: { label: "Archivée", className: "bg-gray-500/10 text-gray-400 border-gray-500/20" },
};

const typeLabels: Record<string, string> = {
  PROCHE_TEMOIN: "Proche → Témoin",
  ADMIN_AUTEUR: "Admin → Auteur",
  COMMISSARIAT_TEMOIN: "Commissariat → Témoin",
};

function SkeletonConversation() {
  return (
    <div className="rounded-xl border border-[#1f2937]/50 bg-[#0e1420]/40 overflow-hidden animate-pulse p-5">
      <div className="flex items-center gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-4 bg-[#1f2937] rounded w-32" />
            <div className="h-3 bg-[#1f2937] rounded w-24" />
          </div>
          <div className="h-3 bg-[#1f2937] rounded w-20" />
        </div>
        <div className="space-y-2 text-right">
          <div className="h-3 bg-[#1f2937] rounded w-16" />
          <div className="h-5 bg-[#1f2937] rounded w-14 ml-auto" />
        </div>
      </div>
    </div>
  );
}

function Badge({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide border ${className}`}>
      {children}
    </span>
  );
}

export default function CommissariatConversationsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [conversations, setConversations] = useState<ConversationData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || !user.roles.includes("ROLE_COMMISSARIAT"))) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await api.get("/api/conversations");
      setConversations(res.data.data || res.data || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && user.roles.includes("ROLE_COMMISSARIAT")) {
      fetchConversations();
    }
  }, [user, fetchConversations]);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (authLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="h-8 bg-[#1f2937] rounded w-48 animate-pulse" />
        <div className="h-4 bg-[#1f2937] rounded w-64 animate-pulse" />
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <SkeletonConversation key={i} />)}
        </div>
      </div>
    );
  }

  if (!user || !user.roles.includes("ROLE_COMMISSARIAT")) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="animate-fade-in">
        <div className="flex items-center gap-3 mb-1">
          <Link
            href="/commissariat"
            className="w-8 h-8 rounded-lg border border-[#1f2937]/80 bg-[#0e1420]/60 flex items-center justify-center hover:border-[#ef4444]/30 hover:bg-[#ef4444]/5 transition-all duration-200"
          >
            <ChevronLeft className="h-4 w-4 text-gray-400" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Conversations</h1>
            <p className="text-sm text-gray-500">Échanges liés à vos avis de recherche</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <SkeletonConversation key={i} />)}
        </div>
      ) : conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center border border-[#1f2937]/50 bg-[#0e1420]/40 rounded-xl py-16 animate-fade-in">
          <div className="w-14 h-14 rounded-full bg-[#1f2937]/50 border border-[#374151]/50 flex items-center justify-center mb-4">
            <MessageCircle className="h-7 w-7 text-gray-500" />
          </div>
          <h3 className="text-sm font-semibold text-gray-300 mb-1">Aucune conversation</h3>
          <p className="text-xs text-gray-500 max-w-xs">Les échanges avec les témoins et citoyens apparaîtront ici.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {conversations.map((conv, i) => {
            const avis = conv.avisRecherche;
            const other =
              user?.id === conv.createurSignalement?.id
                ? conv.proprietaireAvis
                : conv.createurSignalement;
            const otherName = other ? `${other.prenom} ${other.nom}` : "Utilisateur";
            const status = statusConfig[conv.statut] || statusConfig.ACTIVE;
            const typeLabel = typeLabels[conv.type] || conv.type;

            return (
              <div
                key={conv.id}
                className="rounded-xl border border-[#1f2937]/80 bg-[#0e1420]/60 backdrop-blur-sm hover:border-[#1f2937] hover:bg-[#0e1420]/80 transition-all duration-300 overflow-hidden cursor-pointer animate-fade-in"
                style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}
                onClick={() => router.push(`/conversations/${conv.id}`)}
              >
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#1f2937]/50 border border-[#374151]/50 flex items-center justify-center shrink-0 mt-0.5">
                      <MessageCircle className="h-5 w-5 text-gray-400" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Avis</span>
                        {avis ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/commissariat/avis/${avis.id}`);
                            }}
                            className="text-sm font-bold text-white hover:text-[#ef4444] transition-colors duration-200 text-left truncate"
                          >
                            {avis.prenom} {avis.nom}
                          </button>
                        ) : (
                          <span className="text-sm text-gray-400">Avis inconnu</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-500">
                        <User className="h-3 w-3 text-gray-600 shrink-0" />
                        <span>{otherName}</span>
                        {conv.type && (
                          <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">{typeLabel}</Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1.5">
                          <Send className="h-3 w-3 text-gray-600 shrink-0" />
                          {conv.messageCount} message{conv.messageCount > 1 ? "s" : ""}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3 text-gray-600 shrink-0" />
                          {formatDate(conv.lastMessageAt)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <Badge className={status.className}>{status.label}</Badge>
                      <ArrowRight className="h-4 w-4 text-gray-600 group-hover:text-[#ef4444] group-hover:translate-x-0.5 transition-all duration-300" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}