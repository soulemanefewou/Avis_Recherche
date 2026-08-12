"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { ChevronLeft, ChevronDown, AlertCircle, User, MapPin, FileText, Ruler, Weight, Phone, Calendar, ArrowRight } from "lucide-react";

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

const emptyForm: AvisForm = {
  nom: "", prenom: "", sexe: "", ageApprox: "", dateDisparition: "",
  dernierLieuVu: "", telephone: "", region: "", ville: "",
  description: "", circonstances: "", tenueVestimentaire: "",
  signesParticuliers: "", taille: "", poids: "",
};

const SEXE_OPTIONS = [
  { value: "", label: "Sélectionner...", disabled: true },
  { value: "HOMME", label: "Homme" },
  { value: "FEMME", label: "Femme" },
];

export default function CreateAvisPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [form, setForm] = useState<AvisForm>(emptyForm);
  const [regions, setRegions] = useState<Region[]>([]);
  const [villes, setVilles] = useState<Ville[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [loadingRegions, setLoadingRegions] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || !user.roles.includes("ROLE_COMMISSARIAT"))) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    api.get("/api/regions")
      .then((res) => setRegions(res.data.data || []))
      .catch(() => setError("Erreur lors du chargement des régions."))
      .finally(() => setLoadingRegions(false));
  }, []);

  const fetchVilles = useCallback(async (regionId: string) => {
    if (!regionId) { setVilles([]); return; }
    try {
      const res = await api.get(`/api/regions/${regionId}/villes`);
      setVilles(res.data.data || []);
    } catch { setVilles([]); }
  }, []);

  const handleRegionChange = (regionId: string) => {
    setForm({ ...form, region: regionId, ville: "" });
    fetchVilles(regionId);
  };

  const canSubmit = () => {
    return form.nom && form.prenom && form.sexe && form.ageApprox && form.dateDisparition
      && form.dernierLieuVu && form.telephone && form.region && form.ville && form.description;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
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

      const res = await api.post("/api/commissariat/avis", payload);
      const avisId = res.data.data?.id || res.data.id;
      router.push(avisId ? `/commissariat/avis/${avisId}` : "/commissariat/avis");
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      setError(apiErr.response?.data?.message || "Erreur lors de la création.");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loadingRegions) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="h-8 bg-[#1f2937] rounded w-56 animate-pulse" />
        <div className="h-4 bg-[#1f2937] rounded w-72 animate-pulse" />
        <div className="rounded-xl border border-[#1f2937]/50 bg-[#0e1420]/40 p-6 space-y-4 animate-pulse">
          <div className="h-5 bg-[#1f2937] rounded w-40" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(7)].map((_, i) => <div key={i} className="h-10 bg-[#1f2937] rounded" />)}
          </div>
        </div>
      </div>
    );
  }
  if (!user || !user.roles.includes("ROLE_COMMISSARIAT")) return null;

  const sections = [
    {
      title: "Informations personnelles",
      icon: User,
      fields: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Nom *" value={form.nom} onChange={(v) => setForm({ ...form, nom: v })} placeholder="Nom de famille" />
          <Field label="Prénom *" value={form.prenom} onChange={(v) => setForm({ ...form, prenom: v })} placeholder="Prénom" />
          <SelectField label="Sexe *" value={form.sexe} onChange={(v) => setForm({ ...form, sexe: v })} options={SEXE_OPTIONS} />
          <Field label="Âge approximatif *" type="number" value={form.ageApprox} onChange={(v) => setForm({ ...form, ageApprox: v })} placeholder="Âge" min={0} />
          <Field label="Date de disparition *" type="datetime-local" value={form.dateDisparition} onChange={(v) => setForm({ ...form, dateDisparition: v })} />
          <Field label="Dernier lieu vu *" value={form.dernierLieuVu} onChange={(v) => setForm({ ...form, dernierLieuVu: v })} placeholder="Quartier, rue, ville..." />
          <Field label="Téléphone *" type="tel" value={form.telephone} onChange={(v) => setForm({ ...form, telephone: v })} placeholder="+237 6XX XXX XXX" />
        </div>
      ),
    },
    {
      title: "Localisation",
      icon: MapPin,
      fields: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SelectField label="Région *" value={form.region} onChange={(v) => handleRegionChange(v)} options={[{ value: "", label: "Sélectionner une région...", disabled: true }, ...regions.map((r) => ({ value: String(r.id), label: r.nom }))]} />
          <SelectField label="Ville *" value={form.ville} onChange={(v) => setForm({ ...form, ville: v })} options={[{ value: "", label: "Sélectionner une ville...", disabled: true }, ...villes.map((v) => ({ value: String(v.id), label: v.nom }))]} disabled={!form.region} />
        </div>
      ),
    },
    {
      title: "Description",
      icon: FileText,
      fields: (
        <div className="space-y-4">
          <Textarea label="Description physique *" value={form.description} onChange={(v) => setForm({ ...form, description: v })} placeholder="Décrivez la personne disparue..." rows={4} />
          <Textarea label="Circonstances" value={form.circonstances} onChange={(v) => setForm({ ...form, circonstances: v })} placeholder="Circonstances de la disparition..." rows={3} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Textarea label="Tenue vestimentaire" value={form.tenueVestimentaire} onChange={(v) => setForm({ ...form, tenueVestimentaire: v })} placeholder="Dernière tenue connue..." rows={2} />
            <Textarea label="Signes particuliers" value={form.signesParticuliers} onChange={(v) => setForm({ ...form, signesParticuliers: v })} placeholder="Cicatrices, tatouages, etc." rows={2} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Taille (cm)" type="number" value={form.taille} onChange={(v) => setForm({ ...form, taille: v })} placeholder="Ex: 175" min={0} icon={Ruler} />
            <Field label="Poids (kg)" type="number" value={form.poids} onChange={(v) => setForm({ ...form, poids: v })} placeholder="Ex: 70" min={0} icon={Weight} />
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8 animate-fade-in">
        <Link
          href="/commissariat/avis"
          className="w-8 h-8 rounded-lg border border-[#1f2937]/80 bg-[#0e1420]/60 flex items-center justify-center hover:border-[#ef4444]/30 hover:bg-[#ef4444]/5 transition-all duration-200"
        >
          <ChevronLeft className="h-4 w-4 text-gray-400" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Créer un avis officiel</h1>
          <p className="text-sm text-gray-500">Saisissez les informations de la personne recherchée</p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm animate-fade-in">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-5">
        {sections.map((section, i) => {
          const Icon = section.icon;
          return (
            <div
              key={section.title}
              className="rounded-xl border border-[#1f2937]/80 bg-[#0e1420]/60 backdrop-blur-sm p-6 animate-fade-in"
              style={{ animationDelay: `${i * 100}ms`, animationFillMode: "both" }}
            >
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 rounded-lg bg-[#ef4444]/10 border border-[#ef4444]/20 flex items-center justify-center">
                  <Icon className="h-4 w-4 text-[#ef4444]" />
                </div>
                <h2 className="text-base font-bold text-white tracking-tight">{section.title}</h2>
              </div>
              {section.fields}
            </div>
          );
        })}

        <div className="flex items-center justify-between pt-2 animate-fade-in" style={{ animationDelay: "400ms", animationFillMode: "both" }}>
          <Link
            href="/commissariat/avis"
            className="text-xs font-medium h-10 px-4 rounded-lg border border-[#1f2937]/80 bg-[#0e1420]/60 text-gray-400 hover:text-white hover:border-[#1f2937] transition-all duration-200 inline-flex items-center"
          >
            Annuler
          </Link>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit() || submitting}
            className="flex items-center gap-1.5 text-xs font-semibold h-10 px-5 rounded-lg bg-gradient-to-r from-[#ef4444] to-[#dc2626] text-white hover:from-[#dc2626] hover:to-[#b91c1c] transition-all duration-200 shadow-md shadow-[#ef4444]/10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Publication en cours..." : "Publier l'avis"}
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="text-xs text-gray-500 text-right">
          L&apos;avis sera publié immédiatement et visible par tous. Vous pourrez ajouter des photos ensuite.
        </p>
      </div>
    </div>
  );
}

