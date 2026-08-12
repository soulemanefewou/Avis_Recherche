"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { ChevronLeft, User, MapPin, FileText, Save, AlertCircle, CheckCircle2, Ruler, Weight, Phone, Calendar, X } from "lucide-react";

interface Region { id: number; nom: string }
interface Ville { id: number; nom: string }

interface AvisForm {
  nom: string;
  prenom: string;
  sexe: string;
  ageApprox: string;
  dateDisparition: string;
  dernierLieuVu: string;
  telephone: string;
  region: string;
  ville: string;
  description: string;
  circonstances: string;
  tenueVestimentaire: string;
  signesParticuliers: string;
  taille: string;
  poids: string;
}

export default function EditAvisPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { user, loading: authLoading } = useAuth();
  const [form, setForm] = useState<AvisForm | null>(null);
  const [regions, setRegions] = useState<Region[]>([]);
  const [villes, setVilles] = useState<Ville[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!authLoading && (!user || !user.roles.includes("ROLE_COMMISSARIAT"))) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  const fetchAvis = useCallback(async () => {
    try {
      const [avisRes, regionsRes] = await Promise.all([
        api.get(`/api/commissariat/avis/${id}`),
        api.get("/api/regions"),
      ]);
      const a = avisRes.data.data;
      setRegions(regionsRes.data.data || []);

      setForm({
        nom: a.nom || "",
        prenom: a.prenom || "",
        sexe: a.sexe || "",
        ageApprox: String(a.ageApprox || ""),
        dateDisparition: a.dateDisparition ? a.dateDisparition.slice(0, 16) : "",
        dernierLieuVu: a.dernierLieuVu || "",
        telephone: a.telephone || "",
        region: a.region?.id ? String(a.region.id) : "",
        ville: a.ville?.id ? String(a.ville.id) : "",
        description: a.description || "",
        circonstances: a.circonstances || "",
        tenueVestimentaire: a.tenueVestimentaire || "",
        signesParticuliers: a.signesParticuliers || "",
        taille: a.taille ? String(a.taille) : "",
        poids: a.poids ? String(a.poids) : "",
      });

      if (a.region?.id) {
        const villesRes = await api.get(`/api/regions/${a.region.id}/villes`);
        setVilles(villesRes.data.data || []);
      }
    } catch {
      setError("Erreur lors du chargement de l'avis.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (user && user.roles.includes("ROLE_COMMISSARIAT")) {
      fetchAvis();
    }
  }, [user, fetchAvis]);

  const fetchVilles = useCallback(async (regionId: string) => {
    if (!regionId) { setVilles([]); return; }
    try {
      const res = await api.get(`/api/regions/${regionId}/villes`);
      setVilles(res.data.data || []);
    } catch { setVilles([]); }
  }, []);

  const handleRegionChange = (regionId: string) => {
    if (form) setForm({ ...form, region: regionId, ville: "" });
    fetchVilles(regionId);
  };

  const canSubmit = () => {
    if (!form) return false;
    return form.nom && form.prenom && form.sexe && form.ageApprox && form.dateDisparition
      && form.dernierLieuVu && form.telephone && form.region && form.ville && form.description;
  };

  const handleSubmit = async () => {
    if (!form) return;
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const payload: Record<string, unknown> = {
        nom: form.nom,
        prenom: form.prenom,
        sexe: form.sexe,
        ageApprox: parseInt(form.ageApprox),
        dateDisparition: form.dateDisparition,
        dernierLieuVu: form.dernierLieuVu,
        telephone: form.telephone,
        region: parseInt(form.region),
        ville: parseInt(form.ville),
        description: form.description,
      };
      if (form.circonstances) payload.circonstances = form.circonstances;
      if (form.tenueVestimentaire) payload.tenueVestimentaire = form.tenueVestimentaire;
      if (form.signesParticuliers) payload.signesParticuliers = form.signesParticuliers;
      if (form.taille) payload.taille = parseFloat(form.taille);
      if (form.poids) payload.poids = parseFloat(form.poids);

      await api.put(`/api/commissariat/avis/${id}`, payload);
      setSuccess("Avis modifié avec succès !");
      setTimeout(() => router.push(`/commissariat/avis/${id}`), 1000);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      setError(apiErr.response?.data?.message || "Erreur lors de la modification.");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="max-w-[1600px] mx-auto px-6 py-8 space-y-6">
        <div className="h-8 bg-[#1f2937] rounded w-48 animate-pulse" />
        <div className="rounded-xl border border-[#1f2937]/50 bg-[#0e1420]/40 p-6 space-y-4 animate-pulse">
          <div className="h-4 bg-[#1f2937] rounded w-32" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(7)].map((_, j) => <div key={j} className="h-10 bg-[#1f2937] rounded" />)}
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="rounded-xl border border-[#1f2937]/50 bg-[#0e1420]/40 p-6 space-y-4 animate-pulse">
              <div className="h-4 bg-[#1f2937] rounded w-24" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(2)].map((_, j) => <div key={j} className="h-10 bg-[#1f2937] rounded" />)}
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-[#1f2937]/50 bg-[#0e1420]/40 p-6 space-y-4 animate-pulse">
          <div className="h-4 bg-[#1f2937] rounded w-24" />
          <div className="h-20 bg-[#1f2937] rounded" />
        </div>
      </div>
    );
  }
  if (!user || !user.roles.includes("ROLE_COMMISSARIAT") || !form) return null;

  const inputClass = "w-full h-10 text-sm rounded-lg border border-[#1f2937]/80 bg-[#0b0f17] text-white placeholder:text-gray-600 focus:outline-none focus:border-[#ef4444]/40 focus:ring-1 focus:ring-[#ef4444]/20 transition-all px-3";
  const textareaClass = "w-full rounded-lg border border-[#1f2937]/80 bg-[#0b0f17] text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#ef4444]/40 focus:ring-1 focus:ring-[#ef4444]/20 transition-all px-3 py-2.5 resize-none";
  const selectClass = "w-full h-10 text-sm rounded-lg border border-[#1f2937]/80 bg-[#0b0f17] text-white appearance-none focus:outline-none focus:border-[#ef4444]/40 focus:ring-1 focus:ring-[#ef4444]/20 transition-all px-3 pr-9 cursor-pointer";

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center gap-3 animate-fade-in">
        <Link href={`/commissariat/avis/${id}`} className="w-8 h-8 rounded-lg border border-[#1f2937]/80 bg-[#0e1420]/60 flex items-center justify-center hover:border-[#ef4444]/30 hover:bg-[#ef4444]/5 transition-all">
          <ChevronLeft className="h-4 w-4 text-gray-400" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Modifier l&apos;avis</h1>
          <p className="text-sm text-gray-500">Modifiez les informations de la personne recherchée</p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm animate-fade-in">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-start gap-2.5 bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-xl text-sm animate-fade-in">
          <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="rounded-xl border border-[#1f2937]/80 bg-[#0e1420]/60 backdrop-blur-sm p-6 animate-fade-in">
        <h2 className="text-sm font-bold text-white tracking-tight mb-5 flex items-center gap-2">
          <User className="h-4 w-4 text-[#ef4444]" />
          Informations personnelles
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Nom *</label>
            <input className={inputClass} value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Prénom *</label>
            <input className={inputClass} value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Sexe *</label>
            <div className="relative">
              <select className={selectClass} value={form.sexe} onChange={(e) => setForm({ ...form, sexe: e.target.value })}>
                <option value="" className="bg-[#0e1420] text-white">Sélectionner...</option>
                <option value="HOMME" className="bg-[#0e1420] text-white">Homme</option>
                <option value="FEMME" className="bg-[#0e1420] text-white">Femme</option>
              </select>
              <ChevronLeft className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none rotate-90" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Âge approximatif *</label>
            <input className={inputClass} type="number" value={form.ageApprox} onChange={(e) => setForm({ ...form, ageApprox: e.target.value })} />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Date de disparition *</label>
            <input className={inputClass} type="datetime-local" value={form.dateDisparition} onChange={(e) => setForm({ ...form, dateDisparition: e.target.value })} />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Dernier lieu vu *</label>
            <input className={inputClass} value={form.dernierLieuVu} onChange={(e) => setForm({ ...form, dernierLieuVu: e.target.value })} />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Téléphone *</label>
            <input className={inputClass} value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-[#1f2937]/80 bg-[#0e1420]/60 backdrop-blur-sm p-6 animate-fade-in" style={{ animationDelay: "80ms", animationFillMode: "both" }}>
          <h2 className="text-sm font-bold text-white tracking-tight mb-5 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-[#ef4444]" />
            Localisation
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Région *</label>
              <div className="relative">
                <select className={selectClass} value={form.region} onChange={(e) => handleRegionChange(e.target.value)}>
                  <option value="" className="bg-[#0e1420] text-white">Sélectionner une région...</option>
                  {regions.map((r) => (
                    <option key={r.id} value={r.id} className="bg-[#0e1420] text-white">{r.nom}</option>
                  ))}
                </select>
                <ChevronLeft className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none rotate-90" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Ville *</label>
              <div className="relative">
                <select className={selectClass} value={form.ville} onChange={(e) => setForm({ ...form, ville: e.target.value })}>
                  <option value="" className="bg-[#0e1420] text-white">Sélectionner une ville...</option>
                  {villes.map((v) => (
                    <option key={v.id} value={v.id} className="bg-[#0e1420] text-white">{v.nom}</option>
                  ))}
                </select>
                <ChevronLeft className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none rotate-90" />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#1f2937]/80 bg-[#0e1420]/60 backdrop-blur-sm p-6 animate-fade-in" style={{ animationDelay: "100ms", animationFillMode: "both" }}>
          <h2 className="text-sm font-bold text-white tracking-tight mb-5 flex items-center gap-2">
            <Ruler className="h-4 w-4 text-[#ef4444]" />
            Taille & Poids
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Taille (m)</label>
              <input className={inputClass} type="number" step="0.01" value={form.taille} onChange={(e) => setForm({ ...form, taille: e.target.value })} />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Poids (kg)</label>
              <input className={inputClass} type="number" step="0.1" value={form.poids} onChange={(e) => setForm({ ...form, poids: e.target.value })} />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[#1f2937]/80 bg-[#0e1420]/60 backdrop-blur-sm p-6 animate-fade-in" style={{ animationDelay: "120ms", animationFillMode: "both" }}>
        <h2 className="text-sm font-bold text-white tracking-tight mb-5 flex items-center gap-2">
          <FileText className="h-4 w-4 text-[#ef4444]" />
          Description
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Description physique *</label>
            <textarea className={textareaClass} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Circonstances</label>
            <textarea className={textareaClass} value={form.circonstances} onChange={(e) => setForm({ ...form, circonstances: e.target.value })} rows={3} />
          </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Tenue vestimentaire</label>
                <textarea className={textareaClass} value={form.tenueVestimentaire} onChange={(e) => setForm({ ...form, tenueVestimentaire: e.target.value })} rows={2} />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Signes particuliers</label>
                <textarea className={textareaClass} value={form.signesParticuliers} onChange={(e) => setForm({ ...form, signesParticuliers: e.target.value })} rows={2} />
              </div>
            </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 animate-fade-in" style={{ animationDelay: "180ms", animationFillMode: "both" }}>
        <Link href={`/commissariat/avis/${id}`} className="inline-flex items-center gap-1.5 text-xs font-medium h-9 px-4 rounded-lg border border-[#1f2937]/80 bg-[#0e1420]/60 text-gray-300 hover:text-white hover:border-[#1f2937] transition-all">
          Annuler
        </Link>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit() || submitting}
          className="inline-flex items-center gap-1.5 text-xs font-semibold h-9 px-5 rounded-lg bg-gradient-to-r from-[#ef4444] to-[#dc2626] text-white hover:from-[#dc2626] hover:to-[#b91c1c] transition-all duration-200 shadow-md shadow-[#ef4444]/10 disabled:opacity-50"
        >
          <Save className="h-3.5 w-3.5" />
          {submitting ? "Enregistrement..." : "Enregistrer les modifications"}
        </button>
      </div>
    </div>
  );
}