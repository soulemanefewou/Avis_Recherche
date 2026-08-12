"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { ChevronLeft, AlertCircle, Lock, User, MessageSquare, UserCircle2, Clock, X, MessagesSquare } from "lucide-react";

interface ConversationData {
  id: number;
  statut: string;
  type: string;
  createdAt: string;
  lastMessageAt: string;
  messageCount: number;
  avis: { id: number; nom: string; prenom: string };
  createurSignalement: { id: number; nom: string; prenom: string };
  proprietaireAvis: { id: number; nom: string; prenom: string };
}

const statutBadgeClass = (statut: string) => {
  if (statut === "ACTIVE") return "bg-green-500/10 text-green-400 border-green-500/20";
  if (statut === "ARCHIVEE") return "bg-red-500/10 text-red-400 border-red-500/20";
  return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
};

const statutLabel = (statut: string) => {
  const labels: Record<string, string> = {
    ACTIVE: "Active",
    LECTURE_SEULE: "Lecture seule",
    ARCHIVEE: "Archivée",
  };
  return labels[statut] || statut;
};

const selectClass = "w-full h-10 text-sm rounded-lg border border-[#1f2937]/80 bg-[#0b0f17] text-white appearance-none focus:outline-none focus:border-[#ef4444]/40 focus:ring-1 focus:ring-[#ef4444]/20 transition-all px-3 pr-9 cursor-pointer";
const btnGhost = "text-xs font-medium h-9 px-4 rounded-lg border border-[#1f2937]/80 bg-[#0e1420]/60 text-gray-300 hover:text-white hover:border-[#1f2937] transition-all";
const btnPrimary = "text-xs font-semibold h-9 px-4 rounded-lg bg-gradient-to-r from-[#ef4444] to-[#dc2626] text-white hover:from-[#dc2626] hover:to-[#b91c1c] transition-all shadow-md shadow-[#ef4444]/10 disabled:opacity-50";

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg rounded-xl border border-[#1f2937]/80 bg-[#0e1420] shadow-2xl shadow-black/40 animate-scale-in max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-[#1f2937]/50 sticky top-0 bg-[#0e1420] z-10">
          <h2 className="text-base font-bold text-white tracking-tight">{title}</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg border border-[#1f2937]/80 flex items-center justify-center hover:border-[#ef4444]/30 hover:bg-[#ef4444]/5 transition-all">
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function Avatar({ prenom, nom }: { prenom: string; nom: string }) {
  return (
    <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-[#ef4444]/10 text-[#ef4444] shrink-0 text-xs font-bold">
      {(prenom[0] || "?").toUpperCase()}{(nom[0] || "").toUpperCase()}
    </div>
  );
}

export default function SuperAdminConversationsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [conversations, setConversations] = useState<ConversationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterStatut, setFilterStatut] = useState("");

  const [clotureModalOpen, setClotureModalOpen] = useState(false);
  const [selectedConv, setSelectedConv] = useState<ConversationData | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || !user.roles.includes("ROLE_SUPER_ADMIN"))) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  const fetchConversations = useCallback(async () => {
    try {
      setError("");
      const params = new URLSearchParams();
      if (filterStatut) params.set("statut", filterStatut);
      const res = await api.get(`/api/super-admin/conversations?${params.toString()}`);
      setConversations(res.data.data || []);
    } catch {
      setError("Erreur lors du chargement des conversations.");
    }
  }, [filterStatut]);

  useEffect(() => {
    if (user && user.roles.includes("ROLE_SUPER_ADMIN")) {
      setLoading(true);
      fetchConversations().finally(() => setLoading(false));
    }
  }, [user, fetchConversations]);

  const handleCloturer = async () => {
    if (!selectedConv) return;
    setActionLoading(true);
    try {
      await api.patch(`/api/super-admin/conversations/${selectedConv.id}/cloturer`);
      setClotureModalOpen(false);
      setSelectedConv(null);
      await fetchConversations();
    } catch {
      setError("Erreur lors de la clôture.");
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  if (authLoading || loading) {
    return (
      <div className="max-w-[1600px] mx-auto px-6 py-8 space-y-6">
        <div className="h-8 bg-[#1f2937] rounded w-56 animate-pulse" />
        <div className="h-10 bg-[#1f2937] rounded-lg w-48 animate-pulse" />
        <div className="rounded-xl border border-[#1f2937]/50 bg-[#0e1420]/40 p-6 space-y-3 animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-12 bg-[#1f2937] rounded" />
          ))}
        </div>
      </div>
    );
  }
  if (!user || !user.roles.includes("ROLE_SUPER_ADMIN")) return null;

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center gap-3 animate-fade-in">
        <Link href="/super-admin" className="w-8 h-8 rounded-lg border border-[#1f2937]/80 bg-[#0e1420]/60 flex items-center justify-center hover:border-[#ef4444]/30 hover:bg-[#ef4444]/5 transition-all">
          <ChevronLeft className="h-4 w-4 text-gray-400" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-white tracking-tight">Conversations</h1>
          <p className="text-sm text-gray-500">Gestion et supervision des conversations</p>
        </div>
      </div>

      <div className="animate-fade-in" style={{ animationDelay: "60ms", animationFillMode: "both" }}>
        <select
          className={`${selectClass} w-full sm:w-52`}
          value={filterStatut}
          onChange={(e) => setFilterStatut(e.target.value)}
        >
          <option value="" className="bg-[#0e1420] text-white">Tous les statuts</option>
          <option value="ACTIVE" className="bg-[#0e1420] text-white">Active</option>
          <option value="LECTURE_SEULE" className="bg-[#0e1420] text-white">Lecture seule</option>
          <option value="ARCHIVEE" className="bg-[#0e1420] text-white">Archivée</option>
        </select>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm animate-fade-in">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {conversations.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-[#1f2937]/50 bg-[#0e1420]/40">
          <MessagesSquare className="h-12 w-12 text-gray-700 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Aucune conversation trouvée.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-[#1f2937]/80 bg-[#0e1420]/60 backdrop-blur-sm overflow-hidden animate-fade-in" style={{ animationDelay: "100ms", animationFillMode: "both" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1f2937]/50 bg-[#0b0f17]/50">
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Avis</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Créateur</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Propriétaire</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Type</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Messages</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Statut</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Dernière activité</th>
                  <th className="text-right px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {conversations.map((c) => (
                  <tr key={c.id} className="border-b border-[#1f2937]/30 last:border-b-0 hover:bg-white/[0.03] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar prenom={c.avis.prenom} nom={c.avis.nom} />
                        <p className="font-semibold text-white">{c.avis.prenom} {c.avis.nom}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-400">
                      <span className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-gray-600" />
                        {c.createurSignalement.prenom} {c.createurSignalement.nom}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-400">
                      <span className="flex items-center gap-1.5">
                        <UserCircle2 className="h-3.5 w-3.5 text-gray-600" />
                        {c.proprietaireAvis.prenom} {c.proprietaireAvis.nom}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500">{c.type}</td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1.5 text-gray-400">
                        <MessageSquare className="h-3.5 w-3.5 text-gray-600" />
                        {c.messageCount}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide border ${statutBadgeClass(c.statut)}`}>
                        {statutLabel(c.statut)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500">
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-gray-600" />
                        {formatDate(c.lastMessageAt)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        {c.statut !== "ARCHIVEE" && (
                          <button
                            className="inline-flex items-center gap-1 text-[10px] font-semibold h-8 px-3 rounded-lg border border-orange-500/30 text-orange-400 hover:bg-orange-500/10 hover:border-orange-500/50 transition-all"
                            onClick={() => { setSelectedConv(c); setClotureModalOpen(true); }}
                          >
                            <Lock className="h-3 w-3" />
                            Clôturer
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {clotureModalOpen && selectedConv && (
        <ModalShell title="Clôturer la conversation" onClose={() => setClotureModalOpen(false)}>
          <div className="space-y-4">
            <p className="text-sm text-gray-400">
              Voulez-vous vraiment clôturer la conversation concernant <span className="text-white font-semibold">{selectedConv.avis.prenom} {selectedConv.avis.nom}</span> ? Elle passera en statut archivé.
            </p>
            <div className="flex justify-end gap-3">
              <button className={btnGhost} onClick={() => setClotureModalOpen(false)}>Annuler</button>
              <button className={btnPrimary} disabled={actionLoading} onClick={handleCloturer}>{actionLoading ? "Clôture..." : "Clôturer"}</button>
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  );
}
