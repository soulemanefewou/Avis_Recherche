"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { photoSrc } from "@/lib/photo";
import { useAuth } from "@/lib/auth-context";
import { ChevronLeft, Search, AlertCircle, Eye, CheckCircle2, XCircle, User, MapPin, Phone, Calendar, X, FileWarning, ShieldAlert } from "lucide-react";

interface AvisCitoyen {
  id: number;
  nom: string;
  prenom: string;
  sexe: string;
  ageApprox: number;
  description: string;
  statut: string;
  telephone: string;
  dernierLieuVu: string;
  dateDisparition: string;
  createdAt: string;
  type: string;
  validationStatut?: string;
  motifRejet?: string;
  suiviActif?: boolean;
  auteur?: { id: number; nom: string; prenom: string; email: string };
  photos: { id: number; url: string; chemin: string; estPrincipale: boolean }[];
  piecesJustificatives?: { id: number; type: string; nomOriginal: string; taille: number }[];
}

const statutBadgeClass = (statut: string) => {
  if (statut === "EN_ATTENTE_VALIDATION") return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
  if (statut === "RETROUVE_EN_ATTENTE_CONFIRMATION") return "bg-blue-500/10 text-blue-400 border-blue-500/20";
  if (statut === "RETROUVE_VIVANT" || statut === "RETROUVE_DECEDE") return "bg-green-500/10 text-green-400 border-green-500/20";
  if (statut === "REJETE") return "bg-red-500/10 text-red-400 border-red-500/20";
  return "bg-red-500/10 text-red-400 border-red-500/20";
};

const statutLabel = (statut: string) => {
  const labels: Record<string, string> = {
    EN_ATTENTE_VALIDATION: "En attente validation",
    RETROUVE_EN_ATTENTE_CONFIRMATION: "À confirmer (retrouvé)",
    RECHERCHE: "Recherché",
    RETROUVE_VIVANT: "Retrouvé vivant",
    RETROUVE_DECEDE: "Retrouvé décédé",
    RECHERCHE_CLOTUREE: "Clôturé",
    REJETE: "Rejeté",
  };
  return labels[statut] || statut;
};

const inputClass = "w-full h-10 text-sm rounded-lg border border-[#1f2937]/80 bg-[#0b0f17] text-white placeholder:text-gray-600 focus:outline-none focus:border-[#ef4444]/40 focus:ring-1 focus:ring-[#ef4444]/20 transition-all px-3";
const selectClass = "w-full h-10 text-sm rounded-lg border border-[#1f2937]/80 bg-[#0b0f17] text-white appearance-none focus:outline-none focus:border-[#ef4444]/40 focus:ring-1 focus:ring-[#ef4444]/20 transition-all px-3 pr-9 cursor-pointer";
const textareaClass = "w-full rounded-lg border border-[#1f2937]/80 bg-[#0b0f17] text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#ef4444]/40 focus:ring-1 focus:ring-[#ef4444]/20 transition-all px-3 py-2.5 resize-none";
const btnGhost = "text-xs font-medium h-9 px-4 rounded-lg border border-[#1f2937]/80 bg-[#0e1420]/60 text-gray-300 hover:text-white hover:border-[#1f2937] transition-all";
const btnPrimary = "text-xs font-semibold h-9 px-4 rounded-lg bg-gradient-to-r from-[#ef4444] to-[#dc2626] text-white hover:from-[#dc2626] hover:to-[#b91c1c] transition-all shadow-md shadow-[#ef4444]/10 disabled:opacity-50";
const btnDanger = "text-xs font-semibold h-9 px-4 rounded-lg bg-gradient-to-r from-red-500 to-red-700 text-white hover:from-red-600 hover:to-red-800 transition-all shadow-md shadow-red-500/10 disabled:opacity-50";
const btnRowGhost = "inline-flex items-center gap-1 text-[10px] font-semibold h-8 px-3 rounded-lg border border-[#1f2937]/80 text-gray-400 hover:text-white hover:border-[#1f2937] hover:bg-white/5 transition-all";
const btnRowDanger = "inline-flex items-center gap-1 text-[10px] font-semibold h-8 px-3 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 transition-all";
const btnRowSuccess = "inline-flex items-center gap-1 text-[10px] font-semibold h-8 px-3 rounded-lg border border-green-500/30 text-green-400 hover:bg-green-500/10 hover:border-green-500/50 transition-all";

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

