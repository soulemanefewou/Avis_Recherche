"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { photoSrc } from "@/lib/photo";
import { useAuth } from "@/lib/auth-context";
import type { AvisRecherche, Region } from "@/lib/types";
import { ChevronLeft, User, MapPin, Calendar, Phone, Mail, Save, X, AlertCircle, Image as ImageIcon, ChevronDown } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading, refreshUser } = useAuth();
  const [profile, setProfile] = useState(user);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [mesAvis, setMesAvis] = useState<AvisRecherche[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);

  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    telephone: "",
    lieuResidence: "",
    region: "",
  });

  useEffect(() => {
    api.get("/api/regions").then((res) => setRegions(res.data.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.roles.includes("ROLE_COMMISSARIAT")) {
      router.replace("/commissariat/profil");
    }
  }, [user, router]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([
      api.get("/api/profile").then((res) => {
        const data = res.data.data || res.data;
        setProfile(data);
        setForm({
          nom: data.nom || "",
          prenom: data.prenom || "",
          telephone: data.telephone || "",
          lieuResidence: data.lieuResidence || "",
          region: data.region?.id ? String(data.region.id) : "",
        });
      }),
      api
        .get("/api/avis-recherches/mes-avis")
        .then((res) => setMesAvis(res.data.data || []))
        .catch(() => {}),
    ])
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      await api.put("/api/profile", {
        ...form,
        region: form.region ? Number(form.region) : undefined,
      });
      await refreshUser();
      const selectedRegion = regions.find((r) => r.id === Number(form.region));
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              nom: form.nom,
              prenom: form.prenom,
              telephone: form.telephone,
              lieuResidence: form.lieuResidence,
              region: selectedRegion,
            }
          : prev
      );
      setEditing(false);
    } catch {
      setError("Erreur lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm({
      nom: profile?.nom || "",
      prenom: profile?.prenom || "",
      telephone: profile?.telephone || "",
      lieuResidence: profile?.lieuResidence || "",
      region: profile?.region?.id ? String(profile.region.id) : "",
    });
    setEditing(false);
    setError("");
  };

  if (authLoading || loading) {
    return (
      <div className="mx-auto px-8 py-8 space-y-8 max-w-[1800px]">
        <div className="h-8 bg-[#1f2937] rounded w-36 animate-pulse" />
        <div className="rounded-xl border border-[#1f2937]/50 bg-[#0e1420]/40 overflow-hidden animate-pulse">
          <div className="h-28 bg-[#1f2937]" />
          <div className="p-6 space-y-4">
            <div className="flex items-end gap-4 -mt-14">
              <div className="w-20 h-20 rounded-full bg-[#1f2937]" />
              <div className="space-y-2 flex-1">
                <div className="h-5 bg-[#1f2937] rounded w-40" />
                <div className="h-3 bg-[#1f2937] rounded w-56" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[...Array(2)].map((_, i) => <div key={i} className="h-4 bg-[#1f2937] rounded w-32" />)}
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-6 bg-[#1f2937] rounded w-36 animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-xl border border-[#1f2937]/50 bg-[#0e1420]/40 overflow-hidden animate-pulse">
                <div className="h-40 bg-[#1f2937]" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-[#1f2937] rounded w-32" />
                  <div className="h-3 bg-[#1f2937] rounded w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const displayName = profile ? `${profile.prenom} ${profile.nom}` : "";
  const inputClass = "w-full h-10 text-sm rounded-lg border border-[#1f2937]/80 bg-[#0b0f17] text-white placeholder:text-gray-600 focus:outline-none focus:border-[#ef4444]/40 focus:ring-1 focus:ring-[#ef4444]/20 transition-all px-3";

  return (
    <div className="mx-auto px-8 py-8 space-y-8 max-w-[1800px]">
      <div className="flex items-center gap-3 animate-fade-in">
        <Link href="/" className="w-8 h-8 rounded-lg border border-[#1f2937]/80 bg-[#0e1420]/60 flex items-center justify-center hover:border-[#ef4444]/30 hover:bg-[#ef4444]/5 transition-all">
          <ChevronLeft className="h-4 w-4 text-gray-400" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-white tracking-tight">Mon profil</h1>
        </div>
        {!editing ? (
          <button onClick={() => setEditing(true)} className="text-xs font-semibold h-9 px-4 rounded-lg border border-[#1f2937]/80 bg-[#0e1420]/60 text-gray-300 hover:text-white hover:border-[#1f2937] transition-all">
            Modifier
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={handleCancel} className="text-xs font-medium h-9 px-4 rounded-lg border border-[#1f2937]/80 bg-[#0e1420]/60 text-gray-300 hover:text-white transition-all">
              Annuler
            </button>
            <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-1.5 text-xs font-semibold h-9 px-4 rounded-lg bg-gradient-to-r from-[#ef4444] to-[#dc2626] text-white hover:from-[#dc2626] hover:to-[#b91c1c] transition-all shadow-md shadow-[#ef4444]/10 disabled:opacity-50">
              <Save className="h-3.5 w-3.5" />
              {saving ? "Sauvegarde..." : "Sauvegarder"}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm animate-fade-in">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="rounded-xl border border-[#1f2937]/80 bg-[#0e1420]/60 backdrop-blur-sm overflow-hidden animate-fade-in">
        <div className="bg-gradient-to-r from-[#0e1420] via-[#161d2a] to-[#0b0f17] h-28 border-b border-[#1f2937]/50" />
        <div className="px-6 pb-6">
          <div className="flex items-end gap-4 -mt-10 mb-4">
            <div className="w-20 h-20 rounded-full border-2 border-[#1f2937]/80 bg-[#0e1420] flex items-center justify-center text-xl font-bold text-white shadow-lg shrink-0">
              {profile?.prenom?.charAt(0)}{profile?.nom?.charAt(0)}
            </div>
            <div className="pb-1">
              <h2 className="text-xl font-bold text-white">{displayName}</h2>
              <p className="text-sm text-gray-500 flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-gray-600" />
                {profile?.email}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {editing ? (
              <>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Prénom</label>
                  <input className={inputClass} value={form.prenom} onChange={(e) => setForm((p) => ({ ...p, prenom: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Nom</label>
                  <input className={inputClass} value={form.nom} onChange={(e) => setForm((p) => ({ ...p, nom: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Téléphone</label>
                  <input className={inputClass} value={form.telephone} onChange={(e) => setForm((p) => ({ ...p, telephone: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Lieu de résidence</label>
                  <input className={inputClass} value={form.lieuResidence} onChange={(e) => setForm((p) => ({ ...p, lieuResidence: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Région</label>
                  <div className="relative">
                    <select className={`${inputClass} appearance-none pr-9`} value={form.region} onChange={(e) => setForm((p) => ({ ...p, region: e.target.value }))}>
                      <option value="" className="bg-[#0e1420] text-gray-500">Non précisée</option>
                      {regions.map((r) => (
                        <option key={r.id} value={r.id} className="bg-[#0e1420] text-white">{r.nom}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                  </div>
                </div>
              </>
            ) : (
              <>
                {profile?.telephone && (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Phone className="h-4 w-4 text-gray-600 shrink-0" />
                    <span className="text-gray-300">{profile.telephone}</span>
                  </div>
                )}
                {profile?.lieuResidence && (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <MapPin className="h-4 w-4 text-gray-600 shrink-0" />
                    <span className="text-gray-300">{profile.lieuResidence}</span>
                  </div>
                )}
                {profile?.region && (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <MapPin className="h-4 w-4 text-gray-600 shrink-0" />
                    <span className="text-gray-300">Région : {profile.region.nom}</span>
                  </div>
                )}
              </>
            )}
          </div>

          {profile?.roles && profile.roles.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-[#1f2937]/50">
              {profile.roles.map((role) => (
                <span key={role} className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {role}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="animate-fade-in" style={{ animationDelay: "80ms", animationFillMode: "both" }}>
        <h2 className="text-lg font-bold text-white tracking-tight mb-5">Mes avis de recherche</h2>

        {mesAvis.length === 0 ? (
          <div className="text-center py-16 rounded-xl border border-[#1f2937]/50 bg-[#0e1420]/40">
            <User className="h-12 w-12 text-gray-700 mx-auto mb-3" />
            <p className="text-sm text-gray-500 mb-4">Vous n'avez pas encore publié d'avis de recherche.</p>
            <Link href="/avis/create" className="inline-flex items-center gap-1.5 text-xs font-semibold h-9 px-4 rounded-lg bg-gradient-to-r from-[#ef4444] to-[#dc2626] text-white hover:from-[#dc2626] hover:to-[#b91c1c] transition-all shadow-md shadow-[#ef4444]/10">
              Publier un avis
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {mesAvis.map((avis) => (
              <Link key={avis.id} href={`/avis/${avis.id}`} className="block rounded-xl border border-[#1f2937]/80 bg-[#0e1420]/60 backdrop-blur-sm overflow-hidden hover:border-[#ef4444]/30 hover:bg-[#ef4444]/5 transition-all duration-200 group">
                <div className="aspect-[3/2] bg-[#0b0f17] overflow-hidden relative">
                  {avis.photos.length > 0 ? (
                    <img src={photoSrc(avis.photos.find((p) => p.estPrincipale)?.url || avis.photos[0].url)} alt={`${avis.prenom} ${avis.nom}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="h-10 w-10 text-gray-700" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-white text-sm truncate">
                    {avis.prenom} {avis.nom}
                  </h3>
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                    <MapPin className="h-3 w-3 text-gray-600 shrink-0" />
                    <span className="truncate">{avis.dernierLieuVu}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                    <Calendar className="h-3 w-3 text-gray-600 shrink-0" />
                    <span>
                      {new Date(avis.dateDisparition).toLocaleDateString("fr-FR", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}