function Field({ label, type = "text", value, onChange, placeholder, min, icon: Icon }: {
  label: string; type?: string; value: string; onChange: (v: string) => void; placeholder?: string; min?: number; icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1.5">{label}</label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          min={min}
          className={`w-full h-10 text-sm rounded-lg border border-[#1f2937]/80 bg-[#0b0f17] text-white placeholder-gray-600 focus:outline-none focus:border-[#ef4444]/40 focus:ring-1 focus:ring-[#ef4444]/20 transition-all duration-200 ${Icon ? "pl-9 pr-3" : "px-3"}`}
        />
      </div>
    </div>
  );
}

function SelectField({ label, value, onChange, options, disabled }: {
  label: string; value: string; onChange: (v: string) => void; options: { value: string | number; label: string; disabled?: boolean }[]; disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1.5">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-full h-10 text-sm rounded-lg border border-[#1f2937]/80 bg-[#0b0f17] text-white appearance-none focus:outline-none focus:border-[#ef4444]/40 focus:ring-1 focus:ring-[#ef4444]/20 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed px-3 pr-9"
        >
          {options.map((opt) => (
            <option key={String(opt.value)} value={String(opt.value)} disabled={opt.disabled} className="bg-[#0e1420] text-white">
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
      </div>
    </div>
  );
}

function Textarea({ label, value, onChange, placeholder, rows }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1.5">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows ?? 3}
        className="w-full text-sm rounded-lg border border-[#1f2937]/80 bg-[#0b0f17] text-white placeholder-gray-600 focus:outline-none focus:border-[#ef4444]/40 focus:ring-1 focus:ring-[#ef4444]/20 transition-all duration-200 px-3 py-2.5 resize-y"
      />
    </div>
  );
}