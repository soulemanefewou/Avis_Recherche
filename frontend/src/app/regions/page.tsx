"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { Region, Ville } from "@/lib/types";
import {
  MapPin,
  ChevronDown,
  ChevronUp,
  Map,
  Search,
  ArrowRight,
  Info,
  Loader2,
  Globe2,
} from "lucide-react";

export default function RegionsPage() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [expandedRegions, setExpandedRegions] = useState<Record<number, boolean>>({});
  const [citiesData, setCitiesData] = useState<Record<number, Ville[]>>({});
  const [loadingCities, setLoadingCities] = useState<Record<number, boolean>>({});

  useEffect(() => {
    api.get("/api/regions")
      .then((res) => {
        setRegions(res.data.data || []);
      })
      .catch((err) => {
        setError("Erreur lors de la récupération des régions.");
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const toggleRegion = async (regionId: number) => {
    const isExpanded = !!expandedRegions[regionId];

    setExpandedRegions((prev) => ({
      ...prev,
      [regionId]: !isExpanded,
    }));

    if (!isExpanded && !citiesData[regionId]) {
      setLoadingCities((prev) => ({ ...prev, [regionId]: true }));
      try {
        const response = await api.get(`/api/regions/${regionId}/villes`);
        setCitiesData((prev) => ({
          ...prev,
          [regionId]: response.data.data || [],
        }));
      } catch (err) {
        console.error(`Erreur lors du chargement des villes pour la région ${regionId}`, err);
      } finally {
        setLoadingCities((prev) => ({ ...prev, [regionId]: false }));
      }
    }
  };

  const filteredRegions = regions.filter((r) =>
    r.nom.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="max-w-[1200px] mx-auto px-6 py-16 space-y-6">
        <div className="flex justify-center">
          <Loader2 className="animate-spin h-10 w-10 text-[#ef4444]" />
        </div>
        <div className="h-4 bg-[#1f2937] rounded w-48 mx-auto animate-pulse" />
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-[#1f2937]/40 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-12">
      <div className="text-center mb-10 animate-fade-in">
        <span className="inline-flex items-center gap-1.5 bg-[#ef4444]/10 text-[#ef4444] text-xs font-semibold px-3 py-1.5 rounded-full mb-3 border border-[#ef4444]/20">
          <Map className="h-3 w-3" />
          Découpage Administratif
        </span>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Régions &amp; Villes
        </h1>
        <p className="text-sm text-gray-500 mt-2 max-w-xl mx-auto">
          Explorez les différentes régions et villes pour consulter les avis de recherche locaux ou signaler une disparition spécifique à un secteur.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm mb-6 animate-fade-in">
          <Info className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="rounded-xl border border-[#1f2937]/80 bg-[#0e1420]/60 backdrop-blur-sm p-4 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between animate-fade-in" style={{ animationDelay: "60ms", animationFillMode: "both" }}>
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher une région..."
            className="w-full h-10 pl-10 pr-4 text-sm rounded-lg bg-[#0b0f17] border border-[#1f2937]/80 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#ef4444]/40 focus:ring-1 focus:ring-[#ef4444]/20 transition-all"
          />
        </div>
        <div className="text-xs text-gray-500 font-medium flex items-center gap-1.5 self-end md:self-center">
          <Globe2 className="h-3.5 w-3.5 text-gray-600" />
          {regions.length} régions enregistrées au total
        </div>
      </div>

      <div className="space-y-3">
        {filteredRegions.map((region, i) => {
          const isOpen = !!expandedRegions[region.id];
          const cities = citiesData[region.id] || [];
          const isCitiesLoading = !!loadingCities[region.id];

          return (
            <div
              key={region.id}
              className="rounded-xl border border-[#1f2937]/80 bg-[#0e1420]/60 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:border-[#1f2937] animate-fade-in"
              style={{ animationDelay: `${(i + 2) * 50}ms`, animationFillMode: "both" }}
            >
              <button
                onClick={() => toggleRegion(region.id)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-white/[0.02] transition cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#ef4444]/10 text-[#ef4444] rounded-xl flex items-center justify-center font-bold text-sm border border-[#ef4444]/20">
                    {region.code}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">{region.nom}</h3>
                    <p className="text-xs text-gray-500">Code : {region.code}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Link
                    href={`/?region=${region.id}`}
                    className="hidden sm:inline-flex items-center gap-1.5 text-xs text-[#ef4444] hover:text-red-400 font-semibold transition"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Voir les avis
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                  {isOpen ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </div>
              </button>

              {isOpen && (
                <div className="px-5 pb-5 pt-3 border-t border-[#1f2937]/50 bg-[#0b0f17]/30 animate-fade-in">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Villes / Communes
                    </h4>
                    <Link
                      href={`/?region=${region.id}`}
                      className="sm:hidden inline-flex items-center gap-1 text-xs text-[#ef4444] hover:text-red-400 font-semibold"
                    >
                      Voir les avis
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>

                  {isCitiesLoading ? (
                    <div className="flex items-center gap-2 py-4 justify-center">
                      <Loader2 className="animate-spin h-4 w-4 text-[#ef4444]" />
                      <span className="text-xs text-gray-500">Chargement des villes...</span>
                    </div>
                  ) : cities.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {cities.map((city) => (
                        <Link
                          key={city.id}
                          href={`/?region=${region.id}&ville=${city.id}`}
                          className="inline-flex items-center gap-1.5 bg-[#0b0f17]/60 border border-[#1f2937]/80 hover:border-[#ef4444]/40 text-gray-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:bg-[#ef4444]/5"
                        >
                          <MapPin className="h-3 w-3 text-gray-500" />
                          {city.nom}
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-4 text-gray-500 bg-[#0b0f17]/40 border border-dashed border-[#1f2937]/60 rounded-xl justify-center text-xs">
                      <Info className="h-4 w-4" />
                      Aucune ville enregistrée pour cette région.
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {filteredRegions.length === 0 && (
          <div className="text-center py-14 rounded-xl border border-[#1f2937]/50 bg-[#0e1420]/40">
            <Search className="h-10 w-10 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Aucune région ne correspond à votre recherche.</p>
          </div>
        )}
      </div>
    </div>
  );
}
