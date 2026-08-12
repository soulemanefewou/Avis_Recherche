"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { ChevronLeft, ChevronRight, Filter, Eye, EyeOff, ArrowUpDown, MapPin, Calendar, Phone, Clock, User, FileText, AlertCircle, X } from "lucide-react";

interface SignalementUtilisateur {
  id: number;
  nom: string;
  prenom: string;
}

interface SignalementAvis {
  id: number;
  nom: string;
  prenom: string;
}

interface Signalement {
  id: number;
  description: string;
  lieu: string;
  dateObservation: string;
  telephoneContact: string;
  statut: string;
  createdAt: string;
  utilisateur: SignalementUtilisateur;
  avisRecherche: SignalementAvis;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
}

const STATUS_FILTER_OPTIONS = [
  { value: "", label: "Tous les statuts" },
  { value: "PUBLIE", label: "Publié" },
  { value: "MASQUE", label: "Masqué" },
];

const STATUT_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  PUBLIE: { bg: "bg-green-500/10", text: "text-green-400", label: "Publié" },
  MASQUE: { bg: "bg-red-500/10", text: "text-red-400", label: "Masqué" },
};

function SkeletonRow() {
  return (
    <div className="rounded-xl border border-[#1f2937]/50 bg-[#0e1420]/40 overflow-hidden animate-pulse">
      <div className="p-5 space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-[#1f2937] rounded w-1/3" />
            <div className="h-3 bg-[#1f2937] rounded w-1/4" />
          </div>
          <div className="h-6 bg-[#1f2937] rounded w-16" />
        </div>
        <div className="h-3 bg-[#1f2937] rounded w-2/3" />
        <div className="h-3 bg-[#1f2937] rounded w-1/2" />
      </div>
    </div>
  );
}

