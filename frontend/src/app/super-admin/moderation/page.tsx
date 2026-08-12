"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { ChevronLeft, AlertCircle, MapPin, User, EyeOff, Trash2, MessageSquareWarning, Flag, ShieldAlert, UserX, X, Calendar } from "lucide-react";

interface SignalementData {
  id: number;
  description: string;
  lieu: string;
  dateObservation: string;
  telephoneContact: string;
  statut: string;
  createdAt: string;
  utilisateur: { id: number; nom: string; prenom: string };
  avisRecherche: { id: number; nom: string; prenom: string };
}

interface MessageSignale {
  id: number;
  contenu: string;
  createdAt: string;
  auteur: { id: number; nom: string; prenom: string };
  signalePar: { id: number; nom: string; prenom: string };
}

const selectClass = "w-full h-10 text-sm rounded-lg border border-[#1f2937]/80 bg-[#0b0f17] text-white appearance-none focus:outline-none focus:border-[#ef4444]/40 focus:ring-1 focus:ring-[#ef4444]/20 transition-all px-3 pr-9 cursor-pointer";
const btnGhost = "text-xs font-medium h-9 px-4 rounded-lg border border-[#1f2937]/80 bg-[#0e1420]/60 text-gray-300 hover:text-white hover:border-[#1f2937] transition-all";
const btnRowGhost = "inline-flex items-center gap-1 text-[10px] font-semibold h-8 px-3 rounded-lg border border-[#1f2937]/80 text-gray-400 hover:text-white hover:border-[#1f2937] hover:bg-white/5 transition-all";
const btnRowDanger = "inline-flex items-center gap-1 text-[10px] font-semibold h-8 px-3 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 transition-all";

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

