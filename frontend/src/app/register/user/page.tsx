"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import api from "@/lib/api";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import type { Region } from "@/lib/types";
import { User, CheckCircle2, AlertTriangle, ChevronDown } from "lucide-react";

export default function UserRegisterPage() {
  const { register } = useAuth();
  const [regions, setRegions] = useState<Region[]>([]);
  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    password: "",
    confirmPassword: "",
    lieuResidence: "",
    region: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    api.get("/api/regions").then((res) => setRegions(res.data.data || [])).catch(() => {});
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[e.target.name];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.nom.trim()) errs.nom = "Le nom est requis.";
    if (!form.prenom.trim()) errs.prenom = "Le prénom est requis.";
    if (!form.email.trim()) errs.email = "L'email est requis.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Email invalide.";
    if (!form.telephone.trim()) errs.telephone = "Le téléphone est requis.";
    if (!form.password) errs.password = "Le mot de passe est requis.";
    else if (form.password.length < 8) errs.password = "8 caractères minimum.";
    if (form.password !== form.confirmPassword) errs.confirmPassword = "Les mots de passe ne correspondent pas.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError("");
    if (!validate()) return;

    setLoading(true);
    try {
      await register({
        nom: form.nom.trim(),
        prenom: form.prenom.trim(),
        email: form.email.trim(),
        telephone: form.telephone.trim(),
        password: form.password,
        lieuResidence: form.lieuResidence.trim() || undefined,
        region: form.region ? Number(form.region) : undefined,
      });
      setSuccess(true);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { errors?: string[]; message?: string } } };
      const errs = apiErr.response?.data?.errors;
      setApiError(errs?.join(", ") || apiErr.response?.data?.message || "Erreur lors de l'inscription.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <Card padding="lg" className="text-center border-[#1f2937] bg-[#0e1420]/80 backdrop-blur-md">
            <div className="mx-auto h-14 w-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 text-emerald-400">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Inscription réussie !</h2>
            <p className="text-sm text-gray-400 mb-6 leading-relaxed">
              Votre compte citoyen a été créé avec succès. Vous pouvez maintenant vous connecter au portail.
            </p>
            <Link href="/login">
              <Button size="lg" className="w-full font-bold shadow-lg shadow-primary/20">
                Se connecter
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <Card padding="lg" className="border-[#1f2937] bg-[#0e1420]/80 backdrop-blur-md">
          <div className="text-center mb-8">
            <div className="mx-auto h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 text-primary">
              <User className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Inscription citoyenne</h1>
            <p className="text-sm text-gray-400 mt-1">Rejoignez le réseau national d&apos;utilité publique</p>
          </div>

          {apiError && (
            <div className="bg-[#ef4444]/15 border border-[#ef4444]/30 text-red-200 px-4 py-3 rounded-lg mb-6 text-sm flex items-start gap-2">
              <AlertTriangle className="h-4.5 w-4.5 text-[#ef4444] shrink-0 mt-0.5" />
              <span>{apiError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Nom *"
                name="nom"
                required
                value={form.nom}
                onChange={handleChange}
                error={errors.nom}
                placeholder="Ex: Dupont"
              />
              <Input
                label="Prénom *"
                name="prenom"
                required
                value={form.prenom}
                onChange={handleChange}
                error={errors.prenom}
                placeholder="Ex: Pierre"
              />
            </div>

            <Input
              label="Adresse Email *"
              name="email"
              type="email"
              required
              value={form.email}
              onChange={handleChange}
              error={errors.email}
              placeholder="Ex: nom@domaine.com"
            />

            <Input
              label="Numéro de Téléphone *"
              name="telephone"
              type="tel"
              required
              value={form.telephone}
              onChange={handleChange}
              error={errors.telephone}
              placeholder="Ex: +33 6 12 34 56 78"
            />

            <Input
              label="Mot de passe *"
              name="password"
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={handleChange}
              error={errors.password}
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
              placeholder="Retapez votre mot de passe"
            />

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Région de résidence (optionnel)</label>
              <div className="relative">
                <select
                  name="region"
                  value={form.region}
                  onChange={(e) => setForm({ ...form, region: e.target.value })}
                  className="w-full appearance-none rounded-lg border border-[#1f2937] bg-slate-950 px-3.5 py-2.5 pr-10 text-sm text-white transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="" className="bg-slate-950 text-gray-500">Sélectionner une région</option>
                  {regions.map((r) => (
                    <option key={r.id} value={r.id} className="bg-slate-950 text-white">{r.nom}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
              </div>
            </div>

            <Input
              label="Lieu de résidence (optionnel)"
              name="lieuResidence"
              value={form.lieuResidence}
              onChange={handleChange}
              placeholder="Ex: Paris, France"
            />

            <Button type="submit" size="lg" className="w-full mt-6 font-bold shadow-lg shadow-primary/20" loading={loading}>
              Créer mon compte citoyen
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-400">
            Déjà un compte ?{" "}
            <Link href="/login" className="text-primary hover:underline font-bold transition">
              Se connecter
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