function Badge({ statut }: { statut: string }) {
  const s = STATUT_STYLES[statut] ?? { bg: "bg-gray-500/10", text: "text-gray-400", label: statut };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide ${s.bg} ${s.text} border border-current/20`}>
      {s.label}
    </span>
  );
}

export default function SignalementsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [signalements, setSignalements] = useState<Signalement[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [selectedSignalement, setSelectedSignalement] = useState<Signalement | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || !user.roles.includes("ROLE_COMMISSARIAT"))) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  const fetchSignalements = useCallback(
    async (page: number, statut: string) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(page), limit: "20" });
        if (statut) params.set("statut", statut);
        const res = await api.get(`/api/commissariat/signalements?${params}`);
        setSignalements(res.data.data);
        setPagination(res.data.pagination);
      } catch (err) {
        console.error("Erreur chargement signalements:", err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (user && user.roles.includes("ROLE_COMMISSARIAT")) {
      fetchSignalements(pagination.page, filter);
    }
  }, [user, filter]);

  const handlePageChange = (newPage: number) => {
    fetchSignalements(newPage, filter);
  };

  const handleFilterChange = (value: string) => {
    setFilter(value);
    fetchSignalements(1, value);
  };

  const handleToggleMasquer = async (e: React.MouseEvent, s: Signalement) => {
    e.stopPropagation();
    setActionLoading(s.id);
    try {
      const endpoint =
        s.statut === "MASQUE"
          ? `/api/commissariat/signalements/${s.id}/demasquer`
          : `/api/commissariat/signalements/${s.id}/masquer`;
      await api.patch(endpoint);
      fetchSignalements(pagination.page, filter);
      if (selectedSignalement?.id === s.id) {
        setSelectedSignalement(null);
      }
    } catch (err) {
      console.error("Erreur action signalement:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  if (authLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="h-8 bg-[#1f2937] rounded w-48 animate-pulse" />
        <div className="h-4 bg-[#1f2937] rounded w-64 animate-pulse" />
      </div>
    );
  }

  if (!user || !user.roles.includes("ROLE_COMMISSARIAT")) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="animate-fade-in">
        <div className="flex items-center gap-3 mb-1">
          <Link
            href="/commissariat"
            className="w-8 h-8 rounded-lg border border-[#1f2937]/80 bg-[#0e1420]/60 flex items-center justify-center hover:border-[#ef4444]/30 hover:bg-[#ef4444]/5 transition-all duration-200"
          >
            <ChevronLeft className="h-4 w-4 text-gray-400" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Signalements</h1>
            <p className="text-sm text-gray-500">Gérez les signalements reçus pour vos avis de recherche</p>
          </div>
        </div>
      </div>

      <div className="relative w-full sm:w-56 animate-fade-in" style={{ animationDelay: "80ms", animationFillMode: "both" }}>
        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
        <select
          value={filter}
          onChange={(e) => handleFilterChange(e.target.value)}
          className="w-full h-10 pl-9 pr-8 text-sm rounded-lg border border-[#1f2937]/80 bg-[#0e1420]/60 text-white appearance-none focus:outline-none focus:border-[#ef4444]/40 focus:ring-1 focus:ring-[#ef4444]/20 transition-all duration-200 cursor-pointer"
        >
          {STATUS_FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-[#0e1420] text-white">{opt.label}</option>
          ))}
        </select>
        <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500 pointer-events-none" />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
        </div>
      ) : signalements.length === 0 ? (
        <EmptyState
          title="Aucun signalement trouvé"
          description="Aucun signalement ne correspond à vos critères."
          className="border border-[#1f2937]/50 bg-[#0e1420]/40 rounded-xl py-16"
        />
      ) : (
        <>
          <div className="space-y-3">
            {signalements.map((s, i) => {
              return (
                <div
                  key={s.id}
                  className="rounded-xl border border-[#1f2937]/80 bg-[#0e1420]/60 backdrop-blur-sm hover:border-[#1f2937] hover:bg-[#0e1420]/80 transition-all duration-300 overflow-hidden cursor-pointer animate-fade-in"
                  style={{ animationDelay: `${i * 50}ms`, animationFillMode: "both" }}
                  onClick={() => setSelectedSignalement(s)}
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Avis</span>
                          <Link
                            href={`/commissariat/avis/${s.avisRecherche.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-sm font-bold text-white hover:text-[#ef4444] transition-colors duration-200 truncate"
                          >
                            {s.avisRecherche.prenom} {s.avisRecherche.nom}
                          </Link>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <User className="h-3 w-3 text-gray-600 shrink-0" />
                          <span>Signalé par {s.utilisateur.prenom} {s.utilisateur.nom}</span>
                        </div>
                      </div>
                      <Badge statut={s.statut} />
                    </div>

                    <p className="text-sm text-gray-400 line-clamp-2 mb-3">{s.description}</p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-500">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-3 w-3 text-gray-600 shrink-0" />
                        {s.lieu}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3 text-gray-600 shrink-0" />
                        {formatDate(s.dateObservation)}
                      </span>
                      {s.telephoneContact && (
                        <span className="flex items-center gap-1.5">
                          <Phone className="h-3 w-3 text-gray-600 shrink-0" />
                          {s.telephoneContact}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3 text-gray-600 shrink-0" />
                        {formatDate(s.createdAt)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[#1f2937]/50">
                      <button
                        onClick={(e) => handleToggleMasquer(e, s)}
                        disabled={actionLoading === s.id}
                        className={`flex items-center gap-1.5 text-xs font-medium py-1.5 px-3 rounded-lg border transition-all duration-200 ${
                          s.statut === "MASQUE"
                            ? "border-green-500/30 text-green-400 hover:bg-green-500/10 hover:border-green-500/50"
                            : "border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50"
                        } disabled:opacity-50`}
                      >
                        {actionLoading === s.id ? (
                          <span className="h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
                        ) : s.statut === "MASQUE" ? (
                          <Eye className="h-3.5 w-3.5" />
                        ) : (
                          <EyeOff className="h-3.5 w-3.5" />
                        )}
                        {s.statut === "MASQUE" ? "Démasquer" : "Masquer"}
                      </button>
                      <span
                        className="text-xs text-gray-600 hover:text-gray-400 transition-colors ml-auto cursor-pointer"
                        onClick={() => setSelectedSignalement(s)}
                      >
                        Détails
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2 animate-fade-in">
              <p className="text-sm text-gray-500">
                <span className="text-gray-400 font-medium">{pagination.total}</span> résultat{pagination.total > 1 ? "s" : ""} au total
              </p>
              <div className="flex items-center gap-2">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => handlePageChange(pagination.page - 1)}
                  className="flex items-center gap-1 text-xs font-medium h-9 px-3 rounded-lg border border-[#1f2937]/80 bg-[#0e1420]/60 text-gray-400 hover:text-white hover:border-[#1f2937] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Précédent
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - pagination.page) <= 1)
                  .map((p, idx, arr) => (
                    <span key={p} className="flex items-center">
                      {idx > 0 && arr[idx - 1] !== p - 1 && (
                        <span className="text-gray-600 px-1">...</span>
                      )}
                      <button
                        onClick={() => handlePageChange(p)}
                        className={`text-xs font-medium h-9 min-w-[36px] rounded-lg border transition-all duration-200 ${
                          p === pagination.page
                            ? "border-[#ef4444]/40 bg-[#ef4444]/10 text-[#ef4444]"
                            : "border-[#1f2937]/80 bg-[#0e1420]/60 text-gray-400 hover:text-white hover:border-[#1f2937]"
                        }`}
                      >
                        {p}
                      </button>
                    </span>
                  ))}
                <button
                  disabled={pagination.page >= totalPages}
                  onClick={() => handlePageChange(pagination.page + 1)}
                  className="flex items-center gap-1 text-xs font-medium h-9 px-3 rounded-lg border border-[#1f2937]/80 bg-[#0e1420]/60 text-gray-400 hover:text-white hover:border-[#1f2937] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Suivant
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {selectedSignalement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelectedSignalement(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-lg rounded-xl border border-[#1f2937]/80 bg-[#0e1420] shadow-2xl shadow-black/40 animate-scale-in overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-[#1f2937]/50">
              <h2 className="text-base font-bold text-white tracking-tight">Détails du signalement</h2>
              <button onClick={() => setSelectedSignalement(null)} className="w-7 h-7 rounded-lg border border-[#1f2937]/80 flex items-center justify-center hover:border-[#ef4444]/30 hover:bg-[#ef4444]/5 transition-all duration-200">
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>

            <div className="p-5 space-y-5 max-h-[60vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Avis de recherche</p>
                  <Link
                    href={`/commissariat/avis/${selectedSignalement.avisRecherche.id}`}
                    className="text-sm font-bold text-white hover:text-[#ef4444] transition-colors"
                    onClick={() => setSelectedSignalement(null)}
                  >
                    {selectedSignalement.avisRecherche.prenom} {selectedSignalement.avisRecherche.nom}
                  </Link>
                </div>
                <Badge statut={selectedSignalement.statut} />
              </div>

              <div>
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Signalé par</p>
                <p className="text-sm text-white flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-gray-500" />
                  {selectedSignalement.utilisateur.prenom} {selectedSignalement.utilisateur.nom}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Lieu</p>
                  <p className="text-sm text-white flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                    {selectedSignalement.lieu}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Date d&apos;observation</p>
                  <p className="text-sm text-white flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                    {formatDate(selectedSignalement.dateObservation)}
                  </p>
                </div>
              </div>

              {selectedSignalement.telephoneContact && (
                <div>
                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Téléphone de contact</p>
                  <p className="text-sm text-white flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                    {selectedSignalement.telephoneContact}
                  </p>
                </div>
              )}

              <div>
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Description</p>
                <p className="text-sm text-gray-300 whitespace-pre-wrap bg-[#0b0f17] rounded-lg p-3 border border-[#1f2937]/50">
                  {selectedSignalement.description}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Créé le</p>
                <p className="text-sm text-white flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                  {formatDate(selectedSignalement.createdAt)}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-5 border-t border-[#1f2937]/50">
              <button
                onClick={() => setSelectedSignalement(null)}
                className="text-xs font-medium h-9 px-4 rounded-lg border border-[#1f2937]/80 bg-[#0e1420]/60 text-gray-300 hover:text-white hover:border-[#1f2937] transition-all duration-200"
              >
                Fermer
              </button>
              <button
                onClick={(e) => handleToggleMasquer(e, selectedSignalement)}
                disabled={actionLoading === selectedSignalement.id}
                className={`flex items-center gap-1.5 text-xs font-semibold h-9 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 ${
                  selectedSignalement.statut === "MASQUE"
                    ? "border border-green-500/30 text-green-400 hover:bg-green-500/10"
                    : "bg-gradient-to-r from-[#ef4444] to-[#dc2626] text-white hover:from-[#dc2626] hover:to-[#b91c1c] shadow-md shadow-[#ef4444]/10"
                }`}
              >
                {actionLoading === selectedSignalement.id ? (
                  <span className="h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
                ) : selectedSignalement.statut === "MASQUE" ? (
                  <Eye className="h-3.5 w-3.5" />
                ) : (
                  <EyeOff className="h-3.5 w-3.5" />
                )}
                {selectedSignalement.statut === "MASQUE" ? "Démasquer" : "Masquer ce signalement"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ title, description, className }: { title: string; description: string; className?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${className ?? ""}`}>
      <AlertCircle className="h-10 w-10 text-gray-600 mb-3" />
      <h3 className="text-sm font-semibold text-gray-300 mb-1">{title}</h3>
      <p className="text-xs text-gray-500 max-w-xs">{description}</p>
    </div>
  );
}