export default function SuperAdminModerationPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<"signalements" | "messages">("signalements");
  const [signalements, setSignalements] = useState<SignalementData[]>([]);
  const [messagesSignales, setMessagesSignales] = useState<MessageSignale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterStatut, setFilterStatut] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const [confirmModal, setConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: string; id: number } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || !user.roles.includes("ROLE_SUPER_ADMIN"))) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  const fetchSignalements = useCallback(async () => {
    try {
      setError("");
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (filterStatut) params.set("statut", filterStatut);
      const res = await api.get(`/api/super-admin/signalements?${params.toString()}`);
      setSignalements(res.data.data || []);
      setTotal(res.data.pagination?.total || 0);
    } catch {
      setError("Erreur lors du chargement des signalements.");
    }
  }, [page, filterStatut]);

  const fetchMessagesSignales = useCallback(async () => {
    try {
      setError("");
      const res = await api.get("/api/super-admin/messages/signales");
      setMessagesSignales(res.data.data || []);
    } catch {
      setError("Erreur lors du chargement des messages signalés.");
    }
  }, []);

  useEffect(() => {
    if (user && user.roles.includes("ROLE_SUPER_ADMIN")) {
      setLoading(true);
      if (tab === "signalements") {
        fetchSignalements().finally(() => setLoading(false));
      } else {
        fetchMessagesSignales().finally(() => setLoading(false));
      }
    }
  }, [user, tab, fetchSignalements, fetchMessagesSignales]);

  const confirmActionHandler = (type: string, id: number) => {
    setConfirmAction({ type, id });
    setConfirmModal(true);
  };

  const executeAction = async () => {
    if (!confirmAction) return;
    setActionLoading(true);
    try {
      switch (confirmAction.type) {
        case "masquer-signalement":
          await api.patch(`/api/super-admin/signalements/${confirmAction.id}/masquer`);
          await fetchSignalements();
          break;
        case "supprimer-signalement":
          await api.delete(`/api/super-admin/signalements/${confirmAction.id}`);
          await fetchSignalements();
          break;
        case "supprimer-message":
          await api.delete(`/api/super-admin/messages/${confirmAction.id}`);
          await fetchMessagesSignales();
          break;
        case "masquer-avis":
          await api.patch(`/api/super-admin/avis/${confirmAction.id}/masquer`);
          await fetchSignalements();
          break;
      }
      setConfirmModal(false);
      setConfirmAction(null);
    } catch {
      setError("Erreur lors de l'action.");
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
  const totalPages = Math.ceil(total / limit);

  if (authLoading || loading) {
    return (
      <div className="max-w-[1600px] mx-auto px-6 py-8 space-y-6">
        <div className="h-8 bg-[#1f2937] rounded w-56 animate-pulse" />
        <div className="flex gap-2">
          <div className="h-9 bg-[#1f2937] rounded-lg w-40 animate-pulse" />
          <div className="h-9 bg-[#1f2937] rounded-lg w-48 animate-pulse" />
        </div>
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
          <h1 className="text-xl font-bold text-white tracking-tight">Modération</h1>
          <p className="text-sm text-gray-500">Gestion des signalements et messages signalés</p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm animate-fade-in">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex gap-2 animate-fade-in" style={{ animationDelay: "60ms", animationFillMode: "both" }}>
        <button
          onClick={() => { setTab("signalements"); setPage(1); }}
          className={`inline-flex items-center gap-2 text-xs font-semibold h-9 px-4 rounded-lg transition-all ${
            tab === "signalements"
              ? "bg-gradient-to-r from-[#ef4444] to-[#dc2626] text-white shadow-md shadow-[#ef4444]/10"
              : "border border-[#1f2937]/80 bg-[#0e1420]/60 text-gray-400 hover:text-white hover:border-[#1f2937]"
          }`}
        >
          <Flag className="h-3.5 w-3.5" />
          Signalements ({total})
        </button>
        <button
          onClick={() => setTab("messages")}
          className={`inline-flex items-center gap-2 text-xs font-semibold h-9 px-4 rounded-lg transition-all ${
            tab === "messages"
              ? "bg-gradient-to-r from-[#ef4444] to-[#dc2626] text-white shadow-md shadow-[#ef4444]/10"
              : "border border-[#1f2937]/80 bg-[#0e1420]/60 text-gray-400 hover:text-white hover:border-[#1f2937]"
          }`}
        >
          <MessageSquareWarning className="h-3.5 w-3.5" />
          Messages signalés ({messagesSignales.length})
        </button>
      </div>

      {tab === "signalements" && (
        <>
          <div className="animate-fade-in" style={{ animationDelay: "80ms", animationFillMode: "both" }}>
            <select
              className={`${selectClass} w-full sm:w-52`}
              value={filterStatut}
              onChange={(e) => { setFilterStatut(e.target.value); setPage(1); }}
            >
              <option value="" className="bg-[#0e1420] text-white">Tous les statuts</option>
              <option value="EN_ATTENTE" className="bg-[#0e1420] text-white">En attente</option>
              <option value="MASQUE" className="bg-[#0e1420] text-white">Masqué</option>
            </select>
          </div>

          {signalements.length === 0 ? (
            <div className="text-center py-16 rounded-xl border border-[#1f2937]/50 bg-[#0e1420]/40">
              <ShieldAlert className="h-12 w-12 text-gray-700 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Aucun signalement trouvé.</p>
            </div>
          ) : (
            <>
              <div className="rounded-xl border border-[#1f2937]/80 bg-[#0e1420]/60 backdrop-blur-sm overflow-hidden animate-fade-in" style={{ animationDelay: "100ms", animationFillMode: "both" }}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#1f2937]/50 bg-[#0b0f17]/50">
                        <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Signalé par</th>
                        <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Avis</th>
                        <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Lieu</th>
                        <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Statut</th>
                        <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Date</th>
                        <th className="text-right px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {signalements.map((s) => (
                        <tr key={s.id} className="border-b border-[#1f2937]/30 last:border-b-0 hover:bg-white/[0.03] transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <Avatar prenom={s.utilisateur.prenom} nom={s.utilisateur.nom} />
                              <p className="font-semibold text-white">{s.utilisateur.prenom} {s.utilisateur.nom}</p>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <Avatar prenom={s.avisRecherche.prenom} nom={s.avisRecherche.nom} />
                              <p className="text-gray-300">{s.avisRecherche.prenom} {s.avisRecherche.nom}</p>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-gray-500">
                            {s.lieu ? (
                              <span className="flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5 text-gray-600" />
                                {s.lieu}
                              </span>
                            ) : (
                              <span className="text-gray-600">—</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide border ${
                              s.statut === "MASQUE"
                                ? "bg-red-500/10 text-red-400 border-red-500/20"
                                : "bg-green-500/10 text-green-400 border-green-500/20"
                            }`}>
                              {s.statut === "PUBLIE" ? "Publié" : s.statut}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-gray-500">{formatDate(s.createdAt)}</td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center justify-end gap-2">
                              {s.statut === "PUBLIE" && (
                                <>
                                  <button className={btnRowGhost} onClick={() => confirmActionHandler("masquer-signalement", s.id)}>
                                    <EyeOff className="h-3 w-3" />
                                    Masquer
                                  </button>
                                  <button className={btnRowGhost} onClick={() => confirmActionHandler("masquer-avis", s.avisRecherche.id)}>
                                    <EyeOff className="h-3 w-3" />
                                    Masquer l&apos;avis
                                  </button>
                                </>
                              )}
                              <button className={btnRowDanger} onClick={() => confirmActionHandler("supprimer-signalement", s.id)}>
                                <Trash2 className="h-3 w-3" />
                                Supprimer
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between animate-fade-in">
                  <p className="text-sm text-gray-500">{total} résultat(s)</p>
                  <div className="flex gap-2">
                    <button className={btnGhost} disabled={page <= 1} onClick={() => setPage(page - 1)}>Précédent</button>
                    <span className="text-sm text-gray-400 px-3 py-1">Page {page}/{totalPages}</span>
                    <button className={btnGhost} disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Suivant</button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {tab === "messages" && (
        messagesSignales.length === 0 ? (
          <div className="text-center py-16 rounded-xl border border-[#1f2937]/50 bg-[#0e1420]/40">
            <MessageSquareWarning className="h-12 w-12 text-gray-700 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Aucun message signalé trouvé.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-[#1f2937]/80 bg-[#0e1420]/60 backdrop-blur-sm overflow-hidden animate-fade-in" style={{ animationDelay: "100ms", animationFillMode: "both" }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1f2937]/50 bg-[#0b0f17]/50">
                    <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Auteur</th>
                    <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Signalé par</th>
                    <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Message</th>
                    <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Date</th>
                    <th className="text-right px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {messagesSignales.map((m) => (
                    <tr key={m.id} className="border-b border-[#1f2937]/30 last:border-b-0 hover:bg-white/[0.03] transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar prenom={m.auteur.prenom} nom={m.auteur.nom} />
                          <p className="font-semibold text-white">{m.auteur.prenom} {m.auteur.nom}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-400">
                        <span className="flex items-center gap-1.5">
                          <UserX className="h-3.5 w-3.5 text-gray-600" />
                          {m.signalePar.prenom} {m.signalePar.nom}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-300 max-w-md">
                        <p className="line-clamp-2 text-gray-300">{m.contenu}</p>
                      </td>
                      <td className="px-5 py-3.5 text-gray-500">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-gray-600" />
                          {formatDate(m.createdAt)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          <button className={btnRowDanger} onClick={() => confirmActionHandler("supprimer-message", m.id)}>
                            <Trash2 className="h-3 w-3" />
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {confirmModal && (
        <ModalShell title="Confirmer l'action" onClose={() => setConfirmModal(false)}>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-lg border border-[#1f2937]/80 bg-[#0b0f17]/50">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-[#ef4444]" />
              <p className="text-sm text-gray-400">
                {confirmAction?.type === "masquer-signalement" && "Voulez-vous masquer ce signalement ?"}
                {confirmAction?.type === "supprimer-signalement" && "Voulez-vous supprimer ce signalement ? Cette action est irréversible."}
                {confirmAction?.type === "supprimer-message" && "Voulez-vous supprimer ce message ? Cette action est irréversible."}
                {confirmAction?.type === "masquer-avis" && "Voulez-vous masquer cet avis ? Il ne sera plus visible publiquement."}
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button className={btnGhost} onClick={() => setConfirmModal(false)}>Annuler</button>
              <button
                className={confirmAction?.type?.startsWith("supprimer") ? "text-xs font-semibold h-9 px-4 rounded-lg bg-gradient-to-r from-red-500 to-red-700 text-white hover:from-red-600 hover:to-red-800 transition-all shadow-md shadow-red-500/10 disabled:opacity-50" : "text-xs font-semibold h-9 px-4 rounded-lg bg-gradient-to-r from-[#ef4444] to-[#dc2626] text-white hover:from-[#dc2626] hover:to-[#b91c1c] transition-all shadow-md shadow-[#ef4444]/10 disabled:opacity-50"}
                disabled={actionLoading}
                onClick={executeAction}
              >
                {actionLoading ? "Confirmation..." : "Confirmer"}
              </button>
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  );
}
