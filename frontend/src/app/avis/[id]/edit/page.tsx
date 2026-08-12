'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { Region, Ville, AvisRecherche } from '@/lib/types';
import Link from 'next/link';
import { ChevronLeft, AlertCircle, ImageIcon, User, MapPin, FileText, Ruler, Weight, Save, X } from 'lucide-react';

const inputClass = "w-full h-10 text-sm rounded-lg border border-[#1f2937]/80 bg-[#0b0f17] text-white placeholder:text-gray-600 focus:outline-none focus:border-[#ef4444]/40 focus:ring-1 focus:ring-[#ef4444]/20 transition-all px-3";
const textareaClass = "w-full rounded-lg border border-[#1f2937]/80 bg-[#0b0f17] text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#ef4444]/40 focus:ring-1 focus:ring-[#ef4444]/20 transition-all px-3 py-2.5 resize-none";
const selectClass = "w-full h-10 text-sm rounded-lg border border-[#1f2937]/80 bg-[#0b0f17] text-white appearance-none focus:outline-none focus:border-[#ef4444]/40 focus:ring-1 focus:ring-[#ef4444]/20 transition-all px-3 pr-9 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

function SectionTitle({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-[#ef4444]/10 border border-[#ef4444]/20 text-[#ef4444] shrink-0">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <h2 className="text-sm font-bold text-white tracking-tight">{title}</h2>
        <p className="text-xs text-gray-500">{subtitle}</p>
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
        {label} {required && <span className="text-[#ef4444]">*</span>}
      </label>
      {children}
    </div>
  );
}

export default function EditAvisPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading: authLoading } = useAuth();
  const [regions, setRegions] = useState<Region[]>([]);
  const [villes, setVilles] = useState<Ville[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [notOwner, setNotOwner] = useState(false);

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

  useEffect(() => {
    const fetchAvis = async () => {
      try {
        const res = await api.get(`/api/avis-recherches/${params.id}`);
        const avis: AvisRecherche = res.data.data || res.data;

        if (user && avis.auteur && user.id !== avis.auteur.id) {
          setNotOwner(true);
          setFetching(false);
          return;
        }

        setForm({
          nom: avis.nom,
          prenom: avis.prenom,
          sexe: avis.sexe,
          ageApprox: String(avis.ageApprox),
          description: avis.description,
          dernierLieuVu: avis.dernierLieuVu,
          dateDisparition: avis.dateDisparition?.replace(' ', 'T').slice(0, 16) || '',
          circonstances: avis.circonstances || '',
          telephone: avis.telephone,
          tenueVestimentaire: avis.tenueVestimentaire || '',
          signesParticuliers: avis.signesParticuliers || '',
          taille: avis.taille ? String(avis.taille) : '',
          poids: avis.poids ? String(avis.poids) : '',
          region: avis.region?.id ? String(avis.region.id) : '',
          ville: avis.ville?.id ? String(avis.ville.id) : '',
        });

        if (avis.region?.id) {
          api.get(`/api/regions/${avis.region.id}/villes`).then((r) => setVilles(r.data.data || []));
        }
      } catch {
        setError('Avis non trouvé.');
      } finally {
        setFetching(false);
      }
    };

    if (user) fetchAvis();
  }, [params.id, user]);

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
      await api.put(`/api/avis-recherches/${params.id}`, {
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
      router.push(`/avis/${params.id}`);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string; errors?: string[] } } };
      setError(
        apiErr.response?.data?.errors?.join(', ') ||
          apiErr.response?.data?.message ||
          'Erreur lors de la modification.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || fetching) {
    return (
      <div className="max-w-[1400px] mx-auto px-6 py-8 space-y-6">
        <div className="h-8 bg-[#1f2937] rounded w-64 animate-pulse" />
        <div className="h-4 bg-[#1f2937] rounded w-96 animate-pulse" />
        <div className="rounded-xl border border-[#1f2937]/50 bg-[#0e1420]/40 p-6 space-y-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-[#1f2937]" />
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-[#1f2937] rounded w-40" />
              <div className="h-3 bg-[#1f2937] rounded w-56" />
            </div>
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-[#1f2937] rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (notOwner) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-red-500/10 border border-red-500/20 mx-auto mb-4">
          <X className="h-6 w-6 text-red-400" />
        </div>
        <p className="text-gray-300 text-lg">Vous n&apos;êtes pas autorisé à modifier cet avis.</p>
        <button
          onClick={() => router.push(`/avis/${params.id}`)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold h-9 px-4 rounded-lg bg-gradient-to-r from-[#ef4444] to-[#dc2626] text-white hover:from-[#dc2626] hover:to-[#b91c1c] transition-all shadow-md shadow-[#ef4444]/10 mt-5"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Retour à l&apos;avis
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-8">
      <div className="flex items-center gap-3 mb-6 animate-fade-in">
        <Link href={`/avis/${params.id}`} className="w-8 h-8 rounded-lg border border-[#1f2937]/80 bg-[#0e1420]/60 flex items-center justify-center hover:border-[#ef4444]/30 hover:bg-[#ef4444]/5 transition-all">
          <ChevronLeft className="h-4 w-4 text-gray-400" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-white tracking-tight">Modifier l&apos;avis de recherche</h1>
          <p className="text-sm text-gray-500">Mettez à jour les informations de cet avis de recherche.</p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm mb-6 animate-fade-in">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          <section className="rounded-xl border border-[#1f2937]/80 bg-[#0e1420]/60 backdrop-blur-sm p-6 animate-fade-in" style={{ animationDelay: "60ms", animationFillMode: "both" }}>
            <SectionTitle icon={User} title="Identité de la personne" subtitle="Informations personnelles du disparu" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field label="Nom" required>
                <input name="nom" className={inputClass} required value={form.nom} onChange={handleChange} />
              </Field>
              <Field label="Prénom" required>
                <input name="prenom" className={inputClass} required value={form.prenom} onChange={handleChange} />
              </Field>
              <Field label="Sexe" required>
                <select name="sexe" className={selectClass} value={form.sexe} onChange={handleChange}>
                  <option value="HOMME" className="bg-[#0e1420] text-white">Homme</option>
                  <option value="FEMME" className="bg-[#0e1420] text-white">Femme</option>
                </select>
              </Field>
              <Field label="Âge approximatif" required>
                <input name="ageApprox" className={inputClass} type="number" min={0} required value={form.ageApprox} onChange={handleChange} />
              </Field>
              <Field label="Téléphone de contact" required>
                <input name="telephone" className={inputClass} type="tel" required value={form.telephone} onChange={handleChange} />
              </Field>
            </div>
          </section>

          <section className="rounded-xl border border-[#1f2937]/80 bg-[#0e1420]/60 backdrop-blur-sm p-6 animate-fade-in" style={{ animationDelay: "120ms", animationFillMode: "both" }}>
            <SectionTitle icon={MapPin} title="Localisation" subtitle="Lieu et date de la disparition" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Date de disparition" required>
                <input name="dateDisparition" className={`${inputClass} [color-scheme:dark]`} type="datetime-local" required value={form.dateDisparition} onChange={handleChange} />
              </Field>
              <Field label="Dernier lieu vu" required>
                <input name="dernierLieuVu" className={inputClass} required value={form.dernierLieuVu} onChange={handleChange} />
              </Field>
              <Field label="Région" required>
                <select name="region" className={selectClass} value={form.region} onChange={handleChange}>
                  <option value="" className="bg-[#0e1420] text-white">Sélectionner une région...</option>
                  {regions.map((r) => (
                    <option key={r.id} value={r.id} className="bg-[#0e1420] text-white">{r.nom}</option>
                  ))}
                </select>
              </Field>
              <Field label="Ville" required>
                <select name="ville" className={selectClass} value={form.ville} onChange={handleChange} disabled={!form.region}>
                  <option value="" className="bg-[#0e1420] text-white">Sélectionner une ville...</option>
                  {villes.map((v) => (
                    <option key={v.id} value={v.id} className="bg-[#0e1420] text-white">{v.nom}</option>
                  ))}
                </select>
              </Field>
            </div>
          </section>

          <section className="rounded-xl border border-[#1f2937]/80 bg-[#0e1420]/60 backdrop-blur-sm p-6 animate-fade-in" style={{ animationDelay: "180ms", animationFillMode: "both" }}>
            <SectionTitle icon={FileText} title="Description" subtitle="Détails de la disparition et de la personne" />
            <div className="space-y-4">
              <Field label="Description" required>
                <textarea name="description" className={textareaClass} rows={4} required value={form.description} onChange={handleChange} />
              </Field>
              <Field label="Circonstances (optionnel)">
                <textarea name="circonstances" className={textareaClass} rows={3} value={form.circonstances} onChange={handleChange} />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Tenue vestimentaire (optionnel)">
                  <input name="tenueVestimentaire" className={inputClass} value={form.tenueVestimentaire} onChange={handleChange} />
                </Field>
                <Field label="Signes particuliers (optionnel)">
                  <input name="signesParticuliers" className={inputClass} value={form.signesParticuliers} onChange={handleChange} />
                </Field>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-[#1f2937]/80 bg-[#0e1420]/60 backdrop-blur-sm p-6 animate-fade-in" style={{ animationDelay: "240ms", animationFillMode: "both" }}>
            <SectionTitle icon={Ruler} title="Détails physiques" subtitle="Informations corporelles (optionnel)" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Taille en mètres">
                <div className="relative">
                  <input name="taille" className={`${inputClass} pr-9`} type="number" step="0.01" min={0} value={form.taille} onChange={handleChange} />
                  <Ruler className="h-3.5 w-3.5 text-gray-600 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </Field>
              <Field label="Poids en kg">
                <div className="relative">
                  <input name="poids" className={`${inputClass} pr-9`} type="number" step="0.1" min={0} value={form.poids} onChange={handleChange} />
                  <Weight className="h-3.5 w-3.5 text-gray-600 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </Field>
            </div>
          </section>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24">
          <div className="rounded-xl border border-[#1f2937]/80 bg-[#0e1420]/60 backdrop-blur-sm p-5 animate-fade-in" style={{ animationDelay: "120ms", animationFillMode: "both" }}>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-[#ef4444]/10 text-[#ef4444] shrink-0">
                <ImageIcon className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Photos</h3>
                <p className="text-xs text-gray-500">5 max, 5 Mo par photo</p>
              </div>
            </div>
            <Link
              href={`/avis/${params.id}/photos`}
              className="mt-4 flex items-center justify-center gap-1.5 text-xs font-medium h-9 rounded-lg border border-[#1f2937]/80 text-gray-300 hover:text-white hover:bg-white/5 hover:border-[#1f2937] transition-all duration-200"
            >
              <ImageIcon className="h-3.5 w-3.5" />
              Gérer les photos
            </Link>
          </div>

          <div className="rounded-xl border border-[#ef4444]/30 bg-[#ef4444]/5 p-5 animate-fade-in" style={{ animationDelay: "180ms", animationFillMode: "both" }}>
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-1.5 text-sm font-semibold h-11 rounded-lg bg-gradient-to-r from-[#ef4444] to-[#dc2626] text-white hover:from-[#dc2626] hover:to-[#b91c1c] transition-all shadow-md shadow-[#ef4444]/10 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {loading ? "Enregistrement..." : "Enregistrer les modifications"}
            </button>
          </div>
        </aside>
      </form>
    </div>
  );
}
