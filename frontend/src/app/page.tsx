"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import api from "@/lib/api";
import type { AvisRecherche, Region } from "@/lib/types";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import AvisShareButtons from "@/components/AvisShareButtons";
import { AvisStatutBadge, AvisTypeBadge } from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import Avatar from "@/components/ui/Avatar";
import { 
  Search, 
  MapPin, 
  Calendar, 
  AlertTriangle, 
  Send, 
  RefreshCw,
  Clock,
  ChevronLeft,
  ChevronRight,
  Users,
  Eye,
} from "lucide-react";

const sexeOptions = [
  { value: "", label: "Tous les genres" },
  { value: "HOMME", label: "Hommes" },
  { value: "FEMME", label: "Femmes" },
];

const statutOptions = [
  { value: "", label: "Tous les statuts" },
  { value: "RECHERCHE", label: "Recherche Active" },
  { value: "RETROUVE_VIVANT", label: "Retrouvé Vivant" },
  { value: "RETROUVE_DECEDE", label: "Décédé" },
  { value: "RECHERCHE_CLOTUREE", label: "Clôturé" },
];

const SKELETON_COUNT = 6;
const PAGE_SIZE = 6;

function SkeletonCard({ featured }: { featured?: boolean }) {
  return (
    <div className={`${featured ? 'md:col-span-2' : 'col-span-1'}`}>
      <div className="rounded-xl border border-[#1f2937] bg-[#0e1420]/60 overflow-hidden animate-pulse">
        <div className={`${featured ? 'h-64 md:h-80' : 'h-56'} bg-[#1f2937]/50`} />
        <div className="p-6 space-y-4">
          <div className="h-5 bg-[#1f2937]/50 rounded w-3/4" />
          <div className="h-3 bg-[#1f2937]/50 rounded w-1/2" />
          <div className="pt-2 border-t border-[#1f2937]/50 space-y-2">
            <div className="h-3 bg-[#1f2937]/50 rounded w-full" />
            <div className="h-3 bg-[#1f2937]/50 rounded w-2/3" />
          </div>
          <div className="mt-4 pt-4 border-t border-[#1f2937]/50 flex gap-2">
            <div className="flex-1 h-9 bg-[#1f2937]/50 rounded-lg" />
            <div className="flex-1 h-9 bg-[#1f2937]/50 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [avisList, setAvisList] = useState<AvisRecherche[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [sexeFilter, setSexeFilter] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [statutFilter, setStatutFilter] = useState("");

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    api
      .get("/api/regions")
      .then((res) => setRegions(res.data.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", String(PAGE_SIZE));
        if (appliedSearch) params.set("search", appliedSearch);
        if (sexeFilter) params.set("sexe", sexeFilter);
        if (regionFilter) params.set("region", regionFilter);
        if (statutFilter) params.set("statut", statutFilter);

        const response = await api.get(`/api/avis-recherches?${params.toString()}`);
        if (cancelled) return;
        setAvisList(response.data.data || []);
        setTotal(response.data.pagination?.total || 0);
      } catch (error) {
        if (cancelled) return;
        console.error("Erreur lors de la r\u00e9cup\u00e9ration des avis:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page, appliedSearch, sexeFilter, regionFilter, statutFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAppliedSearch(searchTerm);
    setPage(1);
  };

  const handlePageChange = (p: number) => {
    if (p < 1 || p > totalPages || p === page) return;
    setLoading(true);
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleResetFilters = () => {
    setLoading(true);
    setSearchTerm("");
    setAppliedSearch("");
    setSexeFilter("");
    setRegionFilter("");
    setStatutFilter("");
    setPage(1);
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const getInitials = (prenom: string, nom: string) =>
    `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();

  const hasActiveFilters = sexeFilter || regionFilter || statutFilter || searchTerm;

  return (
    <div className="flex-1 flex flex-col">
      <section className="relative overflow-hidden border-b border-[#1f2937]/60">
        <div className="gradient-hero py-16 md:py-24 px-4 relative">
          <div className="absolute inset-0 opacity-20 pointer-events-none map-bg-pattern" />
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-10">
            <svg className="w-full h-full max-w-7xl" viewBox="0 0 1000 400" fill="none" stroke="currentColor">
              <path d="M100,50 L300,120 L400,80 L600,220 L750,150 L900,280" strokeWidth="1" strokeDasharray="3 3" />
              <path d="M200,300 L300,120 L550,100 L600,220 L800,350" strokeWidth="1" strokeDasharray="2 2" />
              <circle cx="100" cy="50" r="3" fill="currentColor" />
              <circle cx="300" cy="120" r="4" fill="currentColor" className="animate-pulse" />
              <circle cx="400" cy="80" r="3" fill="currentColor" />
              <circle cx="600" cy="220" r="5" fill="currentColor" />
              <circle cx="750" cy="150" r="3" fill="currentColor" />
              <circle cx="900" cy="280" r="4" fill="currentColor" />
              <circle cx="200" cy="300" r="3" fill="currentColor" />
              <circle cx="550" cy="100" r="3" fill="currentColor" />
              <circle cx="800" cy="350" r="3" fill="currentColor" />
            </svg>
          </div>

          <div className="max-w-6xl mx-auto text-center relative z-10 space-y-6 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#ef4444]/10 via-[#ef4444]/5 to-[#ef4444]/10 border border-[#ef4444]/20 text-[#ef4444] text-xs font-bold uppercase tracking-widest shadow-lg shadow-[#ef4444]/5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ef4444] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ef4444]" />
              </span>
              Alerte Disparition Nationale
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-none max-w-4xl mx-auto">
              Portail National de <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-red-500 to-amber-500">Recherche de Personnes</span>
            </h1>
            
            <p className="text-base md:text-lg text-gray-400 max-w-2xl mx-auto font-light leading-relaxed">
              Chaque témoignage peut sauver une vie. Explorez la base de données officielle, signalez des indices vérifiés ou déclarez un incident d&apos;urgence.
            </p>

            <form 
              onSubmit={handleSearchSubmit} 
              className="max-w-4xl mx-auto bg-[#0e1420]/70 border border-[#1f2937] p-2 md:p-3 rounded-2xl shadow-2xl shadow-black/50 backdrop-blur-xl grid grid-cols-1 md:grid-cols-12 gap-1.5 md:gap-2"
            >
              <div className="md:col-span-4 relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Rechercher par nom, prénom..."
                  className="w-full pl-10 pr-4 py-2.5 md:py-3 rounded-xl bg-[#0b0f17]/60 text-white placeholder-gray-500 border border-[#1f2937]/80 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-sm"
                />
              </div>

              <div className="md:col-span-3">
                <select
                  value={regionFilter}
                  onChange={(e) => { setLoading(true); setRegionFilter(e.target.value); setPage(1); }}
                  className="w-full px-3 py-2.5 md:py-3 rounded-xl bg-[#0b0f17]/60 text-gray-300 border border-[#1f2937]/80 outline-none focus:border-primary transition-all text-sm cursor-pointer appearance-none"
                >
                  <option value="">Toutes les régions</option>
                  {regions.map((r) => (
                    <option key={r.id} value={r.id}>{r.nom}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <select
                  value={sexeFilter}
                  onChange={(e) => { setLoading(true); setSexeFilter(e.target.value); setPage(1); }}
                  className="w-full px-3 py-2.5 md:py-3 rounded-xl bg-[#0b0f17]/60 text-gray-300 border border-[#1f2937]/80 outline-none focus:border-primary transition-all text-sm cursor-pointer appearance-none"
                >
                  {sexeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <select
                  value={statutFilter}
                  onChange={(e) => { setLoading(true); setStatutFilter(e.target.value); setPage(1); }}
                  className="w-full px-3 py-2.5 md:py-3 rounded-xl bg-[#0b0f17]/60 text-gray-300 border border-[#1f2937]/80 outline-none focus:border-primary transition-all text-sm cursor-pointer appearance-none"
                >
                  {statutOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-1">
                <button 
                  type="submit" 
                  className="w-full h-full bg-gradient-to-r from-primary to-primary-dark text-white font-bold py-2.5 md:py-3 px-2 rounded-xl flex items-center justify-center transition-all duration-200 hover:shadow-lg hover:shadow-primary/20 active:scale-95 cursor-pointer"
                >
                  <Search className="h-4 w-4 md:h-5 md:w-5" />
                </button>
              </div>
            </form>

            {hasActiveFilters && (
              <div className="flex justify-center items-center gap-2 animate-fade-in">
                <button 
                  onClick={handleResetFilters}
                  className="text-xs font-medium text-gray-400 hover:text-white transition flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg cursor-pointer backdrop-blur-sm"
                >
                  <RefreshCw className="h-3 w-3" />
                  Réinitialiser les filtres
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12 md:py-16 w-full flex-1">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 md:mb-10">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-[#ef4444]/10 text-[#ef4444]">
                <Clock className="h-4 w-4" />
              </span>
              Avis Actifs
            </h2>
            <p className="text-sm text-gray-500 mt-1">Derniers dossiers ouverts et mis à jour en temps réel.</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-gray-500 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm">
            <Users className="h-3.5 w-3.5" />
            {total} fiche{total > 1 ? 's' : ''} répertoriée{total > 1 ? 's' : ''}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
              <SkeletonCard key={i} featured={i === 0} />
            ))}
          </div>
        ) : avisList.length === 0 ? (
          <EmptyState
            title="Aucun avis de recherche trouvé"
            description="Essayez de modifier ou de réinitialiser vos critères de recherche pour élargir les résultats."
            action={
              <Button variant="outline" size="sm" onClick={handleResetFilters}>
                Réinitialiser les filtres
              </Button>
            }
            className="border border-[#1f2937] bg-[#0e1420]/50 py-16 rounded-xl"
          />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
              {avisList.map((avis, index) => {
                return (
                  <div 
                    key={avis.id}
                    className={`group col-span-1 animate-fade-in`}
                    style={{ animationDelay: `${(index % 6) * 60}ms`, animationFillMode: 'both' }}
                  >
                    <div className="h-full flex flex-col overflow-hidden rounded-xl border border-[#1f2937]/80 bg-[#0e1420]/60 backdrop-blur-sm hover:border-[#1f2937] hover:bg-[#0e1420]/80 transition-all duration-300 hover:shadow-xl hover:shadow-black/30">
                      <div className="relative w-full aspect-[3/4] overflow-hidden bg-[#0b0f17]">
                        {avis.photos.length > 0 ? (
                          <img
                            src={avis.photos.find((p) => p.estPrincipale)?.url || avis.photos[0].url}
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

                      <div className="p-5 flex-1 flex flex-col">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-bold text-lg text-white tracking-tight group-hover:text-primary transition-colors duration-200">
                            {avis.prenom} {avis.nom}
                          </h3>
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                          <span>{avis.sexe === "HOMME" ? "Homme" : "Femme"}</span>
                          <span className="text-gray-600">&middot;</span>
                          <span>{avis.ageApprox} ans</span>
                        </div>

                        <div className="space-y-2 text-sm flex-1">
                          <div className="flex items-center gap-2.5 text-gray-400">
                            <MapPin className="h-3.5 w-3.5 text-gray-600 shrink-0" />
                            <span className="truncate">
                              {avis.dernierLieuVu}
                              {avis.ville?.nom ? ` (${avis.ville.nom})` : avis.region?.nom ? ` (${avis.region.nom})` : ""}
                            </span>
                          </div>

                          <div className="flex items-center gap-2.5 text-gray-400">
                            <Calendar className="h-3.5 w-3.5 text-[#ef4444]/70 shrink-0" />
                            <span>
                              Disparu le <span className="text-[#ef4444] font-medium">{formatDate(avis.dateDisparition)}</span>
                            </span>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-[#1f2937]/50 mt-auto space-y-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <AvisStatutBadge statut={avis.statut} />
                            <AvisTypeBadge type={avis.type} />
                          </div>

                          <div className="flex items-center gap-2">
                            <Link href={`/avis/${avis.id}`} className="flex-1">
                              <div className="flex items-center justify-center gap-1.5 text-xs font-medium py-2 px-3 rounded-lg border border-[#1f2937]/80 text-gray-300 hover:text-white hover:bg-white/5 hover:border-[#1f2937] transition-all duration-200 cursor-pointer">
                                <Eye className="h-3.5 w-3.5" />
                                Consulter la fiche
                              </div>
                            </Link>
                            
                            <Link href={`/avis/${avis.id}?report=true`} className="flex-1">
                              <div className="flex items-center justify-center gap-1.5 text-xs font-semibold py-2 px-3 rounded-lg bg-gradient-to-r from-[#ef4444] to-[#dc2626] text-white hover:from-[#dc2626] hover:to-[#b91c1c] transition-all duration-200 shadow-md shadow-[#ef4444]/10 cursor-pointer">
                                <Send className="h-3.5 w-3.5" />
                                Indice
                              </div>
                            </Link>

                            <AvisShareButtons
                              compact
                              id={avis.id}
                              prenom={avis.prenom}
                              nom={avis.nom}
                              ageApprox={avis.ageApprox}
                              dateDisparition={avis.dateDisparition}
                              dernierLieuVu={avis.dernierLieuVu}
                              telephone={avis.telephone}
                              photoUrl={
                                avis.photos.find((p) => p.estPrincipale)?.url || avis.photos[0]?.url
                              }
                              description={avis.description}
                              villeNom={avis.ville?.nom}
                              regionNom={avis.region?.nom}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 animate-fade-in">
                <p className="text-sm text-gray-500">
                  <span className="text-gray-400 font-medium">{total}</span> avis au total — Page <span className="text-gray-400 font-medium">{page}</span> sur <span className="text-gray-400 font-medium">{totalPages}</span>
                </p>
                <div className="flex items-center gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => handlePageChange(page - 1)}
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
                          onClick={() => handlePageChange(p)}
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
                    onClick={() => handlePageChange(page + 1)}
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
      </div>
    </div>
  );
}
