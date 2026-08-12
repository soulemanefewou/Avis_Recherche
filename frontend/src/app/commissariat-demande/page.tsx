"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import api from "@/lib/api";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import { User } from "lucide-react";
import { UploadCloud, CheckCircle2, AlertTriangle, ArrowLeft, Building2 } from "lucide-react";

interface Region { id: number; nom: string }
interface Ville { id: number; nom: string }

interface DemandeForm {
  nom: string;
  adresse: string;
  telephone: string;
  email: string;
  responsable: string;
  prenom: string;
  motDePasse: string;
  confirmPassword: string;
  region: string;
  ville: string;
}

const emptyForm: DemandeForm = {
  nom: "", adresse: "", telephone: "", email: "", responsable: "",
  prenom: "", motDePasse: "", confirmPassword: "", region: "", ville: "",
};

export default function DemandeCommissariatPage() {
  const [form, setForm] = useState<DemandeForm>(emptyForm);
  const [regions, setRegions] = useState<Region[]>([]);
  const [villes, setVilles] = useState<Ville[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    api.get("/api/regions")
      .then((res) => setRegions(res.data.data || []))
      .catch(() => setError("Erreur lors du chargement des régions."));
  }, []);

  const fetchVilles = useCallback(async (regionId: string) => {
    if (!regionId) { setVilles([]); return; }
    try {
      const res = await api.get(`/api/regions/${regionId}/villes`);
      setVilles(res.data.data || []);
    } catch { setVilles([]); }
  }, []);

  const handleRegionChange = (regionId: string) => {
    setForm((prev) => ({ ...prev, region: regionId, ville: "" }));
    fetchVilles(regionId);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors((prev) => { const next = { ...prev }; delete next[e.target.name]; return next; });
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.nom.trim()) errs.nom = "Le nom du commissariat est requis.";
    if (!form.adresse.trim()) errs.adresse = "L'adresse est requise.";
    if (!form.telephone.trim()) errs.telephone = "Le téléphone est requis.";
    if (!form.email.trim()) errs.email = "L'email est requis.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Email invalide.";
    if (!form.responsable.trim()) errs.responsable = "Le nom du responsable est requis.";
    if (!form.prenom.trim()) errs.prenom = "Le prénom du responsable est requis.";
    if (!form.region) errs.region = "La région est requise.";
    if (!form.ville) errs.ville = "La ville est requise.";
    if (!form.motDePasse) errs.motDePasse = "Le mot de passe est requis.";
    else if (form.motDePasse.length < 8) errs.motDePasse = "8 caractères minimum.";
    if (form.motDePasse !== form.confirmPassword) errs.confirmPassword = "Les mots de passe ne correspondent pas.";
    if (!file) errs.justificatif = "Le justificatif est obligatoire.";
    else {
      const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
      if (!allowed.includes(file.type)) errs.justificatif = "Format non autorisé (JPEG, PNG, WEBP, PDF).";
      if (file.size > 10 * 1024 * 1024) errs.justificatif = "Fichier trop volumineux (max 10 Mo).";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!validate()) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("nom", form.nom);
      formData.append("adresse", form.adresse);
      formData.append("telephone", form.telephone);
      formData.append("email", form.email);
      formData.append("responsable", form.responsable);
      formData.append("prenom", form.prenom);
      formData.append("motDePasse", form.motDePasse);
      formData.append("region", form.region);
      formData.append("ville", form.ville);
      formData.append("justificatif", file!);

      await api.post("/api/commissariat-demandes", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSuccess(true);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      setError(apiErr.response?.data?.message || "Erreur lors de la soumission de la demande.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Card padding="lg" className="text-center border-[#1f2937] bg-[#0e1420]/80 backdrop-blur-md">
          <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-400">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Demande d&apos;accréditation transmise</h2>
          <p className="text-sm text-gray-400 mb-6 leading-relaxed">
            Votre demande de compte commissariat a été soumise avec succès. Les services d&apos;administration valideront vos pièces justificatives sous 24h.
          </p>
          <div className="bg-slate-950/60 border border-[#1f2937] rounded-lg p-4 mb-6 text-left">
            <p className="text-xs text-gray-300 leading-relaxed">
              <strong>Note de connexion :</strong> Dès validation par le super administrateur, vous recevrez une confirmation et pourrez vous connecter avec votre adresse email.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link href="/" className="flex-1">
              <Button variant="primary" className="w-full font-bold">Retour à l&apos;accueil</Button>
            </Link>
            <Link href="/login" className="flex-1">
              <Button variant="outline" className="w-full border-[#1f2937] hover:bg-slate-950 text-gray-300">Se connecter</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 w-full">
      <div className="mb-4">
        <Link href="/register" className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-white transition">
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour au choix d&apos;inscription
        </Link>
      </div>

      <PageHeader 
        title="Accréditation Commissariat" 
        description="Créez un compte officiel pour gérer et publier les avis officiels nationaux"
      />

      {error && (
        <div className="bg-[#ef4444]/15 border border-[#ef4444]/30 text-red-200 px-4 py-3 rounded-lg mb-6 text-sm flex items-center gap-2">
          <AlertTriangle className="h-4.5 w-4.5 text-[#ef4444] shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card 1: Institution Details */}
        <Card padding="lg" className="border-[#1f2937] bg-[#0e1420]/80 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-4 border-b border-[#1f2937] pb-3">
            <Building2 className="h-5 w-5 text-primary" />
            <h2 className="text-base font-bold text-white uppercase tracking-wider">Identité du Commissariat</h2>
          </div>

          <div className="space-y-4">
            <Input
              label="Nom officiel du commissariat *"
              name="nom"
              required
              value={form.nom}
              onChange={handleChange}
              error={errors.nom}
              placeholder="Ex: Direction de la Sécurité Publique / Commissariat Central"
            />
            <Input
              label="Adresse postale exacte *"
              name="adresse"
              required
              value={form.adresse}
              onChange={handleChange}
              error={errors.adresse}
              placeholder="Ex: Rue du 27 Août, Face Préfecture"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Ligne téléphonique administrative *"
                name="telephone"
                type="tel"
                required
                value={form.telephone}
                onChange={handleChange}
                error={errors.telephone}
                placeholder="Ex: +237 2XX XX XX XX"
              />
              <Input
                label="Adresse Email de service *"
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                error={errors.email}
                placeholder="Ex: central.ville@police.gov"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Région administrative *"
                value={form.region}
                onChange={(e) => handleRegionChange(e.target.value)}
                options={regions.map((r) => ({ value: r.id, label: r.nom }))}
                placeholder="Sélectionner la région"
                error={errors.region}
              />
              <Select
                label="Circonscription / Ville *"
                value={form.ville}
                onChange={(e) => setForm({ ...form, ville: e.target.value })}
                options={villes.map((v) => ({ value: v.id, label: v.nom }))}
                placeholder="Sélectionner la ville"
                disabled={!form.region}
                error={errors.ville}
              />
            </div>
          </div>
        </Card>

        {/* Card 2: Responsable Details */}
        <Card padding="lg" className="border-[#1f2937] bg-[#0e1420]/80 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-4 border-b border-[#1f2937] pb-3">
            <User className="h-5 w-5 text-primary" />
            <h2 className="text-base font-bold text-white uppercase tracking-wider">Officier responsable du compte</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nom de famille *"
              name="responsable"
              required
              value={form.responsable}
              onChange={handleChange}
              error={errors.responsable}
              placeholder="Ex: Meka"
            />
            <Input
              label="Prénom(s) *"
              name="prenom"
              required
              value={form.prenom}
              onChange={handleChange}
              error={errors.prenom}
              placeholder="Ex: Jean-Paul"
            />
          </div>
        </Card>

        {/* Card 3: Credentials */}
        <Card padding="lg" className="border-[#1f2937] bg-[#0e1420]/80 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-4 border-b border-[#1f2937] pb-3">
            <h2 className="text-base font-bold text-white uppercase tracking-wider">Identifiants de Connexion</h2>
          </div>

          <div className="space-y-4">
            <Input
              label="Mot de passe *"
              name="motDePasse"
              type="password"
              required
              value={form.motDePasse}
              onChange={handleChange}
              error={errors.motDePasse}
              placeholder="8 caractères minimum"
            />
            <Input
              label="Confirmer le mot de passe *"
              name="confirmPassword"
              type="password"
              required
              value={form.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              placeholder="Retapez le mot de passe identique"
            />
          </div>
        </Card>

        {/* Card 4: Verification doc */}
        <Card padding="lg" className="border-[#1f2937] bg-[#0e1420]/80 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-4 border-b border-[#1f2937] pb-3">
            <UploadCloud className="h-5 w-5 text-primary" />
            <h2 className="text-base font-bold text-white uppercase tracking-wider">Pièce Justificative Administrative</h2>
          </div>

          <div className="space-y-4">
            <p className="text-xs text-gray-400 leading-relaxed">
              Veuillez fournir un document officiel attestant de votre affectation ou de l&apos;autorisation d&apos;ouverture de compte par votre hiérarchie (JPEG, PNG, WEBP ou PDF de moins de 10 Mo).
            </p>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-300">Document justificatif (.pdf, .jpg, .png) *</label>
              <div className="flex items-center gap-3">
                <label className="flex-1 flex flex-col items-center justify-center gap-2 px-4 py-6 border-2 border-dashed border-[#1f2937] bg-slate-950/40 rounded-xl hover:border-primary/50 cursor-pointer transition-colors group">
                  <UploadCloud className="h-8 w-8 text-gray-500 group-hover:text-primary transition-colors" />
                  <span className="text-sm font-semibold text-gray-300 group-hover:text-white transition-colors">
                    {file ? file.name : "Sélectionner le document justificatif..."}
                  </span>
                  <span className="text-xs text-gray-500">PDF, JPG, PNG jusqu&apos;à 10 Mo</span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".jpg,.jpeg,.png,.webp,.pdf"
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null;
                      setFile(f);
                      if (errors.justificatif) {
                        setErrors((prev) => { const next = { ...prev }; delete next.justificatif; return next; });
                      }
                    }}
                  />
                </label>
              </div>
              {errors.justificatif && <p className="text-xs text-red-400 font-bold">{errors.justificatif}</p>}
            </div>
          </div>
        </Card>

        {/* Submit Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <Link href="/register">
            <Button variant="outline" type="button" className="border-[#1f2937] text-gray-300 hover:bg-slate-950">
              Annuler
            </Button>
          </Link>
          <Button variant="primary" type="submit" loading={submitting} className="font-bold shadow-lg shadow-primary/20">
            Soumettre la demande officielle
          </Button>
        </div>
      </form>
    </div>
  );
}