export default function SuperAdminAvisPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [avis, setAvis] = useState<AvisCitoyen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterStatut, setFilterStatut] = useState("");
  const [filterAvisStatut, setFilterAvisStatut] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedAvis, setSelectedAvis] = useState<AvisCitoyen | null>(null);

  const [confirmerModalOpen, setConfirmerModalOpen] = useState(false);
  const [confirmerStatut, setConfirmerStatut] = useState("RETROUVE_VIVANT");
  const [confirmerLoading, setConfirmerLoading] = useState(false);

  const [rejeterModalOpen, setRejeterModalOpen] = useState(false);
  const [rejeterLoading, setRejeterLoading] = useState(false);

  const [validateModalOpen, setValidateModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectMotif, setRejectMotif] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || !user.roles.includes("ROLE_SUPER_ADMIN"))) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  const fetchAvis = useCallback(async () => {
    try {
      setError("");
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (filterStatut) params.set("statut", filterStatut);
      if (filterAvisStatut) params.set("avisStatut", filterAvisStatut);
      if (search) params.set("search", search);
      const res = await api.get(`/api/super-admin/avis-citoyens?${params.toString()}`);
      setAvis(res.data.data || []);
      setTotal(res.data.pagination?.total || 0);
    } catch {
      setError("Erreur lors du chargement des avis.");
    }
  }, [page, filterStatut, filterAvisStatut, search]);

  useEffect(() => {
    if (user && user.roles.includes("ROLE_SUPER_ADMIN")) {
      setLoading(true);
      fetchAvis().finally(() => setLoading(false));
    }
  }, [user, fetchAvis]);

  const openDetail = async (id: number) => {
    try {
      const res = await api.get(`/api/super-admin/avis-citoyens/${id}`);
      setSelectedAvis(res.data.data);
      setDetailModalOpen(true);
    } catch {
      setError("Erreur lors du chargement des détails.");
    }
  };

  const handleConfirmer = async () => {
    if (!selectedAvis) return;
    setConfirmerLoading(true);
    try {
      await api.post(`/api/super-admin/avis/${selectedAvis.id}/confirmer-retrouve`, {
        confirme: true,
        statut: confirmerStatut,
      });
      setConfirmerModalOpen(false);
      setDetailModalOpen(false);
      setSelectedAvis(null);
      await fetchAvis();
    } catch {
      setError("Erreur lors de la confirmation.");
    } finally {
      setConfirmerLoading(false);
    }
  };

  const handleRejeter = async () => {
    if (!selectedAvis) return;
    setRejeterLoading(true);
    try {
      await api.post(`/api/super-admin/avis/${selectedAvis.id}/confirmer-retrouve`, {
        confirme: false,
      });
      setRejeterModalOpen(false);
      setDetailModalOpen(false);
      setSelectedAvis(null);
      await fetchAvis();
    } catch {
      setError("Erreur lors du rejet.");
    } finally {
      setRejeterLoading(false);
    }
  };

  const handleValidate = async () => {
    if (!selectedAvis) return;
    setActionLoading(true);
    try {
      await api.post(`/api/super-admin/avis-citoyens/${selectedAvis.id}/valider`);
      setValidateModalOpen(false);
      setDetailModalOpen(false);
      setSelectedAvis(null);
      await fetchAvis();
    } catch {
      setError("Erreur lors de la validation.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedAvis) return;
    setActionLoading(true);
    try {
      await api.post(`/api/super-admin/avis-citoyens/${selectedAvis.id}/rejeter`, { motif: rejectMotif });
      setRejectModalOpen(false);
      setDetailModalOpen(false);
      setSelectedAvis(null);
      setRejectMotif("");
      await fetchAvis();
    } catch {
      setError("Erreur lors du rejet.");
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
        <div className="flex gap-3">
          <div className="h-10 bg-[#1f2937] rounded-lg flex-1 max-w-xs animate-pulse" />
          <div className="h-10 bg-[#1f2937] rounded-lg w-48 animate-pulse" />
          <div className="h-10 bg-[#1f2937] rounded-lg w-48 animate-pulse" />
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
          <h1 className="text-xl font-bold text-white tracking-tight">Avis citoyens</h1>
          <p className="text-sm text-gray-500">Validation et gestion des avis citoyens</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center gap-3 animate-fade-in" style={{ animationDelay: "60ms", animationFillMode: "both" }}>
        <div className="relative flex-1 max-w-md">
          <Search className="h-4 w-4 text-gray-600 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Rechercher par nom, prénom..."
            className={`${inputClass} pl-9`}
          />
        </div>
        <select
          className={`${selectClass} w-full lg:w-52`}
          value={filterAvisStatut}
          onChange={(e) => { setFilterAvisStatut(e.target.value); setPage(1); }}
        >
          <option value="" className="bg-[#0e1420] text-white">À confirmer (retrouvé)</option>
          <option value="RETROUVE_EN_ATTENTE_CONFIRMATION" className="bg-[#0e1420] text-white">Tous les statuts</option>
        </select>
        <select
          className={`${selectClass} w-full lg:w-52`}
          value={filterStatut}
          onChange={(e) => { setFilterStatut(e.target.value); setPage(1); }}
        >
          <option value="" className="bg-[#0e1420] text-white">Toute validation</option>
          <option value="EN_ATTENTE" className="bg-[#0e1420] text-white">En attente de validation</option>
          <option value="VALIDE" className="bg-[#0e1420] text-white">Validé</option>
          <option value="REJETE" className="bg-[#0e1420] text-white">Rejeté</option>
        </select>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm animate-fade-in">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {avis.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-[#1f2937]/50 bg-[#0e1420]/40">
          <ShieldAlert className="h-12 w-12 text-gray-700 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Aucun avis citoyen n&apos;a été trouvé.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-[#1f2937]/80 bg-[#0e1420]/60 backdrop-blur-sm overflow-hidden animate-fade-in" style={{ animationDelay: "100ms", animationFillMode: "both" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1f2937]/50 bg-[#0b0f17]/50">
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Nom</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Auteur</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Dernier lieu</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Statut</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Date</th>
                  <th className="text-right px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {avis.map((a) => (
                  <tr key={a.id} className="border-b border-[#1f2937]/30 last:border-b-0 hover:bg-white/[0.03] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar prenom={a.prenom} nom={a.nom} />
                        <div>
                          <p className="font-semibold text-white">{a.prenom} {a.nom}</p>
                          <p className="text-xs text-gray-600">{a.sexe}, {a.ageApprox} ans</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {a.auteur ? (
                        <div className="flex items-center gap-1.5 text-gray-400">
                          <User className="h-3.5 w-3.5 text-gray-600" />
                          {a.auteur.prenom} {a.auteur.nom}
                        </div>
                      ) : (
                        <span className="text-gray-600">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-gray-600" />
                        {a.dernierLieuVu}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide border ${statutBadgeClass(a.statut)}`}>
                        {statutLabel(a.statut)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500">{formatDate(a.createdAt)}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <button className={btnRowGhost} onClick={() => openDetail(a.id)}>
                          <Eye className="h-3 w-3" />
                          Détails
                        </button>
                        {a.statut === "RETROUVE_EN_ATTENTE_CONFIRMATION" && (
                          <>
                            <button className={btnRowSuccess} onClick={() => { setSelectedAvis(a); setConfirmerStatut("RETROUVE_VIVANT"); setConfirmerModalOpen(true); }}>
                              <CheckCircle2 className="h-3 w-3" />
                              Confirmer
                            </button>
                            <button className={btnRowDanger} onClick={() => { setSelectedAvis(a); setRejeterModalOpen(true); }}>
                              <XCircle className="h-3 w-3" />
                              Rejeter
                            </button>
                          </>
                        )}
                        {a.validationStatut === "EN_ATTENTE" && (
                          <>
                            <button className={btnRowSuccess} onClick={() => { setSelectedAvis(a); setValidateModalOpen(true); }}>
                              <CheckCircle2 className="h-3 w-3" />
                              Valider
                            </button>
                            <button className={btnRowDanger} onClick={() => { setSelectedAvis(a); setRejectMotif(""); setRejectModalOpen(true); }}>
                              <XCircle className="h-3 w-3" />
                              Rejeter
                            </button>
                          </>
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

      {detailModalOpen && selectedAvis && (
        <ModalShell title={`Avis: ${selectedAvis.prenom} ${selectedAvis.nom}`} onClose={() => setDetailModalOpen(false)}>
          <div className="space-y-5 text-sm">
            {selectedAvis.photos && selectedAvis.photos.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {selectedAvis.photos.map((p) => (
                  <div key={p.id} className={`relative w-20 h-20 rounded-lg overflow-hidden border ${p.estPrincipale ? "border-[#ef4444]/50 ring-1 ring-[#ef4444]/20" : "border-[#1f2937]/50"}`}>
                    <img src={photoSrc(p.url)} alt="" className="w-full h-full object-cover" />
                    {p.estPrincipale && (
                      <span className="absolute bottom-0 inset-x-0 bg-[#ef4444]/90 text-white text-[9px] font-bold text-center py-0.5">Principale</span>
                    )}
                  </div>
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <div>
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Sexe</p>
                <p className="text-gray-200 font-medium">{selectedAvis.sexe}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Âge approximatif</p>
                <p className="text-gray-200 font-medium">{selectedAvis.ageApprox} ans</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Téléphone</p>
                <p className="text-gray-200 font-medium flex items-center gap-1.5"><Phone className="h-3 w-3 text-gray-600" />{selectedAvis.telephone}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Dernier lieu vu</p>
                <p className="text-gray-200 font-medium flex items-center gap-1.5"><MapPin className="h-3 w-3 text-gray-600" />{selectedAvis.dernierLieuVu}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Date disparition</p>
                <p className="text-gray-200 font-medium flex items-center gap-1.5"><Calendar className="h-3 w-3 text-gray-600" />{selectedAvis.dateDisparition ? formatDate(selectedAvis.dateDisparition) : "—"}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Statut</p>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide border mt-0.5 ${statutBadgeClass(selectedAvis.statut)}`}>
                  {statutLabel(selectedAvis.statut)}
                </span>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Description</p>
              <p className="text-gray-300 bg-[#0b0f17]/60 border border-[#1f2937]/50 rounded-lg p-3">{selectedAvis.description}</p>
            </div>
            {selectedAvis.auteur && (
              <div className="flex items-center gap-2.5 bg-[#0b0f17]/60 border border-[#1f2937]/50 rounded-lg p-3">
                <Avatar prenom={selectedAvis.auteur.prenom} nom={selectedAvis.auteur.nom} />
                <div>
                  <p className="text-xs font-semibold text-gray-300">{selectedAvis.auteur.prenom} {selectedAvis.auteur.nom}</p>
                  <p className="text-xs text-gray-600">{selectedAvis.auteur.email}</p>
                </div>
              </div>
            )}
            {selectedAvis.motifRejet && (
              <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg p-3">
                <FileWarning className="h-4 w-4 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold">Motif de rejet</p>
                  <p className="text-sm mt-0.5">{selectedAvis.motifRejet}</p>
                </div>
              </div>
            )}
            {selectedAvis.statut === "RETROUVE_EN_ATTENTE_CONFIRMATION" && (
              <div className="flex justify-end gap-3 pt-4 border-t border-[#1f2937]/50">
                <button className={btnPrimary} onClick={() => { setDetailModalOpen(false); setConfirmerStatut("RETROUVE_VIVANT"); setConfirmerModalOpen(true); }}>Confirmer retrouvé</button>
                <button className={btnDanger} onClick={() => { setDetailModalOpen(false); setRejeterModalOpen(true); }}>Rejeter</button>
              </div>
            )}
            {selectedAvis.validationStatut === "EN_ATTENTE" && (
              <div className="flex justify-end gap-3 pt-4 border-t border-[#1f2937]/50">
                <button className={btnPrimary} onClick={() => { setDetailModalOpen(false); setValidateModalOpen(true); }}>Valider</button>
                <button className={btnDanger} onClick={() => { setDetailModalOpen(false); setRejectMotif(""); setRejectModalOpen(true); }}>Rejeter</button>
              </div>
            )}
          </div>
        </ModalShell>
      )}

      {confirmerModalOpen && selectedAvis && (
        <ModalShell title="Confirmer le statut Retrouvé" onClose={() => setConfirmerModalOpen(false)}>
          <div className="space-y-4">
            <p className="text-sm text-gray-400">
              Le proche a déclaré <span className="text-white font-semibold">{selectedAvis.prenom} {selectedAvis.nom}</span> comme retrouvé. Confirmez-vous ?
            </p>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1f2937]/80 bg-[#0b0f17]/50 cursor-pointer hover:border-[#1f2937] transition-all">
                <input type="radio" name="confirmerStatut" value="RETROUVE_VIVANT" checked={confirmerStatut === "RETROUVE_VIVANT"} onChange={(e) => setConfirmerStatut(e.target.value)} className="accent-[#ef4444]" />
                <div>
                  <p className="text-sm font-medium text-white">Retrouvé vivant</p>
                  <p className="text-xs text-gray-500">La personne a été retrouvée en vie</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1f2937]/80 bg-[#0b0f17]/50 cursor-pointer hover:border-[#1f2937] transition-all">
                <input type="radio" name="confirmerStatut" value="RETROUVE_DECEDE" checked={confirmerStatut === "RETROUVE_DECEDE"} onChange={(e) => setConfirmerStatut(e.target.value)} className="accent-[#ef4444]" />
                <div>
                  <p className="text-sm font-medium text-white">Retrouvé décédé</p>
                  <p className="text-xs text-gray-500">La personne a été retrouvée sans vie</p>
                </div>
              </label>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button className={btnGhost} onClick={() => setConfirmerModalOpen(false)}>Annuler</button>
              <button className={btnPrimary} disabled={confirmerLoading} onClick={handleConfirmer}>{confirmerLoading ? "Confirmation..." : "Confirmer"}</button>
            </div>
          </div>
        </ModalShell>
      )}

      {rejeterModalOpen && selectedAvis && (
        <ModalShell title="Rejeter la déclaration" onClose={() => setRejeterModalOpen(false)}>
          <div className="space-y-4">
            <p className="text-sm text-gray-400">
              Voulez-vous vraiment rejeter la déclaration de <span className="text-white font-semibold">{selectedAvis.prenom} {selectedAvis.nom}</span> ? L&apos;avis reprendra le statut « Recherché ».
            </p>
            <div className="flex justify-end gap-3">
              <button className={btnGhost} onClick={() => setRejeterModalOpen(false)}>Annuler</button>
              <button className={btnDanger} disabled={rejeterLoading} onClick={handleRejeter}>{rejeterLoading ? "Rejet..." : "Rejeter"}</button>
            </div>
          </div>
        </ModalShell>
      )}

      {validateModalOpen && (
        <ModalShell title="Confirmer la validation" onClose={() => setValidateModalOpen(false)}>
          <p className="text-sm text-gray-400 mb-6">Voulez-vous vraiment valider cet avis citoyen ? Il sera publié et visible publiquement.</p>
          <div className="flex justify-end gap-3">
            <button className={btnGhost} onClick={() => setValidateModalOpen(false)}>Annuler</button>
            <button className={btnPrimary} disabled={actionLoading} onClick={handleValidate}>{actionLoading ? "Validation..." : "Confirmer"}</button>
          </div>
        </ModalShell>
      )}

      {rejectModalOpen && (
        <ModalShell title="Rejeter l'avis" onClose={() => setRejectModalOpen(false)}>
          <div className="space-y-4">
            <p className="text-sm text-gray-400">Veuillez indiquer le motif du rejet.</p>
            <textarea
              value={rejectMotif}
              onChange={(e) => setRejectMotif(e.target.value)}
              rows={4}
              className={textareaClass}
              placeholder="Motif du rejet..."
            />
            <div className="flex justify-end gap-3">
              <button className={btnGhost} onClick={() => setRejectModalOpen(false)}>Annuler</button>
              <button className={btnDanger} disabled={actionLoading || !rejectMotif.trim()} onClick={handleReject}>{actionLoading ? "Rejet..." : "Confirmer le rejet"}</button>
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  );
}
