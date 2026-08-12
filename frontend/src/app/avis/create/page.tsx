'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { Region, Ville } from '@/lib/types';
import { ChevronLeft, User, MapPin, FileText, Ruler, Weight, Phone, AlertCircle, Send, Calendar } from 'lucide-react';

export default function CreateAvisPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [regions, setRegions] = useState<Region[]>([]);
  const [villes, setVilles] = useState<Ville[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    sexe: 'HOMME',
    ageApprox: '',
    dateDisparition: '',
    dernierLieuVu: '',
    description: '',
    circonstances: '',
    telephone: '',
    tenueVestimentaire: '',
    signesParticuliers: '',
    taille: '',
    poids: '',
    region: '',
    ville: '',
  });

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    api.get('/api/regions').then((res) => setRegions(res.data.data || []));
  }, []);

  useEffect(() => {
    if (form.region) {
      api.get(`/api/regions/${form.region}/villes`).then((res) => {
        setVilles(res.data.data || []);
        setForm((prev) => ({ ...prev, ville: '' }));
      });
    } else {
      setVilles([]);
    }
  }, [form.region]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/api/avis-recherches', {
        nom: form.nom,
        prenom: form.prenom,
        sexe: form.sexe,
        ageApprox: parseInt(form.ageApprox),
        dateDisparition: form.dateDisparition,
        dernierLieuVu: form.dernierLieuVu,
        description: form.description,
        circonstances: form.circonstances || undefined,
        telephone: form.telephone,
        tenueVestimentaire: form.tenueVestimentaire || undefined,
        signesParticuliers: form.signesParticuliers || undefined,
        taille: form.taille ? parseFloat(form.taille) : undefined,
        poids: form.poids ? parseFloat(form.poids) : undefined,
        region: parseInt(form.region),
        ville: parseInt(form.ville),
      });

      const avisId = res.data.data?.id || res.data.id;
      router.push(avisId ? `/avis/${avisId}/photos` : '/');
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string; errors?: string[] } } };
      setError(
        apiErr.response?.data?.errors?.join(', ') ||
          apiErr.response?.data?.message ||
          'Erreur lors de la création.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="max-w-[1600px] mx-auto px-6 py-8 space-y-6">
        <div className="h-8 bg-[#1f2937] rounded w-56 animate-pulse" />
        <div className="rounded-xl border border-[#1f2937]/50 bg-[#0e1420]/40 p-6 space-y-4 animate-pulse">
          <div className="h-4 bg-[#1f2937] rounded w-32" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-[#1f2937] rounded" />)}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(2)].map((_, i) => <div key={i} className="h-10 bg-[#1f2937] rounded" />)}
          </div>
          <div className="h-24 bg-[#1f2937] rounded" />
        </div>
        <div className="rounded-xl border border-[#1f2937]/50 bg-[#0e1420]/40 p-6 space-y-4 animate-pulse">
          <div className="h-4 bg-[#1f2937] rounded w-24" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(2)].map((_, i) => <div key={i} className="h-10 bg-[#1f2937] rounded" />)}
          </div>
        </div>
      </div>
    );
  }

  const inputClass = "w-full h-10 text-sm rounded-lg border border-[#1f2937]/80 bg-[#0b0f17] text-white placeholder:text-gray-600 focus:outline-none focus:border-[#ef4444]/40 focus:ring-1 focus:ring-[#ef4444]/20 transition-all px-3";
  const textareaClass = "w-full rounded-lg border border-[#1f2937]/80 bg-[#0b0f17] text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#ef4444]/40 focus:ring-1 focus:ring-[#ef4444]/20 transition-all px-3 py-2.5 resize-none";
  const selectClass = "w-full h-10 text-sm rounded-lg border border-[#1f2937]/80 bg-[#0b0f17] text-white appearance-none focus:outline-none focus:border-[#ef4444]/40 focus:ring-1 focus:ring-[#ef4444]/20 transition-all px-3 pr-9 cursor-pointer";

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center gap-3 animate-fade-in">
        <Link href="/" className="w-8 h-8 rounded-lg border border-[#1f2937]/80 bg-[#0e1420]/60 flex items-center justify-center hover:border-[#ef4444]/30 hover:bg-[#ef4444]/5 transition-all">
          <ChevronLeft className="h-4 w-4 text-gray-400" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Signaler une personne disparue</h1>
          <p className="text-sm text-gray-500">Remplissez le formulaire pour publier un avis de recherche</p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm animate-fade-in">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border border-[#1f2937]/80 bg-[#0e1420]/60 backdrop-blur-sm p-6 animate-fade-in">
          <h2 className="text-sm font-bold text-white tracking-tight mb-5 flex items-center gap-2">
            <User className="h-4 w-4 text-[#ef4444]" />
            Identité
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Nom *</label>
              <input className={inputClass} name="nom" required value={form.nom} onChange={handleChange} placeholder="Nom de famille" />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Prénom *</label>
              <input className={inputClass} name="prenom" required value={form.prenom} onChange={handleChange} placeholder="Prénom" />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Sexe *</label>
              <div className="relative">
                <select className={selectClass} name="sexe" value={form.sexe} onChange={handleChange}>
                  <option value="HOMME" className="bg-[#0e1420] text-white">Homme</option>
                  <option value="FEMME" className="bg-[#0e1420] text-white">Femme</option>
                </select>
                <ChevronLeft className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none rotate-90" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Âge approximatif *</label>
              <input className={inputClass} name="ageApprox" type="number" min={0} required value={form.ageApprox} onChange={handleChange} placeholder="Ex: 25" />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Date de disparition *</label>
              <input className={inputClass} name="dateDisparition" type="datetime-local" required value={form.dateDisparition} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Dernier lieu vu *</label>
              <input className={inputClass} name="dernierLieuVu" required value={form.dernierLieuVu} onChange={handleChange} placeholder="Quartier, rue, ville..." />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Téléphone de contact *</label>
              <input className={inputClass} name="telephone" type="tel" required value={form.telephone} onChange={handleChange} placeholder="+237 6XX XXX XXX" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#1f2937]/80 bg-[#0e1420]/60 backdrop-blur-sm p-6 animate-fade-in" style={{ animationDelay: "80ms", animationFillMode: "both" }}>
          <h2 className="text-sm font-bold text-white tracking-tight mb-5 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-[#ef4444]" />
            Localisation
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Région *</label>
              <div className="relative">
                <select className={selectClass} name="region" value={form.region} onChange={handleChange} required>
                  <option value="" className="bg-[#0e1420] text-white">Sélectionner une région</option>
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
                <select className={selectClass} name="ville" value={form.ville} onChange={handleChange} disabled={!form.region} required>
                  <option value="" className="bg-[#0e1420] text-white">Sélectionner une ville</option>
                  {villes.map((v) => (
                    <option key={v.id} value={v.id} className="bg-[#0e1420] text-white">{v.nom}</option>
                  ))}
                </select>
                <ChevronLeft className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none rotate-90" />
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
              <textarea className={textareaClass} name="description" required rows={4} value={form.description} onChange={handleChange} placeholder="Décrivez la personne disparue..." />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Circonstances (optionnel)</label>
              <textarea className={textareaClass} name="circonstances" rows={3} value={form.circonstances} onChange={handleChange} placeholder="Circonstances de la disparition..." />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl border border-[#1f2937]/80 bg-[#0e1420]/60 backdrop-blur-sm p-6 animate-fade-in" style={{ animationDelay: "140ms", animationFillMode: "both" }}>
            <h2 className="text-sm font-bold text-white tracking-tight mb-5 flex items-center gap-2">
              <User className="h-4 w-4 text-[#ef4444]" />
              Détails physiques
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Tenue vestimentaire (optionnel)</label>
                <input className={inputClass} name="tenueVestimentaire" value={form.tenueVestimentaire} onChange={handleChange} placeholder="Ex: t-shirt bleu, jean noir..." />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Signes particuliers (optionnel)</label>
                <input className={inputClass} name="signesParticuliers" value={form.signesParticuliers} onChange={handleChange} placeholder="Ex: cicatrice au bras droit..." />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Taille (m)</label>
                  <input className={inputClass} name="taille" type="number" step="0.01" min={0} value={form.taille} onChange={handleChange} placeholder="Ex: 1.75" />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Poids (kg)</label>
                  <input className={inputClass} name="poids" type="number" step="0.1" min={0} value={form.poids} onChange={handleChange} placeholder="Ex: 70" />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#1f2937]/80 bg-[#0e1420]/60 backdrop-blur-sm p-6 animate-fade-in" style={{ animationDelay: "160ms", animationFillMode: "both" }}>
            <h2 className="text-sm font-bold text-white tracking-tight mb-5 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#ef4444]" />
              Récapitulatif
            </h2>
            <div className="space-y-3 text-sm text-gray-400">
              {form.nom || form.prenom ? (
                <p><span className="text-gray-500">Personne :</span>{' '}
                  <span className="text-gray-200">{form.prenom} {form.nom}</span>
                </p>
              ) : (
                <p className="text-gray-600">Personne : —</p>
              )}
              <p><span className="text-gray-500">Sexe :</span>{' '}
                <span className="text-gray-200">{form.sexe === "HOMME" ? "Homme" : "Femme"}</span>
              </p>
              <p><span className="text-gray-500">Âge :</span>{' '}
                <span className="text-gray-200">{form.ageApprox || "—"} ans</span>
              </p>
              <p><span className="text-gray-500">Disparu le :</span>{' '}
                <span className="text-gray-200">{form.dateDisparition ? new Date(form.dateDisparition).toLocaleDateString("fr-FR") : "—"}</span>
              </p>
              <p><span className="text-gray-500">Dernier lieu vu :</span>{' '}
                <span className="text-gray-200">{form.dernierLieuVu || "—"}</span>
              </p>
            </div>
            <div className="mt-5 pt-5 border-t border-[#1f2937]/50">
              <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold h-10 rounded-lg bg-gradient-to-r from-[#ef4444] to-[#dc2626] text-white hover:from-[#dc2626] hover:to-[#b91c1c] transition-all duration-200 shadow-md shadow-[#ef4444]/10 disabled:opacity-50">
                <Send className="h-3.5 w-3.5" />
                {loading ? "Publication..." : "Publier l'avis de recherche"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}