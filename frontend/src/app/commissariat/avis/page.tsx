"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { photoSrc } from "@/lib/photo";
import { useAuth } from "@/lib/auth-context";
import type { AvisRecherche } from "@/lib/types";
import { AvisStatutBadge, AvisTypeBadge } from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import Modal from "@/components/ui/Modal";
import { Search, Plus, Eye, Edit3, Archive, Trash2, ChevronLeft, ChevronRight, MapPin, Calendar, Clock, Filter, ArrowUpDown } from "lucide-react";

const STATUT_OPTIONS = [
  { value: "", label: "Tous les statuts" },
  { value: "BROUILLON", label: "Brouillon" },
  { value: "RECHERCHE", label: "Recherché" },
  { value: "RETROUVE_VIVANT", label: "Retrouvé vivant" },
  { value: "RETROUVE_DECEDE", label: "Retrouvé décédé" },
  { value: "RECHERCHE_CLOTUREE", label: "Clôturé" },
];

const LIMIT = 12;

function getInitials(prenom: string, nom: string) {
  return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-[#1f2937]/50 bg-[#0e1420]/40 overflow-hidden animate-pulse">
      <div className="aspect-[3/4] bg-[#1f2937]/30" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-[#1f2937] rounded w-3/4" />
        <div className="h-3 bg-[#1f2937] rounded w-1/2" />
        <div className="h-3 bg-[#1f2937] rounded w-2/3" />
      </div>
    </div>
  );
}

export default function CommissariatAvisPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [avisList, setAvisList] = useState<AvisRecherche[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statut, setStatut] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [archivingId, setArchivingId] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && user && !user.roles.includes("ROLE_COMMISSARIAT")) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  const fetchAvis = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: String(LIMIT),
        search,
        statut,
      });
      const res = await api.get(`/api/commissariat/avis?${params}`);
      setAvisList(res.data.data || []);
      setTotal(res.data.pagination?.total || 0);
    } catch (err) {
      console.error("Erreur lors du chargement des avis:", err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statut]);

  useEffect(() => {
    if (user?.roles.includes("ROLE_COMMISSARIAT")) {
      fetchAvis();
    }
  }, [user, fetchAvis]);

  const handleSearch = () => {
    setPage(1);
    setSearch(searchInput);
  };

  const handleArchive = async (id: number) => {
    try {
      setArchivingId(id);
      await api.patch(`/api/commissariat/avis/${id}/archive`);
      fetchAvis();
    } catch (err) {
      console.error("Erreur lors de l'archivage:", err);
    } finally {
      setArchivingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      setDeleting(true);
      await api.delete(`/api/commissariat/avis/${deletingId}`);
      setDeleteModalOpen(false);
      setDeletingId(null);
      fetchAvis();
    } catch (err) {
      console.error("Erreur lors de la suppression:", err);
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const totalPages = Math.ceil(total / LIMIT);

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
      <div className="flex items-center justify-between animate-fade-in">
        <div className="flex items-center gap-3">
          <Link
            href="/commissariat"
            className="w-8 h-8 rounded-lg border border-[#1f2937]/80 bg-[#0e1420]/60 flex items-center justify-center hover:border-[#ef4444]/30 hover:bg-[#ef4444]/5 transition-all duration-200"
          >
            <ChevronLeft className="h-4 w-4 text-gray-400" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Mes avis officiels</h1>
            <p className="text-sm text-gray-500">Gestion de vos avis de recherche</p>
          </div>
        </div>
        <Link
          href="/commissariat/avis/create"
          className="flex items-center gap-1.5 text-xs font-semibold py-2 px-4 rounded-lg bg-gradient-to-r from-[#ef4444] to-[#dc2626] text-white hover:from-[#dc2626] hover:to-[#b91c1c] transition-all duration-200 shadow-md shadow-[#ef4444]/10"
        >
          <Plus className="h-3.5 w-3.5" />
          Nouvel avis
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 animate-fade-in" style={{ animationDelay: "80ms", animationFillMode: "both" }}>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Rechercher par nom, prénom..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="w-full h-10 pl-9 pr-3 text-sm rounded-lg border border-[#1f2937]/80 bg-[#0e1420]/60 text-white placeholder-gray-500 focus:outline-none focus:border-[#ef4444]/40 focus:ring-1 focus:ring-[#ef4444]/20 transition-all duration-200"
          />
        </div>
        <div className="relative w-full sm:w-48">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
          <select
            value={statut}
            onChange={(e) => {
              setStatut(e.target.value);
              setPage(1);
            }}
            className="w-full h-10 pl-9 pr-8 text-sm rounded-lg border border-[#1f2937]/80 bg-[#0e1420]/60 text-white appearance-none focus:outline-none focus:border-[#ef4444]/40 focus:ring-1 focus:ring-[#ef4444]/20 transition-all duration-200 cursor-pointer"
          >
            {STATUT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-[#0e1420] text-white">{opt.label}</option>
            ))}
          </select>
          <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500 pointer-events-none" />
        </div>
        <button
          onClick={handleSearch}
          className="h-10 px-4 text-xs font-medium rounded-lg border border-[#1f2937]/80 bg-[#0e1420]/60 text-gray-300 hover:text-white hover:border-[#1f2937] hover:bg-[#0e1420]/80 transition-all duration-200"
        >
          Rechercher
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : avisList.length === 0 ? (
        <EmptyState
          title="Aucun avis trouvé"
          description="Essayez de modifier vos filtres ou créez un nouvel avis."
          className="border border-[#1f2937]/50 bg-[#0e1420]/40 rounded-xl py-16"
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {avisList.map((avis, index) => (
              <div
                key={avis.id}
                className="group rounded-xl border border-[#1f2937]/80 bg-[#0e1420]/60 backdrop-blur-sm hover:border-[#1f2937] hover:bg-[#0e1420]/80 transition-all duration-300 overflow-hidden animate-fade-in"
                style={{ animationDelay: `${index * 60}ms`, animationFillMode: "both" }}
              >
                <Link href={`/commissariat/avis/${avis.id}`}>
                  <div className="aspect-[3/4] overflow-hidden bg-[#0b0f17] relative">
                    {avis.photos.length > 0 ? (
                      <img
                        src={photoSrc(avis.photos.find((p) => p.estPrincipale)?.url || avis.photos[0].url)}
                        alt={`${avis.prenom} ${avis.nom}`}
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0b0f17] via-[#111827] to-[#0b0f17]">
                        <div className="flex items-center justify-center h-16 w-16 rounded-full bg-[#1f2937]/50 border border-[#374151]/50">
                          <span className="text-xl font-bold text-gray-400">
                            {getInitials(avis.prenom, avis.nom)}
                          </span>
                        </div>
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0e1420] to-transparent" />
                  </div>
                </Link>

                <div className="p-4">
                  <Link href={`/commissariat/avis/${avis.id}`}>
                    <h3 className="font-bold text-white group-hover:text-[#ef4444] transition-colors duration-200 truncate">
                      {avis.prenom} {avis.nom}
                    </h3>
                  </Link>

                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-1.5">
                    <span>{avis.sexe === "HOMME" ? "Homme" : "Femme"}</span>
                    <span className="text-gray-600">&middot;</span>
                    <span>{avis.ageApprox} ans</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1.5 truncate">
                    <MapPin className="h-3 w-3 text-gray-600 shrink-0" />
                    <span className="truncate">{avis.dernierLieuVu}</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                    <Calendar className="h-3 w-3 text-[#ef4444]/70 shrink-0" />
                    <span>Disparu le {formatDate(avis.dateDisparition)}</span>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#1f2937]/50">
                    <AvisStatutBadge statut={avis.statut} />
                    <Badge variant={avis.actif ? "success" : "muted"}>
                      {avis.actif ? "Actif" : "Inactif"}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-1.5 mt-3">
                    <Link
                      href={`/commissariat/avis/${avis.id}`}
                      className="flex-1 flex items-center justify-center gap-1 text-xs font-medium py-1.5 px-2 rounded-lg border border-[#1f2937]/80 text-gray-400 hover:text-white hover:bg-white/5 hover:border-[#1f2937] transition-all duration-200"
                    >
                      <Eye className="h-3 w-3" />
                      Voir
                    </Link>
                    <Link
                      href={`/commissariat/avis/${avis.id}/edit`}
                      className="flex-1 flex items-center justify-center gap-1 text-xs font-medium py-1.5 px-2 rounded-lg border border-[#1f2937]/80 text-gray-400 hover:text-white hover:bg-white/5 hover:border-[#1f2937] transition-all duration-200"
                    >
                      <Edit3 className="h-3 w-3" />
                      Modifier
                    </Link>
                    <button
                      onClick={() => handleArchive(avis.id)}
                      disabled={archivingId === avis.id}
                      className="flex items-center justify-center gap-1 text-xs font-medium py-1.5 px-2 rounded-lg border border-[#1f2937]/80 text-gray-400 hover:text-amber-400 hover:border-amber-400/30 hover:bg-amber-500/5 transition-all duration-200 disabled:opacity-50"
                    >
                      <Archive className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => {
                        setDeletingId(avis.id);
                        setDeleteModalOpen(true);
                      }}
                      className="flex items-center justify-center gap-1 text-xs font-medium py-1.5 px-2 rounded-lg border border-[#1f2937]/80 text-gray-400 hover:text-red-400 hover:border-red-400/30 hover:bg-red-500/5 transition-all duration-200"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 animate-fade-in">
              <p className="text-sm text-gray-500">
                <span className="text-gray-400 font-medium">{total}</span> avis au total — Page <span className="text-gray-400 font-medium">{page}</span> sur <span className="text-gray-400 font-medium">{totalPages}</span>
              </p>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="flex items-center gap-1 text-xs font-medium h-9 px-3 rounded-lg border border-[#1f2937]/80 bg-[#0e1420]/60 text-gray-400 hover:text-white hover:border-[#1f2937] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Précédent
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .map((p, idx, arr) => (
                    <span key={p} className="flex items-center">
                      {idx > 0 && arr[idx - 1] !== p - 1 && (
                        <span className="text-gray-600 px-1">...</span>
                      )}
                      <button
                        onClick={() => setPage(p)}
                        className={`text-xs font-medium h-9 min-w-[36px] rounded-lg border transition-all duration-200 ${
                          p === page
                            ? "border-[#ef4444]/40 bg-[#ef4444]/10 text-[#ef4444]"
                            : "border-[#1f2937]/80 bg-[#0e1420]/60 text-gray-400 hover:text-white hover:border-[#1f2937]"
                        }`}
                      >
                        {p}
                      </button>
                    </span>
                  ))}
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
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

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeletingId(null);
        }}
        title="Confirmer la suppression"
      >
        <p className="text-sm text-gray-400 mb-6">
          Êtes-vous sûr de vouloir supprimer cet avis ? Cette action est irréversible.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => {
              setDeleteModalOpen(false);
              setDeletingId(null);
            }}
            className="text-xs font-medium h-9 px-4 rounded-lg border border-[#1f2937]/80 bg-[#0e1420]/60 text-gray-300 hover:text-white hover:border-[#1f2937] transition-all duration-200"
          >
            Annuler
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-xs font-semibold h-9 px-4 rounded-lg bg-gradient-to-r from-[#ef4444] to-[#dc2626] text-white hover:from-[#dc2626] hover:to-[#b91c1c] transition-all duration-200 shadow-md shadow-[#ef4444]/10 disabled:opacity-50"
          >
            {deleting ? "Suppression..." : "Supprimer"}
          </button>
        </div>
      </Modal>
    </div>
  );
}

function Badge({ variant, children }: { variant: "success" | "muted"; children: React.ReactNode }) {
  const styles = {
    success: "bg-green-500/10 text-green-400 border border-green-500/20",
    muted: "bg-gray-500/10 text-gray-400 border border-gray-500/20",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide ${styles[variant]}`}>
      {children}
    </span>
  );
}